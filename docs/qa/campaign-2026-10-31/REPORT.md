# Shalaghar QA pass of 31 October 2026: the report

This was item 12 of the owner's batch of 27 October 2026. It was a QA pass over items 1 to 9 of that batch, run by a tester who built none of them. It ran on 31 October 2026 between 02:40 and 04:05 IST, against the dev server on :3000 and the phone's web target on :8081. Both servers were already up. They were not started, stopped or restarted, and `/api/health` answered 200 before and after every block. While this pass ran, item 11 was preparing a corpus re-extract and the generation run was being restarted. Neither was touched.

The method and the format follow the 24 October campaign (plan.md, REPORT.md). Each finding has a type, a severity, a platform and the feature; numbered steps that name the account; expected against actual; a suggested fix and the files.

No product code was changed. Each finding is proven with the smallest reproduction and left as it is. Everything this pass wrote to the database was deleted or put back by id (section 8).

**19 findings: Critical 0, High 0, Medium 1, Low 18.** By type (a finding can carry two): Functional 12, UI-UX 6, Security 1, BDD 1. By platform: Both 12, Web 7, Mobile 0.

Severity follows the scale applied by the 24 October report: Critical, money or data lost or a takeover across tenants; High, a takeover, a double charge or record, or wrong results published; Medium, wrong information or state shown to people, or a privacy step lost; Low, copy, edge cases, contract mismatch, docs, or a leak inside the tenant to staff.

## 1. Accounts used

