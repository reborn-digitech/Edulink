import { practiceWorksheetTopicsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { MAX_LEVEL, TIER_NAMES } from "@/lib/quiz";
import { MAX_QUESTIONS, worksheetTopics } from "@/lib/worksheets";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/practice/worksheets — the web's worksheet form as data: every
 * chapter on offer (worksheetTopics, grouped by grade), the six rungs with
 * their names, and the most questions one paper may hold. Teachers only, as
 * the page is.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER");
    const topics = await worksheetTopics(ctx);
    return ok(
      practiceWorksheetTopicsSchema.parse({
        topics,
        levels: Array.from({ length: MAX_LEVEL }, (_, i) => ({ level: i + 1, tierName: TIER_NAMES[i]! })),
        maxQuestions: MAX_QUESTIONS,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/practice/worksheets");
  }
}
