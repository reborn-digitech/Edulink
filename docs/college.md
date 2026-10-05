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

## Streams (5 October 2026)

The owner's decision of 5 October 2026: a college's **streams** are chosen by the operator at onboarding,
beside affiliated or autonomous, and what the registrar sees loads from them. `STREAMS` and `STREAM_PRESETS`
are in packages/contracts `v1/streams.ts`; the college's list is `School.streamsJson` (read with
`parseStreams`, server-side `streamsOf(schoolId)` in `src/lib/streams.ts`); a programme carries its own
`Programme.stream`. Every door that makes a college (operator create and onboarding, self-registration)
refuses one with no stream; the registrar can change them on the college profile (audited
`college.streams.set`). A college made with several streams gets the union of their presets
(`presetUnion`): modules, filings and duties in canonical order, tiles in order, words only where every
stream agrees.

**The preset table, as built** (the base every stream shares: modules ALUMNI, ACADEMICS, EXAMS, ADMISSIONS,
SCHOLARSHIPS, IQAC; filings NAAC SSR, AQAR, IIQA, NIRF, AISHE and the affiliating university's return;
duties ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD; tiles people, academics, exams, admissions,
scholarships, iqac):

| Stream | Council (default first) | + modules | + filings | + duties | + home tiles | Words | Not built |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ARTS | UGC | — | — | NSS, NCC | library | — | — |
| SCIENCE | UGC | — | — | LAB_INCHARGE, NSS, NCC | labs, library | — | — |
| COMMERCE | UGC | — | — | NSS, NCC | library | — | — |
| MANAGEMENT | AICTE, UGC | PLACEMENT | AICTE disclosure | NSS, NCC | placement, internships | — | — |
| ENGINEERING | AICTE | PLACEMENT, INVENTORY | AICTE disclosure, NBA SAR | LAB_INCHARGE, NSS, NCC | labs, placement, nba | — | — |
| PHARMACY | PCI, AICTE | PLACEMENT, INVENTORY | AICTE disclosure, PCI inspection | LAB_INCHARGE, CLINICAL_COORDINATOR, NSS, NCC | labs, placement | lab → practical | — |
| LAW | BCI, UGC | PLACEMENT | BCI return | NSS, NCC | mootCourt, internships | department → faculty | — |
| EDUCATION | NCTE | PLACEMENT | NCTE return | PRACTICE_TEACHING_COORDINATOR, NSS, NCC | teachingPractice | — | — |
| HEALTH_SCIENCES | NMC, DCI, INC | PLACEMENT | — | LAB_INCHARGE, CLINICAL_COORDINATOR (no NSS/NCC) | clinicalPostings, labs | — | clinical postings, logbooks, the hospital |
| ARCHITECTURE | COA | PLACEMENT | — | STUDIO_COORDINATOR, NSS, NCC | studios | lecture → studio | studios, juries |
| AGRICULTURE | ICAR | PLACEMENT | — | LAB_INCHARGE, NSS, NCC | fieldWork, labs | — | the farm, field work |
| VOCATIONAL | UGC | — | — | LAB_INCHARGE, NSS, NCC | labs, internships | — | — |

A stream whose default council is not the UGC is "professional" (`isProfessionalStream`) and adds PLACEMENT.
The preset's modules are switched on **when the college is made**; changing streams later switches no module
(by decision). A new programme takes its regulator and attendance threshold from its stream (INC and PCI 80 %,
BCI 70 %, the others 75 %).

**Duties, not roles.** The stream-specific jobs a FACULTY member or HOD holds are duties on their membership
(`Membership.dutiesJson`; contracts `v1/duties.ts`, `src/lib/duties.ts`), set by the registrar from the
row menu at `/admin/people` (audited `people.duties.set`), offered only where a stream of the college offers
them (`DUTY_STREAMS`). A catalog door may carry `duties:`; the gate checks it after the role and before the
handler (403 `duties.refuseNoDuty`), and the same rule runs in `permits()`, both sweeps, the published docs
(`x-duties`) and the web and phone nav. Each duty opens a desk under `/duties/<name>` and a phone screen:

