# Store privacy forms — the answers, and where each comes from

Every answer below points at a row of the data inventory in [`docs/decisions/0002-minors-data-policy.md`](../../../docs/decisions/0002-minors-data-policy.md) ("row N"). The forms ask about what the **app** sends off the phone; the policy covers everything the platform holds, so several rows the school sees on the web are "not collected" here because the phone never sends them. Form wording changes; the store's live questionnaire wins over the labels used here, and anything marked *confirm* was not checked against the console.

What the phone actually transmits, from the code (`apps/mobile/src`):

| Sent by the app | Where | Row |
|---|---|---|
| Sign-in identifier (email address, phone number or login handle) and password, or a magic-link / first-sign-in code, or an SSO exchange code | `POST /api/v1/auth/*` (`app/(auth)/*.tsx`) | 1, 21 |
| The literal string "Shalaghar app" as the session's device name | `(auth)/index.tsx` → `Session.userAgent` | 20 |
| Expo push token, platform, device model | `lib/push.ts` → `POST /api/v1/me/devices` | 19 |
| Attendance marks, exam marks, homework text, messages, leave requests, meeting bookings, review scores — the person's own entries about pupils or themselves | screen mutations and the SQLite outbox | 5, 6, 8, 10, 14, 15 |
| Problem report text; crash report (message, screen name, stack, platform, OS version, model, app version, build) | `lib/crash.ts`, `lib/version.ts` → `POST /api/v1/app/report` | 24 |
| The chosen language, as a request header | `lib/api.ts` | 25 |
| The bus's position (latitude, longitude, speed, accuracy and the instant) from a **driver's** phone, every 10 to 15 seconds of a trip the driver started, and from no other phone | `lib/trip-location-platform.native.ts`, `lib/trip-positions.ts` → `POST /api/v1/transport/trips/{id}/positions` | 34 |
| Each pupil the driver ticks on or off the bus, with the time | `lib/trip-positions.ts` → `POST /api/v1/transport/trips/{id}/boardings` | 31 |
| A pupil's health and emergency card as a guardian writes it: blood group, allergies, conditions, medicines, the doctor, people to call | `screens/family/health.tsx` → `POST /api/v1/family/health` | 26 |
| A request to change the pupil record, which can carry the parents' names and occupations, the home address, a contact number, religion, caste and category, the type of disability, the family's income and blood group | `screens/family/record.tsx` → `POST /api/v1/family/record/changes` | 28 |
| A question typed to the assistant, where the school has turned it on | `screens/shared/assistant.tsx` → `/api/v1/assistant/*` | 35 |

Sent by the app when the person chooses to: a photo or video for a bulletin post, a photograph of a pupil's own work for a hand-in, and a file (a picture or a document such as a PDF) for an assignment handout, a competition entry, a Social Media picture or a school logo — one file at a time through the system picker (`lib/pick-file.ts`) or, for hand-ins, the camera; the server strips EXIF (including location) from a picture before storing it. Not sent by the app: date of birth, anything from the photo library it was not handed, the location of any phone but a driver's during a trip, contacts, any advertising identifier, any analytics event. A fee is paid on the gateway's own web page, which the app opens in the browser (`screens/family/fees.tsx`); no card or bank detail passes through the app. The server additionally records the connection's IP for each session and audit line (Gap 7).

