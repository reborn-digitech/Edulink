# Shalaghar for colleges

Built 3–4 October 2026 by a foundation builder (C0), five module builders (academics, exams, the office,
IQAC, placement) and an integration builder. This page is the map: what a college is, who works in it,
which module owns which rows, the functions each module exposes to the others, the stored derived values
and the data:audit check that holds each one, and what nobody has tested. The plan it follows is
"Shalaghar for colleges: every role, every feature" (4 Oct 2026).

## A college is a tenant kind

`School.kind` is one of `SCHOOL`, `JUNIOR_COLLEGE`, `COLLEGE`, `AUTONOMOUS_COLLEGE` (`INSTITUTION_KINDS`,
packages/contracts `v1/modules.ts`; `isCollegeKind`). The kind is chosen when the tenant is made (operator
`/root/new` and `/root/onboard`, self-registration) and never changed by a correction. The college profile
(affiliating university, AISHE code, AICTE and UGC references, NAAC grade and validity, NIRF category) is
on the School row, written at `/admin/settings/college`. Words: `institutionNoun(kind, t)`; Hindi and
Marathi say "महाविद्यालय", never "कॉलेज".

## Modules and the gate

A college is offered twelve modules (`modulesForKind`): the school version's six (TRANSPORT, LIBRARY,
HOSTEL, INVENTORY, PAYROLL, ALUMNI) and ACADEMICS (always on at a college), EXAMS, IQAC, PLACEMENT,
ADMISSIONS (the college form; the school's admissions pages stay ungated) and SCHOLARSHIPS. The gate is the
school version's, unchanged: a catalog entry with `module:` answers 403 MODULE_OFF while the college has it
off; a limited role (the module roles, the college roles, RECRUITER — `LIMITED_ROLES`) passes only doors
naming it in `access` or `limitedRoles`; pages check `assertModuleOn`/`isModuleOn` and render `<ModuleOff/>`;
nav entries and phone tabs carry `module`. Where a page must exist only at a college, nav uses
`module: "ACADEMICS"` as the stand-in for "is a college".

## Roles

| Role | Home | Module | Notes |
| --- | --- | --- | --- |
| ADMIN (registrar's office) | /admin | — | admits, seats, registers on a student's behalf, keeps the record |
| PRINCIPAL | /principal → /principal/college | — | reads the college; decides what the regulations reserve |
| FACULTY | /faculty | ACADEMICS | teaches like a TEACHER (`isTeachingRole`), converses as one |
| HOD | /hod | ACADEMICS | the department; condonation above the floor; results; projects |
| EXAM_CONTROLLER | /exam-cell | EXAMS | not /exams, which is the school's marks page |
| IQAC | /iqac | IQAC | predictor, filings, surveys, registers, grievances |
| TPO | /placement | PLACEMENT | drives, companies, internships, the placement table |
| ACCOUNTS | /accounts | — | fee ledger, scholarships, no-dues, payroll and stores with the office |
| RECRUITER | /recruiter | — (no school) | an outside account like EXPERT; reaches a college only through a live drive |
| STUDENT, PARENT, ALUMNUS | as for schools | | an adult student's guardian sees only what the student grants (`StudentConsent`) |

The six college staff roles file leave at `/account/leave` (and the phone's Leave), read payslips at
`/account/payslips`, post to the college's feed as a teacher does, and read the global feed.

## Who owns what, and what each module exposes

Every reader below uses the plain client after the caller has bound the person and the college, unless it
takes a `ctx`.

**Office (ADMISSIONS, SCHOLARSHIPS, the ACCOUNTS desk)** — `college-admissions.ts`, `college-fees.ts`,
`scholarships.ts`, `no-dues.ts`, `accounts.ts`, `college-records.ts`, `college-campus.ts`, `college-audience.ts`.
- `admitStudent` — one transaction: user, membership, `PupilRecord` (with the PRN), `ProgrammeEnrolment`
  (the admission record), `StudentProgramme` (the academic seat, when the programme has a scheme), fee plan.
- `noDuesFor(studentMembershipId, "EXAM_FORM" | "HOSTEL_EXIT" | "LEAVING")`, `ledgerFor`, `myLedger`,
  `financeTable(schoolId, years)`, `libraryTable`, `hostelTable`, `accountsOverview(ctx)`,
  `pendingConcessions(ctx)`, `listClaims(ctx)`, `leaveCollege` (the LEAVING clearance, then the departure
  that opens the alumnus row), `collegeFacts` (certificate placeholders), the bulletin's audience targets.

**Academics (ACADEMICS)** — `academics*.ts`.
- `eligibilityForTerm(termId, { studentMembershipId? })` (the exam form reads it),
  `internalTotalsFor(offeringId)` (the result run reads it), `attainmentForOffering(offeringId)`,
  `loadAndRatios`, `lectureDayByDepartment(schoolId, dateKey)` (added for the principal and the operator),
  `hodHome` (now with the exam cell's department results and placement's projects).

**Exams (EXAMS)** — `exam-cell*.ts`.
- `passRateByOffering`, `resultsForDepartment(schoolId, departmentId, termId)` (reads the department's
  own courses as well as the term's offerings, so an imported result with no offering is counted),
  `examAnalytics(ctx)`, `examCellHome(ctx)` (the principal's grace queue), `cgpaHundredths`.

**IQAC (IQAC)** — `iqac*.ts`.
- `iqacOverview(ctx)` (cycle CGPA and band, the ten cheapest metrics, NIRF estimate, grievance and filing
  counts, the regulators' calendar), `gatherFacts` (every predictor input from the other modules' rows),
  `listFilings`, `listCommittees`, `indirectAttainment` (the course feedback's outcome level).

**Placement (PLACEMENT, and the RECRUITER)** — `placement*.ts`.
- `placementRecords(schoolId, ids)` (CGPA from the exam cell, backlogs, attendance, programme, batch),
  `placementTable`, `placementTables`, `placementSummary(schoolId)`, `internshipCredits`, `listProjects`.

**Integration** — `college-principal.ts` (`principalCollege(ctx)`, nothing computed: each figure is one of
the functions above), the principal's decision log (`DECISION_KINDS` gains grace, condonation, concession,
lateRegistration), the operator's college console (see below).

## The year, role to role

`tests/college-year.test.ts` walks one student through it at ZZ Vidya College: the office admits (record,
enrolment, seat, one PRN) → the office seats a division (the seat keeps the record's PRN) → the student
registers (the scheme's core courses) → faculty mark lectures → the HOD locks internal marks → the form is
generated, its eligibility and no-dues read, approved → the university's file is imported by PRN, the run
takes the locked internal marks, publication → placement's record reads the published CGPA → the IQAC's
facts count the pass (2.6.3's inputs) → the office records the graduation and the alumnus row opens → the
alumnus reads a global post once.

## Stored derived values and their checks (`npm run data:audit`)

| Value | One writer | Check |
| --- | --- | --- |
| `InternalLock.totalsJson` | `lockInternal` | academics-internal-lock |
| `TermResult.sgpaHundredths`, `CourseResult` | `runResults` | exam-sgpa |
| printing lists | the autonomous conduct | exam-printing |
| `AccreditationCycle.cgpa` | `writeCycleCgpa` | iqac-cgpa |
| `CollegeFiling.hash`, `body` | `buildFiling` | iqac-filing |
| `Grievance.dueOn`, disclosure hash | filing, `setDisclosure` | iqac-grievance |
| `PlacementSeason` | `publishSeason` | placement-season |
| `StudentProgramme.prn` (a copy of `PupilRecord.prn`) | the admission and the seat page | college-prn |

Computed on read and stored nowhere: attendance percentages and eligibility, CO/PO attainment, ledgers net
of scholarships, no-dues lines, the finance, library and hostel tables, the placement index between
publications, the principal's and the operator's dashboards.

## The operator

See "Operator" in this page's companion section of HANDOFF.md and the operator console (`/root`): the
colleges view, the college tiers, modules switched on a college's behalf, health across colleges, the
regulators' calendar with reminders from `accounts:tidy`, and recruiter accounts disabled across tenants.

## Fixtures and the demo

- ZZ: `npm run zz:fixtures` builds ZZ Vidya College (every module, every college role) and ZZ Shastri
  Autonomous College (`scripts/zz-college.ts`, `zz-academics.ts`, `zz-exams.ts`, `zz-college-office.ts`,
  `zz-placement.ts`, `zz-iqac.ts`); `npm run zz:token -- FACULTY` and so on mint sessions.
- Demo: `npm run demo:college` builds Saraswati Arts and Science College (`saraswati-college`) with
  `sac.*@demo.relay.test` accounts on the demo password; the roster is in docs/demo-schools.md.

## Untested

- Every filing against its portal (NAAC SSR/AQAR, IIQA, NIRF, AISHE, AICTE), the university's real result
  file and exam-form formats, the CET Cell's real allotment export, MahaDBT's reconciliation sheet, the
  Academic Bank of Credits (a stub), real recruiters, GSTIN/CIN verification (by design none).
- NAAC per-metric weights and texts against the manual (reconstructed; see packages/contracts `v1/naac.ts`).
- The phone screens on a real device; the recruiter's TOTP end to end; api:sweep and the page sweep over
  the college doors; Playwright; Hindi and Marathi read by a speaker.
- Not built: a faculty member's public profile page (needs an opt-in and a second globally readable table;
  the published disclosure page lists faculty by name, designation and qualification); a refund outside the
  slab and a hostel expulsion as principal approvals; the hostel's night-out register and curfew at the gate.
