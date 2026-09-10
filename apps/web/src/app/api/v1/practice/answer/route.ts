import { practiceAnswerBodySchema, practiceAnsweredSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage, submitAnswerIdempotent } from "@/lib/quiz";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/practice/answer — the phone's twin of the web's offline answer
 * endpoint (/api/practice/answer): the target of the outbox, so it must be
 * safe to deliver twice. submitAnswerIdempotent is the guarantee — a second
 * delivery for the same (attempt, question) returns the verdict already
 * stored, `replayed: true`, and moves nothing. The body's clientId names the
 * tap for the outbox; the guard does not need it.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceAnswerBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { attemptId, questionId, chosenIndex, language } = parsed.data;
    const outcome = await submitAnswerIdempotent(ctx, attemptId, questionId, chosenIndex, language ?? normaliseLanguage(ctx.user.prefs.locale));
    return ok(practiceAnsweredSchema.parse(outcome));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/answer");
  }
}
