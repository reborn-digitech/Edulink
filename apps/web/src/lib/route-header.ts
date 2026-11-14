/**
 * The request header the middleware writes on every request it sees — "<METHOD>
 * <pathname>" — so the session's role gate (role-gate.ts, read by getSession)
 * knows which door or page a session is being resolved for. Set by the
 * middleware, overwriting whatever a client sent, on EVERY request but Next's
 * own /_next/ files (A3-S-3, 5 Oct 2026: it once skipped a path ending in an
 * extension, and a client's own stamp reached the gate there). The gate trusts
 * it only because nothing reaches the app without passing the middleware.
 *
 * ONE DOOR DOES NOT PASS IT (TA-137 and TA-244, 14 Nov 2026): POST /api/v1/uploads
 * is left out of the middleware's matcher so that the framework's 10 MB copy of
 * the body does not cut a phone's video short. There the header is whatever the
 * client sent, and the gate does not read it: the door gives its own stamp
 * (lib/door-route.ts), which getSession asks for first.
 *
 * Its own file, importing nothing, because the middleware runs on the edge.
 */
export const ROUTE_HEADER = "x-edulink-route";

/** The one path outside the middleware's matcher (see above); the matcher itself is a literal in middleware.ts. */
export const UPLOAD_DOOR_PATH = "/api/v1/uploads";

/**
 * The path the gate reads, DECODED the way the router serves it (campaign
 * S-11): a production server routes `/%61dmin/people` to admin/people, so a
 * gate reading the raw `%61dmin` saw a segment outside the app and passed.
 * Each segment is percent-decoded; empty segments collapse; a segment that
 * decodes to a slash, a backslash, a dot-segment or a control character — or
 * does not decode at all — makes the whole path unreadable (null), and the
 * gate refuses a limited role an unreadable path.
 */
export function routePath(raw: string): string | null {
  const out: string[] = [];
  for (const part of raw.split("/")) {
    if (part === "") continue;
    let segment: string;
    try {
      segment = decodeURIComponent(part);
    } catch {
      return null;
    }
    if (segment === "." || segment === ".." || /[/\\\u0000-\u001f]/.test(segment)) return null;
    out.push(segment);
  }
  return `/${out.join("/")}`;
}

/** What the middleware stamps: "<METHOD> <decoded path>", or "<METHOD> !" for a path that does not decode. */
export function routeStamp(method: string, rawPath: string): string {
  return `${method} ${routePath(rawPath) ?? "!"}`;
}
