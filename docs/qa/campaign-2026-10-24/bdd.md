# Layer 3: BDD (QA campaign of 24 October 2026)

Builder: layer 3. Written 24 October 2026 against the dev server on :3000 (Next dev, `/api/health` 200 before and after every run) and the dev database as layer 1 had left it that morning. Nothing was committed, pushed or stashed. The dev servers were neither started nor stopped. No platform feature or plan was switched. No account was created. Nobody signed in with a password.

## What was built

**27 feature files with 225 scenarios**, under `apps/web/features/<area>/`. Each feature has a happy path (`@happy`), an alternative path (`@alternative`) and a negative path (`@negative`). Each feature is also tagged `@web` and/or `@mobile`, and `@needs-server` where it calls the API. A scenario the code cannot satisfy is tagged `@missing`. It stays in its file, with the reason in a comment above it.

| Area | File | Scenarios (happy / alt / neg) |
|---|---|---|
| Sign-in and roles | auth/sign-in-and-roles.feature | 12 (3 / 2 / 7) |
| Attendance | attendance/registers.feature | 10 (2 / 3 / 5) |
| Fees and the ledger | fees/fees-and-ledger.feature | 11 (3 / 3 / 5) |
| Circulars and the feed | circulars/circulars-and-feed.feature | 11 (3 / 3 / 4, 1 missing) |
| Certificates | certificates/certificates.feature | 8 (2 / 2 / 4) |
| Report cards | report-cards/report-cards.feature | 7 (2 / 2 / 3) |
| Admissions and the record | admissions/admissions-and-record.feature | 8 (3 / 1 / 4) |
| Transport | transport/transport.feature | 9 (3 / 1 / 5) |
| Library | library/library.feature | 9 (3 / 2 / 4) |
| Hostel | hostel/hostel.feature | 8 (3 / 1 / 4) |
| Inventory | inventory/inventory.feature | 8 (2 / 2 / 4) |
| Payroll | payroll/payroll.feature | 7 (2 / 2 / 3) |
| Exam cell | college/exam-cell.feature | 8 (3 / 1 / 4) |
| Placements | college/placements.feature | 8 (3 / 2 / 3) |
| IQAC | college/iqac.feature | 8 (2 / 2 / 4) |
| Academics | college/academics.feature | 9 (3 / 2 / 3, 1 missing) |
| Clinical desk | college/clinical.feature | 8 (3 / 1 / 3, 1 missing) |
| Studio desk | college/studio.feature | 6 (2 / 1 / 3) |
| Website builder and domains | website/website-and-domains.feature | 10 (3 / 2 / 4, 1 missing) |
| Plans and passes | plans/plans-and-passes.feature | 8 (2 / 3 / 3) |
| Sessions and seats | sessions/sessions-and-seats.feature | 7 (2 / 2 / 3) |
| Vidura's three modes | vidura/vidura-modes.feature | 9 (4 / 1 / 3, 1 missing) |
| The expert application | experts/expert-application.feature | 8 (2 / 2 / 4) |
| The operator's features and desks | operator/operator-desks.feature | 10 (3 / 3 / 4) |
| Facebook and Instagram posting (mocked) | social/facebook-posting.feature | 8 (2 / 1 / 4, 1 missing) |
| The phone's offline queue (the phone's library) | offline/outbox-policy.feature | 6 (1 / 2 / 3) |
| A register replayed from the queue (phone and server) | offline/register-replay.feature | 4 (1 / 1 / 2) |

**The runner.** `npm run bdd` in `apps/web` runs `@cucumber/cucumber` 11.3.0. It was added as a dev dependency through `corepack pnpm add -D`. The config is `features/cucumber.json`, and step definitions are TypeScript under tsx with the scripts tsconfig. A subset runs with `npm run bdd -- features/fees`, and `npm run bdd -- --tags "@mobile and not @missing"` picks scenarios by tag. The step definitions in `apps/web/features/steps/` are as follows:

