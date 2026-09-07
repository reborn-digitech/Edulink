/**
 * Runs once when the server starts, before any request is served.
 *
 * Its whole job is to turn a silent misconfiguration into a loud one. See
 * src/lib/env.ts for why: an empty VAPID key made every push notification a
 * no-op while every test still passed.
 */
export async function register() {
  // Guard the runtime: this file also loads in the edge runtime, where the
  // node-only modules env.ts pulls in are unavailable.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { assertEnv } = await import("./lib/env");
  assertEnv();
}

/**
 * Every request error, one JSON line on stderr — the structured log the host
 * ships to wherever logs go, and the seam an error tracker plugs into. It
 * carries what an on-call person needs to find the failure (route, method,
 * the digest Next shows the person on the error page, the commit) and
 * nothing that identifies a person: no cookie, no body, no query string.
 * A Sentry DSN, once there is one, is called from here and nowhere else.
 */
export async function onRequestError(
  error: unknown,
  request: { path: string; method: string; headers: Record<string, string | string[] | undefined> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource?: string },
) {
  const err = error as { message?: string; digest?: string; name?: string };
  const line = {
    level: "error",
    at: new Date().toISOString(),
    commit: process.env.APP_COMMIT ?? null,
    method: request.method,
    // The pattern, not the concrete path: /people/[membershipId], never the id.
    route: context.routePath,
    kind: context.routerKind,
    type: context.routeType,
    digest: err.digest ?? null,
    name: err.name ?? "Error",
    message: err.message ?? String(error),
  };
  process.stderr.write(JSON.stringify(line) + "\n");
}
