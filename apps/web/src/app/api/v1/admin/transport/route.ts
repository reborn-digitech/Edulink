import { transportOverviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { transportOverview } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/admin/transport — routes, buses, assignments, drivers, fee heads and settings; the office's and the head's. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(transportOverviewSchema.parse(await transportOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/transport");
  }
}
