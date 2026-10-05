# 02 · Findings, one prioritised list

Audit of 5 October 2026 at tree ff6f928e (the 4 October campaign's fixes, the load fixes, the streams batch's ten commits, the sweep fixes and the accreditation insights and simulator). Four layers fed this list: inventory (I), security (S), journeys (J) and states (E, empty, error and loading states, accessibility, UI consistency). This file holds every confirmed finding, de-duplicated, in one place; the full text of each layer's findings is in `03-security.md`, `04-journeys.md` and `05-states.md`, and the inventory's in `01-inventory.md` section 8. Owner decisions that are not fixes are in `08-remaining-risks.md`; what the fix builders change is logged in `09-changelog.md`.

No finding here is new: each row is a layer's finding, shortened to one line, with the layer's evidence path. Where two layers saw the same fault the row carries both ids.

## Counts

By severity (86 rows from 87 layer ids; the one merge is A3-states-2 with A3-journeys-6):

| Severity | Rows |
| --- | --- |
| critical | 0 |
| high | 6 |
| medium | 25 |
| low | 50 |
| info | 5 |
| **Total** | **86** |

By area of the fix owner and severity:

| Fix owner | critical | high | medium | low | info | Total |
| --- | --- | --- | --- | --- | --- | --- |
| Web pages | 0 | 2 | 11 | 25 | 0 | 38 |
| Web library | 0 | 2 | 10 | 8 | 0 | 20 |
| Phone | 0 | 0 | 2 | 9 | 1 | 12 |
| Security | 0 | 2 | 2 | 8 | 1 | 13 |
| Docs | 0 | 0 | 0 | 0 | 3 | 3 |
| **Total** | **0** | **6** | **25** | **50** | **5** | **86** |

By layer (ids as filed, severities as rated here, before the merge):

| Layer | Ids | high | medium | low | info |
| --- | --- | --- | --- | --- | --- |
| inventory (I) | 14 | 0 | 3 | 9 | 2 |
| security (S) | 15 | 2 | 2 | 9 | 2 |
| journeys (J) | 40 | 2 | 14 | 24 | 0 |
| states (E) | 18 | 2 | 7 | 8 | 1 |
| **Total** | **87** | **6** | **26** | **50** | **5** |

(The medium column is 26 before the merge and 25 after it: A3-journeys-6 was medium and joins the high row A3-states-2.)

By status after the fixes (set in the Status column below; counted at the closing commit, 5 October 2026 22:30):

| Severity | fixed | partly fixed | wontfix (declined, logged) | open | Total |
| --- | --- | --- | --- | --- | --- |
| critical | 0 | 0 | 0 | 0 | 0 |
| high | 6 | 0 | 0 | 0 | 6 |
| medium | 25 | 0 | 0 | 0 | 25 |
| low | 44 | 2 | 1 | 3 | 50 |
| info | 2 | 1 | 0 | 2 | 5 |
| **Total** | **77** | **3** | **1** | **5** | **86** |

Every row was `open` when this file was written (commit dc215602); the Status cells below are the current truth.

## How to read this file

- **Severity** follows the audit's scale. Critical: data loss, a fence crossed, or a core journey blocked for everyone. High: a journey blocked for a role, a permission hole, a 500 on a menu page. Medium: wrong data or a broken step with a workaround, a parity gap on a core journey. Low: cosmetic, a validation message, a minor inconsistency. Info: a note. No layer found a critical.
- **Status** was `open` for every row when this file was written; it is now `fixed`, `partly fixed`, `wontfix` or still `open` (see the status table above). A fix builder sets it to `fixed` (with the commit in `09-changelog.md`), `wontfix` or `by design` and says why in the row. Re-read this file before editing it: builders and the writer share it.
- **Layer and evidence**: the layer's report is `scratchpad/reports/audit3-<layer>.md`; evidence paths are those the layer names, under `scratchpad/audit3j/` (journeys), `scratchpad/audit3/` (states) and `scratchpad/audit3-sec/` (security). All paths are relative to the session scratchpad.
- **Reproduced**: S and J rows were reproduced alone unless the row says "by code"; I rows are all static readings (none was clicked); E rows were reproduced alone unless the row says otherwise. Each row's detail is in its layer's document.
- **Fix owner** by area: Web pages (the `src/app` pages, components, CSS), Web library (`src/lib`, the doors, validation, the contracts), Phone (`apps/mobile`), Security, Docs.

## Severity notes (where a row differs from the layer's own rating)

The layers rated on their own wording; I checked each against the scale and changed these, and only these:

