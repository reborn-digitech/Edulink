# Deploying the web app

The shape, from decision 0001: one long-running Node process (or several
behind the platform's proxy), managed Postgres with point-in-time recovery,
S3-compatible storage for uploads, Cloudflare in front. The container is
`apps/web/Dockerfile`; `fly.toml` at the root is the Fly.io wiring, and the
same image runs on Render or a plain VM with the same environment.

## Environment

Every value comes from the host's secret store. The image carries no `.env`,
and `env.ts` refuses to start on a half-configured transport, so a bad deploy
dies in the release step rather than serving.

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | the **app** role: `edulink_app`, no BYPASSRLS, no ownership |
| `DATABASE_ADMIN_URL` | the owner; used only by the release step and the jobs |
| `NEXT_PUBLIC_APP_URL` | `https://app.example`; magic links and the SSO redirect URI are built from it |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `npm run vapid` once; never rotate casually — every subscription is bound to the pair |
| `EMAIL_TRANSPORT=smtp` + `SMTP_*`, `EMAIL_FROM` | proven with `npm run email:test -- you@example.com` |
| `SMS_TRANSPORT=twilio` + `TWILIO_*` | proven with `npm run sms:test -- +91…` |
| `STORAGE_BUCKET` + `STORAGE_S3_*` | uploads in an S3-compatible bucket (R2, S3, B2); all five or none. Without them `STORAGE_DIR` on a mounted volume, one machine only |
| `APP_COMMIT` | set by the build (`--build-arg APP_COMMIT=$(git rev-parse --short HEAD)`); `/api/health` reports it |
| `SSO_*` | per provider; `npm run sso:check` before the first sign-in |

## Release

1. CI green on `master` (the `battery` workflow, sweep included).
2. Build the image from the repository root with the commit as a build arg.
3. Release step, before the new machines take traffic:
   `npm run db:migrate` — `prisma migrate deploy`, then `db-grants.mjs`, which
   re-applies `prisma/rls.sql` (every policy is dropped-if-exists and
   recreated, so it is safe to run on every release) and proves the app role
   can read.
4. Rolling replace; the platform waits on `/api/health` (200 only when the
   database answers).
5. Watch `/root/jobs` and the health probe for ten minutes.

Migrations are add-only for one release: a column or table goes in now, the
code that stops reading the old one ships now, the drop ships next release.
That is what makes the rollback below a plain image swap.

## Rollback

Redeploy the previous image. Because migrations are add-only, the previous
code runs on the new schema. Rehearse it on staging before the first real
release and note the time it took beside the restore drill in
`backup-restore.md`.

## Scheduled jobs

`src/lib/jobs.ts` is the registry. On a VM, `npm run cron:install` on the
host puts the block in the operator's crontab. On Fly, run the same
schedule from a second process group or a scheduled machine that executes
`npm run job -- <name>`; the JobRun row is the lock, so two machines firing
the same minute is safe. `/root/jobs` shows whether each one has run.

## Capacity

Measured on a laptop against the standalone server (see the Phase 1 report):
one Node process renders roughly fourteen guardian overviews a second and
takes ten attendance registers a second before latency climbs. A school of
800 pupils at its busiest minute is well inside that; two hundred guardians
opening the app in the same second is not, and needs either more processes
or the overview cached. Start at two machines of `shared-cpu-2x` and read the
p95 from the platform's metrics for a week before deciding.

## Uploads

With `STORAGE_BUCKET` and the four `STORAGE_S3_*` variables set, uploads go to
the bucket (originals under `files/`, resized copies under `variants/`, both
below `STORAGE_S3_PREFIX` if set) and the machines are stateless: scale to two,
replace one, no volume to mount. `src/lib/s3.ts` signs the requests itself,
so the image gains no dependency. Turn on the bucket's own replication or
versioning; `ops/backup.sh` covers the database only. Without the variables
the app writes to `STORAGE_DIR`, which on Fly means a `[mounts]` volume and
`min_machines_running = 1` with no second machine. Moving from a volume to a
bucket is a copy of `<STORAGE_DIR>/` to `files/` (same shard layout) and a
redeploy with the variables; `npm run files:check` afterwards should report
zero missing.

## Open items before the first real school

- **Error tracking.** The structured log line on every request error is in
  `instrumentation.ts`; a Sentry DSN plugs into the same hook once the
  account exists.
- **Cloudflare in front**, with the rate limits in `rate-limit.ts` as the
  second line, not the first.
