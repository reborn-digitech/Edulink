import { classTeacherAddBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assignTeacher } from "@/lib/cohort";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/classes/{classId}/teachers — put a teacher on a class as
 * its lead, a co-teacher or a subject teacher, or change which (the web's
 * addTeacher, R-50). The library the class page calls: a lead marks the
 * register unless told otherwise, a co-teacher does not, a subject teacher
 * never; audited class.teacher.assign. The office's alone. A class of another
 * school is a 404; anyone who is not teaching staff here is a 422.
 * (POST /admin/classes/{classId}/teacher, singular, is the class list's
 * lead-teacher switch and stays as it was.)
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = classTeacherAddBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await assignTeacher(ctx, classId, parsed.data.teacherMembershipId, { role: parsed.data.role });
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/teachers");
  }
}
