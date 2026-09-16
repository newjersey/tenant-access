#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TenantAccessStack } from "./lib/tenant-access-stack.js";

const app = new cdk.App();

const vpcId = process.env.TENANT_ACCESS_VPC_ID;
if (!vpcId?.startsWith("vpc-")) {
  throw new Error("TENANT_ACCESS_VPC_ID must be set to the VPC id for the target account");
}

const allowedOrigins = process.env.TENANT_ACCESS_ALLOWED_ORIGINS ?? "";
if (!allowedOrigins) {
  console.warn("TENANT_ACCESS_ALLOWED_ORIGINS is unset: the API will reject all browser origins");
}

new TenantAccessStack(app, "TenantAccessStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  vpcId,
  allowedOrigins,
});

app.synth();
