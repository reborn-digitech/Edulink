import { scholarshipSchemesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { schemesView } from "@/lib/scholarships";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/college/scholarships/schemes — The schemes with their categories, income ceilings and shares, and the sheet they come from. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL", "STUDENT");
    return ok(scholarshipSchemesSchema.parse(await schemesView(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/college/scholarships/schemes");
  }
}
