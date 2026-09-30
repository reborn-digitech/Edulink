# Relay — handoff

Written 2026-09-28 at commit `ff57b2d`. This is the short map. The working rules a session must follow are in
[CLAUDE.md](CLAUDE.md), which Claude Code reads on its own. The long operator's manual is
[apps/web/README.md](apps/web/README.md); the decisions are in [docs/decisions](docs/decisions);
the audits are in [docs/data-audit](docs/data-audit) and [docs/security](docs/security).

## 1. What has been built

Relay (repository name EduLink; code identifiers stay `edulink`) is a school operations platform for
Indian schools, in English, Hindi and Marathi, with a web app and a phone app on one database and one
API. One school is one tenant. The roles are ADMIN (the office), PRINCIPAL (the head), TEACHER, STUDENT,
PARENT (a guardian, who belongs to no school and sees their children across schools), EXPERT (an outside
mentor), and two platform roles, the operator (superuser) and the app admin (content team).

What a school can do with it today, all verified end to end:

- **People and roll**: invitations, join codes, intake by spreadsheet, transfers between schools by
  the government PEN, guardians and stand-in guardians, suspensions, departures with a
  leaving certificate, the pupil's record that outlives the school, promotion and year close.
- **The day**: class registers with absence notices, staff self check-in and the staff register,
  timetable, substitutions for staff away, holidays and the school calendar, leave requests with cover.
- **Learning**: homework and marks with weighted categories, exams and report cards (rules per school,
  PDF with Devanagari), syllabus coverage, adaptive practice quizzes with badges, competitions with a
  cross-school leaderboard, an expert marketplace with consent.
- **Money**: fee heads, structures, demands, concessions, receipts, refunds, dues and defaulter lists,
  online payment through a gateway the school owns (decision 0003: the platform never holds money).
- **Communication**: bulletin and circulars with a reach report and reminders, remark threads, SMS and
  WhatsApp texts with fixed templates and a monthly cap, push notifications, weekly digests, a
  moderated cross-school community feed.
- **Compliance and papers**: UDISE+ student and teacher sheets, CBSE and Maharashtra board sheets,
  enrolment tables, certificates from templates with serials and a public check, health cards,
  incident log, a minors' data policy (decision 0002), retention sweeps, an append-only audit log.
- **Operations**: an operator console that can look inside a school (audited, the school is told),
  school onboarding, job health, backups, a go-live checklist.

## 2. Architecture

```
apps/web        Next.js 15 (app router). Pages, /api/v1, every business rule in src/lib.
apps/mobile     Expo (React Native). Screens per role in src/screens/<role>; talks only to /api/v1.
packages/contracts   zod schemas for every /api/v1 request and response. The phone parses with them.
packages/i18n        en / hi / mr dictionaries; every user-facing sentence is a key.
packages/api-client  The bearer-token fetch wrapper the phone uses.
packages/tokens      Design tokens shared by web and phone.
docs/api/openapi.json  Generated from the API catalog (npm run api:docs). 380 endpoints.
```

**Data.** Postgres, Prisma, 111 models, 28 handwritten migrations. Every school-owned table carries
`schoolId` and is behind row-level security. The policies are generated (`npm run rls:generate`) and
verified (`npm run rls:verify`); the app connects as `edulink_app`, which owns nothing and cannot
bypass RLS, and sets the tenant per query inside its own transaction (`$tenantTransaction`, never a
bare `$transaction`). Migrations and fixtures run through the owner connection (`npm run db:migrate`,
which also restores the grants). A bare `prisma migrate deploy` fails with "must be owner".

**API.** `src/lib/api-catalog/*.ts` is the truth: each entry names the method, path, roles allowed,
request and response schema, and a sample the sweep can call. The docs, the API sweep and the phone's
access-matrix gate are all derived from it. Sessions are opaque hashed tokens in a cookie on the web
and a bearer on the phone, re-checked against the live membership on every request, with an absolute
lifetime. A parent session carries no school.

**Jobs.** One registry in `src/lib/jobs.ts`, run by `npm run job -- <name>` from a crontab the app
prints (`npm run cron:show`). Twelve jobs: notifications tidy, retention sweep, admission offer expiry,
accounts tidy (expired invitations, who is a minor), weekly digest, scheduled departures, health
digest, file reclaim, fee reminders, fee reconciliation, circular delivery, text sending. Each writes a
JobRun row with a summary; the operator's page calls a job overdue by its own schedule.

