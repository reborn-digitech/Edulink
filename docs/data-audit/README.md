# Data-flow audit: derived fields, drift, and what is not collected

Written 2026-09-24 from a read of every derived value in `apps/web/src/lib` (three area inventories), a
column-by-column scan of the development database, and the repeatable audit suite that recomputes each
derived figure from its source rows. The suite's latest run is in [latest.md](latest.md).

## 1. The audit suite

`apps/web/tests/data-audit.test.ts`, run with:

```bash
cd apps/web && npm run data:audit
```

It is skipped by the normal battery (`DATA_AUDIT=1` switches it on) because it reads a populated database
rather than planting its own rows. It covers the two demo schools and ZZ Northgate by default;
`DATA_AUDIT_SCHOOLS=slug,slug` narrows or widens that. Every finding is written to `latest.md` at three
levels: **FAIL** is a contradiction the code should never produce and fails the suite; **WARN** is drift a
later edit causes by design, or a population gap; **INFO** is a figure worth reading.

### What the 29 checks recompute

**Stored copies against their source rows**

| check | what is recomputed |
|---|---|
| pen-mirror | `PupilRecord.penNumber` never contradicts `User.penNumber`; records lagging behind the account; PEN holders with no record |
| pen-change | an APPLIED request put its number on the account; a PENDING one still matches its `fromPen` snapshot |
| fee-demand | `paidPaise` = Σ allocations of PAID/REFUNDED payments; status OPEN/PART/PAID follows it; `net = gross − concession`; untouched demands still match their instalment's lines |
| fee-payment | a PAID payment is fully allocated less settled refunds; it has a receipt; `feeReceiptNext` is above the highest receipt; serials are unique |
| report-card | `overallPercentMilli` is the mean of the subjects snapshot; `overallLetter` and each subject's letter come from the card's own scale; `gradePointsMilli` is the mean of subject points; each paper's letter from its own percent |
| report-card-attendance | `attendancePresent/Total` equal the register between the card's dates (PRESENT+LATE over all marks), unless the register changed after the card |
| exam-sitting | a sitting's `pointsMilli` and title mirror its paper and series; a series' term contains its first paper |
| submission | RETURNED means a grade exists; a grade on a SUBMITTED row is a resubmission |
| syllabus | a unit with a TAUGHT lesson is at least IN_PROGRESS |
| substitution | the cover row names the teacher the slot still has |
| membership | a leaver holds no ACTIVE enrolment; nobody on the roll has a departure record; nobody sits in two classes; `gradeLevel` population |
| user-minor | `isMinor` follows the date of birth |
| attendance-session | a register that counts as taken holds marks |
| admission | ADMITTED names a membership; offers past their date; settled applications still holding an entrance slot; PEN on applications |
| certificate | the snapshot printed the PEN the account holds; which placeholders printed "—" |
| staff-attendance | a self check-in is LATE exactly when it lands after start + grace in the school's timezone |
| quiz-mastery | right answers never exceed questions seen; every answered attempt has a mastery row |

**API answers against a recomputation from raw rows** (each read through the real route handler with a minted session)

| endpoint | what is recomputed |
|---|---|
| `GET /api/v1/office/pupil-records` | total/complete/incomplete and each pupil's `missing` and `missingForFiling` lists from the nine required and nine filing fields |
| `GET /api/v1/office/filings` | pupils ready, the per-field missing counts, pupils without a local-script name, pupils per grade from live enrolments |
| `GET /api/v1/fees/overview`, `/fees/dues`, `/fees/pupils/{id}` | demanded, collected, outstanding and overdue from the year's demands; plans on the roll; each dues row; three ledgers |
| `GET /api/v1/family/attendance` | the guardian's month: counts per status, total and the whole-percent formula |
| `GET /api/v1/office/syllabus/coverage` | units, done, in progress, percent, expected (elapsed fraction of the year × units) and behind, per class and subject |
| `GET /api/v1/family/report-cards` | the percent shown is the stored milli value; attendance percent from the stored counts |
| `GET /api/v1/office/substitutions` | who is away today (staff register ABSENT/ON_LEAVE, approved leave, a PRESENT mark overriding) and covered/uncovered totals |
| `GET /api/v1/admin/overview`, `/staff/principal/overview` | pupils, teachers and classes on the roll |
| `GET /api/v1/office/circulars` | acked ⊆ seen ⊆ told ⊆ audience, and acked families have an ack row |
| `GET /api/v1/office/staff-attendance/month` | each member's present/late/half/absent on teaching days, and the percent formula |
| `GET /api/v1/office/admissions/cycles` | counts per status and admitted/applied per grade |
| population | school tables with no rows and nullable columns never populated in the audited schools |

