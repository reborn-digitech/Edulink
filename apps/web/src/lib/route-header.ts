/**
 * The request header the middleware writes on every request it sees — "<METHOD>
 * <pathname>" — so the session's role gate (role-gate.ts, read by getSession)
 * knows which door or page a session is being resolved for. Set by the
 * middleware, overwriting whatever a client sent, on every path it matches
 * (every page and every /api/v1 door). A client can only ever make its own
 * request narrower with it: the gate denies or passes, never widens.
 *
 * Its own file, importing nothing, because the middleware runs on the edge.
 */
export const ROUTE_HEADER = "x-edulink-route";

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
