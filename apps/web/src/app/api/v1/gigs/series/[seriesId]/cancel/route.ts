import { gigSeriesCancelBodySchema, gigSeriesCancelledSchema } from "@edulink/contracts";
import { cancelSeries } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/series/{seriesId}/cancel — the provider takes the whole series back: every session not yet begun is cancelled as one slot is, each family told. */
export async function POST(request: Request, { params }: { params: Promise<{ seriesId: string }> }) {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    const { seriesId } = await params;
    const parsed = gigSeriesCancelBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await cancelSeries(ctx, seriesId, parsed.data.reason);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigSeriesCancelledSchema.parse({ cancelled: result.cancelled }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/series/cancel");
  }
}
