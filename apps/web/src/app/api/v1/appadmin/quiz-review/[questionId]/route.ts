import { quizReviewNextSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { getItem } from "@/lib/quiz-review";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/quiz-review/{questionId} — one generated item, waiting or not, with what was done to it. */
export async function GET(_request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    return ok(quizReviewNextSchema.parse({ item: await getItem(ctx, questionId), remaining: 0 }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]");
  }
}
