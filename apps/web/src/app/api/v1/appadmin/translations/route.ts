import { translationsQuerySchema, translationsSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { listTranslationReview } from "@/lib/translation-review";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/translations?language=hi|mr&status=&page=&topic= — the native-review list, the web's /appadmin/translations. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = translationsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const list = await listTranslationReview(ctx, { language: parsed.data.language, status: parsed.data.status, page: parsed.data.page, topicId: parsed.data.topic });
    return ok(
      translationsSchema.parse({
        ...list,
        items: list.items.map((item) => ({ ...item, reviewedAt: item.reviewedAt?.toISOString() ?? null })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/translations");
  }
}
