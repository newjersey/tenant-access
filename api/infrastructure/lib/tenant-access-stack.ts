import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as scheduler from "aws-cdk-lib/aws-scheduler";
import * as schedulerTargets from "aws-cdk-lib/aws-scheduler-targets";

export class TenantAccessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for scraped data
    const dataBucket = new s3.Bucket(this, "ScrapedDataBucket", {
      versioned: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        { id: "expire-raw-html", prefix: "raw/", expiration: cdk.Duration.days(7) },
        { id: "expire-parsed-json", prefix: "parsed/", expiration: cdk.Duration.days(90) },
        { id: "abort-incomplete-uploads", abortIncompleteMultipartUploadAfter: cdk.Duration.days(1) },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // VPC for RDS (using default VPC to save costs)
    const vpc = ec2.Vpc.fromLookup(this, "ExistingVPC", {
      vpcId: "vpc-0c73f9052afddcf4d",
    });

    vpc.addGatewayEndpoint("S3Endpoint", {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      privateDnsEnabled: true,
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, "DatabaseSecurityGroup", {
      vpc,
      description: "Security group for tenant access database",
      allowAllOutbound: true,
    });

    // Allow inbound from Lambda
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      "Allow PostgreSQL access from VPC",
    );

    // Database credentials (stored in Secrets Manager)
    const dbCredentials = new secretsmanager.Secret(this, "DBCredentials", {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: "tenantadmin" }),
        generateStringKey: "password",
        excludePunctuation: true,
        includeSpace: false,
      },
    });

    // RDS PostgreSQL instance
    const database = new rds.DatabaseInstance(this, "ListingsDatabase", {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Use existing private subnets
      },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(dbCredentials),
      databaseName: "tenantaccess",
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // Take snapshot when deleting
      publiclyAccessible: false,
    });

    // TODO: trigger this automatically, probably with Custom Resource
    // Migration Lambda (in VPC, bundles migrations/)
    const migrationLambda = new NodejsFunction(this, "MigrationFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: "src/lambda/migration-runner.ts",
      handler: "handler",
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        DB_HOST: database.instanceEndpoint.hostname,
        DB_SECRET_ARN: dbCredentials.secretArn,
      },
      bundling: {
        nodeModules: ["pg", "@aws-sdk/client-secrets-manager"],
        externalModules: ["aws-sdk", "pg-native"],
        commandHooks: {
          beforeBundling: () => [],
          afterBundling: (inputDir: string, outputDir: string) => [
            `cp -r ${inputDir}/api/migrations ${outputDir}/`,
          ],
          beforeInstall: () => [],
        },
      },
    });

    // Grant permissions
    database.connections.allowFrom(migrationLambda, ec2.Port.tcp(5432));
    dbCredentials.grantRead(migrationLambda);

    const scrapeLambda = new NodejsFunction(this, "ScrapeListingsFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: "src/lambda/scrape-listings.ts",
      handler: "handler",
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        RAW_PREFIX: "raw/",
      },
      bundling: {
        nodeModules: ["@aws-sdk/client-s3", "@aws-sdk/lib-storage"],
        externalModules: ["aws-sdk"],
      },
    });

    dataBucket.grantPut(scrapeLambda, "raw/*");

    const parseLambda = new NodejsFunction(this, "ParseListingsFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: "src/lambda/parse-listings.ts",
      handler: "handler",
      timeout: cdk.Duration.minutes(15),
      memorySize: 2048,
      environment: {
        BUCKET_NAME: dataBucket.bucketName,
        PARSED_PREFIX: "parsed/",
      },
      bundling: {
        nodeModules: ["cheerio", "@aws-sdk/client-s3", "@aws-sdk/lib-storage"],
        externalModules: ["aws-sdk"],
      },
    });

    dataBucket.grantRead(parseLambda, "raw/*");
    dataBucket.grantPut(parseLambda, "parsed/*");

    // Update Listings Lambda (in VPC)
    const updateLambda = new NodejsFunction(this, "UpdateListingsFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: "src/lambda/update-listings.ts",
      handler: "handler",
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        DB_HOST: database.instanceEndpoint.hostname,
        DB_SECRET_ARN: dbCredentials.secretArn,
      },
      bundling: {
        nodeModules: ["pg", "@aws-sdk/client-s3", "@aws-sdk/client-secrets-manager"],
        externalModules: ["aws-sdk", "pg-native"],
      },
    });

    dataBucket.grantRead(updateLambda, "parsed/*");
    updateLambda.addEnvironment("BUCKET_NAME", dataBucket.bucketName);
    database.connections.allowFrom(updateLambda, ec2.Port.tcp(5432));
    dbCredentials.grantRead(updateLambda);

    const queryLambda = new NodejsFunction(this, "QueryListingsFunction", {
      runtime: lambda.Runtime.NODEJS_24_X,
      entry: "src/lambda/query-listings.ts",
      handler: "handler",
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      timeout: cdk.Duration.minutes(1),
      memorySize: 256,
      environment: {
        DB_HOST: database.instanceEndpoint.hostname,
        DB_SECRET_ARN: dbCredentials.secretArn,
      },
      bundling: {
        nodeModules: ["pg", "@aws-sdk/client-secrets-manager"],
        externalModules: ["aws-sdk", "pg-native"],
      },
    });

    database.connections.allowFrom(queryLambda, ec2.Port.tcp(5432));
    dbCredentials.grantRead(queryLambda);

    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(parseLambda),
      { prefix: "raw/", suffix: ".html" },
    );

    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(updateLambda),
      { prefix: "parsed/", suffix: "listings.json" },
    );

    new scheduler.Schedule(this, "NightlyScrapeSchedule", {
      schedule: scheduler.ScheduleExpression.cron({
        minute: "0",
        hour: "0",
        day: "*",
        month: "*",
        timeZone: cdk.TimeZone.AMERICA_NEW_YORK,
      }),
      target: new schedulerTargets.LambdaInvoke(scrapeLambda),
      description: "Nightly myhousingsearch.com scrape at midnight Eastern",
    });

    new cdk.CfnOutput(this, "BucketName", {
      value: dataBucket.bucketName,
      description: "S3 bucket for scraped listings data",
    });

    new cdk.CfnOutput(this, "DatabaseEndpoint", {
      value: database.instanceEndpoint.hostname,
      description: "RDS PostgreSQL endpoint",
    });

    new cdk.CfnOutput(this, "DatabasePort", {
      value: database.instanceEndpoint.port.toString(),
      description: "RDS PostgreSQL port",
    });

    new cdk.CfnOutput(this, "DatabaseName", {
      value: "tenantaccess",
      description: "Database name",
    });

    new cdk.CfnOutput(this, "DatabaseSecretArn", {
      value: dbCredentials.secretArn,
      description: "ARN of secret containing database credentials",
    });

    new cdk.CfnOutput(this, "MigrationLambdaName", {
      value: migrationLambda.functionName,
      description: "Name of migration Lambda function",
    });

    new cdk.CfnOutput(this, "UpdateListingsLambdaName", {
      value: updateLambda.functionName,
      description: "Name of update-listings Lambda function",
    });

    new cdk.CfnOutput(this, "QueryListingsLambdaName", {
      value: queryLambda.functionName,
      description: "Name of query-listings Lambda function",
    });
  }
}