**Transports.** Email, SMS, WhatsApp, push and the fee gateway each sit behind an env-selected
transport (`*_TRANSPORT`), with a devbox transport for development that writes to a dev mailbox and a
log. Real senders are Twilio and Razorpay; nothing here has been exercised against a live account.

**Files.** Uploads go to `STORAGE_DIR` behind upload tickets bound to the uploader, random names,
byte-sniffed types and signed short-lived download links.

**Deploy.** Fly.io (`fly.toml`, app `edulink-web`, region `bom`), Docker image from
`apps/web/Dockerfile`, a release step that runs migrations, managed Postgres and object storage
beside it. Runbooks for deploy, backup and restore, messaging, security and the mobile release are in
[docs/runbooks](docs/runbooks). The go-live checklist is [docs/go-live-checklist.md](docs/go-live-checklist.md).

## 3. How to run and verify

```bash
corepack enable && pnpm install
cd apps/web && cp .env.example .env && npm run vapid && npm run setup
pnpm dev                      # web on :3000
cd apps/mobile && npx expo start --web   # phone's web target on :8081, needs the web API
```

The verification chain a change is expected to pass, in order:

1. `npm run typecheck`, scripts tsc, `eslint .`
2. `npx vitest run` (2,398 tests in 196 files at this commit; two audit suites are gated behind `DATA_AUDIT=1`)
3. `npm run rls:verify` after any schema or policy change; `npm run api:docs` after any catalog or contract change
4. `npm run i18n -- --max 163` (the count of hardcoded English; a job name counts as a string)
5. Phone: `npm run battery` in `apps/mobile` (tsc, eslint, jest 1,023 tests with coverage and the gates, Maestro check)
6. `npm run sweep` (593 page loads by role) and `npm run api:sweep` (2,335 calls, every role against every door; run twice, the first warms the dev server). `--cross=school` and `--cross=person` are the tenant-isolation probes.
7. `npm run build` with the dev server stopped, then `rm -rf .next`
8. `npm run data:audit` when derived data or fixtures change (47 checks against the demo schools and ZZ Northgate)

Fixtures: `npm run zz:fixtures` builds ZZ Northgate and ZZ Southbank (every ZZ-prefixed thing is
disposable); `npm run demo:schools` builds Sunrise and Saraswati (roster in
[docs/demo-schools.md](docs/demo-schools.md)). Never run `db:seed` or `db:reset` against a database
with data you care about; the fixture scripts refuse any database that is not local.

## 4. Current state

- Every feature above is built and its verification is green on the local battery at `ff57b2d`.
- **CI has not run since 84cc987.** The reborn-digitech Actions runner is refused on billing. Every
  commit since has been verified locally only. `.github/workflows/battery.yml` is the CI definition;
  `I18N_FLOOR` there is 163.
- **Never exercised**: the phone on a real device (only the web target and jest); Microsoft SSO
  against a live tenant; any live Twilio or Razorpay account; the after-response magic-link send in a
  real request; the jobs through cron rather than by function.
- **Two remotes**, `reborn` (reborn-digitech/Edulink) and `origin` (ckulkarni03488/Edulink), kept
  identical; neither is a GitHub fork of the other.
- **Shared passwords** remain on thirteen local test accounts and on every `@demo.relay.test`
  account. Scramble them when demos end.
- **Untracked on purpose**: `pitch/`, `apps/web/.Rhistory`, `.claude/launch.json`.

Recent history, newest first: seven derived-value fixes (ff57b2d); sweep reads the fixture school's
calendar (c5a63c2); two Sunday-fragile tests (94ed3d6); nine audit fixes and the `accounts:tidy` job
(87dbb0c); the security assessment and its 41 findings fixed (84cc987); the audit's 21 derived-data
gaps (4e326b2); the audit's second pass (bf6cd00); the audit's top ten (0ee9580); the data-flow audit
(04dbe1b).

## 5. Open tasks

**Product decisions, from the security assessment** ([docs/security/assessment-2026-09-24.md](docs/security/assessment-2026-09-24.md)):

