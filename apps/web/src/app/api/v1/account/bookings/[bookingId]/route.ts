import { accountBookingSchema } from "@edulink/contracts";
import { getBooking } from "@/lib/experts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * GET /api/v1/account/bookings/{bookingId} — the web's booking page: for the
 * expert, and for the staff of the school that booked. getBooking decides; a
 * pupil or a guardian gets its 404, never "not yours".
 */
export async function GET(_request: Request, { params }: { params: Promise<{ bookingId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { bookingId } = await params;
    const booking = await getBooking(ctx, bookingId);
    return ok(
      accountBookingSchema.parse({
        ...booking,
        startsAt: booking.startsAt.toISOString(),
        endsAt: booking.endsAt.toISOString(),
        viewerIsExpert: ctx.role === "EXPERT",
        // As the page offers it: not cancelled, and not yet begun.
        canCancel: booking.status !== "CANCELLED" && booking.startsAt.getTime() > Date.now(),
        messages: booking.messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/account/bookings/[bookingId]");
  }
}
