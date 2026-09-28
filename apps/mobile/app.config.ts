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

const config: ExpoConfig = {
  ...(base.expo as ExpoConfig),
  runtimeVersion: { policy: "appVersion" },
  ...(webOutput ? { web: { ...(base.expo as ExpoConfig).web, output: webOutput } } : {}),
  ...(projectId
    ? {
        updates: { url: `https://u.expo.dev/${projectId}`, fallbackToCacheTimeout: 0, checkAutomatically: "ON_LOAD" },
        extra: { ...(base.expo as ExpoConfig).extra, eas: { projectId } },
      }
    : {}),
};

export default config;
