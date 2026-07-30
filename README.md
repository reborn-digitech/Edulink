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
| `npm test` | Full suite (379 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Wipe and reseed |
| `npm run db:studio` | Browse the data |
| `npm run vapid` | Generate a Web Push keypair |
| `npm run files:check` | List stored files no record references — **deletes nothing** |
| `npm run files:reclaim` | Actually delete them. Read the check output first |
| `npm run backfill:school-id` | Add/fill the denormalised schoolId on an existing dev DB |
| `node scripts/gen-icons.mjs` | Regenerate the PWA icon set |

### Running the file sweep on a schedule

Deleting a record leaves its bytes behind. They are unreachable immediately —
`files.ts` denies anything no record claims — so nothing is exposed, but the disk
grows. Add `--json` for one line a monitor can read:

```bash
0 3 * * *  cd /srv/edulink && npm run files:reclaim -- --json >> /var/log/edulink-files.log
```

Exit status stays 0 when orphans are found and removed; finding them is the
normal state of a system that has ever deleted a post, not an error.

**Why this is a cron job and not a button in the admin UI.** An orphan is a file
no record points at, so it has no owning record and therefore no school. There is
nothing to scope it to — a Riverside admin pressing "reclaim" would be deleting
bytes left by Oakfield's deleted rows. Every other destructive action in this app
can answer "whose is it?" first; this one cannot, so it belongs to whoever runs
the server. It is not an in-process timer either: two instances would mean two
sweeps, and a deletion pass should never race itself.

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
  image-metadata.ts       ★ Strips EXIF/GPS before an upload reaches disk.
  uploads.ts              Stores a batch of attachments, or none of them.
  orphans.ts              ★ Finds/deletes files no record references. Dry-run by default.
  files.ts                ★ Per-file read authorisation (reverse lookup, default deny).
  badges.ts               Student badges, derived on read — never stored.
  dates.ts                dateKey / timezone / DST. Heavily tested.
  csv.ts                  Real RFC 4180 parser (not regex).
  env.ts                  Boot-time config gate.
  offline-queue.ts        IndexedDB outbox (client-side).
  constants.ts            Every status string, single source of truth.
src/app/(app)/            Signed-in routes (share the nav shell).
src/app/                  Public routes: login, register, join, invite, switch.
src/components/ui/        Design system.
  slot.tsx                ★ `asChild`. Deliberately NOT "use client" — see Gotchas.
  file-picker.tsx         Pick-before-submit control (assignment handouts).
src/components/attachment-list.tsx  Attach/detach on an existing record.
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
11. **A `fileId` is minted server-side and never accepted from a client.**
    `files.ts` authorises a stored file by finding the record that mentions it,
    so anything that let a caller name an arbitrary id would let them point
    their own post at somebody else's attachment and inherit their audience.
    Uploads therefore travel *with* the thing they belong to — `submitPost`
    takes the image in the same FormData as the post and stores it itself.
    Images are stripped of EXIF before they are written, because a child's photo
    otherwise publishes their home address.

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
- **Never put `"use client"` on a component that inspects its `children`.**
  `slot.tsx` had it, `Button` is a server component, and the child element
  therefore crossed the RSC boundary — where it arrives as an unresolved lazy
  reference, not an element, so `Children.only` threw and `/bulletin` returned
  500 for every role. It only fired once a page rendered enough elements for
  React to defer one, so most routes stayed green and the failure looked
  data-dependent. **Dev will not show you this**: it inlines the payload and
  serves the page happily. A 500 that only reproduces in `next start` is the
  signature. `slot.test.ts` guards the directive, because reproducing the
  symptom needs a production build and a streaming boundary.
- **A script that imports from `src/lib` needs `scripts/tsconfig.json`.** Most of
  `src/lib` is `server-only`, which throws the moment it is imported outside a
  React Server Component — so `tsx scripts/whatever.ts` dies on line one with
  "This module cannot be imported from a Client Component module". That config
  stubs the package for scripts only, the same way `vitest.config.ts` does for
  tests. Run scripts with `tsx --tsconfig scripts/tsconfig.json`, as the
  `files:*` entries in package.json do. The app's own build keeps the guard.
- Dark-mode role accents are written **twice** in `globals.css`
  (`[data-theme="dark"][data-role="x"]` *and* `[data-theme="dark"] [data-role="x"]`)
  because `data-role` is often on a subtree while `data-theme` is on `<html>`.
  A single compound selector silently leaves pale fills on a dark page.
- Realtime fan-out is **in-process only**. More than one instance needs Redis or
  Ably behind the `publish`/`subscribe` surface in `realtime.ts`.

### Next steps, in priority order

1. **Postgres migration + RLS policies.** Isolation is app-layer only today.
   Groundwork done, in the order the work should go:

   * The schema is confirmed portable. `prisma validate` accepts it under the
     `postgresql` provider and `prisma migrate diff --from-empty` emits 771 lines
     of Postgres DDL, both offline. The no-enums/no-Json tax is being paid and it
     is working.
   * ~~Denormalise `schoolId` onto the five join-scoped tables~~ **done.**
     ClassTeacher, Enrollment, Comment, Reaction, RemarkMessage now carry it, so
     every policy is the same one-line predicate rather than five bespoke
     `EXISTS` subqueries — the ones most easily written wrong and the ones that
     cost per row. The column is always copied from the PARENT row, never from
     the session, and `tests/denormalised-school.test.ts` checks the two agree.
     No reset was needed: `npm run backfill:school-id` adds the columns to an
     existing dev database and fills them from the parents.
   * Then the policies themselves: `USING (school_id = current_setting('app.school_id'))`.
   * **The real blocker is not SQL.** RLS needs the tenant in a session variable,
     and `SET LOCAL` only lasts a transaction — so every scoped query has to run
     inside one that sets it first. Prisma pools connections, so setting it
     per-request is not safe: the next request can get the same connection. That
     is a change to `db.ts` and to how every query is issued, and it should be
     designed before any policy is written, or the policies will silently read an
     empty `app.school_id` and return nothing.
   * Nothing above was executed. **There is no Postgres on this machine** — no
     server, no client, no Docker — so treat the DDL as generated-and-read, not
     run.
2. Global feed, competitions, progress-report export, SSO, 2FA.

**A pattern worth internalising before you add anything:** three separate
features in this codebase were fully built and silently dead because one link in
the chain was missing — empty VAPID keys, no push-subscription endpoint, an
unused `AUTH_SECRET`. When you finish a feature, find the thing that *proves*
data moved end to end and check it, rather than checking that each piece exists.

**And the corollary, learned the expensive way:** a check that passes for two
different reasons proves nothing. "200 or a correct auth redirect" accepted a
redirect as success, so every parent route passed a sweep without rendering a
single page — and a genuine 404 and a genuine 500 both survived it. Sweep each
route *as a signed-in user of the role that owns it*, and assert 200
specifically. `/bulletin` had been 500 for five commits.

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
- **Teacher class detail and student profile**, the last two nav 404s. The class
  page surfaces the two things a teacher acts on — students below 90% attendance,
  and students with **no guardian linked** (nobody receives their notifications)
  — plus a printable join-code card. The student profile has the avatar picker,
  preferred name, bio, and badges derived from real data.
- **File attachments, with per-file authorisation.** A student uploaded a PDF to
  their own submission; on that real file the server allows the student, their
  guardian, the teacher of that class and a school admin, and denies a
  **classmate**, a teacher of another class, the other school's admin, and
  anonymous. Assignment attachments follow assignment visibility (a draft's file
  is hidden from students until published); post media follows post visibility (a
  pending student post's image is hidden from classmates).
- **A caching leak, found and closed.** With `private, max-age=3600`, a pupil
  opened their own homework and a classmate on the same browser then read it —
  the server refused them, but the browser never asked. Authorised files are now
  `no-store`, and the service worker explicitly excludes `/api/files/` from both
  its image cache (30 days, per-origin, survives sign-out) and its `/api/` GET
  cache. Regression-tested against the source, since a one-line header change is
  invisible to functional tests.
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
- **379 tests**, stable across repeated runs. The date, avatar, CSV, attendance,
  tenancy, onboarding, remarks, grading, bulletin, safety, storage, files,
  file-cache, badges, slot, image-metadata, uploads, orphans, invite-lifecycle, switch-context, quiet-hours and env suites are each **mutation-tested** — for the bulletin that means four separate
  breaks of the safety model (student posts auto-publishing, visibility ignoring
  status, any teacher approving school-wide, rejecting with no reason), each
  caught.
- **`/bulletin` and `/parent/settings`, production build:** `/bulletin` renders
  for admin, teacher and student across the default, `?filter=mine`,
  `?filter=pending` and `?tag=` views, with a real post in the feed and with the
  feed empty — zero server errors.
- **A badge survives being ill.** A child present every day for a month, then off
  for a fortnight: attendance falls to 78% and the current streak to nil, and
  both attendance badges stay. Under the old rule — current streak, whole-window
  percentage — two days off took "Rock solid" away. Mutation-tested by putting
  the old rule back, which fails the test.
- **The seeded class now has a term of attendance** (45 school days, up from 10).
  The teacher's concern tile still reads 4 below 90%, and "Rock solid" is earned
  by 16 of 18 — the two children who were ill for a fortnight straight have not
  had a clean month, so they have not earned it rather than lost it, and they
  still hold "Here all week". At the earlier ten-day minimum every child in the
  class earned it, including those on 69%, which is a decoration and not a badge.
- **What an invitation stops being able to do.** Revoked links refused, resent
  links killing the one before them, expired links refused *and* recorded as
  expired rather than left showing as outstanding. A revoked link and a forged
  one return the identical message, so neither confirms the other exists.
- **Who may become a PARENT.** Every other role is proved by a Membership row;
  PARENT has none by design and is proved by an ACTIVE Guardianship, so it takes
  a different branch — one that granted a role and had never run. A teacher
  asking for PARENT is refused, and so is a parent whose guardianships have all
  been revoked. Mutation-tested: delete that check and two tests fail.
- **Seeded attendance now crosses its own thresholds.** Six children on 100%,
  eight on 90%, two on 80% and two on 70% — so `/teacher/classes/<id>` reads
  "Attendance concern 4" where it was structurally 0 before, and "Rock solid"
  (95%) is earned by six rather than being unreachable. Streaks land on 0, 1, 8
  and 10, so the streak badge is earned by fourteen of eighteen and the progress
  bar has something to draw. All four statuses appear (148 present, 14 late, 12
  excused, 6 absent). Verified by seeding a throwaway database and rendering the
  class page against it; the suite passes twice on that seed and twice on the
  old one.
- **Orphan sweep.** Planted an unreferenced file: `files:check` listed it and
  deleted nothing; `files:reclaim` removed it and left the eight oddly-named
  fixtures in `storage/` alone. Mutation-tested in both directions — dropping the
  submission query from `referencedFileIds` makes it delete a child's handed-in
  work and three tests fail; removing the grace window makes it delete a file
  written seconds ago, and one test fails.
- **Attachment loop, production build.** This was listed as "not built" and had
  in fact been built all along — `attachments/actions.ts` and `AttachmentList`
  were fully wired and, as far as the notes go, never once run. Now run: a
  teacher set work with a PDF handout attached **as the work was created**, and
  a student attached a photo to their own hand-in. The resulting access matrix,
  checked over HTTP against `/api/files/<id>`:

  | | teacher's handout | that child's own work |
  |---|---|---|
  | the child | 200 | 200 |
  | a classmate | 200 | **404** |
  | the class teacher | 200 | 200 |
  | their guardian | 200 | 200 |
  | another school's admin | 404 | 404 |
  | signed out | 404 | 404 |

  The classmate cell is the one that matters: a handout is for the class, a
  child's work is not. The photo lost its EXIF on the way in here too (203 → 160
  bytes), so stripping is a property of storage rather than of the bulletin.
- **Bulletin picture loop, production build:** a student attached a real JPEG
  carrying a GPS EXIF block, described it, and sent it. The post was held
  PENDING; a classmate asking `/api/files/<id>` directly got **404**, the
  reviewing teacher got 200. The teacher pressed *Publish it*; the classmate
  then got **200**, and an anonymous request still got 404. What landed on disk
  is 160 bytes rather than 203, contains neither `Exif` nor the GPS string, and
  `file(1)` reports it as JFIF instead of "Exif standard" — the metadata is gone
  and the image still decodes (the browser reported it `complete`).
  Sending it with no description is refused before anything is uploaded.
- **Parent loop, production build:** logged in as `parent@example.com` with the
  seeded password → landed on `/parent` with **both** children (Riverside and
  Oakfield) → `/parent/settings` → unticked Email → Saved → `channels.email` is
  `false` in the database and the row is normalised to the full prefs schema.
  A parent needs no Membership row: `resolveContext` gives a user with only
  guardianships `role: "PARENT"`, which is the whole design.
- **`asChild` still emits a real anchor** — `<a href="/bulletin/new">` carrying
  the button classes, not a `<button>`, which is the entire point of `Slot`.

### Built but not click-through verified

Renders and typechecks; treat as `Untested:`.

- Command palette (⌘K), install button, quiet-hours logic, class
  archive/restore and join-code rotation from the admin screens.
- The multi-child parent switcher **renders** both of Jordan Okafor's children
  (Riverside and Oakfield) on `/parent`, but switching between them has not been
  clicked. What now IS covered is the decision underneath it —
  `setActiveContext` refusing PARENT to anyone without an ACTIVE guardianship.
- **Invite revoke and resend are no longer on this list.** The buttons still
  have not been clicked, but what they do to an invitation is pinned by
  `invite-lifecycle.test.ts`: a revoked link is refused, a resent link kills its
  predecessor, an expired one is refused and recorded as expired. The admin
  actions themselves need a session, which the vitest `next/headers` stub has no
  cookie jar for, so the state changes are made the way those actions make them
  and the accept path is what gets verified.
- **The server-side guard refusing a re-submission after marking.** The UI
  stops offering the panel (verified), so that branch in
  `src/app/(app)/student/work/actions.ts` is defence-in-depth for a stale page
  and has not been executed.

### Not built

**Every route referenced by the navigation renders.** All 39 route/role
combinations were requested as a signed-in user of the owning role and returned
**200** — not "200 or a redirect", which is what let a 404 and a 500 through the
previous sweep.

- Suspend-user (the safety centre says to use the school's own process instead)
- Global feed, competitions marketplace, safety centre / moderation dashboards
- Weighted grade categories, progress-report export
- SSO (Google/Microsoft/Apple), 2FA, SMS, i18n beyond English, real email transport
- Postgres RLS policies (described in schema comments; app-layer only today)

### Known issues

- Rebuilding over a running `next start` corrupts `.next` (see Gotchas).
- Realtime fan-out is single-process.
- Lighthouse has not been run — no Chrome driver in the build environment, so
  the spec's ≥90 mobile score is **unverified**.
- Deleting a record leaves its files on disk until the sweep runs. Unreachable
  the moment the record goes, so this is disk rather than disclosure. There is a
  cron recipe under Scripts; nothing in this repo installs it for you.
- One picture per post. The schema and validation already allow up to ten; the
  compose form offers a single picker.
