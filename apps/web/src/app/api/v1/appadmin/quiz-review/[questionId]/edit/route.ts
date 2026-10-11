import { quizReviewEditBodySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { editItem } from "@/lib/quiz-review";
import { apiFailure, apiInvalid, readJson } from "@/lib/api-v1";
import { answer } from "../../_shared";

/** POST /api/v1/appadmin/quiz-review/{questionId}/edit — the item corrected in English and, when sent, Hindi and Marathi; served as edited; audited. */
export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    const parsed = quizReviewEditBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await answer(await editItem(ctx, questionId, parsed.data));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]/edit");
  }
}
