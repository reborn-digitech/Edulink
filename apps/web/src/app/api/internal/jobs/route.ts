import { NextResponse } from "next/server";
import { JOBS } from "@/lib/jobs";
import { jobSchedulerRunning, startJobScheduler } from "@/lib/job-scheduler";
import { db } from "@/lib/db";
import { ownerRoleProblem, readRoleFlags } from "@/lib/db-role-check";

/**
 * POST /api/internal/jobs — start the in-process schedule.
 *
 * Only the jobs runner answers: a process without JOBS_RUNNER=1 says 404,
 * the same as a route that does not exist, so the web machines expose
 * nothing. The runner listens on loopback (fly.toml, env.ts refuses
 * otherwise when deployed), so the only caller is scripts/jobs-runner.mjs
 * in the same container, and a retried kick is idempotent. See
 * src/lib/job-scheduler.ts for why this is a request rather than a boot hook.
 */
export async function POST() {
  if (process.env.JOBS_RUNNER !== "1") return new NextResponse(null, { status: 404 });
  // TA-243: the jobs run on the owner's connection and read every school's rows only while that role passes row
  // security. One that does not would run every job over zero rows and say nothing, so the schedule is not started
  // and the runner, answered 500, exits for the platform to restart and someone to read why.
  const problem = ownerRoleProblem(await readRoleFlags(db));
  if (problem) {
    console.error(JSON.stringify({ level: "error", at: new Date().toISOString(), scheduler: "refused", error: problem }));
    return NextResponse.json({ started: false, error: problem }, { status: 500 });
  }
  const already = jobSchedulerRunning();
  const handle = startJobScheduler();
  return NextResponse.json({
    started: handle !== null,
    already,
    tz: process.env.TZ ?? "system",
    jobs: Object.values(JOBS).map((j) => ({ name: j.name, schedule: j.schedule })),
  });
}
