# Go-live: the web app and the phone app

Written 2 October 2026 from the code at `a11a7aa4`, and revised the same day after the code and the other runbooks
were fixed where they disagreed (below). This runbook takes Shalaghar from nothing to a live web app
on Fly.io and a phone app in both stores. Every step names who does it, what exactly, and how to tell it worked.
Tick a box only when its check has passed. Write the date and your initials beside it.

What is being deployed: one Next.js image (`apps/web/Dockerfile`) running as two Fly process groups (`web`
and `jobs`), 470 pages, 530 API endpoints (`docs/api/openapi.json`, 3.1 MB), 62 migrations, 146 row-level
security policies on 104 tables, and 17 scheduled jobs (`apps/web/src/lib/jobs.ts`). The phone app is the Expo
project in `apps/mobile`, built by EAS.

Who is who:

- **owner**: holds the company, the accounts and the money. Signs every agreement.
- **engineer**: runs commands, edits config, reads logs. Never sees a password a person chose.
- **accountant**: the chartered accountant answering decision 0004's tax questions.
- **operator**: whoever holds the superuser flag and works in `/root` (at first, the owner).

Where something is not in the repository it is written `<fill in>`. Where a fact needs checking against a
provider's current console, it says `<confirm>`.

## Where this runbook overrides the others

The code was read for every step. Where an older runbook disagrees, the code wins:

- **Texts cannot stay on devbox in production.** `docs/runbooks/messaging.md` says to leave the transports on
  `devbox` until the template ids exist. `env.ts` refuses to boot a deployed server with `SMS_TRANSPORT=devbox`,
  and refuses a live transport with an empty `MESSAGE_TEMPLATE_IDS`. DLT registration is therefore a
  precondition of the first deploy, not a later step. WhatsApp may stay on devbox. The owner decided on
  2 October 2026 to keep this rule rather than allow devbox SMS behind a flag: a password-reset code that
  never arrives locks a person out, so the platform does not go live without real texts.
- **Cloudflare's proxy in front needs `TRUST_CLOUDFLARE=1`.** On Fly the rate limits key on `Fly-Client-IP`
  (`rate-limit.ts`). Behind Cloudflare's proxy that is Cloudflare's address, so without the flag every person
  behind one edge shares one login limit (10 per 15 minutes). With it, a request whose `Fly-Client-IP` is inside
  Cloudflare's published ranges (`src/lib/cloudflare.ts`) is keyed on `CF-Connecting-IP`; one that reaches Fly
  directly is keyed on its own address whatever headers it sends. Set the flag in the same change that turns the
  proxy on, not before.
- **A bucket is required, and the server enforces it.** `fly.toml` runs two web machines and mounts no
  volume, so without the five `STORAGE_*` bucket variables uploads would land on a disk the next deploy
  throws away. A deployed server on Fly with no bucket refuses to boot (`env.ts`); elsewhere it boots without
  one only when `STORAGE_DIR` is an absolute path, i.e. one machine with a mounted volume.
- **This replaces `docs/go-live-checklist.md`**, whose first-school step (`/register`) and Cloudflare line no
  longer match.

Fixed since this runbook was first written, in the code or in the runbook concerned, and so no longer listed
here: the SMS bodies to register are 26 (`messaging.md`); the scripts strip Prisma's pool parameters before
psql sees a URL, so the pool settings can go on `DATABASE_URL` (`deploy.md`); the image takes the browser's
push key as a build argument (3.3); `ota.yml` refuses to publish without the channel's API URL, and a phone
release refuses a loopback base (6.6); a deployed server refuses `FEES_GATEWAY_TRANSPORT=devbox` at boot;
Sentry is in `deploy.md`'s secrets table; the fixtures and the seed ask the server where it answered and refuse
a `fly proxy` tunnel; `deploy.md` says when a rollback is an image swap and when it is a restore (8.2).

## Phase 0 — Before anything

Accounts and paperwork. Times are working days, and they are estimates. Start the long ones first: DLT,
Apple, Google, Razorpay, the lawyer.

- [ ] **0.1 Register the domain and choose the app's host name** — owner

  **What.** Register the domain (shalaghar.com and shalaghar.in were free on 2 October 2026; neither is
  registered yet as far as the repository knows). Choose the host the app answers on, for example
  `app.<domain>`. Host: `<fill in>`. Same day.

  **Verify.** `dig +short NS <domain>` answers with the registrar's or DNS host's name servers.

- [ ] **0.2 Decide the phone app's permanent identifiers** — owner, engineer

  **What.** `apps/mobile/app.json` ships bundle id and package `school.edulink.app`, scheme `edulink`, slug
  `edulink`. A store never lets these change after the first upload. Keep them or change them now, before
  step 6.1. Decision: `<fill in>`.

  **Verify.** The decision is written here, and `app.json` matches it.

- [ ] **0.3 Fly.io organisation with billing** — owner

  **What.** Create the organisation and add a card. Same day.

  **Verify.** `fly orgs list` shows it.

- [ ] **0.4 Managed Postgres 16 in or near Mumbai, with point-in-time recovery** — owner, engineer

  **What.** Provider: `<fill in>` (Fly Managed Postgres, or another reachable from Fly's `bom` region). It must
  be Postgres 16 (CI tests 16), have point-in-time recovery switched on, give a direct connection (not a
  transaction pooler) for the release step, and let the owner role `CREATE ROLE`. Same day.

  **Verify.** `psql "$PROD_OWNER_URL" -tAc 'show server_version'` starts with `16.`. PITR shows as on in the
  provider's console.

- [ ] **0.5 Object storage: one bucket for uploads, one for backups** — owner, engineer

  **What.** An S3-compatible bucket (Cloudflare R2, AWS S3 in ap-south-1, Backblaze B2): `<fill in>`. Turn on
  versioning or replication. An access key limited to the bucket. A second bucket for database dumps. Same day.

  **Verify.** The provider's console shows both buckets, versioning on, and one key per bucket.

- [ ] **0.6 Email sending: an SMTP provider and the domain's mail records** — owner, engineer

  **What.** Provider: `<fill in>` (Amazon SES in ap-south-1, Postmark, or similar). Add SPF, DKIM and DMARC records
  for the sending domain. SES starts in a sandbox; leaving it takes about a day. `EMAIL_TRANSPORT=devbox` is
  fatal on a deployed server, so this blocks the first deploy.

  **Verify.** The provider shows the domain verified and sending enabled.

- [ ] **0.7 Twilio account and DLT registration for Indian SMS** — owner

  **What.** A Twilio account and a Messaging Service (`MG…`). On one DLT portal (Jio, Airtel, Vodafone Idea or
  BSNL): register the company as principal entity, a sender header, and every SMS body verbatim. Print the 21
  template bodies with `cd apps/web && npm run messages:templates`. Register the 5 bodies in
  `apps/web/src/lib/sms.ts` too: `sendResetCode` and `sendPhoneCode` (English, code category), and
  `sendPhoneChangedNotice` in en, hi and mr (the dictionary key `sms.phoneChanged`). Attach the entity id and
  header to the Messaging Service. Entity: about 2 to 7 days; header and templates about 1 to 3 days a round
  (estimates). This blocks the first deploy.

  **Verify.** The DLT portal lists 26 approved templates with ids. Keep the ids beside the template key and
  language; step 1.3 needs them.

- [ ] **0.8 WhatsApp Business sender (not needed to go live)** — owner

  **What.** A WhatsApp sender approved through Twilio, after Meta's business verification (days to weeks,
  estimate). Then one content template per message per language from the same `messages:templates` output
  (the `{{1}}` form): 21. `WHATSAPP_TRANSPORT` is never fatal, so this can follow the go-live.

  **Verify.** Twilio's console lists the sender as approved and 21 content SIDs (`HX…`).

- [ ] **0.9 The company's Razorpay account (not needed to go live)** — owner

  **What.** A Razorpay account in the company's name with KYC complete, for paid workshop seats (decision
  0004, third amendment: Razorpay Route, each expert's share held by Razorpay until the session is held), and
  **Route switched on for it** — ask Razorpay for Route on the account as a marketplace for workshops by
  verified experts; it is approved separately from the account (time not published). A few days to a week for
  the account (estimate). Schools' fees never use it (decision 0003). Until Route is on, every session is free.

  **Verify.** Razorpay shows the account activated, live keys available, and Route enabled in the dashboard.

- [ ] **0.10 The company's GST details** — owner

  **What.** Legal name, GSTIN, registered address and the two-digit GST state code. If the company has no
  GSTIN yet, registration takes about 1 to 2 weeks (estimate). Needed before any payout to an expert can be
  recorded (`gigs.refuseCompanyDetails`).

  **Verify.** The four values are written down for step 4.8.

