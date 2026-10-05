# 03 · Security

Audit of 5 October 2026, layer S (security of everything since 8210ba1e, tree ff6f928e). This is the layer's report in full, copied from `scratchpad/reports/audit3-security.md` and tidied; the findings are summarised, de-duplicated against the other layers and prioritised in `02-findings.md`. Evidence paths below (`probes/p1.out.json` and so on) are under `scratchpad/audit3-sec/`.

**Reading note.** The layer rated A3-S-1 and A3-S-2 medium and A3-S-3, A3-S-4 and A3-S-5 low-medium. `02-findings.md` rates them against the audit's scale (A3-S-1 and A3-S-2 high, A3-S-3 low, A3-S-4 and A3-S-5 medium, reasons under "Severity notes" there); the headings and the table below show both ratings. The sections of this document are: Summary, the bug-bounty table, Findings, Checked and sound, Dependency audit, By design and environment (excluded), Untested.

## Audit of 5 October 2026, layer S: security of everything since 8210ba1e (tree ff6f928e)

Scope: `git log 8210ba1e..HEAD`, 408 files, +52,786/−7,840. That covers the load fixes (the Prisma patch, the `/i18n/[file]` dictionary route, `compress:false`, robots, the service worker), the streams batch's ten commits (streams, duties and desks, stream records, council filings and worksheets, the public faculty page, ID cards, permission slips, head approvals, the night-out register, the accounts look-up, the UX per stream, the demo engineering college), the sweep fixes (7727b8b3) and the accreditation insights and simulator (1479dec5: nine doors, IqacScenario, `/iqac/simulator`, `/hod/nba/simulator`, the phone's insights screens).

Method:
- Four static reviewers read the diff in parallel: streams/duties/desks; records/filings/insights; people-facing doors; config/load/phone.
- I checked every finding I kept against the code and probed live wherever the fixtures allowed.
- The probes used a temporary `apps/web/scripts/tmp-sec3.ts` (deleted). It minted `zz-walk` sessions for named ZZ and demo people and deleted them by hash after each run: 18, 11, 3 and 3 sessions, 0 left over.
- Health was checked before and after every run: `ok` throughout, uptime 23 s at the start and 995 s at the close.
- No product code was changed. Nothing was committed, stashed or checked out. No `db:seed`, `db:reset`, `next build` or sweeps were run.

Mutations, all on ZZ data and all restored:
- ZZ Shastri's streams went to `["ENGINEERING","EDUCATION"]` and back to `["ENGINEERING"]`.
- zz.faculty.s1's duties went to `+PRACTICE_TEACHING_COORDINATOR` and back to `["LAB_INCHARGE"]`.
- zz.pupil01's `avatarKey` was set for one probe and restored to NULL.
- I verified all three afterwards. The audit log keeps the `people.duties.set` and college-profile rows these changes wrote.

## Summary

| activity | result |
|---|---|
| Static review of the diff, four reviewers plus my own checks | 15 findings: 2 medium, 4 low-medium, 8 low, plus an info bundle. No critical and no high. |
| Role, duty and department probes, 75 calls (`probes/p1.out.json`) | All as expected. 8 non-desk roles were refused the insights (403). Another college's scenario is 404. An HOD asking for another department's NBA insights, simulate or council is 403. FACULTY without the duty is 403 on all 7 desks; with the duty, 200. The duty pages send a non-holder to 307 `/switch`. Northgate is MODULE_OFF. |
| Stale duty, ID card, look-up and Origin probes, 26 calls (`p2.out.json`) | Confirmed A3-S-2. Lab-batches and research reads are college-wide (A3-S-11). LIKE wildcards are live (info). A cross-origin cookie POST is refused 403 and the same-origin one gets through to the body check (422). ID-card check and PDF are fenced: another school's code reads `found:false`, another school's student is 404, an adult child without a grant is 403, a minor child is 200. |
| Forged route header and avatar sink (`p3a`/`p3b.out.json`) | Confirmed A3-S-1 and A3-S-3 live. |
| Public faculty door, 130 calls signed out | 129 × 200 and 1 × status 0 (the shared server was busy), no 429. Confirms A3-S-8. |
| `corepack pnpm audit` (root) | 7 advisories: 4 moderate and 3 high, 2 of the highs ignored by policy. On 4 Oct it was 9. None reaches the web runtime. One phone-bundle module is not reachable from deep links (see below). |
| Earlier fixes rechecked | PH-1, PH-2, PH-3, PH-8 and PH-9 are fixed on the phone (owner on outbox rows, 401 clean-up, tracking stop, CSP meta, `allowBackup:false`). S-11's missing-stamp case is fixed; A3-S-3 is the forged-stamp case it left. |

