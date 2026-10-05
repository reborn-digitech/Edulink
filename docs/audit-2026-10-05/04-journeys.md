# 04 · Journeys

Audit of 5 October 2026, layer J: the critical journeys clicked through end to end, web and phone, tree ff6f928e. This is the layer's report in full, copied from `scratchpad/reports/audit3-journeys.md` and tidied; the findings are summarised, de-duplicated and prioritised in `02-findings.md` (A3-journeys-6 is one row there with A3-states-2). Evidence is under `scratchpad/audit3j/` (`steps.jsonl`, `notes.md`, `shots/`, `downloads/`). The sections are: Summary, Journey table, Findings, By design and environment (excluded), Untested, Cleanup.

## Audit 3, layer J: the critical journeys clicked through end to end, web and phone (5 October 2026)

Tree at ff6f928e (the simulator of 1479dec5 included). Dev servers on :3000 and :8081, shared with two other auditors. Health before: `{"ok":true,"database":"ok",...,"uptimeSeconds":0}`; after: `{"ok":true,"database":"ok","databaseMs":15,"uptimeSeconds":0}`, :8081 200. The servers were never stopped. Under three auditors a server action took 8 to 20 s and `/api/health` once took 5.6 s; that slowness is environment, and every step was waited out.

**Method.** I drove Chromium through a temporary Playwright driver, `apps/web/e2e/tmp-journeys/driver.mjs`. It held one browser context per actor and took commands over a local port; each command and its answer was logged. It is deleted now. Web actors used the `edulink_session` cookie. Phone actors ran on the :8081 web target with the token in the app's own key store, at 390 × 844 with touch. Sessions were minted with `npm run zz:token -- --tag=audit3j` (27 of them, plus 2 later), and their expiry was extended to 8 hours on my own hashes. The admitted pupil, who has no ZZ email, got one `zz-walk` session with id prefix `audit3j-`. Every write went to ZZ Northgate, ZZ Vidya or ZZ Shastri, or to a ZZ tenant I made (ZZ J3 College). Nothing was written to the demo tenants. All of it was cleaned up (last section), and 29 sessions were purged by tag.

**Evidence.** Everything is under `scratchpad/audit3j/`:
- `steps.jsonl`: 905 driver commands, about 500 clicks, fills, selects, uploads and taps, and 189 page loads, each with the URL, toasts, console errors, failed requests and an accessibility snapshot.
- `notes.md`: the running notes.
- `shots/*.png`
- `downloads/`: receipt, certificate, grade card and ID card PDFs.
- `cleanup-*.sql`

## Summary

