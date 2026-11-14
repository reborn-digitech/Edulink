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
# The environment wins over .env, as in every other script, and the URL goes through pg-url.mjs (TA-438): libpq
# refuses Prisma's pool parameters.
ADMIN_URL="${DATABASE_ADMIN_URL:-$(grep -E '^DATABASE_ADMIN_URL=' "$WEB/.env" 2>/dev/null | cut -d= -f2- | tr -d '"')}"
[ -n "$ADMIN_URL" ] || { echo "drill: no DATABASE_ADMIN_URL in the environment or apps/web/.env" >&2; exit 1; }
ADMIN_URL="$(node "$HERE/pg-url.mjs" "$ADMIN_URL")"
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
restored=()
for t in School User Membership QuizTopic QuizQuestion Competition; do
  q="select count(*) from \"$t\""
  l=$(count "$ADMIN_URL" "$q"); d=$(count "$SCRATCH_URL" "$q" || true)
  echo "drill: $t live $l, restored $d"
  restored+=("$t=$d")
done
dropdb --maintenance-db="$MAINT" "$SCRATCH"
if [ "$fail" = 1 ]; then echo "drill: FAILED — the restored shape differs from the live one" >&2; exit 1; fi
# The rows, not only the shape (TA-438): a key table restored empty, fewer than half the rows of the last drill that
# passed, or a dump less than half that drill's size fails it; a pass is recorded beside the dumps, and db-backup.mjs
# never prunes the dump that record names (scripts/drill-verdict.mjs).
if ! node "$HERE/drill-verdict.mjs" "$OFFSITE" "$DUMP" "$live_tables" "$drill_tables" "${restored[@]}"; then
  echo "drill: FAILED — the dump restores, but not the database it should hold" >&2
  exit 1
fi
echo "drill: passed — the dump restores whole (row counts differ only by what changed since it was taken)"