- [ ] **0.11 The accountant's answers (paid seats only)** — owner, accountant

  **What.** Put the questions at the end of decision 0004 to the accountant: (1) TCS under section 52 of the
  CGST Act; (2) the SAC code, 998599 until advised; (3) the point of taxation; (4) whether a registered
  expert's GSTIN belongs on the family's receipt; (5) GST on the gross commission or net of the gateway's fee.
  The commit message counts four; the decision lists five. Time: `<fill in>`.

  **Verify.** Written answers filed beside `docs/decisions/0004-gigs-paid-work-for-the-platform.md`.

- [ ] **0.12 Legal opinions** — owner

  **What.** Three opinions the decisions ask for. Fintech counsel on decision 0003 (fees: a technology
  service, not aggregation), before the first school takes fees online. Counsel on decision 0004 ("Before paid
  sessions were built": the collection model, section 28 of the RTE Act, contracts with guardians of minors),
  before paid seats are switched on. Counsel's read of the DPDP Rules and `CONSENT_AGE` (decision 0002,
  store checklist item 10), before the store submission. Time: `<fill in>`.

  **Verify.** Each opinion filed beside its decision.

- [ ] **0.13 Expo account** — owner

  **What.** An Expo account (organisation) for EAS builds and updates. Same day.

  **Verify.** `npx eas-cli@latest whoami` prints the account.

- [ ] **0.14 Apple Developer Program, as an organisation** — owner

  **What.** Enrol the company. Apple needs a D-U-N-S number; getting one can take up to about two weeks, then
  enrolment one to three days (estimates).

  **Verify.** App Store Connect opens with the company's name and a Team ID.

- [ ] **0.15 Google Play Console, as an organisation** — owner

  **What.** Register the company's developer account and pass identity verification (days, estimate). A new
  personal account must run a closed test with testers for 14 days before production; an organisation account
  is said to be exempt (`<confirm>` against the current Play policy).

  **Verify.** Play Console opens with the company's name.

- [ ] **0.16 Sentry (recommended)** — owner

  **What.** A Sentry organisation and one project for the web app. Choose the data region. Sentry receives the
  person's and the school's ids as tags (`metrics.ts`), so the privacy policy must name it. Same day.

  **Verify.** The project's DSN is shown under Client Keys.

- [ ] **0.17 Privacy policy text and a support mailbox** — owner

  **What.** The app serves `/privacy` and `/delete-account` itself. The owner provides a support address that
  somebody reads (`SUPPORT_EMAIL`) and reads the policy pages against decision 0002 (store checklist items 1
  and 9).

  **Verify.** The mailbox receives a test mail.

## Phase 1 — Secrets and environment

Every value lives in Fly's secret store. The image carries no `.env` (`.dockerignore` excludes it).
`env.ts` checks the environment at boot (`src/instrumentation.ts` calls `assertEnv()`); a fatal problem stops
the server with `Refusing to start: N environment problem(s).` and the key names. "Deployed" means
`NODE_ENV=production` and a `NEXT_PUBLIC_APP_URL` that is not localhost.

- [ ] **1.1 Create the Fly app without deploying** — engineer

  **What.** From the repository root. The name in `fly.toml` is `edulink-web`; Fly names are global, so if it is
  taken, change `app` in `fly.toml` and use the new name everywhere below.

  ```bash
  fly apps create edulink-web --org <fill in>
  ```

  **Verify.** `fly apps list` shows `edulink-web` with no machines.

- [ ] **1.2 Generate the secrets on a machine the owner controls** — engineer

  **What.** Into a folder outside the repository, readable by you alone. Never paste these into chat,
  tickets or commits.

  ```bash
  umask 077 && mkdir -p ~/shalaghar-secrets && cd ~/Documents/Relay/apps/web
  npm run vapid                      # prints NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY, one run, both lines
  openssl rand -base64 48            # FILE_LINK_SECRET (32+ characters)
  openssl rand -base64 32            # FEES_SECRET_KEY (must decode to 32 bytes)
  openssl rand -base64 24 | tr -d '/+='   # the edulink_app role's password
  ```

  Copy the VAPID pair and `FEES_SECRET_KEY` into the owner's password manager as well. Losing the VAPID pair
  ends every push subscription. Losing `FEES_SECRET_KEY` means every school re-enters its gateway keys, every
  two-step sign-in is enrolled again, and every expert's sealed bank account is typed again.

  **Verify.** The public key is 87 characters, the private key 43, `FEES_SECRET_KEY` decodes to 32 bytes:
  `echo -n '<key>' | base64 -d | wc -c` prints `32`.

- [ ] **1.3 Write `~/shalaghar-secrets/prod.env`, one `NAME=value` per line** — engineer

  **What.** Fill it from the table below. Leave out what the table says to leave out.

  **Verify.** Every "required" row has a value. No value is quoted twice. The file is mode 600.

