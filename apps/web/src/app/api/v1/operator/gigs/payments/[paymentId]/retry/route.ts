import { gigPayoutRetriedSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { retrySeatPayment } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/payments/{paymentId}/retry — a waiting refund tried at the gateway now (a PAID row never held is held). */
export async function POST(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireApiOperator();
    const { paymentId } = await params;
    const result = await retrySeatPayment(ctx, paymentId);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigPayoutRetriedSchema.parse({ outcome: result.outcome }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/payments/[paymentId]/retry");
  }
}
