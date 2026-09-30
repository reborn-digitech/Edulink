import { gigReviewSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { getContributionForReview } from "@/lib/gig-questions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/contributions/{contributionId} — one question in three languages, and what adding it today would earn its author. */
export async function GET(_request: Request, { params }: { params: Promise<{ contributionId: string }> }) {
  try {
    const ctx = await requireApiAppAdmin();
    const { contributionId } = await params;
    return ok(gigReviewSchema.parse(await getContributionForReview(ctx, contributionId)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/contributions/[contributionId]");
  }
}
