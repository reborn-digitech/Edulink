# Layer 1 — accounts and reach (24 October 2026)

Builder: layer 1 of the QA campaign ([plan.md](plan.md)). Output: [accounts.md](accounts.md), completed, and every account on one line in [layer-1-accounts.csv](layer-1-accounts.csv).

## What was done

1. **Three demo accounts added through a fixture script**, `npm run demo:accounts` (new: `apps/web/scripts/demo-accounts.ts`, and its line in `apps/web/package.json`). Idempotent; run twice, the second run added nothing:

   ```
   Demo accounts ready. Password: <the shared demo password>
      demo.expert01@demo.relay.test   application cmvlvoint0002gp6c0tqmwygv submitted; approved by zz.operator@zz.test (invite mailed: true); invitation accepted; published and identity-checked; profile cmvlvoinz0006gp6cphlconu8; 2 slot(s) added, 2 open
      demo.recruiter01@demo.relay.test   invited by recruiter.sahyadri@demo.relay.test; accepted; drives: Saraswati Arts and Science College: OPEN; Saraswati Arts and Science College: CLOSED
      demo.parent.two@demo.relay.test   Nakul Jadhav at Sunrise Public School (grade 6, cmubsk1i70045gnnd0cbs2cpb); Hrishikesh Pawar at Saraswati Vidya Mandir (grade 5, cmubsk3sf05tpgnndty15cuso)
   ```
   second run:
   ```
      demo.expert01@demo.relay.test   already built; profile cmvlvoinz0006gp6cphlconu8; 0 slot(s) added, 2 open
      demo.recruiter01@demo.relay.test   already bound; drives: …
   ```
   Read back from the database: the expert has one APPROVED application, one accepted invitation, a published profile, kycStatus VERIFIED, two slots, the fixture flag and a proved address; the recruiter has one accepted binding to Sahyadri Data Labs; the parent has two guardianships; no `zz-walk` actor session was left. The expert went through the application flow's own functions (`submitExpertApplication` → `decideExpertApplication` as the operator → the invitation's token from the dev mailbox, accepted as `/expert/invite/[token]` does → `setExpertStanding` → `addSlot`). The recruiter's binding is the placement library's two writes in its order with its audit rows, because the library cannot be imported under tsx (L1-06). The roster section is in docs/demo-schools.md between `demo-accounts` markers, which a `demo:schools` rewrite keeps.