These answers were corrected on 14 November 2026 (the owner's decision on TA-261 of the testing analysis of 13 November 2026): they had said location was never requested and that the app sent no health data, no files and nothing about religion or caste. Counsel reads the privacy text these answers rest on before a form is submitted.

## Permissions the app asks for

Every plugin of `apps/mobile/app.json` that asks the person for something, each permission string it sets and each background switch it turns on, is named here in backticks; `test/lib/ta-decision-261-store-permissions.test.ts` fails when `app.json` gains one this table does not name. A plugin that asks for nothing (`expo-router`, `expo-splash-screen`, `expo-secure-store`, `expo-sqlite`, `expo-sharing`, `expo-localization`) is listed in that test instead.

| Permission | Declared by | Asked when | What it is used for | Row |
|---|---|---|---|---|
| Notifications | `expo-notifications` | After sign-in; a refusal is silent and the app works without it | Delivering the school's notices to the phone | 18, 19 |
| Camera | `expo-image-picker`, with `cameraPermission`; its photos and microphone permissions are switched off | At a pupil's first photographed hand-in; a refusal leaves the file picker beside it | Photographing work a pupil hands in, one picture at a time | 8 |
| Location while the app is in use (precise) | `expo-location`, with `locationWhenInUsePermission`; "always" is switched off on both platforms. On iPhone `isIosBackgroundLocationEnabled` keeps a started trip sending while the phone is locked; on Android `isAndroidForegroundServiceEnabled` does the same through a foreground service with its notification, and Android's background location permission stays off | When a driver starts a bus trip, and for nobody else; a driver who refuses starts the trip with a reason and no position | The bus's position during that trip, shown to the riders' guardians and the school's office, and deleted after 30 days by default | 34 |

## Apple — App Privacy ("nutrition label")

Tracking (as Apple defines it, linking with third-party data for advertising or sharing with data brokers): **No data used for tracking**, for every type. Third-party SDKs: none (policy, "What the app does not do").

| Apple data type | Collected? | Linked to the user? | Tracking? | Purposes | Basis |
|---|---|---|---|---|---|
| Contact Info — Name | Yes (a parent's name, where a family proposes it for the pupil record) | Yes | No | App Functionality | A person's own name is entered by the school on the web and only displayed by the app (row 1); a record-change request can carry the parents' names (row 28) |
| Contact Info — Email Address | Yes | Yes | No | App Functionality | The sign-in identifier and the magic-link address (rows 1, 21) |
| Contact Info — Phone Number | Yes (when a phone number is the sign-in identifier) | Yes | No | App Functionality | The web accepts email, phone or handle; the app sends what the person types (row 1) |
| Contact Info — Physical Address | Yes (where a family proposes it for the pupil record) | Yes | No | App Functionality | The home address in a record-change request (row 28) |
| Contact Info — Other User Contact Info | No | — | — | — | |
| Health & Fitness — Health, Fitness | Yes (Health; Fitness No) | Yes | No | App Functionality | The health and emergency card a guardian writes, and blood group in a record-change request (rows 26, 28) |
| Financial Info — Payment Info, Credit Info | No | — | — | — | No purchase in the app. A fee is paid on the gateway's own web page, opened in the browser; no card or bank detail passes through the app (*confirm* how the store classes a checkout the app starts) |
| Financial Info — Other Financial Info | Yes (where a family proposes it for the pupil record) | Yes | No | App Functionality | The family's annual income in a record-change request (row 28) |
| Location — Precise Location | Yes (a driver's phone only, during a bus trip) | Yes | No | App Functionality | The bus's position every 10 to 15 seconds of a trip the driver started, kept 30 days by default; no pupil's, guardian's or teacher's phone is ever asked (row 34). EXIF GPS is still stripped server-side from uploads (row 11) |
| Location — Coarse Location | No | — | — | — | |
| Sensitive Info | Yes (where a family proposes it for the pupil record) | Yes | No | App Functionality | Religion, caste and category, and the type of disability, in a record-change request (row 28). Date of birth is never sent by the app (row 2) |
| Contacts | No | — | — | — | |
| User Content — Emails or Text Messages | Yes | Yes | No | App Functionality | In-app messages and remark replies (rows 9–10) |
| User Content — Photos or Videos | Yes | Yes | No | App Functionality | A bulletin picture or video, or a photograph of a pupil's own work handed in; chosen one at a time, EXIF stripped on the server (rows 8 and 11) |
| User Content — Audio Data | No | — | — | — | |
| User Content — Gameplay Content | No | — | — | — | |
| User Content — Customer Support | Yes | Yes | No | App Functionality | "Report a problem" text (row 24) |
| User Content — Other User Content | Yes | Yes | No | App Functionality | Attendance and marks a teacher enters, homework text a pupil hands in, leave requests, meeting notes, review scores, a file handed in or attached, the times a driver ticks a pupil on and off the bus, and a question typed to the assistant where the school has turned it on (rows 5, 6, 8, 14, 15, 31, 35) |
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
| Does your app share user data with third parties? | No — Expo (push routing, OTA updates), Apple APNs and Google FCM act as service providers under Play's definition, not as third parties the data is shared with; the notification text they route is the only personal data the app itself causes to leave the school's server. The server's other processors (Twilio for texts and WhatsApp, the mail relay, Razorpay's checkout page, Meta where a school posts there, OpenStreetMap's map pictures) are named in the privacy policy and in decision 0002's amendment of 14 November 2026 | Rows 18–19; *confirm* that Play's "service provider" carve-out is claimed on the form |

**Data types** (Play's categories). Purposes use Play's vocabulary: App functionality, Analytics, Developer communications, Advertising or marketing, Fraud prevention/security/compliance, Personalization, Account management. "Required" means the app cannot work without it; "Ephemeral" means processed in memory only.

| Play category — type | Collected? | Shared? | Required or optional | Purposes | Basis |
|---|---|---|---|---|---|
| Location — Approximate, Precise | Yes: Precise, from a driver's phone only (Approximate No) | No | Optional (a driver who refuses starts the trip with a reason and no position) | App functionality | The bus's position during a trip the driver started, shown to the riders' guardians and the school's office, kept 30 days by default (row 34). The trip keeps sending while the phone is locked, through a foreground service with its notification; the Android background location permission is not requested (*confirm* the console's foreground-service declaration for location) |
| Personal info — Name | Yes, a parent's name where a family proposes it for the pupil record | No | Optional | App functionality | A person's own name is displayed only (row 1); a record-change request can carry the parents' names (row 28) |
| Personal info — Email address | Yes | No | Required for sign-in (unless a phone or handle is used) | Account management | Rows 1, 21 |
| Personal info — User IDs | Yes | No | Required | Account management, App functionality | Row 20 |
| Personal info — Address | Yes, where a family proposes it for the pupil record | No | Optional | App functionality | The home address in a record-change request (row 28) |
| Personal info — Phone number | Yes, when used as the sign-in identifier | No | Optional | Account management | Row 1 |
| Personal info — Race and ethnicity, Political or religious beliefs, Sexual orientation, Other info | Yes: caste and category (Race and ethnicity) and religion (Political or religious beliefs), where a family proposes them for the pupil record; Sexual orientation No; Other info Yes (the parents' occupations, the type of disability) | No | Optional | App functionality | A record-change request a guardian or a pupil files, which the office applies or declines (row 28) |
| Financial info — User payment info, Purchase history, Credit score | No | No | — | — | A fee is paid on the gateway's own web page, opened in the browser (*confirm* how Play classes a checkout the app starts) |
| Financial info — Other financial info | Yes, where a family proposes it for the pupil record | No | Optional | App functionality | The family's annual income in a record-change request (row 28) |
| Health and fitness — Health info (Fitness info No) | Yes | No | Optional | App functionality | The health and emergency card a guardian writes, and blood group in a record-change request (rows 26, 28) |
| Messages — Emails | No | No | — | — | |
| Messages — SMS or MMS | No | No | — | — | |
| Messages — Other in-app messages | Yes | No | Optional (a person may never send one) | App functionality | Rows 9–10 |
| Photos and videos — Photos, Videos | Yes | No | Optional: a bulletin picture or a photographed page of work | App functionality | One file at a time through the system picker or the camera; EXIF stripped on the server (rows 8 and 11) |
| Audio — Voice or sound recordings, Music files, Other audio | No | No | — | — | |
| Files and docs | Yes | No | Optional | App functionality | One file at a time through the system picker: a document such as a PDF for an assignment handout or a competition entry (rows 8, 13) |
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

**Data handling practices** the form asks for per type: collected only while signed in; deleted on request through the school; the push token is deleted on sign-out and retired by the server when dead (row 19); reports are kept as audit rows (row 24, Gap 3); the bus's positions are deleted after 30 days and a pupil's boarding times after a year, both the service's defaults (rows 34 and 31); a question to the assistant goes with its conversation 30 days after the last message (row 35).

## Google Play — target audience, Families, and app content

| Declaration | Answer | Basis |
|---|---|---|
| Target age groups | A **mixed audience**: pupils from primary age upwards, and adults (teachers, guardians, office). Select the child groups the schools actually enrol (6–8, 9–12, 13–15, 16–17) and 18+. | The app is used by children under a login their school issues; `isMinor` is set from the school's date-of-birth record (policy, "Frame") |
| Does the app appeal to children? / Is it designed for children? | It is **used by** children as pupils but is not designed primarily for them: the same app serves teachers and guardians, and every child account is created and consented to through the school (guardianship, rows 4 and 13). Answer the console's wording honestly on that basis. | Policy, "Frame" |
| Enrol in the Designed for Families program? | **No.** Not a child-directed app; enrolment is optional and would misdescribe it. Families **policy** requirements still apply because the audience includes children, and the app meets them: no ads, no ad SDK, no Advertising ID, no third-party analytics, no location of a child's phone (the only location read is a driver's, during a bus trip), permissions limited to what the shipped features need (the table "Permissions the app asks for" above), no unmoderated child-to-child channel. | Rows 10–11; "What the app does not do" |
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
| Can users share their location with other users? | No person's location is shared. A driver's phone sends the position of the school bus during a trip, and the riders' guardians and the school's office see the bus on a map (*confirm* how the questionnaire classes a vehicle's position sent from a staff phone) | Row 34; EXIF stripped from uploads (row 11) |
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
