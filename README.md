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

**`.env.example` has two settings worth reading before a real deployment.**
`SMS_TRANSPORT` and `EMAIL_TRANSPORT` both default to `"devbox"`, which writes
messages to the database and renders them at `/dev/mailbox` — and `env.ts`
refuses to boot a production origin with either still set that way, because "no
message was actually sent" has no symptom until somebody cannot get into their
account. `NEXT_PUBLIC_DEFAULT_COUNTRY_CODE` decides which country a bare mobile
number belongs to; it defaults to `+91`, and getting it wrong does not fail
loudly — it files everybody under the wrong country and turns two spellings of
one number into two accounts.

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

Sign in with an **email, a mobile number, or a student handle** — one box takes
all three. No seeded account has a number on it; add one at `/account` to try
that path, and `/forgot` sends a reset code to whichever you type. **Both
contacts are changeable at `/account`**, each behind a code sent to the new one.

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
| `npm test` | Full suite (1,374 tests) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:reset` | Wipe and reseed. Restores grants + policies and checks the app role can read |
| `npm run db:grants` | Restore schema grants + policies, then **prove the app role can read**. Run after any manual reset |
| `npm run db:studio` | Browse the data |
| `npm run vapid` | Generate a Web Push keypair |
| `npm run superuser -- <email>` | Grant the server-operator flag. `--revoke` to remove, `--list` to see who has it |
| `npm run appadmin -- <email>` | Grant the content-team flag (question bank + platform competitions). Same `--revoke`/`--list`. The operator can also do this at `/root/content-team` |
| `npm run guardians:backfill` | Give every unclaimed pupil their stand-in guardian (class teacher/admin). `--dry` to preview. Idempotent |
| `npm run files:check` | List stored files no record references — **deletes nothing** |
| `npm run files:reclaim` | Actually delete them. Read the check output first |
| `npm run backfill:school-id` | Add/fill the denormalised schoolId on an existing dev DB |
| `npm run quiz:verify` | Check the hand-written question bank. Structure + arithmetic. **Says what it cannot check** |
| `npm run quiz:import` | Load `content/quiz/*.json`. Verifies first and refuses the run if anything fails |
| `npm run quiz:generate` | Generate + import the 1M drill bank (grades 3–12). Deterministic, idempotent, every question checkExpr-proven before writing. `--dry` generates and verifies without touching the DB |
| `npm run rls:generate` | Regenerate `prisma/rls.sql` from the schema |
| `npm run rls:verify` | **Needs Postgres.** Proves tenant isolation end to end |
| `npm run sweep` | **Needs the app running.** Every route, as the role that owns it |
| `npm run i18n` | What is still hardcoded English, per file. `-- <path>` for one file |
| `npx tsx scripts/fix-mentoring-links.ts` | One-off repair for notifications pointing at routes that never existed. Reports; add `--write` to fix |
| `node scripts/gen-icons.mjs` | Regenerate the PWA icon set |
| `tsx --tsconfig scripts/tsconfig.json scripts/badge-count.ts` | Who holds which badge in the seeded class, under the CURRENT rule |

`npm run sweep` is the one that catches what unit tests structurally cannot. It
mints a real session per role, requests all 315 route/role/negative combinations
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
prisma/schema.prisma      56 models. Read the header comment first.
prisma/seed.ts            Two schools on purpose (isolation testing).
prisma/rls.sql            GENERATED tenant policies. npm run rls:generate.
src/lib/                  All business logic. Pages are thin.
  tenancy.ts              ★ THE authorization chokepoint. Read before anything.
  attendance.ts           Offline-safe register merge (idempotent).
  grading.ts              Assignments, marking, overallPercent().
  remarks.ts              Private thread visibility rules.
  bulletin.ts             Post visibility + the student-moderation gate.
  membership.ts           ★ Pausing access. MEMBERSHIP, never the user — see the header.
  superuser.ts            ★ The operator. The FLAG opens two tables; sight into a school binds that ONE school, recorded. Removal, never deletion.
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
  operator-oversight.ts   ★ What the host can do inside a school. Always on now; one door: withSchoolAccess, every visit written.
  birthdays.ts            ★ Derived from User.birthdate, never stored. Staff-only — see the DOB note.
  account-merge.ts        ★ Joining two accounts. Cross-school, so forTenant AROUND $tenantTransaction.
  login-name.ts           Handle ↔ email. One rule, because three copies of it had started to drift.
  timetable.ts            ★ Three layers: periods, a dateless TEMPLATE, and a week resolved against leave.
  school-day.ts           Client-safe half of the above. Minutes from midnight; WEEK_DAYS is Mon–Sat.
  phone.ts                ★ Client-safe. ONE stored shape for a number, or nothing. `User.phone` is unique.
  passwords.ts            ★ Login by email/mobile/handle, the reset, and changing either contact.
  auth-tokens.ts          ★ Spending an emailed link, ONCE. Conditional UPDATE, not read-then-write.
  sms.ts                  Text transport. Devbox only, same shape as email.ts. Fails loudly.
  rate-limit.ts           ★ The FIRST rate limit here. Fails OPEN — see the header for why.
  i18n/                   ★ en/hi/mr. `hi.ts`/`mr.ts` are typed from `en.ts`, so a missing key breaks the BUILD.
  dates.ts                dateKey / timezone / DST. Heavily tested.
  csv.ts                  Real RFC 4180 parser (not regex).
  env.ts                  Boot-time config gate.
  offline-queue.ts        IndexedDB outbox (client-side).
  constants.ts            Every status string, single source of truth.
  app-admin.ts            ★ The content team. Curates the two things no school owns: the bank and platform competitions.
  translate.ts            ★ Machine translation for bank questions, en → hi/mr at save time. Fails SOFT — see the header.
src/app/(app)/            Signed-in routes that belong to a SCHOOL (share the nav shell, need a role).
src/app/root/             ★ The operator area. OUTSIDE (app) — the shell needs a role, and they have none.
src/app/appadmin/         ★ The content team's area. Outside (app) for the same reason as /root.
src/app/account/          ★ Also outside (app), for the same reason: an alumnus and a paused member
                          have no role and must still reach their own settings. Renders the ordinary
                          shell when there IS a role — see components/nav/signed-in-shell.tsx.
src/app/record/           ★ Outside (app) too. A leaver's own record, and nothing else.
src/app/                  Public routes: login, forgot, register, join, invite, switch, suspended.
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
  with no way past it — that feature has since been removed, but the bug it
  demonstrates has not), a leave request cancelled with its cover still standing,
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
- **`Assignment_examSlotId_classId_key` was created by hand on the dev
  database** (`CREATE UNIQUE INDEX` via `prisma db execute` on the admin
  connection), because adding a unique to the populated table made `db push`
  demand `--accept-data-loss` it did not need. The name matches Prisma's own, so
  `db push` reports in-sync and a fresh database gets the index from the schema
  normally — the note in `schema.prisma` next to the `@@unique` is the
  authority if the two ever seem to disagree.

### Next steps, in priority order

**This list has nearly emptied itself.** Item 1b is EMPTY and item 2 is
FILLED (both below, with the receipts). What genuinely remains is item 1 —
SSO, blocked on provider credentials — and the go-live wiring no list item
ever captured: real email/SMS transports, a git remote, one real-origin visit
for the install button, and a native reader for the Hindi and Marathi.

1. **SSO.** ~~Blocked~~ **BUILT** — Google, Microsoft and Apple as plain OIDC
   authorization-code + PKCE on `fetch` and `node:crypto`, no SDK
   (`src/lib/sso.ts`, `/api/sso/[provider]/start` + `/callback`). The design
   decisions are the safety decisions: **SSO signs people in, never up** — an
   identity matching no account is refused with directions, because school
   accounts come from invites and join codes where somebody vouches for you;
   the provider `sub` is the key and a verified email only the introduction
   (an address change at Google keeps the account, a recycled address cannot
   inherit somebody's children); a disabled account is refused exactly as at
   password login. ID tokens are verified against the provider's JWKS — RS256
   only, `alg:none` and downgrades refused — plus issuer/audience/expiry/
   nonce; Apple's ES256 self-signed client secret is minted with a
   five-minute life. A provider exists only while its `SSO_*` env vars do:
   unconfigured, the login page shows no buttons and the routes 404. Seven
   tests pin the linking policy, the verification (own keys, real
   signatures, every downgrade), and Apple's secret; a live probe with fake
   credentials confirmed button rendering, the PKCE-S256 authorize redirect,
   and a forged callback bouncing to `/login?sso=state`. **What genuinely
   remains is only the walk with real credentials** — registering the three
   redirect URIs (documented in `.env.example`) is dashboard work only the
   operator can do, and Apple additionally requires HTTPS end to end.
1b. **Click the paths that are only reasoned about.** ~~Nearly empty now~~
   **EMPTY.** The last four items were exercised, and three of the four were
   hiding real bugs — which is the whole argument for this list having existed:
   - *Principal-as-LEAD*: `tests/principal-lead.test.ts` walks the appointment
     through the real `assignTeacher` (an ADMIN membership is refused; a
     PRINCIPAL one goes through), then generates and publishes a card as the
     head. Refused before the appointment, refused again on demotion to CO.
   - *Quiet-hours delivery*: `tests/notify-delivery.test.ts` registers a real
     HTTPS endpoint as the user's push subscription and watches the web-push
     POST arrive or not — suppressed inside the window, delivered outside it
     and when urgent, and the in-app row written every time.
   - *Print output* — TWO BUGS. The first printed progress report carried the
     side rail, bottom tabs and the FAB (`.no-print` covered only the page's
     own controls), and a dark-theme user's print kept the dark variables:
     grey-on-nothing headings, since browsers don't print backgrounds. The
     shell chrome is now `print:hidden` and every dark palette block sits in
     `@media screen` — paper is always the light theme. Seen fixed in an
     actual print-to-PDF of a signed-in page, not reasoned about.
   - *Multi-pupil ordering* — ONE BUG. The guardianship query behind
     `children[0]` — the child every parent page opens on — had NO orderBy, so
     the default child was Postgres row order (the grading.test.ts coin-toss,
     one layer up). Now `createdAt: "asc"` (first claimed, first shown), same
     for the /record page's children (by name), pinned by
     `tests/children-order.test.ts` with fixtures inserted in the OPPOSITE
     order to what is asserted. Verified live with the seeded two-school
     parent: stable order on five pages, default child correct, `?child=`
     honoured.
2. ~~**Fill the Practice bank.**~~ **FILLED — 1,005,105 questions across all
   six subjects, 99.97% of them self-proving.** The ask: ~100,000 per class
   (3–12), split across the subjects, not just maths. Each grade holds exactly
   100,500 — maths carries the most (40–55k, shrinking as science grows to
   18–27k), with geography, history, civics and economics holding a steady
   band — via `npm run quiz:generate` (`scripts/gen-quiz-bank.ts`),
   deterministic and idempotent. The honesty rule bent without breaking:
   every NUMERICAL question — all of maths, science numericals (speed,
   density, F=ma, Ohm's law, Q=mcΔT), map scale and longitude-time, timeline
   arithmetic over dated events, quorum/majority/representation, discount/GST/
   per-capita — derives its answer from a `checkExpr` evaluated through the
   verifier's own evaluator before the row is written: 1,004,724 of 1,005,000.
   The remaining **276 are fact recall** (state capitals, element symbols,
   event years, the Constitution's numbers), generated ONLY from curated fact
   tables in the script — a few hundred rows a person can actually read, which
   is what reviewing them means — and counted out loud as machine-unproven.
   `tests/drill-bank.test.ts` pins the ratio: recall may never exceed 0.1% of
   the bank. The 105 hand-written questions are untouched; the generated
   Hindi/Marathi (templates AND fact-table names) carry the same native-reader
   caveat as the rest of the app. A later pass rebuilt every chapter to climb
   the FULL L1–L6 ladder — the one-step questions that used to pile at L1 were
   scrapped and regenerated as multi-step Olympiad/NSO-style material at the
   top rungs (harmonic-mean round trips, net forces, series circuits and
   electricity bills, map areas scaling by n², timeline age chains, successive
   discounts), still checkExpr-proven, still with a worked solution per
   question in all three languages; `gradeTopics()` refuses any plan whose
   chapter misses a rung.

**The cheap thing got done.** Sections 2, 5, 7 and 8 were walked signed out and
§§12m0–12q walked for the first time — roughly 150 boxes against a production
build, from a school registered from nothing. The prediction held exactly: the
two real bugs it found (the first-parent claim 500, the guardian report-card
404) lived in states no signed-in test ever reaches, behind pages that were a
healthy 200 throughout. Both are fixed and the walk's box-by-box log names
which boxes were retracted, which were stale, and which cannot be walked in an
automated harness.

**The single highest-value box has been seen.** A mark was changed under a
published report card and the card did not move — 75.0% and 15/20 before,
75.0% and 15/20 after, regenerate leaving it alone, and only
withdraw-then-regenerate picking up the new 90%. The three unit tests were
telling the truth.


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

**And the correction to all of the above, which cost most of a session:** "a
file nobody edited went red, so another suite is writing its rows" is a HEURISTIC,
and by this point it had been right often enough to stop being checked. Twice it
was wrong. `transaction-atomicity.test.ts` and `register-duty.test.ts` each failed
roughly one full run in twenty-five, passed in isolation four times running, and
were hunted as shared-fixture contention. Neither was. Run the file ALONE IN A
LOOP before believing anything else — twenty-five times, not four. Both of these
reproduce on their own, and the loop is thirty seconds against an afternoon of
reading other people's `beforeAll`.

Two things make that heuristic weaker than it reads. `fileParallelism: false` has
been set since the Postgres move, so no two suites are in the database at once and
"another suite wrote it mid-run" is not available as an explanation the way the
notes above assume. What DOES still vary is the ORDER: vitest sequences files by
their cached duration from the previous run, so it reshuffles slightly every time
and looks exactly like parallel contention from the outside. Consecutive runs with
identical file order gave different results here, which is what finally ruled it
out.

What the two actually were, both being timing inside a single file:
`transaction-atomicity.test.ts` read the probe row the instant `db.$transaction`
rejected. The extension had re-issued the first statement in a transaction of its
own — the very defect the file asserts — and Prisma does not wait for that
transaction to commit before rejecting the batch, so the read landed before the
commit and reported a rollback that had not happened. The read now POLLS until
the orphaned write settles — `FOR UPDATE` was the obvious fix, was tried first,
and only cut the rate rather than zeroing it; the file's own comments carry the
full account of why.
`register-duty.test.ts` built a "membership that does not exist" as
`principalMembershipId.replace(/.$/, "x")` — a real cuid with its last character
overwritten. A cuid ends in a random base36 character, so about one run in
thirty-six that id already ended in `x`, the bogus id WAS the real one, and cover
was arranged for real. **A fixture derived from a live id by mangling it is a
fixture that collides on a schedule.** Name a row that is genuinely wrong for the
reason under test — the Oakfield membership it now uses is refused because it
belongs to another school, which is the thing the test is about.

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
  **⚠ "magic link" was on this list while the link 404ed**, and had been for a
  long time: the form that REQUESTS one has always worked and was what got
  walked, and nobody followed the email to the end. It is true now — a real link
  was read out of the mailbox and opened — but the lesson is that "login works"
  is not a claim a form can support on its own. Where a flow ends in an email,
  the check has to end in the inbox.
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
- **618 tests at the time of this entry** (1,266 now), stable across repeated runs. The date, avatar, CSV, attendance,
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
  run: 60 of the 105 hand-written questions are not machine-checkable, because
  there is no program that can confirm "Dandi March, 1930" answers a history
  question. (The generated drill bank holds the same line at scale: 99.97%
  checkExpr-proven, and its 276 recall questions may only come from the fact
  tables in the generator — reviewable as a few hundred rows.) It reports
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

- **The weekly timetable, and a replacement nobody has to remember.** Three
  layers kept apart: `TimetablePeriod` is the school's bells, `TimetableSlot` is
  a TEMPLATE with no dates in it, and only the resolved week knows about leave,
  cover and holidays. A cover never edits the grid; it changes what the grid
  resolves to on the days it applies. Times are minutes from local midnight as
  integers — a bell does not move because the clocks did — and weekdays are
  `Date.getUTCDay()`'s, so the table and every date key in the app share one
  convention.
  **Nobody is in two rooms at once**, refused in the application with a message
  naming the class in the way and refused again by a unique index on
  `(schoolId, weekday, periodId, teacherMembershipId)`. Postgres treats NULLs as
  distinct, so the constraint holds for staffed lessons and leaves the unstaffed
  ones free — which is what lets a grid be laid out before it is staffed, in the
  order an admin actually works. Demonstrated by writing the clash directly
  through Prisma, bypassing the application check entirely.
  **Approving leave now covers timetabled lessons, not just registers.** Those
  are different sets of people: a visiting music teacher marks no registers and
  is due in six rooms. Covering only the first list left every one of those
  lessons with an absent teacher and nobody arranged. The decision screen had
  the same bug in its arithmetic — it said "applies to 1 class" and then wrote
  two.
  **Walked in a browser, production build:** laid out a school day from the
  suggested one, put Mathematics in Tuesday period 1, hit the double-booking
  refusal by re-enabling the disabled `<option>` and saving anyway, approved
  Tom's leave with Priya as cover, and watched *Priya Raman covering for Tom
  Fielding* reach the class page, the pupil, the covering teacher's own week and
  the absent teacher's. A lesson added AFTER the approval showed as
  *Tom Fielding is away · no cover arranged*, counted in a banner on the
  principal's page — which is the state the feature exists to make visible.
  Four `rls:verify` checks: a school reads its own timetable, the school next
  door reads none of it, and cannot write or delete a lesson into it.

- **A guardian reads their child's week.** `weekForStudent` takes a school id
  rather than a context, so the pupil's claim (the school on their session) and
  the guardian's (an ACTIVE Guardianship) each stand on their own — a parent
  holds no membership and no school, so there was no tenant to check a child
  against. Asserted as `toEqual` against the child's own week rather than
  described: a parent and a child disagreeing about Thursday is the one thing
  that page exists to prevent.
  **Mutation testing caught a test passing for the wrong reason.** Removing the
  parent check from the guardianship query SURVIVED, because the "not your
  child" case used a pupil with no guardian at all — refused either way. It now
  uses a child who has a guardian, just a different one.
  **A pre-existing bug fell out of the walk:** the child switcher hardcoded
  `/parent?child=…`, so a guardian comparing two children's attendance was
  thrown back to the overview on every switch. It takes a `basePath` now.

- **The cross-school leaderboard: schools are ranked, children are not.**
  `leaderboardEnabled` had been a column nothing wrote since competitions
  shipped, and this file said why — a ranking across schools "would be the first
  thing in this app to show one school another school's children". The decision
  was made the other way. `CompetitionStanding` holds a school name, a count of
  results, a best place and a best score, and no column that could name a pupil;
  `CompetitionEntry`, where the names and individual marks are, was not widened
  by one row.
  **Denormalised rather than aggregated across the boundary**, the same choice
  `Post.globalSchoolName` made: computing this from entries would have meant
  opening every entrant's name and mark to every school on the server to solve a
  display problem.
  **The flag is in the policy, not in a page's `if`**, so taking a board down
  closes it in the database. Standings keep being maintained regardless, which
  is what lets an organiser switch one on in week three and see the truth.
  **Recomputed, never adjusted** — a running total has to be right after a
  clear, a withdrawal, a corrected typo, and two of those racing. The typo case
  has its own test: 910000 entered for 91000 must not leave a school top for
  good.
  **Walked across two schools, production build:** recorded a result through the
  real UI, watched the board reorder for the school that did NOT organise it,
  took it down and saw it close for them while the standings survived
  underneath. Four `rls:verify` checks, including the one that stops the others
  passing vacuously (a school DOES read another's standing when the board is on)
  and the one that matters most — another school's entries are never readable,
  under any condition.

- **`/account` came out from behind the role gate.** It lived inside `(app)`,
  which requires an active role; the pages under it never did — they have always
  been `requireUser` — so this was a layout refusing on behalf of pages that
  would have rendered. Three populations were locked out of their own language,
  password and sign-out: an alumnus (a whole population the leaving-certificate
  work created), a paused member, and anybody between contexts. `/suspended` had
  to carry its own sign-out button precisely because of this.
  The sweep asserted the 307 with a comment calling it a known limitation; it
  now asserts **200** for the paused teacher and the alumnus both, while every
  school page beside it stays 307 — which is the distinction the move rests on.
  The shell moved to `SignedInShell` so the two layouts cannot drift.
  **Walked as a real alumnus with a leaving certificate**, which is how the one
  thing the move broke was found: "Where you belong" said *You can switch at any
  time* over an empty list, to exactly the person the page now exists for. Three
  states, in all three languages.

- **2FA removed; one password, and a reset by email or mobile number.** The
  product decision is recorded under Not built, including that it lowered the
  account-security floor. What replaced it:
  **ONE BOX TAKES THREE LOGINS** — an email, a mobile number, or the handle a
  pupil who joined with a class code was given. `identifierKind` decides by
  shape and `findAccount` resolves each to exactly one row, because `email` and
  `phone` are both unique. The failure message names none of the three.
  **EVERY WAY SOMEBODY WRITES THEIR OWN NUMBER LANDS ON ONE STRING.** `+91 98765
  43210`, `09876543210`, `98765-43210` and `9876543210` all store as
  `+919876543210` — which matters because `User.phone` is unique, so two
  spellings are one account and one constraint error nobody can act on. The
  default country is a setting, not a constant, because the first deployment
  outside India would otherwise file every parent under the wrong one.
  **FOUR BUGS IN THAT FUNCTION WERE FOUND BY ITS OWN TESTS**, before any of it
  ran: a greedy `\d{1,3}` rendered an Indian number as `+919 876543210`;
  `12345` inflated to a plausible `+9112345`; a `+` in the middle was accepted
  as a country code; and one of the tests asserted that last behaviour as
  CORRECT — written the wrong way round, and the implementation obliged.
  **THE RESET SENT CODES TO `@edulink.local`.** A pupil's handle is a lookup key
  wearing the shape of an email, and `.local` will never route — so with a real
  transport configured that is a credential for a child's account sent to a
  domain nobody owns. `isDeliverableEmail` now refuses it, silently, because
  saying so would confirm the account exists.
  **SIX DIGITS, MADE DEFENSIBLE BY EVERYTHING AROUND THEM**: hashed together
  with the user id so a code cannot be tried against an account it was not
  issued for, five attempts, ten minutes, previous codes consumed on request,
  and every session and token revoked on success. Neither end says whether an
  account exists — the "we sent a code to the number ending 3210" hint is the
  last four digits of what the CALLER typed, never of what we hold.
  **Walked in a browser, production build:** added a number, watched it
  normalise live, signed out, signed in with `98765 43210`, asked for a reset,
  read the SMS at `/dev/mailbox`, was refused a wrong code, set a new password,
  and confirmed the old password dead, zero live sessions and zero unconsumed
  tokens.
  Two of the four mutation survivors turned out to be complementary rather than
  untested — remove either "only the newest code works" check and the tests hold;
  remove both and they fail. That is recorded in the code. A third was genuinely
  dead and was deleted.

- **The two gaps the last commit left, closed.** Both were mine, both were named
  in this file before they were fixed, and both were in the flow that replaced
  2FA.
  **A NUMBER NOBODY PROVED THEY HELD COULD RECEIVE A RESET CODE.** `saveMobile`
  wrote whatever was typed straight onto the account with `phoneVerifiedAt`
  null, and the page apologised for that in small print. One mistyped digit
  pointed somebody's reset codes at a stranger's phone permanently — discovered
  on the day they needed one. Adding a number now costs a code sent TO it, and
  **nothing is written until the code comes back**: the pending number waits in
  the token's `meta`, so an unconfirmed number is nowhere a lookup can reach it.
  `findAccount` additionally refuses an unconfirmed phone, so it is neither a
  login nor a destination — one predicate, no third state where it is one but
  not the other. Removing a number needs no code, because demanding proof to
  remove one would strand somebody with a number they cannot receive codes on,
  which is the exact failure being fixed.
  **THERE WAS NO RATE LIMITING ANYWHERE IN THE APP.** Tolerable while the worst
  an unlimited form could do was let somebody guess a password against argon2.
  Reset by mobile number changed the shape of it: the app will send a text to a
  number the CALLER types, so an attacker picks a stranger's number, loops, and
  this software becomes the thing harassing them at the deployment's expense.
  `rate-limit.ts` is the first one — in the database rather than in memory,
  because the two moments a limiter matters most are a deploy and a busy
  afternoon. Three reset requests per identifier per 15 minutes, ten logins,
  three phone codes per USER (keyed on the user, not the number, or swapping the
  number buys a fresh allowance).
  **IT IS KEYED ON WHAT WAS TYPED, NOT ON THE ACCOUNT IT RESOLVES TO** — an
  identifier matching nobody is limited identically to one that does, or the
  limiter becomes the enumeration oracle the reset flow spent its effort
  avoiding. There is a test for exactly that.
  **IT FAILS OPEN, AND THAT IS THE UNCOMFORTABLE HALF.** A limiter outage must
  not become an authentication outage locking every family out of every account.
  Asserted rather than described — and the first version of that assertion
  proved nothing: it used a 20,000-character bucket assuming the column would
  refuse it, Postgres `text` has no length limit, the row inserted happily, and
  `allowed: true` was the ORDINARY answer. It now replaces the delegate with one
  that throws, and removing the fallback turns it red.
  **Walked in a production build:** typed a number, confirmed the account row was
  still `null` while the code was in flight, entered the code, watched
  `phoneVerifiedAt` appear — then hit the reset limit on the fourth request and
  the login limit on the eleventh attempt, both with a time rather than a
  shrug. 14 mutations, 0 real survivors (two were malformed on my part and were
  redone; one survives alone because `findAccount` covers it, and removing both
  together is caught).

- **The other four forms, limited — and the worst one was the parent claim.**
  The previous commit left invite-accept and parent-claim unlimited and said so.
  Working through them found that one of the four was not a spam problem at all.
  **`claimChild` TAKES A STUDENT CODE AND A CHILD'S DATE OF BIRTH, AND ITS OWN
  COMMENT OVERCLAIMED.** It said the form "cannot be used to brute-force a
  birthdate against a known-good code". That is true of DISTINGUISHABILITY —
  every failure returns the same message and does the same work — and false of
  RATE. A schoolchild's birthday has a few thousand plausible values; with no
  limit, a loop got somebody a GUARDIANSHIP over another family's child, and
  with it their attendance, marks, messages and record. The comment now says
  which half it was right about.
  **TWO BUCKETS, because neither stops the attack alone.** Per caller, tightly:
  every attempt costs a signed-in account. Per student code, loosely: otherwise
  many accounts grind one child — and loose on purpose, because a tight limit
  there would let an attacker stop a real parent claiming their own child.
  **`claimChild` HAD NEVER BEEN TESTED**, because it needs a live session and
  the `next/headers` stub could not supply one. The stub's cookie jar is
  primeable now, so a test can mint a real session row and call the action the
  way a request does. Five tests, including the one that matters: once the
  allowance is gone, the RIGHT birthday is refused too — a limit that lets a
  correct guess through after the wrong ones is the last step of the search
  rather than a defence.
  **A LIMIT I NEARLY SHIPPED WOULD HAVE BROKEN A CLASSROOM.** `CODE_LOOKUPS`
  started at 20 per 15 minutes. A teacher writes a class code on the board and
  thirty children type it — from one school's wifi, behind one address, which is
  the only thing to key on when nobody is signed in. It would have refused a
  classroom on day one while an attacker went unbothered. A test that
  legitimately called `lookupCode` two dozen times is what surfaced it; the
  number is 120 now, and a test asserts it stays above a class of thirty
  retyping. What actually defeats enumeration is the code space — seven
  characters from a 21-character alphabet, ~31 bits — not this.
  **STUDENT SIGNUP IS DELIBERATELY NOT LIMITED SEPARATELY**: it cannot proceed
  without a valid class code, so `CODE_LOOKUPS` already bounds it, and a second
  limit on the same address would only give a class joining together a second
  way to fail. Parent signup carries no code, so it gets one.
  **RATE-LIMIT ROWS OUTLIVE A TEST RUN**, which cost an afternoon of chasing the
  wrong suites: a file signing in twice per run exhausts its fifteen-minute
  allowance after a handful of `npm test`s, then fails in a file nobody edited
  with an error about attempts. `tests/setup.ts` empties the table per run —
  except the limiter's own suite, whose buckets are prefixed and whose worker
  would otherwise be wiped mid-assertion by another worker starting up.
  **Walked in a production build:** ground the join-code box on the live server
  and watched the hits accumulate under a real client address rather than a
  fallback, then saw a VALID code refused with *"Too many tries. Wait in about
  14 minutes."* 9 mutations, 8 caught; the ninth is the no-request branch of
  `callerKey`, which the vitest stub makes unreachable by always supplying
  headers.

- **You can change your email address, which you could not do at all.** An
  address arrived when the account was created — registration, a teacher invite,
  an expert invite — and then it was permanent. Nothing anywhere wrote to
  `User.email` afterwards. A family that changed email provider, a teacher who
  signed up with a school address they no longer have, a pupil who outgrew the
  handle a class code gave them: all of them held an account whose password
  reset went somewhere they could not read, which is an account they cannot
  recover. The only route was an account merge or a phone call to the school.
  **THE SAME TWO STEPS AS THE MOBILE NUMBER, deliberately.** Typing is a claim;
  the code coming back is the proof; the pending address waits in the token's
  `meta` so nothing is written until it does. Somebody who has already changed
  their number should recognise the screen rather than have to read it.
  **A CODE, NOT A LINK, and for a different reason than the reset.** This is
  confirmed by somebody already signed in, with the form open in front of them.
  A link is a promise that whatever opens it is the same session — and the
  address being confirmed is usually new, on a phone, in a mail app that opens
  its own browser. They would land signed out on a page that cannot tell them
  from anyone else holding the link.
  **⚠ THE OLD ADDRESS IS TOLD, and that is the security of the whole feature.**
  Changing the email changes where a password reset goes, so somebody who has
  got into an account can point its recovery at themselves and every future
  "forgot password" reaches them instead. Revoking sessions does not help — the
  attacker's own session is the one that survives. The previous address finding
  out, while it is still on record everywhere else, is what does. Skipped only
  for a pupil's `@edulink.local` handle: no previous owner, and `.local` never
  routes.
  **THE HANDLE DOMAIN IS REFUSED THOUGH IT IS A VALID ADDRESS.**
  `someone@edulink.local` passes every shape check ever written. Accepting it
  would mint an account that can never be sent a reset code, which is the same
  trap this feature exists to open.
  **A DIFFERENT UNIQUENESS RULE THAN THE PHONE NEXT DOOR**, and it is the schema
  rather than a change of mind: `User.phone` blocks only on a *confirmed*
  number, but every account has an email whether verified or not, because the
  column doubles as the login key and as a pupil's handle. Letting an unverified
  clash through would only move the refusal to a constraint error ten minutes
  later with no sentence attached.
  It sets `emailVerifiedAt` — **the first place in the app that ever does on a
  real change**, and the reason the separate `/verify` bug below was found.
  Its own bucket, not the phone's, so confirming a number does not cost somebody
  the ability to correct a typo in their address.
  **Walked in a production build:** changed the address, watched the header and
  the "confirmed" tick follow it, read the warning that landed at the old
  address, then walked all four refusals — malformed, handle domain, unchanged,
  and one another account holds. The walkthrough is what found the wart: two
  identical green *"Send me a code"* buttons a centimetre apart, one under an
  address and one under a number, neither saying which. They now name their
  channel, and both fields say what they are rather than *"Change it"*.
  20 tests. 11 mutations, 9 caught outright; one was malformed on my part and
  redone, and one survives alone because consuming the previous token and
  refusing a non-newest token each cover it — removing **both** fails three
  tests, which was run and is recorded in the code.
  **The fixture leaked, and mutation testing is what showed it.** Cleanup
  filtered by the `@zzemail.test` suffix, which misses the pupil case's
  `@edulink.local` handles. Under normal code nothing is ever mailed to a
  handle, so the hole only opened while the deliverability check was removed on
  purpose — and four stray rows survived into the dev database. It tracks the
  addresses it used now. Same class of bug as the handle accounts that escaped
  an earlier suffix filter; the shape-based filter is the part that keeps being
  wrong.

- **Two emailed links had no route to land on, and one of them was an advertised
  way to sign in.** Registration has always minted an `EMAIL_VERIFY` token and
  sent `${APP_URL}/verify?token=…`; the login page's "email me a sign-in link
  instead" has always minted a `MAGIC_LINK` token and sent
  `${APP_URL}/magic?token=…`. Neither route existed. Every school admin's welcome
  email led to a 404, and anybody without their password who took the magic-link
  offer got nowhere — **while this file listed magic-link login under "Verified
  working"**. Found while building the email change, because that was the first
  thing in the app to set `emailVerifiedAt` on a real change.
  **THE SWEEP COULD NOT HAVE CAUGHT THIS, and that is worth stating rather than
  excusing.** It walks routes the app links to; a URL that exists only inside an
  email is one nothing links to. Both are listed by hand now.
  **THE CONSUMING HALF IS ONE FUNCTION.** `claimToken` spends a token with a
  CONDITIONAL UPDATE rather than read-then-write, so a mail client that
  prefetches a link and the person who then clicks it cannot both succeed —
  which for a magic link is two sessions from one email. Asserted with three
  concurrent claims and exactly one winner.
  **⚠ `/magic` IS A ROUTE HANDLER, NOT A PAGE, AND THE FIRST VERSION WAS A
  PAGE.** Signing somebody in writes a cookie, which Next.js refuses from a
  Server Component — *"Cookies can only be modified in a Server Action or Route
  Handler"*. The page rendered perfectly for every FAILING token, which is
  exactly what a junk token in the sweep exercises, so the 500 lived only on the
  success path and **went green in a 282-check sweep**. Opening a real emailed
  link is what found it. The sweep now asserts a 307 there instead of a 200, for
  the same reason.
  **⚠ VERIFICATION CHECKS THE ADDRESS THE LINK WAS SENT TO**, not merely whose
  row it names — a check that only became necessary last commit. A token minted
  for an old address and clicked after the account moved would otherwise stamp
  `emailVerifiedAt` onto an address nobody has proved anything about, laundering
  an unverified address into a verified one.
  **⚠ THE RESEND TAKES THE TOKEN, AND THE FIRST DRAFT TOOK A USER ID.** The page
  had the id, so passing it looked natural — but a server action's arguments are
  client input, and an action that emails whichever account it is handed is an
  unauthenticated mailer aimed by the caller. The rate limit would have bounded
  the volume and not the aim. An expired token is never consumed, so the row is
  still there to be re-read as a receipt.
  **`requestMagicLink` HAD NO RATE LIMIT**, which went unnoticed for as long as
  the link it sent led nowhere. Building the route turned a dead endpoint into a
  working mailer; it is limited like the reset now, keyed on what was typed.
  **Walked in a production build, both of them:** asked for a real sign-in link
  from the login page, read it out of the dev mailbox, opened it, landed on the
  teacher home as Tom — then re-opened the same link and got *"That sign-in link
  has already been used"* beside the password box that still works. Then took an
  expired confirmation link, pressed "Send me a new link", opened what arrived,
  and watched it confirm; a second visit says *"Already confirmed"* rather than
  *"invalid"*, because it is usually the back button.
  18 tests, 8 mutations, 8 caught.

- **A 307 that was right about the response and wrong about what ran.** Both
  `/record` pages read `(await getSession())!` and handed the result to
  `myRecord` / `recordFor`, which read `session.user`. The redirect protecting
  the area lives in `record/layout.tsx` — and **a layout and its page render in
  PARALLEL**, so the layout's redirect won the response while the page body had
  already run and thrown a `TypeError`. Every signed-out visit returned a
  correct 307 with a stack trace behind it: nine requests, nine logged errors,
  and nothing visible from outside. The sweep asserted the 307 and was right to.
  **THE ASSERTION WAS TRUE ABOUT THE RESPONSE AND FALSE ABOUT THE FUNCTION**,
  which is the whole lesson. A gate that lives somewhere else is not a gate this
  function has. Both pages call `requireUser()` now, which redirects the same
  way and costs the same lookup.
  **THE OTHER THREE `!`s IN THE APP WERE CHECKED AND LEFT ALONE.**
  `student/work`, `admin/safety` and `/account` each `await` a `requireRole` or
  `requireUser` on the line ABOVE, in the same function, so the redirect throws
  before the assertion is reached. There the `!` is honest. Fixing them to match
  would have been a change that says the distinction does not matter.
  **Proved by the repro rather than by reading it**: the identical nine requests
  before and after — same nine 307s, `9` logged `TypeError`s before, `0` after.
  A status-code sweep could not have caught this and still cannot; what caught
  it was reading the server log during an unrelated walkthrough.

- **Every mentoring notification led to a 404, and 7,351 stored rows carried
  one.** Six `url:` values in `mentoring.ts` pointed at `/parent/mentoring/…`,
  `/expert/mentoring/…` and `/student/margdarshak/…`. **None of those routes has
  ever existed.** A guardian told that a stranger had messaged their child, an
  expert told a mentorship was approved, a pupil told their mentor had written —
  every one of them tapped the notification and got nothing.
  **FOUND BY LOOKING FOR MORE OF THE SAME BUG.** After `/verify` and `/magic`,
  the obvious question was whether any other destination the app mints points
  nowhere. The four emailed URLs were fine. These six were not.
  **ONE ROUTE IS RIGHT, not a compromise.** `/mentoring/[threadId]` calls
  `getMentorship`, which settles entitlement from `readerOf` — expert, child,
  guardian, staff — and every role's navigation already points at `/mentoring`.
  Confirmed before collapsing them rather than assumed: the sweep now opens a
  real thread as **all four readers** and gets 200, while another school's admin
  and an unrelated classmate get 404 and a signed-out visitor gets 307.
  **THE SWEEP HAD NEVER ONCE OPENED A THREAD** — it visited `/mentoring` for
  four roles and stopped. It also could not have caught this by walking
  navigation, because nothing in the navigation mentions those URLs; they exist
  only inside a notification. That is the same shape as the emailed links above,
  and it is the third time this repo has been bitten by a destination nothing
  links to.
  **TWO TESTS, FAILING FOR DIFFERENT REASONS.** `mentoring-links.test.ts` reads
  the literals out of source and resolves each against the App Router tree —
  route groups and all — so a wrong one written tomorrow fails. The other
  asserts what is actually WRITTEN TO THE DATABASE when real people message each
  other, which the source check would miss if a url were ever assembled rather
  than written literally. Both pin the three dead prefixes as `false` so they
  cannot come back.
  **THE FIRST DRAFT OF THAT TEST WAS ITSELF THE BUG IT CHECKS FOR.** It listed
  the sending libraries by hand, named two that do not exist (`grades.ts`,
  `posts.ts` — they are `grading.ts` and `bulletin.ts`), missed six more, and
  hid both mistakes behind a `.filter(existsSync)` so the suite went green while
  covering two-thirds of what it claimed. It derives the list from the
  filesystem now. All 13 senders resolve.
  **THE CODE FIX DOES NOT REACH ROWS ALREADY WRITTEN**, so
  `scripts/fix-mentoring-links.ts` repairs them — idempotent, report-only unless
  given `--write`, one parameterised statement per prefix rather than 7,351 round
  trips. Its first version failed with Postgres `42883` and wrote **nothing**,
  which is the good way to get it wrong: a JS number crosses as `bigint` and
  `substring(text from bigint)` does not exist. It measures the prefix with
  `length()` now. Run against dev: **6,826 + 525 rewritten, 0 remaining**, every
  thread id preserved exactly (checked row by row against a snapshot taken
  first), total notification count unchanged.
  **Walked in a production build:** signed in as the guardian, opened
  `/notifications`, clicked the notification — which is a `<button>` that
  navigates, not an anchor — and landed on the thread, read-only, with the "this
  conversation is not private" banner and no compose box, which is exactly what
  a guardian should get.

- **A pupil could read, and write in, their school's conversation with an
  outside expert.** `assertBookingAccess` matched on `schoolId` alone, so "may
  read this booking" meant "belongs to this school" — and a child belongs to
  their school. `postMessage` shares that gate, so they could post into it too.
  Confirmed against a live booking before the fix and again after: pupil and
  guardian went **200 → 404**, the admin stayed 200.
  **`postMessage`'S OWN COMMENT WAS THE REASON NOBODY LOOKED.** It said *"Both
  sides are adults, so there is no gate"* — true of the expert, false of the
  school side, which was whoever the predicate let through. The comment is kept
  and corrected rather than deleted, because the sentence is the artefact.
  **NOT REACHABLE BY BROWSING**, and worth saying plainly rather than
  overstating: `/experts` turns away everyone but staff, nothing lists booking
  ids to a child, and an id is a cuid. This was a wrong boundary, not an open
  door. It is still the exact shape `mentoring.ts` spends consent, guardian
  visibility and staff-only pairing to prevent — an unsupervised channel between
  a child and an adult from outside the school — and this offered one for free.
  **ADMIN OR TEACHER, matching `bookSlot` and `cancelBooking` exactly**, so this
  file has one definition of staff rather than three that can drift. **A
  PRINCIPAL IS DELIBERATELY NOT INCLUDED**: they cannot book, cannot cancel, and
  `/experts` is not in their navigation, so adding them would be widening access
  under cover of a security fix. That decision has its own test.
  Refused as `NOT_FOUND`, so a pupil cannot tell a booking that exists from an
  id that never did.
  **`listBookings` GOT THE SAME CHECK**, though both its callers are role-gated
  pages today — the `/record` lesson three commits ago was that a gate living
  somewhere else is not a gate this function has.
  **BOOKING HAD NO TEST FILE AT ALL**: `bookSlot` appeared twice inside the
  curation tests as a fixture step and `cancelBooking` was tested nowhere. It
  has 17 now, including that cancelling frees the slot. 5 mutations, 5 caught —
  among them restoring the original bug exactly.

- **A booking can be cancelled, and the hour it held really comes back.**
  `cancelBooking` and the `cancel` server action had both existed since the
  feature was built with **no component importing either**, so a school that
  booked the wrong hour could not release it. One button, on the page BOTH sides
  reach — the school arrives from *Your bookings*, the expert from their own
  list, and that page already branches on `isExpert` for everything else. Two
  steps, because the hour goes back to the marketplace the moment it lands and
  the other party sees the booking turn red.
  **⚠ AND ADDING THE BUTTON EXPOSED A BUG THAT COULD NOT PREVIOUSLY BE
  REACHED.** Cancelling cleared `ExpertSlot.bookedAt`, which put the time back
  in the marketplace looking perfectly bookable — but `ExpertBooking.slotId` is
  UNIQUE and the cancelled booking still holds that row, so the next school to
  press **Book** met `Unique constraint failed on the fields: (slotId)`. An hour
  advertised and un-bookable. Nobody had ever hit it because until this button
  existed nothing could free a slot; the button is what made it reachable, and a
  test that books, cancels and books *again* is what caught it before it
  shipped.
  So the consumed row is now RETIRED rather than freed — `cancelledAt` keeps it
  out of both the marketplace and `bookSlot` — and an identical unbooked slot
  takes its place. The expert offered that time and has not withdrawn it; what
  changes is only which row carries it. **Not a schema change**: the tidier data
  model is dropping the unique constraint for a partial index on "not
  cancelled", and it is a migration this does not need, because one live booking
  per slot stays exactly true when a retired slot can never be booked again.
  **Idempotent**, so two people pressing cancel — or one pressing twice on a
  slow connection — does not duplicate the expert's availability.
  **Not offered once the time has passed**: cancelling something that already
  happened frees nothing anybody can use, and would let a session be quietly
  marked as never having taken place.
  **Walked in a production build, the whole loop:** booked the only slot and
  watched it leave the list, cancelled it, saw the badge and the compose box go,
  found the hour offered again in the marketplace, and **booked it a second
  time with no error** — the exact call that threw before the fix. 3 mutations,
  3 caught, including restoring the old free-the-slot behaviour.

- **Five routes the sweep had never once requested.** Comparing every route on
  disk against every path the sweep actually asks for turned up
  `/experts/bookings/[id]`, `/expert/bookings/[id]`, `/api/files/[fileId]`,
  `/parent/link` and `/expert/pending`. All five are reached from OUTSIDE the
  navigation — a notification, an emailed claim, an id in a URL — and the sweep
  derives its list from the navigation, so `everyNavLink` was never going to
  find them. 292 → **315 checks**.
  **THE TWO BOOKING URLS ARE WHY THIS MATTERED.** That is where a pupil was
  found reading their school's conversation with an outside expert two commits
  ago. The fix had nineteen library tests and the *route* — the thing an
  attacker calls — was exercised by nothing. It is now, on both spellings.
  **⚠ AND THE FIRST VERSION OF THE GUARDIAN CHECK PASSED WHILE THE BUG WAS
  LIVE.** The sweep's ordinary `parent` actor is minted with no school, which is
  what `resolveContext` gives a guardian on login — so the old tenant-only
  predicate never matched and they got a 404 for a reason unrelated to the
  boundary. Caught by re-introducing the bug and finding only two of the four
  checks turned red. There is now a second actor with the school bound, which is
  a session `setActiveContext` will genuinely produce: for PARENT it validates
  only that a guardianship exists and takes the school id from the switch form.
  What keeps that from being a cross-tenant hole is the database —
  `resolveRequestTenant` builds a parent's school set from their actual
  guardianships and ignores the session's claim.
  **THE FILE ROUTE NEEDED REAL BYTES.** A fabricated id 404s for everybody,
  authorised or not, because `readStoredFile` returns null — so a check using
  one would pass with the authorisation removed. The sweep writes a 1×1 PNG the
  way `storeFile` does (that module is `server-only` and cannot be imported into
  a Node script) and removes it in the `finally`.
  **AND IT FOUND A RULE I HAD GUESSED WRONG**: a teacher must teach the
  assignment's CLASS, not merely belong to the school. The first version
  expected a 200 and got a 404. That refusal is now asserted rather than
  designed around, and the admin carries the positive — which is exactly the
  claim this file already made, that another school's admin gets a 404 "even for
  an admin".
  **WHICH LAYER REFUSES WHICH, established by mutation:** neutering the
  cross-school branch of `authorizeFileRead` changes nothing, because RLS has
  already hidden the assignment — that branch is defence in depth. Neutering the
  teacher check turns the sweep red. Restoring the booking bug turns four checks
  red.

- **The guardian's whole surface, in all three languages — and a counter that
  makes the rest finishable.** Eight files and 66 strings: the dashboard,
  grades, attendance, the timetable, settings, the child switcher and the
  claim form. `npm run i18n` reports what is left, per file, and `-- <path>`
  dumps one file's strings.
  **THE COUNTER CAME FIRST ON PURPOSE.** "Translate the rest of the app" is 200
  files; by eye it is impossible to say whether it is a third or nine tenths
  done, to prove a file is finished, or to notice the next English string
  somebody adds.
  **⚠ AND THE FIRST TWO VERSIONS OF THE COUNTER BOTH LIED, each caught by a
  screenshot rather than by the tool.**
  *Dates.* `formatDateKey` and `relativeTime` both take a locale and both
  DEFAULT to `"en"`, and **every one of ~70 call sites omitted it** — so a fully
  translated Hindi page still read *WEDNESDAY, AUGUST 5* and *3 days ago* in the
  middle of a Hindi sentence. None of that is a hardcoded string, so the counter
  called the page finished. It counts them separately now.
  *Lookup tables.* The counter only opened `.tsx`. The guardian's attendance
  page reported CLEAR while still showing *Late*, *Absent*, *Arrived after the
  bell* — those live in `ATTENDANCE_META`, a plain object in `constants.ts`, and
  the same shape hides in `badges.ts`, `holidays.ts`, `onboarding.ts`,
  `quiz.ts` and `school-day.ts`. Reading `src/lib` too moved the honest total
  from 1,193 to **1,617**. The same shape bit the claim form's relation
  dropdown, which is now keyed.
  **A counter that only looks where you expect the problem reports the problem
  solved.** The number it prints is a floor.
  **THE TYPE SYSTEM DID ITS JOB TWICE**: a key added to `en.ts` and missing from
  `hi.ts`/`mr.ts` failed the build, and so did every `t("parent.…")` written
  before the namespace existed.
  **Walked in a production build in हिन्दी and मराठी**, which is how both
  counter bugs were found.
  **⚠ WRITTEN BY ME, NOT A NATIVE SPEAKER** — the same caveat the existing 212
  keys carry, now over 300. A teacher who speaks these every day should read
  them before a real school does.

- **The pupil's surface, and the four marks a register can carry.** Eight more
  files — today, grades, work, hand-in, profile, practice, the welcome card —
  plus `ATTENDANCE_META`, which is shared: translating it once fixes the
  guardian's attendance page *and* the teacher's register, and both were checked
  in मराठी.
  **KEYS, NOT WORDS, FOLLOWING `ROLE_META`** — the convention was already in
  `constants.ts` and this file now matches it. Converting the constant turned
  every consumer into a compile error, which is how all seven were found rather
  than grepped for.
  **⚠ ONE CONSUMER DELIBERATELY STAYS ENGLISH.** `attendance.ts` composes a
  NOTIFICATION, written once by the teacher and read later by the guardian, with
  the finished sentence stored on the row. Resolving a key there would stamp the
  WRITER's language onto the READER's screen — a Marathi-speaking parent would
  get Hindi because the teacher who took the register reads Hindi, which is
  worse than the English they get today. It uses a separate English-only map
  whose comment says nothing else may. Fixing it properly means storing a key
  and its parameters and rendering at read time: a schema change and a migration
  for every notification already written.
  **A SURROGATE PAIR BROKE THE WRITER MID-FILE.** Generating these blocks with
  `\uXXXX` escapes worked until an emoji, whose surrogate pair `unicode_escape`
  cannot round-trip — it threw halfway and truncated `en.ts` to 400 lines short.
  `git checkout` and a rewrite in literal UTF-8 fixed it; the lesson is that a
  half-written dictionary is a build failure rather than a silent one, which is
  the good version of getting it wrong.

- **The teacher's surface — the role staff live in every day.** All 17 files:
  today, the register, classes, assignments, the gradebook, report cards, grade
  weights, leave and the class join code. ~130 keys. 1,566 → **1,412 strings**.
  **THE OFFLINE BANNER WENT WITH IT**, which is one string on every signed-in
  page and was sitting in English above a fully Marathi dashboard.
  **WHAT IS LEFT ON THESE PAGES IS A CATEGORY, NOT A REMNANT**: `export const
  metadata = { title: … }` in **87 files**. That is the browser tab, it is a
  static export rather than a render, and translating it means `generateMetadata`
  and a locale read per page — a different shape of change from the rest, worth
  doing as one pass rather than trickling.
  **Walked in मराठी**: the dashboard, classes, assignments, the register and
  leave, all rendering आज / माझे वर्ग / कामे / हजेरी घ्या / रजा with the offline
  banner in Marathi above them.

- **Every browser-tab title, and then the DATES DECISION REVERSED.**
  **TITLES: 80 files, 73 distinct.** `export const metadata` is a STATIC export
  and cannot await anything, so each became `generateMetadata()`.
  **DATES ARE DATA NOW, AND DATA DOES NOT TOGGLE.** An earlier pass threaded a
  locale through `formatDateKey` and `relativeTime` so Marathi rendered
  Devanagari numerals — and the result was one line mixing numeral systems
  (`१४ सप्टें` beside an ASCII `{count}`). The product rule that settled it: the
  language switch moves LABELS AND HEADINGS and nothing else; dates, times and
  "2 hours ago" are values and read identically in every language. Enforced
  where it cannot rot: the formatters in `lib/dates.ts` no longer HAVE a locale
  parameter, so a call site that tries to pass one is a type error. The one
  exception is `weekdayName`/`weekdayShortName` — column headings are a fixed
  seven-label set, which makes them labels.

- **The whole app answers in the reader's language, and every refusal is a
  key.** English, Hindi and Marathi — ~3,400 keys, with `hi.ts`/`mr.ts` typed
  from `en.ts` so a missing key fails the BUILD. Every error family now mints
  `TranslationKey`s and lets the boundary own the words: the 211 `AccessError`
  throw sites (the constructor's type refuses an English sentence), the refusal
  family (passwords, crypto, membership, school-record, register-duty, cohort,
  account-merge), the upload pair (`UploadError`/`AttachmentError` — thrown
  Errors whose messages every catch was showing to the uploader), the password
  meter, and the zod layer: custom messages are keys, and `fieldErrors` reads
  the issue CODE for the defaults, so a bare `.min(2)` answers "Use at least 2
  characters." in Marathi instead of zod's English. **Proven live over the
  wire**: an empty login form refused in Hindi, a 321-character login name
  refused in Marathi with the bound spliced in.
  **THE AUDIT GREW THREE MORE EYES DOING IT.** Its fourth and fifth blind spots
  — expression-position strings (ternary hints, toast titles, `setError`,
  template literals) and JSX text spanning lines or holding an
  `{interpolation}` — hid ~110 visible strings on pages the counter called
  finished, including whole safeguarding paragraphs. All keyed, and the audit
  reads those shapes now. What it still counts (38 files) is the decided pile:
  stored/sent artifacts, operator- and machine-facing text, and data.
  **The translations themselves are the caveat**: written here, reviewed by
  nobody who reads Hindi or Marathi daily. A teacher should read them before a
  school does.

- **The never-walked checklist sections, walked — §§2, 5, 7, 8 signed out and
  §§12m0–12q — and they earned their keep.** A school registered from nothing,
  a messy CSV triaged row by row, a child joining lowercase-and-hyphenless, a
  parent claiming her with a birthday, cover arranged and told about both ways,
  leave self-approval refused, the §12p freeze SEEN: a mark changed under a
  published card and the card did not move. Roughly 150 boxes. Two of them
  found real bugs, both the shape the walk exists for — every page involved a
  healthy 200:
  **The FIRST parent ever to claim a child 500'd.** `Membership`'s RLS honours
  a student code but `School`'s never did, so the claim's required school came
  back null and Prisma threw. Every seeded walk had passed because those
  parents already had visible schools. The generator now grants the school
  BEHIND a student code the same single-row read the code itself gets.
  **Every guardian's "open the report card" link 404'd.** `getCard` demanded a
  session `schoolId`, which a guardian — authorised through Guardianship, not
  Membership — has never had. The card names its own school now and the
  relationship decides. Re-tested: parent 200, drafts still hidden, builder
  permissions unchanged.
  **And the walk's smaller findings were closed**: the duplicate-email refusal
  at registration was stored under `"admin.email"` while the field listened for
  `"adminEmail"` (a silent no, now mapped and shown); the wizard restores the
  STEP after a refresh, not just the answers; the join wizard's Next refuses an
  invalid birthday instead of silently dropping it; the leave action forwards
  the `errorKey`s its lib was already minting; and the server log is an
  ALLOWLIST — sign-ins and signups belong to a person, not a tenant, and
  `schoolId: null` alone was pouring every user's login history into the
  operator's page.

- **ESLint exists now** — flat config through `eslint-config-next` v16,
  `npm run lint`, zero errors. Its first run paid for itself: a server action
  named like a hook (`useSuggestedDay`, now `seedSuggestedDay`), a `children`
  prop holding the guardian's actual children (now `pupils`), a ref written
  during render, and four whole English paragraphs both audit heuristics had
  walked past. The 28 remaining warnings are test-fixture variables and two
  React-compiler-era rules deliberately downgraded with the reasoning in
  `eslint.config.mjs`.

- **The only-reasoned-about list is empty, and three of its four items were
  bugs.** The last four paths no test or walk had ever exercised —
  principal-as-LEAD, quiet-hours delivery, print output, multi-pupil ordering —
  were exercised, which is the strongest argument the list ever made for
  itself:
  **PRINTING A PROGRESS REPORT PRINTED THE APP.** The first real print-to-PDF
  of a signed-in report carried the side rail, the bottom tab bar and the
  "Take the register" button onto the sheet — `.no-print` had only ever been
  applied to the page's own controls — and a dark-theme user's print kept the
  dark text variables on paper that doesn't print backgrounds: grey-on-nothing
  headings on the one artifact a school hands to a parent. The shell chrome is
  `print:hidden` now, and every dark palette block sits inside `@media screen`,
  so paper always gets the light ink. Seen fixed the same way it was seen
  broken: a before and after PDF of the same page.
  **WHICH CHILD A PARENT LANDED ON WAS A COIN TOSS.** The guardianship query
  behind `children[0]` — the default child on every parent page — had no
  `orderBy`, so it was Postgres row order: `grading.test.ts`'s
  findFirst-without-orderBy bug, one layer up, on a page not a test. First
  claimed, first shown now; the /record page's children order by name; and
  `tests/children-order.test.ts` inserts its fixtures in the OPPOSITE order to
  what it asserts, so deleting either `orderBy` fails loudly. Verified live
  with the seeded parent whose two children are at two different schools and
  whose claims are one millisecond apart — the exact pair row order would
  scramble.
  **The other two worked as designed, and are now pinned rather than presumed.**
  `tests/principal-lead.test.ts` appoints a PRINCIPAL membership LEAD through
  the real `assignTeacher` (an ADMIN membership is refused — that is an office
  role), builds and publishes a report card as the head, and is refused again
  on demotion to CO. `tests/notify-delivery.test.ts` registers a live local
  HTTPS endpoint as the user's push subscription, so the web-push POST arriving
  or not IS the delivery: suppressed inside the quiet window, delivered outside
  it and when urgent, the in-app row written every time — the suppression point
  itself, not just the `inQuietHours` arithmetic that was already tested.
  What this leaves unexercised is what a machine cannot reach: the install
  button, and translations no native reader has read.
- **The million-question drill bank, generated, proven and served — then
  REDONE across all six subjects when the ask was clarified.** The first cut
  was maths-only; the real ask was ~100,000 per grade split across the
  subjects. `npm run quiz:generate` now builds 1,005,000 questions (grades
  3–12, 100,500 each, 246 chapter topics over MATHS/SCIENCE/GEOGRAPHY/HISTORY/
  CIVICS/ECONOMICS, every chapter spanning the full L1–L6 ladder,
  English/Hindi/Marathi on every row) in ~17s and imports them in ~9min,
  deterministically — same run, same stems, same
  ids, so re-running is a no-op, editing a template is a clean diff, and the
  redo itself deleted the obsolete plan's topics before writing the new one. Every question's `checkExpr` is evaluated against its marked option
  BEFORE the row is written, through the same evaluator the verifier uses;
  the wanted-vs-produced guard caught nine template bugs during authoring
  (parameter spaces too small, ranges swallowing each other, a probability
  decoy numerically equal to the answer under a different spelling — two
  correct options, child marked wrong for the honest one). The serving paths
  were rewritten for the scale (GROUP BY counts; `pickQuestion` semantics as
  a ladder query, its unit tests kept as the spec), proven live: 165ms topic
  list, 83ms drill page, Hindi read back off the wire, and 567 imported rows
  re-proving their own arithmetic in `tests/drill-bank.test.ts` on every
  `npm test`. 1406/1406 tests, 315/315 sweep, all green after.
  **A later gap hunt over the same ground found the SIXTH audit blind spot**:
  English *trailing* an inline element, which starts lowercase and so slipped
  every capital-anchored rule — "<strong>{url}</strong> and type this code."
  on the wall poster (twice in that one file), and "would like to enter …,
  run by …" on the parent dashboard, which had a key minted and never wired.
  All three fixed, the audit reads the shape now, and the poster's Print
  button prints the POSTER — `.print-isolate` blanks the rest of the class
  page, which previously came along for the ride.

### Built but not click-through verified

Renders and typechecks; treat as `Untested:`.

- **The install button.** Chrome only fires `beforeinstallprompt` on a real
  visit over a real origin, so the affordance cannot be driven from an automated
  browser. Everything either side of it is covered.
- ~~Invite revoke and resend BUTTONS~~ **clicked, during the checklist walk.**
  Withdraw moved the invitation to the Withdrawn tab with a toast; Resend was
  clicked and its effect verified the strong way — the predecessor link
  answered "no longer valid" while the fresh one carried the same prefilled
  name. Nothing remains on this list from the invitation lifecycle.

### Not built

**Every route referenced by the navigation renders.** All 315 checks in
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
- **Individual cross-school rankings.** The competition leaderboard is built and
  ranks SCHOOLS — results recorded, best place, best score — and that is the
  whole of what crosses. This entry used to say a cross-school ranking "would be
  the first thing in this app to show one school another school's children — a
  decision, and a policy change, before it is a page". The decision was made the
  other way: `CompetitionStanding` carries a school, a count and a place and has
  no column that could name a pupil, and `CompetitionEntry` — where the names and
  individual scores are — was not widened by one row. A school named a child on
  a national board would need a new table, a new policy and a new consent story,
  and none of the three is built.

  The honest limit: a school that enters exactly one child and places first has
  told every other school the winner's school. Not their name, class, age or
  which of their pupils it was — and a published competition result is a public
  thing. That is a different order of disclosure from a table of named children.
- ~~The Practice question BANK, at scale.~~ **BUILT — 1,005,105 questions in
  the database, split across ALL SIX SUBJECTS**: 1,005,000 generated drills
  (grades 3–12, exactly 100,500 each; per grade, maths 40–55k, science
  18–27k, geography 10–12k, history 8–10k, civics 4.5–6.5k, economics 5–7k,
  across 246 chapter topics) beside the 105 hand-written (9 topics). How the two
  positions below survived the scale-up matters more than the number:

  **Not scraped — unchanged.** Nothing was copied from anywhere. The generated
  bank is parameterized templates and small curated fact tables written for
  this repo (`scripts/gen-quiz-bank.ts`), CC0, `source` and `licence` stamped
  on every row.

  **"Not bulk-generated" REFINED, not abandoned.** The old position was that a
  wrong answer in a children's bank is worse than a missing one and nobody can
  check 150,000 items. Both halves still hold, and they shaped what each
  subject was ALLOWED to generate: everything numerical — all of maths;
  science numericals (speed, density, F=ma, Ohm's law, Q=mcΔT, moles);
  map-scale, longitude-time and population-density geography; timeline
  arithmetic whose event years are GIVEN in the stem; quorum, majority,
  representation and term civics; discount, GST, per-capita and growth
  economics — carries a `checkExpr` evaluated against its marked option
  through the shared evaluator (`scripts/quiz-arith.ts`) before the row is
  written; one failure aborts the run. That is 1,004,724 of 1,005,000. The
  other **276 are fact recall** — state capitals, country capitals, element
  symbols, SI units, event years, the Constitution's numbers — and they may
  come ONLY from the fact tables in the generator: a few hundred
  human-checkable rows whose review reviews every question they generate.
  The ledger prints both numbers on every run, and
  `tests/drill-bank.test.ts` pins recall below 0.1% of the bank so the count
  can never quietly grow. Read by a person: still 0, still said out loud.

  **What the scale-up cost, engineering-wise:** two serving paths that loaded a
  topic's whole question pool per request were rewritten as queries
  (`listTopics` counts by GROUP BY; `nextQuestion` reproduces `pickQuestion`'s
  pinned semantics — first as a difficulty-ladder probe, then as one GROUP BY
  when the probes made small-topic tests crawl; the unit tests are the spec
  both times); the practice page grew a class filter to go with the subject
  chips; and `tests/drill-bank.test.ts` re-proves a deterministic sample of
  IMPORTED rows on every `npm test`, which catches what generator-side
  verification cannot — a bug in the import itself. Live numbers against the
  six-subject bank: topic list well under 200ms, drill topic pages ~35–95ms,
  subject and class filters composing, all six subjects on the wire. The
  clean-completion badge is untouched and truthful — effectively out of reach
  in a drill topic, where the mastery ladder is the progression that matters;
  the hand-written topics stay completable.

  **Then the topics were renamed and split to the NCERT/CBSE syllabus.** The
  per-subject drill blobs ("Science numericals", 18–27k in one topic) were
  regrouped into chapter topics carrying the grade's actual chapter names —
  grade 9 science reads Motion / Force and Laws of Motion / Work and Energy /
  Matter in Our Surroundings / Atoms and Molecules; grade 10 gets Electricity;
  grade 6 geography gets Maps and Globe: Latitudes and Longitudes; grade 8
  civics gets Why Do We Need a Parliament?; grade 10 economics gets Money and
  Credit and Development: Per Capita Income — generalized names where the
  syllabus has no numerical chapter (grade-3 EVS has no Ohm's law). The
  regroup moved the SAME template instances (same stems, same wants — the dry
  run reproduced every grade at exactly 100,500 before anything was written),
  so it was renaming and repartitioning, not regeneration: 261 topics at that
  point, each named in English, Hindi and Marathi. The honest limit AT THE
  TIME: HISTORY timeline topics carried the NCERT book umbrella rather than
  per-chapter names, because chapter-true history — only 1857-era events
  inside "When People Rebel" — needed a curated events table ten times the
  then-27 rows. That limit has since been paid down — see the history
  paragraph below.

  **Then every chapter got the full six-rung ladder.** The regrouped chapters
  had inherited flat difficulty — six thousand one-step Ohm's-law reps at L1
  and nothing above — so the excess bottom-rung questions were scrapped and
  regenerated as genuinely harder material: ~60 new trilingual template
  families modelled on Olympiad/NSO/competitive-exam patterns (harmonic-mean
  round trips, alloy densities, net forces and lift tension, series circuits,
  I²R power and electricity-bill costing, map areas scaling by n²,
  longitude↔time across the prime meridian, event-age and back-then-forward
  timeline chains, present-and-voting majorities, joint-sitting two-thirds,
  successive discounts, markup-then-discount profit). All 246 generated
  chapters now span exactly L1–L6 — enforced by an assertion in
  `gradeTopics()` and re-verified against the live rows — and the bank-wide
  mix went from L1-heavy (370k at L1) to a proper pyramid (L1 151k · L2 144k ·
  L3 213k · L4 219k · L5 161k · L6 116k). The six recall micro-topics
  (capitals, elements, landmark years, the Constitution's numbers) folded in
  as L1 rungs of their chapters, so **255 topics** now: 246 generated + 9
  hand-written. Same honesty rule throughout: every new question proven
  through the shared evaluator before writing, a worked solution on every row
  in all three languages, and `importTopic()` now repairs the stored
  difficulty of any question whose stem survived a rebalance (same
  content-hash id, new level — previously a silent drift). After the rebuild:
  1406/1406 tests, 315/315 sweep, typecheck/lint/RLS/i18n audit unchanged.

  **Then history became chapter-true.** The curated events table grew from 27
  to 145 rows — every one a settled, single-year date, named in three
  languages, with an explicit key — and grades 7–12 traded their book-umbrella
  timeline topic for THREE era chapters each, drilling only events from their
  own NCERT chapter's period: The Delhi Sultans / The Mughal Empire /
  Eighteenth-Century Political Formations (7); From Trade to Territory / When
  People Rebel: 1857 and After / The Making of the National Movement (8); The
  French Revolution / Socialism and the Russian Revolution / Nazism (9);
  Nationalism in Europe / Nationalism in India / The Making of a Global World
  (10); Changing Cultural Traditions / The Industrial Revolution / Paths to
  Modernisation (11); Colonialism and the Countryside / Gandhi and the
  Nationalist Movement / Framing the Constitution (12). Pools are named by
  event KEY (a typo throws at plan time), within-grade pools are asserted
  disjoint, and each chapter still climbs L1–L6 — including a new
  midway-year puzzle family. The honest limits that remain: grades 3–5 keep
  generalized timeline-skills names (their EVS syllabus has no history
  chapters) and grade 6 keeps the Our Pasts umbrella, because ancient India's
  dates are too contested for a drill bank that promises settled years. The
  landmark-year recall stays folded and capped: 276 rows, all from the table
  a person can read. 267 topics now (258 generated + 9 hand-written);
  1406/1406 after import.

  **Then every rung got a badge.** Six per chapter — Beginner, Learner,
  Amateur, Expert, Pro, Master — earned by PROVING the level, which means the
  same thing on every rung: two right in a row at that level. For L1–L5 that
  is exactly the mastery ladder's promotion; L6 has nowhere to promote to, so
  the same streak at the top earns Master. Permanent from the moment they are
  earned (`awardPermanentBadge`, which now reports whether it actually created
  the row so a genuinely new award is audited and an old one is not), kept
  through demotion — the badge says the level WAS proven — and idempotent
  under re-proving, which `tests/quiz-tier-badges.test.ts` drives through the
  real serving path with a disposable pupil: climb, fall, re-climb, one badge.
  Badge ids extend the stored-identity scheme (`abhyaas:<slug>:tier-<n>`), the
  practice card shows a medal count ("3/6") next to the level chip, and the
  child's record page lists each badge by its stored English label — the
  stored-artifact precedent, same as the clean-completion badge beside it.
  Full battery after: typecheck, `quiz:verify` and `rls:verify` clean;
  **1409/1409 tests across 73 files** (the three new tier-badge tests drive
  the real serving path); eslint 0 errors, 29 known warnings; i18n decided
  pile 38 files / 193 strings (+2: the stored badge label and description,
  English by the stored-artifact rule); production build clean; **sweep
  315/315** against the production server.

  **Then practice grew the surfaces AROUND the child** — the top five
  recommendations of the role-by-role UX walk, built in one pass
  (`src/lib/practice-insights.ts` + `tests/practice-insights.test.ts`):

  1. **The practice page defaults to the child's own grade** (a Grade 5 pupil
     no longer lands on Class 3 civics; `?grade=all` is the explicit way out)
     and grew a **Continue card** — last chapter, current rung, "2 more right
     in a row for your Beginner badge".
  2. **Parents got a Practice tab** (`/parent/practice`): per child, every
     chapter touched, the rung they stand on, tried counts, tier badges, and
     the last-7-days number — guardianship asserted on every read, and the
     same no-comparison rule as the child's own page.
  3. **Teachers got Practice insights** (`/teacher/practice`): a chapter ×
     rung heatmap per class (counts, never rankings) and **assignable
     chapters** — pick a chapter and a target rung; attainment is DERIVED
     from `QuizMastery` at read time, so there is nothing to hand in, nothing
     to mark, and nothing that can disagree with what the child actually did.
     One new table (`PracticeAssignment`, school-scoped, auto-policied by the
     generated RLS — 60 policies now), audited as `practice.assign`.
  4. **Smart revision** (`/student/practice/revision`): questions whose
     LATEST answer was wrong come back after a two-day rest, capped at 12,
     served through the SAME attempt machinery — revision moves the same
     ladder and earns the same badges. A question later answered right never
     returns.
  5. **A private weekly goal** on the practice page: questions answered in a
     rolling 7 days against a fixed target of 50, with the copy saying out
     loud that nobody else sees it. No leaderboard, deliberately, still.

  Six new integration tests drive all of it end to end with disposable
  fixtures (ZZ class, pupil, teacher, guardian — deletion asserted), including
  the honest edge: a pupil who never opened a chapter reads as level 0, NOT
  L1, so "reach L1" cannot be satisfied by absence. After: **1415/1415 tests
  across 74 files**, eslint 0 errors / 29 known warnings, i18n pile unchanged
  at 38/193, build clean, **sweep 317/317** (two new nav routes, both walked).

  **Then the school around the classroom got built** — sixteen more
  recommendations from the same UX walk, in one pass, one additive schema
  wave (five new tables: `PostAck`, `ExamSeries`, `ExamSlot`, `MeetingSlot`,
  `MeetingBooking` — **65 RLS policies**, every one the same one-line
  predicate):

  1. **Circulars** — a school-wide notice can be aimed (parents / staff /
     pupils, optionally one grade) as a query-time courtesy, never a secrecy
     boundary; an author can ask for one tap of "seen and understood"
     (idempotent — the uncertain second tap reads as success), and the
     delivery report counts THE FAMILY as the unit, class by class, naming
     who is still waiting. A checklist, not a ranking.
  2. **Term exams** (`/admin/exams`, `/exams`, `/teacher/exams`) — a
     per-grade date sheet published to families, and a register-shaped marks
     grid whose sittings are ordinary category-"Exam" Assignments keyed
     `(slot, class)` so concurrent saves converge; marks are ordinary Grade
     rows, so weighting, the child's grades page and the report-card builder
     picked them up without another line of code. A blank cell clears: an
     absence is not a zero.
  3. **The report card grew a practice annexure** — chapter, rung, tier
     badges, snapshot at generation and frozen by publishing like every
     other number on the document (pinned by test: the child kept climbing
     after publication and the card did not move).
  4. **Worksheets** (`/teacher/worksheets`) — chapter + rung + count from
     the million-question bank, printable, answer key forced onto its own
     sheet, deterministic by a seed in the URL (same link, same paper),
     staff-only because the key rides along.
  5. **My journey** (`/student/practice/journey`) — badge timeline, climbs
     per month, weeks-in-a-row; the child compared with nobody but their own
     past, and the copy says so.
  6. **The teacher's week + gap alerts** on `/teacher/practice` — pupils
     practiced / answers / climbs / misses over rolling seven days, and a
     "worth re-teaching" card for chapters where ≥2 pupils spent a fortnight
     missing more than they make at the same rung. Counts, never names: a
     stuck class is one teaching problem, not several private ones.
  7. **Attendance intelligence** (`/admin/attendance`) — eight-week trend,
     then a welfare list: below 75% over a month (minimum-marks floor) or
     three registers absent running, excused never counted against a family.
     Telling the family is one audited tap per child, deduplicated weekly.
  8. **Compliance exports** on the same page — a class's monthly register
     grid and a UDISE-shaped enrolment summary, CSV, audited as
     `compliance.export` and flagged sensitive.
  9. **The homework diary** (`/parent/homework`) — set / handed in / overdue
     / marked-with-comment per child, read-only on purpose; a stranger's
     userId is NOT_FOUND, never a peek.
  10. **Substitution advice** — the leave cover picker now ranks the staff
      room by who is actually FREE for the absent teacher's own lessons in
      that window ("free for all their lessons" first), load as tiebreak;
      the covers-on-the-timetable machinery already existed and does the rest.
  11. **Parent–teacher meetings** (`/teacher/meetings`, `/parent/meetings`)
      — a teacher publishes a run of back-to-back slots (wall-clock in the
      SCHOOL's timezone), families of taught children book one per
      conversation, one-booking-per-slot enforced by the database's unique,
      and every cancellation tells the other side by name.
  12. **The weekly digest** (`npm run digest:weekly`, cron-ready) — one
      notification per family per week: days attended, practice, badges,
      homework due, exams coming. Idempotent over six days; a week with
      nothing to say sends nothing at all.
  13. **The guardian's first-run** — language picker FIRST, then four doors
      (attendance, homework, practice, meetings), dismissed per device.
  14. **Practice survives the signal** — an answer that cannot reach the
      server queues in the durable outbox (it survives closing the tab), the
      question stays up under an honest banner, and recovery re-asks an
      idempotent endpoint. Idempotent is PROVEN: `submitAnswer` moves streaks
      on every call, so the guard is the unique response row — the test
      delivers one tap four times and shows the ladder moved once.

  Thirty-four new integration tests across ten files drive all of it on real
  rows with disposable ZZ fixtures (deletion asserted every time). After:
  **1449/1449 tests across 84 files**, typecheck clean, eslint 0 errors / 29
  known warnings (three new ones introduced and fixed properly —
  `useSyncExternalStore` for the welcome card, seed-minting moved into client
  effects so server renders stay pure), RLS 65 policies verified, build
  clean, **sweep 325/325** (eight new nav routes, all walked). The
  deliberately-English pile grew 193 → 210 strings (38 → 46 files): every
  addition is a notification body or a stored-artifact title, the same two
  categories the pile already held. All new hi/mr strings are mine and await
  the same native-reader pass as the rest.

  **A second role-by-role UX walk then caught what the fixtures had hidden**:
  a guardian's session deliberately carries NO school (parents are
  cross-school), and both the bulletin and the exam date sheet were gated on
  `session.schoolId` — so the parents' circular was unreachable by its own
  audience, and /exams told a parent "No exams announced" while their child
  read the sheet. The integration tests had passed because their parent
  fixtures carried a schoolId. **Fixed at the surfaces, not the session**:
  every bulletin read now resolves the guardian's school itself (from the
  post being opened, from a school picker when the family straddles two
  schools, from the first guardianship otherwise), `dateSheetsFor` merges
  sheets across every school the children attend (named per card when they
  differ), the parent nav gained Bulletin, and the compose buttons hide for
  guardians — who read, and do not post. The parent test fixtures now carry
  the REAL shape (`schoolId: null`, with a warning comment saying why), so
  this class of bug cannot pass the suite again. Verified live with the
  seeded two-school family: chips for both schools, a forged `?school=`
  falling back safely, and the Oakfield chip switching the feed. Sweep grew
  to **326/326**.

  The walk's smaller findings were then swept in one pass: the post detail
  page carries the same "For parents · Class 5" chips as the feed card; half
  marks stopped rounding away (67.5 is 67.5 on the diary and the report card,
  via the `formatMilli` the rest of the app already used); the first exam
  paper self-selects on /teacher/exams; the attendance trend bars scale
  across the range the data actually spans instead of from zero; the
  worksheet header prints one subject name, not two; the role-switcher cards
  and the per-paper Remove buttons carry explicit accessible names;
  "Across 1 pieces" reads "Across 1 piece"; and the bare framework 404 became
  a styled, translated page that deliberately says no more than "not found" —
  which is also what a thing you may not see answers.

  **The whole battery was then re-run cold, end to end, on a fresh build,
  after the walk's fixes landed** — typecheck clean, **1449/1449 across 84
  files**, eslint 0 errors / 29 known warnings, i18n steady at 46/210 (one
  new aria-label briefly tripped the audit and was reworked to join two
  already-translated values rather than read as prose), RLS all checks
  passed, build clean, **sweep 326/326** against a freshly started
  production server — and the database checked afterwards for fixture
  residue: **zero ZZ users** left behind by any test or walk.

  **And once more after SSO landed** (see Next steps item 1): typecheck
  clean, **1456/1456 across 85 files** — the seven new tests holding the
  linking policy, the ID-token verification and Apple's client secret —
  eslint 0 errors / 29 known warnings, i18n steady at 46/210, RLS all
  checks passed with `SsoIdentity` joining the user-owned tables, build
  clean, **sweep 326/326**, and the residue check extended to the new
  table: **zero ZZ users, zero stray SsoIdentity rows**.

  **The repository then left this one disk and got its house in order.**
  Two private remotes now exist — `reborn-digitech/Edulink` (primary,
  tracked by local `master`) and `ckulkarni03488/Edulink` (mirror) — with
  ONE branch, `master`, identical in all three places, as every repo's
  default. Consolidating the old branches paid for itself on the way out:
  a stale worktree, inspected before force-deletion, held four files of
  UNLANDED work from a past session — among them a fix for a still-live
  1-in-36 flake (`register-duty.test.ts` minted a "nonexistent" membership
  by overwriting the last character of a real cuid, which one run in
  thirty-six named the principal for real). The fix was rescued, proven
  with a 15/15 loop plus a full-suite pass, and landed with the fixture
  notes it taught: **run a red file alone in a loop before blaming another
  suite** — sequential-but-reordered runs impersonate parallel contention.
  The battery after all of it, cold: typecheck clean, **1456/1456 across
  85 files**, eslint 0/29, i18n 46/210, RLS all checks passed, build
  clean, **sweep 326/326**, zero fixture residue.

  **The 2026 bank refurbishment then replaced the bank outright.** On
  explicit instruction the old bank was PURGED — all 267 pre-refurbishment
  topics (258 generated drill topics and the nine 2025 hand-authored G8
  chapters), 1,005,105 questions, their attempts, mastery and badges —
  leaving only the new chapter-true bank: authored fact tables and
  individually written numeric questions through `scripts/quiz2/`, every
  computation proven by checkExpr, every chapter climbing L1–L6, no
  question quota, no repetition, three languages by construction. The old
  generator (`gen-quiz-bank.ts`) and its summary scripts left the tree
  with it; `quiz:generate` now points at quiz2. Current bank: 368
  chapters / 6,652 questions — **Class 3 complete** (Maths 14/14, EVS
  11), **Class 4 complete** (Maths 14/14, EVS 10), **Class 5 complete**
  (Maths 14/14, EVS 10), **Class 6 complete** (Maths 14, Science 9,
  History 8, Geography 5, Civics 5), **Class 7 complete** (Maths 14,
  Science 9, Geography 5, History 6, Civics 5), **Class 8 complete**
  (Maths 14/14 in `g8-maths.ts`; Science 9 in `g8-science.ts`;
  Geography 5 in `g8-geography.ts`; History 6 in `g8-history.ts`;
  Civics 5 in `g8-civics.ts`), **Class 9 complete** (Maths 10 in
  `g9-maths.ts`; Science 12 in `g9-science.ts`; History 3 —
  *India and the Contemporary World I* — in `g9-history.ts`;
  Geography 6 — *Contemporary India I* — in `g9-geography.ts`;
  Political Science 5 — *Democratic Politics I* — in `g9-civics.ts`;
  and the new-at-this-grade subject **Economics** 4 — *Understanding
  Economic Development I* — in `g9-economics.ts`), and **Class 10 Maths
  complete** (all 14 chapters in `g10-maths.ts`: Real Numbers,
  Polynomials, Pair of Linear Equations, Quadratic Equations, Arithmetic
  Progressions, Coordinate Geometry, Triangles, Introduction to
  Trigonometry, Some Applications of Trigonometry, Circles, Areas Related
  to Circles, Surface Areas and Volumes, Statistics, Probability — every
  computable answer proven by checkExpr) and **Class 10 Science
  complete** (all 13 chapters in `g10-science.ts`: the chemistry block
  Chemical Reactions, Acids Bases and Salts, Metals and Non-metals,
  Carbon and its Compounds; the biology block Life Processes, Control
  and Coordination, How do Organisms Reproduce, Heredity; the physics
  block Light, The Human Eye and the Colourful World, Electricity,
  Magnetic Effects of Electric Current; and Our Environment). **Class 10
  is now complete across all six subjects**: History 5 — *India and the
  Contemporary World II* — in `g10-history.ts` (Rise of Nationalism in
  Europe, Nationalism in India, Making of a Global World, Age of
  Industrialisation, Print Culture); Geography 7 — *Contemporary India
  II* — in `g10-geography.ts` (Resources and Development, Forest and
  Wildlife, Water Resources, Agriculture, Minerals and Energy,
  Manufacturing Industries, Lifelines of National Economy); Political
  Science 5 — *Democratic Politics II* — in `g10-civics.ts` (Power
  Sharing, Federalism, Gender Religion and Caste, Political Parties,
  Outcomes of Democracy); and Economics 5 — *Understanding Economic
  Development* — in `g10-economics.ts` (Development, Sectors of the
  Indian Economy, Money and Credit, Globalisation, Consumer Rights).
  **Class 11 has now opened, and it changed the shape of a chapter.**
  Up to Class 10 a chapter was conceptual or computed and never both —
  history through the fact engine, maths through the numeric module.
  Class 11 physics does not divide that way, so `withNumeric` in
  `scripts/quiz2/numeric.ts` now bolts individually-authored computed
  problems onto the ladder the engine generated, in the same topic file:
  a pupil revising projectiles gets the independence of the perpendicular
  components AND the range of a 20 m/s throw from one card, the
  quantitative half proven arithmetically by checkExpr while the
  conceptual half stays honestly unproven. **Class 11 Physics is now
  complete** — all fourteen chapters in `g11-physics.ts`, 397 questions,
  each chapter six facts or more plus an authored L5 and L6 and ten
  computed problems spanning the ladder. The entity names deliberately
  avoid the Class 9 motion, heat and sound vocabulary: this grade asks
  what an inertial frame IS, why a third-law pair can never cancel, why
  averaging cannot touch a zero error, why a rolling cylinder always
  loses a downhill race, why an astronaut under 8.7 m/s² of gravity
  floats anyway, why a wire's breaking load does not care how long the
  wire is, why the ice in a full glass does not overflow it, why milking
  the tea first keeps it hotter, why an engine that conserves energy
  perfectly can still be impossible, why a smell moving at 500 m/s takes
  minutes to cross a room, why soldiers break step on a bridge, and why a
  moving siren and a moving listener at the same relative speed hear
  different pitches — the asymmetry that light does not show and that
  special relativity was built to explain. **Class 11 Chemistry is now
  complete** — all nine chapters in `g11-chemistry.ts`, 252 questions, on
  the same footing: Some Basic Concepts, Structure of Atom,
  Classification and Periodicity, Chemical Bonding and Molecular
  Structure, Thermodynamics, Equilibrium, Redox Reactions, Organic Basic
  Principles and Hydrocarbons. It asks what a mole COUNTS, why an
  empirical formula cannot tell glucose from formaldehyde, why a dim blue
  lamp beats a blinding red one, what survived of Bohr's model when the
  orbit did not, why the jump in an ionisation series gives away the
  group number, why carbon dioxide has polar bonds and no dipole while
  water has both, why a beaker that goes cold as a salt dissolves is not
  breaking any law, why a catalyst that doubles the rate cannot shift the
  yield by a single per cent, why the same reaction is an oxidation to
  one bookkeeper and a reduction to another, why two molecules sharing
  the formula C₂H₆O boil 102 degrees apart, and why a ring with three
  double bonds leaves bromine water orange all afternoon while an alkene
  clears it in seconds. **Class 11 Biology has opened** in
  `g11-biology.ts` — five of nineteen chapters, 99 questions: The Living
  World, Biological Classification, Plant Kingdom, Animal Kingdom and
  Morphology of Flowering Plants. Biology is also where the `withNumeric`
  arrangement earns its keep by NOT being used. Physics and chemistry
  needed computed problems on every chapter because their ideas and their
  sums are the same material; taxonomy has no arithmetic in it that is
  not invented, and a ploidy sum bolted onto a chapter about the
  definition of a species would be a fiction of the file rather than a
  fact of the subject. So `G11_BIOLOGY_NUMERIC` carries an entry only for
  Plant Kingdom, where the counting is real — halve at meiosis, double at
  fertilisation, triple for endosperm — and is empty everywhere else. An
  empty entry is a claim rather than an omission: it says this chapter is
  not measured by calculation. The chapters ask what property nothing
  non-living has, why reproduction cannot be the test when a mule is
  plainly alive, why a virus is alive inside a cell and a chemical
  outside one, why a two-kingdom scheme collapsed under a euglena that
  fitted in both boxes, why a fungus is nearer to you than to the grass
  it grows in, why a fern solved height and did not solve water, why a
  flowering plant stocks a seed only after the order is confirmed, why a
  whale is not a fish and a bat is not a bird, why an empty space in the
  body is a better classifier than any organ, and why a potato is a stem
  and a carrot is a root. **Biology is now ten chapters in** — 216 questions,
  the second five carrying the structural half of the syllabus: Anatomy of
  Flowering Plants, Structural Organisation in Animals, Cell: The Unit of
  Life, Biomolecules, and Cell Cycle and Cell Division. They ask why a nail
  hammered into a trunk is at the same height forty years later, why a ring
  can be counted in Himachal and not in an evergreen belt and not at all in a
  palm, why a cockroach's blood is not bad at carrying oxygen but is never
  asked to, why a frog's skin cannot both breathe and hold water, why an
  amoeba could not reach the size of a fist however much it ate, why an
  antibiotic that jams a ribosome spares the patient AND the fungus, why a
  boiled egg keeps every peptide bond and never works again, why a cow does
  not digest grass and its bacteria do, why one division cannot halve a
  chromosome number, and what sexual reproduction buys for the fifty per cent
  tax it pays. **Biology is now fifteen chapters in** — 348 questions, the
  third five carrying the functional half: Photosynthesis in Higher Plants,
  Respiration in Plants, Plant Growth and Development, Breathing and Exchange
  of Gases, and Body Fluids and Circulation. They ask why maize outyields wheat
  in a Punjab June and loses to it in November, why the oxygen you breathe came
  out of water rather than out of carbon dioxide, why a "dark reaction" stalls
  seconds after sunset, why a crop standing knee-deep in floodwater dies of
  what looks exactly like drought, why a sealed brewing vat eats nineteen times
  the sugar to grow the same yeast, why the same two substances make a callus
  form roots, shoots or neither depending only on their ratio, why two minutes
  of torchlight at midnight can stop a whole crop flowering, why the urge to
  breathe is the body noticing carbon dioxide and never oxygen — and why that
  makes hyperventilating before a dive lethal — why a trekker flown to Ladakh
  gets worse as she breathes harder, why both heart sounds are valves and not
  muscle, and why an Rh-negative mother's first child is safe and her second is
  not. **Class 11 Biology is now complete at nineteen chapters** — 441
  questions, the last four closing the control systems: Excretory Products and
  their Elimination, Locomotion and Movement, Neural Control and Coordination,
  and Chemical Coordination and Integration. They ask why a kidney throws out a
  hundred and eighty litres a day in order to keep a hundred and seventy-eight
  and a half of them back, why sugar in the urine is evidence about the blood
  rather than about the kidney, why a body stiffens after death instead of
  going slack — and what that proves about which step of a muscle's cycle needs
  the energy — why the biceps works at a six-fold mechanical disadvantage and
  is right to, why a nerve signal arrives at your foot as loud as it left your
  spine and therefore has to code intensity as frequency, why a dentist's
  injection takes pain before touch and returns them in the reverse order, why
  a thyroid tablet taken for three years shrinks the gland that would have made
  it, and why insulin must be injected while cortisone can be swallowed.
  **Nine of the nineteen carry numerics and ten do not**, which is the honest
  shape of the subject: ploidy, surface-area-to-volume, polymer arithmetic,
  chromosome bookkeeping, Calvin-cycle stoichiometry, the two-versus-thirty-
  eight ATP ledger, growth rates, lung volumes, cardiac output, glomerular
  filtration, sarcomere band widths and membrane voltages are all real counting
  a pupil must be able to defend — and taxonomy, anatomy, the plant regulators
  and the whole endocrine chapter have none that is not invented. Chapter 19's
  absence from `G11_BIOLOGY_NUMERIC` is written up in the file as a claim
  rather than a gap. **Class 11 Maths then opened** in `g11-maths.ts` — five
  chapters, 70 questions: Sets, Relations and Functions, Trigonometric
  Functions, Complex Numbers and Quadratic Equations, and Linear Inequalities.
  It is the one Class 11 family that arrives fully built like Classes 3–10
  rather than as a conceptual ladder with problems bolted on, because a set, a
  relation and a discriminant are already the things being counted. What is new
  at this level is a question whose answer is a fact about a STRUCTURE rather
  than a measurement — how many subsets, how many relations from A to A, how
  many one-one functions exist and why none can exist the other way round — and
  those are still provable, so they carry a `checkExpr` like everything else.
  The distractors are the real slips: the union counted twice, the proper
  subset that wrongly drops the empty set, the discriminant taken as b² − 4c,
  the greatest integer less than 4 given as 4, tan(A + B) with a plus in the
  denominator, and the modulus of 3 + 4i added to 7 instead of squared to 5.
  **Five more Class 11 Maths chapters followed** — 70 questions: Permutations
  and Combinations, Binomial Theorem, Sequences and Series, Straight Lines and
  Conic Sections. The counting thread runs through all five: a combination is a
  permutation with the double-counting divided out, a repeated letter is the
  same division wearing a different hat, and the binomial coefficients turn out
  to be those same combinations read off a bracket. Sequences carries the one
  genuinely strange result at this level — an endless sum that stops at a
  finite number, which is why a ball bouncing infinitely often travels 72
  metres and not infinitely far. Lines and Conics do geometry with arithmetic:
  a distance from a point to a line without drawing the perpendicular, three
  points tested for collinearity by comparing two slopes, and a circle through
  three points found by recognising a semicircle rather than solving three
  equations. Distractors again encode the real slips — ⁸P₃ where ⁸C₃ was asked,
  the binomial coefficient without the 2 inside the bracket squared with it,
  the 5th term quoted where the sum of five was wanted, a perpendicular slope
  inverted but not negated, and the intercepts added instead of Pythagorased.
  **Class 11 Maths then closed at fourteen chapters** — 196 questions, the last
  four being Three Dimensional Geometry, Limits and Derivatives, Statistics and
  Probability. The through-line is how little has to be rebuilt: 3D distance is
  Pythagoras with one more square and a midpoint is still an average taken
  coordinate by coordinate; probability's addition rule is the union formula
  from Chapter 1 wearing a new name; and the standard limit of (xⁿ − aⁿ)/(x − a)
  turns out to BE the power rule, written twice. Statistics leaves the mean
  behind for the spread, with a pair of questions that exist only to be read
  together — adding 5 to every observation leaves the variance untouched, while
  multiplying by 3 triples the standard deviation and multiplies the variance by
  nine. Distractors are the real errors: 0/0 read as zero, the average velocity
  quoted where the instantaneous was asked, two means averaged without weighting
  for group size, and 1.1 offered as a probability. **That finished Class 11
  across all four subjects**, and Class 12 opened in `g12-physics.ts` with the
  first four chapters — 111 questions: Electric Charges and Fields,
  Electrostatic Potential and Capacitance, Current Electricity, and Moving
  Charges and Magnetism. The grade's premise is that the cause of a force stops
  being the other body: two charges a metre apart touch nothing, so each alters
  the space around it and the other responds to the space it is in. That shifts
  weight onto the conceptual half, which is why these fact tables are about
  mechanism rather than vocabulary — why two field lines can never cross (a
  tangent gives the field's direction and a charge released there cannot set off
  two ways), why bringing a huge charge up just outside a closed surface changes
  the field at every point of it and the flux through it not at all, why a bulb
  lights instantly when its electrons drift at a tenth of a millimetre per
  second, and why a magnetic force can bend a proton's path forever without
  changing its speed by a joule. Two of the hard questions are diagnostic rather
  than theoretical: a car battery that reads a healthy 12.6 V at rest and
  collapses to 9.5 V under the starter is not faulty, and the quantity that
  would actually diagnose it — internal resistance — is invisible in the very
  test being used, because it only ever appears multiplied by the current. The
  companion pair converts one galvanometer into both instruments and makes the
  rule fall out of the wiring: series connection demands low resistance so an
  ammeter needs a parallel shunt, parallel connection demands high resistance so
  a voltmeter needs a series multiplier. **One duplicate had to be resolved
  rather than papered over**: a Class 12 fact named "Ohm's law" generated an
  EXCEPT stem identical to Class 10 Science's, and the fix was to rewrite the
  fact as what is genuinely new at this level — the *limits* of Ohm's law, the
  conditions V = IR silently assumes — instead of renaming it to dodge the
  check. **Four more Class 12 Physics chapters followed** — 112 questions:
  Magnetism and Matter, Electromagnetic Induction, Alternating Current and
  Electromagnetic Waves. The run has a spine: a magnetic field that begins and
  ends nowhere, a changing one that drives a current, that current made to
  alternate, and the pair of fields finally leaving their source behind
  altogether. Cutting a bar magnet gives two magnets rather than two poles
  because there were never two poles — it is a solenoid whose windings are
  electrons — and Gauss's law for magnetism is that fact written as a
  right-hand side with nothing on it. A magnet dropped down a copper pipe falls
  slowly although copper is not magnetic, and Lenz's law is not a rule of thumb
  there but the only direction energy conservation permits: the other sign would
  accelerate the magnet, induce more current, and accelerate it further. A rod
  on frictionless rails gets the same Blv two ways — flux swept, and Lorentz
  force on the electrons — and then the mechanical power Fv turns out to equal
  the electrical ε²/R term for term, which is a generator stated in one line.
  Two of the hard questions are arguments the student half-wins: the mains
  cannot be 220 V because a sinusoid averages to zero (true, and the reason
  nobody quotes the average — heating goes as i², which is positive in both
  halves), and a factory's wattless current delivers no energy to its machines
  (true, and irrelevant to the cables, which carry it and dissipate I²R while
  doing so). Ampère's law is shown to be **wrong** rather than merely limited —
  one loop, two surfaces, two answers — and displacement current is the repair
  that a contradiction demanded rather than a measurement suggested. The last
  chapter closes on why a 50 kW radio mast is safe to stand beside while a few
  minutes of sunlight burns: damage is decided by hf per quantum, not by watts,
  and turning a transmitter up sends more photons and never more energetic ones.
  **Four more followed** — 113 questions: Ray Optics and Optical Instruments,
  Wave Optics, Dual Nature of Radiation and Matter, and Atoms. The run is the
  ray being retired: it survives Chapter 9 as a working approximation, is shown
  in Chapter 10 to be an approximation (narrow the slit and the beam SPREADS, so
  no aperture is ever small enough to define one), and by Chapter 11 light is
  arriving in packets and electrons are diffracting off nickel. Chapter 9's own
  through-line is the ratio: a lens taken underwater keeps its shape and loses
  most of its power because (n₂/n₁ − 1) is a ratio, a mirror carried into the
  same tank is unchanged because reflection has no ratio in it, and an air
  bubble in water is a converging shape whose bracket has gone negative, so it
  diverges. Two of the hard questions are about how to read a theory rather than
  how to use one: Bohr's postulate is stipulated and not derived, and it buys
  the hydrogen spectrum — including Rydberg's constant out of h, m and e — at
  the price of an unexplained rule; and the model's failure at neutral helium is
  *informative*, because the boundary falls at one electron versus more than
  one, which names the orbit rather than the quantisation as the fatal
  assumption. The advertised '600× telescope' question makes the same move
  commercially: any magnification is available from any eyepiece, and the
  quantity physics limits is resolving power, fixed by the objective's diameter
  alone. **One latent collision was closed while in the area** — a Class 12
  electrostatics fact named "The principle of superposition" shared its name
  with Class 11 Waves and was avoiding a duplicate-stem error only by luck of
  the seeded shuffle; it is now "Superposition of electrostatic forces", which
  is the more precise name anyway. **Class 12 Physics then closed at fourteen
  chapters** — 391 questions, the last two being Nuclei and Semiconductor
  Electronics. Both turn on reading a graph or a formula for what it actually
  claims. Fission and fusion both release because the binding-energy-per-nucleon
  curve is not monotonic but a hill with iron at the top, so uranium splitting
  and hydrogen joining are not opposite moves — both run downhill from opposite
  slopes, and 235 nucleons each gaining 0.9 MeV is where the 200 MeV comes from.
  Two half-lives do not exhaust a sample, because each halves what is LEFT; and
  a nucleus that has waited a century is exactly as likely to go in the next
  second as one made this morning, because the decay law contains no age term at
  all — an intuition drawn from things wearing out, applied to something that
  does not wear out. The last chapter's spine is σ = nqμ: heating a metal lowers
  μ with n fixed, heating silicon raises n exponentially, and doping raises n by
  chemistry alone — one boron atom per million changing the conductivity a
  millionfold while the crystal stays exactly neutral, because a missing BOND is
  not a missing charge. The mass-action law n_e n_h = n_i² then does the rest:
  raise the majority carriers a millionfold and the minority ones are crushed by
  the same factor, and that asymmetry is what a diode is. **One more `numberIn`
  false positive** — the radius formula written `A^(1/3)` parses as 0.333 —
  fixed by writing "the cube root of A" in prose, warnings back to 34.
  **Class 12 Chemistry then opened** in `g12-chemistry.ts` — two chapters, 56
  questions: Solutions and Electrochemistry. What is new at this level is that
  the questions worth asking are about why a number comes out as it does rather
  than what it is. One mole of salt lowers a freezing point twice as far as one
  mole of glucose because colligative properties count PARTICLES and are blind
  to what they are — and not *exactly* twice, because at real concentrations
  some ions still travel as pairs, which is what the van't Hoff factor
  measures rather than fudges. Osmometry is the method of choice for a protein
  not on principle but on arithmetic: the same particle count reads as two and a
  half atmospheres instead of two ten-thousandths of a degree. Electrochemistry
  turns on a measurement that cannot be made — a voltmeter has two leads, so the
  second is always another electrode, and hydrogen is assigned zero the way the
  sea is assigned zero altitude; shift it by a volt and every tabulated
  potential shifts while every measurable cell voltage stays put. The chapter
  closes on Kohlrausch's law, which obtains a quantity defined at a limit no
  experiment can reach by arranging three measurable ones so the unreachable
  parts cancel. **One more `numberIn` catch**: the answer rendered "1.1 V" while
  the solution wrote "1.10 V", and the token-boundary check correctly refused to
  match — fixed in the prose, warnings back to 34. **Two more Chemistry chapters
  followed** — 56 questions: Chemical Kinetics and the d- and f-Block Elements.
  Kinetics is the half of chemistry thermodynamics leaves out — a diamond is
  bound to become graphite and does not, because a free energy change says
  nothing about how long. The L5 breaks the habit of reading a rate law off a
  balanced equation: 2NO + O₂ happens to match its coefficients because it goes
  in one step, while ester hydrolysis is genuinely second order and only *looks*
  first order because water is in fiftyfold excess — pseudo-order is a property
  of the experiment, not the chemistry. The L6 is the catalyst that cannot shift
  an equilibrium: it lowers the summit, and a summit is one point, so both
  climbs shorten equally, both rate constants rise by the same factor, and
  K = k_f/k_r cancels it. The d-block chapter answers "why does manganese manage
  +2 to +7 and sodium only +1" — not by counting electrons (caesium has
  fifty-five and still only manages +1) but by how much the NEXT one costs:
  sodium has a cliff after the first, manganese a slope. And zirconium and
  hafnium are the same size a period apart because fourteen lanthanoids sit
  between them, each contracting the atom slightly because 4f shields badly —
  fourteen small deficits that restructured the periodic table's lower half, and
  the reason hafnium was the last stable element found. **One more `numberIn`
  catch**: `(n−1)d` in an answer parses as −1; reworded to "the inner d
  orbitals", warnings back to 34. Suite re-pointed and green: 87 files, 1485
  tests.

  **Two more Chemistry chapters** — 56 questions: Coordination Compounds
  and Haloalkanes and Haloarenes. Coordination chemistry is where a
  measurement decides a structure. [Fe(H₂O)₆]³⁺ has five unpaired
  electrons and [Fe(CN)₆]³⁻ has one: same metal, same +3 state, same d⁵,
  and the only difference is what is bolted to the outside — the ligand
  field splitting Δ against the pairing energy P, and whichever is larger
  wins. The spectrochemical series that orders the ligands is then an
  awkward fact for the electrostatic picture that produced it, because
  neutral CO outranks charged iodide; only a bonding model with π
  back-donation explains that, and haemoglobin's spin switch on binding
  oxygen is the same physics doing something useful. The L6 asks why the
  ethylenediamine complex of nickel is ten million times more stable than
  the hexammine when the Ni–N bonds are identical: the bonds are not where
  the gain is — three chelates displace six ammonias, four free particles
  become seven, and the whole effect is entropy. That is also why EDTA is
  given for lead poisoning, and why it is given as the *calcium* disodium
  salt: the free ligand would strip calcium from bone on the way. The
  haloalkanes chapter is two mechanisms told apart by two independent
  measurements that agree — a rate law and a stereochemical outcome. A
  primary halide's rate depends on both concentrations and its product is
  cleanly inverted, because the nucleophile must attack from behind the
  leaving group and turns the carbon inside out like an umbrella; a
  tertiary halide's rate ignores the nucleophile entirely, because a
  species absent from the slow step cannot be in the rate law, and its
  flat carbocation is attacked equally from both faces and racemises.
  The L6 puts chlorobenzene beside chloroethane: minutes in warm alkali
  against 623 K and 300 atmospheres, a factor of about 10¹⁰, caused by
  three effects at once — resonance shortening the C–Cl bond from 177 pm
  to 169 pm, an sp² carbon holding its electrons more tightly, and a π
  cloud repelling the nucleophile while the SN1 escape stays shut because
  an aryl cation cannot be delocalised at all. The way round is a
  substituent effect that depends on POSITION and not merely strength:
  nitro groups ortho and para stabilise exactly the intermediate a
  nucleophile forms, meta ones barely help, and three of them let plain
  warm water do the job — which is how picric acid is made. Verify clean,
  warnings steady at 34, suite green: 87 files, 1485 tests.

  **Two more Chemistry chapters** — 56 questions: Alcohols, Phenols and
  Ethers, and Aldehydes, Ketones and Carboxylic Acids. The first chapter is
  one functional group put in two places and behaving unrecognisably: on a
  chain it is barely acidic, on a ring it turns litmus, and the L5 is that
  six-pKa gap. The move worth learning is to stop asking about the acid and
  ask about its conjugate base — ethoxide has its charge stuck on one
  oxygen while phenoxide spreads it over the ring, and once that is the
  explanation it predicts *where* a substituent must sit: nitro groups
  ortho and para take phenol's pKa from 10.0 to 0.4, while a meta one
  barely moves it, because the charge never appears there. The same
  delocalisation shortens the C–O bond by 7 pm and makes the hydroxyl group
  hard to displace — one cause, two effects that look opposite. The L6 puts
  ethanol against dimethyl ether: identical atoms, 103 K apart, because a
  boiling point measures forces BETWEEN molecules and an ether can accept a
  hydrogen bond but not donate one. The clincher is that the ether is still
  appreciably water-soluble, which proves its problem was never an
  inability to hydrogen-bond. The carbonyl chapter is about a carbon left
  hungry by an oxygen that pulled the π electrons across, and the reactions
  are therefore additions rather than substitutions. The L5 walks methanal
  → ethanal → propanone → a di-tert-butyl ketone and shows two causes
  running the same way, electronic and steric — and then makes the real
  point, which is that the order survives a change of reagent, because both
  causes are properties of the substrate. That invariance is the evidence.
  The L6 reads five pKa values across sixteen orders of magnitude with one
  argument: carboxylate's two C–O bonds both measure 127 pm where the
  acid's differ by 13 pm, which is resonance shown rather than asserted;
  chlorines then add inductively; and the member that breaks the pattern —
  a chlorine three bonds away doing almost nothing — is the one carrying
  the information, since that steep fall with distance is exactly what
  distinguishes induction from resonance. One authoring correction: a fact
  was drafted with a `seq` field, which the engine reserves for chronology
  in history chapters, not step lists — rewritten as a `pair`. Verify
  clean, warnings steady at 34, suite green: 87 files, 1485 tests.

  **Class 12 Chemistry then closed at ten chapters** — the last two, 56
  questions: Amines and Biomolecules. The amines chapter turns on one lone
  pair doing every job in it — basicity and nucleophilicity being two names
  for the same property — and the L5 is the observation that the basic
  order of the methylamines REVERSES between the gas phase and water. In the
  gas phase only the molecule matters and alkyl groups make the pair more
  available, so the order is clean; in water a second factor appears,
  because the cation is stabilised by hydrogen bonds from its own N–H
  hydrogens and every alkyl group added removes one of them. Two effects in
  opposition, and the secondary amine sits at the compromise. The moral is
  that a tabulated pKb belongs to the amine *in water*, not to the amine.
  The L6 gets three unrelated-looking facts about aniline — a millionfold
  weaker base, a ring so activated that bromine needs no catalyst, and a
  Friedel–Crafts that will not run at all — out of one cause, and ends on
  the acetylation trick, a protecting group used to turn a reaction's dial
  down rather than to prevent it. Biomolecules is ordinary organic
  chemistry doing biology's work, and the L5 is the genuine historical
  difficulty: glucose gives a silver mirror while its accepted structure
  has no aldehyde, and also fails Schiff's test and the bisulphite test.
  One postulate — a ring in equilibrium with a trace of open chain, the
  trace continually replenished as it is consumed — settles the positive
  test, the negative ones, the existence of two crystallisable forms, and
  their convergence to one rotation. The L6 is a controlled experiment: an
  enzyme heated to 70 °C loses all activity with every peptide bond intact,
  which localises the catalysis in the FOLD rather than the sequence,
  because the fold is held by bonds an order of magnitude weaker than the
  backbone's. One authoring fix caught before shipping: a numeric question
  solved a weighted average whose `checkExpr` landed on 36.41 rather than
  36 — restated so the arithmetic is exact and the polarimeter argument
  moved into the solution where it belongs. Verify clean, warnings steady
  at 34, suite green: 87 files, 1485 tests. **Class 12 Chemistry: 10/10.**

  **Class 12 Biology opened** in `g12-biology.ts` — three chapters, 54
  questions: Sexual Reproduction in Flowering Plants, Human Reproduction,
  and Reproductive Health. Biology carries no numerics by the Class 11 rule
  (an empty `G12_BIOLOGY_NUMERIC` entry is a claim — this chapter is not
  measured by calculation — rather than an omission), so three chapters is
  the same weight as two elsewhere. What shifts at this level is that Class
  11 asked what things ARE and Class 12 asks why a mechanism is built the
  way it is; a student who can name the parts has learned the vocabulary
  rather than the subject. The flowering-plant L5 explains double
  fertilisation by putting a gymnosperm beside it as the control: the
  gymnosperm builds its nutritive tissue in advance and loses it whenever
  fertilisation fails, while the angiosperm's endosperm is a *product* of
  fertilisation, so the larder is stocked only once there is a mouth to
  feed. The L6 asks why a bisexual flower goes to such trouble to avoid its
  own pollen, ranks the three devices by thoroughness (timing and geometry
  can be defeated by accident; self-incompatibility inspects the genotype
  after the pollen has landed and germinated), and then explains why
  cleistogamy — the opposite strategy — persists, with species that make
  both kinds of flower as the evidence that it is a trade-off and not a
  defect. The human-reproduction L5 derives the whole asymmetry between
  spermatogenesis and oogenesis from one economic principle: a cheap gamete
  is made in quantity and symmetrically, an expensive one concentrates
  everything into a single cell and defers its final division until
  fertilisation makes the cost worth paying. The L6 is the feedback loop
  that changes SIGN — oestrogen suppresses the pituitary at low levels and
  drives it into a surge above a sustained threshold — and the point is
  that the threshold is what makes ovulation triggered by follicular
  maturity rather than by a clock. Reproductive Health's L5 replaces a
  list of a dozen contraceptive names with the chain a pregnancy requires
  and asks which link each method breaks, which makes three separate facts
  fall out at once (why only barriers block infection; why reliability
  tracks how much the method depends on repeated correct use; and why
  medical termination is not contraception at all). The L6 works through
  amniocentesis as the standard shape of a dual-use problem: the law
  restricts the *disclosure of sex* and not the test, because that is the
  single step at which the harmful application diverges from the
  diagnostic one — and it notes that regulating clinics addresses supply
  while the demand comes from outside medicine. Verify clean, warnings
  steady at 34, suite green: 87 files, 1485 tests.

  **Two more Biology chapters** — 56 questions: Principles of Inheritance
  and Variation, and Molecular Basis of Inheritance. These are the first
  Biology chapters where the counting is real rather than invented, so
  they carry numerics: Punnett ratios, gamete kinds as 2ⁿ, autosome counts,
  Chargaff arithmetic, codon combinatorics, and the strand bookkeeping of
  semiconservative replication. The inheritance L5 asks how Mendel got the
  rules right decades before anyone knew what a gene was made of, and the
  answer is method rather than genius: he turned inheritance into a
  counting problem (19,959 F₂ plants in one experiment), chose an organism
  whose true-breeding lines could be verified before the experiment began,
  and simplified before combining. He was also lucky — seven characters
  each with clean dominance and none linked tightly enough to spoil the
  9:3:3:1 — and saying so is not a criticism, since good design is what
  put him where luck could help. The reason the rules survived is that they
  were pitched at the right level of abstraction: nothing in the argument
  depended on what the factors were made of, so chromosomes and DNA
  supplied a mechanism rather than a correction. The L6 gets three
  observations about haemophilia out of one fact (the gene is on the X,
  and males have one copy), and the payoff is that the explanation
  **forbids** something — father-to-son transmission — which makes it
  testable from a family tree alone. The molecular L5 is Meselson–Stahl
  worked as a design problem: three schemes, three predicted band
  patterns, and the point that one generation was *not* enough because
  semiconservative and dispersive both predict a single intermediate band
  after round one. The L6 derives the codon length from arithmetic (4¹, 4²
  and 4³ against twenty amino acids plus a stop) and then argues that the
  forty-one spare codons are a buffer rather than waste — silent third
  positions, chemically similar neighbours, and wobble — the same reason a
  checksum is added to an account number. Verify clean, warnings steady at
  34, suite green: 87 files, 1485 tests.

  **Three more Biology chapters** — 64 questions: Evolution, Human Health
  and Disease, and Microbes in Human Welfare. Only Evolution takes numerics
  (Hardy–Weinberg is genuine counting); the other two get the empty-entry
  treatment the Class 11 rule prescribes. The Evolution L5 answers the
  obvious objection to Hardy–Weinberg — that no population satisfies its
  conditions — by showing the five conditions are not technicalities but
  an exhaustive list of the ways a population can evolve, so the principle
  says "in the absence of every cause of evolution, none occurs", and its
  usefulness is entirely as a null hypothesis. Different departures leave
  different signatures, which is how the sickle-cell heterozygote advantage
  was recognised. The L6 asks why a bat's wing groups with a whale's
  flipper rather than a bird's wing, and lands on the sharp version: SELECTION
  ACTS ON FUNCTION, so function is precisely the property unrelated
  lineages converge on — the underlying plan is not what selection is
  optimising, which is why it survives as a record of descent (and why
  molecular phylogenetics leans on near-neutral sequences). Human Health's
  L5 gets a vaccine's years of protection and an antivenom's few weeks out
  of one question — who made the antibodies — and the L6 explains why HIV's
  harm is so out of proportion to its destruction: it takes out the
  coordinator, so a small targeted loss disables everything downstream,
  like removing a switchboard without damaging a telephone. Microbes' L5
  is selective toxicity as a *predictor* rather than a description: rank
  the target by how like us it is, and the difficulty of drug design falls
  out in order — bacteria (no cell wall in us), fungi (eukaryotes, few
  differences), cancer (our own cells, almost none). The L6 takes the Bt
  toxin's specificity apart into two yes-or-no filters — an alkaline gut to
  activate the protoxin, then a receptor to bind it — and draws the
  consequence for how such a protein should be assessed: ask whether the
  activating conditions exist in the species of concern, rather than
  feeding escalating doses and looking for an effect. Verify clean,
  warnings steady at 34, suite green: 87 files, 1485 tests.

  **Then the attention list got worked through — four fixes in one pass.**
  (1) The directory's three always-visible verbs (pause, left, remove)
  moved behind **one kebab per row**, the same idiom the class list
  already used: restorative verbs (restore, undo leaving) run straight
  from the menu, the destructive-feeling three still open their
  full-width persuading panels — walked in the browser, menu → panel →
  cancel. (2) The **258 practice chapters that all said "Generated
  practice drills for class N"** now each carry an honest one-liner in
  three languages — authored per chapter family with per-grade overrides
  in `scripts/chapter-summaries.ts`, applied additively (and provably
  idempotently: second run wrote 0) by `apply-chapter-summaries.ts`, and
  baked into the generator so a regeneration reproduces them; 267 topics
  now hold 152 distinct summaries and the boilerplate count is zero.
  Walked as a pupil in English and Hindi, and the language preference the
  walk toggled was put back. (3) The **invisible text-join between exam
  sittings and weighted overalls is now said out loud**: the teacher's
  marks page warns — only when the class weights its categories and none
  is named "Exam" — that these marks won't move the weighted overall,
  with a link to the class's weights. Verified live with a disposable
  ZZ class/series (grade string "ZZ Grade" so it leaked to nobody),
  removed with residue zero. (4) The hand-created
  `Assignment_examSlotId_classId_key` index is **documented at both
  sites** that would otherwise be surprised: schema.prisma next to the
  `@@unique`, and the Gotchas. Battery after the batch: typecheck clean,
  **1456/1456 across 85 files**, eslint 0/29, i18n steady at 46/210
  (the new strings all went through keys), RLS all checks passed, build
  clean, **sweep 326/326**, zero fixture residue.
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
  navigation, role labels, the account page, login and **the whole guardian
  surface** are translated; every other page is still English. The switcher
  itself carries that sentence, so nobody meets an English page and wonders
  whether it is broken. **The guardian's, the pupil's and the teacher's surfaces
  are all done**, as are the four attendance marks, the offline banner above
  every page, **every date in the app** and **every browser-tab title**. `npm run
  i18n` prints exactly what is left — **178 files and 1,356 strings** — and that
  total is a floor rather than a certainty.
  **ONE LANGUAGE AT A TIME, ALWAYS.** `getLocale()` resolves a single locale per
  request — `prefs.locale` when there is a session, the cookie before there is
  one — and every `t` for that render comes from it. The switcher shows three
  OPTIONS; it never shows three languages of content. Verified by toggling
  en → हिन्दी → मराठी and reading the page, the dates and the tab title each
  time. What DOES mix today is partial coverage: a screen with translated labels
  beside untranslated English, which is what finishing removes.
  **Hindi and Marathi were written by me, not by a native speaker** — good first
  draft, wants a real teacher's eye before a real school reads it.
- ~~SSO (Google/Microsoft/Apple)~~ **Built** — see Next steps item 1; only the
  live walk with real provider credentials remains.
- **Real SMS and email delivery.** Both transports are written and both ship the
  "devbox" implementation only — messages persist and render at `/dev/mailbox`.
  Wiring a provider is one branch in `src/lib/email.ts` and one in
  `src/lib/sms.ts`; nothing else in the app changes, and both throw loudly
  rather than dropping a password-reset code silently. `env.ts` additionally
  refuses to boot a production origin with either still on devbox. **The
  password reset works end to end today** against the dev mailbox, which is how
  its tests read the codes.
- **2FA — BUILT, THEN REMOVED ON PURPOSE.** TOTP was here, proven against the
  RFC 4226 and RFC 6238 vectors, with single-use steps and ten hashed recovery
  codes. It was taken out at the product owner's direction in favour of one
  password and a reset by email or mobile number. **Recorded rather than
  quietly dropped, because it lowered the account-security floor**: a teacher or
  admin account opens every child's record in a school, and a password is now
  the only thing in front of it. What replaced it is a reset flow that revokes
  every session, a six-digit code capped at five attempts and ten minutes, and
  no account-enumeration oracle on either end. The columns and `RecoveryCode`
  went with it; nobody had it switched on.
- ~~Postgres RLS~~ **done and enforcing.** See Status.

- ~~An unverified mobile number could receive a password-reset code~~,
  ~~there is no rate limiting anywhere in the app~~ and ~~the invite-accept and
  parent-claim forms are unlimited~~ — **all fixed.** See Status. Seven limits
  now: login, password reset, phone confirmation, parent claim (two buckets),
  join-code lookup, parent signup and invite acceptance.
  **What remains, stated rather than implied:** the limits are per-address for
  anonymous callers, and `x-forwarded-for` is trustworthy behind a proxy that
  sets it and forgeable in front of one. That raises the cost of a script; it is
  not a wall, and the things it guards are not defended by it alone — a class
  code is ~31 bits, and a claim needs a date of birth as well as a code.
- **A pupil who joined with a CODE rather than an invitation still forks.**
  `joinAsStudent` mints a new account every time, and a handle account has no
  real address for a new school to invite. The invitation path is the one that
  does not fork, and the account merge is the repair for the one that does — so
  a school transferring a pupil should invite them by email. Letting a
  signed-in person add a school with a join code would close the gap and is
  deliberately not built: it changes what joining MEANS, since an admin at one
  school could become a pupil at another in one click.

- ~~An alumnus cannot reach `/account`~~ and ~~the account page is behind the
  role gate~~ — **both fixed, and they were one bug.** `/account` moved out of
  `(app)`; the pages under it had always been `requireUser` and never needed a
  role at all. An alumnus, a paused member and anybody between contexts all
  reach their own settings, and the sweep asserts **200** where it used to
  assert 307 with a comment calling it a known limitation. See Status.

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

### A pupil can ask for a mentor, and asking grants nothing

**The rule this changes, and the one it does not.** `mentoring.ts` has always
said only school staff may pair a child with an outside adult — not the expert,
who would otherwise choose their own mentee, and not the child, who cannot
meaningfully consent to a stranger. That still holds. **A pupil ASKING is not
pairing.** Two adults still decide; what changed is that the child can start the
conversation instead of waiting to be noticed.

**A request grants nothing at all.** The thread is `REQUESTED`: the expert
cannot see it, nobody can write in it, it gives the expert no tenant access, and
it does not occupy one of their mentee places. It is a message to the pupil's own
school, stored in the shape the mentorship will take if the school and a guardian
both agree.

**The sharpest rule is that the expert cannot see a request.** An outside adult
learning that a named eleven-year-old asked for them — before anybody vetted it,
and whether or not it is ever approved — is a disclosure about a child to a
stranger, made by the child. It is filtered from their list AND refused by id,
because one without the other is a URL away from being useless.

**Guardians are told at APPROVAL, not at the ask.** A request the school may
decline should not become a conversation at home about a stranger the child will
never be paired with. They are asked once, when it becomes real.

**The place is claimed at approval too.** Claiming at request time would let
three children with pending requests close an expert to a school that had
approved nobody — and would make *declining* quietly free up capacity, which is
a strange thing for a refusal to do. An expert who filled up while the request
sat in the queue is refused with a message rather than silently taking an extra
child. Requests are capped at three per pupil.

**Declining is a real answer.** It asks for a reason and sends it to the pupil,
because a child's request that simply never becomes anything is worse than a no.

Eleven mutations, two survived and both were real. Releasing a place a request
never held passes at a count of zero — the `gt: 0` floor hides it — and fails
with a real mentorship running alongside. And nothing covered a school deciding
*another* school's request until a second school went into the fixture.

### One room: a teacher, the pupil, and the pupil's guardians

**Three separate channels was the obvious build and it is wrong twice.**
teacher↔parent, teacher↔pupil and parent↔pupil splits one conversation into
three places where the same thing gets said differently — and a teacher↔pupil
channel with nobody else in it is exactly the shape safeguarding policy exists
to prevent.

**The room was already the right shape.** `RemarkThread` has always been keyed
on `(student, teacher)` and has always been readable by that child's guardians.
The child was the one participant standing outside their own conversation. So
most of this is letting them in — and the guardians are in it by construction,
with the school's admin able to read it, so no adult is ever alone with a child
in here.

**Three people can now open the same room, and each proves a different thing.**
A teacher proves they teach this pupil; a pupil proves the teacher teaches them;
a guardian proves both — that this is their child, AND that the teacher teaches
them. One `teacherTeaches` join asked from both ends, because writing it three
times is how the third copy comes to mean "share a school". Before this a parent
with a question had to wait to be messaged first, and a child had no way to
reach a teacher at all.

**`replyToThread` notified "the other side", which assumed there were two.** It
hard-coded the titles to match — *"New reply from a parent"*, *"New message from
your child's teacher"* — and both were wrong the moment the pupil joined: a
child's message told the guardians it came from a teacher, and nothing at all
reached the child. Recipients now come from the THREAD rather than from the
author's role, which is what stops that returning the next time somebody is
added to the room.

**An existing test asserted the opposite, and it was right when it was written.**
*"refuses the student the thread is ABOUT — notes are written about a child, not
to them"* described a real design. It is reversed here rather than deleted, with
the old reasoning kept in the comment, and a second pupil added to the fixture —
because "admits the child it is about" and "admits pupils" are indistinguishable
if the only pupil in the suite is the one the thread names.

**Ten mutations, all caught**, including the two that matter most: a pupil naming
a teacher who does not teach them, and a guardian pairing their own child with
one who does not.

**And the copy that quietly became untrue.** The thread header said *"About X ·
with Y"* and the padlock line named the teacher, the guardians and the admins —
not the child, who was reading it. Small untruths on a page somebody is trusting
are how they start wondering what else it is not saying.

### The operator can look inside a school, and the school is told

> **Since revised:** the request half of this design — the written reason and
> the 60-minute grant — has been removed; access is standing now. The recorded
> visit and the school-visible audit survive. See "The operator stops knocking"
> below for what changed and why.

**This reverses the strongest claim this README made**, so it is worth stating
plainly. `superuser.ts` said setting a school up is administration and reading
what happens inside one is surveillance, and that the boundary had to be
somewhere the UI could not move. That was the right default and it is still the
default. What it could not answer is the ordinary reason a host needs to look: a
school reports abuse it cannot see the whole of, a safeguarding referral arrives
about content on this installation, a bug corrupts one school's register.

**So the answer is not a master key, it is a signed-out one.** The operator does
not hold every school open. They OPEN ONE, with a written reason, for 60
minutes — and opening, every action inside, and closing are audited **against
that school's id**, so they appear in that school's own Safety Centre above the
tabs. The operator gains sight; they give up doing it unobserved. That trade is
the feature, and if you remove the second half you have built the thing the
original comment was refusing to build.

**`app.is_superuser` still opens exactly School and Invite.** Nothing about the
flag widened. What widened is a deliberate, recorded, expiring grant: while it
is live the operator is bound to that ONE school through `forTenant`, so every
ordinary tenant policy governs them exactly as it governs that school's admin.
Nine live `rls:verify` checks hold it, and the negatives are the ones that
matter — holding a grant on school A reads **none** of school B's posts and
**none** of their register, flag or no flag.

**`OperatorAccess` is the only append-only table in the schema, and it has NO
DELETE POLICY for anybody.** Postgres denies what no policy permits. The school
cannot tear pages out of its own visitor book, and — the one that actually
matters — neither can the operator, who is bound to that school while the grant
is live and could otherwise look, act, and erase the evidence they had been
there. Both directions are checked live.

**Two powers, and the absences are the design.** Take a post down — REJECTED,
never deleted, because a host removing content and leaving nothing behind is
indistinguishable from the content never existing. And pause a person —
reversible, audited, with the **last-admin rule restated** rather than
inherited, because a school with no admin is bricked and "the host did it" makes
that worse. Not here: reading private messages between a parent, a teacher and a
child; changing a mark, a register or a report card; ending an account
permanently. And there is no list-everybody — search needs a name, so an
operator arriving with one can find that person and an operator with idle
curiosity is not handed a directory of children.

**A bug the unit suite structurally could not see, and how it surfaced.** The
first version bound the school with `forSchool`, which derives
`app.is_superuser` from an override store that is empty on a fresh request. The
INSERT policy refused: *new row violates row-level security policy*. Every unit
test passed either way, because they run as the owner with the policies off. It
was found by pressing the button. The sweep check I then wrote to catch it
**does not** — it inserts the grant as the database owner, so it exercises the
read path only, and that was verified by reintroducing the bug and watching it
stay green. It is labelled for what it proves; the write path is pinned in
`rls:verify` instead.

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
in.** The old account's password: you have to be able to sign in to both. (It
asked for a second factor too, until 2FA was removed — see Not built.)
**No admin can do this.** A school admin who could merge accounts
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

### The operator stops knocking, a school can be removed, and a content team arrives

Four asks in one wave, and the audit of it after the fact. Two were bugs a
pupil would hit and two reshaped who can do what on the installation.

**A language switch now changes the question on screen.** The practice player
fetched its question at mount and held it in client state, so switching to
Hindi mid-question changed every label and left the stem English until "Next" —
the worst possible order, since the stem is the thing being read. The fix is
one attribute, `key={language}` on the player (topic and revision both): the
switcher already saves and refreshes, the page re-renders with the new locale,
and the keyed remount makes the player re-serve what it is showing. **Level
badges say one language at a time.** "Yaad rakho · Remember" was the product
voice when every reader saw one dictionary; with three real dictionaries the
bilingual composite made every badge half-wrong for everybody. Each dictionary
now carries only its own word — Remember, याद रखो, लक्षात ठेवा.

**The operator's key stops asking — and the school still sees them come in.**
The section above describes the 60-minute written-reason grant, and this wave
deliberately reverses the request half of it: the person running the server now
holds standing access to every school, down to the individual, with no door to
knock on first. What survives — and it is the half worth keeping — is that
every look still writes an `OperatorAccess` row (one per hour, not one per
query) that surfaces in that school's own Safety Centre, and every action
inside is audited against the school's id. Mechanically nothing widened at the
policy layer: `app.is_superuser` still opens exactly School and Invite, and
sight is always through `withSchoolAccess` binding that ONE school, so the
tenant policies govern the operator exactly as they govern that school's admin
and the school next door stays invisible. `rls:verify` still proves both
directions. **Removing a school is a button now, and it is not a delete.**
`removeSchool` runs the ordinary departure machinery for the whole roll in one
transaction — every pupil leaves the way an alumnus does, certificate issued,
account intact, record reachable through the same user-keyed policies every
leaver already relies on — and the School row is only flagged `removedAt`,
which drops it from join codes, listings and switchers. `removedAt` is set
outside the transaction so a failure leaves the school whole and the button
safe to press again.

**An app admin is the content team, and not the operator.** A second flag on
`User` (`isAppAdmin`, granted by `npm run appadmin -- <email>`, or by the
operator from `/root/content-team` — see the next section), a surface at
`/appadmin` outside `(app)`, and a deliberately short list of powers: post platform-wide competitions
(`organizerSchoolId: null`, draft first, publish deliberate), and add, edit or
delete questions in the shared practice bank. They cannot see inside any
school; nothing on the surface takes an id that names one, and the tables they
write carry no school column to leak. **A question typed once in English is
translated to Hindi and Marathi at save time, by Claude**, with the choice
count pinned by schema AND re-checked in code — a translation with a different
number of options would mark a child wrong for being right in Marathi. It
fails soft: no key, a refusal, a malformed response all save the English
original alone, which the reading path already falls back to field-by-field.

**The bug that fell out of pressing the buttons** was in neither feature: the
tenant override's `AsyncLocalStorage` was module-scoped, the bundler evaluates
that module once per route bundle, and the Prisma client it feeds is
process-wide — so whichever bundle built the client first kept its own storage
and every other bundle's `forTenant` wrote overrides nobody read. The
operator's look inside a school counted zero of everything and the fresh-login
role switcher crashed, both silently, both shaped exactly like row-level
security doing its job. It lives on `globalThis` now, the same treatment the
Prisma client itself already gets, for the same reason.

**Honest edges, left visible.** Removal has no undo button — pressing it twice
is refused, and putting a removed school back is a `psql` job today. The
auto-translation needs `ANTHROPIC_API_KEY` in the environment; without it the
dashboard says so and questions ship English-only. And the bank now has two
writers: `npm run quiz:import` reconciles each topic it owns by stem and
deletes what the content files do not mention, so an app admin's question added
to an IMPORTED topic, or an edit that changes a stem, is undone by the next
import run. The two workflows coexist today by convention — the importer owns
its 308 topics, the dashboard is for what the files do not cover — and the
known-issues list carries it until the importer learns to leave
dashboard-authored rows alone.

### The operator inherits the content team, and appoints it

Two sentences of product decision, and the shape they took. The operator holds
everything the app admin holds, and the operator appoints the app admins —
both from the browser.

**The inheritance is two lines, in the two gates that must agree.**
`assertAppAdmin` (every action) and `requireAppAdmin` (the layout) now accept
`isSuperuser` alongside `isAppAdmin` — the same check in both places, because a
page that renders whose every action then refuses is worse than either
refusing. Nothing else changed hands: the appadmin surface still takes no id
that names a school, so the operator arriving with more brings nothing here
that could leak more. **And the direction never reverses.** An app admin gains
nothing of the operator's — the new test file pins a superuser passing the
content gate AND an app admin bouncing off an operator function, in the same
suite.

**Appointing is a page now: `/root/content-team`.** The operator sees who
holds the flag, appoints by the email of an existing account, and dismisses
with one click — appoint and dismiss both audited into the server log with no
school id, exactly like school creation. There is deliberately no invite
token: an app-admin invite would need a school-less Invite row the model does
not have, and a flag on a half-created account is a standing key nobody is
using. The person registers through the ordinary flow; the operator flips the
flag on what exists — the same order the CLI imposed, now with a page, and the
"no account with that email" error says exactly that. The CLI
(`npm run appadmin`) survives as bootstrap and recovery, no longer the only
door.

Verified end to end with a minted ZZ operator session against the production
build: `/root/content-team` renders the roster and the appoint form,
`/appadmin` serves a superuser who holds no appadmin flag (with a
back-to-server link an app admin never sees), and the audit-labels suite
forced words for both new audit actions in all three languages before the
suite would pass — 85 files, 1,460 tests green.

### Competitions split in two, and a school's own stops leaking

**The catalogue was flat and it was wrong.** `listCompetitions` served every
published competition to every school — so Riverside's own spelling bee, held
in its own hall for its own pupils, was listed at Oakfield, opened at Oakfield,
and could be ENTERED from Oakfield: `enterCompetition` never checked the
organiser either, so a child from the school next door could put themselves on
Riverside's consent list. A test even pinned the old behaviour approvingly —
"the SAME catalogue at both schools — that is what makes it a marketplace."
The product decision is now the other way, and the test asserts the reverse.

**Two sections, one rule.** A school-posted competition
(`organizerSchoolId` set) belongs to that school's students; a platform-posted
one (`organizerSchoolId` null — the operator or an app admin) belongs to
everybody. The page shows them as two labelled sections — "From your school"
and "For every school" — and the rule is enforced in all three places it must
be: the list never serves another school's own, `getCompetition` answers NOT
FOUND for it (never forbidden, which would confirm it exists), and
`enterCompetition` carries the same predicate in its WHERE clause, so entering
is gated by the same line that gates seeing.

**The guardian path is the corner that mattered.** A parent has no membership
and often no active school, but the consent notification links straight to the
competition. `visibleSchoolIds` therefore gives a guardian every school an
ACTIVE guardianship points at — via `Guardianship.studentSchoolId`, the column
that was denormalised precisely so this question could be answered before any
tenant is bound. Pinned by a test: a guardian with no schoolId on their session
sees and opens their child's school's competition.

**Verified live against the production build**, with minted sessions: the
Riverside pupil sees both sections with the Spelling Bee under "From your
school"; the Oakfield pupil's list mentions it zero times and the direct URL
answers 404. Suite at 85 files / 1,463 tests, with the flipped catalogue tests
and four new visibility cases.

**And the standing policy tightened to match.** `CompetitionStanding`'s
global-read arm used to open a school's aggregate row (name, entrant count,
best place — never children) to every tenant whenever the leaderboard was on.
For a school-posted competition that crossing became pure leak: no page can
show it — the competition itself answers NOT FOUND to other schools — so the
only possible reader was a crafted query through the app role. The policy now
requires `organizerSchoolId IS NULL` alongside `leaderboardEnabled`, closing
it in the database, and `rls:verify` grew two checks: school B reads ZERO
standings for school A's own competition even with its board on, and school A
still reads its own.

### The school stands in as guardian, until a parent arrives

A pupil whose parent is not on the app had nobody to say yes: a competition
entry waited forever on a consent nobody could give, and every guardian-facing
surface — the diary, the digest, the consent list — was a door with no key
behind it. Now, **only while no parent or guardian holds an ACTIVE
guardianship**, the class teacher (LEAD first, CO if there is no LEAD, a
school admin if there is no class teacher at all) holds one instead — and
**the moment a real parent claims the child, the stand-in is revoked.** The
parent does not share; they replace. If the parent's guardianship is later
revoked, the stand-in comes back.

**A real row, not a special case.** The stand-in is an ordinary `Guardianship`
with `relation: "SCHOOL"`, because every guardian surface keys on that table
and a parallel mechanism would mean each of those pages growing a second code
path it would someday forget. The relation value is the boundary: the
reconciler tells family from fallback by it, and nothing school-flavoured ever
blocks or outlives a real parent. One holder at a time, chosen
deterministically — a consent given by whoever answers first out of three
stand-ins is not a decision anyone made.

**Reconcile, don't choreograph.** One idempotent function
(`standin-guardian.ts`) computes the right state from scratch, and every
lifecycle event calls it: a pupil joins by code, a pupil accepts an invite, a
parent claims — **and every staffing change**: assigning or unassigning a
class teacher re-syncs that class's unclaimed pupils (only them — the
family-claimed are filtered out before the loop, because a class of five
hundred should not pay for guaranteed no-ops), and moving a pupil between
classes re-syncs the pupil. A new class teacher takes the stand-ins over in
the same action; the last teacher leaving passes them to the admin fallback.
Both transitions are pinned through the REAL `assignTeacher`/`unassignTeacher`
calls, not by editing rows. **A teacher leaving the school entirely is covered
too**: suspending a staff membership walks what that person actually HOLDS —
class-teacher stand-ins and admin-fallback stand-ins alike, which their class
list alone would miss — and hands each pupil to the reconciler's next choice;
reinstating a teacher brings their classes' unclaimed pupils back from the
fallback. And when the operator removes a whole school, its stand-in
guardianships are revoked inside the same removal transaction, by the same
rule `recordDeparture` applies per pupil — the school's role as guardian ends
with the school, while every family's own link deliberately survives it. A pupil recorded as leaving drops the stand-in inside the same
departure transaction (a teacher is guardian of a pupil they teach, never of
an alumnus) while a REAL parent's guardianship deliberately survives it —
that link is what keeps the record reachable to the family afterwards.
`npm run guardians:backfill` (with `--dry`) walks the roll that predates the
feature; on this dev database it granted 55 stand-ins and left the 31
family-claimed pupils untouched, and a second run was 86 no-ops.

**The feature changed what three old tests could assume**, which is worth a
line because it is the feature working: `guardianships: { none: {} }` stopped
being satisfiable the day every unclaimed pupil gained a guardian, and "Tom is
staff, not a parent" stopped implying Tom holds no guardianship. Each test was
re-anchored on what it actually meant — no guardianship *from this parent*, or
a fresh account with none of any kind — with the claim under test unchanged.
Suite at 86 files / 1,476 tests, thirteen of them new; verified live with a minted
session: a teacher holding twenty stand-ins gets the full "Your children"
surface.

### The archive: what a closed year left behind, for every role

The school already kept everything — report cards, registers, marks, badges —
but it kept them on TODAY'S pages, which all open on now. `/archive` is those
same rows read through a different lens: pick a CLOSED academic year, see what
it left behind. Nothing writes, nothing is copied, and nothing is reachable
that the same person could not already reach — the year filter narrows, never
widens, and only closed years are listed at all, because an archive that
includes "now" is two pages disagreeing about the same rows.

**One route, five readers.** What changes by role is which slice of the year a
person may see, and that decision lives in `year-archive.ts` where each
function asserts it — not in five near-identical pages. A pupil sees their own
year: published report cards, days present of days marked, the badges the
year-close snapshotted (rendered as stored, in the language they were written
in), and their marked work with an average. A guardian sees the same for each
child through `assertGuardianAccess` — which, since standin-guardian.ts,
includes the school's stand-in. A teacher sees their classes with that year's
registers, assignments and cards counted (classes with nothing in the window
are dropped, so old years are not padded with today's classes). An admin or
principal sees the school's year in the numbers the office asks for first —
roll size, attendance percentage, cards published, leavers, badges archived,
exam series.

**A year is its date window.** Report cards and badges carry `academicYearId`
and match by it where set; everything else matches by falling inside
[startDate, endDate] in the school's own timezone, and rows written before
year-linkage existed fall back to the window too, so a schema improvement
orphans nothing. The year and child pickers are plain links — a year is a URL.

Nine tests pin the boundaries: the current year is never listed and never
servable, the window excludes the next year's register, the guardian path
works, and each role's function refuses everybody else. Verified live against
the production build with a throwaway closed year over the seeded data: the
pupil view counted 53 marked days, the admin view produced the roll and a 91%
attendance figure, and both walk fixtures were torn down after. Suite at 87
files / 1,485 tests.

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
  **It has a second dependant now:** `WEEK_DAYS` in `school-day.ts` is the
  timetable's Monday-to-Saturday grid and states in its own comment that the two
  change together. A school that teaches on Sunday, or closes on Saturday, gets
  a column it does not want and none it does — visibly rather than silently, but
  wrong all the same.
- ~~**Registration emails a confirmation link to a route that does not exist.**~~
  **Fixed**, along with the identical bug in the magic-link login. See the entry
  in the changelog above.
- ~~**`/record` throws on every signed-out visit, and the log fills up.**~~
  **Fixed.** See the changelog entry above.
- ~~**A booking with an expert cannot be cancelled by anybody.**~~ **Fixed.**
  See the changelog entry above.
- ~~**Any member of a school can read and post in a booking chat, including a
  pupil.**~~ **Fixed.** See the changelog entry above.
- Rebuilding over a running `next start` corrupts `.next` (see Gotchas).
- Outside a page render the tenant is resolved per query, which costs one session
  lookup and one membership check each. Correct everywhere, and measurably
  chattier in route handlers than it was when it was wrong. If it ever matters,
  the answer is a request-scoped memo that works outside React, not putting the
  push back.
- **`npm test` flakes roughly one run in six, in a different suite each time.**
  Seen in `transaction-atomicity`, `register-duty` and `mentoring`. Reproduced
  on BASELINE with the session's work stashed — 1 failure in 6 full runs with no
  new code present — so it is not any one feature's fault. The cause is the
  shape of the setup rather than any single test: vitest runs files in parallel
  against one dev database, and suites that were written before the
  make-your-own-fixtures rule still touch shared seed rows. Running a single
  file is reliable; it is the parallel full run that is not.
- **`quiz:import` will undo app-admin bank edits inside imported topics.** The
  importer reconciles each topic in `content/quiz/` by stem: same stem is
  overwritten from the file, a stem it does not know is deleted as an orphan.
  Questions the content team adds through `/appadmin/bank` are therefore only
  durable in topics the importer does not own. Convention holds today; the fix
  is an `authoredBy` column the importer skips.
- **A removed school has no restore button.** `removeSchool` is one-way by
  design (pressing again is refused with `root.schoolWasRemoved`); undoing a
  mistaken removal means clearing `removedAt` in `psql` — memberships stay
  ended either way, as they do for any leaver.
- **Bank auto-translation requires `ANTHROPIC_API_KEY`.** Unset, the dashboard
  says translation is off and questions save English-only; readers fall back
  field-by-field to English. Set it before handing the dashboard to a content
  team that writes for Hindi/Marathi readers.
- Realtime fan-out is single-process.
- Lighthouse has not been run — no Chrome driver in the build environment, so
  the spec's ≥90 mobile score is **unverified**.
- Deleting a record leaves its files on disk until the sweep runs. Unreachable
  the moment the record goes, so this is disk rather than disclosure. There is a
  cron recipe under Scripts; nothing in this repo installs it for you.
