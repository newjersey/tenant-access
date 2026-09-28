#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TenantAccessStack } from "./lib/tenant-access-stack.js";

const app = new cdk.App();

const vpcId = process.env.TENANT_ACCESS_VPC_ID;
if (!vpcId?.startsWith("vpc-")) {
  throw new Error("TENANT_ACCESS_VPC_ID must be set to the VPC id for the target account");
}

const inboundCidrs = (process.env.TENANT_ACCESS_INBOUND_CIDRS ?? "")
  .split(",")
  .map((cidr) => cidr.trim())
  .filter(Boolean);
if (inboundCidrs.length === 0) {
  throw new Error(
    "TENANT_ACCESS_INBOUND_CIDRS must list the CIDRs allowed to reach the private API, comma-separated",
  );
}

const apiDomainName = process.env.TENANT_ACCESS_API_DOMAIN_NAME;
const apiCertificateArn = process.env.TENANT_ACCESS_API_CERT_ARN;
if (Boolean(apiDomainName) !== Boolean(apiCertificateArn)) {
  throw new Error(
    "Set both TENANT_ACCESS_API_DOMAIN_NAME and TENANT_ACCESS_API_CERT_ARN, or neither",
  );
}

const allowedOrigins = process.env.TENANT_ACCESS_ALLOWED_ORIGINS ?? "";

new TenantAccessStack(app, "TenantAccessStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  vpcId,
  inboundCidrs,
  allowedOrigins,
  apiDomain:
    apiDomainName && apiCertificateArn
      ? { name: apiDomainName, certificateArn: apiCertificateArn }
      : undefined,
});

app.synth();
