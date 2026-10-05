import { classTeacherRemoveBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { unassignTeacher } from "@/lib/cohort";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/classes/{classId}/teachers/remove — take one teacher off
 * a class (the web's dropTeacher, R-50); the class's unclaimed pupils' stand-in
 * guardian passes to whoever remains. Audited class.teacher.remove. The
 * office's alone. A POST with the teacher in the body, not a DELETE on a path:
 * a body-less call must never be the act. One not on the class is a 422; a
 * class of another school is a 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = classTeacherRemoveBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await unassignTeacher(ctx, classId, parsed.data.teacherMembershipId);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/teachers/remove");
  }
}
