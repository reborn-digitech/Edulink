import { quizReviewTranslationBodySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { stampTranslation } from "@/lib/quiz-review";
import { apiFailure, apiInvalid, readJson } from "@/lib/api-v1";
import { answer } from "../../_shared";

/** POST /api/v1/appadmin/quiz-review/{questionId}/stamp-translation — the Hindi or the Marathi row read (or the stamp taken off). */
export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    const parsed = quizReviewTranslationBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await answer(await stampTranslation(ctx, questionId, parsed.data.language, parsed.data.stamped ?? true));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/[questionId]/stamp-translation");
  }
}
