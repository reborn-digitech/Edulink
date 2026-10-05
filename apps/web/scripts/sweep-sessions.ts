/**
 * THE API SWEEP'S SESSIONS (A3-S-15, 5 Oct 2026, risks batch). They were minted
 * for 24 hours (W-13) so a two-to-four-hour run never outlived them, and they
 * were deleted only by the run's own `finally` — so a run stopped with Ctrl-C,
 * or killed with its terminal, left some twenty live bearer tokens for a day,
 * and `--clean-since` deleted only the expired ones. Now a session lives two
 * hours and the run renews its own every twenty minutes while it is alive, so
 * a long run keeps them and a dead run's lapse within two hours; and a signal
 * deletes them before the process goes.
 */
export const SWEEP_SESSION_MS = 2 * 3_600_000;
export const SWEEP_RENEW_EVERY_MS = 20 * 60_000;

/** When a session minted (or renewed) now lapses. */
export const sweepSessionExpiry = (now: number = Date.now()): Date => new Date(now + SWEEP_SESSION_MS);

/** Renews the run's sessions on a timer that never keeps the process alive; returns the stop. */
export function keepSessionsAlive(renew: () => Promise<unknown>, every: number = SWEEP_RENEW_EVERY_MS): () => void {
  const timer = setInterval(() => void renew().catch(() => undefined), every);
  timer.unref?.();
  return () => clearInterval(timer);
}

type SignalTarget = { once(signal: "SIGINT" | "SIGTERM" | "SIGHUP", listener: () => void): unknown; exit(code?: number): never | void };

/** On Ctrl-C, a kill or a closed terminal: delete the run's sessions, once, then exit 130. */
export function purgeSessionsOnSignal(purge: () => Promise<unknown>, proc: SignalTarget = process): void {
  let started = false;
  const go = () => {
    if (started) return;
    started = true;
    void purge()
      .catch(() => undefined)
      .finally(() => proc.exit(130));
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) proc.once(signal, go);
}
