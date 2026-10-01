import { gradebookExportQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { gradebookExport, EXPORT_BUDGET } from "@/lib/marks-export";
import { exportResponse } from "@/lib/export-file";
import { apiFailure, apiInvalid, budget } from "@/lib/api-v1";

/**
 * GET /api/v1/teaching/classes/{classId}/gradebook/export?format=csv|xlsx —
 * the class's gradebook as a file: a row per pupil, two columns per
 * assignment (the marks, and whether the work came in, late, or not at all).
 * Audited by the library; a teacher of the class, the head or the office.
 */
export async function GET(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { classId } = await params;
    const parsed = gradebookExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`export:${ctx.user.id}`, EXPORT_BUDGET.limit, EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const file = await gradebookExport(ctx, classId);
    return exportResponse(request, file);
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/gradebook/export");
  }
}
