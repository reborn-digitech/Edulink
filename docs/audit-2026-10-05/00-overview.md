# 00 · Overview of the audit of 5 October 2026

The entry point to this folder. It says what the owner asked, who did what and on which model, what the
four layers found, what the three fix commits closed, what stays open and what was never run, and how to
run each layer again. The numbers are counted from the status cells of `02-findings.md` and the commit
list; the detail is in the numbered files.

| File | What it holds |
| --- | --- |
| `01-inventory.md` | Every feature, role, screen, API door and journey on web and phone, with the parity table (layer I). |
| `02-findings.md` | The one prioritised list, 86 rows, each with its status. |
| `03-security.md`, `04-journeys.md`, `05-states.md` | The three other layers' reports in full, with their "by design", "environment" and "untested" lists. |
| `08-remaining-risks.md` | Decisions and risks that are not fixes, each with an owner and a recommended option (R-1 to R-63, G4-1 to G4-34). |
| `09-changelog.md` | One row per commit and set of findings closed, 54 rows including the closing row. |

(There is no 06 or 07: the numbering leaves room the audit did not need.)

## 1. What the owner asked

Reconstructed in substance from the briefs under the coordinator's scratchpad, not in the owner's own words.

**Request 2, accreditation insights and a simulator.** An "Actionable insights" section on every accreditation
page ("how to move from D to C and above", each step with a call to action) and a simulator where the IQAC
changes numbers and sees the grade, across the streams and the accreditations: NAAC on both manuals, the NBA
SAR per engineering department, and NIRF. Reuse the predictor's functions; never a second copy of a formula.