| Id | Layer's rating | Rating here | Why |
| --- | --- | --- | --- |
| A3-S-1 | medium | high | A tenant fence is crossed: any stored image whose id is known is drawn into an ID card, including another school's KYC or application scans. It is not critical because the ids are random UUIDs and only PNG or JPEG is drawn. |
| A3-S-2 | medium | high | A permission outlives its cause: the gate and the desk still pass for a duty the stream no longer offers, and the registrar's web panel cannot remove it (every save is a 422). |
| A3-S-3 | low-medium | low | Reproduced, but every page tried has its own second lock and nothing leaked; the default-deny gate is the thing weakened. |
| A3-S-4 | low-medium | medium | A four-eyes rule is missing on money and expulsion approvals; by code, not run. |
| A3-S-5 | low-medium | medium | A former teacher's public page stays up with no way to take it down; an erasure gap; by code. |
| A3-states-1 | high | high (kept) | By the scale's letter this is cosmetic, but it is product-wide (every page, ~900 uses), so the layer's rating stays; the owner may lower it. |

Everything else is as the layer filed it. The journeys layer's own summary reads "15 medium, 23 low"; its headings are 14 medium and 24 low, and the headings are what is counted here.

---

## High (6)

### Web pages (2)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-states-1 | high | every web role | web | Every `rounded-[--radius-*]`, `accent-[--*]`, `duration-[--*]`, `ease-[--*]` and `ring-offset-[--*]` utility compiles to invalid CSS under Tailwind 4.3.3 (18 rules; 839 + 4 + 26 + 20 + 5 + 5 uses), so the radius, accent and motion tokens apply nowhere: 49,777 of 50,416 bordered boxes have a 0 px radius. Not new today; first measured now. See Severity notes. | states · shots/sheet-radius.jpg, walk-en.jsonl `radii` | Web pages | fixed |
| A3-states-2 + A3-journeys-6 | high | ADMIN, EXAM_CONTROLLER, FACULTY, HOD, IQAC, ACCOUNTS (college) | web | A stale or mistyped id answers HTTP 500 and Next's bare "Application error" page on 12 route templates (50 of 268 probes): exam-cell sessions and their sub-pages, `/faculty/lectures/<id>` (a lecture that is not yours or does not exist, `AccessError academics.refuseNotYours`), `/faculty/offerings/<id>`, `/iqac/surveys/<id>`, `/admin/college-admissions/<id>`, `/admin/payroll/runs/<id>`. There is no `error.tsx`, `global-error.tsx` or segment boundary; the doors correctly answer 403 and 404. | states · dynprobe.json, shots/a3s-500-examcell.png; journeys · steps.jsonl | Web pages | fixed |

### Web library (2)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-journeys-1 | high | TEACHER, PARENT | web, phone | A class-level permission slip is invisible to parents: the notification URL opens a 404, the slip is in neither the web nor the phone feed (`classIdsFor()` returns [] for PARENT, `bulletin.ts:335-357`), so no family can answer, while the consent door says "open" and the teacher's reach report reads "Acknowledged 1". The whole-school slip works. The layer also notes no screen on any surface lets a parent answer a slip (08 R-1). | journeys · audit3j/steps.jsonl, notes.md | Web library | fixed |
| A3-journeys-2 | high | OPERATOR | web, api | An invalid timezone (`Mars/Olympus`) is accepted at college onboarding; `/root/<id>`, `/root/colleges` and `GET /api/v1/operator/colleges` then answer 500 for every college until the row is repaired (`RangeError: Invalid time zone`). | journeys · shots/root-bad-timezone.png | Web library | fixed |

### Security (2)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-S-1 | high | STUDENT (self-join), the card's printers | api | The ID-card PDF embeds any stored image named by an `upload:` avatarKey: `joinAsStudent` accepts any avatarKey and `readStoredFile` checks no owner or tenant, so a known blob id (another school's KYC or scan) is drawn into the card; the same file is 404 through `/api/files`. The hall ticket has the same sink. Reproduced live (card grew 20,335 to 24,147 B). See Severity notes. | security · audit3-sec/probes/p3a.out.json, p3b.out.json | Security | fixed |
| A3-S-2 | high | ADMIN, FACULTY, HOD | web, api | A duty outlives the stream that offered it: the session gate and the desks still pass, and the registrar's panel can no longer save that teacher's duties (422 on every save). Lab write-offs, NSS and NCC, research dean and exam squad stay live after the stream is dropped. Reproduced live. See Severity notes. | security · audit3-sec/probes/p2.out.json | Security | fixed |

---

## Medium (25)

