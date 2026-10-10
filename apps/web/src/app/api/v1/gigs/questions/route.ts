import { gigContributionSaveSchema, gigContributionSavedSchema, gigMyContributionsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assertQuestionGigOpen } from "@/lib/question-gig";
import { myContributions, submitContribution } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** GET /api/v1/gigs/questions — a teacher's own questions for the bank, what they stand to earn, and where they are paid. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER");
    assertQuestionGigOpen(); // review-queue (10 Oct 2026): 404 while the teachers' question gig is off.
    return ok(gigMyContributionsSchema.parse(await myContributions(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions");
  }
}

/**
 * POST /api/v1/gigs/questions — send a question in English, Hindi and
 * Marathi. What a question must be, the day's limit, the waiting limit and
 * the check against the bank are submitContribution's; each refusal is a 422
 * with its sentence.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    assertQuestionGigOpen(); // review-queue (10 Oct 2026): 404 while the teachers' question gig is off.
    const parsed = gigContributionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await submitContribution(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigContributionSavedSchema.parse({ contribution: result.contribution }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions");
  }
}
