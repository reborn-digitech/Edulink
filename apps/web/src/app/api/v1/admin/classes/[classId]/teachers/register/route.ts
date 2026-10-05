import { attendanceRightBodySchema, okSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { setAttendanceRight } from "@/lib/register-duty";
import { db } from "@/lib/db";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/admin/classes/{classId}/teachers/register — give a teacher on
 * the class the right to mark its register, or take it away (the web's
 * toggleAttendanceRight, R-50); audited class.attendance.grant or .revoke.
 * The office's alone. The library names the class-teacher row, which no read
 * publishes, so the door finds it by the class and the teacher, both fenced
 * to the session's school: a class of another school is a 404, a teacher not
 * on the class a 422.
 */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = attendanceRightBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const klass = await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!klass) throw new AccessError("access.thatClassIsNotInThisSchool", "NOT_FOUND");
    const row = await db.classTeacher.findFirst({ where: { classId: klass.id, schoolId: ctx.schoolId, teacherMembershipId: parsed.data.teacherMembershipId }, select: { id: true } });
    if (!row) return apiRefused({ errorKey: "refusal.teacherNotOnClass" });
    const result = await setAttendanceRight(ctx, row.id, parsed.data.canTake);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/teachers/register");
  }
}
