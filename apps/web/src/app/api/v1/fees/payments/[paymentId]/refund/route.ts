import { feeRefundBodySchema, feeRefundResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { requestRefund } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/payments/{paymentId}/refund — from the SCHOOL'S funds: through its gateway for an online payment, recorded after the fact for the rest. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const { paymentId } = await params;
    const parsed = feeRefundBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeRefundResultSchema.parse(await requestRefund(ctx, { paymentId, ...parsed.data })));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/payments/[paymentId]/refund");
  }
}
