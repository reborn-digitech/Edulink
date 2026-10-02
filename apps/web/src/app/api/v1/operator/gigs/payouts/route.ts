import { gigPayoutsSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { operatorPayouts } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/operator/gigs/payouts — the kill switch, the company's details, the month's commission and GST, what is held and due, what failed, what is to pay now and what was paid. */
export async function GET() {
  try {
    const ctx = await requireApiOperator();
    return ok(gigPayoutsSchema.parse(await operatorPayouts(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/payouts");
  }
}
