import { recordError, reportError, scrubErrorMessage } from "./lib/metrics";

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
 * The same line is counted in src/lib/metrics.ts (a "render" error) and,
 * when SENTRY_DSN is set, posted to the error tracker by the same module
 * — which imports nothing from node:* at module scope, because this file
 * is compiled for the edge runtime too (see the memory note).
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
    // TA-443: scrubbed as the error tracker's copy is, so the log holds no address or long number a message quoted.
    message: scrubErrorMessage(error),
  };
  // console.error, not process.stderr: this file also loads in the edge
  // runtime, which has no `process` streams, and the line lands on stderr
  // either way.
  console.error(JSON.stringify(line));
  recordError("render");
  if (process.env.SENTRY_DSN) {
    await reportError(error, { where: context.routePath || request.path, kind: "render", method: request.method });
  }
}
