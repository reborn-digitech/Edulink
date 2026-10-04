import { feeClaimConfirmedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { confirmClaim } from "@/lib/fees-payments";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/fees/claims/{paymentId}/confirm — the office has seen it on the statement; the receipt is issued. */
export async function POST(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { paymentId } = await params;
    return ok(feeClaimConfirmedSchema.parse(await confirmClaim(ctx, paymentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/claims/[paymentId]/confirm");
  }
}
