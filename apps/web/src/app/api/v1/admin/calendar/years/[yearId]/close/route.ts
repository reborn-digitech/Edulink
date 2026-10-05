import { academicYearCloseBodySchema, academicYearClosedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { closeAcademicYear } from "@/lib/academic-year";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/**
 * POST /api/v1/admin/calendar/years/{yearId}/close — close the running year
 * into one already made (the web's rollOverAcademicYear). The next year must
 * exist first, on purpose: closing archives every child's badges and empties
 * the board, and somebody should have typed next year's dates and looked at
 * them before that. A second press is a no-op said in zeros; a year of
 * another school is a 404; closing a year that is not running, or moving into
 * a closed one, is a 422 in words. The undo (reopening) stays on the web.
 */
export async function POST(request: Request, { params }: { params: Promise<{ yearId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { yearId } = await params;
    const parsed = academicYearCloseBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return await underRules("api/v1/admin/calendar/years/[yearId]/close", async () => ok(academicYearClosedSchema.parse(await closeAcademicYear(ctx, yearId, parsed.data.nextYearId))));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/years/[yearId]/close");
  }
}
