import { gigBookingStatusSetSchema, gigConsentBodySchema } from "@edulink/contracts";
import { consentToBooking } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/sessions/{bookingId}/consent — a guardian's yes or no to their own child's ask; anybody else's child is a 404. */
export async function POST(request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireGigRole("PARENT");
    const { bookingId } = await params;
    const parsed = gigConsentBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await consentToBooking(ctx, bookingId, parsed.data.approve);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigBookingStatusSetSchema.parse({ status: result.status }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/sessions/[bookingId]/consent");
  }
}