No password was typed. Sessions were minted with `npm run zz:token -- ROLE [email] --tag=item12` (107 in all, all purged), used as a bearer to `/api/v1`, as the `edulink_session` cookie in a headless Chromium (apps/web's Playwright), or placed in the phone target's `localStorage`. Separately, the harness ran `e2e/nav-groups.spec.ts`; its own teardown removed its sessions.

| Email | Role | School | Used for |
|---|---|---|---|
| zz.subject1@zz.test (ZZ Rekha Bhagat) | TEACHER, timetable only (English) | ZZ Northgate | Item 1 |
| zz.teacher1@zz.test | TEACHER, form | ZZ Northgate | Item 1, gates |
| zz.pupil25@zz.test, zz.parent25@zz.test | STUDENT, PARENT | ZZ Northgate, Grade 7 · A | Item 1, gates |
| zz.admin@zz.test (holds HEAD_PAGES) | ADMIN | ZZ Northgate | Items 2, 3, 9 |
| zz.principal@zz.test | PRINCIPAL | ZZ Northgate | Item 3, payroll head view |
| ZZ Sunita Kamble (zz:token SUPPORT) | SUPPORT, no login | ZZ Northgate | Item 2 own payslips |
| zz.admin.b@zz.test (no duty), zz.principal.b@zz.test | ADMIN, PRINCIPAL | ZZ Southbank | Item 9 duty: 404/403, grant, take back |
| zz.cadmin.s@zz.test | ADMIN | ZZ Shastri (no head) | Item 9 no-head rule |
| zz.librarian, zz.warden, zz.driver01 @zz.test | LIBRARIAN, WARDEN, DRIVER | ZZ Northgate | Item 9 forms, gates |
| zz.appadmin@zz.test | APPADMIN | Platform | Bank desk |
| Every sunrise.* staff row of docs/demo-schools.md (23), sunita.deshmukh, aarav.deshmukh, sunrise.parent03/04/05/28/35/44, sunrise.pupil01/05/33 | Every Sunrise role | Sunrise | Item 4 walk, item 5, security |

## 2. Findings

| ID | Sev | Type | Platform | Finding | Status |
|---|---|---|---|---|---|
| QB-01 | Medium | Functional | Both | College practice units named after syllabus-document headings, and questions about the document | Fixed, commit f3ae34ec |
| QB-02 | Low | Security | Both | The class door gives a timetable-only teacher the join code | Fixed, commit f3ae34ec |
| QB-03 | Low | Functional | Both | The gradebook door never answers the subject | Fixed, commit f3ae34ec |
| QB-04 | Low | Functional | Both | A lesson is stored with the subject as typed ("english"), outside the class's English syllabus | Fixed, commit f3ae34ec |
| QB-05 | Low | UI-UX | Both | A subject teacher's syllabus opens on Art, read-only and empty; the picker sorts Grade 10 before Grade 3 | Fixed, commit f3ae34ec |
| QB-06 | Low | Functional | Both | A second "Add support staff" press answers `salary: null` | Fixed, commit f3ae34ec |
| QB-07 | Low | Functional | Web | The bank advice has no Slip Ref column | Fixed, commit f3ae34ec |
| QB-08 | Low | Functional | Both | A refused UTR sheet marks good lines `RECORDED` | Fixed, commit f3ae34ec |
| QB-09 | Low | UI-UX | Web | Run page order and slip-reference numbering disagree (001, 005, 002…) | Fixed, commit f3ae34ec |
| QB-10 | Low | UI-UX | Web | A support worker is told to ask for an advance, with no form | Fixed, commit f3ae34ec |
| QB-11 | Low | UI-UX | Both | Copy: "1 rows", "1 titles added", an overpayment called a part payment, an empty ISBN list "That is not valid." | Fixed, commit f3ae34ec (payroll copy qb-B, ISBN copy qb-C) |
| QB-12 | Low | Functional | Both | E-resource correction by name is exact-match only | Fixed, commit f3ae34ec |
| QB-13 | Low | Functional | Both | ISBN-10 and ISBN-13 of one book become two titles | Fixed, commit f3ae34ec |
| QB-14 | Low | BDD, Functional | Both | Room-change refusals are 403; a race loser is told the boarder was not found | Fixed, commit f3ae34ec |
| QB-15 | Low | Functional | Web | The roster sends Sunrise accounts to vacancy pages that are 404 while JOB_BOARD is off | Fixed, commit f3ae34ec |
| QB-16 | Low | Functional | Both | "My bus" shows the evening run before the morning one has started | Fixed, commit f3ae34ec |
| QB-17 | Low | UI-UX | Both | Bank names in odd capitals or with a suffix; a misspelt book title; no book on the chapter page | Fixed, commit f3ae34ec |
| QB-18 | Low | Functional | Both | 28 Hindi and Marathi names with labels, numbers or a summary; one Marathi name is Hindi | Fixed, commit f3ae34ec |
| QB-19 | Low | Functional | Web | The duplicates page scores different maths questions as 1.0 identical | Fixed, commit f3ae34ec |

### QB-01 · Medium · Functional · Both · Question bank, college scope

1. As zz.appadmin@zz.test, `GET /api/v1/appadmin/quiz-review/chapters`. It answers in 1.9 s with 683 chapters.
2. Read the grade-13 (college) rows.
3. As the same account, `GET …/chapters/college-engineering-technology-f9799239-u1`.

**Expected:** Real unit titles, and no question about the syllabus document.

**Actual:** 9 of 18 generated college units are named after document headings: "Notes:" (a91fd2f9-u1); "Syllabus" ×3; "Intake: 60 Duration: 4 Year"; "MM Curriclum upadated structure 2024"; "BA LL. B., BBA LL.B., and LL. B."; "Core Subjects" ×2. The "Intake" unit serves "What is the total number of marks for the course BTDS 862PE: Robotic Process Automation?" and "…BTDS 864PE: COGNITIVE COMPUTING?". "Notes:" serves biology questions (archaebacteria, Gram staining) under engineering. The 663 school rows have no bare "Chapter N" and no fragment.

**Fix:** Apply `titleFragment` to college unit names, with rules for headings (a trailing colon, Syllabus, Notes, Intake, Duration, Structure, Core Subjects, programme lists); refuse front-matter units; take these nine down until they are renamed.

**Files:** apps/web/scripts/quiz-gen/college.ts (selectCollegeUnit, generateCollegeUnit); src/lib/college-syllabi.ts; scripts/corpus-titles.ts.

**Status:** Fixed, commit f3ae34ec (qb-A). A unit's name is refused when it is cut after a mark ("Notes:"), a label of the document ("Syllabus", "Core Subjects"), the programme's facts ("Intake: 60 Duration: 4 Year"), the document's title with its year ("MM Curriclum upadated structure 2024"), a list of programmes or a sentence (`unitNameRefusal`); a unit headed by the document's title while the document has others is its title page and refused; a lone label, or a document read as one unit, takes the subject its title names ("F.Y.B.A. Psychology Syllabus From 2024-25" → "Psychology", `subjectOfTitle`), else stays refused. Numbers are kept, so no slug moves. A refused unit is left out of the plan and the card, `selectCollegeUnit` refuses it and runs corpus-titles' `titleFragment` on the name, and the loader refuses a new college topic so named. Across the 715 syllabus documents: 956 units drafted, 96 refused, 86 named from the title. Applied through an audited script (owner connection, deleted after): 25 served questions of 7 units taken down OFF_SYLLABUS with a TAKE_DOWN stamp and an audit row each ("Notes:", "Intake…", "MM Curriclum…", "BA LL. B.…", "Core Subjects" ×2, and Data Science's title page, d8534680-u1, whose 3 questions asked about the course); the three "Syllabus" units renamed to their documents' subjects (Foundation Course in Cyber Security, Data Science, Ethical Hacking), their questions on the subject left up and their Hindi and Marathi rows deleted. data:audit gains `college-unit-names`. Test: tests/bank-content-qb.test.ts (QB-01 ×4), tests/college-practice.test.ts (unit 3 "Notes:" refused, the card, the loader).

### QB-02 · Low · Security · Both · Subject teachers (item 1)

1. As zz.subject1, `GET /api/v1/staff/classes/cmut2zwts005x0rf87g0okap6` (Grade 7 · A, English only).
2. Read `class.joinCode`.
3. Open the web page `/teacher/classes/…` and search it for the code.

**Expected:** No join code for a timetable-only teacher (item 1, decision 2).

**Actual:** The door answers `"joinCode":"MMT-7CJT"` with `"formTeacher":false`. The web page does not print it, and the phone hides it in the screen code only. Refused as expected: register read 404, register write 403, report cards 404, weights 404, gradebook export 404, health card 404, /record/<user> 404.