The duty gate holds twice: at the session gate through the catalog's `duties`, and in the library through `deskCaller` and `requireDuty`. The scenario and NBA doors are fenced by college and by department. All new `/api/v1` cookie writes sit behind the Origin lock.

The real findings are:
- a file-read sink that goes around `files.ts` (A3-S-1);
- a duty that outlives the stream that offered it and that the registrar's panel then cannot remove (A3-S-2);
- the dotted-path forged header, the half of S-11 that is left (A3-S-3);
- missing four-eyes and erasure paths on the new head approvals and the public faculty page (A3-S-4, A3-S-5);
- unbudgeted heavy or public doors (A3-S-7, A3-S-8).

## Bug-bounty table

| id | sev | title | role(s) | platform | reproduced |
|---|---|---|---|---|---|
| A3-S-1 | **high** (layer: medium) | The ID-card PDF embeds any stored image named by an `upload:` avatarKey. `readStoredFile` checks no owner or tenant, and the pupil's self-join accepts any avatarKey. | STUDENT (self-join); the card's printers | api | **yes, live** |
| A3-S-2 | **high** (layer: medium) | A duty outlives the stream that offered it: the gate and the desk still pass, and the registrar's panel can no longer save that teacher's duties (422 on every save). | ADMIN, FACULTY, HOD | both | **yes, live** |
| A3-S-3 | low (layer: low-med) | On a path ending in `.xx` the middleware does not run, so a client-sent `x-edulink-route` reaches the gate and the page gate passes. Only the page's own lock stops it. | limited roles | web | **yes, live** |
| A3-S-4 | medium (layer: low-med) | No four-eyes on the new head approvals: one user holding ADMIN and PRINCIPAL asks for and approves their own refund exception or expulsion. | ADMIN+PRINCIPAL | both | by code |
| A3-S-5 | medium (layer: low-med) | A teacher's public page survives their leaving or IQAC being switched off. The office takedown exists but nothing calls it. | signed-out readers | web/api | by code |
| A3-S-6 | low | The ID card prints the guardian-claim code (`STU-…`) and puts it in the QR. The QR's `/id-check` page does not exist (404). | anyone holding a card | api | partly live |
| A3-S-7 | low | The new heavy recompute doors (council GETs, insights/nba, insights/nirf, simulate, simulate/nba, scenarios list/delete) have no `budget()`. NBA scenarios across 100 years multiply the list's cost. The 100-per-college cap is check-then-insert. | IQAC, PRINCIPAL, ADMIN, HOD | api | timings live; rest by code |
| A3-S-8 | low | `GET /api/v1/public/faculty/{slug}`, signed out, has no rate limit. Every other public door has one. | anyone | api | **yes, live** |
| A3-S-9 | low | Permission slip: the question and deadline of a post the reader cannot open are answered. Each read recomputes the whole audience (≤5,000 × `studentTokensOf`) with no budget. | PARENT, STUDENT | api | by code (no slip in fixtures) |
| A3-S-10 | low | Any FACULTY or HOD of a law college can overwrite any moot-court record by its id, which feeds the BCI return. | FACULTY, HOD | api | by code (no LAW fixture) |
| A3-S-11 | low | College-wide reads to department roles: lab batches with names, API-score inputs to the research dean, law internships per student to any HOD, the "what you did last" feed to an HOD. | FACULTY, HOD | api | partly live |
| A3-S-12 | low | New sensitive phone screens do not call `usePrivateScreen`: the accounts look-up/ledger, anti-ragging, exam squad, warden and alumni-college screens. | ACCOUNTS, FACULTY, WARDEN | phone | by code |
| A3-S-13 | low | `ops/load/college-check.ts --emit-cookies` writes live bearer tokens to `ops/load/*cookies*.json`, which git does not ignore. | (repo hygiene) | — | by code + `git check-ignore` |
| A3-S-14 | info | The phone's `openWeb` string-joins `API_BASE + href`. The insights CTA `href` is `z.string()`, so a server-sent `@evil.example/x` would change the host. | — | phone | by code |
| A3-S-15 | info | Smaller items, listed below. | — | — | mixed |

---

## Findings

### A3-S-1 · high (layer: medium) · STUDENT (and the card's printers) · api · REPRODUCED LIVE

