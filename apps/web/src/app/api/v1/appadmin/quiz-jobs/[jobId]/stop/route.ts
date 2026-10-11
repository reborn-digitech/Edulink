import { quizGenJobReadSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { deskStopJob } from "@/lib/quiz-jobs-desk";
import { ok } from "@/lib/api-v1";
import { jobFailure } from "../../_shared";

/** POST /api/v1/appadmin/quiz-jobs/{jobId}/stop — the runner finishes the item in hand and halts; an ended run is left as it is. */
export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { jobId } = await params;
    return ok(quizGenJobReadSchema.parse({ job: await deskStopJob(ctx, jobId) }));
  } catch (error) {
    return jobFailure(error, "api/v1/appadmin/quiz-jobs/[jobId]/stop");
  }
}
