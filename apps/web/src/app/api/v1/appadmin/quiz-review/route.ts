import { quizReviewListSchema, quizReviewQuerySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { listQueue } from "@/lib/quiz-review";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/quiz-review?board=&grade=&subject=&topic=&level= — the queue by chapter and level, and the counts. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = quizReviewQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(quizReviewListSchema.parse(await listQueue(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review");
  }
}
