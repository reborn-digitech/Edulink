# Mobile release runbook

The phone app ships two ways, and the difference is one question: did anything native change?

| Change | Ships as | Gate |
|---|---|---|
| Screens, lib, dictionaries, the API client — JavaScript only | An over-the-air update on the same native version (`.github/workflows/ota.yml`) | `pnpm --filter @edulink/mobile ota:guard` passes, the mobile battery passes, the bundle gate passes |
| `app.json`/`app.config.ts`, `eas.json`, a native module added or bumped (anything Expo lists in `bundledNativeModules.json`), the icon or splash | A store release: new version, new build, new tag | The whole CI workflow green on master; TestFlight and Play internal testing for two weeks; crash-free sessions above 99.5% |

`runtimeVersion` follows the app version (`app.config.ts`), so an update can never reach a build whose native side differs from the one it was made for; that is the policy in one line, and `scripts/ota-guard.mjs` refuses an update that would carry a native change.

## Accounts and secrets this needs

- An Expo account with an EAS project. `EAS_PROJECT_ID` as a repository variable and in the developer's shell (`app.config.ts` adds the updates URL only when it is set). `EXPO_TOKEN` as a repository secret.
- Apple Developer: `ASC_APP_ID` and `APPLE_TEAM_ID` in `eas.json`'s submit profile; push certificates through `eas credentials`.
- Google Play: a service-account JSON at `apps/mobile/play-service-account.json` (git-ignored) for `eas submit`; the app created in the console first with one manual upload.
- The production API URL as an EAS environment variable, never in a file: `eas env:create --environment production --name EXPO_PUBLIC_API_URL --value https://…`. The release build refuses to start if it is not https (`src/lib/api.ts`).
- Staging's URL is in `eas.json`'s staging profile; change it there when the host exists (Phase 1's open item).

## A store release

1. Bump `expo.version` in `app.json` (semver; the build number auto-increments on EAS).
2. Master green: the battery job runs the mobile battery and the bundle gate; the sweep job runs the contract suite and the web-target Playwright suite (accessibility, screenshots, offline, network).
3. `eas build --profile staging --platform all` → the internal build for the device matrix (`docs/mobile/ux-checklist.md`, the Maestro flows in `apps/mobile/maestro`). Two weeks. A bug report from a tester goes through the app's own "Report a problem" (More → Report a problem), which attaches device, OS, version and the screen, and lands in the school's audit log with a reference.
4. Crash-free sessions ≥ 99.5% before promotion. The app reports its own crashes on the next start (`src/lib/crash.ts` → `POST /api/v1/app/report` kind CRASH, audited as `APP_CRASH_REPORTED`); count crashes against sessions from the API's session table for the period. A crash reporter with stack symbolication (Sentry or EAS Insights) is the founder's account to add; the seam is the same function.
5. `eas build --profile production --platform all`, then `eas submit --profile production --platform all`.
6. Rollout: Play staged 10% → 50% → 100%, each step at least a day apart with the crash rate watched; App Store phased release (7 days automatic, pausable). Halt on any crash-rate rise or a Sev-1 report.
7. Tag the commit: `git tag mobile-v<version> && git push reborn mobile-v<version>` — the OTA guard compares against the newest such tag.

## An over-the-air update

Actions → "mobile over-the-air update" → channel (staging first, then production) and a one-line message. The workflow refuses unless the change is JS-only and the battery and the bundle gate pass. Verify on a staging device that the update was taken (`expo-updates` `updateId` shows in More → the app's version line once that line exists) before running it for production.

### Code signing the updates

An over-the-air update is JavaScript the phone runs as the app; whoever can publish one on the channel can change what every phone does. Before the first production update, sign them: `npx expo-updates codesigning:generate --key-output-directory keys --certificate-output-directory certs --certificate-validity-duration-years 10 --certificate-common-name "Shalaghar"`, keep the private key out of git (it belongs with `EXPO_TOKEN`, in the repository's secrets and the release engineer's keychain), put the certificate path and `codeSigningMetadata: { keyid: "main", alg: "rsa-v1_5-sha256" }` under `updates` in `app.config.ts`, and pass `--private-key-path` to `eas update` in `.github/workflows/ota.yml`. A phone then refuses an update the key did not sign, even one published with a leaked Expo token. This is not configured yet: it needs the EAS project to exist first, and the key must be made on a machine the owner controls, not in a workflow.

## The kill switch

When a build must not be used any more (a security fix, a broken API contract), raise the minimum on the API and every older app shows the update screen and nothing else:

```
APP_MIN_VERSION_IOS=0.2.0
APP_MIN_VERSION_ANDROID=0.2.0
APP_LATEST_VERSION_IOS=0.2.0
APP_LATEST_VERSION_ANDROID=0.2.0
APP_STORE_URL_IOS=https://apps.apple.com/app/id…
APP_STORE_URL_ANDROID=https://play.google.com/store/apps/details?id=school.edulink.app
APP_UPDATE_MESSAGE=            # optional one sentence, otherwise the standard text
```

`GET /api/v1/app/version` answers these; the app checks on start and on every return to the foreground (at most every six hours), and a failed check never blocks anyone. Raise the minimum only to a version that is fully rolled out on both stores.

## Store listing

`apps/mobile/store/` holds the listing copy in English, Hindi and Marathi, the privacy-label and data-safety answers derived from `docs/decisions/0002-minors-data-policy.md`, and the captions for the six screenshots the CI produces in each language at the App Store 6.7-inch and Play phone sizes (`apps/mobile/e2e/store.spec.ts`, artifact `mobile-e2e-<run>` → `e2e/store/<locale>/<device>/`).
