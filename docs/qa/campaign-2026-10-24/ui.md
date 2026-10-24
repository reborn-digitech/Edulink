# Layer 4 — UI and UX (24 October 2026)

The builder for layer 4 walked every screen each role's menu shows on the web app (:3000) and on the phone app's
web target (:8081), as the ZZ fixture actors, with Playwright contexts built by the harness's own `contextFor`
(`apps/web/e2e/actors.ts`) and sessions minted by `npm run zz:token -- ROLE email --tag=qa-ui`. Nothing was
typed into a password box, no account was made, nothing was pressed but Tab; every page was opened with a GET.
Nothing was fixed.

## How the walk was done

- **Actors** (all minted): zz.admin, zz.principal, zz.teacher1, zz.pupil01, zz.parent01 (ZZ Northgate);
  the fixture expert; zz.driver01, zz.librarian, zz.warden, zz.alumni01 (Northgate's module roles);
  zz.faculty01, zz.hod01, zz.examctrl, zz.iqac, zz.tpo, zz.accounts, zz.cadmin, zz.cprincipal, zz.cstudent02
  (ZZ Vidya College); zz.recruiter01; zz.appadmin; zz.operator. The demo accounts were not used: layer 1 was
  still completing accounts.md when this layer started, and the brief allows the ZZ schools by minted session.
- **Which screens**: for each actor, the menu exactly as the shell drew it (read off the rail of the home at
  1280 px, so a module that is off, a duty not held or a platform feature that is off is not walked), plus the
  floating action, the palette's actions, `/account` and `/notifications`; for the operator and the app admin,
  every static page under `/root` and `/appadmin`. Then up to fifteen **detail pages** per actor: one of each
  route pattern linked from the menu's pages (a class, a thread, a certificate, a post, a question...).
  474 menu pages and 262 detail pages, 736 screens.
- **Combinations**: every screen at 1280 × 900 and 390 × 844, light and dark, English (2,944 loads); every
  screen once in Hindi at 390 px light (736 loads; the account's own `prefs.locale` set to `hi` for its walk
  and put back byte for byte after — checked afterwards: no ZZ account left in Hindi or Marathi). Phone web
  target: every tab and every More-sheet screen the phone's menu shows the role (`menuFor`/`tabShown` with
  the role's `/api/v1/me`), at 390 × 844, light and dark (862 loads).
- **Measured on every load**: HTTP status and where the page landed, sideways scroll, interactive elements
  under 44 × 44 px (the harness's `smallTargets` rule), controls with no accessible name, images without alt,
  raw dictionary keys, placeholder words (`undefined`, `NaN`, `{var}`), duplicate ids, console errors and page
  errors, failed `/api/v1` calls, and axe-core (wcag2a/2aa/21aa + best-practice) on every English load.
  Focus order on every home at both widths (fourteen Tab presses). First paint of every home (pictured at
  `commit`). Loading and error states on the phone: every tab screen with every API answer but `/me` slowed
  by 4 s, then failed with a 500. The web's homes with every client `/api/v1` call failed.
- **Screenshots**: `docs/qa/campaign-2026-10-24/shots/<role>/<screen>-<width>-<theme>.png` (full page, cut at
  5,000 px), `-hi` for Hindi, `phone-<screen>-390-<theme>.png` for the phone, `-slow`/`-fail` for the phone's
  states, `home-firstpaint-*` and `home-apifail-*` for the web's. 5,028 files, about 620 MB — too large to
  commit whole; the report cites the ones that matter. The walk's own records (one JSON line per load, gzipped),
  the menu parity table and the two Playwright logs are in `shots/_data/`. The expert's profile pictures were
  deleted after the walk: the page prints the fixture expert's calendar-feed token.
- **Features**: the platform features are OFF on the dev database. The main walk saw them off, as a person
  does today. Then, for the screens that need them, a
  second pass: as zz.operator, through the operator's own doors (`POST /api/v1/operator/features/{code}`,
  `PUT /api/v1/operator/person-plans`, the sweep's `runSwitches`), all seven features (ASSISTANT,
  QUESTION_BANK, QUESTION_GIG, EXPERT_SESSIONS, TEACHER_SESSIONS, JOB_BOARD, TEXT_MESSAGING) and the three plans
  were switched ON at 08:05:04 UTC, every menu entry under a feature (and `/assistant`) was walked at the four
  web combinations (200 loads), and they were switched back OFF at 08:13:41; then ON again at 08:13:49 for the
  phone's feature screens (34 loads) and OFF at 08:16:33. Both restores were confirmed by the script's own
  "switched back off" line. Anyone using :3000 in those two windows saw the features on.

Dev-server conditions: the walk shared :3000 with layers 1, 2 and 5 running at the same time; the web dev
server was restarted by someone else at about 05:53 UTC, mid-walk (six loads hit a refused connection and
were walked again afterwards); median load 5.9 s, 90th percentile 13 s. Those times are a loaded `next dev`,
not the product, and are not reported as findings. Phone screens first pictured while still drawing their
loading skeleton (156 of 862, the server being busy) were walked again, waiting up to 42 s; every one of them
then finished drawing (median 7 s from navigation, bundle start included). None stayed on a skeleton.

## Screens walked

| Role (actor) | Menu pages | Detail pages | 1280 light | 1280 dark | 390 light | 390 dark | 390 Hindi | Phone light | Phone dark |
|---|---|---|---|---|---|---|---|---|---|
| Admin (zz.admin) | 49 | 15 | 64 | 64 | 64 | 64 | 64 | 45 | 45 |
| Principal (zz.principal) | 41 | 15 | 56 | 56 | 56 | 56 | 56 | 39 | 39 |
| Teacher (zz.teacher1) | 27 | 14 | 41 | 41 | 41 | 41 | 41 | 25 | 25 |
| Student (zz.pupil01) | 19 | 11 | 30 | 30 | 30 | 30 | 30 | 19 | 19 |
| Parent (zz.parent01) | 26 | 14 | 40 | 40 | 40 | 40 | 40 | 26 | 26 |
| Expert | 5 | 3 | 8 | 8 | 8 | 8 | 8 | 4 | 4 |
| Driver | 6 | 7 | 13 | 13 | 13 | 13 | 13 | 6 | 6 |
| Librarian | 13 | 8 | 21 | 21 | 21 | 21 | 21 | 6 | 6 |
| Warden | 14 | 8 | 22 | 22 | 22 | 22 | 22 | 7 | 7 |
| Alumnus | 7 | 10 | 17 | 17 | 17 | 17 | 17 | 7 | 7 |
| Faculty | 24 | 12 | 36 | 36 | 36 | 36 | 36 | 25 | 25 |
| HOD | 19 | 13 | 32 | 32 | 32 | 32 | 32 | 22 | 22 |
| Exam controller | 9 | 12 | 21 | 21 | 21 | 21 | 21 | 9 | 9 |
| IQAC | 17 | 15 | 32 | 32 | 32 | 32 | 32 | 17 | 17 |
| TPO | 15 | 13 | 28 | 28 | 28 | 28 | 28 | 15 | 15 |
| Accounts | 18 | 15 | 33 | 33 | 33 | 33 | 33 | 16 | 16 |
| College admin (zz.cadmin) | 55 | 15 | 70 | 70 | 70 | 70 | 70 | 54 | 54 |
| College principal (zz.cprincipal) | 44 | 15 | 59 | 59 | 59 | 59 | 59 | 49 | 49 |
| College student (zz.cstudent02) | 28 | 14 | 42 | 42 | 42 | 42 | 42 | 31 | 31 |
| Recruiter | 3 | 3 | 6 | 6 | 6 | 6 | 6 | 3 | 3 |
| App admin | 10 | 15 | 25 | 25 | 25 | 25 | 25 | 3 | 3 |
| Operator | 25 | 15 | 40 | 40 | 40 | 40 | 40 | 3 | 3 |
| **Total** | **474** | **262** | **736** | **736** | **736** | **736** | **736** | **431** | **431** |

The faculty's and HOD's counts include one e-resource "open" link that leaves the app for the provider's own
site (a fixture e-resource); that site's axe and size results are excluded everywhere below.

## What held

- **No sideways scroll** on any of the 3,680 web loads or 862 phone loads, at either width, in either theme or
  language.
- **No serious or critical axe violation** on any page of the app, web or phone, light or dark, 1280 or 390
  (the only ones were on the outside e-resource site). Moderate and minor ones are in UI-12.
- **Dark mode**: no contrast violation anywhere; screenshots show no light-only artwork or unreadable chips.
- **Hindi**: every page set `lang="hi"`, no raw dictionary key on any page, no placeholder word, no overflow
  in Hindi either; the one class of English left on the screen is UI-02.
- **Focus**: every home starts with "Skip to content", the rail at 1280 px and the top bar at 390 px draw a
  visible focus ring (`shots/teacher/focus-tab2-390-light.png`, `focus-tab4-390-light.png`); no focus stop
  was off-screen.
- **Phone states**: on every tab screen of every role, a failed answer shows the server's sentence in a red
  card with "Try again" (`shots/admin/phone-leave-390-light-fail-2.png`), and a slow one a skeleton; none hung
  blank. The expert's home says plainly that sessions are not open.
- **Targets**: apart from UI-03, nothing under 44 px at 390 px on the web or the phone.
- **Menu pages under the harness's gate** (H-1 to H-3 below): the axe matrix passed 1,079 of 1,106 tests
  that ran, every failure being a feature that is off or an expired harness session; the viewport matrix's
  overflow and 44-px checks passed in all 64 cells.

## Findings

Severity counts: 0 Critical, 0 High, 3 Medium (UI-01, UI-02, UI-15), 12 Low (UI-03 to UI-14), and three notes on the test harness (H-1 to H-3) after them.

### UI-01 · Medium · Web · Links into pages the role may not open (dead ends at "Where would you like to go?")
- Type UI-UX · Severity Medium · Platform Web · Feature: global feed, placement analytics, people links for the limited roles
- Steps:
  1. As zz.driver01 (DRIVER, minted), open `/bulletin/global`. Press "← Our school's feed" (`/bulletin`), or "Upcoming birthdays →" (`/bulletin/celebrations`), or a post's "Comment" (`/bulletin/<id>`).
  2. The same as zz.librarian (LIBRARIAN) and zz.warden (WARDEN).
  3. As zz.iqac (IQAC, ZZ Vidya), open `/placement/analytics` (in the IQAC's menu) and press its tabs Season, Drives, Students or Companies (`/placement`, `/placement/drives`, `/placement/students`, `/placement/companies`).
  4. As zz.alumni01 (ALUMNUS), open `/remarks/people` and press a person's name or picture (`/people/<membershipId>`).
- Expected: a role is offered only links its gate lets through, or the link is drawn as text.
- Actual: each link lands on `/switch`, "Where would you like to go?", offering the one context the person already has (`shots/driver/bulletin-390-light.png`, `shots/driver/bulletin-global-390-light.png`, `shots/iqac/placement-1280-light.png`). Reproduced at both widths, both themes and in Hindi (71 loads).
- Suggested fix: pass the viewer's role into the feed header, `FeedFilters`, `PostCard` and the placement tab strip and leave out (or un-link) what `role-gate.ts` would refuse; for the alumnus, link `/people/<id>` only for roles that read profiles.
- Files: `apps/web/src/app/(app)/bulletin/global/page.tsx:66`, `apps/web/src/app/(app)/bulletin/feed-filters.tsx:119`, `apps/web/src/app/(app)/bulletin/post-card.tsx`, `apps/web/src/components/placement/parts.tsx:88-91`, `apps/web/src/app/(app)/remarks/people/page.tsx:159,167`, `apps/web/src/lib/role-gate.ts`.

### UI-02 · Medium · Web · Relative times stay English in Hindi (and Marathi)
- Type UI-UX · Severity Medium · Platform Web · Feature: notifications, messages, feed, homes, office lists
- Steps: 1. Set zz.admin's language to Hindi (the walk set `prefs.locale`). 2. Open `/notifications` at 390 px.
- Expected: "2 घंटे पहले", "पिछले सप्ताह" (Intl.RelativeTimeFormat speaks hi and mr).
- Actual: "2 hours ago", "7 days ago", "last week", "3 weeks ago" under Hindi sentences (`shots/admin/notifications-390-light-hi.png`); the same on `/remarks`, `/bulletin` and `/teacher/assignments`, and by the same function the due lines of the teacher's, parent's and student's homes.
- Suggested fix: `relativeTime()` defaults to the English `LOCALE`; about thirty call sites never pass the reader's locale. Pass it (from `getT`/the request) or make the default read it.
- Files: `apps/web/src/lib/dates.ts:325`; callers in `app/(app)/notifications/page.tsx:151`, `remarks/page.tsx:152,223`, `remarks/[threadId]/page.tsx:100`, `remarks/c/[conversationId]/page.tsx:94`, `teacher/page.tsx:478`, `teacher/assignments/page.tsx:209`, `parent/page.tsx:466,510`, `student/page.tsx:288`, `admin/people/page.tsx:312,358`, `admin/invites/page.tsx:164,169`, `admin/safety/*`, `joins/*`, `bulletin/held-comments.tsx:27`, `faculty/work/*`, `mentoring/request-queue.tsx:76`.

### UI-03 · Low · Web · Touch targets under 44 px on two pages the axe gate never opens
- Type UI-UX · Severity Low · Platform Web · Feature: start a conversation; question editor
- Steps: 1. As zz.teacher1 (or any role), open `/remarks/people` at 390 px. 2. As zz.appadmin, open a question at `/appadmin/bank/<topicId>/<questionId>`.
- Expected: every control at least 44 × 44 px (the rule `e2e/checks.ts` holds the menu pages to).
- Actual: each "Start a conversation with …" button is 40 × 40 (`size-10`), 7 to 60 per page for the fourteen roles that can open it; the "Option n is the correct answer" radios are 16 × 16 and not inside a label. Neither page is a menu entry, so `axe.spec.ts` never measures them.
- Suggested fix: `size-11` on the conversation button; wrap each radio with its choice in a `<label>` (or give it a 44 px hit area).
- Files: `apps/web/src/app/(app)/remarks/people/page.tsx:186`, `apps/web/src/app/appadmin/bank/question-form.tsx:133-140`.

### UI-04 · Low · Web · The expert's profile fails hydration on every load
- Type UI-UX · Severity Low · Platform Web · Feature: expert profile (calendar feed)
- Steps: 1. As the fixture expert (EXPERT, minted), open `/expert/profile` (1280 or 390, en or hi). 2. Read the console.
- Expected: no hydration error.
- Actual: "Hydration failed because the server rendered text didn't match the client"; the diff is the calendar feed address, relative on the server (`/api/v1/expert/calendar.ics?token=…`) and absolute on the client (`http://localhost:3000/api/v1/…`), so React throws the tree away and redraws it on the client. Two softer "attributes didn't match" warnings were seen once each on `/parent/link` (zz.parent01; it did not reproduce on a second load) and `/admin/safety` (zz.cadmin; not reopened).
- Suggested fix: build the feed URL the same way on both sides (from the request's origin on the server, passed down), or render it only after mount.
- Files: `apps/web/src/app/(app)/expert/profile/calendar-card.tsx`, `apps/web/src/app/(app)/expert/profile/page.tsx`.

### UI-05 · Low · Web, Mobile · Words and links for features that are switched off
- Type UI-UX · Severity Low · Platform Both · Feature: platform feature switches
- Steps: 1. With the dev database's features off, as the fixture expert open `/expert/profile` and press the "Get paid" card's earnings link. 2. As zz.admin open `/admin`. 3. As zz.parent01 open the phone's Settings (More → Settings) on :8081.
- Expected: nothing offers a feature the operator has switched off.
- Actual: 1. `/expert/earnings` answers "That page is not here" (EXPERT_SESSIONS off). 2. The staffing card says "Assign a teacher, or post a vacancy to hire one." while the job board is off (`shots/admin/admin-1280-light.png`). 3. The SMS and WhatsApp switches are on and described as working while the operator's dashboard lists "Text messaging: Off" (`shots/parent/phone-settings-390-light.png`). The phone's Settings and the expert's profile also call doors of switched-off features (`GET /api/v1/family/assistant` 404, `GET /api/v1/expert/calendar/token` 404) and log the 404 in the console.
- Suggested fix: read `mayUse`/`features` where these are drawn: hide the earnings link, use the "assign a teacher" sentence alone while JOB_BOARD is off, and grey out the text channels with a line saying texts are not switched on.
- Files: `apps/web/src/app/(app)/expert/profile/get-paid-card.tsx:222`, `packages/i18n/src/en.ts:5917-5918` (`staffingGapBody`), `apps/web/src/app/(app)/admin/page.tsx:119`, `apps/mobile/src/screens/family/settings.tsx`.

### UI-06 · Low · Web · Confusing or unfinished copy
- Type UI-UX · Severity Low · Platform Web · Feature: homes and the circulars page
- Steps and what is seen (all minted ZZ actors, 390 px):
  1. zz.parent01, `/parent`: the attendance-streak tile's hint reads "Starts on the next day in" — the sentence stops (`shots/parent/parent-390-light.png`).
  2. zz.faculty01, `/faculty`: the weekly-load tile reads "13 h a week" over the single word "Within" — within what is not said (`shots/faculty/faculty-1280-dark.png`).
  3. zz.pupil01, `/student` on a Saturday: "Turn up tomorrow to start one" when tomorrow is Sunday, beside "No lessons today" and "Your teacher hasn't taken it yet".
  4. zz.principal, `/admin/circulars`: the tab is titled "Circular reach" and the page "Circulars"; the one Families circular reads "Told 0 / 0 · 0 of 0 acknowledged" with no word on why nobody was told (`shots/principal/admin-circulars-1280-light.png`).
  5. zz.faculty01, `/faculty`: seven duty cards each end in a bare "Open" link; a screen reader's link list reads "Open" seven times.
  6. The fixture expert, `/expert/profile`, "Get paid" card: the badge says "Not linked yet" while the card's own line says "Linked with Razorpay: ready to be paid", above a sentence telling the expert to send identity papers first. (Screenshots of this page were deleted after the walk because the calendar card prints the fixture expert's feed token.)
- Expected: whole sentences that say what the number means.
- Suggested fix: complete `parent.streakStart` (e.g. "Starts on the next school day"); render `loadWITHIN` with its range ("Within 12–16 h"); say "the next school day"; one title for the circulars page; an empty-reach line; "Open the lab desk" etc. or `aria-describedby` the card title.
- Files: `packages/i18n/src/en.ts:5149` (and hi/mr), `:13045`, `:5278`; `apps/web/src/app/(app)/parent/page.tsx:375`; `apps/web/src/app/(app)/admin/circulars/*`; the faculty home.

### UI-07 · Low · Web · An internal key printed in the office's texts log
- Type UI-UX · Severity Low · Platform Web · Feature: SMS and WhatsApp
- Steps: 1. As zz.admin (or zz.principal) open `/admin/messaging`. 2. Scroll to "Recent automatic texts".
- Expected: the purpose in words ("Circular").
- Actual: rows read "circular:cmuvc2m6e004…" — `word(t, PURPOSE_KEY, m.purpose)` falls back to the raw purpose, which carries the circular's id; in Hindi too (`shots/admin/admin-messaging-390-light-hi.png`).
- Suggested fix: map the purpose's prefix (`circular:` → the circular's own word, ideally linking the circular).
- Files: `apps/web/src/app/(app)/admin/messaging/page.tsx:181`, `.../admin/messaging/labels.ts`.

### UI-08 · Low · Web · Template braces in the guide the assistant answers from
- Type UI-UX · Severity Low · Platform Web · Feature: Vidura's guide in Hindi and Marathi (review queue)
- Steps: 1. As zz.operator open `/root/vidura-review` (or zz.appadmin `/appadmin/vidura-review`).
- Expected: the guide's quoted interface text reads as a person sees it.
- Actual: lines such as `Open /accounts/structures ("Fee structures"): "Fees for {year}…"` and the Hindi "{year} के लिए…" carry the dictionary's `{year}` placeholder, so the guide (and an answer quoting it) prints braces.
- Suggested fix: substitute or drop placeholders when the guide quotes a dictionary sentence.
- Files: `docs/guide/accounts.md` (and the guide's other files that quote UI strings).

### UI-09 · Low · Both · Navigation differs between the web at phone width and the phone app
- Type UI-UX · Severity Low · Platform Both · Feature: bottom bar
- Steps: compare the bottom bar at 390 px on :3000 with the phone's tab bar on :8081 for the same person.
- Actual: teacher — web Today, Attendance, Classes, Assignments, Exams; phone Today, Attendance, Classes, Messages, More. Admin — web Overview, People, Classes, Timetable, Exams; phone Overview, People, Leave, Messages, More. Parent — web Overview, Attendance, Assignments, Exams, Messages; phone Overview, Attendance, Messages, Assignments, More. The driver has a one-item bottom bar on the web (`shots/driver/bulletin-global-390-light.png`). The operator's pages at 390 px open with about twenty links wrapped across the top (`shots/operator/root-390-light.png`). The web hostel roll call uses small native radios under a sentence that explains everyone starts present; the phone's uses large buttons and omits that sentence.
- Expected: one person finds the same five places in the same order on either.
- Suggested fix: derive the phone's `TABS` from the web's `primary` entries (or the reverse) and test the two against each other; give the operator a menu button at phone width.
- Files: `apps/web/src/lib/nav.ts` (`primary`), `apps/mobile/src/lib/nav.ts` (`TABS`), `apps/web/src/app/root/layout.tsx`.

### UI-10 · Low · Mobile · Screens the phone does not have (by the two menus)
- Type UI-UX · Severity Low · Platform Mobile · Feature: web/phone parity
- Steps: compare `NAV` (web) with `TABS` + `MENU` (phone) per role, then open the phone's More sheet as each actor.
- Actual: the phone sends the person to the web for the library's catalogue, fines and reports (librarian), the hostel's rooms, menu and incidents (warden), the office's library, campus and committees (admin) and the principal's accreditation; it has no entry for the attendance-punch devices and Tally export (admin, accounts), council notices (admin, principal, student), the staff's appointment letters (every college staff role and the school's teacher), the expert's earnings, the peer-team visit file (HOD, IQAC), the accounts desk's student list and admission refunds, the reading-room register (librarian), and the clinical and studio duty desks (faculty, HOD). The librarian's and warden's other pages are tabs on the phone's home, which is fine.
- Expected: the parity table's "phone" column says which of these are on purpose.
- Suggested fix: record each as built, planned or web-only in the parity table; add the cheap read-only ones (letters, council notices, earnings).
- Files: `apps/mobile/src/lib/nav.ts`, `apps/web/src/lib/nav.ts`.

### UI-11 · Low · Mobile · The phone's web target has no landmarks
- Type UI-UX · Severity Low · Platform Mobile (web target) · Feature: every screen
- Steps: open any screen on :8081 and run axe.
- Actual: axe `region` (moderate) on 849 of 862 loads: nothing is inside a `main`/`nav` landmark, so a screen-reader user of the web target cannot jump to content.
- Suggested fix: `role="main"` on the screen body and `role="navigation"` on the tab bar (react-native-web maps `role`); native apps are not affected.
- Files: `apps/mobile/src/components/chrome.tsx`, `apps/mobile/src/app/(app)/_layout.tsx`.

### UI-12 · Low · Web · Moderate and minor axe results
- Type UI-UX · Severity Low · Platform Web
- Actual (English loads, both widths and themes): `empty-table-header` ×32 (`/admin/exams`, `/admin/college-admissions`, `/accounts/scholarships`, `/student/scholarships`, `/root`: an actions column with no header text), `landmark-unique` ×22 (`/admin/report-cards`, `/admin/certificates/<id>`, `/appadmin/quiz-review`, `/root/colleges`, `/root/quiz-review`: two landmarks with one name), `heading-order` ×8 (`/timetable`, `/appadmin/contributions/<id>`), `region` ×8 (`/health/cards/<id>`, `/public/faculty/zz-vidya-college`).
- Suggested fix: an sr-only header on action columns; distinct `aria-label`s; heading levels in order; a `main` on the two standalone pages.

### UI-13 · Low · Web · Fixture-only: the e2e harness's exam shows on the fixture teacher's home
- Type UI-UX · Severity Low · Platform Web · Feature: teacher home "Marks to enter"
- Steps: as zz.teacher1 open `/teacher`.
- Actual: "ZZ Grade 10 · A · Mathematics — ZZ E2E Unit Test", 0 of 6 marked, (written by `e2e/global-setup.ts`, find-or-create) sits on the walked teacher's home in every picture (`shots/teacher/teacher-390-light-hi.png`). Harmless data, but every screenshot of that home now depends on whether the Playwright suite has run.
- Suggested fix: none in the product; note for whoever compares these pictures.
- Files: `apps/web/e2e/global-setup.ts`.

### UI-14 · Low · Both · A college is called a school
- Type UI-UX · Severity Low · Platform Both · Feature: college office, college staff feed, job board
- Steps: as zz.cadmin (ADMIN at ZZ Vidya College) open `/admin`; as zz.hod01 open the phone's Social Media tab; with the job board on, as zz.cadmin open `/admin/vacancies`.
- Expected: "college", "students" at a college (the streams batch set college words per preset).
- Actual: "School code VIDYA-…" on the college office's home, "Our school's feed" on the college staff's feed (web and phone), "Your school's postings" on the college's vacancies, "Admit pupils from a list" on the college's People screen (phone).
- Suggested fix: route these four keys through the institution-kind word switch the college presets already use.
- Files: the admin home header, `bulletin` feed header, `admin/vacancies`, the phone's people screen; `packages/i18n/src/en.ts`.

### UI-15 · Medium · Mobile · A plan-locked screen on the phone is an error with a useless "Try again"
- Type UI-UX · Severity Medium · Platform Mobile · Feature: person plans (16–17 Oct 2026)
- Steps: 1. As zz.operator switch EXPERT_SESSIONS and QUESTION_BANK on and make the plans active (this layer did so through `POST /api/v1/operator/features/{code}` and `PUT /api/v1/operator/person-plans`, and switched them back off). 2. As the fixture expert open Availability, Mentoring or Sessions on :8081; as zz.cstudent02 open Practice.
- Expected: what the web shows on the same page — "Expert sessions needs a plan", what the plan includes, its price and a Subscribe button (`shots/expert/expert-availability-390-light-features.png`).
- Actual: a red error card, "This needs the Expert plan, which you do not hold yet.", and a "Try again" button that can only fail again (`shots/expert/phone-availability-390-light-features.png`); the doors answer 402 PLAN_REQUIRED and the phone treats it as a failure. The phone's `PlanCard` is drawn only on the Account screen.
- Suggested fix: on a 402 with `code: PLAN_REQUIRED`, render `PlanCard` for `plan` in place of the screen's error, as the web's `featurePageLock` does.
- Files: `apps/mobile/src/screens/shared/plan-card.tsx`, the screens under `apps/mobile/src/screens/expert/` and `.../practice/`, the shared error component.

## Notes on the test harness

### H-1 · The axe matrix walks menu entries whose feature is off
`npx playwright test --project axe` (run 07:00–08:01 UTC, one worker, output kept outside `e2e/results`): **1,079 passed, 27 failed, 106 skipped**. 25 of the failures are menu entries under a platform feature that is off on this database — `/experts`, `/mentoring`, `/sessions`, `/vacancies` for ADMIN, TEACHER, STUDENT, PARENT, EXPERT, COLLEGE_ADMIN and COLLEGE_STUDENT, light and dark — which answer the app's 404 because `axe.spec.ts`'s `shown()` filters by module, duty and stream but not by `hiddenByFeature`. The 106 skips are `assistant-axe.spec.ts` (ASSISTANT off) and `also` prefixes. Fix: read the platform switches in `global-setup.ts` and filter as the shell does. Log: `shots/_data/axe-spec.log`.

### H-2 · The harness's sessions expire before the axe project ends
The other two failures are "homes at 1280 px › OPERATOR · light/dark · /root", sent to `/login`: `global-setup.ts` mints one-hour sessions, and the axe project took 1.0 h on this Mac. The Marathi home test for the operator, run after them, passed — it checks `lang="mr"`, which the login page in Marathi also has, so that pass is not evidence. Fix: mint for 24 h as the sweep does (`scripts/sweep.ts`), and assert the path in the Marathi homes too.

### H-3 · The viewport matrix's register baselines are stale
`npx playwright test e2e/viewport.spec.ts`: **49 passed, 15 failed**. Every failure is the register's screenshot compared with the darwin baseline (about 3 % of pixels): the baseline shows another class and day than the fixture teacher's register today (`shots/_data/viewport-spec.log`). The no-sideways-scroll and 44-px checks, which run before the comparison, passed in all 64 cells. Not a product finding; rewrite the darwin baselines (`npm run e2e:update`) after the fixtures settle.

## Untested

- Untested: the demo accounts (Sunrise, Saraswati, the ten demo colleges). The walk used the ZZ fixtures only;
  the demo schools have more rows, so long lists and dense tables were seen with fixture-sized data.
- Untested: Marathi beyond the harness's homes (the brief asked for Hindi once; `axe.spec.ts`'s Marathi homes
  ran, see H-2 for the operator's).
- Untested: anything behind a press — forms submitted, dialogs and sheets opened, the command palette, the
  assistant's panel with a question asked, the phone's detail screens reached only by a row press (the phone
  walk covers its tabs and More-sheet screens, not the screens a row opens).
- Untested: real devices; the phone was seen through its web target only. Screen readers were not run; names,
  landmarks and focus were checked by axe and by script.
- Untested: the web pages' error boundaries (`error.tsx`) — the web's pages render on the server and make no
  client `/api/v1` calls on load (checked on every home with every client call failed: none was made), so a
  failure could not be injected from the browser.
- Untested: performance. Load times were taken on a shared `next dev` under four layers' traffic and are not
  product measurements.

## What this layer touched

- `apps/web/scripts/tmp-qa-ui.ts`, `tmp-qa-ui-parity.ts`, `tmp-qa-ui-probe.ts` — temporary, deleted at the end.
- `docs/qa/campaign-2026-10-24/ui.md` (this file) and `docs/qa/campaign-2026-10-24/shots/` (screenshots, `_data/`).
- `apps/web/e2e/.sessions.json` (rewritten by the harness's own global setup) and the `e2e` sessions it mints.
- ZZ accounts' `prefs` (language set to Hindi per actor during the Hindi walk, restored byte for byte; checked).
- The platform features and plans (ON for the two windows above, then OFF again, through the operator's doors;
  audited by the app both ways).
- Sessions minted under `--tag=qa-ui`, purged at the end.