### What the first run found and what was fixed

| finding | cause | fix |
|---|---|---|
| 156 published Term 1 cards stored attendance `0/0` while the register held 10 or 11 marks | the fixture builder wrote cards with zeroed attendance | the builder now counts the register between the card's dates the way the generator does (`scripts/zz-fixtures.ts`) |
| two self check-ins at 11:39 marked PRESENT with start 09:00 and grace 15 | the fixture stamped `new Date()` and PRESENT regardless of the hour | the builder applies the app's rule, LATE past start + grace in the school's timezone; the two stale rows from the old builder were removed |
| "seen" and "acked" on circulars did not equal read and ack rows | audit assumption: the counts are families at their best state, and a read notification counts as seen | the check now tests the ordering invariants and that an acked family has an ack row |
| a ZZ attempt with no mastery row | audit assumption: the row is written with the first answer | the check now requires an answered attempt |
| 80 closed-year annual cards with attendance and no register | the demo never enters last year's registers; a closed year's card is frozen by design | reported as WARN, not FAIL |

Final run: 29 checks, 0 FAIL, 6 WARN, 20 INFO.

## 2. Derived values that can go wrong in the product (ranked)

Each line names the code and what the audit or the read found. "Evidence" is from the audited schools.

### Attendance

1. **A register counts as taken with no marks.** `src/lib/attendance.ts:115` upserts the session before any
   mark is validated, so a fully rejected or empty batch still clears "registers missing today". Evidence:
   18 such sessions at ZZ Northgate.
2. **Registers missing today ignores holidays, non-teaching days and empty classes.** `src/lib/insights.ts:506`
   and `src/lib/api-reads/admin.ts:142` compare classes to today's sessions. Evidence: 6 "missing" at each
   demo school on a day with 22 classes and no registers due.
3. **The pupil's percent is not class-scoped and counts EXCUSED in the denominator.**
   `src/lib/attendance.ts:308-322`. A pupil in two classes is counted twice a day; an excused absence lowers
   the percent. The class-level insight (`src/lib/insights.ts:402`) IS class-scoped, so the two disagree.
4. *Fixed 2026-09-27:* `currentStreakFor()` walks every mark back to the first day not attended; the three
    home pages read it instead of the summary's thirty-mark list. **The streak tops out at the 30 most recent marks** (`attendance.ts:339`) and at 28 days on the home
   pages, so a longer real streak is under-reported.
5. *Fixed 2026-09-27:* the tile averages every marked piece of homework on the web page and the phone read;
    the five newest are only the list. **The parent's "average across N pieces" is over the five most recent homework marks only**
   (`src/app/(app)/parent/page.tsx:128-137`).

### Exams and report cards

6. **A series made through the API carries no term until something fills it**, and a series with no term is
   off every term and annual card (`src/lib/exams.ts:233`). Evidence: "Unit Test 1" and the e2e series at ZZ
   Northgate sit inside Term 1 with `termId` null.
7. **The sitting's max marks and title are copies** refreshed only by `saveMarks` (`exams.ts:682, 937`); a
   changed paper max or a renamed series leaves the card reading the old values.
8. **Cards without a scale/subjects snapshot render with today's config** (`report-cards.ts:917`), so a band
   change rewrites history for them. Evidence: 6 legacy cards at ZZ Northgate.
9. **CBSE "E" carries null points, so failed subjects drop out of the grade-point mean and raise it**
   (`report-card-rules.ts:234`).
10. **Annual combination silently drops terms with no weight once any term has one**
    (`report-card-rules.ts:219-231`).
11. **The web card says "weighted" whenever subjects exist; the PDF reads `gradingMethod`** — the two labels
    can disagree (`report-cards/[cardId]/page.tsx:159` vs `report-card-pdf.tsx:125`).
12. **`Grade.letter` is wiped to null on every web save** (`grading.ts:641`); only API v1 can set it.
13. **The year archive averages per-assignment percents** (`year-archive.ts:183`), the method
    `grading.ts:24-31` says not to use, and windows on `gradedAt`, which exam edits never bump.

### Fees

14. **The ledger's paid total includes CARRIED demands while its net excludes them** (`fees.ts:664-665`), so
    paid can exceed net after a carry-forward.
15. **The overview's by-grade table groups on `Membership.gradeLevel`, which nothing in the app writes**
    (`fees-reports.ts:99`); every pupil lands in "—". Evidence: 96 of 96 demo pupils have no gradeLevel.
