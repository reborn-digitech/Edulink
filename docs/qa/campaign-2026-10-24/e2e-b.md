# Layer 5B — end to end, the college and platform side (24 October 2026)

Builder B of layer 5 ([plan.md](plan.md); brief: the coordinator's `briefs/qa/e2e.md`, part B). Ten journeys, each start to finish with a happy path and at least one realistic failure, with concurrency where it matters and a data-consistency check after each. Run 24 October 2026, 10:59–12:53 IST (05:29–07:23 UTC), on master at `9353fc72`, against the running dev server (:3000) and the phone's web target (:8081), while layer 4 walked the same servers. Times below are UTC unless marked IST.

## How it was run

- **Accounts.** Demo accounts went through the login door (`POST /api/v1/auth/login`, device `qa-e2e-b`). The shared demo password was read from docs/demo-schools.md into the process environment at run time. It was never printed or written anywhere. Every login-door session was signed out at the end of its script, and the 86 revoked rows were then deleted. The ZZ accounts (`zz.operator`, `zz.appadmin`, `zz.teacher1`, `zz.parent01/02`, `zz.pupil01`) used `npm run zz:token -- --tag=qa-e2e-b ROLE [email]`, purged at the end (`purged 16`). No password was typed into any form. No account was created through the UI.
- **Where.**
  - Saraswati Arts and Science College (`sac.*`): the exam cycle, the placement drive and the IQAC document.
  - Saraswati Institute of Health Sciences (`sih.*`): the clinical posting and the warden's offline roll call.
  - Sunrise Public School families: the expert's seats, the pass ask and Vidura's refusals.
  - The ZZ fixtures: the pass refund and the app admin's contribution.
  - Everything a journey made was named "ZZ QA e2e-b …" and removed afterwards (see "What the run wrote").
- **Browser.**
  - Web pages ran through the Playwright harness's own contexts (`e2e/actors.ts` `contextFor`, the token as the session cookie).
  - The phone ran as its web target at 390×844 with the token in `localStorage`. Offline was Playwright's `context.setOffline`.
  - The harness's `global-setup.ts` was **not** run. The desktop app's Browser pane was never used.
  - 24 screenshots are in the coordinator's scratchpad under `e2e-b/shots/`.
- **Scripts.** Temporary `apps/web/scripts/tmp-qa-e2eb-*.ts` files were deleted after the run. Copies, every step's JSON-lines log (`logs/`), the cleanup SQL and `notes.md` are in the scratchpad under `e2e-b/`.
- **Platform switches.** Each was switched by zz.operator through the operator's own doors (audited) and put back the same way:

  | Switch | On or active | Off or inactive | Used by |
  |---|---|---|---|
  | `EXPERT_SESSIONS` | 07:02:47 | 07:06:3x | J5 |
  | EXPERT plan | 07:02:47 | 07:06:32 | J5 |
  | STUDENT plan | 07:08:08 | 07:10:09 | J6, then J7's 402 check |
  | `ASSISTANT` | 07:09:5x | 07:12 | J7 |
  | EXPERT plan granted to demo.expert01 | 07:02:51 | revoked 07:06:49 | J5 |

  At 07:22 every feature was read back off and every plan inactive, as found (J8). Paid seats stayed off: the operator's attempt to switch them on was refused, which was the expected result.
- **Server.** `/api/health` answered 200 before and after every journey, and :8081 answered 200 at the end. Calls took 0.4–15 s under the UI walk. Vidura answered in 1–18 s on the local model servers, which were up (8180 chat, 8181 embed).

## Journeys

| # | Journey | Happy path | Realistic failure(s) | Concurrency | Result |
|---|---|---|---|---|---|
| J1 | A college exam cycle (sac, Odd term 2026–27) | Session made (same name again 409), FORMS. 10 forms generated, second run writes 0. Five students submitted, fee = courses × ₹100 on their ledgers. Approved, one with the fee waived (demand WAIVED). 7 papers scheduled, halls, alternate seating, hall tickets HT0001–0005 (PDF 27,861 B; another student 404). CONDUCT locks 5 forms. Double entry by sac.exams and sac.registrar, a mismatch caught (run refused "1 marks are not agreed yet"), then settled. Run, publish. Student and guardian read results on web and phone. A correction after publication: re-run without a reason 422, controller's publish 403 ("the principal's"), principal publishes, run 1 SUPERSEDED. | Four students refused at submit: no-dues at Accounts. Rutuja refused at submit: 66.7 % in PHY301. CONDUCT with forms undecided 409. Registrar deciding a form 403. Status back 409. A student as invigilator 422. Marks above 60 422. HOD lock of PHY302 refused: weights 20 of 40. | A student submitting from two devices: one 200, one 409, one demand. Two hall-ticket presses: 0 + 5, numbers unique. **Two first mark entries at once: 500.** Two publishes at once: one PUBLISHED run, **students told twice**. | **Fail** (E2E-B1 High, B4, B5 Medium, B6, B19 Low) |
| J2 | A placement drive with the recruiter (sac, Sahyadri Data Labs) | demo.recruiter01 posted two requirements. The TPO accepted and opened them. 9 of 10 eligible, invited 9. Five applied. The minor's (Pooja's) application stayed hidden from the recruiter until parent09 consented, then shown. CSV export watermarked, 8 lines. Shortlist by the recruiter, round 1 by the TPO, round 2 by the recruiter, offers, joined recorded. Web /recruiter and /student/placement. | Rutuja refused "BACKLOGS". Round 2 before round 1 409. Offer to a rejected candidate 409. Another company's recruiter 404. Apply before the drive opens refused. | **TPO accepts twice at once: two drafts.** **Apply from two devices: 200 + 500.** Two colleagues offer at once: one row, last writer's package. **Student accepts two offers at once: both accepted.** **Accept + decline at once: both stamped.** | **Fail** (B3 Medium; B7–B12 Low) |
| J3 | An IQAC document (sac AQAR 2026–27) | Generated (PDF 44,329 B), submitted, returned with a note, resubmitted, signed off, filed. The 2025 filing is refused again without "Make it again". The principal's page, the IQAC's page and the phone's filings list all agree. | Faculty generating 403. Sign before submit 409. Filed before sign-off 409. Return without a note 422. Another college's IQAC 404. | IQAC and registrar generate at once: two drafts with one hash (by design). **Principal SIGN + RETURN at once: both 200.** | **Fail** (B13 Low) |
| J4 | A clinical posting (sih) | The coordinator added a PHC and its OPD and posted PBBSCN year 2 · A under Prof Manasi Kulkarni. The student logged a procedure and handed it in. The supervisor returned it, the student corrected it and handed it in, the supervisor signed. Desk counts: signed 1, draft 1. Web and phone logbook pages. | Duplicate site 409. A division over its current rotation 409. A note with a phone number 422. A future day 422. Editing a handed-in entry 409. A non-supervisor faculty member signing 403. Handing in a signed entry 409. | Two postings at once: 200 + 409. Sign + return at once: 200 + 409 (held). **One clientId sent twice at once: 200 + 500.** | **Fail** (B14, B15 Low) |
| J5 | The expert's path | A public application with a PDF (201) went to the operator, who opened the document (`no-store`) and approved it. The account (no password), unpublished profile and invitation were made, the mail is in the dev mailbox, and the invitation page answers 200 with its password form (not submitted). Plan: the EXPERT plan made active asks demo.expert01 for it (402). The pass shows NOT_ON_SALE. The operator's one-month grant opens the slots. Availability: a free one-to-one and a two-seat workshop. A Sunrise pupil's ask was consented to by the guardian, and the meeting link was given to the seat (403 before consent) and to the provider, never to the office or another pupil. Reminder: `gigs:remind` reminded 1, a second run 0, 3 notices. | Duplicate expert address 422. No declaration 422. A second application while one waits 422. An expert opening the document 403. Refusing without a reason 422. An http meeting link 422. A priced slot while paid seats are off 422. Paid seats switch refused (Route not ready: company details). | Two approvals at once: one account, profile and invitation, **but the losing press reads "refuse as a duplicate"**. Last seat taken by two families at once: 201 + 422 "just taken". Consent + decline at once: 200 + 422. | **Pass**, with paid seat **Untested** (B16, B17 Low) |
| J6 | A student's pass bought by a guardian, and an operator refund | The fixture pass: zz.parent01 for zz.pupil01, paid 17 Oct, ZZ-PASS/2026-27/0001. The guardian reads it and its invoice (PDF 20,507 B). Another guardian 404. The operator refunds: 2 entitlements revoked, payer and holder told, month revenue 1 → 0, the holder keeps their separate year grant. | A demo guardian buying the STUDENT pass for Advait: offer NOT_ON_SALE, checkout 422 "cannot be bought here yet" (the company's details are blank). Advait (a minor) asks his guardians: told 1, again the same day `already`. | Two refunds at once: one 200, one 422 (**"Only a paid pass can be refunded."**), one audit row. | **Pass**, the guardian's purchase **Untested** (B16 Low) |
| J7 | Vidura's three modes (ASSISTANT on) | USING: a guardian's "How do I pay my child's school fees online?" on /parent/fees, answered with 2 citations in 12 s. LEARNING: Newton's second law and the SI unit of force, answered by the tutor with a book citation. RECORDS: "When are my exams?" answered from the student's own exams door. | Feature off 404 FEATURE_OFF. STUDENT plan asked 402 PLAN_REQUIRED. A pupil asking for another pupil's marks: PERSONAL_DATA with Ask a person (class teacher). A teacher's home phone: OUT_OF_SCOPE with Ask a person. **A college student's attendance question answered "I am not sure".** | Two questions at once in one conversation: both 200, kept in order, day's count 2 → 4. Another person reading the conversation 404. | **Pass** (B18 Low) |
| J8 | The operator switching features and plans | Switches on and off through the door; a double press is one change and one audit row. A plan made active turns a door into 402. A grant opens it. A revoke and a deactivation put it back. /root/features read on the web. | The app admin or a college registrar switching 403. An unknown feature 404. An unknown plan field 422. The app admin changing a plan 403. | Two presses of one switch: `changed: true` + `false`, one audit row. | **Pass** |
| J9 | The app admin's desks | Bank desk: a served NCERT item taken down and put back, served again; a teacher 403. Contributions: a ZZ teacher's question returned with a note, the teacher told. Competitions: a draft for schools published; a Sunrise pupil sees it under "platform"; a college student does not; withdrawn. Moderation: a Sunrise global post taken down (the school and its author told once) and restored. Web /appadmin and the phone's content screen. | An unknown take-down reason 422. | App admin and operator take one item down at once: one record, the second answered as it stands. Put back twice: both 200. Accept + return at once: 200 + 422 "already settled". Publish + withdraw at once: both 200, one wins silently. Two take-downs of a post at once: 200 + 403 "already down". | **Pass** |
| J10 | The phone's offline queue draining | Warden's roll call (sih.warden): saved offline, "1 waiting to send" and the offline notice shown. Back online, it replayed at once with `X-Edulink-Replay`: 1 roll call, 4 entries. | **A clinical logbook entry saved offline does not send when the network returns** (20 s, nothing posted). It goes only with the next successful write, after it. | The replay and a live write: the replay arrived after the later entry; clientIds kept both distinct. | **Fail** (B2 Medium) |

