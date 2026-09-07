import { adminReviewsQuerySchema, adminReviewsSchema, reviewRoundOpenBodySchema, reviewRoundOpenedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { openReviewRound } from "@/lib/reviews";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { adminReviews, apiRefused } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/reviews — the ratings dashboard and the review rounds, open by default. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = adminReviewsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminReviewsSchema.parse(await adminReviews(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/reviews");
  }
}

/** POST /api/v1/admin/reviews — open a round: which teachers, which audience, when it closes. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = reviewRoundOpenBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await openReviewRound(ctx, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(reviewRoundOpenedSchema.parse({ roundId: result.roundId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/reviews");
  }
}