16. **A 100 % concession makes a demand PAID with `paidPaise` 0, so it is never "untouched" and revoking the
    concession never reopens it** (`fees.ts:403, 423`).
17. **An AMOUNT concession on "all heads" is applied to every line of every instalment** (`fees.ts:380-388`).
18. **Refunds cut allocations at request time, before the gateway settles** (`fees-payments.ts:630-637`), so the
    ledger is not append-only and a failed refund leaves the demand reopened.
19. **Pupils who have left keep their plan and vanish from dues and the defaulter export**
    (`fees-reports.ts:177`), while still counting as "on plan".
20. **A receipt's year is `demands[0]` of an unordered query** (`fees-payments.ts:125`), so a payment spanning
    two years can land in either serial series.
21. **Stale claims use two different cutoffs** (school's today − 3 days in `listClaims`, now − 3 days in the
    overview).

### Certificates and departures

22. **A re-admitted pupil keeps the old `SchoolRecord`**, which `certificates.ts:132-134` treats as the
    departure, so a new certificate prints the old leaving date and reason. Admissions and intake readmission
    do not delete it; `join.ts` does.
23. **The PEN prints "—" when the pupil has no `PupilRecord`** even though the account holds one
    (`certificates.ts:148`).
24. **The certificate header, class and issuer are read live while the body is a snapshot**
    (`certificates.ts:275-303`); the public verify page uses the snapshot's school name.
25. **"child of X and Y" prints "—" when either parent is blank**, and the legacy TC prints the platform
    join code as "School's code" and the platform join date as "Date of admission".
26. **`CertificateRequest.status` stays ISSUED after the certificate is revoked.**

### Filings (UDISE+ and boards)

27. **Social category is coded only for GENERAL/GEN/SC/ST/OBC**; NT, VJ, SBC, EWS and any local-language
    value the form's own hint suggests code to "" while the pupil still counts as "ready" (`filings.ts:66, 293`).
28. **Any unrecognised religion codes as "7 — Not minority"** (`filings.ts:294`), so a typo changes a
    minority flag.
29. **Section defaults to "A"; previous-year class is grade − 1; result is always "pass"; RTE is derived from
    EWS; "not asked" CWSN codes as "No"** (`filings.ts:273-311`). Repeaters, failures, RTE admits and
    unasked disabilities are all misreported.
30. **The teacher's service start and present-school start are the same field** (`StaffRecord.joinedOn`,
    falling back to `Membership.joinedAt`), and the DCF's date of birth comes from `User.birthdate` only.
31. **Roll numbers are a running counter over a sort that goes NaN on non-numeric grades**, so they can
    restart or duplicate.

### Admissions and intake

32. **Offers never expire**: `offerExpiresAt` is written, nothing moves OFFERED past it. Evidence path: no
    job and no read checks it.
33. **Settled applications keep their entrance slot** and inflate `slot.booked` (`admissions.ts:256`).
34. **`admissionNumber` on the record is set to the application serial** when the office types none
    (`admissions.ts:806`); the UDISE sheet then files the app's serial as the GR number.
35. *Fixed 2026-09-27:* the row is admitted with `warnKey` `intake.penTaken` or `intake.penDiffers` and the
    intake page badges it. **A transfer row's PEN conflict is swallowed** (`intake.ts:246`), so a wrong or taken number is dropped
    without a warning.

### Communication and engagement

36. **An auto-read or mark-all-read notification counts as "seen" on a circular's reach report**
    (`circulars.ts:198` with `notification-housekeeping.ts:73`).
37. **A family with no guardian is UNREACHED forever**, and the audience is today's roster, not the roster at
    publish time. *Fixed 2026-09-26 (the first half):* the reach report names families with no guardian
    apart (`noGuardian` on the family, the class and the totals), keeps them out of a PARENTS circular's
    count so the figure measures what a reminder can move, and flags them in the outstanding list for the
    office to invite. *Fixed 2026-09-27 (the second half):* once told, the roster is the class at delivery —
    enrolled before `deliveredAt`, including anyone removed since — so a later joiner is not unreached.
38. **UNDELIVERED texts count in both sent and failed on a broadcast** (`messaging.ts:484-500`); the monthly
    cap and overview use the UTC month, not the school's. *Fixed 2026-09-26 (the first half):* a row is sent
    or failed, never both, on the broadcast counters and the month overview alike, so queued + sent + failed +
    skipped is the number of rows. *Fixed 2026-09-27 (the second half):* `monthStartFor()` gives the cap and
    the overview the school's calendar month.
