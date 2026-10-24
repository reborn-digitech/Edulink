# Layer 2 — unit tests (QA campaign of 24 October 2026)

Builder: layer 2 (unit). Run 24 October 2026, 09:30–10:25 IST, on master at `2cc9111d` with the working tree as the
other two builders left it. No account was used: every test calls the library or a route handler directly with
contexts and rows it makes itself (ZZ schools and `@test.invalid` people, removed by id after). The dev servers were
not touched; `/api/health` answered 200 before and after every full run.

## How it was measured

- **Web**: `npx vitest run` (vitest 3.2.7). The repository has no coverage provider, so `@vitest/coverage-v8@3.2.7`
  (the version matching vitest) was installed into the coordinator's scratchpad, not into the repository: neither
  `package.json` nor the lockfile changed. A scratch config spreads the project's own `vitest.config.ts` and adds v8
  coverage over `src/**/*.{ts,tsx}`; a symlink to the provider was placed in the ignored root `node_modules/@vitest/`
  for the run and removed at the end. "Lines" below are v8's line counts (statement-based).
- **Phone**: `npx jest --ci --coverage` in `apps/mobile`. The battery's own scope is `src/lib/**` (threshold 90 %);
  the campaign also collected `src/**` once to see the screens, which is why that one run "failed" its threshold.
- **Scripts**: the figure check and the sweep's mirror live in `scripts/`, outside `src`; measured with the same
  config pointed at `scripts/quiz-gen/**` and `scripts/sweep-features.ts`, over the six suites that import them.

## Coverage before and after

| | Before | After |
|---|---|---|
| Web suite | 440 files (438 passed, 2 skipped), 4,940 passed, 70 skipped, 469 s | 448 files (446 passed, 2 skipped), 5,026 passed, 70 skipped, 512 s |
| Web `src/lib/**` lines | 93.05 % (77,249 / 83,017, 521 files) | 93.50 % (77,620 / 83,017) |
| Web `src/**` lines (pages and components included) | 45.28 % (97,540 / 215,409) | 45.45 % (97,911 / 215,409) |
| Web `src/lib` modules under 80 % | 50 | 45 |
| Phone suite | 231 suites, 1,923 tests, all passed | 233 suites, 1,934 tests, all passed |
| Phone `src/lib/**` lines (battery scope) | 97.75 % (1,045 / 1,069) | 98.31 % (1,051 / 1,069), `npm run battery` exit 0 |
| Phone `src/**` lines | 89.49 % (14,231 / 15,902) | 89.57 % (14,244 / 15,902) |

The 70 skipped web tests are the two audit suites gated behind `DATA_AUDIT=1` (51 + 19). Pages (`src/app`, 15.3 %) and
components (15.6 %) are the page sweep's and the browser suites' to cover, not vitest's.

### The business logic the brief named

| Area | Module (lines before) | Direct test before | Done here |
|---|---|---|---|
| Fees ledger arithmetic | fees.ts 96.9 %, fees-reports.ts 100 % | tests/fees.test.ts, worked cases | **Added** invariants over 5,000 seeded cases (no coverage change: the lines were run, the properties were not held) |
| Attendance rules | attendance.ts 100 %, academics-attendance.ts 96.9 %, staff-attendance.ts 98.6 % | yes | none needed |
| Report-card bands | report-card-rules.ts 100 % | tests/report-card-rules.test.ts | none needed |
| Plan entitlement windows | person-plans.ts 96.3 % | tests/person-plans.test.ts, tests/passes.test.ts | none needed |
| Pass orders and refunds | pass-orders.ts 89.8 % → 96.4 % | happy paths only | **Added** the gateway-refused refund, order status, the late invoice |
| Seat pricing and free allowances | gig-sessions.ts 99.7 %, gig-payments.ts 93.6 % | tests/seats.test.ts, tests/gig-sessions.test.ts | none needed; the company gateway under them was the gap (below) |
| The figure check | scripts/quiz-gen/figures/check.ts 100 % | tests/quiz-figures.test.ts | none needed |
| The gate's role rules | role-gate.ts 100 % | tests/modules.test.ts and 25 others | none needed |
| Site enquiries retention | site-inbox.ts 98 %, site-enquiry.ts 94.3 % | tests/site-two.test.ts (`tidySiteEnquiries`) | none needed |
| Certificate serials | certificates.ts 93.8 % | TC register and appointment letters only | **Added** a burst of eight at once, prefixes, years, revoked numbers |
| Filings sheets | filings.ts 99.8 % | tests/records-gaps.test.ts, tests/security-fixes.test.ts | none needed |
| The sweep-features mirror | scripts/sweep-features.ts 83.9 % | tests/sweep-features.test.ts | none needed (the unhit lines are the database reads and the switch flips) |