**Fix:** Answer `joinCode: null` in `staffClassDetail` when the caller is not the form teacher.

**Files:** src/lib/api-reads/staff.ts:333; contracts staff.ts.

**Status:** Fixed, commit f3ae34ec (qb-B). `staffClassDetail` answers `joinCode: null` unless the caller is the class's form teacher or the office; the contract's `joinCode` is nullable; the phone shows and shares the code only when one is sent (its empty-roster share door too). Test: tests/qb-b-teaching.test.ts (QB-02), phone teacher-class-detail.

### QB-03 · Low · Functional · Both · Subject teachers

1. As zz.subject1, create work with `subject: "english"`. It is stored as "English", which is right.
2. `GET /api/v1/teaching/assignments/{id}`.

**Expected:** `assignment.subject` is "English". The contract has the field (teaching.ts:49–50).

**Actual:** There is no `subject` key. The web gradebook page does not show the subject either. The pupil, the guardian (web and phone) and the teacher's list do show "English".

**Fix:** Add `subject: a.subject` in `teachingGradebook`, and show it on the page.

**Files:** src/lib/api-reads/teaching.ts:60–72; (app)/teacher/assignments/[assignmentId]/page.tsx.

**Status:** Fixed, commit f3ae34ec (qb-B). `teachingGradebook` answers `assignment.subject`; the web gradebook page and the phone's assignment screen say it after the class. Test: tests/qb-b-teaching.test.ts (QB-03), phone teaching-assignment-detail.

### QB-04 · Low · Functional · Both · Syllabus

1. As zz.subject1, `POST /api/v1/staff/lessons` with `{classId: Grade 3 · A, subject: "english", dateKey: "2026-10-30", topic: "ZZ item12 english lesson"}`. It answers 201.
2. `GET /api/v1/staff/syllabus?classId=…&subject=English`.
3. The same with `subject=english`.

**Expected:** Stored as "English" and listed under English.

**Actual:** Stored as "english". Step 2 does not list it; step 3 lists it alone, with 0 units. The write check uses `matchSubject`, but the store uses `norm()`, which only trims.

**Fix:** Store `matchSubject(subjects, input) ?? norm(input)`.

**Files:** src/lib/syllabus.ts:53, 101.

**Status:** Fixed, commit f3ae34ec (qb-B). A lesson is stored in the class's spelling of its subject (`matchSubject` over the class's subjects, else the typed words tidied), and the syllabus read matches `?subject=` the same way, so "english" lists under English. Test: tests/qb-b-teaching.test.ts (QB-04).

### QB-05 · Low · UI-UX · Both · Subject teachers

1. As zz.subject1, open `/teacher/classes/cmut2zwrn00130rf8ezycwqgy/syllabus`.
2. Open the phone's `/assignments?compose=1`.

**Expected:** The page opens on English (8 units, editable), and classes are listed in grade order.

**Actual:** It opens on "Art" with "No syllabus … plan lessons below meanwhile", but an Art lesson is refused 403. The door without `subject` answers `"subject":"Art","canEdit":false`. `classOptions` puts "ZZ Grade 10 · A" before "ZZ Grade 3 · A" on the web and the phone.

**Fix:** Default to the caller's own subject; hide the "plan lessons" line when `canEdit` is false; sort `classReach` by grade number.

**Files:** src/lib/syllabus.ts:173; src/lib/teaching-reach.ts.

**Status:** Fixed, commit f3ae34ec (qb-B). With no subject asked for, the syllabus opens on the caller's own subject in the class (the first the week meets), else the class's first; a reader who cannot edit is told only that the office writes the list (web and phone, no "plan a lesson" door); the class pickers and lists (classes door, work picker, the web classes, assignments and new-work pages) sort by grade number then name (`inGradeOrder`). Test: tests/qb-b-teaching.test.ts (QB-05 ×3), phone teacher-syllabus.

### QB-06 · Low · Functional · Both · Support staff (2a)

1. As zz.admin, `POST /api/v1/admin/people/support` twice at once with a salary (UPI, ₹12,000).
2. Send it again later.

**Expected:** One person, and every answer carries the salary.

**Actual:** One person was made and audited once. The first answer has the salary; both duplicate answers say `"salary":null,"duplicate":true`.

**Fix:** Read the salary view on the duplicate path.

**Files:** src/lib/support-staff.ts:86, 106.

**Status:** Fixed, commit f3ae34ec (qb-B). A press that finds the worker answers with the salary the first press saved (`salaryViewOf`), waiting up to 5 s for it when the two arrive together; should the first press's salary be refused and its worker removed, the press adds afresh once. Test: tests/qb-b-payroll.test.ts (two presses at once and a third later, all three carry the salary, one person, one audit row).

### QB-07 · Low · Functional · Web · Salary payout (2b)

1. Lock 2026-09 at Northgate.
2. Export `bank-advice`, then `upi-advice`.

**Expected:** Both advices carry the slip reference, since the UTR sheet matches only by Slip Ref.

**Actual:** The bank advice columns are `Sr No, Beneficiary Name, Account Number, IFSC, Amount, Narration`, with no reference. The UPI advice has `Slip Ref`.

