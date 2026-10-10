import { quizReviewNextSchema, quizReviewQuerySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { nextItem } from "@/lib/quiz-review";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/quiz-review/next?…&skip=id,id — the first waiting item in the queue's order, or none. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = quizReviewQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(quizReviewNextSchema.parse(await nextItem(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/quiz-review/next");
  }
}
