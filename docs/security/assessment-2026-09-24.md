# Security assessment, 2026-09-24

An authorized end-to-end assessment of the owner's own application: every role, every school's fence,
every person's data. Method, findings, what was fixed the same day, and what remains a product decision.

## Method

1. **Three read-only reviews** of the code by area: authentication, sessions, accounts and secrets;
   authorization and tenant isolation (every guard, every id-taking handler, RLS, files, operator paths);
   input handling, output encoding, webhooks, privacy and abuse controls.
2. **Dynamic probes against the running app**, added to the API sweep as `npm run api:sweep -- --cross=school`
   and `--cross=person`. Every catalogued endpoint whose sample carries an id is called by ZZ Northgate's
   actors with another school's ids, and every family door with a child the guardian is not linked to, every
   pupil-naming door as a teacher with a pupil of a class they do not teach. A 2xx counts as a breach only when
   the answer carries the other person's id or name; doors that answer with the caller's own data are listed
   apart. Public doors and platform-wide surfaces are excluded; the PEN lookup is allow-listed with its reason.
3. **The existing gates**: the role matrix of the API sweep (2,352 calls, every role against every door), the
   route sweep's cross-school page checks, the RLS shape and SQL tests, the tenancy tests, the rate-limit
   tests, the CORS test, the phone's security gate, and `pnpm audit`.
4. **New tests**: `tests/security-e2e.test.ts` (the life of a session, a public door's rate limit, fields a
   client may not set) and the cases each fix added to its own suite.

## Probe results

| probe | result |
|---|---|
| cross-school, 62 id-bearing doors × every role | 62 of 62 stayed shut; the PEN lookup answers by state alone, by design |
| cross-person, 36 family and teacher doors | 36 of 36 stayed shut; 19 family doors answered the caller's own child when handed a foreign `childId` on the query string, none leaked |
| role matrix (API sweep) | 2,352 of 2,352 as expected |
| dependency audit | two moderate advisories, both in Expo's build tooling under apps/mobile (uuid, decode-uri-component), one high advisory already ignored by policy; nothing in the web app's runtime |

## Findings and status

Severity as the reviews rated it. **Fixed** means code landed the same day (the commit after this file in the log); **product** means the fix
changes a flow and is listed for decision; **noted** means documented, not changed.

### Critical

1. **A self-registered school could take over a pupil's account.** Anyone registers a school and is its
   admin; intake links an existing pupil by student code or PEN plus a date of birth with distinct refusals
   that confirm a guess, no rate limit and 500 rows a call; the first-sign-in code then sets a new password on
   that account. Admissions by PEN made the applicant an active guardian of an existing child.
   **Fixed:** a cross-school link needs a verified school and a child not on a roll elsewhere (the holding
   school records the departure first), every mismatch gives one refusal, intake is limited per school and
   per batch, a first-sign-in code is refused for an account that already has a sign-in or belongs elsewhere,
   an admission by PEN links the account but never makes the applicant a guardian and tells the existing
   guardians.
2. **Microsoft SSO trusted the email claim** (any Entra tenant owner could set a victim's address and be
   auto-linked). **Fixed:** an email is verified only with `xms_edov` or an allow-listed tenant; otherwise the
   sign-in is refused as `unverified-email` (there is no in-session linking flow yet: a refusal, not a
   silent "no account").

### High

3. **Pre-registered unverified accounts** kept control when a real owner's invite or SSO landed on them.
   **Fixed:** an invite or SSO onto an unverified account clears its password, revokes its sessions and
   tokens and marks the email verified.
4. **Rate limits lost a race**: read-then-write let a burst pass. **Fixed:** one atomic insert-or-update.
5. **Six-digit code attempt counters lost the same race**, and reset completion had no limit.
   **Fixed:** an integer attempts column consumed by a conditional update; per-identifier limits on
   completion and confirmation.
6. **The login limit keyed on the raw identifier**, so phone spellings each got their own bucket.
   **Fixed:** keyed on the normalised identity, plus per-address and global failure limits.
