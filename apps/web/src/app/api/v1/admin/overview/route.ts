import { adminOverviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { adminOverview } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/overview — what the school overview page shows: the year, the setup checklist, today's counts, the staffing gap, overnight housekeeping. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(adminOverviewSchema.parse(await adminOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/overview");
  }
}