| What ran | Count | Result |
|---|---|---|
| School journeys (web, phone where it has the screen) | 7 | All walked to the end. 1 is broken for parents (the class permission slip, which I count with the college journeys below) |
| College journeys | 19 | 17 walked to the end. Lab-batch lecture: not marked (no batch lab lecture exists, and the term is frozen). NBA SAR sign-off: no principal exists at ZZ Shastri |
| Simulator journey (change figures, save, compare, show as insights, load, reset, remove) | 1 | Walked to the end, at Vidya. The NBA simulator was opened at Shastri |
| Phone journeys | 8 | All 8 walked: outbox offline and back, faculty lecture, warden roll call, driver trip, parent fees and consent (hostel), student exam form and results, TPO round, IQAC insights. The parent's permission-slip answer has no screen on any surface |
| Wrong-role tries | 9 | All refused (403, 404 or 307 to /switch). One refusal is a 500 page (A3-journeys-6) |
| Findings | 40 | 2 high, 14 medium, 24 low (low includes the grouped copy, wording and formatting findings; the layer's own line said 15 medium and 23 low, and its headings give 14 and 24) |

## Journey table

| # | Journey and step | Role / surface | Result |
|---|---|---|---|
| S1 | Parent applies to Northgate: empty form, a PEN of "123", date of birth 12/12/2030 | PARENT web | Empty and bad PEN refused. **Future date of birth accepted** (A3-journeys-5) |
| S1 | Attach documents: a non-image refused, then a PDF and a PNG; book a sitting | PARENT web | OK |
| S1 | Office: documents checked; score "-40", then "abc; excellent!!", then "78/100"; offer with answer-by 01/01/2020, then 20/10/2026 | ADMIN web | Free-text and negative scores stored (A3-journeys-24). **Past answer-by date accepted and the family notified** (A3-journeys-3). **20/10 shows as 21/10** (A3-journeys-4) |
| S1 | Parent accepts; a teacher tries the admit door | PARENT / TEACHER | Accepted. Teacher 403 |
| S1 | Admit to Grade 3 A with register no. ZZJ3-001 | ADMIN web | On the roll. Guardian linked, fee plan made. Term 1 is overdue on day one (A3-journeys-16) |
| S2 | Teacher marks Grade 3 A (one absent, one late with a note); parent sees both | TEACHER → PARENT web | OK. Notifications markedAbsent and markedLate |
| S3 | Homework: −5 points refused; published with a due date a month past; student attaches a file and hands in; teacher marks 25/20, then 17 with a comment; parent sees 17/20 and the comment | TEACHER / STUDENT / PARENT web | Works. A past due date is accepted silently, and the student's counts are stale (A3-journeys-25). 25/20 is by design |
| S4 | Exam series for Class 7: a Sunday paper is refused, 2 papers added, published; marks 60/50 and 12.3 blocked natively; marks entered | ADMIN / TEACHER web | Works. The Sunday error is at the page top and the form is wiped (A3-journeys-27) |
| S4 | 6 report cards generated, remark and co-scholastic grade saved, published; parent reads the card | TEACHER → PARENT web | Card 75.0% B1 matches the teacher's list. Another family's card gives 404 |
| S5 | Counter payment: −500, 0 and 99,999 refused; a 01/01/2027 date refused; cheque with no reference refused; ₹15,000 cheque gives receipt RCPT/2026–27/000005 | ADMIN web | Works. Receipt "Admission no." is the student code (A3-journeys-26) |
| S5 | Parent's fee view, web and phone; receipt opened by parent and by teacher | PARENT | Agree. Teacher 404 on the receipt. Phone uses US-style dates (A3-journeys-31) |
| S6 | Certificate: empty request refused; Bonafide requested; office issues BC/2026–27/0003; public check with a wrong code and the real one in lower case | PARENT / ADMIN / anonymous | Works. The certificate prints DOB 2030 (A3-journeys-5) and a relative check address (A3-journeys-30) |
| S7 | Departure: a last day before joining refused; recorded "finished schooling" | ADMIN web | Alumnus membership opened. Term 2 still due (A3-journeys-15) |
| S7 | Alumnus reads the feed; office writes to the 2026 batch; alumnus reads the note | ALUMNUS / ADMIN web | OK |
| C1 | Operator onboards a college: Science + Engineering, AISHE "XYZ", timezone "Mars/Olympus" | OPERATOR web | AISHE refused. **Timezone accepted; /root/colleges and the colleges API 500 for every college** (A3-journeys-2) |
| C2 | Registrar adds programme ZZJ3MSC (invalid numbers blocked natively) and term "ZZ J3 Even term" (wrong dates refused) | ADMIN (college) web | Works. Dead pattern, wiped form, future window labelled closed (A3-journeys-28) |
| C3 | Student drops and re-adds the PHY103 elective | STUDENT web | OK (restored) |
| C4 | Faculty marks today's PHY101 lecture | FACULTY web + phone | **Save refused: the term is frozen**, though the page offers marking (A3-journeys-7). Another faculty's or a bogus lecture id gives 500 (A3-journeys-6) |
| C5 | Practical record: marks −4/999 refused; experiment 2 recorded; lab in-charge signs only the new rows | FACULTY / lab desk web | Works. Faculty02 and the HOD get 307 from /duties/lab |
| C6 | Internal marks CHE101: weight 25 refused (over 40), 11/10 refused; marks 9 / AB / 7 saved (totals 35/14/26); colleague countersigns; HOD releases; lock refused while a part is not countersigned; HOD countersigns, releases and locks; student sees the parts | FACULTY / FACULTY / HOD / STUDENT web | Works |
| C7 | Exam form: student submits (₹1,000 = 4 × 250); controller approves; an ineligible student's form refused for attendance | STUDENT / EXAM_CONTROLLER web | Works |
| C7 | Supplementary session: generate; submit refused on no-dues; ACCOUNTS clears; submit; approve; lock | EXAM_CONTROLLER / ACCOUNTS web | Works. The clearance needs no note with ₹12,000 owed (A3-journeys-8) |
| C8 | University file import (an over-max row and an unknown PRN), then a good row; compute; publish | EXAM_CONTROLLER web | Works. Unmatched reasons are not shown (A3-journeys-17) |
| C8 | Grade card issued; student downloads the PDF; another student tries; public check | EXAM_CONTROLLER / STUDENT / anonymous | Works. Other student 404. No code-entry page (A3-journeys-21) |
| C9 | Revaluation: asked; controller enters 80/60 (refused), then 52; run 2 computed; principal publishes; student sees 77 A(8) | STUDENT / EXAM_CONTROLLER / PRINCIPAL web | Works end to end. **No fee raised** (A3-journeys-10). **No prompt to re-run** (A3-journeys-11) |
| C10 | Scholarship: SC and OBC refused for category; EBC claim; sanction ₹99,999; disbursement 1,20,000 refused, ₹15,750 accepted; ledger | ACCOUNTS web | **Sanction unbounded** (A3-journeys-9). Ledger owe ₹500 is right; the claim line reads ₹0 (A3-journeys-39) |
| C11 | Drive for an unverified company: inverted package refused; opened; eligible students told | TPO web | **Unverified company's drive opened to students** (A3-journeys-12) |
| C11 | Student applies (consent tick needed); guardian consents; recruiter sees, shortlists, offers ₹25 lakh; student accepts | STUDENT / PARENT / RECRUITER web | Works. Misleading toast (A3-journeys-20), offer toast without the name (A3-journeys-18), raw rupees (A3-journeys-19) |
| C12 | Internship: reversed dates refused; proposed; approved; diary; report; credited 2 (50 blocked natively) | STUDENT / TPO web | Works. Credited before the internship ends (A3-journeys-22) |
| C13 | IQAC scores 1.1.1: refused without evidence, then 3 with a cited record; predictor 1.04 → 1.10 | IQAC web | Works. Matches the simulator. One unreproduced client crash (environment list) |
| C13 | AQAR 2026 generated and sent; principal "Return" without a note refused; signed off | IQAC / PRINCIPAL web | Works. A duplicate AQAR for the filed 2025 was also made (A3-journeys-35) |
| C13 | NBA SAR (Shastri) sent to the principal | ADMIN (college office) web | "Sent", but the college has no principal (A3-journeys-36). Sign-off untested |
| C14 | Simulator: figures changed (3 → 5 teachers, 2 → 10 papers, 1.1.1 = 3, passed 2 → 50 of 3 appeared) | IQAC web | Live CGPA 1.04 → 1.03 → 1.05 → 1.11 → 1.15. **Passed > appeared accepted and saved** (A3-journeys-13) |
| C14 | Save (empty name blocked natively); compare with the fixture; show as insights; load; reset; remove | IQAC web | Works. Compare tables have no column headers (A3-journeys-33). Remove has no confirm |
| C14 | Role checks: principal saves; faculty refused; Vidya HOD NBA page; Shastri NBA simulator | various | Correct. NBA defaults to the wrong year (A3-journeys-34) |
| C15 | Grievance filed; IQAC reads; office resolves; student sees the note and the Ombudsperson option | STUDENT / IQAC / ADMIN web | Works |
| C16 | Hostel night-out: reversed times (generic error), past start (specific error); asked; guardian consents on the phone; warden approves, signs out, night register shows it, signs back in | STUDENT web, PARENT phone, WARDEN web | Works. Phone consent layout (A3-journeys-29) |
| C17 | ID card PDF: college student, pupil, parent without a child, parent with own child, parent with another child | various | 200 / 200 / 422 / 200 / 404 |
| C18 | Permission slip: teacher posts class slips (answer-by in the past, then 12/10) | TEACHER web | **A parent cannot open, see or answer a class slip on web or phone** (A3-journeys-1). The past date is also accepted |
| C19 | Faculty public page: published, read anonymously, taken down | FACULTY / anonymous | Works. No department shown (A3-journeys-38) |
| C20 | Registrar grants the NSS duty; faculty02's desk opens; duty removed (desk then 307) | ADMIN (college) / FACULTY web | Works. No toast and no notification (A3-journeys-40) |
| P1 | Teacher's register offline: mark all, one absent; "1 waiting to send"; DB empty; back online; synced 5 present + 1 absent; parent told | TEACHER phone | Works (A3-journeys-32) |
| P2 | Faculty lecture mark | FACULTY phone | Same 409 freeze as the web (parity) |
| P3 | Warden night roll call, one absent; parent told | WARDEN phone | Works. Locked once saved |
| P4 | Driver: consent; start without location (asks a reason); pupil on and off; parent sees Live + ETA; end trip | DRIVER phone / PARENT phone | Works (A3-journeys-37) |
| P5 | Parent fees and hostel consent | PARENT phone | Figures match the web. Bell not tappable (A3-journeys-14) |
| P6 | Student exam form (ineligible) and results | STUDENT phone | Reasons shown up front. 409 matches the web. CGPA 7.00 matches |
| P7 | TPO round: "Not through" | TPO phone | Saved and the student told |
| P8 | IQAC insights: CGPA 1.10 and path equal the web | IQAC phone | Other roles' CTAs open web pages the IQAC cannot use (A3-journeys-23) |

## Findings

### A3-journeys-1 · high · TEACHER, PARENT · both
**Parents cannot see or answer a class-level permission slip.** Their notification links to a 404.
- Steps: as teacher1 (ZZ Northgate), /bulletin/new, "One class: ZZ Grade 3 · A", tick "Ask each family yes or no (a permission slip)", question, Answer by 12/10/2026, Post it. As parent01 (child in Grade 3 A), open the notification URL `/bulletin/<postId>`, the web feed /bulletin, and the phone's Social Media feed.
- Expected: the family sees the slip and answers yes or no.
- Actual:
  - The notification (`bulletin.notifCircular`, url `/bulletin/cmuvc2m6e004h0rw2gvow8m64`) opens "That page is not here" (curl as the parent: 404).
  - The slip is in neither the web feed nor the phone feed. The feed API for the parent lists only SCHOOL-scope posts.
  - The slip door says it is open (`GET /api/v1/shared/bulletin/{id}/consent` → `"open":true`), and only a direct API POST could record the "YES". The teacher's reach report then read "Acknowledged 1".
  - The teacher's student sees the post (200); the whole-school fixture slip opens for the parent (200).
  - Cause: `classIdsFor()` in src/lib/bulletin.ts:335–357 returns [] for PARENT, and `visibilityWhere` pins `schoolId`, which a parent session does not carry.
- Evidence: audit3j/steps.jsonl; the curl lines in notes.md.
- Reproduced alone: yes, twice (past and future answer-by dates).

### A3-journeys-2 · high · OPERATOR · web, api
**An invalid timezone at onboarding is accepted and takes down the operator's college list for every college.**
- Steps: /root/onboard, Kind "College", Science + Engineering, timezone "Mars/Olympus", AISHE C-99999, admin zz.j3admin@zz.test, "Onboard a school".
- Expected: refused. The help text itself says an IANA zone matters for every attendance date.
- Actual:
  - School zz-j3-college was created with timezone `Mars/Olympus`.
  - `/root/<id>` shows "Application error" (`PAGEERROR RangeError: Invalid time zone specified: Mars/Olympus`; curl 500).
  - `/root/colleges` → 500 and `GET /api/v1/operator/colleges` → 500 for all colleges until I set my row back to Asia/Kolkata (both then 200).
- Evidence: shots/root-bad-timezone.png; the curl lines in notes.md.
- Reproduced alone: yes.

### A3-journeys-3 · medium · ADMIN, PARENT · web
**An offer with an answer-by date in the past is accepted.**
- Steps: Northgate application, Offer: "Answer by" 01/01/2020, "Offer the seat".
- Expected: refused.
- Actual: the toast says "The seat is offered.", the application turns "Offer expired" at once, and the parent is notified `admissions.notifOffer`. `offer()` in admissions.ts:744 has no lower bound.
- Reproduced alone: yes.

### A3-journeys-4 · medium · ADMIN, PARENT · web
**The answer-by date shows one day later than typed, and the offer stays open into the next morning.**
- Steps: offer with answer-by 20/10/2026.
- Expected: "answer by 20/10/2026", and closed at the end of the 20th in IST.
- Actual:
  - Stored `2026-10-20 23:59:59.999` UTC (`expires.setUTCHours(23,59,59,999)`, admissions.ts:745).
  - Both the parent's and the office's pages say "Please answer by 21/10/2026".
  - The offer stays open until 05:29 IST on the 21st.
- Reproduced alone: yes.

### A3-journeys-5 · medium · PARENT, ADMIN · web
**A date of birth in the future is accepted at application and printed on a frozen certificate.**
- Steps: apply with Date of birth 12/12/2030 for grade 3, admit, issue a Bonafide.
- Expected: refused.
- Actual: stored and shown everywhere. Bonafide BC/2026–27/0003 reads "The date of birth as recorded in the school register is 12/12/2030 (Twelfth December Two Thousand and Thirty)". The alumni list calls the child "Under 18".
- Evidence: shots/school-certificate.png.
- Reproduced alone: yes.

### A3-journeys-6 · medium · FACULTY · web (one row with A3-states-2 in 02-findings.md)
**The lecture page answers HTTP 500 for a lecture that is not yours or does not exist.**
- Steps: as faculty01 open `/faculty/lectures/cmuu5x4us0a9c0rqenqvsabza` (another's), as faculty02 open faculty01's lecture, and open `/faculty/lectures/doesnotexist`.
- Expected: 404 or a refusal page.
- Actual: "Application error: a server-side exception" (`PAGEERROR AccessError: academics.refuseNotYours`). Curl gives 500 three times. The door `GET /api/v1/academics/lectures/{id}` correctly gives 403 and 404.
- Reproduced alone: yes.

### A3-journeys-7 · medium · FACULTY · both
**Once a term's eligibility is decided, no later lecture can be recorded, but the pages still invite marking.**
- Steps: faculty01 home, "Mark the lecture" (PHY101, 05/10/2026), mark Omkar absent and Ananya late, Save (web and phone).
- Expected: either the lecture can be recorded (the term runs to 01/12/2026), or the page says up front it is closed.
- Actual: the register is editable, and Save is refused with "This term's exam eligibility has been decided from the attendance, so it can no longer be changed." (web alert; phone `POST …/attendance` → 409). Every lecture after the freeze is unrecordable.
- Reproduced alone: yes.

### A3-journeys-8 · medium · ACCOUNTS · web
**A no-dues line is cleared with money owed and no reason, and the page gives no feedback.**
- Steps: /accounts/no-dues?event=EXAM_FORM&student=<Omkar>; the Accounts line shows ₹12,000 owed; leave Note empty; "Clear this line".
- Expected: a note required when money is owed (the fixture's own clearance carries one); a confirmation.
- Actual:
  - Cleared: NoDuesClearance has `owedAtClearPaise: 1200000, note: null`.
  - No toast. The row still read "Still open" until a full reload.
- Reproduced alone: yes.

### A3-journeys-9 · medium · ACCOUNTS · web
**A scholarship sanction has no bound.**
- Steps: record an EBC claim for Ananya (expected ₹15,750), then "Record the sanction" ₹99,999.
- Expected: refused, or at least warned (an EBC fee concession cannot exceed the fees).
- Actual: accepted. The accounts home "Owed by the state" goes from ₹50,000 to ₹1,49,999, more than the college's whole outstanding of ₹61,600. The fixture already carries a ₹50,000 sanction on a ₹14,000 claim. Disbursement is bounded by the sanction, so it inherits the bad figure.
- Reproduced alone: yes.

### A3-journeys-10 · medium · STUDENT, EXAM_CONTROLLER · web
**A revaluation says its fee is on the ledger, but no demand is raised.**
- Steps: published supplementary session (fee head "ZZ Exam fees", revaluation ₹400); student presses "Revaluation".
- Expected: a ₹400 demand on the student's ledger.
- Actual:
  - Toast "Asked; the fee is on your ledger."
  - `Revaluation.feeDemandId` is null, and there is no FeeDemand row.
  - The accounts table lists only the ₹350 form fee.
  - `raiseDemand()` (exam-cell-after.ts:120) returns null silently when the head or the current academic year is not found. The fixture's own revaluation also has a null demand.
- Reproduced alone: yes, once (DB checked).

### A3-journeys-11 · medium · EXAM_CONTROLLER, STUDENT · web, phone
**After a revaluation changes marks, the published result stays old, and nothing prompts a new run.**
- Steps: controller decides "Marks changed", new external 52 (old 45).
- Expected: the controller is told a corrected run is due, and the student is not shown "changed" beside the old result.
- Actual:
  - The marks page shows "52 v2", but the published result still shows 45 and 70/100, while the student reads "Revaluation · Marks changed".
  - Nothing on /exam-cell/after or the results page says a re-run is needed. Only after I computed Run 2 by hand did it say "This run corrects a published result: the principal publishes it". The principal was notified; after publishing, the student sees 77 A(8).
- Reproduced alone: yes.

### A3-journeys-12 · medium · TPO · web
**A drive can be opened to students for a company that was never checked.**
- Steps: /placement/drives/new, Company "ZZ Sahyadri Motors (not checked yet)", Open a drive, "Move to: Open", "Tell the eligible students".
- Expected: refused, or a warning, before students are invited to share their record.
- Actual: opened; "2 of 2 eligible students told"; a student applied and the guardian consented to share the record with the unchecked company.
- Reproduced alone: yes.

### A3-journeys-13 · medium · IQAC · web
**The simulator accepts and saves more passes than students appeared.**
- Steps: /iqac/simulator, Students who passed 50 (appeared 3), save "ZZ J3 impossible pass rate".
- Expected: passed is held to appeared or below, or the save is refused.
- Actual: CGPA goes 1.11 → 1.15. 2.6.3 scores the full 4.00 against 2.67. The scenario saved (`writeScenario` refuses only figures the framework does not read).
- Reproduced alone: yes.

### A3-journeys-14 · medium · every phone user (PARENT walked) · phone
**The phone's notification bell rows cannot be tapped.**
- Steps: phone parent, bell, tap "A notice … ZZ J3 Science centre trip" (also "your consent is needed").
- Expected: the notice opens, as on the web.
- Actual:
  - Nothing happens, and the row stays "Unread". `src/app/(app)/notifications.tsx` renders `<Row … />` with no `onPress` and no route; there is no per-item read.
  - The accessibility tree exposes the whole list as one text blob.
- Evidence: shots/phone-parent-notifs.png.
- Reproduced alone: yes.

### A3-journeys-15 · medium · ADMIN, PARENT · web, phone
**A departure leaves later instalments due, and hides the child from the family.**
- Steps: admit on 05/10, pay Term 1, record "finished schooling" last day 05/10.
- Expected: instalments after the last day are cancelled or flagged for the office, and the family can still see what is demanded.
- Actual:
  - Term 2 (due 15/12/2026) stays "Due ₹12,500", and the office dues list still chases it.
  - The child drops out of the parent's fee chooser on web and phone. The web page is reachable only by the old `?child=` URL.
- Reproduced alone: yes.

### A3-journeys-16 · medium · ADMIN, PARENT · web
**A mid-year admission arrives already overdue, and inherits past exams as missing marks.**
- Steps: admit on 05/10 onto "ZZ Grade 3 fees".
- Actual:
  - The parent sees "Overdue ₹15,000" (Term 1 due 15/07/2026) on day one, with reminders scheduled.
  - The parent's home lists Mid-term papers of 09–10/09 as "awaiting marks".
  - The teacher's assignments read "5 of 7 marked · 2 to mark" for exams held before the child joined.
- Reproduced alone: yes.

### A3-journeys-17 · low · EXAM_CONTROLLER · web
**Unmatched result-file rows are counted but not listed, and one is misreported.**
- Steps: import "ZZV2026003,S1,CHE201,25,75" (external over 60) plus an unknown PRN.
- Actual: "0 written, 0 rewritten, 0 unchanged, 2 matched nobody". The over-maximum row is counted as "matched nobody", and the per-line reasons `importMarks` computes (exam-cell-marks.ts:200–221) are not shown, though the page says "Rows that match nobody are listed."

### A3-journeys-18 · low · RECRUITER · web
**The offer toast drops the student's name.**
- Actual: recording an offer says "Offer recorded for ; they are told." The offer was ₹25 lakh on a drive stated as ₹6–7 lakh, made at the shortlist stage, with no warning.

### A3-journeys-19 · low · STUDENT · web
**A user-facing sentence prints raw rupees.**
- Actual: after accepting an offer, a closed drive reads "Already placed: a second drive needs the dream flag and at least 3750000 a year". It should read ₹37.5 lakh.

### A3-journeys-20 · low · STUDENT · web
**A minor's apply toast promises sharing that has not happened.**
- Actual: the toast says "Applied. The company sees your profile and record for this drive.", while the same page says "Waiting for your guardian's consent: the company sees nothing until then."

### A3-journeys-21 · low · anyone verifying a grade card · web
**A grade card cannot be checked by typing its code.**
- Actual:
  - The PDF says only "Check this paper with the code beside the QR at the address it opens".
  - `/certificates/exam` without `?school=` shows a heading and no field.
  - `/certificates/check` answers "No certificate carries that code" for the grade card's code.
  - The API without `school` gives `valid:false`; with it, valid.

### A3-journeys-22 · low · TPO · web
**An internship is credited before it ends.**
- Actual: 2 credits recorded on 05/10 for an internship running 20/09 to 18/11/2026, with a 3-day diary (19 h of 240 planned). Diary days outside the dates and 30 h are refused only by native browser bubbles ("Value must be 11/18/2026 or earlier.", US format).

### A3-journeys-23 · low · IQAC · phone
**On the phone, other roles' insight CTAs open web pages the IQAC cannot use.**
- Actual: every insight is "Open on the web". "2.6.3 … Exam cell and results — Exam controller" opened `http://localhost:3000/exam-cell`, which redirects the IQAC to /switch (307). The web shows such steps as "Ask: … — Exam controller" with no link.

### A3-journeys-24 · low · ADMIN · web
**The entrance-test result takes any text and any date.**
- Actual:
  - The score takes "-40" and "abc; excellent!!".
  - A result can be recorded on 05/10 for a sitting booked on 19/10.
  - The result shows as "Sat 05/10/2026", which reads as Saturday; 5 October is a Monday.

### A3-journeys-25 · low · TEACHER, STUDENT · web
**A past due date is accepted silently, and the student's counts go stale.**
- Actual:
  - Homework published with due 01/09/2026 (a month past) with no warning ("7 students and their guardians were told").
  - After handing in, the student page keeps "1 thing to do / To do 1" until a reload.
  - The teacher sees "Handed in late"; the student sees "Handed in".

### A3-journeys-26 · low · ADMIN · web
**The receipt's "Admission no." is the wrong number.**
- Actual: it prints the student code STU-676P-JMC7, not the admission register number ZZJ3-001 typed at admit (fees/receipts page.tsx:54, `fees.receiptCode`).

### A3-journeys-27 · low · ADMIN, TEACHER, FACULTY, registrar · web
**Server-action forms lose everything on refusal and put the message far from the field.**
- Actual:
  - Exam paper (Sunday): the error sits at the page top via `?error=…`, far from the series form, and the values are reset.
  - Terms, practical record, internal marks, the exam session and the scholarship panels likewise wipe every field.
  - Several refusals are only the generic "Some of this needs another look." without naming the field: apply form, certificate request, exam session with bad dates and fee, hostel leave with reversed times, academic year.
  - Creating an exam series gives no feedback; the new series appears at the bottom of the page.

### A3-journeys-28 · low · ADMIN (college registrar) · web
**The term form's client check is dead, and a future window is called closed.**
- Actual:
  - Console error on /admin/academics/terms: `Pattern attribute value \d{4}[–-]\d{2} is not a valid regular expression … /v: Invalid character in character class` (terms/page.tsx:50, 113), so the academic-year check never runs in the browser.
  - A term whose registration opens 01/11/2026 is listed as "Registration closed".
  - The page uses native date inputs where the rest of the app uses dd/mm/yyyy pickers.

### A3-journeys-29 · low · PARENT · phone
**"Do not consent" sits away from the leave it refuses.**
- Actual: on the hostel screen, "Do not consent" renders at the bottom of the leave list, below the Dentist and Home rows, not with the Night-out row it belongs to. All headings on the screen are level 1. The leave hint shows "2026-10-10 16:00".
- Evidence: shots/phone-parent-hostel.png.

### A3-journeys-30 · low · ADMIN · web
**The certificate page prints a relative check address.**
- Actual: the HTML certificate (and therefore "Print or save as PDF") says "Verify this certificate at /certificates/check". The downloaded PDF has the full URL.

### A3-journeys-31 · low · several · phone, web
**Dates are formatted three different ways.**
- Actual:
  - The phone uses US style: "Jul 15, 2026", "Dec 15, 2026" (fees), "Oct 25, 3:07 PM", "Apr 20, 10:00 AM" (exams).
  - ISO dates appear on: the faculty lecture page "2026-10-05", the phone faculty "Lectures on 2026-10-05", the warden "ZZ Tilak House · 2026-10-05", "may be sat until 2033-05-20", the TPO internships "2027-05-01 – 2027-06-30", "Answers closed on 2026-10-01".
  - The web otherwise uses dd/mm/yyyy.

### A3-journeys-32 · low · TEACHER · phone
**The phone register's labels mislead after sync and miss pupil names.**
- Actual:
  - After the outbox sent, the status still reads "Saved on this device"; it never says the marks reached the school.
  - Each pupil's radios are named only "Present / Late / Absent / Excused", with no group naming the pupil (the web names a group per pupil).
  - While offline, the first status shown was "Ready".

### A3-journeys-33 · low · IQAC · web
**The simulator's compare tables have no column headers.**
- Actual: "Figures that differ" and "Scores that differ" have a caption but no column headers, so neither eyes nor a screen reader can tell which column is First, Second or the change.
- Evidence: shots/iqac-sim-compare.png.
- Also seen on the same page:
  - NIRF inputs show 66.66666666666666 and 0.3333333333333333.
  - Sliders round 21.8 → 22.
  - A blank figure's slider shows 0.
  - Saving resets the figures to today.
  - Remove has no confirmation and no toast.

### A3-journeys-34 · low · IQAC desk at an engineering college (Shastri admin walked) · web
**The NBA SAR page and simulator open on a year with no report.**
- Actual: they default to Year 2025, showing "0 of 1000" and insights for an empty year, while the college's only SAR is for 2026 (140 of 1000; the simulator equals the SAR at 2026).

### A3-journeys-35 · low · IQAC · web
**A second AQAR can be generated for a year already filed.**
- Actual: generating AQAR 2025 while 2025's is FILED made a second 2025-26 DRAFT with identical figures and a new fingerprint, with no warning. Both are listed, and the draft can be sent to the principal.

### A3-journeys-36 · low · college office · web
**A filing is "sent to the principal" at a college that has none.**
- Actual: at ZZ Shastri, which has no PRINCIPAL or IQAC member, "Send to the principal" says "Sent to the principal for sign-off." and leaves the NBA SAR in AWAITING_SIGNOFF that nobody can give.

### A3-journeys-37 · low · DRIVER · phone
**The trip banner claims location it cannot send.**
- Actual:
  - Started without location permission (it asked a reason, which is good), then shows "Trip running · Sending the bus's location".
  - "End this trip?" does not mention that one pupil was never ticked, and the trip ends with "Not ticked".

### A3-journeys-38 · low · FACULTY · web
**The public faculty page omits the department it promises.**
- Actual: the page says it shows "designation, department, qualification…", but neither the preview nor the published page shows the department.

### A3-journeys-39 · low · ACCOUNTS · web
**The student's account shows a disbursed claim as ₹0.**
- Actual: after disbursing ₹15,750, the account lists "Economically backward class fee concession: Disbursed · ₹0". The ledger row correctly shows ₹15,750 covered and ₹500 owed.

### A3-journeys-40 · low · copy, i18n · web, phone
**Plurals, copy and labels in many places.**
- Plurals: "1 marks saved", "1 forms written", "1 forms", "1 students", "1 outcomes saved", "1 companies to check", "Mentoring (1 groups)".
- "0 drafts, 6 published. Families see nothing until you publish." after publishing.
- A college ID card says "check it with the school".
- The TPO internships page cites the AICTE B.Tech credit rule at a UGC science college.
- A one-course supplementary result is labelled "First class with distinction".
- "Mukta" is listed twice in the post composer's Typeface.
- The college onboarding form still shows Board, Lowest grade and Highest grade.
- The registrar's duty Save gives no toast, and the faculty member is not notified of a new duty.
- The payment calendar calls future reminders (22/12/2026, 14/01/2027) "Overdue" on web and phone.
- Admit offers every class regardless of the applicant's grade; `admit()` has no grade check (admissions.ts:843; code read, not executed).

## By design and environment (excluded; not findings)

- A mark of 25/20 was saved (125%): over-marking up to twice the maximum is deliberate (grading.ts saveGrades, "bonus points are real").
- Native browser validation bubbles (min, max, step, required) are in the browser's language and US date format, not the app's. Noted once; they block correctly.
- `ERR_CONNECTION_REFUSED` lines come from my harness refusing `/api/v1/events`, as the e2e helpers do.
- The roll call is locked once saved, on both web and phone. This looks deliberate; there is no correction path.
- Server actions took 8–20 s and `/api/health` once took 5.6 s: three auditors were on one dev server.
- **Once only, not reproduced in 2 retries:** /iqac/predictor showed "Application error: a client-side exception" right after the "score needs its evidence" refusal (steps.jsonl). Probably a chunk reload under load.
- The driver process was killed twice by the background time limit and once by me to add a tap op. Actors were recreated; no step was lost.
- Fixture oddities, not product faults: Ishaan (semester 1) has even-term 2025–26 results; pupil01 is both a boarder and on the evening bus; the 4 October Sunday registers are empty (known).
- Faculty02 and the HOD get 307 from /duties/lab, and the IQAC gets 307 from /exam-cell: correct refusals by redirect.

## Untested

- **Sign-off not walked:** the principal's sign-off of the NBA SAR (ZZ Shastri has no principal), and the HOD's NBA pages as a real HOD.
- **Lecture marking not walked:** a lab-batch lecture (no batch LAB lecture exists; the Vidya term is frozen), and the faculty lecture outbox offline (only the teacher's register was walked offline).
- **Exam-cell flows not walked:** results by double-entry marks and grace; hall ticket download on the phone (the tap showed no observable result).
- **Mail and push:** the operator's invitation email delivery; push notifications on a device (the in-app bell was walked).
- **Placement and internship steps not walked:** joining, the season publication, crediting by the HOD.
- **Filing and certificate steps not walked:** AQAR "filed" with the acknowledgement; certificate revocation.
- **Other journeys not walked:** leave and cover, expert sessions, the guardian claim, the alumni directory and mentor slots, survey answers, the school admission without an entrance test.
- **Language, devices and gates:** Hindi and Marathi; phone widths other than 390 px; a real device.
- **Commands not run:** `data:audit`, `api:sweep`, the page sweep, `next build`.

## Cleanup (all ZZ-scoped, verified by count)

**Northgate** (scratchpad/audit3j/cleanup-northgate.sql, one transaction):
- The admitted pupil user, with its STUDENT and ALUMNUS memberships, guardianship, record, fee plan and demands, the receipt-bearing payment, certificate request, issued certificate, enrolments, attendance and grades (user delete cascades).
- Application APP/2026–27/0008; the Grade 3 A and Grade 7 A registers of 05/10; homework "ZZ J3 Fractions worksheet".
- Exam series "ZZ J3 Unit test 2" with its slots, marks and assignments; the 6 Grade 7 A report cards.
- Both slip posts with their answers; the hostel leave; the roll call; the alumni note.
- The evening trip reset to SCHEDULED with its boardings removed.
- Notifications carrying "ZZ J3" or my entity URLs.

**ZZ Vidya and ZZ Shastri** (cleanup-colleges.sql, one transaction):
- Set-up: programme ZZJ3MSC and term "ZZ J3 Even term"; the 2 practical rows.
- Internal marks: the ZZ J3 part removed and the CHE101 lock deleted; the fixture's "ZZ Unit test 1" back to not countersigned and not released.
- Exam cell:
  - Ishaan's Winter form back to DRAFT, with its ₹1,000 demand removed; Omkar's draft snapshot back to `{}`.
  - The supplementary session deleted (forms, marks, runs, results and revaluation cascade) with its ₹350 demand; the CHE201 backlog back to OPEN, 1 attempt.
  - Grade card GC/2026–27/0001 and the no-dues clearance deleted.
- Accounts: the scholarship claim and its ₹15,750 payment deleted; Ananya's even-semester demand back to paid 0.
- Placement:
  - The Sahyadri drive and both of Ishaan's applications, round results and his offer deleted; the Zeta drive back to OPEN.
  - Ishaan's internship deleted; Ananya's internship back to APPROVED with her 2-day diary, no report and no credits.
- IQAC:
  - The 1.1.1 score deleted, then "Recompute from the records" (cycle CGPA back to 1.04; this adds a computation run).
  - My two AQARs deleted; the Shastri SAR back to DRAFT; the grievance deleted.
  - The simulator scenario was removed through the UI; the fixture's scenario was kept.
- Restored through the UI during the walk: the elective re-registered, the faculty page taken down, the NSS duty removed (`dutiesJson []`).

**Also removed:** school zz-j3-college (cascade), my scratch sessions, and the `apps/web/e2e/tmp-journeys` driver; `scratchpad/audit3j/tokens.env` was deleted.

**Left in place:**
- **Audit-log rows** of these actions.
- **Serial counters, already advanced:** APP/2026–27 0008, RCPT/2026–27 000005, BC/2026–27 0003, GC/2026–27 0001.
- **Uploaded files** now orphaned in storage/: 2 application documents, 1 homework attachment, 1 internship report.
- **Notifications without "ZZ J3" text:**
  - report-card notices to the Grade 7 A families
  - Bhoomi's absence notice to parent27
  - hostel notices to parent01 and parent03
  - the Winter form-approved, grievance and internship notices at Vidya
- **One extra IQAC computation run** in the trend.

`git status` shows nothing of mine. The untracked `apps/mobile/e2e/tmp-audit-phone.spec.ts`, `apps/web/scripts/tmp-audit-hollow.ts` and `tmp-audit-walk.ts` belong to the other auditors.

