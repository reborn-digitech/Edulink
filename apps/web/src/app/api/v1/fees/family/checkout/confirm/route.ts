import { familyCheckoutConfirmBodySchema, familyCheckoutConfirmSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { confirmOnlineCheckout } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/family/checkout/confirm — the handler signature, checked with the school's key secret; settles once, like the webhook. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyCheckoutConfirmBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyCheckoutConfirmSchema.parse(await confirmOnlineCheckout(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/checkout/confirm");
  }
}
