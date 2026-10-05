import { okSchema } from "@edulink/contracts";
import { cancelBooking } from "@/lib/experts";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/account/bookings/{bookingId}/cancel — the web's cancel: either
 * side may, and cancelBooking checks which side the caller is. A role that is
 * never a side (a pupil, a guardian) gets the 404 the GET gives it rather than
 * the lib's "not yours", so this is not a way to learn which ids exist.
 */
/** The sides of a booking (api-catalog/account.ts BOOKING_SIDES): the school's office or teacher, and the expert. */
const BOOKING_SIDES = ["ADMIN", "TEACHER", "EXPERT"];

export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { bookingId } = await params;
    // Role before the id or the body: a side the door is not for is refused 403 (the catalog's BOOKING_SIDES), whatever the id says.
    if (!BOOKING_SIDES.includes(ctx.role ?? "")) throw new AccessError("access.wrongRoleForThisAction");

    await cancelBooking(ctx, bookingId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/bookings/[bookingId]/cancel");
  }
}
