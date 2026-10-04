import { TILE_URL } from "@edulink/contracts";

/**
 * The web target's Content-Security-Policy (PH-8, campaign 2026-10-04). The
 * web target keeps the bearer in localStorage (lib/storage.ts), so a script
 * that is not the app's must not run, and the app's own may talk only to
 * itself and the API. The one inline script an export writes is expo-router's
 * hydration flag, allowed by its hash; react-native-web writes its styles
 * inline at run time, so styles may be inline. Images: the API's files, the
 * bus map's tiles, and the data and blob addresses expo-image and the
 * signature pad make. A development server also loads through its own
 * websocket and may evaluate its hot reloads.
 */
export const HYDRATE_SCRIPT_HASH = "sha256-67fhrP0+BkBqmgGGXTtgiVO/9EQs3QruYNU/7fnRkI8=";

export function contentSecurityPolicy(apiBase: string, dev: boolean): string {
  const api = new URL(apiBase).origin;
  const tiles = new URL(TILE_URL.replace(/\{[^}]+\}/g, "0")).origin;
  return [
    "default-src 'self'",
    `script-src 'self' '${HYDRATE_SCRIPT_HASH}'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${api} ${tiles}`,
    "font-src 'self' data:",
    `connect-src 'self' ${api}${dev ? " ws: wss:" : ""}`,
    `media-src 'self' blob: ${api}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}
