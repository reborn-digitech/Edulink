import { alumniCollegeAdminSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { alumniCollegeAdmin } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/admin/alumni/college — The office's side of the college's alumni. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "TPO");
    return ok(alumniCollegeAdminSchema.parse(await alumniCollegeAdmin(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/alumni/college");
  }
}
