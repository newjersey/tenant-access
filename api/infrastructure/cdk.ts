#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { TenantAccessStack } from "./lib/tenant-access-stack.js";

const app = new cdk.App();

new TenantAccessStack(app, "TenantAccessStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

app.synth();
