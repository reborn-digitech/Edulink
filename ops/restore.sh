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
# pg_restore is libpq, which refuses Prisma's pool settings in a URL; the one
# helper the scripts share strips them (apps/web/scripts/pg-url.mjs).
PG_URL="$(dirname "$0")/../apps/web/scripts/pg-url.mjs"
if command -v node > /dev/null; then
  TARGET_ADMIN_URL="$(node "$PG_URL" "$TARGET_ADMIN_URL")"
fi

start=$(date +%s)
# Always a scratch name (edulink_restore), never the laptop's dev database:
# createdb refuses a name that already exists on the server it reaches (PG*
# or the local one), so with TARGET_ADMIN_URL left to its default a restore
# cannot land on a database that was there before.
createdb "$TARGET_DB"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_ADMIN_URL" "$DUMP"
echo "restored $DUMP into $TARGET_DB in $(( $(date +%s) - start ))s"
echo "next: cd apps/web && DATABASE_ADMIN_URL=<owner URL of $TARGET_DB> DATABASE_URL=<app URL of $TARGET_DB> node scripts/db-grants.mjs  # both URLs: the read check connects as the app role to THIS database, not .env's"
