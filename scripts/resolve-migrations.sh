#!/usr/bin/env bash
# Mark all existing prisma/migrations as already-applied against prod DB.
# Run ONCE after `prisma db push` created tables out-of-band, to bring
# _prisma_migrations table in sync. Without this, future `prisma migrate
# deploy` will try to re-apply migrations and fail.

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

# Use Session Pooler (5432) for migration metadata writes — same reason as the schema push
export DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:5432/postgres"
export DIRECT_URL="$DATABASE_URL"

echo "📋 Marking migrations as applied…"
for MIG in prisma/migrations/*/; do
  NAME=$(basename "$MIG")
  # Skip if no migration.sql inside (defensive)
  [ -f "$MIG/migration.sql" ] || continue
  echo "  • $NAME"
  npx prisma migrate resolve --applied "$NAME" 2>&1 | grep -v "^$" | sed 's/^/      /' || true
done

echo ""
echo "✅ Migrations marked as applied. Next \`prisma migrate deploy\` will skip them."
echo "   Verify in Supabase → Table Editor → _prisma_migrations table."
