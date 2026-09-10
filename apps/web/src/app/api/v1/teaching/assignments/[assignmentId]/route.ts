import { teachingGradebookSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { teachingGradebook } from "@/lib/api-reads/teaching";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/teaching/assignments/{assignmentId} — the gradebook: the roll,
 * each pupil's mark and comment, and the work they handed in. Another school's
 * assignment, or another teacher's class, is a 404 as on the page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { assignmentId } = await params;
    return ok(teachingGradebookSchema.parse(await teachingGradebook(ctx, assignmentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/assignments/[assignmentId]");
  }
}
