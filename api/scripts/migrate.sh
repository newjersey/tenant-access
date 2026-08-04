#!/bin/bash
# Run database migrations
#
# Usage:
#   bash scripts/migrate.sh        # Run latest migration only (default)
#   bash scripts/migrate.sh --all  # Run all migrations (fresh database)

set -e

# Parse arguments
RUN_ALL=false
if [ "$1" = "--all" ]; then
  RUN_ALL=true
fi

# Check required environment variables
if [ -z "$DB_HOST" ] || [ -z "$DB_SECRET_ARN" ]; then
  echo "Error: DB_HOST and DB_SECRET_ARN must be set"
  echo ""
  echo "Usage:"
  echo "  export DB_HOST=xxx.rds.amazonaws.com"
  echo "  export DB_SECRET_ARN=arn:aws:secretsmanager:..."
  echo "  bash scripts/migrate.sh        # Run latest only"
  echo "  bash scripts/migrate.sh --all  # Run all migrations"
  exit 1
fi

# Get credentials from Secrets Manager
echo "Fetching credentials..."
SECRET=$(aws secretsmanager get-secret-value \
  --secret-id "$DB_SECRET_ARN" \
  --query SecretString \
  --output text)

DB_PASSWORD=$(echo "$SECRET" | jq -r .password)
DB_USER=$(echo "$SECRET" | jq -r .username)
DB_NAME="tenantaccess"

if [ -z "$DB_PASSWORD" ]; then
  echo "Failed to retrieve database password"
  exit 1
fi

export PGPASSWORD="$DB_PASSWORD"

# Migration directory
MIGRATION_DIR="$(dirname "$0")/../migrations"

# Function to run a migration
run_migration() {
  local file=$1
  local filename=$(basename "$file")

  echo "Running $filename..."
  if psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$file"; then
    echo "Applied $filename"
    return 0
  else
    echo "Failed to apply $filename"
    return 1
  fi
}

# Run migrations
if [ "$RUN_ALL" = true ]; then
  # Run all migrations in order
  echo "Running ALL migrations (fresh database setup)..."
  echo ""

  COUNT=0
  for file in $(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort); do
    if [ -f "$file" ]; then
      run_migration "$file"
      COUNT=$((COUNT + 1))
    fi
  done

  if [ $COUNT -eq 0 ]; then
    echo "No migration files found in $MIGRATION_DIR"
    exit 1
  fi

  echo ""
  echo "Database initialized!"
  echo "Applied $COUNT migrations"

else
  # Run only the latest migration
  echo "Running latest migration..."
  echo ""

  LATEST_FILE=$(ls "$MIGRATION_DIR"/*.sql 2>/dev/null | sort | tail -n 1)

  if [ -z "$LATEST_FILE" ]; then
    echo "No migration files found in $MIGRATION_DIR"
    exit 1
  fi

  run_migration "$LATEST_FILE"

  echo ""
  echo "Migration complete!"
fi

unset PGPASSWORD
