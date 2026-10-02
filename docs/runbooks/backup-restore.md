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
`restore.sh` refuses a name that already exists, so a scratch name that is
taken stops the drill rather than restoring over it. The scripts strip
Prisma's pool parameters before libpq sees a URL (`apps/web/scripts/pg-url.mjs`).

`db-grants.mjs` is the step people forget: a dump restores tables and rows,
not the app role's grants or the row-level security policies, and a database
without them answers every query with permission denied. The script puts both
back and proves the app role can read before it exits 0.

## Drill record

| Date | Source | Dump | Restore | Policies after grants | Rows checked | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-07 | dev database (1,293 users, 15 schools, 147,589 notifications) | 34 MB in 5 s | 9 s | 91 | User, School, Membership, Notification, Conversation, JobRun, _prisma_migrations — all identical | 15 s |

Staging and production rows are added here as they are rehearsed.
