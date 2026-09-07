import { competitionDetailSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readCompetition, requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound } from "../../helpers";

/** GET /api/v1/shared/competitions/{competitionId} — one competition, the caller's entry, and the schools' board when it is on. */
export async function GET(_request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { competitionId } = await params;
    return ok(competitionDetailSchema.parse(await asNotFound(() => readCompetition(ctx, competitionId))));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/competitions/[competitionId]");
  }
}