7. **Account merge verified any password without limit.** **Fixed:** the login bucket applies.
8. **Student code plus birthdate made anyone a guardian**, including of pupils who had left, and both are
   printed on the leaving certificate. **Fixed:** a left pupil cannot be claimed; a claim tells the existing
   guardians and the office. **Product:** a claim held pending until approved, and the code off the paper.
9. **School join codes were guessable and joined a pupil at once.** **Fixed:** new school codes carry eight
   random characters and joins are limited per account as well as per address. **Product:** joins pending
   until staff approve.
10. **Per-address limits trusted a header the client controls.** **Fixed:** the proxy's own client-address
    header first, then the last forwarded hop.
11. **Comments on the cross-school feed skipped moderation** and replies could notify a child in another
    school. **Fixed:** held for the author's school's review; no cross-school reply notifications to minors;
    pupils by first name on the global feed.

### Medium

12. A parent session could carry any school id and the events stream honoured it. **Fixed:** null for
    parents; a family stream carries only the family's own events.
13. Families could overwrite office-owned record fields. **Fixed:** a family allow-list; the rest ignored and
    read-only on the family forms.
14. The principal could write configuration and money-shaping settings. **Fixed:** decisions about people
    stay; templates, card rules, school week, term weights, staff-attendance settings, syllabus lists,
    vacancies and admission cycles are the admin's.
15. Operator oversight: reads unaudited, the visitor book rewritable, admin self-invites unlogged against the
    school. **Fixed:** each read audited with the school and counts only; the operator may only end a visit;
    self-invites refused and audited against the school.
16. One expert booking opened the whole school at database level; any teacher could pair any pupil with an
    expert. **Fixed:** pairing needs the teacher to teach the pupil. **Noted:** narrower expert policies are a
    follow-up. Comments held on the cross-school feed join the same queue as pupils' comments, and that queue
    has no approve action anywhere in the app (a held comment stays held until removed). **Product:** an
    approve path for held comments.
17. The phone's SSO hand-off code was not bound to the app that asked. **Product:** PKCE on the hand-off and
    verified app links.
18. Changing email or phone needed no password and revoked nothing. **Fixed:** the password is asked, the old
    address is told, other sessions end.
19. Accepting an invite signed an existing password-holder in without a password. **Fixed:** the password is
    asked.
20. Timing told registered addresses apart on magic-link requests. **Fixed:** the send happens after the
    response.
21. `checkEmailAvailable` and `resolveContext` were open server actions. **Fixed:** limited; moved to a
    server-only library.
22. Magic links were spent on GET. **Fixed:** a continue page; the token is spent on POST.
23. Push registrations outlived revoked sessions; phone sessions slid forever. **Fixed:** registrations go with
    the sessions; 180-day absolute lifetime, 7 days for superusers.
24. Push subscription endpoints allowed any URL (blind SSRF into the private network). **Fixed:** https and
    the push services' hosts only, with a send timeout.
25. A Razorpay retry after a failure left a captured payment unreceipted; the de-dup id came from an unsigned
    header; refunds could double on a double click. **Fixed.**
26. Reports and comments could be spammed; reports woke every admin at night. **Fixed:** limits,
    de-duplication, quieter bursts.
27. Invites and uploads had no cap; upload bodies were read before the size check. **Fixed:** daily caps;
    Content-Length checked first.
28. CSV exports carried formula cells. **Fixed:** a leading quote on `= + - @ tab CR`, numbers untouched;
    the workbook strips it again.
29. A cookie-authenticated write could arrive from another origin (SameSite was the only lock). **Fixed:**
    the middleware refuses a cookie-bearing write whose Origin is neither the host nor an allowed origin.
