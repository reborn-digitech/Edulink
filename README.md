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
npm run demo:seed   # optional: data for the calendar, global feed and Experts
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

**Nobody is a superuser in the seed, on purpose.** The operator area at `/root`
is reached by granting the flag to an existing account:

```bash
npm run superuser -- priya@riverside.school
```

There is no UI for granting it and there is not meant to be. The first superuser
cannot be invited by a superuser, so somebody with shell access to the server has
to say so once — and shell access is exactly the qualification the flag
describes. The same last-one-standing guard the school admin suspension has
applies here: you cannot revoke the only one.

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | Dev server (no service worker) |
| `npm run build && npm start` | Production build — **the only mode with a SW** |
| `npm test` | Full suite (1,020 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Wipe and reseed. Restores grants + policies and checks the app role can read |
| `npm run db:grants` | Restore schema grants + policies, then **prove the app role can read**. Run after any manual reset |
| `npm run db:studio` | Browse the data |
| `npm run vapid` | Generate a Web Push keypair |
| `npm run superuser -- <email>` | Grant the server-operator flag. `--revoke` to remove, `--list` to see who has it |
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
mints a real session per role, requests all 235 route/role/negative combinations
and asserts **200 specifically** — not "200 or a redirect", which is what let a
404 and a five-commit-old 500 through an earlier sweep. Run it against
`npm start`, not `npm run dev`: two of the three bugs it has caught only exist in
a production build.

**It follows every link the app draws, and it did not used to.** A role-by-role
audit turned up eight gaps and six were one shape: a capability built and
authorised correctly with nothing linking to it — or a link in the side rail and
the ⌘K palette pointing at a route that never existed. `/expert/profile` was a
404 in both places for months. Nothing caught it, and the reason was structural:
unit tests exercise functions that exist, and the sweep used to request URLs
somebody had thought to type into it. A link that goes nowhere is invisible to
both. So `everyNavLink` now reads `NAV`, `QUICK_ACTIONS` and `PRIMARY_ACTION` —
the single definition all four navigation surfaces render from — and requests
every static href as the role that is shown it. Add a nav entry for a page you
have not built and the next run is red.

**A few checks read the body, not the status.** A page can be a healthy 200 and
still be missing the one thing it exists to show: `/parent/grades` answered 200
throughout the release where a report-card notification led families to a page
with no report card on it. Those checks print `FAIL 200 (body)`.

**It says what it did NOT check.** Every `if (!fixture) return` used to end the
story silently, so "217/217" could cover a role nothing had been minted for —
which is the same blind spot in a different costume. Skips are now listed and
counted under the table. Where a fixture can reasonably be made, it is: the
sweep creates a published expert and a stand-in principal for the length of a
run and removes both in a `finally`.

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
prisma/schema.prisma      51 models. Read the header comment first.
prisma/seed.ts            Two schools on purpose (isolation testing).
prisma/rls.sql            GENERATED tenant policies. npm run rls:generate.
src/lib/                  All business logic. Pages are thin.
  tenancy.ts              ★ THE authorization chokepoint. Read before anything.
  attendance.ts           Offline-safe register merge (idempotent).
  grading.ts              Assignments, marking, overallPercent().
  remarks.ts              Private thread visibility rules.
  bulletin.ts             Post visibility + the student-moderation gate.
  membership.ts           ★ Pausing access. MEMBERSHIP, never the user — see the header.
  superuser.ts            ★ The operator. Keys to TWO tables — School and Invite — and nothing else.
  cohort.ts               ★ Class rolls and staffing. Removing a child MARKS the row, never deletes it.
  register-duty.ts        ★ Who may mark a register today. Cover ADDS a taker, never removes one.
  leave.ts                ★ Staff leave. Approving arranges the cover in the same breath.
  leave-kinds.ts          Client-safe half of the above — a form cannot import `server-only`.
  report-cards.ts         ★ A DOCUMENT, not a query. Publishing freezes it. Read the header.
  insights.ts             ★ The principal's figures. Flags children against a threshold, never ranks them.
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
  academic-year.ts        ★ Academic year. Snapshot THEN flip — the order is the function.
  holidays.ts             ★ School calendar. Range maths is pure; only kind=HOLIDAY closes school.
  quiz.ts                 ★ Practice. Ladder + selection are pure. Reveal forfeits the badge, on the ATTEMPT.
  school-record.ts        ★ Leaving certificates. A document frozen at issue, never a query.
  student-record.ts       ★ A child's record, read with NO school bound. Outlives every membership.
  birthdays.ts            ★ Derived from User.birthdate, never stored. Staff-only — see the DOB note.
  account-merge.ts        ★ Joining two accounts. Cross-school, so forTenant AROUND $tenantTransaction.
  login-name.ts           Handle ↔ email. One rule, because three copies of it had started to drift.
  i18n/                   ★ en/hi/mr. `hi.ts`/`mr.ts` are typed from `en.ts`, so a missing key breaks the BUILD.
  dates.ts                dateKey / timezone / DST. Heavily tested.
  csv.ts                  Real RFC 4180 parser (not regex).
  env.ts                  Boot-time config gate.
  offline-queue.ts        IndexedDB outbox (client-side).
  constants.ts            Every status string, single source of truth.
src/app/(app)/            Signed-in routes (share the nav shell).
src/app/root/             ★ The operator area. OUTSIDE (app) — the shell needs a role, and they have none.
src/app/                  Public routes: login, register, join, invite, switch, suspended.
src/components/ui/        Design system.
  slot.tsx                ★ `asChild`. Deliberately NOT "use client" — see Gotchas.
  file-picker.tsx         Pick-before-submit control (assignment handouts).
src/components/attachment-list.tsx  Attach/detach on an existing record.
src/sw.ts                 Service worker (Serwist compiles to public/sw.js).
tests/                    Integration tests (need the seed).
src/**/*.test.ts          Unit tests.
content/quiz/*.json       The Practice question bank. Read content/quiz/README.md first.
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
8. **Archive, don't delete.** Classes own attendance and grade history. The same
   rule reaches further than it looks: taking a child off a class roll sets
   `Enrollment.status = REMOVED` rather than deleting the row, because that row
   is what every attendance record and every mark in the class hangs off — a
   delete tidies a list by removing a term of somebody's history, and nothing
   fails loudly enough to notice. Re-adding revives the same row.
8b. **A report card is a DOCUMENT, not a query.** Everything on it is snapshot
   at generation and frozen at publication, including the assessment titles.
   Recomputing on read means the card a parent read in December quietly says
   something else in March because a teacher fixed a typo. Regenerating a
   published card does nothing; changing one means withdrawing it first.
8c. **Unmarked is not zero.** Anywhere a figure is derived — a report card, a
   class average, a principal's dashboard — work with no mark is EXCLUDED and
   counted separately, never scored nought. A test the child has not sat is not
   a mark of nought, and a class where half the work is unmarked must not report
   the other half's average as the class's.
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
  Enforced by a test now — `tenancy-shape.test.ts` greps `src/` and fails on any
  `db.$transaction(` call — because the rule was already written here and five
  more call sites were added anyway. **The reason it says so had gone stale, and
  a rule with a wrong reason is one people correctly conclude does not apply to
  them.**

  What this bullet used to say was that the callback gets a raw client with no
  `app.school_ids`, so every INSERT inside is refused by the policy. That was
  true when it was written and it is how the first four flows — join, invite
  acceptance, registration, starting a remark thread — were found dead. On
  Prisma 6.19 the extension **does** reach the interactive callback, so those
  writes now succeed and are correctly scoped. The hazard did not go away; it
  went quiet.

  What is left is worse to find. The extension re-issues every query inside its
  own `base.$transaction` in order to bind the tenant, so a `db.$transaction`
  hands its statements to an outer transaction they never join, and **atomicity
  is silently gone**. Measured with a tenant bound and a deliberate failure on
  the second statement of three otherwise identical transactions:

  | form | first statement |
  |---|---|
  | `db.$transaction([...])` | **persisted** — not atomic |
  | `db.$transaction(async (tx) => …)` | **persisted** — not atomic |
  | `db.$tenantTransaction(…)` | rolled back — atomic |

  Found at five sites: recovery codes deleted and not replaced (a second factor
  with no way past it), a leave request cancelled with its cover still standing,
  a class left with no weighting categories at all. **No test could see any of
  it**: `npm test` has no session cookie, so the tenant resolves empty, the
  extension short-circuits, and both broken forms behave like healthy Prisma
  transactions. `tests/transaction-atomicity.test.ts` closes that by binding a
  tenant with `forSchool` — the one thing the suite could always have done and
  never did — and pins all three rows of that table.
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

1. **SSO.** Cannot be verified without real provider credentials — budget for
   that rather than discovering it at the end. 2FA is **built** and proven
   against the RFC's own vectors; SSO is the half that still needs an account
   with Google, Microsoft or Apple to test against.
1b. **Click the paths that are only reasoned about.** Two features now render,
   typecheck and are mutation-tested without anybody having typed into them in a
   browser: the 2FA login step and the whole staff chain added last —
   leave → approval → cover → report card → dashboard. Every boundary is proved
   by `npm run sweep` with real sessions, and every rule by unit tests, but a
   form is not the same as a function. §§12m–12q of the checklist exist for
   exactly this and are the cheapest outstanding work in this file.
2. **Fill the Practice bank.** DELIBERATELY LAST. The engine, importer, verifier,
   badge and the English/Hindi/Marathi switch are all done and proven; what is
   missing is only content, and content does not block anything else in this
   list. 105 questions across 9 topics against an ask of 150,000. Every
   computable answer carries a `checkExpr`, every non-computable one is counted
   as unproven out loud, and `npm run quiz:verify` runs before each import — its
   separate counts are the measure of progress, never the total.

**Before any of them, something cheaper.** Nothing in
`docs/UI-TEST-CHECKLIST.md` has been walked by hand since the policies went on,
and four of the last five bugs lived in states no signed-in test ever reaches.
Walk sections 2, 5, 7 and 8 **signed out**, and then §§12m–12q, which have never
been walked at all.

**The single highest-value box in that file** is the one in §12p that says: change
a mark that is on a published report card, reopen the card, and check the number
has not moved. Three unit tests assert it, but it is the property a school would
notice last and trust least, and it is worth seeing once with your own eyes.


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

**And the third corollary, from this session:** a test fixture that touches
SHARED seed data breaks suites that have not changed. `register-duty.test.ts`
did it twice — first by DELETING a seeded `ClassTeacher` row to get a teacher who
was not on the class, then, after that was "fixed", by ADDING Tom as class
teacher of a seeded class and not removing him. Four other suites read those
rows, vitest runs files in parallel, and they started failing with
"Student not found in your classes" in files nobody had edited. Adding is exactly
as destructive as deleting, because other suites assert on what is NOT there.
The rule that holds is not "clean up after yourself" — it is **make your own
fixtures and touch nobody else's**. Every suite added this session creates its
own class with its own join code and deletes it on the way out.

**And the sharpest version of the fixture rule, learned from mutation testing
itself:** a negative test is only harmless *while the guard it tests is
present*, and mutation testing exists precisely to remove that guard.
`school-record.test.ts` had a test asserting that a departure cannot be recorded
for a member of staff, aimed at seeded Tom. Fine — until the mutation run
deleted the guard, the refusal became an action, and the run recorded a seeded
teacher as having left, wrote him a certificate, and broke four suites in files
nobody had edited. **The subject of a negative test has to be disposable too.**
It is the case most likely to actually run.

**And the fixture rule has a second half nobody was applying: a User cascades
from nothing.** `holidays.test.ts` and `quiz.test.ts` both created users, then
cleaned up by deleting their SCHOOL — which cascades the memberships and leaves
the people. Six users per `npm test`, every run, since those files were written.
Nothing failed, which is why it lasted: the rows are inert. It surfaced only
when a row count taken during a browser walkthrough kept climbing. Both suites
now remember the ids they create and delete them, and the count is stable across
consecutive runs.

**And one that hid behind row order for months:** `grading.test.ts` and
`files.test.ts` both picked a class with `findFirst` and no `orderBy`, from a
teacher who has three. The seed puts 18 pupils in one and 3 in each of the
others, so whether the suite passed depended on what Postgres felt like
returning — and re-seeding was enough to flip it. Both now select on the
property the test actually depends on (the class with enough children in it; the
class the guardian's child is actually in). An `orderBy` would only have made the
coin-toss repeatable.

**And a smaller one that cost a bad commit:** `npm test | tail -4 && git commit`
masks the exit code. `tail` succeeded, so `&&` proceeded, and 13 failures were
committed. Do not pipe a command whose exit status you are branching on.

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
  them were using. **That failure mode has since changed shape** — on Prisma 6.19
  the extension does reach the interactive callback, so those writes succeed and
  what is lost instead is atomicity, silently. See the `$tenantTransaction`
  bullet under Gotchas; five more call sites were written against this
  now-outdated description before a test was added to enforce the rule. Registration additionally had to mint its own school id
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
- **Practice — the engine, verified nine ways by mutation.** Promote on one right
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
- **The school calendar, and the one thing it is actually for.** The obvious
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

- **A school run by the people who run it.** Six pieces, one chain, and the
  chain is the point — each was proved through the function the next one asks,
  not by counting rows.

  **Whoever runs the server** (`/root`, `superuser.ts`). Creates schools, corrects
  their details, invites their first admin or principal. A FLAG on `User`, not a
  role: a role is what a session acts AS and belongs to a school, and this
  belongs to the person and to no school. It opens exactly two tables. With the
  flag set and no school bound, `rls:verify` asks Postgres for membership,
  attendance, grade, message, post, enrolment and audit rows and gets **none**,
  and a Membership write is **refused** — an operator who could mint memberships
  could mint their own. Inviting, never minting: the person accepts through the
  ordinary `/invite/[token]` flow.

  **Classes, sections and who marks the register.** `Class.section` is optional,
  because a village school with one Class 5 should not have to invent a "5A".
  Creating a class offers the grades the school actually teaches and the server
  re-checks the choice. `ClassTeacher.canTakeAttendance` separates "is this class
  mine?" from "am I marking it today?" — a visiting music teacher attached to six
  classes passes the first for all six and should be marking none. Defaulting it
  to TRUE was deliberate: the tighter default would have made every existing
  register untakeable on the morning it shipped.

  **Cover, which ADDS a taker and never removes one.** Reassignment reads better
  in a sentence and is worse in a school: a teacher whose leave is cancelled
  would be locked out of their own register. An admin can always mark any
  register in their school — the last failsafe, not a convenience. A principal
  cannot, seniority notwithstanding, unless actually asked to cover. The sweep
  proves the ENDPOINT refuses a withdrawn duty, not merely that the page hides
  the class.

  **Class rolls** (`cohort.ts`). Until now the only way into an Enrollment row was
  a child typing a join code. Multi-select to add thirty at once; one at a time to
  remove, because that is the direction that takes a child off a roll. Removing
  MARKS the row `REMOVED` and re-adding revives it — that row is what every
  attendance record and mark in the class hangs off.

  **Leave, which arranges its own cover** (`leave.ts`). Approving writes the
  AttendanceCover rows in the same operation, because a leave system that records
  an absence and leaves somebody to remember the register has moved the problem
  rather than solved it. The applicant's nomination is a SUGGESTION; the covers
  are written from whoever the principal chose. Nobody decides their own request,
  whatever their role. Withdrawing removes only the cover *that request* caused.
  **Staff-only by construction**: leave has its own table rather than a Holiday
  row with a filter on it, and `approvedLeaveBetween` REFUSES a pupil or guardian
  rather than returning an empty list — an empty list is indistinguishable from
  "there is none" and would start leaking the day somebody widened the query. The
  calendar shows who is away and deliberately not why.

  **Report cards** (`report-cards.ts`). Written by the LEAD class teacher or an
  admin — not a co-teacher who takes the class for music, and not the principal.
  Everything is snapshot at generation and frozen at publication, including the
  assessment titles; three tests do nothing but change the underlying marks after
  publishing and check the card did not move. An unmarked assessment is BLANK,
  never zero. A draft is invisible to the child and the guardian. It prints —
  chrome stripped, black on white, the school's own logo served through the
  authorised file route.

  **The principal's dashboard** (`insights.ts`). Attendance by class, academic
  progress, and each pupil's report card. It flags children against a threshold
  and never ranks them: pupils come back alphabetically whatever their marks, and
  a test asserts that using a pupil who sorts last and scores best. A class
  average is the mean of each PUPIL's own overall — summing everybody's points
  would let one child who sat every paper outweigh five who sat none. Pupils with
  no marks are excluded and counted separately. LATE counts as present; a class
  with no register taken reports `—`, not 0%.

  **PRINCIPAL is a peer of admin, not a rank above it.** The admin sets the school
  up; the principal reads what came out and decides who may be away. The sweep
  proves the split: a principal opens the dashboard, the class figures, the staff
  calendar and the leave queue, and is turned away from the register, the
  directory and class creation.

  **A pupil's permanent record**, walked in a browser as somebody who has left
  BOTH their schools: signed in and landed on `/record` rather than on a join
  code, and read two schools in one page — Oakfield (*Finished school here*,
  *went on to St Xavier's — not on EduLink*, the leaving note), Riverside
  (*Transferred*), 80% attendance at each with the day counts, a report card at
  each with its items, an unmarked assessment shown as **—** rather than 0, the
  badges, and *frozen as this school left it*. The DRAFT card seeded alongside
  each published one appeared nowhere. Their guardian, also with no active role,
  opened the same journey for their child. The sweep confirms the other half
  with the same cookie: `/student`, `/student/practice`, `/bulletin` and
  `/student/grades` are all 307.

  **A transfer by invitation**, walked in a browser: a pupil with a Riverside
  leaving certificate opened an Oakfield invitation sent to the address they
  already use, met a page reading *Add Oakfield Academy to your account — your
  password does not change* with no password field, accepted, and landed on a
  profile showing Riverside with its dates and 95.3% attendance. One account,
  two schools, nothing merged. **Removing a pupil**, also walked: the refusal
  fired on a pupil with one register mark and said *1 day on a register*
  alongside the pointer to *Left*; the mis-added pupil went in one click, the
  headline count dropped 26 → 25, their account survived with zero memberships,
  and the audit line was there afterwards.

  **Joining two accounts** (`account-merge.ts`), **walked in a browser** rather
  than reasoned about: a pupil with a Riverside leaving certificate and a fresh
  Oakfield account signed in as the new one, saw no previous school on their
  profile, was refused with the same sentence for a wrong password and for a
  login name that never existed, read a confirm screen naming the person, the
  school and *Left 20/03/2026*, and came out the other side with Riverside on
  the profile — dates, 95.3% attendance over 190 marked days, two report cards,
  *went on to Oakfield Academy*. The old account was left `disabledAt` with
  `mergedIntoUserId` set, not deleted. Five live `rls:verify` checks hold the
  cross-school write, including the negative one: bound to a single school it
  cannot touch the other school's membership row.

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

**Every route referenced by the navigation renders.** All 235 checks in
`npm run sweep` were requested as a signed-in user of the owning role and
returned **200** — not "200 or a redirect", which is what let a 404 and a 500
through an earlier sweep. Rendering is not the same as working: see Gotchas for
the release where every page rendered and nothing saved.

This claim is now derived rather than asserted: the sweep reads the navigation
model itself and follows every static href, so "every route referenced by the
navigation" means the actual list rather than one somebody maintained by hand.
`/expert/profile` was in that list and was a 404 for months.

- ~~Suspend-user~~ **built, as suspend-MEMBERSHIP.** An admin can pause and
  restore anybody's access to their own school from the directory, with a reason
  that is required and audited. The distinction is the whole design: a teacher
  may work at two schools, so Riverside pausing them must not lock them out of
  Oakfield, their own account, or their children's parent view. `User.disabledAt`
  is the global kill switch, no admin can reach it, and there is still no actor
  above a school who could — see the next item.
  **The revocation is the database's, not the UI's.** `ownMembershipIn` already
  filtered `status: "ACTIVE"`, so the moment a suspension commits the request's
  tenant set goes empty and Postgres stops handing that school's rows over.
  `npm run sweep` proves it with a live session: the same cookie that opened the
  register a second earlier is turned away from every page scoped to that school.
  **Nothing is deleted** — marks, attendance and enrolments are all still there,
  and restoring is one click.
  A paused person gets `/suspended`, which names the school and says what to do.
  It exists because the alternative was a lie: they used to land on "You are not
  part of a school yet — join with a code", and there is no code that helps.
- Cross-school moderation. The **per-school safety centre is built** — see
  Status and `/admin/safety` — so what is missing is the tier above it: one
  queue spanning both schools.
  **There is now an actor who could own it, and deliberately no queue for them
  yet.** The SUPERUSER flag exists, but it holds keys to exactly two tables,
  School and Invite, and `Post` is not one of them — so an operator cannot read a
  school-scoped post, let alone take one down. Giving them a moderation queue
  means widening that boundary to Post and Report, which is a decision about what
  the person hosting this software may see inside somebody's school, and it
  should be made deliberately rather than as a side effect of wanting a feature.
  **The global feed still depends on this gap and works around it rather than
  pretending it is closed**: a school controls what it publishes and what it
  shows, and nobody can take another school's post down for everyone. That is
  stated on the page itself, to admins, in those words.
- Competition **leaderboards**, and cross-school results generally. Submissions
  and scoring are built (see Status); `leaderboardEnabled` is still the one
  column nothing writes. It is deliberately last: entries are school-scoped by
  policy, so a school records its OWN pupils' results and cannot see anybody
  else's. A ranking across schools would be the first thing in this app to show
  one school another school's children — a decision, and a policy change, before
  it is a page.
- **The Practice question BANK, at scale.** The engine is built and works end to
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
- ~~Experts~~ and ~~Mentoring~~ (formerly Prerna and Margdarshak) **both built.** Expert marketplace, slots,
  booking, an admin/teacher↔expert conversation, account creation from an invite
  link, and 1:1 mentoring with a parent-consent gate — including the staff form
  that sets a mentorship up. A teacher may pair only pupils they teach; an admin
  any pupil in the school. See Status.
- ~~The naming pass~~ **done, and reversed in approach.** The hybrid
  Indian-name-plus-English-subtitle scheme is gone: every feature now has a plain
  English name — Prerna → **Experts**, Margdarshak → **Mentoring**, Abhyaas →
  **Practice** (route moved to `/student/practice`), Chhutti Calendar → **School
  calendar**, Shaikshanik Varsh → **Academic year**. A name baked into one
  language is the wrong primitive for an app that has to speak three; the name is
  now a dictionary key and the language is a setting.
  **The `abhyaas:` badge-id prefix is deliberately unchanged** — it is stored
  identity, not display, and renaming it would orphan every badge already earned.
- ~~i18n beyond English~~ **partly built. English, हिन्दी and मराठी**, switchable
  per user from Settings, stored in the same `prefs.locale` that already drove
  Practice — one field, one switch, so a Marathi app can never serve Hindi
  questions. **Coverage is partial and the app says so**: the shell, all
  navigation, role labels, the account page and login are translated; every other
  page is still English. The switcher itself carries that sentence, so nobody
  meets an English page and wonders whether it is broken.
  **Hindi and Marathi were written by me, not by a native speaker** — good first
  draft, wants a real teacher's eye before a real school reads it.
- SSO (Google/Microsoft/Apple), SMS, real email transport
- ~~2FA~~ **built.** TOTP, verified against the RFC 4226 and RFC 6238 test
  vectors, so it accepts codes from any standard authenticator rather than only
  from itself. Single-use per 30-second step, ten hashed single-use recovery
  codes, and a login that issues a five-minute challenge token instead of a
  session when a second factor is owed. **Not clicked end to end** — the wiring
  from the login form through `completeLogin` is typechecked and its library is
  mutation-tested, but nobody has typed a real code into a browser.
- ~~Postgres RLS~~ **done and enforcing.** See Status.

- **A pupil who joined with a CODE rather than an invitation still forks.**
  `joinAsStudent` mints a new account every time, and a handle account has no
  real address for a new school to invite. The invitation path is the one that
  does not fork, and the account merge is the repair for the one that does — so
  a school transferring a pupil should invite them by email. Letting a
  signed-in person add a school with a join code would close the gap and is
  deliberately not built: it changes what joining MEANS, since an admin at one
  school could become a pupil at another in one click.

- **An alumnus cannot reach `/account`.** The record is readable but the
  settings behind it are not, so somebody who has left every school cannot
  change their language, their password or their notification preferences. Same
  root cause as the item below — `/account` needs an active role — and now much
  more visible, because there is a whole population of people who legitimately
  have none. `/record` carries a sign-out button so it is not a dead end, but
  moving the account page out from behind the gate would close both at once.

- **The account page is behind the role gate.** `/account` lives inside the
  signed-in shell, which needs an active role, so somebody with no remaining
  context — a paused member with nowhere else to be — cannot reach their own
  settings. Not caused by suspension, but that is where it shows: `/suspended`
  carries a sign-out button for exactly this reason. `npm run sweep` asserts the
  307 rather than wishing it away. Moving the account page out from behind the
  gate is its own change.

### A pupil transferring school, and the certificate that goes with them

**The problem is the tenant boundary, and it cannot be solved by relaxing it.**
When a child moves from Riverside to Oakfield, Oakfield must never be able to
read a Riverside row — that is the point of the whole schema and Postgres
enforces it. So "their previous school, on their profile" cannot be a query
across schools. It has to be a **document Riverside wrote**, frozen when it was
written, exactly as a report card is a document rather than a live view of a
gradebook.

That is `SchoolRecord`: a leaving certificate. School name **as it was**, grade
reached, the dates, days marked and days present, how many report cards were
issued, and a line for the next school.

**A summary, never an export.** Not the marks, not the register day by day, not
a message. That is what a transfer certificate has carried on paper for a
century, and it is the right amount: enough to place a child in the right class,
not enough to precede them with a file. A receiving school that wants the detail
asks the family for the report cards the family already has.

**Leaving is not pausing**, and keeping them apart is most of `school-record.ts`.
Suspension says *not for now* and expects the person back. This says *they have
gone*, and a directory that cannot tell the two apart cannot answer the only
question a school asks in September. `Membership.leftAt` is what changes — a
column that 25 queries already filtered on and **nothing had ever written**, so
until now there was no way to leave a school at all. Every one of those filters
becomes the revocation for free: the moment it commits, Postgres stops handing
that school's rows to that pupil. Nothing is deleted.

**The policy grew one clause, and it is the only one in this schema that lets a
school read a row another school wrote.** `MEMBER_READABLE` opens a certificate
to a school where the child holds a live ACTIVE membership *now* — a handover,
not a browse — plus `SELF_READABLE` on `studentUserId` so the child can still
read their own after their membership at the issuing school has ended. Both are
SELECT-only, so a receiving school can read a certificate and can never write,
edit or withdraw one.

Six live checks in `rls:verify` hold that shape: the issuer can read it, the
receiving school can, a school that never taught the child **cannot**, reading it
opens nothing else of the issuer's, the child reads their own with no school
bound at all, and the receiving school cannot delete it. Replacing the predicate
with `true` turns one red. The redundant-looking `m."schoolId" = ANY(...)` line
inside it stays, and the comment says why: deleting it keeps every check green
today only because Membership's own policy already narrows the subquery, and a
clause whose safety depends on another table's policy is one a change over there
silently rewrites.

### The expert marketplace had no door handle, and birthdays had no source

**`publishedAt` gated the marketplace and nothing could set it.** An unpublished
expert is invisible, unbookable and unpairable — the gate worked. Only
`prisma/seed.ts` ever wrote the column, so on a real installation no expert
could reach the marketplace without psql: a finished feature behind a door with
no handle, the same shape as the empty VAPID keys. `/root/experts` is the
handle, unpublished first because that is the queue.

**It is the operator's and not a school's.** An expert belongs to no school, so
no school can vouch for one, and a school that could publish would be putting an
adult in front of every other school on the installation. Admins and teachers
still invite; an invitation buys a profile, not an audience. **No policy change
was needed** — `ExpertProfile` is in `NO_SCHOOL_POLICY`, so the operator writing
it is not a widening of `SUPERUSER_TABLES` and they still cannot read a register.
Published and verified stay separate: one is "may schools find this person", the
other is "has a human checked who they are".

**An expert now says what they are offering.** A workshop for a hall and a term
with one eleven-year-old are different commitments, and every published expert
was silently available for both — a retired engineer happy to talk for an hour
was one click from being made responsible for one child. `SESSIONS`, `MENTORING`
or `BOTH`, enforced on booking and on pairing rather than filtered in a page.

**The cap lives on `ExpertProfile`, not counted from `MentorThread`**, and the
test called *counts ACROSS SCHOOLS* is why: that table is school-scoped, so
counting it from inside one school waves the expert past their limit at every
school after the first. Claimed with a conditional UPDATE like a slot, released
on close. Two mutations survived first and both were real — the already-closed
guard passes with ONE mentorship because the `gt: 0` floor masks it, and nothing
covered booking a mentoring-only expert at all.

**Birthdays are derived, never stored.** A birthday is not an event a school
decided to hold; it is a fact about a person that recurs. Holiday rows would
mean 400 a year to delete when children leave, going stale when a date is
corrected. Nothing converts a timezone either — a birthday is a calendar date,
not an instant, and converting moves it by a day for half the world.

**And an invitation now asks for one.** `joinAsStudent` always did; an
invitation never did, so every invited pupil and every member of staff had none
— the calendar could show a birthday for almost nobody, and a guardian claiming
an invited child was refused for want of a second factor. Optional, because a
date somebody would rather not give must not be what stops them accepting a job.

**STAFF-ONLY, and this is the load-bearing bit.** A child's date of birth is the
SECOND FACTOR when a guardian claims them with a student code, so publishing
birthdays to classmates would quietly reduce that to one factor. The section
lives on `/admin/calendar`, behind `requireRole("ADMIN", "PRINCIPAL")`, and
pupils have no calendar page at all — an admin can already read the directory
and link a guardian by hand, so this tells them nothing new. **If it ever moves
to a page pupils can open, the claim gate has to be revisited.**

**The two cases that break the arithmetic both have tests.** The year wrap —
"the next 120 days" asked in November spans two years, and comparing months as
numbers returns nothing for all of it. And 29 February, which three years in
four do not have: a leap-day child shows on the 28th, flagged, rather than being
missing while their classmates are named. `year % 4 === 0` passed the whole
suite until a test pinned 2100.

### The record is the child's, and it outlives every school

**A record that disappears when you change school is not a record.** Until this,
everything a school wrote about a child was reachable only while the child was
that school's pupil: the moment a membership ended, the tenant went empty and
Postgres correctly stopped handing over their report cards, their attendance and
the badges they earned. A leaver could see a certificate saying they had been
somewhere and nothing describing what they did there. A family who moved to a
school not on this platform lost the lot.

**So the DATABASE now says the record belongs to the child**, not the
application. `OWN_RECORD_READABLE` opens `ReportCard`, `ReportCardItem`,
`AttendanceRecord` and `EarnedBadge` to the child they are about and to their
active guardians, keyed on `app.user_id`, **with no school bound at all** —
which is the only tenant state an alumnus will ever have again.

**Two ways in, and the difference matters.** The child's branch goes through
Membership, whose own policy grants `userId = app.user_id` with no school bound;
that is a dependency on another table's policy, and it **fails closed** — if
that clause went away this returns nothing rather than everything. The guardian's
branch goes through Guardianship, which carries `studentMembershipId` directly
and has no policy at all, so it depends on nothing.

**Read only, and it is the reason this is safe to have.** FOR SELECT, never
WITH CHECK, never in a USING that governs DELETE — the lesson the join code
taught. A family may read their record forever; only the school that wrote it
may change it, and only while they are its pupil. Two live checks prove a leaver
can neither delete nor edit their own card.

**What was NOT widened is the design.** `Grade` is absent: a report card is the
frozen document and a gradebook is the school's working surface, so a leaver
reads the card rather than the marks behind it. `AttendanceSession` is absent
too, which is why the record shows attendance **figures** and never the
day-by-day register — a register is a school's operational record of a room on a
morning, and a leaver has no claim on it. What they have a claim on is the count
of their own days, which is what a report card and a certificate both quote.

**21 live `rls:verify` checks hold it, and the negatives are the point**: for
each of the four tables, the leaver reads their own row, **not** a classmate's;
the guardian reads it across a school the child has left, and **no** other
family's child; and a request that is nobody reads nothing at all.

**`/record` lives OUTSIDE `(app)`, and that is the restriction rather than a
routing detail.** `(app)` needs an active role, which an alumnus does not have.
Being outside it means there is no route from the record to the bulletin, to
practice, to messages or to a class — the layout renders no navigation to them,
and every one of those pages independently requires a live membership. Enforced
twice and by construction, not by a hidden button. The sweep signs in as a pupil
who has left every school and confirms `/record` is 200 while `/student`,
`/student/practice`, `/bulletin` and `/student/grades` are all 307.

**Where a leaver used to land was "join with a code"** — the fourth wrong answer
that branch has given, after a superuser and a paused member. There is no code
that helps somebody who is not joining anything, and everything their schools
wrote was one redirect away and invisible. `hasRecord` is the question that
tells an alumnus from a brand-new parent, and it is asked in both places that
decide: the login redirect and the signed-in shell.

**A guardian's journey is grouped by the CHILD, not the membership** — one child
at two schools is one child, and without that grouping a parent whose daughter
moved schools meets two strangers with the same name. They see the schools they
are **linked at**: a school's records are that school's to hand over, and the
student code is how it does the handing. The leaving certificate is the
exception and it is the designed one — it travels with the family precisely so
they can show it to the next school.

**Drafts never appear in a record.** A draft is a teacher's working copy, and a
record read years later by somebody with no school left to ask must not be the
one place it leaks. Seven mutations, all caught, including that one.

### A transfer, done properly: the new school invites, the old school records

**THE INVITATION IS THE PATH THAT DOES NOT FORK, and it already half-worked.**
`acceptInvite` has always looked the address up and attached a membership to the
EXISTING account rather than minting a second one. So for any pupil with a real
email, a transfer is: the new school invites them at the address they already
use, the old school records them as having left, and the leaving certificate is
already on the account they sign in with. **There is nothing to merge.** The
merge below is for the case this one does not cover.

**What was wrong was the conversation, not the code.** The page said "Join
{school}. Set a password and you are in", and the form demanded one — which
`acceptInvite` then kept out of the database, because overwriting an existing
password is not something an invitation may do. So a transferring child typed a
new password, was signed in immediately, and found out **weeks later**, when the
session had gone and they tried the password they chose, that it had never been
stored. A lockout with a delay on it, on a child at a school that has just met
them. Four tests reproduce it; the first two are red without the fix.

Now: an invitation to an address that already has an account says so, drops the
password field, reads *Add {school} to your account — your password does not
change*, and tells a transferring family in as many words that this is the right
way to move schools because the record travels with the account. Supplying a
password there is **refused** rather than ignored — "we took your input and did
nothing with it" is the failure being removed, and accepting it quietly would
put it straight back. A brand-new account still requires one, and always will:
an account with no password is one nobody can ever sign into again.

**Removing somebody, which is the third verb.** A school needs to say three
different things and they are not interchangeable — PAUSE (not for now, they are
coming back), LEFT (gone to another school, here is a certificate), and REMOVE
(they were never here: a duplicate, a typo, the wrong school). Before this the
third had to be spelled as one of the first two, and both lie: pausing leaves a
person in the directory forever implying they might return, and recording them
as having LEFT writes a leaving certificate for a child who never attended.

So `removeMembership` **deletes**, and it is the only thing in this codebase that
does. The justification is narrow and does not generalise: a tombstone is for
somebody who WAS here, and the entire precondition is that they were not.

**The precondition is the safety, not the confirmation dialog.** It refuses the
moment there is a register mark, a grade, a piece of work handed in or a report
card — the very things a leaving certificate summarises, so "there is history"
and "the answer is LEFT" are the same sentence and the error says so. **Every
blocker is reported at once**, with counts: an admin told "they have attendance",
who clears it and comes back to be told about marks, has been given the answer
twice and helped neither time. Pupils only, never yourself, never another
school's row, and the audit line is written **after** the row is gone — it is the
only remaining evidence the person was ever on the roll.

Nine mutations, all caught. One survived first: deleting the self-removal guard
changed no outcome, because an admin's own row is an ADMIN row and the
pupils-only guard refuses it anyway. It earns its place on the SENTENCE alone —
the message it replaces tells an admin to pause themselves, which
`suspendMembership` then refuses as the likeliest way to strand a school. So the
test asserts the words, which is the only thing that could have shown it.

### Joining two accounts, which is what a transfer actually leaves behind

**The certificate travels on `studentUserId`, so a second account strands it.**
That is not an edge case: `joinAsStudent` mints a fresh `User` every time it
runs, so a family who arrive at their new school and join with a code get a new
account by default, and "their previous school, on their profile" silently shows
nothing. The transfer feature was only half a feature until this existed.

**Direction: the account you are signed in to survives.** It is the one whose
password the child remembers and the one their new school emails; bringing the
old life forward is also fewer rows than pushing the new one back.

**Authorisation is ownership of both, and there is deliberately no other way
in.** The old account's password, plus its second factor if it has one —
otherwise this becomes the way to take a 2FA-protected account without the
second factor. **No admin can do this.** A school admin who could merge accounts
could absorb a child's account from a school they cannot otherwise see, which is
the boundary the rest of this codebase exists to hold, so the page lives under
`/account` and says so in those words.

**What moves** is what makes two rows one person: memberships — and with them,
for free, every mark, register, report card and enrolment, because those hang
off `Membership.id`, which does not change — plus leaving certificates,
guardianships, and authorship of posts, comments, reactions and remark messages.
Bulletin decides "is this mine?" on `authorUserId`, so without that last one a
child could no longer edit their own work the day they merged.

**What does not move**, each for its own reason: credentials (they are how you
prove you are the old account, which is the thing that stops existing); audit
log entries, because a record of who did what is not improved by rewriting who
did it; safeguarding reports, because `reporterUserId` is closer to a signature
than to profile data; and notifications about a school the person has left.

**The old account is CLOSED, NOT DELETED.** `User` cascades to Post, Comment and
Reaction, so deleting it would take a child's term of class-bulletin posts with
it — the merge would destroy exactly the history it was asked to preserve.
`disabledAt` stops the login, `mergedIntoUserId` records where the person went.

**It refuses rather than guessing:** a self-merge, both accounts at the same
school in the same role (which `@@unique([userId, schoolId, role])` would refuse
anyway — this says it in words), a superuser account in either direction, an
expert account whose bookings and mentorships are a different feature's problem,
and an account with no password. That first refusal earns something: **two
accounts that share no school cannot collide on any school-scoped unique key**,
which is what makes moving authorship safe without a per-row check.

**One transaction, bound to every school either account touches.** A run that
moved the memberships and failed before the certificates would leave a child's
history split across two accounts, one of which can no longer be signed in to —
strictly worse than the problem, and unrepairable from the UI. `forTenant`
around `$tenantTransaction` is what makes that possible: the plain helper binds
the ONE school the session names, and a merge is cross-school by definition.

**`rls:verify` proves the half the unit suite structurally cannot.** The suite
connects as the owner, so with the policies off every UPDATE succeeds whatever
is bound — a merge reaching into an unrelated school would pass all 19 tests.
Five live checks now hold it: a merge bound to one school **cannot** move
another school's membership; before a merge the receiving school **cannot** read
the old account's certificate; bound to both it can move membership and
certificate; and afterwards the receiving school **can** read where the child
came from — with nothing in `rls.sql` changed to allow it, because the row now
names a user who holds a live membership there and `MEMBER_READABLE` does the
rest.

**A confirm step, because the likely failure is not a bug.** It is a parent
typing the wrong child's login name. Nothing is written until a name, the
schools and the dates have been read back. The preview hands out no token and
the merge re-verifies from scratch, so a preview left open on a shared laptop is
worth nothing — and **mutation testing is why that claim is trustworthy**: a
version of `mergeAccounts` that replayed the password captured at preview passed
the entire suite, because the test that was meant to catch it changed the STORED
hash, which fails for any submitted value. The test that kills it submits the
wrong password against an account whose password is still right.

**When it is needed, and when it is not.** A pupil invited by email never forks
in the first place — see the section above, which is the path a school should
use. This is the repair for the one that does: a child who joined with a class
CODE, which mints a fresh account by design and gives them a handle no school
can invite. A signed-in person meeting `/join` is still told to sign out and
start again, because letting them add a school to an account they already hold
changes what joining MEANS, and that is a decision rather than a follow-up.

### Dates, and the last English word

**`<input type="date">` renders in the BROWSER's locale and the page gets no
say.** `lang="en-GB"` on the input, on a wrapper and on `<html>` were all tried
in Chromium; all three still drew `mm/dd/yyyy`. So a school in Pune was being
asked for the month first with nothing saying so — and **05/04 is two different
days depending on who reads it**. On a birthday used to prove a parent's claim
to a child, that is not cosmetic.

`DateField` replaces all seventeen date inputs. What changed and what did not:

- **Day-first for the human**: `dd/mm/yyyy`, everywhere, whatever the browser
  thinks.
- **ISO for everything else**: the value is still `YYYY-MM-DD`, submitted under
  the same `name` by a hidden input, because that is what every action, query and
  `dateKey` in this codebase already speaks. Nothing server-side changed.
- **The native picker is kept**, not thrown away: a hidden `type="date"` sits
  alongside and a calendar button opens it via `showPicker()`. If the browser
  has no `showPicker`, the button hides itself rather than sitting there doing
  nothing.
- **`31/02/2026` is refused, not rolled to 3 March.** `new Date` would happily
  roll it, and a birthday typed wrongly must come back and ask rather than
  quietly become a different day. The round trip is the check — an explicit
  bounds guard stood beside it until mutation testing showed nothing it rejected
  could reach it, so it was deleted rather than kept as decoration.

**And the last English word.** `(required)` was screen-reader-only text in the
shared `Field`, so a fully translated Marathi login form still announced one
English word — to exactly the readers least able to work around it. Sighted
users get the red asterisk; this is what the asterisk MEANS, and it is now
translated in all three languages. The date MASK is deliberately not: `dd/mm/yyyy`
is a shape, not prose, and दद/मम/वववव is a pattern nobody has seen on a form, a
passport or a bank slip. `i18n.test.ts` lists it beside the example email address
as shared-with-English on purpose, so the check that everything else IS
translated stays a real check.

### Onboarding a school by hand, and the five things it found

**The first time anybody clicked the whole chain.** Superuser → create a school
→ invite its first admin → accept → create a class with a section → invite a
teacher pinned to that class → accept → a pupil self-joins with the class code →
the teacher takes the register. In a browser, against a production build.

**It works, end to end.** The things worth naming because they were claims until
now: the grade range a superuser types is exactly what the admin's class form
offers (`3` to `10`, nothing else, with "This school teaches 3 to 10" under it);
`app.join_code` resolves a brand-new school's class code with no session at all;
the register saved against the school's own timezone (Asia/Kolkata dated it
August 5 while Riverside, in London, said August 4); and a pupil with no marks
shows `—` for attendance rather than 0%.

**Five things were wrong, all found by looking rather than by any test.** Every
one was a healthy 200 the whole time — which is why the sweep could not see
them, and why the five checks added for them read the body rather than the
status.

| What | Why it mattered |
|---|---|
| **No language switcher on any signed-out page** | `setLocale` has always written the cookie without a session — its own comment says it exists "so the login page can be read in the language the reader picked". The page is fully translated. Only the control was missing, so a shared school computer left the next reader stranded in the previous person's language with no session to change it. `/login` now carries it. |
| **A school's FIRST invitation named neither sender nor recipient** | The email was shown only when there was an inviter, and `superuser.ts` writes `createdByMembershipId: null` on purpose. So exactly one invitation in the system fell through to a bare "Set a password and you are in" — the one that starts a school, from somebody the recipient has never met, and the only one they cannot check was meant for them. |
| **`/switch` omitted the operator area** | The page titled *"Where would you like to go?"* offered a superuser every destination except the one only they can reach. The redirect to `/root` fires only for an operator with *no* school; one who also runs a school got the list without it. A side-rail link was added last release and this page was missed. |
| **`/join` silently bounced a signed-in visitor** | A pupil sent to join on a teacher's laptop followed "join with a code" from the login page and landed on the teacher's dashboard, with nothing saying why. §7 forbids dead ends; a silent redirect to the wrong person's home is one. It now says who is signed in and offers "Sign out and join". |
| **The seed left both schools with no grade range** | So a freshly seeded install showed "Needs setup" against both of them in the operator area — the app telling the truth about a gap the *seed* left. Riverside is 3–6 and Oakfield 5–8 now. |

Also fixed in passing: `/root/new` said *"Creating it does not give it anybody
to run it"*, which is not a sentence.

**Two accepted as correct, recorded so they are not re-found:** accepting an
invitation while signed in as somebody else replaces the session (the invitation
is the credential — but it now says so before you press the button), and
`/join/student` and `/join/parent` still redirect a signed-in visitor, because
they are reached from `/join`, which is the screen that explains it.

**Both of the small ones are now fixed too** — see *Dates, and the last English
word* below.

### The role-by-role audit, and the eight things it found

Walking each role's journey end to end — how they get in, what they land on,
what they can reach — turned up eight gaps. All eight are fixed. They are worth
recording together because **six were the same bug wearing different clothes**: a
capability built correctly, authorised correctly, tested correctly, with nothing
linking to it.

| # | What was wrong | Fix |
|---|---|---|
| 1 | `/expert/profile` was a **404**, and it was in the expert's side rail *and* their ⌘K palette | The page now exists: `getOwnProfile` / `updateOwnProfile`, headline, bio, specialisms as chips, timezone |
| 2 | `publishCards` notified guardians with `url: "/parent/grades"` — and that page never read report cards | `/parent/grades` renders published cards at the top. `cardsForChild` existed and was unwired |
| 3 | An admin could approve leave (`decideLeave` accepts `ADMIN`) but nothing linked to the queue | `NAV.ADMIN` and the palette now carry `/principal/leave` |
| 4 | An admin could write report cards (`assertMayWriteCards` accepts `ADMIN`) but had no path to the builder | `/admin/classes/[classId]` links to it |
| 5 | A principal made LEAD of a class **could not write that class's cards** — the page gated on `requireRole("TEACHER", "ADMIN")` while `cohort.ts` deliberately allowed the appointment | `PRINCIPAL` added to the door; `assertMayWriteCards` is still what decides, and still refuses a principal who is not the LEAD |
| 6 | Arranging cover notified **nobody**. The covering teacher found out by noticing a class they do not teach | `arrangeCover`, `cancelCover` and `cancelLeave` all notify the person whose Tuesday it is, urgent so it survives quiet hours |
| 7 | A superuser who also held a school role had **no link to `/root`** — the redirect only fires for one with no school at all | A "Server administration" entry in the side rail and the palette when `isSuperuser` |
| 8 | Operator audit rows are written with `schoolId: null` so they land in no school's Safety Centre — and **nothing could read them**, including the person who wrote them | `/root/audit`, plus a policy clause letting a superuser SELECT rows where `schoolId IS NULL` and **nothing else** |

Two of these changed more than a link:

**`cardsForChild` took the school from the session.** A parent with one child at
each of two schools has one `activeSchoolId` and two children, and the child
switcher moves between them without touching the session — so one child's cards
appeared and the other's silently did not. It now takes the school from the
child. `rls:verify` and a test both cover it.

**The audit policy grew a clause, narrowly.** `SUPERUSER_NULL_READABLE` is
`schoolId IS NULL` *and* superuser, in the `FOR SELECT` policy only — never in
`WITH CHECK`, and never in a `USING` that governs `DELETE`, which is the lesson
the join-code hole taught. A tenant's audit rows carry a schoolId and are exactly
as unreachable as before. `rls:verify` now asserts both directions: the operator
can read their own trail, and no school can.

**What actually let this happen** is in the sweep section above: unit tests
exercise functions that exist, and the route sweep used to request URLs somebody
had thought to list. A link pointing at nothing is invisible to both. The sweep
now derives its list from the navigation model, so this class of bug fails on the
next run rather than in a role audit six months later.

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