### Web pages (11)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-states-3 | medium | every web role | web | No route has a loading state: there is no `loading.tsx` in 396 pages, `PageSkeleton` has no caller, and its comment still says route-level `loading.tsx` renders it; warm TTFB median 1,254 ms, p90 5,054 ms on a shared dev server (indicative only). | states · walk-en.jsonl `ttfb`, `fcp` | Web pages | fixed |
| A3-states-4 | medium | ADMIN (registrar) at an engineering college, any role who may act on a step | web (390 px) | The insights call to action (`CtaLink`, `components/iqac/insights.tsx:35-41`) is a nowrap Button and overflows a phone-width screen by 35 px on `/iqac` and `/iqac/predictor`; `/iqac/predictor` is also 22,300 to 23,800 px tall at 390 (14,000 on 4 Oct). | states · shots/a3s-iqac-cta-overflow.png | Web pages | fixed |
| A3-states-5 | medium | ADMIN, PRINCIPAL, ACCOUNTS, ALUMNUS desk | web (390 px) | Tables outside `TableScroll` overflow: `/admin/payroll` (+108 px) and `/admin/alumni/college` (+11 px); 23 files render `<table` with no wrapper and `tests/ui-source-rules.test.ts` cannot see a bare table. | states · shots/a3s-payroll-overflow.png, walk-en.jsonl `tablesBare` | Web pages | fixed |
| A3-states-6 | medium | ADMIN, PRINCIPAL (any role with a closed year) | web | `/archive` with a closed year fails axe (serious): `<dt>`/`<dd>` inside a Card div and a span directly in a `<dl>` (`archive/page.tsx:260-271`); `definition-list` and `dlitem` x12. | states · detail-en.md ADMIN@sit "serious" | Web pages | fixed |
| A3-states-7 | medium | EXPERT | web | `/expert/profile` throws a hydration error: the "Last checked" time in the get-paid card is formatted in the browser's locale (`get-paid-card.tsx`), the 4 October B-15 class of bug. | states · hyd1 output, walk-en.jsonl EXPERT | Web pages | fixed |
| A3-states-9 | medium | every role | web | 47 routes have no `<h1>`: where a page returns an `EmptyState` instead of `PageHeader` the only heading is its `h2` (module-off pages and first-run pages such as `/teacher`, `/hod`, `/bulletin/new`). | states · detail-en.md `h1` sections | Web pages | fixed |
| A3-journeys-7 | medium | FACULTY | web, phone | Once a term's eligibility is decided, no later lecture can be recorded, but the page and the phone still offer marking; Save is refused ("This term's exam eligibility has been decided…", 409). | journeys · steps.jsonl | Web pages | fixed: lectures dated after the eligibility snapshot are recorded; earlier ones say so up front with no Save |
| A3-journeys-11 | medium | EXAM_CONTROLLER, STUDENT | web, phone | After a revaluation changes marks the published result stays old and nothing prompts a new run; the student reads "Marks changed" beside the old result until the controller computes Run 2 by hand and the principal publishes. | journeys · steps.jsonl | Web pages | fixed |
| A3-inventory-1 | medium | ACCOUNTS | web | The fee ledger's pages (`/admin/fees/dues`, `pupils/[id]`, `structures*`, `heads`, `settings`, `claims`) gate ADMIN or ADMIN+PRINCIPAL though the menu, the fee doors and the office builder give ACCOUNTS the ledger; `requireRole` redirects to `/switch`. Static. | inventory · 01-inventory.md section 8 | Web pages | fixed |
| A3-inventory-2 | medium | ACCOUNTS | web | Payroll and inventory pages set `canEdit = role === "ADMIN"` (`payroll/shared.tsx:18`, `inventory/shared.tsx:17`): the run, lock, share, salary tabs and stock forms are drawn for ADMIN only while doors and libraries let ACCOUNTS write. Static. | inventory · 01-inventory.md section 8 | Web pages | fixed |
| A3-inventory-4 | medium | FACULTY, HOD (law college) | web, phone | Moot courts and lab-batch reads: the door and library accept FACULTY and HOD, the only page is the office's `/admin/stream-records/moot-courts`, and no phone screen exists. Static; no LAW fixture. Related: A3-S-10. | inventory · 01-inventory.md section 8 | Web pages | fixed: /faculty/moot-courts on the web and a moot-courts screen on the phone, both at a law college |

