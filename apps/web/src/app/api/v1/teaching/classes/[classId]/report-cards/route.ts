import { teachingReportCardsQuerySchema, teachingReportCardsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { teachingReportCards } from "@/lib/api-reads/teaching";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/teaching/classes/{classId}/report-cards?title= — the builder:
 * the class's scheduled papers with how many are marked, the terms, the titles
 * built so far and the cards under the chosen one. PRINCIPAL is at the door
 * because a school may make the head a class's LEAD; `assertMayWriteCards`
 * decides, and anybody it refuses gets the page's 404.
 */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = teachingReportCardsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(teachingReportCardsSchema.parse(await teachingReportCards(ctx, classId, parsed.data.title)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/classes/[classId]/report-cards");
  }
}
