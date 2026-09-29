import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { describe, it } from "vitest";
import { TenantAccessStack } from "./tenant-access-stack.js";

const ACCOUNT = "123456789012";
const REGION = "us-east-1";
const VPC_ID = "vpc-0123456789abcdef0";
const VPC_LOOKUP_KEY = `vpc-provider:account=${ACCOUNT}:filter.vpc-id=${VPC_ID}:region=${REGION}:returnAsymmetricSubnets=true`;

const VPC_LOOKUP_RESULT = {
  vpcId: VPC_ID,
  vpcCidrBlock: "10.0.0.0/16",
  availabilityZones: [],
  subnetGroups: [
    {
      name: "Private",
      type: "Private",
      subnets: [
        {
          subnetId: "subnet-0123456789abcdef0",
          availabilityZone: `${REGION}a`,
          routeTableId: "rtb-0123456789abcdef0",
          cidr: "10.0.1.0/24",
        },
        {
          subnetId: "subnet-0123456789abcdef1",
          availabilityZone: `${REGION}b`,
          routeTableId: "rtb-0123456789abcdef1",
          cidr: "10.0.2.0/24",
        },
      ],
    },
  ],
};

const synth = (
  apiDomain?: { name: string; certificateArn: string },
  alerts?: { amplifyAppId?: string; alertEmail?: string },
) =>
  Template.fromStack(
    new TenantAccessStack(
      new cdk.App({
        context: {
          "aws:cdk:bundling-stacks": [],
          [VPC_LOOKUP_KEY]: VPC_LOOKUP_RESULT,
        },
      }),
      "TestStack",
      {
        env: { account: ACCOUNT, region: REGION },
        vpcId: VPC_ID,
        inboundCidrs: ["10.0.0.0/16"],
        allowedOrigins: "https://example.com",
        apiDomain,
        ...alerts,
      },
    ),
  );

const CERT_ARN = `arn:aws:acm:${REGION}:${ACCOUNT}:certificate/abc`;
const ENDPOINT_REF = { Ref: Match.stringLikeRegexp("ExecuteApiEndpoint") };

describe("TenantAccessStack", () => {
  it("reaches the API only through the execute-api endpoint", () => {
    const template = synth();

    template.hasResourceProperties("AWS::ApiGateway::RestApi", {
      EndpointConfiguration: { Types: ["PRIVATE"], VpcEndpointIds: [ENDPOINT_REF] },
      // Everything not arriving via that endpoint is denied outright.
      Policy: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: "Deny",
            Action: "execute-api:Invoke",
            Condition: { StringNotEquals: { "aws:SourceVpce": [ENDPOINT_REF] } },
          }),
        ]),
      },
    });

    // the endpoint itself answers only OIT's subnets
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      GroupDescription: "execute-api endpoint: HTTPS from OIT load balancer subnets only",
      SecurityGroupIngress: [
        Match.objectLike({ CidrIp: "10.0.0.0/16", IpProtocol: "tcp", FromPort: 443, ToPort: 443 }),
      ],
    });

    template.resourceCountIs("AWS::ApiGateway::DomainNameV2", 0);

    // proves VPC_LOOKUP_KEY still matches
    template.hasResourceProperties("AWS::Lambda::Function", {
      VpcConfig: {
        SubnetIds: ["subnet-0123456789abcdef0", "subnet-0123456789abcdef1"],
      },
    });
  });

  it("routes the custom domain to the deployed stage via the endpoint", () => {
    const template = synth({ name: "api.example.com", certificateArn: CERT_ARN });

    template.hasResourceProperties("AWS::ApiGateway::DomainNameV2", {
      DomainName: "api.example.com",
      CertificateArn: CERT_ARN,
      EndpointConfiguration: { Types: ["PRIVATE"] },
    });

    // Without the association the private domain name does not resolve at all.
    template.hasResourceProperties("AWS::ApiGateway::DomainNameAccessAssociation", {
      AccessAssociationSourceType: "VPCE",
      AccessAssociationSource: ENDPOINT_REF,
    });

    template.hasResourceProperties("AWS::ApiGateway::BasePathMappingV2", {
      RestApiId: { Ref: Match.stringLikeRegexp("NJHRCApi") },
      Stage: { Ref: Match.stringLikeRegexp("NJHRCApiDeploymentStage") },
    });
  });

  it("leaves out the frontend alarm and the email subscription when unconfigured", () => {
    const template = synth();

    template.resourceCountIs("AWS::SNS::Subscription", 0);
    template.resourceCountIs("AWS::CloudWatch::Alarm", 1);
  });

  it("alarms on a sustained Amplify 5xx rate and notifies the topic both ways", () => {
    const template = synth(undefined, { amplifyAppId: "d1234abcd5678" });

    template.hasResourceProperties("AWS::CloudWatch::Alarm", {
      AlarmName: "TenantAccess-Amplify-ServerErrorRate",
      Threshold: 5,
      EvaluationPeriods: 3,
      ComparisonOperator: "GreaterThanOrEqualToThreshold",
      TreatMissingData: "notBreaching",
      AlarmActions: [{ Ref: Match.stringLikeRegexp("AlertsTopic") }],
      OKActions: [{ Ref: Match.stringLikeRegexp("AlertsTopic") }],
      Metrics: Match.arrayWith([
        Match.objectLike({
          Expression: "IF(requests >= 20, 100 * serverErrors / requests, 0)",
        }),
        Match.objectLike({
          MetricStat: Match.objectLike({
            Metric: {
              Namespace: "AWS/AmplifyHosting",
              MetricName: "5xxErrors",
              Dimensions: [{ Name: "App", Value: "d1234abcd5678" }],
            },
            Stat: "Sum",
            Period: 300,
          }),
        }),
      ]),
    });
  });

  it("subscribes the alert address to the topic", () => {
    const template = synth(undefined, { alertEmail: "alerts@example.com" });

    template.hasResourceProperties("AWS::SNS::Subscription", {
      Protocol: "email",
      Endpoint: "alerts@example.com",
      TopicArn: { Ref: Match.stringLikeRegexp("AlertsTopic") },
    });
  });
});
