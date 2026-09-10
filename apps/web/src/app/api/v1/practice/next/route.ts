import { practiceNextQuerySchema, practiceNextSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { nextQuestion, normaliseLanguage } from "@/lib/quiz";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { servedQuestion } from "../_shared";

/**
 * GET /api/v1/practice/next?attemptId= — the web's `advance`: the question to
 * answer now, never its answer; null when every question has been seen. The
 * attempt is re-scoped to this pupil inside nextQuestion, so another child's
 * attempt id is a 404, not their practice.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceNextQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const question = await nextQuestion(ctx, parsed.data.attemptId, parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale));
    return ok(practiceNextSchema.parse({ question: question ? servedQuestion(question) : null }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/next");
  }
}
