import { ROLE_HOME, type Role } from "../constants";

/** The address parameter that opens Vidura's drawer (components/assistant/model.ts DRAWER_PARAM, kept equal by a test). */
const DRAWER_PARAM = "vidura";

/**
 * Where the old /assistant pages send a person (Vidura pass 1, 17 Oct 2026): back to the page they were on, with the
 * drawer open. Pure.
 *
 * The page to go back to: a path on this platform only, never /assistant itself.
 */
export function backTo(from: string | null, referer: string | null, host: string | null, role: string | null): string {
  const home = role && role in ROLE_HOME ? ROLE_HOME[role as Role] : "/";
  // TA-026: a browser reads a backslash in an http address as a slash and drops tabs and line breaks, so "/\evil.example"
  // and "/<tab>/evil.example" leave the platform; a path with either, or with any control character, is not one of ours.
  const ok = (p: string | null | undefined): p is string => !!p && /^\/(?![/\\])/.test(p) && !/[\\\u0000-\u001f\u007f]/.test(p) && !p.startsWith("/assistant");
  if (ok(from)) return from;
  if (referer && host) {
    try {
      const url = new URL(referer);
      if (url.host === host && ok(url.pathname)) return `${url.pathname}${url.search}`;
    } catch {
      // not a URL: home
    }
  }
  return home;
}

/** The path with the drawer asked open, keeping its own query. */
export function withDrawer(path: string, value: string): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.set(DRAWER_PARAM, value);
  return `${base}?${params.toString()}`;
}
