<!-- helpIndex: false -->
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

Writes with no door, on purpose (R-50, risks batch of 5 October 2026): the door-less web writes the audit of 5
October listed (01-inventory §7.5) now have doors (`api-catalog/office-year.ts`, `office-writes.ts`), but
merging two accounts and deleting a school or college stay on the web, being irreversible acts across accounts
or tenants that need its confirmation screens; the operator's removal of institutions and moderation inside
one belong to the operator console, not an institution's phone; and a pupil's first-sign-in code is printed on
paper at the office. The OpenAPI description says the same.

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
| HEALTH_SCIENCES | NMC, DCI, INC | PLACEMENT | — | LAB_INCHARGE, CLINICAL_COORDINATOR (no NSS/NCC) | clinicalPostings, labs | — | — (the clinical desk since 10 Oct 2026) |
| ARCHITECTURE | COA | PLACEMENT | — | STUDIO_COORDINATOR, NSS, NCC | studios | lecture → studio | — (studios and juries built 10 Oct 2026; the COA return is not a filing kind) |
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
| RESEARCH_DEAN | /duties/research | the research register, read-only (the office writes the faculty record); no teacher's API score inputs since 5 Oct (A3-S-11), so the list is sorted by publications plus projects (R-55) |
| EXAM_SQUAD | /duties/exam-squad | papers two days back to sixty ahead; a visit that found something tells the exam controllers; a case's state, never its note |
| PRACTICE_TEACHING_COORDINATOR | /duties/teaching-practice | practice schools, postings, lesson observations |
| CLINICAL_COORDINATOR | /duties/clinical | clinical sites (the teaching hospital, a PHC, a clinic, a hospital pharmacy) with their departments and the agreement's dates, a contact as a role word; postings of a division or a lab batch to a department under a supervising faculty member in rotation order; each student's logbook (a case, a procedure, a skill, dispensing; DRAFT → SUBMITTED → SIGNED or RETURNED) signed or returned by the posting's supervisor (no duty needed; `/faculty/clinical`, `GET /duties/clinical/supervising`) or the coordinator; the student writes and hands in at `/student/clinical` (`/family/clinical`, no guardian door); no patient identifier is stored (a note carrying one is refused); the councils' minimum counts are an empty coded list (`CLINICAL_REQUIREMENTS`) until one can be cited (built 10 Oct 2026, R-56) |
| STUDIO_COORDINATOR | /duties/studio | an architecture college's design studios: a studio per course offering and term with its brief, its maximum marks and four stage days (brief issued, interim pin-up, final submission, jury), kept by a holder of the duty or the office; the students' submissions per stage (DRAFT → SUBMITTED by the day, LATE after it; a note and a file by upload ticket, `files.ts` 2e-studio); juries convened by a holder with a panel of the college's teachers, one the chair, and up to two external jurors by a coded role and institution only; the sheet marked by a juror on the panel (`/faculty/studios`, no duty needed; the one writer `saveJuryMarks`) and signed by the chair, after which it changes no more, reaches the student (`/student/studios`, `/family/studios`) with the band read from the marks (`gradeBandFor`, never stored) and may be posted into an internal component through `saveInternalMarks`; the HOD reads the department's on `/faculty/studios`, the office the desk (the `studios` tile). Built 10 Oct 2026, R-56 |

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

**Not built, per stream.** HEALTH_SCIENCES (NMC, DCI, INC): every council return (the clinical desk — postings,
logbooks, the teaching hospital — is built since 10 Oct 2026, R-56: tables `ClinicalSite`, `ClinicalDepartment`,
`ClinicalPosting`, `LogbookEntry`, migration `20261010181454_clinical_desk`, `src/lib/clinical.ts`; fixtures ZZ
Dhanvantari Nursing College, `scripts/zz-clinical.ts`, and the demo health and pharmacy colleges). ARCHITECTURE (COA): the COA return only (studios, submissions and juries are built since 10 Oct 2026, R-56: tables `Studio`, `StudioSubmission`, `StudioJury`, `StudioJuryMark`, migration `20261010181751_studio_desk`, `src/lib/studio.ts`; fixtures at ZZ Vidya College, which gains the ARCHITECTURE stream, `scripts/zz-studio.ts`, and the demo architecture college). AGRICULTURE
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
Faculty leave is decided by the office (ADMIN) or the principal on `/principal/leave`
(`POST /admin/leave/{leaveId}/decide`, ADMIN and PRINCIPAL); the HOD does not approve it and arranges the
cover on the substitution board (`POST /academics/substitutions`). This is the recorded decision of
4 October (integration report, item 7), kept by the owner on 5 October (R-6, A3-inventory-11); the college
plan's "HOD approves faculty leave up to the department's limit" was the stale line.

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