39. **Twilio callbacks have no ordering guard**, so a late "sent" can regress DELIVERED.
40. **Quiz `completed` uses a seen-count accumulated across attempts against today's question count**
    (`quiz.ts:392`); reveals never count; permanent badges rely on a unique index over a NULL year that
    Postgres does not enforce. *Fixed 2026-09-26 (the first half):* `completed` is a finished sitting, the
    rule the badge already used — every question of the topic answered in one attempt. *Fixed 2026-09-27 (the
    second half):* a partial unique index over the year-less rows (migration 20260927010000) refuses a second
    permanent copy under a race.
41. **`CompetitionStanding` is not refreshed on consent or cascade deletes.** *Fixed 2026-09-26:* a guardian's
    yes recomputes the board, so a result recorded before consent appears the moment it is given; removing a
    pupil recomputes every board they had a result on once the cascade has taken their entries.

### Staff

42. **Two cover models never reconciled**: the timetable grid reads `AttendanceCover`, the board reads
    `Substitution`; cancelling leave removes the first and not the second (`leave.ts:500-560`).
43. **LATE is fixed at check-in and never recomputed; an office override keeps the old `checkedInAt`; a
    stored PRESENT hides approved leave** (`staff-attendance.ts:101-114, 174`). *Fixed 2026-09-27 (two of
    three):* saving the clock re-reads today's self check-ins against it; an office mark other than PRESENT or
    LATE clears the check-in time. The leave shows beside a stored PRESENT as `onLeave` already.
44. **The principal's leave card counts days with the default week and no holidays**, while the balance uses
    the school week and calendar (`principal/leave/page.tsx:238` vs `staff-records.ts:226-250`). *Fixed
    2026-09-26:* `leaveDayCounterFor()` loads the school's week and closures once for the queue's window and
    the card's "this request" runs on it.
45. **The pending-leave list is cut at 300 rows ordered with PENDING last**, so it can disagree with the
    home page's count (`leave.ts:603`). *Fixed 2026-09-26:* the queue is read first and whole, the history
    fills what is left of the 300.

### Accounts

46. **`isMinor` is stamped at creation and never recomputed** (audit: none out of step today, but every
    17-year-old will be). *Fixed 2026-09-26:* the daily `accounts:tidy` job clears the flag for every account
    whose date of birth is eighteen or more years past; a corrected date still recomputes on its own path.
47. **`Membership.suspendedAt` is left set when `join.ts:219` reactivates a suspended pupil.** *Fixed
    2026-09-26:* the stamp and the reason go with the status, as on the reinstate, admission and intake paths.
48. **`Invite.status = EXPIRED` is never written**, so "invites pending" and the operator's "no admin" count
    expired invites. *Fixed 2026-09-26:* `accounts:tidy` marks every lapsed PENDING invitation EXPIRED each
    night, and every "waiting" count and list reads the date as well as the status, so it is right between runs.

## 3. Data the code reads that nobody can enter

| column | read by | how it is populated today |
|---|---|---|
| `Membership.gradeLevel` | fee reports by grade, dues and collections CSV, receipt snapshot, certificate `class.grade`, progress report, cohort sort, the GRADE message audience | only a load script and the superuser merge; never the app |
| `Grade.letter` | gradebook rows, API teaching reads | API v1 only; the web gradebook wipes it |
| `AttendanceSession.finalizedAt`, `.note` | attendance reads, staff API | never written |
| `Competition.registrationOpensAt` | `registrationOpen` | never written; null counts as open |
| `ExpertBooking.status = COMPLETED` | the expert's `sessionsDone` | never written; always 0 |
| `MeetingBooking.cancelledAt` | slot state | never written; a cancel deletes the row |
| `FeeDemand.status WAIVED/CANCELLED`, `FeeRefund.status FAILED` | filters and labels | never written |
| `Term.position`, `SyllabusUnit.periodsPlanned`, `LessonPlan.homework` | written but read by no computation | dead or display-only |
| `Application.penNumber` | admission linking | optional on the form; 0 of 21 applications carry one |
| `HealthCard.doctorName/Phone`, `PupilRecord.caste`, `School.logoPath`, `Assignment.rubric`, `ExamSlot.startMinute/endMinute`, `StaffRecord.staffNumber/qualification` | printed or exported | never populated in any school, demo or ZZ |

## 4. Data the school needs that no column holds

Verified against `prisma/schema.prisma` (no column, no model):

