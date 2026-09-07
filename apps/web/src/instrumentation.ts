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