1. ~~Hold school-code joins and birthdate claims pending until staff or an existing guardian approves.~~ **Done 2026-09-29.** A code files a `JoinRequest` and a right student code and birthday a `GuardianClaim` (migration `20260929010000`, two tables of their own and not a PENDING membership, so nothing that reads the roll can count a request). A join by the school's code waits for the office, one by a class's code for a teacher of that class or the office (`decideJoin` in `src/lib/join-requests.ts`); a claim waits for the office or a guardian the child already has (`decideClaim` in `src/lib/guardian-claims.ts`). The asker reads their own request and nothing of the school; a claimant is told the school and never the child. The queues are `/joins` and `/parent/claims` on the web, one screen on the phone, `GET /api/v1/shared/joins` and the two `decide` endpoints. `POST /api/v1/join` and `POST /api/v1/community/link-child` now answer 202 with the request, not the new session: an older build of the phone app will show its success message and then find no school, so ship the app with the server. **Added 2026-09-29** (migration `20260929020000`, `src/lib/request-expiry.ts`): a decline may carry a sentence for the asker, kept out of the audit log; after a decline the same request cannot be made again for seven days; a request nobody decides in thirty days is out of every queue by its date and marked EXPIRED by the daily `accounts:tidy` job, which tells the asker. Decided 2026-09-29: the deciders are told in the app only, by the notification and the count on the queue's menu entry; no email. The ZZ fixtures keep one join and one claim waiting at Northgate (`buildWaiting`), which the API sweep renews and uses for the two decide endpoints.
2. ~~Take the student code off the printed leaving certificate, or rotate it on departure.~~ **Done 2026-09-28: off the paper.** The certificate's "Admission number" line carries the school's own register number from the pupil record (`SchoolRecord.admissionNumber`, migration `20260928010000`; the `studentCode` column is dropped). Intake refuses another school's student code, so a pupil arriving from elsewhere is brought over by PEN and date of birth only, and one without a PEN is admitted as new. A code a school gave its own former pupil still brings that pupil back. Still open: certificates already printed carry the old code, which now opens nothing at another school; a school with no register numbers entered prints a dash on that line.
3. ~~Put self-registered schools behind operator approval before the identity-linking features open.~~ **Done 2026-09-28.** The operator's console has an "Awaiting check" queue and each school's page an approve and a withdraw button (`setSchoolVerified` in `src/lib/superuser.ts`, `POST /api/v1/operator/schools/{schoolId}/verification`, the phone's operator screens); a school the operator adds by hand is marked at creation; the office's intake page tells an unmarked school what waits on the check. Still open: nothing tells the school when the mark is given or withdrawn, and the ten unmarked schools in the development database are fixtures nobody has approved.
4. ~~Decide legal versus preferred name on papers (papers print the legal name) and give the office a way to correct a legal name.~~ **Done 2026-09-29.** Papers print the legal name (`User.name`), the app greets by the preferred one. An admin corrects a legal name from the directory's row menu (`correctLegalName` in `src/lib/legal-name.ts`) with a reason from a coded list (`LEGAL_NAME_REASONS` in the contracts), audited as `user.legalname.set` with the old and new name; the person and a pupil's guardians are told. An issued certificate and a published report card carry the name they were printed with (`studentName` on both, migration `20260929040000`, which also gave every paper already out its name), so a correction changes new papers only: a wrong paper is revoked and issued again. Web only: the phone's directory has no row actions, this one included.
5. ~~Confirm the narrowed principal write scope (twelve settings doors are ADMIN only) and let someone set the principal's own subjects.~~ **Done 2026-09-29.** Confirmed: the twelve settings doors stay the admin's alone and the head reads them. The office sets the head's teaching subjects from the directory's row menu, as it does a teacher's (`setTeacherSubjects` in `src/lib/reviews.ts`, now ADMIN only in the library: it had admitted the head, who could have written anybody's subjects, their own included, though no page offered it).
6. ~~PKCE on the phone's SSO hand-off~~ **done 2026-09-29** (`claimAppExchange` in `src/lib/auth-tokens.ts`, `apps/mobile/src/lib/sso-handoff.ts`; the app now depends on `expo-crypto`, a native module, so this ships with a store build and not over the air). Verified app links are still open, before any store release: they need the production domain and the store accounts.
7. ~~Nonce-based CSP, `__Host-` cookie~~ **done 2026-09-29** (`src/lib/csp.ts`; the session cookie is `__Host-edulink_session` in production, so deploying it signs everybody out once). HSTS preload is a switch, `HSTS_PRELOAD=1`, left off: set it once the domain is fixed and every subdomain is on HTTPS.
8. ~~An approve action for held comments on the cross-school feed; the queue can only remove.~~ **Done 2026-09-28.** `moderateComment` in `src/lib/bulletin.ts` approves or removes a held comment (removing needs a reason the author is told); the "To review" tab lists the comments waiting on the reader and a held comment on a post carries the two buttons, on the web and the phone; `GET /api/v1/shared/bulletin/comments/held` and `POST /api/v1/shared/bulletin/comments/{commentId}/review`. An admin decides anything held at their school, a teacher the comments on their classes' posts. A removed comment is off the page for everybody, and a feed card counts approved comments only. Still open: nobody is notified when a comment is held, so the count on the tab is the only signal.
9. ~~Narrower row-level policies for experts, keyed on the booking rather than the school.~~ **Done 2026-09-29.** An expert’s tenant set is empty; what they reach is named in `scripts/gen-rls.ts` (`EXPERT_READABLE`, `EXPERT_WRITES`), each clause keyed on their own confirmed booking or active mentorship. Their notice to the school and the audit line are written by the server under the school’s binding (`asTheSchool`, `src/lib/expert-binding.ts`). A database that ran an earlier build of this change may hold two policies the generator no longer writes, `Notification_expert_insert` and `AuditLog_expert_insert`; no released build created them.

