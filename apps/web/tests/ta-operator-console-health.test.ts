/**
 * TA-522 (testing analysis of 13 November 2026, operator-console batch): nothing outside the jobs process noticed that
 * it had stopped. /api/health checks the database only, and jobs:watch and health:digest are jobs of the same
 * scheduler, so a stopped runner raised no alarm. Now a signed-out probe, GET /api/health/jobs, answers 503 when any
 * job's last success is older than the job expects, with the job names and ages only (no school, no count, no host),
 * for the outside monitor beside /api/health.
 *
 * The statuses are this file's own (jobStatuses is mocked), so nothing here reads the server's real runs.
 */
import { describe, expect, it, vi } from "vitest";
import type { JobStatus } from "@/lib/jobs";

let statuses: JobStatus[] = [];

vi.mock("@/lib/jobs", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/jobs")>();
  return { ...real, jobStatuses: async () => statuses };
});

function status(name: JobStatus["name"], over: Partial<JobStatus>): JobStatus {
  return { name, schedule: "* * * * *", describeKey: "root.jobDescRetention" as JobStatus["describeKey"], lastRun: null, lastSuccessAt: null, overdue: false, lastFailed: false, running: false, ...over };
}

describe("TA-522: the jobs' health has a probe of its own", () => {
  it("TA-522: every job on time answers 200", async () => {
    const { GET } = await import("@/app/api/health/jobs/route");
    statuses = [status("notifications:tidy", { lastSuccessAt: new Date(Date.now() - 60_000) })];
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, overdue: [] });
  });

  it("TA-522: retention:sweep's last success thirty hours ago answers 503 with the job's name and age only", async () => {
    const { GET } = await import("@/app/api/health/jobs/route");
    statuses = [
      status("notifications:tidy", { lastSuccessAt: new Date(Date.now() - 60_000) }),
      status("retention:sweep", { overdue: true, lastSuccessAt: new Date(Date.now() - 30 * 3_600_000) }),
      status("digest:weekly", { overdue: true, lastSuccessAt: null }),
    ];
    const res = await GET();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { ok: boolean; overdue: { job: string; lastSuccessAgeSeconds: number | null }[] };
    expect(body.ok).toBe(false);
    expect(body.overdue.map((o) => o.job)).toEqual(["retention:sweep", "digest:weekly"]);
    expect(Math.round(body.overdue[0]!.lastSuccessAgeSeconds! / 3600)).toBe(30);
    expect(body.overdue[1]!.lastSuccessAgeSeconds).toBeNull();
    expect(Object.keys(body.overdue[0]!).sort()).toEqual(["job", "lastSuccessAgeSeconds"]);
  });
});