**What happens.**
- `joinAsStudent` (`apps/web/src/app/join/actions.ts:125,181`) stores `avatarKey` exactly as sent. `studentJoinSchema.avatarKey` is `trimmed(1, 60)` (`src/lib/validation.ts:212`), with no `AVATAR_PRESETS` check. `account.ts:120`, `student/profile/actions.ts` and the family and staff writers all refuse non-presets.
- `"upload:" + <uuid>.png` is 47 characters, so it fits.
- The ID card (new in this batch) reads `photoFileId: m.user.avatarKey?.startsWith("upload:") ? m.user.avatarKey.slice(7) : null` (`src/lib/id-card.ts:71`).
- `renderIdCardPdf` (`src/lib/id-card-pdf.tsx:46-48`) calls `readStoredFile(card.photoFileId)`. That is a raw blob read (`src/lib/storage.ts:147-156`, a regex on the name only): no StoredFile row, no owner, no tenant and none of `files.ts`'s rules.
- Any PNG or JPEG in the blob store whose id is known is drawn into the card. That includes another school's KYC image, scholarship or application scans and submissions.
- Nothing in the app writes `upload:` avatars legitimately.
- The hall ticket (`exam-cell-after.ts:463`, before the baseline) has the same sink. The ID card is a second one.

**Steps.**
1. Set zz.pupil01's `avatarKey` to `upload:9ee6262d-…-19f75e7f7dba.png`. That is a blob owned by no row: the CLAUDE.md rule forbids accounts through the UI, so this stands in for the join form.
2. As that STUDENT, call `GET /api/v1/id-cards/pdf`.
3. As the same STUDENT, call `GET /api/files/<same id>`.

**Expected.** No photo, or a refusal, as `files.ts` gives.

**Actual.**
```
card (avatarKey NULL)            GET /api/v1/id-cards/pdf   200  <pdf 20335 B>
file-direct                      GET /api/files/9ee6262d-…png 404  Not found
card (avatarKey upload:<id>)     GET /api/v1/id-cards/pdf   200  <pdf 24147 B>
```
The card grew by the image and the same file is 404 to the same person. The key was restored to NULL.

**Evidence.** `scratchpad/audit3-sec/probes/p3a.out.json`, `p3b.out.json`. Reproduced alone.

**Fix.**
- In `studentJoinSchema` / `joinAsStudent`, refuse any key outside `AVATAR_PRESETS`.
- In `id-card.ts` and `exam-cell-after.ts`, drop the `upload:` branch, or authorise the file through `files.ts` for the pupil's own user before `readStoredFile`.
- Add a data:audit check that flags avatarKeys outside the presets.

### A3-S-2 · high (layer: medium) · ADMIN, FACULTY, HOD · both · REPRODUCED LIVE

**What happens.**
- `setStreams` (`src/lib/streams.ts:101-114`) never prunes `Membership.dutiesJson`.
- The session (`session.ts:340`) and `requireDuty` (`duties.ts:45`) read the membership's list without intersecting it with `offeredDuties`. A duty therefore survives its stream at the gate and in the library.
- `setDuties` (`duties.ts:68-71`) refuses the whole list when any member of it is not offered.
- The registrar's panel (`admin/people/duties-panel.tsx:23,36,55-58`) starts from the held list, draws boxes only for offered duties and always re-sends the stale one. Every save is therefore a 422, and the web cannot take the duty away. Only a hand-made API call with the full allowed list can.

**Steps (ZZ Shastri, restored).**
1. As ADMIN, set streams to `["ENGINEERING","EDUCATION"]`.
2. Grant zz.faculty.s1 `["LAB_INCHARGE","PRACTICE_TEACHING_COORDINATOR"]`.
3. Set streams back to `["ENGINEERING"]`.
4. As the faculty member, read the desk.
5. As ADMIN, send what the panel sends.

**Actual.**
```
st1   POST /admin/college-profile {streams:[ENGINEERING,EDUCATION]}   200
du1   POST /admin/people/{mid}/duties [LAB_INCHARGE,PRACTICE_TEACHING_COORDINATOR]  200
st2   POST /admin/college-profile {streams:[ENGINEERING]}             200
tp-after  FACULTY GET /duties/teaching-practice   200 {"offered":false,"canManage":false,"canObserve":false,…}
du-panel  ADMIN POST duties [LAB_INCHARGE,PRACTICE_TEACHING_COORDINATOR]  422 "The college's streams do not offer that duty."
du-restore ADMIN POST duties [LAB_INCHARGE]       200
tp-final  FACULTY GET /duties/teaching-practice   403 "This is for a member of staff who holds that duty."
```

