import { classTeacherBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole, AccessError } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { setClassTeacher } from "@/app/(app)/admin/classes/actions";

/** POST /api/v1/admin/classes/{classId}/teacher — put a teacher in charge of a class, or take them off it. Both ids are re-checked against the school. */
export async function POST(request: Request, { params }: { params: Promise<{ classId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { classId } = await params;
    const parsed = classTeacherBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const klass = await db.class.findFirst({ where: { id: classId, schoolId: ctx.schoolId }, select: { id: true } });
    if (!klass) throw new AccessError("access.classNotFoundInYourSchool", "NOT_FOUND");
    const result = await setClassTeacher(klass.id, parsed.data.teacherMembershipId, parsed.data.assigned);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/classes/[classId]/teacher");
  }
}
