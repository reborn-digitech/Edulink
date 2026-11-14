/**
 * WHO MAY CALL THE API FROM ANOTHER ORIGIN, AND THE CROSS-SITE LOCK (TA-137, 14 November 2026). These rules were the
 * middleware's alone. The upload door, POST /api/v1/uploads, now sits outside the middleware's matcher so that the
 * framework's 10 MB copy of every body no longer cuts a phone's video short, and it answers the browser's pre-check
 * and applies the lock itself: one reading here, so the door and the middleware cannot drift apart.
 *
 * NO IMPORTS, on purpose: the middleware runs on the edge and reads this file.
 */

/** The origins named in API_CORS_ORIGINS (comma-separated); with nothing configured, Expo's default port in development and nobody anywhere else. */
export function allowedOrigins(): Set<string> {
  const configured = (process.env.API_CORS_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (configured.length > 0) return new Set(configured);
  return new Set(process.env.NODE_ENV === "development" ? ["http://localhost:8081", "http://127.0.0.1:8081"] : []);
}

/** The request headers another origin may send. A list joined below: the i18n audit reads a sentence-shaped string as copy. */
const ALLOWED_REQUEST_HEADERS = ["Authorization", "Content-Type", "Accept", "Accept-Language", "X-Edulink-Replay", "X-Edulink-Owner"];

/** What a pre-check from a named origin is answered with. */
export function preflightHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": ALLOWED_REQUEST_HEADERS.join(", "),
    "Access-Control-Max-Age": "600",
    Vary: "Origin",
  };
}

/**
 * Whether a request is a cross-site write carrying the session cookie, which is refused: a browser that sends the
 * cookie AND names an origin other than the app's own host (and not one of the named origins, `allowed`) is another
 * site's form or script. A read, a request naming no origin and a bearer call (no cookie) are not.
 */
export function crossSiteCookieWrite(request: { method: string; origin: string | null; hasSessionCookie: boolean; selfHost: string | null; allowed: boolean }): boolean {
  if (request.method === "GET" || request.method === "HEAD" || request.origin === null) return false;
  if (!request.hasSessionCookie) return false;
  let originHost: string | null = null;
  try { originHost = new URL(request.origin).host; } catch { originHost = null; }
  return originHost !== request.selfHost && !request.allowed;
}

/** Whether a Cookie header carries the session cookie, under either of its names. */
export function hasSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  return cookieHeader.split(";").some((pair) => {
    const name = pair.split("=")[0]?.trim();
    return name === "edulink_session" || name === "__Host-edulink_session";
  });
}
