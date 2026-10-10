import { gigContributionSavedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assertQuestionGigOpen } from "@/lib/question-gig";
import { withdrawContribution } from "@/lib/gig-questions";
import { apiFailure, ok } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/gigs/questions/{contributionId}/withdraw — the author takes back one that is not settled; taken back twice is a 200. */
export async function POST(_request: Request, { params }: { params: Promise<{ contributionId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER");
    assertQuestionGigOpen(); // review-queue (10 Oct 2026): 404 while the teachers' question gig is off.
    const { contributionId } = await params;
    const result = await withdrawContribution(ctx, contributionId);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigContributionSavedSchema.parse({ contribution: result.contribution }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions/[contributionId]/withdraw");
  }
}
