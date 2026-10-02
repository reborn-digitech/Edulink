import { gigCheckoutMadeSchema } from "@edulink/contracts";
import { seatCheckout } from "@/lib/gig-sessions";
import { apiFailure, budget, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** Orders a person may open in an hour: a panel reopened is the same order, so this is generous for a family and tight for a loop. */
const CHECKOUT_BUDGET = { limit: 30, windowMs: 60 * 60 * 1000 };

/**
 * POST /api/v1/gigs/sessions/{bookingId}/checkout — the order for a seat
 * waiting for the guardian's payment: the one already made while it stands,
 * a fresh one after a failed attempt. The amount is the slot's own price,
 * never the client's.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("PARENT");
    const { bookingId } = await params;
    const over = await budget(`gig-checkout:${ctx.user.id}`, CHECKOUT_BUDGET.limit, CHECKOUT_BUDGET.windowMs);
    if (over) return over;
    const result = await seatCheckout(ctx, bookingId);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigCheckoutMadeSchema.parse({ checkout: result.checkout }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/checkout");
  }
}
