import { gigContributionSaveSchema, gigContributionSavedSchema, gigContributionSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assertQuestionGigOpen } from "@/lib/question-gig";
import { getMyContribution, reviseContribution } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** GET /api/v1/gigs/questions/{contributionId} — one of the teacher's own; somebody else's is a 404. */
export async function GET(_request: Request, { params }: { params: Promise<{ contributionId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER");
    assertQuestionGigOpen(); // review-queue (10 Oct 2026): 404 while the teachers' question gig is off.
    const { contributionId } = await params;
    return ok(gigContributionSchema.parse(await getMyContribution(ctx, contributionId)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions/[contributionId]");
  }
}

/** POST /api/v1/gigs/questions/{contributionId} — change one that still waits or was returned; it goes back to the content team. A settled one is refused. */
export async function POST(request: Request, { params }: { params: Promise<{ contributionId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER");
    assertQuestionGigOpen(); // review-queue (10 Oct 2026): 404 while the teachers' question gig is off.
    const { contributionId } = await params;
    const parsed = gigContributionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await reviseContribution(ctx, contributionId, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigContributionSavedSchema.parse({ contribution: result.contribution }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions/[contributionId]");
  }
}
