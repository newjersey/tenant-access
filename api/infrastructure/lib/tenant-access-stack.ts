import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

export class TenantAccessStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for scraped data
    const dataBucket = new s3.Bucket(this, "ScrapedDataBucket", {
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // VPC for RDS (using default VPC to save costs)
    const vpc = ec2.Vpc.fromLookup(this, "ExistingVPC", {
      vpcId: "vpc-0c73f9052afddcf4d",
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

    // Output bucket name
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
  }
}
