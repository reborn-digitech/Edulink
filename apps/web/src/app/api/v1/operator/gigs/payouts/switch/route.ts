import { gigPaymentsSwitchBodySchema, gigPaymentsSwitchedSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { setPaymentsEnabled } from "@/lib/gig-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/payouts/switch — paid seats on or off, for every path at once. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = gigPaymentsSwitchBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setPaymentsEnabled(ctx, parsed.data.on);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPaymentsSwitchedSchema.parse({ paymentsEnabled: result.paymentsEnabled }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/payouts/switch");
  }
}