**Request 3, an audit, then its fixes.** First, map everything (every feature, role, screen, door and journey
on web and phone against the product's intent) and find what is wrong: the security of everything added since
the 4 October campaign, the critical journeys clicked through end to end in a browser and on the phone, and
the empty, error and loading states, accessibility and UI consistency. Put every confirmed finding in one
prioritised list, with severity, roles, platform and an owner for the fix. Then fix it in waves: the Critical
and High findings and the security mediums first; the UI alignment pass (spacing, overflow, responsive layout,
inconsistent components, states and copy); and the required missing functionality, validation, permission and
parity fixes with the Medium clean-up. Close with this overview, the change-log hashes, the numbers in
HANDOFF.md and one convention fix: the phone printed 24-hour times where the web prints AM/PM.

## 2. Who did it, and on which model

Models are as the briefs name them. The reasons are the coordinator's pattern as it shows in the briefs: Opus
where a wrong call costs most (code that writes, security reasoning, a journey that must be judged as a user
would judge it), Sonnet where the work is breadth, extraction, measuring or collation against a checklist.

| Task | Model | Why |
| --- | --- | --- |
| Insights engine, simulator, doors, model, pages | Opus | New arithmetic over the predictor's formulas, a tenant table, nine doors and the pages; one writer for the stored result. |
| Insights phone screens and the arithmetic tests | Sonnet | Mirrors a written contract; the tests are worked by hand against the engine. |
| Layer I, inventory | Sonnet | Static extraction from the catalog, the menus and the routes, then validation against the tree. |
| Layer S, security | Opus | Judging a diff of 408 files for fences crossed, and probing live without touching real data. |
| Layer J, journeys | Opus | Clicking write flows to the end as each role and judging whether they are right. |
| Layer E, states | Sonnet | Measuring thousands of renders against fixed checks; the judgement is in the thresholds. |
| Layer D, the findings documents | Sonnet | De-duplicating and sorting four reports; no new findings of its own. |
| Fix builder 1 (Critical, High, security mediums) | Opus | Changes the tenant fence, the error path and the matcher. |
| Fix builder 2 (UI alignment pass) | Opus | Wide mechanical change across 450 files that needs a design eye. |
| Fix builder 3 (functional, validation, permission, parity) | Opus | Business rules on money, admissions, exams and permissions. |
| This overview, the hashes, HANDOFF and the time format | Sonnet | Documentation from the reports, and one small formatter. |

## 3. The layers

All four audit layers ran against the tree at `ff6f928e` (the inventory against `7727b8b3`, its dumps taken
17:13 to 17:30 IST), with the dev servers on :3000 and :8081 shared, never stopped. Durations are wall-clock
from the time each brief was written to the time its report landed, so they include waiting on the shared
servers; the reports do not record active time. All times are 5 October 2026, IST.

| Layer | Method | What ran | Ids filed (high / medium / low / info) | From to |
| --- | --- | --- | --- | --- |
| I, inventory | Static, no server | 1,006 doors on 872 paths, 394 web pages, 154 phone screens, 321 web and 275 phone menu entries, about 150 journeys and ten cross-role ones, validated against the tree; parity 249 both, 51 phone-opens-web, 21 web-only | 14 (0 / 3 / 9 / 2) | 17:12 to 17:38, 26 min |
| S, security | Static review of `8210ba1e..HEAD` (408 files, +52,786 / -7,840) by four reviewers, then live probes | 75 role, duty and department probes, 26 stale-duty, ID-card, look-up and Origin probes, the forged-header and avatar probes; 35 minted sessions, none left | 15 (2 / 2 / 9 / 2); no critical | 17:12 to 18:21, 69 min |
| J, journeys | A Playwright driver, one browser context per actor, minted sessions; phone on the :8081 web target at 390 x 844 | 905 driver commands, about 500 clicks, fills and taps, 189 page loads; 7 school journeys, 19 college journeys, the simulator journey, 8 phone journeys, 9 wrong-role tries | 40 (2 / 14 / 24 / 0) as 02 counts them; the layer's own line says 2 / 15 / 23 | 17:12 to 20:10, 178 min |
| E, states | A walk by minted sessions at 1280 and 390 px, light and dark, in English and Marathi; told to wrap up within 30 minutes, so partial | 1,999 actor-route pairs, 5,037 web renders, 1,353 Marathi renders, 268 dynamic-id probes, 311 phone screen renders, the new accreditation pages | 18 (2 / 7 / 8 / 1) | 17:12 to 20:33, 201 min |
| D, the findings documents | Collation | 87 ids de-duplicated into 86 rows (A3-states-2 and A3-journeys-6 merged), the layers copied in and tidied | none of its own | 18:02 to 20:41 |

The insights work (request 2) ran in parallel from 17:11: the engine builder landed at 17:53 and the phone
helper at 17:42; the commit is at 18:00.

## 4. Findings, before and after the fixes

Before: 86 rows, all open (0 critical, 6 high, 25 medium, 50 low, 5 info). After, counted from the Status
cells of `02-findings.md` at the closing commit:

| Severity | Rows | fixed | partly fixed | wontfix | open |
| --- | --- | --- | --- | --- | --- |
| critical | 0 | 0 | 0 | 0 | 0 |
| high | 6 | 6 | 0 | 0 | 0 |
| medium | 25 | 25 | 0 | 0 | 0 |
| low | 50 | 44 | 2 | 1 | 3 |
| info | 5 | 2 | 1 | 0 | 2 |
| **Total** | **86** | **77** | **3** | **1** | **5** |

Every fix has a test that failed on the old code (the three fix commits say so row by row in
`09-changelog.md`). The one real fault found underneath the fixes is recorded as R-49: a library helper that
read through the bare client inside a tenant transaction found nothing under RLS and said so to no one; it
had made every revaluation fee silently not reach the ledger (A3-journeys-10), and other helpers may carry
the same fault.

## 5. The commits, in order

| Hash | What |
| --- | --- |
| `1479dec5` | Request 2: the insights engine, the simulator, scenarios, nine doors, the NAAC, NBA and NIRF pages, the phone's insights and scenarios screens (1,015 endpoints, 291 models, migration `20261005114955_iqac_scenarios`). |
| `ff6f928e` | The insights commit's three tables moved into `TableScroll` so the source rule passes. |
| `de278954` | The inventory, `01-inventory.md`. |
| `dc215602` | The findings documents: 02, 03, 04, 05, 08 and the empty 09. |
| `3a5b1da1` | The Critical and High fixes and the security mediums: 12 findings closed and one half closed, among them every card and button square since the Tailwind 4 bracket syntax (899 uses), a 500 on a stale id across twelve templates, parents never seeing class slips, a bad time zone taking down the operator's list, the ID card's avatar sink and a duty outliving its stream. |
| `a641052b` | The UI alignment pass: 43 loading skeletons, one control look (about 180 controls at 48 px), 27 more tables in `TableScroll`, insights and simulator layout, server-action forms that keep what was typed, copy and plural fixes, one date convention, the phone's 4xx and unknown-id states. |
| `62236666` | The functional, validation, permission and parity fixes and the Medium clean-up: 27 findings fixed, two partly, one declined; the revaluation fee repair, validation on offers, ages, scores, homework and sanctions, ACCOUNTS and moot-court parity, doors for ten web-only writes, `/id-check` for staff. |
| the closing commit | This refresh: this overview, the changelog hashes, HANDOFF.md and `docs/college.md`, and the phone's AM/PM time (`apps/mobile/src/lib/dates.ts`). |

## 6. What remains open, and who owns it

From the Status cells of `02-findings.md` and `08-remaining-risks.md` (sections A, F and the carried G4 list).

| Item | Owner | Recommended |
| --- | --- | --- |
| A3-journeys-21: no page checks a grade card by typing its code (open, low) | Owner (web pages) | Add a field on `/certificates/exam` that does not need `?school=`. |
| A3-inventory-10 and R-2: plan items with no code (appointment letters, pre-placement talks, soft skills, council notices, peer-team visits, reading room, biometric feed) | Owner | Record each as a plan item; build none before a pilot asks. |
| A3-inventory-14: pages with no door (celebrations, the student practice journey, the operator's school jobs) | Owner (web pages) | Give each a door or retire it. |
| A3-inventory-11 and R-6: the plan has the HOD approve faculty leave; the platform has the office or principal decide | Owner | Keep the recorded decision; update the plan. |
| A3-states-18 and R-14: Hindi and Marathi read by no speaker | Owner | Recruit native reviewers before a store release; walk Hindi once. |
| A3-journeys-18 (partly): no warning on an offer far above the drive's package | Owner | A validation decision: warn, or refuse above a multiple. |
| A3-inventory-7 (partly) and R-50: web-only writes with no door | Owner | Reopen a year, pin a post and invites first; the rest stay web-only and say so. |
| A3-S-15 (partly) and R-63: an adult pupil answering their own slip, the duties path's module check, expulsion timing, cards for leavers, unbounded corps dates | Owner | Decide each, as R-9. |
| A3-inventory-6 and R-48 (wontfix): homework for college faculty needs `Assignment.offeringId`, a migration and two to three days | Owner | Build it with the offering's REGISTERED students as the audience. |
| R-49: a guard that throws in development and test when a library reads through the bare client inside `$tenantTransaction` | Next builder | Build the guard; look for other helpers with the same fault. |
| R-1: no screen on any surface lets a parent answer a permission slip | Owner | Build the answer on the family's notice page, web and phone. |
| R-20: nothing sets a programme seat to COMPLETED, so the NBA success indices count no graduates | Owner | Complete the seat on `leaveCollege`, or read the enrolment's COMPLETED. |
| R-40: the NIRF band table is the platform's reading (see `docs/college.md`) | Owner | Check against NIRF's published college scores before it is relied on. |
| R-44: a change to NAAC's weights fails `data:audit` on old scenarios, on purpose | Owner | Re-save or retire old scenarios when the weights change. |
| R-62: the phone prints the answer-by day a day late west of UTC | Next builder | Add `offerExpiresOn` to `ApplicationView`. |
| R-15, R-16: layers not run; CI refused on billing since `84cc987` | Owner | See section 7 and 8; clear billing, then dispatch the Linux baselines. |
| The 34 decisions of 4 October (G4-1 to G4-34) | Owner | Carried forward in `08` section D, each with a recommendation. |

## 7. What is untested

Taken from the commit messages and the layers' lists; nothing here has been run.

- `api:sweep` and the page sweep over every door and page added or changed since the 4 October campaign, and
  under the new middleware matcher (it now also runs on public files and every `/api` route).
- `next build` and the production CSS (the square-corner fix is proven on the dev CSS), and `error.tsx` with a
  real exception in a browser.
- The full axe walk, and the Linux e2e baselines: controls are now 48 px, every card is rounded and headings and
  tables moved, so the baselines need a CI dispatch with `update_snapshots`; CI is refused on billing.
- In a browser: both simulator pages (sliders, reset, save, load, compare, remove), the moot page, `/id-check`
  as staff, the remove-plan and stop-paying controls, the usage card, the past-due tick box, the correction
  badges, "Make it again", the NBA worksheet lock, the ACCOUNTS exports, most converted college, hostel and
  dense pages, form success paths and print views; the class permission slip in a browser or on a phone (no
  slip fixture); the HOD's NBA pages as a real HOD (ZZ Shastri has none).
- A real QR scan, the phone on a device, the phone's insights, scenarios and moot screens against a live server
  (no law fixture), the phone's live contract suite, `NEXT_PUBLIC_APP_URL` on a deployed host, the full
  `zz:fixtures` run.
- `rls:verify`, `tenancy-shape` and `data:audit` after the fix commits: no migration or model changed in them,
  so they were last run with the insights commit (304 policies, 291 models).
- Hindi and Marathi read by a speaker.

## 8. How to run each layer again

Run from `apps/web` unless it says otherwise, with Node 24 and `corepack pnpm`, the dev servers up (health
first: `/api/health`), and only ZZ and `@demo.relay.test` data touched. Never `db:seed`, `db:reset` or `next
build` against the running server; the sweeps only when asked (CLAUDE.md and the project memory).

- **Layer I, inventory.** Static. Regenerate the counts with `npm run api:docs -- --check` (endpoints), the
  `tenancy-shape` test (models) and a count of `prisma/migrations`, `src/lib/nav.ts` and
  `apps/mobile/src/lib/nav.ts` (menus), `src/app` and `apps/mobile/src/app` (pages and screens). The extraction
  scripts lived under the session scratchpad (`audit3-inv/`) and are not in the repo; the document was written
  from their output and validated against the tree.
- **Layer S, security.** Read `git log <last audited commit>..HEAD` (this audit started at `8210ba1e`) with
  four reviewers by area; probe with a temporary `scripts/tmp-sec*.ts` that mints sessions (user agent
  `zz-walk`), delete it and the sessions afterwards; `npm run api:sweep -- --cross=school` and `--cross=person`
  are the tenant probes; `corepack pnpm audit` for dependencies.
- **Layer J, journeys.** A temporary Playwright driver under `e2e/tmp-journeys/`, one browser context per
  actor, sessions from `npm run zz:token -- --tag=audit3j` (purge with `--purge`), phone actors on the :8081
  web target at 390 x 844 with touch; every step logged. Delete the driver unless it is worth keeping.
- **Layer E, states.** A temporary `scripts/tmp-audit-walk.ts` (routes from `scripts/sweep.ts`, the inspector
  built with `new Function`), minted sessions, 1280 and 390 px, light and dark, English and Marathi; the axe
  gate in `e2e/axe.spec.ts` (`npm run e2e`) for the role homes; empty institutions made as ZZ schools and torn
  down by slug.
- **After any fix wave.** The chain in CLAUDE.md: web tsc (4 GB heap), scripts tsc, eslint, `npx vitest run`,
  `npm run rls:verify` on a schema or policy change, `npm run api:docs` on a catalog change,
  `npm run i18n -- --max 113`, the phone's `npm run battery`, `npm run sweep` and then `npm run api:sweep`
  (twice, warm-up then count), `npm run build` with the dev server stopped and then `rm -rf .next`, and
  `npm run data:audit` when derived data changes.

## 9. Cost

Weekly meter, as the coordinator gave it (read the live figure with the usage tool if it matters): request 2
about 5 points and request 3 about 18, taking the weekly meter from 56 % at the start to 71 % at the close.
