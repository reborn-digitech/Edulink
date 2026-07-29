# EduLink

A multi-tenant school PWA — attendance, assignments, grades and teacher↔parent
messaging for admins, teachers, students and parents. Installs to the Android
home screen, works offline, syncs by itself.

**Status: the daily loops work end to end.** Register a school → invite staff →
students self-join → take the register offline → set and mark work → message a
parent, with everything landing on the parent's screen. Roughly half the
original spec is built; [Status](#status) says exactly which half.

- **Manual test plan:** [`docs/UI-TEST-CHECKLIST.md`](docs/UI-TEST-CHECKLIST.md)
- **Taking over this codebase cold?** Start at [Handoff](#handoff).

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

> **The service worker only exists in a production build.** Offline mode, the
> install prompt and push notifications need `npm run build && npm start`. The
> SW is disabled in dev on purpose — one caching HMR chunks makes every edit
> look like it silently failed.

### Seeded accounts

Password for every account: `copper-lantern-47-brook`

| Email | Role |
|---|---|
| `priya@riverside.school` | Admin **and** teacher (lands on the role switcher) |
| `tom@riverside.school` | Teacher, one class only |
| `sam@oakfield.school` | Admin of a **second** school |
| `parent@example.com` | Parent with children in **both** schools |

The second school exists so tenant-isolation bugs are visible — a query that
forgets its `schoolId` starts returning Oakfield data.

The seed prints each class's join code. To try the kid-first flow, open
`/join/student` and paste one. A student's **student code** (in `/admin/people`)
plus their date of birth is what a parent needs at `/join/parent`.

Students who self-join have **no email address**: they get a generated login
handle like `rosie.kvjn`, which is what they type into the login box.

Emails are never sent. Read them at **`/dev/mailbox`** (404s in production).

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server (no service worker) |
| `npm run build && npm start` | Production build — **the only mode with a SW** |
| `npm test` | Full suite (270 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Wipe and reseed |
| `npm run db:studio` | Browse the data |
| `npm run vapid` | Generate a Web Push keypair |
| `node scripts/gen-icons.mjs` | Regenerate the PWA icon set |

---

## Handoff

Everything a fresh session needs to continue without re-deriving it.

### Where things live

```
prisma/schema.prisma      27 models. Read the header comment first.
prisma/seed.ts            Two schools on purpose (isolation testing).
src/lib/                  All business logic. Pages are thin.
  tenancy.ts              ★ THE authorization chokepoint. Read before anything.
  attendance.ts           Offline-safe register merge (idempotent).
  grading.ts              Assignments, marking, overallPercent().
  remarks.ts              Private thread visibility rules.
  bulletin.ts             Post visibility + the student-moderation gate.
  safety.ts               Report triage + audit log (server-only).
  safety-labels.ts        Client-safe types/labels for the above — see note.
  storage.ts              Uploads: magic-byte sniffing, UUID names, sharded dirs.
  dates.ts                dateKey / timezone / DST. Heavily tested.
  csv.ts                  Real RFC 4180 parser (not regex).
  env.ts                  Boot-time config gate.
  offline-queue.ts        IndexedDB outbox (client-side).
  constants.ts            Every status string, single source of truth.
src/app/(app)/            Signed-in routes (share the nav shell).
src/app/                  Public routes: login, register, join, invite, switch.
src/sw.ts                 Service worker (Serwist compiles to public/sw.js).
tests/                    Integration tests (need the seed).
src/**/*.test.ts          Unit tests.
docs/UI-TEST-CHECKLIST.md Manual walkthrough of every feature.
```

### Non-negotiable conventions

Break these and something quietly goes wrong for a child or a parent.

1. **`schoolId` comes from the session, never from client input.** Anything
   taking an id from a route param, form field or query string goes through an
   `assert*` helper in `src/lib/tenancy.ts`, which re-queries with the session's
   `schoolId` in the `WHERE` clause. A row from another tenant simply does not
   come back. Teachers are *additionally* scoped to classes they actually teach —
   "same school" is never sufficient.
2. **Wrong-tenant access returns `NOT_FOUND`, never `FORBIDDEN`.** A
   distinguishable error confirms the row exists, which is itself a disclosure.
3. **Scores are integer thousandths** (`scoreMilli`); 87.5 → `87500`. Never
   floats. Overall percentages go through `overallPercent()`, which sums points
   earned and available and divides **once** — averaging per-assignment
   percentages weights a 5-point quiz like a 100-point exam. On the seeded data
   the two methods differ (88% vs 86%), so this is a real number, not a nit.
4. **Attendance identity is `dateKey`** — `YYYY-MM-DD` in the *school's*
   timezone, not a UTC instant. See the DST reasoning in `dates.ts`.
5. **Offline writes are idempotent** by `clientId` (replay = no-op) *and*
   ordered by `markedAt` (a late replay cannot undo a newer correction).
6. **Bad input is collected and reported, never silently skipped.** A bulk
   import claiming "42 sent" while dropping 3 is how a teacher is found missing
   in September.
7. **Archive, don't delete.** Classes own attendance and grade history.
8. **Notify on first state change only.** Fixing a typo three times must not
   send a family three pushes.
9. **Config nothing reads is config that rots.** There is deliberately no
   `AUTH_SECRET` — sessions are opaque random tokens stored as SHA-256 hashes,
   so there is nothing to sign. `env.ts` refuses to boot a *deployed* instance
   with missing push keys, a plain-http origin, or the dev mail transport, but
   stays quiet for a local production build.
10. **SQLite portability tax.** No native enums and no JSON columns: status
    columns are `String` (values in `constants.ts`, validated by zod at every
    write) and JSON payloads are `String` (read via `json.ts`). This is what
    lets the same schema run on Postgres unchanged.

### Testing expectations

- Every logic-heavy module gets tests, and the suite is **mutation-tested**:
  deliberately break the implementation and confirm the test fails. Several
  suites exist *because* a green suite was hiding a real bug.
- Integration tests in `tests/` run against the seeded dev database and **clean
  up after themselves** (see `cleanSyntheticData` in `tests/attendance.test.ts`).
  They must be repeatable — run twice in a row before committing.
- `vitest.config.ts` aliases `server-only` and `next/headers` to stubs in
  `tests/stubs/`, so real business logic can be tested rather than a mock of it.

### Gotchas that will cost you an hour

- **Rebuilding over a running `next start` corrupts `.next`** and yields
  `TypeError: a[d] is not a function` on every route. Stop the server,
  `rm -rf .next`, rebuild.
- The service worker is **disabled in dev**. Offline/push testing needs a
  production build.
- `/dev/mailbox` is **404 in production** (it lists sign-in links in plaintext).
  Use `npm run dev` or read the `OutboundEmail` table.
- **A client component importing a `server-only` module is a BUILD error, not a
  type error.** `tsc --noEmit` passes and `next build` fails with "You're
  importing a component that needs server-only". That is why `safety-labels.ts`
  exists separately from `safety.ts`: the report cards and audit table are client
  components and need the label maps. Always run a build, not just a typecheck.
- Dark-mode role accents are written **twice** in `globals.css`
  (`[data-theme="dark"][data-role="x"]` *and* `[data-theme="dark"] [data-role="x"]`)
  because `data-role` is often on a subtree while `data-theme` is on `<html>`.
  A single compound selector silently leaves pale fills on a dark page.
- Realtime fan-out is **in-process only**. More than one instance needs Redis or
  Ably behind the `publish`/`subscribe` surface in `realtime.ts`.

### Next steps, in priority order

1. `/teacher/classes` — branding (logo upload, colour). **`storage.ts` is
   written, validated, tested-by-inspection and completely unwired** — this
   would be its first consumer. Treat that as a smell worth clearing.
 — teacher-facing class detail (nav links to it and 404s).
2. `/student/profile` — avatar change, awards gallery (nav links to it).
3. File attachments on assignments, submissions and bulletin posts. `storage.ts`
   and `/api/files/[fileId]` now exist and are proven; attachments mainly need
   the per-file authorisation branch in that route filled in (today only school
   logos are readable, everything else 404s by design).
5. Postgres migration + RLS policies (schema comments describe the intended
   predicates; isolation is currently app-layer only).
6. Global feed, competitions, progress-report export, SSO, 2FA.

**A pattern worth internalising before you add anything:** three separate
features in this codebase were fully built and silently dead because one link in
the chain was missing — empty VAPID keys, no push-subscription endpoint, an
unused `AUTH_SECRET`. When you finish a feature, find the thing that *proves*
data moved end to end and check it, rather than checking that each piece exists.

---

## Architecture decisions

One line each, with the default rejected.

| Choice | Because | Rejected |
|---|---|---|
| Next.js 15.5 App Router + TS | Named in the brief; server components keep tenant queries on the server | Next 16 (Serwist 9 is proven against 15) |
| Prisma 6.19 + SQLite → Postgres | Zero-setup dev; one portable schema | Prisma 7 (regenerated client, no benefit here) |
| Custom auth, argon2id + opaque sessions | Spec needs device management and session revocation, which a stateless JWT cannot do without a denylist — at which point it is a session table with worse ergonomics | Clerk (cannot be run or verified without keys) |
| SSE + in-process pub/sub | Realtime with no second process to deploy | WebSockets (App Router has no WS server) |
| Serwist 9 | Maintained, first-class Next support | next-pwa (unmaintained) |
| Hand-rasterised PNG icons | Deterministic bytes, no native image dependency | sharp / runtime `ImageResponse` |
| Inline-SVG avatars (72 presets) | No requests, crisp at any size, cannot leak a child's photo | Shipping 72 image files |
| Hand-written CSV parser | Quoted commas, doubled quotes, embedded newlines, CRLF, Excel BOM — the rows a regex mangles are the ones a school has (`"Okafor, Amara"`) | A regex, or a dependency |

---

## Status

### Verified working — executed, not reasoned about

- Landing page, registration wizard (3 steps, live validation, resumable draft),
  login (password, magic link, **and bare student handles**), role switcher,
  admin dashboard with a *derived* checklist, teacher home, dev mailbox.
- **Offline loop, production build:** marked a student absent with the network
  forced down → payload queued in IndexedDB → nothing on the server →
  reconnected → synced with the **same `clientId`** → parent notified.
- **Invite loop, production build:** created a class → pasted a deliberately
  messy CSV (quoted comma-name, invalid address, blank address, in-file
  duplicate, an existing member) → preview flagged all five → **2 sent, 4
  individually accounted for, none silently dropped** → opened the emailed link
  → accepted. `"Nakamura, Yuki"` survived CSV → database intact.
- **Invite tokens are single-use**, and a consumed token returns the *same*
  message as a forged one.
- Directory search / filter / sort / pagination and a filter-scoped CSV export.
  A forged `classId` is ignored; the export contains **zero** rows from the other
  school.
- **Onboarding spine, production build:** child joined with `773wc4w`
  (auto-formatted), picked from 72 avatars, got a login handle, logged back in
  with it; the teacher's roster went 18 → 19; a parent claimed them with code +
  DOB and saw the absence the teacher then marked.
- **The parent claim is genuinely two-factor:** wrong-DOB and wrong-code return
  byte-identical messages.
- **Assignments and grading, production build:** negative points rejected
  inline, published to 18 students, marked three including a half mark; `250`
  into a 25-point task was caught client-side with Save disabled. `22.5` stored
  as exactly `22500`; class average matched a hand computation (89%).
- **Grades are points-weighted:** on seeded data the methods disagree (88% vs
  86%) and the app shows 88%.
- **Student submission:** handed work in from `/student/work`, empty answer
  refused, teacher (only the assignment's author) notified, gradebook shows
  "Handed in late" for a past-due hand-in. Once marked, the work moves to
  "Marked already" and the hand-in panel is no longer offered.
- **School settings, and `storage.ts` finally wired up.** Uploaded a 900×300
  PNG, adjusted the crop, and the stored file was a real 512×512 PNG on disk
  under `storage/<shard>/` — outside `public/` — served from
  `/api/files/<uuid>.png` with `nosniff`, a sandboxed CSP and a 304 on ETag
  revalidation. `../../.env` returns 404 and does not leak the file. Uploading a
  replacement deleted the previous file, leaving no orphan.
- **Safety centre.** Reports group by target — three reports of one post is one
  card, not three. Unkind/unsafe sorts above a more-reported, more-recent spam
  report. A report whose target was deleted renders as "no longer available" and
  is still closable. Taking content down requires a note, sets it REJECTED with
  that note as the reason, closes every report against it, and tells the author
  *with the note* — verified end to end, along with a school-scoped audit log.
- **Bulletin board with real moderation.** A student posted to their class; it
  was held PENDING and was **invisible to a classmate in the same class** (and
  to a teacher of a different class, and to the other school's admin). The
  class's teacher was notified, could not reject without typing a reason, and
  the author then saw "Not published" *with the teacher's exact words* — while
  the classmate still saw nothing. Students are offered no school-wide scope and
  no review queue; pinning is admin-only; reactions are a fixed kind set with no
  negative option.
- **Notification centre and account settings.** `/notifications` with All /
  Unread tabs, per-item read-on-open, mark-all-read, and a "clear read" that
  explicitly keeps unread items. `/account` with roles, live-applying appearance
  (contrast / dyslexia-friendly / reduced motion, verified changing the DOM
  before saving), quiet hours, and device management.
- **Web Push registration now exists — it previously did not.** `notify.ts` read
  and pruned `PushSubscription` rows but *nothing ever created one*, so
  `sendPush` found zero subscriptions for every user and returned silently. With
  `/api/push` in place, a real subscription is stored (idempotent per endpoint,
  malformed bodies → 422, unauthenticated → 401) and the log now shows
  `[push] send failed` for a synthetic endpoint — proof that delivery is being
  attempted rather than skipped.
- **Remarks are private:** a *different teacher at the same school* gets a real
  404 with the subject appearing nowhere in the HTML; so do an other-school
  admin, a non-guardian parent, and the student the note is about.
- Teacher → **403** (not 401) on the admin export; unauthenticated → 401;
  `/dev/mailbox` → 404 in production.
- **270 tests**, stable across repeated runs. The date, avatar, CSV, attendance,
  tenancy, onboarding, remarks, grading, bulletin, safety, storage, quiet-hours
  and env suites are each **mutation-tested** — for the bulletin that means four separate
  breaks of the safety model (student posts auto-publishing, visibility ignoring
  status, any teacher approving school-wide, rejecting with no reason), each
  caught.

### Built but not click-through verified

Renders and typechecks; treat as `Untested:`.

- Command palette (⌘K), install button, quiet-hours logic, `storage.ts` upload
  validation, class archive/restore and join-code rotation, invite
  resend/withdraw, the multi-child parent switcher (only exercised with one
  child).
- **The server-side guard refusing a re-submission after marking.** The UI
  stops offering the panel (verified), so that branch in
  `src/app/(app)/student/work/actions.ts` is defence-in-depth for a stale page
  and has not been executed.

### Not built — these routes 404

Left visible in the nav on purpose, so missing work is obvious rather than hidden.

- `/student/profile`, `/teacher/classes`
- Suspend-user (the safety centre says to use the school's own process instead)
- Global feed, competitions marketplace, safety centre / moderation dashboards
- File attachments on assignments and submissions (text-only today)
- Weighted grade categories, progress-report export
- SSO (Google/Microsoft/Apple), 2FA, SMS, i18n beyond English, real email transport
- Postgres RLS policies (described in schema comments; app-layer only today)

### Known issues

- Rebuilding over a running `next start` corrupts `.next` (see Gotchas).
- Realtime fan-out is single-process.
- Lighthouse has not been run — no Chrome driver in the build environment, so
  the spec's ≥90 mobile score is **unverified**.
