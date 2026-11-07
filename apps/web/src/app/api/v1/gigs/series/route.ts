import { gigSeriesBodySchema, gigSeriesMadeSchema } from "@edulink/contracts";
import { offerSeries } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../guard";

/** POST /api/v1/gigs/series — a series of sessions offered in one go (decision 0008): a fixed list of dates, or a weekly pattern until a date; each session a slot as before. */
export async function POST(request: Request) {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    const parsed = gigSeriesBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await offerSeries(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigSeriesMadeSchema.parse({ seriesId: result.seriesId, slotIds: result.slotIds }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/series");
  }
}
