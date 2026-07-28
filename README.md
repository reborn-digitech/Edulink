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

Paste the two printed VAPID keys into `.env`, then:

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

The seed prints each class's join code. To try the kid-first flow, open
`/join/student` and paste one — students self-enrol and appear on that class's
register immediately. Their **student code** (shown in the directory) plus their
date of birth is what a parent needs at `/join/parent` to link to them.

Students who join this way have **no email address**: they get a generated login
handle like `rosie.kvjn`, which is what they type into the login box.

Emails are not sent. Every magic link, invite and verification message is
readable at **http://localhost:3000/dev/mailbox** (404s in production).

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server (service worker disabled — see note below) |
| `npm run build && npm start` | Production build; **this is the only mode with a service worker** |
| `npm test` | Full suite (167 tests) |
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
- **CSV is parsed, not regex-matched.** `src/lib/csv.ts` is a real RFC 4180
  reader (quoted commas, doubled quotes, embedded newlines, CRLF, Excel BOM),
  because the rows a regex mangles are exactly the ones a school has —
  `"Okafor, Amara"`. Bad rows are *collected and reported*, never skipped
  silently: a bulk import that claims "42 sent" while dropping 3 is how a
  teacher is discovered missing in September.
- **Archive, don't delete.** A class owns attendance history and grades, so the
  only destructive action offered is archiving, it is reversible, and the
  confirmation names how many students are affected.
- **Config that nothing reads is config that rots.** There is deliberately no
  `AUTH_SECRET`: sessions are opaque random tokens stored as SHA-256 hashes, so
  there is nothing to sign. `src/lib/env.ts` refuses to boot a *deployed*
  instance with missing push keys, a plain-http origin, or the dev mail
  transport — but stays quiet for a local production build, which is the
  documented way to test the service worker.

---

## Status

### Verified working (executed, not reasoned about)

- Landing page, school registration wizard (3 steps, live validation, resumable
  draft), login (password + magic link), role switcher, admin dashboard with a
  **derived** setup checklist, teacher home, take-the-register, dev mailbox.
- **The full offline loop, in a production build**: marked a student absent with
  the network forced down → payload queued in IndexedDB → nothing on the server
  → reconnected → synced with the same `clientId` → the linked parent's
  notification row created.
- **The full invite loop, in a production build**: created a class (got a join
  code) → pasted a deliberately messy CSV (quoted comma-name, invalid address,
  blank address, in-file duplicate, an existing member) → preview flagged all
  five → sent → **2 sent, 4 individually accounted for, none silently dropped**
  → opened the emailed link → accepted → landed in `/teacher` with the right
  title and subjects. The quoted name `"Nakamura, Yuki"` survived intact from
  CSV to database.
- **Invite tokens are single-use**: a consumed token and a forged token return
  the *same* message, so the page is not an oracle for guessing valid tokens.
- Directory search / role filter / class filter / sort / pagination, and CSV
  export scoped to the same filters. A forged `classId` in the export query is
  ignored, not honoured, and the export contains **zero** rows from the other
  seeded school.
- **The full onboarding spine, in a production build.** A child joined with a
  class code typed plainly as `773wc4w` (auto-formatted to `773-WC4W`), picked
  one of 72 avatars, set a passphrase, and landed on their own dashboard — with
  a generated login handle, since a nine-year-old often has no email. They then
  logged back in with that bare handle. The teacher's register picked them up
  immediately (roster 18 → 19, with their chosen avatar). A parent signed up,
  claimed them with the student code **plus** date of birth, and the absence the
  teacher then marked appeared on the parent's dashboard as *"Rosie was marked
  absent"* with a notification row.
- **The parent claim is genuinely two-factor.** A correct code with the wrong
  birthdate, and a wrong code with the correct birthdate, return a
  byte-identical message — so it cannot be used to test whether a code is real,
  nor to brute-force a child's date of birth against a known-good code.
- Consent is blocked at the form and recorded with timestamps on the
  guardianship row; signing up without it is refused.
- **Remarks are private in the way that matters.** A teacher wrote a note about
  a student; the guardian saw it, opened it, and replied. A *different teacher
  at the same school* gets a real **404** on that thread — the subject appears
  nowhere in the HTML, and the thread is absent from their list. So do an admin
  of another school, a parent who does not guard that child, and the student the
  note is about.
- The compose screen warns **before** you write that a student has no guardian
  linked, rather than letting the message go nowhere.
- A signed-in **teacher** is redirected away from every `/admin` page and gets
  **403** (not 401) from the export endpoint — authenticated, wrong role.
- Registration creating school + admin + membership + verification email in one
  transaction; argon2id hashes at OWASP 2024 params.
- Production build: 104 kB shared JS, service worker generated with precache
  manifest, push, notificationclick and Background Sync handlers.
- Unauthenticated `/admin/*` → 307; `POST /api/attendance` and the export → 401;
  `/dev/mailbox` → 404 in production.
- **167 tests**, stable across repeated runs. The date, avatar, CSV, attendance,
  tenancy, onboarding, remarks and env suites are each **mutation-tested** — the
  implementation was deliberately broken to confirm the tests actually fail.

### Built but not yet exercised end to end

Renders and typechecks; no click-through verification. Treat as `Untested:`.

- Command palette (⌘K), install button, notification/quiet-hours logic,
  file storage + upload validation, class archive/restore and join-code
  rotation, invite resend/withdraw, the multi-child parent switcher (only
  exercised with one child).

### Not built

Routes referenced by navigation that do not exist yet — they will 404:

- Assignments and grading UI, gradebook, progress reports — grades are seeded
  and displayed everywhere, but there is no screen for a teacher to enter them
- Bulletin board, global feed, competitions, safety centre, admin settings
- Student profile page, certifications/awards gallery, student posting
- Self-signup approval queue (the school-code path referenced on the invite page)
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
