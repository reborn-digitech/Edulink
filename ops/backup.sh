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
#
# One at a time (TA-418): two runs started in the same second once wrote one file, and two that overlapped each saw
# the other's dump. A run now holds $BACKUP_DIR/.backup.lock (a directory, made atomically, holding its pid) and a
# second run waits for it, up to BACKUP_LOCK_WAIT seconds (default 600), saying another backup is running; a lock
# whose process is gone is taken over. The file name carries the second and the process id, and a caller may name
# the file itself (BACKUP_OUT, as db-backup.mjs does) so that it copies exactly the dump it asked for.
set -euo pipefail

: "${DATABASE_ADMIN_URL:?set DATABASE_ADMIN_URL to the owner connection}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${BACKUP_OUT:-$BACKUP_DIR/edulink-$STAMP-$$.dump}"
LOCK="$BACKUP_DIR/.backup.lock"
LOCK_WAIT="${BACKUP_LOCK_WAIT:-600}"

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
waited=0
said=""
until mkdir "$LOCK" 2> /dev/null; do
  holder="$(cat "$LOCK/pid" 2> /dev/null || true)"
  if [ -n "$holder" ] && ! kill -0 "$holder" 2> /dev/null; then
    echo "a backup lock left by process $holder, which is gone, is taken over" >&2
    rm -rf "$LOCK"
    continue
  fi
  if [ -z "$said" ]; then echo "another backup is running in $BACKUP_DIR (process ${holder:-?}); waiting up to ${LOCK_WAIT}s" >&2; said=1; fi
  if [ "$waited" -ge "$LOCK_WAIT" ]; then
    echo "another backup still holds $LOCK after ${LOCK_WAIT}s; nothing was dumped" >&2
    exit 1
  fi
  sleep 1
  waited=$((waited + 1))
done
echo "$$" > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT
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
