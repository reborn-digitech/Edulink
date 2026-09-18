# Store privacy forms — the answers, and where each comes from

Every answer below points at a row of the data inventory in [`docs/decisions/0002-minors-data-policy.md`](../../../docs/decisions/0002-minors-data-policy.md) ("row N"). The forms ask about what the **app** sends off the phone; the policy covers everything the platform holds, so several rows the school sees on the web are "not collected" here because the phone never sends them. Form wording changes; the store's live questionnaire wins over the labels used here, and anything marked *confirm* was not checked against the console.

What the phone actually transmits, from the code (`apps/mobile/src`):

| Sent by the app | Where | Row |
|---|---|---|
| Sign-in identifier (email address, phone number or login handle) and password, or a magic-link / first-sign-in code, or an SSO exchange code | `POST /api/v1/auth/*` (`app/(auth)/*.tsx`) | 1, 21 |
| The literal string "EduLink app" as the session's device name | `(auth)/index.tsx` → `Session.userAgent` | 20 |
| Expo push token, platform, device model | `lib/push.ts` → `POST /api/v1/me/devices` | 19 |
| Attendance marks, exam marks, homework text, messages, leave requests, meeting bookings, review scores — the person's own entries about pupils or themselves | screen mutations and the SQLite outbox | 5, 6, 8, 10, 14, 15 |
| Problem report text; crash report (message, screen name, stack, platform, OS version, model, app version, build) | `lib/crash.ts`, `lib/version.ts` → `POST /api/v1/app/report` | 24 |
| The chosen language, as a request header | `lib/api.ts` | 25 |

Sent by the app when the person chooses to: a photo or video for a bulletin post, and a photograph of a pupil's own work for a hand-in — one file at a time through the system picker or, for hand-ins, the camera; the server strips EXIF (including location) before storing it. Not sent by the app: name, date of birth, anything from the photo library it was not handed, location, contacts, any advertising identifier, any analytics event. The server additionally records the connection's IP for each session and audit line (Gap 7).

## Apple — App Privacy ("nutrition label")

Tracking (as Apple defines it, linking with third-party data for advertising or sharing with data brokers): **No data used for tracking**, for every type. Third-party SDKs: none (policy, "What the app does not do").

| Apple data type | Collected? | Linked to the user? | Tracking? | Purposes | Basis |
|---|---|---|---|---|---|
| Contact Info — Name | No | — | — | — | Entered by the school on the web, only displayed by the app (row 1) |
| Contact Info — Email Address | Yes | Yes | No | App Functionality | The sign-in identifier and the magic-link address (rows 1, 21) |
| Contact Info — Phone Number | Yes (when a phone number is the sign-in identifier) | Yes | No | App Functionality | The web accepts email, phone or handle; the app sends what the person types (row 1) |
| Contact Info — Physical Address | No | — | — | — | |
| Contact Info — Other User Contact Info | No | — | — | — | |
| Health & Fitness — Health, Fitness | No | — | — | — | |
| Financial Info — Payment Info, Credit Info, Other | No | — | — | — | No purchases, no payments |
| Location — Precise, Coarse | No | — | — | — | Never requested; EXIF GPS is stripped server-side from web uploads (row 11) |
| Sensitive Info | No | — | — | — | Date of birth is never sent by the app (row 2) |
| Contacts | No | — | — | — | |
| User Content — Emails or Text Messages | Yes | Yes | No | App Functionality | In-app messages and remark replies (rows 9–10) |
| User Content — Photos or Videos | Yes | Yes | No | App Functionality | A bulletin picture or video, or a photograph of a pupil's own work handed in; chosen one at a time, EXIF stripped on the server (rows 8 and 11) |
| User Content — Audio Data | No | — | — | — | |
| User Content — Gameplay Content | No | — | — | — | |
| User Content — Customer Support | Yes | Yes | No | App Functionality | "Report a problem" text (row 24) |
| User Content — Other User Content | Yes | Yes | No | App Functionality | Attendance and marks a teacher enters, homework text a pupil hands in, leave requests, meeting notes, review scores (rows 5, 6, 8, 14, 15) |
| Browsing History | No | — | — | — | |
| Search History | No | — | — | — | Search fields in the directory screens filter server responses; nothing is stored |
| Identifiers — User ID | Yes | Yes | No | App Functionality | The session and the user id behind it (row 20) |
| Identifiers — Device ID | Yes | Yes | No | App Functionality | The Expo push token is a per-device identifier; device model beside it (row 19) |
| Purchases — Purchase History | No | — | — | — | |
| Usage Data — Product Interaction | No | — | — | — | No analytics; the crash report's screen name is diagnostic context, declared under Diagnostics |
| Usage Data — Advertising Data | No | — | — | — | |
| Usage Data — Other Usage Data | No | — | — | — | |
| Diagnostics — Crash Data | Yes | Yes | No | App Functionality | Sent with the bearer token, so linked; message, stack, screen (row 24) |
| Diagnostics — Performance Data | No | — | — | — | |
| Diagnostics — Other Diagnostic Data | Yes | Yes | No | App Functionality | Platform, OS version, model, app version and build attached to every report (row 24) |
| Surroundings — Environment Scanning; Body — Hands, Head | No | — | — | — | |
| Other Data | No | — | — | — | |

