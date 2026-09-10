import { contestEntriesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { getCompetition, listEntriesForResults } from "@/lib/competitions";
import { apiFailure, ok } from "@/lib/api-v1";
import { asNotFound } from "../../../../shared/helpers";

/**
 * GET /api/v1/contest/competitions/{competitionId}/entries — the web's
 * /competitions/[id]/entries: THIS school's entries and what they scored, for
 * its admins and teachers. A competition the reader may not see is a 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const { competitionId } = await params;
    const competition = await asNotFound(() => getCompetition(ctx, competitionId));
    const entries = await listEntriesForResults(ctx, competition.id);
    return ok(
      contestEntriesSchema.parse({
        competition: {
          id: competition.id,
          title: competition.title,
          status: competition.status,
          isOrganiser: competition.isOrganiser,
          leaderboardEnabled: competition.leaderboardEnabled,
          requiresParentConsent: competition.requiresParentConsent,
        },
        entries,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions/[competitionId]/entries");
  }
}
