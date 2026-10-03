import { libraryReportsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { libraryReports } from "@/lib/library";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/library/reports — Issues per month, most borrowed, overdue by class. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("LIBRARIAN", "ADMIN", "PRINCIPAL");
    return ok(libraryReportsSchema.parse(await libraryReports(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/library/reports");
  }
}
