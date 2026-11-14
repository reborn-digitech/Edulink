# Backups and the restore drill

Two kinds, both required:

- **Point-in-time recovery** from the managed Postgres provider — restores
  to five minutes before the mistake. Enable it on day one; it is a checkbox.
- **Nightly logical dump** with `ops/backup.sh` — restores to a laptop, to
  staging, to a different provider. Kept fourteen days locally and copied to a
  second bucket when `BACKUP_BUCKET` is set. Uploads live in their own bucket
  (`STORAGE_BUCKET`, `docs/runbooks/deploy.md` "Uploads") and are covered by
  that bucket's versioning or replication rule, not by this dump; on a
  single-volume deployment they are covered by the volume's snapshots.

## The drill

Run it before go-live and then quarterly. Restore into a **new** database
with a scratch name (`edulink_restore`), never the live one and never the
laptop's dev database (`edulink_dev`); prove the counts; then drop it or swap
`DATABASE_URL` to it. A dump of production holds children's records: restore
it at the provider, not onto a laptop.

```bash
DATABASE_ADMIN_URL=postgresql://owner@host/edulink BACKUP_DIR=./backups ops/backup.sh
TARGET_ADMIN_URL=postgresql://owner@host/edulink_restore \
  ops/restore.sh backups/edulink-<stamp>.dump edulink_restore
cd apps/web && DATABASE_ADMIN_URL=postgresql://owner@host/edulink_restore \
  DATABASE_URL=postgresql://edulink_app:<password>@host/edulink_restore \
  node scripts/db-grants.mjs
psql postgresql://owner@host/edulink_restore -c 'select count(*) from "School"'   # matches the live count
```

Both URLs, every time: `db-grants.mjs` grants to the role named in
`DATABASE_URL` and then connects AS it to prove it can read. Given only the
owner's URL it falls back to `.env`'s `DATABASE_URL` — the laptop's dev
database — and its check proves nothing about the restore. `createdb` in
`restore.sh` runs on `TARGET_ADMIN_URL`'s own server and refuses a name that
already exists there, so a scratch name that is taken stops the drill rather
than restoring over it; a `TARGET_ADMIN_URL` naming another database than the
one given is refused before anything is created (TA-442). The scripts strip
Prisma's pool parameters before libpq sees a URL (`apps/web/scripts/pg-url.mjs`).

`db-grants.mjs` is the step people forget: a dump restores tables and rows,
not the app role's grants or the row-level security policies, and a database
without them answers every query with permission denied. The script puts both
back and proves the app role can read before it exits 0.

## The dev machine (7 November 2026)

The laptop's dev database was lost on 6 November 2026 with no dump anywhere: a builder ran `prisma migrate diff`
with a shadow database URL that a failed sed had left pointing at `edulink_dev`, and Prisma reset it. What was
rebuildable came back from the scripts in two hours; the rest (hand-entered data, the audit log, review marks,
5,378 generated questions whose only full copy was the database) did not. Four things now stand in the way:

- **The fence** (`apps/web/scripts/db-fence.mjs`, asked by `with-admin-db.mjs` on every db script): a shadow
  database URL, a `migrate diff` against migration folders, and a reset outside `npm run db:reset` are refused,
  and every command prints the database it touches. Migration SQL comes from the live datasource:
  `node scripts/with-admin-db.mjs npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script`.
- **A dump first**: `db:migrate`, `db:push` and `db:reset` run `npm run db:backup` before anything and stop if it
  fails. The dump lands in `apps/web/storage/backups` (ignored by git) and a copy in
  `~/Desktop/OffMachineCopy/edulink-backups`, which the owner's Desktop syncs to iCloud Drive, so the copy
  leaves the machine with no account in any script. Fourteen days kept in both.
- **Every morning** the scheduled task takes the same dump, and on Mondays `npm run db:basebackup`: a base backup
  into `apps/web/storage/pitr` with a copy in the off-machine folder, for point-in-time recovery with the WAL
  archive (`postgresql.conf`: `archive_mode = on`, `archive_command` copying each segment into
  `storage/pitr/wal`; the archive stays on this disk because a heavy ingest writes gigabytes a day). Restore to a
  moment: stop Postgres, move the data directory aside, unpack the newest base into a fresh data directory, add
  `restore_command = 'cp /Users/chinmaykulkarni/Documents/Relay/apps/web/storage/pitr/wal/%f %p'` and
  `recovery_target_time = '<moment>'` to its `postgresql.conf`, touch `recovery.signal`, start.
- **The order and the check (TA-521)**: the morning task runs `npm run db:backup` first and alone, before
  `npm run bank:snapshot` and its push to the two remotes, so a refused push can never stop the dump; then
  `node scripts/db-backup-age.mjs` (from `apps/web`), which reads the off-machine folder and exits 1, naming the
  file, when the newest dump is older than 26 hours or the newest base backup older than eight days. Its lines go
  into the morning report; a red line there means the backups have stopped, whatever else the task did. The task
  itself lives outside the repository (the desktop app's scheduled tasks) and runs only while the laptop is awake
  and the app open, which is why the age is asked and not assumed; a launchd agent or the crontab running
  `npm run db:backup` independently of the app is the sturdier home for it.
- **The drill**: `npm run db:drill` restores the newest off-machine dump into `edulink_drill`, compares the table
  count and six key tables with the live database, and drops the scratch. The first of each month from the task;
  it must pass. Since TA-438 it also fails when School, User or Membership restored empty, with fewer than half
  the rows of the last drill that passed, or from a dump less than half that drill's size
  (`scripts/drill-verdict.mjs`); a pass is recorded in the off-machine folder (`.drill-last-pass.json`) and
  `db:backup` never prunes the dump it names, however old. `db:backup` refuses a database that is not on this
  machine (TA-254) and takes one dump at a time, each named by the second and its process id (TA-418).

## Drill record

| Date | Source | Dump | Restore | Policies after grants | Rows checked | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-07 | dev database (1,293 users, 15 schools, 147,589 notifications) | 34 MB in 5 s | 9 s | 91 | User, School, Membership, Notification, Conversation, JobRun, _prisma_migrations — all identical | 15 s |

| 2026-11-07 | dev database, the Desktop copy (23 schools, 777 users, 15,358 questions, 462 MB) | 97 MB in 215 s | 1,480 s into edulink_drill, under a corpus ingest | not re-granted (the drill reads as the owner) | tables 350 = 350; School, QuizTopic, Competition identical; User, Membership, QuizQuestion short by the rows written since the dump | passed |

Staging and production rows are added here as they are rehearsed.

## What the 6 November 2026 loss cost, and the owner's decisions on it (12 November 2026)

The dev database was rebuilt from the scripts on 6–7 November 2026 (schools, people, fixtures, demo schools, help index, corpus). The generated question bank came back from the git snapshots of `content/quiz/generated` at 8,633 of the ~14,000 questions the desk had counted; the rest were passes that had overwritten earlier files before `landChapter` accumulated them, and no snapshot held them. The owner decided on 12 November 2026: the 326 early-October questions generated under chapter titles that no longer match are left out rather than placed by hand; the 48 questions that are exact repeats across NCERT and Balbharati stay on both sides, since each board's pupils see their own; and commit c348f053, which carried 94 of the competitions builder's files under the backup commit's message, stays in history as it is (the content is right; the rewrite was refused).
