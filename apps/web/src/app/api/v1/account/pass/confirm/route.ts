import { passConfirmBodySchema, passConfirmedSchema } from "@edulink/contracts";
import { confirmPassCheckout } from "@/lib/pass-orders";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { PASS_BUYER_ROLES, requirePassRole } from "../guard";

/** POST /api/v1/account/pass/confirm — the checkout's handler signature, checked with the company's key secret, then the one door every capture goes through (17 Oct 2026). */
export async function POST(request: Request) {
  try {
    const ctx = await requirePassRole(...PASS_BUYER_ROLES);
    const parsed = passConfirmBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(passConfirmedSchema.parse(await confirmPassCheckout(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass/confirm");
  }
}
