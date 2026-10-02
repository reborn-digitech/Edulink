import { gigCheckoutConfirmBodySchema, gigCheckoutConfirmedSchema } from "@edulink/contracts";
import { confirmSeatCheckout } from "@/lib/gig-payments";
import { settleSeatPayment } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/payments/{paymentId}/confirm — the checkout's handler signature, checked with the company's key secret, then the one door every capture goes through. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireGigRole("PARENT");
    const { paymentId } = await params;
    const parsed = gigCheckoutConfirmBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { orderId, amountPaise } = await confirmSeatCheckout(ctx, { paymentId, ...parsed.data });
    const result = await settleSeatPayment({ orderId, gatewayPaymentId: parsed.data.gatewayPaymentId, amountPaise });
    return ok(gigCheckoutConfirmedSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/payments/[paymentId]/confirm");
  }
}
