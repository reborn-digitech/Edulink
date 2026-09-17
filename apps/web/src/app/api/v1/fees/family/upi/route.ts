import { familyPayBodySchema, familyUpiStartSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { startUpiPayment } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/family/upi — an intent link to the school's own UPI id, and the reference the office will look for. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyPayBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyUpiStartSchema.parse(await startUpiPayment(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/upi");
  }
}
