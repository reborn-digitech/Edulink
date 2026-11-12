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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | `npm run vapid` once; never rotate casually — every subscription is bound to the pair. The public half is **also a build argument** (Release, step 2): `next build` fixes it into the browser's bundle, so a value set only on the host never reaches a browser (the server says so at boot and web push stays off; phones are unaffected). The server compares the built-in public half with the runtime private half at boot and refuses a mismatch |
| `EMAIL_TRANSPORT=smtp` + `SMTP_*`, `EMAIL_FROM` | proven with `npm run email:test -- you@example.com` |
| `SMS_TRANSPORT=twilio` + `TWILIO_*` | proven with `npm run sms:test -- +91…` |
| `STORAGE_BUCKET` + `STORAGE_S3_*` | uploads in an S3-compatible bucket (R2, S3, B2); all five or none. Required on Fly: a deployed server there refuses to boot without a bucket. Elsewhere, without one, `STORAGE_DIR` must be the absolute path of a mounted volume, one machine only |
| `APP_COMMIT` | set by the build (`--build-arg APP_COMMIT=$(git rev-parse --short HEAD)`); `/api/health` reports it |
| `SENTRY_DSN` | optional; the error tracker. `src/lib/metrics.ts` posts each unexpected error to Sentry's envelope endpoint by a plain fetch (no SDK) with the route, the error and the person's and school's ids as tags — never a body, header, cookie or query string. Without it errors go to the log only; `/root/metrics` shows which. Name Sentry in the privacy policy as a processor |
| `SSO_*` | per provider; `npm run sso:check` before the first sign-in |
| `FEES_SECRET_KEY` | `openssl rand -base64 32`; seals each school's gateway secrets at rest and the two-step sign-in secrets. Without it no school can save gateway keys and nobody can enrol in two-step sign-in (UPI-id and counter payments still work). Never rotate casually: every school re-enters its keys and every enrolment is redone. CI generates a throwaway; a deployment must set its own |
| `FILE_LINK_SECRET` | `openssl rand -base64 32`; signs the five-minute links the phone opens files through. A deployment refuses to boot without it (env.ts); rotating it only expires the links in flight. CI generates a throwaway; a deployment must set its own |
| `WHATSAPP_TRANSPORT=twilio` + `TWILIO_WHATSAPP_FROM` | WhatsApp to families through the same Twilio account; the sandbox number while testing. `MESSAGE_TEMPLATE_IDS` carries the DLT ids and WhatsApp content SIDs per template and language — `docs/runbooks/messaging.md`. Every template's wording changed with the name on 2 October 2026: register all 26 SMS bodies again before the first live send (21 from `npm run messages:templates` plus 5 that `src/lib/sms.ts` sends — see `messaging.md`); a deployment with a live transport and no ids refuses to boot |
| `FEES_GATEWAY_TRANSPORT=razorpay` | real orders at each school's *own* Razorpay account. Unset (or `off`) on a deployed server: online fees are off, UPI-id and counter payments carry on. `devbox`, a laptop's setting, refuses to boot a deployed server (`env.ts`). There is no platform gateway key — see decision 0003 |

## Release

1. CI green on `master` (the `battery` workflow, sweep included).
2. Build the image from the repository root with two build args, the commit
   and the browser's push key (the public half of the pair the host holds):

   ```bash
   docker build -f apps/web/Dockerfile \
     --build-arg APP_COMMIT=$(git rev-parse --short HEAD) \
     --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=<the public key> \
     -t edulink-web .
   # or on Fly's builder: fly deploy --build-arg APP_COMMIT=… --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=…
   ```

   CI's `image` job does the same with a throwaway pair and checks the key
   landed in the client bundle.
3. Release step, before the new machines take traffic:
   `npm run db:release` — `prisma migrate deploy`, then `db-grants.mjs`, which
   re-applies `prisma/rls.sql` (every policy is dropped-if-exists and
   recreated, so it is safe to run on every release) and proves the app role
   can read.
