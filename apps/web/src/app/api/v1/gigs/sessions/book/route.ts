import { gigBookBodySchema, gigBookedSchema } from "@edulink/contracts";
import { bookSeat } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../guard";

/**
 * POST /api/v1/gigs/sessions/book — a pupil asks for a seat, which waits for
 * a guardian, or a guardian takes one for their child. The allowance, the
 * seat and the booking are one transaction in bookSeat; a slot that is not
 * open to this pupil is a 404.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    const parsed = gigBookBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await bookSeat(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigBookedSchema.parse({ bookingId: result.bookingId, status: result.status, checkout: result.checkout }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/book");
  }
}
