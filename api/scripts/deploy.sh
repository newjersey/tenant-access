#!/bin/bash
# Deploys the CDK stack using the env vars for the given environment

set -euo pipefail

ENVIRONMENT="${1:-}"

if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
  echo "Error: Environment required (dev or prod)"
  echo ""
  echo "Usage:"
  echo "  bash scripts/deploy.sh <dev|prod> [extra cdk deploy args]"
  echo ""
  echo "Example:"
  echo "  bash scripts/deploy.sh dev"
  exit 1
fi
shift

API_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$API_DIR/.env.$ENVIRONMENT"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found. Securely obtain it from a teammate."
  exit 1
fi

source "$ENV_FILE"

# Fail if the shell's AWS credentials point at a different account than the .env file
CALLER_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
if [ "$CALLER_ACCOUNT" != "${AWS_ACCOUNT_ID:-}" ]; then
  echo "Error: AWS credentials are for account $CALLER_ACCOUNT, but .env.$ENVIRONMENT expects ${AWS_ACCOUNT_ID:-<unset>}"
  exit 1
fi

if [ "$ENVIRONMENT" = "prod" ]; then
  read -r -p "Deploying to PROD (account $AWS_ACCOUNT_ID). Type 'prod' to continue: " CONFIRM
  if [ "$CONFIRM" != "prod" ]; then
    echo "Aborted."
    exit 1
  fi
fi

cd "$API_DIR"
npx cdk deploy "$@"