**Impact.**
- The teaching-practice library checks the stream itself (`offered:false`, no manage). The reads and writes of the other desks check only the duty: the lab (breakage write-offs against INVENTORY), NSS and NCC (enrolments, activities into IQAC criterion 3.6), the research dean and the exam squad.
- So a college that drops SCIENCE/ENGINEERING keeps its lab in-charges live. A college that drops every stream offering NSS/NCC keeps its officers live.
- In every case the registrar's web panel cannot revoke.

**Evidence.** `probes/p2.out.json`. Reproduced alone.

**Fix.**
- In `setDuties`, refuse only newly added duties that are not offered.
- In the panel, show held-but-not-offered duties so they can be unticked.
- Either intersect with `offeredDuties` in `dutiesOfMembership` and `session.ts`, or prune `dutiesJson` (audited) in `setStreams`.

### A3-S-3 · low (layer: low-medium) · limited roles · web · REPRODUCED LIVE

**What happens.**
- The S-11 fix made a missing stamp fail closed (`role-gate.ts:157`).
- The middleware matcher still skips any page path ending in `.[A-Za-z0-9]{2,12}` (`middleware.ts:124`). On such a path `routed()` never overwrites `x-edulink-route`, so a client-sent value reaches `gateRequest` (`session.ts:356`).
- The comment at `route-header.ts:6-7` ("a client can only ever make its own request narrower") is untrue there.

**Actual (cookie sessions; location headers shown).**
```
WARDEN  GET /library/titles/x.ab                              307 → /switch            (gate: no-context)
WARDEN  GET /library/titles/x.ab  x-edulink-route: GET /hostel  307 → /switch?next=/library (gate passed; page's requireRole refused)
FACULTY GET /iqac/documents/x.ab  x-edulink-route: GET /faculty 307 → /switch?next=/iqac   (gate passed)
WARDEN  GET /people/x.ab                                      307 → /switch
WARDEN  GET /people/x.ab          x-edulink-route: GET /hostel  404                     (gate passed; page's notFound)
```

**Impact.** Every page I tried has its own second lock, so nothing leaked. But the default-deny page gate, which now also carries the NAV `duty` rule, is bypassable by a header. A future page that relies on the gate alone would be open.

**Evidence.** `probes/p3a.out.json`. Reproduced alone.

**Fix.** Any one of:
- strip `x-edulink-route` on every request (a matcher that covers every non-asset path) and stamp it;
- have the gate require a per-process secret alongside the stamp;
- narrow the matcher's extension exclusion to real static extensions.

### A3-S-4 · medium (layer: low-medium) · ADMIN+PRINCIPAL dual holder · both · by code

**What happens.**
- `decideRefundException` (`src/lib/head-approvals.ts:~98-113`) has no check that `refundAskedByUserId !== me.userId`.
- `decideExpulsion` (`:186-197`) has no check that `proposedByUserId !== me.userId`.
- `Membership` is unique on (userId, schoolId, role), so one person may hold ADMIN and PRINCIPAL at a college, as the ZZ Banyan multi-role accounts do. That person asks as ADMIN and approves as PRINCIPAL.
- The earlier concession decide (`college-fees.ts:222`) has the same gap.

**Probe (not run: it needs a second membership made for a ZZ user).**
1. As ADMIN, `POST /api/v1/college/admissions/applications/{cancelled}/refund-exception {refundPaise, reason}`.
2. Switch to PRINCIPAL and `POST …/refund-exception/decide {approve:true}`.

Suspected: 200.

**Fix.**
- Refuse a decision by the asker or proposer (403), and do the same for concessions.
- If a one-person college must be allowed, say so in the decision log.

### A3-S-5 · medium (layer: low-medium) · signed-out readers · web/api · by code

**What happens.**
- `officeTakeDownProfile` (`src/lib/faculty-profile.ts:~105`) has no caller anywhere in `src`: grep outside the file returns nothing.
- `me()` needs an active FACULTY or HOD membership and IQAC on. A teacher who has left, or a college that switched IQAC off, cannot unpublish.
- Nothing in departure or off-boarding touches `FacultyPublicProfile`.
- `publicFaculty` (`:118`) serves the rows by slug with no check on the member.

The result is that a former teacher's name, qualification and research stay up as the college's staff indefinitely, which is an erasure problem.

**Fix.**
- Give the office a door and page for the takedown.
- Delete the profile on departure.
- Let the unpublish path skip the module check.

### A3-S-6 · low · anyone holding a card · api · partly live

