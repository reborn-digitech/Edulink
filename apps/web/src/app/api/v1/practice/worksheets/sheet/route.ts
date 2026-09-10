import { practiceWorksheetQuerySchema, practiceWorksheetSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { buildWorksheet } from "@/lib/worksheets";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/practice/worksheets/sheet?slug=&level=&count=&seed= — the web's
 * print page as data: buildWorksheet, deterministic by seed, so the phone's
 * preview and the printed paper are the same questions in the same order. A
 * chapter with nothing at that rung is a 404 with the lib's sentence.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = practiceWorksheetQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(practiceWorksheetSchema.parse(await buildWorksheet(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/practice/worksheets/sheet");
  }
}