**Fix:** Add a Slip Ref column, or put the reference in the narration so it returns on the bank statement.

**Files:** src/lib/payroll.ts:703, 755–761; module-file-headings.ts.

**Status:** Fixed, commit f3ae34ec (qb-B). The bank advice gains a last column, Slip Ref (module-file-headings and payroll.ts), the narration unchanged. Exports cut before this keep their own SHA-256; a new cut has new bytes. Test: tests/qb-b-payroll.test.ts pins the bytes.

### QB-08 · Low · Functional · Both · Salary payout

1. Send a UTR sheet of five lines: 001 good; 002 with 001's UTR; 003 with a wrong amount; an unknown reference; the cash slip.

**Expected:** No line is called recorded, since the sheet is refused whole.

**Actual:** `{"accepted":false,"recorded":0}`, with line 2 `"outcome":"RECORDED"`. 0 rows were written, which is right. The other reasons were right: UTR_TAKEN, AMOUNT, UNKNOWN_REF, MODE.

**Fix:** A distinct outcome (`WOULD_RECORD`) when `accepted` is false.

**Files:** src/lib/salary-payments.ts:200–242; contracts utrSheetAnswerSchema.

**Status:** Fixed, commit f3ae34ec (qb-B). A line judged good on a sheet refused whole answers `WOULD_RECORD` (contract enum widened); `RECORDED` only when written. Test: tests/qb-b-payroll.test.ts (QB-08); tests/salary-payments.test.ts updated.

### QB-09 · Low · UI-UX · Web · Salary payout

1. Draft 2026-09 with a worker named "ZZ item12 Ramu Gardener".

**Expected:** References run in page order.

**Actual:** The page and the door list Anita, Ramu, Rohan, Kale, Kamble (database collation). The references are 001, 005, 002, 003, 004 (code-point sort). Lower-case, accented or Devanagari names will scatter the numbering. Matching stays correct.

**Fix:** One comparator for both, or number at lock and store.

**Files:** src/lib/salary-payment-rules.ts:28–31; payroll.ts:554, 713.

**Status:** Fixed, commit f3ae34ec (qb-B). One comparator (`compareSlips` in salary-payment-rules.ts: name case- and accent-insensitive with numbers as numbers, then exact spelling, then membership id) orders the run page, the door, the files and the references; the database's collation no longer orders slips. A run whose names differ only in case or accents may renumber once (references are read, never stored). Test: tests/qb-b-payroll.test.ts (pure order with a lower-case and an accented name; a run with "ZZ item12 Ramu Gardener" numbered 001 to 004 down the page).

### QB-10 · Low · UI-UX · Web · Support staff

1. As SUPPORT (Sunita Kamble), after the run was paid in cash, open `/account/payslips`.

**Expected:** No invitation to ask for an advance.

**Actual:** "Advances — Ask the office for an advance against your salary…" with no form. The phone does not show it. The rest was right: "Paid on 30 Sept 2026 by Cash", PDF 200.

**Fix:** For SUPPORT, show the card only when an advance exists.

**Files:** src/app/account/payslips/page.tsx:143–160.

**Status:** Fixed, commit f3ae34ec (qb-B). For SUPPORT the advances card shows only when an advance exists, and then without the invitation. Test: tests/qb-b-payroll.test.ts (QB-10).

### QB-11 · Low · UI-UX · Both · Items 2b and 9 copy

| Where | Says | Problem |
|---|---|---|
| Run page | "upi-advice-2026-09.csv: 1 rows" | Plural for one |
| ISBN form | "1 titles added, 0 already in the catalogue." | Plural for one |
| An overpayment | "Record the slip's whole net, 17669.00. A part payment is not recorded." | Called a part payment; no ₹ or grouping |
| A whitespace-only ISBN list | "That is not valid." | Does not say what is wanted |

**Fix:** Plural keys, `formatInr`, a neutral amount refusal and an empty-list key, each in en, hi and mr.

**Files:** (app)/admin/payroll/runs/[month]/page.tsx; (app)/library/actions.ts; src/lib/salary-payments.ts; packages/i18n.

**Status (ISBN copy):** Fixed, commit f3ae34ec (qb-C). The ISBN list's answer is a One or a Many key (`campusForms.isbnAddedOne/Many`, with `…Named` when check digits fail): "1 title added, 0 already in the catalogue." `isbnImportSentence` (college-campus.ts) is the one sentence for the school's catalogue form and the college's campus page, whose "{invalid} ISBNs did not check" it replaces. An empty or whitespace-only paste is refused beside the box with "Paste the list first: one book a line, the ISBN first." (`campusForms.isbnEmpty`). en, hi and mr. Test: tests/qb-c-campus.test.ts (QB-11).

**Status:** The payroll copy fixed, commit f3ae34ec (qb-B): "{file}: 1 row" (`teachPay.exportLineOne`), one refused sheet line in the singular (`teachPay.refuseSheetOne`), and an amount other than the net refused neutrally with the net as `formatPaise` ("₹17,669.00", `teachPay.refuseAmount`; `salaryPay.refusePartial` removed), each in en, hi and mr. The ISBN copy is Part C's. Test: tests/qb-b-payroll.test.ts (QB-11 ×2).

