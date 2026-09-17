import { familyCheckoutSchema, familyPayBodySchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { startOnlineCheckout } from "@/lib/fees-payments";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/family/checkout — an order at the SCHOOL'S gateway for the chosen dues. The amount is the server's sum, never the client's. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyPayBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyCheckoutSchema.parse(await startOnlineCheckout(ctx, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/checkout");
  }
}
