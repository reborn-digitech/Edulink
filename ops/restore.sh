#!/usr/bin/env bash
# Restore a dump into a NAMED database — never the one the app is serving.
# The drill (docs/runbooks/backup-restore.md) restores into a fresh database,
# proves the row counts, then either swaps DATABASE_URL to it or drops it.
#
#   ops/restore.sh backups/edulink-20260907T020000Z.dump edulink_restore
#
# TARGET_ADMIN_URL (default the local server) names the server and the database;
# createdb and pg_restore both reach that server. Needs node to read the URL.
set -euo pipefail
command -v node > /dev/null || { echo "node is needed to read TARGET_ADMIN_URL (apps/web/scripts/pg-url.mjs)" >&2; exit 1; }

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
# One server, one database (TA-442): createdb ran with no host, so with
# TARGET_ADMIN_URL at the provider it made the database on the laptop while
# pg_restore wrote into the provider's database of that name. Now the URL must
# name $TARGET_DB, and createdb reaches the same server through the URL's own
# maintenance database. Always a scratch name (edulink_restore), never the
# laptop's dev database: createdb refuses a name that already exists on that
# server, so a restore cannot land on a database that was there before.
URL_DB="$(node -e 'try { const u = new URL(process.argv[1]); process.stdout.write(decodeURIComponent(u.pathname.replace(/^\//, ""))); } catch { process.exit(1); }' "$TARGET_ADMIN_URL")" || { echo "TARGET_ADMIN_URL is not a URL this can read" >&2; exit 1; }
if [ "$URL_DB" != "$TARGET_DB" ]; then
  echo "TARGET_ADMIN_URL names the database $URL_DB, not $TARGET_DB: refusing to restore into a database other than the one created" >&2
  exit 1
fi
MAINT_URL="$(node -e 'const u = new URL(process.argv[1]); u.pathname = "/postgres"; process.stdout.write(u.toString());' "$TARGET_ADMIN_URL")"
createdb --maintenance-db="$MAINT_URL" "$TARGET_DB"
pg_restore --no-owner --no-privileges --exit-on-error --dbname="$TARGET_ADMIN_URL" "$DUMP"
echo "restored $DUMP into $TARGET_DB in $(( $(date +%s) - start ))s"
echo "next: cd apps/web && DATABASE_ADMIN_URL=<owner URL of $TARGET_DB> DATABASE_URL=<app URL of $TARGET_DB> node scripts/db-grants.mjs  # both URLs: the read check connects as the app role to THIS database, not .env's"