2. **Every account walked, on web and phone, with its reach.** A temporary Playwright harness (`apps/web/scripts/tmp-qa-layer1.ts`, deleted after the run; a copy is in the coordinator's scratchpad) signed in each of the 615 accounts on `@demo.relay.test` and `@zz.test` (demo: the login door `POST /api/v1/auth/login`; ZZ: `npm run zz:token -- ROLE email --tag=qa-layer1`), took each of its 621 contexts, read `/api/v1/me`, fetched the role's home on :3000 (status, first `<h1>`), probed one door the catalog grants and one it does not, and opened the phone's web target on :8081 for one account per row, school and role (220 phone screens). Real output of the counts over the per-account file:

   ```
   demo.relay.test accounts 448 contexts 449 verified 449 phone 178 web200 449 may200 449 mayNot403 449 login200 449
   zz.test accounts 167 contexts 172 verified 167 phone 42 web200 167 may200 166 mayNot403 167 login200 0
   not verified: zz.claimant01, zz.joiner01, zz.nba.exit01, zz.nba.grad01, zz.nba.late01   (no context: nothing to sign in to)
   ```
   (ZZ `login200 0` because ZZ accounts are minted, never signed in by password; `may200 166` because zz.expert4 is unpublished and its profile door answers 403 by design.) Three ZZ experts were walked in a follow-up with directly minted `zz-walk` sessions (L1-05). Health: `/api/health` 200 before and after every step (`done 615 accounts; health after 200`).

3. **Cleanup.** `npm run zz:token -- --purge --tag=qa-layer1` → `purged 170 (minted under tag "qa-layer1")`; the 459 sessions the login door made (device `qa-layer1`, signed out as each account finished; two from interrupted follow-ups were still live) were deleted; `zz-walk` sessions: 0. `npm run data:audit` after the new accounts: 70 tests passed, 0 FAIL, 2 WARN, both `usage-sample` against the 1 October sample (Saraswati pupils 48 stored vs 49 now, the demo:transfer pupil; Sunrise messages 0 vs 7), neither from these accounts, which refreshed docs/data-audit/latest.md and reports.md.

## Findings

### L1-01 · UI-UX · Low · Web · A college head's home
1. Sign in as sac.principal@demo.relay.test (login door; any of the ten demo college principals, or zz.cprincipal@zz.test).
2. Open the role's home, `/principal` (where login lands, `ROLE_HOME.PRINCIPAL`).
- Expected: the college's dashboard, at once.
- Actual: `/principal` answers 200 with the streamed skeleton (no `<h1>` in the HTML), and the redirect to `/principal/college` happens inside the stream, so the browser navigates twice: `1.1s /principal`, `2.4s /principal`, `7.7s /principal/college`, `9.3s /principal/college` (dev server). Every college principal pays the extra round trip on every sign-in; the phone's "Dashboard" is unaffected.
- Fix: send a college's head to `/principal/college` from the start (ROLE_HOME by institution kind where login and the switcher pick the landing page), or decide the redirect before the `loading.tsx` boundary streams.
- Files: `apps/web/src/lib/constants.ts` (ROLE_HOME), `apps/web/src/app/(app)/principal/page.tsx:65`, `apps/web/src/app/(app)/principal/loading.tsx`.

### L1-02 · Functional · Low · Web (phone untested) · A transferred pupil's guardian lands on the school the child left
1. Sign in as prakash.pawar@demo.relay.test (the parent of the demo:transfer pupil, Ishaan Pawar: left Sunrise on 30/04/2026, now at Saraswati Vidya Mandir).
2. Open `/parent` with no `?child=`.
- Expected: the child's current enrolment (Saraswati), with the old one a chip away.
- Actual: the Sunrise membership that has left is chosen: "Ishaan Pawar left Sunrise Public School on 30/04/2026" fills the page, every sign-in. `pickChild` takes the first readable child, and a departed membership counts as readable.
- Fix: in `pickChild` (or the order `familyChildren` returns), prefer a membership with no `leftAt`, then the first readable.
- Files: `apps/web/src/lib/family-child.ts:98`, `apps/web/src/app/(app)/parent/page.tsx` (the `chosen` line).
- Untested: which child the phone's family home opens first (its heading was "Overview" with nothing under it at the moment of reading).

### L1-03 · UI-UX (accessibility) · Low · Web · The departed child's page has no heading
1. As in L1-02, open `/parent` for prakash.pawar.
- Expected: one `<h1>` naming the page, as every other walked home has (the college principals' once redirected).
- Actual: `h1: []` in the rendered page (Playwright, after hydration); the title sentence is a `<p className="text-lg font-bold">`.
- Fix: make the panel's title the page's `<h1>` (or put a PageHeader above the panel).
- Files: `apps/web/src/app/(app)/parent/child-left.tsx` (around line 45).

### L1-04 · Functional (parity) · Low · Mobile · An expert under review is not told so on the phone while expert sessions are off
1. Mint a session for zz.expert4@zz.test (an unpublished profile; `zz-walk`, deleted after).
2. Open the web `/expert`, then the phone's web target.
- Expected: both say the profile is being reviewed (the phone home's own comment says it mirrors the web's `/expert/pending`).
- Actual: the web redirects to `/expert/pending`, "Your profile is being reviewed". The phone shows "Bookings" and "Sessions with schools are not open yet. You can still fill in your profile." with a Profile button, while `GET /api/v1/shared/expert/profile` answers `403 {"error":"Not an expert","code":"FORBIDDEN"}` for this person. The phone's under-review note sits behind the bookings query, which is disabled while EXPERT_SESSIONS is off.
- Fix: read the expert's standing (published or not) independently of the feature switch and show the review note first; do not offer Profile while the profile door refuses.
- Files: `apps/mobile/src/screens/expert/home.tsx` (the `sessionsOn` gate), `apps/web/src/app/api/v1/shared/expert/profile/route.ts` (`requireApiExpert`).
- Untested: pressing Profile on the phone.

### L1-05 · Functional (test tooling) · Low · Both · `zz:token EXPERT <email>` mints a session for another expert
1. `npm run zz:token -- EXPERT zz.expert2@zz.test --tag=qa-layer1`, then `GET /api/v1/me` with the token.
- Expected: zz.expert2's session.
- Actual: zz.expert1's (`the session is zz.expert1@zz.test's, not this account's` for zz.expert2, 3 and 4). The EXPERT branch ignores the email; the RECRUITER and PARENT branches honour it.
- Fix: in the EXPERT branch, when an email is given, `assertFixtureEmail(email)` and find the profile by that user, as the RECRUITER branch does.
- Files: `apps/web/scripts/zz-token.ts:99`.

### L1-06 · Functional (test tooling) · Low · Web · The placement library cannot be loaded by a script
1. `echo "import '../src/lib/placement-recruiter';" > scripts/tmp-x.ts && npx tsx --tsconfig scripts/tsconfig.json scripts/tmp-x.ts`.
- Expected: it loads, as `expert-applications`, `experts` and `superuser` do.
- Actual: `ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './en-us' is not defined by "exports" in …/@react-pdf/hyphenate/package.json` (through `placement-pdf.ts`). A fixture script cannot call `addColleague`/`answerInvitation`, so demo:accounts repeats their two writes.
- Fix: import `renderResumePdf` lazily inside `recruiterResume` (a dynamic `import("./placement-pdf")`), so the rest of the file loads without @react-pdf.
- Files: `apps/web/src/lib/placement-recruiter.ts` (the `placement-pdf` import), `apps/web/src/lib/placement-pdf.ts`.

## Observations, not findings
- Five ZZ accounts hold no context (zz.claimant01, zz.joiner01: a waiting claim and join; zz.nba.exit01/grad01/late01: NBA batch rows) and were not signed in.
- Saraswati Vidya Mandir has no driver, librarian or warden; sac has none either and three faculty; svc has no TPO or recruiter. accounts.md's college row lists the union of roles.
- The phone's first heading was read once it held steady for a second; svc.student01's read "Today" over a skeleton (the home took about 11 s to fetch its overview on the dev server: `/api/v1/me` at 5.5 s, `family/student/overview` at 10.7 s) and showed "Hi Kshitija Mohite 👋" when reopened with a 30-second wait. zz.cstudent.s1 read the same way and was not reopened.
- docs/demo-schools.md already carried uncommitted changes from this morning's `demo:schools` run (new booking ids in "The expert") before layer 1 added its section.
- The scripts tsc reports two errors in `features/steps/assert.steps.ts` (layer 3's work in progress, not touched here); `scripts/demo-accounts.ts` itself type-checks and lints clean.

## Paths touched
- `apps/web/scripts/demo-accounts.ts` (new), `apps/web/package.json` (`demo:accounts`)
- `docs/demo-schools.md` (the `demo-accounts` section)
- `docs/qa/campaign-2026-10-24/accounts.md`, `layer-1.md`, `layer-1-accounts.csv`
- `docs/data-audit/latest.md` and `docs/data-audit/reports.md` (refreshed by `npm run data:audit`)
- Database: the three accounts and what hangs off them (one ExpertApplication, ExpertInvite, ExpertProfile, two ExpertSlots, a RecruiterProfile and CompanyRecruiter, two Guardianships), their audit rows and dev-mailbox mails; one `auth.login` audit row per demo sign-in (448 accounts, and six more from the follow-ups); no session left. `apps/web/storage/` holds the application's PDF.

## Untested
- A real device: the phone was its web target in headless Chromium only.
- The password form on `/login` (the login door was the API; no password was typed anywhere).
- Pressing anything past each home; every home was read, not used.
- For the 396 contexts that share a row, school and role with a walked one, the phone screen (web and API checked for every one).
- The demo expert's booked seat (availability only; booking is a layer-5 journey) and the identity check's document upload (curation set VERIFIED, as the operator's switch does).
- `npm run api:sweep`, by the rule; nothing in the API changed.
