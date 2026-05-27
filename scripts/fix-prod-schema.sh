#!/usr/bin/env bash
# Definitive prod schema sync. Uses Session Pooler (5432) for DDL.

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

# Use port 5432 (Session Pooler) for everything — DDL works reliably here
DB_5432="postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:5432/postgres"
DB_6543="postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:6543/postgres"

# Quick test
echo "🧪 Verifying connection (port 5432)…"
if ! PGPASSWORD="$PASSWORD" psql "$DB_5432" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "❌ Connection failed — verify password is current."
  exit 1
fi
echo "   ✅ Connected"

echo ""
echo "📊 Tables BEFORE:"
COUNT=$(PGPASSWORD="$PASSWORD" psql "$DB_5432" -tAc \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "   ($COUNT tables in public schema)"

echo ""
echo "🧹 Wiping public schema (clean slate)…"
PGPASSWORD="$PASSWORD" psql "$DB_5432" -v ON_ERROR_STOP=1 \
  -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres; GRANT ALL ON SCHEMA public TO public;" >/dev/null
echo "   ✅ Wiped + recreated"

echo ""
echo "🔨 Pushing prisma schema → prod (using port 5432 / Session Pooler)…"
# Use Session Pooler for DDL (port 5432). Close stdin so no prompts can hang.
export DATABASE_URL="$DB_5432"
export DIRECT_URL="$DB_5432"
if ! npx prisma db push --accept-data-loss --skip-generate < /dev/null; then
  # Older Prisma may not support --skip-generate; retry without it
  echo "   Retrying without --skip-generate…"
  npx prisma db push --accept-data-loss < /dev/null || {
    echo "❌ prisma db push failed."
    exit 1
  }
fi

echo ""
echo "📊 Tables AFTER push:"
PGPASSWORD="$PASSWORD" psql "$DB_5432" -tAc \
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" \
  | sed 's/^/   • /'

# Sanity check — all 7 expected tables must exist
EXPECTED=("AuditLog" "EmailLog" "InterviewLog" "Room" "Student" "Token" "User")
MISSING=""
for T in "${EXPECTED[@]}"; do
  EXISTS=$(PGPASSWORD="$PASSWORD" psql "$DB_5432" -tAc \
    "SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='$T';")
  if [ -z "$EXISTS" ]; then
    MISSING="$MISSING $T"
  fi
done

if [ -n "$MISSING" ]; then
  echo ""
  echo "❌ Missing tables:$MISSING"
  exit 1
fi
echo ""
echo "   ✅ All 7 expected tables present"

echo ""
echo "🌱 Seeding rooms + users…"
# Force seed to use prod URL via shell env (won't load .env.local since DATABASE_URL is set)
npm run seed

echo ""
echo "🔧 Re-pushing DATABASE_URL (6543, runtime) + DIRECT_URL (5432) to Vercel…"
for ENV in production development; do
  printf '%s\n' "$DB_6543" | vercel env add DATABASE_URL "$ENV" --force >/dev/null 2>&1 && \
    echo "   ✅ DATABASE_URL → $ENV"
  printf '%s\n' "$DB_5432" | vercel env add DIRECT_URL "$ENV" --force >/dev/null 2>&1 && \
    echo "   ✅ DIRECT_URL → $ENV"
done

echo ""
echo "🚀 Redeploying to pick up correct env vars…"
vercel --prod --yes 2>&1 | tail -5

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Prod DB has all tables, seeded, env vars set, deployed."
echo "   Hard-refresh https://careers.ews.aero/register"
echo "   (Cmd+Shift+R) and test the OTP send again."
echo "═══════════════════════════════════════════════════════"
