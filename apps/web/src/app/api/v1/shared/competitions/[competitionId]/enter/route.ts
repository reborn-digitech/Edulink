import { competitionEnterResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { enterCompetition } from "@/lib/competitions";
import { apiFailure, ok } from "@/lib/api-v1";

/** POST /api/v1/shared/competitions/{competitionId}/enter — a pupil enters; a second call returns the same entry. */
export async function POST(_request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const { competitionId } = await params;
    return ok(competitionEnterResultSchema.parse(await enterCompetition(ctx, competitionId)));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/competitions/[competitionId]/enter");
  }
}
