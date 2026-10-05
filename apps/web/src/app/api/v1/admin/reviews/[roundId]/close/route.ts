import { okSchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { closeReviewRound } from "@/lib/reviews";
import { db } from "@/lib/db";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * POST /api/v1/admin/reviews/{roundId}/close — close a review round before its
 * date (the web's closeRound, R-50; POST /admin/reviews opens one). The office
 * and the head, as on the web; audited review.round.close. The library says
 * "gone" both for a round already closed and for an id this school does not
 * hold, so the door tells them apart: a round of this school already closed
 * is a no-op (200, a second press), anything else a 404. No body.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ roundId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { roundId } = await params;
    const result = await closeReviewRound(ctx, roundId);
    if (!result.ok) {
      const round = await db.reviewRound.findFirst({ where: { id: roundId, schoolId: ctx.schoolId }, select: { status: true } });
      if (round?.status !== "CLOSED") throw new AccessError(result.errorKey, "NOT_FOUND");
    }
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/reviews/[roundId]/close");
  }
}