**What happens.**
- At a school, `Membership.studentCode` is the guardian-claim code (`src/lib/codes.ts:45-52`: "A parent needs this *and* the child's birthdate to claim").
- The card prints it and encodes `${origin}/id-check?c=<code>` in the QR (`id-card.ts:72-77`, `id-card-pdf.tsx`). A card shown at the gate or on the bus hands out the first factor in machine-readable form.

**Live.**
- `GET /id-check?c=STU-V6GX-RTDP` → 404. No such page exists on web or phone, so the QR leads nowhere.
- `GET /api/v1/id-cards/check` is fenced: another school's code reads `found:false` (`p2.out.json`).

**Fix.**
- Give the card its own identifier (random, or an HMAC of the membership).
- Keep the claim code off the card.
- Build the `/id-check` page or change the QR.
- Take the QR's origin from a configured `APP_URL` rather than `request.url`.

### A3-S-7 · low · IQAC, PRINCIPAL, ADMIN, HOD · api · timings live, rest by code

**What happens.**
- None of these route files calls `budget()`: `iqac/council/{pci,bci,ncte,nba}` GET, `iqac/insights/nba`, `iqac/insights/nirf`, `iqac/simulate`, `iqac/simulate/nba`, `iqac/scenarios` GET and DELETE.
- They do the same work as the budgeted filing generate and cycle compute (the S-18 rule).
- Measured single calls on the shared dev server:

  | door | time |
  |---|---|
  | insights | 1.25–1.57 s |
  | insights/nba | 2.06 s |
  | simulate/nba | 2.64 s |
  | council/nba | 1.88 s |
  | `/hod/nba/simulator` page | 3.16 s |

- The list multiplies the cost: `scenarioViews` (`iqac-insights.ts:467-474`) recomputes `nbaBaseline` once per distinct (department, year). `scenarioSaveSchema` accepts any year from 2000 to 2100 and the cap is 100. So an HOD can save 100 years of their department and make every later list and delete about 100 `nbaFacts` passes. The same 100 rows also fill the whole college's cap, and the IQAC then gets 409.
- The cap itself is check-then-insert outside a transaction (`:529-553`).

**Fix.**
- Use `HEAVY_READ` budgets on those doors.
- Bound an NBA scenario's year to a window.
- Make the cap per department or per author, and take it under an advisory lock in `$tenantTransaction`.

### A3-S-8 · low · anyone · api · REPRODUCED LIVE

`api/v1/public/faculty/[slug]/route.ts` has no `budget()`. The certificate check, exam documents and surveys public routes all have one.

**Live.** 130 signed-out GETs in sequence returned `129 × 200`, `1 × 000` (a timeout on the busy shared server) and no 429.

**Fix.** Use `budget(\`public-faculty:${ip}\`, …)` like `certificates/check`.

### A3-S-9 · low · PARENT, STUDENT · api · by code

**What happens.**
- **Question leak.** `slipForReader` (`src/lib/permission-slips.ts:148-160`) checks only that the reader has a child at the post's school (or that a student is at their own school). It then answers the 300-character question and `consentBy` with `children: []`, even for another class's CLASS post the reader cannot open in the feed.
- **Cost.** `audienceOf` (`:59-64`) loops up to 5,000 seats calling `studentTokensOf` one by one. A POST calls it twice (`inAudience`, then `slipFor`). The consent route has no budget.
- The fixtures hold no slip (0 posts with `consentBy`), so neither was run.

**Fix.**
- Return 404 when the reader cannot open the post, reusing `readPost`'s visibility.
- Test a single student's own tokens instead of the whole audience.
- Put a budget on the consent POST.

### A3-S-10 · low · FACULTY, HOD (law college) · api · by code

`saveMootCourt` with an `id` (`src/lib/stream-records.ts:389-392`) updates `{ id, schoolId }` with no check on the creator, department or role. Any FACULTY can rewrite the office's moot (teams, result, judges' notes), and those records feed the BCI return. The write is audited. No ZZ fixture has the LAW stream.

**Fix.** Limit edits to the creator, the office and the law department's HOD, and freeze moots in a year whose BCI return has been generated.

### A3-S-11 · low · FACULTY, HOD · api · partly live

