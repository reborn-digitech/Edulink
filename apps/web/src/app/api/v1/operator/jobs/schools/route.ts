import { operatorJobsBySchoolSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { crossSchoolJobHealth } from "@/lib/job-health";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/operator/jobs/schools — the web's /root/jobs/schools on a phone
 * (A3-inventory-14, audit of 5 October 2026): what each scheduled job's latest
 * successful run did for each school, the schools needing attention first, the
 * count of live schools no job had work for, and each job's last run. The
 * operator alone; the same reader as the page (job-health.ts), so the two
 * cannot disagree.
 */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    const view = await crossSchoolJobHealth(ctx);
    return ok(
      operatorJobsBySchoolSchema.parse({
        schools: view.schools.map((s) => ({ ...s, removedAt: s.removedAt?.toISOString() ?? null, jobs: s.jobs.map((j) => ({ ...j, at: j.at.toISOString() })) })),
        quiet: view.quiet,
        runs: view.runs.map((r) => ({ job: r.job, at: r.at?.toISOString() ?? null })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/operator/jobs/schools");
  }
}
