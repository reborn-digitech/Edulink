import { gigSeriesBookBodySchema, gigSeriesBookedSchema } from "@edulink/contracts";
import { bookSeries } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { getT } from "@/lib/i18n/server";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/series/{seriesId}/book — one order of individual seats (decision 0008): every remaining session of the series, or the ones named, each booked as a single seat is. */
export async function POST(request: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const ctx = await requireGigRole("STUDENT", "PARENT");
    const { seriesId } = await params;
    const parsed = gigSeriesBookBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await bookSeries(ctx, { seriesId, studentMembershipId: parsed.data.studentMembershipId, purpose: parsed.data.purpose, slotIds: parsed.data.slotIds });
    if (!result.ok) return refused(result.errorKey, result.vars);
    const t = await getT();
    return ok(gigSeriesBookedSchema.parse({ bookings: result.bookings, refused: result.refused.map((r) => ({ slotId: r.slotId, reason: t(r.errorKey, r.vars) })) }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/series/book");
  }
}