These reads are college-wide where the role is departmental:
- **Lab batches.** `GET /stream-records/lab-batches` returns every division with each student's name and roll number to any FACULTY or HOD (`stream-records.ts:145-181`). Live as zz.faculty02 (no duties): 200, listing "ZZ FY BSc Physics A" with three named students. Vidya has one division, so crossing a department is not shown.
- **Research dean.** `GET /duties/research` gives a FACULTY holding RESEARCH_DEAN every teacher's `apiScoreInputs`/`apiScore`, which are appraisal input (`duty-desks.ts:113`). Live: `perFaculty[…].apiScoreInputs {"teaching":80,"research":40,"service":15}`.
- **Law internships.** `GET /stream-records/law-internships` gives any HOD the `perStudent` weeks (`stream-summaries.ts:106-113`).
- **HOD's "what you did last".** `nbaInsights`'s `lastDone` (`iqac-insights.ts:140,380`) reads the whole college's audit log by action prefix, with the actors' names. Live it returned `[]` at saraswati-tech: there were no matching rows.
- The college-wide lab in-charge signing (`stream-records.ts:271-273,341-345`) and the exam squad seeing student names in malpractice cases (`duty-desks.ts:152`) are by design in the comments. They are listed for the owner to confirm.

**Fix.** Scope FACULTY and HOD to their offerings or department, keep the API score to the office or principal, and give an HOD only `iqac.worksheet.*` rows of their own department.

### A3-S-12 · low · ACCOUNTS, FACULTY, WARDEN · phone · by code

These new screens lack `usePrivateScreen()`. The same kinds of screen already use it (`staff/fee-pupil.tsx:32`, `staff/incidents.tsx:38`).
- `college-office/lookup.tsx` (ledger and no-dues)
- `college/duties.tsx` (anti-ragging)
- `college/duty-desks.tsx` ExamSquadScreen (malpractice cases)
- `hostel/warden.tsx` (boarders, leave, visitors)
- `alumni/college.tsx`

**Fix.** Add the hook.

### A3-S-13 · low · repo hygiene · by code

`ops/load/college-check.ts:128-130` writes the minted faculty, student, parent, TPO and IQAC bearers to the `--emit-cookies` path. The documented paths are `ops/load/college-cookies.json` and README `ops/load/cookies.json`, and `git check-ignore` matches neither (rc=1). CLAUDE.md's `git add -A` would commit them. They are one-hour ZZ sessions only.

**Fix.** Add `ops/load/*cookies*.json` to `.gitignore`, or default the path to the temp directory and purge the sessions in a `finally`.

### A3-S-14 · info · phone · by code

`openWeb` (`apps/mobile/src/screens/family/shared.tsx:21-22`) is ``Linking.openURL(`${API_BASE}${path}`)``, and `insightCtaSchema.href` is `z.string()` (`packages/contracts/src/v1/iqac-insights.ts:63`). The server sends only the coded constants that begin with "/". A compromised or mistaken server sending `@evil.example/x` would move the host.

**Fix.** On the phone, look the href up by `cta.code` from `INSIGHT_CTAS`, or require `^\/(?!\/)` in the schema and in `openWeb`.

### A3-S-15 · info · the smaller items

- **Accounts look-up wildcards.** `accounts/lookup` passes `%`/`_` through Prisma `startsWith`/`contains`. Live, `q=__` and `q=%%` return 20 students. The desk may read all of them anyway, the results are capped at 20 and the door is budgeted.
- **Adult pupils and slips.** At a *school* an adult pupil answers their own slip and so does the guardian; the last answer wins (`permission-slips.ts:81-85`). The docstring says this is for colleges.
- **Refund amount.** `refundExceptionAskSchema.refundPaise` has no upper bound against what was paid.
- **Refund decide module check.** `decideRefundException` skips `assertModuleOn("ADMISSIONS")` on the web action path.
- **Duties module check.** The `setDutiesAction` web path skips the ACADEMICS module check that the API door gets.
- **Expulsion timing.** An approved expulsion ends the allotment at once even when `effectiveOn` is in the future.
- **Cards for leavers.** The office and guardian can print a card for a student who has left; `cardOf` has no status filter.
- **NBA worksheet.** It stays writable after the SAR is signed off (`council-filings.ts:690-714` reads no filing status).
- **Scenario removal.** Scenarios can be removed by any IQAC or principal, or by the department's HOD, including ones the IQAC saved. This is by design and audited; listed for the owner to confirm.
- **Duty doors.** The duty write doors have no budget, and every flagged squad visit notifies every exam controller.
- **Corps dates.** `leaveCorps` accepts a future day and `addCorpsActivity` has no lower date bound.
- **API sweep sessions.** They last 24 h and the clean-up deletes only expired ones (`scripts/api-sweep.ts:53,941`).
- **zz-token.** The `RECRUITER` branch has no `@zz.test`/`@demo.relay.test` guard on the email (`scripts/zz-token.ts:80-81`).
- **decode-uri-component.** The moderate advisory's module (via `expo-router > query-string`) is in the phone bundle. expo-router's fork that parses incoming links has `queryString.parse` commented out (`fork/getStateFromPath.js:538`), so no deep link reaches the vulnerable call. This closes the 4 Oct "Untested".

