#!/usr/bin/env bash
# Restore a dump into a NAMED database — never the one the app is serving.
# The drill (docs/runbooks/backup-restore.md) restores into a fresh database,
# proves the row counts, then either swaps DATABASE_URL to it or drops it.
#
#   ops/restore.sh backups/edulink-20260907T020000Z.dump edulink_restore
#
# Needs PG* or a reachable local server for createdb; TARGET_ADMIN_URL overrides.
set -euo pipefail

DUMP="${1:?dump file}"
TARGET_DB="${2:?target database name}"
TARGET_ADMIN_URL="${TARGET_ADMIN_URL:-postgresql://localhost:5432/$TARGET_DB}"

start=$(date +%s)
createdb "$TARGET_DB"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_ADMIN_URL" "$DUMP"
echo "restored $DUMP into $TARGET_DB in $(( $(date +%s) - start ))s"
echo "next: cd apps/web && DATABASE_ADMIN_URL=$TARGET_ADMIN_URL node scripts/db-grants.mjs  # policies + grants, then verify"