- **Guardian occupation, education and annual income** — the UDISE+ student form and RTE/EWS verification ask for them; the app records only name, phone and relation.
- **A previous school's TC number and date, and the class and result there** — the filing's previous-year columns are derived only for pupils who were already here.
- **Roll number** — computed from sort order on the fly; nothing stores the number the school actually assigned.
- **Class section as data** — `Class.section` exists but is null on most classes; the filing invents "A".
- **A pupil photo, an emergency contact separate from the guardians, sibling links, transport route or stop, hostel or day-scholar status, house** — none exist. The health card holds allergies and a contact string, which is the nearest thing.
- **Immunisation records** and a **disability certificate number and percentage** — the health card is free text; UDISE+ asks for the CWSN type only, but scholarship and board forms ask for the certificate.
- **A bank account for scholarship transfer (DBT)** and **caste or income certificate numbers** — nothing holds them; the decision to hold none should be a policy row, as Aadhaar's is.
- **Staff date of birth, date of joining service as distinct from joining this school, training records and the UDISE teacher national code** — the DCF export leaves these blank or reuses one date.
- **Aadhaar** — deliberately never held (policy 0002); the UDISE sheet leaves the column blank, which is the intended state.
- **The remaining blank UDISE+ columns with no source**: AAY, scholarships received, free uniform and textbooks, SLD/ASD/ADHD screening, stream and vocational fields, mainstreamed date, alternate mobile.
- **A pass/fail or promotion result on the report card** and **a rank** — deliberately not computed (`insights.ts:20-29`); the filing's RESULT column therefore never says "fail".

## 5. Demo data that is thin

The two demo schools populate every workflow but leave these empty, so a demo cannot show them:
`FeeConcession`, `FeeRefund`, `Holiday`, `Invite`, `RemarkThread`, `Report`, `ScheduledDeparture`, `SchoolRecord`,
`PracticeAssignment`, `CompetitionEntry` and `CompetitionStanding`; last year's registers (so the closed-year
annual cards carry attendance figures with no register behind them); `Application.penNumber`;
`HealthCard.doctorName/Phone`; `PupilRecord.caste`; `School.logoPath`; exam paper start and end times;
`StaffRecord.staffNumber`. `Membership.gradeLevel` is empty everywhere because nothing writes it.

## 6. Recommended next steps, in order — done 2026-09-24

All ten were taken up the day after the audit. What each became:

1. **Grade level** — `Membership.gradeLevel` is now a kept copy: `src/lib/grade-level.ts` writes it from the live class on every enrolment path (join by code or invite, intake, admission, the class roll, promotion), a migration backfilled every pupil on a roll, and the audit fails when a copy disagrees with the class.
2. **Departure record** — admissions and intake delete the old `SchoolRecord` and `ScheduledDeparture` when a pupil comes back; intake also revives a removed enrolment instead of failing on the unique index.
3. **Registers** — a session is written only once a mark in the batch is valid; `registersDue()` counts only classes with pupils, on open days, and the admin, principal and teacher pages read it (the teacher's list respects who may take the register). The 18 empty ZZ sessions were removed.
4. **Exam series** — the term is derived from the earliest paper on every paper change; the sitting's max and title follow the paper and the series name; a migration gave existing series their term.
5. **Offers** — an `EXPIRED` status, an hourly `admissions:expire-offers` job that tells the family and audits a count, expiry applied on read as well, and entrance-slot bookings that count only live applications.
6. **Filing codes** — category and religion are coded choices on the record (VJ, NT and SBC file as OBC; Hindu and Other as not-minority; an unknown religion codes blank, not "not minority"); an uncodable category counts as missing; certificates print the code as a word in their language.
7. **Cover models** — cancelling an approved leave clears `Substitution` rows with the `AttendanceCover` rows; a PRESENT, LATE or HALF_DAY register mark takes a teacher off the board; the timetable grid shows the board's substitute; "my covers" hides covers for a teacher no longer away or on a closed day.
8. **Fees** — a fully waived demand reopens when the concession is revoked; a flat all-heads concession is taken once per instalment; the ledger's paid total excludes carried and cancelled demands; a receipt's year is the earliest-due demand's.
9. **Collection gaps** — new columns: the previous school's TC number and date, each parent's occupation, the family's annual income, the roll number on the enrolment (the office's to set), the teacher's date of birth and first day in service; on the record form and the staff panel on web and phone; the DCF sheet prints them and the student sheet prints the assigned roll number.
10. **Demo data** — last year's registers behind every annual card, the calendar, a concession, a refund, an invite, a remark thread, a report, a practice assignment, a leaver with a departure record, a scheduled departure, a competition entry with its standing, and every column that was never filled.

