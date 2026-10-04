import { placementStudentsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { listPlacementStudents } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/placement/students — The roll with each student's record and season choices. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(placementStudentsSchema.parse(await listPlacementStudents(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/students");
  }
}
