import { practiceRevealBodySchema, practiceRevealedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage, revealSolution } from "@/lib/quiz";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/practice/reveal — the web's `reveal`: the working before an
 * answer, which sets the sitting's badge gate for good. The screen says what
 * it costs before calling this, as the web does.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceRevealBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { attemptId, questionId, language } = parsed.data;
    const revealed = await revealSolution(ctx, attemptId, questionId, language ?? normaliseLanguage(ctx.user.prefs.locale));
    return ok(practiceRevealedSchema.parse(revealed));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/reveal");
  }
}
