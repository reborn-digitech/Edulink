import { NextResponse } from "next/server";
import { jobStatuses } from "@/lib/jobs";

/**
 * What an outside monitor asks about the scheduled jobs (TA-522).
 *
 * /api/health says whether the web process and the database answer; it cannot
 * say whether the jobs runner is alive, and the two alarms that would (jobs:watch
 * and health:digest) are jobs of that same runner, so a stopped runner used to
 * stop its own alarms with it. This answers 200 while every job's last success
 * is within what the job expects (`expectEveryMs`, the rule /root/jobs reads),
 * and 503 when any is not, naming the late jobs and how long ago each last
 * succeeded (null for never) — nothing else: no school, no count, no host.
 *
 * Signed-out on purpose, like /api/health, so the monitor needs no credentials.
 * Point the outside monitor at it beside /api/health (go-live.md).
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  let statuses: Awaited<ReturnType<typeof jobStatuses>>;
  try {
    statuses = await jobStatuses(new Date(now));
  } catch {
    // The runs cannot be read (the database is down): the monitor is told the jobs are not known to be well.
    return NextResponse.json({ ok: false, overdue: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  const overdue = statuses
    .filter((s) => s.overdue)
    .map((s) => ({ job: s.name, lastSuccessAgeSeconds: s.lastSuccessAt ? Math.round((now - s.lastSuccessAt.getTime()) / 1000) : null }));
  return NextResponse.json({ ok: overdue.length === 0, overdue }, { status: overdue.length === 0 ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
