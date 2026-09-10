import { contestLeaderboardSchema, contestLeaderboardSetSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setLeaderboard } from "@/lib/competitions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/contest/competitions/{competitionId}/leaderboard — the
 * organiser publishes the cross-school board or takes it down. Schools are
 * ranked, never children; taking it down deletes nothing.
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { competitionId } = await params;
    const parsed = contestLeaderboardSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setLeaderboard(ctx, competitionId, parsed.data.enabled);
    return ok(contestLeaderboardSetSchema.parse({ ok: true, enabled: parsed.data.enabled }));
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions/[competitionId]/leaderboard");
  }
}
