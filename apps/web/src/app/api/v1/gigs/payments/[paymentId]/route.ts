import { gigPaymentStatusSchema } from "@edulink/contracts";
import { familyPayment } from "@/lib/gig-payments";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireGigRole } from "../../guard";

/** GET /api/v1/gigs/payments/{paymentId} — the payer's own seat payment; the panel polls it until it is paid or failed. */
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    const { paymentId } = await params;
    return ok(gigPaymentStatusSchema.parse(await familyPayment(ctx, paymentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/payments/[paymentId]");
  }
}
