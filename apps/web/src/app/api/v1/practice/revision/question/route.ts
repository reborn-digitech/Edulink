import { practiceRevisionQuestionQuerySchema, practiceRevisionQuestionSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { reviseQuestion } from "@/lib/practice-insights";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/practice/revision/question?questionId= — the web's `reviseServe`:
 * one question from the pupil's own history, never its answer. A question
 * they have not answered before is a 404 — this is their queue, not a second
 * way to browse the bank.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceRevisionQuestionQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = await reviseQuestion(ctx, parsed.data.questionId, parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale));
    return ok(practiceRevisionQuestionSchema.parse(q));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/revision/question");
  }
}
