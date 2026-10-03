import { tripStartSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { startTrip } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/transport/trips/{tripId}/start — at the first stop, or anywhere with a reason. */
export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const ctx = await requireApiRole("DRIVER");
    const { tripId } = await params;
    const parsed = tripStartSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await startTrip(ctx, tripId, parsed.data);
    return ok({ ok: true as const });
  } catch (error) {
    return apiFailure(error, "api/v1/transport/trips/start");
  }
}
