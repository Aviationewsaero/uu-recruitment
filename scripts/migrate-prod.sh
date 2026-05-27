#!/usr/bin/env bash
# Run prisma migrate deploy + seed against the PRODUCTION database.
# v3: reads DB URLs directly from notes file, no Vercel CLI involved.

set -e

cd "$(dirname "$0")/.."

NOTES="${1:-$HOME/Desktop/uu-recruitment-env.txt}"

if [ ! -f "$NOTES" ]; then
  echo "❌ Notes file not found: $NOTES"
  exit 1
fi

# Extract DATABASE_URL and DIRECT_URL from notes file
read_env_var() {
  local key="$1"
  local val
  val=$(grep "^${key}=" "$NOTES" | head -1 | sed "s/^${key}=//")
  # strip surrounding quotes
  val="${val%\"}"
  val="${val#\"}"
  val="${val%\'}"
  val="${val#\'}"
  echo "$val"
}

export DATABASE_URL
export DIRECT_URL
DATABASE_URL=$(read_env_var "DATABASE_URL")
DIRECT_URL=$(read_env_var "DIRECT_URL")

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL not found in $NOTES"
  exit 1
fi
if [ -z "$DIRECT_URL" ]; then
  echo "❌ DIRECT_URL not found in $NOTES"
  exit 1
fi

echo "🔑 DATABASE_URL: ${DATABASE_URL:0:60}…"
echo "🔑 DIRECT_URL:   ${DIRECT_URL:0:60}…"
echo ""

echo "🗄  Running prisma migrate deploy against PROD Supabase…"
npx prisma migrate deploy

echo ""
echo "🌱 Seeding prod DB (4 rooms + 5 staff users)…"
npm run seed

echo ""
echo "✅ Prod DB ready. Verify in Supabase → Table Editor (7 tables, 4 rooms, 5 users)."