### Web library (10)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-journeys-3 | medium | ADMIN, PARENT | web | An offer with an answer-by date in the past (01/01/2020) is accepted, the application turns "Offer expired" at once and the parent is notified (`offer()` in `admissions.ts:744` has no lower bound). | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-4 | medium | ADMIN, PARENT | web | The answer-by date shows one day later than typed (20/10 reads 21/10) and the offer stays open until 05:29 IST the next day (`setUTCHours(23,59,59,999)`, `admissions.ts:745`). | journeys · steps.jsonl | Web library | fixed (the phone prints the day from the stored instant, right in India; 08-remaining-risks.md) |
| A3-journeys-5 | medium | PARENT, ADMIN | web | A date of birth in the future (12/12/2030) is accepted at application and printed on a frozen Bonafide certificate; the alumni list calls the child "Under 18". | journeys · shots/school-certificate.png | Web library | fixed |
| A3-journeys-8 | medium | ACCOUNTS | web | A no-dues line is cleared with ₹12,000 owed and no note (`owedAtClearPaise 1200000, note null`), and the page gives no toast; the row reads "Still open" until a reload. | journeys · steps.jsonl | Web library | fixed: a hand clearance with money owed or items out needs a note; the feedback was not reproduced (notice and row update seen live), so no page change |
| A3-journeys-9 | medium | ACCOUNTS | web | A scholarship sanction has no bound: ₹99,999 was accepted on a ₹15,750 expected claim and "Owed by the state" rose to ₹1,49,999, above the college's whole outstanding. | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-10 | medium | STUDENT, EXAM_CONTROLLER | web | A revaluation says "the fee is on your ledger" but `Revaluation.feeDemandId` is null and no FeeDemand exists: `raiseDemand()` (`exam-cell-after.ts:120`) returns null silently when the head or the academic year is not found. | journeys · DB check in notes.md | Web library | fixed |
| A3-journeys-12 | medium | TPO | web | A drive can be opened to students for a company that was never verified ("2 of 2 eligible students told"); a student applied and a guardian consented to share the record with it. | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-13 | medium | IQAC | web, api | The simulator accepts and saves more passes than students appeared (50 of 3): CGPA 1.11 to 1.15, 2.6.3 scores the full 4.00 against 2.67; `writeScenario` refuses only keys the framework does not read. | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-15 | medium | ADMIN, PARENT | web, phone | A departure leaves later instalments due (Term 2 still "Due ₹12,500" on the office dues list) and removes the child from the parent's fee chooser on web and phone. | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-16 | medium | ADMIN, PARENT | web | A mid-year admission arrives already overdue (Term 1 due 15/07) and inherits past exams as "awaiting marks" and "2 to mark" for exams held before the child joined. | journeys · steps.jsonl | Web library | fixed |

### Phone (2)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-journeys-14 | medium | every phone user (PARENT walked) | phone | The notification bell's rows cannot be tapped: `notifications.tsx` renders `<Row />` with no `onPress` or route and there is no per-item read; the list is exposed as one text blob to a screen reader. | journeys · shots/phone-parent-notifs.png | Phone | fixed |
| A3-states-14 | medium | RECRUITER | phone | `/recruiter-drive?driveId=<unknown>`: the API answers 404 and the screen stays on its loading skeleton with no message and no retry. Seen in a loaded run only, not re-run alone. | states · shots/sheet-phone-err.jpg, phone-RECRUITER.jsonl | Phone | fixed |

### Security (2)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-S-4 | medium | ADMIN+PRINCIPAL dual holder | web, api | No four-eyes on the new head approvals: `decideRefundException` and `decideExpulsion` (and the earlier concession decide, `college-fees.ts:222`) never compare the decider with the asker, so one user holding both roles asks and approves. By code; the probe needs a second membership. | security · audit3-security.md (probe given) | Security | fixed |
| A3-S-5 | medium | signed-out readers | web, api | A teacher's public page survives their leaving or IQAC being switched off: `officeTakeDownProfile` has no caller and `me()` needs an active membership and IQAC on, so the page cannot be unpublished and nothing on departure touches it. By code. | security · audit3-security.md | Security | fixed |

---

## Low (50)

