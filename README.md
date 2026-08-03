# EduLink

A multi-tenant school PWA — attendance, assignments, grades and teacher↔parent
messaging for admins, teachers, students and parents. Installs to the Android
home screen, works offline, syncs by itself.

**Status: the daily loops work end to end, and so does the way in.** Register a
school → invite staff → students self-join → take the register offline → set and
mark work → message a parent → enter a competition with a guardian's consent,
with everything landing on the parent's screen. Every one of those has been
driven against a production build with the tenant policies live; [Status](#status)
says exactly what was checked and how.

Roughly half the original spec is built, and **the half that is built is now the
half that has been run.** Five commits were spent finding, in order: the tenant
binding worked in one of the four places it had to; a teacher at two schools
could not open a single page; the audit log had never once recorded a login; and
no child could join, no parent could claim a child, and no school could register
at all.

**The school year is now a thing the app knows about.** An admin sets up an
academic year and a holiday calendar from `/admin/calendar`; attendance badges
are counted from the year's start date, can be *lost* within it, and are archived
forever the moment it is closed. See [Status](#status) — including the two
mutations that passed when they should not have, and what that revealed.

- **Manual test plan:** [`docs/UI-TEST-CHECKLIST.md`](docs/UI-TEST-CHECKLIST.md)
- **Taking over this codebase cold?** Start at [Handoff](#handoff).

---

## Run it

Requires Node ≥ 20.9 (developed on 20.20.2) and **PostgreSQL 14+**. No Docker, no
external accounts.

```bash
brew install postgresql@16 && brew services start postgresql@16   # or your own
createdb edulink_dev
psql -d edulink_dev -c "CREATE ROLE edulink_app LOGIN PASSWORD 'edulink-dev';" \
                    -c "GRANT USAGE ON SCHEMA public TO edulink_app;" \
                    -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO edulink_app;"
npm install && cp .env.example .env && npm run vapid
```

Put both database URLs and the two printed VAPID keys into `.env`, then:

```bash
npm run setup
npm run demo:seed   # optional: data for the calendar, global feed and Prerna
npm run dev
```

`npm run setup` = `prisma db push` → `db:grants` → seed. The grants step restores
the schema privileges and the RLS policies and then **connects as the app role
and reads a row**, so a setup that would 500 on every page fails here instead of
looking fine. Open http://localhost:3000.

**TWO database users, on purpose.** `DATABASE_ADMIN_URL` owns the schema and runs
migrations and the seed. `DATABASE_URL` is what the app connects as: no
ownership, no `BYPASSRLS`, no superuser — so the policies in `prisma/rls.sql`
actually apply to it. Point the app at the owner and Postgres will silently
ignore every policy, because owners and superusers bypass row-level security.
`npm run rls:verify` refuses a setup like that.

A seed cannot run as the app role, incidentally: its inserts are checked against
`app.school_ids`, and it is creating the schools in the first place.

**Two settings, not one.** `app.school_ids` is the tenant. `app.user_id` exists
for a single question a school-scoped policy cannot answer: *which schools do I
belong to?* — which is the first thing a login has to ask, before any school is
known. So `Membership` alone additionally allows you to READ your own rows on the
strength of it. It appears in that policy's `USING` and in **no** `WITH CHECK`
anywhere, because being able to write your own membership row is self-service
enrolment into whichever school you name. `npm run rls:verify` proves both halves
— that you see your own rows across schools, that you do not see anybody else's
in a school you are in yourself, and that the insert is refused.

**And a third setting, `app.join_code`, for the other bootstrap.** A child
typing a class code, a parent typing their child's student code, somebody
opening an invitation link — none of them has a session, a membership or a
school, and the row the code names is the very thing that would say which school
to scope to. So `Class.joinCode`, `School.code`, `Membership.studentCode` and
`Invite.tokenHash` may each be read when the caller presents the matching value.
Knowing the code is the authorisation, which is what a join code always meant.
It is an equality against a value already typed, so it cannot enumerate; it is
absent from every `WITH CHECK`, so a code gets a look and never a write.

**And one row shape that belongs to no school at all.** `AuditLog` alone accepts
a write with a NULL `schoolId`, because the events most worth recording — a
login, a failed one — happen before any school is known. That allowance is in
`WITH CHECK` and deliberately not in `USING`: the row is writable and readable by
no school, since a failed login carries the email that was tried. The verifier
checks all four corners of that.

> **Why a database server, when SQLite was zero-setup.** Tenant isolation is
> enforced by Postgres row-level security, and there is no SQLite equivalent —
> so on SQLite the policies simply would not run, and dev would be testing a
> weaker set of rules than production enforces. That is the failure this codebase
> keeps finding: a safeguard that exists but never executes where anyone looks.
> The cost is one `brew install`; the alternative was a security boundary nobody
> could exercise until deploy.

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
| `npm test` | Full suite (744 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Wipe and reseed. Restores grants + policies and checks the app role can read |
| `npm run db:grants` | Restore schema grants + policies, then **prove the app role can read**. Run after any manual reset |
| `npm run db:studio` | Browse the data |
| `npm run vapid` | Generate a Web Push keypair |
| `npm run files:check` | List stored files no record references — **deletes nothing** |
| `npm run files:reclaim` | Actually delete them. Read the check output first |
| `npm run backfill:school-id` | Add/fill the denormalised schoolId on an existing dev DB |
| `npm run quiz:verify` | Check the question bank. Structure + arithmetic. **Says what it cannot check** |
| `npm run quiz:import` | Load `content/quiz/*.json`. Verifies first and refuses the run if anything fails |
| `npm run rls:generate` | Regenerate `prisma/rls.sql` from the schema |
| `npm run rls:verify` | **Needs Postgres.** Proves tenant isolation end to end |
| `npm run sweep` | **Needs the app running.** Every route, as the role that owns it |
| `node scripts/gen-icons.mjs` | Regenerate the PWA icon set |
| `tsx --tsconfig scripts/tsconfig.json scripts/badge-count.ts` | Who holds which badge in the seeded class, under the CURRENT rule |

`npm run sweep` is the one that catches what unit tests structurally cannot. It
mints a real session per role, requests all 112 route/role/negative combinations
and asserts **200 specifically** — not "200 or a redirect", which is what let a
404 and a five-commit-old 500 through an earlier sweep. Run it against
`npm start`, not `npm run dev`: two of the three bugs it has caught only exist in
a production build.

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
prisma/schema.prisma      35 models. Read the header comment first.
prisma/seed.ts            Two schools on purpose (isolation testing).
prisma/rls.sql            GENERATED tenant policies. npm run rls:generate.
src/lib/                  All business logic. Pages are thin.
  tenancy.ts              ★ THE authorization chokepoint. Read before anything.
  attendance.ts           Offline-safe register merge (idempotent).
  grading.ts              Assignments, marking, overallPercent().
  remarks.ts              Private thread visibility rules.
  bulletin.ts             Post visibility + the student-moderation gate.
  competitions.ts         ★ Cross-school catalogue, school-scoped entries, parent consent.
  reports.ts              ★ Progress report. Computes NOTHING — asks the helpers that own each figure.
  safety.ts               Report triage + audit log (server-only).
  safety-labels.ts        Client-safe types/labels for the above — see note.
  storage.ts              Uploads: magic-byte sniffing, UUID names, sharded dirs.
  image-metadata.ts       ★ Strips EXIF/GPS before an upload reaches disk.
  uploads.ts              Stores a batch of attachments, or none of them.
  orphans.ts              ★ Finds/deletes files no record references. Dry-run by default.
  tenant-tx.ts            ★ withTenant: sets app.school_id per TRANSACTION. Read the comment.
  tenant-context.ts       ★ Overrides that travel downward. forOwnSchools is the ONE widening.
  tenant-request.ts       ★ Which schools THIS request may see. db.ts asks it per query.
  files.ts                ★ Per-file read authorisation (reverse lookup, default deny).
  badges.ts               Student badges, derived on read — never stored. Windowed on the academic year.
  academic-year.ts        ★ Shaikshanik Varsh. Snapshot THEN flip — the order is the function.
  holidays.ts             ★ Chhutti Calendar. Range maths is pure; only kind=HOLIDAY closes school.
  quiz.ts                 ★ Abhyaas. Ladder + selection are pure. Reveal forfeits the badge, on the ATTEMPT.
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
content/quiz/*.json       The Abhyaas question bank. Read content/quiz/README.md first.
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
5. **The school week is MONDAY TO SATURDAY.** Ask `isTeachingDay(dateKey)`, never
   `isWeekend(dateKey)`, for anything that counts school days — denominators,
   holiday maths, "out of N days". `isWeekend` is a fact about the calendar and
   is for display only; the two deliberately disagree about Saturday. Collapsing
   them either writes "Weekend session" on an ordinary school day or drops a
   sixth of the year out of every figure a parent compares.
6. **Offline writes are idempotent** by `clientId` (replay = no-op) *and*
   ordered by `markedAt` (a late replay cannot undo a newer correction).
7. **Bad input is collected and reported, never silently skipped.** A bulk
   import claiming "42 sent" while dropping 3 is how a teacher is found missing
   in September.
8. **Archive, don't delete.** Classes own attendance and grade history.
9. **Notify on first state change only.** Fixing a typo three times must not
   send a family three pushes.
10. **Config nothing reads is config that rots.** There is deliberately no
   `AUTH_SECRET` — sessions are opaque random tokens stored as SHA-256 hashes,
   so there is nothing to sign. `env.ts` refuses to boot a *deployed* instance
   with missing push keys, a plain-http origin, or the dev mail transport, but
   stays quiet for a local production build.
11. **SQLite portability tax.** No native enums and no JSON columns: status
    columns are `String` (values in `constants.ts`, validated by zod at every
    write) and JSON payloads are `String` (read via `json.ts`). This is what
    lets the same schema run on Postgres unchanged.
12. **Nothing sets `app.school_ids` by hand, and nothing hands the tenant
    downstream.** `db.ts` *asks* for it, per query: `tenant-request.ts` reads the
    session cookie and answers "which schools may this request see", and the
    answer goes into the transaction around that query. 248 call sites know
    nothing about any of it, which is the point — a call site that had to
    remember is a call site that eventually forgets. If a query comes back empty
    when it should not, the tenant did not resolve, and the answer is to fix that
    rather than to reach past it.

    **It pulls rather than pushes because pushing broke, silently, in three of
    the four places it had to work.** See Gotchas: this is the single most
    expensive mistake in the history of this codebase.
13. **A `fileId` is minted server-side and never accepted from a client.**
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
- **`npm test` cannot fail because of row-level security, and cannot pass because
  of it either.** `tests/setup.ts` points the suite at `DATABASE_ADMIN_URL`,
  because the owner bypasses every policy — otherwise each fixture lookup would
  correctly return nothing and no test could reach the logic it is about. The
  price is that a green suite says nothing whatsoever about tenant isolation, and
  once said nothing very loudly: 383 tests passed on a build where every login
  and every write was broken. **Three things cover what it cannot**, and a change
  to the tenant path needs all three:

  ```bash
  npm test          # logic, including tenant-request.ts with no render scope
  npm run rls:verify   # the policies themselves, on a real Postgres
  npm run sweep     # every route, every role, against npm start
  ```

### Gotchas that will cost you an hour

- **`React.cache()` memoises per RENDER, not per request — and everything else
  in this app is not a render.** This one cost a working application, so it is
  first.

  The tenant used to be *pushed*: `getSession()` resolved the school and wrote it
  into a request store built on `cache()`, and `db.ts` read it back. That works
  in a server component. In a **route handler**, a **server action**, and the
  service worker's **offline replay**, `cache()` hands back a brand-new object on
  every call — so the write went into a throwaway, the read came back empty, and
  Postgres was correctly told nothing and correctly returned nothing.

  What that looked like from the outside, all at once, from one line of code:

  | Broken | Why it looked like something else |
  |---|---|
  | Every staff and student **login** landed on "Join your school" | The password was right; the membership query behind it returned 0 rows |
  | **Taking the register** → "That did not save — Wrong role for this action" | And the offline outbox replayed into the same 403 |
  | **Every attachment, post image and school logo** → 404 | Even for the child who uploaded it |
  | **Directory export** → 403 for the admin who owns the directory | While `/admin/people` rendered 200 on the same cookie |
  | Every **server action** needing a role → "No active school selected" | Posts, assignments, grading, remarks, moderation, settings |

  **Parents were the only role that still worked**, because `Guardianship` is the
  one table in the chain with no policy — which is exactly the kind of accident
  that makes a smoke test pass.

  It shipped green: **383 tests** passed, because `tests/setup.ts` connects as the
  database owner and no test in this repo exercises RLS. A **39-route sweep**
  passed, because page renders are the one context where `cache()` works. Both
  were true, both were useless, and the commit message quoted them.

  The fix is directional: **nothing pushes.** `db.ts` asks `tenant-request.ts`
  per query, and that reads the session cookie — which works in every server
  context Next has, because nothing has to survive a journey back up out of an
  async call. `cache()` is still used there, but only to collapse ten lookups on
  a page into one; delete it and the app is slower and still correct. That is the
  test for whether you are using it safely.

  `tests/tenant-request.test.ts` pins this, and it pins it **from vitest, which
  has no render scope at all** — so a regression fails there rather than in a
  school's afternoon.
- **`forSchool(id, () => db.thing())` binds nothing.** The helpers take a
  callback, and the natural spelling — returning the promise without awaiting it
  — silently loses the binding. `AsyncLocalStorage` leaves the context when the
  callback RETURNS, and Prisma invokes its query extension a tick later, so by
  the time `db.ts` asks what the tenant is, there is none: the query runs
  unscoped and comes back empty, with no error anywhere. `forTenant` now awaits
  internally so the natural spelling is the correct one, and
  `tests/tenant-context.test.ts` pins that. If you add another helper, await the
  work inside `run` or it will do nothing at all.
- **A multi-step write needs `db.$tenantTransaction`, never `db.$transaction`.**
  The per-query extension wraps each query in its own tenant transaction; it does
  not reach inside an interactive one, whose callback gets a raw client with no
  `app.school_ids` set. Every INSERT in there is refused by the policy. Four
  flows were written with the plain form — join, invite acceptance, registration
  and starting a remark thread — and all four were dead.
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

1. **SSO, 2FA.** Neither can be verified without real provider credentials.
   Budget for that rather than discovering it at the end.
2. **Fill the Abhyaas bank.** DELIBERATELY LAST. The engine, importer, verifier,
   badge and the English/Hindi/Marathi switch are all done and proven; what is
   missing is only content, and content does not block anything else in this
   list. 105 questions across 9 topics against an ask of 150,000. Every
   computable answer carries a `checkExpr`, every non-computable one is counted
   as unproven out loud, and `npm run quiz:verify` runs before each import — its
   separate counts are the measure of progress, never the total.

**Before any of them, something cheaper.** Nothing in
`docs/UI-TEST-CHECKLIST.md` has been walked by hand since the policies went on,
and four of the last five bugs lived in states no signed-in test ever reaches.
Walk sections 2, 5, 7 and 8 **signed out**.


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

**And the second corollary, learned more expensively still:** a check that only
exercises one *execution context* proves nothing about the others. This app runs
code in four — page render, server action, route handler, service worker replay
— and a request-scoped mechanism that works in the first can do nothing in the
other three without raising a single error. Both proofs of the last release were
real, and neither could see it: the suite runs as the database owner, and the
sweep only renders pages. **When something must hold everywhere, prove it
somewhere that is not a render**: click a form (action), call an endpoint (route
handler), and log in as somebody who is not a parent.

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
- **The tenant binding, after it was found broken everywhere except page
  renders.** The account is in Gotchas; what was re-verified against a
  production build, on Postgres with the policies live:

  | | Before | Now |
  |---|---|---|
  | Teacher logs in with the right password | "Join your school" | Their own dashboard, right school, right class |
  | Teacher takes the register | "That did not save — Wrong role for this action" | **"Register complete"**, three marks in the database |
  | The offline outbox replays that batch | 403 | 200, and **still one row** — same `clientId`, no duplicate |
  | Pupil or teacher opens a handout | 404 | 200 — while the other school's admin and a signed-out request still get 404 |
  | Admin exports the directory | 403 | 200, and the other school's export contains **none** of Riverside's children |
  | Teacher posts to the bulletin | "No active school selected" | Posted, and in the feed |
  | The role switcher | listed nothing | Both of Priya's roles |

  The `app.user_id` half is verified in both directions: a user reads their own
  memberships **across** schools, does **not** see another user's in a school
  they are in themselves, and **cannot insert one** — mutation-tested by adding
  the self clause to `WITH CHECK`, which fails that check and only that one.
- **The competitions marketplace, and the consent gate that is the point of it.**
  The one feature in this app that is deliberately NOT school-scoped: a
  `Competition` has no `schoolId` and no policy, because the same maths challenge
  is the same challenge at both schools and copying it per school would mean two
  rows that drift apart. A `CompetitionEntry` names a child, so it carries
  `schoolId` and IS policied. Shared catalogue, private participation.

  Verified end to end in a production build: a pupil opened *Junior Maths
  Challenge*, pressed **Enter this**, and got "Waiting for a grown-up to say yes"
  — an entry existing, counting for nothing. It appeared on their guardian's home
  page **while a different child was selected in the switcher**, because a consent
  deadline should not hide behind a tab. The guardian pressed **Allow**; the entry
  was stamped with their user id, the child was told, and only then did the
  competition report one pupil taking part. Both audit rows written.

  Then the other direction: a Riverside admin posted a competition, was refused
  for an `http://` link and a start date after the end (**both flagged at once,
  and the form kept everything they had typed** — React resets an uncontrolled
  form after an action, which had been wiping the lot), fixed it, saved a DRAFT
  nobody else could see, pressed **Publish it**, and an **Oakfield** pupil then
  found it in their list and could enter it. `verified` stayed false: a school
  cannot mark its own competition as checked by EduLink.

  44 tests, mutation-tested where it matters — skipping the consent gate fails 9,
  dropping the guardianship check fails 2, counting unconsented entries as taking
  part fails 1, letting another school publish yours fails 2, and deleting entries
  when a competition is withdrawn fails 1.
- **The audit trail had a hole in exactly the shape of "how did this person get
  access".** `audit()` swallows its own failures on purpose — losing a log line
  beats failing a teacher's attendance save — and that exception hid this for as
  long as RLS has been on. Every event that happens BEFORE a school is bound was
  refused by the policy and swallowed: **every login, every failed login, every
  school registration, every invitation accepted, every child joining with a
  code.** Partially, too, which is worse: a login *with* an existing session
  cookie was recorded, because that session had already bound a school, so the
  trail looked populated.

  Two things were wrong and both are fixed. The policy now permits a row
  belonging to no school — on `WITH CHECK` only, so an unattributed row is
  visible to no school's Safety Centre, because a failed login carries the email
  that was tried. And `audit()` binds the school it is recording against, so no
  call site has to remember; the invariant that makes that safe is that its
  `schoolId` always comes from server-resolved context, never from client input.

  Written raw rather than through `create()`, and the reason is worth keeping:
  Prisma's `create` issues `INSERT ... RETURNING`, and reading the row back goes
  through `USING`, where a row with no school matches nothing — permitted to
  insert, refused to return.

  **Verified:** a failed login and a successful one, both driven with no session
  cookie at all, both recorded, zero `[audit] failed` in the log. The successful
  one attributed to Riverside; the failed one unattributed, carrying the actor,
  the attempted email and the IP.

  The second bug this fix introduced and testing caught: raw SQL meant spelling
  out `createdAt`, and both obvious spellings — `now()` and a JS `Date` parameter
  — write the database session's LOCAL time into a column that holds UTC. The
  first of these rows landed **seven hours in the past**, next to every other row
  in the table. `tests/audit.test.ts` pins it, and fails by a mile if either
  spelling comes back.
- **The front door was bolted shut, and the whole onboarding spine with it.**
  Three public entry points and four write flows, all broken by tenant scoping in
  the same two ways, all found by trying to drive a child through the join form.

  **Reading.** A join code names the school it belongs to — that is its entire
  job — so a policy keyed on `schoolId` refuses the one query that could resolve
  it. Every class code and school code read as *"we could not find that code"*;
  every student code failed the parent claim; every invitation link read as
  *"no longer valid"*. Fixed with `app.join_code`: the row whose code you have
  typed, and nothing else, read-only. Verified that the right code opens exactly
  one row, a wrong one opens none, and neither can write.

  **Writing.** The per-query extension does not reach inside an interactive
  transaction — the callback of `db.$transaction` gets a raw client that sets no
  tenant — so every INSERT in a multi-step flow was refused. That is student
  join, invitation acceptance, **school registration** and starting a remark
  thread: the four flows `$tenantTransaction` was written for, and which none of
  them were using. Registration additionally had to mint its own school id
  (nothing can bind a tenant that does not exist yet) and drop its collision
  pre-checks, which asked about other schools and so saw nothing — collisions are
  now caught by the unique index and retried, which is race-free in a way the
  pre-check never was.

  **Verified, each driven end to end against a production build:** a child joined
  Grade 5 · Willow with a real code and got a login handle; a school registered
  from scratch with its admin and landed on `/admin`; an invitation was redeemed
  into a TEACHER membership on the right class; a teacher started a remark
  thread. All four wrote their audit rows, with zero `[audit] failed` — which is
  the other half of the previous commit, proven on flows that are not login.
- **Competition submissions and scoring.** A pupil hands in a link to their work;
  staff at that pupil's own school record what it scored. Driven end to end in a
  production build: the hand-in box **does not appear at all** until a guardian
  has consented, the pupil handed in, a teacher typed `18.5` and a place of 3,
  and it stored **18500** — integer thousandths, like every other score in here.
  The pupil then saw "3rd place · 18.5 points", and both she and her guardian
  were told.

  **Whose school records the result, and why it is not the organiser's.**
  `CompetitionEntry.schoolId` is the ENTRANT's school and is policied, so a
  competition Riverside organises and an Oakfield pupil enters produces a row
  Riverside cannot read at all. That is the right default, so results are
  recorded by the child's own school — which is also how schools actually work,
  since they record their pupils' results in national competitions they did not
  organise either. The staff page is scoped by the policy rather than by anything
  the page does.

  Two things kept deliberately distinct all the way to the database: **clearing a
  result is not scoring zero**, so a typo can be undone in a competition where 0
  is a real mark; and **registration closing does not close the hand-in**, since
  entries close so the organiser knows who is coming and the thing itself happens
  afterwards. Both are mutation-tested, along with the consent gate.
- **The progress report, and the number it must never get wrong.** One child, one
  window, one sheet: attendance with the four counts and the longest run present,
  the points-weighted overall grade, every marked piece of work with the class and
  the teacher's comment, and the badges earned. Print produces the sheet without
  the app around it — `window.print()` and the `.no-print` rule that has been in
  `globals.css` since before there was anything to print, rather than a PDF
  dependency.

  **It computes nothing.** Every figure comes from the helper that already owns
  it, because the one thing a report must never do is disagree with the page a
  parent is holding it next to. The tests say so directly: the report's
  attendance must EQUAL what `getAttendanceSummary` returns and its grade must
  EQUAL `overallPercent`, rather than equalling some number written down here.

  That test started out unable to fail — it compared the report against the same
  helper and then only checked the averaging mistake *if* the two happened to
  differ on seeded data, which for this child they did not. It now builds the
  case that tells them apart (full marks on a five-point quiz, half on a
  hundred-point exam: 52% by points, 75% by averaging) and asserts against that,
  which the mutation then failed as it should have the first time.

  Access is asked for, never re-decided: `assertStudentAccess` for staff — so a
  teacher who does not teach the child is refused even at their own school —
  `assertGuardianAccess` for a parent, and the child themselves. A summary must
  not outrank the things it summarises.
- **112/112 route checks** as a signed-in user of the owning role, against a
  production build, asserting 200 specifically (`npm run sweep`). Includes the
  negatives: another school's class and remark thread → 404, teacher on the
  admin export → 403, student on an admin page → redirected, `/api/push`
  unauthenticated → 401, `/dev/mailbox` → 404.
- **One teacher, two schools — which had never once run.** The README listed this
  as untested; it was not untested, it was broken, and not only on `/switch`. The
  role switcher reads every membership a person has and joins the school on each,
  but only the school being acted for is in scope, so the other one came back
  null and Prisma refused a required relation. The nav shell asks this on every
  page, so `/teacher` and `/account` were **500s too** — a teacher with a post at
  two schools could not open a single page of the app.

  Now: both schools offered in the switcher, and switching genuinely re-scopes —
  his Oakfield class is reachable as Oakfield and **404 as Riverside**, his
  Riverside class the other way round. The widening this needs is the only one in
  the codebase and it stays inside the one function; `tests/tenant-context.test.ts`
  pins that it does not outlive its call, does not survive a throw, and is
  invisible to work running alongside it. Mutation-tested from both ends:
  removing the widening turns 8 sweep checks red, and swapping the override's
  `run` for `enterWith` — the leak that would put another school within reach for
  the rest of the request — fails three of those unit tests.
- **618 tests**, stable across repeated runs. The date, avatar, CSV, attendance,
  tenancy, tenant-request, competitions, reports, audit, academic-year, holidays, onboarding, remarks, grading, bulletin, safety, storage, files,
  file-cache, badges, academic-year, holidays, quiz, slot, image-metadata, uploads, orphans, invite-lifecycle, switch-context, quiet-hours and env suites are each **mutation-tested** — for the bulletin that means four separate
  breaks of the safety model (student posts auto-publishing, visibility ignoring
  status, any teacher approving school-wide, rejecting with no reason), each
  caught.
- **`/bulletin` and `/parent/settings`, production build:** `/bulletin` renders
  for admin, teacher and student across the default, `?filter=mine`,
  `?filter=pending` and `?tag=` views, with a real post in the feed and with the
  feed empty — zero server errors.
- **A badge can be lost, and then cannot be.** THIS REVERSED, at the school's
  request, and both halves are tested. A child present every day for a month and
  then absent loses the streak badge the same day — a streak nobody can lose is a
  participation sticker. What stops that being punitive is the academic year, not
  a softer rule: closing a year writes whatever each child holds at that moment
  into `EarnedBadge`, which nothing ever recalculates. Badges can be lost DURING
  a year and never after it. Quiz badges sit outside this entirely and are
  permanent from the moment they are earned.
- **The academic year is what makes badges reset**, and that is not what the
  first version did. The archive-then-flip ORDER was mutation-tested and the
  mutation passed — because `getBadges` never read the year at all, so a new year
  inherited the old one's register and nothing reset. Windowing the badge query
  on the year's start date is the fix; the ordering mutation now fails two
  checks. A school with no year set up falls back to a rolling 60 days.
- **The seeded class now has a term of attendance** (45 school days, up from 10),
  and the badge counts were RE-MEASURED after the rule reversed rather than left
  as they were. Under the current rule — the last 20 school days, not the best
  spell in the window — "Rock solid" (95%) is held by **6 of 18** and "Here all
  week" by **16 of 18**; the rates run 100 ×6, 90 ×8, 75 ×2, 60 ×2. Under the old
  best-spell rule the same register gave "Rock solid" to 16, because almost every
  child has SOME clean fortnight over a term. That gap is the reversal, visible.
  At the earlier ten-day minimum every child in the class earned it, including
  those on 69%, which is a decoration and not a badge.
- **A measurement script that reads through `db` measures nothing.** The first
  version of `scripts/badge-count.ts` called `getAttendanceSummary`, which goes
  through the RLS-bound app client; outside a request there is no session, so no
  tenant, so every query returned zero rows and the script reported "0 badges,
  18 children with not enough history" with complete confidence. It reads the
  register on the admin connection now. Worth knowing before writing any other
  script that imports from `src/lib/`.
- **Abhyaas — the engine, verified nine ways by mutation.** Promote on one right
  answer instead of two → 4 checks fail. Let streaks survive a level change → 1.
  Stop a right answer clearing the losing streak → 1. Derive the badge gate from
  the response rows instead of the attempt flag → 1. Make `startAttempt` always
  open a fresh attempt, which would launder a reveal by closing the tab → 2.
  Let a repeated answer move the level again → 1. Award before every question is
  answered → 3. Ignore what has already been seen → 11. Count an out-of-range
  choice as correct → 1.
- **The badge cannot be got by peeking, along three separate routes.** The flag
  lives on the ATTEMPT and is never unset, so: deleting the response row that
  recorded the reveal changes nothing; closing the tab and coming back RESUMES
  the attempt rather than starting a clean one; and revealing without answering
  still forfeits. Each is its own test, because each is a plausible way to launder
  a look at the answer.
- **The verifier found a wrong answer in the first hour.** A level-6 question I
  had just written was marked 90 where the worked solution derived 94; the
  `checkExpr` evaluated to 94 and the import was refused. That is the whole case
  for putting a machine-checkable expression on every question whose answer is
  computable — 45 of the current 105 carry one.
- **What `quiz:verify` will NOT tell you**, printed by the tool itself on every
  run: 60 of 105 questions are not machine-checkable, because there is no program
  that can confirm "Dandi March, 1930" answers a history question. It reports
  structure, arithmetic and human-review counts as three separate numbers and
  never collapses them into "verified". A bank that claims to be verified correct
  by a script is telling you about the script.
- **A served question never contains the answer.** `answerIndex` and `solution`
  are not selected at all, rather than selected and dropped — a field absent from
  the query cannot be leaked by a later refactor that spreads the row into a
  response. Tested by asserting the serialised payload does not contain the
  solution text.
- **The reseeded database, verified in the order that catches things.** 568
  tests green, `rls:verify` green — and every one of the 106 routes returning
  **500**, because the reset had taken the app role's `USAGE ON SCHEMA public`
  with it. Neither of the first two checks can see that: the suite connects as
  the owner, and the policy verifier is satisfied by a role that cannot read
  anything at all. `npm run sweep` is what found it. After restoring the three
  grants: **106/106**, `rls:verify` green, on a Mon–Sat register of 54 school
  days.
- **The calendar driven end to end, production build.** With no year set up
  `/admin` shows the “Start your academic year” card; create a year and it
  collapses to a one-line strip naming the next thing on the calendar; the entry
  appears on `/admin/calendar`; a HOLIDAY on today makes `/teacher/attendance`
  warn a teacher that the school is shut **without disabling the register**;
  changing that same entry to an EXAM flips the strip to “School is open” and the
  warning disappears; and a teacher asking for `/admin/calendar` is redirected.
  Plus the Mon–Sat week where a person meets it: a **declared Saturday holiday
  warns**, an **undeclared Saturday does not** — it is an ordinary school day —
  and `/parent/attendance` renders the Saturday sessions with no "Weekend
  session" caption on them. **Eleven checks**, all passing, each asserting the
  text a person would actually read rather than a status code.
- **A twelfth check was written and then deleted**, which is the honest note.
  "A Sunday needs no declaration" was asserting `true`: the register's banner
  reads declared entries only, so a Sunday shows nothing and there was no
  outcome that could have failed it. Sunday is a real assertion in
  `tests/holidays.test.ts`, where the maths can actually be wrong.
- **The Chhutti Calendar, and the one thing it is actually for.** The obvious
  motivation — "attendance should not count holidays" — turned out to be already
  true, and for a better reason than a holiday table: an attendance percentage
  here divides by the registers that were TAKEN, not by days on a calendar, and
  nobody takes a register on Diwali. Adding holidays to that denominator would
  have been solving the same problem twice. The real hole is the opposite one, a
  register taken on a day the school is SHUT, so the calendar's job in that path
  is to warn a teacher before the fact and not to block them — schools do run
  catch-up classes over half term, and a teacher standing in front of a real
  class must not be told the class does not exist. 55 tests, seven mutations,
  all caught.
- **The school week is Monday to Saturday**, and that needed a SECOND predicate
  rather than a change to the first. `isWeekend` is a fact about the calendar
  and is what dims a cell or writes the word "weekend"; `isTeachingDay` is a
  fact about this school and is what every denominator asks. They disagree about
  Saturday on purpose. Collapsing them into one function is the bug: it either
  labels an ordinary Saturday "Weekend session" to a parent, or drops a sixth of
  the school year out of every "out of N days" figure — a whole day a week on a
  number families compare. Mutation-tested three ways — reverting to Mon–Fri
  fails 6 checks, teaching every day fails 6, and pointing `holidays.ts` back at
  `isWeekend` fails 4.
- **A Saturday holiday now does something.** Under the old Mon–Fri week,
  declaring a holiday on a Saturday was a silent no-op — the day was already
  off. It now subtracts a real teaching day, which is the case that flipped and
  the reason the test for it says so out loud.
- **`dateKeyRange` truncates silently**, which made the first version of the span
  validation unable to fire: a two-year range came back as exactly 366 keys, a
  number that looks like a real answer and passes a length check while June has
  fallen off the end. Span length is now computed by arithmetic, an over-long
  span expands to nothing rather than to its first year, and `schoolDaysBetween`
  throws on an over-long window rather than returning a plausible short count.
- **Only `kind: HOLIDAY` closes the school.** An exam week is on the same
  calendar and the school is open; counting it as closed would quietly take a
  week a term out of every "out of N school days" figure in the app. Mutation
  test: make a holiday stop closing the school and four checks fail; make an exam
  start closing it and the count is wrong by five days.
- **What an invitation stops being able to do.** Revoked links refused, resent
  links killing the one before them, expired links refused *and* recorded as
  expired rather than left showing as outstanding. A revoked link and a forged
  one return the identical message, so neither confirms the other exists.
- **Who may become a PARENT.** Every other role is proved by a Membership row;
  PARENT has none by design and is proved by an ACTIVE Guardianship, so it takes
  a different branch — one that granted a role and had never run. A teacher
  asking for PARENT is refused, and so is a parent whose guardianships have all
  been revoked. Mutation-tested: delete that check and two tests fail.
- **Tenant isolation enforced by Postgres, not just by us.** On a real Postgres
  16 with `prisma/rls.sql` applied and an unprivileged app role: no
  `app.school_id` set → every one of the 20 tenant tables returns zero rows;
  acting for one school → only its rows; inserting across the boundary refused,
  updating and deleting reach nothing. The verifier also refuses a SUPERUSER app
  role and any table whose policy is not FORCED — neither of which a query can
  detect, and the FORCE gap was found by an earlier verifier passing with it off.
- **Seeded attendance crosses its own thresholds**, which it structurally could
  not at ten days: "Attendance concern" reads 4 rather than 0, and "Rock solid"
  is reachable rather than unearnable by anyone. The figures above are the
  current ones — this entry previously quoted 148/14/12/6 and streaks of 0, 1, 8
  and 10, both measured on seeds that no longer exist. Re-measure rather than
  carry numbers forward: `scripts/badge-count.ts` exists for exactly this.
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
- **Tenant isolation is enforced by Postgres now, not only by our WHERE
  clauses.** The app connects as `edulink_app` — not the owner, no `BYPASSRLS`,
  not a superuser — so the policies apply to it. With no tenant bound, that role
  sees **0 schools and 0 memberships**. Through the running app: a Riverside
  admin's directory lists Amara and Ben; an Oakfield admin's lists Ava and
  Caleb; neither sees the other's children.

  > This bullet originally ended "all 39 route/role combinations return 200 with
  > the policies live", and that was true and nearly worthless: page renders were
  > the one place the binding worked. Everything the sweep did not touch — every
  > login, every route handler, every server action — was broken at the moment it
  > was written. See Gotchas. A sweep that only exercises one execution context
  > is evidence about that context and nothing else.
- **A parent still spans schools, which is what made this hard.** Jordan has
  children at Riverside AND Oakfield, and their session carries no school at
  all — so a single `app.school_id` returned nothing and every parent page 500'd.
  The tenant is a SET, and the parent page correctly shows both children and both
  school names. A teacher holding posts at two schools works for the same reason.

- **The admin screens that had never been clicked.** Rotating a class join code
  replaces it and the OLD code stops resolving — which is the whole point, since
  rotation is what you do when a code leaks. Archiving names the student count
  and warns first; cancelling changes nothing; archiving moves the class and
  refuses its join code while keeping **18 enrolments, 11 registers, 182
  attendance records, 3 assignments and 16 grades**. Restoring brings it back
  with all of it. "Archive, don't delete" is real.
- **Quiet hours.** Defaults to 21:00–07:00. Setting start and end to the SAME
  time is refused — "Start and end cannot be the same time" — and nothing is
  written, because that pair would silence every notification forever. A valid
  pair saves and survives a reload.
- **The re-submission guard has now executed.** It was described here as
  defence-in-depth for a stale page that had never run. Reproduced by opening
  the hand-in panel, grading the work behind it, and then submitting from the
  now-stale page: refused, the child is told the work has been marked and to
  message their teacher, no submission row is created and the grade is untouched.
- **The parent child-switcher.** Switching between two children in DIFFERENT
  schools re-scopes the whole page, not just the name. A forged `?child=` id
  belonging to a child this parent does not guard falls back to their own child
  rather than showing someone else's.
- **Three pictures on one post, production build.** A student attached three at
  once; each got its own "Describe picture N" field, and leaving the middle one
  blank marked THAT field rather than the form. All three arrived with their own
  words in order, all three were private while the post was PENDING and readable
  by the class the moment a teacher approved it, and all three lost their EXIF on
  the way in (203 bytes in, 160 out).
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

- **The install button.** Chrome only fires `beforeinstallprompt` on a real
  visit over a real origin, so the affordance cannot be driven from an automated
  browser. Everything either side of it is covered.
- **Invite revoke and resend BUTTONS** — the two controls, not the behaviour.
  What they do to an invitation is pinned by `invite-lifecycle.test.ts`: a
  revoked link is refused, a resent link kills its predecessor, an expired one is
  refused and recorded as expired. The accept path is no longer on this list — a
  real token was redeemed, signed out, in a production build, into a TEACHER
  membership on the right class. What remains unclicked is the two admin buttons
  that put an invitation into those states.

### Not built

**Every route referenced by the navigation renders.** All 112 checks in
`npm run sweep` were requested as a signed-in user of the owning role and
returned **200** — not "200 or a redirect", which is what let a 404 and a 500
through an earlier sweep. Rendering is not the same as working: see Gotchas for
the release where every page rendered and nothing saved.

- Suspend-user (the safety centre says to use the school's own process instead)
- Cross-school moderation. The **per-school safety centre is built** — see
  Status, and `/admin/safety` — so what is missing is the tier above it: one
  queue spanning both schools, for whoever runs the server rather than a school.
  There is no actor for it. **The global feed now depends on this gap and works
  around it rather than pretending it is closed**: a school controls what it
  publishes and what it shows, and nobody can take another school's post down
  for everyone. That is stated on the page itself, to admins, in those words. `ROLES` is ADMIN, TEACHER, STUDENT, PARENT, all four
  scoped to a school, and nothing in the app is above a school except the file
  sweep, which is a cron job for the same reason.
- Competition **leaderboards**, and cross-school results generally. Submissions
  and scoring are built (see Status); `leaderboardEnabled` is still the one
  column nothing writes. It is deliberately last: entries are school-scoped by
  policy, so a school records its OWN pupils' results and cannot see anybody
  else's. A ranking across schools would be the first thing in this app to show
  one school another school's children — a decision, and a policy change, before
  it is a page.
- **The Abhyaas question BANK, at scale.** The engine is built and works end to
  end; the bank is **105 questions across 9 topics**, covering all six subjects
  and spread evenly over all six levels (L1–L5 have 18 each, L6 has 15). The ask
  was 500 a chapter, 5,000+ a subject a class — across six subjects and five
  class-levels, 150,000+ questions with worked solutions. So this is **0.07% of
  the ask**, and saying so is the point: the counts below are what the bank has
  earned, not what it was asked for. It is a content programme, not a commit, and
  the honest position is:

  **Not scraped, and this is deliberate.** Olympiad papers, textbook exercises
  and commercial test-prep collections are copyrighted, individually and again
  as curated collections; bulk-scraping them into a database served to
  schoolchildren is infringement and reformatting does not change that. Facts
  are not copyrightable, so every question here is written for this bank against
  the same syllabus, and `source` + `licence` are NOT NULL so provenance cannot
  rot. See `content/quiz/README.md`.

  **Not bulk-generated, and this is also deliberate.** A wrong answer in a
  children's question bank is worse than a missing one — it teaches the wrong
  thing and it is trusted. At 150,000 items nobody can check them, and
  `quiz:verify` is explicit that it checks structure and arithmetic, not
  history. The route that works is batches, each with `checkExpr` where the
  answer is computable and a person's name in `reviewedBy` where it is not, with
  real counts reported per batch. `quiz:verify` prints exactly those counts so
  the bank can never claim more than it has earned.
- ~~Prerna~~ and ~~Margdarshak~~ **both built.** Expert marketplace, slots,
  booking, an admin/teacher↔expert conversation, account creation from an invite
  link, and 1:1 mentoring with a parent-consent gate — including the staff form
  that sets a mentorship up. A teacher may pair only pupils they teach; an admin
  any pupil in the school. See Status.
- **The naming pass.** Hybrid Indian name + English subtitle, agreed and applied
  so far only to what this commit touched: Chhutti Calendar, Shaikshanik Varsh.
  The rest of the app is still English-only.
- SSO (Google/Microsoft/Apple), SMS, i18n beyond English, real email transport
- ~~2FA~~ **built.** TOTP, verified against the RFC 4226 and RFC 6238 test
  vectors, so it accepts codes from any standard authenticator rather than only
  from itself. Single-use per 30-second step, ten hashed single-use recovery
  codes, and a login that issues a five-minute challenge token instead of a
  session when a second factor is owed. **Not clicked end to end** — the wiring
  from the login form through `completeLogin` is typechecked and its library is
  mutation-tested, but nobody has typed a real code into a browser.
- ~~Postgres RLS~~ **done and enforcing.** See Status.

### Known issues

- ~~**`npm run db:reset` leaves the app role unable to open the database.**~~
  **Fixed.** `db:reset` and `setup` now run `npm run db:grants` between the push
  and the seed, which restores the schema USAGE grant, the default privileges and
  the policies, and then **connects as the app role and reads a row** before
  declaring success. The role and database name are derived from `DATABASE_URL`
  rather than hard-coded.

  That last step is the whole point. **`npm run rls:verify` passes against a
  database in the broken state** — a role that cannot open the schema also
  cannot cross a tenant boundary, so every isolation check comes back green
  while every page 500s. Demonstrated by revoking the grant: `rls:verify` still
  reported *All checks passed*, and `db:grants` caught it. Run it by hand any
  time with:

  ```bash
  npm run db:grants
  ```

- **`isTeachingDay` is one school's week, not a setting.** Mon–Sat is hardcoded,
  in one function, on purpose: making it per-school later is a change to that
  body plus a column on `School`, rather than a hunt through inlined
  `day === 0 || day === 6` checks — which is the hunt that produced the function.
- Rebuilding over a running `next start` corrupts `.next` (see Gotchas).
- Outside a page render the tenant is resolved per query, which costs one session
  lookup and one membership check each. Correct everywhere, and measurably
  chattier in route handlers than it was when it was wrong. If it ever matters,
  the answer is a request-scoped memo that works outside React, not putting the
  push back.
- Realtime fan-out is single-process.
- Lighthouse has not been run — no Chrome driver in the build environment, so
  the spec's ≥90 mobile score is **unverified**.
- Deleting a record leaves its files on disk until the sweep runs. Unreachable
  the moment the record goes, so this is disk rather than disclosure. There is a
  cron recipe under Scripts; nothing in this repo installs it for you.