**Inputs nothing collects** ([docs/data-audit/README.md](docs/data-audit/README.md) §7): ~~a guardian's
phone entered by the office~~ (done 2026-09-29: `PupilRecord.guardianPhone`, the record's and not the
account's sign-in phone, written by the office or the family on the record form, web and phone; the filings
print a linked guardian's proved number first and this one when there is none; texts and WhatsApp still go
only to a number its owner proved, which is a decision still to take); ~~legal name correction~~; ~~the
principal's subjects~~; ~~coded lists for mother
tongue, nationality, PIN, designation and the academic year's name~~ (done 2026-09-29: `MOTHER_TONGUES`,
`NATIONALITIES`, `PIN_CODE` and `STAFF_APPOINTED_SUBJECTS` in the contracts; the record keeps a code or
refuses, a word typed before the lists may be sent back untouched and is a blank to a filing; the
designation stays a title and the subject appointed for is its own coded field; a year is named
`2026–27` at the calendar's door, `academicYearName`; still free text: the admitted-to grade, the
school's medium, the affiliation number, the staff number, timetable and profile subjects); ~~the staff
record and departures on the phone~~ (done 2026-09-29: the phone's directory row opens the person, a
member of staff's record or a pupil's health card, school record and leaving; five endpoints under
`/api/v1/admin/people/{membershipId}/`; the leaving's rule is `src/lib/leaving.ts`, shared with the web's
action; still web only: correcting a legal name, a date of birth, subjects, pausing and removing).

