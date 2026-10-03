import { hostelOverviewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { hostelOverview } from "@/lib/hostel";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/hostel/overview — Occupancy, leave today, absentees at roll call, visitors. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN", "PRINCIPAL");
    return ok(hostelOverviewSchema.parse(await hostelOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/overview");
  }
}
