# Shalaghar QA campaign of 24 October 2026: the report

The QA campaign of 24 October 2026 tested the web app (:3000) and the phone app's web target (:8081) on this machine's dev database, in seven layers, each with its own builder and report: accounts and reach ([layer-1.md](layer-1.md), [accounts.md](accounts.md)), unit ([unit.md](unit.md)), BDD ([bdd.md](bdd.md)), UI and UX ([ui.md](ui.md)), end to end on the school side ([e2e-a.md](e2e-a.md)) and on the college and platform side ([e2e-b.md](e2e-b.md)), the functional and workflow map ([functional.md](functional.md)) and security ([security.md](security.md)). This report is layer 8. Every number in it is quoted from one of those reports, and each finding names the layer IDs it came from.

No product code was changed by the campaign. Layer 1 added the `demo:accounts` fixture script, layer 2 added ten test files and fixed one harness defect in `tests/setup.ts`, and layer 3 added the BDD runner under `apps/web/features/`. No layer typed a password into a form or created an account through the UI, and each one put back or deleted what it wrote (each report lists what it left).

**77 findings after merging duplicates across layers: Critical 0, High 5, Medium 15, Low 57.** The layers reported 79. Two pairs describe one defect each and are merged: E2E-A2 with SEC-2, and E2E-A15 with E2E-B12.

## Contents

1. Accounts used
2. Findings
3. Coverage summary
4. Bugs to fix before release
5. Missing test cases
6. High-risk areas needing deeper testing
7. Remediation plan

## 1. Accounts used

This report contains no passwords. The demo accounts (`@demo.relay.test`) share the one password recorded in docs/demo-schools.md. The ZZ accounts (`@zz.test`) have unknowable password hashes. They were used only through minted sessions: `npm run zz:token -- ROLE [email] --tag=qa-<layer>`, purged at the end of each layer, or a temporary `zz-walk` session deleted when its script ended. "Login door" means a script called `POST /api/v1/auth/login` with the shared password, read at run time. Nobody typed into the `/login` form.

| Email | Role | School or scope | Sign-in | Layers |
|---|---|---|---|---|
| `sunrise.admin@demo.relay.test` | ADMIN | Sunrise Public School | Login door | 1, 5A |
| `sunrise.principal@demo.relay.test` | PRINCIPAL | Sunrise | Login door | 1, 5A |
| `sunrise.teacher1`–`6`, `sunrise.subject1`–`2`, `sunrise.spare1` | TEACHER | Sunrise | Login door | 1, 5A |
| `sunrise.pupil01`–`pupil48` (47) and `aarav.deshmukh` | STUDENT | Sunrise | Login door | 1, 5A, 5B |
| `sunrise.parent01`… (29 guardians) and `sunita.deshmukh` | PARENT | Sunrise (sunita.deshmukh at both schools) | Login door | 1, 5A, 5B |
| `sunrise.pupil49` | ALUMNUS | Sunrise | Login door | 1 |
| `sunrise.driver01`, `sunrise.librarian`, `sunrise.warden` | DRIVER, LIBRARIAN, WARDEN | Sunrise | Login door | 1, 5A |
| `svm.*`: admin, principal, teacher1–6, subject1–2, spare1, 47 pupils and anaya.deshmukh, 29 parents, pupil49 | The Sunrise set without driver, librarian or warden | Saraswati Vidya Mandir | Login door | 1, 5A |
| `<prefix>.*` for sac, sit, sim, slc, sce, scp, ssa, sca, svc, sih: registrar, principal, hod.<dept>, faculty1–4, exams, iqac, tpo, accounts, librarian, warden, driver, parent, alumni01, recruiter, studentNN | The college roles (not every prefix has every role) | The ten demo colleges | Login door | 1, 5B (sac, sih) |
| `demo.expert01@demo.relay.test` | EXPERT | Platform (added in layer 1) | Login door | 1, 5B |
| `demo.recruiter01@demo.relay.test` | RECRUITER | Sahyadri Data Labs, recruiting at sac (added in layer 1) | Login door | 1, 5B |
| `demo.parent.two@demo.relay.test` | PARENT | One child at Sunrise, one at Saraswati Vidya Mandir (added in layer 1) | Login door | 1, 5A |
| `vikram.sethi@demo.relay.test` | EXPERT | Platform | Login door | 1 |
| `ishaan.pawar@demo.relay.test` | STUDENT and ALUMNUS | Saraswati Vidya Mandir; Sunrise (the demo:transfer pupil) | Login door | 1 |
| `prakash.pawar@demo.relay.test` | PARENT | Ishaan Pawar's guardian | Login door | 1 |
| `zz.operator@zz.test` | OPERATOR | Platform | Minted | 1, 4, 5B, 6, 7 |
| `zz.appadmin@zz.test` | APPADMIN | Platform | Minted | 1, 4, 5B, 6 |
| `zz.*` school accounts: zz.admin, zz.principal, zz.teacher1–4, zz.pupil01–02, zz.parent01–02, zz.driver01, zz.librarian, zz.warden, zz.alumni01–02, zz.admin.b, zz.admin.c and the rest | Every school role | ZZ Northgate, ZZ Southbank, ZZ Banyan | Minted (layer 6 by zz-walk session) | 1, 3, 4, 5A (zz.admin), 5B, 6, 7 |
| `zz.*` college accounts: zz.cadmin, zz.cprincipal, zz.faculty01–02, zz.hod01, zz.examctrl, zz.iqac, zz.tpo, zz.accounts, zz.cstudent01–02, zz.cparent01, zz.calumni01, zz.cadmin.d and the rest | Every college role | ZZ Vidya, ZZ Shastri, ZZ Dhanvantari | Minted | 1, 3, 4, 6, 7 |
| `zz.expert1`–`zz.expert4`, `zz.recruiter01` | EXPERT, RECRUITER | Platform fixtures | Minted (the experts by direct zz-walk session, because of QA-74) | 1, 4, 6 |

Layer 1 verified every account, not a sample. On `@demo.relay.test`: 448 accounts and 449 contexts, all 449 verified. On `@zz.test`: 167 accounts and 172 contexts, 167 verified. Five ZZ accounts hold no context by design and were not signed in (zz.claimant01, zz.joiner01, zz.nba.exit01, zz.nba.grad01, zz.nba.late01). "Verified" means four things passed. The account signed in and `GET /api/v1/me` answered 200. The role's web home answered with its heading. One door the catalog grants answered 200 and one it refuses answered 403. The phone's web target was opened for one account per row, school and role (220 renders). Layer 2 used no account: its tests make their own ZZ schools and `@test.invalid` people and remove them by id.

## 2. Findings

77 findings, ordered Critical, High, Medium, Low. There is no Critical. By type (a finding can carry two): E2E 22, UI-UX 20, Functional 18, Security 10, Unit 7, BDD 4. By platform: Web 31, Mobile 9, Both 37.

