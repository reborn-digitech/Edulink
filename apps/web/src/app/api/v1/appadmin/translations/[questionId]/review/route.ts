import { translationReviewBodySchema, translationReviewedSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { reviewTranslation } from "@/lib/translation-review";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "../../../../shared/helpers";

/** POST /api/v1/appadmin/translations/{questionId}/review — a corrected text and the stamp, or the stamp alone, or the stamp taken off. */
export async function POST(request: Request, { params }: { params: Promise<{ questionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { questionId } = await params;
    const parsed = translationReviewBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await reviewTranslation(ctx, questionId, parsed.data);
    if (!result.ok) return refused(result.errorKey);
    return ok(translationReviewedSchema.parse({ ok: true, reviewed: result.reviewed }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/translations/[questionId]/review");
  }
}
