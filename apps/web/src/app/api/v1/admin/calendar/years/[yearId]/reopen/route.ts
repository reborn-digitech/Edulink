import { academicYearReopenedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { reopenAcademicYear } from "@/lib/academic-year";
import { apiFailure, ok } from "@/lib/api-v1";
import { underRules } from "@/lib/api-rule-failure";

/**
 * POST /api/v1/admin/calendar/years/{yearId}/reopen — undo a close (the web's
 * reopenYear, R-50): the year is the running one again and the exam series the
 * close archived come back. The office and the head, as on the web. Only the
 * latest closed year reopens (a 422 in words otherwise); a year that is not
 * closed, or of another school, is a 404. No body: the call is the act.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ yearId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { yearId } = await params;
    return await underRules("api/v1/admin/calendar/years/[yearId]/reopen", async () => ok(academicYearReopenedSchema.parse(await reopenAcademicYear(ctx, yearId))));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/calendar/years/[yearId]/reopen");
  }
}