## The ten gaps filled (new tests)

Chosen by risk: money, sign-in and who-reads-what first, then the phone.

| # | File | Tests | What it holds | Module lines before → after |
|---|---|---|---|---|
| 1 | `apps/web/tests/gateway-live-transport.test.ts` | 12 | The school's Razorpay transport over a stubbed `fetch` (host `.invalid`): the four allowed calls with the school's Basic auth and bodies; an id carrying `/`, `..` or `?` refused before any request; the gateway's description, a bare status, a non-JSON body and an unreachable host as `GatewayError` | gateway.ts 58.0 % → 100 % |
| 2 | `apps/web/tests/gig-gateway-live-transport.test.ts` | 20 | The company's account: devbox / razorpay / off by environment (a production build on a real origin is off); the secret opened from its seal and refused when missing, unsealed or sealed for another binding; a live key with no webhook secret checks nothing; the seat order's held transfer; passes and teachers' seats with no transfer; release, refund with and without `reverse_all`; the linked account's four calls; the checkout signature under the live secret | gig-gateway.ts 62.7 % → 99.1 % |
| 3 | `apps/web/tests/sso-callback.test.ts` | 9 | `completeSso`: no cookie, junk cookie, another provider's cookie, another state, no code → "state" with no request; the exchange's form body (verifier from the cookie); four exchange failures; nine bad tokens (nonce, audience, issuer look-alike, alg none, tampered, expired, no or non-string subject); keys fetched once; Microsoft's `common` issuer prefix. One `it.fails` marks U-2 | sso.ts 69.5 % → 89.8 % |
| 4 | `apps/web/tests/fees-arithmetic-properties.test.ts` | 7 | Seeded generator, 5,000 cases a property: a line's concession is a whole paisa in [0, gross]; the flat all-heads amount is taken once per instalment exactly as far as there is room; spreading never reduces a line's own concession; pro-rata within rounding; the two copies of "what is owed" (`toDemandRow`, `demandOutstanding`) agree | (properties, not lines) |
| 5 | `apps/web/tests/pass-orders-refusals.test.ts` | 6 | A refund the gateway refuses puts the order back to PAID and re-opens every entitlement, audits and tells nobody, and goes through once the gateway is back; `passOrderStatus` for payer, holder, stranger, operator; the invoice is the payer's; a capture made while the company's details were blank is invoiced once on first read (found U-1) | pass-orders.ts 89.8 % → 96.4 % |
| 6 | `apps/web/tests/college-money-reads.test.ts` | 15 | The student's and the guardian's ledger and scholarships at a college: an adult's guardian only while MONEY is granted (and not after revoking), a minor's always, a stranger 404, a school's child refused; the scheme's share on tuition, development and exam heads net of concessions, never cancelled or carried demands; the mess bill (boarders of the month, a zero-charge hostel skipped, a September leaver and a September expulsion not billed for October, due the 10th of the next month, December into January, once); the route fee (fixed priced routes only, riders to the due date, leavers not charged, once); a claim document spends the student's own ticket once; the reconciliation sheet's difference column; the ageing buckets. Two `it.fails` mark U-4 | college-fees.ts 67.6 % → 88.6 %; scholarships.ts 67.3 % → 92.2 % |
| 7 | `apps/web/tests/files-college-documents.test.ts` | 12 | `authorizeFileRead` for the college's documents: a scholarship paper (student, office, accounts, principal; not a classmate, the TPO, another college's office or accounts, the guardian); an offer letter (cell, the drive company's recruiter while the drive is live; not after it closes, not after the recruiter is removed, not another company's, an adult's guardian only with PLACEMENT, not with MONEY); an internship's report and declaration (supervisor, TPO, HOD, office, principal; not another faculty member, the IQAC or accounts desk); the IQAC's evidence, a research paper for its HOD, and a grievance's attachment kept from the IQAC desk and the HOD | files.ts 68.6 % → 76.5 % |
| 8 | `apps/web/tests/certificate-serials.test.ts` | 5 | Eight issued at once take 0001–0008 with none repeated; two templates on one prefix share a series, another prefix starts at 0001; a revoked paper keeps its number; a new year restarts under its own name; a teacher is refused and takes no number | (behaviour under load; lines were already run) |
| 9 | `apps/mobile/test/lib/deep-links-edges.test.tsx` | 4 | An SSO link with no code sends nothing and keeps the verifier; a refused exchange signs nobody in and spends the verifier; a two-step account goes to the code screen and no session is kept before the code; a tapped notification opens its mapped screen, and nothing for an unknown path, a non-string or a missing URL | deep-links.tsx 85 % → 100 % |
| 10 | `apps/mobile/test/screens/parent-home-consent.test.tsx` | 7 | The guardian's "Waiting for you" card (a child's competition entry awaiting consent) opens the competition on the web; no card while nothing waits; the work and message rows and their empty states; "not marked yet" and "—" rather than noughts; a left child's record by the child's account id | parent-home.tsx 70.8 % → 85.4 % |

