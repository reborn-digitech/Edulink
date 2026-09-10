import { communityMentorDecideSchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { decideMentorRequest } from "@/lib/mentoring";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/community/mentoring/{threadId}/decide — the web's
 * `decideRequest`: the admin or the head agrees (the expert's place is
 * claimed and the guardians are asked) or declines with a reason the pupil
 * reads. A request already decided, or another school's, is "no longer
 * waiting" — the same sentence either way.
 */
export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { threadId } = await params;
    const parsed = communityMentorDecideSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await decideMentorRequest(ctx, threadId, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/community/mentoring/[threadId]/decide");
  }
}
