#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TenantAccessStack } from "./lib/tenant-access-stack.js";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} must be set; deploy with scripts/deploy.sh <dev|prod>`);
  }
  return value;
}

const account = requireEnv("AWS_ACCOUNT_ID");
const region = requireEnv("AWS_REGION");
const vpcId = requireEnv("TENANT_ACCESS_VPC_ID");
const allowedOrigins = requireEnv("TENANT_ACCESS_ALLOWED_ORIGINS");
const apiDomainName = requireEnv("TENANT_ACCESS_API_DOMAIN_NAME");
const apiCertificateArn = requireEnv("TENANT_ACCESS_API_CERT_ARN");
const amplifyAppId = requireEnv("TENANT_ACCESS_AMPLIFY_APP_ID");
const alertEmail = requireEnv("TENANT_ACCESS_ALERT_EMAIL");

if (!vpcId.startsWith("vpc-")) {
  throw new Error("TENANT_ACCESS_VPC_ID must be set to the VPC id for the target account");
}

const inboundCidrs = requireEnv("TENANT_ACCESS_INBOUND_CIDRS")
  .split(",")
  .map((cidr) => cidr.trim())
  .filter(Boolean);
if (inboundCidrs.length === 0) {
  throw new Error(
    "TENANT_ACCESS_INBOUND_CIDRS must list the CIDRs allowed to reach the private API, comma-separated",
  );
}

const app = new cdk.App();

new TenantAccessStack(app, "TenantAccessStack", {
  env: { account, region },
  vpcId,
  inboundCidrs,
  allowedOrigins,
  amplifyAppId,
  alertEmail,
  apiDomain: { name: apiDomainName, certificateArn: apiCertificateArn },
});

app.synth();
