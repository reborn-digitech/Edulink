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

const config: ExpoConfig = {
  ...(base.expo as ExpoConfig),
  runtimeVersion: { policy: "appVersion" },
  ...(projectId
    ? {
        updates: { url: `https://u.expo.dev/${projectId}`, fallbackToCacheTimeout: 0, checkAutomatically: "ON_LOAD" },
        extra: { ...(base.expo as ExpoConfig).extra, eas: { projectId } },
      }
    : {}),
};

export default config;
