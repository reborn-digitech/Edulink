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
| `FEES_SECRET_KEY` | `openssl rand -base64 32`; seals each school's gateway secrets at rest. Without it no school can save gateway keys (UPI-id and counter payments still work). Never rotate casually: every school re-enters its keys |
| `WHATSAPP_TRANSPORT=twilio` + `TWILIO_WHATSAPP_FROM` | WhatsApp to families through the same Twilio account; the sandbox number while testing. `MESSAGE_TEMPLATE_IDS` carries the DLT ids and WhatsApp content SIDs per template and language — `docs/runbooks/messaging.md` |
| `FEES_GATEWAY_TRANSPORT=razorpay` | real orders at each school's *own* Razorpay account; `devbox` (the default) is refused when deployed. There is no platform gateway key — see decision 0003 |

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

`src/lib/jobs.ts` is the registry. On a VM with a checkout, `npm run
cron:install` puts the block in the operator's crontab. In the container —
which has no crontab, no tsx and no scripts directory — a second process
group from the same image runs the schedule in-process:
`node scripts/jobs-runner.mjs`, which starts the server on loopback with
`JOBS_RUNNER=1` and kicks `POST /api/internal/jobs` (a route that answers
404 in any other process) to start `src/lib/job-scheduler.ts`. `fly.toml`
declares it as the `jobs` process and keeps it out of the http service;
`fly scale count web=2 jobs=1`. The runner connects as the owner
(`DATABASE_ADMIN_URL`, which the release step already needs), which is why it
binds to loopback and `env.ts` refuses to start it any other way when
deployed. Schedules are read in `TZ` (Asia/Kolkata in `fly.toml`). The JobRun
row is still the lock, so a crontab and a runner firing the same minute is
safe; `/root/jobs` shows whether each job has run. CI's `image` job starts
the runner from the built image and asserts the schedule came up.

## The image

CI's `image` job builds `apps/web/Dockerfile` on every push to master, runs
`npm run db:migrate` inside the container against a fresh Postgres (the
release step, exactly as `fly.toml` runs it), serves it and checks
`/api/health` reports the commit, then starts the jobs runner from the same
image. With the repository variable `PUBLISH_IMAGE` set to `true` it also
pushes `ghcr.io/<owner>/edulink-web:<sha>` and `:latest`, so a deploy is
`fly deploy --image ghcr.io/<owner>/edulink-web:<sha>` rather than a remote
build.

## Capacity

Measured on a laptop against the standalone server (see the Phase 1 report):
one Node process renders roughly fourteen guardian overviews a second and
takes ten attendance registers a second before latency climbs. A school of
800 pupils at its busiest minute is well inside that; two hundred guardians
opening the app in the same second is not, and needs either more processes
or the overview cached. Start at two machines of `shared-cpu-2x` and read the
p95 from the platform's metrics for a week before deciding.

The concurrent-user run of 2026-10-01 (one process, this laptop, Postgres on
the same machine): the light profile met its targets (register p95 111 ms,
overview 178 ms), the moderate one did not (732 ms, 1,010 ms) and the plan
profile of 30 teachers and 200 guardians firing without pause sat at 4.5 s
and 5.3 s with no error. The time is queueing, not per-request cost, so the
settings for a fifty-school fleet are two `web` machines (`fly.toml` keeps
two running) and a Prisma pool of thirty on each: append
`?connection_limit=30&pool_timeout=20` to `DATABASE_URL` (the default is the
machine's cores times two plus one, 5 on a shared-cpu-2x), and give Postgres
`max_connections` room for both machines, the jobs machine and the release
step (`2 × 30 + 10 + 5` is 75; a managed Postgres of the smallest size allows
100). Before a launch, repeat the plan profile from a second machine with k6
against the deployed app, not from the laptop that also runs the database.

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

## Fees

The platform holds no money (decision 0003). A school that wants online
payment opens its own gateway account, enters its keys on
`/admin/fees/settings`, and registers
`https://app.example/api/webhooks/razorpay/<schoolId>` in its gateway
dashboard for `payment.captured`, `payment.failed` and `refund.processed`.
The route checks the signature with that school's own webhook secret before
it reads a byte; a redelivery answers "already". Two jobs join the registry:
`fees:remind` at 09:00 `TZ` and `fees:reconcile` hourly, the second asking
each school's gateway about orders the webhook never reported and closing
day-old ones nobody paid. `/root/jobs` shows both.

## Texts to families

`docs/runbooks/messaging.md`. Two things to remember here: the Twilio
status callback is signed against `NEXT_PUBLIC_APP_URL`, so that must be
the public origin; and `messages:send` runs every minute from the same
registry as the other jobs, so the jobs process must be up for a notice to
more than a hundred families to go out.

## Open items before the first real school

- **Error tracking.** The structured log line on every request error is in
  `instrumentation.ts`; a Sentry DSN plugs into the same hook once the
  account exists.
- **Cloudflare in front**, with the rate limits in `rate-limit.ts` as the
  second line, not the first.
