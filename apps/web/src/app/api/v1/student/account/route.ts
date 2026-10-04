import { studentAccountSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { studentAccount } from "@/lib/college-records";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/student/account — The student's own account: the guardian grants, two-step sign-in, the data export and the no-dues state. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    return ok(studentAccountSchema.parse(await studentAccount(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/student/account");
  }
}
