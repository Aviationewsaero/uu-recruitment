#!/usr/bin/env bash
# Bulk-push env vars from a notes file to Vercel.
# v2: only pushes to PRODUCTION + DEVELOPMENT (skips preview to avoid git-branch prompt).
# Re-runnable — uses --force to overwrite existing.

set -u

NOTES="${1:-$HOME/Desktop/uu-recruitment-env.txt}"

if [ ! -f "$NOTES" ]; then
  echo "❌ Notes file not found: $NOTES"
  exit 1
fi

# Detect RTF format — common TextEdit gotcha
if head -1 "$NOTES" | grep -q "^{\\\\rtf"; then
  echo "❌ Notes file is Rich Text (RTF), not plain text."
  echo "   Run: textutil -convert txt -output \"$NOTES\" \"$NOTES\""
  exit 1
fi

cd "$(dirname "$0")/.."

if [ ! -d ".vercel" ]; then
  echo "❌ This folder isn't linked to a Vercel project. Run \`vercel link\` first."
  exit 1
fi

echo "📤 Pushing env vars to Vercel (Production + Development)…"
echo ""

OK=0
SKIP=0
FAIL=0

while IFS= read -r line || [ -n "$line" ]; do
  [ -z "$line" ] && continue
  case "$line" in \#*) continue ;; esac
  case "$line" in *=*) ;; *) continue ;; esac

  KEY="${line%%=*}"
  VALUE="${line#*=}"
  VALUE="${VALUE%\"}"
  VALUE="${VALUE#\"}"
  VALUE="${VALUE%\'}"
  VALUE="${VALUE#\'}"

  if ! echo "$KEY" | grep -qE '^[A-Za-z_][A-Za-z0-9_]*$'; then
    echo "  ⚠️  Skipping invalid key: '$KEY'"
    SKIP=$((SKIP + 1))
    continue
  fi
  if [ -z "$VALUE" ]; then
    echo "  ⚠️  Skipping empty value for: $KEY"
    SKIP=$((SKIP + 1))
    continue
  fi

  for ENV in production development; do
    printf "  %-35s → %-12s" "$KEY" "$ENV"
    OUT=$(printf '%s\n' "$VALUE" | vercel env add "$KEY" "$ENV" --force 2>&1) || true
    if echo "$OUT" | grep -qiE "Added|Success|Overrode"; then
      echo "  ✅"
      OK=$((OK + 1))
    else
      echo "  ❌"
      echo "$OUT" | tail -2 | sed 's/^/      /'
      FAIL=$((FAIL + 1))
    fi
  done
done <"$NOTES"

echo ""
echo "─────────────────────────────────────────"
echo "  Saved:    $OK   (of expected 28)"
echo "  Skipped:  $SKIP"
echo "  Failed:   $FAIL"
echo "─────────────────────────────────────────"

if [ "$FAIL" -eq 0 ] && [ "$OK" -ge 14 ]; then
  echo "✅ All vars pushed to Production + Development."
  echo "   Preview env intentionally skipped (only matters for PR previews)."
else
  echo "⚠️  Check output above."
  exit 1
fi