The audit's checks for items 1, 3, 4 and 5 were tightened from WARN to FAIL. The original list, for the record:


1. Write `Membership.gradeLevel` on enrolment and promotion, or drop it and read the class's grade everywhere it is used (fees by grade, certificates, the GRADE audience).
2. Delete the old `SchoolRecord` on readmission through admissions and intake, as the join-code path already does.
3. Only upsert an attendance session once at least one mark is valid; exclude closed days and empty classes from "registers missing today".
4. Fill a series' term at creation and on every paper-date change, and refresh the sitting's max and title from the paper.
5. Expire offers on a job and release the entrance slot when an application settles.
6. Code the filing category from a fixed choice list instead of free text; refuse "ready" while the value is uncodable; treat an unknown religion as blank, not "not minority".
7. Reconcile the two cover models, or make leave cancellation clear both.
8. Reopen a 100 % concession demand when the concession is revoked; exclude CARRIED from the ledger's paid total; order the demands the receipt year is read from.
9. Add the collection gaps in section 4 that the school actually files: guardian occupation and income, previous-school TC number and date, roll number, staff date of birth and service start.
10. Seed last year's registers and the empty tables in section 5 so the demo carries every workflow's data.

## 7. Second pass (2026-09-24): every report and filing, cell by cell, and the inputs behind them

A second suite, `apps/web/tests/data-audit-reports.test.ts` (run by the same `npm run data:audit`, report in
[reports.md](reports.md)), cuts every sheet the app produces and recomputes it from raw rows: the UDISE+
student sheet across eighteen coded columns per pupil, the enrolment tables summed back to the roll, the
teacher profile's codes and both dates, the CBSE and MSBSHSE sheets by pupil and name order, the filings
readiness counts, the register and enrolment CSVs, the fee collections and outstanding CSVs, the staff month
CSV and every leave balance, report card papers against the grades, certificate snapshots against the
account, leaving certificates against the membership, class insights and the progress report over their
windows, the closed year's archive, the messaging month and every broadcast's counters, the retention
preview, quiz mastery and competition standings. A final check counts, per school, every input a sheet,
certificate or receipt needs that is still blank. Run: 18 checks, 0 FAIL, 148 WARN, 69 INFO; with the first
suite, 47 checks and 0 FAIL.

### What the second pass caught

- **A test that deleted every school's 2025 registers.** `tests/attendance.test.ts` cleaned up with
  `attendanceSession.deleteMany({ dateKey: { startsWith: "2025-" } })` and no school, so each full battery
  took the 2025 registers of every school in the database, including the demo schools' last year (the annual
  cards were left saying 221 of 237 days while the register held 86 of 93). The cleanup is now scoped to the
  suite's own school and the demo registers were rebuilt. The ZZ simulation schools and Riverside lost their
  2025 sessions too; the ZZ ones come back with their builders, Riverside's were seed data.
- **The filings, exports and figures all agree with their rows** for the three audited schools. What the
  run reports is drift and blanks, not contradictions: two demo leaving certificates whose frozen attendance
  predates the register that was seeded after them; six pupils per demo school with no gender; 17 of 47 with
  no guardian and so no phone on the UDISE+ sheet; 35 of 47 without a name in the school's script; every
  teacher without a phone; ZZ Northgate with 42 pupils filing "Not on record" for category.

### Derived-data gaps still in the reporting code (ranked) — all 21 fixed 2026-09-24

Every gap below was closed the same day; the list stays as the record of what each was. In short: the UDISE+
previous-year columns now key on the admission date and the academic year, attended days are distinct days,
the enrolment tables file VJ/NT/SBC as OBC and carry an "Other" class column so every table sums to Total,
grade 1's previous class is PP3, the Maharashtra middle-name fallback runs, the medium matches by containing
the language, classes-taught composes the DCF's nine codes and ignores archived classes, the designation
column prints a subject code or nothing, Basic Maths is 241, a staff category off the list is refused and
the list is the pupil's, readiness needs the date of birth, both parents and a coded class; the register
CSV and month grid use the month's own roll and an empty day is blank; absence flags read only the roll,
one day once, with EXCUSED neither present nor absent; outstanding is Σ max(0, net − paid) per demand
everywhere, leavers stay on the dues list flagged `left`, a carried demand's paid money stays in its year,
reminders and the overdue text take only the current year's pupils on the roll, and the fee month and range
run in the school's zone; an "exams" card's rows sum to its overall, every percent is rounded once and the
letter read from it, the card and the certificate print the legal name, the class label is frozen at
publish, and "issued on" is the school's day on both papers; every year-archive window is the school's day,
the roll excludes suspended pupils and keys on the admission date, leavers come from the membership, and a
teacher's archive counts only what they took, set and wrote; progress and the report's overall follow their
window; the staff CSV prints open days only and keeps a mid-month leaver, working days stop at today with
the month's total beside them; the certificate's attendance is the whole stay, one rounding in both views,
marks after a backdated leaving date are excluded, the TC serial carries the academic year, legacy rows are
numbered by leaving date; and identifier columns stay text in the workbook. The audit suites were updated
to the new rules and pass 47 of 47.


