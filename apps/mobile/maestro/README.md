# Maestro flows for the EduLink app

**Untested: needs a simulator and Maestro.** These flows were written on a
Mac with no Xcode, no simulator and no Java, so Maestro could not run here.
What *has* run is the static check, `node scripts/maestro-check.mjs` (from
`apps/mobile`): it parses every flow, requires an `appId`, admits only
Maestro's command set, and resolves every text a flow taps or asserts to a
dictionary value (`packages/i18n/src/en.ts`, or `hi.ts` for the language
flow), a language name, a ZZ Northgate fixture name, or a `${PARAMETER}`. A
flow that references a string no screen renders fails that check before
anyone boots a simulator.

One flow per happy path, written once for both platforms (`appId:
school.edulink.app`), run in the order `config.yaml` gives (05 needs 04):

| Flow | Role | What it asserts |
|---|---|---|
| `01-sign-in` | teacher | Today, `ZZ Northgate School`, the sign-in screen gone |
| `02-mark-register` | teacher | Today → `ZZ Grade 3 · A` → mark all present → Divya absent → `Saved`, `Attendance complete` |
| `03-save-grade` | teacher | Classes → `ZZ Grade 3 · A` → Enter exam marks → a Unit test paper → 42 for Divya → `Marks saved.` |
| `04-apply-leave` | teacher | deep link to Leave → dates, Sick leave, reason → `Sent to the principal`, status `waiting` |
| `05-approve-leave` | principal | Leave tab → `ZZ Sunita Kale` waiting → Approve → `Leave approved`, `Already decided` |
| `06-book-meeting` | guardian | deep link to Meetings → `Book` → `Booked. The teacher has been told.`, `Your meetings` |
| `07-hand-in-work` | pupil | Assignments → `Hand it in` → an answer → `Handed in 🎉`, `Change it` |
| `08-practice-question` | pupil | Practice → the `Open on the web` door and the ladder around it (questions live on the web) |
| `09-read-report-card` | guardian | deep link to Exams → `Report cards` tab → the card → `Overall`, `Attendance`, `What this covers`, `Share` → Back |
| `10-switch-language` | teacher | More → `हिन्दी` → the Today tab reads `आज`, More reads `और` → `English` → `Today` |

