import { practiceLanguageQuerySchema, practiceOnceListSchema, practiceOnceOpenBodySchema, practiceOnceSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { onceSets, openOnce } from "@/lib/practice-once";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { servedQuestion } from "../_shared";

/** GET /api/v1/practice/once — the pupil's assigned sets and where each one-time attempt stands (decision 0008). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceLanguageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const language = parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale);
    return ok(practiceOnceListSchema.parse({ sets: await onceSets(ctx, language) }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/once");
  }
}

/** POST /api/v1/practice/once — open a set once (the draw fixed at the first open), or read it back as it stands. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceOnceOpenBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const language = parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale);
    const view = await openOnce(ctx, parsed.data.assignmentId, language);
    return ok(practiceOnceSchema.parse({ onceId: view.onceId, set: view.set, question: view.question ? servedQuestion(view.question) : null }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/once");
  }
}