| ID | Severity | Type | Platform | Finding | From |
|---|---|---|---|---|---|
| [QA-01](#qa-01) | High | Security | Both | A staff expert-invite link takes over any unverified account. **Fixed, <commit pending>:** the invite door answers the invitation id and `sent`, never the link (an address is required), and the invite page sets a password only on the account the operator's approval made for that invitation | SEC-1 (layer 7) |
| [QA-02](#qa-02) | High | E2E, Security | Both | Payment webhooks mark an event handled before the settlement, so a failed settlement is never retried. **Fixed, <commit pending>:** all three doors count an event handled only once `processedAt` is set after the work; a throw answers 500 with a body and the row stays re-processable, a concurrent delivery 409 (src/lib/webhook-events.ts) | E2E-A2 (layer 5A, High) and SEC-2 (layer 7, Medium) |
| [QA-03](#qa-03) | High | E2E | Both | Two guardians can pay the same demand online; the second is charged and then refused. **Fixed, <commit pending>:** a checkout locks the pupil's open demands and refuses another guardian's order while one younger than half an hour names the same demand (the same guardian gets theirs back); a capture that arrives with nothing due is recorded UNALLOCATED, audited, office and family told, and refunded from the pupil's fees page | E2E-A1 (layer 5A) |
| [QA-04](#qa-04) | High | E2E | Both | Two admits at once make two pupils from one application. **Fixed, <commit pending>:** the admit transaction locks the cycle and the application and reads both again under the lock; the second press is answered with the admission as it stands, and a grade's last seat goes once | E2E-A3 (layer 5A) |
| [QA-05](#qa-05) | High | E2E | Both | College exam results are computed and published with missing internal marks counted as zero. **Fixed, <commit pending>:** the run (and a grace to pass) is refused 409 while a sitting student's internal is missing on a course whose scheme has an internal part, naming the courses; the marks sheet's swapped key (QA-09) is fixed with it | E2E-B1 (layer 5B) |
| [QA-06](#qa-06) | Medium | Functional | Both | A guardian who has just paid online is told "Nothing is due to pay" when the gateway's webhook settles the same payment at the same moment | F-1 (layer 6) |
| [QA-07](#qa-07) | Medium | Unit | Web | College accounts: the mess bill and the route fee are billed twice when pressed in another language | U-4 (layer 2) |
| [QA-08](#qa-08) | Medium | BDD | Web | The PF return (ECR) splits the employer's share with ₹1 too much on every line | BDD-1 (layer 3) |
| [QA-09](#qa-09) | Medium | E2E | Both | The exam marks sheet shows a locked internal mark as missing. **Fixed, <commit pending>:** `marksSheet` looks the lock up under `<student>\|<course>`, the key `internalsFor` writes (with QA-05) | E2E-B5 (layer 5B) |
| [QA-10](#qa-10) | Medium | E2E | Web | Two people's first mark entries at the same moment answer 500 and lose one entry | E2E-B4 (layer 5B) |
| [QA-11](#qa-11) | Medium | E2E | Both | A declined certificate ask leaves its fee owed | E2E-A5 (layer 5A) |
| [QA-12](#qa-12) | Medium | E2E | Both | One certificate ask is issued twice when the office and the head press Issue together | E2E-A4 (layer 5A) |
| [QA-13](#qa-13) | Medium | Security | Web | The email-verification token is spent on a GET, so a mail scanner verifies a squatted account | SEC-3 (layer 7) |
| [QA-14](#qa-14) | Medium | E2E | Both | A student accepts two offers at once and holds both | E2E-B3 (layer 5B) |
| [QA-15](#qa-15) | Medium | E2E | Mobile | A clinical logbook entry saved offline is not sent when the network returns | E2E-B2 (layer 5B) |
| [QA-16](#qa-16) | Medium | E2E | Both | Two teachers are told to cover one lesson | E2E-A7 (layer 5A) |
| [QA-17](#qa-17) | Medium | E2E | Both | Only the newest open admission cycle takes applications | E2E-A6 (layer 5A) |
| [QA-18](#qa-18) | Medium | UI-UX | Mobile | A plan-locked screen on the phone is a red error with a Try again that can only fail | UI-15 (layer 4) |
| [QA-19](#qa-19) | Medium | UI-UX | Web | Links lead limited roles to pages they may not open | UI-01 (layer 4) |
| [QA-20](#qa-20) | Medium | UI-UX | Web | Relative times stay English in Hindi and Marathi | UI-02 (layer 4) |
| [QA-21](#qa-21) | Low | Security | Both | Accepting a school invitation bypasses TOTP | SEC-4 (layer 7) |
| [QA-22](#qa-22) | Low | Security | Both | TOTP guessing has no per-account ceiling | SEC-5 (layer 7) |
| [QA-23](#qa-23) | Low | Security | Both | Turning TOTP on needs only a session, no password | SEC-6 (layer 7) |
| [QA-24](#qa-24) | Low | Security | Web | A password-reset request is slower for registered accounts | SEC-7 (layer 7) |
| [QA-25](#qa-25) | Low | Security | Both | Public sign-up reveals which email addresses have an account | SEC-8 (layer 7) |
| [QA-26](#qa-26) | Low | Security | Web | The tenant resolver skips three checks getSession makes | SEC-9 (layer 7) |
| [QA-27](#qa-27) | Low | Functional, Security | Web | The operator's school edit stores a javascript: website and a contact email that is not one | F-2 (layer 6) |
| [QA-28](#qa-28) | Low | Unit | Web | SSO: a provider's keys endpoint being down is a 500, not "sign-in failed" | U-2 (layer 2) |
| [QA-29](#qa-29) | Low | E2E | Both | A double press of Publish tells every student and guardian twice | E2E-B6 (layer 5B) |
| [QA-30](#qa-30) | Low | E2E | Web | Accepting one recruiter requirement twice at once makes two drives | E2E-B7 (layer 5B) |
| [QA-31](#qa-31) | Low | E2E | Both | Applying to a drive from two devices at once answers 500 | E2E-B8 (layer 5B) |
| [QA-32](#qa-32) | Low | E2E | Both | Accepting and declining one offer at once stamps both | E2E-B9 (layer 5B) |
| [QA-33](#qa-33) | Low | E2E | Web | Two recruiters offering at once each see their own package; the last write is kept | E2E-B10 (layer 5B) |
| [QA-34](#qa-34) | Low | E2E | Both | An IQAC sign-off and a return at the same moment both stand | E2E-B13 (layer 5B) |
| [QA-35](#qa-35) | Low | E2E | Mobile | The same logbook clientId sent twice at once answers 500 | E2E-B14 (layer 5B) |
| [QA-36](#qa-36) | Low | Unit | Web | Concurrent first reads of a late pass invoice fail | U-1 (layer 2) |
| [QA-37](#qa-37) | Low | UI-UX | Web | A losing double press reads as a failure (expert approval, pass refund) | E2E-B16 (layer 5B) |
| [QA-38](#qa-38) | Low | Unit | Web | An empty 200 from either gateway is a TypeError, not a gateway error | U-3 (layer 2) |
| [QA-39](#qa-39) | Low | Unit | Web | The scholarship reconciliation sheet's order has no tie-break | U-5 (layer 2) |
| [QA-40](#qa-40) | Low | Functional | Web | Every counter reversal is reported as drift by data:audit | E2E-A14 (layer 5A) |
| [QA-41](#qa-41) | Low | Functional | Web | A circular reminder says "texted 3" when no text went | E2E-A9 (layer 5A) |
| [QA-42](#qa-42) | Low | UI-UX | Both | A student's exam form never says whether its fee is paid or waived | E2E-B19 (layer 5B) |
| [QA-43](#qa-43) | Low | Functional | Both | A seat in next year's cycle cannot be given before the year begins | E2E-A8 (layer 5A) |
| [QA-44](#qa-44) | Low | Functional | Both | A library renewal is refused for a reader whose reservation is already satisfied | E2E-A10 (layer 5A) |
| [QA-45](#qa-45) | Low | Functional | Both | The hostel gate lets a boarder out before the leave begins | E2E-A11 (layer 5A) |
| [QA-46](#qa-46) | Low | Functional | Both | A route's evening stop times may run backwards | E2E-A12 (layer 5A) |
| [QA-47](#qa-47) | Low | Functional | Mobile | Trip positions outside the window are reported as duplicates | E2E-A13 (layer 5A) |
| [QA-48](#qa-48) | Low | E2E | Web | The placement "joined" answer names nobody | E2E-B11 (layer 5B) |
| [QA-49](#qa-49) | Low | E2E | Both | A patient's name passes the logbook's "names no patient" check | E2E-B15 (layer 5B) |
| [QA-50](#qa-50) | Low | Functional | Both | Demo experts' times are hidden from demo families, yet bookable by id | E2E-B17 (layer 5B) |
| [QA-51](#qa-51) | Low | Functional | Both | Vidura answers "I am not sure" to a college student's attendance question | E2E-B18 (layer 5B) |
| [QA-52](#qa-52) | Low | Functional | Web | A transferred pupil's guardian lands on the school the child left | L1-02 (layer 1) |
| [QA-53](#qa-53) | Low | Functional | Mobile | An expert under review is not told so on the phone while expert sessions are off | L1-04 (layer 1) |
| [QA-54](#qa-54) | Low | BDD, Functional | Both | Refused input is answered 403 FORBIDDEN instead of 422 | BDD-2 (layer 3) and F-3 item 4 (layer 6) |
| [QA-55](#qa-55) | Low | Functional | Both | Dates and times that are not real are kept or silently ignored | F-3 items 1–3 (layer 6) |
| [QA-56](#qa-56) | Low | Functional | Both | Two doors are described otherwise than they behave | F-4 (layer 6) |
| [QA-57](#qa-57) | Low | UI-UX | Web | A college head's home navigates twice on every sign-in | L1-01 (layer 1) |
| [QA-58](#qa-58) | Low | UI-UX | Web | The departed child's page has no heading | L1-03 (layer 1) |
| [QA-59](#qa-59) | Low | UI-UX | Web | Touch targets under 44 px on two pages the axe gate never opens | UI-03 (layer 4) |
| [QA-60](#qa-60) | Low | UI-UX | Web | The expert's profile fails hydration on every load | UI-04 (layer 4) |
| [QA-61](#qa-61) | Low | UI-UX | Both | Words and links for features that are switched off | UI-05 (layer 4) |
| [QA-62](#qa-62) | Low | UI-UX | Web | Confusing or unfinished copy on homes and the circulars page | UI-06 (layer 4) |
| [QA-63](#qa-63) | Low | UI-UX | Web | An internal key is printed in the office's texts log | UI-07 (layer 4) |
| [QA-64](#qa-64) | Low | UI-UX | Web | Template braces in the guide Vidura answers from | UI-08 (layer 4) |
| [QA-65](#qa-65) | Low | UI-UX | Both | Navigation differs between the web at phone width and the phone app | UI-09 (layer 4) |
| [QA-66](#qa-66) | Low | UI-UX | Mobile | Screens the phone does not have, unrecorded as deliberate | UI-10 (layer 4) |
| [QA-67](#qa-67) | Low | UI-UX | Mobile | The phone's web target has no landmarks | UI-11 (layer 4) |
| [QA-68](#qa-68) | Low | UI-UX | Web | Moderate and minor axe results on the web | UI-12 (layer 4) |
| [QA-69](#qa-69) | Low | UI-UX | Both | A college is called a school | UI-14 (layer 4) |
| [QA-70](#qa-70) | Low | UI-UX, E2E | Mobile | Phone paths open the office's screen for other roles; placement notices open nothing | E2E-A15 (layer 5A) and E2E-B12 (layer 5B) |
| [QA-71](#qa-71) | Low | BDD | Both | The fixture circular's reach report counts nobody, although a guardian acknowledged it | BDD-3 (layer 3) |
| [QA-72](#qa-72) | Low | BDD | Both | Two fixture timestamps run backwards (revoked before issued, sent before created) | BDD-4 (layer 3) |
| [QA-73](#qa-73) | Low | UI-UX | Web | The e2e harness's exam shows on the fixture teacher's home | UI-13 (layer 4) |
| [QA-74](#qa-74) | Low | Functional | Both | `zz:token EXPERT <email>` mints a session for another expert | L1-05 (layer 1) |
| [QA-75](#qa-75) | Low | Functional | Web | The placement library cannot be loaded by a script | L1-06 (layer 1) |
| [QA-76](#qa-76) | Low | Unit | Web | Stale code and comments met on the way (no behaviour wrong) | U-6 (layer 2) |
| [QA-77](#qa-77) | Low | Unit | Mobile | A single phone test file does not exit | U-7 (layer 2) |

### High

<a id="qa-01"></a>
#### QA-01 · A staff expert-invite link takes over any unverified account

- **Type:** Security · **Severity:** High · **Platform:** Both
- **Feature:** Expert invitations (behind EXPERT_SESSIONS); sign-in
- **From:** SEC-1 (layer 7)
- **Status:** Fixed, <commit pending>. `inviteExpert` requires an address, mails the link and returns `{ inviteId, sent, expiresAt }`; the door and its contract carry no link. The invite page refuses any existing account unless its signed-in owner accepts, or it is the passwordless, unproved account the operator's approval created for this invitation (`inviteMadeAccount`); an unproved holder resets the password first. Test: `apps/web/tests/expert-invite-takeover.test.ts`.

**Steps**

1. As `zz.operator@zz.test` (minted session), switch EXPERT_SESSIONS on with `POST /api/v1/operator/features/EXPERT_SESSIONS` (layer 7 switched it back off at once).
2. As `zz.teacher1@zz.test` (minted; any ADMIN or TEACHER at any school), call `POST /api/v1/staff/experts/invite` with the address of an account that never verified its email (layer 7 used `zztransferwa.ppmf@edulink.local`, an unverified handle pupil, and left it untouched).
3. Read the 201 body.
4. From the code, not executed: open `/expert/invite/<token>` and submit a name, the victim's address, a chosen password and a headline.

**Expected:** The link goes to the mailbox only. Holding a link a staff member was handed never sets a password on an account that already exists.

**Actual:** Step 3 answers 201 with the live link in the body (`{"link":"http://localhost:3000/expert/invite/<TOKEN>",...}`). Step 4 runs the reclaim branch (`actions.ts:84`): the inviter's password replaces the victim's, the address is marked verified, the victim's sessions and tokens are revoked and an expert session is minted. The victim's memberships stay, so a later sign-in as the victim with the chosen password lands in the victim's own role and school. 306 accounts on the dev database are unverified; in production any parent, pupil or admin who never opened the verification mail is reachable, by anyone who is staff at any school. Proven live up to step 3; step 4 read from the code.

**Suggested fix:** Mail the token only, as the school bulk invite does; or refuse the reclaim-unverified branch on the expert-invite accept (require the account's owner to be signed in, or a separate emailed proof).

**Files:** `apps/web/src/app/api/v1/staff/experts/invite/route.ts:21–22`; `apps/web/src/lib/experts.ts` (inviteExpert, createExpertInvite); `apps/web/src/app/expert/invite/[token]/actions.ts:84–93,` 122; `apps/web/src/lib/api-catalog/office-writes.ts:47`

<a id="qa-02"></a>
#### QA-02 · Payment webhooks mark an event handled before the settlement, so a failed settlement is never retried

- **Type:** E2E, Security · **Severity:** High · **Platform:** Both
- **Feature:** Fees online payments (school gateway); pass orders and seat payments (company gateway)
- **From:** E2E-A2 (layer 5A, High) and SEC-2 (layer 7, Medium)
- **Status:** Fixed, <commit pending>. The school, passes and seats webhooks go through `handleEventOnce` (`apps/web/src/lib/webhook-events.ts`): the row is claimed (insert or conditional update), the work runs, `processedAt` is set only after it; a throw answers `500 {"ok":false,"code":"NOT_PROCESSED","retry":true}` and leaves the row for the retry; a second delivery during the work is 409; a stale claim (5 minutes) or a row the old doors left is processed again. "Nothing due" itself became a recorded outcome under QA-03. Test: `apps/web/tests/webhook-retry.test.ts`.

**Steps**

1. School door (layer 5A): `sunrise.admin@demo.relay.test` (login door) saves a TEST gateway account on the devbox transport. `sunrise.parent01` and `demo.parent.two` each open a checkout for Advait's Term 2 (QA-03); the second order stays INITIATED once Term 2 is settled.
2. Send a signed `payment.captured` webhook for that order to `POST /api/webhooks/razorpay/<schoolId>`.
3. Send the same event again, as the gateway's retry does.
4. Company doors (layer 7, by code): a signed capture reaches `POST /api/webhooks/razorpay/platform` (passes) or `POST /api/webhooks/gateway/sessions` (seats), and the settlement throws after the event row is written.

**Expected:** The capture is recorded, or the delivery is answered 5xx so the gateway keeps retrying until it is. An event is never acknowledged while it is unprocessed.

**Actual:** Step 2 answers 404 with an empty body (the route's own comment says 404 means "stop sending"), and the GatewayEvent row is already written with `processedAt` null. Step 3 answers `200 {"ok":true,"outcome":"already"}`. The payment stays INITIATED, with no audit row, and nobody is told. The two company doors treat the event row's existence as "seen" in the same way; their live impact is lower today because passes and paid seats stay off until Route is proven.

**Suggested fix:** Write the event row and its outcome in the settlement's own transaction, or count an event as seen only once `processedAt` is set and process a row with `processedAt` null again on a retry. Make "nothing due" a recorded outcome (QA-03), not a throw.

**Files:** `apps/web/src/app/api/webhooks/razorpay/[schoolId]/route.ts` (78–99); `apps/web/src/lib/fees-payments.ts` (settleOnlinePayment 373–391); `apps/web/src/app/api/webhooks/razorpay/platform/route.ts:56–70`; `apps/web/src/app/api/webhooks/gateway/sessions/route.ts:64–88`

<a id="qa-03"></a>
#### QA-03 · Two guardians can pay the same demand online; the second is charged and then refused

- **Type:** E2E · **Severity:** High · **Platform:** Both
- **Feature:** Fees online checkout
- **From:** E2E-A1 (layer 5A)
- **Status:** Fixed, <commit pending>. `startOnlineCheckout` takes the pupil's open demands `FOR UPDATE` (in `openDemands`' order) and, under that lock, refuses with `fees.refuseCheckoutInProgress` while an INITIATED online order younger than 30 minutes names any of the same demands, handing the same guardian their own order back when the dues are exactly the same; past 30 minutes the order is taken as abandoned. `settleOnlinePayment` no longer throws "Nothing is due to pay" at a captured payment: it is marked `UNALLOCATED` with the gateway payment id (no allocation, no receipt, kept out of the collected PAID/REFUNDED figures), audited as `fees.onlineUnallocated`, the office (urgent) and the family told, the confirm answering `unallocated`; the office refunds it through `requestRefund`. Web and phone show the state. Test: `apps/web/tests/fees-checkout-race.test.ts`.

**Steps**

1. `sunrise.parent01@demo.relay.test` and `demo.parent.two@demo.relay.test` (login door) are both guardians of Advait Kulkarni (demo.parent.two linked for the run through the claim flow, approved by sunrise.parent01). `sunrise.admin` saved a TEST gateway account on the devbox transport.
2. Advait owes ₹7,500 on Term 2. Each guardian calls `POST /api/v1/fees/family/checkout` with that demand.
3. Each pays, and the browser posts `POST /api/v1/fees/family/checkout/confirm` with the gateway's signature.

**Expected:** The second checkout is refused while an order for the same demand is open; or the second capture is recorded as money received (a credit, or a refund the office owes) with a receipt or a clear status.

**Actual:** Both checkouts answer 201: two orders of ₹7,500 for one demand. The first confirm settles (`RCPT/2026–27/000015`); the second answers `403 "Nothing is due to pay."` after the money was taken. That payment stays INITIATED with no gateway payment id, no receipt and no audit row beyond `fees.checkoutStart`; the guardian's page still offers the checkout; the office's claims queue is empty. No simultaneous tap is needed: an order is never checked against another open order for the same demand.

**Suggested fix:** In `startOnlineCheckout`, refuse (or reuse) when an INITIATED online payment for the same pupil already names one of the demands. In `settle`, when money has arrived and nothing is due, record it as received-unallocated (or a refund-owed row), audit it, and tell the office and the family.

**Files:** `apps/web/src/lib/fees-payments.ts` (familyIntent ~310–324, startOnlineCheckout 327–371, settle and allocate 44–66, fallback ~205); `apps/web/src/app/api/v1/fees/family/checkout/route.ts`

<a id="qa-04"></a>
#### QA-04 · Two admits at once make two pupils from one application

- **Type:** E2E · **Severity:** High · **Platform:** Both
- **Feature:** Admissions
- **From:** E2E-A3 (layer 5A)
- **Status:** Fixed, <commit pending>. Inside `admit`'s transaction the cycle row and then the application row are locked and read again: ADMITTED is answered with that admission (`asAdmitted`), anything else but ACCEPTED is refused, and the seats are counted under the cycle's lock before any account is made. Test: `apps/web/tests/admissions-admit-race.test.ts`.

**Steps**

1. `sunrise.admin@demo.relay.test` makes a mid-year cycle (grade 5, one seat). `svm.parent10@demo.relay.test` applies for a child; the office offers; the guardian accepts.
2. `sunrise.admin` and `sunrise.principal@demo.relay.test` call `POST /api/v1/office/admissions/applications/<id>/admit {classId: Grade 5 · A}` at the same moment.

**Expected:** One pupil. The second press is answered with the admission as it stands (the code's own "already admitted" branch).

**Actual:** Both answer 200 with different pupils (`STU-CVRT-MFHF` and `STU-MFNM-KKFG`): two user accounts, two STUDENT memberships, two enrolments in Grade 5 · A, the guardian linked to both. The roster grew by 2 while the seat count says 1 of 1. The status check and the seat count are read before the transaction, which re-checks neither.

**Suggested fix:** Inside the transaction, move the application from ACCEPTED to ADMITTED with a conditional update (`updateMany where status: ACCEPTED`) before creating anything, abort when it matches no row, and count the seats under the same lock.

**Files:** `apps/web/src/lib/admissions.ts` (admit 883–1000; check 889–892; transaction from ~952)

<a id="qa-05"></a>
#### QA-05 · College exam results are computed and published with missing internal marks counted as zero

- **Type:** E2E · **Severity:** High · **Platform:** Both
- **Feature:** College exam cell: results
- **From:** E2E-B1 (layer 5B)
- **Status:** Fixed, <commit pending>. `runResults` refuses with `examCell.refuseInternalsMissing` (409, the count and the course codes) while a student who sat a course whose scheme has an internal part has neither an imported internal nor the HOD's lock; an AB, a paper cancelled for malpractice and an external-only scheme need none. `proposeGrace` refuses a grace to pass on a missing internal. Test: `apps/web/tests/exam-cell-internals-missing.test.ts`.

**Steps**

1. `sac.exams@demo.relay.test` (login door) makes a session for the Odd term at Saraswati Arts and Science College. Forms are approved; all 13 external marks are double-entered by sac.exams and `sac.registrar` and matched.
2. Only PHY301 and COM301 have internal marks locked by their HOD. MAT301, PHY302, COM101, COM102 and COM302 have none (`sac.hod.physics`'s lock of PHY302 is refused: the weights add to 20, they must add to 40).
3. As sac.exams, `POST /api/v1/exam-cell/sessions/{id}/results/run`, then `…/results/publish`.

**Expected:** The run is refused while a sitting course has no locked internal marks, as it is refused while an external mark is unmatched; at least, the run names the courses that are missing.

**Actual:** 200, with 5 of 5 students ATKT and a pass rate of 0 %. Every unlocked course is graded F because a null internal is taken as 0 (Aditya Patil: 53/60 external in MAT301, graded F). Publishing opened 9 backlogs, queued credit pushes, and told the five students and the minor's guardian. Undoing it needs a new run with a reason, published by the principal. The marks sheet hid this from the controller (QA-09).

**Suggested fix:** In `runResults`, count the (student, course) pairs whose internal is null for a course with `internalMax > 0` and refuse with a coded 409 naming the courses (or let the controller confirm a course is external-only). Show the same list on the session page before the run.

**Files:** `apps/web/src/lib/exam-cell-marks.ts` (runResults 413–520, internal at 442); `apps/web/src/lib/exam-cell-rules.ts` (courseOutcome 107–126; `m.internalMilli ?? 0` at 109); `apps/web/src/lib/exam-cell-academics.ts` (internalsFor 173–188)

### Medium

<a id="qa-06"></a>
#### QA-06 · A guardian who has just paid online is told "Nothing is due to pay" when the gateway's webhook settles the same payment at the same moment

- **Type:** Functional · **Severity:** Medium · **Platform:** Both
- **Feature:** Fees online checkout
- **From:** F-1 (layer 6)

**Steps**

1. `zz.admin@zz.test` (minted) saves a TEST gateway account at ZZ Northgate (values made by the script, removed after).
2. `zz.parent01@zz.test` (minted) calls `POST /api/v1/fees/family/checkout` for zz.pupil01's Term 2 (₹12,500): 201, an order on the devbox gateway.
3. At the same moment, send the checkout page's confirm (`POST /api/v1/fees/family/checkout/confirm` with the handler signature) and the gateway's signed `payment.captured` webhook for the same order.

**Expected:** Both answer 2xx; the one that loses is told `already`, as `settleOnlinePayment` promises.

**Actual:** Three rounds of three: the webhook `200 {"outcome":"settled"}`, the guardian's confirm `403 "Nothing is due to pay."`. One receipt, the payment PAID, the money right. Two confirms at once (a double tap) give `[403, 200]` too. The person who paid sees a refusal straight after paying, which reads as a failed payment. Only the webhook-first order was seen.

**Suggested fix:** Inside the transaction, lock the FeePayment row (`SELECT … FOR UPDATE`) and re-read its status first; PAID or REFUNDED returns `already` with the receipt. The same lock closes the webhook's side.

**Files:** `apps/web/src/lib/fees-payments.ts` (settleOnlinePayment 373–391, openDemands/allocate 44–66, confirmOnlineCheckout 407–416); `apps/web/src/app/api/webhooks/razorpay/[schoolId]/route.ts`

<a id="qa-07"></a>
#### QA-07 · College accounts: the mess bill and the route fee are billed twice when pressed in another language

- **Type:** Unit · **Severity:** Medium · **Platform:** Web
- **Feature:** College fees: mess and transport billing
- **From:** U-4 (layer 2)

**Steps**

1. No account: `npx vitest run tests/college-money-reads.test.ts` (ZZ CMoney College and its ACCOUNTS member, made by the test).
2. The accounts member, in English, bills the mess for 2026-10: one boarder billed.
3. The same member (or a colleague) with Hindi as their language bills 2026-10 again.

**Expected:** `{ billed: 0, already: 1 }`.

**Actual:** `{ billed: 1, already: 0 }`: the boarder now owes the month twice. The route fee does the same in Marathi. `raiseOnce` matches on the demand's label, and `getT()` translates the label into the presser's language. Held by two `it.fails` tests.

**Suggested fix:** Decide "once" on something language-free (a key such as `MESS:2026-10:<hostelId>` or `ROUTE:<routeId>:<term>`, or the head plus the month), and write the label in the institution's own language.

**Files:** `apps/web/src/lib/college-fees.ts` (raiseOnce, billMess, raiseRouteFees ~360–424)

<a id="qa-08"></a>
#### QA-08 · The PF return (ECR) splits the employer's share with ₹1 too much on every line

- **Type:** BDD · **Severity:** Medium · **Platform:** Web
- **Feature:** Payroll statutory exports
- **From:** BDD-1 (layer 3)

**Steps**

1. As `zz.admin@zz.test` (minted), `GET /api/v1/admin/payroll/runs/2026-08/export/pf-ecr`.
2. Read `content`.

**Expected:** For EPF wages of ₹15,000: employee ₹1800, EPS ₹1250, EPF−EPS difference ₹550; the two employer columns add to ₹1800; `totalPaise` equals what the lines remit.

**Actual:** Every line reads `…#~#1800#~#1250#~#551#~#0#~#0`, so the employer columns add to ₹1801. `totalPaise` is 1,080,000 (₹10,800) while the lines add to ₹10,803. EPS (1249.5) and the difference (550.5) are each rounded on their own.

**Suggested fix:** Round EPS first, then take the difference in rupees (`epsR = rupees(eps); diffR = rupees(er.paise) - epsR`). Add a unit test on a ₹15,000 wage; EPFO's upload checks that the difference equals EE − EPS.

**Files:** `apps/web/src/lib/payroll.ts:610,` 653–657; `apps/web/src/lib/payroll-rules.ts:147`

<a id="qa-09"></a>
#### QA-09 · The exam marks sheet shows a locked internal mark as missing

- **Type:** E2E · **Severity:** Medium · **Platform:** Both
- **Feature:** College exam cell: marks sheet
- **From:** E2E-B5 (layer 5B)
- **Status:** Fixed, <commit pending>, with QA-05: `marksSheet` reads the lock under `${studentMembershipId}|${courseId}`. Test: `apps/web/tests/exam-cell-internals-missing.test.ts`.

**Steps**

1. The QA-05 session at sac. PHY301's internals are locked by the HOD (27.9, 37.7, 30.5).
2. As `sac.exams@demo.relay.test`, `GET /api/v1/exam-cell/sessions/{id}/marks?courseId=<PHY301>`.

**Expected:** `internalMilli` 27900… and `internalLocked: true`, as the run itself reads them.

**Actual:** Every row reads `internalMilli: null, internalLocked: false`, for COM301 too. The sheet and the result disagree, and the controller cannot see which courses lack internals, which is how QA-05 went unnoticed. `internalsFor` keys its map `<student>|<course>`; `marksSheet` looks up `<course>|<student>`.

**Suggested fix:** Look up `${f.studentMembershipId}|${course.id}` in `marksSheet`, and add a unit test on a locked course's sheet.

**Files:** `apps/web/src/lib/exam-cell-marks.ts` (marksSheet 81–87); `apps/web/src/lib/exam-cell-academics.ts:185`

<a id="qa-10"></a>
#### QA-10 · Two people's first mark entries at the same moment answer 500 and lose one entry

- **Type:** E2E · **Severity:** Medium · **Platform:** Web
- **Feature:** College exam cell: double entry of marks
- **From:** E2E-B4 (layer 5B)

**Steps**

1. A sac session in CONDUCT; PHY301 with three students and no marks yet.
2. `sac.exams@demo.relay.test` and `sac.registrar@demo.relay.test` each `POST /api/v1/exam-cell/sessions/{id}/marks {courseId: PHY301, entries: [3]}` at the same moment (the double-entry design's normal case).

**Expected:** One becomes entry one and the other entry two, or the second is told to retry.

**Actual:** The registrar's 200 (`pending 3`); sac.exams' 500 "Something went wrong". Every row is entry one by the registrar; the controller's entries are lost. Both transactions saw no version 1 and the second hit `ExamMark_sessionId_courseId_studentMembershipId_version_key`.

**Suggested fix:** In `enterMarks`, lock the course's rows first (`SELECT … FOR UPDATE` on ExamSession, as `runResults` does), or catch P2002 and re-run the student's branch as entry two.

**Files:** `apps/web/src/lib/exam-cell-marks.ts` (enterMarks 118–175, create at 141)

<a id="qa-11"></a>
#### QA-11 · A declined certificate ask leaves its fee owed

- **Type:** E2E · **Severity:** Medium · **Platform:** Both
- **Feature:** Certificate requests
- **From:** E2E-A5 (layer 5A)

**Steps**

1. `sunrise.parent02@demo.relay.test` asks for a study certificate for Bhavya Shinde.
2. `sunrise.admin@demo.relay.test` sets a ₹100 fee (`POST …/certificate-requests/<id>/fee`): a demand on Bhavya's ledger.
3. sunrise.admin declines the ask with a reason.

**Expected:** The fee of a declined (or cancelled) ask is cancelled with it.

**Actual:** The ask is DECLINED with `feePaise 10000, feePaid false`, and the demand stays OPEN ₹100 on the pupil's ledger and the guardian's fees. `declineRequest` and `cancelRequest` never touch `feeDemandId`.

**Suggested fix:** In both, cancel the linked demand when nothing is paid on it (CANCELLED, recomputed), and decide what happens to a paid one.

**Files:** `apps/web/src/lib/certificate-requests.ts` (cancelRequest 137–147, declineRequest 168–186)

<a id="qa-12"></a>
#### QA-12 · One certificate ask is issued twice when the office and the head press Issue together

- **Type:** E2E · **Severity:** Medium · **Platform:** Both
- **Feature:** Certificates
- **From:** E2E-A4 (layer 5A)

**Steps**

1. `sunrise.parent02@demo.relay.test` asks for a bonafide for Bhavya Shinde ("passport application").
2. `sunrise.admin` and `sunrise.principal` call `POST /api/v1/office/certificates {templateId, studentMembershipId, requestId}` at once.

**Expected:** One paper; the second press is answered with the paper already issued, or refused.

**Actual:** Both 200: `BC/2026–27/0002` and `BC/2026–27/0003`, both valid at the public check. The request points at 0003; the family's certificates screen (web and phone) lists both. A legal paper exists in duplicate, one of them orphaned.

**Suggested fix:** Claim the request first (`updateMany where id, status: PENDING → ISSUING/ISSUED`) inside the issue's transaction and refuse when it matches nothing. Today `markRequestIssued` checks and writes in two statements after the paper exists.

**Files:** `apps/web/src/lib/certificates.ts` (issueCertificate 250–330); `apps/web/src/lib/certificate-requests.ts` (markRequestIssued 219–224)

<a id="qa-13"></a>
#### QA-13 · The email-verification token is spent on a GET, so a mail scanner verifies a squatted account

- **Type:** Security · **Severity:** Medium · **Platform:** Web
- **Feature:** Email verification and account squatting
- **From:** SEC-3 (layer 7)

**Steps**

1. Signed out, by code: register an account under a victim's address (unverified), for example `POST /api/v1/auth/recruiter/register`.
2. The verification mail with `GET /verify?token=…` goes to the victim's inbox.
3. The victim's mail client or a link-prefetching scanner fetches the URL.

**Expected:** The token is spent only on a deliberate action (a POST behind a continue page), the pattern assessment item 22 established for magic links.

**Actual:** `/verify` calls `verifyEmailByToken(token)` during the GET render (`verify/page.tsx:43`), with no session and no POST. A prefetch marks the attacker's squatted account verified. Once verified, SSO links to it without reclaiming (`sso.ts:443`), so the attacker keeps the account the owner believes is theirs. Reasoned from the code path; not tried against a real scanner.

**Suggested fix:** Move the spend to a POST behind a continue page, as the magic link now does.

**Files:** `apps/web/src/app/verify/page.tsx:43`; `apps/web/src/lib/passwords.ts` (verifyEmailByToken); `apps/web/src/lib/sso.ts:443`

<a id="qa-14"></a>
#### QA-14 · A student accepts two offers at once and holds both

- **Type:** E2E · **Severity:** Medium · **Platform:** Both
- **Feature:** Placement offers
- **From:** E2E-B3 (layer 5B)

**Steps**

1. At sac, `demo.recruiter01@demo.relay.test` makes non-dream offers to sac.student01 on two drives (₹6,50,000 and ₹5,00,000).
2. `sac.student01@demo.relay.test` calls `POST /api/v1/student/placement/offers/{A}` and `…/{B}` with `{accept: true}` at the same moment (two tabs).

**Expected:** One acceptance; the second refused with `placement.refuseOneOffer` (neither is a dream offer).

**Actual:** Both 200 (`acceptedAt` 06:50:29.621 and .622); both accepted, `dreamException: false`. The cell's analytics, the NBA/NIRF placement counts and the next drive's one-offer check now see two acceptances. The rule's `earlier` is read outside any lock.

**Suggested fix:** Take the acceptance under a per-student lock (`SELECT … FOR UPDATE` on the PlacementProfile, or a partial unique index on `Offer(studentMembershipId)` where accepted, not declined and not a dream exception) and re-read `earlier` inside the transaction.

**Files:** `apps/web/src/lib/placement.ts` (answerOffer 946–961)

<a id="qa-15"></a>
#### QA-15 · A clinical logbook entry saved offline is not sent when the network returns

- **Type:** E2E · **Severity:** Medium · **Platform:** Mobile
- **Feature:** Clinical logbook; the phone's offline queue
- **From:** E2E-B2 (layer 5B)

**Steps**

1. Phone web target as `sih.student01@demo.relay.test` (login door), `/clinical-logbook`, on the current Surgical ward posting.
2. Network off. New entry, a note, Save the entry.
3. Network back on. Wait 20 s.

**Expected:** The screen shows the entry waiting (the outbox badge the register, lecture, warden and quiz screens show) and sends it when the network returns, as the warden's roll call was sent in the same test.

**Actual:** The notice says the entry will send when back, but no badge is shown and the entry is not listed. Nothing was posted in 20 s and the server had 0 rows. The entry went only when a second entry was saved online, and reached the server after it. On a phone the row sits in SQLite until some other screen starts the runner, so a student who uses only the logbook never gets it to the supervisor.

**Suggested fix:** Call `useOutboxRunner()` in the student's logbook screen, show `<OutboxBadge tag="clinical-logbook" />`, and list a queued entry as waiting; better, start the runner once at the app's root.

**Files:** `apps/mobile/src/screens/college/clinical.tsx` (save ~229); `apps/mobile/src/screens/teacher/support.tsx` (useOutboxRunner, OutboxBadge, postOrQueue); `apps/mobile/src/lib/outbox-runner.ts`

<a id="qa-16"></a>
#### QA-16 · Two teachers are told to cover one lesson

- **Type:** E2E · **Severity:** Medium · **Platform:** Both
- **Feature:** Substitutions
- **From:** E2E-A7 (layer 5A)

**Steps**

1. Today's board at Sunrise (Farida Sheikh away); Grade 6 · A Period 2 uncovered.
2. `sunrise.admin` names Anjum Qureshi and `sunrise.principal` names Arjun Mehta for it at the same moment (`POST /api/v1/office/substitutions`).

**Expected:** One is stored and the other is told it changed meanwhile, or the second replaces the first and the first teacher is released.

**Actual:** Both answer `200 {"changed":true}`; both teachers are told "Please cover English for Grade 6 · A, Period 2"; both audits say `replaced: false`; one row (Anjum). Arjun is never told he is not needed. The clash check is read-then-write the same way, so double-booking one teacher by two people is likely too (untested).

**Suggested fix:** Decide `existing` inside a transaction with the row locked (or an upsert that compares the previous substitute), release the replaced person, and run the clash check under the same lock.

**Files:** `apps/web/src/lib/substitutions.ts` (assignSubstitute 207–245)

<a id="qa-17"></a>
#### QA-17 · Only the newest open admission cycle takes applications

- **Type:** E2E · **Severity:** Medium · **Platform:** Both
- **Feature:** Admissions cycles
- **From:** E2E-A6 (layer 5A)

**Steps**

1. Sunrise has the seeded OPEN "Admissions 2027–28". `sunrise.admin` creates and opens a second cycle (mid-year, this year).
2. `svm.parent10@demo.relay.test` reads `GET /api/v1/shared/schools/<Sunrise>/admissions`, then applies to the seeded 2027–28 cycle.

**Expected:** Every OPEN cycle within its dates is offered and takes applications (a mid-year transfer cycle beside next year's admissions is the ordinary case).

**Actual:** The family sees only the newest cycle, and applying to the seeded one answers `403 "That cycle is not open."` while the office's list shows it OPEN.

**Suggested fix:** Return every open cycle from `openCycleOf` and let `apply` accept any cycle open by its dates; or, if one open cycle per school is the rule, refuse opening a second in `setCycleStatus`.

**Files:** `apps/web/src/lib/admissions.ts` (openCycleOf 352–360, apply 447–455, setCycleStatus 248–257)

<a id="qa-18"></a>
#### QA-18 · A plan-locked screen on the phone is a red error with a Try again that can only fail

- **Type:** UI-UX · **Severity:** Medium · **Platform:** Mobile
- **Feature:** Person plans on the phone
- **From:** UI-15 (layer 4)

**Steps**

1. As `zz.operator@zz.test` (minted), switch EXPERT_SESSIONS and QUESTION_BANK on and make the plans active (layer 4 did, and switched them back off).
2. As the fixture expert (minted), open Availability, Mentoring or Sessions on :8081; as `zz.cstudent02@zz.test`, open Practice.

**Expected:** What the web shows on the same page: "Expert sessions needs a plan", what the plan includes, its price and a Subscribe button.

**Actual:** A red error card, "This needs the Expert plan, which you do not hold yet.", and a Try again that can only fail again. The doors answer 402 PLAN_REQUIRED and the phone treats it as a failure; its PlanCard is drawn only on the Account screen.

**Suggested fix:** On a 402 with `code: PLAN_REQUIRED`, render PlanCard for that plan in place of the screen's error, as the web's `featurePageLock` does.

**Files:** `apps/mobile/src/screens/shared/plan-card.tsx`; `apps/mobile/src/screens/expert/*`; `apps/mobile/src/screens/practice/*`; the phone's shared error component

<a id="qa-19"></a>
#### QA-19 · Links lead limited roles to pages they may not open

- **Type:** UI-UX · **Severity:** Medium · **Platform:** Web
- **Feature:** Global feed, placement analytics, people links
- **From:** UI-01 (layer 4)

**Steps**

1. As `zz.driver01@zz.test` (minted), open `/bulletin/global` and press "← Our school's feed", "Upcoming birthdays →" or a post's Comment.
2. The same as `zz.librarian` and `zz.warden`.
3. As `zz.iqac` (ZZ Vidya), open `/placement/analytics` and press its tabs Season, Drives, Students or Companies.
4. As `zz.alumni01`, open `/remarks/people` and press a person's name or picture.

**Expected:** A role is offered only links its gate lets through, or the link is drawn as text.

**Actual:** Each link lands on `/switch`, "Where would you like to go?", offering the one context the person already has. Reproduced at both widths, both themes and in Hindi (71 loads).

**Suggested fix:** Pass the viewer's role into the feed header, FeedFilters, PostCard and the placement tab strip and leave out (or un-link) what `role-gate.ts` refuses; link `/people/<id>` only for roles that read profiles.

**Files:** `apps/web/src/app/(app)/bulletin/global/page.tsx:66`; `apps/web/src/app/(app)/bulletin/feed-filters.tsx:119`; `apps/web/src/app/(app)/bulletin/post-card.tsx`; `apps/web/src/components/placement/parts.tsx:88–91`; `apps/web/src/app/(app)/remarks/people/page.tsx:159,` 167; `apps/web/src/lib/role-gate.ts`

<a id="qa-20"></a>
#### QA-20 · Relative times stay English in Hindi and Marathi

- **Type:** UI-UX · **Severity:** Medium · **Platform:** Web
- **Feature:** Notifications, messages, feed, homes, office lists
- **From:** UI-02 (layer 4)

**Steps**

1. Set `zz.admin@zz.test`'s language to Hindi (the walk set `prefs.locale` and put it back).
2. Open `/notifications` at 390 px.

**Expected:** "2 घंटे पहले", "पिछले सप्ताह" (Intl.RelativeTimeFormat speaks hi and mr).

**Actual:** "2 hours ago", "7 days ago", "last week", "3 weeks ago" under Hindi sentences; the same on `/remarks`, `/bulletin` and `/teacher/assignments`, and in the due lines of the teacher's, parent's and student's homes.

**Suggested fix:** `relativeTime()` defaults to the English `LOCALE` and about thirty callers pass no locale. Pass the reader's locale (from `getT` or the request), or make the default read it.

**Files:** `apps/web/src/lib/dates.ts:325`; callers: notifications/page.tsx:151, remarks/page.tsx:152, 223, teacher/page.tsx:478, parent/page.tsx:466, 510, student/page.tsx:288, admin/people/page.tsx:312, 358 and the rest listed in ui.md

### Low

<a id="qa-21"></a>
#### QA-21 · Accepting a school invitation bypasses TOTP

- **Type:** Security · **Severity:** Low · **Platform:** Both
- **Feature:** School invitations; two-factor sign-in
- **From:** SEC-4 (layer 7)

**Steps**

1. By code: a TOTP-enabled account holder opens a school invitation link and accepts with the existing account's password (`invite/[token]/actions.ts:142`).
2. The accept calls `createSession(...)` at `:269` and `:454`.

**Expected:** The second factor is asked before a session is minted, as the magic-link and SSO paths do.

**Actual:** Password plus an invitation link mints a full session without the second factor. Reach is limited: the school-invite token is only emailed, so the attacker needs the password and the emailed link. Not run end to end (it would type a password).

**Suggested fix:** Run the two-factor gate in the accept path before `createSession` when the account has TOTP on.

**Files:** `apps/web/src/app/invite/[token]/actions.ts:142,` 269, 454

<a id="qa-22"></a>
#### QA-22 · TOTP guessing has no per-account ceiling

- **Type:** Security · **Severity:** Low · **Platform:** Both
- **Feature:** Two-factor sign-in
- **From:** SEC-5 (layer 7)

**Steps**

1. By code: sign in with a known password; a TOTP challenge is minted per login.
2. Guess codes, rotating source addresses.

**Expected:** A per-account limit on second-step failures.

**Actual:** Limits are 5 attempts per challenge and 30 per address per 15 min, nothing keyed on the user. With login at 10 per 15 min per identity, about 50 code guesses per 15 min per account are reachable from rotating addresses (dev trusts the last X-Forwarded-For hop): on the order of 1 % a day for an attacker who already holds the password.

**Suggested fix:** Add a per-userId failure bucket on `auth.totp.failed` that locks the account's second step for a window.

**Files:** `apps/web/src/lib/two-factor.ts:51–55,` 237–265

<a id="qa-23"></a>
#### QA-23 · Turning TOTP on needs only a session, no password

- **Type:** Security · **Severity:** Low · **Platform:** Both
- **Feature:** Account security settings
- **From:** SEC-6 (layer 7)

**Steps**

1. By code: with a stolen live session, call `POST /api/v1/account/totp/start` and `/confirm`.

**Expected:** Enrolment asks for the password and revokes other sessions.

**Actual:** Both doors require only a session. A thief can enrol TOTP and, since disabling needs a code and a password reset does not clear TOTP, lock the owner out; enrolment revokes no other session. Not run end to end.

**Suggested fix:** Ask for the password before `startTwoFactor`/`confirmTwoFactor`, and revoke other sessions on enrolment.

**Files:** `apps/web/src/app/api/v1/account/totp/{start,confirm}/route.ts`; `apps/web/src/lib/two-factor.ts`

<a id="qa-24"></a>
#### QA-24 · A password-reset request is slower for registered accounts

- **Type:** Security · **Severity:** Low · **Platform:** Web
- **Feature:** Password reset
- **From:** SEC-7 (layer 7)

**Steps**

1. By code: request a reset for a registered address and for an unknown one with `EMAIL_TRANSPORT=smtp`.

**Expected:** The same response time either way.

**Actual:** `requestPasswordReset` writes the token and awaits the SMS or email before answering, only when the account exists, so latency tells a registered address from an unknown one. The limit is per identifier (3 / 15 min), so spraying distinct identifiers is unbounded.

**Suggested fix:** Send after the response (`after()`), as the magic link does.

**Files:** `apps/web/src/lib/passwords.ts` (~330–395)

<a id="qa-25"></a>
#### QA-25 · Public sign-up reveals which email addresses have an account

- **Type:** Security · **Severity:** Low · **Platform:** Both
- **Feature:** Recruiter and school sign-up
- **From:** SEC-8 (layer 7)

**Steps**

1. Signed out, `POST /api/v1/auth/recruiter/register` with an existing address (layer 7 used `zz.teacher1@zz.test`).

**Expected:** The same answer for a taken and a free address, with confirmation by email.

**Actual:** 422 with `issues.email` (`recruiter.refuseEmailTaken`); school registration answers `register.emailTakenLong`. Both check the whole User table, so any parent, pupil or staff address can be tested at 20 an hour per address. This matches the accepted `checkEmailAvailable` design: noted, not a regression.

**Suggested fix:** If wanted, answer the same way for taken and free addresses and confirm by email.

**Files:** `apps/web/src/lib/recruiters.ts:61–62`; `apps/web/src/app/register/actions.ts`

<a id="qa-26"></a>
#### QA-26 · The tenant resolver skips three checks getSession makes

- **Type:** Security · **Severity:** Low · **Platform:** Web
- **Feature:** Tenant fence (hardening)
- **From:** SEC-9 (layer 7)

**Steps**

1. By code: compare `tenant-request.ts:107–109` with `session.ts:283–287`.

**Expected:** The same checks on both paths.

**Actual:** `tenant-request.ts` does not re-check `user.disabledAt`, the 180-day absolute lifetime or the `x-edulink-owner` mismatch. No door was found that authorises through this resolver alone, so this is defence in depth.

**Suggested fix:** Apply the same three checks in `tenant-request.ts`.

**Files:** `apps/web/src/lib/tenant-request.ts`

<a id="qa-27"></a>
#### QA-27 · The operator's school edit stores a javascript: website and a contact email that is not one

- **Type:** Functional, Security · **Severity:** Low · **Platform:** Web
- **Feature:** Operator: school details
- **From:** F-2 (layer 6)

**Steps**

1. As `zz.operator@zz.test` (minted session), `PATCH /api/v1/operator/schools/<ZZ Banyan> {"website":"javascript:alert(1)"}`.
2. Then `{"contactEmail":"not an email"}`.

**Expected:** 422 for both, as the office's own form refuses them (website must start with http(s)://, the email must be one).

**Actual:** `200 {"ok":true}` both times, both stored (put back afterwards). The website is drawn as a link on the families' school page (`/explore/[schoolId]`, `href={school.website}`); the contact email is where the platform writes to the school. Whether a browser would run the link was not tested (React and the CSP should both refuse it).

**Suggested fix:** Validate the operator's body like the office's in `operatorSchoolUpdateBodySchema`, and refuse anything but http(s) where `website` is rendered as a link.

**Files:** `packages/contracts/src/v1/operator.ts:176`; `apps/web/src/lib/superuser.ts` (updateSchool ~326–328); `apps/web/src/lib/validation.ts:57`; `apps/web/src/app/(app)/explore/[schoolId]/page.tsx:108`

<a id="qa-28"></a>
#### QA-28 · SSO: a provider's keys endpoint being down is a 500, not "sign-in failed"

- **Type:** Unit · **Severity:** Low · **Platform:** Web
- **Feature:** SSO sign-in
- **From:** U-2 (layer 2)

**Steps**

1. No account: `npx vitest run tests/sso-callback.test.ts` (a made-up Microsoft client id, `fetch` stubbed).
2. The token endpoint answers a token; the keys endpoint answers 503.

**Expected:** `completeSso` answers `{ ok: false, reason: "token" }` and the callback sends the person to `/login` with "failed".

**Actual:** `fetchJwks` throws, `completeSso` does not catch it, and the callback route would answer 500. Held by an `it.fails` test.

**Suggested fix:** Wrap `verifyIdToken` in `completeSso` (or `fetchJwks`) in try/catch, answer `reason: "token"`, and log it.

**Files:** `apps/web/src/lib/sso.ts` (fetchJwks 205–213, completeSso 328–380); `apps/web/src/app/api/sso/[provider]/callback/route.ts`

<a id="qa-29"></a>
#### QA-29 · A double press of Publish tells every student and guardian twice

- **Type:** E2E · **Severity:** Low · **Platform:** Both
- **Feature:** College exam results
- **From:** E2E-B6 (layer 5B)

**Steps**

1. As `sac.exams@demo.relay.test`, press Publish on a DRAFT run twice at once (`POST …/results/publish {runId}` ×2).

**Expected:** One publication and one notice each.

**Actual:** Both 200. The second press re-ran the transaction (backlogs and credits unchanged), and students got `examCell.notifyResult` twice (10 notices for 5); the minor's guardian got `riskDecisions.notifResultFamily` twice. The PUBLISHED check is read before the lock.

**Suggested fix:** Re-read the run's status after `FOR UPDATE` inside the transaction and return early, with no notices, when it is already PUBLISHED.

**Files:** `apps/web/src/lib/exam-cell-marks.ts` (publishRun 522–583)

<a id="qa-30"></a>
#### QA-30 · Accepting one recruiter requirement twice at once makes two drives

- **Type:** E2E · **Severity:** Low · **Platform:** Web
- **Feature:** Placement requirements
- **From:** E2E-B7 (layer 5B)

**Steps**

1. `demo.recruiter01@demo.relay.test` posts a requirement to sac.
2. `sac.tpo@demo.relay.test` presses Accept twice at once (`POST /api/v1/placement/requirements/{id}/accept` ×2).

**Expected:** One drive; the second press answered with it.

**Actual:** Both 200 with two DRAFT drives of one requirement. No unique constraint holds `(schoolId, requirementId)`.

**Suggested fix:** A unique index on `Drive(schoolId, requirementId)` where `requirementId` is not null; catch P2002 and return the existing drive.

**Files:** `apps/web/src/lib/placement.ts` (acceptRequirement 495–512); `apps/web/prisma/schema.prisma` (Drive)

<a id="qa-31"></a>
#### QA-31 · Applying to a drive from two devices at once answers 500

- **Type:** E2E · **Severity:** Low · **Platform:** Both
- **Feature:** Placement applications
- **From:** E2E-B8 (layer 5B)

**Steps**

1. `sac.student01@demo.relay.test` sends `POST /api/v1/student/placement/drives/{id}/apply {consent: true}` from two devices at once.

**Expected:** One 200 and one 409 "already applied".

**Actual:** 200 and 500. One application is stored (the unique key holds); the second device shows "Something went wrong".

**Suggested fix:** Catch P2002 on `driveId_studentMembershipId` and answer `placement.refuseApplied` (or the application as it stands).

**Files:** `apps/web/src/lib/placement.ts` (applyToDrive 897–925)

<a id="qa-32"></a>
#### QA-32 · Accepting and declining one offer at once stamps both

- **Type:** E2E · **Severity:** Low · **Platform:** Both
- **Feature:** Placement offers
- **From:** E2E-B9 (layer 5B)

**Steps**

1. `sac.student02@demo.relay.test` has one offer on a drive.
2. `POST /api/v1/student/placement/offers/{id}` with `{accept: true}` and `{accept: false}` at once.

**Expected:** One answer stands; the other is told the offer is answered.

**Actual:** Both 200. The row has `acceptedAt` and `declinedAt` set to the same instant; the drive view calls the student SELECTED.

**Suggested fix:** `updateMany where id, acceptedAt: null, declinedAt: null` and refuse when it matches nothing (with QA-14's lock).

**Files:** `apps/web/src/lib/placement.ts` (answerOffer 946–961)

<a id="qa-33"></a>
#### QA-33 · Two recruiters offering at once each see their own package; the last write is kept

- **Type:** E2E · **Severity:** Low · **Platform:** Web
- **Feature:** Placement offers
- **From:** E2E-B10 (layer 5B)

**Steps**

1. `demo.recruiter01@demo.relay.test` offers sac.student01 ₹6,00,000 while `recruiter.sahyadri@demo.relay.test` (same company) offers ₹6,50,000, at once.

**Expected:** One offer; the second told it changed meanwhile, or replaced with an audit row saying so.

**Actual:** Both 200, each echoing its own package. The stored offer is ₹6,50,000 by recruiter.sahyadri while demo.recruiter01's screen says ₹6,00,000 was recorded. The student was notified twice.

**Suggested fix:** Create-only for a fresh offer (`create`, P2002 → "an offer stands; edit it"); edits through an explicit change with the previous package in the audit.

**Files:** `apps/web/src/lib/placement.ts` (recordOffer 745–793)

<a id="qa-34"></a>
#### QA-34 · An IQAC sign-off and a return at the same moment both stand

- **Type:** E2E · **Severity:** Low · **Platform:** Both
- **Feature:** IQAC filings (AQAR)
- **From:** E2E-B13 (layer 5B)

**Steps**

1. `sac.iqac@demo.relay.test` submits the AQAR 2026–27.
2. `sac.principal@demo.relay.test` sends `POST /api/v1/iqac/filings/{id}/signoff` with SIGN (web) and RETURN with a note (phone) at the same moment.

**Expected:** One decision; the other 409 "not waiting".

**Actual:** Both 200. The row reads RETURNED with `signedOffAt` set; the principal's decision log has both decisions 2 ms apart and the IQAC was told both.

**Suggested fix:** `updateMany where id, status: "AWAITING_SIGNOFF"`, refuse on zero, and clear `signedOffAt` on a return.

**Files:** `apps/web/src/lib/iqac-filings.ts` (signOffFiling 352–363)

<a id="qa-35"></a>
#### QA-35 · The same logbook clientId sent twice at once answers 500

- **Type:** E2E · **Severity:** Low · **Platform:** Mobile
- **Feature:** Clinical logbook; offline replay
- **From:** E2E-B14 (layer 5B)

**Steps**

1. `sih.student04@demo.relay.test` posts one logbook entry twice at the same moment with one `clientId` (the outbox's replay racing the first send).

**Expected:** Both answer the one entry (the door is "idempotent by clientId").

**Actual:** 200 and 500. One row is kept; the phone keeps the 500 as a retry and the server logs an error.

**Suggested fix:** Catch P2002 on `studentMembershipId_clientId` and return the existing id.

**Files:** `apps/web/src/lib/clinical.ts` (saveLogbookEntry 477–500)

<a id="qa-36"></a>
#### QA-36 · Concurrent first reads of a late pass invoice fail

- **Type:** Unit · **Severity:** Low · **Platform:** Web
- **Feature:** Pass invoices
- **From:** U-1 (layer 2)

**Steps**

1. No account: `npx vitest run tests/pass-orders-refusals.test.ts` (ZZ PassQ school and its teacher, made by the test).
2. The teacher buys a month of the TEACHER pass while the company's GSTIN is blank (the capture writes no invoice).
3. The GSTIN is set; three reads of the invoice arrive together (`passInvoiceView` ×3, as a double tap on web and phone would).

**Expected:** All three answer the one invoice.

**Actual:** One answers; the others throw `Unique constraint failed on the fields: (passOrderId)` (a 500 at the door). The invoice is issued once and no number is lost; 3 of 3 runs. The late invoice also takes the read's date and financial year, not the payment's.

**Suggested fix:** Take the series lock (`nextPassNumber`'s `FOR UPDATE` on GigSettings) before re-reading `invoiceId`, or catch P2002 and re-read; decide which date a late invoice carries.

**Files:** `apps/web/src/lib/pass-orders.ts` (passInvoiceView ~518–530, nextPassNumber 371–376, writePassInvoice 384–)

<a id="qa-37"></a>
#### QA-37 · A losing double press reads as a failure (expert approval, pass refund)

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Operator desks: expert applications, pass refunds
- **From:** E2E-B16 (layer 5B)

**Steps**

1. As `zz.operator@zz.test` (minted), approve one expert application twice at once.
2. As zz.operator, refund one pass twice at once.

**Expected:** The second press is answered with what the first did ("already approved", "already refunded").

**Actual:** Approval: 200 and `422 "This email address already has an expert account. Refuse the application as a duplicate."`, telling the operator to refuse what they just approved. Refund: 200 and `422 "Only a paid pass can be refunded."`. The data is right in both.

**Suggested fix:** In `decideExpertApplication`, re-read the application on P2002 and answer `alreadyDecided`; in `refundPassOrder`, answer the order as REFUNDED when it was refunded meanwhile.

**Files:** `apps/web/src/lib/expert-applications.ts` (~395–399); `apps/web/src/lib/pass-orders.ts` (refundPassOrder 602–616)

<a id="qa-38"></a>
#### QA-38 · An empty 200 from either gateway is a TypeError, not a gateway error

- **Type:** Unit · **Severity:** Low · **Platform:** Web
- **Feature:** Fees and sessions gateways
- **From:** U-3 (layer 2)

**Steps**

1. No account: `npx vitest run tests/gateway-live-transport.test.ts`; the stubbed gateway answers 200 with an empty body.

**Expected:** A `GatewayError` the caller already handles.

**Actual:** `call` returns null and `createOrder` throws a bare TypeError (reading `id` of null). No order is recorded without an id.

**Suggested fix:** In both adapters' `call`, refuse a 2xx whose body is not a JSON object with a GatewayError / GigGatewayError.

**Files:** `apps/web/src/lib/gateway.ts` 76–87; `apps/web/src/lib/gig-gateway.ts` (call)

<a id="qa-39"></a>
#### QA-39 · The scholarship reconciliation sheet's order has no tie-break

- **Type:** Unit · **Severity:** Low · **Platform:** Web
- **Feature:** Scholarships
- **From:** U-5 (layer 2)

**Steps**

1. No account: two claims made in the same millisecond, then the reconciliation sheet read twice (tests/college-money-reads.test.ts).

**Expected:** The same order, and the same serial numbers, on every download.

**Actual:** The two claims came out in either order across runs; the sheet orders by `createdAt` only.

**Suggested fix:** `orderBy: [{ createdAt: "asc" }, { id: "asc" }]`.

**Files:** `apps/web/src/lib/scholarships.ts` (reconciliationSheet)

<a id="qa-40"></a>
#### QA-40 · Every counter reversal is reported as drift by data:audit

- **Type:** Functional · **Severity:** Low · **Platform:** Web
- **Feature:** Fees ledger; data audit
- **From:** E2E-A14 (layer 5A)

**Steps**

1. `sunrise.admin@demo.relay.test` reverses a PAID payment (`POST /api/v1/fees/payments/<id>/reverse`).
2. `npm run data:audit`.

**Expected:** A reversal made through the office's own door is not drift.

**Actual:** `fee-payment WARN: payment … is REVERSED yet still holds 750000 in allocations` (four, all from layer 5A's run; they are four of the six WARNs every later layer saw). Reversal keeps allocation rows by design and `recomputeDemands` filters by status, so the money is right; the check and the code disagree and the noise hides real drift.

**Suggested fix:** Drop the allocations on reversal (they are recoverable from the audit row), or teach the check that REVERSED keeps them.

**Files:** `apps/web/tests/data-audit.test.ts:290`; `apps/web/src/lib/fees-payments.ts:279–297`

<a id="qa-41"></a>
#### QA-41 · A circular reminder says "texted 3" when no text went

- **Type:** Functional · **Severity:** Low · **Platform:** Web
- **Feature:** Circular reach
- **From:** E2E-A9 (layer 5A)

**Steps**

1. `sunrise.admin@demo.relay.test` publishes a circular to Grade 5 parents; two acknowledge.
2. `POST /api/v1/shared/bulletin/<id>/remind`.

**Expected:** `texted` counts texts handed to the sender.

**Actual:** `{"reminded":3,"texted":3}` while all three OutboundMessage rows are `SKIPPED feature-off` (texts are off). The reach report counts only SENT/DELIVERED, so the two disagree.

**Suggested fix:** Return the number of texts actually queued or sent by `tell`, not `guardianIds.size`.

**Files:** `apps/web/src/lib/circulars.ts:297` (remindCircular)

<a id="qa-42"></a>
#### QA-42 · A student's exam form never says whether its fee is paid or waived

- **Type:** UI-UX · **Severity:** Low · **Platform:** Both
- **Feature:** College exam forms
- **From:** E2E-B19 (layer 5B)

**Steps**

1. `sac.student02@demo.relay.test`'s form was approved with the fee waived (demand WAIVED); `sac.student01`'s demand is OPEN.
2. Each reads `GET /api/v1/exam-cell/mine` (web /student/exams, phone college exams).

**Expected:** The fee line says open, paid or waived.

**Actual:** `demandStatus: null` for every form; the page prints "Fee ₹300" alike for a waived and an unpaid fee.

**Suggested fix:** Read the demands' statuses in `myExams` as `sessionView` does (exam-cell-after.ts:82).

**Files:** `apps/web/src/lib/exam-cell-after.ts:259`

<a id="qa-43"></a>
#### QA-43 · A seat in next year's cycle cannot be given before the year begins

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Admissions (owner decision)
- **From:** E2E-A8 (layer 5A)

**Steps**

1. Next-year cycle (2027–28), an application offered and accepted (`svm.parent10@demo.relay.test`).
2. As `sunrise.admin`, `POST …/admit {}` and `{admittedOn: <the year's first day>}`.

**Expected:** The office can complete an admission months ahead, dated the year's first day.

**Actual:** Both `403 "The admission date must be between the start of the academic year and today."`; an accepted family waits until June 2027.

**Suggested fix:** A decision for the owner. If wanted, allow `admittedOn` = the year's start for a future year and keep the membership pending until then.

**Files:** `apps/web/src/lib/admissions.ts:916`

<a id="qa-44"></a>
#### QA-44 · A library renewal is refused for a reader whose reservation is already satisfied

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Library loans
- **From:** E2E-A10 (layer 5A)

**Steps**

1. `sunrise.librarian@demo.relay.test` adds a title with three copies and lends two to Bhavya Shinde.
2. `sunrise.parent01` reserves the title for Advait; the reservation is at once ready with copy 3 held.
3. The desk renews Bhavya's loan.

**Expected:** Renewed; nobody is waiting for a copy.

**Actual:** `403 "Someone is waiting for this book, so it cannot be renewed."` three times; the count includes reservations already ready.

**Suggested fix:** Count only reservations with `readyAt` null.

**Files:** `apps/web/src/lib/library.ts:860` (renewLoan); the same count at 279 (canRenew)

<a id="qa-45"></a>
#### QA-45 · The hostel gate lets a boarder out before the leave begins

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Hostel leave and gate
- **From:** E2E-A11 (layer 5A)

**Steps**

1. `sunrise.parent33@demo.relay.test` asks local leave for Lavanya Kulkarni from now + 45 s; `sunrise.warden@demo.relay.test` approves.
2. The warden presses Out at once.

**Expected:** Refused before `fromAt` (or a warning), as a late return is checked against `toAt`.

**Actual:** 200, with `outAt` 41 s before the leave's start; nothing checks either end of the window on the way out.

**Suggested fix:** In `gateOut`, refuse before `fromAt` (with a small grace) and after `toAt`.

**Files:** `apps/web/src/lib/hostel.ts:515` (gateOut)

<a id="qa-46"></a>
#### QA-46 · A route's evening stop times may run backwards

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Transport routes
- **From:** E2E-A12 (layer 5A)

**Steps**

1. `sunrise.admin@demo.relay.test` makes a BOTH route whose evening times increase in the morning's stop order (12:04, 12:14, 12:24).
2. The evening trip runs stop 3 → 1 (`sunrise.driver01@demo.relay.test`).

**Expected:** Refused (each run's times ascend along its own order), or re-ordered.

**Actual:** Accepted; the driver's phone reads "First stop at 12:24" over a list 12:24, 12:14, 12:04, and "missed" is read from 12:24.

**Suggested fix:** In `checkStopTimes`, require morning times ascending in stop order and evening times ascending in reverse order.

**Files:** `apps/web/src/lib/transport.ts:213–219`

<a id="qa-47"></a>
#### QA-47 · Trip positions outside the window are reported as duplicates

- **Type:** Functional · **Severity:** Low · **Platform:** Mobile
- **Feature:** Transport live trips
- **From:** E2E-A13 (layer 5A)

**Steps**

1. `sunrise.driver01@demo.relay.test`, on a live trip, posts one position stamped tomorrow.

**Expected:** Refused (422) or counted as rejected.

**Actual:** `200 {"accepted":0,"duplicates":1}`; positions outside [start, now + slack] are filtered and reported under `duplicates`, so the phone's outbox treats them as delivered.

**Suggested fix:** Add `rejected` to the answer (`tripPositionsResultSchema`) and count dropped positions there.

**Files:** `apps/web/src/lib/transport.ts:792–821`; `packages/contracts/src/v1/transport.ts:326`

<a id="qa-48"></a>
#### QA-48 · The placement "joined" answer names nobody

- **Type:** E2E · **Severity:** Low · **Platform:** Web
- **Feature:** Placement offers
- **From:** E2E-B11 (layer 5B)

**Steps**

1. `demo.recruiter01@demo.relay.test` calls `POST /api/v1/placement/offers/{id}/joined {joinedOn}` for an accepted offer.

**Expected:** The offer view with the student's name, as `recordOffer` returns.

**Actual:** `"studentName": ""`.

**Suggested fix:** Pass the name map to `offerViews` in `recordJoined`, as `recordOffer` does.

**Files:** `apps/web/src/lib/placement.ts` (recordJoined 795–806)

<a id="qa-49"></a>
#### QA-49 · A patient's name passes the logbook's "names no patient" check

- **Type:** E2E · **Severity:** Low · **Platform:** Both
- **Feature:** Clinical logbook (owner decision)
- **From:** E2E-B15 (layer 5B)

**Steps**

1. `sih.student04@demo.relay.test` logs "Patient Ramesh Gaikwad, bed 4: dressing changed."

**Expected:** Refused, as the refusal sentence itself promises ("…what looks like a name…; a logbook names no patient").

**Actual:** 200, stored, and shown to the supervisor and the coordinator. Only digits, phones, emails, links and codes are caught.

**Suggested fix:** A product decision: at least flag a "Patient <Capitalised> <Capitalised>" pattern and a bed or IP number; otherwise reword the sentence so it does not promise name detection.

**Files:** `apps/web/src/lib/clinical.ts` (noteCarriesIdentifier 80–84)

<a id="qa-50"></a>
#### QA-50 · Demo experts' times are hidden from demo families, yet bookable by id

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Expert sessions (owner decision)
- **From:** E2E-B17 (layer 5B)

**Steps**

1. With EXPERT_SESSIONS on, `demo.expert01@demo.relay.test` offers a free one-to-one and a workshop.
2. `sunrise.pupil01` or `sunrise.parent01@demo.relay.test` reads `GET /api/v1/gigs/sessions`.
3. `sunrise.parent02` books the one-to-one by its slot id.

**Expected:** Demo families see the demo expert's open times, and a slot a reader is not shown cannot be booked.

**Actual:** `open: []` for every Sunrise child: `openFor` drops providers flagged `isTestFixture` unless the reader's school is a fixture school, and every `@demo.relay.test` account carries the flag. `bookSeat` does not apply the filter, so the booking by id succeeded (201 CONFIRMED).

**Suggested fix:** Decide whether demo schools read demo experts; apply the same provider rule in `bookSeat` as in `openFor`.

**Files:** `apps/web/src/lib/gig-sessions.ts` (openFor 572–577, bookSeat 691–697); `apps/web/src/lib/fixtures.ts`; `apps/web/scripts/demo-accounts.ts:130`

<a id="qa-51"></a>
#### QA-51 · Vidura answers "I am not sure" to a college student's attendance question

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Vidura, My records
- **From:** E2E-B18 (layer 5B)

**Steps**

1. With ASSISTANT on and the STUDENT plan inactive, `sac.student01@demo.relay.test` asks "What is my attendance percentage in each course this term?"

**Expected:** The RECORDS answer from the student's own door (the exam form holds 87.5 % MAT301, 91.7 % PHY301, 91.7 % PHY302).

**Actual:** Chip RECORDS, verdict ANSWERED, "I am not sure. You may check the /student/academics page…", with Ask a person. The router has no door for a college student's lecture attendance.

**Suggested fix:** Add the college attendance door to the records router for a STUDENT at a college, with an eval case.

**Files:** `apps/web/src/lib/assistant/router.ts`; `apps/web/src/lib/assistant/door-loaders.ts`; `apps/web/content/assistant-eval/`

<a id="qa-52"></a>
#### QA-52 · A transferred pupil's guardian lands on the school the child left

- **Type:** Functional · **Severity:** Low · **Platform:** Web
- **Feature:** Family home
- **From:** L1-02 (layer 1)

**Steps**

1. Sign in as `prakash.pawar@demo.relay.test` (login door; the guardian of Ishaan Pawar, who left Sunrise on 30/04/2026 and is now at Saraswati Vidya Mandir).
2. Open `/parent` with no `?child=`.

**Expected:** The child's current enrolment, with the old one a chip away.

**Actual:** The Sunrise membership that has ended is chosen, every sign-in: "Ishaan Pawar left Sunrise Public School on 30/04/2026" fills the page. The phone's first child was not checked.

**Suggested fix:** In `pickChild` (or the order `familyChildren` returns), prefer a membership with no `leftAt`.

**Files:** `apps/web/src/lib/family-child.ts:98`; `apps/web/src/app/(app)/parent/page.tsx`

<a id="qa-53"></a>
#### QA-53 · An expert under review is not told so on the phone while expert sessions are off

- **Type:** Functional · **Severity:** Low · **Platform:** Mobile
- **Feature:** Expert home (parity)
- **From:** L1-04 (layer 1)

**Steps**

1. Mint a session for `zz.expert4@zz.test` (an unpublished profile; zz-walk, deleted after).
2. Open the web `/expert`, then the phone's web target.

**Expected:** Both say the profile is being reviewed.

**Actual:** The web redirects to `/expert/pending` ("Your profile is being reviewed"). The phone shows "Bookings" and offers Profile, while `GET /api/v1/shared/expert/profile` answers 403 for this person; the under-review note sits behind a query disabled while EXPERT_SESSIONS is off.

**Suggested fix:** Read the expert's standing independently of the feature switch and show the review note first; do not offer Profile while the door refuses.

**Files:** `apps/mobile/src/screens/expert/home.tsx` (sessionsOn gate); `apps/web/src/app/api/v1/shared/expert/profile/route.ts`

<a id="qa-54"></a>
#### QA-54 · Refused input is answered 403 FORBIDDEN instead of 422

- **Type:** BDD, Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Website domains; calendar closures
- **From:** BDD-2 (layer 3) and F-3 item 4 (layer 6)

**Steps**

1. As `zz.admin@zz.test` (minted), `POST /api/v1/admin/site/domain {"domain":"localhost"}`.
2. As zz.admin, `POST /api/v1/admin/calendar/closures` with the end before the start, and with `2027-02-30`.

**Expected:** 422 naming the field, as the catalog says for refused input; "domain taken" as 409.

**Actual:** Step 1: `403 {"error":"That is not a domain name…","code":"FORBIDDEN"}` (and "taken" is a 403 too). Step 2: 403 FORBIDDEN ("The end date cannot be before the start date", "Start date is not a real date"). A client that reads 403 as "not allowed" shows the wrong message. Both throw `AccessError`.

**Suggested fix:** Answer these checks as a coded 422 (`apiInvalid` or `RuleRefusal`), and "taken" as 409.

**Files:** `apps/web/src/lib/site-domains.ts:221,` 231, 240; `apps/web/src/app/api/v1/admin/site/domain/route.ts`; `apps/web/src/lib/holidays.ts:293–297`

<a id="qa-55"></a>
#### QA-55 · Dates and times that are not real are kept or silently ignored

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Account preferences, fees exports, the head's decision log
- **From:** F-3 items 1–3 (layer 6)

**Steps**

1. `zz.teacher4@zz.test` (zz-walk session): `POST /api/v1/account/prefs {channels, quietHours:{start:"25:99", end:"06:00"}}`.
2. `zz.admin@zz.test`: `GET /api/v1/fees/export/collections?fromKey=2026-10-24&toKey=2026-04-01`.
3. `zz.principal@zz.test`: `GET /api/v1/principal/decisions?from=2026-13-01`.

**Expected:** 422 naming the field for each.

**Actual:** 1: `200 {"ok":true}`, saved. 2: 200 with an empty sheet named for the backwards window. 3: 200 with every decision; the impossible date passes the pattern and the filter is dropped.

**Suggested fix:** A shared `dateKey` refinement that checks the calendar, `hhmm` with 0–23 and 0–59, and `fromKey ≤ toKey` refinements on the export and decision queries.

**Files:** `packages/contracts/src/v1/account.ts:13`; `packages/contracts/src/v1/fees.ts:347`; `packages/contracts/src/v1/decisions.ts:22`

<a id="qa-56"></a>
#### QA-56 · Two doors are described otherwise than they behave

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** API catalog contract
- **From:** F-4 (layer 6)

**Steps**

1. Contract pass as `zz.pupil01` and `zz.parent01` (zz-walk): `GET /api/v1/family/export`.
2. `POST /api/v1/account/prefs` with `{quietHours}` alone.

**Expected:** Each answer matches the catalog's schema and summary.

**Actual:** 1: the catalog says `{ok:true}`; the door answers the export document itself (an attachment), so the OpenAPI document describes the wrong body. 2: the summary says "a key left out stays as it was", but `{quietHours}` alone is `422 {"channels":"Required"}`.

**Suggested fix:** Give the export door a schema of its document (or mark it a file response); make `channels` and `quietHours` optional as the summary says, or say they are required.

**Files:** `apps/web/src/lib/api-catalog/family.ts:71`; `apps/web/src/lib/api-catalog/account.ts`; `packages/contracts/src/v1/account.ts:51–58`

<a id="qa-57"></a>
#### QA-57 · A college head's home navigates twice on every sign-in

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** College principal's home
- **From:** L1-01 (layer 1)

**Steps**

1. Sign in as `sac.principal@demo.relay.test` (login door; any of the ten demo college principals, or zz.cprincipal).
2. Open `/principal`, where login lands.

**Expected:** The college's dashboard at once.

**Actual:** `/principal` streams a skeleton and the redirect to `/principal/college` happens inside the stream, so the browser navigates twice (about 9 s on the dev server). The phone is unaffected.

**Suggested fix:** Send a college's head to `/principal/college` from the start (ROLE_HOME by institution kind), or decide the redirect before `loading.tsx` streams.

**Files:** `apps/web/src/lib/constants.ts` (ROLE_HOME); `apps/web/src/app/(app)/principal/page.tsx:65`; `apps/web/src/app/(app)/principal/loading.tsx`

<a id="qa-58"></a>
#### QA-58 · The departed child's page has no heading

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Family home (accessibility)
- **From:** L1-03 (layer 1)

**Steps**

1. As in QA-52, open `/parent` as `prakash.pawar@demo.relay.test`.

**Expected:** One `<h1>` naming the page, as every other walked home has.

**Actual:** No `<h1>` after hydration; the title sentence is a `<p className="text-lg font-bold">`.

**Suggested fix:** Make the panel's title the page's `<h1>`, or put a PageHeader above the panel.

**Files:** `apps/web/src/app/(app)/parent/child-left.tsx` (~45)

<a id="qa-59"></a>
#### QA-59 · Touch targets under 44 px on two pages the axe gate never opens

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Start a conversation; question editor
- **From:** UI-03 (layer 4)

**Steps**

1. As `zz.teacher1@zz.test` (minted; any role), open `/remarks/people` at 390 px.
2. As `zz.appadmin@zz.test`, open a question at `/appadmin/bank/<topicId>/<questionId>`.

**Expected:** Every control at least 44 × 44 px.

**Actual:** Each "Start a conversation with …" button is 40 × 40 (7 to 60 a page); the "Option n is the correct answer" radios are 16 × 16 and not inside a label. Neither page is a menu entry, so `axe.spec.ts` never measures them.

**Suggested fix:** `size-11` on the conversation button; wrap each radio with its choice in a `<label>`.

**Files:** `apps/web/src/app/(app)/remarks/people/page.tsx:186`; `apps/web/src/app/appadmin/bank/question-form.tsx:133–140`

<a id="qa-60"></a>
#### QA-60 · The expert's profile fails hydration on every load

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Expert profile (calendar feed)
- **From:** UI-04 (layer 4)

**Steps**

1. As the fixture expert (minted), open `/expert/profile` and read the console.

**Expected:** No hydration error.

**Actual:** "Hydration failed because the server rendered text didn't match the client": the calendar feed address is relative on the server and absolute on the client, so React redraws the tree. Softer attribute warnings were seen once on `/parent/link` (zz.parent01) and `/admin/safety` (zz.cadmin).

**Suggested fix:** Build the feed URL the same way on both sides, or render it after mount.

**Files:** `apps/web/src/app/(app)/expert/profile/calendar-card.tsx`; `apps/web/src/app/(app)/expert/profile/page.tsx`

<a id="qa-61"></a>
#### QA-61 · Words and links for features that are switched off

- **Type:** UI-UX · **Severity:** Low · **Platform:** Both
- **Feature:** Platform feature switches
- **From:** UI-05 (layer 4)

**Steps**

1. With the features off, as the fixture expert (minted) open `/expert/profile` and press the Get paid card's earnings link.
2. As `zz.admin@zz.test`, open `/admin`.
3. As `zz.parent01@zz.test`, open the phone's More → Settings on :8081.

**Expected:** Nothing offers a feature the operator has switched off.

**Actual:** 1: `/expert/earnings` answers "That page is not here". 2: the staffing card says "…or post a vacancy to hire one" while the job board is off. 3: the SMS and WhatsApp switches are on and described as working while texts are off. The phone's Settings and the expert's profile also call doors of switched-off features and log the 404.

**Suggested fix:** Read `mayUse`/features where these are drawn: hide the earnings link, drop the vacancy sentence while JOB_BOARD is off, grey out the text channels with a line saying texts are not on.

**Files:** `apps/web/src/app/(app)/expert/profile/get-paid-card.tsx:222`; `packages/i18n/src/en.ts:5917–5918`; `apps/web/src/app/(app)/admin/page.tsx:119`; `apps/mobile/src/screens/family/settings.tsx`

<a id="qa-62"></a>
#### QA-62 · Confusing or unfinished copy on homes and the circulars page

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Homes; circulars
- **From:** UI-06 (layer 4)

**Steps**

1. `zz.parent01`, `/parent`: the streak tile's hint reads "Starts on the next day in".
2. `zz.faculty01`, `/faculty`: "13 h a week" over the single word "Within"; seven duty cards each end in a bare "Open".
3. `zz.pupil01`, `/student` on a Saturday: "Turn up tomorrow to start one" when tomorrow is Sunday.
4. `zz.principal`, `/admin/circulars`: the tab says "Circular reach", the page "Circulars"; the Families circular reads "Told 0 / 0 · 0 of 0 acknowledged" with no word on why (see QA-71 for the fixture).
5. The fixture expert, `/expert/profile`: the badge says "Not linked yet" while the card says "Linked with Razorpay: ready to be paid".

**Expected:** Whole sentences that say what each number means.

**Actual:** As listed in the steps (all minted ZZ actors, 390 px).

**Suggested fix:** Complete `parent.streakStart`; render `loadWITHIN` with its range; say "the next school day"; one title for the circulars page and an empty-reach line; "Open the lab desk" and the like; one linked state on the Get paid card.

**Files:** `packages/i18n/src/en.ts:5149,` 5278, 13045 (and hi, mr); `apps/web/src/app/(app)/parent/page.tsx:375`; `apps/web/src/app/(app)/admin/circulars/*`; the faculty home

<a id="qa-63"></a>
#### QA-63 · An internal key is printed in the office's texts log

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** SMS and WhatsApp log
- **From:** UI-07 (layer 4)

**Steps**

1. As `zz.admin@zz.test` (or zz.principal), open `/admin/messaging` and scroll to "Recent automatic texts".

**Expected:** The purpose in words ("Circular").

**Actual:** Rows read `circular:cmuvc2m6e004…`, in Hindi too: the label lookup falls back to the raw purpose, which carries the circular's id.

**Suggested fix:** Map the purpose's prefix (`circular:` → the circular's word, ideally linked).

**Files:** `apps/web/src/app/(app)/admin/messaging/page.tsx:181`; `apps/web/src/app/(app)/admin/messaging/labels.ts`

<a id="qa-64"></a>
#### QA-64 · Template braces in the guide Vidura answers from

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Vidura's guide (review queue)
- **From:** UI-08 (layer 4)

**Steps**

1. As `zz.operator@zz.test`, open `/root/vidura-review` (or zz.appadmin `/appadmin/vidura-review`).

**Expected:** The guide's quoted interface text reads as a person sees it.

**Actual:** Lines quote dictionary sentences with their `{year}` placeholder (English and Hindi), so the guide and any answer quoting it prints braces.

**Suggested fix:** Substitute or drop placeholders when the guide quotes a dictionary sentence.

**Files:** `docs/guide/accounts.md` and the guide's other files that quote UI strings

<a id="qa-65"></a>
#### QA-65 · Navigation differs between the web at phone width and the phone app

- **Type:** UI-UX · **Severity:** Low · **Platform:** Both
- **Feature:** Bottom bar
- **From:** UI-09 (layer 4)

**Steps**

1. Compare the bottom bar at 390 px on :3000 with the phone's tab bar on :8081 for zz.teacher1, zz.admin and zz.parent01 (minted).

**Expected:** One person finds the same five places in the same order on either.

**Actual:** Teacher: web Today, Attendance, Classes, Assignments, Exams; phone Today, Attendance, Classes, Messages, More. Admin and parent differ likewise. The driver has a one-item bottom bar on the web; the operator's pages at 390 px open with about twenty links wrapped across the top.

**Suggested fix:** Derive the phone's TABS from the web's primary entries (or the reverse) and test them against each other; give the operator a menu button at phone width.

**Files:** `apps/web/src/lib/nav.ts` (primary); `apps/mobile/src/lib/nav.ts` (TABS); `apps/web/src/app/root/layout.tsx`

<a id="qa-66"></a>
#### QA-66 · Screens the phone does not have, unrecorded as deliberate

- **Type:** UI-UX · **Severity:** Low · **Platform:** Mobile
- **Feature:** Web and phone parity
- **From:** UI-10 (layer 4)

**Steps**

1. Compare the web's NAV with the phone's TABS and MENU per role, then open the phone's More sheet as each ZZ actor (minted).

**Expected:** The parity table says which gaps are on purpose.

**Actual:** The phone sends people to the web for the library catalogue, fines and reports, the hostel's rooms, menu and incidents, and more; it has no entry for punch devices and the Tally export, council notices, staff appointment letters, the expert's earnings, the peer-team visit file, the accounts desk's student list and refunds, the reading-room register, and the clinical and studio duty desks.

**Suggested fix:** Record each as built, planned or web-only in the parity table; add the cheap read-only ones (letters, council notices, earnings).

**Files:** `apps/mobile/src/lib/nav.ts`; `apps/web/src/lib/nav.ts`

<a id="qa-67"></a>
#### QA-67 · The phone's web target has no landmarks

- **Type:** UI-UX · **Severity:** Low · **Platform:** Mobile
- **Feature:** Every phone screen (web target)
- **From:** UI-11 (layer 4)

**Steps**

1. Open any screen on :8081 as any ZZ actor (minted) and run axe.

**Expected:** A `main` and a `nav` landmark.

**Actual:** axe `region` (moderate) on 849 of 862 loads; a screen-reader user of the web target cannot jump to content. Native apps are not affected.

**Suggested fix:** `role="main"` on the screen body and `role="navigation"` on the tab bar.

**Files:** `apps/mobile/src/components/chrome.tsx`; `apps/mobile/src/app/(app)/_layout.tsx`

<a id="qa-68"></a>
#### QA-68 · Moderate and minor axe results on the web

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Several office and platform pages
- **From:** UI-12 (layer 4)

**Steps**

1. Run axe on the English loads of the ZZ walk (minted actors), both widths and themes.

**Expected:** No moderate or minor results.

**Actual:** `empty-table-header` ×32 (`/admin/exams`, `/admin/college-admissions`, `/accounts/scholarships`, `/student/scholarships`, `/root`), `landmark-unique` ×22, `heading-order` ×8 (`/timetable`, `/appadmin/contributions/<id>`), `region` ×8 (`/health/cards/<id>`, `/public/faculty/zz-vidya-college`).

**Suggested fix:** An sr-only header on action columns; distinct aria-labels; heading levels in order; a `main` on the two standalone pages.

**Files:** the pages named in the actual result

<a id="qa-69"></a>
#### QA-69 · A college is called a school

- **Type:** UI-UX · **Severity:** Low · **Platform:** Both
- **Feature:** College office, staff feed, job board
- **From:** UI-14 (layer 4)

**Steps**

1. As `zz.cadmin@zz.test` (ADMIN at ZZ Vidya College, minted) open `/admin`.
2. As `zz.hod01` open the phone's Social Media tab.
3. With the job board on, as zz.cadmin open `/admin/vacancies`.

**Expected:** "College" and "students" at a college.

**Actual:** "School code VIDYA-…", "Our school's feed" (web and phone), "Your school's postings", and "Admit pupils from a list" on the phone's People screen.

**Suggested fix:** Route these four keys through the institution-kind word switch the college presets already use.

**Files:** `packages/i18n/src/en.ts`; the admin home header, the bulletin feed header, admin/vacancies, the phone's people screen

<a id="qa-70"></a>
#### QA-70 · Phone paths open the office's screen for other roles; placement notices open nothing

- **Type:** UI-UX, E2E · **Severity:** Low · **Platform:** Mobile
- **Feature:** Phone deep links and notices
- **From:** E2E-A15 (layer 5A) and E2E-B12 (layer 5B)

**Steps**

1. On the phone's web target, as `sunrise.parent03@demo.relay.test` open `/circulars`; as `svm.parent10` `/applications`; as `sunrise.spare1` `/substitutions`.
2. As `sac.student01@demo.relay.test` open `/placement`.
3. As sac.student01, tap any placement notice (all carry `url: "/student/placement"`); the guardian's consent ask carries `/parent/placement?child=…`.

**Expected:** The reader's own screen (`/post?postId=`, `/my-applications`, `/my-covers`, the student's placement screen, the guardian's consent card) or a not-found.

**Actual:** Steps 1–2: the office's or cell's screen with "Wrong role for this action" and a Try again that cannot succeed (`links.ts` maps `/placement` to the cell). Step 3: `screenFor("/student/placement")` and `/parent/placement` return null, so the notices open nothing.

**Suggested fix:** Route these paths by role; map `/student/placement` to `/(app)/placement` and `/parent/placement` to the family's placement screen; show not-found without a retry otherwise.

**Files:** `apps/mobile/src/app/(app)/circulars.tsx,` applications.tsx, substitutions.tsx; `apps/mobile/src/lib/links.ts` (FLAT 129–167); `apps/web/src/lib/placement.ts` (notice URLs)

<a id="qa-71"></a>
#### QA-71 · The fixture circular's reach report counts nobody, although a guardian acknowledged it

- **Type:** BDD · **Severity:** Low · **Platform:** Both
- **Feature:** Circulars (fixture)
- **From:** BDD-3 (layer 3)

**Steps**

1. As `zz.parent01@zz.test` (minted), `GET /api/v1/shared/bulletin/<"ZZ Annual day">`: `acked: true, ackCount: 1`.
2. As `zz.admin`, `GET …/reach`.

**Expected:** The acknowledged guardian counts; the report has every state to show, as the fixture's docstring promises.

**Actual:** `totals: {total: 0, told: 0, seen: 0, acked: 0}` in every class. The fixture sets `deliveredAt` a day before the post's `publishedAt` and before its enrolments; the reach report counts the roster as it stood at delivery, which is right for real data. Nothing refuses a delivery time earlier than the post.

**Suggested fix:** In `buildCircular`, give the post a `createdAt` before `deliveredAt`, both after the enrolments, and update the existing row; optionally a data:audit check that `deliveredAt ≥ createdAt`.

**Files:** `apps/web/scripts/zz-fixtures.ts` (buildCircular, ~1193); `apps/web/src/lib/circulars.ts:48–53`

<a id="qa-72"></a>
#### QA-72 · Two fixture timestamps run backwards (revoked before issued, sent before created)

- **Type:** BDD · **Severity:** Low · **Platform:** Both
- **Feature:** Certificates; social posting (fixtures)
- **From:** BDD-4 (layer 3)

**Steps**

1. As `zz.admin@zz.test` (minted), `GET /api/v1/office/certificates`: serial `BC/2026–27/0002` (Bhavna Bhatt).
2. `GET /api/v1/admin/social/posts?postId=<the alumni post>`: the SENT copy.

**Expected:** A revocation no earlier than its issue; a send no earlier than its creation.

**Actual:** Each is 1 ms earlier: the fixture evaluates `new Date()` for one column before the database default sets the other.

**Suggested fix:** Take one `now` and set both columns from it; a data:audit check would catch the class.

**Files:** `apps/web/scripts/zz-fixtures.ts:1558,` 2764

<a id="qa-73"></a>
#### QA-73 · The e2e harness's exam shows on the fixture teacher's home

- **Type:** UI-UX · **Severity:** Low · **Platform:** Web
- **Feature:** Teacher home (fixture)
- **From:** UI-13 (layer 4)

**Steps**

1. As `zz.teacher1@zz.test` (minted), open `/teacher`.

**Expected:** The fixture teacher's home is the same whether or not the Playwright suite has run.

**Actual:** "ZZ Grade 10 · A · Mathematics — ZZ E2E Unit Test", 0 of 6 marked (written by `e2e/global-setup.ts`), sits on the home in every picture.

**Suggested fix:** None in the product; a note for whoever compares these pictures.

**Files:** `apps/web/e2e/global-setup.ts`

<a id="qa-74"></a>
#### QA-74 · `zz:token EXPERT <email>` mints a session for another expert

- **Type:** Functional · **Severity:** Low · **Platform:** Both
- **Feature:** Test tooling
- **From:** L1-05 (layer 1)

**Steps**

1. `npm run zz:token -- EXPERT zz.expert2@zz.test --tag=qa-layer1`, then `GET /api/v1/me` with the token.

**Expected:** zz.expert2's session.

**Actual:** zz.expert1's session, for zz.expert2, 3 and 4. The EXPERT branch ignores the email; the RECRUITER and PARENT branches honour it.

**Suggested fix:** In the EXPERT branch, when an email is given, `assertFixtureEmail(email)` and find the profile by that user.

**Files:** `apps/web/scripts/zz-token.ts:99`

<a id="qa-75"></a>
#### QA-75 · The placement library cannot be loaded by a script

- **Type:** Functional · **Severity:** Low · **Platform:** Web
- **Feature:** Test tooling (placement)
- **From:** L1-06 (layer 1)

**Steps**

1. No account: import `../src/lib/placement-recruiter` from a temporary script and run it with `npx tsx --tsconfig scripts/tsconfig.json`.

**Expected:** It loads, as `expert-applications`, `experts` and `superuser` do.

**Actual:** `ERR_PACKAGE_PATH_NOT_EXPORTED` for `@react-pdf/hyphenate`'s `./en-us` (through `placement-pdf.ts`), so `demo:accounts` repeats the library's two writes.

**Suggested fix:** Import `renderResumePdf` lazily inside `recruiterResume` (a dynamic `import("./placement-pdf")`).

**Files:** `apps/web/src/lib/placement-recruiter.ts`; `apps/web/src/lib/placement-pdf.ts`

<a id="qa-76"></a>
#### QA-76 · Stale code and comments met on the way (no behaviour wrong)

- **Type:** Unit · **Severity:** Low · **Platform:** Web
- **Feature:** Messaging caps; gateway docs; test pointers
- **From:** U-6 (layer 2)

**Steps**

1. Read `src/lib/plans.ts` (`effectiveMessageCap`), `src/lib/gig-gateway-env.ts`'s header, `src/lib/role-gate.ts` and `src/lib/tenant-tx.ts` comments, and `tests/api-v1-staff-attendance.test.ts`.

**Expected:** One writer and one reader of each rule; comments that match the code; tests that hold something every day.

**Actual:** `effectiveMessageCap` is called by nothing while messaging.ts and subscriptions.ts each repeat the rule; the gateway header describes three calls and no Route where gig-gateway.ts makes eleven with Route; role-gate.ts points at a test file that does not exist; tenant-tx.ts describes a re-export db.ts does not make; three staff-attendance tests skip themselves on the 1st of every month.

**Suggested fix:** Call `effectiveMessageCap` from both places; refresh the comments; pin the clock in the staff-attendance suite.

**Files:** `apps/web/src/lib/plans.ts`; `apps/web/src/lib/gig-gateway-env.ts`; `apps/web/src/lib/role-gate.ts`; `apps/web/src/lib/tenant-tx.ts`; `apps/web/tests/api-v1-staff-attendance.test.ts`

<a id="qa-77"></a>
#### QA-77 · A single phone test file does not exit

- **Type:** Unit · **Severity:** Low · **Platform:** Mobile
- **Feature:** Test tooling (phone)
- **From:** U-7 (layer 2)

**Steps**

1. In apps/mobile, `npx jest --ci <one file>`.

**Expected:** The run exits when the tests finish.

**Actual:** "Jest did not exit one second after the test run has completed" and it waits; the whole suite and `npm run battery` finish (36 s). The open handle was not traced.

**Suggested fix:** Trace it with `--detectOpenHandles` and close it.

**Files:** `apps/mobile/test/screens/family-helpers.tsx`

## 3. Coverage summary

### By layer

The layers reported 79 findings (5 High, 16 Medium, 58 Low). Merging SEC-2 into E2E-A2 and E2E-B12 into E2E-A15 leaves the 77 in section 2.

| Layer | What ran | Headline numbers | Findings H / M / L |
|---|---|---|---|
| 1 Accounts and reach | Every demo and ZZ account: web home, phone home, one allowed and one refused door | 615 accounts, 621 contexts; 449 of 449 demo contexts and 167 ZZ contexts verified; 220 phone renders | 0 / 0 / 6 |
| 2 Unit | `npx vitest run` and `npx jest --ci --coverage` with v8 coverage; ten new test files | Web 4,940 → 5,026 tests passed; `src/lib` lines 93.05 % → 93.50 %; phone 1,923 → 1,934 tests; phone `src/lib` 97.75 % → 98.31 % | 0 / 1 / 6 |
| 3 BDD | 27 feature files under `apps/web/features/`, run by `npm run bdd` | 225 scenarios: 198 passed, 5 failed, 6 missing, 16 skipped for the environment; 1,263 steps | 0 / 1 / 3 |
| 4 UI and UX | 22 ZZ actors; every menu page and up to fifteen detail pages each, web and phone | 736 web screens (3,680 loads); 431 phone screens (862 loads); axe matrix 1,079 passed, 27 failed, 106 skipped; viewport matrix 49 passed, 15 failed | 0 / 3 / 12 |
| 5A End to end, school | 13 journeys at Sunrise (J13 at ZZ Northgate), with concurrency and a data check after each | 8 passed, 5 failed; data:audit 70 passed, 0 FAIL, 6 WARN | 3 / 4 / 8 |
| 5B End to end, college and platform | 10 journeys at sac, sih, Sunrise families and the ZZ fixtures | 3 passed, 2 passed with the money step untested, 5 failed; data:audit 70 passed, 0 FAIL, 6 WARN | 1 / 4 / 14 |
| 6 Functional map | Feature × role matrix from the API catalog, a contract pass, behaviour suites, the page sweep, one sixth of the API sweep | 1,200 cells, 394 with a door: 81 tested, 292 weak, 21 untested; 2,175 contract calls; 355 of 407 behaviour checks held; sweep 1,018 of 1,018; api:sweep chunk 4 of 6, 3,693 of 3,693 | 0 / 1 / 3 |
| 7 Security | Static review of auth, sessions, webhooks, uploads, CSP and the website renderer; minimal live reproductions | No Critical; every escalation probe 403; cross-tenant spot checks 404; 14 XSS payloads neutralised; the five standing 5 October findings fixed | 1 / 2 / 6 |

#### Layer 1: accounts and reach

| Domain | Accounts | Contexts | Verified | Phone renders | Signed in by the login door |
|---|---|---|---|---|---|
| `@demo.relay.test` | 448 | 449 | 449 | 178 | 449 |
| `@zz.test` | 167 | 172 | 167 | 42 | 0 (minted) |

Three demo accounts were added through `npm run demo:accounts`. The script is idempotent: a second run added nothing. Afterwards `data:audit` gave 70 passed, 0 FAIL, 2 WARN. Both warnings are `usage-sample` against the 1 October sample, and neither comes from these accounts.

Untested: a real device; the password form on `/login`; pressing anything past each home; the phone screen for the 396 contexts that share a row, school and role with a walked one; the demo expert's booked seat and the identity check's document upload; `npm run api:sweep`.

#### Layer 2: unit coverage before and after

|  | Before | After |
|---|---|---|
| Web suite | 440 files, 4,940 passed, 70 skipped, 469 s | 448 files, 5,026 passed, 70 skipped, 512 s |
| Web `src/lib/**` lines | 93.05 % (77,249 / 83,017) | 93.50 % (77,620 / 83,017) |
| Web `src/**` lines | 45.28 % (97,540 / 215,409) | 45.45 % (97,911 / 215,409) |
| Web `src/lib` modules under 80 % | 50 | 45 |
| Phone suite | 231 suites, 1,923 tests | 233 suites, 1,934 tests |
| Phone `src/lib/**` lines (battery scope) | 97.75 % (1,045 / 1,069) | 98.31 % (1,051 / 1,069) |
| Phone `src/**` lines | 89.49 % (14,231 / 15,902) | 89.57 % (14,244 / 15,902) |

The largest module gains from the ten new files: gateway.ts 58.0 % → 100 %, gig-gateway.ts 62.7 % → 99.1 %, sso.ts 69.5 % → 89.8 %, college-fees.ts 67.6 % → 88.6 %, scholarships.ts 67.3 % → 92.2 %, pass-orders.ts 89.8 % → 96.4 % and files.ts 68.6 % → 76.5 %. On the phone, deep-links.tsx went from 85 % to 100 % and parent-home.tsx from 70.8 % to 85.4 %. Fees arithmetic gained property tests over 5,000 seeded cases, and certificate serials a test of eight issued at once.

One suite was flaky. `tests/login-limits.test.ts` failed whenever a second vitest process wiped its rate-limit buckets. After the harness fix in `tests/setup.ts` it passed 8 of 8 runs beside sixteen other processes.

Gaps the layer names: 45 `src/lib` modules still under 80 %, among them academics.ts 68 %, college-campus.ts 25 %, exam-cell.ts 77 %, exam-cell-after.ts 78 %, the PDFs at 0–48 %, placement-alumni 54 %, placement-projects 34 % and translate.ts 17 %. The `scripts/quiz-gen` pipeline is at 0–15 %, and 17 phone screens are under 80 %. A real Razorpay account, a real SSO provider and a device cannot be reached by a unit test. Untested: the sweeps, `npm run build`, the full eslint, `rls:verify`, and CI (refused on billing).

#### Layer 3: BDD

27 feature files hold 225 scenarios. Each feature has a happy, an alternative and a negative path, and every answer is parsed against its door's schema in the API catalog. Last full run: **198 passed, 5 failed, 6 missing, 16 skipped for the environment**, over 1,263 steps. The five failures are four findings: QA-08 (the PF return), QA-54 (a bad domain answered 403), QA-71 (the fixture circular's reach) and QA-72 (two fixture timestamps, two scenarios). Of the 16 environment skips, 12 need ASSISTANT or EXPERT_SESSIONS on. The other 4 need an account-minting run, a proven Razorpay Route account, a Meta app or a verified custom domain.

The six `@missing` scenarios name features that are not built: the INC return; agriculture field work and the ICAR return; a permission slip composed on the phone; following social copies on the phone; publishing the website from the phone; and Vidura on a hosted model (Phase E).

Untested: the 16 environment-gated scenarios; the runner on CI; `--parallel`; the steps of the `@missing` scenarios; vitest, the phone battery and the sweeps. bdd.md also lists six notes for the owner, G-1 to G-6: the placement `batchYear` naming, the 75 % rule passing when no lectures are counted, a student with no placement record counted eligible, a foreign-school context switch dropped silently, HANDOFF.md §5 out of date, and writes left to the E2E layer.

#### Layer 4: UI and UX

| Measure | Count |
|---|---|
| Actors | 22, covering every school, college and platform role (ZZ fixtures, minted) |
| Web screens | 736 (474 menu pages, 262 detail pages) |
| Web loads | 2,944 in English (1280 and 390 px, light and dark) and 736 in Hindi at 390 px: 3,680 |
| Phone screens | 431, light and dark: 862 loads; every tab screen also slowed and failed |
| Feature screens with the seven features and three plans on | 200 web loads, 34 phone loads |
| Axe matrix (`--project axe`) | 1,079 passed, 27 failed (25 menu entries of features that are off, 2 the operator's home after a one-hour session expired), 106 skipped |
| Viewport matrix | 49 passed, 15 failed (all 15 the register screenshot against stale darwin baselines); the overflow and 44 px checks passed in all 64 cells |
| Axe on the walk | No serious or critical violation on any app page; moderate and minor ones in QA-68; `region` on 849 of 862 phone loads (QA-67) |
| Screenshots | 5,028 files, about 620 MB, under `shots/` (gitignored) |

What held: no sideways scroll on any web or phone load, and no contrast violation in dark mode. In Hindi every page set `lang="hi"`, with no raw key, no placeholder and no overflow. Every home starts with the skip link and draws a visible focus ring. On the phone, every tab screen shows a skeleton when slow, and the server's sentence with Try again when a call fails.

Untested: the demo accounts (the walk used ZZ fixtures only); Marathi beyond the harness's homes; anything behind a press (forms, dialogs, the command palette, a question asked of Vidura, phone screens reached by a row); real devices and screen readers; the web's error boundaries; load times on a shared dev server.

#### Layer 5A: school journeys

| Journey | Result | Findings |
|---|---|---|
| J1 A term's attendance and the guardian's view (87 registers, 696 marks) | Pass | None |
| J2 Fee demand, counter payment, receipt, ledger | Fail | QA-03, QA-02 |
| J3 Circular published, delivered, acknowledged | Pass | QA-41 |
| J4 Certificate asked for and issued | Fail | QA-12, QA-11 |
| J5 Report card generated and read on the phone | Pass | None |
| J6 Admission from application to admit | Fail | QA-04, QA-17, QA-43 |
| J7 Transport trip with positions | Pass | QA-46, QA-47 |
| J8 Library loan and return | Pass | QA-44 |
| J9 Hostel leave | Pass | QA-45 |
| J10 Substitution | Fail | QA-16 |
| J11 Website built, previewed, published, review link | Pass | None |
| J12 Enquiry answered | Pass | None |
| J13 Social post queued and sent (Meta faked) | Pass | None |

Data checks held except where a finding says otherwise. 119 open days in Term 1 equal 119 registers and 952 records. The ledger balanced after every step, with one receipt per payment. `data:audit` after cleanup: 70 passed, 0 FAIL, 6 WARN (four the run's reversed payments, QA-40; two already known). The concurrency checks that held were: teacher and office on one register; two devices entering one cash payment; acknowledging from two devices; one library copy lent from two desks; warden against office; two website saves (200 and 409); two enquiry replies; two overlapping social-send runs; and replayed position batches.

Untested: a real device, gateway, Meta or SMS account; the composer path on the dev server; two people double-booking one teacher; two applications racing for a grade's last seat; `fees:reconcile` on the stuck order; delivery of a circular by the job; an expired review link; a live domain's public form; the sweeps, vitest, the phone battery and `next build`.

#### Layer 5B: college and platform journeys

| Journey | Result | Findings |
|---|---|---|
| J1 College exam cycle at sac, forms to publish to correction | Fail | QA-05, QA-10, QA-09, QA-29, QA-42 |
| J2 Placement drive with demo.recruiter01 | Fail | QA-14, QA-30, QA-31, QA-32, QA-33, QA-48, QA-70 |
| J3 IQAC AQAR, generate to filed | Fail | QA-34 |
| J4 Clinical posting and logbook at sih | Fail | QA-35, QA-49 |
| J5 The expert's path, application to reminder | Pass, paid seat untested | QA-37, QA-50 |
| J6 A guardian's pass and the operator's refund | Pass, the guardian's purchase untested | QA-37 |
| J7 Vidura's three modes and refusals | Pass | QA-51 |
| J8 The operator switching features and plans | Pass | None |
| J9 The app admin's desks | Pass | None |
| J10 The phone's offline queue draining | Fail | QA-15 |

Data checks held except where a finding says otherwise: fees against courses, hall tickets, locked forms, backlogs against failed courses (9 = 9), one credit push per student (5), one booking per seat, one reminder each, and the refund revoking its two entitlements. `data:audit` after cleanup: 70 passed, 0 FAIL, 6 WARN, none added by this run.

Untested: a paid seat and a guardian buying a pass, because both need the company's GSTIN in the gig settings and the builder would not invent a tax identifier; accepting the expert's invitation (it types a password); marks import, grace, revaluation, grade cards, transcripts and the ABC credit push; internships, talks, trainings and offer letters; the IQAC's evidence and survey links; bank-desk edits of a real item; the phone's student placement screen; a real device, the outbox on SQLite, a real gateway, Meta or SMS; the sweeps, vitest and `next build`.

#### Layer 6: the functional and workflow map

The matrix crosses the API catalog's 60 areas (1,231 doors, 647 of them called by the phone) with 20 columns: nineteen roles and signed out. That makes 1,200 cells, **394 with a door: 81 tested (T), 292 weak (W, reads only, 261 of them with every answer scanned for another person's or school's ids), 21 untested (U)**. 141 cells sit wholly behind a gate; the report counts 145 carrying a module gate, 45 a feature gate, 11 a plan gate and 4 a duty gate.

Cells with a door, 394: 81 tested (20.6 %), 292 weak (reads only) (74.1 %), 21 untested (5.3 %).

| Suite | Checks held | What it covered |
|---|---|---|
| Contract (every GET, every permitted role) | 2,175 calls; 1,562 answered 2xx; 1,479 parsed; 2 off their schema (QA-56); no 5xx | All 19 roles and signed out, in three runs: 1,597 calls as found, 453 with college actors, 125 with the features on |
| Create, read, update, delete | 92 of 104 | Library, inventory, fee heads, closures, incidents, hostel visitors, talks, IQAC committees, requirements, alumni, partners, posts, record asks, health card, departments, competitions, leave |
| Search, filter, sort, paging | 66 of 70 | People, classes, dues, notifications, bulletin cursor, inbox, competitions, assets, queues, decision log, offerings, global search |
| Notifications | 19 of 23 | Read, read-all, push devices, quiet hours, who is told |
| Integrations and exports | 10 of 11 | Dev mailbox, texts off, SSO start, webhook checks, UDISE+ sheets (54 columns, Aadhaar blank), asset register, Tally |
| Payments (devbox gateway) | 23 of 27 | Forged and wrong signatures, refunds, short capture, the race of QA-06 |
| Uploads | 38 of 45 | Renamed executables, SVG, HTML, polyglots, size caps, path names, another person's file, ranges |
| Real time (`/api/v1/events`) | 24 of 24 | Channels per role, a register save heard only by the right people, stream limits, revoked session |
| Offline replays | 14 of 14 | Register, warden's roll call, lecture attendance: owner, replay, stale, concurrent |
| Access behind the status | 23 of 25 (two by design) | Every opened GET scanned per role: no membership of any other school or college in any answer |
| College roles | 8 of 10 | Set work, marks, HOD read, accounts dues against the ledger |
| Features (on in layer 4's window) | 36 of 45 | Job board, expert workshop, availability, calendar feed, guidance, practice, Vidura |
| Operator | 2 of 9 (the rest by design) | PATCH of a school, app admin refused, support reads (QA-27) |

Of the 407 behaviour checks, 355 held. Of the 52 that did not: 12 are this layer's findings; 29 met a rule the code keeps on purpose or a limit of the environment; 11 were the builder's own wrong input, rerun with the right input where it mattered. The page sweep ran 1,018 of 1,018 as expected. API sweep chunk 4 of 6 (academics, college, hostel, inventory, library, payroll, placement) ran 3,693 of 3,693 as expected.

The 21 untested cells: `accounts` and `college-campus` for LIBRARIAN and WARDEN (ZZ Vidya has neither role); `circulars` EXPERT; `college`, `college-extras` and `operator` signed out; `contest` STUDENT and PARENT; `office-writes` ADMIN and PRINCIPAL; `office-year` for ACCOUNTS, EXAM_CONTROLLER, FACULTY, HOD, IQAC, PRINCIPAL and WARDEN; `owner-decisions` ACCOUNTS; `unversioned` STUDENT. Also untested: the other five sweep chunks and the `--cross` probes; `next build`, vitest and the phone battery; a device or a real gateway, Meta, SMS or SSO; a paid seat and a pass; the 413 against a body that stops short; the reverse order of the settlement race; the features with the plans inactive.

#### Layer 7: security

What held: every privilege-escalation probe answered 403, and cross-tenant spot checks answered 404. Logout revokes both bearer and cookie and is POST-only behind the Origin lock. CORS and the lock refuse a foreign origin and a cross-origin cookie POST. Cookie flags, the nonce CSP and the security headers are in place. The website's rich-text sanitiser neutralised all fourteen XSS payloads, and the only two raw HTML sinks carry no user content. All four webhooks check their signatures and take the event id from the signed body. Upload sniffing refuses SVG and HTML. The public doors by slug and token are rate-limited. Error bodies carry no stack or secret. The five standing findings of 5 October (A3-S-1, -3, -4, -5, -8) were re-checked and all are fixed.

Untested: the QA-01 password overwrite run end to end (destructive; proven by code and by the live token disclosure); QA-21 and QA-23 end to end (both type a password); the full `api:sweep`, `--cross=school` and `--cross=person`, last green on 4 October with cross-school 246 of 246 and cross-person 72 of 72; Vidura's Markdown rendering for XSS; `/verify` against a real prefetching scanner; real Twilio, Razorpay, Meta, a device and live SSO.

### By feature area

One row per catalog area, read off layer 6's matrix: doors, doors the phone calls, the matrix's T / W / U cells, the earlier layers that drove the area end to end, and this report's findings whose feature falls in the area. Cross-cutting findings (sign-in, the tenant fence, the web and phone shells, test tooling) are listed after the table.

| Area | Doors | On phone | T | W | U | Earlier layers | Findings |
|---|---|---|---|---|---|---|---|
| `academics` | 51 | 20 | 4 | 3 | 0 | BDD; E2E-B J1 | None |
| `account` | 19 | 19 | 1 | 16 | 0 | L1; BDD | QA-23, QA-55, QA-56 |
| `accounts` | 22 | 14 | 0 | 7 | 2 | unit U-4 | QA-07 |
| `admin` | 46 | 31 | 2 | 0 | 0 | E2E-A J1, J10 | QA-54 |
| `admissions` | 25 | 12 | 1 | 5 | 0 | E2E-A J6; BDD | QA-04, QA-17, QA-43 |
| `alumni` | 12 | 5 | 2 | 2 | 0 | — | None |
| `assistant` | 27 | 7 | 3 | 14 | 0 | E2E-B J7 | QA-51, QA-64 |
| `certificates` | 45 | 26 | 2 | 10 | 0 | E2E-A J4; BDD | QA-11, QA-12, QA-72 |
| `circulars` | 7 | 6 | 0 | 5 | 1 | E2E-A J3; BDD | QA-41, QA-71 |
| `college` | 9 | 5 | 0 | 4 | 1 | L1 | None |
| `college-admissions` | 20 | 2 | 0 | 3 | 0 | — | None |
| `college-campus` | 14 | 7 | 0 | 6 | 2 | — | None |
| `college-extras` | 33 | 14 | 3 | 4 | 1 | E2E-B J2 | None |
| `college-homework` | 7 | 7 | 2 | 0 | 0 | — | None |
| `community` | 11 | 11 | 0 | 6 | 0 | E2E-A J2 | None |
| `competition-crawl` | 12 | 0 | 1 | 1 | 0 | — | None |
| `contest` | 14 | 14 | 1 | 3 | 2 | E2E-B J9 | None |
| `core` | 17 | 16 | 7 | 11 | 0 | L1; BDD | None |
| `duties` | 29 | 18 | 0 | 6 | 0 | E2E-B J4 | QA-15, QA-35, QA-49 |
| `exams` | 54 | 15 | 0 | 8 | 0 | E2E-B J1; BDD | QA-05, QA-09, QA-10, QA-29, QA-42 |
| `family` | 35 | 29 | 2 | 4 | 0 | L1; E2E-A J1, J2, J5; BDD | QA-52, QA-56, QA-58 |
| `fees` | 43 | 18 | 3 | 1 | 0 | E2E-A J2; BDD | QA-02, QA-03, QA-06, QA-11, QA-38, QA-40, QA-55 |
| `filings` | 7 | 7 | 1 | 1 | 0 | unit | None |
| `gigs` | 45 | 29 | 4 | 4 | 0 | E2E-B J5; BDD | QA-02, QA-18, QA-38, QA-50, QA-53, QA-60 |
| `health` | 7 | 6 | 2 | 3 | 0 | — | None |
| `hostel` | 32 | 20 | 1 | 4 | 0 | E2E-A J9; E2E-B J10; BDD | QA-45 |
| `incidents` | 6 | 4 | 4 | 1 | 0 | — | None |
| `inventory` | 24 | 4 | 2 | 10 | 0 | BDD | None |
| `iqac` | 66 | 29 | 2 | 7 | 0 | E2E-B J3; BDD | QA-34 |
| `join` | 3 | 3 | 0 | 6 | 0 | BDD | None |
| `library` | 33 | 12 | 3 | 5 | 0 | E2E-A J8; BDD | QA-44 |
| `messaging` | 8 | 8 | 2 | 0 | 0 | E2E-A J3 | QA-63 |
| `office` | 20 | 19 | 1 | 1 | 0 | E2E-A J4, J6 | None |
| `office-writes` | 11 | 0 | 1 | 0 | 2 | — | QA-01 |
| `office-year` | 10 | 0 | 5 | 0 | 7 | — | None |
| `operator` | 61 | 32 | 2 | 0 | 1 | E2E-B J8, J9 | QA-27, QA-37 |
| `operator-college` | 6 | 0 | 0 | 1 | 0 | — | None |
| `owner-decisions` | 7 | 0 | 0 | 4 | 1 | — | QA-55 |
| `passes` | 7 | 1 | 0 | 17 | 0 | E2E-B J6 | QA-02, QA-36 |
| `payroll` | 21 | 6 | 0 | 12 | 0 | BDD | QA-08 |
| `placement` | 61 | 32 | 3 | 7 | 0 | E2E-B J2; BDD | QA-14, QA-30, QA-31, QA-32, QA-33, QA-48, QA-70, QA-75 |
| `plan-items` | 9 | 0 | 0 | 13 | 0 | — | None |
| `practice` | 10 | 10 | 2 | 0 | 0 | — | QA-18 |
| `quiz-jobs` | 8 | 0 | 0 | 2 | 0 | — | None |
| `quiz-review` | 9 | 0 | 0 | 2 | 0 | E2E-B J9 | None |
| `report-cards` | 6 | 5 | 0 | 5 | 0 | E2E-A J5; BDD | None |
| `scholarships` | 7 | 5 | 0 | 5 | 0 | unit | QA-39 |
| `shared` | 52 | 45 | 6 | 12 | 0 | E2E-A J3, J12; BDD | QA-41 |
| `social` | 4 | 0 | 0 | 1 | 0 | E2E-A J13; BDD | QA-72 |
| `staff` | 35 | 29 | 5 | 7 | 0 | E2E-A J1, J10 | None |
| `staff-attendance` | 6 | 4 | 0 | 12 | 0 | — | None |
| `stream-records` | 10 | 6 | 0 | 5 | 0 | — | None |
| `studio` | 9 | 3 | 0 | 5 | 0 | BDD | None |
| `substitutions` | 8 | 7 | 0 | 3 | 0 | E2E-A J10 | QA-16 |
| `syllabus` | 11 | 5 | 0 | 3 | 0 | — | None |
| `teaching` | 13 | 11 | 0 | 5 | 0 | E2E-A J5 | None |
| `transport` | 22 | 8 | 0 | 5 | 0 | E2E-A J7; BDD | QA-46, QA-47 |
| `unversioned` | 3 | 0 | 1 | 1 | 1 | E2E-A J1; BDD | None |
| `website` | 18 | 1 | 0 | 2 | 0 | E2E-A J11; BDD | None |
| `website-domains` | 4 | 0 | 0 | 2 | 0 | BDD | QA-54 |

| Cross-cutting | Findings |
|---|---|
| sign-in pages | QA-13, QA-21, QA-22, QA-24, QA-25, QA-28 |
| web shell | QA-19, QA-20, QA-57, QA-59, QA-61, QA-62, QA-65, QA-68, QA-69, QA-73 |
| tenant fence | QA-26 |
| phone shell | QA-61, QA-65, QA-66, QA-67, QA-69, QA-70 |
| tooling | QA-74, QA-75, QA-76, QA-77 |

## 4. Bugs to fix before release

Fix these before release, in this order. The five Highs come first. Then come the seven Mediums that touch money or records, in the order the findings list gives them.

1. **QA-01** · High · from SEC-1 (layer 7). A staff expert-invite link takes over any unverified account. Account takeover of any unverified account by any staff member at any school (306 unverified accounts on the dev database).
2. **QA-02** · High · from E2E-A2 (layer 5A, High) and SEC-2 (layer 7, Medium). Payment webhooks mark an event handled before the settlement, so a failed settlement is never retried. A captured payment is acknowledged to the gateway and never recorded; the same shape on the two company webhooks.
3. **QA-03** · High · from E2E-A1 (layer 5A). Two guardians can pay the same demand online; the second is charged and then refused. A guardian is charged for a demand already being paid and then refused, with no receipt and no trace for the office.
4. **QA-04** · High · from E2E-A3 (layer 5A). Two admits at once make two pupils from one application. Two pupil accounts, memberships and enrolments from one application; the roster and the seat count disagree.
5. **QA-05** · High · from E2E-B1 (layer 5B). College exam results are computed and published with missing internal marks counted as zero. Results with legal weight published wrong: 5 of 5 students ATKT, 9 backlogs, families told.
6. **QA-06** · Medium · from F-1 (layer 6). A guardian who has just paid online is told "Nothing is due to pay" when the gateway's webhook settles the same payment at the same moment. The guardian who just paid is told nothing is due, which reads as a failed payment.
7. **QA-07** · Medium · from U-4 (layer 2). College accounts: the mess bill and the route fee are billed twice when pressed in another language. A boarder billed twice for one month when the second press is in Hindi or Marathi.
8. **QA-08** · Medium · from BDD-1 (layer 3). The PF return (ECR) splits the employer's share with ₹1 too much on every line. The PF return's employer columns add to ₹1 more than 12 % on every line; EPFO checks the difference.
9. **QA-09** · Medium · from E2E-B5 (layer 5B). The exam marks sheet shows a locked internal mark as missing. The marks sheet hides locked internal marks, which is how QA-05 went unseen.
10. **QA-10** · Medium · from E2E-B4 (layer 5B). Two people's first mark entries at the same moment answer 500 and lose one entry. The normal double-entry case answers 500 and loses the controller's marks.
11. **QA-11** · Medium · from E2E-A5 (layer 5A). A declined certificate ask leaves its fee owed. A declined certificate ask leaves ₹100 owed on the pupil's ledger.
12. **QA-12** · Medium · from E2E-A4 (layer 5A). One certificate ask is issued twice when the office and the head press Issue together. Two valid legal papers from one request, one of them orphaned.

The other eight Mediums come next. The security one comes first among them: QA-13 (verification spent on a GET). Then QA-14 (two accepted offers), QA-15 (the offline logbook entry not sent), QA-16 (two teachers told to cover), QA-17 (only the newest admission cycle open), QA-18 (the plan lock on the phone), QA-19 (links into refused pages) and QA-20 (English relative times in Hindi and Marathi).

## 5. Missing test cases

### Concurrency: one test per check-then-write door

- Two presses at once on every door the campaign raced, each asserting one row and one notice: admit (QA-04), certificate issue (QA-12), substitute assign (QA-16), offer accept (QA-14), accept plus decline (QA-32), requirement accept (QA-30), drive apply (QA-31), offer record (QA-33), IQAC sign-off plus return (QA-34), results publish (QA-29), first mark entries (QA-10), logbook clientId (QA-35), pass invoice first read (QA-36), expert approval and pass refund (QA-37).
- The races layer 5A named and did not run: two people double-booking one teacher into two lessons of one period; two applications racing for a grade's last seat.
- The webhook arriving after the browser's confirm (layer 6 saw only the webhook-first order in QA-06).

### Money

- A second online checkout for a demand that already has an open order (QA-03).
- A webhook retry after the settlement throws, on the school door and both company doors (QA-02, SEC-2).
- `fees:reconcile` on a stuck INITIATED order.
- A PF return line for a ₹15,000 wage, with EPS and the difference adding to the employer's 12 % (QA-08).
- Mess and route billing pressed in each of en, hi and mr, holding the two existing `it.fails` tests green once fixed (QA-07).
- A declined and a cancelled certificate ask with a fee (QA-11).
- A paid seat and a guardian's pass from checkout to receipt, with a fixture that sets test company details (layer 5B could not run either).

### Records

- `runResults` with a sitting course that has no locked internal marks (QA-05).
- The marks sheet for a course whose internals are locked (QA-09).
- `internalsFor` across two terms of one course (layer 5B observed it has no term filter, not exercised).
- The rest of the exam desk: result import, grace, revaluation, grade cards, transcripts, the ABC credit push; internships and offer letters.

### Sign-in and accounts

- The expert-invite answer carries no token, and the accept never sets a password on an existing account (QA-01).
- `GET /verify` spends nothing; only the POST does (QA-13).
- TOTP asked on the school-invite accept (QA-21); a per-account TOTP failure limit (QA-22); enrolment asks for the password (QA-23).
- SSO with the keys endpoint down (QA-28, held by an `it.fails` test).

### Validation and contract

- Calendar-checked dates, real times and ordered windows on prefs, the fees export and the decision log (QA-55).
- Refused input answered 422, not 403, on site domains and calendar closures (QA-54).
- The operator's school edit refusing a non-http website and a malformed email (QA-27).
- Each door's answer parsed against its catalog schema in CI, so `family/export` and `account/prefs` are caught (QA-56).

### Phone

- Every screen that writes offline starts the outbox runner and shows the waiting badge (QA-15).
- A 402 PLAN_REQUIRED renders the plan card, not an error (QA-18).
- Every notice URL the server sends maps to a screen for the reader's role (QA-70, QA-70).
- The outbox on SQLite and on a real device (never run).

### UI, accessibility and language

- For each limited role, every link on its pages is one the role gate lets through (QA-19).
- Relative times rendered in hi and mr (QA-20).
- The axe and 44 px checks on pages reached from a row, not only menu entries (QA-59); the axe spec filtering by platform feature and minting 24-hour sessions (H-1, H-2 in ui.md).
- A walk with the demo accounts' real-sized data, a Marathi walk, and pressing forms, dialogs, the command palette and Vidura's panel.
- Screen readers on a device.

### Fixtures and data audit

- `data:audit` checks for `deliveredAt ≥ createdAt` and `revokedAt ≥ issuedAt` (QA-71, QA-72); and a reversal not reported as drift (QA-40).
- The staff-attendance suite with a pinned clock, so it holds on the 1st of the month (QA-76).

### Coverage not reached

- The 21 untested matrix cells listed in section 3.
- The other five chunks of `npm run api:sweep` and the `--cross=school` and `--cross=person` probes.
- The 16 environment-gated BDD scenarios, with the features switched on for the run.
- The 413 refusal against a declared body that stops short; Vidura's Markdown rendering for XSS.

## 6. High-risk areas needing deeper testing

| Area | Why it is high risk | Evidence |
|---|---|---|
| Online payments | Money is taken from a family on three paths that do not record it or refuse after the fact, and the same event-handling shape sits on all three webhooks. | QA-03, QA-02 (with SEC-2), QA-06, QA-36, QA-38; a real gateway and Route never tested |
| Check-then-write under concurrency | The same pattern (a status read before the transaction, an unconditional write inside it) failed in fourteen findings across admissions, certificates, substitutions, exams, placement, IQAC, the logbook and passes. | QA-04, QA-12, QA-16, QA-14, QA-10, QA-29, QA-30, QA-31, QA-32, QA-33, QA-34, QA-35, QA-36, QA-37 |
| College exam results | Results carry legal weight, open backlogs and notify families; a wrong run needs the principal to undo. | QA-05, QA-09, QA-10, QA-29, QA-42; import, grace, revaluation and grade cards untested |
| Account lifecycle and sign-in | Unverified accounts are reclaimable by a link staff can hold, and the second factor has three gaps. | QA-01, QA-13, QA-21, QA-22, QA-23; 306 unverified accounts on the dev database |
| Statutory and college money exports | Files leave the platform for EPFO and accounts; a wrong line is a filing error. | QA-08, QA-07, QA-39 |
| The phone's offline queue | Each screen must start the runner itself; one that forgets holds a record on the device with no sign. | QA-15, QA-35; SQLite and a device untested |
| Role-aware navigation | Links and deep links are drawn without the reader's role, on web and phone. | QA-19, QA-70, QA-70, QA-18 |
| Feature and plan switches | Every switched state is a different app; the axe spec, the phone and several cards do not follow the switches. | QA-61, QA-18, QA-53, QA-50; H-1 in ui.md |
| Coverage the campaign did not reach | The cross-tenant and cross-person probes were last run on 4 October, and five sixths of the API sweep did not run. | Layer 6 and layer 7 untested lists |

## 7. Remediation plan

One commit per fix, each with the repository's verification steps (CLAUDE.md) and a test that fails before the fix. Sizes are this writer's estimates for planning, not measurements from the layers.

| Order | Work | Findings | Size (estimate) |
|---|---|---|---|
| 1 | Mail the expert-invite token only, or refuse the reclaim branch on that accept; a test that the answer carries no token | QA-01 | 2–4 hours |
| 2 | Count a gateway event as seen only once processed, on the school door and both company doors; make "nothing due" a recorded outcome | QA-02 | 1 day |
| 3 | One open online order per demand; record money that arrives with nothing due as received-unallocated; lock the payment row in `settleOnlinePayment` | QA-03, QA-06 | 1–2 days (a new payment state) |
| 4 | Admit by conditional update inside the transaction; offer every open cycle | QA-04, QA-17 | 1 day |
| 5 | Exam cell: refuse a run with missing internals, fix the marks-sheet key, lock the course on mark entry, re-check status on publish, show the fee status on the form | QA-05, QA-09, QA-10, QA-29, QA-42 | 1–2 days |
| 6 | Language-free "billed once" key for mess and route fees | QA-07 | half a day to 1 day (a key column and a migration) |
| 7 | Round EPS before taking the PF difference | QA-08 | 1–2 hours |
| 8 | Certificates: claim the request before issuing; cancel an unpaid fee on decline or cancel | QA-11, QA-12 | half a day |
| 9 | Spend the verification token on a POST behind a continue page | QA-13 | 2–4 hours |
| 10 | Concurrency pass on the remaining check-then-write doors (placement, IQAC, substitutions, logbook, pass invoice, double-press answers) | QA-14, QA-16, QA-30–QA-37 | 1–2 days |
| 11 | Phone: start the outbox runner at the root, plan card on 402, notice and path routing by role | QA-15, QA-18, QA-70, QA-53 | 1 day |
| 12 | Web: role-aware links; relative times in the reader's locale | QA-19, QA-20 | 1 day |
| 13 | Sign-in hardening: TOTP on invite accept, per-account TOTP limit, password to enrol, reset sent after the response, the tenant resolver's checks, SSO keys failure | QA-21–QA-26, QA-28 | 1–2 days |
| 14 | Validation and contract: operator school edit, real dates and times, 422 instead of 403, the two catalog entries, empty gateway bodies | QA-27, QA-38, QA-54–QA-56 | 1 day |
| 15 | The remaining Lows: rules (library, hostel, transport, admissions date, logbook names, demo experts, Vidura's attendance door), copy, accessibility, phone parity, fixtures and tooling | QA-39–QA-41, QA-43–QA-52, QA-57–QA-69, QA-71–QA-77 | 3–4 days |
| 16 | Close the coverage gaps: the axe spec's feature filter and 24-hour sessions, a test-company fixture for paid seats and passes, the full API sweep with `--cross`, the untested matrix cells | Section 5 | 2–3 days, plus about two hours of sweep time |