Verified: each new web file run alone and in the full run 3 (above); `college-money-reads` and `pass-orders-refusals`
three and two times alone; eslint clean on all eight web files and `tests/setup.ts`; web tsc reported one error, in
`scripts/tmp-qa-layer1.ts` (layer 1's temporary script: `Cannot find module 'playwright'`), none in these files; phone
tsc and eslint clean; phone `npm run battery` exit 0. A check after the runs found no row left by the new suites
(schools, users, companies, pass orders, the login buckets: 0 each).

## Flaky suites (with the evidence)

**F-1 · tests/login-limits.test.ts — flaky by cross-process interference, now fixed in the harness.**
- Run 2 (plain, 09:39:58–09:47:33): 1 failed, `'98765 11001' and '+919876511001' share one bucket of ten` — the
  eleventh sign-in with the right password answered `ok: true` instead of `reason: "rate"`. The file ran
  09:43:02–09:43:04; this builder's own second vitest process (the scripts coverage run of six files) ran beside it
  and ended 09:43:06. No `[rate-limit] failing open` line in either log.
- Alone, three runs: 6/6 passed each time. Run 1 (with coverage): passed.
- Reproduced on purpose: login-limits run four times while a loop ran `tests/adulthood.test.ts` ten times in another
  process: one run failed (`the fifty-first failure from one address is refused…`), three passed.
- Cause: `tests/setup.ts` deletes every rate-limit row not prefixed `zz-test:` at the start of EVERY vitest process
  (and every file), so any second process on the same database — a single file run beside the full suite, another
  builder's battery, a second developer — wipes the buckets login-limits is counting.
- Fix (tests/setup.ts): the three buckets keyed on that suite's own test identities (`login:+919876511001`,
  `login:zzlimits.h4nd@edulink.local`, `login-addr:203.0.113.77`, and any containing `@zzloginlimits.test`) are kept
  out of the wipe, like `zz-test:`; the suite clears them itself before and after each test. After the fix, the same
  concurrent reproduction ran login-limits eight times beside sixteen other processes: 8/8 passed.
- Still exposed in principle: any other suite asserting a shared bucket's count (`login-global` moves, `claim:`,
  `heavy:` budgets) when a second process starts at that moment. None failed in three full runs. Running two vitest
  processes against one database remains unsafe; say so in the battery's notes rather than widen the exclusion
  blindly.

No other suite failed in the three full web runs (two with coverage, one plain) or the two phone runs.

## Tests found wrong

