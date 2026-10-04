import type { ExpoConfig } from "expo/config";
import base from "./app.json";

/**
 * app.json plus what the release adds. The production API URL is NOT here
 * and not in eas.json: the production build takes EXPO_PUBLIC_API_URL from
 * an EAS environment variable (see docs/runbooks/mobile-release.md), and
 * src/lib/api.ts refuses a release build whose base is not https.
 *
 * runtimeVersion follows the app version: an over-the-air update may only
 * reach a build with the same native version — the OTA policy in one line.
 * A change to a native module bumps the version and goes through the store;
 * scripts/ota-guard.mjs refuses an update that would carry such a change.
 */
const projectId = process.env.EAS_PROJECT_ID;

/**
 * The web target's output. "static" (app.json's, and the export's) renders
 * every route on the server; under `expo start --web` that means a render per
 * page load, and the dev server was seen to run out of an 8 GB heap after
 * some sixty full loads. EXPO_WEB_OUTPUT=single makes the dev server hand
 * out one page and render nothing itself. The export is not affected: it
 * is run without the variable.
 */
const webOutput = process.env.EXPO_WEB_OUTPUT === "single" ? "single" : undefined;

/**
 * Android push: expo-notifications reaches Android through Firebase Cloud
 * Messaging, which needs the Firebase project's google-services.json in the
 * build (`android.googleServicesFile`). The file is not in git; on EAS it is
 * a file-type environment variable, GOOGLE_SERVICES_JSON, whose value at
 * build time is the path of the uploaded file — docs/runbooks/mobile-release.md.
 * Unset (a laptop, CI, the web target) means no Android push and nothing else.
 */
const googleServicesFile = process.env.GOOGLE_SERVICES_JSON;

const appJson = base.expo as ExpoConfig;

const config: ExpoConfig = {
  ...appJson,
  runtimeVersion: { policy: "appVersion" },
  ios: {
    ...appJson.ios,
    infoPlist: {
      ...appJson.ios?.infoPlist,
      // Export compliance, answered once in the binary rather than at every
      // App Store upload: the app's only cryptography is the platform's own
      // standard HTTPS (TLS to the API) and the system keychain behind
      // expo-secure-store — exempt, nothing proprietary or non-standard.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  // No Android auto-backup (PH-9, campaign 2026-10-04): the outbox's SQLite
  // file holds queued registers with pupil ids and message bodies, and a
  // cloud backup would carry it to whatever device restores it.
  android: { ...appJson.android, allowBackup: false, ...(googleServicesFile ? { googleServicesFile } : {}) },
  ...(webOutput ? { web: { ...appJson.web, output: webOutput } } : {}),
  ...(projectId
    ? {
        updates: { url: `https://u.expo.dev/${projectId}`, fallbackToCacheTimeout: 0, checkAutomatically: "ON_LOAD" },
        extra: { ...appJson.extra, eas: { projectId } },
      }
    : {}),
};

export default config;