## Checked and sound (what held)

**Duty gate**
- `role-gate.ts:168-170` checks the role first and then `permits(e, role, duties)` (403 `duties.refuseNoDuty`).
- Duties come from the membership of the *active* school (`session.ts:330-341`), so a duty at college A gives nothing at college B.
- Live: FACULTY without the duty is 403 on all 7 desks and with it 200. An HOD without the duty is 403. ACCOUNTS and STUDENT are 403 "wrong role". Northgate ADMIN is MODULE_OFF.

**Library second lock**
- `deskCaller`/`requireDuty` (`duty-desks.ts:46-56`, `anti-ragging.ts:36-42`, `corps.ts:55`, `teaching-practice.ts:79,124`).
- Server actions in `duties/actions.ts` call only those functions.
- The duty pages go through `dutyPageContext`. Live: a non-holder gets 307 `/switch` and a holder 200.

**setDuties**
- ADMIN only, at a college. The membership must be this school's, ACTIVE and not left (else 404). A non-teacher is 422. Unknown codes are 422. Audited and idempotent.
- `parseDuties` and `parseStreams` survive malformed JSON.

**Streams**
- `writeDefaultModules` runs only when a tenant is made and filters by kind.
- `setStreams` switches no module and is ADMIN-only, college-only and audited.

**IDOR on the new id doors** (all `findFirst/updateMany {id, schoolId}`)
- teaching-practice postings and observations;
- squad visit (the hall must belong to the paper);
- lab breakage (a school room of kind LAB);
- corps;
- lab batches (`moveToLabBatch` requires students seated in the division);
- practical sign (records by id+school with a count match);
- moot team members (STUDENTs of the school).

**Insights and scenarios**
- Live: FACULTY, HOD, STUDENT, PARENT, ACCOUNTS, TPO and EXAM_CONTROLLER are refused the NAAC insights (403).
- Another college's scenario is 404 on simulate, insights, compare and DELETE (`scenarioRow` `findFirst {id, schoolId}`).
- An HOD asking for another department's `insights/nba`, `simulate/nba` or `council/nba` is 403 "own department only".
- `listScenarios` forces the HOD's own department. `/hod/nba/simulator` drops `departmentId` (verified in source and live).
- The stored result is recomputed and never taken from the caller. NAAC keys the framework does not read are refused.
- The `back` redirect in the simulator and council actions is regex-whitelisted.

**Raw SQL**
- None in `stream-records.ts`, `stream-summaries.ts`, `council-filings.ts`, `council-rules.ts`, `iqac-insights.ts`, `accreditation-insights.ts` or `tests/audit-recounts.ts`.
- `zz-lifecycle.ts`'s `*Unsafe` calls interpolate only `information_schema` and constant identifiers, with values bound; it is a script.

**XSS**
- No `dangerouslySetInnerHTML` in the new components or pages.
- Scenario names, worksheet notes, judges' notes and the faculty card are React text. The CTA hrefs are contract constants. The flash shows whitelisted keys only.
- The council returns are PDFs, so there is no new CSV-injection surface.

**Secrets**
- `council-filings.ts teachers()` selects no sealed PAN. No insights payload, SAR or worksheet carries a sealed field.

**Origin lock**
- All `/api/v1/**` goes through `cors()` → `originLock` (`middleware.ts:43,109`).
- Live: a cookie POST to `/iqac/scenarios` with Origin `https://evil.example` → 403 (empty body). With the same origin → reaches the body check (422).