None asserted the wrong thing. One harness defect was fixed (F-1, `tests/setup.ts`, above), because it made a correct
suite fail for a reason outside the code. Three things near the tests are stale and were left, since changing them
is not this layer's:
- `src/lib/role-gate.ts` says "tests/role-gate.test.ts holds this list to the directory": no such file; the check is
  in `tests/modules.test.ts` ("names every top-level segment of app/(app) in APP_SEGMENTS").
- `src/lib/tenant-tx.ts` says "db.ts re-exports the bound version": db.ts sets the tenant itself and does not import
  it; `withTenantOn` is used only by `scripts/verify-rls-app.ts` (so its 0 % in vitest is expected; `rls:verify`
  covers it).
- `tests/api-v1-staff-attendance.test.ts` skips three tests with `it.skipIf(firstOfMonth)`: on the 1st of every
  month they report "skipped" and hold nothing. Pinning the clock in the suite would keep them.

## Findings

**U-1 · Unit · Low · Web · Passes: concurrent first reads of a late invoice fail**
1. As the developer, `npx vitest run tests/pass-orders-refusals.test.ts` (ZZ PassQ school, its teacher).
2. The teacher buys a month of the TEACHER pass while the company's GSTIN is blank (the capture writes no invoice).
3. The GSTIN is set; three reads of the invoice arrive together (`passInvoiceView` ×3, as a double tap on web and phone would).
- Expected: all three answer the one invoice. Actual: one answers; the others throw
  `Unique constraint failed on the fields: (passOrderId)` (a 500 at the door). The invoice is issued once and no
  number is lost (the test holds that), and a later read answers. Seen in every run (3 of 3).
- Fix: in `passInvoiceView`, take the series lock (`nextPassNumber`'s `FOR UPDATE` on GigSettings) before re-reading
  `invoiceId`, or catch P2002 on `passOrderId` and re-read. Also decide whether a late invoice should carry the
  payment's date and financial year rather than the day it is first read (today: the read's).
- Files: apps/web/src/lib/pass-orders.ts (`passInvoiceView` ~518–530, `nextPassNumber` 371–376, `writePassInvoice` 384–).

**U-2 · Unit · Low · Web · SSO: a provider's keys endpoint down is a 500, not "sign-in failed"**
1. `npx vitest run tests/sso-callback.test.ts` (no account; a made-up Microsoft client id, `fetch` stubbed).
2. The token endpoint answers a token; the keys endpoint answers 503.
- Expected: `completeSso` answers `{ ok: false, reason: "token" }` and the callback sends the person to `/login` with
  "failed". Actual: `fetchJwks` throws, `completeSso` does not catch it, and the route
  (`src/app/api/sso/[provider]/callback/route.ts`) would answer 500. Held by an `it.fails` test that turns red when fixed.
- Fix: wrap `verifyIdToken` in `completeSso` (or `fetchJwks`) in try/catch → `reason: "token"`, logged.
- Files: apps/web/src/lib/sso.ts (`fetchJwks` 205–213, `completeSso` 328–380).

**U-3 · Unit · Low · Web · Fees and sessions gateways: an empty 200 is a TypeError**
1. `npx vitest run tests/gateway-live-transport.test.ts`; the stubbed gateway answers 200 with an empty body.
- Expected: a `GatewayError` the caller already handles. Actual: `call` returns `null` and `createOrder` throws a
  bare `TypeError` (reading `id` of null). The order is never recorded with no id (the test holds that).
- Fix: in both adapters' `call`, refuse a 2xx whose body is not a JSON object with a GatewayError / GigGatewayError.
- Files: apps/web/src/lib/gateway.ts 76–87; apps/web/src/lib/gig-gateway.ts (`call`).

**U-4 · Unit · Medium · Web · College accounts: the mess bill and the route fee bill twice across languages**
1. `npx vitest run tests/college-money-reads.test.ts` (ZZ CMoney College, its ACCOUNTS member).
2. The accounts member, in English, bills the mess for 2026-10: one boarder billed.
3. The same member (or a colleague) with Hindi as their language bills 2026-10 again.
- Expected: `{ billed: 0, already: 1 }`. Actual: `{ billed: 1, already: 0 }` — the boarder now owes the month twice.
  The route fee does the same in Marathi. Cause: "raised once" (`raiseOnce`) matches on the demand's label, and the
  label is translated into the presser's language by `getT()`. Held by two `it.fails` tests.
