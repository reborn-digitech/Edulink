# 01 · Inventory and parity table

Audit of 5 October 2026, layer I (inventory). Static: no server, no browser, no change to product code. Written by one reader; every claim below carries a file, a catalog path or a count that can be re-derived (method in section 0). Nothing here was clicked.

**Snapshot.** All counts were taken from commit 7727b8b3 plus the working tree of 5 October 2026 about 17:15 IST (git status clean but for the untracked `.claude/launch.json` and `pitch/`) before any of the files below existed: the generated tables (doors, NAV, pages, phone screens, journeys' validation) come from dumps made between 17:13 and 17:30 IST. Two builders are adding an **insights engine and simulator under the IQAC module** while this audit runs: **in progress, see insights**. Their files began to land while the audit ran (web `api/v1/iqac/insights`, `iqac/scenarios`, `iqac/simulate`, `lib/iqac-insights.ts`, `lib/accreditation-insights.ts`, migration `20261005114955_iqac_scenarios`, contracts `v1/iqac-insights.ts`; phone `iqac-insights` and `iqac-scenarios` screens and edits to `apps/mobile/src/lib/nav.ts`, `iqac.ts`, `docs/api/openapi.json`): none is mapped here, none is in a count, and the IQAC rows (doors 94, 12 menu entries, phone screens) will move when they land. The older school insights (`apps/web/src/lib/insights.ts`, `practice-insights.ts`) are unrelated and are counted.

**What it builds on.** The 4 October campaign's static layer (`scratchpad/campaign2/gaps.md`, 24 per-role reviews) and the college plan (`scratchpad/college-roles.md`, 4 Oct). Findings of those that were fixed since are not repeated; where this audit re-checks one, it says so.

## Summary

The platform at this snapshot: 1,006 catalog doors, 394 web pages, 154 phone screens, 17 roles plus the operator and the content team, 12 modules, 12 streams, 9 duties, 18 jobs (section 1). Every role's menu, pages, screens, doors, journeys and parity are in section 4; the journeys that cross roles in section 6; the parity table in section 7.

**Parity.** By menu entry the phone carries 249 of the web's 321 entries natively, opens the web for 51 and has no entry for 21; it has no entry the web lacks. By door it calls 82 to 96 % of the doors of the school's roles (TEACHER, STUDENT, PARENT, EXPERT, DRIVER, ALUMNUS) and 40 to 64 % of the college's desks (ACCOUNTS 40, IQAC 44, EXAM_CONTROLLER 46, TPO 56, HOD 59, FACULTY and LIBRARIAN 64). Phone-only is behaviour: the bus's GPS, the offline outbox, push, the version gate.

**Gaps** (section 8; all static, none reproduced): the accounts desk is given the fee ledger, payroll and stores by menu, doors and library but the web pages answer ADMIN or PRINCIPAL (A3-inventory-1 to 3); a law college's faculty may record moot courts but have no page (4); a head's appraisal of a college teacher cannot be read by them (5); no homework for college faculty (6); eight areas of web writes have no door (7); four doors have no UI behind them and some twenty are unused JSON twins (8); the register's own door is outside the catalog (9); seven plan items nothing implements, besides the three recorded on 4 October (10); and the first documents a session reads are out of date on their numbers (13).

| Id | Severity | Roles | Platform | One line |
| --- | --- | --- | --- | --- |
| A3-inventory-1 | medium | ACCOUNTS | web | The fee ledger's pages answer ADMIN or PRINCIPAL; the accounts desk gets only the overview |
| A3-inventory-2 | medium | ACCOUNTS | web | Payroll and stores: the doors and libraries keep ACCOUNTS, the pages draw every form for ADMIN alone |
| A3-inventory-3 | low | ACCOUNTS | web | The admission fee and the refund on a cancelled seat are doors for ACCOUNTS and pages for ADMIN and PRINCIPAL |
| A3-inventory-4 | medium | FACULTY, HOD | web and phone | A law college's moot courts: the library and the door let FACULTY and HOD record them; the only page is the office's |
| A3-inventory-5 | low | FACULTY, HOD | web and phone | The head can write an appraisal for a FACULTY or HOD member; they have no door or page to read it |
| A3-inventory-6 | low | FACULTY, HOD | web and phone | No homework or hand-in for a college teacher |
| A3-inventory-7 | low | ADMIN (and TEACHER, PRINCIPAL) | phone | Writes the web can do and no door exists for (section 7.5) |
| A3-inventory-8 | low | ADMIN, operator, STUDENT, PRINCIPAL | web and phone | Doors with no caller on either platform |
| A3-inventory-9 | low | TEACHER, every phone user of the register | both | The register's write door is outside the catalog |
| A3-inventory-10 | low | IQAC, TPO, ACCOUNTS, HOD, TEACHER, STUDENT, LIBRARIAN | web and phone | What the plan promises and nothing implements |
| A3-inventory-11 | info | HOD | web | The plan has the HOD approve faculty leave up to the department's limit; the platform has the office or the head decide |
| A3-inventory-12 | low | FACULTY, HOD | web | Two duties can be given and open a page that says nothing is built |
| A3-inventory-13 | info | operators of the repository | docs | Stale statements in the documents a new session reads first |
| A3-inventory-14 | low | web users of celebrations, practice journey | web | Pages with no door: the web has features the phone and API do not |

## 0 · How to read this, and how it was counted

- **Doors** are the catalog's entries (`apps/web/src/lib/api-catalog/*.ts`, 1,006 at this snapshot, read through `apps/web/src/lib/api-catalog.ts`); a role's doors are what `permits()` (`api-catalog/types.ts:274`) lets it call: the doors naming it in `access`, plus the `signed-in` doors it passes (a limited role passes a signed-in door only when the door names it in `limitedRoles`). `anyone`, `account`, `operator` and `app-admin` doors are not counted as a school role's. FACULTY and HOD are counted holding **every** duty; the no-duty figure is given beside it.
- **Web pages** are the 394 `page.tsx` files under `apps/web/src/app` (plus 13 CSV or print routes that are `route.ts` files under `(app)`). A page's roles are read from its first `requireRole(...)`, `requireParent`, `requireExpert`, `requireRecruiter` (and `requireUser`/`getSession`, which means: any signed-in role, decided in code); a page that delegates its gate to a component takes its roles from the NAV entries that cover its URL and from the segment it lives in. This is a reading, not a run.
- **Phone** is `apps/mobile/src/app/(app)` (154 screens; the auth group has 5 more), the tab bar `TABS`, the More sheet `MENU` and `HIDDEN_SCREENS` of `apps/mobile/src/lib/nav.ts`. A **phone-referenced door** is a catalog path that appears as a string literal (or a template with the parameters filled by `{x}`) in `apps/mobile/src` outside tests; where the method is not written next to the literal, every method of the path counts, so the figure is an upper bound. A door the phone calls through a variable path is missed (the lower bound is therefore the exact figure less a handful).
- **A door with no web counterpart** is one whose route handler imports library functions that no web page, server action or component (followed through imports) imports, and whose path no web file writes as a link. Many of those are the JSON twin of a page that reads the same library function under another name; they are listed as such and not as faults.
- **Parity** is measured two ways, because either alone misleads: by **menu entry** (web `NAV` entry against the phone's tab or More entry, matched by dictionary label key and, where the label differs, by hand — the hand matches are listed in section 7) and by **door** (share of a role's doors the phone calls). The phone's More entries that open the web (`web:` in `MENU`) are counted apart as *link-outs*.
- Everything generated (tables of counts, the NAV listings, the per-role door numbers, the validation of every page, screen and door named in a journey against the tree) came out of scripts kept in the audit's scratchpad (`scratchpad/audit3-inv/`), run against this snapshot; the validator checked 100 % of the journey rows (every page URL exists as a `page.tsx` or `route.ts`, every screen as a phone route file, every door as a catalog entry).

## 1 · The platform in numbers

| What | Count at this snapshot | Source |
| --- | --- | --- |
| Institution kinds | 4 (`SCHOOL`, `JUNIOR_COLLEGE`, `COLLEGE`, `AUTONOMOUS_COLLEGE`) | packages/contracts `v1/modules.ts` INSTITUTION_KINDS |
| Roles | 17 membership/outside roles + the operator + the content team (= the 19) | apps/web/src/lib/constants.ts ROLES; `User.isSuperuser`, `User.isAppAdmin` |
| Limited roles (default-deny gate) | 11: DRIVER, LIBRARIAN, WARDEN, ALUMNUS, FACULTY, HOD, EXAM_CONTROLLER, IQAC, TPO, ACCOUNTS, RECRUITER | LIMITED_ROLES; `role-gate.ts` |
| Duties (a mark on a FACULTY/HOD membership) | 9; 7 have a desk with doors, 2 a not-built page | packages/contracts `v1/duties.ts` |
| Modules | 12 (school six: TRANSPORT, LIBRARY, HOSTEL, INVENTORY, PAYROLL, ALUMNI; college six: ACADEMICS, EXAMS, IQAC, PLACEMENT, ADMISSIONS, SCHOLARSHIPS) | `v1/modules.ts` |
| Streams | 12 (ARTS, SCIENCE, COMMERCE, MANAGEMENT, ENGINEERING, PHARMACY, LAW, EDUCATION, HEALTH_SCIENCES, ARCHITECTURE, AGRICULTURE, VOCATIONAL); 3 say 'not built' (HEALTH_SCIENCES, ARCHITECTURE, AGRICULTURE) | `v1/streams.ts`; docs/college.md Streams |
| API doors in the catalog | 1,006 on 872 paths (422 GET, 584 writes); 312 flagged college (`x-college`); 18 duty-gated; 872 `route.ts` files under `api/v1` | `api-catalog/*.ts`; `scripts/gen-openapi.ts`; `docs/api/openapi.json` (6.3 MB, regenerated 5 Oct 15:19) |
| Doors outside the catalog | 12 `route.ts` under `api/` but not `api/v1` (`attendance`, `health`, `practice/answer`, `push`, `internal/jobs`, `files/[fileId]`, `sso/[provider]/start`, `sso/[provider]/callback`, `webhooks/razorpay/[schoolId]`, `webhooks/gateway/sessions`, `webhooks/twilio/status/[schoolId]`, `auth/logout`) and 13 CSV/print routes under `(app)` | find over apps/web/src/app |
| Web pages | 394 `page.tsx`: 190 gate with `requireRole`, 29 with `requireParent`, `requireExpert` or `requireRecruiter`, 61 are any-signed-in or session-aware (`requireUser`, `getSession`), 19 are the operator's (`requireSuperuser`), 11 the content team's (`requireAppAdmin`), 84 delegate the gate to a component (76 resolve to roles through the menu, 8 are public); 6 layouts | apps/web/src/app |
| Web navigation entries | 321 across the 17 roles (54 for ADMIN, 47 PRINCIPAL, 28 TEACHER...) | apps/web/src/lib/nav.ts NAV |
| Phone screens | 154 under `(app)` (14 tab screens, 139 hidden routes, `more`), 5 under `(auth)`; 20 screen folders under `src/screens` | apps/mobile/src/app; nav.ts HIDDEN_SCREENS |
| Phone menu entries | TABS 14 distinct names over 17 roles; MENU 275 entries (52 open the web) | apps/mobile/src/lib/nav.ts |
| Jobs | 18 (`JobName` union) | apps/web/src/lib/jobs.ts:48 |
| Prisma models / migrations | 291 / 88 | apps/web/prisma/schema.prisma; prisma/migrations |

`HANDOFF.md` still says 530 endpoints, 111 models, 28 migrations, seventeen jobs (gap A3-inventory-13).

### Doors by module and by prefix

| Module | Doors | Of which flagged college |
| --- | --- | --- |
| (none: ungated) | 592 | 38 |
| ACADEMICS | 67 | 66 |
| IQAC | 62 | 62 |
| EXAMS | 55 | 55 |
| PLACEMENT | 41 | 41 |
| HOSTEL | 37 | 6 |
| LIBRARY | 36 | 7 |
| INVENTORY | 25 | 1 |
| TRANSPORT | 24 | 2 |
| PAYROLL | 21 | 0 |
| ALUMNI | 20 | 8 |
| ADMISSIONS | 19 | 19 |
| SCHOLARSHIPS | 7 | 7 |

By first path segment: admin 113, office 90, family 63, exam-cell 53, shared 52, operator 52, academics 51, iqac 46, staff 44, fees 43, library 36, hostel 32, placement 29, account 26, gigs 24, college 24, teaching 21, appadmin 20, accounts 19, duties 18, student 16, recruiter 14, expert 12, alumni 12, community 11, stream-records 10, practice 9, auth 8, messaging 8, principal 7, contest 7, me 6, transport 6, public 5, voice 4, join 3, app 2, id-cards 2, faculty 2, events 1, files 1, marks 1, messages 1, uploads 1, search 1.

57 doors are `signed-in` (22 GET, 35 writes: account, devices, events, uploads, search, bulletin, enquiries, joins, competitions, mentoring, notifications): every school role passes all 57; of them 34 name limited roles in `limitedRoles` (FACULTY and HOD pass all 34, ALUMNUS 33, EXAM_CONTROLLER, IQAC, TPO and ACCOUNTS 31, DRIVER, LIBRARIAN, WARDEN and RECRUITER 26) and the other 23 are closed to every limited role. 14 doors answer anyone, 52 only the operator, 20 only the content team, 1 is decided by the person's memberships (`account/totp/start`).

## 2 · The tenant, its modules and what a college is given

A tenant is one `School` row with a `kind`; the college kinds are offered 12 modules, a school 6 (`modulesForKind`). The gate is the same one for all of them: a catalog entry with `module:` answers 403 `MODULE_OFF` while the tenant has it off, a limited role passes only doors that name it, and pages check `assertModuleOn` / `isModuleOn` or draw `<ModuleOff/>`. A web NAV entry or phone tab with `module` is hidden while the module is off; one with `duty` is hidden from a member without the duty; one with `streams` is hidden at a college whose recorded streams include none of them (`nav.ts:21-64`; `apps/mobile/src/lib/nav.ts:121-123`).

Streams and what each brings (docs/college.md, Streams; `packages/contracts/src/v1/streams.ts`). Every stream shares modules ALUMNI, ACADEMICS, EXAMS, ADMISSIONS, SCHOLARSHIPS, IQAC; filings NAAC SSR, AQAR, IIQA, NIRF, AISHE and the university's return; duties ANTI_RAGGING_SQUAD, RESEARCH_DEAN, EXAM_SQUAD.

| Stream | Council (default) | Adds modules | Adds filings | Adds duties | Home tiles | Not built |
| --- | --- | --- | --- | --- | --- | --- |
| ARTS | UGC |  |  | NSS, NCC | library |  |
| SCIENCE | UGC |  |  | LAB_INCHARGE, NSS, NCC | labs, library |  |
| COMMERCE | UGC |  |  | NSS, NCC | library |  |
| MANAGEMENT | AICTE, UGC | PLACEMENT | AICTE disclosure | NSS, NCC | placement, internships |  |
| ENGINEERING | AICTE | PLACEMENT, INVENTORY | AICTE disclosure, NBA SAR | LAB_INCHARGE, NSS, NCC | labs, placement, nba |  |
| PHARMACY | PCI, AICTE | PLACEMENT, INVENTORY | AICTE disclosure, PCI inspection | LAB_INCHARGE, CLINICAL_COORDINATOR, NSS, NCC | labs, placement | (lab is called practical) |
| LAW | BCI, UGC | PLACEMENT | BCI return | NSS, NCC | mootCourt, internships | (department is called faculty) |
| EDUCATION | NCTE | PLACEMENT | NCTE return | PRACTICE_TEACHING_COORDINATOR, NSS, NCC | teachingPractice |  |
| HEALTH_SCIENCES | NMC, DCI, INC | PLACEMENT |  | LAB_INCHARGE, CLINICAL_COORDINATOR | clinicalPostings, labs | clinical postings, logbooks, hospital, every council return |
| ARCHITECTURE | COA | PLACEMENT |  | STUDIO_COORDINATOR, NSS, NCC | studios | studios, juries |
| AGRICULTURE | ICAR | PLACEMENT |  | LAB_INCHARGE, NSS, NCC | fieldWork, labs | the farm, field work |
| VOCATIONAL | UGC |  |  | LAB_INCHARGE, NSS, NCC | labs, internships |  |

The preset's modules are switched on when the college is made; changing streams later switches none (docs/college.md). The demo and fixture colleges that exist: ZZ Vidya (ARTS, SCIENCE, COMMERCE), ZZ Shastri (ENGINEERING, autonomous), Saraswati Arts and Science (ARTS, SCIENCE, COMMERCE), Saraswati Institute of Technology (ENGINEERING, autonomous); no law, pharmacy, education, health, architecture or agriculture college exists as a fixture, so those streams' pages have never been seen with data on a live server (docs/college.md Untested).

## 3 · The 19 roles at a glance

| Role | Web home | Phone home | Web menu (primary) | Web pages owned | Phone tabs + More (screens / link-outs) | Doors (GET / write) | Own doors | Phone-called doors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN | `/admin` | AdminHome | 54 (5) | 186 | 4 + 53 (40 / 13) | 638 (288 / 350) | 139 | 333 of 638 (52 %) |
| PRINCIPAL | `/principal` | PrincipalHome | 47 (5) | 155 | 4 + 44 (33 / 11) | 353 (246 / 107) | 11 | 212 of 353 (60 %) |
| TEACHER | `/teacher` | TeacherHome | 28 (5) | 34 | 4 + 25 (25 / 0) | 179 (87 / 92) | 19 | 159 of 179 (89 %) |
| STUDENT | `/student` | StudentHome | 26 (4) | 32 | 4 + 26 (26 / 0) | 166 (85 / 81) | 38 | 153 of 166 (92 %) |
| PARENT | `/parent` | ParentHome | 31 (5) | 27 | 4 + 29 (28 / 1) | 162 (82 / 80) | 41 | 146 of 162 (90 %) |
| EXPERT | `/expert` | ExpertHome | 7 (4) | 7 | 4 + 2 (2 / 0) | 84 (36 / 48) | 17 | 81 of 84 (96 %) |
| DRIVER | `/driver` | DriverHome | 5 (1) | 1 | 1 + 4 (4 / 0) | 45 (16 / 29) | 6 | 37 of 45 (82 %) |
| LIBRARIAN | `/library` | LibraryDesk | 13 (4) | 11 | 1 + 7 (4 / 3) | 74 (31 / 43) | 0 | 47 of 74 (64 %) |
| WARDEN | `/hostel` | WardenHome | 15 (4) | 12 | 1 + 7 (4 / 3) | 71 (30 / 41) | 1 | 43 of 71 (61 %) |
| ALUMNUS | `/alumni` | AlumniHome | 8 (5) | 7 | 2 + 7 (6 / 1) | 53 (20 / 33) | 10 | 47 of 53 (89 %) |
| FACULTY | `/faculty` | FacultyHomeScreen | 21 (2) | 20 | 4 + 15 (15 / 0) | 114 (52 / 62); 96 without a duty | 0 | 73 of 114 (64 %) |
| HOD | `/hod` | HodHomeScreen | 23 (2) | 28 | 4 + 17 (17 / 0) | 137 (63 / 74); 119 without a duty | 4 | 81 of 137 (59 %) |
| EXAM_CONTROLLER | `/exam-cell` | ExamCellHome (queue; work opens the web) | 6 (2) | 11 | 2 + 5 (5 / 0) | 93 (33 / 60) | 31 | 43 of 93 (46 %) |
| IQAC | `/iqac` | IqacHome | 12 (2) | 10 | 2 + 11 (4 / 7) | 94 (44 / 50) | 2 | 41 of 94 (44 %) |
| TPO | `/placement` | TpoHome | 10 (5) | 8 | 2 + 9 (4 / 5) | 72 (30 / 42) | 10 | 40 of 72 (56 %) |
| ACCOUNTS | `/accounts` | AccountsHomeScreen | 13 (5) | 23 | 2 + 13 (5 / 8) | 143 (63 / 80) | 0 | 57 of 143 (40 %) |
| RECRUITER | `/recruiter` | RecruiterPlacementHome | 2 (1) | 2 | 1 + 1 (1 / 0) | 43 (15 / 28) | 14 | 29 of 43 (67 %) |
| OPERATOR | `/root` | ConsoleHome (stack) | — | 17 | console stack, 6 screens | 52 (19 / 33) | 52 | 32 of 52 (62 %) |
| APPADMIN | `/appadmin` | ConsoleHome (stack) | — | 11 | console stack, 3 screens | 20 (11 / 9) | 20 | 16 of 20 (80 %) |

Door counts include the 57 (or 26 to 34) signed-in doors every role passes, so a role's *own* doors are the better measure of what it alone does. 'Web pages owned' counts pages whose gate names the role, plus pages it reaches through its NAV entries or segment, and excludes the 61 any-signed-in pages; for ADMIN and PRINCIPAL it therefore includes the many pages they share. FACULTY and HOD are counted holding every duty.

## 4 · Role by role

Each role: where it lives, its menu on the web and the phone, its doors, the journeys it runs (daily, weekly, termly, yearly, once) with the pages, screens and doors each crosses, and its parity. Doors are written without the `/api/v1` prefix; a star marks a door the phone does not call. Journeys were chosen from the plan (`scratchpad/college-roles.md`), the demo roster (`docs/demo-schools.md`) and what the code offers; a journey the plan names but the platform lacks is in section 8, not here.

### 4.1 · ADMIN — the office of a school, the registrar's office of a college

Membership role ADMIN. At a school: the office (sets up, admits, keeps the record, takes the money at the counter). At a college: the registrar's office (admissions rounds, seats, structure, certificates, duties, filings with the IQAC). A peer of PRINCIPAL, not above it (constants.ts comment).

- **Web home** `/admin`; **phone home** AdminHome. **Gate:** ordinary role (its handlers check the role; the API sweep proves it).
- **Doors:** 638 (288 GET, 350 writes): 581 naming the role (**139 naming it alone**) and 57 signed-in; 285 behind a module, 181 flagged college. By module: ungated 353, IQAC 51, ACADEMICS 46, LIBRARY 36, HOSTEL 31, INVENTORY 25, PAYROLL 21, ADMISSIONS 17, TRANSPORT 16, EXAMS 15, PLACEMENT 12, ALUMNI 10, SCHOLARSHIPS 5. The phone calls 333 of them (52 %).
- **Phone:** Tabs: Overview, People, Leave, Messages. More: 53 entries, 40 native, 13 open the web (`/admin/transport`, `/admin/alumni`, `/library`, `/admin/hostel`, `/admin/academics`, `/admin/college-admissions`, `/accounts`, `/admin/college-campus`, `/exam-cell`, `/placement`, `/iqac`, `/admin/committees`, `/admin/faculty-records`).
- **Menu parity:** 39 both, 13 phone opens the web, 2 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.ADMIN`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Overview | `/admin` | — | both | tab index |
| People | `/admin/people` | — | both | tab people |
| Classes | `/admin/classes` | — | both | screen classes |
| Timetable | `/admin/timetable` | — | both | screen timetable |
| Exams | `/admin/exams` | — | both | screen exams |
| Report cards | `/admin/report-cards` | — | both | screen report-card-rules |
| Certificates | `/admin/certificates` | — | both | screen staff-certificates |
| Signatures | `/admin/signatures` | — | both | screen signatures |
| Pupil records | `/admin/records` | — | both | screen pupil-records |
| Filings | `/admin/filings` | — | both | screen filings |
| Admissions | `/admin/admissions` | — | both | screen admissions |
| Syllabus | `/admin/syllabus` | — | both | screen syllabus-coverage |
| Attendance | `/admin/attendance` | — | both | screen attendance |
| Staff attendance | `/admin/staff-attendance` | — | both | screen staff-attendance |
| Substitutions | `/admin/substitutions` | — | both | screen substitutions |
| Calendar | `/admin/calendar` | — | both | screen calendar |
| Fees | `/admin/fees` | — | both | screen fees |
| Texts & WhatsApp | `/admin/messaging` | — | both | screen messaging |
| Circulars | `/admin/circulars` | — | both | screen circulars |
| Incidents | `/admin/incidents` | — | both | screen incidents |
| Transport | `/admin/transport` | module TRANSPORT | phone opens web | opens web /admin/transport |
| Leave | `/principal/leave` | — | both | tab leave |
| Trends | `/principal/trends` | — | both | screen trends |
| Reviews | `/admin/reviews` | — | both | screen reviews |
| Safety | `/admin/safety` | — | both | screen safety |
| Settings | `/admin/settings` | — | both | screen settings |
| Alumni | `/admin/alumni` | module ALUMNI | phone opens web | opens web /admin/alumni |
| Messages | `/remarks` | — | both | tab messages |
| Waiting to join | `/joins` | — | both | screen joins |
| Social Media | `/bulletin` | — | both | screen bulletin |
| Experts | `/experts` | — | both | screen experts |
| Vacancies | `/admin/vacancies` | — | both | screen vacancies |
| Enquiries | `/enquiries` | — | both | screen enquiries |
| Mentoring | `/mentoring` | — | both | screen mentoring |
| Sessions | `/admin/sessions` | — | both | screen sessions |
| Competitions | `/competitions` | — | both | screen competitions |
| Past years | `/archive` | — | both | screen archive |
| Inventory and assets | `/admin/inventory` | module INVENTORY | both | screen inventory |
| HR and payroll | `/admin/payroll` | module PAYROLL | both | screen payroll |
| My payslips | `/account/payslips` | module PAYROLL | both | screen payslips |
| Things issued to me | `/account/items` | module INVENTORY | web only |  |
| Library | `/library` | module LIBRARY | phone opens web | opens web /library |
| Hostel | `/admin/hostel` | module HOSTEL | phone opens web | opens web /admin/hostel |
| Academics | `/admin/academics` | module ACADEMICS | phone opens web | opens web /admin/academics |
| College admissions | `/admin/college-admissions` | module ADMISSIONS | phone opens web | opens web /admin/college-admissions |
| Accounts | `/accounts` | module ACADEMICS | phone opens web | opens web /accounts |
| Library, hostel and bus | `/admin/college-campus` | module ACADEMICS | phone opens web | opens web /admin/college-campus |
| Exam cell | `/exam-cell` | module EXAMS | phone opens web | opens web /exam-cell |
| Placement | `/placement` | module PLACEMENT | phone opens web | opens web /placement |
| IQAC desk | `/iqac` | module IQAC | phone opens web | opens web /iqac |
| Committees and minutes | `/admin/committees` | module IQAC | phone opens web | opens web /admin/committees |
| Faculty records | `/admin/faculty-records` | module IQAC | phone opens web | opens web /admin/faculty-records |
| The college | `/principal/college` | module ACADEMICS | both | screen college |
| Stream records | `/admin/stream-records` | module ACADEMICS | web only |  |

**Other web pages this role owns, not in its menu** (21; detail, tab and action pages): `/admin/directory`, `/alumni/directory`, `/duties/anti-ragging`, `/principal`, `/principal/classes`, `/principal/classes/[classId]`, `/principal/decisions`, `/principal/timetable`, `/teacher`, `/teacher/appraisals`, `/teacher/assignments`, `/teacher/assignments/[assignmentId]`, `/teacher/assignments/new`, `/teacher/attendance`, `/teacher/attendance/me`, `/teacher/classes`, `/teacher/classes/[classId]`, `/teacher/classes/[classId]/analytics`, `/teacher/classes/[classId]/report-cards`, `/teacher/classes/[classId]/syllabus`, `/teacher/exams`.

**Journeys — as the school office**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Read the registers, chase absence | `/admin/attendance`, `/attendance/history` | `attendance` | 4 of 4 phone-called: `GET /admin/attendance`; `GET /admin/attendance/history`; `POST /office/attendance/alert`; `GET /office/attendance/export/register` | The register itself is marked by the teacher (see TEACHER); the office reads and may export. |
| daily | Staff register and who covers a lesson | `/admin/staff-attendance`, `/admin/substitutions`, `/admin/substitutions/print` | `staff-attendance`, `substitutions` | 4 of 5 phone-called: `GET /office/staff-attendance`; `POST /office/staff-attendance`; `GET /office/substitutions`; `POST /office/substitutions`; `POST /office/substitutions/clear`* |  |
| daily | Leave queue with cover | `/principal/leave` | `leave` | 2 of 2 phone-called: `GET /admin/leave`; `POST /admin/leave/{leaveId}/decide` | The admin's menu points at the principal's page (nav.ts NAV.ADMIN, href /principal/leave). |
| daily | Counter receipt, UPI claims, dues chase | `/admin/fees`, `/admin/fees/pupils/[studentMembershipId]`, `/admin/fees/claims`, `/admin/fees/dues` | `fees`, `fee-pupil`, `fee-claims`, `fees-dues` | 8 of 8 phone-called: `POST /fees/payments`; `GET /fees/claims`; `POST /fees/claims/{paymentId}/confirm`; `POST /fees/claims/{paymentId}/reject`; `POST /fees/bank-import/preview`; `POST /fees/bank-import/commit`; `GET /fees/dues`; `POST /fees/remind` | Money never touches the platform (decision 0003): the receipt records what the counter or bank took. |
| daily | Who is waiting to join; guardian claims | `/joins` | `joins` | 3 of 3 phone-called: `GET /shared/joins`; `POST /shared/joins/{requestId}/decide`; `POST /shared/claims/{claimId}/decide` |  |
| daily | Notices to families (text, app, circular) | `/admin/circulars`, `/admin/messaging`, `/admin/messaging/new`, `/bulletin/new` | `circulars`, `messaging`, `messaging-new`, `circular-reach`, `post-new` | 5 of 5 phone-called: `POST /messaging/broadcasts/preview`; `POST /messaging/broadcasts`; `POST /messaging/broadcasts/{broadcastId}/resend`; `GET /shared/bulletin/{postId}/reach`; `POST /shared/bulletin/{postId}/remind` |  |
| daily | Certificate asks, record-change asks, PEN | `/admin/certificates`, `/admin/certificates/issue`, `/admin/records`, `/admin/records/[membershipId]` | `staff-certificates`, `certificate-issue`, `pupil-records`, `pupil-record` | 5 of 5 phone-called: `GET /office/certificate-requests`; `POST /office/certificates`; `GET /office/record-changes`; `POST /office/record-changes/{requestId}/decide`; `POST /office/pupil-records/{membershipId}/pen-change` |  |
| termly | Exam series and date sheets | `/admin/exams` | `exams` | 5 of 5 phone-called: `GET /admin/exams`; `POST /admin/exams`; `POST /admin/exams/{seriesId}/slots`; `POST /admin/exams/{seriesId}/publish`; `POST /office/exams/{seriesId}/archive` | Slot removal is a web server action only (admin/exams/actions.ts removeSlot has no door). |
| termly | Report card rules; term weights | `/admin/report-cards` | `report-card-rules` | 3 of 3 phone-called: `GET /office/report-card-config`; `POST /office/report-card-config`; `POST /office/terms/{termId}/weight` | The class teacher builds and publishes the cards (TEACHER). |
| termly | Timetable, periods, copy and import | `/admin/timetable` | `timetable`, `timetable-editor` | 6 of 6 phone-called: `GET /admin/timetable`; `POST /admin/timetable/periods`; `POST /admin/timetable/slots`; `POST /office/timetable/import/preview`; `POST /office/timetable/import`; `POST /office/timetable/copy` |  |
| termly | Fee structures, heads, plans, concessions | `/admin/fees/structures`, `/admin/fees/structures/new`, `/admin/fees/structures/[structureId]`, `/admin/fees/heads`, `/admin/fees/settings` | `fees` | 1 of 6 phone-called: `POST /fees/structures`*; `POST /fees/structures/{structureId}/publish`*; `POST /fees/plans`*; `POST /fees/concessions`*; `POST /fees/heads`*; `POST /fees/settings` | The phone's fee screens read and take receipts; structure writing is the web's (no phone reference to POST /fees/structures). |
| termly | Syllabus lists and coverage | `/admin/syllabus`, `/admin/syllabus/coverage` | `syllabus-coverage` | 1 of 3 phone-called: `GET /office/syllabus`*; `POST /office/syllabus`*; `GET /office/syllabus/coverage` |  |
| termly | Terms, holidays, the calendar | `/admin/calendar` | `calendar` | 2 of 2 phone-called: `GET /admin/calendar`; `POST /admin/calendar/closures` | Creating a term or an academic year, and closing a year, are web server actions with no door (calendar/actions.ts). |
| yearly | Admissions cycle to seat | `/admin/admissions`, `/admin/admissions/new`, `/admin/admissions/[cycleId]`, `/admin/admissions/applications`, `/admin/admissions/applications/new`, `/admin/admissions/applications/[applicationId]` | `admissions`, `admission-slots`, `applications`, `application-new`, `application` | 4 of 6 phone-called: `GET /office/admissions/cycles`; `POST /office/admissions/cycles`; `POST /office/admissions/cycles/{cycleId}/slots`; `GET /office/admissions/applications`; `POST /office/admissions/applications/{applicationId}/offer`*; `POST /office/admissions/applications/{applicationId}/admit`* |  |
| yearly | Intake by sheet; invitations | `/admin/intake`, `/admin/invites`, `/admin/invites/new`, `/admin/people` | `intake`, `invites`, `people` | 5 of 5 phone-called: `POST /office/intake/preview`; `POST /admin/people/intake`; `POST /office/invites/preview`; `POST /admin/people/invites`; `POST /office/invites/{inviteId}/resend` |  |
| yearly | Year close and promotion | `/admin/promotion`, `/admin/classes`, `/admin/classes/new`, `/admin/classes/[classId]`, `/admin/calendar` | `classes`, `class-new` | 4 of 5 phone-called: `GET /admin/classes/promotion`*; `GET /admin/classes`; `POST /admin/classes`; `POST /admin/classes/{classId}/archive`; `POST /admin/classes/{classId}/teacher` | The promotion itself (promoteSchool) and the year's close are web server actions; the catalog has only the plan read. |
| yearly | A pupil leaves; the record outlives the school | `/admin/people`, `/admin/records` | `person`, `pupil-record` | 4 of 4 phone-called: `POST /admin/people/{membershipId}/leaving`; `POST /admin/people/{membershipId}/leaving/undo`; `POST /admin/people/{membershipId}/legal-name`; `POST /admin/people/{membershipId}/pause` |  |
| yearly | UDISE+ and board sheets | `/admin/filings`, `/admin/filings/export/[kind]` | `filings` | 5 of 5 phone-called: `GET /office/filings`; `POST /office/filings/identity`; `GET /office/filings/export/udise-students`; `GET /office/filings/export/udise-teachers`; `GET /office/filings/export/udise-enrolment` |  |
| yearly | Modules, settings, the feed's reach | `/admin/settings`, `/admin/settings/modules`, `/admin/settings/feed` | `settings` | 2 of 5 phone-called: `GET /admin/modules`*; `POST /admin/modules`*; `GET /admin/settings`; `POST /admin/settings`; `POST /admin/feed-kinds`* |  |
| monthly | Payroll run to payslip (PAYROLL on) | `/admin/payroll`, `/admin/payroll/runs/[month]`, `/admin/payroll/salaries`, `/admin/payroll/advances` | `payroll` | 1 of 5 phone-called: `POST /admin/payroll/runs`*; `POST /admin/payroll/runs/{month}/lock`*; `POST /admin/payroll/runs/{month}/share`*; `GET /admin/payroll/runs/{month}/export/{kind}`*; `GET /account/payslips` | The phone's payroll screen is a read (see parity). |
| daily | Stores, library, hostel, bus (modules on) | `/admin/inventory`, `/library`, `/admin/hostel`, `/admin/transport`, `/admin/transport/trips/[tripId]` | `inventory`, `transport` | 1 of 5 phone-called: `GET /admin/inventory`; `POST /admin/inventory/movements`*; `GET /admin/transport`*; `POST /admin/transport/allotments`*; `GET /admin/transport/trips`* | Library, hostel and transport desks open on the web from the phone (MENU.ADMIN web: entries). |

**Journeys — as the college registrar**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Admit from the CET list to a seat | `/admin/college-admissions`, `/admin/college-admissions/[applicationId]`, `/admin/college-admissions/refunds`, `/admin/college-admissions/register` | — | 0 of 9 phone-called: `GET /college/admissions/rounds`*; `POST /college/admissions/rounds`*; `POST /college/admissions/rounds/{roundId}/import`*; `POST /college/admissions/applications/{applicationId}/documents`*; `POST /college/admissions/applications/{applicationId}/undertaking`*; `POST /college/admissions/applications/{applicationId}/offer`*; `POST /college/admissions/applications/{applicationId}/admit`*; `POST /college/admissions/applications/{applicationId}/cancel`*; `GET /college/admissions/register`* | Phone: opens the web (MENU.ADMIN web:/admin/college-admissions). |
| termly | Seat, division, registration window, late registration | `/admin/academics/students`, `/admin/academics/terms`, `/admin/academics/registration`, `/admin/academics/condonations` | — | 2 of 6 phone-called: `POST /academics/students`*; `POST /academics/terms`*; `GET /academics/registration`; `POST /academics/registration`; `POST /academics/late-registrations`*; `GET /academics/late-registrations`* | Principal decides a late registration (POST /academics/late-registrations/{id}/decide). |
| termly | Structure: departments, programmes, schemes, courses, rooms, offerings | `/admin/academics`, `/admin/academics/programmes`, `/admin/academics/offerings`, `/admin/academics/timetable`, `/admin/academics/substitutions`, `/admin/academics/attendance` | — | 0 of 10 phone-called: `GET /academics/structure`*; `POST /academics/departments`*; `POST /academics/programmes`*; `POST /academics/schemes`*; `POST /academics/courses`*; `POST /academics/divisions`*; `POST /academics/rooms`*; `POST /academics/offerings`*; `POST /academics/timetable`*; `POST /academics/faculty`* |  |
| termly | Give a teacher a duty (lab, NSS, squad...) | `/admin/people` | — | 0 of 1 phone-called: `POST /admin/people/{membershipId}/duties`* | Duties offered are the streams' (DUTY_STREAMS). |
| termly | Lab batches, practicals, moot courts | `/admin/stream-records`, `/admin/stream-records/lab-batches`, `/admin/stream-records/practicals`, `/admin/stream-records/moot-courts` | — | 2 of 6 phone-called: `GET /stream-records/lab-batches`*; `POST /stream-records/lab-batches/split`*; `POST /stream-records/lab-batches/{batchId}/members`*; `GET /stream-records/practicals`; `GET /stream-records/summary`; `GET /stream-records/moot-courts`* | Web only for the office; the lab in-charge's and teacher's practicals are on the phone. |
| termly | Campus: library terms, hostel rules, route fees, mess bill | `/admin/college-campus`, `/admin/hostel`, `/admin/transport` | — | 0 of 6 phone-called: `POST /library/college-settings`*; `POST /hostel/hostels/{hostelId}/rules`*; `POST /admin/transport/routes/{routeId}/college`*; `POST /accounts/mess-bill`*; `POST /accounts/route-fees`*; `POST /admin/calendar/import`* |  |
| yearly | Faculty records, committees, college profile and streams | `/admin/faculty-records`, `/admin/committees`, `/admin/settings/college` | — | 0 of 6 phone-called: `GET /iqac/faculty-records`*; `POST /iqac/faculty-records`*; `POST /iqac/committees`*; `POST /iqac/committees/{committeeId}/meetings`*; `GET /admin/college-profile`*; `POST /admin/college-profile`* |  |
| yearly | Leaving: no-dues, the TC, the alumnus row opens | `/accounts/no-dues`, `/admin/people` | — | 1 of 3 phone-called: `GET /accounts/no-dues/{studentMembershipId}`; `POST /accounts/no-dues/{studentMembershipId}`*; `POST /accounts/leaving/{studentMembershipId}`* | leaveCollege opens the alumnus membership (docs/college.md, Office). |
| yearly | Alumni side of the office | `/admin/alumni`, `/admin/alumni/college` | — | 0 of 5 phone-called: `GET /admin/alumni/college`*; `POST /admin/alumni/gifts`*; `POST /admin/alumni/meets`*; `POST /admin/alumni/mentor`*; `POST /admin/alumni/notes`* |  |

Also at a college the registrar reads `/exam-cell` and `/accounts` (named in `access`) and, with PRINCIPAL, every stream desk's read (`/duties/*`: the doors name ADMIN and PRINCIPAL beside FACULTY and HOD). The registrar's phone work is the school's list above; every college journey is web only (MENU.ADMIN opens `/admin/academics`, `/admin/college-admissions`, `/admin/college-campus`, `/accounts`, `/exam-cell`, `/placement`, `/iqac`, `/admin/committees`, `/admin/faculty-records` on the web), apart from the college tile on the phone home (`screens/college/glance.tsx`).

### 4.2 · PRINCIPAL

Membership role PRINCIPAL. Reads what the office set up and decides what the regulations reserve for the head: leave, PEN changes, and at a college nine kinds of approval (college-principal.ts, ApprovalLine).

- **Web home** `/principal`; **phone home** PrincipalHome. **Gate:** ordinary role (its handlers check the role; the API sweep proves it).
- **Doors:** 353 (246 GET, 107 writes): 296 naming the role (**11 naming it alone**) and 57 signed-in; 146 behind a module, 103 flagged college. By module: ungated 207, IQAC 25, ACADEMICS 22, LIBRARY 18, EXAMS 16, HOSTEL 13, INVENTORY 12, PLACEMENT 12, PAYROLL 8, ADMISSIONS 8, TRANSPORT 5, ALUMNI 4, SCHOLARSHIPS 3. The phone calls 212 of them (60 %).
- **Phone:** Tabs: Dashboard, Classes, Leave, Messages. More: 44 entries, 33 native, 11 open the web (`/admin/transport`, `/library/reports`, `/admin/hostel`, `/admin/academics`, `/accounts`, `/admin/college-admissions`, `/exam-cell`, `/placement`, `/principal/accreditation`, `/admin/committees`, `/admin/faculty-records`).
- **Menu parity:** 34 both, 11 phone opens the web, 2 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.PRINCIPAL`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Dashboard | `/principal` | — | both | tab index |
| Classes | `/principal/classes` | — | both | tab classes |
| Leave | `/principal/leave` | — | both | tab leave |
| Reviews | `/admin/reviews` | — | both | screen reviews |
| Exams | `/exams` | — | both | screen exams |
| Report cards | `/admin/report-cards` | — | both | screen report-card-rules |
| Certificates | `/admin/certificates` | — | both | screen staff-certificates |
| Signatures | `/admin/signatures` | — | both | screen signatures |
| Pupil records | `/admin/records` | — | both | screen pupil-records |
| Filings | `/admin/filings` | — | both | screen filings |
| Admissions | `/admin/admissions` | — | both | screen admissions |
| Syllabus | `/admin/syllabus` | — | both | screen syllabus-coverage |
| Timetable | `/principal/timetable` | — | both | screen timetable |
| Decisions | `/principal/decisions` | — | both | screen decisions |
| Trends | `/principal/trends` | — | both | screen trends |
| Staff attendance | `/admin/staff-attendance` | — | both | screen staff-attendance |
| Substitutions | `/admin/substitutions` | — | both | screen substitutions |
| Calendar | `/admin/calendar` | — | both | screen calendar |
| Fees | `/admin/fees` | — | both | screen fees |
| Texts & WhatsApp | `/admin/messaging` | — | both | screen messaging |
| Circulars | `/admin/circulars` | — | both | screen circulars |
| Incidents | `/admin/incidents` | — | both | screen incidents |
| Transport | `/admin/transport` | module TRANSPORT | phone opens web | opens web /admin/transport |
| Messages | `/remarks` | — | both | tab messages |
| Waiting to join | `/joins` | — | both | screen joins |
| Social Media | `/bulletin` | — | both | screen bulletin |
| Vacancies | `/admin/vacancies` | — | both | screen vacancies |
| Enquiries | `/enquiries` | — | both | screen enquiries |
| Competitions | `/competitions` | — | both | screen competitions |
| Sessions | `/admin/sessions` | — | both | screen sessions |
| Past years | `/archive` | — | both | screen archive |
| Account | `/account` | — | both | screen account |
| HR and payroll | `/admin/payroll` | module PAYROLL | both | screen payroll |
| Inventory and assets | `/admin/inventory` | module INVENTORY | both | screen inventory |
| My payslips | `/account/payslips` | module PAYROLL | both | screen payslips |
| Things issued to me | `/account/items` | module INVENTORY | web only |  |
| Library | `/library` | module LIBRARY | phone opens web | opens web /library/reports |
| Hostel | `/admin/hostel` | module HOSTEL | phone opens web | opens web /admin/hostel |
| Academics | `/admin/academics` | module ACADEMICS | phone opens web | opens web /admin/academics |
| Accounts | `/accounts` | module ACADEMICS | phone opens web | opens web /accounts |
| College admissions | `/admin/college-admissions` | module ADMISSIONS | phone opens web | opens web /admin/college-admissions |
| Exam cell | `/exam-cell` | module EXAMS | phone opens web | opens web /exam-cell |
| Placement | `/placement` | module PLACEMENT | phone opens web | opens web /placement |
| Accreditation file | `/principal/accreditation` | module IQAC | phone opens web | opens web /principal/accreditation |
| Committees and minutes | `/admin/committees` | module IQAC | phone opens web | opens web /admin/committees |
| Faculty records | `/admin/faculty-records` | module IQAC | phone opens web | opens web /admin/faculty-records |
| Stream records | `/admin/stream-records` | module ACADEMICS | web only |  |

**Other web pages this role owns, not in its menu** (14; detail, tab and action pages): `/admin/alumni`, `/admin/alumni/college`, `/admin/college-campus`, `/admin/settings/college`, `/admin/settings/feed`, `/admin/settings/modules`, `/alumni/directory`, `/duties/anti-ragging`, `/teacher/appraisals`, `/teacher/attendance/me`, `/teacher/classes/[classId]/analytics`, `/teacher/classes/[classId]/report-cards`, `/teacher/classes/[classId]/syllabus`, `/teacher/leave`.

**Journeys — school and college**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | The school at a glance | `/principal`, `/principal/classes`, `/principal/classes/[classId]`, `/principal/timetable` | `index`, `classes`, `timetable` | 3 of 3 phone-called: `GET /staff/principal/overview`; `GET /staff/principal/classes`; `GET /staff/principal/timetable` | At a college /principal opens /principal/college (docs/college.md Roles). |
| daily | Leave decisions with cover | `/principal/leave`, `/principal/staff` | `leave`, `staff` | 3 of 3 phone-called: `GET /admin/leave`; `POST /admin/leave/{leaveId}/decide`; `GET /admin/staff` |  |
| weekly | The decision log; PEN changes the head decides | `/principal/decisions`, `/admin/records` | `decisions` | 3 of 3 phone-called: `GET /principal/decisions`; `POST /office/pen-changes/{requestId}/decide`; `GET /office/pen-changes` | At a college the log also holds grace, condonation, concession, late registration (docs/college.md). |
| termly | Staff observations and appraisals | `/principal/staff/[membershipId]/appraisal` | `staff-appraisal` | 4 of 4 phone-called: `GET /principal/staff/{membershipId}/appraisals`; `POST /principal/staff/{membershipId}/appraisals`; `PUT /principal/appraisals/{id}`; `DELETE /principal/appraisals/{id}` | Visible entries are read by the member through GET /staff/me/appraisals (TEACHER, ADMIN, PRINCIPAL only: see gaps). |
| termly | Trends across terms; reviews | `/principal/trends`, `/admin/reviews` | `trends`, `reviews` | 3 of 3 phone-called: `GET /principal/trends`; `GET /admin/reviews`; `POST /admin/reviews` |  |
| college | Nine approvals the head decides (college-principal.ts ApprovalLine) | `/principal/leave`, `/admin/academics/condonations`, `/accounts/concessions`, `/exam-cell`, `/admin/academics/registration`, `/principal/accreditation`, `/admin/payroll`, `/admin/college-admissions/refunds`, `/hostel/expulsions` | `college`, `decisions` | 1 of 8 phone-called: `POST /academics/condonations/{id}/decide`; `POST /accounts/concessions/{concessionId}/decide`*; `POST /exam-cell/grace/{graceId}/decide`*; `POST /academics/late-registrations/{id}/decide`*; `POST /iqac/filings/{filingId}/signoff`*; `POST /college/admissions/applications/{applicationId}/refund-exception/decide`*; `POST /hostel/expulsions/{expulsionId}/decide`*; `POST /college/admissions/applications/{applicationId}/supernumerary`* | The phone's college tile shows the counts and opens the web decide pages; of the eight decide doors listed the phone calls one, the condonation decision from the HOD's screen (the leave decision, `POST /admin/leave/{leaveId}/decide`, is in the daily journey above). |
| college | Read the whole college | `/principal/college`, `/exam-cell/analytics`, `/principal/accreditation` | `college` | 2 of 3 phone-called: `GET /principal/college`; `GET /exam-cell/analytics`*; `GET /iqac/overview` |  |
| yearly | Filings read by the head (UDISE+, college returns) | `/admin/filings`, `/iqac/documents` | `filings` | 2 of 2 phone-called: `GET /office/filings`; `GET /iqac/filings` | The office cuts the school's sheets; the head reads. |

### 4.3 · TEACHER

Membership role TEACHER (also the junior college's teacher). Registers, work, marks, report cards, lessons.

- **Web home** `/teacher`; **phone home** TeacherHome. **Gate:** ordinary role (its handlers check the role; the API sweep proves it).
- **Doors:** 179 (87 GET, 92 writes): 122 naming the role (**19 naming it alone**) and 57 signed-in; 14 behind a module, 0 flagged college. By module: ungated 165, LIBRARY 5, PAYROLL 4, INVENTORY 3, ALUMNI 2. The phone calls 159 of them (89 %).
- **Phone:** Tabs: Today, Attendance, Classes, Messages. More: 25 entries, 25 native.
- **Menu parity:** 27 both, 0 phone opens the web, 1 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.TEACHER`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Today | `/teacher` | — | both | tab index |
| Attendance | `/teacher/attendance` | — | both | tab attendance |
| Classes | `/teacher/classes` | — | both | tab classes |
| Assignments | `/teacher/assignments` | — | both | screen assignments |
| Exams | `/teacher/exams` | — | both | screen exams |
| Timetable | `/timetable` | — | both | screen timetable |
| Messages | `/remarks` | — | both | tab messages |
| Practice | `/teacher/practice` | — | both | screen practice |
| Meetings | `/teacher/meetings` | — | both | screen meetings |
| Leave | `/teacher/leave` | — | both | screen leave |
| Staff attendance | `/teacher/attendance/me` | — | both | screen my-attendance |
| Incidents | `/teacher/incidents` | — | both | screen incidents |
| Signatures | `/teacher/signatures` | — | both | screen signatures |
| Write questions | `/teacher/contributions` | — | both | screen contributions |
| Me | `/teacher/profile` | — | both | screen profile |
| My appraisal | `/teacher/appraisals` | — | both | screen my-appraisals |
| Waiting to join | `/joins` | — | both | screen joins |
| Social Media | `/bulletin` | — | both | screen bulletin |
| Experts | `/experts` | — | both | screen experts |
| Vacancies | `/vacancies` | — | both | screen vacancies |
| Enquiries | `/enquiries` | — | both | screen enquiries |
| Mentoring | `/mentoring` | — | both | screen mentoring |
| Guidance | `/teacher/guidance` | — | both | screen sessions |
| Competitions | `/competitions` | — | both | screen competitions |
| Past years | `/archive` | — | both | screen archive |
| My payslips | `/account/payslips` | module PAYROLL | both | screen payslips |
| Things issued to me | `/account/items` | module INVENTORY | web only |  |
| Library | `/teacher/library` | module LIBRARY | both | screen library |

**Other web pages this role owns, not in its menu** (3; detail, tab and action pages): `/alumni/directory`, `/teacher/worksheets`, `/teacher/worksheets/print`.

**Journeys — school**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Today: lessons, covers, notices | `/teacher` | `index` | 3 of 3 phone-called: `GET /staff/today`; `GET /staff/timetable`; `GET /staff/substitutions/me` |  |
| daily | Mark the register (works offline on the phone) | `/teacher/attendance`, `/attendance/history` | `attendance` | 2 of 2 phone-called: `GET /staff/attendance/classes`; `GET /staff/attendance/register` | The write is POST /api/attendance, outside the catalog (src/app/api/attendance/route.ts; the phone posts it with an outbox, screens/teacher/register.tsx:171). |
| daily | Check in for the day | `/teacher/attendance/me` | `my-attendance` | 2 of 2 phone-called: `POST /staff/attendance/check-in`; `GET /staff/attendance/me` |  |
| daily | Take or decline a cover | `/teacher` | `my-covers` | 3 of 3 phone-called: `GET /staff/substitutions/me`; `POST /teaching/covers/{id}/acknowledge`; `POST /teaching/covers/{id}/decline` |  |
| daily | Parents and pupils: messages and remarks | `/remarks`, `/remarks/new`, `/remarks/[threadId]`, `/remarks/people` | `messages`, `remark-new` | 5 of 5 phone-called: `GET /shared/inbox`; `GET /shared/threads/{threadId}`; `POST /shared/threads/{threadId}/reply`; `POST /teaching/remarks`; `POST /messages` |  |
| weekly | Set work, mark it | `/teacher/assignments`, `/teacher/assignments/new`, `/teacher/assignments/[assignmentId]` | `assignments`, `assignment` | 3 of 4 phone-called: `POST /staff/assignments`*; `POST /staff/assignments/publish`; `GET /teaching/assignments/{assignmentId}`; `POST /teaching/assignments/{assignmentId}/grades` |  |
| weekly | Plan and log lessons; move syllabus units | `/teacher/classes/[classId]/syllabus` | `syllabus` | 3 of 5 phone-called: `POST /staff/lessons`; `POST /staff/lessons/{lessonId}/status`*; `GET /staff/syllabus`; `POST /staff/syllabus/progress`*; `GET /teaching/plan-templates` |  |
| weekly | Set adaptive practice; worksheets | `/teacher/practice`, `/teacher/worksheets`, `/teacher/worksheets/print` | `practice`, `worksheets` | 4 of 4 phone-called: `GET /staff/practice`; `POST /staff/practice`; `GET /practice/worksheets`; `GET /practice/worksheets/sheet` |  |
| weekly | Incidents and the sick room | `/teacher/incidents`, `/incidents/new`, `/incidents/[incidentId]` | `incidents`, `incident-new`, `incident` | 2 of 3 phone-called: `GET /staff/incidents`; `POST /staff/incidents`; `POST /staff/incidents/{incidentId}/notes`* |  |
| weekly | Parent-teacher meeting slots | `/teacher/meetings` | `meetings` | 3 of 3 phone-called: `GET /staff/meetings`; `POST /staff/meetings`; `POST /staff/meetings/cancel` |  |
| termly | Enter marks for a paper | `/teacher/exams` | `exams`, `marks` | 4 of 4 phone-called: `GET /staff/exams`; `GET /staff/exams/grid`; `POST /marks`; `GET /teaching/classes/{classId}/marks/export` |  |
| termly | Build, remark and publish the class's report cards | `/teacher/classes/[classId]/report-cards` | `report-cards` | 6 of 6 phone-called: `GET /teaching/classes/{classId}/report-cards`; `POST /teaching/classes/{classId}/report-cards/generate`; `POST /teaching/classes/{classId}/report-cards/remark`; `POST /teaching/classes/{classId}/report-cards/co-scholastic`; `POST /teaching/classes/{classId}/report-cards/publish`; `GET /teaching/classes/{classId}/report-cards/pdf` |  |
| termly | Class analytics; the gradebook | `/teacher/classes/[classId]/analytics`, `/teacher/classes/[classId]` | `class-analytics`, `classes` | 3 of 4 phone-called: `GET /teaching/classes/{classId}/analytics`; `GET /staff/classes/{classId}`; `POST /staff/classes/{classId}/weights`; `GET /teaching/classes/{classId}/gradebook/export`* |  |
| termly | Questions for the bank (paid per accepted question) | `/teacher/contributions`, `/teacher/contributions/new`, `/teacher/contributions/[contributionId]` | `contributions`, `contribution` | 4 of 4 phone-called: `GET /gigs/questions`; `POST /gigs/questions`; `POST /gigs/questions/draft`; `POST /gigs/payee` | Decision 0004: the company collects; one-to-ones never priced. |
| yearly | Leave, appraisals read, signature | `/teacher/leave`, `/teacher/appraisals`, `/teacher/signatures` | `leave`, `my-appraisals`, `signatures` | 4 of 4 phone-called: `GET /staff/leave`; `POST /staff/leave`; `GET /staff/me/appraisals`; `POST /office/signatures/mine` |  |
| any | Guidance (free one-to-ones), expert booking, vacancies | `/teacher/guidance`, `/experts`, `/vacancies` | `sessions`, `experts`, `vacancies` | 3 of 3 phone-called: `POST /gigs/slots`; `POST /staff/experts/book`; `GET /shared/vacancies` |  |

### 4.4 · STUDENT — a pupil, and an adult at a college

Membership role STUDENT. A pupil at a school; an adult with registration, exams, money and placement at a college.

- **Web home** `/student`; **phone home** StudentHome. **Gate:** ordinary role (its handlers check the role; the API sweep proves it).
- **Doors:** 166 (85 GET, 81 writes): 109 naming the role (**38 naming it alone**) and 57 signed-in; 42 behind a module, 35 flagged college. By module: ungated 124, PLACEMENT 9, ACADEMICS 8, LIBRARY 7, EXAMS 6, HOSTEL 4, IQAC 4, SCHOLARSHIPS 3, TRANSPORT 1. The phone calls 153 of them (92 %).
- **Phone:** Tabs: Today, Assignments, Practice, Messages. More: 26 entries, 26 native.
- **Menu parity:** 26 both, 0 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.STUDENT`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Today | `/student` | — | both | tab index |
| Assignments | `/student/assignments` | — | both | tab assignments |
| Exams | `/exams` | — | both | screen exams |
| Certificates | `/student/certificates` | — | both | screen certificates |
| Practice | `/student/practice` | — | both | tab practice |
| Timetable | `/timetable` | — | both | screen timetable |
| Messages | `/remarks` | — | both | tab messages |
| Feedback | `/reviews` | — | both | screen reviews |
| Health card | `/student/health` | — | both | screen health |
| Incidents | `/student/incidents` | — | both | screen family-incidents |
| Social Media | `/bulletin` | — | both | screen bulletin |
| Mentoring | `/mentoring` | — | both | screen mentoring |
| Sessions | `/sessions` | — | both | screen sessions |
| Competitions | `/competitions` | — | both | screen competitions |
| Past years | `/archive` | — | both | screen archive |
| Me | `/student/profile` | — | both | screen profile |
| What my family sees | `/student/consent` | module ACADEMICS | both | screen consent |
| Library | `/student/library` | module LIBRARY | both | screen library |
| Hostel | `/student/hostel` | module HOSTEL | both | screen hostel |
| My academics | `/student/academics` | module ACADEMICS | both | screen academics |
| My money | `/student/money` | module ACADEMICS | both | screen money |
| Scholarships | `/student/scholarships` | module SCHOLARSHIPS | both | screen scholarships |
| My account | `/student/account` | module ACADEMICS | both | screen student-account |
| My exams | `/student/exams` | module EXAMS | both | screen college-exams |
| Placement | `/student/placement` | module PLACEMENT | both | screen placement |
| Feedback and grievances | `/student/voice` | module IQAC | both | screen voice |

**Other web pages this role owns, not in its menu** (3; detail, tab and action pages): `/library/e-resources`, `/student/agenda`, `/student/fees`.

**Journeys — at a school**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Today: lessons, work due, welcome | `/student`, `/student/agenda`, `/timetable` | `index`, `agenda`, `timetable` | 3 of 3 phone-called: `GET /family/student/overview`; `GET /family/agenda`; `GET /family/timetable` |  |
| daily | Hand in work with photographs | `/student/assignments`, `/student/work` | `assignments`, `assignment` | 3 of 3 phone-called: `GET /family/student/assignments`; `POST /family/student/submissions`; `POST /uploads` |  |
| daily | Adaptive practice, revision, badges | `/student/practice`, `/student/practice/[slug]`, `/student/practice/journey`, `/student/practice/revision` | `practice`, `quiz` | 6 of 6 phone-called: `GET /family/student/practice`; `POST /practice/attempts`; `GET /practice/next`; `POST /practice/answer`; `POST /practice/reveal`; `GET /practice/revision` | POST /api/practice/answer (non-v1) is also a route; the v1 door is the catalogued one. |
| daily | Messages with teachers | `/remarks`, `/remarks/[threadId]` | `messages` | 3 of 3 phone-called: `GET /shared/inbox`; `GET /shared/threads/{threadId}`; `POST /shared/threads/{threadId}/reply` |  |
| termly | Marks and report cards | `/exams`, `/report-cards`, `/report-cards/[cardId]`, `/student/grades` | `exams`, `report` | 4 of 4 phone-called: `GET /family/exams`; `GET /family/report-cards`; `GET /family/report-cards/{cardId}`; `GET /shared/report-cards/{cardId}/pdf` |  |
| termly | Ask for a certificate; teacher feedback | `/student/certificates`, `/reviews` | `certificates`, `reviews` | 5 of 5 phone-called: `GET /family/certificate-requests`; `POST /family/certificate-requests`; `GET /family/certificates`; `GET /family/reviews`; `POST /family/reviews` |  |
| yearly | My record; competitions; expert sessions; past years | `/student/record`, `/competitions`, `/sessions`, `/archive` | `record`, `competitions`, `sessions`, `archive` | 7 of 7 phone-called: `GET /family/record`; `POST /family/record/changes`; `GET /shared/competitions`; `POST /shared/competitions/{competitionId}/enter`; `GET /gigs/sessions`; `POST /gigs/sessions/book`; `GET /shared/archive` |  |

**Journeys — at a college**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| termly | Register on the term's courses inside the window | `/student/registration` | `registration` | 2 of 2 phone-called: `GET /academics/registration`; `POST /academics/registration` |  |
| daily | Attendance against the 75 % rule; ask for condonation | `/student/academics`, `/student/academics/[offeringId]` | `academics` | 4 of 4 phone-called: `GET /academics/mine`; `GET /academics/condonations`; `POST /academics/condonations`; `GET /academics/offerings/{offeringId}/course-file` |  |
| termly | Exam form with eligibility and no-dues; hall ticket; revaluation; backlog | `/student/exams` | `college-exams` | 6 of 6 phone-called: `GET /exam-cell/mine`; `POST /exam-cell/forms/{formId}/submit`; `GET /exam-cell/hall-tickets/{ticketId}/pdf`; `POST /exam-cell/mine/revaluations`; `POST /exam-cell/mine/backlogs`; `GET /exam-cell/documents/{documentId}/pdf` |  |
| termly | Ledger net of the state's share; scholarship documents | `/student/money`, `/student/scholarships` | `money`, `scholarships` | 3 of 4 phone-called: `GET /student/ledger`; `GET /student/scholarships`; `POST /student/scholarships/{claimId}/documents`; `GET /college/scholarships/schemes`* |  |
| yearly | Placement: profile, drives, offers, internship diary | `/student/placement` | `placement` | 4 of 7 phone-called: `GET /student/placement`; `POST /student/placement/profile`*; `POST /student/placement/drives/{driveId}/apply`; `POST /student/placement/offers/{offerId}`; `POST /student/internships`*; `POST /student/internships/{internshipId}/diary`*; `GET /student/placement/resume` |  |
| termly | Feedback, the satisfaction survey, a grievance, escalation | `/student/voice` | `voice` | 4 of 4 phone-called: `GET /voice`; `POST /voice/surveys/{surveyId}`; `POST /voice/grievances`; `POST /voice/grievances/{grievanceId}/escalate` |  |
| any | What my guardian may see; my account and no-dues | `/student/consent`, `/student/account` | `consent`, `student-account` | 3 of 4 phone-called: `GET /student/consent`; `POST /student/consent`; `GET /student/account`; `GET /student/no-dues`* | Adult at a college only (the grant applies=false for a minor). |
| any | Library e-resources, hostel, the bus | `/library/e-resources`, `/student/library`, `/student/hostel` | `e-resources`, `library`, `hostel`, `transport` | 6 of 6 phone-called: `GET /library/eresources`; `POST /library/eresources/{resourceId}/open`; `GET /library/mine`; `GET /family/hostel`; `POST /family/hostel/leave`; `GET /family/transport` |  |

### 4.5 · PARENT — a guardian

Not a membership: a guardianship (Guardianship rows), so a parent belongs to no school and sees their children across schools. At a college sees only what an adult student grants (StudentConsent).

- **Web home** `/parent`; **phone home** ParentHome. **Gate:** no school; `requireParent`; a child is chosen with `?child=`.
- **Doors:** 162 (82 GET, 80 writes): 105 naming the role (**41 naming it alone**) and 57 signed-in; 21 behind a module, 10 flagged college. By module: ungated 141, LIBRARY 5, HOSTEL 5, EXAMS 3, TRANSPORT 2, PLACEMENT 2, IQAC 2, ACADEMICS 1, SCHOLARSHIPS 1. The phone calls 146 of them (90 %).
- **Phone:** Tabs: Overview, Attendance, Assignments, Messages. More: 29 entries, 28 native, 1 open the web (`/parent/placement`).
- **Menu parity:** 30 both, 1 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.PARENT`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Overview | `/parent` | — | both | tab index |
| Attendance | `/parent/attendance` | — | both | tab attendance |
| Assignments | `/parent/assignments` | — | both | tab assignments |
| Exams | `/exams` | — | both | screen exams |
| Messages | `/remarks` | — | both | tab messages |
| Certificates | `/parent/certificates` | — | both | screen certificates |
| Practice | `/parent/practice` | — | both | screen practice |
| Timetable | `/parent/timetable` | — | both | screen timetable |
| Meetings | `/parent/meetings` | — | both | screen meetings |
| Fees | `/parent/fees` | — | both | screen fees |
| Health card | `/parent/health` | — | both | screen health |
| Incidents | `/parent/incidents` | — | both | screen family-incidents |
| Bus | `/parent/transport` | module TRANSPORT | both | screen transport |
| Feedback | `/reviews` | — | both | screen reviews |
| Requests to link | `/parent/claims` | — | both | screen joins |
| Social Media | `/bulletin` | — | both | screen bulletin |
| Explore schools | `/explore` | — | both | screen explore |
| Applications | `/parent/applications` | — | both | screen my-applications |
| Enquiries | `/enquiries` | — | both | screen enquiries |
| Competitions | `/competitions` | — | both | screen competitions |
| Mentoring | `/mentoring` | — | both | screen mentoring |
| Sessions | `/sessions` | — | both | screen sessions |
| Past years | `/archive` | — | both | screen archive |
| Settings | `/parent/settings` | — | both | screen settings |
| Library | `/parent/library` | module LIBRARY | both | screen library |
| Hostel | `/parent/hostel` | module HOSTEL | both | screen hostel |
| College attendance | `/parent/academics` | module ACADEMICS | both | screen academics |
| College results | `/parent/results` | module EXAMS | both | screen college-exams |
| Placement | `/parent/placement` | module PLACEMENT | phone opens web | opens web /parent/placement |
| My money | `/parent/money` | module ACADEMICS | both | screen money |
| Surveys | `/parent/voice` | module IQAC | both | screen voice |

**Other web pages this role owns, not in its menu** (1; detail, tab and action pages): `/parent/agenda`.

**Journeys — school**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | The child's day (switch child) | `/parent`, `/parent/agenda`, `/parent/timetable` | `index`, `agenda`, `timetable` | 4 of 4 phone-called: `GET /family/children`; `GET /family/overview`; `GET /family/agenda`; `GET /family/timetable` |  |
| daily | Attendance; tell the school the child will be away | `/parent/attendance` | `attendance` | 4 of 4 phone-called: `GET /family/attendance`; `POST /family/students/{membershipId}/absence-notes`; `GET /family/students/{membershipId}/absence-notes`; `DELETE /family/students/{membershipId}/absence-notes/{noteId}` |  |
| weekly | Pay fees: the school's own gateway, or UPI | `/parent/fees`, `/fees/receipts/[receiptId]` | `fees` | 8 of 9 phone-called: `GET /fees/family`; `GET /family/fees/calendar`; `POST /fees/family/checkout`; `POST /fees/family/checkout/confirm`*; `POST /fees/family/upi`; `POST /fees/family/upi/claim`; `GET /fees/family/payments/{paymentId}`; `GET /family/fees/plans`; `POST /family/fees/plans/enrol` | Money never touches the platform: the checkout is at the school's gateway account. |
| weekly | Work, practice, messages, meetings | `/parent/assignments`, `/parent/practice`, `/remarks`, `/parent/meetings` | `assignments`, `practice`, `messages`, `meetings` | 6 of 6 phone-called: `GET /family/assignments`; `GET /family/practice`; `GET /shared/inbox`; `GET /family/meetings`; `POST /family/meetings`; `POST /family/meetings/cancel` |  |
| termly | Marks, report cards, certificates | `/exams`, `/parent/grades`, `/parent/certificates` | `exams`, `certificates`, `report` | 4 of 4 phone-called: `GET /family/exams`; `GET /family/report-cards`; `GET /family/certificates`; `POST /family/certificate-requests` |  |
| any | Health card, incidents, the record, PEN approvals, claims | `/parent/health`, `/parent/incidents`, `/parent/record`, `/parent/claims`, `/parent/settings` | `health`, `family-incidents`, `record`, `joins`, `settings` | 10 of 10 phone-called: `GET /family/health`; `POST /family/health`; `GET /family/incidents`; `GET /family/record`; `POST /family/record/changes`; `GET /family/pen-changes`; `POST /family/pen-changes/{requestId}/decide`; `POST /shared/claims/{claimId}/decide`; `GET /family/export`; `DELETE /family/children/{membershipId}/link` |  |
| yearly | Find a school and apply; enquire | `/explore`, `/explore/[schoolId]`, `/explore/[schoolId]/apply`, `/parent/applications`, `/parent/applications/[applicationId]`, `/enquiries` | `explore`, `apply`, `my-applications`, `my-application`, `enquiries` | 4 of 6 phone-called: `GET /family/explore`; `GET /shared/schools/{schoolId}/admissions`; `POST /family/applications`; `POST /family/applications/{applicationId}/book`*; `POST /family/applications/{applicationId}/respond`*; `POST /shared/enquiries` |  |
| any | Bus, hostel, library (modules on) | `/parent/transport`, `/parent/hostel`, `/parent/library` | `transport`, `hostel`, `library` | 4 of 5 phone-called: `GET /family/transport`; `POST /family/transport/alerts`*; `GET /family/hostel`; `POST /family/hostel/leave/{leaveId}/consent`; `GET /library/mine` |  |

**Journeys — consented view of an adult college student**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| any | What the adult student granted: attendance, results, money | `/parent/academics`, `/parent/results`, `/parent/money` | `academics`, `college-exams`, `money` | 4 of 4 phone-called: `GET /academics/family`; `GET /exam-cell/mine`; `GET /student/ledger`; `GET /student/scholarships` | Grants: ATTENDANCE, RESULTS, MONEY (StudentConsent); a minor's guardian sees all. |
| any | Placement consent for a minor; voice | `/parent/placement`, `/parent/voice` | `voice` | 1 of 3 phone-called: `GET /family/placement`*; `POST /family/placement/applications/{applicationId}/consent`*; `POST /voice/surveys/{surveyId}` | The phone opens /parent/placement on the web (MENU.PARENT web:). |

### 4.6 · EXPERT

An outside account (no school): a published expert with bookings, one-to-ones and workshops; an expert's tenant set is empty and reaches only what their own booking or mentorship names (RLS EXPERT_READABLE).

- **Web home** `/expert`; **phone home** ExpertHome. **Gate:** ordinary role (its handlers check the role; the API sweep proves it).
- **Doors:** 84 (36 GET, 48 writes): 27 naming the role (**17 naming it alone**) and 57 signed-in; 0 behind a module, 0 flagged college. By module: ungated 84. The phone calls 81 of them (96 %).
- **Phone:** Tabs: Bookings, Availability, Mentoring, Sessions. More: 2 entries, 2 native.
- **Menu parity:** 7 both, 0 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.EXPERT`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Bookings | `/expert` | — | both | tab index |
| Availability | `/expert/availability` | — | both | tab availability |
| Mentoring | `/mentoring` | — | both | tab mentoring |
| Sessions | `/expert/sessions` | — | both | tab sessions |
| Earnings | `/expert/earnings` | — | both | inside Profile |
| Profile | `/expert/profile` | — | both | screen profile |
| Account | `/account` | — | both | screen account |

**Other web pages this role owns, not in its menu** (2; detail, tab and action pages): `/expert/bookings/[bookingId]`, `/expert/invite/[token]`.

**Journeys — outside expert**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Bookings and their conversations | `/expert`, `/expert/bookings/[bookingId]`, `/expert/pending` | `index`, `booking` | 4 of 4 phone-called: `GET /shared/expert/bookings`; `GET /account/bookings/{bookingId}`; `POST /account/bookings/{bookingId}/messages`; `POST /account/bookings/{bookingId}/cancel` |  |
| weekly | Offer windows and workshop slots; calendar feed | `/expert/availability`, `/expert/sessions` | `availability`, `sessions` | 7 of 7 phone-called: `GET /shared/expert/availability`; `POST /shared/expert/availability`; `GET /gigs/slots`; `POST /gigs/slots`; `POST /gigs/slots/{slotId}/cancel`; `POST /gigs/sessions/{bookingId}/close`; `POST /expert/calendar/token` |  |
| weekly | Mentoring a pupil (a guardian consents) | `/mentoring`, `/mentoring/[threadId]` | `mentoring` | 3 of 3 phone-called: `GET /shared/mentoring`; `GET /shared/mentoring/{threadId}`; `POST /shared/mentoring/{threadId}/messages` |  |
| monthly | Earnings, the linked account, invoices, identity papers | `/expert/earnings`, `/expert/profile` | `profile` | 7 of 8 phone-called: `GET /expert/earnings`; `GET /expert/payout`; `POST /expert/payout`; `POST /expert/payout/link`; `GET /expert/invoices`*; `GET /expert/invoices/{invoiceId}/pdf`; `POST /expert/kyc`; `GET /expert/free-duty` | Paid seats are off until Razorpay Route is proven (decision 0004 amendments). The phone shows earnings inside Profile (screens/expert/earnings.tsx) but not the invoices list. |
| once | Join by invitation; publish a profile | `/expert/invite/[token]`, `/expert/profile` | `profile` | 2 of 2 phone-called: `GET /shared/expert/profile`; `POST /shared/expert/profile` |  |

### 4.7 · DRIVER

LIMITED role (module TRANSPORT). Runs the day's trips; the phone is the bus's GPS.

- **Web home** `/driver`; **phone home** DriverHome. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module TRANSPORT (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 45 (16 GET, 29 writes): 19 naming the role (**6 naming it alone**) and 26 signed-in; 13 behind a module, 0 flagged college. By module: ungated 32, TRANSPORT 6, PAYROLL 4, INVENTORY 3. The phone calls 37 of them (82 %).
- **Phone:** Tabs: Transport. More: 4 entries, 4 native.
- **Menu parity:** 5 both, 0 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.DRIVER`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Transport | `/driver` | — | both | tab index |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Global feed | `/bulletin/global` | — | both | chip on the Feed |

**Journeys — transport**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Run a trip: consent, start, GPS, ticks, end | `/driver` | `index` | 6 of 6 phone-called: `GET /transport/today`; `POST /transport/consent`; `POST /transport/trips/{tripId}/start`; `POST /transport/trips/{tripId}/positions`; `POST /transport/trips/{tripId}/boardings`; `POST /transport/trips/{tripId}/end` | Phone only: the trip doors (start, positions, boardings, end) have no web caller; /driver on the web reads the day (screens/driver/home.tsx and map.tsx). |
| monthly | Own leave, own days, payslip | `/account/leave`, `/account/attendance`, `/account/payslips` | `leave`, `my-attendance`, `payslips` | 4 of 4 phone-called: `GET /staff/leave`; `POST /staff/leave`; `POST /staff/attendance/check-in`; `GET /account/payslips` |  |

### 4.8 · LIBRARIAN

LIMITED role (module LIBRARY). The lending desk; at a college also e-resources and the criterion-4 table.

- **Web home** `/library`; **phone home** LibraryDesk. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module LIBRARY (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 74 (31 GET, 43 writes): 48 naming the role (**0 naming it alone**) and 26 signed-in; 39 behind a module, 9 flagged college. By module: ungated 35, LIBRARY 32, PAYROLL 4, INVENTORY 3. The phone calls 47 of them (64 %).
- **Phone:** Tabs: Library. More: 7 entries, 4 native, 3 open the web (`/library/catalogue`, `/library/fines`, `/library/reports`).
- **Menu parity:** 8 both, 3 phone opens the web, 2 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.LIBRARIAN`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Library | `/library` | — | both | tab index |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Global feed | `/bulletin/global` | — | both | chip on the Feed |
| Catalogue | `/library/catalogue` | module LIBRARY | phone opens web | opens web /library/catalogue |
| Overdue | `/library/overdue` | module LIBRARY | both | in-screen tab |
| Reservations | `/library/reservations` | module LIBRARY | both | in-screen tab |
| Fines | `/library/fines` | module LIBRARY | phone opens web | opens web /library/fines |
| Stock-take | `/library/stocktake` | module LIBRARY | both | in-screen tab |
| Reports | `/library/reports` | module LIBRARY | phone opens web | opens web /library/reports |
| The college library | `/library/college` | module ACADEMICS | web only |  |
| No-dues | `/accounts/no-dues` | module ACADEMICS | web only |  |

**Journeys — library**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | The desk: lend, return, renew, look a card up | `/library`, `/library/members/[membershipId]`, `/library/titles/[titleId]` | `index` | 4 of 6 phone-called: `POST /library/issues`; `POST /library/returns`; `POST /library/renewals`*; `GET /library/lookup`; `GET /library/members`; `GET /library/members/{membershipId}`* | Phone: LibraryDesk tabs desk, overdue, queue, stock-take (screens/library/desk.tsx). |
| daily | Overdue notices and reservations | `/library/overdue`, `/library/reservations` | `index` | 3 of 3 phone-called: `GET /library/overdue`; `POST /library/overdue/notices`; `GET /library/reservations` |  |
| termly | Catalogue: titles, copies, imports; stock-take; fines; reports | `/library/catalogue`, `/library/stocktake`, `/library/fines`, `/library/reports` | `index` | 3 of 10 phone-called: `POST /library/titles`*; `POST /library/copies`*; `POST /library/import`*; `POST /library/isbn-import`*; `GET /library/stocktake`; `POST /library/stocktake`; `POST /library/stocktake/seen`; `POST /library/fines`*; `POST /library/fines/{fineId}/waive`*; `GET /library/reports`* |  |
| termly | College: e-resources with usage, criterion-4 table, no-dues line | `/library/college`, `/accounts/no-dues` | — | 1 of 5 phone-called: `GET /library/eresources`; `POST /library/eresources`*; `GET /library/college-table`*; `GET /library/college-settings`*; `POST /accounts/no-dues/{studentMembershipId}`* |  |

### 4.9 · WARDEN

LIMITED role (module HOSTEL). Roll call, the gate, visitors; at a college the night's register, room change, expulsion proposals and the anti-ragging squad's rounds.

- **Web home** `/hostel`; **phone home** WardenHome. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module HOSTEL (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 71 (30 GET, 41 writes): 45 naming the role (**1 naming it alone**) and 26 signed-in; 36 behind a module, 7 flagged college. By module: ungated 35, HOSTEL 29, PAYROLL 4, INVENTORY 3. The phone calls 43 of them (61 %).
- **Phone:** Tabs: Hostel. More: 7 entries, 4 native, 3 open the web (`/hostel/rooms`, `/hostel/menu`, `/hostel/incidents`).
- **Menu parity:** 9 both, 3 phone opens the web, 3 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.WARDEN`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Hostel | `/hostel` | — | both | tab index |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Global feed | `/bulletin/global` | — | both | chip on the Feed |
| Roll call | `/hostel/rollcall` | module HOSTEL | both | in-screen mode |
| Leave | `/hostel/leave` | module HOSTEL | both | in-screen mode |
| Tonight | `/hostel/night` | module HOSTEL | both | in-screen mode |
| Expulsions | `/hostel/expulsions` | module HOSTEL | web only |  |
| Rooms | `/hostel/rooms` | module HOSTEL | phone opens web | opens web /hostel/rooms |
| Visitors | `/hostel/visitors` | module HOSTEL | both | in-screen mode |
| Mess menu | `/hostel/menu` | module HOSTEL | phone opens web | opens web /hostel/menu |
| Incidents | `/hostel/incidents` | module HOSTEL | phone opens web | opens web /hostel/incidents |
| Squad, rooms and numbers | `/hostel/squad` | module ACADEMICS | web only |  |
| No-dues | `/accounts/no-dues` | module ACADEMICS | web only |  |

**Journeys — hostel**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Roll call, leave, the gate, visitors (and the night's register at a college) | `/hostel/rollcall`, `/hostel/leave`, `/hostel/night`, `/hostel/visitors` | `index` | 9 of 9 phone-called: `GET /hostel/rollcall`; `POST /hostel/rollcall`; `GET /hostel/leave`; `POST /hostel/leave/{leaveId}/decide`; `POST /hostel/leave/{leaveId}/out`; `POST /hostel/leave/{leaveId}/in`; `GET /hostel/night`; `POST /hostel/visitors`; `POST /hostel/visitors/{visitorId}/out` | Phone: WardenHome modes roll, leave, night, visitors (screens/hostel/warden.tsx lines 55-58). |
| termly | Rooms, allotments, room change, mess menu, incidents | `/hostel`, `/hostel/rooms`, `/hostel/menu`, `/hostel/incidents` | — | 0 of 6 phone-called: `POST /hostel/allotments`*; `POST /hostel/rooms`*; `POST /hostel/room-change`*; `POST /hostel/menu`*; `POST /hostel/mess`*; `POST /hostel/incidents`* |  |
| college | Expulsion proposal; the squad's rounds; a boarder's health card | `/hostel/expulsions`, `/hostel/squad`, `/hostel/health/[allotmentId]` | — | 0 of 4 phone-called: `POST /hostel/expulsions`*; `POST /hostel/expulsions/{expulsionId}/withdraw`*; `POST /hostel/squad-rounds`*; `GET /hostel/boarders/{allotmentId}/health`* | The principal decides the expulsion. |

### 4.10 · ALUMNUS

LIMITED role (module ALUMNI, on by default). A former pupil or graduate: the old school's feed, the directory, mentoring and referrals at a college.

- **Web home** `/alumni`; **phone home** AlumniHome. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module ALUMNI (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 53 (20 GET, 33 writes): 20 naming the role (**10 naming it alone**) and 33 signed-in; 13 behind a module, 7 flagged college. By module: ungated 40, ALUMNI 11, IQAC 2. The phone calls 47 of them (89 %).
- **Phone:** Tabs: Alumni, Messages [ALUMNI]. More: 7 entries, 6 native, 1 open the web (`/record`).
- **Menu parity:** 8 both, 0 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.ALUMNUS`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Alumni | `/alumni` | — | both | tab index |
| Social Media | `/bulletin` | module ALUMNI | both | screen bulletin |
| Messages | `/remarks` | module ALUMNI | both | tab messages |
| Alumni directory | `/alumni/directory` | module ALUMNI | both | screen alumni-directory |
| Account | `/account` | — | both | screen account |
| Your college | `/alumni/college` | module ACADEMICS | both | screen alumni-college |
| Alumni survey | `/alumni/survey` | module IQAC | both | screen voice |
| Papers from the school | `/alumni/papers` | — | both | screen certificates |

**Journeys — alumni**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| any | Home: batch, former teachers, notes from the school | `/alumni` | `index` | 1 of 2 phone-called: `GET /alumni/home`; `GET /alumni/staff`* |  |
| any | The directory (opt-in); write to staff; share a post | `/alumni/directory`, `/alumni/staff`, `/alumni/share` | `alumni-directory`, `messages` | 4 of 5 phone-called: `GET /alumni/directory`; `PUT /alumni/directory`; `DELETE /alumni/directory`; `POST /shared/conversations`; `POST /alumni/posts`* |  |
| college | Mentor slots, referrals, meets, company, gifts | `/alumni/college` | `alumni-college` | 4 of 5 phone-called: `GET /alumni/college`; `POST /alumni/college/mentor-slots`*; `POST /alumni/college/referrals`; `POST /alumni/college/meets/{meetId}`; `POST /alumni/college/company` |  |
| yearly | The alumni survey; ask for a document | `/alumni/survey`, `/alumni/papers` | `voice`, `certificates` | 4 of 4 phone-called: `GET /voice`; `POST /voice/surveys/{surveyId}`; `POST /family/certificate-requests`; `GET /shared/certificates/{certificateId}/pdf` |  |

### 4.11 · FACULTY

LIMITED college role (module ACADEMICS). Teaches offerings; may hold duties (lab in-charge, NSS...) set by the registrar.

- **Web home** `/faculty`; **phone home** FacultyHomeScreen. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module ACADEMICS (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 114 (52 GET, 62 writes): 80 naming the role (**0 naming it alone**) and 34 signed-in; 72 behind a module, 60 flagged college; holding no duty 96, holding every duty 114 (18 duty-gated). By module: ungated 42, ACADEMICS 29, IQAC 19, LIBRARY 7, PLACEMENT 5, INVENTORY 4, PAYROLL 4, EXAMS 4. The phone calls 73 of them (64 %).
- **Phone:** Tabs: Faculty, Mentoring [ACADEMICS], Social Media, Messages. More: 15 entries, 15 native.
- **Menu parity:** 16 both, 0 phone opens the web, 5 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.FACULTY`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Faculty | `/faculty` | — | both | tab index |
| Messages | `/remarks` | — | both | tab messages |
| Social Media | `/bulletin` | — | both | tab bulletin |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Exam duties | `/faculty/exams` | module EXAMS | both | screen exam-duties |
| Students' work | `/faculty/supervision` | module PLACEMENT | web only |  |
| My research | `/faculty/research` | module IQAC | web only |  |
| My public page | `/faculty/profile` | module IQAC | web only |  |
| E-resources | `/library/e-resources` | module LIBRARY | both | screen e-resources |
| Anti-ragging register | `/duties/anti-ragging` | module IQAC, duty ANTI_RAGGING_SQUAD | both | screen anti-ragging |
| Practical record | `/faculty/practicals` | module ACADEMICS | both | screen practicals |
| Lab in-charge's desk | `/duties/lab` | module ACADEMICS, duty LAB_INCHARGE | both | screen lab-desk |
| Teaching practice | `/duties/teaching-practice` | module ACADEMICS, duty PRACTICE_TEACHING_COORDINATOR | both | screen teaching-practice |
| NSS unit | `/duties/nss` | module IQAC, duty NSS_OFFICER | both | screen nss |
| NCC unit | `/duties/ncc` | module IQAC, duty NCC_OFFICER | both | screen ncc |
| Research dean's desk | `/duties/research` | module IQAC, duty RESEARCH_DEAN | both | screen research-desk |
| Exam flying squad | `/duties/exam-squad` | module EXAMS, duty EXAM_SQUAD | both | screen exam-squad |
| Clinical coordinator | `/duties/clinical` | module ACADEMICS, duty CLINICAL_COORDINATOR | web only |  |
| Studio coordinator | `/duties/studio` | module ACADEMICS, duty STUDIO_COORDINATOR | web only |  |

**Other web pages this role owns, not in its menu** (1; detail, tab and action pages): `/iqac/surveys/[surveyId]`.

**Journeys — college teaching**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Today's lectures; mark each lecture offline | `/faculty`, `/faculty/lectures/[lectureId]` | `index`, `lecture` | 3 of 4 phone-called: `GET /academics/faculty-home`; `GET /academics/lectures`*; `GET /academics/lectures/{lectureId}`; `POST /academics/lectures/{lectureId}/attendance` | A lab lecture registers only its batch (stream-records, LabBatchMember dated). |
| daily | Own check-in, leave, payslip | `/account/attendance`, `/account/leave`, `/account/payslips` | `my-attendance`, `leave`, `payslips` | 3 of 3 phone-called: `POST /staff/attendance/check-in`; `POST /staff/leave`; `GET /account/payslips` |  |
| weekly | Course file: plan, coverage, resources, outcome map | `/faculty/offerings/[offeringId]` | `offering` | 1 of 4 phone-called: `GET /academics/offerings/{offeringId}/course-file`; `POST /academics/offerings/{offeringId}/course-file`*; `POST /academics/offerings/{offeringId}/course-file/items`*; `POST /academics/courses/{courseId}/mapping`* | Phone reads the course file; editing is the web's (POST course-file has no phone reference). |
| termly | Internal assessment: components, marks, countersign | `/faculty/offerings/[offeringId]` | `offering` | 3 of 4 phone-called: `POST /academics/offerings/{offeringId}/internal/components`*; `GET /academics/offerings/{offeringId}/internal`; `POST /academics/offerings/{offeringId}/internal/marks`; `POST /academics/internal/components/{componentId}/moderate` | The HOD releases and locks (see HOD). |
| weekly | Mentoring group notes (the flag NAAC counts) | `/faculty/mentoring` | `academics-mentoring` | 2 of 2 phone-called: `GET /academics/mentoring`; `POST /academics/mentoring/notes` |  |
| termly | Exam duties: invigilation, paper setting, remuneration | `/faculty/exams` | `exam-duties` | 1 of 2 phone-called: `GET /exam-cell/duties`; `POST /exam-cell/papers/{paperId}/submit`* |  |
| termly | Practical record: write and sign rows | `/faculty/practicals` | `practicals` | 3 of 3 phone-called: `GET /stream-records/practicals`; `POST /stream-records/practicals`; `POST /stream-records/practicals/sign` | Stream with labs only (SCIENCE, ENGINEERING, PHARMACY, HEALTH_SCIENCES, AGRICULTURE, VOCATIONAL). |
| termly | Supervise internships and projects | `/faculty/supervision` | — | 0 of 4 phone-called: `GET /placement/internships`*; `POST /placement/internships/{internshipId}/evaluate`*; `GET /placement/projects`*; `POST /placement/projects/{projectId}/review`* |  |
| yearly | Research register; surveys addressed to teachers; public profile | `/faculty/research`, `/faculty/profile`, `/public/faculty/[slug]` | `voice` | 1 of 6 phone-called: `GET /iqac/research`*; `POST /iqac/research`*; `GET /voice`; `GET /iqac/faculty-records/mine`*; `GET /faculty/profile`*; `POST /faculty/profile`* | The public page is opt-in; only the teacher publishes it. |
| any | Library e-resources; answer colleagues and students | `/library/e-resources`, `/remarks`, `/bulletin` | `e-resources`, `messages`, `bulletin` | 4 of 4 phone-called: `GET /library/eresources`; `POST /library/eresources/{resourceId}/open`; `POST /messages`; `POST /shared/bulletin` |  |

### 4.12 · HOD

LIMITED college role (module ACADEMICS). The department: load, course files, condonation, internal marks lock, NBA SAR criteria; holds every FACULTY door too; may hold duties.

- **Web home** `/hod`; **phone home** HodHomeScreen. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module ACADEMICS (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 137 (63 GET, 74 writes): 103 naming the role (**4 naming it alone**) and 34 signed-in; 92 behind a module, 83 flagged college; holding no duty 119, holding every duty 137 (18 duty-gated). By module: ungated 45, ACADEMICS 42, IQAC 24, LIBRARY 7, PLACEMENT 7, INVENTORY 4, PAYROLL 4, EXAMS 4. The phone calls 81 of them (59 %).
- **Phone:** Tabs: Department, My teaching [ACADEMICS], Social Media, Messages. More: 17 entries, 17 native.
- **Menu parity:** 17 both, 0 phone opens the web, 6 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.HOD`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Head of department | `/hod` | — | both | home tab (Department) |
| Messages | `/remarks` | — | both | tab messages |
| My teaching | `/faculty` | module ACADEMICS | both | tab teaching |
| Social Media | `/bulletin` | — | both | tab bulletin |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| No-dues | `/accounts/no-dues` | module ACADEMICS | web only |  |
| Exam duties | `/faculty/exams` | module EXAMS | both | screen exam-duties |
| Projects and internships | `/hod/projects` | module PLACEMENT | web only |  |
| Department research | `/hod/research` | module IQAC | web only |  |
| My public page | `/faculty/profile` | module IQAC | web only |  |
| E-resources | `/library/e-resources` | module LIBRARY | both | screen e-resources |
| Anti-ragging register | `/duties/anti-ragging` | module IQAC, duty ANTI_RAGGING_SQUAD | both | screen anti-ragging |
| Practical record | `/hod/practicals` | module ACADEMICS | both | screen practicals |
| Lab in-charge's desk | `/duties/lab` | module ACADEMICS, duty LAB_INCHARGE | both | screen lab-desk |
| Teaching practice | `/duties/teaching-practice` | module ACADEMICS, duty PRACTICE_TEACHING_COORDINATOR | both | screen teaching-practice |
| NSS unit | `/duties/nss` | module IQAC, duty NSS_OFFICER | both | screen nss |
| NCC unit | `/duties/ncc` | module IQAC, duty NCC_OFFICER | both | screen ncc |
| Research dean's desk | `/duties/research` | module IQAC, duty RESEARCH_DEAN | both | screen research-desk |
| Exam flying squad | `/duties/exam-squad` | module EXAMS, duty EXAM_SQUAD | both | screen exam-squad |
| Clinical coordinator | `/duties/clinical` | module ACADEMICS, duty CLINICAL_COORDINATOR | web only |  |
| Studio coordinator | `/duties/studio` | module ACADEMICS, duty STUDIO_COORDINATOR | web only |  |

**Other web pages this role owns, not in its menu** (1; detail, tab and action pages): `/iqac/surveys/[surveyId]`.

**Journeys — department**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Department home: load, ratio, defaulters, condonations | `/hod`, `/hod/defaulters`, `/hod/condonations` | `index` | 3 of 4 phone-called: `GET /academics/hod-home`; `GET /academics/attendance`*; `GET /academics/condonations`; `POST /academics/condonations/{id}/decide` | Approves above the department's floor, forwards the rest to the principal. |
| daily | Substitutions for faculty away (on the department home) | `/hod` | `lecture-substitutions` | 2 of 2 phone-called: `GET /academics/substitutions`; `POST /academics/substitutions` |  |
| termly | Allot offerings; outcomes; course-file review | `/hod`, `/faculty/offerings/[offeringId]` | `offering` | 0 of 4 phone-called: `GET /academics/offerings`*; `POST /academics/offerings`*; `POST /academics/outcomes`*; `POST /academics/offerings/{offeringId}/course-file/review`* | The offering form sits on /hod (OfferingForm). |
| termly | Release and lock internal marks | `/faculty/offerings/[offeringId]` | `offering` | 3 of 3 phone-called: `POST /academics/internal/components/{componentId}/release`; `POST /academics/offerings/{offeringId}/internal/lock`; `POST /academics/internal/components/{componentId}/moderate` | Lock freezes the totals the exam cell reads (InternalLock.totalsJson). |
| termly | Mentoring groups; projects with a guide; internships | `/faculty/mentoring`, `/hod/projects` | `academics-mentoring` | 0 of 3 phone-called: `POST /academics/mentoring/groups`*; `POST /placement/projects`*; `POST /placement/internships/{internshipId}/decide`* |  |
| yearly | Department research and activities; NBA SAR (engineering) | `/hod/research`, `/hod/nba` | — | 0 of 4 phone-called: `GET /iqac/activities`*; `POST /iqac/activities`*; `GET /iqac/council/nba`*; `POST /iqac/council/nba`* | NBA SAR: ENGINEERING streams; qualitative criteria are the HOD's, the principal signs off. |
| termly | Practicals of the department | `/hod/practicals` | `practicals` | 2 of 2 phone-called: `GET /stream-records/practicals`; `POST /stream-records/practicals/sign` |  |
| any | Own teaching (as FACULTY) and duties | `/faculty`, `/duties/lab`, `/duties/research` | `teaching` | 2 of 2 phone-called: `GET /academics/faculty-home`; `GET /duties/research` | HOD holds every FACULTY door plus its own (HOD total 137 against FACULTY 114). |

### 4.13 · EXAM_CONTROLLER

LIMITED college role (module EXAMS). The exam cell, at /exam-cell (not /exams, which is the school's marks page).

- **Web home** `/exam-cell`; **phone home** ExamCellHome (queue; work opens the web). **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module EXAMS (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 93 (33 GET, 60 writes): 62 naming the role (**31 naming it alone**) and 31 signed-in; 56 behind a module, 49 flagged college. By module: EXAMS 48, ungated 37, PAYROLL 4, INVENTORY 3, ACADEMICS 1. The phone calls 43 of them (46 %).
- **Phone:** Tabs: Exam cell, Social Media. More: 5 entries, 5 native.
- **Menu parity:** 6 both, 0 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.EXAM_CONTROLLER`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Exam controller | `/exam-cell` | — | both | home tab (Exam cell) |
| Social Media | `/bulletin` | — | both | tab bulletin |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Exam flying squad | `/duties/exam-squad` | module EXAMS | both | screen exam-squad |

**Journeys — exam cell**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| termly | Open a session; generate forms (eligibility, no-dues); approve | `/exam-cell`, `/exam-cell/sessions/[sessionId]` | `index` | 1 of 5 phone-called: `GET /exam-cell`; `POST /exam-cell/sessions`*; `POST /exam-cell/sessions/{sessionId}/forms`*; `POST /exam-cell/forms/{formId}/decide`*; `POST /exam-cell/sessions/{sessionId}/status`* | Phone home shows sessions and grace waiting; the work opens on the web. |
| termly | Logistics: date sheet, halls, seating, hall tickets, invigilation, malpractice | `/exam-cell/sessions/[sessionId]/logistics`, `/exam-cell/sessions/[sessionId]/seating/[scheduleId]` | — | 0 of 7 phone-called: `POST /exam-cell/sessions/{sessionId}/schedule`*; `POST /exam-cell/sessions/{sessionId}/rooms`*; `POST /exam-cell/sessions/{sessionId}/seating`*; `POST /exam-cell/sessions/{sessionId}/hall-tickets`*; `POST /exam-cell/sessions/{sessionId}/invigilation`*; `POST /exam-cell/sessions/{sessionId}/malpractice`*; `GET /exam-cell/rooms/{examRoomId}/sheet`* |  |
| termly | Autonomous conduct: papers, seal, moderate, print, assess | `/exam-cell/sessions/[sessionId]/conduct` | — | 0 of 6 phone-called: `POST /exam-cell/sessions/{sessionId}/papers`*; `GET /exam-cell/papers/{paperId}/open`*; `POST /exam-cell/papers/{paperId}/moderate`*; `POST /exam-cell/sessions/{sessionId}/printing`*; `POST /exam-cell/sessions/{sessionId}/assessment`*; `POST /exam-cell/assessment/{allocationId}/return`* | AUTONOMOUS_COLLEGE only; a 403 at an affiliated college. |
| termly | Marks: double entry or the university's file; grace; results run and publish | `/exam-cell/sessions/[sessionId]/marks`, `/exam-cell/sessions/[sessionId]/results`, `/exam-cell/sessions/[sessionId]/export` | — | 0 of 6 phone-called: `POST /exam-cell/sessions/{sessionId}/marks`*; `POST /exam-cell/sessions/{sessionId}/marks/import`*; `POST /exam-cell/sessions/{sessionId}/grace`*; `POST /exam-cell/sessions/{sessionId}/results/run`*; `POST /exam-cell/sessions/{sessionId}/results/publish`*; `POST /exam-cell/sessions/{sessionId}/marks/correct`* | The principal approves grace (POST /exam-cell/grace/{graceId}/decide). |
| termly | After results: revaluation, backlogs, documents, credits, convocation | `/exam-cell/after`, `/exam-cell/analytics` | — | 0 of 5 phone-called: `POST /exam-cell/revaluations/{revaluationId}/decide`*; `POST /exam-cell/documents`*; `POST /exam-cell/credits/push`*; `POST /exam-cell/convocation`*; `GET /exam-cell/analytics`* | Credits push is a stub transport (docs/college.md Untested). |

### 4.14 · IQAC

LIMITED college role (module IQAC). The accreditation desk: NAAC predictor, filings, surveys, registers, grievances.

- **Web home** `/iqac`; **phone home** IqacHome. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module IQAC (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 94 (44 GET, 50 writes): 63 naming the role (**2 naming it alone**) and 31 signed-in; 56 behind a module, 50 flagged college. By module: IQAC 41, ungated 38, PAYROLL 4, LIBRARY 4, INVENTORY 3, PLACEMENT 2, HOSTEL 2. The phone calls 41 of them (44 %).
- **Phone:** Tabs: IQAC coordinator, Social Media. More: 11 entries, 4 native, 7 open the web (`/iqac/predictor`, `/iqac/documents`, `/iqac/surveys`, `/iqac/registers`, `/iqac/grievances`, `/admin/faculty-records`, `/placement/analytics`).
- **Menu parity:** 5 both, 7 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.IQAC`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| IQAC coordinator | `/iqac` | — | both | tab index |
| Social Media | `/bulletin` | — | both | tab bulletin |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Placement table | `/placement/analytics` | module PLACEMENT | phone opens web | opens web /placement/analytics |
| NAAC predictor | `/iqac/predictor` | module IQAC | phone opens web | opens web /iqac/predictor |
| Filings | `/iqac/documents` | module IQAC | phone opens web | opens web /iqac/documents |
| Surveys | `/iqac/surveys` | module IQAC | phone opens web | opens web /iqac/surveys |
| Research and activities | `/iqac/registers` | module IQAC | phone opens web | opens web /iqac/registers |
| Grievances | `/iqac/grievances` | module IQAC | phone opens web | opens web /iqac/grievances |
| Faculty records | `/admin/faculty-records` | module IQAC | phone opens web | opens web /admin/faculty-records |

**Journeys — accreditation desk (the insights engine and simulator being added under IQAC are in progress, see insights)**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| weekly | Grievances inside the UGC time limit | `/iqac/grievances` | — | 0 of 2 phone-called: `GET /iqac/grievances`*; `POST /iqac/grievances/{grievanceId}`* | The IQAC reads; the office and the head acknowledge or resolve (door AD,PR). |
| termly | Surveys (SSS, course feedback, exit, alumni, employer, parent) and the action-taken report | `/iqac/surveys`, `/iqac/surveys/[surveyId]` | — | 0 of 6 phone-called: `POST /iqac/surveys`*; `GET /iqac/surveys/{surveyId}`*; `POST /iqac/surveys/{surveyId}/atr`*; `POST /iqac/surveys/{surveyId}/close`*; `POST /iqac/surveys/{surveyId}/links`*; `POST /iqac/surveys/{surveyId}/transcribe`* |  |
| termly | Registers: research, activities, committees, FDPs | `/iqac/registers`, `/admin/faculty-records` | — | 0 of 5 phone-called: `GET /iqac/research`*; `GET /iqac/activities`*; `POST /iqac/activities`*; `GET /iqac/committees`*; `GET /iqac/faculty-records`* |  |
| yearly | The NAAC predictor: cycle, compute, score qualitative metrics with evidence | `/iqac`, `/iqac/predictor` | `index` | 1 of 7 phone-called: `GET /iqac/overview`; `POST /iqac/cycles`*; `GET /iqac/cycles/{cycleId}`*; `POST /iqac/cycles/{cycleId}/compute`*; `POST /iqac/cycles/{cycleId}/inputs`*; `POST /iqac/cycles/{cycleId}/metrics/{metricCode}`*; `POST /iqac/evidence`* | The insights engine and simulator under IQAC are in progress, see insights (not mapped here). |
| yearly | Filings: SSR, AQAR, IIQA, NIRF, AISHE, AICTE, the councils' returns | `/iqac/documents`, `/iqac/documents/[kind]`, `/principal/accreditation` | `filings` | 0 of 10 phone-called: `GET /iqac/council`*; `POST /iqac/filings`*; `POST /iqac/filings/{filingId}/submit`*; `POST /iqac/filings/{filingId}/filed`*; `GET /iqac/filings/{filingId}/file`*; `POST /iqac/disclosure`*; `GET /iqac/council/nba`*; `POST /iqac/council/bci`*; `POST /iqac/council/ncte`*; `GET /iqac/council/pci`* | The principal signs off a NAAC document (POST /iqac/filings/{filingId}/signoff). |

### 4.15 · TPO

LIMITED college role (module PLACEMENT). The placement cell: drives on computed eligibility, companies, internships, the three-year table.

- **Web home** `/placement`; **phone home** TpoHome. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); own module PLACEMENT (while it is off the role keeps only its home, notices and its own account doors).
- **Doors:** 72 (30 GET, 42 writes): 41 naming the role (**10 naming it alone**) and 31 signed-in; 35 behind a module, 28 flagged college. By module: ungated 37, PLACEMENT 27, PAYROLL 4, INVENTORY 3, ALUMNI 1. The phone calls 40 of them (56 %).
- **Phone:** Tabs: Placement, Social Media. More: 9 entries, 4 native, 5 open the web (`/placement/drives`, `/placement/students`, `/placement/companies`, `/placement/internships`, `/placement/analytics`).
- **Menu parity:** 5 both, 5 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.TPO`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Training and placement officer | `/placement` | — | both | home tab (Placement) |
| Social Media | `/bulletin` | — | both | tab bulletin |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Drives | `/placement/drives` | module PLACEMENT | phone opens web | opens web /placement/drives |
| Students | `/placement/students` | module PLACEMENT | phone opens web | opens web /placement/students |
| Companies | `/placement/companies` | module PLACEMENT | phone opens web | opens web /placement/companies |
| Internships | `/placement/internships` | module PLACEMENT | phone opens web | opens web /placement/internships |
| Placement table | `/placement/analytics` | module PLACEMENT | phone opens web | opens web /placement/analytics |

**Journeys — placement**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Open a drive on computed eligibility; invite; remind | `/placement/drives`, `/placement/drives/new`, `/placement/drives/[driveId]` | `index`, `placement-drive` | 0 of 5 phone-called: `POST /placement/drives`*; `GET /placement/drives/{driveId}/eligibility`*; `POST /placement/drives/{driveId}`*; `POST /placement/drives/{driveId}/invite`*; `POST /placement/drives/{driveId}/remind`* | Phone: TpoHome and one drive with its rounds (S3 fix). |
| daily | Round results, offers, joining | `/placement/drives/[driveId]` | `placement-drive` | 1 of 3 phone-called: `POST /placement/drives/{driveId}/results`; `POST /placement/drives/{driveId}/offers`*; `POST /placement/offers/{offerId}/joined`* | One round at a time; no sheet upload (4 Oct gaps). |
| termly | Companies, verification, recruiters' requirements | `/placement/companies` | — | 0 of 5 phone-called: `GET /placement/companies`*; `POST /placement/companies`*; `POST /placement/companies/{companyId}/verify`*; `GET /placement/requirements`*; `POST /placement/requirements/{requirementId}/accept`* |  |
| termly | Students: profiles, dream flag; internships and credits | `/placement/students`, `/placement/internships` | — | 0 of 5 phone-called: `GET /placement/students`*; `POST /placement/students/{membershipId}/dream`*; `GET /placement/internships`*; `POST /placement/internships/{internshipId}/decide`*; `POST /placement/internships/{internshipId}/evaluate`* |  |
| yearly | Season table for NBA, NIRF, NAAC; publish; export | `/placement/analytics` | — | 0 of 5 phone-called: `GET /placement/analytics`*; `POST /placement/season`*; `GET /placement/analytics/export`*; `GET /placement/settings`*; `POST /placement/settings`* |  |

### 4.16 · ACCOUNTS

LIMITED college role (no module of its own). Fee structures by category, demands, concessions, scholarships, no-dues; keeps the office's ledger, payroll and stores with the registrar.

- **Web home** `/accounts`; **phone home** AccountsHomeScreen. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`).
- **Doors:** 143 (63 GET, 80 writes): 112 naming the role (**0 naming it alone**) and 31 signed-in; 56 behind a module, 25 flagged college. By module: ungated 87, INVENTORY 24, PAYROLL 21, SCHOLARSHIPS 5, ADMISSIONS 4, HOSTEL 1, TRANSPORT 1. The phone calls 57 of them (40 %).
- **Phone:** Tabs: Accounts, Social Media. More: 13 entries, 5 native, 8 open the web (`/accounts/structures`, `/accounts/scholarships`, `/accounts/no-dues`, `/accounts/concessions`, `/accounts/students`, `/admin/fees`, `/admin/payroll`, `/admin/inventory`).
- **Menu parity:** 5 both, 8 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.ACCOUNTS`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Accounts | `/accounts` | — | both | tab index |
| Social Media | `/bulletin` | — | both | tab bulletin |
| Account | `/account` | — | both | screen account |
| Leave | `/account/leave` | — | both | screen leave |
| Staff attendance | `/account/attendance` | — | both | screen my-attendance |
| Fee structures | `/accounts/structures` | — | phone opens web | opens web /accounts/structures |
| Scholarships | `/accounts/scholarships` | module SCHOLARSHIPS | phone opens web | opens web /accounts/scholarships |
| No-dues | `/accounts/no-dues` | — | phone opens web | opens web /accounts/no-dues |
| Concessions | `/accounts/concessions` | — | phone opens web | opens web /accounts/concessions |
| A student's account | `/accounts/students` | — | phone opens web | opens web /accounts/students |
| Fee ledger | `/admin/fees` | — | phone opens web | opens web /admin/fees |
| HR and payroll | `/admin/payroll` | module PAYROLL | phone opens web | opens web /admin/payroll |
| Inventory and assets | `/admin/inventory` | module INVENTORY | phone opens web | opens web /admin/inventory |

**Journeys — college accounts**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Counter receipts, bank import, claims (the office ledger) | `/admin/fees`, `/accounts/students` | `index`, `accounts-lookup` | 5 of 5 phone-called: `GET /accounts/lookup`; `GET /accounts/ledger/{studentMembershipId}`; `POST /fees/payments`; `POST /fees/bank-import/commit`; `GET /accounts/overview` | Web: only the /admin/fees overview opens for ACCOUNTS; its sub-pages answer ADMIN or PRINCIPAL (see gap I-1). Phone: read-only look-up. |
| termly | Fee structures by programme, year and category; demands; concessions | `/accounts/structures`, `/accounts/concessions` | — | 0 of 5 phone-called: `GET /accounts/fee-structures`*; `POST /accounts/fee-structures`*; `POST /accounts/demands/raise`*; `POST /accounts/concessions`*; `GET /accounts/settings`* | Above the office's limit a concession waits for the principal. |
| termly | Scholarship claims, receivable, reconciliation sheet | `/accounts/scholarships` | — | 0 of 4 phone-called: `GET /college/scholarships/claims`*; `POST /college/scholarships/claims`*; `POST /college/scholarships/claims/{claimId}`*; `GET /college/scholarships/reconciliation`* | SCHOLARSHIPS module. |
| termly | No-dues clearances (exam form, hostel exit, leaving) | `/accounts/no-dues` | — | 1 of 3 phone-called: `GET /accounts/no-dues`*; `GET /accounts/no-dues/{studentMembershipId}`; `POST /accounts/no-dues/{studentMembershipId}`* |  |
| monthly | Payroll run and statutory files; stores | `/admin/payroll`, `/admin/inventory` | — | 0 of 4 phone-called: `POST /admin/payroll/runs`*; `POST /admin/payroll/runs/{month}/lock`*; `GET /admin/payroll/runs/{month}/export/{kind}`*; `POST /admin/inventory/movements`* | Doors name ACCOUNTS; the web payroll pages set canEdit = ADMIN only (payroll/shared.tsx:18): see gap I-2. |
| yearly | Auditor's schedules and the finance table | `/accounts/export/[report]`, `/accounts` | — | 0 of 2 phone-called: `GET /accounts/reports`*; `GET /accounts/finance-table`* | CSV through /accounts/export/[report] (web route, outside the catalog). |
| termly | Admission fee and refunds on a cancelled seat | `/admin/college-admissions/[applicationId]`, `/admin/college-admissions/refunds` | — | 0 of 3 phone-called: `POST /college/admissions/applications/{applicationId}/fee`*; `POST /college/admissions/applications/{applicationId}/refund`*; `GET /college/admissions/refund-exceptions`* | Doors name ACCOUNTS; the two pages require ADMIN or PRINCIPAL (gap I-3). |

### 4.17 · RECRUITER

LIMITED outside account (no school, like EXPERT). Reaches a college only through a live drive the TPO opened.

- **Web home** `/recruiter`; **phone home** RecruiterPlacementHome. **Gate:** limited role: passes only doors that name it and pages its NAV lists (default-deny, `role-gate.ts`); no school; reaches a college only through a drive.
- **Doors:** 43 (15 GET, 28 writes): 17 naming the role (**14 naming it alone**) and 26 signed-in; 3 behind a module, 16 flagged college. By module: ungated 40, PLACEMENT 3. The phone calls 29 of them (67 %).
- **Phone:** Tabs: Recruiter. More: 1 entries, 1 native.
- **Menu parity:** 2 both, 0 phone opens the web, 0 web only; no phone-only entries.

**Web menu** (`apps/web/src/lib/nav.ts`, `NAV.RECRUITER`):

| Entry | Path | Gate | Parity | Phone |
| --- | --- | --- | --- | --- |
| Recruiter | `/recruiter` | — | both | tab index |
| Account | `/account` | — | both | screen account |

**Journeys — recruiter**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| once | Register the company by GSTIN or CIN; invite colleagues | `/register/recruiter`, `/recruiter` | `index` | 2 of 4 phone-called: `POST /auth/recruiter/register`; `POST /recruiter/company`; `POST /recruiter/company/colleagues`*; `POST /recruiter/company/invitations/{companyId}`* | An outside account: no school, reaches a college only through a live drive. |
| per drive | Post a requirement to colleges; see eligible counts | `/recruiter` | `index` | 1 of 4 phone-called: `GET /recruiter/colleges`*; `POST /recruiter/requirements`*; `GET /recruiter/requirements`*; `GET /recruiter/drives` |  |
| per drive | Consented applicants, watermarked resumes, round results, offers, feedback | `/recruiter/drives/[driveId]` | `recruiter-drive` | 2 of 6 phone-called: `GET /recruiter/drives/{driveId}`; `GET /recruiter/drives/{driveId}/resume/{membershipId}`*; `GET /recruiter/drives/{driveId}/export`*; `POST /placement/drives/{driveId}/results`; `POST /placement/drives/{driveId}/offers`*; `POST /recruiter/drives/{driveId}/feedback`* |  |

### 4.18 · OPERATOR — the server's superuser (`User.isSuperuser`)

Not a membership: signs in as a person with `isSuperuser`; `requireSuperuser` redirects anyone else. Runs the platform: tenants (schools and colleges), plans, partners, subscriptions, modules on a tenant's behalf, job health, the regulators' calendar, recruiters and experts across tenants. Looks inside a school only audited, and the school is told (`/root/[schoolId]/inside`).

- **Doors:** 52 (19 GET, 33 writes), all its own (access `operator`: every school role answers 403 and the sweep expects it). The phone calls 32.
- **Web pages (17):** `/root`, `/root/[schoolId]`, `/root/[schoolId]/inside`, `/root/audit`, `/root/colleges`, `/root/colleges/calendar`, `/root/colleges/recruiters`, `/root/content-team`, `/root/experts`, `/root/gigs`, `/root/jobs`, `/root/jobs/schools`, `/root/metrics`, `/root/new`, `/root/onboard`, `/root/partners`, `/root/plans`.
- **Phone:** the console stack: `operator`, `operator-school`, `operator-new-school`, `operator-metrics`, `operator-payouts` and the home (`screens/operator/home.tsx`); plans, partners, colleges, recruiters, the regulators' calendar, onboarding and the retention and usage reads are web only.

**Journeys — operator**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Job health, metrics, the audit log | `/root`, `/root/jobs`, `/root/jobs/schools`, `/root/metrics`, `/root/audit` | `operator`, `operator-metrics` | 4 of 4 phone-called: `GET /operator/overview`; `GET /operator/metrics`; `GET /operator/audit`; `GET /operator/dashboard` |  |
| weekly | Onboard and verify schools and colleges; look inside; support | `/root/new`, `/root/onboard`, `/root/[schoolId]`, `/root/[schoolId]/inside` | `operator-school`, `operator-new-school` | 4 of 6 phone-called: `POST /operator/schools`; `POST /operator/onboard`*; `POST /operator/schools/{schoolId}/verification`; `POST /operator/schools/{schoolId}/modules`*; `POST /operator/schools/{schoolId}/support/sign-in-link`; `POST /operator/schools/{schoolId}/subscription` |  |
| weekly | Colleges, regulators' calendar, recruiters | `/root/colleges`, `/root/colleges/calendar`, `/root/colleges/recruiters` | — | 0 of 4 phone-called: `GET /operator/colleges`*; `GET /operator/colleges/calendar`*; `GET /operator/recruiters`*; `POST /operator/recruiters/{userId}/standing`* |  |
| monthly | Plans, partners, subscriptions, expert payouts and invoices | `/root/plans`, `/root/partners`, `/root/gigs`, `/root/experts`, `/root/content-team` | `operator-payouts` | 5 of 6 phone-called: `GET /operator/plans`; `GET /operator/partners`; `GET /operator/gigs`*; `POST /operator/gigs/payouts/switch`; `GET /operator/experts`; `POST /operator/content-team` |  |

### 4.19 · APPADMIN — the content team (`User.isAppAdmin`)

Not a membership. The operator is also a content-team member. Curates the practice question bank, reads teachers' contributed questions, reviews Hindi and Marathi, moderates the global feed, posts platform competitions.

- **Doors:** 20 (11 GET, 9 writes), all its own (access `app-admin`: every school role answers 403 and the sweep expects it). The phone calls 16.
- **Web pages (11):** `/appadmin`, `/appadmin/bank`, `/appadmin/bank/[topicId]`, `/appadmin/bank/[topicId]/[questionId]`, `/appadmin/bank/[topicId]/new`, `/appadmin/bank/duplicates`, `/appadmin/contributions`, `/appadmin/contributions/[contributionId]`, `/appadmin/moderation`, `/appadmin/new`, `/appadmin/translations`.
- **Phone:** the console stack: `appadmin`, `question-bank`, `contribution-queue`, `moderation`; translation review is web only.

**Journeys — appadmin**

| When | Journey | Web pages | Phone screens | Doors (`/api/v1` omitted; * = no phone caller found) | Note |
| --- | --- | --- | --- | --- | --- |
| daily | Teachers' questions to read and add | `/appadmin/contributions`, `/appadmin/contributions/[contributionId]` | `contribution-queue` | 2 of 2 phone-called: `GET /appadmin/contributions`; `POST /appadmin/contributions/{contributionId}/decide` |  |
| daily | Global feed take-downs and restores | `/appadmin/moderation` | `moderation` | 3 of 3 phone-called: `GET /appadmin/moderation`; `POST /appadmin/moderation/{postId}/takedown`; `POST /appadmin/moderation/{postId}/restore` |  |
| weekly | The question bank; duplicates; translation review | `/appadmin/bank`, `/appadmin/bank/[topicId]`, `/appadmin/bank/duplicates`, `/appadmin/translations` | `question-bank` | 2 of 4 phone-called: `GET /appadmin/bank`; `POST /appadmin/bank/import`*; `GET /appadmin/bank/duplicates`; `POST /appadmin/translations/{questionId}/review`* | Translation review is web only (the two doors have no phone caller). |
| weekly | Platform competitions | `/appadmin/new` | — | 2 of 2 phone-called: `POST /appadmin/competitions/drafts`; `POST /appadmin/competitions/{competitionId}/status` |  |

## 5 · The nine duties (a second job on a FACULTY or HOD membership)

Set by the registrar from the row menu of `/admin/people` (`POST /admin/people/{membershipId}/duties`, audited `people.duties.set`), offered only where a stream of the college offers them (`DUTY_STREAMS`). A catalog door may carry `duties:`; the gate checks it after the role (403 `duties.refuseNoDuty`); a NAV entry or phone entry with `duty` is hidden from a member without it. Without any duty FACULTY passes 96 doors and HOD 119; holding all nine, 114 and 137 (the difference is the 18 duty doors).

| Duty | Web desk | Phone screen | Doors (phone-called) | Offered by streams | What it holds |
| --- | --- | --- | --- | --- | --- |
| LAB_INCHARGE | `/duties/lab` | `lab-desk` | 3 of 4: `GET /duties/lab`; `POST /duties/lab/breakage`*; `GET /stream-records/practicals`; `POST /stream-records/practicals/sign` | SCIENCE, ENGINEERING, PHARMACY, HEALTH_SCIENCES, AGRICULTURE, VOCATIONAL | Labs (rooms of kind LAB) with stock and assets (INVENTORY), batch rosters, practicals to sign, breakage as a WRITE_OFF at the lab through the inventory's one writer. |
| ANTI_RAGGING_SQUAD | `/duties/anti-ragging` | `anti-ragging` | 1 of 3: `GET /duties/anti-ragging`; `GET /hostel/squad-rounds`*; `POST /hostel/squad-rounds`* | every stream | Rounds, complaints' state and due day; never their words or author. |
| NSS_OFFICER | `/duties/nss` | `nss` | 2 of 4: `GET /duties/nss`; `POST /duties/nss/enrolments`*; `POST /duties/nss/leave`*; `POST /duties/nss/activities` | every stream but HEALTH_SCIENCES | Enrolment, leaving, activities as IQAC Activity rows with hours and a camp flag. |
| NCC_OFFICER | `/duties/ncc` | `ncc` | 2 of 4: `GET /duties/ncc`; `POST /duties/ncc/enrolments`*; `POST /duties/ncc/leave`*; `POST /duties/ncc/activities` | every stream but HEALTH_SCIENCES | As NSS. |
| RESEARCH_DEAN | `/duties/research` | `research-desk` | 1 of 2: `GET /duties/research`; `GET /iqac/research`* | every stream | Read-only: the whole research register and each teacher's score inputs; the office writes the faculty record. |
| EXAM_SQUAD | `/duties/exam-squad` | `exam-squad` | 2 of 2: `GET /duties/exam-squad`; `POST /duties/exam-squad/visits` | every stream | Papers two days back to sixty ahead; a visit that found something tells the exam controllers; a case's state, never its note. |
| PRACTICE_TEACHING_COORDINATOR | `/duties/teaching-practice` | `teaching-practice` | 2 of 4: `GET /duties/teaching-practice`; `POST /duties/teaching-practice/schools`*; `POST /duties/teaching-practice/postings`*; `POST /duties/teaching-practice/postings/{postingId}/observations` | EDUCATION | Practice schools, postings, lesson observations (the NCTE's twenty weeks). |
| CLINICAL_COORDINATOR | `/duties/clinical` | — | 0 of 0: none | HEALTH_SCIENCES, PHARMACY | A page with the preset's not-built sentence; no door. |
| STUDIO_COORDINATOR | `/duties/studio` | — | 0 of 0: none | ARCHITECTURE | A page with the preset's not-built sentence; no door. |

Fixtures: ZZ Vidya's `zz.faculty01` holds every duty Vidya offers (so the sweep's FACULTY opens the desks); `zz.hod01` holds none and is refused a desk (403); ZZ Shastri's `zz.faculty.s1` holds LAB_INCHARGE; the demo college's `sit.faculty1..4` and `sit.hod.comp` hold LAB_INCHARGE, ANTI_RAGGING_SQUAD, NSS_OFFICER, EXAM_SQUAD, RESEARCH_DEAN (docs/college.md Fixtures; docs/demo-schools.md). The practical record (`/faculty/practicals`, `/hod/practicals`) is not a duty: it belongs to the offering's teacher or its HOD, and a lab in-charge may sign (`POST /stream-records/practicals/sign`).

## 6 · Journeys that cross roles

The platform's value, by the plan, is that nothing is re-keyed at a hand-off. Each journey below is one chain; each step names its role, page, phone screen and doors (validated against the tree like the per-role journeys), and the stored value or audit check that the step feeds when there is one (`docs/college.md`, Stored derived values).

### 6.1 · The college year, role to role

*Source: tests/college-year.test.ts; docs/college.md, The year, role to role.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ADMIN | Admit from the CET round: import the list, scrutinise, undertakings, offer, admit (one transaction: user, membership, PupilRecord with PRN, enrolment, seat, fee plan) | `/admin/college-admissions`, `/admin/college-admissions/[applicationId]` | — | 0 of 3: `POST /college/admissions/rounds/{roundId}/import`*; `POST /college/admissions/applications/{applicationId}/offer`*; `POST /college/admissions/applications/{applicationId}/admit`* | PupilRecord.prn, ProgrammeEnrolment, StudentProgramme, fee plan |
| 2 | ADMIN | Seat the student in a division; open the registration window | `/admin/academics/students`, `/admin/academics/terms` | — | 0 of 2: `POST /academics/students`*; `POST /academics/terms`* | StudentProgramme.prn is a copy (audit college-prn) |
| 3 | STUDENT | Register on the term's offerings inside the window and the scheme's credits | `/student/registration` | `registration` | 2 of 2: `GET /academics/registration`; `POST /academics/registration` | Registration rows |
| 4 | FACULTY | Mark each lecture (offline outbox on the phone) | `/faculty/lectures/[lectureId]` | `lecture` | 1 of 1: `POST /academics/lectures/{lectureId}/attendance` | Attendance is computed on read; nothing stored (eligibility reads it) |
| 5 | HOD | Countersign, release and lock the internal marks | `/faculty/offerings/[offeringId]` | `offering` | 3 of 3: `POST /academics/internal/components/{componentId}/moderate`; `POST /academics/internal/components/{componentId}/release`; `POST /academics/offerings/{offeringId}/internal/lock` | InternalLock.totalsJson (audit academics-internal-lock) |
| 6 | EXAM_CONTROLLER | Generate the form from registration; eligibility and no-dues checked; approve; hall ticket | `/exam-cell/sessions/[sessionId]` | — | 0 of 3: `POST /exam-cell/sessions/{sessionId}/forms`*; `POST /exam-cell/forms/{formId}/decide`*; `POST /exam-cell/sessions/{sessionId}/hall-tickets`* | Exam forms; fee as a demand |
| 7 | STUDENT | Submit the form; download the hall ticket | `/student/exams` | `college-exams` | 2 of 2: `POST /exam-cell/forms/{formId}/submit`; `GET /exam-cell/hall-tickets/{ticketId}/pdf` | — |
| 8 | EXAM_CONTROLLER | Import the university file or double-entry marks; run and publish results (SGPA, CGPA, ATKT, backlogs) | `/exam-cell/sessions/[sessionId]/marks`, `/exam-cell/sessions/[sessionId]/results` | — | 0 of 3: `POST /exam-cell/sessions/{sessionId}/marks/import`*; `POST /exam-cell/sessions/{sessionId}/results/run`*; `POST /exam-cell/sessions/{sessionId}/results/publish`* | TermResult.sgpaHundredths (audit exam-sgpa) |
| 9 | TPO | Placement record reads the published CGPA; drive eligibility is computed | `/placement/students`, `/placement/drives/[driveId]` | `placement-drive` | 0 of 2: `GET /placement/students`*; `GET /placement/drives/{driveId}/eligibility`* | PlacementSeason (audit placement-season) |
| 10 | IQAC | Facts count the pass; the predictor recomputes | `/iqac/predictor` | — | 0 of 1: `POST /iqac/cycles/{cycleId}/compute`* | AccreditationCycle.cgpa (audit iqac-cgpa) |
| 11 | ADMIN | Record the graduation: no-dues LEAVING, departure, TC record; the alumnus row opens | `/accounts/no-dues`, `/admin/people` | — | 0 of 1: `POST /accounts/leaving/{studentMembershipId}`* | Membership ALUMNUS |
| 12 | ALUMNUS | Read a global post once; join the directory; mentor | `/alumni`, `/alumni/directory`, `/alumni/college` | `index`, `alumni-college` | 2 of 3: `GET /alumni/home`; `PUT /alumni/directory`; `POST /alumni/college/mentor-slots`* | — |

### 6.2 · The school year (a school, any board)

*Source: docs/demo-schools.md workflow table; HANDOFF.md section 1.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ADMIN | Invite staff, intake pupils by sheet, make classes, put the timetable on the grid | `/admin/invites`, `/admin/intake`, `/admin/classes`, `/admin/timetable` | `invites`, `intake`, `classes`, `timetable-editor` | 4 of 4: `POST /admin/people/invites`; `POST /admin/people/intake`; `POST /admin/classes`; `POST /office/timetable/import` | Membership, Class, TimetableSlot |
| 2 | TEACHER | Mark the register each day; set and grade work; log lessons | `/teacher/attendance`, `/teacher/assignments`, `/teacher/classes/[classId]/syllabus` | `attendance`, `assignments`, `syllabus` | 3 of 4: `GET /staff/attendance/register`; `POST /staff/assignments`*; `POST /teaching/assignments/{assignmentId}/grades`; `POST /staff/lessons` | Attendance (computed on read), Assignment grades |
| 3 | ADMIN | Schedule an exam series; teachers enter marks | `/admin/exams`, `/teacher/exams` | `exams`, `marks` | 2 of 2: `POST /admin/exams`; `POST /marks` | ExamSeries, marks |
| 4 | TEACHER | Build, remark, publish the class's report cards (rules are the office's) | `/teacher/classes/[classId]/report-cards` | `report-cards` | 2 of 2: `POST /teaching/classes/{classId}/report-cards/generate`; `POST /teaching/classes/{classId}/report-cards/publish` | ReportCard (frozen rules per card) |
| 5 | PARENT | Read cards, pay fees, ask for a certificate | `/exams`, `/parent/fees`, `/parent/certificates` | `exams`, `fees`, `certificates` | 3 of 3: `GET /family/report-cards`; `POST /fees/family/checkout`; `POST /family/certificate-requests` | FeePayment, CertificateRequest |
| 6 | ADMIN | Close the year, promote, archive classes | `/admin/promotion`, `/admin/calendar`, `/admin/classes` | `classes` | 1 of 2: `GET /admin/classes/promotion`*; `POST /admin/classes/{classId}/archive` | AcademicYear closed; the promotion write has no door (web action) |

### 6.3 · A family finds a school and the child is admitted

*Source: docs/demo-schools.md, Admissions.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PARENT | Explore, enquire, apply to the open cycle; documents; book a sitting | `/explore`, `/explore/[schoolId]/apply`, `/parent/applications/[applicationId]` | `explore`, `apply`, `my-application` | 2 of 4: `GET /family/explore`; `POST /family/applications`; `POST /family/applications/{applicationId}/documents`*; `POST /family/applications/{applicationId}/book`* | Application |
| 2 | ADMIN | Verify documents, record the test, offer with a date and a fee structure | `/admin/admissions/applications/[applicationId]` | `application` | 0 of 3: `POST /office/admissions/applications/{applicationId}/verify`*; `POST /office/admissions/applications/{applicationId}/test`*; `POST /office/admissions/applications/{applicationId}/offer`* | — |
| 3 | PARENT | Accept the offer | `/parent/applications/[applicationId]` | `my-application` | 0 of 1: `POST /family/applications/{applicationId}/respond`* | — |
| 4 | ADMIN | Admit: pupil account, membership, enrolment, applicant as guardian, record, fee plan | `/admin/admissions/applications/[applicationId]` | `application` | 0 of 1: `POST /office/admissions/applications/{applicationId}/admit`* | Guardianship, PupilRecord, FeePlan |

### 6.4 · The fee cycle at a school (money never touches the platform, decision 0003)

*Source: docs/decisions/0003; docs/demo-schools.md, Fees.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | ADMIN | Heads, structure (draft, publish), plan the class, concessions | `/admin/fees/heads`, `/admin/fees/structures/new`, `/admin/fees/structures/[structureId]` | — | 0 of 5: `POST /fees/heads`*; `POST /fees/structures`*; `POST /fees/structures/{structureId}/publish`*; `POST /fees/plans`*; `POST /fees/concessions`* | FeeStructure frozen at publish |
| 2 | PARENT | Pay at the school's own gateway, or by UPI and claim with the UTR | `/parent/fees` | `fees` | 3 of 3: `POST /fees/family/checkout`; `POST /fees/family/upi`; `POST /fees/family/upi/claim` | FeePayment |
| 3 | ADMIN | Confirm the claim against the bank statement; counter receipts; reverse or refund | `/admin/fees/claims`, `/admin/fees/pupils/[studentMembershipId]` | `fee-claims`, `fee-pupil` | 2 of 4: `POST /fees/claims/{paymentId}/confirm`; `POST /fees/payments`; `POST /fees/payments/{paymentId}/refund`*; `POST /fees/payments/{paymentId}/reverse`* | Receipt (frozen document) |
| 4 | ADMIN | Chase dues; carry the balance into next year | `/admin/fees/dues` | `fees-dues` | 1 of 2: `POST /fees/remind`; `POST /fees/carry-forward`* | Job fees:remind |

### 6.5 · An autonomous college's exam session end to end

*Source: docs/college.md, Exams; tests via scripts/zz-lifecycle.ts --college engineering.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | EXAM_CONTROLLER | Open a session for the term; appoint paper setters | `/exam-cell`, `/exam-cell/sessions/[sessionId]/conduct` | — | 0 of 2: `POST /exam-cell/sessions`*; `POST /exam-cell/sessions/{sessionId}/papers`* | ExamSession, QuestionPaper |
| 2 | FACULTY | Set the paper with its outcome map; it is sealed at once | `/faculty/exams` | `exam-duties` | 0 of 1: `POST /exam-cell/papers/{paperId}/submit`* | Sealed paper |
| 3 | EXAM_CONTROLLER | Moderate; open once (logged); halls, seating, printing lists | `/exam-cell/sessions/[sessionId]/conduct`, `/exam-cell/sessions/[sessionId]/logistics` | — | 0 of 4: `POST /exam-cell/papers/{paperId}/moderate`*; `GET /exam-cell/papers/{paperId}/open`*; `POST /exam-cell/sessions/{sessionId}/seating`*; `POST /exam-cell/sessions/{sessionId}/printing`* | Printing lists (audit exam-printing) |
| 4 | FACULTY | Exam squad visits a hall; a finding tells the controller | `/duties/exam-squad` | `exam-squad` | 2 of 2: `GET /duties/exam-squad`; `POST /duties/exam-squad/visits` | — |
| 5 | EXAM_CONTROLLER | Assessment bundles; double-entry marks; grace proposal | `/exam-cell/sessions/[sessionId]/marks` | — | 0 of 4: `POST /exam-cell/sessions/{sessionId}/assessment`*; `POST /exam-cell/assessment/{allocationId}/return`*; `POST /exam-cell/sessions/{sessionId}/marks`*; `POST /exam-cell/sessions/{sessionId}/grace`* | Two entries must agree |
| 6 | PRINCIPAL | Decide the grace proposal | `/exam-cell` | `college` | 0 of 1: `POST /exam-cell/grace/{graceId}/decide`* | Decision log |
| 7 | EXAM_CONTROLLER | Run results, publish, issue grade cards, push credits, draw the convocation list | `/exam-cell/sessions/[sessionId]/results`, `/exam-cell/after` | — | 0 of 5: `POST /exam-cell/sessions/{sessionId}/results/run`*; `POST /exam-cell/sessions/{sessionId}/results/publish`*; `POST /exam-cell/documents`*; `POST /exam-cell/credits/push`*; `POST /exam-cell/convocation`* | Grade card with a public check (GET /public/exam-documents/{code}) |
| 8 | STUDENT | Read results, grade card, revaluation, backlogs | `/student/exams` | `college-exams` | 3 of 3: `GET /exam-cell/mine`; `POST /exam-cell/mine/revaluations`; `POST /exam-cell/mine/backlogs` | — |

### 6.6 · The accreditation cycle: predictor, filings, sign-off

*Source: docs/college.md, IQAC; HANDOFF.md section 1.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | IQAC | Open a NAAC cycle; compute every quantitative metric from the rows; enter the inputs the platform does not hold | `/iqac/predictor` | `index` | 0 of 3: `POST /iqac/cycles`*; `POST /iqac/cycles/{cycleId}/compute`*; `POST /iqac/cycles/{cycleId}/inputs`* | AccreditationCycle.cgpa |
| 2 | IQAC | Score qualitative metrics with evidence (a file or a cited record) | `/iqac/predictor` | — | 0 of 2: `POST /iqac/cycles/{cycleId}/metrics/{metricCode}`*; `POST /iqac/evidence`* | — |
| 3 | IQAC | Surveys and the action-taken report feed the metrics | `/iqac/surveys` | — | 0 of 2: `POST /iqac/surveys`*; `POST /iqac/surveys/{surveyId}/atr`* | Anonymous aggregates only (five-answer floor) |
| 4 | IQAC | Generate the SSR, AQAR, IIQA, NIRF, AISHE (and the council returns the streams bring); send to the principal | `/iqac/documents` | `filings` | 0 of 2: `POST /iqac/filings`*; `POST /iqac/filings/{filingId}/submit`* | CollegeFiling.hash/body (audit iqac-filing) |
| 5 | PRINCIPAL | Sign off a NAAC document or return it with a note | `/principal/accreditation` | — | 0 of 1: `POST /iqac/filings/{filingId}/signoff`* | Decision log |
| 6 | IQAC | Mark it filed with the portal's acknowledgement | `/iqac/documents` | — | 0 of 1: `POST /iqac/filings/{filingId}/filed`* | — |
| 7 | HOD | Engineering: write the NBA SAR's qualitative criteria for the department | `/hod/nba` | — | 0 of 2: `GET /iqac/council/nba`*; `POST /iqac/council/nba`* | FilingWorksheet is input; quantitative items computed (council-rules.ts) |

### 6.7 · The placement season

*Source: docs/college.md, Placement; tests/ placement.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | RECRUITER | Register the company (GSTIN or CIN, format-checked, never looked up); post a requirement to colleges | `/register/recruiter`, `/recruiter` | `index` | 1 of 2: `POST /auth/recruiter/register`; `POST /recruiter/requirements`* | Company, Requirement |
| 2 | TPO | Verify the company; accept the requirement into a draft drive; open it with the eligibility rule | `/placement/companies`, `/placement/drives/new` | — | 0 of 3: `POST /placement/companies/{companyId}/verify`*; `POST /placement/requirements/{requirementId}/accept`*; `POST /placement/drives`* | Drive (rule fixed once shortlisting starts) |
| 3 | TPO | Invite eligible students only; remind before rounds | `/placement/drives/[driveId]` | `placement-drive` | 0 of 2: `POST /placement/drives/{driveId}/invite`*; `POST /placement/drives/{driveId}/remind`* | — |
| 4 | STUDENT | Apply (applying is the consent to share profile and record for this drive) | `/student/placement` | `placement` | 1 of 1: `POST /student/placement/drives/{driveId}/apply` | Consent for the drive's duration |
| 5 | RECRUITER | See consented applicants and watermarked resumes; enter round results and offers | `/recruiter/drives/[driveId]` | `recruiter-drive` | 2 of 3: `GET /recruiter/drives/{driveId}`; `POST /placement/drives/{driveId}/results`; `POST /placement/drives/{driveId}/offers`* | Offer (one-offer rule, dream exception) |
| 6 | STUDENT | Accept or decline the offer; TPO records joining | `/student/placement`, `/placement/drives/[driveId]` | `placement` | 1 of 2: `POST /student/placement/offers/{offerId}`; `POST /placement/offers/{offerId}/joined`* | — |
| 7 | TPO | Publish the season's table (NBA index, NIRF median, NAAC rates) | `/placement/analytics` | — | 0 of 2: `POST /placement/season`*; `GET /placement/analytics/export`* | PlacementSeason (audit placement-season) |

### 6.8 · Guardians: claim a child, then see only what is granted

*Source: docs/college.md, Parent; HANDOFF.md section 5 item 1.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | PARENT | Ask to be linked: student code and date of birth (a claim, never an instant link) | `/join/parent`, `/parent/link` | `link-child` | 2 of 2: `POST /community/link-child`; `GET /community/link-child` | GuardianClaim |
| 2 | ADMIN | The office, or a guardian the child already has, decides the claim | `/joins`, `/parent/claims` | `joins` | 2 of 2: `GET /shared/joins`; `POST /shared/claims/{claimId}/decide` | Guardianship ACTIVE |
| 3 | STUDENT | An adult at a college grants attendance, results, money, hostel, placement item by item | `/student/consent` | `consent` | 2 of 2: `GET /student/consent`; `POST /student/consent` | StudentConsent (audited) |
| 4 | PARENT | Reads the granted views; a minor's guardian sees everything | `/parent/academics`, `/parent/results`, `/parent/money` | `academics`, `college-exams`, `money` | 3 of 3: `GET /academics/family`; `GET /exam-cell/mine`; `GET /student/ledger` | — |

### 6.9 · Leave, then cover

*Source: docs/college.md, The six college staff roles; leave.ts.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | TEACHER | Apply with a nominee to cover (FACULTY, HOD and the college's staff apply at /account/leave) | `/teacher/leave`, `/account/leave` | `leave` | 1 of 1: `POST /staff/leave` | LeaveRequest |
| 2 | ADMIN | The office or the principal decides; cover is arranged | `/principal/leave` | `leave` | 2 of 2: `GET /admin/leave`; `POST /admin/leave/{leaveId}/decide` | Decision log |
| 3 | TEACHER | The nominee acknowledges or declines; a decline tells the office and the head | `/teacher` | `my-covers` | 2 of 2: `POST /teaching/covers/{id}/acknowledge`; `POST /teaching/covers/{id}/decline` | — |
| 4 | ADMIN | The substitution board shows lessons of staff away (register or approved leave); name or clear the cover | `/admin/substitutions` | `substitutions` | 2 of 2: `GET /office/substitutions`; `POST /office/substitutions` | School.teachingDays defines the week |
| 5 | HOD | At a college the department's lectures use the same away rule | `/hod` | `lecture-substitutions` | 2 of 2: `GET /academics/substitutions`; `POST /academics/substitutions` | — |

### 6.10 · A session with an outside expert (free one-to-one or workshop)

*Source: docs/decisions/0004; HANDOFF.md.*

| # | Role | Step | Web | Phone | Doors | Stored / checked |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | EXPERT | Offer windows; publish a profile | `/expert/availability`, `/expert/profile` | `availability`, `profile` | 2 of 2: `POST /gigs/slots`; `POST /shared/expert/profile` | Expert slot |
| 2 | STUDENT | Ask for a seat; it waits for a guardian | `/sessions` | `sessions` | 1 of 1: `POST /gigs/sessions/book` | Booking (pending) |
| 3 | PARENT | Consent (or decline); for a paid seat the checkout, which is off until Route is proven | `/sessions` | `sessions` | 2 of 2: `POST /gigs/sessions/{bookingId}/consent`; `POST /gigs/sessions/{bookingId}/checkout` | Payment on hold |
| 4 | EXPERT | After it began: held or not; family rates it | `/expert/sessions`, `/sessions` | `sessions` | 2 of 2: `POST /gigs/sessions/{bookingId}/close`; `POST /gigs/sessions/{bookingId}/rate` | — |

## 7 · The parity table: web only, phone only, both

### 7.1 · By menu entry, and by door

| Role | Web menu entries | Both (native phone screen, tab or in-screen mode) | Phone opens the web (link-out) | Web only (no phone entry) | Phone only (menu) | Doors the phone calls | Write doors the phone calls | College write doors the phone calls |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN | 54 | 39 | 13 | 2 | 0 | 333 of 638 (52 %) | 165 of 350 | 5 of 87 |
| PRINCIPAL | 47 | 34 | 11 | 2 | 0 | 212 of 353 (60 %) | 75 of 107 | 2 of 10 |
| TEACHER | 28 | 27 | 0 | 1 | 0 | 159 of 179 (89 %) | 80 of 92 | — |
| STUDENT | 26 | 26 | 0 | 0 | 0 | 153 of 166 (92 %) | 74 of 81 | 13 of 17 |
| PARENT | 31 | 30 | 1 | 0 | 0 | 146 of 162 (90 %) | 69 of 80 | 1 of 2 |
| EXPERT | 7 | 7 | 0 | 0 | 0 | 81 of 84 (96 %) | 46 of 48 | — |
| DRIVER | 5 | 5 | 0 | 0 | 0 | 37 of 45 (82 %) | 24 of 29 | — |
| LIBRARIAN | 13 | 8 | 3 | 2 | 0 | 47 of 74 (64 %) | 27 of 43 | 1 of 4 |
| WARDEN | 15 | 9 | 3 | 3 | 0 | 43 of 71 (61 %) | 25 of 41 | 0 of 3 |
| ALUMNUS | 8 | 8 | 0 | 0 | 0 | 47 of 53 (89 %) | 28 of 33 | 4 of 5 |
| FACULTY | 21 | 16 | 0 | 5 | 0 | 73 of 114 (64 %) | 38 of 62 | 12 of 31 |
| HOD | 23 | 17 | 0 | 6 | 0 | 81 of 137 (59 %) | 42 of 74 | 16 of 43 |
| EXAM_CONTROLLER | 6 | 6 | 0 | 0 | 0 | 43 of 93 (46 %) | 23 of 60 | 1 of 33 |
| IQAC | 12 | 5 | 7 | 0 | 0 | 41 of 94 (44 %) | 23 of 50 | 1 of 23 |
| TPO | 10 | 5 | 5 | 0 | 0 | 40 of 72 (56 %) | 23 of 42 | 1 of 15 |
| ACCOUNTS | 13 | 5 | 8 | 0 | 0 | 57 of 143 (40 %) | 30 of 80 | 0 of 10 |
| RECRUITER | 2 | 2 | 0 | 0 | 0 | 29 of 43 (67 %) | 19 of 28 | 2 of 9 |
| **all 17** | 321 | 249 | 51 | 21 | 0 |  |  |  |

Reading: at the menu level the phone is nearly complete for the school's roles (STUDENT, PARENT, EXPERT, DRIVER, ALUMNUS, RECRUITER: no web entry without a phone entry; TEACHER one) and falls away for the college's desks: IQAC (7 of 12 entries open the web), ACCOUNTS (8 of 13), TPO (5 of 10), and for the registrar's and head's college half. By door the phone calls 52 % of ADMIN's, 46 % of EXAM_CONTROLLER's, 44 % of IQAC's, 56 % of TPO's and 40 % of ACCOUNTS' doors, against 82 to 96 % for TEACHER, STUDENT, PARENT, EXPERT, DRIVER and ALUMNUS (section 3). EXAM_CONTROLLER shows 6 of 6 'both' only because its home is native; of its 33 `/exam-cell` write doors (sessions, forms, logistics, marks, results, documents, credits) the phone calls one, the student's form submit (section 4.13). **No phone-only menu entry exists for any role**: the phone adds no destination the web lacks; what is phone-only is behaviour (7.4).

### 7.2 · The hand matches behind the menu table

Entries matched by dictionary label key need no explanation. Where the phone's label differs from the web's, this audit matched by hand; each is a judgement and listed so it can be argued with.

| Role | Direction | Label | Counterpart |
| --- | --- | --- | --- |
| ADMIN | phone entry → web | Staff | /principal/staff |
| ADMIN | phone entry → web | Invites | /admin/invites |
| ADMIN | phone entry → web | Directory | /admin/settings |
| ADMIN | phone entry → web | Account | /account |
| ADMIN | phone entry → web | Alumni directory | /alumni/directory |
| PRINCIPAL | phone entry → web | Attendance | /attendance/history |
| PRINCIPAL | phone entry → web | Staff | /principal/staff |
| PRINCIPAL | phone entry → web | The college | /principal/college |
| TEACHER | phone entry → web | Covering today | /teacher (cover card) |
| TEACHER | phone entry → web | Account | /account |
| STUDENT | phone entry → web | Coming up | /student/agenda |
| STUDENT | phone entry → web | My fees | /student/fees |
| STUDENT | phone entry → web | Account | /account |
| STUDENT | phone entry → web | Course registration | /student/registration |
| PARENT | phone entry → web | Coming up | /parent/agenda |
| PARENT | phone entry → web | Account | /account |
| EXPERT | web entry → phone | Earnings | inside Profile |
| DRIVER | phone entry → web | My payslips | /account/payslips |
| DRIVER | web entry → phone | Global feed | chip on the Feed |
| LIBRARIAN | phone entry → web | My payslips | /account/payslips |
| LIBRARIAN | web entry → phone | Overdue | in-screen tab |
| LIBRARIAN | web entry → phone | Reservations | in-screen tab |
| LIBRARIAN | web entry → phone | Stock-take | in-screen tab |
| LIBRARIAN | web entry → phone | Global feed | chip on the Feed |
| WARDEN | phone entry → web | My payslips | /account/payslips |
| WARDEN | web entry → phone | Roll call | in-screen mode |
| WARDEN | web entry → phone | Leave | in-screen mode |
| WARDEN | web entry → phone | Tonight | in-screen mode |
| WARDEN | web entry → phone | Visitors | in-screen mode |
| WARDEN | web entry → phone | Global feed | chip on the Feed |
| ALUMNUS | phone entry → web | Your school record | /record |
| FACULTY | phone entry → web | Feedback and grievances | /faculty/research (surveys open to me) |
| FACULTY | phone entry → web | Mentoring | /faculty/mentoring |
| FACULTY | phone entry → web | My payslips | /account/payslips |
| HOD | phone entry → web | Feedback and grievances | /faculty/research (surveys open to me) |
| HOD | phone entry → web | Mentoring | /faculty/mentoring |
| HOD | phone entry → web | Substitutions | /hod (board) |
| HOD | phone entry → web | Department | /hod |
| HOD | phone entry → web | My payslips | /account/payslips |
| HOD | web entry → phone | Head of department | home tab (Department) |
| EXAM_CONTROLLER | phone entry → web | Exam cell | /exam-cell |
| EXAM_CONTROLLER | phone entry → web | My payslips | /account/payslips |
| EXAM_CONTROLLER | web entry → phone | Exam controller | home tab (Exam cell) |
| IQAC | phone entry → web | My payslips | /account/payslips |
| TPO | phone entry → web | Placement | /placement |
| TPO | phone entry → web | My payslips | /account/payslips |
| TPO | web entry → phone | Training and placement officer | home tab (Placement) |
| ACCOUNTS | phone entry → web | Look up a student | /accounts/students |
| ACCOUNTS | phone entry → web | My payslips | /account/payslips |

### 7.3 · The entries that are web only, and the link-outs

| Role | Web only (no phone entry) | Phone opens the web (link-out) |
| --- | --- | --- |
| ADMIN | — (things issued to me and the stream records are screens since 10 Oct) | Library `/library`; Library, hostel and bus `/admin/college-campus`; Committees and minutes `/admin/committees` |
| PRINCIPAL | — | Library `/library/reports`; Accreditation file `/principal/accreditation`; Committees and minutes `/admin/committees` |
| TEACHER | — | — |
| PARENT | — | Placement `/parent/placement` |
| LIBRARIAN | — | Catalogue `/library/catalogue`; Fines `/library/fines`; Reports `/library/reports` |
| WARDEN | — | Rooms `/hostel/rooms`; Mess menu `/hostel/menu`; Incidents `/hostel/incidents` |
| FACULTY | Clinical coordinator `/duties/clinical`; Studio coordinator `/duties/studio` (the desks batch of 10 Oct builds them) | — |
| HOD | Clinical coordinator `/duties/clinical`; Studio coordinator `/duties/studio` (as above) | — |
| IQAC | — | — |
| TPO | — | — |
| ACCOUNTS | — | — |

**Recounted 10 October 2026 (the parity batch, R-4).** The rows above are as the phone stands after the batch; what each row held on 5 October is in the git history of this file. The batch made native screens of every link-out and web-only page of the three desks (TPO: drives, students, companies, internships, the table; IQAC: the predictor, filings, surveys, the registers, grievances, faculty records, the table; ACCOUNTS: fee structures, claims, no-dues, concessions, the ledger, payroll and the stores — "A student's account" is the look-up, 7.2's hand match), of the exam controller's session (forms, runs, the step on) and after-results, of the HOD's and faculty's students' work, research and public page, of the library's and warden's college pages (e-resources with the borrowing terms, expulsions, the squad's rounds, the no-dues line), and of the office's and head's reads (things issued to me, stream records, transport, alumni, the hostel, academics, college admissions, and the accounts, exam cell, placement and IQAC homes); 51 link-outs became 9, 21 web-only entries became 4. By door, counted the way section 0 says (`permits()` over the catalog of 1,148 doors as it stands on 10 October, FACULTY and HOD holding every duty, a phone-called door a string literal in `apps/mobile/src` outside tests; the audit's own script is gone, so a rerun of the same reading, `apps/web/scripts/tmp-parity-count.ts` in the batch's report, both before and after on the same catalog): ACCOUNTS 43 → 53 %, IQAC 45 → 59 %, EXAM_CONTROLLER 52 → 59 %, ADMIN 48 → 56 %, TPO 65 → 77 %, HOD 54 → 66 %, FACULTY 62 → 74 %, LIBRARIAN 62 → 67 %, WARDEN 63 → 75 %, PRINCIPAL 55 → 65 %; the school roles unchanged (TEACHER 85 → 86, STUDENT 87 → 89, the rest as they were). The "before" figures differ from 7.1's because the catalog grew by 142 doors since 5 October (the risks batch, the assistant, the quiz bank) and the phone's screens with it; the percentages of 7.1 are the 5 October snapshot and stand. College write doors the phone calls: TPO 3 → 9 of 15, HOD 16 → 27 of 55, FACULTY 13 → 21 of 41, IQAC 2 → 8 of 26, EXAM_CONTROLLER 1 → 6 of 33, ACCOUNTS 0 → 5 of 10, ADMIN 8 → 25 of 90, PRINCIPAL 2 → 6 of 12, WARDEN 0 → 2 of 3, LIBRARIAN 2 → 3 of 4. What stays web-only by design: forms that set things up (a drive, a structure, a survey, a filing, a project, a committee), the sheets and PDFs, the campus settings, the committees and the accreditation file, the library desk's catalogue, fines and reports, the hostel's rooms, menu and incidents.

### 7.4 · What is phone only: behaviour, not destinations

| Phone-only behaviour | Where | Evidence |
| --- | --- | --- |
| The bus's GPS: start, positions, ticks, end of a trip (the driver's location is sent only between Start and End, after a recorded consent) | DRIVER | doors `POST /transport/trips/{tripId}/start\|positions\|boardings\|end`: no web caller (`apionly`); `apps/mobile/src/lib/trip-positions.ts`; `/driver` says so on the web (`transport.webDriverNote`) |
| The offline outbox: a write queued on the phone and replayed (register, lecture attendance, hostel roll call, driver positions); the same `clientId` writes once | TEACHER, FACULTY, HOD, WARDEN, DRIVER | `apps/mobile/src/lib/outbox*.ts`; `screens/teacher/support.tsx` `postOrQueue`; callers `teacher/register.tsx`, `academics/lecture.tsx`, `hostel/warden.tsx` |
| Push registration, the app version gate, the in-app problem report and crash report | every phone role | `POST /me/devices`, `DELETE /me/devices`, `GET /app/version`, `POST /app/report` (catalog `core.ts`) |
| The accounts desk's student look-up by PRN (ledger and no-dues, read only); the web has the same read at `/accounts/students` | ACCOUNTS | `screens/college-office/lookup.tsx`; `GET /accounts/lookup` |
| Native sign-in hand-offs: PKCE for SSO, magic-link and two-factor screens | all | `apps/mobile/src/app/(auth)`: login, two-factor, magic-link, first-signin, recruiter-register |

### 7.5 · What is web only beyond the menu: writes with no door

These web server actions call library functions that no catalog door reaches, so the phone **cannot** do them even by a link-out that signs in on the web (`apps/web/src/app/(app)/*/actions.ts` against `src/app/api/**/route.ts` imports). Verified door-less against the catalog summaries (section 8, A3-inventory-7).

| Area | Web action (file) | What the phone cannot do |
| --- | --- | --- |
| Calendar | `admin/calendar/actions.ts`: `createAcademicYear`, `closeAcademicYear`, `createTerm`, `deleteTerm`, `updateHoliday`, `deleteHoliday` | Make an academic year, close it, make or delete a term (at a school), edit or delete a holiday. The college has `POST /academics/terms`; the closure add has `POST /admin/calendar/closures`. |
| Year end | `admin/promotion/actions.ts`: `promoteSchool` | Promote the school. The catalog has only the plan read `GET /admin/classes/promotion`, and nothing, web or phone, calls that door. |
| Classes | `admin/classes/[classId]/actions.ts`: `enrolStudents`, `removeFromCohort`, `assignTeacher` (cohort), `setAttendanceRight`, `cancelCover`; `admin/classes/actions.ts`: `createClassIn` | Move pupils into or out of a class, give a teacher the register right, cancel a cover from the class page (the door `POST /admin/classes/{classId}/teacher` is the lead teacher). |
| Exams and timetable | `admin/exams/actions.ts` `removeSlot`; `admin/timetable/actions.ts` `applySuggestedDay` | Remove a paper from a date sheet; apply the suggested day. |
| People | `admin/people/actions.ts` `issueFirstSignIn`, `inviteParent`; `admin/invites/actions.ts` `sendTeacherInvite`; `experts/actions.ts` `inviteExpert`; `account/merge/actions.ts` `mergeAccounts` | Print a pupil's first-sign-in code, invite a parent or an expert, merge two accounts (the invite door `POST /admin/people/invites` covers a pasted list). |
| Reviews, feed, leave | `admin/reviews/actions.ts` `closeReviewRound`; `bulletin/actions.ts` `togglePin`; `teacher/leave/actions.ts` `cancelLeave` | Close a review round (opening has a door), pin a post, withdraw one's own leave request. |
| Content team and operator | `appadmin/actions.ts` `deleteBankQuestion`; `root/actions.ts` `removeSchools`, `deleteSchoolsEntirely`; `root/[schoolId]/inside/actions.ts` | Delete a bank question; remove or delete schools; moderate inside a school. |

## 8 · Gaps between intent and what exists

Intent is the college plan (`scratchpad/college-roles.md`), `docs/college.md`, `docs/demo-schools.md`, `HANDOFF.md`, the builders' reports under `scratchpad/reports/` and the catalog's own summaries. Every item below was checked in the tree by a second reading (not only by the generated analysis, which produced false positives that were discarded: a page that gets its data through a component, an HOD home that embeds the offering form and the substitution board, a duty desk that reuses a faculty page). Nothing was run: **each item is Untested in a browser or on a device**; severity is a judgement of how much of a job it blocks.

Format follows the campaign's (id, severity, roles, platform, steps, expected, actual, evidence, reproduced alone). Ids are `A3-inventory-n`. **Reproduced alone: no (static reading) for all.**

### A3-inventory-1 · medium · ACCOUNTS · web

**The fee ledger's pages answer ADMIN or PRINCIPAL; the accounts desk gets only the overview.**

- **Steps (static):** As ACCOUNTS at a college, open `/accounts` then the menu entry 'Fee ledger' (`/admin/fees`) and follow any link: a pupil's ledger, dues, structures, claims, heads, settings.
- **Expected:** The college's accounts desk takes counter receipts, matches the bank statement, confirms UPI claims, grants concessions and keeps the fee ledger with the office: the menu names it (`nav.ts` NAV.ACCOUNTS, `/admin/fees` prefix), every fee door names it (`POST /fees/payments`, `/fees/claims/{paymentId}/confirm`, `/fees/bank-import/commit`, `/fees/concessions`... `access: [ADMIN, ACCOUNTS]`), and the office builder's report says ACCOUNTS 'writes and reads like ADMIN' (scratchpad/reports/office.md lines 98, 124-126, 157).
- **Actual:** Only `admin/fees/page.tsx:36` admits ACCOUNTS (`requireRole("ADMIN","PRINCIPAL","ACCOUNTS")`). The sub-pages gate `ADMIN` or `ADMIN, PRINCIPAL`: `dues/page.tsx:36`, `pupils/[studentMembershipId]/page.tsx:31`, `structures/page.tsx:30`, `structures/[structureId]/page.tsx:33`, `structures/new/page.tsx:22`, `heads/page.tsx:18`, `settings/page.tsx:28`, `claims/page.tsx:27`. The role gate lets ACCOUNTS through the URL (a NAV prefix entry), the page then calls `requireRole`, which redirects to `/switch?next=/admin` (`tenancy.ts:55-66`): a dead end. The phone has only the read-only look-up (`accounts-lookup`). So no screen on either platform lets ACCOUNTS record a receipt that the door permits.
- **Evidence:** `apps/web/src/lib/nav.ts:564`; the eight page files above; `apps/web/src/lib/tenancy.ts:55`; `docs/api/openapi.json` x-access of `POST /api/v1/fees/payments`. Found by cross-checking every NAV prefix against the pages under it.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-2 · medium · ACCOUNTS · web

**Payroll and stores: the doors and libraries keep ACCOUNTS, the pages draw every form for ADMIN alone.**

- **Steps (static):** As ACCOUNTS, open `/admin/payroll` and `/admin/inventory` (menu 'running' group).
- **Expected:** 'Payroll and stores with the office': docs/college.md Roles table (ACCOUNTS); the plan's Accounts row ('run and lock payroll'); `payroll.ts:89-93` and `inventory.ts` accept ACCOUNTS to write (`keeps()`), and the 21 payroll and 24 inventory doors name it.
- **Actual:** `admin/payroll/shared.tsx:18` and `admin/inventory/shared.tsx:17` return `canEdit: ctx.role === "ADMIN"`; the run form, lock, share, the admin tabs (salaries, structures, advances, settings are `admin: true` tabs drawn only when `canEdit`) and the stock forms are drawn only when it is true; the payroll home even prints 'the head reads' (`payroll.headReads`) for ACCOUNTS (`admin/payroll/page.tsx:154`). ACCOUNTS reads, and cannot post an issue, a purchase or a run from the web; the phone's payroll and inventory screens are read-only or absent for the role.
- **Evidence:** `apps/web/src/app/(app)/admin/payroll/shared.tsx:18`, `.../inventory/shared.tsx:17`, `.../payroll/page.tsx:52,149,154`; `apps/web/src/lib/payroll.ts:89-93`; catalog `payroll.ts` and `inventory.ts` (access lists).
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-3 · low · ACCOUNTS · web

**The admission fee and the refund on a cancelled seat are doors for ACCOUNTS and pages for ADMIN and PRINCIPAL.**

- **Steps (static):** As ACCOUNTS open `/admin/college-admissions/refunds` or one application.
- **Expected:** Plan, Accounts: 'refunds under the authority's slab'; doors `POST /college/admissions/applications/{id}/fee` and `/refund` and `GET /college/admissions/refund-exceptions` name ACCOUNTS ('The college's bank paid the refund: its reference closes the case').
- **Actual:** `admin/college-admissions/[applicationId]/page.tsx:33`, `refunds/page.tsx:33` and `page.tsx:33` all `requireRole("ADMIN","PRINCIPAL")`; ACCOUNTS has no admissions entry in its menu. The bank reference can be written only by the registrar on the web.
- **Evidence:** the three page files; catalog `college-admissions.ts`.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-4 · medium · FACULTY, HOD · web and phone

**A law college's moot courts: the library and the door let FACULTY and HOD record them; the only page is the office's.**

- **Steps (static):** At a law college as an HOD or FACULTY member, look for where to record a moot.
- **Expected:** Catalog `POST /stream-records/moot-courts` 'A moot recorded, or corrected by its id' names `[ADMIN, HOD, FACULTY]`; `saveMootCourt` accepts those three (`stream-records.ts:381`); docs/college.md lists moot courts among the records per stream.
- **Actual:** The only page is `admin/stream-records/moot-courts/page.tsx:33` (`requireRole("ADMIN","PRINCIPAL")`), and the FACULTY and HOD menus have no stream-records entry; the phone has no screen (`ph:0` on both moot doors); `GET /stream-records/lab-batches` (HD, FA) likewise has only the office's page. No ZZ or demo college is law, so none of it has been rendered with data.
- **Evidence:** `apps/web/src/lib/stream-records.ts:380-381`; the page file; `apps/web/src/lib/nav.ts` NAV.FACULTY and NAV.HOD (no `/admin/stream-records`).
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-5 · low · FACULTY, HOD · web and phone

**The head can write an appraisal for a FACULTY or HOD member; they have no door or page to read it.**

- **Steps (static):** As the principal write an appraisal marked visible for a college teacher; as that teacher look for it.
- **Expected:** `appraisal.ts:32,38` makes STAFF_ROLES (TEACHER, PRINCIPAL, ADMIN, FACULTY, HOD) subjects and readers; the plan's Faculty row: 'the appraisal the principal shares'.
- **Actual:** `GET /staff/me/appraisals` names `[TEACHER, ADMIN, PRINCIPAL]` (`api-catalog/staff.ts:59`); `/teacher/appraisals` is `requireRole(TEACHER, ADMIN, PRINCIPAL)`; NAV.FACULTY and NAV.HOD have no appraisal entry; the phone's `my-appraisals` is in MENU.TEACHER only. The head's own door `GET /principal/staff/{membershipId}/appraisals` does list them.
- **Evidence:** `apps/web/src/lib/appraisal.ts:32-38`; `apps/web/src/lib/api-catalog/staff.ts:59`; `apps/web/src/lib/nav.ts` NAV.FACULTY/HOD.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-6 · low · FACULTY, HOD · web and phone

**No homework or hand-in for a college teacher.**

- **Steps (static):** As FACULTY look for 'set work'.
- **Expected:** Plan, Faculty, 'Assignments and content: Homework and submissions with photo hand-in, the practice-quiz bank tagged by course, e-resources...'.  The Student row of the plan lists the same 'Learning' line, and the student's assignments page is in the college student's menu, but nothing at a college sets work for it.
- **Actual:** `POST /staff/assignments`, `/staff/assignments/publish` and the whole `/teaching/assignments/*` family name `[TEACHER, ADMIN]` only; `/teacher/assignments` is `requireRole(TEACHER, ADMIN)`; FACULTY's menu has none. Internal assessment components (`/academics/offerings/{id}/internal/components`) carry marks for assignments but no hand-in. Whether a college wants hand-in is the owner's decision; the plan says yes.
- **Evidence:** `apps/web/src/lib/api-catalog/staff.ts:21-22`, `teaching.ts`; `apps/web/src/lib/nav.ts` NAV.FACULTY.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-7 · low · ADMIN (and TEACHER, PRINCIPAL) · phone

**Writes the web can do and no door exists for (section 7.5).**

- **Steps (static):** Try the same job on the phone: make an academic year, close it, make a term at a school, promote the school, move a pupil between classes, print a first-sign-in code.
- **Expected:** HANDOFF.md section 1 lists 'promotion and year close' as built; the phone's admin menu is the office's day.
- **Actual:** Eight areas of server actions call library functions with no catalog door (list in 7.5); `GET /admin/classes/promotion` is the plan read, with no consumer on either platform. The phone's `calendar` and `classes` screens read.
- **Evidence:** `apps/web/src/app/(app)/admin/{calendar,promotion,classes,exams,timetable,people,invites,reviews}/actions.ts`; `doors.txt` summaries (no matching door).
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-8 · low · ADMIN, operator, STUDENT, PRINCIPAL · web and phone

**Doors with no caller on either platform.**

- **Steps (static):** Search `apps/web/src` and `apps/mobile/src` for each door's path and for its library functions.
- **Expected:** Catalog doors exist to be called (the docs, the sweep and the phone's access gate read them).
- **Actual:** **Orphans (no UI behind them):** `POST /fees/plans/remove` (`unassignPlan` has no caller but its route); `POST /operator/gigs/payees/{expertUserId}/suspend` (`suspendPayee`, same); `GET /office/usage` (the school's own plan usage: only the operator's page `root/[schoolId]` calls `schoolUsage`); `GET /id-cards/check` (the ID card's QR checker; docs/college.md says the web `/id-check` page is not built, and no phone screen calls it). **JSON twins** (a page shows the same facts through the library, the door is unused): `GET /academics/eligibility`, `GET /academics/lectures`, `GET /student/no-dues`, `GET /accounts/finance-table`, `GET /library/college-table`, `GET /hostel/college-table`, `GET /college/scholarships/schemes`, `GET /accounts/settings`, `GET /placement/settings`, `GET /iqac/evidence`, `POST /iqac/evidence`, `GET /stream-records/law-internships`, `GET /admin/modules`, `GET /admin/classes/promotion`, `GET /fees/heads`, `GET /fees/structures/{structureId}`, `GET /messaging/broadcasts`, `GET /operator/schools/{schoolId}/modules`, `GET /appadmin/moderation/{postId}`, `POST /shared/notifications/{notificationId}/read`, and the CSV doors `GET /fees/export/*`, `GET /admin/inventory/export/*` (the web serves its own route handlers).
- **Evidence:** `scratchpad/audit3-inv/apionly.py` and `nopage.py` (static search over the 1,006 doors); verified by grep for `unassignPlan`, `suspendPayee`, `officeUsage`, `checkIdCode`. A twin is not a fault; an orphan is a promise the product does not keep (the sweep still calls it, so it is green).
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-9 · low · TEACHER, every phone user of the register · both

**The register's write door is outside the catalog.**

- **Steps (static):** Compare `docs/api/openapi.json` with `apps/web/src/app/api`.
- **Expected:** HANDOFF.md section 2: 'the catalog is the truth: docs, sweep and the phone's access gate are all derived from it'.
- **Actual:** `POST /api/attendance` (and its `GET`) is the door the teacher's register page and the phone's register use (`apps/mobile/src/screens/teacher/register.tsx:171`); it is not in the catalog, so it is not in `openapi.json`, has no `x-access` and is not walked by `api:sweep` (only the page sweep `scripts/sweep.ts:958` posts to it, so the daily write is exercised but is not in the contract the phone's access gate reads). Eleven other `/api` routes are also outside it: `health`, `practice/answer`, `push`, `internal/jobs`, `files/[fileId]`, `sso/[provider]/start|callback`, `webhooks/razorpay`, `webhooks/gateway/sessions`, `webhooks/twilio/status`, `auth/logout`. Some (webhooks, health, sso) are right to be outside; the register and the practice answer are daily journeys of the two largest roles.
- **Evidence:** `apps/web/src/app/api/attendance/route.ts`; `apps/web/src/lib/api-catalog/staff.ts:15` summary 'marking is POST /api/attendance'; `apps/mobile/src/screens/teacher/register.tsx:22,171`.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-10 · low · IQAC, TPO, ACCOUNTS, HOD, TEACHER, STUDENT, LIBRARIAN · web and phone

**What the plan promises and nothing implements.**

- **Steps (static):** Search the code, the contracts and the schema for each item.
- **Expected:** `scratchpad/college-roles.md`.
- **Actual:** No page, door or table for: **appointment letters** (Registrar, Faculty and staff); **pre-placement talks** and **soft-skills training with attendance** (TPO, Preparation; mock interviews exist as alumni mentor slots); **student council notices** (Student, Voice); **the peer-team visit schedule** (Principal, the accreditation file); **a reading-room register** (Librarian); **a biometric or RFID attendance feed** (Faculty, 'where the college has one'); **Tally export of receipts and payroll** (Accounts; recorded since 4 Oct) and **round results from a sheet, Superset/Unstop import** (TPO; recorded). Periodicals exist as titles of category PERIODICAL, not as subscriptions with volumes (`college-campus.ts:23-24,145`).
- **Evidence:** grep over `apps/web/src/lib`, `apps/web/prisma/schema.prisma` and `packages/contracts/src` returned nothing for those terms (`appointment letter`, `pre-placement`, `soft skill`, `student council`, `peer-team`, `reading room`, `biometric|rfid`).
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-11 · info · HOD · web

**The plan has the HOD approve faculty leave up to the department's limit; the platform has the office or the head decide.**

- **Steps (static):** Read the HOD row of the plan and `leave.ts`.
- **Expected:** Plan, HOD: 'approve faculty leave up to the department's limit and arrange the substitution'.
- **Actual:** `POST /admin/leave/{leaveId}/decide` names `[ADMIN, PRINCIPAL]`; the integration report records the decision: 'the office or the principal decides on /principal/leave' (scratchpad/reports/integration.md line 264). The HOD arranges the substitution (`POST /academics/substitutions`). A recorded decision, not a defect; the plan document is the thing that is out of date.
- **Evidence:** `apps/web/src/lib/leave.ts:74-76`; integration.md:264.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-12 · low · FACULTY, HOD · web

**Two duties can be given and open a page that says nothing is built.**

- **Steps (static):** As the registrar give a pharmacy or health college's teacher CLINICAL_COORDINATOR (or an architecture college's STUDIO_COORDINATOR); open the desk.
- **Expected:** A duty opens a desk (docs/college.md Streams, duty table).
- **Actual:** `/duties/clinical` and `/duties/studio` render the preset's not-built sentence; no door carries either duty (`BYDUTY` 0); no phone screen. The unbuilt streams are recorded (HEALTH_SCIENCES, ARCHITECTURE, AGRICULTURE); the registrar can nevertheless hand out the duty at a PHARMACY college, which is a built stream (CLINICAL_COORDINATOR is offered to HEALTH_SCIENCES and PHARMACY).
- **Evidence:** `apps/web/src/app/(app)/duties/clinical/page.tsx`, `studio/page.tsx`; `packages/contracts/src/v1/duties.ts` DUTY_STREAMS.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-13 · info · operators of the repository · docs

**Stale statements in the documents a new session reads first.**

- **Steps (static):** Compare HANDOFF.md and docs/college.md with the tree.
- **Expected:** HANDOFF.md says it is 'the short map'.
- **Actual:** `HANDOFF.md:79` '530 endpoints' (1,006), `:82` '111 models, 28 handwritten migrations' (291, 88), `:96` 'Seventeen jobs' (18), `:128` '2,398 tests in 196 files' (3,350 in 311 on 5 Oct), `:130,:150` i18n floor 163 (113; `.github/workflows/battery.yml:46`), and 'Recent history' ends at `ff57b2d`. `docs/college.md:244` says the phone warden's night view is 'Still not built'; it is built (`screens/hostel/warden.tsx:55-58`, commit 8ca2cafb). The stream section and the 5 October paragraph of HANDOFF are current.
- **Evidence:** the lines cited; `git log` (HEAD 7727b8b3).
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### A3-inventory-14 · low · web users of celebrations, practice journey · web

**Pages with no door: the web has features the phone and API do not.**

- **Steps (static):** List pages whose library functions no route or API read imports.
- **Expected:** The phone is meant to reach the same library through `/api/v1` (HANDOFF section 2).
- **Actual:** `/bulletin/celebrations` and the celebrations card on `/teacher/classes` (`celebrationsFor`), `/student/practice/journey` (`journey`), `/root/jobs/schools` (`crossSchoolJobHealth`), `/suspended`, `/switch`, the settings modules page's `MODULE_META` have no door of their own. The first two are daily-life pages (birthdays and anniversaries; the learning journey). The phone maps their notification links to its feed and practice screens (`apps/mobile/src/lib/links.ts:91-92`) but has no screen or door for the content itself.
- **Evidence:** `scratchpad/audit3-inv/rolepage2.py` output (12 pages); the page files.
- **Reproduced alone:** no (static reading only). Untested in a browser or on a device.

### By design or by recorded decision (excluded from the register)

- Money never touches the platform (decision 0003): no payment door moves funds; a refund or a scholarship disbursement is a reference to a bank act.
- No Aadhaar, ever (decision 0002); APAAR and ABC ids are captured on the pupil record (`college-records.ts`), the Academic Bank push is a stub transport.
- The six college staff roles, the four module roles and the RECRUITER are limited (default-deny) and reach pages only through their NAV (`role-gate.ts`).
- The phone is not asked to carry the registrar's, the exam controller's, the IQAC's or the TPO's desks (exams decision 10: the controller works on the web); their MENU entries open the web.
- Faculty leave is decided by the office or the head, not the HOD (integration decision).
- HEALTH_SCIENCES, ARCHITECTURE and AGRICULTURE are listed and say what is not built; PCI, BCI, NCTE pages have never rendered with data on a live server (no fixture college of those streams).
- Paid expert seats are off until Razorpay Route is proven (decision 0004 amendments); one-to-ones are never priced.
- College-only doors answer `MODULE_OFF` or 404 at a school (`x-college`): 312 doors; they are not 'doors with no page' at a school.

### Untested

- Everything in this file: no server, browser, device or database was used. Page gates were read from source, not exercised; a redirect from `requireRole` is inferred from `tenancy.ts`, not seen.
- Doors the phone calls through a variable path (the phone-called counts are therefore a lower bound by a handful) and, where a literal carries no method, every method of the path (an upper bound for those paths).
- The roles-per-page table is inferred for pages that delegate their gate to a component (the 61 any-signed-in pages are not attributed to a role; 8 public pages have none).
- The IQAC insights engine and simulator, being built now.
- Hindi and Marathi, accessibility, performance, security: other layers.
- The 13 CSV/print `route.ts` files under `(app)` and the 12 non-v1 API routes are listed, not read.

## 9 · Surfaces no role owns

**Web, before or beside sign-in (no `(app)` shell):** `/` (sign-in or home redirect), `/login`, `/login/code`, `/register` (a school registers itself, held until the operator checks it), `/register/recruiter`, `/forgot`, `/first-signin`, `/invite/[token]`, `/join`, `/join/parent`, `/join/student`, `/join/waiting`, `/magic` (route), `/verify`, `/switch` (choose school and role), `/suspended`, `/offline`, `/privacy`, `/delete-account`, `/survey/[token]`, `/expert/invite/[token]`, `/certificates/check`, `/certificates/exam`, `/public/disclosure/[slug]`, `/public/faculty/[slug]`, `/health` (route), and the superuser-only `/dev/mailbox`, `/dev/payments`.

**Any signed-in role (61 pages, role decided in code):** the account (`/account`, `/account/leave`, `/account/attendance`, `/account/items`, `/account/payslips`, `/account/merge`), `/notifications`, the feed (`/bulletin`, `/bulletin/new`, `/bulletin/[postId]`, `/bulletin/global`, `/bulletin/celebrations`), conversations (`/remarks`, `/remarks/new`, `/remarks/people`, `/remarks/c/[conversationId]`, `/remarks/[threadId]`), `/mentoring`, `/sessions`, `/competitions`, `/enquiries`, `/joins`, `/archive`, `/reviews`, `/exams`, `/report-cards`, `/record`, `/people/[membershipId]`, `/reports/[studentMembershipId]`, `/certificates/[certificateId]`, `/certificate/[recordId]`, `/fees/receipts/[receiptId]`, `/health/cards/[membershipId]`, `/explore`.

**Phone, before sign-in:** `(auth)/index` (login), `two-factor`, `magic-link`, `first-signin`, `recruiter-register`; the layouts decide the tab bar from `/api/v1/me` (`modules`, `duties`, `streams`).

**Jobs (18)**, run by `npm run job -- <name>` from a crontab: notifications:tidy, digest:weekly, files:reclaim, departures:run, health:digest, fees:remind, fees:reconcile, messages:send, circulars:deliver, gigs:remind, gigs:release, retention:sweep, admissions:expire-offers, accounts:tidy, jobs:watch, usage:sample, bank:stats, library:remind (`apps/web/src/lib/jobs.ts:48`). The college has no job of its own: its reminders ride `accounts:tidy` (the regulators' calendar, the weekly due reminders).

## Appendix A · Doors by role and module

| Role | Total | GET | Writes | Named in access | Signed-in passed | Own | Module-gated | College | Duty-gated | Phone-called |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN | 638 | 288 | 350 | 581 | 57 | 139 | 285 | 181 | 16 | 333 |
| PRINCIPAL | 353 | 246 | 107 | 296 | 57 | 11 | 146 | 103 | 7 | 212 |
| TEACHER | 179 | 87 | 92 | 122 | 57 | 19 | 14 | 0 | 0 | 159 |
| STUDENT | 166 | 85 | 81 | 109 | 57 | 38 | 42 | 35 | 0 | 153 |
| PARENT | 162 | 82 | 80 | 105 | 57 | 41 | 21 | 10 | 0 | 146 |
| EXPERT | 84 | 36 | 48 | 27 | 57 | 17 | 0 | 0 | 0 | 81 |
| DRIVER | 45 | 16 | 29 | 19 | 26 | 6 | 13 | 0 | 0 | 37 |
| LIBRARIAN | 74 | 31 | 43 | 48 | 26 | 0 | 39 | 9 | 0 | 47 |
| WARDEN | 71 | 30 | 41 | 45 | 26 | 1 | 36 | 7 | 0 | 43 |
| ALUMNUS | 53 | 20 | 33 | 20 | 33 | 10 | 13 | 7 | 0 | 47 |
| FACULTY | 114 | 52 | 62 | 80 | 34 | 0 | 72 | 60 | 18 | 73 |
| HOD | 137 | 63 | 74 | 103 | 34 | 4 | 92 | 83 | 18 | 81 |
| EXAM_CONTROLLER | 93 | 33 | 60 | 62 | 31 | 31 | 56 | 49 | 1 | 43 |
| IQAC | 94 | 44 | 50 | 63 | 31 | 2 | 56 | 50 | 0 | 41 |
| TPO | 72 | 30 | 42 | 41 | 31 | 10 | 35 | 28 | 0 | 40 |
| ACCOUNTS | 143 | 63 | 80 | 112 | 31 | 0 | 56 | 25 | 0 | 57 |
| RECRUITER | 43 | 15 | 28 | 17 | 26 | 14 | 3 | 16 | 0 | 29 |

| Role | ungated | TRANSPORT | LIBRARY | HOSTEL | INVENTORY | PAYROLL | ALUMNI | ACADEMICS | EXAMS | IQAC | PLACEMENT | ADMISSIONS | SCHOLARSHIPS |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN | 353 | 16 | 36 | 31 | 25 | 21 | 10 | 46 | 15 | 51 | 12 | 17 | 5 |
| PRINCIPAL | 207 | 5 | 18 | 13 | 12 | 8 | 4 | 22 | 16 | 25 | 12 | 8 | 3 |
| TEACHER | 165 | 0 | 5 | 0 | 3 | 4 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| STUDENT | 124 | 1 | 7 | 4 | 0 | 0 | 0 | 8 | 6 | 4 | 9 | 0 | 3 |
| PARENT | 141 | 2 | 5 | 5 | 0 | 0 | 0 | 1 | 3 | 2 | 2 | 0 | 1 |
| EXPERT | 84 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| DRIVER | 32 | 6 | 0 | 0 | 3 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| LIBRARIAN | 35 | 0 | 32 | 0 | 3 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| WARDEN | 35 | 0 | 0 | 29 | 3 | 4 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| ALUMNUS | 40 | 0 | 0 | 0 | 0 | 0 | 11 | 0 | 0 | 2 | 0 | 0 | 0 |
| FACULTY | 42 | 0 | 7 | 0 | 4 | 4 | 0 | 29 | 4 | 19 | 5 | 0 | 0 |
| HOD | 45 | 0 | 7 | 0 | 4 | 4 | 0 | 42 | 4 | 24 | 7 | 0 | 0 |
| EXAM_CONTROLLER | 37 | 0 | 0 | 0 | 3 | 4 | 0 | 1 | 48 | 0 | 0 | 0 | 0 |
| IQAC | 38 | 0 | 4 | 2 | 3 | 4 | 0 | 0 | 0 | 41 | 2 | 0 | 0 |
| TPO | 37 | 0 | 0 | 0 | 3 | 4 | 1 | 0 | 0 | 0 | 27 | 0 | 0 |
| ACCOUNTS | 87 | 1 | 0 | 1 | 24 | 21 | 0 | 0 | 0 | 0 | 0 | 4 | 5 |
| RECRUITER | 40 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 | 0 |

## Appendix B · Web pages by role (explicit ownership)

Every `page.tsx` attributed to a role by its gate, its NAV coverage or its segment, beyond the menu entries shown in section 4. Generic any-signed-in pages are in section 9.

- **ADMIN** (186 pages): `/accounts`, `/accounts/concessions`, `/accounts/no-dues`, `/accounts/scholarships`, `/accounts/structures`, `/accounts/students`, `/admin`, `/admin/academics`, `/admin/academics/attendance`, `/admin/academics/condonations`, `/admin/academics/offerings`, `/admin/academics/programmes`, `/admin/academics/registration`, `/admin/academics/students`, `/admin/academics/substitutions`, `/admin/academics/terms`, `/admin/academics/timetable`, `/admin/admissions`, `/admin/admissions/[cycleId]`, `/admin/admissions/applications`, `/admin/admissions/applications/[applicationId]`, `/admin/admissions/applications/new`, `/admin/admissions/new`, `/admin/alumni`, `/admin/alumni/college`, `/admin/attendance`, `/admin/calendar`, `/admin/certificates`, `/admin/certificates/[templateId]`, `/admin/certificates/issue`, `/admin/certificates/issued`, `/admin/certificates/new`, `/admin/circulars`, `/admin/classes`, `/admin/classes/[classId]`, `/admin/classes/new`, `/admin/college-admissions`, `/admin/college-admissions/[applicationId]`, `/admin/college-admissions/refunds`, `/admin/college-campus`, `/admin/committees`, `/admin/directory`, `/admin/exams`, `/admin/faculty-records`, `/admin/fees`, `/admin/fees/claims`, `/admin/fees/dues`, `/admin/fees/heads`, `/admin/fees/pupils/[studentMembershipId]`, `/admin/fees/settings`, `/admin/fees/structures`, `/admin/fees/structures/[structureId]`, `/admin/fees/structures/new`, `/admin/filings`, `/admin/hostel`, `/admin/incidents`, `/admin/intake`, `/admin/inventory`, `/admin/inventory/assets`, `/admin/inventory/assets/[tag]`, `/admin/inventory/items`, `/admin/inventory/movements`, `/admin/inventory/purchases`, `/admin/inventory/reports`, `/admin/inventory/requests`, `/admin/inventory/setup`, `/admin/invites`, `/admin/invites/new`, `/admin/library`, `/admin/messaging`, `/admin/messaging/[broadcastId]`, `/admin/messaging/new`, `/admin/payroll`, `/admin/payroll/advances`, `/admin/payroll/runs/[month]`, `/admin/payroll/salaries`, `/admin/payroll/settings`, `/admin/payroll/statement/[membershipId]`, `/admin/payroll/structures`, `/admin/people`, `/admin/promotion`, `/admin/records`, `/admin/records/[membershipId]`, `/admin/report-cards`, `/admin/reviews`, `/admin/safety`, `/admin/sessions`, `/admin/settings`, `/admin/settings/college`, `/admin/settings/feed`, `/admin/settings/modules`, `/admin/signatures`, `/admin/staff-attendance`, `/admin/stream-records`, `/admin/stream-records/lab-batches`, `/admin/stream-records/moot-courts`, `/admin/stream-records/practicals`, `/admin/substitutions`, `/admin/substitutions/print`, `/admin/syllabus`, `/admin/syllabus/coverage`, `/admin/timetable`, `/admin/transport`, `/admin/transport/trips/[tripId]`, `/admin/vacancies`, `/admin/vacancies/new`, `/alumni/directory`, `/attendance/history`, `/certificates/check`, `/certificates/exam`, `/competitions/new`, `/duties/anti-ragging`, `/exam-cell`, `/exam-cell/after`, `/exam-cell/analytics`, `/exam-cell/sessions/[sessionId]`, `/exam-cell/sessions/[sessionId]/conduct`, `/exam-cell/sessions/[sessionId]/export`, `/exam-cell/sessions/[sessionId]/logistics`, `/exam-cell/sessions/[sessionId]/marks`, `/exam-cell/sessions/[sessionId]/results`, `/exam-cell/sessions/[sessionId]/seating/[scheduleId]`, `/experts`, `/hostel`, `/hostel/expulsions`, `/hostel/incidents`, `/hostel/leave`, `/hostel/menu`, `/hostel/night`, `/hostel/rollcall`, `/hostel/rooms`, `/hostel/squad`, `/hostel/visitors`, `/incidents/[incidentId]`, `/incidents/new`, `/iqac`, `/iqac/documents`, `/iqac/documents/[kind]`, `/iqac/grievances`, `/iqac/predictor`, `/iqac/registers`, `/iqac/surveys`, `/iqac/surveys/[surveyId]`, `/library`, `/library/catalogue`, `/library/college`, `/library/fines`, `/library/members/[membershipId]`, `/library/overdue`, `/library/reports`, `/library/reservations`, `/library/stocktake`, `/library/titles/[titleId]`, `/placement`, `/placement/analytics`, `/placement/companies`, `/placement/drives`, `/placement/drives/[driveId]`, `/placement/drives/new`, `/placement/internships`, `/placement/students`, `/principal`, `/principal/classes`, `/principal/classes/[classId]`, `/principal/college`, `/principal/decisions`, `/principal/leave`, `/principal/staff`, `/principal/staff/[membershipId]/appraisal`, `/principal/timetable`, `/principal/trends`, `/teacher`, `/teacher/appraisals`, `/teacher/assignments`, `/teacher/assignments/[assignmentId]`, `/teacher/assignments/new`, `/teacher/attendance`, `/teacher/attendance/me`, `/teacher/classes`, `/teacher/classes/[classId]`, `/teacher/classes/[classId]/analytics`, `/teacher/classes/[classId]/report-cards`, `/teacher/classes/[classId]/syllabus`, `/teacher/exams`, `/vacancies`, `/vacancies/[postingId]`
- **PRINCIPAL** (155 pages): `/accounts`, `/accounts/concessions`, `/accounts/no-dues`, `/accounts/scholarships`, `/accounts/structures`, `/accounts/students`, `/admin/academics`, `/admin/academics/attendance`, `/admin/academics/condonations`, `/admin/academics/offerings`, `/admin/academics/programmes`, `/admin/academics/registration`, `/admin/academics/students`, `/admin/academics/substitutions`, `/admin/academics/terms`, `/admin/academics/timetable`, `/admin/admissions`, `/admin/admissions/[cycleId]`, `/admin/admissions/applications`, `/admin/admissions/applications/[applicationId]`, `/admin/admissions/applications/new`, `/admin/alumni`, `/admin/alumni/college`, `/admin/calendar`, `/admin/certificates`, `/admin/certificates/[templateId]`, `/admin/certificates/issue`, `/admin/certificates/issued`, `/admin/circulars`, `/admin/college-admissions`, `/admin/college-admissions/[applicationId]`, `/admin/college-admissions/refunds`, `/admin/college-campus`, `/admin/committees`, `/admin/faculty-records`, `/admin/fees`, `/admin/fees/dues`, `/admin/fees/pupils/[studentMembershipId]`, `/admin/fees/structures`, `/admin/fees/structures/[structureId]`, `/admin/filings`, `/admin/hostel`, `/admin/incidents`, `/admin/inventory`, `/admin/inventory/assets`, `/admin/inventory/assets/[tag]`, `/admin/inventory/items`, `/admin/inventory/movements`, `/admin/inventory/purchases`, `/admin/inventory/reports`, `/admin/inventory/requests`, `/admin/inventory/setup`, `/admin/library`, `/admin/messaging`, `/admin/messaging/[broadcastId]`, `/admin/payroll`, `/admin/payroll/advances`, `/admin/payroll/runs/[month]`, `/admin/payroll/salaries`, `/admin/payroll/settings`, `/admin/payroll/statement/[membershipId]`, `/admin/payroll/structures`, `/admin/records`, `/admin/records/[membershipId]`, `/admin/report-cards`, `/admin/reviews`, `/admin/sessions`, `/admin/settings/college`, `/admin/settings/feed`, `/admin/settings/modules`, `/admin/signatures`, `/admin/staff-attendance`, `/admin/stream-records`, `/admin/stream-records/lab-batches`, `/admin/stream-records/moot-courts`, `/admin/stream-records/practicals`, `/admin/substitutions`, `/admin/substitutions/print`, `/admin/syllabus`, `/admin/syllabus/coverage`, `/admin/transport`, `/admin/transport/trips/[tripId]`, `/admin/vacancies`, `/alumni/directory`, `/attendance/history`, `/certificates/check`, `/certificates/exam`, `/duties/anti-ragging`, `/exam-cell`, `/exam-cell/after`, `/exam-cell/analytics`, `/exam-cell/sessions/[sessionId]`, `/exam-cell/sessions/[sessionId]/conduct`, `/exam-cell/sessions/[sessionId]/export`, `/exam-cell/sessions/[sessionId]/logistics`, `/exam-cell/sessions/[sessionId]/marks`, `/exam-cell/sessions/[sessionId]/results`, `/exam-cell/sessions/[sessionId]/seating/[scheduleId]`, `/hostel`, `/hostel/expulsions`, `/hostel/incidents`, `/hostel/leave`, `/hostel/menu`, `/hostel/night`, `/hostel/rollcall`, `/hostel/rooms`, `/hostel/squad`, `/hostel/visitors`, `/incidents/[incidentId]`, `/incidents/new`, `/iqac`, `/iqac/documents`, `/iqac/documents/[kind]`, `/iqac/grievances`, `/iqac/predictor`, `/iqac/registers`, `/iqac/surveys`, `/iqac/surveys/[surveyId]`, `/library`, `/library/catalogue`, `/library/college`, `/library/fines`, `/library/members/[membershipId]`, `/library/overdue`, `/library/reports`, `/library/reservations`, `/library/stocktake`, `/library/titles/[titleId]`, `/placement`, `/placement/analytics`, `/placement/companies`, `/placement/drives`, `/placement/drives/[driveId]`, `/placement/drives/new`, `/placement/internships`, `/placement/students`, `/principal`, `/principal/accreditation`, `/principal/classes`, `/principal/classes/[classId]`, `/principal/college`, `/principal/decisions`, `/principal/leave`, `/principal/staff`, `/principal/staff/[membershipId]/appraisal`, `/principal/timetable`, `/principal/trends`, `/teacher/appraisals`, `/teacher/attendance/me`, `/teacher/classes/[classId]/analytics`, `/teacher/classes/[classId]/report-cards`, `/teacher/classes/[classId]/syllabus`, `/teacher/leave`, `/vacancies`, `/vacancies/[postingId]`
- **TEACHER** (34 pages): `/alumni/directory`, `/attendance/history`, `/experts`, `/incidents/[incidentId]`, `/incidents/new`, `/teacher`, `/teacher/appraisals`, `/teacher/assignments`, `/teacher/assignments/[assignmentId]`, `/teacher/assignments/new`, `/teacher/attendance`, `/teacher/attendance/me`, `/teacher/classes`, `/teacher/classes/[classId]`, `/teacher/classes/[classId]/analytics`, `/teacher/classes/[classId]/report-cards`, `/teacher/classes/[classId]/syllabus`, `/teacher/contributions`, `/teacher/contributions/[contributionId]`, `/teacher/contributions/new`, `/teacher/exams`, `/teacher/guidance`, `/teacher/incidents`, `/teacher/leave`, `/teacher/library`, `/teacher/meetings`, `/teacher/practice`, `/teacher/profile`, `/teacher/signatures`, `/teacher/worksheets`, `/teacher/worksheets/print`, `/timetable`, `/vacancies`, `/vacancies/[postingId]`
- **STUDENT** (32 pages): `/certificates/check`, `/certificates/exam`, `/library/e-resources`, `/report-cards`, `/student`, `/student/academics`, `/student/academics/[offeringId]`, `/student/account`, `/student/agenda`, `/student/assignments`, `/student/certificates`, `/student/consent`, `/student/exams`, `/student/fees`, `/student/grades`, `/student/health`, `/student/hostel`, `/student/incidents`, `/student/library`, `/student/money`, `/student/placement`, `/student/practice`, `/student/practice/[slug]`, `/student/practice/journey`, `/student/practice/revision`, `/student/profile`, `/student/record`, `/student/registration`, `/student/scholarships`, `/student/voice`, `/student/work`, `/timetable`
- **PARENT** (27 pages): `/certificates/check`, `/certificates/exam`, `/parent`, `/parent/academics`, `/parent/agenda`, `/parent/assignments`, `/parent/attendance`, `/parent/certificates`, `/parent/claims`, `/parent/fees`, `/parent/grades`, `/parent/health`, `/parent/homework`, `/parent/hostel`, `/parent/incidents`, `/parent/library`, `/parent/meetings`, `/parent/money`, `/parent/placement`, `/parent/practice`, `/parent/record`, `/parent/results`, `/parent/settings`, `/parent/timetable`, `/parent/transport`, `/parent/voice`, `/report-cards`
- **EXPERT** (7 pages): `/expert`, `/expert/availability`, `/expert/bookings/[bookingId]`, `/expert/earnings`, `/expert/invite/[token]`, `/expert/profile`, `/expert/sessions`
- **DRIVER** (1 pages): `/driver`
- **LIBRARIAN** (11 pages): `/accounts/no-dues`, `/library`, `/library/catalogue`, `/library/college`, `/library/fines`, `/library/members/[membershipId]`, `/library/overdue`, `/library/reports`, `/library/reservations`, `/library/stocktake`, `/library/titles/[titleId]`
- **WARDEN** (12 pages): `/accounts/no-dues`, `/hostel`, `/hostel/expulsions`, `/hostel/health/[allotmentId]`, `/hostel/incidents`, `/hostel/leave`, `/hostel/menu`, `/hostel/night`, `/hostel/rollcall`, `/hostel/rooms`, `/hostel/squad`, `/hostel/visitors`
- **ALUMNUS** (7 pages): `/alumni`, `/alumni/college`, `/alumni/directory`, `/alumni/papers`, `/alumni/share`, `/alumni/staff`, `/alumni/survey`
- **FACULTY** (20 pages): `/duties/anti-ragging`, `/duties/clinical`, `/duties/exam-squad`, `/duties/lab`, `/duties/ncc`, `/duties/nss`, `/duties/research`, `/duties/studio`, `/duties/teaching-practice`, `/faculty`, `/faculty/exams`, `/faculty/lectures/[lectureId]`, `/faculty/mentoring`, `/faculty/offerings/[offeringId]`, `/faculty/practicals`, `/faculty/profile`, `/faculty/research`, `/faculty/supervision`, `/iqac/surveys/[surveyId]`, `/library/e-resources`
- **HOD** (28 pages): `/accounts/no-dues`, `/duties/anti-ragging`, `/duties/clinical`, `/duties/exam-squad`, `/duties/lab`, `/duties/ncc`, `/duties/nss`, `/duties/research`, `/duties/studio`, `/duties/teaching-practice`, `/faculty`, `/faculty/exams`, `/faculty/lectures/[lectureId]`, `/faculty/mentoring`, `/faculty/offerings/[offeringId]`, `/faculty/practicals`, `/faculty/profile`, `/faculty/research`, `/faculty/supervision`, `/hod`, `/hod/condonations`, `/hod/defaulters`, `/hod/nba`, `/hod/practicals`, `/hod/projects`, `/hod/research`, `/iqac/surveys/[surveyId]`, `/library/e-resources`
- **EXAM_CONTROLLER** (11 pages): `/duties/exam-squad`, `/exam-cell`, `/exam-cell/after`, `/exam-cell/analytics`, `/exam-cell/sessions/[sessionId]`, `/exam-cell/sessions/[sessionId]/conduct`, `/exam-cell/sessions/[sessionId]/export`, `/exam-cell/sessions/[sessionId]/logistics`, `/exam-cell/sessions/[sessionId]/marks`, `/exam-cell/sessions/[sessionId]/results`, `/exam-cell/sessions/[sessionId]/seating/[scheduleId]`
- **IQAC** (10 pages): `/admin/faculty-records`, `/iqac`, `/iqac/documents`, `/iqac/documents/[kind]`, `/iqac/grievances`, `/iqac/predictor`, `/iqac/registers`, `/iqac/surveys`, `/iqac/surveys/[surveyId]`, `/placement/analytics`
- **TPO** (8 pages): `/placement`, `/placement/analytics`, `/placement/companies`, `/placement/drives`, `/placement/drives/[driveId]`, `/placement/drives/new`, `/placement/internships`, `/placement/students`
- **ACCOUNTS** (23 pages): `/accounts`, `/accounts/concessions`, `/accounts/no-dues`, `/accounts/scholarships`, `/accounts/structures`, `/accounts/students`, `/admin/fees`, `/admin/inventory`, `/admin/inventory/assets`, `/admin/inventory/assets/[tag]`, `/admin/inventory/items`, `/admin/inventory/movements`, `/admin/inventory/purchases`, `/admin/inventory/reports`, `/admin/inventory/requests`, `/admin/inventory/setup`, `/admin/payroll`, `/admin/payroll/advances`, `/admin/payroll/runs/[month]`, `/admin/payroll/salaries`, `/admin/payroll/settings`, `/admin/payroll/statement/[membershipId]`, `/admin/payroll/structures`
- **RECRUITER** (2 pages): `/recruiter`, `/recruiter/drives/[driveId]`

## Appendix C · Phone screens and who reaches them

| Screen (apps/mobile/src/app/(app)/…) | Roles whose tab bar or More sheet lists it |
| --- | --- |
| `academics` | PARENT, STUDENT |
| `academics-mentoring` | FACULTY, HOD |
| `account` | ACCOUNTS, ADMIN, ALUMNUS, DRIVER, EXAM_CONTROLLER, EXPERT, FACULTY, HOD, IQAC, LIBRARIAN, PARENT, PRINCIPAL, RECRUITER, STUDENT, TEACHER, TPO, WARDEN |
| `accounts-lookup` | ACCOUNTS |
| `admission-slots` | reached from another screen or by a notification link |
| `admissions` | ADMIN, PRINCIPAL |
| `agenda` | PARENT, STUDENT |
| `alumni-college` | ALUMNUS |
| `alumni-directory` | ADMIN, ALUMNUS |
| `anti-ragging` | FACULTY, HOD |
| `appadmin` | reached from another screen or by a notification link |
| `application` | reached from another screen or by a notification link |
| `application-new` | reached from another screen or by a notification link |
| `applications` | reached from another screen or by a notification link |
| `apply` | reached from another screen or by a notification link |
| `archive` | ADMIN, PARENT, PRINCIPAL, STUDENT, TEACHER |
| `assignment` | reached from another screen or by a notification link |
| `assignments` | PARENT, STUDENT, TEACHER |
| `attendance` | ADMIN, PARENT, PRINCIPAL, TEACHER |
| `availability` | EXPERT |
| `avatar` | reached from another screen or by a notification link |
| `booking` | reached from another screen or by a notification link |
| `bulletin` | ACCOUNTS, ADMIN, ALUMNUS, EXAM_CONTROLLER, FACULTY, HOD, IQAC, PARENT, PRINCIPAL, STUDENT, TEACHER, TPO |
| `calendar` | ADMIN, PRINCIPAL |
| `certificate` | reached from another screen or by a notification link |
| `certificate-issue` | reached from another screen or by a notification link |
| `certificates` | ALUMNUS, PARENT, STUDENT |
| `circular-reach` | reached from another screen or by a notification link |
| `circulars` | ADMIN, PRINCIPAL |
| `class-analytics` | reached from another screen or by a notification link |
| `class-new` | reached from another screen or by a notification link |
| `classes/detail` | reached from another screen or by a notification link |
| `classes/index` | ADMIN, PRINCIPAL, TEACHER |
| `college` | ADMIN, PRINCIPAL |
| `college-exams` | PARENT, STUDENT |
| `competition-entries` | reached from another screen or by a notification link |
| `competition-new` | reached from another screen or by a notification link |
| `competitions/detail` | reached from another screen or by a notification link |
| `competitions/index` | ADMIN, PARENT, PRINCIPAL, STUDENT, TEACHER |
| `consent` | STUDENT |
| `contribution` | reached from another screen or by a notification link |
| `contribution-queue` | reached from another screen or by a notification link |
| `contributions` | TEACHER |
| `decisions` | PRINCIPAL |
| `directory-profile` | ADMIN |
| `e-resources` | FACULTY, HOD |
| `enquiries/detail` | reached from another screen or by a notification link |
| `enquiries/index` | ADMIN, PARENT, PRINCIPAL, TEACHER |
| `exam-duties` | FACULTY, HOD |
| `exam-squad` | EXAM_CONTROLLER, FACULTY, HOD |
| `exams` | ADMIN, PARENT, PRINCIPAL, STUDENT, TEACHER |
| `experts` | ADMIN, TEACHER |
| `explore` | PARENT |
| `family-incidents` | PARENT, STUDENT |
| `fee-claims` | reached from another screen or by a notification link |
| `fee-pupil` | reached from another screen or by a notification link |
| `fees` | ADMIN, PARENT, PRINCIPAL, STUDENT |
| `fees-dues` | reached from another screen or by a notification link |
| `filings` | ADMIN, PRINCIPAL |
| `health` | PARENT, STUDENT |
| `hostel` | PARENT, STUDENT |
| `incident` | reached from another screen or by a notification link |
| `incident-new` | reached from another screen or by a notification link |
| `incidents` | ADMIN, PRINCIPAL, TEACHER |
| `index` | ACCOUNTS, ADMIN, ALUMNUS, DRIVER, EXAM_CONTROLLER, EXPERT, FACULTY, HOD, IQAC, LIBRARIAN, PARENT, PRINCIPAL, RECRUITER, STUDENT, TEACHER, TPO, WARDEN |
| `intake` | reached from another screen or by a notification link |
| `inventory` | ADMIN, PRINCIPAL |
| `invites` | ADMIN |
| `joins` | ADMIN, PARENT, PRINCIPAL, TEACHER |
| `lab-desk` | FACULTY, HOD |
| `leave` | ACCOUNTS, ADMIN, DRIVER, EXAM_CONTROLLER, FACULTY, HOD, IQAC, LIBRARIAN, PRINCIPAL, TEACHER, TPO, WARDEN |
| `lecture` | reached from another screen or by a notification link |
| `lecture-substitutions` | HOD |
| `library` | PARENT, STUDENT, TEACHER |
| `link-child` | reached from another screen or by a notification link |
| `marks` | reached from another screen or by a notification link |
| `meetings` | PARENT, TEACHER |
| `mentoring-setup` | reached from another screen or by a notification link |
| `mentoring/index` | ADMIN, EXPERT, PARENT, STUDENT, TEACHER |
| `mentoring/thread` | reached from another screen or by a notification link |
| `messages/index` | ADMIN, ALUMNUS, FACULTY, HOD, PARENT, PRINCIPAL, STUDENT, TEACHER |
| `messages/room` | reached from another screen or by a notification link |
| `messages/thread` | reached from another screen or by a notification link |
| `messaging` | ADMIN, PRINCIPAL |
| `messaging-broadcast` | reached from another screen or by a notification link |
| `messaging-new` | reached from another screen or by a notification link |
| `moderation` | reached from another screen or by a notification link |
| `money` | PARENT, STUDENT |
| `more` | reached from another screen or by a notification link |
| `my-application` | reached from another screen or by a notification link |
| `my-applications` | PARENT |
| `my-appraisals` | TEACHER |
| `my-attendance` | ACCOUNTS, DRIVER, EXAM_CONTROLLER, FACULTY, HOD, IQAC, LIBRARIAN, TEACHER, TPO, WARDEN |
| `my-covers` | TEACHER |
| `ncc` | FACULTY, HOD |
| `notifications` | reached from another screen or by a notification link |
| `nss` | FACULTY, HOD |
| `offering` | reached from another screen or by a notification link |
| `operator` | reached from another screen or by a notification link |
| `operator-metrics` | reached from another screen or by a notification link |
| `operator-new-school` | reached from another screen or by a notification link |
| `operator-payouts` | reached from another screen or by a notification link |
| `operator-school` | reached from another screen or by a notification link |
| `payroll` | ADMIN, PRINCIPAL |
| `payslips` | ACCOUNTS, ADMIN, DRIVER, EXAM_CONTROLLER, FACULTY, HOD, IQAC, LIBRARIAN, PRINCIPAL, TEACHER, TPO, WARDEN |
| `people` | ADMIN |
| `person` | reached from another screen or by a notification link |
| `placement` | STUDENT |
| `placement-drive` | reached from another screen or by a notification link |
| `post` | reached from another screen or by a notification link |
| `post-new` | reached from another screen or by a notification link |
| `practicals` | FACULTY, HOD |
| `practice` | PARENT, STUDENT, TEACHER |
| `profile` | EXPERT, STUDENT, TEACHER |
| `pupil-health` | reached from another screen or by a notification link |
| `pupil-record` | reached from another screen or by a notification link |
| `pupil-records` | ADMIN, PRINCIPAL |
| `question-bank` | reached from another screen or by a notification link |
| `quiz` | reached from another screen or by a notification link |
| `record` | reached from another screen or by a notification link |
| `recruiter-drive` | reached from another screen or by a notification link |
| `registration` | STUDENT |
| `remark-new` | reached from another screen or by a notification link |
| `report` | reached from another screen or by a notification link |
| `report-card-rules` | ADMIN, PRINCIPAL |
| `report-cards` | reached from another screen or by a notification link |
| `research-desk` | FACULTY, HOD |
| `reviews` | ADMIN, PARENT, PRINCIPAL, STUDENT |
| `safety` | ADMIN |
| `scholarships` | STUDENT |
| `school` | reached from another screen or by a notification link |
| `search` | reached from another screen or by a notification link |
| `sessions` | ADMIN, EXPERT, PARENT, PRINCIPAL, STUDENT, TEACHER |
| `settings` | ADMIN, PARENT |
| `signatures` | ADMIN, PRINCIPAL, TEACHER |
| `staff` | ADMIN, PRINCIPAL |
| `staff-appraisal` | reached from another screen or by a notification link |
| `staff-attendance` | ADMIN, PRINCIPAL |
| `staff-certificates` | ADMIN, PRINCIPAL |
| `staff-record` | reached from another screen or by a notification link |
| `student-account` | STUDENT |
| `substitutions` | ADMIN, PRINCIPAL |
| `syllabus` | reached from another screen or by a notification link |
| `syllabus-coverage` | ADMIN, PRINCIPAL |
| `teaching` | HOD |
| `teaching-practice` | FACULTY, HOD |
| `timetable` | ADMIN, PARENT, PRINCIPAL, STUDENT, TEACHER |
| `timetable-editor` | reached from another screen or by a notification link |
| `transport` | PARENT |
| `trends` | ADMIN, PRINCIPAL |
| `vacancies` | ADMIN, PRINCIPAL, TEACHER |
| `vacancy` | reached from another screen or by a notification link |
| `voice` | ALUMNUS, FACULTY, HOD, PARENT, STUDENT |
| `worksheets` | reached from another screen or by a notification link |

## Appendix D · The 52 phone link-outs (More entries that open the web)

| Role | Entry | Opens | Module |
| --- | --- | --- | --- |
| ADMIN | Transport | `/admin/transport` | TRANSPORT |
| ADMIN | Alumni | `/admin/alumni` | ALUMNI |
| ADMIN | Library | `/library` | LIBRARY |
| ADMIN | Hostel | `/admin/hostel` | HOSTEL |
| ADMIN | Academics | `/admin/academics` | ACADEMICS |
| ADMIN | College admissions | `/admin/college-admissions` | ADMISSIONS |
| ADMIN | Accounts | `/accounts` | ACADEMICS |
| ADMIN | Library, hostel and bus | `/admin/college-campus` | ACADEMICS |
| ADMIN | Exam cell | `/exam-cell` | EXAMS |
| ADMIN | Placement | `/placement` | PLACEMENT |
| ADMIN | IQAC desk | `/iqac` | IQAC |
| ADMIN | Committees and minutes | `/admin/committees` | IQAC |
| ADMIN | Faculty records | `/admin/faculty-records` | IQAC |
| PRINCIPAL | Transport | `/admin/transport` | TRANSPORT |
| PRINCIPAL | Library | `/library/reports` | LIBRARY |
| PRINCIPAL | Hostel | `/admin/hostel` | HOSTEL |
| PRINCIPAL | Academics | `/admin/academics` | ACADEMICS |
| PRINCIPAL | Accounts | `/accounts` | ACADEMICS |
| PRINCIPAL | College admissions | `/admin/college-admissions` | ADMISSIONS |
| PRINCIPAL | Exam cell | `/exam-cell` | EXAMS |
| PRINCIPAL | Placement | `/placement` | PLACEMENT |
| PRINCIPAL | Accreditation file | `/principal/accreditation` | IQAC |
| PRINCIPAL | Committees and minutes | `/admin/committees` | IQAC |
| PRINCIPAL | Faculty records | `/admin/faculty-records` | IQAC |
| PARENT | Placement | `/parent/placement` | — |
| LIBRARIAN | Catalogue | `/library/catalogue` | LIBRARY |
| LIBRARIAN | Fines | `/library/fines` | LIBRARY |
| LIBRARIAN | Reports | `/library/reports` | LIBRARY |
| WARDEN | Rooms | `/hostel/rooms` | HOSTEL |
| WARDEN | Mess menu | `/hostel/menu` | HOSTEL |
| WARDEN | Incidents | `/hostel/incidents` | HOSTEL |
| ALUMNUS | Your school record | `/record` | — |
| IQAC | NAAC predictor | `/iqac/predictor` | IQAC |
| IQAC | Filings | `/iqac/documents` | IQAC |
| IQAC | Surveys | `/iqac/surveys` | IQAC |
| IQAC | Research and activities | `/iqac/registers` | IQAC |
| IQAC | Grievances | `/iqac/grievances` | IQAC |
| IQAC | Faculty records | `/admin/faculty-records` | IQAC |
| IQAC | Placement table | `/placement/analytics` | PLACEMENT |
| TPO | Drives | `/placement/drives` | PLACEMENT |
| TPO | Students | `/placement/students` | PLACEMENT |
| TPO | Companies | `/placement/companies` | PLACEMENT |
| TPO | Internships | `/placement/internships` | PLACEMENT |
| TPO | Placement table | `/placement/analytics` | PLACEMENT |
| ACCOUNTS | Fee structures | `/accounts/structures` | — |
| ACCOUNTS | Scholarships | `/accounts/scholarships` | SCHOLARSHIPS |
| ACCOUNTS | No-dues | `/accounts/no-dues` | — |
| ACCOUNTS | Concessions | `/accounts/concessions` | — |
| ACCOUNTS | A student's account | `/accounts/students` | — |
| ACCOUNTS | Fee ledger | `/admin/fees` | — |
| ACCOUNTS | HR and payroll | `/admin/payroll` | PAYROLL |
| ACCOUNTS | Inventory and assets | `/admin/inventory` | INVENTORY |

## Appendix E · Door lists per duty and per stream desk

- **LAB_INCHARGE** (2): `GET /duties/lab [ADMIN,PRINCIPAL,FACULTY,HOD]`; `POST /duties/lab/breakage [ADMIN,FACULTY,HOD]`
- **CLINICAL_COORDINATOR** (0): none
- **PRACTICE_TEACHING_COORDINATOR** (4): `GET /duties/teaching-practice [ADMIN,PRINCIPAL,FACULTY,HOD]`; `POST /duties/teaching-practice/schools [ADMIN,FACULTY,HOD]`; `POST /duties/teaching-practice/postings [ADMIN,FACULTY,HOD]`; `POST /duties/teaching-practice/postings/{postingId}/observations [FACULTY,HOD]`
- **STUDIO_COORDINATOR** (0): none
- **NSS_OFFICER** (4): `GET /duties/nss [ADMIN,PRINCIPAL,FACULTY,HOD]`; `POST /duties/nss/enrolments [ADMIN,FACULTY,HOD]`; `POST /duties/nss/leave [ADMIN,FACULTY,HOD]`; `POST /duties/nss/activities [ADMIN,FACULTY,HOD]`
- **NCC_OFFICER** (4): `GET /duties/ncc [ADMIN,PRINCIPAL,FACULTY,HOD]`; `POST /duties/ncc/enrolments [ADMIN,FACULTY,HOD]`; `POST /duties/ncc/leave [ADMIN,FACULTY,HOD]`; `POST /duties/ncc/activities [ADMIN,FACULTY,HOD]`
- **ANTI_RAGGING_SQUAD** (1): `GET /duties/anti-ragging [ADMIN,PRINCIPAL,FACULTY,HOD]`
- **RESEARCH_DEAN** (1): `GET /duties/research [ADMIN,PRINCIPAL,FACULTY,HOD]`
- **EXAM_SQUAD** (2): `GET /duties/exam-squad [ADMIN,PRINCIPAL,EXAM_CONTROLLER,FACULTY,HOD]`; `POST /duties/exam-squad/visits [FACULTY,HOD]`

*End of inventory. Summary for the audit's coordinator: `scratchpad/reports/audit3-inventory.md`.*
