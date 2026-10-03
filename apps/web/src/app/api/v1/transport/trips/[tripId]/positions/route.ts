import { tripPositionsResultSchema, tripPositionsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordPositions } from "@/lib/transport";
import { apiFailure, apiInvalid, budget, ok, readJson } from "@/lib/api-v1";

/** A batch every 12–15 s is ~300 an hour; a phone back from a dead zone sends its outbox at once. */
const POSITIONS_BUDGET = { limit: 1500, windowMs: 60 * 60 * 1000 };

/** POST /api/v1/transport/trips/{tripId}/positions — a batch of the bus's positions, live or from the phone's outbox. */
export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const ctx = await requireApiRole("DRIVER");
    const { tripId } = await params;
    const parsed = tripPositionsSchema.safeParse(await readJson(request, 256 * 1024));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`positions:${ctx.user.id}`, POSITIONS_BUDGET.limit, POSITIONS_BUDGET.windowMs);
    if (refused) return refused;
    return ok(tripPositionsResultSchema.parse(await recordPositions(ctx, tripId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/transport/trips/positions");
  }
}
