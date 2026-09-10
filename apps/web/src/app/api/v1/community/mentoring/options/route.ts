import { communityMentoringOptionsSchema } from "@edulink/contracts";
import { MAX_OPEN_REQUESTS, listMentorships, pairingOptions, requestableExperts } from "@/lib/mentoring";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * GET /api/v1/community/mentoring/options — the set-up screen's lists, fetched
 * exactly as the web's /mentoring page fetches them: the pairing lists for an
 * admin or a teacher (a teacher's own pupils only), the mentors a pupil may
 * ask and how many of their asks are still waiting. Anyone else gets empty
 * lists — the libraries return nothing for a role they do not serve.
 */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    const isStaff = ctx.role === "ADMIN" || ctx.role === "TEACHER";
    const isPupil = ctx.role === "STUDENT";
    const [pairing, askable, threads] = await Promise.all([
      isStaff ? pairingOptions(ctx) : Promise.resolve({ experts: [], pupils: [] }),
      requestableExperts(ctx),
      isPupil ? listMentorships(ctx) : Promise.resolve([]),
    ]);
    return ok(
      communityMentoringOptionsSchema.parse({
        pairing,
        askable,
        openRequests: threads.filter((t) => t.status === "REQUESTED").length,
        maxOpenRequests: MAX_OPEN_REQUESTS,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/community/mentoring/options");
  }
}
