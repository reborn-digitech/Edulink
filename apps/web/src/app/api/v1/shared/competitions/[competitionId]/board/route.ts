import { competitionBoardSchema } from "@edulink/contracts";
import { requireApiSession } from "@/lib/api-reads/shared";
import { internalBoard } from "@/lib/competitions";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/shared/competitions/{competitionId}/board — the internal board of a school's own competition
 * (decision 0007, 6 Nov 2026): the office's setting, and the places the reader may see — staff of the organising
 * school every entry with a result; a pupil or a guardian there, under SCHOOL, the top places by first name with
 * their own (`?student=` picks which child for a guardian); nobody else any row.
 */
export async function GET(request: Request, { params }: { params: Promise<{ competitionId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { competitionId } = await params;
    const student = new URL(request.url).searchParams.get("student");
    return ok(competitionBoardSchema.parse(await internalBoard(ctx, competitionId, { studentMembershipId: student })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/competitions/[competitionId]/board");
  }
}
