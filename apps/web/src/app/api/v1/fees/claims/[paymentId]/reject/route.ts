import { feeOkSchema, feeReasonBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { rejectClaim } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/claims/{paymentId}/reject — not on the statement; the family is told why. */
export async function POST(request: Request, { params }: { params: Promise<{ paymentId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { paymentId } = await params;
    const parsed = feeReasonBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await rejectClaim(ctx, paymentId, parsed.data.reason);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/claims/[paymentId]/reject");
  }
}
