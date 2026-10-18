import { viduraEvalReadSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { panelStopEval } from "@/lib/eval-jobs-desk";
import { ok } from "@/lib/api-v1";
import { evalFailure } from "../../../_shared";

/** POST /api/v1/operator/vidura/evals/{jobId}/stop — ask the run to stop after the case in hand (its scores so far are kept). Audited. */
export async function POST(_request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { jobId } = await params;
    return ok(viduraEvalReadSchema.parse({ job: await panelStopEval(ctx, jobId) }));
  } catch (error) {
    return evalFailure(error, "api/v1/operator/vidura/evals/[jobId]/stop");
  }
}
