import { gigPayoutPaidSchema, gigPayoutPayBodySchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { recordPayout } from "@/lib/gig-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/payouts/{payoutId}/pay — the company has paid the expert from its bank: the reference recorded, every seat in the payout PAID_OUT, the tax invoice issued, all at once. */
export async function POST(request: Request, { params }: { params: Promise<{ payoutId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { payoutId } = await params;
    const parsed = gigPayoutPayBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await recordPayout(ctx, payoutId, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPayoutPaidSchema.parse({ payout: result.payout, invoice: result.invoice }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/payouts/[payoutId]/pay");
  }
}
