import { gigBookingStatusSetSchema } from "@edulink/contracts";
import { reportUnheld } from "@/lib/gig-sessions";
import { apiFailure, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/sessions/{bookingId}/unheld — after it should have ended, the family says the provider did not hold it; said twice is a 200. */
export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    const { bookingId } = await params;
    const result = await reportUnheld(ctx, bookingId);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigBookingStatusSetSchema.parse({ status: result.status }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/unheld");
  }
}