Found by a second read of every report library. File and line as of this commit; none is caught by the
suite because each needs a row state the fixtures do not hold — the suite's next additions.

**Filings**
1. `filings.ts:277` — "previous year schooling status" is the platform join date by calendar year: in a
   school's first year on the app every pupil files as a new admission, and a June admission exported in
   January files as "was here last year". Use the admission date and the academic year.
2. `filings.ts:246` — "class attended days" counts marks, not days; a pupil on two registers counts twice.
3. `filings.ts:374` — the enrolment tables give VJ, NT and SBC rows of their own while the student sheet
   codes them as OBC, so the two sheets' OBC counts disagree; a grade outside PP/1–12 counts in Total but
   in no class column.
4. `filings.ts:310` — grade 1's previous class files "PP", not a portal code (PP1–PP3).
5. `filings.ts:229` — father's and mother's names never fall back to the linked guardian although the
   comment says they do; `filings.ts:515` — the Maharashtra middle name never falls back when the father's
   name is blank (`"".split()[0]` is `""`, so `??` never runs).
6. `filings.ts:529` — the medium is compared whole to a language name, so "Marathi Medium" codes Marathi as
   a second language; `filings.ts:136` — any mix of grades outside the listed bands files as "3"; archived
   classes still count in classes taught (`:410`).
7. `filings.ts:443` — a designation ("PGT") goes into the DCF's subject column; `filings.ts:478` — every
   candidate gets every subject the grade teaches, `^math` codes Basic Maths as Standard.
8. `staff-records.ts:171` — a staff category off the four-code list (VJ, NT) is silently stored as null and
   the save reports ok.
9. `filings.ts:58` — a pupil is "ready" without a date of birth, parents' names or a live coded class.

**Attendance**
10. `attendance-export.ts:38`, `attendance-history.ts:119` — the register CSV and the month grid list
    today's ACTIVE enrolments, so a past month of an archived class exports no pupils and a mid-month leaver
    vanishes; a session with no marks shows 0 %, not blank.
11. `attendance-intel.ts:68` — absence flags include leavers and suspended pupils, and a day on two
    registers counts twice; an EXCUSED mark resets the run.

**Fees**
12. `fees-reports.ts:81` vs `:167` — the overview counts leavers' demands; the dues page and the defaulter
    CSV drop them, so the overview's outstanding is larger than the CSV's.
13. `fees-reports.ts:184` vs `:102` — dues net across a pupil's demands while the ledger sums each demand,
    so an overpaid demand hides another's balance on the dues row.
14. `fees-reports.ts:358` — carry-forward marks PART demands CARRIED, so money already paid on them drops
    out of every year's paid total; `:268` — "remind now" quotes only the oldest instalment; `:290` —
    reminders and the OVERDUE_FEES text audience carry no year or roll filter, so leavers' guardians are
    texted about dues the office cannot see.

**Report cards, archives, insights**
15. `report-cards.ts:541` — on an "exams" card the overall is marks over maximum, not the mean of the subject
    rows printed beside it; `report-card-pdf.tsx:76` — the letter comes from the unrounded percent while the
    percent is rounded (90.96 prints "91.0 % A2").
16. `report-cards.ts:891`, `certificates.ts:143` — formal papers print the preferred name; the leaving
    certificate, UDISE+ and the boards print the legal name.
17. `year-archive.ts:133` — every window ends at 00:00 UTC on the last day, so anything after 05:30 IST that
    day is dropped; `:306` — the roll counts suspended pupils and uses the platform join date; `:329` —
    readmission now deletes the departure record, so a closed year's leaver count shrinks later.
18. `insights.ts:276`, `reports.ts:124` — progress and the pupil's overall are never windowed although the
    page and the report say they are; only attendance follows the span.
