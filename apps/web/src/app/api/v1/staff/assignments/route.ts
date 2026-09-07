import { assignmentCreatedSchema, assignmentsQuerySchema, newAssignmentSchema, staffAssignmentsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffAssignments } from "@/lib/api-reads/staff";
import { createAssignment } from "@/lib/grading";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/staff/assignments?state=&classId=&years=all — the assignments list, this academic year's by default. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = assignmentsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffAssignmentsSchema.parse(await staffAssignments(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/assignments");
  }
}

/**
 * POST /api/v1/staff/assignments — a new piece of work, without handouts
 * (those are stored through the upload route and attached on the web). The
 * class must be one this person may write to; a draft is created with
 * `publish: false` and published later.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    const parsed = newAssignmentSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createAssignment(
      { schoolId: ctx.schoolId, membershipId: ctx.membershipId, role: ctx.role, userId: ctx.user.id },
      parsed.data,
    );
    return ok(assignmentCreatedSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/assignments");
  }
}
