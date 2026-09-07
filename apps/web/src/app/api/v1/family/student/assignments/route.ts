import { familyStudentAssignmentsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { studentAssignments } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/student/assignments — to do, handed in, marked: the pupil's three tabs from one rule. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(familyStudentAssignmentsSchema.parse(await studentAssignments(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/assignments");
  }
}
