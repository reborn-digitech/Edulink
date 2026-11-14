import { contestEntriesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { entrantCandidates, getCompetition, listEntriesForResults } from "@/lib/competitions";
import { apiFailure, ok } from "@/lib/api-v1";
import { asNotFound } from "../../../../shared/helpers";

/**
 * GET /api/v1/contest/competitions/{competitionId}/entries — the web's
 * /competitions/[id]/entries: THIS school's entries and what they scored, for
 * its admins and teachers. A competition the reader may not see is a 404.
 * TA-104: with the pupils the office or a teacher may add as entrants (the
 * school's own competition only; empty otherwise).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const { competitionId } = await params;
    const competition = await asNotFound(() => getCompetition(ctx, competitionId));
    const entries = await listEntriesForResults(ctx, competition.id);
    const candidates = await entrantCandidates(ctx, competition.id);
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
        candidates,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/contest/competitions/[competitionId]/entries");
  }
}
