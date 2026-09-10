import { practiceLanguageQuerySchema, practiceRevisionSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { normaliseLanguage } from "@/lib/quiz";
import { revisionQueue } from "@/lib/practice-insights";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/practice/revision — the web's revision page: questions whose
 * latest answer was wrong, rested for two days, capped small so the queue is
 * one a child can finish. Fixed when read; the phone walks it once.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = practiceLanguageQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const items = await revisionQueue(ctx, { language: parsed.data.language ?? normaliseLanguage(ctx.user.prefs.locale) });
    return ok(practiceRevisionSchema.parse({ items }));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/revision");
  }
}