30. `SchoolRecord` was readable by any school holding a membership for the pupil. **Fixed:** the writing
    school, the pupil, their guardians, and the school where the pupil is a live STUDENT today (the receiving
    school's certificate read, which the transfer flow and `rls:verify` depend on); a school that only employs
    the person, or one the child left, reads nothing.

### Low

31. The public certificate check had no rate limit and could echo a pupil's name through a template title.
    **Fixed:** limited per address on the API and the page; the answer names the kind, not the pupil.
32. AuditLog was not append-only for the app role. **Fixed:** insert and select only.
33. Upload tickets could be spent twice concurrently. **Fixed:** a conditional spend.
34. Twilio callbacks could move a status backwards. **Fixed:** forward-only.
35. The jobs runner could bind to all interfaces. **Fixed:** loopback hard-coded.
36. Export filenames took a raw grade; push bodies carried message text to minors; audit rows held free-text
    reasons; a competition link could be http; the phone keychain allowed backup restore. **Fixed.**
37. The dev mailbox was open on any non-production host. **Fixed:** loopback, or a signed-in superuser.
38. Fixture scripts would run against any database with known passwords. **Fixed:** they refuse anything
    but a local database off production.
39. The PEN lookup tells an office whether a number is on the platform and whether that pupil is active.
    **Noted, by design:** it answers by state alone so a transfer can be prepared; the name, school and record
    stay behind the fence.
40. CSP still allows inline scripts; the cookie is not `__Host-` prefixed; HSTS is not preloaded. **Product.**
41. Rate limits fail open when the database errors, so an authentication outage is not made worse by a limiter
    outage. **Noted, by design.**

## What the reviews found sound

Opaque 256-bit session tokens stored hashed; HttpOnly, Secure, SameSite cookies; every request re-checks the
live membership behind the role; argon2id with a real password policy and fake work for unknown accounts;
single-use, purpose-bound, expiring tokens; PKCE, state and nonce on SSO with signature, issuer, audience and
expiry checks; superuser flags re-read from the database inside every action; row-level security forced on
every table and set per query in its own transaction, failing closed; upload tickets bound to the uploader,
random file names, byte-sniffed types, signed short-lived download links, `nosniff` and a sandboxing CSP on
downloads; id-taking handlers that bind the person and not only the school; HMAC-verified, idempotent
webhooks; no raw SQL with interpolated input; no HTML injection sinks; escaped email HTML; text-only PDFs;
inline-string workbooks; exports audited by count and never by name; the phone keeping its token in secure
storage and clearing everything on sign-out.

## Follow-ups that change a flow (for decision)

- Claims and school-code joins held pending until a teacher, the office or an existing guardian approves
  (nothing in the app creates or lists a PENDING membership today, so joins stay ACTIVE behind the longer
  code and the per-account limit).
- An approve action for held comments, which the moderation queue lacks.
  **Built 2026-09-28:** `moderateComment` releases or removes a held comment at the school that holds it,
  audited as `comment.approve` or `comment.remove` with no free text in the row; approving sends the
  notifications posting would have sent, and still none to a child about a reply from another school.
- The student code off printed papers, or rotated when a pupil leaves.
  **Built 2026-09-28, off the paper:** the leaving certificate prints the school's register number, and
  intake no longer links an account by another school's student code; a transfer is by PEN and date of
  birth, behind the same handshake. Certificates a school issues from templates never printed the code.
- New self-registered schools behind operator approval before identity-linking features open to them.
  **Built 2026-09-28:** the operator gives and withdraws `School.verifiedAt` from `/root` and from the phone,
  each change audited as `superuser.school.verify` or `superuser.school.unverify`; `mayBringOver` is unchanged.
- PKCE on the phone's SSO hand-off and verified app links.
  **PKCE built 2026-09-29:** the app sends the S256 challenge of a verifier it keeps at the start, the one-time
  code is minted against it, and the exchange asks for the verifier; a code with the wrong verifier is refused
  and spent. Verified app links wait on the production domain.
- A nonce-based CSP without `unsafe-inline`; a `__Host-` cookie; HSTS preload once the domain is fixed.
- Narrower row-level policies for experts, keyed on the booking or the mentorship rather than the school.
