import { studentPlacementSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { studentPlacement } from "@/lib/placement-student";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/student/placement — The student's placement page. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    return ok(studentPlacementSchema.parse(await studentPlacement(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement");
  }
}