Notes for the form:
- "Linked to the user" is Yes wherever the data travels with the session token, which is everything except the sign-in call itself. Apple's optional-disclosure exemptions are not claimed.
- The privacy policy URL is `PRIVACY_URL` (listing). The App Review notes carry `REVIEWER_LOGIN` / `REVIEWER_PASSWORD` (Guideline 2.1) because accounts cannot be created in the app.
- Export compliance: the app uses only standard TLS (HTTPS) — declare no non-exempt encryption (`ITSAppUsesNonExemptEncryption = false`; not yet in `app.json`, *confirm* before the first upload).
- Guideline 4.8 (third-party login): the iOS sign-in offers Google. Either the education-account exception applies (the sign-in must already exist at a school), or hide the button on iOS, or add Sign in with Apple — the server already implements `apple` in `apps/web/src/lib/sso.ts`. Decide before submission (policy checklist item 6).
- Kids Category: **not selected** (Guideline 1.3). Guideline 5.1.4 still applies because minors use the app: no personal or device information goes to a third party except Expo's push and update services as processors (policy, "What the app does not do").

## Google Play — Data safety

**Overview answers**

| Question | Answer | Basis |
|---|---|---|
| Does your app collect or share any of the required user data types? | Yes | Table below |
| Is all of the user data collected by your app encrypted in transit? | Yes | A release build refuses a non-`https://` API base (`apps/mobile/src/lib/api.ts`); Expo's services are HTTPS |
| Do you provide a way for users to request that their data is deleted? | Yes — by request to the school or `SUPPORT_EMAIL`; `ACCOUNT_DELETION_URL` explains the path | Policy, "Rights and requests"; there is no in-app deletion (Gap 5) |
| Has your app been independently validated against a global security standard (MASA)? | No | |
| Does your app share user data with third parties? | No — Expo (push routing, OTA updates), Apple APNs and Google FCM act as service providers under Play's definition, not as third parties the data is shared with; the notification text they route is the only personal data that leaves the school's server on the app's account | Rows 18–19; *confirm* that Play's "service provider" carve-out is claimed on the form |

