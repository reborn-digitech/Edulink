import { quizGenJobReadSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskJob } from "@/lib/quiz-jobs-desk";
import { ok } from "@/lib/api-v1";
import { jobFailure } from "../_shared";

/** GET /api/v1/appadmin/quiz-jobs/{jobId} — one run: its state, its live line, who started it. */
export async function GET(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { jobId } = await params;
    return ok(quizGenJobReadSchema.parse({ job: await deskJob(ctx, jobId) }));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs/[jobId]");
  }
}
