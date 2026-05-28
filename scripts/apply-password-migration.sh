#!/usr/bin/env bash
# Apply the User.passwordHash migration to prod via raw SQL.
# Idempotent — safe to re-run.

cd "$(dirname "$0")/.."

PROJECT_REF="nhucvotuugaazwwnykzk"
HOST="aws-1-ap-south-1.pooler.supabase.com"

echo ""
echo "🔐 Enter Supabase DB password (hidden):"
read -s PASSWORD
echo ""
echo ""

if [ -z "$PASSWORD" ]; then
  echo "❌ Empty password — aborting."
  exit 1
fi

DB_URL="postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:5432/postgres"

echo "🧪 Connecting…"
if ! PGPASSWORD="$PASSWORD" psql "$DB_URL" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "❌ Password wrong — reset in Supabase first."
  exit 1
fi

echo "🔨 Adding passwordHash column (idempotent)…"
PGPASSWORD="$PASSWORD" psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
SQL

echo ""
echo "✅ Schema updated. Verify:"
PGPASSWORD="$PASSWORD" psql "$DB_URL" -c "\\d \"User\"" | head -20