**ID cards**
- A STUDENT gets only their own card. A PARENT needs `assertGuardianAccess`: live, an adult child with no grant is 403 and the minor child is 200.
- The office is fenced to its school (live 404 for another school's student). `PDF_BUDGET` applies.
- The check door is for the checkers only and scoped to the school (live `found:false` for another school's code). Claim codes carry about 30 bits.

**Permission slips**
- The role is checked before the body. A guardian needs an ACTIVE link and the child's school must equal the post's. The child must be in the audience. Minors are refused.
- The report goes to the office or head, or a teacher of their own class or post.

**Head approvals' state machines**
- Guarded `updateMany` on ASKED/CANCELLED. Deciding twice is a no-op or refused; deciding after a withdraw is refused.
- Withdraw belongs to the proposer or the office. The incident must be the same student's.

**Night-out register.** WARDEN, ADMIN or PRINCIPAL, the school only, module on, date validated. A guardian is not in its access list.

**Accounts look-up.** `collegeDesk(MONEY_READ)`, the school only, live students, at most 20, budgeted.

**Public faculty page**
- Opt-in by the teacher alone, for their own membership.
- The snapshot has no email, phone or PAN. The slug is regex-checked. RLS is SELECT-only for the global read.

**Load fixes**
- The Prisma patch (`patches/@prisma__client@6.19.3.patch`) caches only key-name arrays and layer-index maps. It does not touch `$transaction`, itx, the pool or `set_config`, and `db.ts` is unchanged, so no tenant setting is shared.
- `/i18n/[file]` accepts only `^[a-z]{2}\.[0-9a-f]{16}\.json$` with a known locale (no traversal) and serves only public dictionary text. A stale hash gets `no-store`.
- The service worker's new CacheFirst rule covers `/i18n/` GETs only.
- `robots` defaults to noindex.
- `compress:false` leaves headers and CSP unchanged.

**Config**
- Dockerfile, `fly.toml` (4 GB) and `.env.example` hold placeholders only.
- `ops/load/college-check.ts` refuses a slug that is not `zz-` and defaults to localhost.

**Sessions**
- Nothing in `src/` mints or lengthens a session. The `session.ts` diff only reads `dutiesJson`.
- The contract test takes tokens from env and mints none. zz-token's new PARENT branch is suffix-guarded.

**Phone**
- PH-1, PH-2 and PH-3 are fixed: the outbox owner and `X-Edulink-Owner`, the 401 path running `runSessionEnd`/`forgetPerson`, tracking stopped on session end.
- PH-8 and PH-9 are fixed: the CSP meta in `+html.tsx` and `allowBackup:false`.
- No new storage keys.
- No new screen writes from a link parameter; the `placement-drive` route reads only `driveId`.
- The duty tabs only hide entries; the server enforces.

## Dependency audit

`corepack pnpm audit` (root), run today:
```
7 vulnerabilities found
Severity: 4 moderate | 3 high (2 ignored)
```
On 4 Oct it was 9. The two browserslist highs are gone (the override works).

| sev | package | path | reaches |
|---|---|---|---|
| high | braces 3.0.3 | expo/metro/jest; web `eslint-config-next > fast-glob` | build and lint only |
| moderate | uuid 7.0.3 | `@expo/config-plugins > xcode` | prebuild only |
| moderate | vitest, @vitest/mocker 3.2.7 | web and packages | tests only |
| moderate | decode-uri-component 0.2.2 | `expo-router > query-string` | in the phone bundle, but the vulnerable `parse` is not on the deep-link path (A3-S-15) |

None reaches the web runtime. JSON: `scratchpad/audit3-sec/pnpm-audit.json`.

## By design and environment (excluded; not findings)

- The NAAC insights are open to the college ADMIN (registrar), PRINCIPAL and IQAC (DESK), as the catalog says. ADMIN 200 is by design.
- An HOD's `GET /iqac/scenarios?departmentId=<other>` answers 200 `{"items":[]}`: the list is forced to the HOD's own department and the parameter is ignored. Not a leak.
- The teaching-practice desk at a college without EDUCATION answers `offered:false` and refuses management. That is the library's stream check working; it is the part of A3-S-2 that is sound.
- `idc-x` answers `found:false` with the code echoed back. It echoes the caller's own input; nothing is revealed.
- `status 0` on 1 of 130 public calls, and a 3 s `/api/health`, came from the shared server being loaded by the other two auditors. It was not rerun because the rate-limit finding does not depend on it.
- The `/hod/nba/simulator?departmentId=<other>` page answering 200 shows the HOD's own department, because the page drops the parameter.

## Untested

- Untested: A3-S-4 (it needs a second membership for one ZZ user), A3-S-5 (it needs a publish and then a departure), A3-S-9 (no slip post in the fixtures), A3-S-10 (no LAW college in the fixtures) and the cap race and 100-year amplification in A3-S-7 (writes at a demo college). Each finding gives its probe.
- Untested: the A3-S-1 join path itself. The avatarKey was set by SQL because CLAUDE.md forbids making accounts through the UI. The schema and action lines are quoted above.
- Untested: whether the image drawn in the A3-S-1 card is exactly the file. The size delta (+3,812 B with only the key changed) and the code are the evidence; the PDF was not decoded.
- Untested: the phone screens on a device or simulator, the native bundles, and the S-11(b) encoded-segment case under `next start` (dev server only).
- Untested: `api:sweep`, `--cross` probes, the page sweep, Playwright and axe. These were out of brief or forbidden.
- Untested: Hindi and Marathi.

