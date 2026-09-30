import { gigOverviewSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { gigOverview } from "@/lib/gig-questions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/gigs — the dials, this month's spend, who is owed for the months that have ended, and what was paid. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(gigOverviewSchema.parse(await gigOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs");
  }
}
