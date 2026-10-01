import { operatorMetricsSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { snapshot } from "@/lib/metrics";
import { jobStatuses } from "@/lib/jobs";

/** GET /api/v1/operator/metrics — this process's counters: requests by group and status, p50/p95, errors by kind, outbox replays, overdue jobs. */
export async function GET() {
  try {
    await requireApiOperator();
    const jobs = await jobStatuses();
    return ok(operatorMetricsSchema.parse({ ...snapshot(), jobsOverdue: jobs.filter((j) => j.overdue).length }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/metrics");
  }
}
