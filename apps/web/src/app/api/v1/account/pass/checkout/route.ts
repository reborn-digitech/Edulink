import { passCheckoutBodySchema, passCheckoutMadeSchema } from "@edulink/contracts";
import { openPassCheckout } from "@/lib/pass-orders";
import { apiFailure, apiInvalid, budget, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { PASS_BUYER_ROLES, requirePassRole } from "../guard";

/** Orders a person may open in an hour: a panel reopened is the same order, so this is generous for a person and tight for a loop. */
const CHECKOUT_BUDGET = { limit: 30, windowMs: 60 * 60 * 1000 };

/**
 * POST /api/v1/account/pass/checkout — a pass's order at the company's gateway: a plan and a period, for oneself or
 * (a guardian) for one child. The price is the plan's own today with its GST, never the client's (17 Oct 2026).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requirePassRole(...PASS_BUYER_ROLES);
    const parsed = passCheckoutBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const over = await budget(`pass-checkout:${ctx.user.id}`, CHECKOUT_BUDGET.limit, CHECKOUT_BUDGET.windowMs);
    if (over) return over;
    const result = await openPassCheckout(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(passCheckoutMadeSchema.parse({ order: result.order, checkout: result.checkout }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/pass/checkout");
  }
}