- Fix: decide "once" on something language-free (a key column such as `MESS:2026-10:<hostelId>` /
  `ROUTE:<routeId>:<term>`, or the head plus the month), and write the label in the institution's own language.
- Files: apps/web/src/lib/college-fees.ts (`raiseOnce`, `billMess`, `raiseRouteFees`, ~360–424).

**U-5 · Unit · Low · Web · Scholarships: the reconciliation sheet's order has no tie-break**
- Two claims made in the same millisecond came out in either order across runs (the sheet orders by `createdAt`
  only, a client-side millisecond timestamp). The serial column then numbers them differently between downloads.
- Fix: `orderBy: [{ createdAt: "asc" }, { id: "asc" }]`. File: apps/web/src/lib/scholarships.ts (`reconciliationSheet`).

**U-6 · Unit · Low · Web · Stale code and comments met on the way** (no behaviour wrong)
- `effectiveMessageCap` (src/lib/plans.ts) is exported, documented as "read by messaging.ts before every text", and
  called by nothing; messaging.ts and subscriptions.ts each repeat the rule (`plan?.messageCap ?? msgMonthlyCap`).
  One writer, one reader would be the repository's own rule.
- `src/lib/gig-gateway-env.ts`'s header describes the company-collects adapter of "three calls" and "no Route and no
  linked accounts"; `gig-gateway.ts` makes eleven, with Route.
- The role-gate and tenant-tx comments listed under "Tests found wrong".

**U-7 · Unit · Low · Mobile · A single phone test file does not exit**
- `npx jest --ci <one file>` prints "Jest did not exit one second after the test run has completed" and waits;
  the whole suite and `npm run battery` finish (36 s). Running one file needs `--forceExit` (the open handle was not traced;
  `--detectOpenHandles` would name it). Files: apps/mobile/test/screens/family-helpers.tsx.

Observation, not a finding: `schemeOpenTo` (scholarships.ts) treats a student with no income on record as within
every income ceiling, so the student's list shows income-capped schemes open; `createClaim` uses the same rule. If
"unknown" should read as "ask the office", that is a product decision.

## Gaps left (largest first)

- Web `src/lib` still under 80 %: academics.ts 68 % (the setup CRUD: departments, programmes, schemes, courses,
  terms, rooms, timetable slots), iqac.ts 77 %, college-campus.ts 25 %, exam-cell.ts 77 % and exam-cell-after.ts 78 %,
  the PDFs (exam-cell-pdf 48 %, placement-pdf 23 %, asset-tag-pdf 0 %), placement-alumni 54 %, placement-recruiter
  70 %, placement-projects 34 %, translate.ts 17 %, decision-log 80 %, safety.ts 77 % (the report target previews),
  global-feed 77 %, accounts.ts 72 % (the auditor's sheets), files.ts 76 % (condonation, course-file, studio and
  offering-handout branches still unhit), quiz-jobs 78 %, eval-jobs 77 %; 45 modules in all
  (scratchpad `unit/cov-web-after.txt` has the list).
- `scripts/quiz-gen` pipeline, model, select and job at 0–15 %: the generation run is exercised by
  tests/quiz-jobs.test.ts through the job's doors, not the pipeline itself.
- Phone screens under 80 %: 17, among them staff/office-college 75 %, academics/hod 72 %, academics/faculty 74 %,
  placement/talks 78 %, family/incidents 79 %, college-office/structures 73 %; `src/app` route files 15 % (thin
  expo-router wrappers).
- Never exercised by a unit test, by nature: a real Razorpay account (both gateways), a real SSO provider, a real
  device. The two gateway suites prove what would be sent, not that Razorpay accepts it.

Untested: the API sweep and the page sweep (not this layer's; never run by default); `npm run build`; the full web
eslint and `rls:verify` (no schema or policy changed); the new tests on CI (CI is refused on billing).
