/**
 * Minimal stand-ins for next/headers.
 *
 * `headers()` and `cookies()` require a live request context. The units under
 * test only read a couple of values, so an empty Headers object exercises the
 * same code paths without needing a whole Next request.
 *
 * ⚠ THE COOKIE JAR IS PRIMEABLE, and that is new. It used to hand back a fresh
 * empty Map on every call, which meant `getSession()` could never find a
 * session and every action gated behind one was untestable — `claimChild`, the
 * form that links a parent to a child, had no direct test at all for exactly
 * this reason. A test can now put a real session token in the jar and call the
 * action the way a request would.
 *
 * Module-level, so a suite MUST clear it (`__setCookie(name, null)` or
 * `__resetCookies()`) or it leaks into the next file in the same worker.
 */

const jar = new Map<string, string>();

/** Test-only. Pass null to remove. */
export function __setCookie(name: string, value: string | null): void {
  if (value === null) jar.delete(name);
  else jar.set(name, value);
}

/** Test-only. */
export function __resetCookies(): void {
  jar.clear();
}

let requestHeaders = new Headers();

/** The request headers a route handler sees — a bearer token, say. */
export function __setHeaders(values: Record<string, string>): void {
  requestHeaders = new Headers(values);
}

/**
 * Every real request the app gates reaches it through the middleware, which
 * stamps the route (lib/route-header.ts); a request with NO stamp is one the
 * middleware never saw, and the gate fails closed on it for a limited role
 * (campaign S-11). A test calls a handler directly, with no middleware, so
 * the stand-in stamps the neutral "GET /" — a path outside the app's working
 * surface, which the gate passes — unless the test sets its own route. A test
 * of the unstamped case calls gateRequest(null) itself.
 */
const NEUTRAL_ROUTE = "GET /";

export async function headers(): Promise<Headers> {
  if (requestHeaders.has("x-edulink-route")) return requestHeaders;
  const stamped = new Headers(requestHeaders);
  stamped.set("x-edulink-route", NEUTRAL_ROUTE);
  return stamped;
}

export async function cookies() {
  return {
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => void jar.set(name, value),
    delete: (name: string) => void jar.delete(name),
  };
}
