/**
 * ONE CALL THE BUSY SERVER DROPPED IS NOT THE SERVER GONE (1 Nov 2026, the coordinator's ask after two API sweep runs
 * aborted hours in, at "POST /api/v1/marks" and at ".../placement/requirements/{requirementId}/accept", while
 * /api/health answered 200 right after). A call that comes back with no answer — a dropped socket or the call's own
 * timeout, status 0 — is now followed by a patient look at /api/health: if it answers, the run pauses a moment and
 * sends that one call once more, and counts the retry; if health does not answer, or the retried call is dropped
 * again, the run ends as before (ServerGone in scripts/api-sweep.ts, exit code 2). The rule is here, apart from the
 * sweep's network code, so tests/sweep-retry.test.ts can hold it.
 */

/** How long the run waits before sending a dropped call again, and how long it gives the retried call and each look at /api/health. */
export const RETRY_PAUSE_MS = 2_000;
export const RETRY_TIMEOUT_MS = 20_000;
// A stalled dev server (a garbage collection on a heap grown past 40 GB: the counted run of 1 Nov 2026 ended on a
// 21-second silence with the server answering in half a second straight after) is given about a minute and a quarter.
export const HEALTH_TIMEOUT_MS = 15_000;
export const HEALTH_TRIES = 4;
export const HEALTH_GAP_MS = 5_000;

/** Whether an answer is no answer: the socket dropped or the call ran past its timer. */
export const dropped = (answer: { status: number }): boolean => answer.status === 0;

export type RetryOutcome<T> = { answer: T; retried: boolean } | { gone: "health" | "retry" };

/**
 * After a call: its answer as it is when it was answered; when it was dropped, the retry's answer if /api/health
 * answers (and the retry is answered), else why the server is to be taken for gone — health did not answer, or the
 * retry was dropped too.
 */
export async function retryOnceIfHealthy<T extends { status: number }>(
  first: T,
  deps: { healthy: () => Promise<boolean>; pause: () => Promise<void>; again: () => Promise<T> },
): Promise<RetryOutcome<T>> {
  if (!dropped(first)) return { answer: first, retried: false };
  if (!(await deps.healthy())) return { gone: "health" };
  await deps.pause();
  const second = await deps.again();
  if (dropped(second)) return { gone: "retry" };
  return { answer: second, retried: true };
}

/** Whether /api/health answers 200 within `tries` looks of `timeoutMs` each, `gapMs` apart (a busy server is slow, not gone). */
export async function healthAnswers(base: string, tries: number = HEALTH_TRIES, timeoutMs: number = HEALTH_TIMEOUT_MS, fetchImpl: typeof fetch = fetch, gapMs: number = HEALTH_GAP_MS): Promise<boolean> {
  for (let i = 0; i < tries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(base + "/api/health", { signal: controller.signal });
      if (res.status === 200) return true;
    } catch {
      /* no answer this time */
    } finally {
      clearTimeout(timer);
    }
    if (i < tries - 1) await new Promise((resolve) => setTimeout(resolve, gapMs));
  }
  return false;
}
