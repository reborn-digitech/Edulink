#!/usr/bin/env bash
# Nightly logical backup of the production database, kept beside the provider's
# own point-in-time recovery — the dump is what you restore to a laptop, to
# staging, or to a different provider; PITR is what you restore to five
# minutes before the mistake. Both, not either.
#
#   DATABASE_ADMIN_URL=postgresql://... BACKUP_DIR=/backups ops/backup.sh
#   BACKUP_BUCKET=s3://edulink-backups ops/backup.sh      # also copies off-host
#
# Custom format (-Fc) restores selectively and compresses; --no-owner so the
# dump restores under whichever role the target has. Keeps KEEP_DAYS locally.
set -euo pipefail

: "${DATABASE_ADMIN_URL:?set DATABASE_ADMIN_URL to the owner connection}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$BACKUP_DIR/edulink-$STAMP.dump"

# pg_dump is libpq, which refuses Prisma's pool settings in a URL
# (`?connection_limit=…`); the one helper the scripts share strips them.
PG_URL="$(dirname "$0")/../apps/web/scripts/pg-url.mjs"
if command -v node > /dev/null; then
  DUMP_URL="$(node "$PG_URL" "$DATABASE_ADMIN_URL")"
elif [[ "$DATABASE_ADMIN_URL" == *\?* ]]; then
  echo "node is needed to strip Prisma's parameters from DATABASE_ADMIN_URL (apps/web/scripts/pg-url.mjs)" >&2
  exit 1
else
  DUMP_URL="$DATABASE_ADMIN_URL"
fi

mkdir -p "$BACKUP_DIR"
start=$(date +%s)
pg_dump --format=custom --no-owner --no-privileges --file="$OUT" "$DUMP_URL"
# A dump that cannot be listed is not a backup.
pg_restore --list "$OUT" > /dev/null
size=$(du -h "$OUT" | cut -f1)
echo "backup $OUT ($size) in $(( $(date +%s) - start ))s"

if [ -n "${BACKUP_BUCKET:-}" ]; then
  aws s3 cp --only-show-errors "$OUT" "$BACKUP_BUCKET/$(basename "$OUT")"
  echo "copied to $BACKUP_BUCKET"
fi

find "$BACKUP_DIR" -name 'edulink-*.dump' -mtime +"$KEEP_DAYS" -print -delete | sed 's/^/pruned /'