## Accreditation insights and the simulator (5 October 2026)

**What the engine is.** `src/lib/accreditation-insights.ts` is a pure module over the predictor's own formulas
(it imports only the contracts, `iqac-rules.ts` and `council-rules.ts`, and a test holds that), so no formula
exists twice. For NAAC (affiliated and autonomous) it takes the facts the predictor reads and answers: the
CGPA and band, for every metric below the top of its scale the smallest whole number of lever steps to its
next score (`stepFor`) and to the top, the points each step adds as the net CGPA change over the whole
framework (two more teachers at ZZ Vidya raise 2.4.1 and lower the CGPA by 0.017, so that step is not a
gain), the greedy cheapest path to the next band and the band after (`pathToBand`, quantitative steps first,
qualitative ones only when those run out), and the qualitative metrics still unscored as "score this with
evidence". For the NBA SAR it gives a lever per computed item and the smallest change worth a mark
(`nbaMarks()` in `council-rules.ts` is now the one place the SAR's computed items are summed; `nbaFacts`
computes through it). For NIRF it gives `nirfScore` (the parameters, the partial and projected score, a rank
band) and the move per published parameter. Every step carries a coded call to action
(`INSIGHT_CTAS`, twenty, in `packages/contracts/src/v1/iqac-insights.ts`): a web link, shown as a 44 px link to
the roles who make that change and as "Ask: page, who" to everyone else. Every section says that the platform
does not score for NAAC, NBA or NIRF. "What you did last" reads the audit log (22 action prefixes mapped to
CTAs) and flags what happened after the last recompute (NAAC) or the last SAR draft (NBA).

**Where it shows.** An "Actionable insights" section on `/iqac/predictor` (anchors `#insights`, `#metric-x-y-z`,
`#entered`), `/principal/accreditation`, `/hod/nba`, `/iqac/documents/nba` and the new `/iqac/documents/nirf`,
and a summary card on `/iqac`. On the phone the IQAC and the principal read the insights screen (the paths,
the ranked metrics, each CTA opening the web page through `openWeb`) and a read-only list of NAAC scenarios;
the IQAC home carries a card, More two entries, and the principal's college card an insights line. The phone
changes no figure and saves no scenario.

**The simulator.** `/iqac/simulator`, client side over the same functions: every fact the framework reads as a
number field and a slider starting at today's figure, the qualitative scores 0 to 4 in steps of a quarter,
the CGPA, band and distance live, NIRF's inputs and estimate beside it, reset to today. `?kind=nba` is the SAR
simulator for the desk at an engineering college and `/hod/nba/simulator` is the HOD's own department. A part
is held to its whole (`FormulaSpec.whole` on twelve NAAC pairs, `NIRF_WHOLES`, `NBA_WHOLES`; the nine
percentages allowed to exceed are listed with reasons in `MAY_EXCEED`).

**Scenarios.** `IqacScenario` (tenant table, migration `20261005114955_iqac_scenarios`, RLS) holds a named
set of figures, saved by the IQAC or the principal (NAAC and NBA) or an HOD (NBA, own department). `writeScenario`
is the one writer: it recomputes the result itself, refuses a fact the framework does not read, a
non-qualitative code, a mark above its item, a closed cycle and more than a hundred scenarios (counted and
inserted in one transaction under an advisory lock), and audits `iqac.scenario.save` and `.remove`. A scenario
is listed with its lead over today, compared side by side with the deltas, shown as insights, loaded and
removed. `data:audit` has a check `iqac-scenario` that recomputes each stored result from its figures. The
fixture is one saved scenario at ZZ Vidya.

