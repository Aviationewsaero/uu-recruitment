#!/usr/bin/env bash
# Apply student-flow hardening migration to prod:
#   1. Add Student.admitCardToken column
#   2. Drop NOT NULL on optional fields (fatherName, motherName, address,
#      tenthState, twelfthState) so students can skip them.
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
  echo "❌ Password wrong."
  exit 1
fi

echo "🔨 Applying schema changes (idempotent)…"
PGPASSWORD="$PASSWORD" psql "$DB_URL" -v ON_ERROR_STOP=1 <<SQL
-- 1. New column for admit-card download token
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "admitCardToken" TEXT;

-- 2. Drop NOT NULL on optional fields
ALTER TABLE "Student" ALTER COLUMN "fatherName" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "motherName" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "address" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "tenthState" DROP NOT NULL;
ALTER TABLE "Student" ALTER COLUMN "twelfthState" DROP NOT NULL;
SQL

echo ""
echo "✅ Schema updated."
echo ""
echo "📊 Student table columns (should show admitCardToken):"
PGPASSWORD="$PASSWORD" psql "$DB_URL" -tAc \
  "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='Student' AND table_schema='public' ORDER BY ordinal_position;" \
  | column -t -s '|' | sed 's/^/   /'
