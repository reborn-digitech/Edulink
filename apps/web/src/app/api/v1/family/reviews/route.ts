import { familyReviewSubmitSchema, familyReviewsSchema, okSchema } from "@edulink/contracts";
import { familyReviews, rateTeacher, requireApiReader } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { fieldFailure } from "../_shared";

/** GET /api/v1/family/reviews — every open questionnaire about a teacher who teaches them, or their child. */
export async function GET() {
  try {
    const ctx = await requireApiReader();
    return ok(familyReviewsSchema.parse(await familyReviews(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/reviews");
  }
}

/** POST /api/v1/family/reviews — answer, or amend while the round is open, one teacher's questionnaire. Replay-safe: the answer is upserted. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyReviewSubmitSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await rateTeacher(ctx, parsed.data);
    if (!result.ok) return fieldFailure(result.issues);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/reviews");
  }
}
