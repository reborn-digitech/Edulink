/**
 * A sweep's own window: every write a run makes to the ZZ fixture schools is
 * taken away at its end by `sweepAway(startedAt)` (scripts/api-sweep.ts).
 * The main sweep always did; the cross probes (`--cross=school`,
 * `--cross=person`) write too — an applicant's application, a guardian's
 * decision on a PEN change — and did not (STREAMS-8, 5 Oct 2026). Both now
 * run through here, and the clean-up runs even when the run throws, so a
 * probe stopped half-way leaves nothing behind either.
 */
export async function inOwnWindow<T>(run: () => Promise<T>, sweepAway: (startedAt: Date) => Promise<void>, now: () => Date = () => new Date()): Promise<T> {
  const startedAt = now();
  try {
    return await run();
  } finally {
    await sweepAway(startedAt);
  }
}