- **`actors.ts`: who a scenario is.** It uses the repository's own harness, `npm run zz:token -- --tag=qa-bdd ROLE [email]`. It mints one bearer session per role and person for the whole run. It refuses any email outside `@zz.test` and `@demo.relay.test`. At the end it purges exactly what it minted (`--purge --tag=qa-bdd`).
- **`world.ts`: the requests.** Each one goes to `/api/v1` on :3000 with the bearer token (the phone's door), never through a browser. `{{name}}` fills in values the scenario remembered. `{{today}}` is IST's date.
- **`http.steps.ts`: the verbs.** Sign in or out. GET, POST, PUT or DELETE with a JSON body. Add a header to the next request. Remember a field, or the first item of a list that matches. A premise that is not met skips the scenario for its environment, with the reason: "the platform feature X is on/off", read as the operator, and "the environment provides …".
- **`assert.steps.ts`: the checks.**
  - The status and the error code.
  - **The catalog contract.** The answer must parse with the `response` schema of the matching door in `src/lib/api-catalog`, the same truth the docs, the sweep and the phone's access gate use.
  - Field values, list sizes, and per-item checks (every, some, no item).
  - Arithmetic: a minus b, sums over a list, counts of matching items, rounded and weighted means, a percentage, and a difference to N decimal places.
  - Date order.
  - The content type.
- **Domain rules too specific for a generic step:**
  - `college.steps.ts`: the 75 % rule, and what each logbook state carries.
  - `payroll.steps.ts`: the PF return's arithmetic.
  - `plans.steps.ts`: price plus GST.
  - `social.steps.ts`: finding the post that has social copies.
  - `phone-source.steps.ts`: whether a phone screen calls a door. Used only by the `@missing @mobile` scenarios.
- **`outbox.steps.ts`: the phone's offline queue.** It drives the phone's own library, `apps/mobile/src/lib/outbox.ts`, with its in-memory store, against a network the scenario describes. With "the outbox flushes to the dev server", each queued row goes to :3000 with the bearer and the runner's replay headers (`X-Edulink-Replay`, `X-Edulink-Owner`), so the phone's half and the server's half meet.
- **`hooks.ts`: the run's edges.**
  - It refuses to run if `/api/health` is not 200.
  - It skips `@missing` scenarios.
  - It tallies passed, failed, missing and skipped-for-environment.
  - At the end it purges the run's sessions and checks health again.

## The counts (pasted from the last full run)

```
BDD tally (QA campaign layer 3)
  passed 198 · failed 5 · missing 6 · skipped for the environment 16 · undefined 0 · other 0
  failed:
    - certificates/certificates.feature — The office's list holds issued and revoked papers, each revoked after it was issued
    - circulars/circulars-and-feed.feature — The reach report counts the guardian who acknowledged
    - payroll/payroll.feature — The PF return of a locked month adds up line by line
    - social/facebook-posting.feature — A post's copies say where each went: a link for the sent one, the reason for the failed one
    - website/website-and-domains.feature — A name that is not a domain is refused as invalid input
  skipped for the environment: (16; 12 of them because ASSISTANT or EXPERT_SESSIONS is off on the dev database, and
    4 needing what this machine does not have: an account-minting run, a proven Razorpay Route account, a configured
    Meta app, a custom domain whose DNS is verified)
  sessions: purged 27 (minted under tag "qa-bdd"; --all for every zz-token session)
  /api/health after the run: 200
225 scenarios (5 failed, 22 skipped, 198 passed)
1263 steps (5 failed, 94 skipped, 1164 passed)
2m25.215s (executing steps: 2m24.071s)
```

Cucumber's "22 skipped" is the 6 `@missing` scenarios plus the 16 skipped for their environment. The exit code is 1, because of the five failures. Those five are real findings (below), not harness errors: each one was traced to the code or the fixture.

**Verified:**
- `npx eslint features`: clean.
- Web `tsc` (8 GB heap, `tsconfig.json`): no error in `features/`. The only error in the tree is `scripts/tmp-qa-layer1.ts(14,40): Cannot find module 'playwright'`, which is layer 1's temporary file, not mine.
- Scripts `tsc`: the same single error.
- `cucumber-js --dry-run`: 225 scenarios and 1263 steps, none undefined or ambiguous.

## Findings

### BDD-1: The PF return (ECR) splits the employer's share with ₹1 too much on every line
- Type BDD · Severity Medium · Platform Web (the export door; the office downloads it) · Feature: payroll, statutory exports
- **Steps** (ZZ admin `zz.admin@zz.test`, minted session):
  1. `GET /api/v1/admin/payroll/runs/2026-08/export/pf-ecr`.
  2. Read `content`.
- **Expected:** for EPF wages of ₹15,000, the employee's share is ₹1800, EPS is ₹1250 and the EPF-EPS difference is ₹550. The two employer columns add up to the employer's 12 %, ₹1800. The return's `totalPaise` equals what its lines remit.
- **Actual:** all three lines read `…#~#1800#~#1250#~#551#~#0#~#0`, so the employer columns add up to ₹1801. `totalPaise` is 1,080,000, which is ₹10,800, but the lines add up to ₹10,803.
- **Cause:** `src/lib/payroll.ts:653-657`. `eps` is 124,950 paise and `diff = er.paise - eps` is 55,050 paise. Each one is then rounded on its own by `rupees()` (`Math.round`, :610), so 1249.5 becomes 1250 and 550.5 becomes 551.
- **Suggested fix:** round EPS first, then take the difference in rupees: `const epsR = rupees(eps); const diffR = rupees(er.paise) - epsR;`. Add a unit test on a ₹15,000 wage. EPFO's upload checks that the difference equals EE − EPS.
- Files: `src/lib/payroll.ts`, `src/lib/payroll-rules.ts:147`.

### BDD-2: A name that is not a domain is answered 403 FORBIDDEN, not a validation refusal
- Type BDD · Severity Low · Platform Both (the phone reads the same door) · Feature: website domains
- **Steps** (ZZ admin, minted): `POST /api/v1/admin/site/domain` with `{ "domain": "localhost" }`.
- **Expected:** 422, as for any other refused input. The catalog's `emptyBodyStatus` for the door is 422.
- **Actual:** `403 {"error":"That is not a domain name. A domain looks like www.yourschool.in.","code":"FORBIDDEN"}`. A client that reads 403 as "not allowed" shows the wrong message.
- **Cause:** `src/lib/site-domains.ts:221` throws `AccessError(checked.key)` with the default code FORBIDDEN. "Taken" at :231 and :240 is a 403 too, where 409 would say what happened.
- **Suggested fix:** answer the domain check as 422 (`apiInvalid` or a coded refusal) and "taken" as 409.
- Files: `src/lib/site-domains.ts`, `src/app/api/v1/admin/site/domain/route.ts`.

### BDD-3: The fixture circular's reach report counts nobody, although a guardian acknowledged it
- Type BDD · Severity Low (fixture; it blinds every walk and sweep of the reach report) · Platform Both · Feature: circulars
- **Steps:**
  1. As the ZZ parent `zz.parent01`, `GET /api/v1/shared/bulletin/<the "ZZ Annual day" circular>`. It answers `acked: true, ackCount: 1`.
  2. As the ZZ admin, `GET …/reach`.
- **Expected:** the report has every state to show, which is what the fixture's own docstring promises (`scripts/zz-fixtures.ts` `buildCircular`). The acknowledged guardian counts.
- **Actual:** `totals: {total: 0, told: 0, seen: 0, acked: 0}` in every class. `deliveredAt` (2026-10-03 00:28) is a day before the post's `publishedAt` (2026-10-04 00:27). Only 1 of ZZ Northgate's 49 enrolments predates `deliveredAt`.
- **Cause:** `circularReach` counts the roster as it stood at delivery (`familyGroups`, `src/lib/circulars.ts:48-53`), which is correct for real data. The fixture, however, sets `deliveredAt = now − 1 day + 1 min` on a post created now (zz-fixtures.ts:1193), after its enrolments. Nothing refuses a delivery time earlier than the post itself.
- **Suggested fix:** in `buildCircular`, give the post a `createdAt` before `deliveredAt`, and both after the fixture's enrolments. Also update the existing row, since the block only creates the post once. Optionally add a `data:audit` check that `deliveredAt ≥ createdAt`.
- Files: `apps/web/scripts/zz-fixtures.ts` (buildCircular), `src/lib/circulars.ts`.

### BDD-4: Two fixture timestamps run backwards (revoked before issued, sent before created)
- Type BDD · Severity Low (fixture) · Platform Both · Feature: certificates; social posting
- **Steps** (ZZ admin, minted):
  1. `GET /api/v1/office/certificates`. Serial `BC/2026–27/0002` (Bhavna Bhatt) reads `issuedAt …20.711Z`, `revokedAt …20.710Z`.
  2. `GET /api/v1/admin/social/posts?postId=<the alumni post>`. The SENT copy reads `createdAt …43.002Z`, `sentAt …43.001Z`.
- **Expected:** a revocation no earlier than its issue, and a send no earlier than its creation.
- **Actual:** each is 1 ms earlier.
- **Cause:** the fixture evaluates `new Date()` for one column before the database default sets the other (`scripts/zz-fixtures.ts:1558`, `:2764`).
- **Suggested fix:** take one `now` and set both columns from it (revoked = issued + some minutes). A `data:audit` check would catch the class of error.
- Files: `apps/web/scripts/zz-fixtures.ts`.

### Gaps the writing exposed (decisions or notes for the owner; no scenario fails on them)
- **G-1 `batchYear` on the student's placement page is the college's season, not the student's batch.** `studentPlacementSchema.batchYear` is `settings.seasonBatchYear` (2027), while `record.batchYear` is the student's own (2030 for `zz.cstudent01`). The scenario now asserts the season. Renaming the field to `seasonBatchYear` would stop the next reader taking it for the student's. Files: `src/lib/placement-student.ts:72`, `packages/contracts/src/v1/placement.ts:593`.
- **G-2 The 75 % rule passes vacuously.** Every eligibility row at ZZ Vidya reads `percent: null, eligible: true`: no lecture has been counted, and a student with no attendance counted is eligible. That is a decision to state or change (`GET /api/v1/academics/eligibility`).
- **G-3 A student with no placement record is eligible.** ZZ Prachi Shinde has a null CGPA and no record, and is eligible for drive czzpldrive00000000002, whose rule is "no live backlogs": a missing record passes as "no backlogs".
- **G-4 A guardian's context switch ignores a foreign school silently.** `POST /api/v1/me/context` as PARENT with a foreign `schoolId` answers 200 with no school chosen. This is by design (session.ts), but the client is not told its ask was dropped.
- **G-5 HANDOFF.md section 5 lists as open three things the code now does:**
  - A held comment tells its reviewers: `tellOfHeldComment`, `src/lib/bulletin.ts`.
  - The school is told when the operator gives or withdraws the check: `src/lib/superuser.ts:886`.
  - A legal name has an API door, `POST /api/v1/admin/people/{membershipId}/legal-name`, and a phone screen, `screens/staff/person.tsx`.

  The handoff should be refreshed before the report quotes it.
- **G-6 Writes are mostly not exercised.** The runner sticks to reads, refusals and idempotent no-ops so that the shared dev database stays as layer 1 left it. Issuing a book, publishing cards, admitting, payments and payroll runs are the E2E layer's to drive.

### `@missing` (6; each one's reason is the comment above it in the file)
1. The nursing council's (INC) return from the clinical rows. docs/college.md, "Not built, per stream": the NMC, DCI and INC returns are not built. `college/clinical.feature`.
2. An agriculture college's field work on the farm, and the ICAR return. They are listed as a stream and not built. `college/academics.feature`.
3. The office composing a permission slip on the phone. Only `screens/family/post-detail.tsx` knows `consentQuestion`, and docs/college.md says it is not built. `circulars/circulars-and-feed.feature`.
4. The office following a post's Facebook and Instagram copies on the phone. No phone screen calls `/api/v1/admin/social`, and the catalog says so. `social/facebook-posting.feature`.
5. Publishing the website (or editing it, or connecting a domain) from the phone. `screens/staff/website.tsx` reads the summary only. `website/website-and-domains.feature`.
6. Vidura answering from a hosted model when the local servers are down. Phase E of docs/plans/assistant.md is not built. `vidura/vidura-modes.feature`.

## What the runs wrote to the dev database
- Sessions:
  - Bearer sessions under tag `qa-bdd`, purged by each run's AfterAll (27 in the last run).
  - Exploration sessions under `qa-bdd-probe`, purged: `purged 24`.
  - Afterwards, three zz-token sessions remain in the database, and they are not this layer's.
- One `AttendanceRecord` at ZZ Northgate:
  - PRESENT, client id `zz-bdd-replay-0001`, `markedAt` 2020-01-08T04:00Z, for the first pupil on ZZ Grade 3 · A's roster, with its register for 2020-01-08 (the API sweep's own register day, `SWEEP_REGISTER_DAY`).
  - It is left in place on purpose: it makes every later run of `register-replay.feature` a replay.
  - A late ABSENT with an older `markedAt` was sent and lost to it, as designed. The future-day mark was refused with 422.