19. `staff-attendance.ts:288` — the CSV prints marks on closed days that the tallies skip; a teacher who
    left mid-month disappears from that month; `workingDays` counts the rest of the month while the tallies
    stop today.

**Certificates and departures**
20. `certificates.ts:136` — a pupil who left in an earlier year gets "—" for attendance because the window
    runs from this year's start to the leaving date; `school-record.ts:199` — a backdated leaving date still
    counts marks after it; `:513` — the TC serial uses the calendar year of the leaving date while every
    other paper uses the academic year.
21. `export-file.ts:23` — an eleven-digit PEN or UDISE code and a ten-digit mobile become numeric cells in
    the workbook; a twelve-digit id would print in scientific notation.

**The same figure, computed differently.** Attendance percent has eight definitions (per mark with EXCUSED
in the denominator, class-scoped, whole stay, current year to leaving date, marks capped at 250, one decimal
in one leaving-certificate view and none in the other). The overall grade has four. The pupil's name, the
class and section, the admission date, the age, the outstanding balance, the category and the serial year
each have two or more. The suite's cross-report checks are where these should land next.

**Dates in UTC or the server's zone where the school's zone matters:** the UDISE+ join-date fallbacks and
calendar-year test, the fee month start and the collections range, every year-archive window, the leaving
date and the TC serial year, the certificate's "issued on" against its own body, the report card's "issued
on", the messaging daily cap window, the practice month buckets, and admissions' hard-coded Asia/Kolkata.

### Inputs: what a screen collects, what nothing collects

The full column-by-column matrix (model.column, who reads it, where the web and the phone enter it, the
validation, which readiness list needs it, what happens blank) was built for every column a report reads.
What it shows:

- **Read but entered nowhere.** The UDISE+ columns with no column in the database (Aadhaar, AAY, alternate
  mobile, mainstreaming, stream, uniform and textbook, scholarships, SLD/ASD/ADHD, extracurricular,
  vocational, teacher national code) go out blank by design. Beyond those: a person's **legal name cannot be
  corrected** once the account exists; the office **cannot enter anyone else's phone** (self-entered with an
  OTP only), so a school onboarding families by intake has no phone on the UDISE+ sheet until each guardian
  signs in; a **principal's subjects** cannot be set, only a teacher's.
- **Entered on the web but not on the phone.** The whole staff record (twelve columns), departures, certificate
  templates, report card rules, term weights, academic years, fee heads, structures and settings, a teacher's
  subjects, and the office correcting a pupil's date of birth. Nothing goes the other way.
- **Free text where the reader wants a code.** Mother tongue (UDISE+ expects a code), nationality (coded by
  a regex on "india"), PIN code (no six-digit check), admitted-to grade, the school's medium (must equal a
  bare language name), the affiliation number (fills two boards' different identifiers), designation and
  staff number (fill coded DCF columns), timetable and profile subjects (regex to three code tables), class
  grade level when the school's range is not numeric, the academic year's name (part of every serial), and
  older category and religion values saved before the code lists.
- **Collected but read by nothing yet.** The occupations, income and the previous school's TC number and
  date added on the 24th are on the record and both forms; no export prints them. They serve the admission
  register and the RTE/EWS verification the office does by hand until a sheet asks for them.

### Next steps, in order

1. Fix the "previous year" status and class on the UDISE+ sheet from the admission date and the academic
   year (items 1, 4), count attended days by day (2), and make the enrolment tables code VJ/NT/SBC as OBC (3).
2. Give the office a way to enter a guardian's phone and correct a legal name, and the phone a staff record
   editor; these are the three input gaps the matrix shows with no path at all.
3. Windowed progress on the insights page and the progress report (18); one attendance definition, or a
   named one per document, with the label saying which (marks, days, class-scoped).
4. Fees: one definition of outstanding across the overview, dues, ledger and texts, with leavers in or out
   everywhere (12–14).
5. Timezone: the year archive's windows, the fee month and range, the leaving date and TC serial year, both
   "issued on" stamps (17, 20, and the UTC list).
6. Validate the coded feeds at entry: mother tongue and nationality as lists, PIN as six digits, the medium
   as a language, the staff category on the same list the pupil's uses (8, and the free-text list).
7. Register CSV and month grid from the enrolments of the month, not today's (10); staff month CSV on open
   days only (19).
8. The name on formal papers: decide legal or preferred, and print one (16).
9. Store the PEN, UDISE code and phones as text cells in the workbook (21).
10. Extend the suite with the row states above (a two-register day, a leaver with a demand, a first-year
    school, a "Marathi Medium" school) so each of these fails on its own once fixed.
