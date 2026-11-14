import { quizConfirmTranslationBodySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { confirmTranslation } from "@/lib/quiz-review";
import { apiFailure, apiInvalid, readJson } from "@/lib/api-v1";
import { answer } from "../../_shared";

/**
 * POST /api/v1/appadmin/quiz-review/{questionId}/confirm-translation — a Hindi or Marathi row marked out of date
 * confirmed still right against the English (the owner's follow-up to TA-199, 14 November 2026): served again, the
 * confirmer recorded; refused 422 when the English since reordered the options or moved the answer; again is a no-op.
 */
export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    const parsed = quizConfirmTranslationBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await answer(await confirmTranslation(ctx, questionId, parsed.data.language));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]/confirm-translation");
  }
}