**The doors.** Nine, all module IQAC with the role checked before the body and the heavy-read budget:
`GET /api/v1/iqac/insights` (IQAC, ADMIN, PRINCIPAL), `GET /iqac/insights/nba` (also HOD, 404 unless the college
teaches engineering), `GET /iqac/insights/nirf`, `GET` and `POST /iqac/scenarios`, `DELETE /iqac/scenarios/{id}`,
`GET /iqac/scenarios/compare`, `GET /iqac/simulate` and `GET /iqac/simulate/nba`. No open cycle answers 404.

**Decisions the owner must confirm** (08-remaining-risks.md, R-40 to R-47):
1. **The NIRF band table.** The top-hundred line is now NIRF's own (R-40, risks batch of 5 October 2026): 54.39,
   the 100th college's score in India Rankings 2025 (nirfindia.org/Rankings/2025/CollegeRanking.html, retrieved
   5 October 2026). NIRF prints no score for the 101–150, 151–200 and 201–300 bands, so those minimums (54, 51,
   47) remain the platform's reading and are the owner's to supply. The estimate still scales the partial score up
   as if the unpublished parameters scored at the same rate, which flatters a college strong on the published ones
   (ZZ Vidya projects to "the top 100" from 40 covered marks).
2. **Levers move one figure at a time** in the insights (one more professor does not also raise the ratio's
   other side); the simulator moves figures together.
3. **A change to NAAC's weights makes `data:audit` fail on old scenarios, on purpose.** A stored result is
   recomputed on read and the audit holds the stored copy equal to it; re-save or retire the old scenarios when
   the weights change.
4. Smaller choices recorded as kept: the points are the net change over the whole framework; quantitative steps
   come before qualitative; CTAs are links only for the roles who make the change; scenarios are capped at a
   hundred per college.

## The year, role to role

