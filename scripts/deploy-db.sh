#!/usr/bin/env bash
# Minimal, bulletproof: prompts for password, tests, pushes to Vercel, migrates, seeds.

cd "$(dirname "$0")/.."

PROJECT_REF="nhucvotuugaazwwnykzk"
HOST="aws-1-ap-south-1.pooler.supabase.com"

echo ""
echo "🔐 Enter Supabase DB password (hidden as you type):"
read -s PASSWORD
echo ""
echo ""

if [ -z "$PASSWORD" ]; then
  echo "❌ Empty password — aborting."
  exit 1
fi

DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:6543/postgres"
DIRECT_URL="postgresql://postgres.${PROJECT_REF}:${PASSWORD}@${HOST}:5432/postgres"

# Test connection
echo "🧪 Testing connection with psql…"
if PGPASSWORD="$PASSWORD" psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
  echo "   ✅ Password works"
else
  echo "   ❌ Password wrong — reset in Supabase and re-run this script."
  exit 1
fi

# Push to Vercel
echo ""
echo "📤 Pushing DATABASE_URL + DIRECT_URL to Vercel…"
for ENV in production development; do
  printf '%s\n' "$DATABASE_URL" | vercel env add DATABASE_URL "$ENV" --force >/dev/null 2>&1
  printf '%s\n' "$DIRECT_URL" | vercel env add DIRECT_URL "$ENV" --force >/dev/null 2>&1
  echo "   ✅ Pushed to $ENV"
done

# Migrate + seed
export DATABASE_URL DIRECT_URL
echo ""
echo "🗄  Running prisma migrate deploy…"
if npx prisma migrate deploy; then
  echo ""
  echo "🌱 Seeding (4 rooms + 5 staff users)…"
  if npm run seed; then
    echo ""
    echo "═══════════════════════════════════════════════════"
    echo "✅ ALL DONE — Prod DB is migrated, seeded, and ready"
    echo "═══════════════════════════════════════════════════"
  else
    echo "❌ Seed failed."
    exit 1
  fi
else
  echo "❌ Migration failed."
  exit 1
fi