4. Rolling replace; the platform waits on `/api/health` (200 only when the
   database answers).
5. Watch `/root/jobs` and the health probe for ten minutes.

Migrations are add-only for one release: a column or table goes in now, the
code that stops reading the old one ships now, the drop ships next release.
That is what makes the rollback below a plain image swap — when it was kept.

## Rollback

Redeploy the previous image. There are no down migrations, so the rule is:

> **An image can be rolled back to only if every migration the database has
> beyond that image's own folder is add-only.** The image's migrations are
> always a prefix of the database's; what matters is what the extra ones did.
> One that drops or renames a column or table leaves the older code reading
> what is no longer there, and a rollback across it is a **restore from the
> snapshot taken before that deploy** (`backup-restore.md`, point-in-time
> recovery into a new database), not an image swap.

`20261002100602_gig_company_collects` (`a11a7aa4`) dropped and renamed
columns, so no image older than it runs on a database that has it: the last
safe rollback point is that commit or later. Before any rollback, ask the
database what the target image does not know:

```bash
docker run --rm -e DATABASE_URL="$OWNER_URL" ghcr.io/<owner>/edulink-web:<target sha> prisma migrate status
```

(`$OWNER_URL` through `fly proxy` on the laptop: add `--network host` on
Linux, or use `host.docker.internal` in the URL on a Mac. It exits non-zero
whenever the two differ; read its list, not its exit code.) Run against the
target image, `prisma migrate status` reads that image's
`prisma/migrations` and lists the migrations "applied to the database but
missing from the local migrations folder". Read each one's `migration.sql`
(`git show <new sha>:apps/web/prisma/migrations/<name>/migration.sql`): any
`DROP` or `RENAME` among them means restore, not swap. None listed, or only
`CREATE`/`ADD`, and the swap is safe. Rehearse it on staging before the first
real release and note the time it took beside the restore drill in
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
`npm run db:release` inside the container against a fresh Postgres (the
release step, exactly as `fly.toml` runs it), serves it and checks
`/api/health` reports the commit, then starts the jobs runner from the same
image. With the repository variable `PUBLISH_IMAGE` set to `true` it also
pushes `ghcr.io/<owner>/edulink-web:<sha>` and `:latest`, so a deploy is
`fly deploy --image ghcr.io/<owner>/edulink-web:<sha>` rather than a remote
build. Set the repository variable `NEXT_PUBLIC_VAPID_PUBLIC_KEY` to the
deployment's public key first (it is public): the job builds the image with
it, where otherwise it builds with a throwaway pair's — and a deployed server
whose private key is not the built-in key's pair refuses to boot.

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
and 5.3 s with no error. The time is queueing, not per-request cost.

The production-build wave of 2026-10-04 (`ops/load/README.md`, "Baselines")
found one process at about half that capacity after the schema doubled (plan
profile 8.8 s and 9.6 s), the college day saturating at about 45–50 API
requests a second, and the cause on the Node main thread, not the database:
at most five of 37 pooled connections were ever active, no `P2028`, while one
core was pinned. So the settings are:

- **More processes, not a bigger pool.** One `node server.js` per machine,
  one machine per two vCPUs, at least 4 GB each (`fly.toml` asks for 4 GB;
  one process reached 3.6 GB under the college profiles). Start at two `web`
  machines (`fly.toml` keeps two running) and add machines when the p95
  climbs; the bucket adapter keeps every process stateless.
