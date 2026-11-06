#!/usr/bin/env bash
# THE WEEKLY BASE BACKUP for point-in-time recovery (7 November 2026). With WAL archiving on (postgresql.conf:
# archive_mode = on, archive_command copying each segment into the PITR folder), a base backup plus the archived
# WAL restores the server to any moment after the base was taken — the five minutes before a mistake, not only the
# last morning's dump. Weekly from the morning task (Mondays); the archive is pruned to what the kept bases need.
#
#   scripts/db-basebackup.sh
#
# Where: EDULINK_PITR_DIR, default apps/web/storage/pitr (git ignores storage/). The WAL archive stays on this disk
# on purpose: a heavy ingest writes gigabytes of WAL a day, and the owner's Desktop syncs to iCloud, where the daily
# dumps and these weekly bases go (a copy of each base is placed in the off-machine folder; the WAL is not).
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/.." && pwd)"
PITR="${EDULINK_PITR_DIR:-$WEB/storage/pitr}"
OFFSITE="${EDULINK_OFFSITE_DIR:-$HOME/Desktop/OffMachineCopy/edulink-backups}"
KEEP_BASES="${KEEP_BASES:-2}"
ADMIN_URL="$(grep -E '^DATABASE_ADMIN_URL=' "$WEB/.env" | cut -d= -f2- | tr -d '"')"
[ -n "$ADMIN_URL" ] || { echo "basebackup: no DATABASE_ADMIN_URL in apps/web/.env" >&2; exit 1; }
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="$PITR/base-$STAMP"
mkdir -p "$PITR/wal" "$OUT"

mode="$(psql "$ADMIN_URL" -At -c 'show archive_mode')"
if [ "$mode" != "on" ]; then
  echo "basebackup: archive_mode is $mode — the base is taken, but without archived WAL it restores only to its own moment (see docs/runbooks/backup-restore.md to switch archiving on)"
fi
start=$(date +%s)
pg_basebackup --dbname="${ADMIN_URL%/*}/postgres" --pgdata="$OUT" --format=tar --gzip --checkpoint=fast --wal-method=stream --progress 2>&1 | tail -1
echo "basebackup: $OUT ($(du -sh "$OUT" | cut -f1)) in $(( $(date +%s) - start ))s"

# A copy of the base goes off the machine; the WAL does not.
mkdir -p "$OFFSITE/pitr-bases"
tar -C "$PITR" -cf "$OFFSITE/pitr-bases/base-$STAMP.tar" "base-$STAMP"
echo "basebackup: copied to $OFFSITE/pitr-bases/base-$STAMP.tar"

# Keep the newest KEEP_BASES bases here and there; prune the WAL archive to segments the oldest kept base needs.
for dir in "$PITR" "$OFFSITE/pitr-bases"; do
  ls -dt "$dir"/base-* 2>/dev/null | tail -n +$((KEEP_BASES + 1)) | while read -r old; do rm -rf "$old"; echo "basebackup: pruned $old"; done
done
oldest="$(ls -d "$PITR"/base-* | sort | head -1)"
if [ -f "$oldest/backup_manifest" ] || tar -tzf "$oldest/base.tar.gz" backup_label >/dev/null 2>&1; then
  label="$(tar -xzOf "$oldest/base.tar.gz" backup_label 2>/dev/null | sed -n 's/^START WAL LOCATION: .*(file \([0-9A-F]*\)).*/\1/p')"
  if [ -n "$label" ]; then
    find "$PITR/wal" -maxdepth 1 -type f -name '0*' | while read -r seg; do
      [ "$(basename "$seg")" \< "$label" ] && rm -f "$seg" && echo "basebackup: pruned WAL $(basename "$seg")"
    done
  fi
fi
echo "basebackup: done; WAL archive $(du -sh "$PITR/wal" | cut -f1)"
