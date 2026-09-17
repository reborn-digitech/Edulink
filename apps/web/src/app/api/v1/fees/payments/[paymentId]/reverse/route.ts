import { feeOkSchema, feeReasonBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { reversePayment } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/payments/{paymentId}/reverse — the row stays, marked; the demands reopen. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { paymentId } = await params;
    const parsed = feeReasonBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await reversePayment(ctx, paymentId, parsed.data.reason);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/payments/[paymentId]/reverse");
  }
}
