import { gigTopicsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { assertQuestionGigOpen } from "@/lib/question-gig";
import { contributionTopics } from "@/lib/gig-questions";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/gigs/questions/topics — the chapters a question can be written for. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER");
    await assertQuestionGigOpen(ctx); // 404 FEATURE_OFF while the QUESTION_GIG platform feature is off (15 Oct 2026; the gate answers it first).
    return ok(gigTopicsSchema.parse({ topics: await contributionTopics(ctx) }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/questions/topics");
  }
}
