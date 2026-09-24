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
4. **The streak tops out at the 30 most recent marks** (`attendance.ts:339`) and at 28 days on the home
   pages, so a longer real streak is under-reported.
5. **The parent's "average across N pieces" is over the five most recent homework marks only**
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
35. **A transfer row's PEN conflict is swallowed** (`intake.ts:246`), so a wrong or taken number is dropped
    without a warning.

### Communication and engagement

36. **An auto-read or mark-all-read notification counts as "seen" on a circular's reach report**
    (`circulars.ts:198` with `notification-housekeeping.ts:73`).
37. **A family with no guardian is UNREACHED forever**, and the audience is today's roster, not the roster at
    publish time.
38. **UNDELIVERED texts count in both sent and failed on a broadcast** (`messaging.ts:484-500`); the monthly
    cap and overview use the UTC month, not the school's.
39. **Twilio callbacks have no ordering guard**, so a late "sent" can regress DELIVERED.
40. **Quiz `completed` uses a seen-count accumulated across attempts against today's question count**
    (`quiz.ts:392`); reveals never count; permanent badges rely on a unique index over a NULL year that
    Postgres does not enforce.
41. **`CompetitionStanding` is not refreshed on consent or cascade deletes.**

### Staff

42. **Two cover models never reconciled**: the timetable grid reads `AttendanceCover`, the board reads
    `Substitution`; cancelling leave removes the first and not the second (`leave.ts:500-560`).
43. **LATE is fixed at check-in and never recomputed; an office override keeps the old `checkedInAt`; a
    stored PRESENT hides approved leave** (`staff-attendance.ts:101-114, 174`).
44. **The principal's leave card counts days with the default week and no holidays**, while the balance uses
    the school week and calendar (`principal/leave/page.tsx:238` vs `staff-records.ts:226-250`).
45. **The pending-leave list is cut at 300 rows ordered with PENDING last**, so it can disagree with the
    home page's count (`leave.ts:603`).

### Accounts

46. **`isMinor` is stamped at creation and never recomputed** (audit: none out of step today, but every
    17-year-old will be).
47. **`Membership.suspendedAt` is left set when `join.ts:219` reactivates a suspended pupil.**
48. **`Invite.status = EXPIRED` is never written**, so "invites pending" and the operator's "no admin" count
    expired invites.

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

## 6. Recommended next steps, in order

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
