# Layer 7 — security (QA campaign of 24 October 2026)

Builder: layer 7 (security). Authorised, non-destructive, on this machine's dev database only. Run 24 October
2026 on master at `d915fc98`, against the running dev server (:3000) and the phone's web target (:8081), while
layer 6 (the functional map) walked the same servers.

## How it was run

- **Accounts.** ZZ fixtures through minted bearer sessions (`npm run zz:token -- ROLE [email] --tag=qa-sec`,
  25 purged at the end: `purged 25 (minted under tag "qa-sec")`). Every API role and both ZZ schools
  (Northgate, Southbank) plus ZZ Vidya College. No password was typed into any form; no account was created
  through the UI; the desktop app's Browser pane was never used; the Playwright global-setup was not run.
- **What was switched.** `EXPERT_SESSIONS` was switched **on** once as `zz.operator` through the operator's
  door (`POST /api/v1/operator/features/EXPERT_SESSIONS {on:true}`, 200 `changed:true`) to reach the
  feature-gated expert-invite door for SEC-1, and switched **back off** immediately
  (`{on:false}`, 200 `changed:true`). Read back off at the end: `EXPERT_SESSIONS | f`. Nothing else was
  switched; no plan was made active.
- **What was written and put back.** One `ExpertInvite` row at ZZ Northgate (SEC-1 live step), deleted by id
  after (`DELETE 1`; `leftover … 0`). The operator's two feature-switch audit rows are append-only and left.
  No victim account was altered (SEC-1's takeover step — the password overwrite — was **not** executed; it is
  evidenced by code, see the finding). No fixture rebuild was needed.