- Two idempotent no-ops:
  - `POST …/trips/czztransporttripendednorthg1/end` on the ended trip answers it as it stands.
  - The PARENT's minted session's context switch (purged with the session).
- `POST /api/v1/public/expert-applications` without the declaration answered 422. No `ExpertApplication` row was made (checked: 0 rows for `zz.bdd%`).

## Paths touched
- `apps/web/features/**`: new. 27 `.feature` files, `cucumber.json`, and `steps/*.ts`: world, actors, catalog, hooks, json-path, http, assert, college, payroll, plans, social, outbox, phone-source.
- `apps/web/package.json`: the `bdd` script and the `@cucumber/cucumber` 11.3.0 dev dependency. The `demo:accounts` line in the same diff is layer 1's.
- `pnpm-lock.yaml`: the dependency's lock entries.
- `docs/qa/campaign-2026-10-24/bdd.md`: this report.
- `apps/web/.zz-token/qa-bdd.hashes` and `qa-bdd-probe.hashes`: the harness's own purge files (gitignored), emptied by the purges.

## Untested
- The 16 environment-gated scenarios: Vidura's modes and answers, sessions and seats with the features on, the plan card (402), paid seats, approving an application, the Meta send, a verified domain. To run them, an operator switches the feature on (and back off) for the run. The model servers, Route, Meta and DNS need the coordinator or the owner.
- The runner in CI. CI is refused on billing.
- Running with cucumber's `--parallel`. The runner is sequential by design so that :3000 is not crowded.
- The `@missing` scenarios' steps themselves. They are skipped, so a typo in one would show only when its tag is taken off.
- `npx vitest run`, the phone battery and the sweeps. Not run by this layer: nothing under `src/`, `tests/` or `apps/mobile` changed. The offline feature imports `apps/mobile/src/lib/outbox.ts` without changing it.
- `i18n`: no user-facing sentence was added.