**Data types** (Play's categories). Purposes use Play's vocabulary: App functionality, Analytics, Developer communications, Advertising or marketing, Fraud prevention/security/compliance, Personalization, Account management. "Required" means the app cannot work without it; "Ephemeral" means processed in memory only.

| Play category — type | Collected? | Shared? | Required or optional | Purposes | Basis |
|---|---|---|---|---|---|
| Location — Approximate, Precise | No | No | — | — | |
| Personal info — Name | No | No | — | — | Displayed only (row 1) |
| Personal info — Email address | Yes | No | Required for sign-in (unless a phone or handle is used) | Account management | Rows 1, 21 |
| Personal info — User IDs | Yes | No | Required | Account management, App functionality | Row 20 |
| Personal info — Address | No | No | — | — | |
| Personal info — Phone number | Yes, when used as the sign-in identifier | No | Optional | Account management | Row 1 |
| Personal info — Race and ethnicity, Political or religious beliefs, Sexual orientation, Other info | No | No | — | — | |
| Financial info — all | No | No | — | — | |
| Health and fitness — all | No | No | — | — | |
| Messages — Emails | No | No | — | — | |
| Messages — SMS or MMS | No | No | — | — | |
| Messages — Other in-app messages | Yes | No | Optional (a person may never send one) | App functionality | Rows 9–10 |
| Photos and videos — Photos, Videos | Yes | No | Optional: a bulletin picture or a photographed page of work | App functionality | One file at a time through the system picker or the camera; EXIF stripped on the server (rows 8 and 11) |
| Audio — Voice or sound recordings, Music files, Other audio | No | No | — | — | |
| Files and docs | No | No | — | — | Hand-ins are text (row 8) |
| Calendar | No | No | — | — | |
| Contacts | No | No | — | — | |
| App activity — App interactions | No | No | — | — | No analytics |
| App activity — In-app search history | No | No | — | — | |
| App activity — Installed apps | No | No | — | — | |
| App activity — Other user-generated content | Yes | No | Optional | App functionality | Attendance, marks, homework text, leave, meeting notes, review scores, problem-report text (rows 5, 6, 8, 14, 15, 24) |
| App activity — Other actions | No | No | — | — | |
| Web browsing — Web browsing history | No | No | — | — | The app opens only the school's own web pages in the system browser |
| App info and performance — Crash logs | Yes | No | Optional (a crash is posted on the next signed-in start; there is no opt-out switch — *confirm* whether Play requires one to call it optional) | App functionality (fixing the app) | Row 24 |
| App info and performance — Diagnostics | Yes | No | Optional | App functionality | OS version, model, app version and build on each report (row 24) |
| App info and performance — Other app performance data | No | No | — | — | |
| Device or other IDs — Device or other IDs | Yes | No | Required for notifications only (refusing the permission means no token) | App functionality | The Expo push token and device model (row 19) |

**Data handling practices** the form asks for per type: collected only while signed in; deleted on request through the school; the push token is deleted on sign-out and retired by the server when dead (row 19); reports are kept as audit rows (row 24, Gap 3).

## Google Play — target audience, Families, and app content

| Declaration | Answer | Basis |
|---|---|---|
| Target age groups | A **mixed audience**: pupils from primary age upwards, and adults (teachers, guardians, office). Select the child groups the schools actually enrol (6–8, 9–12, 13–15, 16–17) and 18+. | The app is used by children under a login their school issues; `isMinor` is set from the school's date-of-birth record (policy, "Frame") |
| Does the app appeal to children? / Is it designed for children? | It is **used by** children as pupils but is not designed primarily for them: the same app serves teachers and guardians, and every child account is created and consented to through the school (guardianship, rows 4 and 13). Answer the console's wording honestly on that basis. | Policy, "Frame" |
| Enrol in the Designed for Families program? | **No.** Not a child-directed app; enrolment is optional and would misdescribe it. Families **policy** requirements still apply because the audience includes children, and the app meets them: no ads, no ad SDK, no Advertising ID, no third-party analytics, no location, permissions limited to what the shipped features need (Gap 1 must be closed first), no unmoderated child-to-child channel. | Rows 10–11; "What the app does not do" |
| Age assurance / neutral age screen | None in the app: age comes from the school's record, not from a self-declared screen. *Confirm* against the current Families policy text whether a mixed-audience app with school-issued accounts needs a neutral age screen; the design position is that the school, as fiduciary, has already established the child's age (row 2). | Policy Gap 4 |
| Verifiable parental consent (India, DPDP s.9(1)) | Recorded as the guardianship's consent timestamps, given by the parent claiming with the student code and date of birth or accepting the office's invitation; the school stands in until then. | Policy, "Frame"; rows 4, 13, 16 |
| Ads | No ads | `apps/mobile/package.json`: no ad SDK |
| App access | Restricted — all functionality requires a school-issued login; provide `REVIEWER_LOGIN` / `REVIEWER_PASSWORD` on a demo school | Listing |
| Account deletion URL | `ACCOUNT_DELETION_URL` | Policy, "Rights and requests"; Gap 5 |
| News app / COVID-19 contact tracing / Government app / Financial features / Health apps | No / No / No / No / No | |
| Privacy policy URL | `PRIVACY_URL` | |

## Content rating questionnaires

### IARC (Google Play)

Answers are determined by the app's features; the exact question text on the form may differ.

| Question | Answer | Basis |
|---|---|---|
| Violence, sexual content, nudity, profanity, horror, drugs, alcohol, tobacco, gambling (real or simulated) | None | Nothing of the kind exists in the app; the practice bank is curriculum questions (row 12) |
| Does the app allow users to interact or exchange content with other users? | **Yes** | Messages to staff (row 10), bulletin posts, comments and reactions (row 11), remark threads (row 9) |
| Is the user-generated content moderated? | **Yes** — a pupil's post is created PENDING and is invisible to everyone but the author and the staff who can review it; pupils' comments are held the same way; a rejection carries a reason; any reader can report a post, comment or person to the school's Safety Centre; a school can hide a cross-school post for its own people | `apps/web/src/lib/bulletin.ts` (`moderatePost`, `pendingCount`, `notifyReviewers`), `Post.status`, `Comment.status`, `Report`, `GlobalPostHide`; `apps/web/src/lib/safety.ts` |
| Can users share their location with other users? | No | No location anywhere; EXIF stripped (row 11) |
| Can users share personal information with other users? | Only within the school's own channels above; a pupil cannot reach another pupil or a parent | `mayConverse`, `apps/web/src/lib/conversations.ts` |
| Does the app contain or allow the purchase of digital goods? | No | |
| Does the app provide unrestricted internet access (a browser)? | No — links open the school's own site in the system browser | `Linking.openURL` calls in `apps/mobile/src` all use `API_BASE` |
| Does the app promote or use products, services or content that are restricted by age? | No | |
| Is the app a game? | No | |

Expected result: IARC generic "Everyone" (PEGI 3 / ESRB Everyone) with the **"Users Interact"** interactive element. If a region's rating asks about "Shares Info", answer No: the app does not share a user's personal information with other apps or third parties.

### Apple age rating

Apple's questionnaire was revised in 2025 (content descriptors plus app capabilities); answer the live form with these facts. *Confirm* item names against the console.

| Item | Answer | Basis |
|---|---|---|
| Cartoon or fantasy violence, realistic violence, prolonged graphic violence, profanity or crude humour, mature or suggestive themes, horror or fear, sexual content or nudity, alcohol/tobacco/drug use or references, medical or treatment information | None | |
| Gambling (real or simulated) | None | |
| Contests | None in the sweepstakes sense. The app carries school academic competitions a pupil enters with a guardian's consent (row 13); no entry fee, no prize handled by the app. If the form's definition is broader, answer "infrequent/mild" and say so in the review notes. | `apps/web/src/lib/competitions.ts` |
| Unrestricted web access | No | System browser, school's own pages only |
| User-generated content | Yes, moderated (see the IARC row above) | Row 11 |
| Messaging and chat | Yes — one-to-one messages between a person and their school's staff, and staff to anyone at the school; never pupil-to-pupil | Row 10 |
| Advertising | None | |
| In-app purchases, loot boxes, or similar | None | |
| Parental controls | None in-app; the guardian's view *is* the parental surface (rows 4, 18, 25) and consent gates are server-side (rows 13, 16) | |
| Age assurance | None self-declared in-app; age is the school's record (row 2) | |
| Made for Kids | No (not the Kids Category) | Listing, "Age rating notes" |

Expected result: **4+**. State in the review notes that the app is used by minors under school-issued accounts and that the privacy policy at `PRIVACY_URL` is the one derived from `docs/decisions/0002-minors-data-policy.md`.
