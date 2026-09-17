import { familyPaymentStatusSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { familyPaymentStatus } from "@/lib/fees-payments";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/family/payments/{paymentId} — where one of my payments is, for the poll after a checkout or a claim. */
export async function GET(_request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireApiParent();
    const { paymentId } = await params;
    return ok(familyPaymentStatusSchema.parse(await familyPaymentStatus(ctx, paymentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/payments/[paymentId]");
  }
}
