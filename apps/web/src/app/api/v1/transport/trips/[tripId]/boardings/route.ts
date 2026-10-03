import { rosterEntrySchema, tripBoardingSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { markBoarding } from "@/lib/transport";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/transport/trips/{tripId}/boardings — tick a pupil on or off the bus on a live trip. */
export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const ctx = await requireApiRole("DRIVER");
    const { tripId } = await params;
    const parsed = tripBoardingSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(rosterEntrySchema.parse(await markBoarding(ctx, tripId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/transport/trips/boardings");
  }
}
