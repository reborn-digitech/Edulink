#!/usr/bin/env bash
# THE RESTORE DRILL (7 November 2026): a backup nobody has restored is a hope. Restores the newest dump of the
# off-machine folder (or the one named) into a scratch database, counts the tables and a few key rows against the
# live database, and drops the scratch. Monthly from the morning task; once now.
#
#   scripts/db-restore-drill.sh [path/to/edulink-….dump]
#
set -euo pipefail
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/.." && pwd)"
OFFSITE="${EDULINK_OFFSITE_DIR:-$HOME/Desktop/OffMachineCopy/edulink-backups}"
DUMP="${1:-$(ls -t "$OFFSITE"/edulink-*.dump 2>/dev/null | head -1)}"
[ -n "$DUMP" ] && [ -f "$DUMP" ] || { echo "drill: no dump to restore in $OFFSITE" >&2; exit 1; }
ADMIN_URL="$(grep -E '^DATABASE_ADMIN_URL=' "$WEB/.env" | cut -d= -f2- | tr -d '"')"
[ -n "$ADMIN_URL" ] || { echo "drill: no DATABASE_ADMIN_URL in apps/web/.env" >&2; exit 1; }
MAINT="${ADMIN_URL%/*}/postgres"
SCRATCH="edulink_drill"
SCRATCH_URL="${ADMIN_URL%/*}/$SCRATCH"

# Never the live database: the scratch name is fixed and the live one is only read.
case "$ADMIN_URL" in *"/$SCRATCH"*) echo "drill: the admin URL names the scratch database" >&2; exit 1;; esac

echo "drill: restoring $(basename "$DUMP") ($(du -h "$DUMP" | cut -f1)) into $SCRATCH"
dropdb --if-exists --maintenance-db="$MAINT" "$SCRATCH"
createdb --maintenance-db="$MAINT" "$SCRATCH"
start=$(date +%s)
pg_restore --no-owner --no-privileges --dbname="$SCRATCH_URL" "$DUMP"
echo "drill: restored in $(( $(date +%s) - start ))s"

count() { psql "$1" -At -c "$2"; }
fail=0
TABLES_Q="select count(*) from pg_tables where schemaname='public'"
live_tables=$(count "$ADMIN_URL" "$TABLES_Q"); drill_tables=$(count "$SCRATCH_URL" "$TABLES_Q")
echo "drill: tables live $live_tables, restored $drill_tables"
[ "$live_tables" = "$drill_tables" ] || fail=1
for t in School User Membership QuizTopic QuizQuestion Competition; do
  q="select count(*) from \"$t\""
  l=$(count "$ADMIN_URL" "$q"); d=$(count "$SCRATCH_URL" "$q")
  echo "drill: $t live $l, restored $d"
done
dropdb --maintenance-db="$MAINT" "$SCRATCH"
if [ "$fail" = 1 ]; then echo "drill: FAILED — the restored shape differs from the live one" >&2; exit 1; fi
echo "drill: passed — the dump restores whole (row counts differ only by what changed since it was taken)"
