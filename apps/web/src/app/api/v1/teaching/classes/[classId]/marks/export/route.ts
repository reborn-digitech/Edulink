import { marksExportQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { marksExport, EXPORT_BUDGET } from "@/lib/marks-export";
import { exportResponse } from "@/lib/export-file";
import { apiFailure, apiInvalid, budget } from "@/lib/api-v1";

/**
 * GET /api/v1/teaching/classes/{classId}/marks/export?exam=&format=csv|xlsx —
 * one exam's marks for the class as a file: a row per pupil, a column per
 * paper with its maximum, the total, the percentage and the grade band.
 * Audited by the library; a teacher of the class, the head or the office.
 */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = marksExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const file = await marksExport(ctx, classId, parsed.data.exam);
    return exportResponse(request, file);
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/marks/export");
  }
}
