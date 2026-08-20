#!/bin/bash
# Creates a new migration file with timestamp

set -e

DESCRIPTION="$1"

if [ -z "$DESCRIPTION" ]; then
  echo "Error: Description required"
  echo ""
  echo "Usage:"
  echo "  bash scripts/create_migration.sh <description>"
  echo ""
  echo "Example:"
  echo "  bash scripts/create_migration.sh add_email_column"
  exit 1
fi

# Migration directory
MIGRATION_DIR="$(dirname "$0")/../migrations"
mkdir -p "$MIGRATION_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d%H%M%S)
FILENAME="${TIMESTAMP}_${DESCRIPTION}.sql"
FILEPATH="$MIGRATION_DIR/$FILENAME"

# Create file with template
cat > "$FILEPATH" <<EOF
-- Migration: $DESCRIPTION
-- Created: $(date +"%Y-%m-%d %H:%M:%S")

-- Write your SQL here

EOF

echo "Created new migration:"
echo "   migrations/$FILENAME"
echo ""
