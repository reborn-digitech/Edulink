import { requireApiRole } from "@/lib/tenancy";
import { endTrip } from "@/lib/transport";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/transport/trips/{tripId}/end — end a live trip; an ended one answers as it stands. */
export async function POST(_request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const ctx = await requireApiRole("DRIVER");
    const { tripId } = await params;
    const { endedAt } = await endTrip(ctx, tripId);
    return ok({ ok: true as const, endedAt });
  } catch (error) {
    return apiFailure(error, "api/v1/transport/trips/end");
  }
}
