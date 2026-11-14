import { gigDisputesSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { operatorDisputes } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/gigs/disputes — every seat a family says was not held after the provider marked it, oldest first (TA-122). */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(gigDisputesSchema.parse(await operatorDisputes(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/disputes");
  }
}