Five journeys fail on a finding (J1, J2, J3, J4, J10). J5 and J6 pass with their money step untested. J7, J8 and J9 pass. J7 carries one Low finding.

## Data consistency, after each journey

| Journey | Check (rows read on the admin connection, against what the doors answered) | Result |
|---|---|---|
| J1 | Each SUBMITTED form's fee = regular × ₹100 + backlog × ₹150, and its demand's net matches (5 of 5). One demand after a two-device submit. A waived form's demand is WAIVED. Hall tickets = approved forms (5), numbers unique. Locked forms = approved (5). A re-run before publication leaves one DRAFT run. After publication: one PUBLISHED run; backlogs = failed course results (9 = 9, attempts 1); one credit push per student (5). After the correction: run 1 SUPERSEDED, run 2 PUBLISHED by the principal. | Holds, but every result failing a course with no locked internal is wrong (E2E-B1), and result notices were doubled (E2E-B6). |
| J2 | Eligible count (9) = eligibility rows passing. One application per student after a double apply. The recruiter sees only consented applicants (4, then 5 after the guardian). One offer row per (drive, student). Drive status follows the rounds (OPEN → … → OFFERS). | One requirement → **2 drives**. A student holds **2 accepted non-dream offers**. One offer **both accepted and declined**. |
| J3 | Two filings, one hash (same rows). The filed one stays FILED; the 2025 one is untouched. | The filing that was signed and returned at once reads RETURNED **with `signedOffAt` set** and both decisions in the audit log. |
| J4 | One posting for one division over one span. One entry per clientId. Desk counts equal the rows (signed 1, draft 1). | Holds. |
| J5 | One account, profile and invitation per approval. One live booking per one-to-one seat. `seatsTaken` follows bookings. One reminder per confirmed seat, none twice. | Holds. |
| J6 | After the refund: order REFUNDED, its 2 ORDER entitlements revoked, one audit row, 2 notices, the month's revenue excludes it. | Holds. |
| J7 | The day's count rises by one per question (2 → 4 for two at once). Messages are stored in question–answer order. | Holds. |
| J8 | Feature and plan rows read back off and inactive at the end, as at the start. | Holds. |
| J9 | One take-down record per item, one per post. No bank question made by a returned contribution. | Holds. |
| J10 | Rows on the server equal what the phone sent; no duplicate by clientId. | Holds; the clinical entry was late (E2E-B2). |
| all | `npm run data:audit` after cleanup (07:22 UTC): **70 passed, 0 FAIL, 6 WARN**. The six are the four REVERSED Sunrise payments layer 5A left (E2E-A14) and the two `usage-sample` WARNs layer 1 reported. This run added none. | Holds. |