### Web pages (25)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-states-8 | low | EXPERT | web | `/expert/availability`: the "what this time is for" input has only a placeholder (no label, aria-label or title). | states · walk-en.jsonl `phOnly` | Web pages | fixed |
| A3-states-10 | low | ADMIN, PRINCIPAL, any role reaching a module-off page | web | Module-off pages (79 role-and-route pairs, 11 texts) are an EmptyState with no link; for the office the sentence names Settings, Modules without linking there. Reachable only by URL. | states · shots/a3s-web-moduleoff.png | Web pages | fixed |
| A3-states-11 | low | many roles | web (390 px) | Touch targets under the 44 px floor: filter links on `/admin/inventory/assets` (17x20, 39x20), "Remove" 40x40 on `/admin/admissions/new`, anonymous "Log in" 40x20, chips and 100 distinct inputs at 37 to 38 px on 20-odd pages. | states · detail-en.md `small390`, `short390` | Web pages | fixed (the kit's PageHeader back link, 20 px tall, and the bulletin card's category badge are left; see 09) |
| A3-states-12 | low | anonymous | web | No `<main>` landmark on `/login`, `/forgot`, `/first-signin`, `/verify`, `/certificates/check`, `/certificates/exam`. | states · walk-en.jsonl `mains` | Web pages | fixed |
| A3-states-13 | low | TPO | web (390 px) | The TPO's home tab in the bottom bar is labelled with the role title "Training and placement officer", which wraps onto three lines and is clipped. Seen in a picture, not measured. | states · shots/sheet-hollow1.jpg | Web pages | fixed |
| A3-journeys-17 | low | EXAM_CONTROLLER | web | Unmatched result-file rows are counted but not listed ("2 matched nobody"); an over-maximum row is misreported as unmatched and `importMarks`' per-line reasons are not shown. | journeys · steps.jsonl | Web pages | fixed |
| A3-journeys-18 | low | RECRUITER | web | The offer toast drops the student's name ("Offer recorded for ; they are told"); a ₹25 lakh offer on a ₹6-7 lakh drive at the shortlist stage raised no warning. | journeys · steps.jsonl | Web pages | partly fixed: the toast names the student; no warning on an offer far above the drive's package (a validation decision) |
| A3-journeys-19 | low | STUDENT | web | A sentence prints raw rupees: "a second drive needs the dream flag and at least 3750000 a year". | journeys · steps.jsonl | Web pages | fixed |
| A3-journeys-20 | low | STUDENT (minor) | web | A minor's apply toast promises "The company sees your profile and record" while the page says it waits for the guardian's consent. | journeys · steps.jsonl | Web pages | fixed |
| A3-journeys-21 | low | anyone verifying a grade card | web | A grade card cannot be checked by typing its code: `/certificates/exam` without `?school=` shows no field and `/certificates/check` says no certificate carries that code. | journeys · steps.jsonl | Web pages | open |
| A3-journeys-25 | low | TEACHER, STUDENT | web | A past due date is accepted silently on homework, and the student's "1 thing to do" count stays stale after hand-in until a reload. | journeys · steps.jsonl | Web pages | fixed: the past due date's confirm by the functional pass; the stale count by the UI pass (the hand-in revalidates the student's home) |
| A3-journeys-26 | low | ADMIN | web | A receipt's "Admission no." prints the student code (`STU-676P-JMC7`), not the admission register number typed at admit (`fees.receiptCode`). | journeys · downloads/ | Web pages | fixed |
| A3-journeys-27 | low | ADMIN, TEACHER, FACULTY, registrar | web | Server-action forms wipe every field on refusal and put the message far from the field (`?error=` at page top); several refusals are only "Some of this needs another look."; creating an exam series gives no feedback. | journeys · steps.jsonl | Web pages | fixed for the named panels (exam series and paper, terms, practical record, internal marks, exam session, scholarships, hostel leave, apply, certificate request); other server-action forms still redirect with ?error= |
| A3-journeys-28 | low | ADMIN (college registrar) | web | The term form's client check is dead (`Pattern attribute value \d{4}[–-]\d{2} is not a valid regular expression`, `terms/page.tsx:50,113`), a future registration window is labelled "Registration closed", and native date inputs are used. | journeys · steps.jsonl | Web pages | fixed |
| A3-journeys-30 | low | ADMIN | web | The HTML certificate prints a relative check address ("Verify this certificate at /certificates/check"); the PDF has the full URL. | journeys · shots/school-certificate.png | Web pages | fixed |
| A3-journeys-33 | low | IQAC | web | The simulator's compare tables have no column headers; also NIRF inputs show 66.66666666666666, sliders round 21.8 to 22, a blank figure shows 0, saving resets the figures, Remove has no confirmation or toast. | journeys · shots/iqac-sim-compare.png | Web pages | fixed |
| A3-journeys-34 | low | IQAC desk at an engineering college | web | The NBA SAR page and simulator open on Year 2025 ("0 of 1000") while the college's only SAR is for 2026 (140 of 1000). | journeys · steps.jsonl | Web pages | fixed |
| A3-journeys-40 | low | various | web, phone | Plurals, copy and labels ("1 marks saved", "1 forms", "Mentoring (1 groups)", future reminders called "Overdue", a one-course supplementary labelled "First class with distinction", "Mukta" twice in the typeface list, the college onboarding form still showing Board and grades, no toast or notice when a duty is granted); `admit()` has no grade check (`admissions.ts:843`, code read). | journeys · steps.jsonl | Web pages | fixed: the duty notification and the admit grade check (functional pass; the registrar's toast already existed); the copy, plural and label items (UI pass) |
| A3-inventory-6 | low | FACULTY, HOD | web, phone | No homework or hand-in for college faculty (doors and pages are TEACHER and ADMIN only), against the plan's Faculty row. Static. | inventory · 01-inventory.md section 8 | Web pages | wontfix in this audit: needs Assignment.offeringId (a migration) and two to three days; shape in 08-remaining-risks.md |
| A3-inventory-3 | low | ACCOUNTS | web | The admission fee and refund pages (`/admin/college-admissions/[id]`, `/refunds`) are ADMIN or PRINCIPAL; the doors name ACCOUNTS. Static. | inventory · 01-inventory.md section 8 | Web pages | fixed as far as the doors permit (the applications list door is ADMIN and PRINCIPAL; 08-remaining-risks.md) |
| A3-inventory-10 | low | IQAC, TPO, HOD, LIBRARIAN, STUDENT, ACCOUNTS | web, phone | Plan items with no code: appointment letters, pre-placement talks, soft-skills training with attendance, student council notices, peer-team visit schedule, reading-room register, biometric/RFID feed (Tally export and sheet/Superset import already recorded 4 Oct). A product decision, also in `08-remaining-risks.md`. | inventory · 01-inventory.md section 8 | Web pages | open |
| A3-inventory-12 | low | FACULTY, HOD | web | CLINICAL_COORDINATOR and STUDIO_COORDINATOR can be granted (clinical at PHARMACY, a built stream) and open a "not built" page; no door, no phone. | inventory · 01-inventory.md section 8 | Web pages | fixed |
| A3-inventory-14 | low | all | web | Pages with no door: `/bulletin/celebrations` and the celebrations card on `/teacher/classes`, `/student/practice/journey`, `/root/jobs/schools`; the phone only maps their notification links. | inventory · 01-inventory.md section 8 | Web pages | open |
| A3-journeys-38 | low | FACULTY | web | The public faculty page says it shows "designation, department, qualification…", but neither the preview nor the published page shows the department. | journeys · steps.jsonl | Web pages | fixed |
| A3-journeys-39 | low | ACCOUNTS | web | After disbursing ₹15,750 the student's account lists "Economically backward class fee concession: Disbursed · ₹0"; the ledger row correctly shows ₹15,750 covered and ₹500 owed. | journeys · steps.jsonl | Web pages | fixed |

### Web library (8)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-journeys-22 | low | TPO | web | An internship is credited before it ends (2 credits on 05/10 for 20/09 to 18/11, 19 h of 240 planned); diary-day limits are enforced only by native browser bubbles. | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-24 | low | ADMIN | web | The entrance-test result takes any text and any date ("-40", "abc; excellent!!", a result before the sitting), and shows "Sat 05/10/2026" for a Monday. | journeys · steps.jsonl | Web library | fixed: the score bounded and no result before the sitting (functional pass); "Sat {date}" reworded (UI pass) |
| A3-journeys-35 | low | IQAC | web | A second AQAR can be generated for a year already FILED (a duplicate 2025-26 DRAFT with a new fingerprint) with no warning. | journeys · steps.jsonl | Web library | fixed |
| A3-journeys-36 | low | college office | web | "Send to the principal" at a college that has no principal says "Sent" and leaves the NBA SAR in AWAITING_SIGNOFF that nobody can give (ZZ Shastri). | journeys · steps.jsonl | Web library | fixed |
| A3-inventory-5 | low | FACULTY, HOD | web, phone | The head can appraise a FACULTY or HOD member (`appraisal.ts` STAFF_ROLES) but `GET /staff/me/appraisals` and `/teacher/appraisals` name TEACHER, ADMIN, PRINCIPAL only; no menu entry. Static. | inventory · 01-inventory.md section 8 | Web library | fixed |
| A3-inventory-7 | low | ADMIN, TEACHER, PRINCIPAL | phone | Twelve web server actions have no catalog door (year and term create, holiday edit, promotion, cohort moves, exam slot removal, invite, account merge, close a review round, pin a post, withdraw own leave), so the phone cannot do them. Static. | inventory · 01-inventory.md section 7.5 | Web library | partly fixed: ten doors (years, terms, closures, promotion, cohort moves, withdraw own leave); the rest stay web-only for now (08-remaining-risks.md) |
| A3-inventory-9 | low | TEACHER, phone users | web, api | `POST /api/attendance` (the register's write) and 11 other `/api` routes are outside the catalog, so not in `openapi.json` or the phone's access gate. Static. | inventory · 01-inventory.md section 8 | Web library | fixed |
| A3-inventory-8 | low | ADMIN, operator, STUDENT, PRINCIPAL | web, phone | Four orphan doors with no UI (`POST /fees/plans/remove`, `POST /operator/gigs/payees/{id}/suspend`, `GET /office/usage`, `GET /id-cards/check`) and about twenty JSON twins nobody calls. Static. | inventory · 01-inventory.md section 8 | Web library | fixed: each of the four orphan doors has a caller; the JSON twins are not a fault |

### Phone (9)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-journeys-23 | low | IQAC | phone | Every insight on the phone is "Open on the web"; another role's step (2.6.3, Exam controller) opens `/exam-cell`, which redirects the IQAC to `/switch`; the web shows "Ask: … — Exam controller" with no link. | journeys · steps.jsonl | Phone | fixed |
| A3-journeys-29 | low | PARENT | phone | On the hostel screen "Do not consent" renders at the bottom of the leave list, away from the Night-out row it refuses; all headings are level 1; the leave hint shows "2026-10-10 16:00". | journeys · shots/phone-parent-hostel.png | Phone | fixed |
| A3-journeys-31 | low | several | phone, web | Dates are formatted three ways: US style on the phone ("Jul 15, 2026"), ISO on faculty, warden and TPO screens ("2026-10-05"), dd/mm/yyyy on the web. | journeys · steps.jsonl | Phone | fixed (dates; and the time convention: the phone prints "05/10/2026, 3:07 PM" like the web, changed in the closing commit, 09-changelog.md; typed time fields stay 24-hour) |
| A3-journeys-32 | low | TEACHER | phone | The phone register still reads "Saved on this device" after the outbox sent; radios have no group naming the pupil; the first offline status was "Ready". | journeys · steps.jsonl | Phone | fixed |
| A3-journeys-37 | low | DRIVER | phone | The trip banner says "Sending the bus's location" after starting without permission, and "End this trip?" does not mention a pupil never ticked. | journeys · steps.jsonl | Phone | fixed |
| A3-S-12 | low | ACCOUNTS, FACULTY, WARDEN | phone | Five new sensitive screens do not call `usePrivateScreen()`: accounts look-up, anti-ragging, exam squad, warden, alumni-college. By code. | security · audit3-security.md | Phone | fixed |
| A3-states-15 | low | DRIVER (any role) | phone | `/person?membershipId=<unknown>` opens as an editable person screen with empty fields and Save, no 403 or 404; not-found alerts offer "Try again"; correction chips are cut at the right edge. | states · shots/sheet-phone-err.jpg | Phone | fixed |
| A3-states-16 | low | IQAC | phone (Marathi) | `/iqac-insights` shows English in a Marathi session (audit labels, role names, "AISHE data capture", "Actionable insights" twice); may be server strings since the language is stored in the app only (4 Oct B-24). | states · phone-IQAC_vidya.jsonl | Phone | fixed (the phone's own strings and the audit labels; path and metric sentences still come in the account's language) |
| A3-states-17 | low | TEACHER | phone | `/contribution` clips its option rows ("The correct option" 386 px in a 324 px box, "Level" 521 in 324, overflow hidden). | states · phone-TEACHER_northgate.jsonl | Phone | fixed |

### Security (8)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-S-3 | low | limited roles | web | On a page path ending in `.xx` the middleware matcher skips the route stamp, so a client-sent `x-edulink-route` reaches the gate and the page gate passes (the page's own lock still stops it). Reproduced live. | security · probes/p3a.out.json | Security | fixed |
| A3-S-6 | low | anyone holding a card | api | The ID card prints the guardian-claim code (`STU-…`) and encodes it in a QR that leads to `/id-check`, which is a 404 on web and phone. Partly live. | security · probes/p2.out.json | Security | fixed (cards printed before the fix still carry the claim code until reprinted; 08-remaining-risks.md) |
| A3-S-7 | low | IQAC, PRINCIPAL, ADMIN, HOD | api | The new heavy recompute doors (council GETs, insights/nba, insights/nirf, simulate, simulate/nba, scenarios list and delete) have no `budget()` (1.25 to 2.64 s single calls); NBA scenarios across 100 years multiply the list's cost and the 100-per-college cap is check-then-insert. | security · audit3-security.md (timings live) | Security | fixed |
| A3-S-8 | low | anyone | api | `GET /api/v1/public/faculty/{slug}`, signed out, has no rate limit (130 calls, 129 x 200, no 429). Reproduced live. | security · audit3-security.md | Security | fixed |
| A3-S-9 | low | PARENT, STUDENT | api | Permission slip: the question and deadline of a post the reader cannot open are answered, and each read recomputes the whole audience (up to 5,000 `studentTokensOf` calls) with no budget. By code. | security · audit3-security.md | Security | fixed: the question leak (3a5b1da1), then the reader's own check instead of the audience and a budget on the consent POST; the staff's report still reads the whole audience (08-remaining-risks.md) |
| A3-S-10 | low | FACULTY, HOD (law college) | api | Any FACULTY or HOD can overwrite any moot-court record by id (`saveMootCourt`, `stream-records.ts:389-392`), which feeds the BCI return. By code; no LAW fixture. Related: A3-inventory-4. | security · audit3-security.md | Security | fixed (the freeze of a year's moots after its BCI return is in 08-remaining-risks.md) |
| A3-S-11 | low | FACULTY, HOD | api | College-wide reads where the role is departmental: lab batches with student names, the research dean's API-score inputs per teacher, law internships per student to any HOD, the HOD's "what you did last" feed. Partly live. | security · probes/p2.out.json | Security | fixed |
| A3-S-13 | low | repo hygiene | none | `ops/load/college-check.ts --emit-cookies` writes live one-hour ZZ bearer tokens to a path that `.gitignore` does not cover, so CLAUDE.md's `git add -A` would commit them. | security · git check-ignore rc=1 | Security | fixed |

---

## Info (5)

### Phone (1)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-S-14 | info | none | phone | The phone's `openWeb` string-joins `API_BASE + href`, and the insights CTA `href` is `z.string()`: a server-sent `@evil.example/x` would change the host. The server sends only constants. | security · audit3-security.md | Phone | fixed |

### Security (1)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-S-15 | info | various | api | Smaller items: accounts look-up LIKE wildcards, adult pupils' slips at a school, no upper bound on a refund amount, two web paths skipping a module check, an approved expulsion ending the allotment before `effectiveOn`, cards for leavers, the NBA worksheet writable after sign-off, scenario removal by any IQAC, duty doors without a budget, corps dates unbounded, 24-hour sweep sessions, a `zz-token` RECRUITER branch with no email guard, and `decode-uri-component` in the phone bundle (not reachable from a deep link). | security · audit3-security.md | Security | partly fixed: refund amount capped, the refund decision's module check, LIKE wildcards escaped in the accounts look-up, the NBA worksheet read-only after sign-off; the rest stay open (adult pupils' slips, the duties web path's module check, expulsion timing, cards for leavers, duty-door budgets, corps dates, sweep sessions, zz-token's RECRUITER guard) |

### Docs (3)

| Id | Sev | Roles | Platform | Summary | Layer · evidence | Fix owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A3-inventory-11 | info | HOD | web | The plan has the HOD approve faculty leave; the platform has the office or principal decide (recorded decision, `integration.md:264`); the plan is what is stale. | inventory · 01-inventory.md section 8 | Docs | open |
| A3-inventory-13 | info | repo docs | docs | `HANDOFF.md` numbers are stale (530 endpoints, 111 models, 28 migrations, 17 jobs, 2,398 tests, i18n floor 163 against 1,006, 291, 88, 18, 3,350 and 113); `docs/college.md:244` still lists the phone warden's night view as not built (it is, `screens/hostel/warden.tsx:55-58`). | inventory · 01-inventory.md section 8 | Docs | fixed: HANDOFF.md numbers (1,028 endpoints, 291 models, 88 migrations, eighteen jobs, 3,631 web and 1,736 phone tests, i18n floor 113) and docs/college.md (the warden night view is built; /id-check exists) |
| A3-states-18 | info | every role | web (Marathi) | The Marathi walk found no raw keys, sideways scroll, axe serious or console error; remaining English is data and coded defaults ("Physical education", "Needs improvement", certificate and intake terms), worth one look by a speaker. | states · detail-mr.md | Docs | open |

---

## Not counted as rows

- **Environment and by-design items** are listed in each layer's document and are not findings: 03-security.md, 04-journeys.md, 05-states.md ("By design and environment").
- **The inconsistency list** of the states layer (five field-style families, about 30 hand-rolled page titles, 23 bare tables, raw buttons, radius spellings, 740 EmptyStates with no way on, per-module module-off pages) has no ids; it is the evidence behind A3-states-1, 5, 9, 10 and 11 and is in `05-states.md`.
- **False positives the inventory discarded** on a second reading (HOD substitutions and offerings, HOD activities, the 4 Oct findings G-1 to G-4 and G-9, faculty leave approval by the HOD): `01-inventory.md` section 8.
- **Left for the owner by earlier batches** (not findings of this audit): see `08-remaining-risks.md`.
