/**
 * What must stop when the person goes, however they go: the Sign out button,
 * or a session the server ended (expired, revoked from the web, the account
 * disabled), which the phone learns as a 401 from /api/v1/me. A module that
 * keeps something running on the person's behalf — the driver's trip
 * tracking (PH-3, campaign 2026-10-04) — registers here, so the session
 * need not import it, and the session runs every handler on either path.
 */
type Handler = () => Promise<void> | void;

const handlers = new Set<Handler>();

export function onSessionEnd(handler: Handler): () => void {
  handlers.add(handler);
  return () => handlers.delete(handler);
}

/** Every handler, each on its own: one that throws does not stop the rest. */
export async function runSessionEnd(): Promise<void> {
  for (const handler of [...handlers]) {
    try {
      await handler();
    } catch {
      // Best effort: the rest of the clean-up still runs.
    }
  }
}
