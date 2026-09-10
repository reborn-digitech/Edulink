import { teachingGradesBodySchema, teachingGradesSavedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveGrades } from "@/lib/grading";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/teaching/assignments/{assignmentId}/grades — the web's
 * submitGrades. A batch of current marks, so the phone's outbox may replay it:
 * the second delivery leaves the same marks and `saveGrades` notifies a family
 * on a first grade only. A finished year's marks stay locked for a teacher.
 */
export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const { assignmentId } = await params;
    const parsed = teachingGradesBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await saveGrades(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      assignmentId,
      parsed.data.grades,
    );
    return ok(teachingGradesSavedSchema.parse({ saved: result.saved, cleared: result.cleared, rejected: result.rejected.length }));
  } catch (error) {
    return apiFailure(error, "api/v1/teaching/assignments/[assignmentId]/grades");
  }
}
