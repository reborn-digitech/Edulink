import { expertBookingsSchema } from "@edulink/contracts";
import { listBookings } from "@/lib/experts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiExpert } from "@/lib/api-reads/shared";

/** GET /api/v1/shared/expert/bookings — the expert's bookings across every school that booked them. */
export async function GET() {
  try {
    const ctx = await requireApiExpert();
    const bookings = (await listBookings(ctx)).map((b) => ({ ...b, startsAt: b.startsAt.toISOString(), endsAt: b.endsAt.toISOString() }));
    return ok(expertBookingsSchema.parse({ bookings }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/expert/bookings");
  }
}