## Findings

### E2E-B1 · E2E · High · Both · College exams: a result is computed and published with missing internal marks counted as zero
1. sac.exams made a session for the Odd term. Forms were approved, all 13 external marks double-entered and matched.
2. Only PHY301 and COM301 had internal marks locked by their HOD. MAT301, PHY302, COM101, COM102 and COM302 had none (sac.hod.physics's lock of PHY302 is refused: "The weights add to 20; they must add to 40.").
3. `POST /api/v1/exam-cell/sessions/{id}/results/run`, then `…/results/publish` as sac.exams.
- **Expected:** the run is refused while a sitting course has no locked internal marks, as it is refused while an external mark is unmatched. At least, the run says which courses are missing.
- **Actual:** 200 with 5 of 5 students ATKT and pass rate 0 %.
  - Every unlocked course is graded F: internal `null` is taken as 0, so it fails `minInternalPercent`. For example, Aditya Patil scored external 53/60 in MAT301 and got F.
  - Publication then opened **9 backlogs**, queued credit pushes, and told five students and the minor's guardian.
  - Undoing it needs a new run with a reason, published by the principal.
- **Fix:**
  - In `runResults`, count `(student, course)` pairs whose internal is `null` (no imported figure and no lock) for a course with `internalMax > 0`.
  - Refuse with a coded 409 naming the courses (`examCell.refuseInternalsMissing`). Or let the controller confirm a course is externally-only.
  - Show the same list on the session page before the run.
- **Files:** `apps/web/src/lib/exam-cell-marks.ts` (`runResults` 413–520, internal at 442), `apps/web/src/lib/exam-cell-rules.ts` (`courseOutcome` 107–126, `m.internalMilli ?? 0` at 109), `apps/web/src/lib/exam-cell-academics.ts` (`internalsFor` 173–188).

### E2E-B2 · E2E · Medium · Mobile · Clinical logbook: an entry saved offline is not sent when the network returns
1. Phone web target as sih.student01 (Priyanka Bachhav), `/clinical-logbook`, on the current Surgical ward posting.
2. Network off. New entry, a note, **Save the entry**.
3. Network back on. Wait 20 s.
- **Expected:** the screen says the entry waits (the outbox badge the register, lecture, warden and quiz screens show). It is sent when the network returns, as the warden's roll call was in the same test (replayed at once).
- **Actual:**
  - The notice reads "You are offline. This is saved on your device and will send when you are back." No badge is shown, and the entry is not in the list.
  - Nothing was posted in 20 s online, and the server had 0 rows.
  - The entry went only when a second entry was saved online: the live POST at 07:20:15.07, then the replay at 07:20:15.61. So the offline entry reached the server **after** the later one.
  - On a phone the row sits in SQLite until some other screen starts the runner or another write succeeds. A student who uses only the logbook does not see a pending entry, and it never reaches the supervisor.
- **Fix:** call `useOutboxRunner()` in the student's logbook screen, show `<OutboxBadge tag="clinical-logbook" />`, and list a queued entry as "waiting to send". Better, start the runner once at the app's root so no screen can forget it.
- **Files:** `apps/mobile/src/screens/college/clinical.tsx` (the `save` mutation ~229, no runner or badge), `apps/mobile/src/screens/teacher/support.tsx` (`useOutboxRunner`, `OutboxBadge`, `postOrQueue`), `apps/mobile/src/lib/outbox-runner.ts`.

### E2E-B3 · E2E · Medium · Both · Placement: a student accepts two offers at once and holds both
1. sac: demo.recruiter01 makes non-dream offers to sac.student01 on two drives (₹6,50,000 and ₹5,00,000).
2. sac.student01 calls `POST /api/v1/student/placement/offers/{A}` and `…/{B}` with `{ accept: true }` at the same moment (two tabs).
- **Expected:** one acceptance. The second is refused `placement.refuseOneOffer` (neither is a dream offer).
- **Actual:**
  - Both answered 200, with `acceptedAt` 06:50:29.621 and .622. Both offers are accepted, not declined, and `dreamException: false`.
  - The one-offer rule is read before the write (`earlier` is computed outside any lock), so two answers each see none.
  - The cell's analytics, the NBA/NIRF placement counts and the next drive's one-offer check now see two acceptances.
- **Fix:** take the acceptance under a lock per student. For example, `SELECT … FOR UPDATE` on the student's PlacementProfile, or a partial unique index on `Offer(studentMembershipId) WHERE acceptedAt IS NOT NULL AND declinedAt IS NULL AND NOT dreamException`. Then re-read `earlier` inside the transaction.
- **Files:** `apps/web/src/lib/placement.ts` (`answerOffer` 946–961).

### E2E-B4 · E2E · Medium · Web (the phone does not enter marks) · Exam marks: two people's first entries at the same moment answer 500 and lose one entry
1. sac session in CONDUCT, PHY301 with three students and no marks yet.
2. sac.exams and sac.registrar each `POST /api/v1/exam-cell/sessions/{id}/marks {courseId: PHY301, entries: [3]}` at the same moment. This is the double-entry design's normal case: two people keying the same sheet.
- **Expected:** one becomes entry one and the other entry two (or the second is told to retry).
- **Actual:**
  - The registrar's 200 (`pending 3`); sac.exams' **500 "Something went wrong"**.
  - The rows are all entry one by the registrar. The controller's entries are lost and the controller sees a server error.
  - Both transactions saw no version 1 and created one, and the second hit `ExamMark_sessionId_courseId_studentMembershipId_version_key`.
- **Fix:** in `enterMarks`, lock the course's rows first (`SELECT … FROM "ExamSession" … FOR UPDATE`, as `runResults` does), or catch P2002 and re-run the student's branch as entry two.
- **Files:** `apps/web/src/lib/exam-cell-marks.ts` (`enterMarks` 118–175, create at 141).

### E2E-B5 · E2E · Medium · Both · Exam marks sheet: a locked internal mark is shown as missing
1. The same session. sac.exams opens `GET …/marks?courseId=<PHY301>`. PHY301's internals are locked by the HOD (27.9, 37.7, 30.5).
- **Expected:** `internalMilli` 27900… and `internalLocked: true`, as the run itself reads them.
- **Actual:**
  - Every row reads `internalMilli: null, internalLocked: false`, for COM301 too. The run (B1) used the locked figures, so the sheet and the result disagree.
  - The controller cannot see on the sheet which courses' internals are missing, which is how B1 goes unnoticed.
  - Cause: `internalsFor` keys its map `"<student>|<course>"`, and `marksSheet` looks up `"<course>|<student>"`.
- **Fix:** look up `` `${f.studentMembershipId}|${course.id}` `` in `marksSheet` (and add a unit test on a locked course's sheet).
- **Files:** `apps/web/src/lib/exam-cell-marks.ts` (`marksSheet` 81–87), `apps/web/src/lib/exam-cell-academics.ts:185`.

### E2E-B6 · E2E · Low · Both · Exam results: a double press of Publish tells every student and guardian twice
1. sac.exams presses Publish on a DRAFT run twice at once (`POST …/results/publish {runId}` ×2).
- **Expected:** one publication and one notice each.
- **Actual:**
  - Both 200. The second press re-ran the whole transaction: it superseded and republished the same run, and backlogs and credits were unchanged.
  - Students received `examCell.notifyResult` twice (10 notices for 5). The minor's guardian got `riskDecisions.notifResultFamily` twice.
  - Cause: the `run.status === "PUBLISHED"` check is read before the lock.
- **Fix:** re-read the run's status after `FOR UPDATE` inside the transaction and return early (no notices) when it is already PUBLISHED.
- **Files:** `apps/web/src/lib/exam-cell-marks.ts` (`publishRun` 522–583).

### E2E-B7 · E2E · Low · Web · Placement: accepting a requirement twice at once makes two drives
1. demo.recruiter01 posts a requirement to sac.
2. sac.tpo presses Accept twice at once (`POST /api/v1/placement/requirements/{id}/accept` ×2).
- **Expected:** one drive, the second press answered with it (the code's own "made" branch).
- **Actual:** both 200, with drives `…drgpgjlx8ov900` and `…dtgpgjt58m41ou`, two DRAFTs of one requirement, each the recruiter's and each closable only. No unique constraint holds `(schoolId, requirementId)`.
- **Fix:** a unique index on `Drive(schoolId, requirementId)` where `requirementId` is not null, and catch P2002 to return the existing drive.
- **Files:** `apps/web/src/lib/placement.ts` (`acceptRequirement` 495–512), `apps/web/prisma/schema.prisma` (Drive).

### E2E-B8 · E2E · Low · Both · Placement: applying from two devices at once answers 500
1. sac.student01 sends `POST /api/v1/student/placement/drives/{id}/apply {consent: true}` from two devices.
- **Expected:** one 200 and one 409 "already applied".
- **Actual:** 200 and **500**. One application is stored (the unique key holds); the second device shows "Something went wrong".
- **Fix:** catch P2002 on `driveId_studentMembershipId` and answer `placement.refuseApplied` (or the application as it stands).
- **Files:** `apps/web/src/lib/placement.ts` (`applyToDrive` 897–925).

### E2E-B9 · E2E · Low · Both · Placement: accepting and declining one offer at once stamps both
1. sac.student02 has one offer on drive A.
2. `POST /api/v1/student/placement/offers/{id}` with `{accept: true}` and `{accept: false}` at once.
- **Expected:** one answer stands and the other is told it is answered.
- **Actual:** both 200. The row has `acceptedAt` **and** `declinedAt` set to the same instant. The drive view calls the student SELECTED.
- **Fix:** `updateMany where id, acceptedAt: null, declinedAt: null` and refuse when it matches nothing (together with B3's lock).
- **Files:** `apps/web/src/lib/placement.ts` (`answerOffer` 946–961).

### E2E-B10 · E2E · Low · Web · Placement: two recruiters offering at once each see their own package; the last write is kept
1. demo.recruiter01 offers sac.student01 ₹6,00,000 while recruiter.sahyadri (same company) offers ₹6,50,000, at once.
- **Expected:** one offer, the second told it changed meanwhile (or replaced with an audit row saying so).
- **Actual:** both 200, each answer echoing its own package. The stored offer is ₹6,50,000 by recruiter.sahyadri. demo.recruiter01's screen says ₹6,00,000 was recorded. The student was notified twice.
- **Fix:** create-only for a fresh offer (`create`, P2002 → "an offer stands; edit it"); edits go through an explicit change with the previous package in the audit.
- **Files:** `apps/web/src/lib/placement.ts` (`recordOffer` 745–793).

### E2E-B11 · E2E · Low · Web · Placement: the "joined" answer names nobody
1. demo.recruiter01 `POST /api/v1/placement/offers/{id}/joined {joinedOn}` for an accepted offer.
- **Expected:** the offer view with the student's name, as `recordOffer` returns (its own comment fixed the empty toast, A3-journeys-18).
- **Actual:** `"studentName": ""`.
- **Fix:** pass the name map to `offerViews` in `recordJoined` as `recordOffer` does.
- **Files:** `apps/web/src/lib/placement.ts` (`recordJoined` 795–806).

### E2E-B12 · E2E · Low · Mobile · Placement notices open nothing on the phone, and /placement is the cell's screen for a student
1. As sac.student01 on the phone's web target, open `/placement`.
2. Tap any placement notice. All of them carry `url: "/student/placement"`: shortlisted, round passed, offer, invite. The guardian's consent ask carries `/parent/placement?child=…`.
- **Expected:** the student's placement screen (`app/(app)/placement.tsx`), and the guardian's consent card.
- **Actual:**
  - `/placement` lands on `/placement-cell` with "Wrong role for this action" and **Try again**, because `links.ts` maps `/placement` to the cell (the same pattern as E2E-A15).
  - `screenFor("/student/placement")` and `/parent/placement` return null, so the notices open nothing.
- **Fix:** map `/student/placement` to `/(app)/placement` and `/parent/placement` to the family's placement screen. Route `/placement` by role.
- **Files:** `apps/mobile/src/lib/links.ts` (FLAT 129–167), `apps/web/src/lib/placement.ts` (notice URLs).

### E2E-B13 · E2E · Low · Both · IQAC: a sign-off and a return at the same moment both stand
1. sac.iqac submits the AQAR 2026–27.
2. sac.principal sends `POST /api/v1/iqac/filings/{id}/signoff` with `SIGN` (web) and `RETURN` with a note (phone) at the same moment.
- **Expected:** one decision; the other 409 "not waiting".
- **Actual:**
  - Both 200. The row reads **RETURNED with `signedOffAt` set**.
  - The audit log (the principal's decision log) has `iqac.filing.signoff` and `iqac.filing.return` 2 ms apart, and the IQAC was told both.
  - The status check is a read before an unconditional update.
- **Fix:** `updateMany where id, status: "AWAITING_SIGNOFF"` and refuse on zero. Clear `signedOffAt` on a return.
- **Files:** `apps/web/src/lib/iqac-filings.ts` (`signOffFiling` 352–363).

### E2E-B14 · E2E · Low · Mobile · Clinical logbook: the same clientId sent twice at once answers 500
1. sih.student04 posts one logbook entry twice at the same moment with one `clientId`. This is the outbox's replay racing the first send.
- **Expected:** both answer the one entry (the door is "idempotent by clientId").
- **Actual:** 200 and **500**. One row is kept. The phone keeps the 500 as a retry and the server logs an error.
- **Fix:** catch P2002 on `studentMembershipId_clientId` and return the existing id.
- **Files:** `apps/web/src/lib/clinical.ts` (`saveLogbookEntry` 477–500).

### E2E-B15 · E2E · Low · Both · Clinical logbook: a patient's name passes the "names no patient" check
1. sih.student04 logs "Patient Ramesh Gaikwad, bed 4: dressing changed."
- **Expected:** refused, as the refusal sentence itself promises ("…what looks like a name, a number or an address; a logbook names no patient").
- **Actual:** 200, stored, and shown to the supervisor and the coordinator. Only digits, phones, emails, links and codes are caught.
- **Fix:** a product decision. At least flag a "Patient <Capitalised> <Capitalised>" pattern and a bed/IP number. Otherwise change the sentence so it does not promise name detection.
- **Files:** `apps/web/src/lib/clinical.ts` (`noteCarriesIdentifier` 80–84).

### E2E-B16 · UI-UX · Low · Web · A losing double press reads as a failure (expert approval, pass refund)
1. zz.operator approves an expert application twice at once.
2. zz.operator refunds a pass twice at once.
- **Expected:** the second press answered with what the first did ("already approved", "already refunded").
- **Actual:**
  - Approval: 200 and `422 "This email address already has an expert account. Refuse the application as a duplicate."`. This tells the operator to refuse the application they just approved: the P2002 on the new user is mapped to `addressIsExpert`.
  - Refund: 200 and `422 "Only a paid pass can be refunded."`
  - Data is right in both cases.
- **Fix:** in `decideExpertApplication`, re-read the application on P2002 and answer `alreadyDecided` when it is APPROVED. In `refundPassOrder`, answer the order as REFUNDED when the claim found it refunded meanwhile.
- **Files:** `apps/web/src/lib/expert-applications.ts` (~395–399), `apps/web/src/lib/pass-orders.ts` (`refundPassOrder` 602–616).

### E2E-B17 · Functional · Low · Both · Demo experts' times are hidden from demo families, yet bookable by id
1. EXPERT_SESSIONS on. demo.expert01 offers a free one-to-one and a workshop.
2. sunrise.pupil01 or sunrise.parent01 reads `GET /api/v1/gigs/sessions`.
3. sunrise.parent02 books the one-to-one by its slot id.
- **Expected:**
  - The demo school's families see the demo expert's open times (the demo journey "find an expert, book a seat").
  - A slot a reader is not shown cannot be booked.
- **Actual:**
  - `open: []` for every Sunrise child. `openFor` drops providers with `isTestFixture` unless the reader's school is a fixture school. Every `@demo.relay.test` account carries the flag (`demo-accounts.ts` `upsertUser`, as vikram.sethi does), and Sunrise is not a fixture school.
  - `bookSeat` does not apply the filter, so the booking by id succeeded (201 CONFIRMED).
- **Fix:** decide whether demo schools read demo experts (treat a demo school as a fixture reader, or do not flag demo experts). Apply the same provider rule in `bookSeat` as in `openFor`.
- **Files:** `apps/web/src/lib/gig-sessions.ts` (`openFor` 572–577, `bookSeat` 691–697), `apps/web/src/lib/fixtures.ts`, `apps/web/scripts/demo-accounts.ts:130`.

### E2E-B18 · Functional · Low · Both · Vidura "My records": a college student's attendance question is answered "I am not sure"
1. ASSISTANT on, STUDENT plan inactive. sac.student01 asks "What is my attendance percentage in each course this term?"
- **Expected:** the RECORDS answer from the student's own door. The exam form's own snapshot holds 87.5 % (MAT301), 91.7 % (PHY301), 91.7 % (PHY302).
- **Actual:** `chip RECORDS, verdict ANSWERED`, "I am not sure. You may check the "/student/academics" page…", with Ask a person (the registrar). "When are my exams?" was answered from the exams door in the same conversation, so the router has no door for a college student's lecture attendance.
- **Fix:** add the college attendance door (the eligibility or academics read) to the records router for STUDENT at a college, and an eval case.
- **Files:** `apps/web/src/lib/assistant/router.ts`, `apps/web/src/lib/assistant/door-loaders.ts`, `apps/web/content/assistant-eval/`.

### E2E-B19 · UI-UX · Low · Both · A student's exam form never says whether its fee is paid or waived
1. sac.student02's form was approved with the fee waived (the demand WAIVED). sac.student01's demand is OPEN.
2. Each reads `GET /api/v1/exam-cell/mine` (web /student/exams, phone college exams).
- **Expected:** the fee line says open, paid or waived (`demandStatus`, which the session view fills).
- **Actual:** `demandStatus: null` for every form. The page prints "Fee ₹300" alike for a waived and an unpaid fee.
- **Fix:** read the demands' statuses in `myExams` as `sessionView` does (exam-cell-after.ts:82).
- **Files:** `apps/web/src/lib/exam-cell-after.ts:259`.

## Observations, not findings
- **Publish and withdraw at once.** A platform competition published and withdrawn at the same moment answered 200 to both, and one won silently. The status door is last-writer by design. It was republished by the next press.
- **Taking one bank item down twice.** The app admin's AMBIGUOUS and the operator's POOR_WORDING, at once, both answered 200 with POOR_WORDING. One record, as the door documents ("taking it down again changes nothing").
- **The phone's `/assistant`.** It replaces itself with the home and opens the Vidura sheet (by design since pass 1). The web's `/assistant` redirects to `/student?vidura=open`.
- **`internalsFor` has no term filter.** It reads every lock of a course across terms; the last lock wins. A backlog student's old-term internal and a new term's would collide. Not exercised.
- **The run's school time zone.** demo.expert01's slots door reports `timeZone: "UTC"` (the expert has no school). The family reads the slot in Asia/Kolkata. The times agreed (10:00 IST shown as 10:00 AM).
- **Vidura's first-use notice.** A guardian is told once when a child first uses Vidura (`assistantService.noticeTitle`). This run's notice to sunrise.parent01 was deleted, so the next real first use tells again.

## What the run wrote, and what was put back
- **Put back by id, college or ZZ rows only, each in one transaction** (the SQL is in the scratchpad):
  - **J1.** The session `cmvm0rb8p00yogpgjzcnplh8w`, and everything it cascades to: forms, schedule, rooms, seats, tickets, invigilation, marks, runs and results. Its 9 backlogs, 5 credit pushes, 5 exam-fee demands (no allocation on them) and its notices.
  - **J2.** The three drives (applications, rounds and offers cascade), the two requirements and their placement notices.
  - **J3.** Both AQAR 2026 filings and their notices.
  - **J4.** The PHC, its OPD, the posting, both entries and their notices.
  - **J5.**
    - Both slots, cancelled through the expert's door first: 15 notices, later deleted.
    - Their bookings.
    - The approved applicant's account `cmvm1y10i01oegpgjnvek4ram` with its profile and invitation.
    - Both applications, the four dev-mailbox mails, the office's `gigs.notifOffice` and the families' notices.
  - **J6.** The fixture pass `cmvc38afh0000go15rhsb78lg` set back to PAID, refund fields cleared, its two ORDER entitlements un-revoked, and the `passes.*` notices.
  - **J7.** The three conversations, deleted through their door, and the guardian's first-use notice.
  - **J9.**
    - The competition `cmvm2db3a01tegpgjibsyuwi7`.
    - The contribution `cmvlvb5l200f3gp0x38zqsks8` back to SUBMITTED with no note.
    - The PlatformTakedown row and the three notices.
    - The bank item `cmv3jhjcu0006gnjuyeh81clq` was put back through the door and is SERVED.
  - **J10.** The roll call `cmvm2lbmu01uwgpgjvuvnmd2w` with its 4 entries, and the two logbook entries.
  - **Sessions.** Every zz-token session (`purged 16`) and the 86 revoked login-door sessions.
- **Left in place:**
  - **Audit rows**, append-only: every journey's, including the operator's switch and plan rows and the bank item's take-down and put-back.
  - **demo.expert01's grant**, revoked (`cmvm1xq3301o6gpgjc6s5aqrr`).
  - **The devbox refund id** of the fixture pass, discarded with the reset. No gateway was called but the devbox transport.
  - **Server-side receipt and invoice counters:** none were used. No exam fee or pass was paid.

## Paths touched
- `docs/qa/campaign-2026-10-24/e2e-b.md` (this report, new).
- `docs/data-audit/latest.md`, `docs/data-audit/reports.md` (regenerated by `npm run data:audit`).
- `apps/web/scripts/tmp-qa-e2eb-*.ts` were created and deleted. Copies are in the scratchpad.
- `apps/web/.zz-token/qa-e2e-b.hashes` (gitignored; emptied by the purge).
- Database: as listed above.

## Untested
- **A student's paid seat on the devbox gateway, and a guardian buying a pass.** Both need the company's legal name, GSTIN and state in GigSettings, which are blank on the dev database. Paid seats: Route readiness `companySet: false` (`activated: 1`, `gatewaySet` and `webhookSet` true), and the switch was refused. Passes: NOT_ON_SALE. A GSTIN is a government tax identifier, and this run does not enter one even as a test value. The owner (or a fixture that sets test company details) unlocks both paths. Everything else on them (checkout, capture, hold, release, receipt) was not exercised here. The operator refund was exercised on the ZZ fixture pass.
- **Accepting the expert's invitation.** It sets a password through the web form, which by the rule nobody types. The page was opened, and the account was deleted.
- **The rest of the exam desk:** the university's result file import, grace (propose and the principal's decision), revaluation, grade cards, transcripts, the ABC credit push, and an autonomous college's question papers.
- **The rest of the placement and IQAC desks:** internships, talks and trainings; offer letters by upload ticket; the IQAC's evidence and survey links.
- **Bank-desk edits of a real item** (not done, to leave served content as it was), translations review, bank import and export.
- **The phone:** the phone's student placement screen (B12 keeps the URL from reaching it); a real device; the outbox on SQLite.
- **External services and jobs:** a real Razorpay, Meta or SMS account; `gigs:remind` from cron (it was run once by `npm run job`, then once more).
- **Layer checks:** `npm run api:sweep` and the page sweep (by the rule; nothing in the code changed); `npx vitest run`, the phone battery and `next build` (nothing in the code changed).