`common/sign-in.yaml` is the shared sign-in every flow runs first through
`runFlow`: it never types a password. It asks for a link (the "paste the
code" box only appears once a link has been requested for an address), pastes
the token given as a parameter, and waits for the tab bar.

## Parameters

Pass with `-e NAME=value`. Every value is a ZZ Northgate fixture
(`apps/web/scripts/zz-fixtures.ts`); nothing here touches a real account.

| Parameter | Value |
|---|---|
| `ZZ_EMAIL_TEACHER` | `zz.teacher1@zz.test` (ZZ Sunita Kale — holds `ZZ Grade 3 · A` and `ZZ Grade 7 · A`) |
| `ZZ_EMAIL_PRINCIPAL` | `zz.principal@zz.test` (ZZ Rohan Iyer) |
| `ZZ_EMAIL_PARENT` | `zz.parent01@zz.test` (guardian of ZZ Aarav Apte, `ZZ Grade 3 · A`) |
| `ZZ_EMAIL_STUDENT` | `zz.pupil01@zz.test` (ZZ Aarav Apte) |
| `MAGIC_TOKEN_TEACHER`, `MAGIC_TOKEN_PRINCIPAL`, `MAGIC_TOKEN_PARENT`, `MAGIC_TOKEN_STUDENT` | a fresh `MAGIC_LINK` token per account, per run (see below) |
| `LEAVE_FROM`, `LEAVE_TO` | `YYYY-MM-DD`, in the future, not overlapping a request already waiting |
| `REPORT_CARD_TITLE` | the name of a report card published to the ZZ guardian's child (for example `Term 1`) |

### Minting the magic-link tokens

A magic-link token is a row in `AuthToken` (`apps/web/prisma/schema.prisma`):
`purpose = "MAGIC_LINK"`, `userId` of the account, `tokenHash =
sha256(token)` in hex, `expiresAt` twenty minutes out
(`MAGIC_LINK_TTL_MINUTES` in `apps/web/src/lib/constants.ts`), `consumedAt`
null. The app posts the raw token to `POST /api/v1/auth/magic-link/consume`,
which claims it once (`claimToken` in `apps/web/src/lib/auth-tokens.ts`) and
issues a session — so **each flow's sign-in needs its own token**: a token
is spent the moment one flow signs in with it.

`apps/web` already has `npm run zz:token -- TEACHER` (`scripts/zz-token.ts`),
which mints a **bearer** session for the contract tests: it hashes 32 random
bytes (base64url) with sha256 and writes a `Session` row. A `zz:magic-token`
script would do exactly the same with an `AuthToken` row instead of a
`Session` row — same random token, same hash, `purpose: "MAGIC_LINK"`, the
ZZ user's id, twenty minutes of life — and print the raw token. It is
described here and **not implemented**: it belongs in `apps/web/scripts`,
beside `zz-token.ts`, and this change does not touch the web app.

The sign-in subflow also asks the server to email a link to the address (that
is what reveals the paste box). That emailed token is never used; on the dev
mailbox it lands in the `OutboundEmail` table and expires on its own.

### Data the fixtures do not create

`zz:fixtures` builds schools, classes, pupils, guardians, staff and a
timetable — and no exam series, meeting slots, assignments, report cards or
leave requests. So four flows need data set up first, on the web, as ZZ
staff:

- `03-save-grade`: an exam series for grade 3 with at least one **Unit test**
  paper (`/admin/exams`, as `zz.admin@zz.test`).
- `06-book-meeting`: a meeting slot offered by `zz.teacher1` on
  `/teacher/meetings` (that teacher teaches ZZ Aarav Apte).
- `07-hand-in-work`: a published assignment for `ZZ Grade 3 · A` that
  `zz.pupil01` has not handed in (`/teacher/assignments`).
- `09-read-report-card`: a report card published for ZZ Aarav Apte
  (`/teacher/classes/<id>/report-cards`), named in `REPORT_CARD_TITLE`.

`05-approve-leave` needs `04-apply-leave` to have run in the same session of
the suite (that is the order in `config.yaml`).

## Running on an iOS simulator

```bash
# once
curl -Ls "https://get.maestro.mobile.dev" | bash      # Maestro CLI (needs Java 17+)
xcrun simctl boot "iPhone 16"                          # any booted iOS simulator

# the API the app talks to; the app's base URL is baked in at build time
cd apps/web && npm run zz:fixtures && npm run build && npm start &          # http://localhost:3000

# a development build of the app on the simulator (Expo Go cannot deep-link the edulink:// scheme)
cd apps/mobile && EXPO_PUBLIC_API_URL=http://localhost:3000 npx expo run:ios

# the flows
cd apps/mobile
maestro test maestro \
  -e ZZ_EMAIL_TEACHER=zz.teacher1@zz.test -e MAGIC_TOKEN_TEACHER=… \
  -e ZZ_EMAIL_PRINCIPAL=zz.principal@zz.test -e MAGIC_TOKEN_PRINCIPAL=… \
  -e ZZ_EMAIL_PARENT=zz.parent01@zz.test -e MAGIC_TOKEN_PARENT=… \
  -e ZZ_EMAIL_STUDENT=zz.pupil01@zz.test -e MAGIC_TOKEN_STUDENT=… \
  -e LEAVE_FROM=2026-10-06 -e LEAVE_TO=2026-10-07 -e REPORT_CARD_TITLE="Term 1"
```

One flow at a time: `maestro test maestro/02-mark-register.yaml -e …`.
`maestro studio` opens the running app's hierarchy, which is where to look
first when a tap misses.

## Running on an Android emulator

```bash
emulator -avd Pixel_8 &                                # any running AVD, or a device with USB debugging
cd apps/mobile && EXPO_PUBLIC_API_URL=http://10.0.2.2:3000 npx expo run:android
maestro test maestro -e … (as above)
```

`10.0.2.2` is the emulator's name for the host machine; the app must be built
with that base URL to reach the local API.

## How the flows find things

Maestro matches a string against an element's visible text **or** its
accessibility label, as a full-match regex. The screens give every pressable
an `accessibilityLabel` (`Button`, `Row`, the chips, the tabs), so a flow
targets the English sentence a screen renders — and `maestro-check` refuses
any sentence that is not in the dictionary. Where a label is a template
(`Mark all {count} present`) the flow uses `.*` in its place; where two
elements share a string (a Field's label text above the input that carries the
same label; a screen title and its button) `index: 1` picks the second.

Three routes have no tab or in-app door for the role that uses them (the
teacher's Leave, the guardian's Meetings and Exams); those flows enter by
`openLink` on the `edulink://` scheme, the same path a notification's URL
takes through `src/lib/links.ts`. If the scheme form `edulink:///teacher/leave`
does not parse as `path = teacher/leave` on a platform, `edulink://teacher/leave`
is the thing to try — that is one of the things a first run on a simulator
will settle.

## Known fragilities to expect on the first run

- `index: 1` on Fields assumes the platform exposes the label text and the
  input as two elements in that order.
- `below:` (02, 05) relies on Maestro's relative selectors, present since 1.30.
- iOS groups a `Pressable`'s children under its label: a `Row` reads as
  `title, caption`, which is why class rows are matched with `ZZ Grade 3 · A.*`.
- Push permission is not requested on a simulator (`Device.isDevice` guard in
  `src/lib/push.ts`); on a real device `launchApp` grants it up front.
