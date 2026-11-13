import { practiceRevisionAnswerBodySchema, practiceRevisionAnsweredSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { answerRevision } from "@/lib/practice-insights";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/practice/revision/answer — the web's `reviseAnswer`: the answer
 * goes through the chapter's own sitting (revisionAttempt opens or resumes
 * it), so revision moves the same ladder as practice. submitAnswer moves the
 * ladder only on a question's FIRST answer in a sitting, so a replay from the
 * outbox re-marks the same choice and climbs nothing; and a replay of the
 * answer that closed the sitting is answered with the stored verdict rather
 * than opening a new one (answerRevision, TA-374).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceRevisionAnswerBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { questionId, chosenIndex } = parsed.data;
    const language = parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale);
    const result = await answerRevision(ctx, questionId, chosenIndex, language);
    return ok(practiceRevisionAnsweredSchema.parse({ result }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/revision/answer");
  }
}