**Audit items** (README §2): 4 and 5 fixed; 36 by design; 42 fixed; 43 handled. The first-pass items 8–13,
18, 24, 26 and 29 were re-checked against the code on 2026-09-29: 11 was already fixed, and the other
nine were fixed that day (8 a card with no scale is given the one it was shown with before the rules
change; 9 a failed subject stops the grade-point mean; 10 an annual card is refused over half-set term
shares; 12 a save keeps the letter; 13 the archive's figure is marks over maximum; 18 a refund the gateway
fails is put back; 24 the certificate's class and school name are the paper's own; 26 a request whose
certificate was revoked says so; 29 the UDISE+ sheet files blanks for what nobody answered, with RTE and
repeating as the office's own answers). Open from them: the RTE cell's code 1 has not been checked against
the portal's validation sheet; a certificate's issuer and the school's address are still read live. The
columns no table holds are decided in docs/decisions/0002, "What the app deliberately does not hold".

**Housekeeping**: restore CI billing and rerun the battery there; scramble the shared passwords; run
the phone on a device; try Microsoft SSO against one real tenant; a live Twilio and Razorpay
end-to-end in staging.

## 6. Key decisions

- **One tenant fence, enforced by the database.** RLS on every school table, policies generated from
  the schema, the app role unable to bypass them. Handlers still bind the person, not only the school.
- **Money never touches the platform** (decision 0003). The gateway account is the school's; the
  platform records demands, allocations and receipts, and reconciles.
- **Gigs: work done for the platform, free first and then paid** (decision 0004, the owner's choices
  of 2026-09-30). Built so far: a teacher writes questions for the practice bank in English, Hindi
  and Marathi (`/teacher/contributions`), the content team adds them to the bank, returns or
  rejects them (`/appadmin/contributions`), and the operator holds the rate and the limits and
  records what the company paid by UPI (`/root/gigs`); `src/lib/gig-questions.ts`. ₹10 a question,
  only when it is added to the bank, the first 20 unpaid, 200 a month per teacher, inside a monthly
  budget; past a limit adding waits and nothing is added unpaid. The platform pays nobody: a
  payment is the operator's record of a transfer. Also built, the free tier of sessions
  (`src/lib/gig-sessions.ts`): an expert offers one-to-ones and workshops to every school's
  pupils and a teacher one-to-one guidance to their own school's once the office switches it on
  (`/expert/sessions`, `/teacher/guidance`), on the provider's own meeting link; a pupil has two
  free one-to-ones and two workshop seats a school year (`/sessions`), a pupil's own ask waits
  for a guardian, the link shows only while a seat is confirmed, and the office reads and may
  cancel every booking of its pupils (`/admin/sessions`). Not built: paying past the allowance
  and the gateway split, which wait on a lawyer's opinion and an accountant (see the decision).
  The phone has the family's, the provider's and the office's sessions on one route and a teacher's
  questions on two; the content team's review and the operator's page are on the web only. The hourly job `gigs:remind` tells a family and the provider of a session that starts
  within a day, once.
- **Minors' data policy** (decision 0002). No Aadhaar, ever. Free-text reasons stay out of audit rows,
  push bodies to minors are generic, retention is a schedule with dials, and every column a report
  reads is listed with who may enter it.
- **The record is the child's.** The pupil record, the PEN and the certificates outlive any school;
  a transfer is the new school inviting and the old school recording the departure, and the receiving
  school reads the leaving certificate only for a pupil on its roll today.
- **Derived values are recomputed, not trusted.** Stored copies (fee status, card totals, standings,
  grade level, minor flag) have a single writer each and an audit check that compares them with their
  sources. The audit suites are the regression net for this.
- **Coded where a filing wants a code.** Category, religion, holiday kinds, staff types and the like
  are fixed choice lists in `packages/contracts`; free text is refused with a sentence.
- **Every sentence in three languages.** Hindi ends sentences with the danda; Marathi with a full
  stop; "शाळा", never "स्कूल". The i18n test fails on English left in Hindi or Marathi unless the key is
  allow-listed with a reason.
- **The catalog is the truth for the API.** Docs, sweep expectations, the phone's access gate and the
  tests all derive from `src/lib/api-catalog`.
- **Verification is executed, never reasoned about.** Commit messages carry the real numbers and an
  "Untested:" line. Nothing is called production-ready.
- **Fixtures are disposable and prefixed.** ZZ schools and `@demo.relay.test` accounts are the only
  ones a test or script may create or destroy.
- **Who waits for a yes, and who does not** (confirmed by the owner, 2026-09-29). A school that
  registers itself waits for the operator; one the operator adds by hand is approved as it is made.
  A comment on the cross-school feed waits at its author's school, and an admin may release their own,
  since an admin may already publish a whole post there and a school with one admin would otherwise
  never be heard. A school's own student code still brings its own former pupil back at intake; only
  another school's code is refused. A join by code and a claim on a child wait for the office, the
  class's teacher or a guardian the child already has, and the deciders are told in the app, not by
  email.
- **A signature is its owner's to put** (decided by the owner, 2026-09-30). An admin and the head
  each keep one signature and the school one seal, as small PNGs kept in the row and never served
  by a link of their own (`src/lib/signatures.ts`, tables `SignatureImage` and `PaperSignature`,
  migration `20260930010000`). A template says who signs each of its two lines and whether the seal
  is printed. A signature is drawn at once on a paper its owner issues; on a paper somebody else
  issues it waits, the line printed bare, until its owner opens that paper and approves it. An
  issued paper keeps its own copy of each picture. A report card is signed A CLASS AT A TIME, as
  it is published (decided 2026-09-30): one row for the set, one approval by the head for every card
  of it, the set unsigned when it is taken back to drafts. A teacher keeps a signature too, for the
  report cards of the classes they teach, and signs no certificate. The parent's line is always
  bare, for a hand. A picture is fetched by a guarded address (`/api/v1/shared/signatures/{id}`,
  given only to a reader the paper lets in), not carried inside the paper's answer: a drawn signature
  is twenty kilobytes of data URL and broke the page's stream.
- **What the record holds for the UDISE+ sheet, and what it does not** (decided by the owner,
  2026-09-30: Aadhaar stays out, the other plain answers come in). The record gained the sheet's
  alternate mobile, free uniform, free textbooks, extracurricular activity, stream and the vocational
  course with its ids (migration `20260930030000`); still left blank for the office, each a decision
  of its own: AAY, scholarships and the NSP code, the CWSN facility and the SLD/ASD/ADHD screenings,
  the mainstreamed date, the teacher's national code. Decision 0002's table says which is which.
- **A typeface is chosen per document, and the keyboard is switched per person** (decided by the
  owner, 2026-09-30). Nine faces are bundled under `apps/web/public/fonts` (`src/lib/fonts.ts`), OFL
  all; a certificate template, the report card rules and a post carry a `font` key, "default" being
  the app's own stack, and the PDFs are set from the same files. The header's switch (EN, हिंदी,
  मराठी) turns English letters into Devanagari as a word ends, in every box of the app, by a strict
  table in the browser (`src/lib/transliterate.ts`): a long vowel is typed twice, nothing is
  guessed, nothing is sent anywhere. Kept on the device, not per box.
- **A certificate's two paragraphs carry a face each, and the face decides what is typed** (decided
  by the owner, 2026-09-30). The paper's face stays for the header, title, rows and lines;
  `introFont` and `outroFont` on the layout are "default" (the paper's) or a face of their own.
  A paragraph set in a Devanagari face is typed in Devanagari, Hindi or Marathi by the template's
  language, one set in a Latin face in English, whatever the header's switch says
  (`data-typing` on the box; `typingFor` in `src/lib/fonts.ts`); "same as the paper" follows the
  template's language. The page and the PDF set each paragraph in its face.
- **The pupil record is the office's to write** (decided by the owner, 2026-09-29). A guardian and
  the pupil read all of it and write none of it. They propose new values on the record's own form
  with a reason, a blank the office asked about included, and an admin or the head applies them or
  declines with a sentence (`src/lib/record-changes.ts`, table `RecordChangeRequest`, migration
  `20260929100000`). An ask may name any field but the PEN, which has its own correction, and the
  roll number and "repeating", which are the enrolment's. One waits per pupil; asking again replaces
  it. `POST /api/v1/family/record` is gone, so the phone app ships with the server. An admin or the
  head reaches a pupil's record from the pupil's page; the page itself shows none of its values.
  Confirmed by the owner on 2026-09-30, as built: one ask waits per pupil and a second replaces it;
  the office is told when an ask is made and not when it is rewritten; the guardians are always told
  the decision and the pupil only when the pupil asked; a pupil who has left cannot be asked about;
  and a checkbox inside its own label is a touch target by its label, so the 20-pixel box on the
  record page stays as it is.

## 7. Moving development to another machine

Everything that matters is in the repository except the items below. Do these once on the new Mac.

**Install.** Node 24 (`.nvmrc`; nvm, or Homebrew's keg-only `node@24` put on the PATH), `corepack enable` (pins pnpm 9.15), PostgreSQL 16 via Homebrew, `gh`.
No Docker, no Xcode needed for the web target of the phone app.
The move from Node 20 to Node 24 was made on 2026-09-30 (5636c43) and needed no change to the code; the
whole chain, the Playwright suite, the API sweep and the two cross probes were run on 24.21.0 that day
with the counts they had on 20.20.2.

**Clone from reborn-digitech**, which is the repository CI watches:

```bash
git clone https://github.com/reborn-digitech/Edulink.git && cd Edulink
```

If the encrypted migration branch is still on the remote (`git ls-remote origin migration-2026-09-28`),
fetch it and run `bash migration/restore.sh` instead of the manual steps below: it installs the tooling,
arranges both remotes and your git identity, deletes the branch from both remotes, and restores the old
Mac's database, files and Claude memory. Otherwise, set up by hand:

```bash
createdb edulink_dev
psql -d edulink_dev -c "CREATE ROLE edulink_app LOGIN PASSWORD '<choose one>';" \
                    -c "GRANT USAGE ON SCHEMA public TO edulink_app;" \
                    -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO edulink_app;"
pnpm install
cd apps/web && cp .env.example .env && npm run vapid      # paste both URLs and both keys into .env
npm run setup                                              # db push, grants, seed — the one time seeding is right
npm run zz:fixtures && npm run demo:schools && npm run quiz:import
```

The fresh database will carry the seeded schools, the ZZ fixtures and the two demo schools. Passwords
for the seeded and demo accounts are in `apps/web/README.md` ("Seeded accounts") and
`docs/demo-schools.md`; the thirteen local test accounts that share one password on the old Mac exist
only in that database and are not needed.

**Credentials and the two remotes.** `gh auth login` as the reborn-digitech account with scopes `repo`,
`workflow`, `read:org` (never `admin:org`); a second GitHub credential in the keychain for the origin
owner so `git push origin` works. A clone has one remote; every commit goes to both, so add the other:

```bash
git remote rename origin reborn                                          # the clone from reborn-digitech
git remote add origin https://github.com/ckulkarni03488/Edulink.git     # the second repository
git config --global user.name "Chinmay Kulkarni" && git config --global user.email "ckulkarni03488@ucumberlands.edu"
git push -q reborn master && git push -q origin master                   # the push, every time
```

**Not in git, copy by hand if wanted:** `pitch/` (the deck and logo, 1.6 MB, never committed on purpose);
`apps/web/storage/` (fixture uploads, regenerated by the fixture scripts, so optional); `apps/web/.env`
(recreate rather than copy, the VAPID keys are per installation).

**Claude desktop's own files**, all under the repo's `.claude/`, untracked:

- `.claude/settings.local.json` — three harmless Bash allow rules; it can start empty.
- `.claude/launch.json` — the dev servers the Browser pane starts. Recreate it with:

```json
{
  "version": "0.0.1",
  "configurations": [
    { "name": "edulink-dev", "runtimeExecutable": "corepack", "runtimeArgs": ["pnpm", "--filter", "@edulink/web", "dev"], "port": 3000, "autoPort": true },
    { "name": "edulink-prod", "runtimeExecutable": "corepack", "runtimeArgs": ["pnpm", "--filter", "@edulink/web", "start"], "port": 3000 },
    { "name": "edulink-mobile-web", "runtimeExecutable": "corepack", "runtimeArgs": ["pnpm", "--filter", "@edulink/mobile", "exec", "expo", "start", "--web", "--port", "8081"], "env": { "NODE_OPTIONS": "--max-old-space-size=8192", "EXPO_WEB_OUTPUT": "single" }, "port": 8081 },
    { "name": "edulink-mobile-static", "runtimeExecutable": "corepack", "runtimeArgs": ["pnpm", "--filter", "@edulink/mobile", "exec", "expo", "serve", "--port", "8081"], "port": 8081 }
  ]
}
```

**Claude's memory of this project.** The conventions a session must follow are now in `CLAUDE.md`,
which Claude Code reads automatically, so a new session starts with the rules. The finer-grained notes
(33 files: feature memories, gotchas, baseline numbers) live outside the repo at
`~/.claude/projects/-Users-chinmaykulkarni-Edulink/memory/` on the old Mac. To carry them over, copy that
folder to the same place on the new Mac; the folder name is the repo's absolute path with `/` turned into
`-`, so if the new user or path differs, rename the folder to match. Nothing in it is required — the repo,
the audits and this file cover the same ground — but it saves re-learning.

**First session on the new Mac**, in order: open the repo in Claude desktop, let it read CLAUDE.md and
HANDOFF.md, start `edulink-dev` from the Browser pane, hit `/api/health`, run `npm run sweep` once to
confirm the fixtures, then pick up from section 5.