### QB-12 · Low · Functional · Both · E-resources

1. As zz.librarian, add "ZZ item12 DIKSHA" (https) on the web form.
2. Through the door, send "zz item12 diksha" with a moved link.
3. Send "ZZ item12  DIKSHA" (two spaces).
4. Send "ZZ item12 DIKSHA".

**Expected:** One row, corrected.

**Actual:** Steps 2 and 3 each add a row, making three; step 4 corrects. The rest held: non-https refused beside the box; opens counted; the head 403; Sunrise's librarian 404 on Northgate's resource.

**Fix:** A case- and space-insensitive `nameKey`, unique per school (a migration).

**Files:** src/lib/college-campus.ts:102–105; schema LibraryEResource.

**Status:** Fixed, commit f3ae34ec (qb-C). `LibraryEResource.nameKey` (migration 20261031120000_library_eresource_name_key): the name trimmed, every run of spaces one space, lower case (`eResourceNameKey` in contracts, its only writer), unique per school in place of the exact name; the 9 rows of 31 October had 9 distinct keys. `saveEResource` upserts by it, keeps the name as first written, and retries a lost race as the correction. data:audit gains `eresource-name-key`. Test: tests/qb-c-campus.test.ts (the QA's four steps give one row with the last link; two adds at once in different capitals give one row).

### QB-13 · Low · Functional · Both · ISBN list

1. Paste a good ISBN-13 and a bad check digit. The bad one is named, which is right.
2. Paste the same ISBN-13, its hyphenated form and its ISBN-10 `0306406152`.

**Expected:** All three already in the catalogue.

**Actual:** "1 titles added, 2 already"; the ISBN-10 made a second title.

**Fix:** Normalise ISBN-10 to ISBN-13 before the lookup.

**Files:** src/lib/college-campus.ts:125.

**Status:** Fixed, commit f3ae34ec (qb-C). `importIsbnList` reads every line as its ISBN-13 (`isbn13`, contracts), finds a title already catalogued under either form (`isbnForms`; the desk's own single add still keeps an ISBN-10 as typed), adds a book twice in one list once, and stores what is new as its ISBN-13. Test: tests/qb-c-campus.test.ts (the QA's step 2 answers 0 added, 3 already; a title kept as 080442957X is found by 9780804429573).

### QB-14 · Low · BDD, Functional · Both · Room change

As zz.warden: 1. Move a boarder to a taken bed. 2. Move them to bed 3 of a 2-bed room. 3. Make a valid move (works: the old place ends today and the new one starts today). 4. Move that new allotment to two beds at once.

**Expected:** 409 or 422 for the refusals (QA-54), and a clear message for the race loser.

**Actual:** Steps 1 and 2 answer `403 FORBIDDEN` ("That bed is taken.", "This room has 2 beds."). Step 4 gives one 200 and one `404 "That boarder was not found."`. One live allotment remains, which is right. Teacher 403; Sunrise warden 404.

**Fix:** `RuleRefusal` 409 or 422 on `bed`, and a "just moved" sentence.

**Files:** src/lib/college-campus.ts:204.

**Status:** Fixed, commit f3ae34ec (qb-C). `changeRoom` refuses a bed the room lacks as `RuleRefusal` 422 and a taken bed as 409, both about `bed` (the door answers through `moduleFailure`: BAD_REQUEST or CONFLICT with `issues.bed`); the old place is ended only while still ACTIVE inside the transaction, so the second of two moves at once, or a press after the move, is told 409 "This boarder has just been moved to another bed…" (`campusForms.refuseJustMoved`) instead of 404; an id that was never a place stays 404. Test: tests/qb-c-campus.test.ts (two moves together: one 200, one 409, one live place).

### QB-15 · Low · Functional · Web · Sunrise roster (item 4)

1. Open every "Look at" path of the 23 Sunrise staff rows, plus module, family and pupil pages: 147 loads over 40 accounts, judging streamed 404s too.

**Expected:** All open.

**Actual:** 145 of 147 open, with 0 raw keys. `sunrise.spare1` `/vacancies` is 404. `sunrise.admin` `/admin/vacancies` is 200 with a streamed `NEXT_HTTP_ERROR_FALLBACK;404`. `PlatformFeature` JOB_BOARD has been off since 28 Oct 09:30, with ASSISTANT, QUESTION_BANK, EXPERT_SESSIONS, TEACHER_SESSIONS and TEXT_MESSAGING. The vacancy, expert and mentoring workflow rows describe pages that are closed. These held: demo:school-check `--facts` 0 gaps; spot checks (2026-09 PAID 17 of 17; 2026-10 DRAFT; 40 titles and 66 copies; the Chirag Pawar claim waiting; parent35 PAID RCPT/2026–27/000017; parent44 declined in test mode).

**Fix:** The roster marks feature-gated rows; demo-school-check gets a fact for each.

**Files:** scripts/demo-schools.ts (rosterMarkdown); docs/demo-schools.md; scripts/demo-school-check.ts.

**Status:** Fixed, commit f3ae34ec (qb-C). scripts/demo-feature-paths.ts holds the pages each platform switch closes (a test holds it to every layout that calls featurePageLock or requireFeatureSwitchPage); rosterMarkdown marks every such path "(behind JOB_BOARD)" and so on, with a legend saying each switch's state at the run (all seven off on 31 October); demo-school-check's `qb-C` block reads the roster back and makes each gated path a fact (marked, and 404 for every account while off), with a gap for a stray mark. demo:schools rerun. The demo:accounts section (another generator's) still names /expert/availability unmarked. Test: tests/qb-c-campus.test.ts (QB-15).

### QB-16 · Low · Functional · Both · My bus (item 5) and family transport

1. At 03:00 IST on Saturday 31 Oct (a school day), as aarav.deshmukh (a Route 1 rider), open `/student/transport` and the phone's `/transport`.

**Expected:** The morning run (07:35) is next.

**Actual:** "The bus has not started yet · Evening · Waiting", with evening times 14:40–15:05. With nothing LIVE, the sort by `startedAt` (all null) keeps whichever trip loaded first. The logic predates item 5 and is now on the new pupil page.

**Fix:** Choose the next run by the school's clock.

**Files:** src/lib/transport.ts:992–993.

**Status:** Fixed, commit f3ae34ec (qb-C). `nextRunOf` (transport.ts) picks the LIVE run, else the earliest still SCHEDULED by its first stop's time (readStatus has already read a run past its grace as MISSED by the school's zone), else the run most lately due; `familyTransport` takes the clock (`now`) for its day and statuses. Test: tests/qb-c-campus.test.ts (pinned to 03:00 IST on 3 November 2026: the morning, waiting; at 10:00 after it ended, the evening; at 22:00, the evening's end).

### QB-17 · Low · UI-UX · Both · The bank (items 6–8)

1. Read the chapters door and `/appadmin/quiz-review/chapter/civics-12-regional-aspirations`.

**Actual:** Names in odd capitals: "CHANGING TRADITIONS", "THE THREE ORDERS", "TOWARDS Modernisation" (history 11). "Thinkers, Beliefs and Buildings FOUR" is still there (known, item 8). The book is called "India Constitution at Work"; it is printed "Indian Constitution at Work". The chapter page heading "Regional Aspirations · Class 12 · Civics · NCERT" has no book. These held: class 12 civics rows name their book (8 rows; Contemporary World Politics waits for the run); Balbharati has 49 chapters with questions (6 maths 17, 6 science 13, 8 science 19); no bare "Chapter N".

**Fix:** An audited case rename; `NCERT_BOOK_TITLES`; `book` on the chapter door and page.

**Files:** scripts/quiz-gen/select.ts; src/lib/chapter-title-case.ts; src/lib/bank-desk.ts; appadmin/quiz-review/chapter/[slug]/page.tsx.

**Status:** Fixed, commit f3ae34ec (qb-A). `fixShoutedTitle` (chapter-title-case.ts) puts a run of capitals in title case, abbreviations kept, and the generator's `chapterTitleOf` applies it ("HUMAN SETTLEMENTS" → "Human Settlements"). Audited renames: "CHANGING TRADITIONS", "THE THREE ORDERS", "TOWARDS Modernisation", "early societies", "empires" and "Thinkers, Beliefs and Buildings FOUR" (now "Thinkers, Beliefs and Buildings"), name, line and batch file. `NCERT_BOOK_TITLES` gains keps2 "Indian Constitution at Work"; `npm run quiz:book-lines -- --grades=11 --apply` rewrote the 2 lines and 2 batch files, a second review 0 and 0. The chapter door carries `book` (contract) and the page's heading reads "Class 11 · Civics · NCERT · Indian Constitution at Work". Test: tests/bank-content-qb.test.ts (QB-17 ×2); live on :3000.

### QB-18 · Low · Functional · Both · Bank translations (items 6 and 10)

1. Scan the 1,298 live hi and mr names.

**Expected:** No labels or end marks.

**Actual:** 28 fail; 0 trailing end marks. They include maths-6-patterns-in-mathematics "गणित कक्षा 6 अध्याय 1 - …"; maths-6-prime-time "5. अभाज्य समय"; science-7-adolescence… hi "कक्षा 7 विज्ञान: अध्याय 6 — …", whose mr value is Hindi; science-6-measurement-of-length-and-motion, which carries the summary sentence; civics-11-constitution… "अध्याय नौ: …"; geography-12-… hi "चौथा अध्याय" against mr "नऊवा अध्याय"; maths-9-chapter-3 "अध्याय 3"; the college units with "इकाई 1 -".

**Fix:** Widen `cleanTranslatedName` (class or subject prefixes, "अध्याय N" before a dash or colon, a leading "N.", summaries over about 80 characters); delete the wrong-language mr row; list the rest for the speaker.

**Files:** scripts/quiz-queue-load.ts; QuizTopicTranslation rows.

**Status:** Fixed, commit f3ae34ec (qb-A). `cleanTranslatedName` also drops a class and subject in front, a label with a number in words or an ordinal ("अध्याय नौ:", "चौथा अध्याय -"), a unit's label ("इकाई 1 -"), a number in front ("5.") and a summary run on after a danda or full stop, and gives no name over 80 characters; `translatedNameFor` gives no name to a Marathi row in Hindi or a Hindi row in Marathi, and the loader uses it. Applied through the audited script: 47 rows, 27 cleaned and 20 deleted (English shows): the science-7 adolescence mr row and science-7 life-processes mr row (Hindi), eight Hindi rows written in Marathi (six Balbharati class 6 maths, Balbharati 8 health, one college unit), maths-9-chapter-3's two bare "अध्याय 3", and the renamed or taken-down college units' rows. data:audit gains `bank-translation-names` (1,280 names read, 0 FAIL). Left for a speaker: meaning, not form (for example history-12-kinship-caste-and-class "किंग्स एवं जाति एवं वर्ग", Kinship read as Kings; geography-12's hi and mr names cleaned of "चौथा/नऊवा अध्याय"). Test: tests/bank-content-qb.test.ts (QB-18 ×2).

### QB-19 · Low · Functional · Web · Duplicates finder (0bac269d)

1. `GET /api/v1/appadmin/bank/duplicates`: 0.71 s, then 0.40 s; the page took 2.9 s.
2. Compare the 500 pairs.

**Expected:** 1.0 means the same question.

**Actual:** 90 pairs are identical. 17 pairs at 1.0 are different questions: "What is (−3) + 3?" and "What is √3 × √3?"; "What is 2⁵?" and "What is (2³)²?"; "x² in (1 + x)⁵" and "x³ in (1 + x)⁶"; "sin⁻¹(1/2)" and "sin⁻¹(−1/2)". The answer is capped at 500 pairs and does not give the total.

**Fix:** Keep digits and symbols in the comparison and give 1.0 only to equal stems; add `totalPairs`.

**Files:** src/lib/bank-tools.ts:253–260, 334–340, 437.

**Status:** Fixed, commit f3ae34ec (qb-A). NORM stays the index's expression and finds the candidates; each is scored on strict stems that keep every digit and symbol (signs, roots, powers, brackets, a decimal point) and drop only spaces, quotes, sentence marks and a hyphen inside a word: 1.0 for equal strict stems alone, else pg_trgm's measure over the characters, kept at 0.8 or above. The stored report is read under new rows (t2/e2), so the old scores are not served. The answer and contract carry `totalPairs`; the page says "The 500 closest of 537 pairs are listed." Live: 537 pairs, 100 at 1.0, all equal stems; sin⁻¹(1/2) against sin⁻¹(−1/2) now 0.896. Test: tests/bank-tooling.test.ts (QB-19, five stems in the database), tests/bank-content-qb.test.ts (QB-19).

## 3. Coverage summary

| Area | Held | Findings |
|---|---|---|
| 1 Subject teachers | 26 checks: picker (8 classes, English); create with english, Mathematics 422, none filled in; publish ("New English work set" to 6 pupils and 3 guardians); gradebook and grade save; another's work 404; English progress 200 and Mathematics 403; remark 201; register 404 and 403; report cards, weights, export, health and record 404; pupil and guardian see the subject (web and phone); phone compose chips; web class notice; Sunrise ids 404 | QB-02 to 05 |
| 2 Salary payout | 34 checks: worker with no email, phone or password, E.164 phone, audit without it; two presses one person; VPA sealed and masked; bad VPA 422; DRAFT pay 409; lock; bank, UPI and PF files; sheet refusals all or nothing; sheet twice at once (3 recorded, 3 ALREADY); pay-page link `upi://pay?pa=…&pn=…&am=17669.00&tn=Salary%202026-09&cu=INR`; part, over, duplicate UTR, bad UTR and date refusals; three presses at once give one payment and two 409s; cash makes PAID, void returns LOCKED and clears paidAt, second void 409, re-record PAID; PAID refuses redraft, relock and edit; Tally XML and CSV with three Payment vouchers; SUPPORT's own payslips (web, phone, PDF) and 403 elsewhere; no VPA or account in 7 admin doors, the head's view, audit rows or notices | QB-06 to 11 |
| 3 Menu and head's pages | 14 checks: nav-groups Playwright 18 of 18; 57 admin and 52 head links open (no streamed 404); phone More with and without the duty; Southbank admin 404 and 403, /principal/staff 200, adminDuties []; grant in a browser opens at once and notifies, take-back closes again; no-head rule at Shastri; demo admins hold the duty | none |
| 4 Sunrise demo | 6 checks: roster walk 145 of 147, 0 raw keys; facts 0 gaps; database and page spot checks | QB-15 |
| 5 Fees and doors | 17 checks: route fees "  TERM   2 " and "Term 2" at once, both already 12; mess bill twice at once, both already 10; demands 119 before and after; warden, librarian and head 403; 9 college-only doors 404; squad rounds 404; /student/transport for a rider and a non-rider; e-resources, ISBN and room-change happy paths and refusals | QB-12, 13, 14, 16 |
| 6 The bank | 9 checks: matrix 0.65 s; chapters 1.9 s, 683 rows; class 11–12 books; Balbharati 49 chapters; 1,298 hi and mr names scanned; generation card and the previous run's nothing-new (3) and failed (1) lists; chapter pages; duplicates in seconds | QB-01, 17, 18, 19 |
| 7 Security | 45 checks: tenant fences 404 (payroll payment, void, PDF, statement, pay page streamed 404, salary save 422; teaching doors; e-resource; room change); 8 write doors × 8 roles 403 except each desk's own; kind gate 9 doors 404; body caps 413 on 9 doors; no staff VPA or account in any answer read | QB-02 |

**Untested:** the server log for a VPA or account (the dev server's output was not readable from the tester's session); the payment, sheet, room-move and e-resource-correction forms pressed in a browser (the same functions were driven through their doors; the add form, the ISBN form and the grant were pressed); a forged grant server action across schools; a device; Hindi and Marathi read by a speaker; sweep, api:sweep (standing rule), next build, the Linux baselines; a generation run under the plan of items 7 and 8 (the run was stopped and being restarted by the coordinator); a real Tally import, a real UPI app or a real bank file.

## 4. Bugs to fix before release

In priority order: 1. QB-01: take the junk units down, then fix the naming. 2. QB-02. 3. QB-07 and QB-08. 4. QB-04. 5. QB-18 and QB-17. 6. The rest.

## 5. Missing test cases

- staffClassDetail has no joinCode for a timetable-only teacher.
- The gradebook returns the subject.
- A lesson's subject takes the timetable's spelling.
- The support duplicate answer carries the salary.
- The bank advice has a Slip Ref; a refused sheet calls no line RECORDED.
- E-resource names match in any case or spacing; ISBN-10 matches ISBN-13.
- Room change answers 409 and 422.
- familyTransport picks the morning run before any trip (pinned clock).
- A data:audit check over translation names and college unit names.
- Duplicates never give 1.0 to different maths stems.
- demo-school-check facts for feature-gated roster paths.

## 6. High-risk areas

- The college generation scope (QB-01): the title rules of items 6–8 are school-only.
- Salary payments against a real bank return and a real UPI app (QB-07; counsel on the intent link).
- Subject-teacher reach through the opened doors not walked here: class analytics, practice insights, class live channels, incidents.
- Feature-switched demo pages (QB-15).

## 7. Remediation plan

1. Bank content: QB-01, QB-18, QB-17. Half a day, no schema change.
2. Payroll paper trail: QB-07, 08, 09, 06, 10 and the payroll copy of QB-11. Half a day; recut the export digests.
3. Teaching: QB-02 to 05. A few hours; contracts change, so run api:docs.
4. Campus forms: QB-12 (migration), 13, 14, 16 and the ISBN copy of QB-11.
5. Demo and desk: QB-15 and QB-19.
6. Re-run this pass's probes.

## 8. What this pass wrote and how it was removed

Everything was at ZZ Northgate unless named, between 2026-10-30 21:10 and 22:30 UTC. All of it was deleted or put back by id in one transaction or as noted.

| Wrote | Removed or put back |
|---|---|
| Assignments cmvvh1t3e00020rva7zabk1f7 (published, 1 grade) and cmvvh1tw700060rvanmntthxu | Deleted with the grade |
| 19 notices: 9 work set, 2 marked, 2 remark, 5 payslip ready, 1 head duty | Deleted |
| SyllabusProgress cmut2zx1t00zk0rf8ve300nz2 (author changed) | Author and updatedAt put back |
| LessonPlan cmvvh52jx001a0rvac28b03bp | Deleted |
| RemarkThread cmvvh5r0k001e0rvamdtbmh0o and its message | Deleted |
| Support worker: User cmvvhb9jo001n0rva9733k8li, Membership cmvvhb9jx001p0rvayvx8zp4s, StaffRecord, StaffSalary | Deleted |
| PayrollRun 2026-09: 5 slips, 3 exports, 6 payments | Deleted; Northgate has only 2026-08 LOCKED |
| zz.admin.b HEAD_PAGES grant | Taken back in the browser; dutiesJson [] |
| 4 LibraryEResource rows, 2 LibraryTitle rows (cmvvib20b006g0rvaacdbiyai, cmvvibee2006l0rvazaywf96w) | Deleted |
| HostelAllotment moves (cmvvicwct006r0rvadp9woijg, cmvvid45o006v0rvarvo7dt1f, and cmvvijan0006z0rvakyrtk105 from a role-gate probe) | Deleted; czzhallot000000000001 back to ACTIVE with its keys |
| Sunrise route fees and mess bill pressed 4 times | Nothing raised; demands 119 before and after |
| 107 minted sessions; harness e2e sessions | Purged; teardown; 0 left |

**Left on purpose:** 46 audit rows, because the log is append-only: assignment.draft 2, assignment.publish 1, grade.save 1, syllabus.progress 2, syllabus.lesson 1, remark.create 1, staff.support.add 1, payroll.salary.save 2, payroll.run.draft 1, payroll.run.lock 1, payroll.export.sealed 2, payroll.export 1, payroll.paymentRecorded 6, payroll.paymentVoided 1, payroll.upiIntentShown 1, tally.export 4, people.headDuty.set 2, library.eresource 5, library.isbnImport 3, hostel.roomChange 3, fees.routeFees (Sunrise) 2, fees.messBill (Sunrise) 2.
