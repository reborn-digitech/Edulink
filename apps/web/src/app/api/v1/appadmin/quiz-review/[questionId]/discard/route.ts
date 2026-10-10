import { quizReviewDiscardBodySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { discardItem } from "@/lib/quiz-review";
import { apiFailure, apiInvalid, readJson } from "@/lib/api-v1";
import { answer } from "../../_shared";

/** POST /api/v1/appadmin/quiz-review/{questionId}/discard — thrown away with a coded reason; again is a no-op. */
export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    const parsed = quizReviewDiscardBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await answer(await discardItem(ctx, questionId, parsed.data.reason));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]/discard");
  }
}
