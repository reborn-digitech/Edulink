# 0001 — Mobile app, monorepo and production hosting

**Status:** accepted 7 September 2026. **Supersedes:** the "React Native on hold" note.

The web app is done enough to ship and to be the back end of a phone app. Five
decisions were put to the founder in the mobile-and-production plan; all five
were accepted as written. This page is the record, so nobody has to re-argue
them in a pull request.

## 1. The phone app is Expo

React Native through Expo (SDK 52 or newer, TypeScript, `expo-router`, EAS
Build for store binaries). Not a bare React Native project, not Flutter, not a
web view wrapping the site.

*Why.* Expo gives file-based routing that mirrors the App Router the team
already knows, over-the-air updates for everything that is not native code,
and a build service that produces store-ready binaries without a Mac per
developer. A web view would inherit every mobile-layout compromise the site
makes and none of the offline, push and biometric affordances a school app
needs. Flutter would mean a second language and a second i18n system.

## 2. One pnpm workspace

```
apps/web          the Next.js app, moved as-is (this was the repository root)
apps/mobile       the Expo app
packages/i18n     locale list now; en/hi/mr dictionaries and translator later
packages/contracts   zod schemas + types for /api/v1
packages/api-client  fetch wrapper with bearer sessions
```

`pnpm` because it isolates each package's `node_modules` (a forgotten
dependency fails here, not on the build server), links workspace packages by
symlink so nothing needs a build step, and its lockfile covers the whole tree.
The pinned version sits in the root `package.json` under `packageManager`;
`corepack enable` is the only install step.

The web app moved with `git mv` and no code changes beyond two lines:
`transpilePackages` in `next.config.ts` (workspace packages ship TypeScript
source) and a `battery` script. Every `npm run …` in its README still works from
`apps/web`. The `.env`, `storage/`, Prisma schema and scripts moved with it
because every one of them resolves paths from the current directory.

## 3. A versioned JSON API with bearer sessions

The phone talks to `/api/v1/*`. Each handler is thin: parse the body with the
schema from `@edulink/contracts`, call the same `src/lib` function the server
action calls, answer with the same error envelope. The existing
`/api/attendance` route is the template. Sessions are bearer tokens in the
`Authorization` header, minted by a sign-in endpoint, stored in the phone's
secure storage, with an expiry the client reads so it refreshes before a 401.

*Why.* Server actions are not callable from outside Next. Cookies on a phone
are fragile across app restarts and are the wrong shape for push and
background sync. Keeping the handlers thin keeps every rule — tenancy,
row-level security, register duty, quiet hours — in `src/lib`, where the
existing suites already prove it.

## 4. Minors' data before screens

Before the first screen is designed, the plan maps what the app stores about a
child and who can see it against Apple's Kids and Education guidance, Google
Play's Families policy and India's DPDP Act (verifiable parental consent,
purpose limitation, no behavioural tracking). The outcome is a one-page policy
in this folder and a checklist the store submissions cite.

*Why.* Both stores reject apps for children retroactively, and the web app
already handles guardianship, consent for competitions and stand-in guardians.
Designing screens first and finding the policy later means redesigning them.

## 5. Production is a real Node process

A long-running Node server (Fly.io, Render or a plain VM), managed Postgres with
point-in-time recovery, S3-compatible object storage for uploads, Cloudflare
in front for TLS, caching and rate limiting. Not a serverless platform.

*Why.* The product uses server-sent events for live updates, scheduled jobs
from a crontab, a service worker that replays attendance while offline, and
Postgres row-level security through `set_config` on a per-transaction
connection. Serverless functions break the first two outright and make the
last one expensive. The uploads directory becomes a bucket so the process can
be replaced without losing files.

## Exit criteria for Phase 0

- [x] These decisions written down here.
- [x] Workspace skeleton merged with the web app building unchanged.
- [x] The battery (tsc ×2, eslint, vitest, rls:verify, quiz:verify, i18n, sweep)
      green from `apps/web`, plus each package's own tests.
- [x] `next build` green from `apps/web`. It had not been part of the battery and
      found two client/server boundary slips on its first run; Phase 1's CI runs it
      on every push.

## Phase 1 record

See `docs/runbooks/` (deploy, backup-restore, security), `docs/go-live-checklist.md`, `ops/` (backup, restore, load) and the CI workflow. The report with the measured numbers is the Phase 1 artifact; the standing battery ledger carries the summary.

## Phase 2 record

The accessibility gate and the viewport matrix live in `apps/web/e2e/` and run in the sweep job; the offline outbox covers attendance, marks and messages through the first two `/api/v1` handlers; sized image copies come from the file route (`?w=`). The Phase 2 report artifact carries the measurements and the list of what the gates found.

## Phase 3 record

`/api/v1` is documented in `docs/api/README.md` and generated into `docs/api/openapi.json` from `apps/web/src/lib/api-catalog`; the API sweep (`npm run api:sweep`) and the contract suites (`tests/api-v1-*.test.ts`) run in CI. The Phase 3 report artifact carries the endpoint counts and what the reviews found.

## Phase 4 record

`apps/mobile` is the Expo app (SDK 57, expo-router, React Query, expo-secure-store, an expo-sqlite outbox, expo-notifications), sharing `@edulink/i18n` (the three dictionaries moved there from the web), `@edulink/tokens` (mirrors `globals.css`, with a drift test on the web side), `@edulink/contracts` and `@edulink/api-client`. Screens live in `src/screens/{teacher,family,staff}`; the routes in `src/app/(app)` only switch on role. Native-only modules sit in `.native.ts` files with a web twin beside them, because expo-router's static web render cannot carry expo-sqlite. This machine has no Xcode or simulator: the mobile battery (`pnpm battery:mobile`: tsc, eslint, jest-expo with Testing Library) runs in CI, the contract suite runs against the API in the sweep job with `zz:token`, and the screens were walked on the web target against the local API. The device layers of the mobile battery, the first development build and the twenty-device internal test wait for an Expo account or a Mac with Xcode; the Phase 4 report artifact lists what each unblocks.