| Duty | Desk | What it holds |
| --- | --- | --- |
| LAB_INCHARGE | /duties/lab | the labs (rooms of kind LAB) with stock and assets from inventory, batch rosters, practical records to sign, a breakage log (a write-off through the inventory's one stock writer) |
| ANTI_RAGGING_SQUAD | /duties/anti-ragging | the squad's rounds and the complaints' state and due day — never their words or author |
| NSS_OFFICER, NCC_OFFICER | /duties/nss, /duties/ncc | enrolment, leaving, activities as IQAC Activity rows with hours and a camp flag |
| RESEARCH_DEAN | /duties/research | the research register and each teacher's score inputs, read-only (the office writes the faculty record) |
| EXAM_SQUAD | /duties/exam-squad | papers two days back to sixty ahead; a visit that found something tells the exam controllers; a case's state, never its note |
| PRACTICE_TEACHING_COORDINATOR | /duties/teaching-practice | practice schools, postings, lesson observations |
| CLINICAL_COORDINATOR, STUDIO_COORDINATOR | /duties/clinical, /duties/studio | a page with the preset's not-built sentence |

**Records per stream** (migration `20261004222809_stream_records`, `src/lib/stream-records.ts`,
`stream-summaries.ts`, pages under `/admin/stream-records`): lab batches (the office splits a division by roll
number, twenty by default; a LAB timetable hour may name a batch and its lecture registers only the batch;
membership is dated since migration `20261005040312_lab_batch_member_dates`, so a re-split or a move takes effect
today — or tomorrow when one of the division's batch labs of today is marked — and a marked lab keeps the roster
it was marked on; until the division's first batch lab is marked the rows are simply rewritten),
the practical record (the offering's teacher or HOD writes, that teacher or a lab in-charge signs, a signed row
is final), moot courts (law only), law internships of kind COURT, FIRM and LEGAL_AID with the Bar Council's
minimum weeks, teaching practice (schools, postings, observations, the NCTE's twenty weeks), NSS and NCC
enrolment with hours. Internship credits credited within a term now reach that term's credit push.

**Filings per stream** (`applicableFilings(streams)` in contracts `v1/council-filings.ts`; the gate
`assertFilingApplies` answers 404 "This college's streams do not bring that filing."): every college files
NAAC's SSR, AQAR and IIQA, NIRF, AISHE and its university's return; MANAGEMENT, ENGINEERING and PHARMACY add
the AICTE mandatory disclosure; the councils' own returns are PCI_INSPECTION (pharmacy), BCI_RETURN (law),
NCTE_RETURN (education) and NBA_SAR (one engineering department a year, quantitative criteria computed from
the rows by the pure formulas in `src/lib/council-rules.ts`, qualitative ones written by the HOD on a
`FilingWorksheet`, signed off by the principal). A college with no stream recorded keeps the seven old
filings. The regulators' calendar filters by streams too (the AICTE extension for management, engineering
and pharmacy; the CET CAP for the eight professional streams). Pages: `/iqac/documents` (a card per filing,
the others greyed "Filed by a college teaching …"), `/iqac/documents/[pci|bci|ncte|nba]`, `/hod/nba`.

**Not built, per stream.** HEALTH_SCIENCES (NMC, DCI, INC): clinical postings, logbooks, the teaching
hospital, and every council return. ARCHITECTURE (COA): studios and juries, the COA return. AGRICULTURE
(ICAR): the farm and field work, the ICAR return. The registrar's and principal's homes show the preset's
sentence as a banner; `/iqac/documents` lists the councils as "not built yet". No yearly calendar window was
added for PCI, BCI, NCTE or NBA (none has a fixed one to cite).

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
| `CollegeFiling.hash`, `body` (NAAC, NIRF, AISHE, AICTE and since 5 Oct the PCI, BCI, NCTE and NBA returns; a `FilingWorksheet` is input, not a derived value) | `buildFiling` | iqac-filing |
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
  `zz-placement.ts`, `zz-iqac.ts`, and for the streams `zz-streams.ts`, `zz-stream-records.ts`,
  `zz-council-filings.ts`); `npm run zz:token -- FACULTY` and so on mint sessions.
  - ZZ Vidya: streams ARTS, SCIENCE and COMMERCE (BSCPHY and BSCCHE given SCIENCE); its AICTE disclosure is
    taken down (its streams do not bring it). `zz.faculty01` holds every duty Vidya offers (LAB_INCHARGE,
    NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD) so the sweep's FACULTY opens the
    desks; every other college member is reset to no duty each run, so `zz.hod01` is refused a desk (403).
    Lab batch A on "ZZ FY BSc Physics A" with three practical records (the first signed), an NSS unit of
    three with one activity, beaker stock in "ZZ Physics Lab", one flying-squad visit.
  - ZZ Shastri: streams ENGINEERING, IQAC on; department MECH, programme BTECHME (AICTE), courses ME101 and
    ME103 with practicals, "ZZ Workshop Lab", division "ZZ FY BTech ME A" (zz.cstudent.s1 and the
    no-password s2, s3) in batches A and B with a practical record each; `zz.faculty.s1` holds
    LAB_INCHARGE; the current year's NBA SAR for MECH as a draft with three ZZ criteria. Its exam fixture's
    BCom has no stream. No ZZ college is law, pharmacy or education: `tests/streams-filings.test.ts` and
    `tests/stream-records.test.ts` make and remove their own.
- Lifecycle: `npm run zz:lifecycle -- --college engineering --years 5` walks ZZ Lifecycle Engineering
  College (`zz-lifecycle-engineering`, autonomous, ENGINEERING; BE Computer and BE Mechanical, four years) on
  its own through the libraries: lab batches each term, a LAB hour per batch, practical records written and
  signed by a lab in-charge, the autonomous session each term (papers set, sealed, moderated, opened once;
  halls, hall tickets, printing lists; marks by double entry), the NBA SAR each year, graduation from year 4;
  `--college engineering --teardown` removes it. Without the flag the walk is the school and the arts
  college, as before.
- Demo: `npm run demo:college` builds Saraswati Arts and Science College (`saraswati-college`, streams
  ARTS, SCIENCE, COMMERCE) with `sac.*@demo.relay.test` accounts; `npm run demo:college-engineering`
  (`scripts/demo-college-engineering.ts`) builds **Saraswati Institute of Technology** (`saraswati-tech`,
  AUTONOMOUS_COLLEGE, ENGINEERING: Computer and Mechanical Engineering, lab batches, practical records,
  Winter 2026 in conduct with a sealed paper, a published session with grade cards, the NBA SAR draft for
  Computer Engineering, the AICTE disclosure, hostel, bus, lab inventory, payroll and every duty) with
  `sit.*@demo.relay.test` accounts. Both on the demo password; both rosters, with what to look at per
  account, are in docs/demo-schools.md. Each is idempotent and needs nothing else first.

## Untested

- Every filing against its portal (NAAC SSR/AQAR, IIQA, NIRF, AISHE, AICTE), the university's real result
  file and exam-form formats, the CET Cell's real allotment export, MahaDBT's reconciliation sheet, the
  Academic Bank of Credits (a stub), real recruiters, GSTIN/CIN verification (by design none).
- NAAC per-metric weights and texts against the manual (reconstructed; see packages/contracts `v1/naac.ts`).
- The phone screens on a real device; the recruiter's TOTP end to end; api:sweep and the page sweep over
  the college doors; Playwright; Hindi and Marathi read by a speaker.
- Built on 5 October 2026 and so no longer "not built": the faculty public profile (opt-in), a refund outside
  the slab and a hostel expulsion as principal approvals, the night-out register and the curfew at the gate.
  Still not built: the phone's permission-slip composer. The phone warden's night view is built
  (`screens/hostel/warden.tsx`), and since the audit of 5 October the card's QR opens a staff-only web
  `/id-check` page and carries a signed card id instead of the guardian-claim code.
- Streams: every council return against its council's real portal or inspection form (the NBA Tier-II marks
  and bands should be checked against nbaind.org's current SAR); the PCI, BCI and NCTE pages with data on a
  live server (no ZZ or demo college has those streams). The NBA SAR reads its own year since S4B-1 (students
  entered by then and on the roll during it, teachers on the staff during it by their recorded joining date,
  results and offers by the year's end); what still has no history and is read as it stands: a teacher's
  department link and designation, a programme's intake, the placement profile's higher-studies flag. The
  PCI, BCI and NCTE returns still read the rows as they stand.