| Variable | Production | Fatal at boot when | How to make it |
| --- | --- | --- | --- |
| `DATABASE_URL` | required | unset | `postgresql://edulink_app:<password>@<host>:5432/edulink?sslmode=require`; the pool settings `&connection_limit=15&pool_timeout=20` from the first deploy (9.6: processes × 15 under Postgres's `max_connections`) — the scripts strip them for psql |
| `DATABASE_ADMIN_URL` | required | unset on the jobs process | the owner connection, same database. Used by the release step and the jobs process only |
| `NEXT_PUBLIC_APP_URL` | required | unset, or `http://` | `https://<host>`, no trailing slash. Magic links, invitations, the SSO redirect and Twilio's callback signature are built from it |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | required | missing, wrong length, or not a pair (the public half built into the image is the one compared) | `npm run vapid`, one run. Never rotate casually. The public half is also a build argument (3.2, 3.3) |
| `VAPID_SUBJECT` | required | the shipped placeholder, or not `mailto:`/`https:` | `mailto:<an address someone reads>` |
| `EMAIL_TRANSPORT` | `smtp` | `devbox` when deployed | literal `smtp` |
| `EMAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` | required | any missing or malformed | from the provider (0.6). `SMTP_PORT` 587 by default; 465 implies `SMTP_SECURE=true`; user and password go together |
| `SMS_TRANSPORT` | `twilio` | `devbox` when deployed | literal `twilio` |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | required | missing or malformed | `AC` + 32 hex; the auth token; the Messaging Service SID `MG…` (India) |
| `MESSAGE_TEMPLATE_IDS` | required | empty while SMS or WhatsApp is live | one-line JSON: `{"absence":{"sms":{"en":"1107…","hi":"…","mr":"…"},"whatsapp":{"en":"HX…"}},…}` by template key and language. Malformed JSON is only a warning: check it with `node -e 'JSON.parse(process.argv[1])' "$VALUE"` |
| `FILE_LINK_SECRET` | required | shorter than 32 characters | `openssl rand -base64 48` |
| `FEES_SECRET_KEY` | set it | set but not 32 bytes | `openssl rand -base64 32` |
| `STORAGE_BUCKET`, `STORAGE_S3_ENDPOINT`, `STORAGE_S3_REGION`, `STORAGE_S3_ACCESS_KEY_ID`, `STORAGE_S3_SECRET_ACCESS_KEY` | required | none set on Fly (or off Fly with a relative `STORAGE_DIR`), some set and some not, or an `http://` endpoint | from 0.5. R2's region is `auto`. Optional: `STORAGE_S3_PREFIX`, `STORAGE_S3_PATH_STYLE` |
| `NEXT_PUBLIC_DEFAULT_COUNTRY_CODE` | `+91` | never | the default is `+91`; set it explicitly |
| `SUPPORT_EMAIL` | recommended | never | from 0.17. Shown on `/privacy` and `/delete-account` |
| `SENTRY_DSN` | recommended | never | from 0.16 (Phase 5) |
| `WHATSAPP_TRANSPORT`, `TWILIO_WHATSAPP_FROM` | leave out | never (warning only) | Phase 5 |
| `FEES_GATEWAY_TRANSPORT` | leave out | `devbox` | `razorpay` once a school brings its own account (Phase 5). Left out (or `off`), online fees are off |
| `GATEWAY_PLATFORM_KEY_ID`, `GATEWAY_PLATFORM_SECRET_ENC`, `GATEWAY_PLATFORM_WEBHOOK_SECRET` | leave out | a key id set without the other two, or without `FEES_SECRET_KEY` | Phase 5 |
| `SSO_GOOGLE_*`, `SSO_MICROSOFT_*`, `SSO_APPLE_*` | leave out | never (half-set is a warning) | only when a school asks (Phase 5) |
| `HSTS_PRELOAD` | leave out | never | Phase 5, last |
| `APP_MIN_VERSION_*`, `APP_LATEST_VERSION_*`, `APP_STORE_URL_*`, `APP_UPDATE_MESSAGE` | leave out | never (malformed is treated as unset) | Phase 6 |
| `RETENTION_*` (eight) | leave out | never | defaults: sessions 7, tokens 7, rate limits 1, upload tickets 30, outbox 30, job runs 90, audit 730, health reads 365 days |
| `EXPO_ACCESS_TOKEN` | optional | never | an Expo access token; raises the push rate ceiling |
| `ANTHROPIC_API_KEY` | owner's decision | never | turns on machine drafts of question translations (`translate.ts`); it sends question text to Anthropic. Leave out unless the owner decides |
| `TZ`, `NODE_ENV`, `PORT` | in `fly.toml` | — | do not set as secrets |
| `APP_COMMIT` | build argument | — | stamped by the image build, not a secret |
| `TRUST_CLOUDFLARE` | only with Cloudflare's proxy on | never | `1` keys the rate limits on `CF-Connecting-IP` for requests arriving from Cloudflare's ranges (3.8) |
| `TRUST_FLY_CLIENT_IP`, `JOBS_RUNNER`, `HOSTNAME`, `API_CORS_ORIGINS`, `APP_DEEP_LINK_SCHEME`, `EVENTS_KEEPALIVE_MS`, `*_API_BASE`, `STORAGE_DIR`, `SEED_PASSWORD` | leave out | — | Fly sets `FLY_APP_NAME`, which already trusts `Fly-Client-IP`; the jobs runner sets its own `JOBS_RUNNER`, `HOSTNAME` and `PORT`; the rest are for tests and development |

- [ ] **1.4 Stage the secrets on Fly** — engineer

  **What.** Staged, so nothing restarts before the first deploy.

  ```bash
  fly secrets import --stage -a edulink-web < ~/shalaghar-secrets/prod.env
  ```

  **Verify.** `fly secrets list -a edulink-web` lists every name with a digest and no value.

- [ ] **1.5 Keep a plan for the files** — engineer

  **What.** After the first deploy passes, keep `prod.env` only in the owner's password manager and delete the
  file: `rm -P ~/shalaghar-secrets/prod.env`. To change one value later, use
  `fly secrets set NAME=value -a edulink-web`, which restarts the machines.

  **Verify.** `ls ~/shalaghar-secrets` no longer lists `prod.env` once Phase 4 is done.

## Phase 2 — Database

The app connects as `edulink_app`, which owns nothing and cannot bypass row-level security. Migrations, grants
and one-off scripts connect as the owner. Never run `db:seed`, `db:reset` or `db:push` against this database.

- [ ] **2.1 Open a terminal used for production and nothing else** — engineer

  **What.** In this terminal hold the two URLs without echoing them, and close it when done. Through a
  `localhost` tunnel (`fly proxy`, `fly mpg proxy`) `zz:fixtures`, `demo:schools`, `db:seed` and `db:reset` now
  ask the server where it answered and refuse Fly's private network; the others cannot tell production from a
  laptop. In this terminal never run `zz:fixtures`, `demo:schools`, `db:seed`, `db:reset`, `db:push`,
  `sweep`, `api:sweep`, `load:check`, `zz:token` or `zz:fleet`.

  ```bash
  cd ~/Documents/Relay/apps/web
  read -rs PROD_OWNER_URL     # paste the owner connection, press Return
  read -rs PROD_APP_URL       # paste DATABASE_URL from prod.env, press Return
  ```

  **Verify.** `psql "$PROD_OWNER_URL" -tAc 'select current_user, current_database()'` prints the owner and
  `edulink`.

- [ ] **2.2 Create the app role** — engineer

  **What.** With the password from 1.2.

  ```bash
  psql "$PROD_OWNER_URL" -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE edulink_app LOGIN PASSWORD '<from prod.env>' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE" \
    -c "GRANT CONNECT ON DATABASE edulink TO edulink_app"
  ```

  **Verify.** `psql "$PROD_OWNER_URL" -tAc "select rolsuper, rolbypassrls from pg_roles where rolname='edulink_app'"`
  prints `f|f`.

- [ ] **2.3 Apply the migrations, the grants and the policies** — engineer

  **What.** `db:migrate` is `prisma migrate deploy` as the owner, then `db-grants.mjs`, which grants the app
  role, applies `prisma/rls.sql`, and proves the app role can read and cannot rewrite the audit log. Fly's release
  step runs the same command on every deploy; running it here first separates a database problem from a
  deploy problem.

  ```bash
  DATABASE_ADMIN_URL="$PROD_OWNER_URL" DATABASE_URL="$PROD_APP_URL" npm run db:migrate
  ```

  **Verify.** `All migrations have been successfully applied.` and then
  `✓ Grants and policies restored, and edulink_app can read.`

- [ ] **2.4 Count what the database now holds** — engineer

  **What.** Compare with the commit being deployed (these are the numbers at `a11a7aa4`).

  ```bash
  psql "$PROD_OWNER_URL" -tAc "select count(*) from pg_policies where schemaname='public'"            # 146
  psql "$PROD_OWNER_URL" -tAc "select count(*) from pg_tables where schemaname='public' and rowsecurity" # 104
  psql "$PROD_OWNER_URL" -tAc "select count(*) from _prisma_migrations where finished_at is not null and rolled_back_at is null"  # 62
  ```

  **Verify.** 146, 104 and 62, or the numbers a local database migrated to the same commit gives.

- [ ] **2.5 Know what `rls:generate` and `rls:verify` are for** — engineer

  **What.** Nothing to run against production. `npm run rls:generate` rewrites `prisma/rls.sql` from the schema,
  in development, when the schema changes. `npm run rls:verify` builds its own scratch database on
  `localhost` and proves the policies there; it says nothing about production. CI's battery job runs it on
  every commit. The production proof is `db-grants.mjs`'s last line in 2.3.

  **Verify.** The battery run for the commit being deployed shows "Row-level security isolation" green.

- [ ] **2.6 Load the shared question bank** — engineer

  **What.** `quiz:import` verifies every file first and refuses the whole run if one fails; it is idempotent.

  ```bash
  DATABASE_ADMIN_URL="$PROD_OWNER_URL" npm run quiz:import
  ```

  **Verify.** No `Import refused` line, and
  `psql "$PROD_OWNER_URL" -tAc 'select count(*) from "QuizQuestion"'` matches the same count on a local
  database after `quiz:import`.

- [ ] **2.7 Confirm point-in-time recovery and take a first snapshot** — engineer

  **What.** In the provider's console, confirm PITR is on and its window. Take a manual snapshot named
  `before-go-live`.

  **Verify.** The snapshot is listed. Write PITR's window here: `<fill in>`.

## Phase 3 — The web app on Fly

`fly.toml`: app `edulink-web`, region `bom`, release command `npm run db:migrate`, rolling deploys, two process
groups (`web` serves on 3000; `jobs` runs `node scripts/jobs-runner.mjs` on loopback 3999), `min_machines_running = 2`,
a health check on `/api/health` every 30 seconds, `shared-cpu-2x` with 4 GB, `TZ=Asia/Kolkata`.

**Size, from the load wave of 4 October 2026** (`ops/load/README.md`, one `next start` process on a laptop):

- **Memory: at least 4 GB per machine.** One process held 1.1 GB after start, 1.4–2.5 GB under the school
  profiles and 3.1–3.6 GB under the college profiles, and fell back to 1.4 GB idle with no leak over 25 minutes.
  The 1 GB `fly.toml` carried before that run would be killed in the first busy hour. `fly.toml` now asks for
  4 GB (`[[vm]] memory = "4gb"`, the most a `shared-cpu-2x` takes, `<confirm>` in Fly's machine sizes).
- **Processes: one per machine, one machine per two vCPUs.** A process saturates one core's main thread (39 %
  of it in Prisma's client, 26 % of a page render in Next's flight of the dictionary) and uses one to two more
  for GC and libuv (195–294 % CPU at saturation), while the database stayed idle (at most five of 37 pooled
  connections active, no `P2028`). More capacity is more machines (`fly scale count web=N`), never a bigger
  pool. A shared vCPU is throttled under sustained load; if Fly's metrics show the web machines pinned at
  their CPU quota through the school day, move them to `performance-2x` (2 dedicated vCPUs, 4 GB) rather than
  adding shared machines (`<confirm>` prices).
- **Pool: `connection_limit=15` on every process** (9.6). Every web machine and the jobs machine is a process:
  `processes × 15 + 10 (the jobs machine's owner pool of cores × 2 + 1 = 5, the release step, scripts) + 3 (Postgres's reserved)` must stay at or under
  `max_connections`. At 100 that is five processes: four web machines and the jobs one. Past that, a
  transaction pooler or a bigger Postgres first.
- **Compression: at the proxy, not in Node.** `next.config.ts` sets `compress: false`, because Fly's proxy
  compresses every response from an `http_service` that carries no `Content-Encoding` (zstd, br or gzip by the
  client's `Accept-Encoding`, `docs.fly.io/reference/content-encoding`); there is no `fly.toml` line to add,
  the `[http_service]` above is the line. gzip of one 845 KB page cost the Node process 16.6 ms of its main
  thread. With Cloudflare's proxy in front as well, Cloudflare compresses what reaches it uncompressed and
  passes Fly's encoding through; nothing to set. Checked in 3.6.

- [ ] **3.1 Confirm CI is green on the commit to deploy** — engineer

  **What.** CI runs on reborn-digitech only.

  ```bash
  gh run list -R reborn-digitech/Edulink --branch master --limit 3
  ```

  **Verify.** The head commit's `battery` run is `completed success`, including the `image` job (container image,
  release step, health, jobs runner).

- [ ] **3.2 Choose where the image comes from** — engineer

  **What.** Option A: let CI publish it. Set the repository variables once; every green push to master then
  lands as `ghcr.io/reborn-digitech/edulink-web:<sha7>`, built with the deployment's public push key. Without
  that variable the image carries CI's throwaway key, and production refuses to boot on it ("not a pair").
  Fly may not pull a private GHCR package (`<confirm>`); making it public publishes the app's built code
  (owner's decision).

  ```bash
  gh variable set NEXT_PUBLIC_VAPID_PUBLIC_KEY --body "<the public key from 1.2>" -R reborn-digitech/Edulink
  gh variable set PUBLISH_IMAGE --body true -R reborn-digitech/Edulink
  ```

  Option B: let Fly build it from a clean checkout of the green commit (this Mac has no Docker; Fly's remote
  builder is used). `next build` needs a 4 GB heap; if the builder runs out of memory, use option A
  (`<confirm>` the builder's size).

  **Verify.** Option A: the image job's "Push to GHCR" step ran on the next push. Option B: `git status` is clean
  and `git rev-parse --short HEAD` is the green commit.

- [ ] **3.3 First deploy** — engineer

  **What.** Option A, then option B:

  ```bash
  fly deploy -a edulink-web --image ghcr.io/reborn-digitech/edulink-web:<sha7>
  fly deploy -a edulink-web --build-arg APP_COMMIT=$(git rev-parse --short HEAD) \
    --build-arg NEXT_PUBLIC_VAPID_PUBLIC_KEY=<the public key>
  ```

  A build without the push key still boots, says `[env] NEXT_PUBLIC_VAPID_PUBLIC_KEY: This build was made
  without…` in the log, and serves browsers no push; rebuild with it.

  **Verify.** The output shows the release command `npm run db:migrate`, then `No pending migrations to apply.`
  (2.3 applied them) and `✓ Grants and policies restored, and edulink_app can read.`, then the machines start.

- [ ] **3.4 Scale to two web machines and one jobs machine** — engineer

  **What.**

  ```bash
  fly scale count web=2 jobs=1 -a edulink-web
  fly scale show -a edulink-web
  fly status -a edulink-web
  ```

  Two web machines are the start, not the ceiling: each is one process for two vCPUs with 4 GB (Phase 3's
  sizing). Add web machines up to four before the pool needs a pooler (9.6).

  **Verify.** Two `web` machines with checks passing and one `jobs` machine, all `started`; `fly scale show`
  lists `shared-cpu-2x` with `4096` MB for both groups.

- [ ] **3.5 Read the boot lines** — engineer

  **What.** `fly logs -a edulink-web` for a minute after a restart.

  **Verify.** No `Refusing to start` line. Every `[env]` line is read and understood; a warning is accepted only
  if this runbook says so (for example none should name `STORAGE_BUCKET`). If the health check never passes
  and the server says it listens on the machine's name rather than `0.0.0.0`, set `HOSTNAME=0.0.0.0` under
  `[env]` in `fly.toml` and redeploy (the jobs runner overrides it with `127.0.0.1`). Untested on Fly.

- [ ] **3.6 Health answers with the commit** — engineer

  **What.**

  ```bash
  curl -s https://edulink-web.fly.dev/api/health
  ```

  **Verify.** `{"ok":true,"database":"ok","databaseMs":…,"uptimeSeconds":…,"commit":"<sha7>"}`, the commit
  being the one deployed.

  Then the proxy's compression (Node sends identity bodies since 4 October 2026) and the event stream through it:

  ```bash
  curl -s -o /dev/null -D - -H 'Accept-Encoding: zstd, br, gzip' https://edulink-web.fly.dev/login | grep -i '^content-encoding'
  read -rs TOKEN   # a minted ZZ session on staging, never a person's; press Return
  curl -sN -m 40 -H "Authorization: Bearer $TOKEN" -H 'Accept-Encoding: gzip' https://edulink-web.fly.dev/api/v1/events | head -c 300
  ```

  **Verify.** The first prints `content-encoding: zstd` (or `br`, `gzip`). The second prints the stream's first
  event or keep-alive within the keep-alive interval rather than nothing until the 40 s timeout; if it waits,
  the proxy is holding a compressed stream back: set `compress: true` again in `next.config.ts` (Node then
  encodes, and Fly passes an encoded response through untouched) and redeploy. Untested on Fly.

- [ ] **3.7 The jobs process started its schedule** — engineer

  **What.** `fly machines list -a edulink-web` for the jobs machine's id, then
  `fly logs -a edulink-web --machine <id>`.

  **Verify.** A line containing `"scheduler":"in-process","started":true`. Then `/root/jobs` after Phase 4.

- [ ] **3.8 Point the domain at Fly and get a certificate** — engineer

  **What.** At the DNS host, records for the host from 0.1 (an A and AAAA from `fly ips list`, or a CNAME to
  `edulink-web.fly.dev`). If the DNS host is Cloudflare, start with the record **DNS only** until the
  certificate is issued; to proxy it afterwards, set `fly secrets set TRUST_CLOUDFLARE=1 -a edulink-web` in the
  same change and Cloudflare's SSL mode to Full (strict) (see the top of this runbook).

  **Verify (proxied only).** Sign in from two networks: each keeps its own login limit, and
  `select ip from "Session" order by "createdAt" desc limit 2` shows the two callers' addresses, not
  Cloudflare's.

  ```bash
  fly certs add <host> -a edulink-web
  fly certs check <host> -a edulink-web
  ```

  **Verify.** `fly certs check` reports the certificate issued. `curl -sI https://<host>/login` shows
  `strict-transport-security: max-age=63072000; includeSubDomains` and a `content-security-policy` with a
  `nonce-`.

- [ ] **3.9 The public URL is the one in `NEXT_PUBLIC_APP_URL`** — engineer

  **What.** If 1.3 used a placeholder, set the real one now: `fly secrets set NEXT_PUBLIC_APP_URL=https://<host> -a edulink-web`.
  The session cookie is `__Host-edulink_session`, bound to one host: changing the host later signs everybody out.

  **Verify.** `curl -s https://<host>/api/health` answers as in 3.6.

- [ ] **3.10 An uptime monitor outside Fly** — engineer

  **What.** Service: `<fill in>`. Check `/api/health`, `/login` and `/` every minute, alerting the owner and
  the engineer.

  **Verify.** Stop nothing; read the monitor's first green results.

## Phase 4 — First run on production

Nothing in this phase writes test data. Which scripts are safe here:

| Safe against production | Never against production |
| --- | --- |
| `curl` of pages and `/api/health`; Lighthouse on signed-out pages | `npm run sweep` (mints sessions for seeded and ZZ actors, posts attendance, pauses memberships) |
| `npm run superuser`, `npm run appadmin`, `npm run expert:invite` (they write what they say) | `npm run api:sweep` (calls every door as every role and writes ZZ rows) |
| `npm run quiz:import` (verifies first, idempotent) | `npm run load:check`, `npm run zz:fleet`, the k6 scripts in `ops/load` |
| `npm run files:check` (reports only; `files:reclaim` deletes) | `npm run zz:fixtures`, `npm run zz:token`, `npm run demo:schools` |
| `ops/backup.sh` (reads) | `npm run db:seed`, `db:reset` (both refuse a tunnel now; never try), `db:push` |
| `npm run sso:check` (reads the environment it is given) | `npm run data:audit` (mints sessions for real people and writes a report of real data into `docs/`): only on a restored copy (9.4) |

- [ ] **4.1 The signed-out pages answer** — engineer

  **What.**

  ```bash
  for p in / /login /privacy /delete-account; do curl -s -o /dev/null -w "$p %{http_code}\n" https://<host>$p; done
  curl -s https://<host>/api/v1/app/version
  curl -s -o /dev/null -w "/dev/payments %{http_code}\n" https://<host>/dev/payments
  ```

  **Verify.** 200 for the four pages; the version answer is JSON with a minimum of `0.0.0`; `/dev/payments` is 404.

- [ ] **4.2 The owner makes their own account** — owner

  **What.** There is no sign-up for an operator, and `npm run superuser` does not create accounts. The owner opens
  `https://<host>/join/parent` and signs up with their own email and a password they type themselves (an
  account with no school). Nobody else types it.

  **Verify.** The owner lands on `/parent/link` signed in.

- [ ] **4.3 Grant the superuser flag** — engineer

  **What.** In the production terminal (2.1). The image has no `tsx` and no scripts, so this runs from a checkout.

  ```bash
  DATABASE_ADMIN_URL="$PROD_OWNER_URL" npm run superuser -- <owner's email>
  ```

  **Verify.** `Granted superuser for <name> <email>.` and `They can now open /root.` The owner opens `/root`.
  `/root/audit` shows `superuser.grant`.

- [ ] **4.4 The operator turns on two-step sign-in** — operator

  **What.** `/account`, two-step sign-in, with an authenticator app. It needs `FEES_SECRET_KEY` (set in 1.3).

  **Verify.** Sign out and in again: the code is asked for.

- [ ] **4.5 Appoint the content team** — operator

  **What.** `/root/content-team`, or `DATABASE_ADMIN_URL="$PROD_OWNER_URL" npm run appadmin -- <email>` for a
  person who already has an account.

  **Verify.** That person opens `/appadmin`.

- [ ] **4.6 Decide what demo data production holds** — owner

  **What.** `npm run demo:schools` refuses a non-local database by design, and its shared password
  (`Relay-Demo-2026`) must never exist in production. Recommended: no demo schools in production; demos run on a
  separate deployment (`<fill in>`). One exception the stores need: a review school made by hand at
  `/root/onboard` with one reviewer account whose password the owner sets and keeps (6.13). Decision: `<fill in>`.

  **Verify.** `psql "$PROD_OWNER_URL" -tAc "select count(*) from \"User\" where email like '%@demo.relay.test'"` prints `0`, and
  `psql "$PROD_OWNER_URL" -tAc "select count(*) from \"School\" where name like 'ZZ%'"` prints `0`.

- [ ] **4.7 Prove email, SMS and push through the product** — owner, engineer

  **What.** Without copying production keys to a laptop. Email: sign out, `/login`, "Email me a link", to the
  owner's address. SMS: the owner adds their mobile number on `/account`; the confirm code is one of the
  DLT-registered bodies. Push: with the image built with the public key (3.3), the browser's push switch on
  `/account`; the phone's push in Phase 6.

  **Verify.** The mail arrives and its link opens `https://<host>`. The code arrives on the handset (Twilio's
  "delivered" is not proof: DLT filtering happens at the carrier). Read the handset.

- [ ] **4.8 Enter the company's details for invoices** — operator

  **What.** `/root/gigs`, the company form: legal name, GSTIN, address, the two-digit state code from 0.10. Leave
  the invoice prefix `SG` and the SAC `998599` until the accountant says otherwise (0.11).

  **Verify.** The payouts card no longer names missing company details.

- [ ] **4.9 Leave the switches off** — operator, engineer

  **What.** Confirm each is off:

  - Paid workshop seats: the payments switch on `/root/gigs` (`paymentsEnabled`, off by default). With no
    `GATEWAY_PLATFORM_KEY_ID` the gig transport is `off` anyway.
  - Online fees: `FEES_GATEWAY_TRANSPORT` unset.
  - WhatsApp: `WHATSAPP_TRANSPORT` unset (devbox).
  - Each school's texts: off until that school's office switches them on at `/admin/messaging`.
  - `HSTS_PRELOAD`, `SSO_*`, `APP_MIN_VERSION_*`: unset.
  - SMS cannot be off: `SMS_TRANSPORT` must be `twilio` to boot. The per-school switches are the brake.

  **Verify.** `fly secrets list -a edulink-web` has none of the unset names; `/root/gigs` shows payments off.

- [ ] **4.10 The jobs run on their schedule** — operator

  **What.** `/root/jobs` an hour after 3.7, and again the next morning.

  **Verify.** All 17 jobs listed. The minutely `circulars:deliver` and `messages:send` and the quarter-hourly
  `jobs:watch` have recent runs. Next morning `retention:sweep` (04:00) has run, and the `health:digest`
  mail (07:00 IST) has reached the operator.

- [ ] **4.11 The metrics page** — operator

  **What.** `/root/metrics`.

  **Verify.** Errors in the last hour: 0. The error-tracker badge reads `log` until 5.3, then `SENTRY_DSN`.

## Phase 5 — Messaging and integrations

In this order. Each item is switched on, proved, and then the next begins.

- [ ] **5.1 Razorpay: the company's account for paid seats** — engineer, owner

  **What.** Live keys from 0.9. Seal the secret under `FEES_SECRET_KEY`; the script reads the key from the
  shell, not from `.env`, and prints one line. Keep both out of the shell's history:

  ```bash
  read -rs FEES_SECRET_KEY && export FEES_SECRET_KEY    # paste the production FEES_SECRET_KEY
  read -rs RZP_SECRET                                   # paste the Razorpay key secret
  npm run --silent secret:seal -- gateway:platform:secret "$RZP_SECRET"
  unset RZP_SECRET FEES_SECRET_KEY
  openssl rand -hex 32                                  # the webhook secret
  fly secrets set -a edulink-web GATEWAY_PLATFORM_KEY_ID=rzp_live_… GATEWAY_PLATFORM_SECRET_ENC=v2.… GATEWAY_PLATFORM_WEBHOOK_SECRET=…
  ```

  In Razorpay's dashboard add a webhook to `https://<host>/api/webhooks/gateway/sessions` for
  `payment.captured`, `payment.failed`, `refund.failed`, `transfer.processed`, `transfer.failed`,
  `product.route.under_review`, `product.route.needs_clarification` and `product.route.activated`, with the
  same webhook secret.

  <!-- plans-pay (17 Oct 2026) -->
  **Passes for the plans (decision 0006).** Add a second webhook, to `https://<host>/api/webhooks/razorpay/platform`,
  for `payment.captured`, `payment.failed` and `refund.failed`, with the same webhook secret: it opens a pass bought
  when the buyer closed the browser before the checkout's own confirm. Passes go on sale per plan once the plan is
  active and priced on `/root/features` and the company's details are complete on `/root/gigs`; they do not wait for
  the paid-seats switch. Test first in Razorpay's test mode: a test teacher buys a month of the Teacher plan on
  `/account/plan`, the plan's doors open at once, the invoice downloads, and the operator refunds it from
  `/root/features` (the doors close again).
  <!-- end plans-pay -->

  **First in Razorpay's test mode.** With the test key and a test webhook against a staging host: one expert
  presses "Link with Razorpay" on their profile, the account reaches *activated* (the card says so), the
  operator turns paid seats on, a test family buys a seat, the order carries the transfer on hold (Razorpay's
  Route dashboard shows it *on hold*), the operator marks it delivered, and after 48 hours the hourly job
  releases it (the dashboard shows the hold off; the seat reads "Released to your bank"). Then the same with
  live keys.

  **Verify.** The sealed value looks like `v2.<nonce>.<body>.<tag>`. After the restart, no `[env]` line names
  `GATEWAY_PLATFORM`. On `/root/gigs` the "Razorpay Route status" card ticks the gateway, the webhook and the
  company; the fourth tick comes with the first expert Razorpay activates ("Link every ready expert" sends
  them all). The switch cannot be turned on before all four (`gigs.refuseRouteNotReady`). Paid seats stay
  off until 0.11 and 0.12 are answered; when they are, the operator turns the switch on and buys one ₹50 seat
  with their own family account, then refunds it, before any school sees it.

- [ ] **5.2 Online fees for a school (when one asks)** — engineer, operator

  **What.** After the decision-0003 opinion (0.12): `fly secrets set FEES_GATEWAY_TRANSPORT=razorpay -a edulink-web`.
  Each school opens its own Razorpay account, enters its keys at `/admin/fees/settings`, and registers
  `https://<host>/api/webhooks/razorpay/<schoolId>` for `payment.captured`, `payment.failed` and
  `refund.processed`. The platform holds no money and no platform key.

  **Verify.** The school's settings page accepts the keys; one real small fee paid and refunded by the school.

- [ ] **5.3 Twilio: WhatsApp and the full template-id map** — engineer

  **What.** When 0.8 is done, add the 21 content SIDs under `whatsapp` in `MESSAGE_TEMPLATE_IDS`, then set
  `WHATSAPP_TRANSPORT=twilio` and `TWILIO_WHATSAPP_FROM=whatsapp:+<number>`. Delivery status needs no console
  setting: each message carries its own callback `https://<host>/api/webhooks/twilio/status/<schoolId>`,
  signed against `NEXT_PUBLIC_APP_URL`.

  **Verify.** At a school, an admin presses "Send a test to me" on `/admin/messaging`; the row's status and the
  phone in the admin's hand agree.

- [ ] **5.4 Sentry** — engineer

  **What.** `fly secrets set SENTRY_DSN=<dsn> -a edulink-web`. Name Sentry in the privacy policy as a processor.

  **Verify.** `/root/metrics` shows the `SENTRY_DSN` badge. The first real error appears in Sentry with the route
  pattern and no body, cookie or query string.

- [ ] **5.5 Single sign-on, only when a school asks** — engineer

  **What.** Register the redirect URI at the provider: `https://<host>/api/sso/google/callback` (or `microsoft`,
  `apple`). Set every variable of that provider (`SSO_GOOGLE_CLIENT_ID`, `SSO_GOOGLE_CLIENT_SECRET`; Microsoft adds
  `SSO_MICROSOFT_TENANT`; Apple needs four). Run `npm run sso:check` with the same variables in the production
  terminal.

  **Verify.** `sso:check` prints the exact redirect URI and fetches the provider's keys; one real sign-in by hand.

- [ ] **5.6 HSTS preload, last** — owner, engineer

  **What.** Only once the domain is final and every subdomain is on HTTPS; browsers keep the promise for months.
  `fly secrets set HSTS_PRELOAD=1 -a edulink-web`, then submit the domain at hstspreload.org.

  **Verify.** `curl -sI https://<host>/login` shows `…; includeSubDomains; preload`.

- [ ] **5.7 Verified app links, last** — engineer

  **What.** Not built. It needs `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` served
  by the web app, and `ios.associatedDomains` and Android `intentFilters` with `autoVerify` in `app.json`: a
  native change, so a store release.

  **Verify.** Apple's and Google's validators accept the domain.

## Phase 6 — The phone app

`apps/mobile`: `app.config.ts` wraps `app.json`, ties `runtimeVersion` to the app version, and adds the updates
URL only when `EAS_PROJECT_ID` is set. `eas.json` has `development`, `staging` and `production` profiles; the
production API URL is an EAS environment variable, never a file. Run EAS commands from `apps/mobile`.

- [ ] **6.1 Set the version and the identifiers** — engineer

  **What.** Apply 0.2. Set `expo.version` in `app.json` to the first store version: `<fill in>` (it is `0.1.0`
  today). `app.config.ts` already sets `ios.infoPlist.ITSAppUsesNonExemptEncryption: false` (standard HTTPS
  only; `apps/mobile/store/privacy-answers.md` asks to confirm).

  **Verify.** `npx expo config --type public` shows the version, the identifiers and the plist key.

- [ ] **6.2 Create the EAS project** — engineer

  **What.** `npx eas-cli@latest init`. `app.config.ts` is dynamic, so EAS cannot write the id itself: keep it
  as `EAS_PROJECT_ID` in three places.

  ```bash
  export EAS_PROJECT_ID=<id>
  npx eas-cli@latest env:create --environment production --name EAS_PROJECT_ID --value "$EAS_PROJECT_ID" --visibility plaintext
  gh variable set EAS_PROJECT_ID --body "$EAS_PROJECT_ID" -R reborn-digitech/Edulink
  gh secret set EXPO_TOKEN -R reborn-digitech/Edulink     # prompts; paste an Expo access token
  ```

  The build worker evaluates `app.config.ts` itself, so the EAS variable is what puts the updates URL and the
  push project id into the binary (`<confirm>` with the first build's config).

  **Verify.** `EAS_PROJECT_ID=<id> npx expo config --type public` shows `updates.url` `https://u.expo.dev/<id>`.

- [ ] **6.3 The production API URL** — engineer

  **What.**

  ```bash
  npx eas-cli@latest env:create --environment production --name EXPO_PUBLIC_API_URL --value https://<host> --visibility plaintext
  ```

  `eas.json`'s staging profile points at `https://staging.edulink.example`, a placeholder: set a real staging host
  or stop using that profile. Staging host: `<fill in>`.

  **Verify.** `npx eas-cli@latest env:list --environment production` lists both variables.

- [ ] **6.4 Push credentials for both platforms** — engineer

  **What.** iOS: `npx eas-cli@latest credentials -p ios` and let EAS create the APNs key. Android: create a
  Firebase project with an Android app for `school.edulink.app`, download `google-services.json` (not into git),
  and give it to the build as a file variable — `app.config.ts` sets `android.googleServicesFile` from it:
  `npx eas-cli@latest env:create --environment production --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret`.
  Then upload the FCM v1 service-account key with `npx eas-cli@latest credentials -p android`
  (`mobile-release.md` has the menu path). Without both an Android phone gets no push token.

  **Verify.** Both appear under the project's credentials on expo.dev. Push proved in 6.10.

- [ ] **6.5 Sign the over-the-air updates, before the first store build** — owner, engineer

  **What.** On a machine the owner controls, never in a workflow. The certificate is built into the binary, so
  it must be in the first store build.

  ```bash
  npx expo-updates codesigning:generate --key-output-directory keys --certificate-output-directory certs --certificate-validity-duration-years 10 --certificate-common-name "Shalaghar"
  ```

  The private key (`keys/`, ignored by `*.pem`) goes to the owner's password manager and a repository secret.
  The engineer commits the certificate, adds `codeSigningCertificate` and
  `codeSigningMetadata: { keyid: "main", alg: "rsa-v1_5-sha256" }` under `updates` in `app.config.ts`, and passes
  `--private-key-path` to `eas update` in `ota.yml`.

  **Verify.** `git status` shows no file under `keys/`. `npx expo config --type public` shows the code-signing
  metadata.

- [ ] **6.6 Give the update workflow its API URLs** — engineer

  **What.** `.github/workflows/ota.yml` bundles each update with the channel's API URL from a repository
  variable and `--environment production` (`preview` for staging), and refuses to run without it.

  ```bash
  gh variable set EXPO_PUBLIC_API_URL_PRODUCTION --body https://<host> -R reborn-digitech/Edulink
  gh variable set EXPO_PUBLIC_API_URL_STAGING --body https://<staging host> -R reborn-digitech/Edulink
  ```

  **Verify.** A staging update's bundle talks to the staging host (6.15).

- [ ] **6.7 Decide the Google button** — owner, engineer

  **What.** The phone's sign-in screen always shows "Continue with Google" (`src/app/(auth)/index.tsx`), whether
  or not the server has Google SSO. With SSO off it fails, and a reviewer will press it. Either hide it when the
  server offers no provider, or set up Google SSO (5.5) and answer Apple Guideline 4.8 (decision 0002, store
  checklist item 6). Decision: `<fill in>`.

  **Verify.** On the build, the button either is absent or completes a sign-in.

- [ ] **6.8 Build for both stores** — engineer

  **What.** The production profile auto-increments the build number (`appVersionSource: remote`).

  ```bash
  cd ~/Documents/Relay/apps/mobile && export EAS_PROJECT_ID=<id>
  npx eas-cli@latest build --profile production --platform all
  ```

  **Verify.** Two finished builds on expo.dev. On a device, the sign-in screen's footer prints the API base: it
  must read `https://<host>`.

- [ ] **6.9 Internal testing for two weeks** — engineer, owner

  **What.** iOS: fill `ascAppId` and `appleTeamId` in `eas.json` (they are placeholders), then
  `npx eas-cli@latest submit --profile production --platform ios` to TestFlight. Android: create the app in Play
  Console and upload the first `.aab` by hand, then `npx eas-cli@latest submit --profile production --platform android`
  (internal track, draft). Test with `docs/mobile/ux-checklist.md`. Problems reach the school's audit log through
  More, then Report a problem.

  **Verify.** Two weeks; crash-free sessions at or above 99.5 % (counted from `APP_CRASH_REPORTED` audit rows
  against sessions, per `mobile-release.md`).

- [ ] **6.10 Push on real phones** — engineer

  **What.** On a TestFlight phone and a Play internal phone, sign in with the review school's reviewer account
  (4.6) and allow notifications. The review school's admin then sends that account a message.

  **Verify.** Both phones receive the notification.

- [ ] **6.11 Store listings** — owner

  **What.** Copy from `apps/mobile/store/listing.en.md`, `listing.hi.md` and `listing.mr.md`. Replace
  `SUPPORT_EMAIL`, `PRIVACY_URL` (`https://<host>/privacy`), `ACCOUNT_DELETION_URL` (`https://<host>/delete-account`).
  Have a native speaker read the Hindi and Marathi. Screenshots: six per language from a device on the ZZ
  fixture school locally, so no real child appears.

  **Verify.** Character counts within `apps/mobile/store/README.md`'s limits; no ALL-CAPS placeholder left.

- [ ] **6.12 The privacy questionnaires** — owner

  **What.** Apple App Privacy and Google Data safety from `apps/mobile/store/privacy-answers.md`. Not the Kids
  Category; not Designed for Families; Play's target audience a mixed audience including under-13s. Close
  decision 0002's store checklist items 1 to 4 and 8 to 10.

  **Verify.** Every "collected" line on both forms maps to a row of decision 0002.

- [ ] **6.13 A reviewer's sign-in** — operator

  **What.** Both stores need a working account, since nobody can sign up in the app. Use the review school from
  4.6; give the reviewer a teacher or guardian account; the owner sets the password and puts it in the review
  notes only.

  **Verify.** The account signs in on the TestFlight build.

- [ ] **6.14 Release and tell the API** — owner, engineer

  **What.** Play: staged 10 %, 50 %, 100 %, a day apart at least, watching crashes. App Store: phased release. Then:

  ```bash
  fly secrets set -a edulink-web APP_LATEST_VERSION_IOS=<version> APP_LATEST_VERSION_ANDROID=<version> \
    APP_STORE_URL_IOS=https://apps.apple.com/app/id<fill in> \
    APP_STORE_URL_ANDROID=https://play.google.com/store/apps/details?id=<package from 0.2>
  git tag mobile-v<version> <commit built> && git push reborn mobile-v<version> && git push origin mobile-v<version>
  ```

  Leave `APP_MIN_VERSION_*` unset until a build must be retired. The tag is what `scripts/ota-guard.mjs` compares
  against; with no tag, no update may ship.

  **Verify.** `curl -s https://<host>/api/v1/app/version` shows the latest versions and both store links.
  `git ls-remote --tags reborn mobile-v*` lists the tag.

- [ ] **6.15 The first over-the-air update** — engineer

  **What.** A JavaScript-only change. Staging channel first, then production:

  ```bash
  gh workflow run ota.yml -R reborn-digitech/Edulink -f channel=staging -f message="<one line>"
  ```

  **Verify.** The workflow's "The update is JS only" step passes; a staging phone takes the update and still
  shows `https://<host>` (or the staging host) in the sign-in footer. Then the same for `production`.

## Phase 7 — Go-live day

- [ ] **7.1 Freeze and record** — engineer

  **What.** No deploy that day except a fix. Record the commit, the image, the time.

  **Verify.** `/api/health`'s commit matches the record.

- [ ] **7.2 Who watches what** — owner, engineer, operator

  **What.** Engineer: `fly logs` for `"level":"error"` lines, `/root/metrics` (errors in the last hour, p95),
  Sentry, the uptime monitor. Operator: `/root` (usage), `/root/jobs`, `/root/audit`. Owner: the school's office,
  by phone.

  **Verify.** Each person has the pages open before 7.3.

- [ ] **7.3 Onboard the first school** — operator

  **What.** `/root/onboard`: school name, slug, contact email, timezone `Asia/Kolkata`, board, lowest and
  highest grade, city and state; a plan (made first at `/root/plans`, optional) or a trial; the school's
  contact person; a partner's commission if any; the first admin's email. The whole onboarding is one
  transaction; the invitation mail goes after it commits. A school the operator adds is approved as it is made.

  **Verify.** The toast names the school and its join code. `/root/audit` shows the onboarding rows. The
  invitation reaches the admin; if the page says the mail did not go, resend from the school's page.

- [ ] **7.4 The school's first hour** — operator, owner

  **What.** In order, each checked before the next: the admin accepts the invitation and signs in; turns on
  two-step sign-in; switches SMS on at `/admin/messaging` and presses "Send a test to me"; invites one teacher;
  the teacher marks one register; one guardian joins and sees the mark. Only then are the families invited.

  **Verify.** Each of the six seen on screen, and the test text on the admin's handset.

- [ ] **7.5 Self-registered schools** — operator

  **What.** A school that registers itself at `/register` waits in the "Awaiting check" queue on `/root`.
  Approve only a school whose office the owner has spoken to.

  **Verify.** The queue is empty or every entry is known.

- [ ] **7.6 End of day** — engineer, operator

  **What.** Read `/root/jobs`, `/root/metrics`, Sentry and the uptime monitor. Note anything odd here.

  **Verify.** No job overdue; errors explained; next morning's health digest arrives.

## Phase 8 — Rollback

- [ ] **8.1 Roll the web app back to the previous image** — engineer

  **What.** On Fly's machines platform there is no `fly releases rollback` (`<confirm>` with `fly releases --help`);
  deploy the previous image again.

  ```bash
  fly releases -a edulink-web --image
  fly deploy -a edulink-web --image <previous image reference>
  ```

  The release command runs again with the older image's migrations folder, against a database that may be
  ahead of it. `<confirm>` on staging that `prisma migrate deploy` only warns about applied migrations it
  does not have.

  **Verify.** `/api/health` reports the previous commit.

- [ ] **8.2 Remember that migrations only go forward** — engineer

  **What.** There are no down migrations. `deploy.md`'s rule is add-only for one release, so the old code runs on
  the new schema. `a11a7aa4`'s `20261002100602_gig_company_collects` renamed and dropped columns, so no image
  older than it runs on a database that has it. The first production deploy is not affected; never roll back
  across that migration. A mistake is fixed by a new forward migration.

  **Verify.** Before any rollback, ask the database what the target image does not know, and read each listed
  migration for a `DROP` or `RENAME` (any one means restore from the pre-deploy snapshot, 8.4, not an image swap;
  `deploy.md`, Rollback):
  `docker run --rm -e DATABASE_URL="$PROD_OWNER_URL" ghcr.io/reborn-digitech/edulink-web:<target sha7> prisma migrate status`.

- [ ] **8.3 A migration that failed half-way** — engineer

  **What.** The release step stops; the old machines keep serving. Repair the database by hand as the owner,
  then mark the migration and deploy again.

  ```bash
  psql "$PROD_OWNER_URL" -c 'select migration_name, started_at, finished_at, rolled_back_at, logs from _prisma_migrations order by started_at desc limit 3'
  DATABASE_ADMIN_URL="$PROD_OWNER_URL" node scripts/with-admin-db.mjs npx prisma migrate resolve --rolled-back <migration_name>
  ```

  Use `--applied` instead if the repair completed the migration by hand.

  **Verify.** `npm run db:migrate` (2.3) ends with the grants line.

- [ ] **8.4 Restore the data** — engineer, owner

  **What.** Point-in-time recovery into a new database at the provider; never over the live one. Then point both
  secrets at it; the release step applies grants and policies on the deploy.

  ```bash
  fly secrets set -a edulink-web DATABASE_URL=<new app URL> DATABASE_ADMIN_URL=<new owner URL>
  ```

  **Verify.** `/api/health` 200; the counts in 2.4; a school's last known record present.

- [ ] **8.5 Roll the phone back** — engineer

  **What.** An update: republish the previous update group on the production branch
  (`npx eas-cli@latest update:list --branch production`, then `update:republish --group <id>`; or
  `update:rollback`, `<confirm>` with the eas-cli in use). A store build cannot be recalled: halt Play's staged
  rollout, pause Apple's phased release, ship a fixed build. To stop a broken build being used, raise
  `APP_MIN_VERSION_IOS` and `APP_MIN_VERSION_ANDROID` to a version fully rolled out on both stores.

  **Verify.** A test phone shows the previous update, or the update-required screen.

- [ ] **8.6 Switch things off without a deploy** — operator, engineer

  **What.** Paid seats: the switch on `/root/gigs` (refunds still go). A school's texts: its own switches at
  `/admin/messaging`. WhatsApp: `fly secrets set WHATSAPP_TRANSPORT=devbox`. SMS cannot go to devbox (the server
  would refuse to boot): use the schools' switches.

  **Verify.** `/admin/messaging`'s overview shows nothing sent after the switch.

## Phase 9 — Week one

- [ ] **9.1 The jobs, every morning** — operator

  **What.** `/root/jobs` and the 07:00 health digest. `retention:sweep` runs at 04:00 with the defaults in 1.3;
  the audit log is kept two years (`RETENTION_AUDIT_DAYS`, 0 keeps it for ever). `jobs:watch` mails the operator
  about any job past its own interval.

  **Verify.** Seven mornings without an overdue job, or each one explained.

- [ ] **9.2 Give the nightly dump a home** — engineer, owner

  **What.** `ops/backup.sh` is not in the image and no job runs it. Choose where: `<fill in>` (a scheduled
  workflow holding the owner URL as a secret, or a small machine with `pg_dump` and the AWS CLI). Copy each dump
  to the backup bucket (`BACKUP_BUCKET`).

  ```bash
  DATABASE_ADMIN_URL="$PROD_OWNER_URL" BACKUP_DIR=./backups BACKUP_BUCKET=s3://<backup bucket> ops/backup.sh
  ```

  **Verify.** `backup ./backups/edulink-<stamp>.dump (<size>) in <n>s` and `copied to s3://…`.

- [ ] **9.3 The restore drill** — engineer

  **What.** Into a new database at the provider, not onto a laptop: the dump holds children's records. Give
  `db-grants.mjs` both URLs of the restored database (`backup-restore.md`'s command sets only the owner's, so the
  script's read check would use `.env`'s `DATABASE_URL`, another database).

  ```bash
  TARGET_ADMIN_URL=<owner URL of edulink_restore> ops/restore.sh backups/edulink-<stamp>.dump edulink_restore
  DATABASE_ADMIN_URL=<owner URL of edulink_restore> DATABASE_URL=<app URL of edulink_restore> node scripts/db-grants.mjs
  ```

  **Verify.** The grants line, the counts in 2.4, and `select count(*) from "School"` equal to production's. Add a
  row to the drill record in `backup-restore.md` with the times.

- [ ] **9.4 The data audit, on the restored copy** — engineer

  **What.** Against `edulink_restore` from 9.3, for the real school:
  `DATABASE_URL=<owner URL of edulink_restore> DATA_AUDIT_SCHOOLS=<slug> npm run data:audit`. It writes
  `docs/data-audit/latest.md` with real data: never commit that run's report. Drop `edulink_restore` afterwards.

  **Verify.** No FAIL. `git checkout docs/data-audit/latest.md` before any commit.

- [ ] **9.5 Compare load and speed with the baselines** — engineer

  **What.** Read `/root/metrics` p95 and Fly's metrics daily. The baselines are the 4 October 2026 numbers, one
  process on a laptop (`ops/load/README.md`, "Baselines"): ZZ Northgate light profile (2 teachers, 5 guardians)
  register p95 151 ms and overview 296 ms; moderate (10 + 40) 974 ms and 1,912 ms; plan (30 + 200) 8.8 s and
  9.6 s; no errors (1 October was 111 / 178 ms, 732 / 1,010 ms and 4.5 / 5.3 s: the schema's growth halved one
  process's capacity, LOAD-1). The college day at ZZ Vidya holds a lecture-mark p95 under 230 ms up to 4 faculty,
  25 students and 10 guardians per process and saturates at about 45–50 API requests a second. Targets: register
  p95 under 300 ms, overview p95 under 800 ms. Lighthouse on the phone preset (local production build):
  performance 82 to 90, accessibility 100, LCP 3.5 to 4.5 s. Memory per web machine under 3.6 GB. A load run
  belongs on a staging deployment with the ZZ fixture, from a second machine, never on production.

  **Verify.** Production's p95 at the first school's busiest hour is under the targets, or a decision is written.

- [ ] **9.6 Size the database pool** — engineer

  **What.** `DATABASE_URL` carries `?connection_limit=15&pool_timeout=20` from 1.3 (the scripts strip them
  before psql sees the URL). Check Postgres's `max_connections` covers every process:
  `processes × 15 + 10 + 3`, with two web machines and the jobs machine `3 × 15 + 13 = 58`, with four web
  machines `5 × 15 + 13 = 88` (`deploy.md`, capacity). Do not raise the limit to buy speed: the load wave of
  4 October 2026 never had more than five connections active at once out of 37, while the Node process was
  saturated; a bigger pool only lets fewer processes fit.

  ```bash
  psql "$PROD_OWNER_URL" -tAc "show max_connections"
  psql "$PROD_OWNER_URL" -tAc "select count(*) from pg_stat_activity where usename = 'edulink_app'"
  ```

  **Verify.** The next deploy's release step still ends with the grants line; `max_connections` is at least the
  sum above; the app role's connections at the busiest hour stay under `web machines × 15`.

- [ ] **9.7 Confirm production holds only real things** — engineer

  **What.** Read-only counts.

  ```bash
  psql "$PROD_OWNER_URL" -tAc "select count(*) from \"School\" where name like 'ZZ%' or name in ('Riverside Primary School','Oakfield Academy','Sunrise Public School','Saraswati Vidya Mandir')"
  psql "$PROD_OWNER_URL" -tAc "select count(*) from \"User\" where email like '%@demo.relay.test' or email like '%@riverside.school'"
  psql "$PROD_OWNER_URL" -tAc "select count(*) from \"Session\" where \"userAgent\" in ('sweep','zz-walk','vitest')"
  ```

  **Verify.** All three print `0`.

## Not yet possible until

| Blocker | What it blocks | Who clears it |
| --- | --- | --- |
| The domain is registered (0.1) | `NEXT_PUBLIC_APP_URL`, the certificate, the privacy and store URLs | owner |
| An SMTP provider with the domain's mail records (0.6) | the first boot (`EMAIL_TRANSPORT=devbox` is fatal) | owner, engineer |
| Twilio, a DLT entity and header, 26 approved SMS bodies (0.7) | the first boot (`SMS_TRANSPORT=devbox` and an empty `MESSAGE_TEMPLATE_IDS` are fatal) | owner |
| Managed Postgres 16 with PITR (0.4) | everything | owner, engineer |
| An uploads bucket (0.5) | the first boot (a deployed server on Fly refuses to start without one) | owner, engineer |
| The image built with `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (3.2, 3.3) | browser push; with option A, the first boot | engineer |
| The company's Razorpay account with KYC (0.9) | paid workshop seats | owner |
| The company's GST details on `/root/gigs` (0.10, 4.8) | recording any payout to an expert | owner, operator |
| The accountant's answers to decision 0004 (0.11) | the first real tax invoice; paid seats on | accountant |
| The decision-0004 legal opinion (0.12) | paid seats on | owner |
| The decision-0003 legal opinion (0.12) | the first school taking fees online | owner |
| Counsel's DPDP read, decision 0002 item 10 (0.12) | the store submission | owner |
| An approved WhatsApp sender and 21 content SIDs (0.8) | WhatsApp to families | owner |
| An Expo account and EAS project (0.13, 6.2) | any build or update | owner, engineer |
| Apple Developer with D-U-N-S (0.14) | TestFlight and the App Store | owner |
| Google Play organisation account (0.15) | Play testing and release | owner |
| Firebase and `googleServicesFile` (6.4) | push on Android | engineer |
| The update-signing key, made by the owner, in the first store build (6.5) | signed over-the-air updates | owner, engineer |
| The OTA API URL variables (6.6) | the first over-the-air update | engineer |
| The Google button decided (6.7) | the store submission | owner, engineer |
| A `mobile-v*` tag (6.14) | any over-the-air update | engineer |
| A reviewer account at a review school (4.6, 6.13) | store review | owner, operator |
| A native speaker's read of the Hindi and Marathi listings | the listings | owner |
| A home for the nightly dump (9.2) | logical backups | engineer, owner |
| Sentry (0.16) | error tracking beyond the log | owner |
| App links built (5.7) | verified links into the app | engineer |
