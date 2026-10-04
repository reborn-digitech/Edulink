import { studentNoDuesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myNoDues } from "@/lib/no-dues";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/student/no-dues — The student's own clearances, every event. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    return ok(studentNoDuesSchema.parse(await myNoDues(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/student/no-dues");
  }
}
