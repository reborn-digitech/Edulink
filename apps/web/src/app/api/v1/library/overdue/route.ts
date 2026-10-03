import { libraryOverdueSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { overdueLoans } from "@/lib/library";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/library/overdue — Every loan past its due day. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    return ok(libraryOverdueSchema.parse(await overdueLoans(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/overdue");
  }
}