- **A pool of fifteen per process:** append
  `?connection_limit=15&pool_timeout=20` to `DATABASE_URL` (the default is the
  machine's cores times two plus one, 5 on a shared-cpu-2x). Those parameters
  are Prisma's: psql and pg_dump refuse a URL that carries them, so every
  script that hands a URL to a libpq tool (the release step's `db-grants.mjs`,
  `ops/backup.sh`, `ops/restore.sh`) strips them first through
  `apps/web/scripts/pg-url.mjs`. Give Postgres `max_connections` room for
  every process, the jobs machine's owner pool and the release step:
  `processes × 15 + 10 + 3` (two web and the jobs machine: 58; four web and
  the jobs machine: 88; a managed Postgres of the smallest size allows 100, so
  past four web machines put a transaction pooler in front first).
- **Compression at the proxy.** `next.config.ts` sets `compress: false`: gzip
  of one 845 KB page took 16.6 ms of the process's main thread. Fly's proxy
  compresses every `http_service` response that has no `Content-Encoding`, so
  on Fly there is nothing to add. Off Fly, the proxy in front must do it:
  nginx `gzip on; gzip_proxied any; gzip_types text/html text/css
  application/javascript application/json text/x-component;` (the event
  stream already sends `X-Accel-Buffering: no`), or Caddy `encode zstd gzip`
  inside the site block before `reverse_proxy localhost:3000`. Untested: nginx
  and Caddy with this app; check that `/api/v1/events` still streams (go-live
  3.6).

Before a launch, repeat the plan profile from a second machine with k6
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
it reads a byte; a redelivery of an event already handled answers "already",
a delivery whose settlement fails is answered 500 with a body and left to the
gateway's retry, and one that arrives while another is still working on the
same event is answered 409 (QA-02, 24 October 2026). Two jobs join the registry:
`fees:remind` at 09:00 `TZ` and `fees:reconcile` hourly, the second asking
each school's gateway about orders the webhook never reported and closing
day-old ones nobody paid. `/root/jobs` shows both.

## Texts to families

`docs/runbooks/messaging.md`. Two things to remember here: the Twilio
status callback is signed against `NEXT_PUBLIC_APP_URL`, so that must be
the public origin; and `messages:send` runs every minute from the same
registry as the other jobs, so the jobs process must be up for a notice to
more than a hundred families to go out.

## School websites and their own domains

<!-- website-builder B (15 Oct 2026); own domain only since 16 Oct 2026 -->
A school or college with the WEBSITE module publishes a static site from the
flow at `/admin/website`; it is served by the same web machines, and **only
at the school's own domain** once the school has added and verified one. There
is no platform subdomain (the owner's decision of 16 October 2026). Publishing
before the domain is live is allowed: the version is stored and the Publish
screen says the site opens once the domain is connected. The office and the
head can open their own published version at `/sites/<slug>` on the app's host,
signed in; anybody else gets the 404 there. The middleware decides by the
request's `Host` (`src/lib/site-host-match.ts`): a host that is not one of
`APP_HOSTS` is rewritten to `/sites/by-host/<host>`, which serves the site only
when the host is a LIVE school domain, and every path but `/`, `/robots.txt`,
`/sitemap.xml`, the enquiry form's `POST /enquiry` and what the page loads
itself (`/_next/`, `/api/files/`, `/fonts/`, `/brand/`, `/icons/`,
`/api/health`) answers 404 noindex, so the sign-in and the API do not exist on
a site's host. `/sites/by-host/…` typed on the app's host is a 404. A bare IP
address, a name with no dot and `*.internal`/`*.flycast` are never site hosts,
so the health check and machine-to-machine calls are unaffected.

| Variable | Notes |
| --- | --- |
| `APP_HOSTS` | **set it**: the app's own public hosts, comma-separated, e.g. `app.example,edulink-web.fly.dev`. Unset in production NO host is treated as a site and no school's domain is served; a host left out of it is served as a website (404 for the app) |
| `SITE_CNAME_TARGET` | the name a school's `www` CNAME points at: the sites app's own hostname, default `sites.shalaghar.com` |
| `SITE_APEX_IP` | optional: the IPv4 a school's bare domain may point an A record at (`fly ips list`; a dedicated v4, `fly ips allocate-v4`, is the safe choice for bare domains). Unset, the domain page tells the school to forward the bare domain to www at its registrar |
| `FLY_API_TOKEN` | a token that may manage the sites app's certificates (`fly tokens create deploy -a <app>`) |
| `FLY_SITES_APP` | the Fly app the sites are served from and whose certificates the schools' domains get — `edulink-web` while the sites are served by the web machines |

Once, before the first site:

1. **The CNAME target at its DNS host.** `SITE_CNAME_TARGET` (e.g.
   `sites.shalaghar.com`) as a CNAME to `edulink-web.fly.dev` (or A/AAAA to the
   app's addresses). No wildcard and no wildcard certificate: each school's
   domain gets its own certificate when the school verifies it.
2. Set the variables above as secrets and deploy.
3. Check: `curl -sI https://<app host>/login` is still the app;
   `curl -s -o /dev/null -w '%{http_code}' https://<app host>/sites/<a published slug>`
   is 404 signed out.

A school's own domain then needs nobody here: the office types it at
`/admin/website/domain`, adds a CNAME `www → SITE_CNAME_TARGET` (and the bare
domain's A record or forwarding) at its registrar, and presses Verify, which
checks the DNS and asks Fly for that hostname's certificate (`addCertificate`
on `FLY_SITES_APP`). The `site:domains` job (every ten minutes, `/root/jobs`)
re-checks each domain that is Verifying and makes it Live when Fly reports the
certificate Ready; `/root/sites` lists every published site and domain with
its state and the last error. Removing a domain deletes its certificate on Fly,
and the site, still published, opens nowhere until a domain is live again.
Without `FLY_API_TOKEN`/`FLY_SITES_APP` a production domain stays Verifying
("certificates are issued on the hosted platform"); in development it goes
Live once its DNS is right, with no certificate. Once a domain is Live, check
`curl -sI https://<the school's domain>/` is 200 with
`Cache-Control: public, max-age=300` and `curl -s https://<the school's domain>/login`
is the 404. In development only, a published site is also at
`http://<slug>.localhost:3000/` (browsers resolve `*.localhost` to the machine),
so it can be tried before any domain exists.
<!-- end website-builder B -->

## Company details

<!-- company-site (16 Oct 2026) -->
The home page at `/` is the company's own site. Its "About the company" section,
the "Built by" line in its footer, the pricing line's address and the sign-in
page's support line come from the environment alone (`src/lib/company.ts`), so
they are filled in one place and nothing is invented: a variable that is unset,
or set in a shape the law does not give it, is simply not shown. Until the
legal name, the registered office, the support email and the grievance
officer's name and email are all set, the operator's `/root` shows a card
"Company details to fill" naming every detail still missing, which links here.
Set them as secrets (`fly secrets set COMPANY_LEGAL_NAME="…" …`) and the next
machine start shows them; no deploy of the image is needed.

| Variable | Notes |
| --- | --- |
| `COMPANY_LEGAL_NAME` | **required**: the name on the certificate of incorporation, e.g. `… Private Limited`; also the footer's "Built by" |
| `COMPANY_BRAND_LINE` | optional: one sentence shown as written under the heading, e.g. "Shalaghar is a product of …" (not translated) |
| `COMPANY_CIN` | the Corporate Identification Number from the MCA register, 21 characters (`U` or `L`, five digits, the state's two letters, the year, three letters, six digits); anything else is not shown |
| `COMPANY_GSTIN` | the GST registration number, 15 characters; anything else is not shown |
| `COMPANY_REGISTERED_ADDRESS` | **required**: the registered office, its lines separated by `\|` |
| `COMPANY_CORRESPONDENCE_ADDRESS` | optional: where letters go when it is not the registered office, lines separated by `\|` |
| `COMPANY_SUPPORT_EMAIL` | **required**: where support mail reaches a person; shown on the home page (pricing and About) and the sign-in page. Unset, the older `SUPPORT_EMAIL` (read by `/privacy` and `/delete-account`) is used |
| `COMPANY_SUPPORT_PHONE` | optional: a number with at least ten digits, shown as a `tel:` link |
| `COMPANY_GRIEVANCE_OFFICER_NAME` | **required**: the person below |
| `COMPANY_GRIEVANCE_OFFICER_DESIGNATION` | optional but expected: their designation, shown after the name |
| `COMPANY_GRIEVANCE_OFFICER_EMAIL` | **required**: the address that person reads |
| `COMPANY_FOUNDED_YEAR` | optional: four digits, not in the future |
| `COMPANY_DIRECTORS` | optional: names separated by `\|` |

**The grievance officer line and the DPDP Act.** The Digital Personal Data
Protection Act, 2023 asks a data fiduciary to publish the business contact
information of a person able to answer, on its behalf, the questions a data
principal raises about the processing of their personal data (s.8(9); a Data
Protection Officer only where the company is notified as a Significant Data
Fiduciary), to run a way of redressing their grievances (s.8(10)), and lets a
data principal complain to the Data Protection Board of India once that way has
been used (s.13). The DPDP Rules, 2025, as read for this page and for counsel to
confirm, add that the contact is published
prominently on the website or app and named in every reply to a request, and
that the fiduciary publishes the period in which it answers a grievance. The
page therefore shows, under "Grievance Officer under the Digital Personal Data
Protection Act, 2023": the officer's name and designation, the sentence
"Write to <email> with a question or a complaint about how your personal data is
processed", and "If you are not satisfied with the answer, you may complain to
the Data Protection Board of India". It does not state a response period: the
owner decides it with counsel, and it is added as a sentence when it is known.
For a school's pupils the school is the data fiduciary and the company its
processor (decision 0002); the company is the fiduciary for its own records,
such as an expert's application and a school's registration. Have counsel read
the final text before launch.

Terms of use are not linked from the site until the owner provides them; there
is no placeholder page.
<!-- end company-site -->

**Passes are not on sale until these are set** (loose ends, 18 Oct 2026). `/account/plan` offers a plan with "Pay"
only when the gateway is not off and none of the required company details above is missing (`saleOpen` in
`src/lib/pass-orders.ts`): the tax invoice must be able to name its seller. Without them every offer reads
NOT_ON_SALE, for every role, with no other sign on the person's page, which is how the development server stood on
18 October (no `COMPANY_*` set): the checkout panel could not be opened there. Set the company's secrets before
making a plan active, and check `/account/plan` as a teacher once after.

## Open items before the first real school

- **Raw SQL and the clock** (loose ends, 18 Oct 2026; settled the same day). Migration `20261018062120_vidura_references`
  stamped its five rows with `CURRENT_TIMESTAMP`, which a `timestamp without time zone` column takes as the session's
  wall time; the database's zone is Asia/Kolkata here and on Fly, so the sources showed as added five and a half hours
  ahead. Migration `20261018134500_reference_source_seed_clock` moves any seeded row dated more than an hour after its
  seed migration's own `finished_at` back to UTC, so a database that seeded in UTC is untouched. The rule that stays:
  Prisma writes UTC, and every raw SQL insert into a Prisma `DateTime` writes `now() AT TIME ZONE 'utc'`, and every
  policy or query that compares one reads `now() AT TIME ZONE 'utc'` (see the review-link policy of 16 Oct).
- **Cloudflare in front**, with the rate limits in `rate-limit.ts` as the
  second line, not the first. Proxied only with `TRUST_CLOUDFLARE=1` set on
  Fly, or every caller behind one Cloudflare edge shares one login limit; the
  flag believes `CF-Connecting-IP` only from Cloudflare's published ranges
  (`src/lib/cloudflare.ts`), so the origin's public address cannot be used to
  choose a key.