`tests/college-year.test.ts` walks one student through it at ZZ Vidya College: the office admits (record,
enrolment, seat, one PRN) → the office seats a division (the seat keeps the record's PRN) → the student
registers (the scheme's core courses) → faculty mark lectures → the HOD locks internal marks → the form is
generated, its eligibility and no-dues read, approved → the university's file is imported by PRN, the run
takes the locked internal marks, publication → placement's record reads the published CGPA → the IQAC's
facts count the pass (2.6.3's inputs) → the office records the graduation and the alumnus row opens → the
alumnus reads a global post once.
Graduation, like a school departure, keeps a real parent's guardianship ACTIVE (only the school's stand-in
guardianship is revoked, `school-record.ts`), so the family keeps the record and the leaving certificate (R-23,
decided 5 Oct 2026: keep; a college that wants otherwise says so).

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
| `AttendanceDevice.keyLast4` (the sealed key's last four; R-2, 5 Oct 2026) | `issueDeviceKey` | punch-key |

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
  - ZZ Vidya: streams ARTS, SCIENCE and COMMERCE (BSCPHY and BSCCHE given SCIENCE), and ARCHITECTURE since
    10 Oct 2026 (the studio desk's fixture, `zz-studio.ts`: a department "ZZ Architecture", ZZ BArch with AR101
    offered this term to zz.cstudent01–03, one studio with four stages, the interim jury signed with marks, the
    final jury ahead, three submissions); its AICTE disclosure is
    taken down (its streams do not bring it). `zz.faculty01` holds every duty Vidya offers (LAB_INCHARGE,
    NSS_OFFICER, NCC_OFFICER, ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD, STUDIO_COORDINATOR) so the sweep's FACULTY opens the
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
  Four eyes on each (R-7, decided 5 October 2026): the person who asked for a refund exception, proposed an
  expulsion or granted a concession above the office's limit cannot decide it, even holding PRINCIPAL as well as
  ADMIN (403 `collegeDesks.refuseOwnAsk`). A one-person college decides through a second account (a second
  principal, or the office's own officer as ADMIN) or records the exception in the head's decision log; the
  platform does not let one account approve its own ask.
  Still not built: the phone's permission-slip composer. The phone warden's night view is built
  (`screens/hostel/warden.tsx`), and since the audit of 5 October the card's QR opens a staff-only web
  `/id-check` page and carries a signed card id instead of the guardian-claim code.
- Accreditation insights: both simulator pages in a browser (sliders, reset, save, load, compare, remove), the
  HOD's NBA pages as a real HOD (ZZ Shastri has none), the NIRF band table against NIRF's published scores,
  the phone's insights and scenarios screens against a live server, Hindi and Marathi read by a speaker.
- Streams: every council return against its council's real portal or inspection form (the NBA Tier-II marks
  and bands should be checked against nbaind.org's current SAR); the PCI, BCI and NCTE pages with data on a
  live server (no ZZ or demo college has those streams). The NBA SAR reads its own year since S4B-1 (students
  entered by then and on the roll during it, teachers on the staff during it by their recorded joining date,
  results and offers by the year's end); what still has no history and is read as it stands: a teacher's
  department link and designation, a programme's intake, the placement profile's higher-studies flag. The
  PCI, BCI and NCTE returns still read the rows as they stand.

## Talks, soft skills, the gate reader, Tally and the peer-team visit (risks batch, 5 October 2026)

Five plan items that had no code (R-2 in docs/audit-2026-10-05/08-remaining-risks.md), built by package 5B
of the risks batch. One migration (`20261005171517_college_risks_builds`, eleven tenant tables, each with
`schoolId` under RLS); doors in `src/lib/api-catalog/college-extras.ts`; ZZ rows at ZZ Vidya College from
`scripts/zz-college-extras.ts` with the fixed ids in `college-extras-fixture.ts`. The owner may strike any.

**Pre-placement talks** (module PLACEMENT; `PlacementTalk`, `PlacementTalkRsvp`; `src/lib/placement-talks.ts`).
The TPO sets a company's talk ahead of now with the drive it belongs to (one talk a drive, never a closed
drive); a student of the college answers GOING or NOT_GOING while it is scheduled and ahead, GOING stopping
at the seats under a row lock; once it starts the answers close and attendance opens, the TPO's alone, for
anyone on the roll (a walk-in too); the first mark sets `heldAt`, after which the talk can be neither moved
nor cancelled; cancelling tells those going. The counts are read from the rows. Doors: `GET`/`POST
/placement/talks`, `GET`/`POST /placement/talks/{talkId}`, `POST /placement/talks/{talkId}/attendance`, `GET
/student/placement/talks`, `POST /student/placement/talks/{talkId}/rsvp`. Pages: `/placement/talks` and
`/placement/talks/[talkId]` (a new tab of the cell), `/student/placement/talks`, a card on the drive's page and
on the student's placement page; phone: `placement-talks` (a student answers; the TPO taps Present or Absent
per student at the door), in More for STUDENT and TPO. Fixture: the open drive's talk a week ahead
(zz.cstudent02 going, zz.cstudent03 not), and a talk held twenty days ago with its attendance.

**Soft-skills training** (module PLACEMENT; `SoftSkillsTraining`, `SoftSkillsSession`, `SoftSkillsEnrolment`,
`SoftSkillsAttendance`; `src/lib/soft-skills.ts`, the count in `soft-skills-count.ts`). A training in a coded
skill (`SOFT_SKILLS`) with seats and the attendance share that completes it (75 % unless set); students enrol
while it is OPEN, the TPO puts students on or off the roll, adds sessions, cancels one with no marks, and marks
a session once it has started, for students on its roll only. COMPLETED is computed on read and stored nowhere
(`softSkillsCompleted`: present at the share of the sessions not cancelled, rounded up), so there is no
data:audit check to keep; the cell's figure is the students with at least one completion, the cell's student
list has a `softSkillsCompleted` count and the student's placement answer a `softSkills` list (both contract
fields default to empty for an older phone). Doors: `GET`/`POST /placement/trainings`, `GET`/`POST
/placement/trainings/{id}`, `POST …/sessions`, `POST …/sessions/{sessionId}`, `POST
…/sessions/{sessionId}/attendance`, `POST …/enrolments`, `GET /student/placement/trainings`, `POST
/student/placement/trainings/{id}/enrol`. Pages: `/placement/training` and `/placement/training/[trainingId]`,
`/student/placement/training`; phone: `soft-skills` (enrol or withdraw; the TPO marks a started session).
Fixture: "ZZ Interview skills", two sessions held and one ahead at 60 %, zz.cstudent02 completed.

**The biometric or RFID feed** (`AttendanceDevice`, `AttendanceBadge`, `AttendancePunch`;
`src/lib/attendance-devices.ts`, the signature in `src/lib/punch-signature.ts`). A format-agnostic signed door,
`POST /api/v1/punch/{schoolId}` (no session): the device sends its id, a timestamp within five minutes and
`sha256=` HMAC-SHA256 of `timestamp.body` with its own key; anything else is 401, one answer for every
failure. A device's key is 32 random bytes shown once when the office registers the device or rotates the key,
kept sealed under FEES_SECRET_KEY bound to the school and the device, with ONE WRITER (`issueDeviceKey`); a
rotated key stops the old one at once, a disabled device is refused. The office maps the code a device sends (a
card's number or a reader's enrolment number, never a template, never Aadhaar) to a person (`AttendanceBadge`).
A punch lands through the existing writers and no other: a member of staff's is their check-in
(`recordStaffCheckIn`, extracted from `checkIn` in `staff-attendance.ts`, so a tap and a punch share one rule
and one writer; the row says SELF, the punch log names the device), a pupil's marks them PRESENT in the day's
class register through `saveAttendanceBatch` with no taker (`takenByMembershipId` may now be null; a device
never becomes or replaces the register's taker, and `registersDue` counts a register as taken only when a person
took it). A punch never overwrites: a pupil already marked that day or a member of staff already in is
ALREADY_MARKED; an OUT punch is LOGGED; an unknown code, a person outside the device's scope (STAFF, STUDENTS,
BOTH), a closed day, a pupil with no class register (a college student taught only in lectures: lecture
attendance stays the teacher's) and a punch older than seven days are kept with their outcome and change
nothing. Each punch is kept once per device and its id, so a resent batch writes nothing and answers its first
outcome. Doors: `GET`/`POST /admin/attendance-devices`, `POST /admin/attendance-devices/{id}`, `POST
…/{id}/rotate` (body `confirm: true`), `POST /admin/attendance-devices/badges`, `DELETE …/badges/{badgeId}`,
and the punch door. Page: `/admin/attendance-devices` (ADMIN writes, PRINCIPAL reads; the key box draws the
key once from the action's answer, never in an address). The vendor adapter, `scripts/punch-adapter.ts`,
reads a tab- or comma-separated log (code, local time, optional direction) and posts signed batches; it is
UNTESTED against any vendor's device or export. Fixture: "ZZ Main gate reader" with a sealed key nobody holds
(rotate it to use it), badges for zz.faculty01 and zz.cstudent02, two punches that changed nothing.

**The Tally export** (`src/lib/tally-export.ts`; contracts `v1/tally.ts` cite Tally's XML import shape:
ENVELOPE / Import Data / Vouchers, a debit ISDEEMEDPOSITIVE Yes with a negative AMOUNT). Export only; money
stays outside the platform (decision 0003). `GET /api/v1/tally/receipts?from&to&format` (a span of at most 366
days): each receipt a Receipt voucher (Cash for cash, Bank otherwise, debited; each fee head's ledger "Fees -
<head>" credited as the receipt's frozen snapshot states it), a reversed receipt left out and counted, each
refund paid back a Payment voucher; `GET /api/v1/tally/payroll?month&format` (module PAYROLL): a LOCKED month as
one Journal voucher (salaries and the employer's share debited; PF, ESI, professional tax, TDS, advances,
other deductions and the net payable credited); a draft month 409. XML, or the same lines as a CSV day book.
Every voucher sums to zero or the file is refused; ADMIN and ACCOUNTS only; each file audited (`tally.export`,
counts, total and the SHA-256's first characters, never a name or a person's amount). Page:
`/admin/fees/tally` with the ledger names to create in Tally. Not imported into a real Tally here.

**The peer-team visit file** (module IQAC; `PeerTeamVisit`, `PeerVisitItem`; `src/lib/peer-visits.ts`). One
NAAC peer team's visit (naming its cycle) or one NBA expert team's visit (an engineering department and the
SAR's year), at most seven days: the visiting team, the schedule (slots inside the visit's days) and the
evidence index — each line a criterion or metric code and what answers it: a filing (`CollegeFiling`), an IQAC
file, a metric's latest score, the NBA worksheet, an https link or a note, each checked to be this college's
and resolved on every read, MISSING when its target is gone. The SAR pack is read from the filings each time
(NAAC: the cycle's IIQA, SSR and AQARs with state and hash, what is not generated, the cycle's CGPA; NBA: the
department's SAR of the year and its marks), with the evidence counted per criterion. The IQAC writes any visit,
an HOD writes and reads their own department's NBA visits only, the principal and the office read. Doors: `GET`/
`POST /iqac/visits`, `GET`/`POST /iqac/visits/{visitId}`, `POST …/items`, `DELETE …/items/{itemId}`, `GET
…/export` (CSV, audited). Pages: `/iqac/visits` and `/iqac/visits/[visitId]` (a link in the IQAC desk's nav),
`/hod/visits` and `/hod/visits/[visitId]`. No phone screen (the roles keep it on the web). Fixture: the NAAC
visit of Vidya's cycle a month ahead, three slots and four evidence lines.

**Untested** for all five: the pages in a browser and the phone screens against a live server (the dev server
needed a restart after the migration), api:sweep and the page sweep over the new doors, a real reader posting
to the punch door, the adapter against a vendor's export, the Tally files imported into Tally, Hindi and
Marathi read by a speaker.

## Homework, appointment letters, council notices and the reading room (risks batch, package 5A, 5 October 2026)

**Homework at a college (R-48).** A piece of work may be set to a `CourseOffering` instead of a class:
`Assignment.offeringId` (migration `20261005171208_college_homework`), `classId` now optional, and a CHECK that a
row has exactly one of the two. It is set, published and marked by the offering's faculty member or the HOD of the
department whose programme owns the course (`src/lib/college-homework.ts`); the office reads, it does not set or
mark. Its readers are the offering's REGISTERED students, from the day they registered — an elective shared across
divisions has no class and needs none. Everything after the row is the school's: `assertAssignmentAccess`
(tenancy.ts) knows both kinds of row and `workAudience` (grading.ts) answers who a piece of work is for, so the
gradebook, the marks save, the publish notice (students, and the guardians an adult student lets see results), the
student's own work list (`ownWorkScope`), the hand-in with its photographs and the file gate (files.ts) serve it
unchanged; a list labels it with the course's code and name. The marks may be posted into one of the offering's
internal components, scaled from the work's points to the component's maximum to a tenth of a mark (bonus held to
the maximum), through `saveInternalMarks`, the one writer of InternalMark — so the lock (409), the release (409) and
the countersign rule are that writer's. Doors (module ACADEMICS, FACULTY and HOD): `GET /api/v1/academics/work`,
`GET`/`POST /academics/offerings/{offeringId}/work`, `GET /academics/work/{assignmentId}`, `POST …/publish`
(already published answers as it stands), `…/grades`, `…/internal`. Pages `/faculty/work`,
`/faculty/work/offerings/[offeringId]`, `/faculty/work/[assignmentId]` (the school's marking screen); phone
`college-work` and `college-work-item` from More; the student reads and hands in on the existing Assignments
screens. Fixture at ZZ Vidya: PHY101's "ZZ Lab report 1" with two hand-ins and a mark, PHY103's elective reading
(no class), a draft (`scripts/zz-college-homework.ts`, ids in `college-homework-fixture.ts`). Not built: a
college's homework does not feed report cards (a college has none; its record is the internal marks it may be posted
into), and the school's `/teacher/...` doors refuse an offering's work rather than serve it.

**Appointment letters (R-2).** A staff kind `APPOINTMENT` on the certificate engine: presets in English, Hindi and
Marathi at a school and a college alike, prefix AL, filled from the staff record with eight `staff.*` placeholders
(name, designation — the staff record's, else the membership's title — department at a college, staff number,
the day of joining in figures and words, qualification, nature of appointment) and the school's, the year's and the
issue's; a staff template naming a pupil's detail is refused, and the reverse. `issueAppointmentLetter`
(certificates.ts) numbers it under the academic year's lock as every paper is, freezes it, signs as the layout says
and tells the member of staff. `IssuedCertificate.studentMembershipId` holds the recipient's membership; `mayRead`
lets only the office and that member read a staff paper; a family is never offered the kind. No pay figure is
printed (decision 0003). Doors `GET`/`POST /api/v1/office/appointment-letters` (ADMIN, PRINCIPAL),
`GET /api/v1/account/appointment-letters` and `…/{certificateId}/pdf` (every staff role); pages
`/admin/certificates/appointments`, `/account/letters` and `/account/letters/[certificateId]` (outside the gated
segments, so every staff role reaches its own paper). Fixture: the three templates and zz.faculty02's letter at Vidya.

**Student council notices (R-2).** The council is a `Committee` of kind `STUDENT_COUNCIL` (one per school), kept by
the office on `/bulletin/council` by student code with a role each — `saveCouncil` (council-notices.ts) is its one
writer; the IQAC committee desk refuses the kind, because it names members as text. A notice is a bulletin post in
the category `COUNCIL` with `Post.authorCommitteeId` (migration `20261005230101_council_notices`), written only
through the council's door by a member or the office (createPost refuses the category otherwise): a student's waits
for the office's review and is for everyone; the office's is live and may be narrowed. The feed and the post sign it
with the council's name, with no picture, role tag or profile door; the review desk sees the writer beside it. It is
read by the bulletin's audience rules and filtered like any category (the phone's feed names the category). Doors
`GET`/`POST /api/v1/shared/bulletin/council`, `POST /api/v1/office/council`. Fixture: "ZZ Student Council"
(zz.cstudent01 President, zz.cstudent02 Secretary) with a published and a waiting notice at Vidya.

**The reading-room register (R-2).** `ReadingRoomVisit` (schoolId, RLS; migration `20261005230102_reading_room`):
the library desk (LIBRARIAN, ADMIN) signs a reader — a student or a member of staff — in and out by library card,
student code or the member picked; one open visit per person, held by `scanReader` (reading-room.ts), the table's one
writer, under a per-person lock; signing in someone inside answers the open visit, signing out someone not inside is
409. The day report (the head reads it too) lists the day's visits, who is inside (today) or never signed out (a past
day), readers by kind, the average stay of the visits that ended and the busiest hour; nothing closes a visit behind
the desk's back. Doors `GET`/`POST /api/v1/library/reading-room` (module LIBRARY); page `/library/reading-room`, a tab
of the desk. Fixture: three visits today at Vidya, one still inside. No phone screen for these three plan items.

## Practice by stream and competitions by audience (college-content, 12 October 2026)

**Practice.** A college's practice page is not the school's. `QuizTopic.audience` is SCHOOL (the school bank, every
authored, NCERT and Balbharati chapter) or COLLEGE, with `streams`, `programme` and `yearOrSemester` (migration
`college_practice`; the placement banks are COLLEGE with no stream, so every college lists them). A college student's
`/student/practice` has two sections: **My stream** — the COLLEGE chapters of one of the college's streams (and the
college-wide ones), grouped by programme and subject, with programme and year-or-semester chips — and **Competitive
Exams Prep** — NCERT's chapters by class and subject. A Balbharati chapter, another stream's bank, or any other school
chapter does not list at a college and is not found by its slug either (`src/lib/practice-audience.ts`, used by the
list, the sitting's start, the continue card, revision, a teacher's topic picker, practice assignments and
worksheets); a school lists no college chapter. The guardian's `/parent/practice` and the phone's practice screens
follow the same sections (the family practice doors carry `practiceKind`, `collegeStreams` and each chapter's
`section`, `programme` and `yearOrSemester`, all optional). A stream's bank is generated from its syllabus units on
the bank desk ("College: a stream's syllabus units"; docs/plans/assistant-and-quiz-bank.md); on 12 October every
stream but health sciences has syllabus documents in the corpus (SPPU, AICTE, PCI, MPKV), so a health-sciences
college's My stream section stays empty and says so, pointing at the prep section.

**Competitions.** `Competition.audience` is SCHOOL or COLLEGE, with `streams` for a college one (migration
`college_competitions`); a competition with none set lists for both, as before, until edited. A college's
`/competitions` (and the phone's list) shows the platform competitions for colleges of its streams (or of every
stream) and the unset ones, never a school's; a school's shows the reverse. The content team and the operator set
the audience on the competitions desk (`/appadmin`, `/root/competitions`) for any platform competition, and the
crawler gives a crawled one its audience from the page and its source: seven college organisers are seeded (the Bar
Council of India, NLSIU and NALSAR for moot courts, Smart India Hackathon, AICTE, the Pharmacy Council of India and
ICAR), with the source kinds MOOT_COURT, HACKATHON and COLLEGE_EVENT and their streams. docs/plans/competitions-crawler.md,
"The audience rule", has the detail.
