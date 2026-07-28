# EduLink

A multi-tenant school PWA — attendance, assignments, grades and teacher↔parent
messaging for admins, teachers, students and parents. Installs to the Android
home screen, works offline, syncs by itself.

This is **v1**: the spine works end to end. See [Status](#status) for exactly
what is built and what is not.

---

## Run it

Requires Node ≥ 20.9 (developed on 20.20.2). No database server, no Docker, no
external accounts.

```bash
npm install && cp .env.example .env && npm run vapid
```

Paste the printed VAPID keys into `.env`, add an `AUTH_SECRET`
(`node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`),
then:

```bash
npm run setup && npm run dev
```

`npm run setup` = `prisma db push` + seed. Open http://localhost:3000.

### Seeded accounts

Password for every account: `copper-lantern-47-brook`

| Email | Role |
|---|---|
| `priya@riverside.school` | Admin **and** teacher (lands on the role switcher) |
| `tom@riverside.school` | Teacher, one class only |
| `sam@oakfield.school` | Admin of a **second** school |
| `parent@example.com` | Parent with children in **both** schools |

The second school exists so tenant-isolation bugs are visible — a query that
forgets its `schoolId` will start returning Oakfield data.

Emails are not sent. Every magic link, invite and verification message is
readable at **http://localhost:3000/dev/mailbox** (404s in production).

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server (service worker disabled — see note below) |
| `npm run build && npm start` | Production build; **this is the only mode with a service worker** |
| `npm test` | Full suite (68 tests) |
| `npm run db:reset` | Wipe and reseed |
| `npm run db:studio` | Browse the data |
| `node scripts/gen-icons.mjs` | Regenerate the PWA icon set |

> The service worker is disabled in dev on purpose — a live SW caching HMR
> chunks makes every edit look like it silently failed. **Offline mode, install
> prompt and push only work in `npm run build && npm start`.**

---

## Architecture decisions

One line each, with the default rejected (§3).

| Choice | Because | Rejected |
|---|---|---|
| Next.js 15.5 App Router + TS | Named in the brief; server components keep tenant queries on the server | Next 16 (Serwist 9 is proven against 15) |
| Prisma 6.19 + SQLite → Postgres | Zero-setup dev; one portable schema | Prisma 7 (regenerated client, no benefit here) |
| Custom auth, argon2id + opaque sessions | Spec needs device management and session revocation, which a stateless JWT cannot do without a denylist — at which point it is a session table with worse ergonomics | Clerk (cannot be run or verified without keys) |
| SSE + in-process pub/sub | Realtime with no second process to deploy | WebSockets (App Router has no WS server) |
| Serwist 9 | Maintained, first-class Next support | next-pwa (unmaintained) |
| Hand-rasterised PNG icons | Deterministic bytes, no native image dependency | sharp / runtime `ImageResponse` |
| Inline-SVG avatars (72 presets) | No requests, crisp at any size, cannot leak a child's photo | Shipping 72 image files |

### Things worth knowing before you extend it

- **Tenancy.** `schoolId` comes from the *session*, never from a route param or
  form field. Everything that takes an id from the client goes through an
  `assert*` helper in [`src/lib/tenancy.ts`](src/lib/tenancy.ts), which
  re-queries with the session's `schoolId` in the `WHERE` clause. A row from
  another tenant simply does not come back. Teachers are additionally scoped to
  classes they actually teach — "same school" is not sufficient to take a
  register, and treating it as sufficient is the tempting shortcut here.
- **Dates.** Attendance identity is `dateKey` — `YYYY-MM-DD` in the *school's*
  timezone, not a UTC instant. See the DST reasoning in
  [`src/lib/dates.ts`](src/lib/dates.ts).
- **Money-shaped numbers.** Scores are integer thousandths (`scoreMilli`);
  87.5 → `87500`. Never floats.
- **Portability tax.** SQLite has no enums and no JSON columns, so status
  columns are `String` (values in [`src/lib/constants.ts`](src/lib/constants.ts),
  enforced by zod at every write) and JSON payloads are `String` (read through
  [`src/lib/json.ts`](src/lib/json.ts)). This is what lets the same schema run
  on Postgres unchanged.
- **Offline writes** are idempotent by `clientId` (replay = no-op) *and*
  ordered by `markedAt` (a late replay cannot undo a newer correction). Both
  are covered by tests, and both were verified by deliberately breaking them.

---

## Status

### Verified working (executed, not reasoned about)

- Landing page, school registration wizard (3 steps, live validation, resumable
  draft), login (password + magic link), role switcher, admin dashboard with a
  **derived** setup checklist, teacher home, take-the-register, dev mailbox.
- **The full offline loop, in a production build**: marked a student absent with
  the network forced down → payload queued in IndexedDB → nothing on the server
  → reconnected → synced with the same `clientId` → the linked parent's
  notification row created. Pasted output is in the delivery notes.
- Registration creating school + admin + membership + verification email in one
  transaction; argon2id hashes at OWASP 2024 params.
- Production build: 104 kB shared JS, service worker generated with precache
  manifest, push, notificationclick and Background Sync handlers.
- Unauthenticated `/admin`, `/teacher` → 307; `POST /api/attendance` → 401;
  `/dev/mailbox` → 404 in production.
- 68 tests. The date, avatar and attendance suites were each **mutation-tested**
  — the implementation was deliberately broken to confirm the tests fail.

### Built but not yet exercised end to end

Renders and typechecks; no click-through verification. Treat as `Untested:`.

- Command palette (⌘K), install button, notification/quiet-hours logic,
  file storage + upload validation, remark threads, the `/switch` empty state.

### Not built

Routes referenced by navigation that do not exist yet — they will 404:

- Teacher invitations and CSV import; class creation; school directory
- Student join-by-code and the kid-first onboarding tour; parent claim flow
- Parent dashboard, assignments/grading UI, gradebook
- Bulletin board, global feed, competitions, safety centre, admin settings
- SSO, 2FA, SMS, i18n beyond English, real email transport

`getChecklist` deliberately derives from live data rather than stored flags, so
the admin dashboard tells the truth about all of the above.

### Known issues

- **Rebuilding over a running `next start` corrupts `.next`** and yields
  `TypeError: a[d] is not a function` on every route. Stop the server, `rm -rf
  .next`, rebuild. Environment hygiene, not an app bug — but it will bite you.
- Realtime fan-out is in-process only. More than one instance needs Redis or
  Ably behind the `publish`/`subscribe` surface in `src/lib/realtime.ts`.
- Postgres RLS policies are described in the schema comments but not written;
  isolation is currently enforced in the data layer only.
- Lighthouse has not been run — no Chrome driver in this environment.
