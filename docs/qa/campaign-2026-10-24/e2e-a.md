# Layer 5A — end to end, the school side (24 October 2026)

Builder A of layer 5 ([plan.md](plan.md); brief: the coordinator's `briefs/qa/e2e.md`, part A). Thirteen school journeys, each start to finish with a happy path and at least one realistic failure, concurrency where it matters, and a data-consistency check after each. Run 24 October 2026, 11:05–12:00 IST, on master at `bc8de06b`, against the running dev server (:3000) and the phone's web target (:8081), while layer 4 walked the same servers.

## How it was run

- **Accounts.** Demo accounts through the login door (`POST /api/v1/auth/login` with the shared demo password, read from docs/demo-schools.md at run time and never written down; device `qa-e2e-a`; every session signed out at the end of its script, the 85 revoked rows then deleted). One ZZ account, `zz.admin@zz.test`, by `npm run zz:token -- ADMIN zz.admin@zz.test --tag=qa-e2e-a`, purged after (`purged 1`). No password was typed into any form; no account was created through the UI.
- **School.** Sunrise Public School (`sunrise.*`), except J13 (ZZ Northgate, whose fixture holds the only Facebook Page connection). Sunrise had no transport route, no library catalogue, no hostel and a never-published website draft: J7–J9 and J11 built what they needed through the office's own doors, named "ZZ QA …", and removed it afterwards.
- **Browser.** Web pages through the Playwright harness's own contexts (`e2e/actors.ts` `contextFor`, the session token as the cookie, the event stream refused as the harness does); the phone through its web target at 390×844 with the token in `localStorage`. The harness's `global-setup.ts` was **not** run, because it deletes every `userAgent "e2e"` session and layer 4 was using the harness. Never the desktop app's Browser pane.
- **Scripts.** Temporary scripts `apps/web/scripts/tmp-qa-e2ea-*.ts` (a shared library, one per journey, a cleanup), deleted after the run; copies and every step's log (JSON lines, status and body) are in the coordinator's scratchpad under `e2e-a/` (`scripts/`, `logs/`, `shots/` with 35 screenshots).
- **Features.** No platform feature was switched. The admission enquiry door is open with JOB_BOARD off (`featureInHandler`), and the dev server has no Meta app, so J13's send ran in-process with Meta faked (below). TEXTS stays off, which is why every text in J2/J3 is `SKIPPED feature-off`.
- **Server.** `/api/health` 200 before and after every journey. The dev server answered in 0.4–14 s a call while layer 4 walked it; J1's 87 register posts took 800 s.

## Journeys

| # | Journey | Happy path | Realistic failure(s) | Concurrency | Result |
|---|---|---|---|---|---|
| J1 | A term's attendance by a teacher; the guardian's view | sunrise.teacher1 took Grade 5 · A's 87 missing registers of Term 1 (2026-06-01 → today, by the school's week and closing holidays): 696 marks, 0 failures; guardian (sunrise.parent01) read June–October, web and phone | future day 422; another class's teacher 403; a pupil of another class 422 with no register left; exact replay `applied 0, skipped 8` | teacher ABSENT and office PRESENT for one pupil at once (office 1 ms later): one register, one record, the later mark kept, the stale one `skipped` | **Pass** |
| J2 | A fee demand, a counter payment, the receipt, the ledger | ₹5,000 cash against Advait's Term 2 (₹12,500): 201, `RCPT/2026–27/000013`; same clientId again → the same receipt, `already: true`; office and guardian read one frozen receipt; web and phone fees pages | ₹20,000 against ₹7,500 → 403 "more than is due"; another child's guardian reading the receipt → 404 | office enters the last ₹7,500 from two devices at once → one 201, one 403 (pass); **two guardians pay the same balance online → both orders open, both captured, the second refused after payment** | **Fail** (E2E-A1, E2E-A2) |
| J3 | A circular published, delivered, read and acknowledged | published to Grade 5 parents with an acknowledgement; delivered inline on publish (`deliveredAt` after `createdAt`); 5 of 5 guardians told, nobody else; reach `told 5, seen 3, acked 2`; reminder reached the 3 not acknowledged, a second reminder the same day a no-op | a Grade 10 guardian: read 404, ack 404 | one guardian acknowledges from two devices at once: one `PostAck` row | **Pass** (E2E-A9 Low) |
| J4 | A certificate asked for by a family and issued by the office | guardian asks a bonafide "passport application"; the same kind again answers the same ask; office queue; issued; the purpose printed; PDF; public check says real and names no pupil; a stranger 404 | a study certificate charged ₹100 and declined: the fee stays owed | **office and head press Issue on the same ask at once → two numbered papers** | **Fail** (E2E-A3, E2E-A4) |
| J5 | A report card generated and read on the phone | Grade 9's form teacher generated 8 drafts from the four Term 1 papers, a refresh rewrote them in place, published; the guardian (sunrise.parent33) read the set, the card and its PDF (23 KB), and the phone's report cards tab counted 3 (2 after the withdrawal); withdrawn after | another class's teacher → 403; regenerating a published set → `skippedPublished 8`, nothing rewritten; a Grade 5 guardian → 404 | the head saving a remark on the teacher's draft at the same moment → 403 by role (only the class teacher writes cards), so no race to test | **Pass** |
| J6 | An admission application to admit | the office made a ZZ QA mid-year cycle (one seat); a Saraswati guardian applied; same child again → same application; offered; accepted; admitted into Grade 5 · A; guardian linked; withdraw after admission refused | admit before acceptance → 403; an OPEN cycle refusing applications; a next-year offer that cannot be admitted | **office and head press Admit on the same application at once → two pupils** | **Fail** (E2E-A5, E2E-A6, E2E-A8) |
| J7 | A transport trip with positions | route of 3 stops, the bus on it with the driver, two pupils seated; driver's location yes; start at the first stop; 20 positions accepted; stops passed read from them; a pupil ticked on; guardian saw "Evening · Live" with the bus's position (web and phone); trip ended | start before the yes → refused (first run); start 5 km away without a reason → refused; positions after the end → 403 | the same batch replayed twice at once → `accepted 0, duplicates 20` each, 20 instants stored once | **Pass** (E2E-A12, E2E-A13 Low) |
| J8 | A library loan and return | title with three copies; lend, the limit of 2 held, reserve, overdue list, return late (the loan's due day moved back three days on the admin connection, labelled), fine ₹3 = 3 × ₹1, waived; the held copy for the queue | third loan at the limit → 403; second return of a copy → 403, no second fine | one copy lent to two pupils from two desks at once → one 200, one 403 "not on the shelf", one open loan | **Pass** (E2E-A10 Low) |
| J9 | A hostel leave | house, room, bed; a pupil's own ask waits for consent; the guardian consents; the warden approves; the gate out; back in after the leave's end flagged late, the family told | the warden approving before the guardian's yes → 403; the same bed to a second pupil → 403 | warden approves and office declines at once → one decision (DECLINED), the other told "already decided"; three audit rows, no double | **Pass** (E2E-A11 Low) |
| J10 | A substitution | Farida Sheikh is away: a teacher named for Grade 6 · A Period 2; sees it on `/staff/substitutions/me`; acknowledges (twice is a no-op); declines with a reason; the office and head told; the board shows it uncovered; cleared, cleared again a no-op | a teacher teaching that period → 403 clash | **office and head name two different teachers at once → both answered `changed: true`, both teachers told to cover, one stored** | **Fail** (E2E-A7) |
| J11 | The website built, previewed, published and a review link opened | motto saved with If-Match; preview HTML carries it; published (no address until a domain is live); the office reads `/sites/<slug>`, a guardian gets 404; a review link opened signed out (200, `noindex`, `private, no-store`); a second link stops the first; revoked → 404; phone summary "Published" | a stale version → 409; an `http://` map link → 422 naming the field | office and head save the same draft version at once → one 200, one 409 | **Pass** |
| J12 | An enquiry answered | a Saraswati guardian asks Sunrise about admission (open with JOB_BOARD off); in the office's inbox, one notification; office and head both reply; the guardian replies; the office closes | a stranger reading → 404; a reply after the close → 400 "closed"; a teacher closing → 403 | office and head reply at the same moment → both kept, in order (3 messages) | **Pass** |
| J13 | A social post queued (Meta mocked) | dev server: `GET /admin/social` says no Meta app; ZZ admin published two school posts. In process (Meta's Graph API faked by a fetch in the script, nothing left the machine): queued for Facebook, asked twice → one copy; sent with a permalink; the office read SENT with the link through the dev server | Meta down: three attempts an hour apart, then FAILED with the reason; retry of a SENT copy → 409; retry of the failed one → QUEUED, sent | two overlapping runs of `social:send` → Meta asked once | **Pass** |

Five journeys fail, each on a race or a money path; eight pass.

## Data consistency, after each journey

| Journey | Check (rows read on the admin connection, against what the doors answered) | Result |
|---|---|---|
| J1 | 119 open days in Term 1 to date = 119 registers; records 952 = 8 pupils × 119; no duplicate (class, day) register at Sunrise; the guardian's five months equal the rows (June 25 P/1 A; July 25/1 L/1 A; Aug 23/1/1; Sept 20/1/1; Oct 16/2 L/1 A); class analytics 96.3 % = (882 + 35) / 952 | holds |
| J2 | after every step: `paidPaise` = Σ allocations of PAID/REFUNDED payments, status follows, each PAID payment fully allocated with one receipt; overview totals read; Term 2 back to OPEN ₹0 after the run | holds; but one captured online payment has no row that says so (E2E-A1/A2), and every reversal is a data:audit WARN (E2E-A14) |
| J3 | told = notifications to `/bulletin/<id>` = 5 = the grade's guardians; `PostAck` 2 rows for 2 acknowledgers; the office's list carries the same counts | holds |
| J4 | one request → `IssuedCertificate` rows | **2 rows for 1 request** (E2E-A3) |
| J5 | 8 cards per title, published 8, withdrawn 8, the family's list follows | holds |
| J6 | one application → memberships | **2 pupils, roster grew by 2, seat count says 1** (E2E-A5) |
| J7 | positions stored = distinct instants (20, plus the start's own position = 21) | holds |
| J8 | one open loan per copy; fine = days late × rate; one fine per loan | holds |
| J9 | one decision per leave; bed taken once | holds |
| J10 | one `Substitution` row per lesson | holds as a row; **two teachers told** (E2E-A7) |
| J11 | after the cleanup the site row equals its saved state (config, `draftVersion` 0, unpublished), the run's version and links removed | holds |
| J13 | one copy per network per post; Meta called once per copy; the Page connection untouched by a transient failure | holds |
| all | `npm run data:audit` after the cleanup: **70 passed, 0 FAIL, 6 WARN** — four `fee-payment` "REVERSED yet still holds … in allocations" (this run's reversals, E2E-A14) and the two `usage-sample` WARNs layer 1 already reported | see E2E-A14 |

## Findings

### E2E-A1 · E2E · High · Both · Fees: two guardians can pay the same demand online; the second is charged and refused
1. Accounts: sunrise.parent01 (Advait Kulkarni's guardian) and demo.parent.two, linked to Advait for the run through the real claim flow (`POST /community/link-child` with his student code and birth date, approved by sunrise.parent01). sunrise.admin saved a TEST gateway account (values generated for the run; devbox transport).
2. Advait owes ₹7,500 on Term 2. Each guardian calls `POST /api/v1/fees/family/checkout {studentMembershipId, demandIds:[Term 2]}`.
3. Each pays at the gateway and the browser posts `POST /api/v1/fees/family/checkout/confirm` with the gateway's signature.
- Expected: the second checkout is refused while an order for the same demand is open (or the second capture is recorded as money received — a credit or a refund the office must make — with a receipt or a clear status).
- Actual: both checkouts answer 201 with two orders of ₹7,500 for the same demand (`order_devbox33cbb7f353ed50`, `order_devbox6ff48cce531550`). The first confirm settles (`RCPT/2026–27/000015`); the second answers `403 {"error":"Nothing is due to pay."}` after the money was taken. The second payment stays INITIATED with no gateway payment id, no receipt, no audit row beyond `fees.checkoutStart`; the guardian's payment page says INITIATED and still offers the checkout again; the office's claims queue is empty (`initiatedOnline: 1` is the only trace). It does not need two parents tapping at the same second: an order is never checked against another open order for the same demand.
- Fix: in `startOnlineCheckout`, refuse (or reuse) when an INITIATED online payment for the same pupil already names one of the demands; and in `settle`, when the money has arrived but nothing is due, record the payment as received-unallocated (status such as PAID_UNALLOCATED or a refund-owed row), audit it, tell the office and the family, instead of throwing.
- Files: `apps/web/src/lib/fees-payments.ts` (`familyIntent` ~310–324, `startOnlineCheckout` 327–371, `settle` and `allocate` 44–66 and the fallback ~205), `apps/web/src/app/api/v1/fees/family/checkout/route.ts`.

### E2E-A2 · E2E · High · Both · Fees: the gateway's capture webhook for that payment is answered 404 and then "already"; the capture is never recorded
1. As E2E-A1, the second guardian's order left INITIATED. Term 2 settled meanwhile (here: ₹12,500 cash at the counter by sunrise.admin, reversed after).
2. A signed `payment.captured` webhook for that order (the TEST account's webhook secret) to `POST /api/webhooks/razorpay/<schoolId>`.
3. The gateway retries the same event.
- Expected: the capture is recorded (paid, unallocated, flagged for a refund) or answered 5xx so the gateway retries until it is; never acknowledged as handled.
- Actual: the first delivery answers **404 with an empty body** (the route's own comment says 404 means "stop sending"); the `GatewayEvent` row is already written (`processedAt` null, `outcome` null); the retry answers `200 {"ok":true,"outcome":"already"}`. The payment stays INITIATED, no audit row, nobody told. The event row is created before the settlement in its own statement, so any throw inside `settleOnlinePayment` marks the event seen forever.
- Fix: write the event row and its outcome in the same transaction as the settlement, or mark it processed only after success and let a row with `processedAt` null be processed again on a retry; and make "nothing due" a recorded outcome (E2E-A1), not a throw.
- Files: `apps/web/src/app/api/webhooks/razorpay/[schoolId]/route.ts` (78–99), `apps/web/src/lib/fees-payments.ts` (`settleOnlinePayment` 373–391).

### E2E-A3 · E2E · High · Both · Admissions: two admits at once make two pupils from one application
1. sunrise.admin made a mid-year cycle (grade 5, one seat); svm.parent10 applied for a child ("ZZ QA Admit …"); the office offered; the guardian accepted.
2. sunrise.admin and sunrise.principal call `POST /api/v1/office/admissions/applications/<id>/admit {classId: Grade 5 · A}` at the same moment.
- Expected: one pupil; the second press answers the first admission as it stands (the code's own "already admitted" branch).
- Actual: both answer 200 with different pupils: `STU-CVRT-MFHF` (with a first sign-in code) and `STU-MFNM-KKFG`; two user accounts, two STUDENT memberships, two enrolments in Grade 5 · A, the guardian linked to both; the roster grew by 2; the application points at one, the seat count says 1 of 1. The status check (`a.status !== "ACCEPTED"`) and the seat count are read before the transaction, which does not re-check either.
- Fix: inside the transaction, move the application from ACCEPTED to ADMITTED with a conditional update (`updateMany where status: ACCEPTED`) before creating anything, and abort when it matches no row; count the seats under the same lock.
- Files: `apps/web/src/lib/admissions.ts` (`admit` 883–1000; check at 889–892, transaction from ~952).
- Cleanup: both pupils were removed by id after the run.

### E2E-A4 · E2E · Medium · Both · Certificates: one ask issued twice when the office and the head press Issue together
1. sunrise.parent02 asks for a bonafide for Bhavya Shinde ("passport application").
2. sunrise.admin and sunrise.principal call `POST /api/v1/office/certificates {templateId, studentMembershipId, requestId}` at once.
- Expected: one paper; the second press answered with the paper already issued (or refused).
- Actual: both 200: `BC/2026–27/0002` and `BC/2026–27/0003`, both valid at the public check; the request points at 0003; the family's certificates screen (web and phone) lists both. A legal paper in duplicate, one of them orphaned.
- Fix: claim the request first (`updateMany where id, status: PENDING → ISSUING/ISSUED`) inside the issue's transaction and refuse when it matches nothing; `markRequestIssued` today checks and writes in two statements after the paper exists.
- Files: `apps/web/src/lib/certificates.ts` (`issueCertificate` 250–330), `apps/web/src/lib/certificate-requests.ts` (`markRequestIssued` 219–224).
- Cleanup: 0002 revoked through the office's door with that reason.

### E2E-A5 · E2E · Medium · Both · Certificates: a declined ask leaves its fee owed
1. sunrise.parent02 asks for a study certificate; sunrise.admin sets a ₹100 fee (`POST …/certificate-requests/<id>/fee`): a demand on Bhavya's ledger.
2. sunrise.admin declines the ask with a reason.
- Expected: the fee of a declined (or cancelled) ask is cancelled with it.
- Actual: the ask is DECLINED with `feePaise 10000, feePaid false`, and the demand stays OPEN ₹100 on the pupil's ledger and the guardian's fees. `declineRequest` and `cancelRequest` never touch `feeDemandId`.
- Fix: in both, cancel the linked demand when nothing is paid on it (status CANCELLED, recomputed), and say what happens to a paid one.
- Files: `apps/web/src/lib/certificate-requests.ts` (`cancelRequest` 137–147, `declineRequest` 168–186).
- Cleanup: the demand removed by id.

### E2E-A6 · E2E · Medium · Both · Admissions: only the newest open cycle takes applications
1. Sunrise has the seeded OPEN "Admissions 2027–28". sunrise.admin creates and opens a second cycle (mid-year, this year).
2. svm.parent10 reads `GET /api/v1/shared/schools/<Sunrise>/admissions`, then applies to the seeded 2027–28 cycle.
- Expected: every OPEN cycle within its dates is offered and takes applications (a mid-year transfer cycle beside next year's admissions is the ordinary case; demo:transfer itself uses one).
- Actual: the family sees only the newest ("ZZ QA mid-year …"); applying to the seeded cycle, OPEN on the office's list, answers `403 "That cycle is not open."`. While the test cycle was open the seeded cycle was hidden from every family.
- Fix: `openCycleOf` returns one cycle; return every open cycle (the page lists them, the family picks) and let `apply` accept any cycle open by its dates; or, if one open cycle a school is the rule, refuse opening a second in `setCycleStatus`.
- Files: `apps/web/src/lib/admissions.ts` (`openCycleOf` 352–360, `apply` 447–455, `setCycleStatus` 248–257).

### E2E-A7 · E2E · Medium · Both · Substitutions: two teachers told to cover one lesson
1. Today's board at Sunrise (Farida Sheikh away), Grade 6 · A Period 2 uncovered.
2. sunrise.admin names Anjum Qureshi and sunrise.principal names Arjun Mehta for it, at the same moment (`POST /api/v1/office/substitutions`).
- Expected: one is stored and the other is told it changed meanwhile (or the second replaces the first and the first teacher is released).
- Actual: both answer `200 {"changed":true}`; both teachers get "Please cover English for Grade 6 · A, Period 2"; both audits say `replaced: false`; one row (Anjum). Arjun is never told he is not needed. The clash check is read-then-write the same way, so one teacher can also be double-booked into two lessons of one period by two people at once (untested).
- Fix: decide `existing` inside a transaction with the row locked (or an upsert keyed with a compare on the previous substitute) and release the replaced person when the write replaced someone; do the clash check under the same lock.
- Files: `apps/web/src/lib/substitutions.ts` (`assignSubstitute` 207–245).

### E2E-A8 · Functional · Low · Both · Admissions: a seat in next year's cycle cannot be given before the year begins
1. Next-year cycle (2027–28), application offered and accepted (svm.parent10).
2. `POST …/admit {}` and `{admittedOn: <the year's first day>}` as sunrise.admin.
- Expected: the office can complete an admission months ahead (the usual practice), dated the year's first day.
- Actual: both `403 "The admission date must be between the start of the academic year and today."` An accepted family waits until June 2027 for the admit. (The seeded "Admissions 2027–28" shows one ADMITTED application, written by the seed directly.)
- Fix: a decision for the owner; if ahead-of-time admission is wanted, allow `admittedOn` = the year's start for a future year and keep the membership PENDING (or not enrolled) until then.
- Files: `apps/web/src/lib/admissions.ts:916`.

### E2E-A9 · Functional · Low · Web · Circulars: the reminder says "texted 3" when no text went
1. sunrise.admin publishes a circular to Grade 5 parents; two acknowledge.
2. `POST /api/v1/shared/bulletin/<id>/remind`.
- Expected: `texted` counts texts handed to the sender.
- Actual: `{"reminded":3,"texted":3}` while all three `OutboundMessage` rows are `SKIPPED feature-off` (TEXTS is off on the platform). The reach report itself counts only SENT/DELIVERED, so the two disagree.
- Fix: return the number of texts actually queued or sent by `tell`, not `guardianIds.size`.
- Files: `apps/web/src/lib/circulars.ts:297` (`remindCircular`).

### E2E-A10 · Functional · Low · Both · Library: a renewal refused for a reader who already has a copy held
1. sunrise.librarian adds a title with three copies, lends two to Bhavya Shinde; sunrise.parent01 reserves the title for Advait — the reservation is at once `ready` with copy 3 held for him.
2. The desk renews Bhavya's loan.
- Expected: renewed; nobody is waiting for a copy (the only reservation is satisfied by a held copy).
- Actual: `403 "Someone is waiting for this book, so it cannot be renewed."` three times. The count includes reservations already ready.
- Fix: count only reservations with `readyAt` null.
- Files: `apps/web/src/lib/library.ts:860` (`renewLoan`; the same count at 279 for `canRenew`).

### E2E-A11 · Functional · Low · Both · Hostel: the gate lets a boarder out before the leave begins
1. sunrise.parent33 asks local leave for Lavanya Kulkarni from now + 45 s; sunrise.warden approves.
2. The warden presses Out at once.
- Expected: refused before `fromAt` (or a warning), as late-return is checked against `toAt`.
- Actual: 200, `outAt` 41 s before the leave's start; nothing checks either end of the window on the way out.
- Fix: in `gateOut`, refuse before `fromAt` (with a small grace) and after `toAt`.
- Files: `apps/web/src/lib/hostel.ts:515` (`gateOut`).

### E2E-A12 · Functional · Low · Both · Transport: a route's evening times may run backwards
1. sunrise.admin makes a BOTH route whose evening times increase in the morning's stop order (stop 1 12:04, stop 2 12:14, stop 3 12:24).
2. The evening trip runs stop 3 → 1.
- Expected: refused (each run's times ascend along its own order), or the times re-ordered.
- Actual: accepted; the driver's phone reads "First stop at 12:24" over a list 12:24, 12:14, 12:04, and "missed" is read from 12:24.
- Fix: in `checkStopTimes`, require morning times ascending in stop order and evening times ascending in reverse order.
- Files: `apps/web/src/lib/transport.ts:213–219`.

### E2E-A13 · Functional · Low · Mobile · Transport: positions out of the window are reported as duplicates
1. sunrise.driver01 on a live trip posts one position stamped tomorrow.
- Expected: refused (422) or counted as rejected.
- Actual: `200 {"accepted":0,"duplicates":1}`; positions outside [start, now + slack] are filtered out and reported under `duplicates`, so the phone's outbox treats them as delivered.
- Fix: add `rejected` to the answer (contracts `tripPositionsResultSchema`) and count dropped ones there.
- Files: `apps/web/src/lib/transport.ts:792–821`, `packages/contracts/src/v1/transport.ts:326`.

### E2E-A14 · Functional (data) · Low · Web · Every counter reversal is a data:audit WARN
1. sunrise.admin reverses any PAID payment (`POST /api/v1/fees/payments/<id>/reverse`).
2. `npm run data:audit`.
- Expected: a reversal made through the office's own door is not drift.
- Actual: `fee-payment WARN: payment … is REVERSED yet still holds 750000 in allocations` (four, all this run's). Reversal keeps the allocation rows by design and `recomputeDemands` filters by status, so the money is right; the audit's expectation and the code disagree, and the WARN list fills with noise that hides real drift.
- Fix: either drop the allocations on reversal (they are recoverable from the audit row) or teach the check that REVERSED keeps them.
- Files: `apps/web/tests/data-audit.test.ts:290`, `apps/web/src/lib/fees-payments.ts:279–297`.

### E2E-A15 · UI-UX · Low · Mobile · Office-only phone routes opened by a family member or a teacher
1. On the phone's web target, as sunrise.parent03 open `/circulars`; as svm.parent10 `/applications`; as sunrise.spare1 `/substitutions` (paths a shared link or an old notification can carry).
- Expected: the reader's own screen (`/post?postId=`, `/my-applications`, `/my-covers` — all three render correctly) or a not-found.
- Actual: the office's screen title and description with "Wrong role for this action" and a **Try again** button that cannot succeed.
- Fix: route a role to its own screen for these paths, or show not-found without a retry.
- Files: `apps/mobile/src/app/(app)/circulars.tsx`, `applications.tsx`, `substitutions.tsx`.

## Observations, not findings
- Back-dating a register tells families now: J1's June–September registers wrote 23 "was marked absent" notifications dated by their day ("Monday, 01/06/2026"). Dated, no text; a decision whether a late register should notify at all.
- A term's report card takes the term's name as its title; a typed title is ignored, and when the term's set is already published the answer is `created 0, updated 0, skippedPublished 8` with no hint (J5, first attempt). The web form may already hide the title for a term.
- docs/demo-schools.md says "/parent/grades → cards"; `/parent/grades` redirects to `/parent/assignments?tab=marked` ("Nothing has been marked yet") for a pupil with exam marks. The cards are under the phone's Exams → Report cards and the web's report cards page.
- Two library cards were numbered L00001 and L00003 in J8's race (L00002 consumed by the losing call): harmless.
- A teacher cannot read or close an admission enquiry (404 / 403 "Only the school closes an enquiry") though the catalog lists TEACHER on the close door; consistent with "the school's side" meaning the office and head for admissions.

## What the run wrote, and what was put back
- **Put back (by the doors where one exists, else by id on the admin connection, Sunrise only):** J1's 87 registers (85 before 9 September, 10 October's and today's) and their 23 notifications; J2's payments reversed through the door (Term 2 OPEN ₹0 again), the test gateway account removed through the door, the stuck order closed as FAILED by a signed `payment.failed`, demo.parent.two's claim and ended guardianship on Advait; J4's duplicate paper revoked through the door and the declined ask's demand; J5's set withdrawn through the door and its 8 drafts; J6's two pupils, two applications and two cycles; J7's two routes with their stops, seats, assignments, trips, positions and boardings, and the driver's location yes; J8's title, copies, loans, reservation, fine and two library cards; J9's houses, rooms, beds and leaves; J10's lesson cleared through the door; J11's site row (config, `draftVersion` 0, unpublished), its version and links; J13's two ZZ posts and their copies; every `qa-e2e-a` session (85) and the minted ZZ one.
- **Left in place, each labelled "QA e2e-a":** Advait's ledger keeps four REVERSED payments (`RCPT/2026–27/000013`, 000014, 000015, 000016 — the ledger is append-only) and one FAILED online order; the year's receipt counter moved on by 4. Bhavya's papers: `BC/2026–27/0003` (issued, answering the ask) and `BC/2026–27/0002` (revoked); her two asks (ISSUED, DECLINED). The circular `cmvlzmfv10057gpgjwcpqxiv9` with its 2 acknowledgements; the enquiry `cmvm0avj900wvgpgjlkag0obm` (closed). Notifications and audit rows the journeys wrote (append-only), and the `fees:received`/`circular` texts recorded as SKIPPED.

## Paths touched
- `docs/qa/campaign-2026-10-24/e2e-a.md` (this report, new).
- `docs/data-audit/latest.md`, `docs/data-audit/reports.md` (regenerated by `npm run data:audit`).
- `apps/web/scripts/tmp-qa-e2ea-*.ts` — created and deleted; copies in the scratchpad.
- `apps/web/.zz-token/qa-e2e-a.hashes` (gitignored; emptied by the purge).
- Database: as listed above.

## Untested
- A real device (the phone was its web target in headless Chromium) and a real gateway, Meta or SMS account; the webhook was signed with the run's own TEST secret, Meta was a fake fetch.
- J13's composer path on the dev server (no Meta app configured there): the queue and the send ran in the script's process.
- The password form on `/login`; the harness's `global-setup.ts` and its flow specs (not run, to keep layer 4's sessions).
- Two people double-booking one teacher into two lessons of one period (E2E-A7's clash check race), two admits racing for the last seat of a grade with two different applications, and the reconcile job (`fees:reconcile`) on the stuck order.
- A circular large enough to be delivered by the job instead of inline; a review link opened after its expiry day; a website on a live domain and its public enquiry form (needs DNS).
- `npm run api:sweep` and the page sweep (by the rule; nothing in the code changed); `npx vitest run`, the phone battery and `next build` (nothing in the code changed).
