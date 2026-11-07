import { practiceOnceAnswerBodySchema, practiceOnceAnsweredSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { answerOnce } from "@/lib/practice-once";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { servedQuestion } from "../../_shared";

/** POST /api/v1/practice/once/answer — one answer of a one-time set, replay-safe on (set, question) (decision 0008). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceOnceAnswerBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const language = parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale);
    const r = await answerOnce(ctx, parsed.data.onceId, parsed.data.questionId, parsed.data.chosenIndex, language);
    return ok(practiceOnceAnsweredSchema.parse({ replayed: r.replayed, correct: r.correct, answerIndex: r.answerIndex, solution: r.solution, set: r.set, question: r.question ? servedQuestion(r.question) : null }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/once/answer");
  }
}
