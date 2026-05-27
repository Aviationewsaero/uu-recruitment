#!/usr/bin/env bash
# Backup the database to a timestamped, gzipped SQL dump.
# Rotates: keeps the last 14 backups, deletes older.
# Run manually or via cron:
#   crontab -e
#   0 2 * * *  cd /path/to/uu-recruitment && ./scripts/backup.sh >> backups/backup.log 2>&1

set -euo pipefail

cd "$(dirname "$0")/.."

# Load DATABASE_URL from .env.local (handles quoted values)
if [ -f .env.local ]; then
  DB_RAW=$(grep -E '^DATABASE_URL=' .env.local | head -1 | sed 's/^DATABASE_URL=//')
  # Strip surrounding quotes if present
  DB_RAW="${DB_RAW%\"}"
  DB_RAW="${DB_RAW#\"}"
  DB_RAW="${DB_RAW%\'}"
  DB_RAW="${DB_RAW#\'}"
  DATABASE_URL="$DB_RAW"
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL not set"
  exit 1
fi

# Strip query params (?pgbouncer=true etc) for pg_dump
DB_URL="${DATABASE_URL%%\?*}"

mkdir -p backups
STAMP=$(date +"%Y-%m-%d-%H%M")
OUT="backups/uu-recruitment-${STAMP}.sql.gz"

echo "📦 Dumping to $OUT…"
pg_dump "$DB_URL" \
  --no-owner \
  --no-acl \
  --no-comments \
  --quote-all-identifiers \
  | gzip > "$OUT"

SIZE=$(du -h "$OUT" | cut -f1)
echo "✅ Wrote $OUT ($SIZE)"

# Rotation: keep most recent 14
cd backups
ls -t uu-recruitment-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -v
echo "🗑  Rotation done — keeping last 14."
