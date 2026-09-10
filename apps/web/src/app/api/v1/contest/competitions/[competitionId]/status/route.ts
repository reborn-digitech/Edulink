import { contestStatusSchema, contestStatusSetSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setCompetitionStatus } from "@/lib/competitions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/contest/competitions/{competitionId}/status — the organising
 * school publishes, withdraws (ARCHIVED: entries kept) or re-drafts its own.
 * Another school's competition, or a platform one, matches nothing: 404.
 */
export async function POST(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { competitionId } = await params;
    const parsed = contestStatusSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setCompetitionStatus(ctx, competitionId, parsed.data.status);
    return ok(contestStatusSetSchema.parse({ ok: true, status: parsed.data.status }));
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions/[competitionId]/status");
  }
}
