import { expertRouteLinkedSchema } from "@edulink/contracts";
import { linkMyAccount } from "@/lib/gig-payments";
import { paidGate } from "@/lib/gig-sessions";
import { apiFailure, budget, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireApiExpertRole } from "../../guard";

/** Presses an expert may make in an hour: each one is up to four calls to the gateway. */
const LINK_BUDGET = { limit: 12, windowMs: 60 * 60 * 1000 };

/**
 * POST /api/v1/expert/payout/link — make, resume or bring up to date the
 * expert's Razorpay Route linked account from the details they saved: the
 * steps already done are skipped, changed bank details are sent again, and
 * otherwise the gateway's review is asked after. Refused by name until KYC
 * is verified and every detail is saved; a gateway refusal comes back with
 * the gateway's words.
 */
export async function POST() {
  try {
    const ctx = await requireApiExpertRole();
    const over = await budget(`gig-route-link:${ctx.user.id}`, LINK_BUDGET.limit, LINK_BUDGET.windowMs);
    if (over) return over;
    const result = await linkMyAccount(ctx);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(expertRouteLinkedSchema.parse({ outcome: result.outcome, payout: result.payout, gate: await paidGate(ctx.user.id) }));
  } catch (error) {
    return apiFailure(error, "api/v1/expert/payout/link");
  }
}
