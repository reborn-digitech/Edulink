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
export async function POST(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { bookingId } = await params;
    if (ctx.role !== "ADMIN" && ctx.role !== "TEACHER" && ctx.role !== "EXPERT") throw new AccessError("access.bookingNotFound", "NOT_FOUND");
    await cancelBooking(ctx, bookingId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/bookings/[bookingId]/cancel");
  }
}
