import { publishAssignmentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { publishAssignment } from "@/lib/grading";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/assignments/publish — publish a draft to its class. Already published is refused, as the form's action is. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = publishAssignmentSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await publishAssignment(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      parsed.data.assignmentId,
    );
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/staff/assignments/publish");
  }
}
