import { familyUpiClaimBodySchema, feeOkSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { claimUpiPayment } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/family/upi/claim — "I have paid", with the UTR; the office confirms against the statement. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyUpiClaimBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await claimUpiPayment(ctx, parsed.data);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/upi/claim");
  }
}