- **Method.** Static review of the auth, session, webhook, upload, CSP/middleware and website-render code
  (two read-only reviewers plus the builder's own checks), then minimal live reproductions with curl against
  :3000. The rich-text sanitiser was fuzzed as a pure function through a throwaway in-repo script
  (`scripts/tmp-qa-sec-xss.ts`, deleted). Health was 200 before and after every step; `:8081` 200 at the end.
- **Relationship to the exhaustive probes.** The catalogued role matrix and the cross-tenant/cross-person
  IDOR probes (`npm run api:sweep`, `--cross=school`, `--cross=person`) were last run green at the 4 October
  campaign (role matrix all-as-expected; cross-school 246/246 shut; cross-person 72/72). By the rule
  ([[api-sweep-only-when-asked]]) the ~2 h sweep was **not** rerun on the shared server; instead the fence was
  spot-confirmed live (below) and the five standing findings of the 5 October audit (`03-security.md`) were
  re-checked against the current code.

## Findings — one High, two Medium, six Low

### SEC-1 · Security · **High** · Both · Auth — a staff expert-invite link takes over any unverified account

- **Type** Security · **Severity** High · **Platform** Both (the invite door is the phone's and the web's)
  · **Feature** expert marketplace invitations (gated by `EXPERT_SESSIONS`)
- **Steps** (ZZ; `EXPERT_SESSIONS` on):
  1. As any ADMIN or TEACHER at any school — `zz.teacher1@zz.test`, minted — call
     `POST /api/v1/staff/experts/invite` with `{"email":"<victim>"}`, where `<victim>` is any address whose
     account has never verified its email. Here `zztransferwa.ppmf@edulink.local`, an unverified handle pupil.
  2. Read the response.
- **Expected:** the invitation is mailed to the address; the caller does not receive a working token unless
  they control that mailbox (the whole security model of reclaiming an unverified account rests on
  "opening a link we emailed to this address proves it", `expert/invite/[token]/actions.ts:106`).
- **Actual:** the door answers **201 with the live link in the body**:
  ```
  {"link":"http://localhost:3000/expert/invite/<TOKEN>","expiresAt":"2026-11-07T08:32:30.469Z"}
  ```
  The inviter now holds the token without ever controlling the victim's mailbox. Opening
  `/expert/invite/<TOKEN>` and submitting `name`, `email=<victim>` (the address is checked to equal the
  invited one, and it does), a chosen password and a headline runs the reclaim branch
  (`actions.ts:84` `reclaims = taken.emailVerifiedAt === null && addressed === email && !taken.disabledAt`,
  then `:89–93` sets the attacker's `passwordHash`, marks `emailVerifiedAt`, and `revokeAllAccess(…,{tokens:true})`,
  then `:122` `createSession(... role:"EXPERT")`). The victim keeps their existing memberships, so a later
  `POST /api/v1/auth/login` with the chosen password lands in the victim's own role and school — account
  takeover, plus a denial of service (the victim's sessions and tokens are revoked).
- **Scope on this database:** 306 accounts are unverified (66 `@edulink.local` handle pupils, the rest
  `@test.invalid` unit leftovers and seed sample schools). All `@demo.relay.test` and `@zz.test` *staff* are
  verified, so the live targets here are pupils and any self-registered-but-unverified staff. In production the
  reclaimable set is every parent, pupil or admin who never opened their verification mail, and the attacker
  need only be ADMIN/TEACHER at *any* school (including one they self-registered).
- **What was proven live:** the token disclosure (step 2 above, as `zz.teacher1`, 201 with the link). The
  reclaim/password-overwrite step was **not** executed against a real account (it is destructive to the
  victim); it is evidenced by the quoted code. Verified the victim's row was untouched after the probe.
- **Root cause:** the door hands the caller the one copy of the token (so staff can paste it to an expert),
  which breaks the "the token was emailed, so the holder controls the mailbox" assumption the reclaim relies
  on — the same assumption the school-invite flow keeps, because *its* token is only ever emailed.
- **Fix:** do not return the token to the inviter — mail it only, as the school bulk-invite does; or forbid the
  reclaim-unverified branch on the expert-invite accept (require the account owner to be signed in, or email a
  separate proof), so that holding a staff-issued link can never set a password on a pre-existing account.
- **Files:** `apps/web/src/app/api/v1/staff/experts/invite/route.ts:21–22`,
  `apps/web/src/lib/experts.ts` (`inviteExpert`, `createExpertInvite`),
  `apps/web/src/app/expert/invite/[token]/actions.ts:84–93,122`,
  `apps/web/src/lib/api-catalog/office-writes.ts:47`.

### SEC-2 · Security · Medium · Both · Payments — the two company webhooks never retry a failed settlement

- **Type** Security (money integrity) · **Severity** Medium · **Platform** Both · **Feature** pass orders
  and seat payments (company-collects gateway)
- **Steps** (by code; the devbox transport):
  1. A signed `payment.captured` webhook reaches `POST /api/webhooks/razorpay/platform` (passes) or
     `POST /api/webhooks/gateway/sessions` (seats).
  2. The settlement step throws (a DB error, a timeout) after the event row is written.
  3. The gateway retries the same event.
- **Expected:** the capture is recorded, or the delivery is answered 5xx so the gateway keeps retrying until it
  is; it is never acknowledged as handled while unprocessed.
- **Actual:** both doors look up the event by id **selecting `id` only** and treat *existence* as "seen":
  `platform/route.ts:56` `if (seen) return {ok:true, outcome:"already"}`, then `:57` creates the row (with
  `processedAt` null), does the work at `:62–68`, and only sets `processedAt`/`outcome` at `:70`; identical
  shape in `gateway/sessions/route.ts:64–66,88`. If the work throws between `:57` and `:70` the 500 makes the
  gateway retry, the retry finds the row and answers `"already"`, and the captured money is never recorded.
- **Relationship:** this is E2E-A2 (High, layer 5A), which described the *school* door
  (`/webhooks/razorpay/[schoolId]`). The two **company** doors (passes, seats) have the identical flaw and were
  not covered there. Live impact is lower today because the company-collects paths are off until Route is
  proven (no money moves), but the design defect is the same.
- **Fix:** write the event row and its outcome in the same transaction as the settlement, or count an event as
  seen only when `processedAt` is set and let a row with `processedAt` null be processed again on retry.
- **Files:** `apps/web/src/app/api/webhooks/razorpay/platform/route.ts:56–70`,
  `apps/web/src/app/api/webhooks/gateway/sessions/route.ts:64–88`.

### SEC-3 · Security · Medium · Web · Auth — the email-verification token is spent on a GET

- **Type** Security · **Severity** Medium · **Platform** Web · **Feature** email verification / account squatting
- **Steps:**
  1. Self-register an account under a victim's address (unverified), e.g. `POST /api/v1/auth/recruiter/register`.
  2. The verification mail with `GET /verify?token=…` goes to the victim's inbox.
  3. The victim's mail client, or a link-prefetching scanner (Outlook SafeLinks and the like), fetches the URL.
- **Expected:** opening the link spends the token only on a deliberate action (a POST), the pattern assessment
  item 22 established for magic links (a continue page that POSTs).
- **Actual:** `/verify` is a page component that calls `verifyEmailByToken(token)` during the **GET render**
  (`verify/page.tsx:43`), with no session and no POST. A prefetch or a scanner marks the *attacker's* squatted
  account verified without the victim ever choosing to. Once verified, SSO links to it without reclaiming
  (`sso.ts:443`), so the attacker keeps the account the real owner believes is theirs.
- **Fix:** move the spend to a POST behind a continue page, exactly as the magic link now does.
- **Files:** `apps/web/src/app/verify/page.tsx:43`, `apps/web/src/lib/passwords.ts` (`verifyEmailByToken`).

### SEC-4 · Security · Low · Both · Auth — accepting a school invitation bypasses TOTP

- The school-invite accept checks the existing account's password (`invite/[token]/actions.ts:142`
  `signInWithPassword`) but then calls `createSession(...)` at `:269` and `:454` with no
  `twoFactorChallengeFor` step, while the magic-link and SSO paths gate on TOTP. For a TOTP-enabled account,
  password + an invitation link mints a full session without the second factor. Practical reach is limited:
  the school-invite token is emailed, not disclosed (unlike SEC-1), so the attacker needs both the password
  and the emailed link. **Fix:** run the two-factor gate in the accept path before `createSession` when the
  account has TOTP on. **Files:** `apps/web/src/app/invite/[token]/actions.ts:142,269,454`.

### SEC-5 · Security · Low · Both · Auth — TOTP guessing has no per-account ceiling

- Sign-in TOTP is limited 5 attempts per challenge (`CHALLENGE_MAX_ATTEMPTS`) and 30 per address per 15 min
  (`two-factor.ts:54–55`), with nothing keyed on `userId`. A fresh challenge is minted per login, and login is
  10 per 15 min per identity, so ~50 code guesses / 15 min / account are reachable from rotating addresses
  (dev trusts the last `X-Forwarded-For` hop). With a ±1 step window (3 valid codes of 10^6) that is on the
  order of 1% a day for an attacker who already holds the password. **Fix:** add a per-`userId` failure bucket
  on `auth.totp.failed` that locks the account's second step for a window. **Files:** `apps/web/src/lib/two-factor.ts:51–55,237–265`.

### SEC-6 · Security · Low · Both · Auth — turning TOTP on needs only a session, no password

- `POST /api/v1/account/totp/start` and `/confirm` require only `requireApiSession`, no password re-entry
  (`account/totp/start/route.ts`). A thief of a live session can enrol TOTP and, since disabling needs a code
  and a password reset does not clear TOTP, lock the real owner out; enrolment also revokes no other sessions.
  **Fix:** ask for the password before `startTwoFactor`/`confirmTwoFactor`, and revoke other sessions on
  enrolment. **Files:** `apps/web/src/app/api/v1/account/totp/{start,confirm}/route.ts`, `apps/web/src/lib/two-factor.ts`.

### SEC-7 · Security · Low · Web · Auth — the password-reset request is slower for registered accounts

- `requestPasswordReset` (`passwords.ts` ~330–395) writes the token and `await`s the SMS/email **before** the
  response, and only when the account exists with a deliverable address; assessment item 20 deferred this for
  magic links (`after()`) but not here. Under `EMAIL_TRANSPORT=smtp` the latency gap tells a registered
  address from an unknown one. The limit is per identifier (3 / 15 min), so spraying distinct identifiers is
  unbounded. **Fix:** send after the response, as the magic link does. **Files:** `apps/web/src/lib/passwords.ts`.

### SEC-8 · Security · Low · Both · Auth — public sign-up reveals which emails have an account

- `POST /api/v1/auth/recruiter/register` answers `recruiter.refuseEmailTaken` for an existing address
  (`recruiters.ts:61–62`, confirmed live: 422 `issues.email` for `zz.teacher1@zz.test`); school registration
  (`register/actions.ts`) answers `register.emailTakenLong`. Both check the whole `User` table, so a
  signed-out caller can test any parent/pupil/staff address at 20/h/address (`SIGNUPS`) — the oracle login and
  magic link were built to avoid. This matches the accepted `checkEmailAvailable` design, so it is noted, not
  a regression. **Fix (if wanted):** answer the same way for taken and free addresses and confirm by email.

### SEC-9 · Security · Low · Web · Hardening — the tenant resolver skips checks `getSession` makes

- `tenant-request.ts:107–109` does not re-check `user.disabledAt`, the 180-day absolute lifetime, or the
  `x-edulink-owner` outbox-owner mismatch that `getSession` enforces (`session.ts:283–287`). No door was found
  that authorises by RLS through this resolver alone without also calling `getSession`, so this is
  defence-in-depth. **Fix:** apply the same three checks in `tenant-request.ts`. **File:** `apps/web/src/lib/tenant-request.ts`.

## What held (checked, sound)

- **Role gates / privilege escalation.** Every spot-checked escalation is refused: STUDENT→admin/staff/operator
  403; TEACHER→admin 403; ALUMNUS→family/student 403; DRIVER→staff 403; LIBRARIAN/ACCOUNTS/RECRUITER→admin 403;
  FACULTY→HOD 403; TPO→exam-cell 403; APPADMIN→operator 403. (OPERATOR→`appadmin/competitions` 200 is by design:
  the catalog's `app-admin` access includes the operator, `api-catalog/types.ts:14`.)
- **Cross-tenant IDOR (spot check).** ZZ Northgate ADMIN and TEACHER reading ZZ Southbank ids answered 404
  (`admin/people/{sbStudent}`, `admin/classes/{sbClass}`, `office/pupils/{sbStudent}`); an unlinked ZZ parent
  reading a Southbank child's overview answered 403. Consistent with the 4 Oct cross-school 246/246 and
  cross-person 72/72.
- **Logout / sessions.** `POST /api/v1/auth/logout` revokes server-side for both bearer and cookie (both 401
  after); `GET /api/auth/logout` 405; a cross-origin cookie POST to logout 403. Every sign-in path mints a new
  random token — no fixation; the TOTP challenge is a separate table and can never act as a session.
- **CSRF / Origin lock / CORS.** A cross-origin cookie-bearing POST to `/api/v1/admin/people` → 403; an evil
  CORS preflight on `/api/v1/me` → 403. CORS allow-list is empty in production, Expo's port in dev only.
- **Cookies & headers.** HttpOnly, SameSite=Lax, Path=/, Secure+`__Host-` in production. Every page carries a
  per-response nonce CSP with `'strict-dynamic'` and no `script-src 'unsafe-inline'`; X-Frame-Options DENY and
  `frame-ancestors 'none'`; X-Content-Type-Options nosniff; Referrer-Policy; a restrictive Permissions-Policy;
  HSTS is production-only (correctly absent in dev); a school site's host serves `default-src 'none'` and
  `/sites/by-host` is 404 on the app host.
- **XSS.** Only two `dangerouslySetInnerHTML` in the app (the nonce-guarded theme script and the generated
  brand mark — neither user content). The website custom-page rich text is rebuilt by an allow-list tokeniser
  (`site-rich-text.ts`) applied on both read and write; fuzzed with 14 payloads (`<script>`, `onerror`,
  `javascript:`/`data:` hrefs, `<svg onload>`, nested `<scr<script>ipt>`, entity-encoded `&#106;avascript:`,
  `<math><mtext>`, leading-whitespace scheme) — every one yields empty output or escaped text; `safeLinkHref`
  rejects `data:`/`javascript:`/`vbscript:`.
- **Webhook signatures.** All four webhooks reject unsigned/bad-signature deliveries (school 404 on a wrong
  school+secret, platform/sessions 401, Twilio 404); the event id is taken from the signed body, never a
  header; bodies are capped at 64 KB. (Integrity defect: SEC-2.)
- **Uploads.** Magic-byte sniff with an allow-list of png/jpeg/gif/pdf/webp/mp4/webm; SVG, HTML and XML have no
  signature and are refused; the client's claimed type never picks the size cap; EXIF stripped before disk.
- **Public doors.** `public/faculty/{slug}`, `public/certificates/{code}`, `public/exam-documents/{code}` and
  `public/surveys/{token}` are all rate-limited (`consumeByCaller`, `CODE_LOOKUPS`/`certificate-check`) — the
  5 Oct A3-S-8 "public faculty has no limit" is now fixed.
- **Error bodies.** A generic failure returns `{error:"…somethingWrong", code:"SERVER"}` with no stack or
  message (`api-v1.ts` `apiFailure`); `GET /api/v1/me` carries no secret fields.
- **Five standing 5 October findings re-checked, all now fixed:** A3-S-1 (avatarKey image sink — `validation.ts:215`
  refines to `AVATAR_PRESETS`; `id-card.ts:96` and the hall ticket set `photoFileId: null`), A3-S-3 (route-header
  bypass — the middleware matcher now stamps every non-`_next` path, so a forged `x-edulink-route` on a
  `…/x.ab` path no longer reaches the gate; probed live: still 307→/switch), A3-S-4 (self-approval — the refund
  exception, expulsion and concession decide paths now refuse the asker/proposer/granter, `head-approvals.ts:100,223`,
  `college-fees.ts:226`), A3-S-5 (faculty public profile — `takeDownProfileOf` now has an office door and is
  called from `membership.ts:161` on suspend/departure), A3-S-8 (public faculty rate limit — added).

## Untested / out of scope

- The SEC-1 reclaim/password-overwrite executed end to end (destructive to a victim account; proven by code and
  by the live token disclosure). SEC-4 and SEC-6 end to end (both would type a password into a form).
- The full `api:sweep`, `--cross=school` and `--cross=person` runs (not rerun by the rule; last green 4 Oct);
  the fence was spot-confirmed only.
- The assistant's Vidura answers' Markdown rendering for XSS (ASSISTANT is off on this database; the router
  only reads non-writing GET doors, per the auth review — but the client-side Markdown render was not tested).
- Real Twilio/Razorpay/Meta accounts; a real device; SSO against a live tenant; the phone's native bundle.
- The `/verify` GET oracle against a real prefetching mail scanner (SEC-3 reasoned from the code path).

## Paths touched

- `docs/qa/campaign-2026-10-24/security.md` (this report, new).
- Temporary: `apps/web/scripts/tmp-qa-sec-xss.ts` (created and deleted), `apps/web/.zz-token/qa-sec.hashes`
  (gitignored; emptied by the purge).
- Database: one `ExpertInvite` row created and deleted; the operator's two `EXPERT_SESSIONS` feature-switch
  audit rows (append-only) left; no other change.
