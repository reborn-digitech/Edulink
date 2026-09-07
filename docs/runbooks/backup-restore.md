# Backups and the restore drill

Two kinds, both required:

- **Point-in-time recovery** from the managed Postgres provider — restores
  to five minutes before the mistake. Enable it on day one; it is a checkbox.
- **Nightly logical dump** with `ops/backup.sh` — restores to a laptop, to
  staging, to a different provider. Kept fourteen days locally and copied to a
  second bucket when `BACKUP_BUCKET` is set. Uploads (`STORAGE_DIR`) are
  replicated by the bucket's own rule once the S3 adapter lands.

## The drill

Run it before go-live and then quarterly. Restore into a **new** database,
never the live one; prove the counts; then drop it or swap `DATABASE_URL` to
it.

```bash
DATABASE_ADMIN_URL=postgresql://owner@host/edulink BACKUP_DIR=./backups ops/backup.sh
ops/restore.sh backups/edulink-<stamp>.dump edulink_restore
cd apps/web && DATABASE_ADMIN_URL=postgresql://owner@host/edulink_restore node scripts/db-grants.mjs
psql edulink_restore -c 'select count(*) from "School"'      # matches the live count
```

`db-grants.mjs` is the step people forget: a dump restores tables and rows,
not the app role's grants or the row-level security policies, and a database
without them answers every query with permission denied. The script puts both
back and proves the app role can read before it exits 0.

## Drill record

| Date | Source | Dump | Restore | Policies after grants | Rows checked | Total |
| --- | --- | --- | --- | --- | --- | --- |
| 2026-09-07 | dev database (1,293 users, 15 schools, 147,589 notifications) | 34 MB in 5 s | 9 s | 91 | User, School, Membership, Notification, Conversation, JobRun, _prisma_migrations — all identical | 15 s |

Staging and production rows are added here as they are rehearsed.
