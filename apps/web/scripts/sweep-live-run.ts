/**
 * THE GENERATION RUN IN HAND IS NEVER THE SWEEP'S TO TOUCH (1 Nov 2026, the coordinator's finding: the live run
 * cmvvm1lqb00000rlok8uihvcu was stopped at 07:48:59 IST by a zz.operator session through deskStopJob). The API sweep
 * samples the run's doors on ids nothing holds and every role token it sends is refused 403 there (access "app-admin"),
 * so it could not have been the sweep; but the rule is now the sweep's own, not the samples': a door under
 * /appadmin/quiz-jobs/ is never called with a live run's id, and while a run is active the doors that start or stop a
 * run or a model server are not called at all, each skip printed with its reason. Pure, so tests/sweep-live-run.test.ts
 * holds it.
 */

/** The doors that act on "the run in hand" or a model server: starting one, stopping one. */
export const RUN_ACTING_DOORS: readonly string[] = [
  "POST /api/v1/appadmin/quiz-jobs",
  "POST /api/v1/appadmin/quiz-jobs/{jobId}/stop",
  "POST /api/v1/appadmin/quiz-jobs/servers/{server}/start",
  "POST /api/v1/appadmin/quiz-jobs/servers/{server}/stop",
];

/** A run that is live: queued, running or stopping, or still marked active. */
export const isLiveRun = (row: { state: string; active: boolean | null }): boolean => row.active === true || ["QUEUED", "RUNNING", "STOPPING"].includes(row.state);

/**
 * Why the sweep must not send this call, or null to send it: a path under /quiz-jobs/ naming a live run's id, or (while
 * any run is live) a door that starts or stops a run or a model server.
 */
export function liveRunSkip(door: { method: string; path: string }, samplePath: string, liveIds: readonly string[]): string | null {
  if (!door.path.includes("/quiz-jobs")) return null;
  const hit = liveIds.find((id) => samplePath.includes(id));
  if (hit) return `its sample names the live generation run ${hit}`;
  if (liveIds.length > 0 && RUN_ACTING_DOORS.includes(`${door.method} ${door.path}`)) return `a generation run is active (${liveIds.join(", ")}): the doors that start or stop a run or a model server are not called`;
  return null;
}
