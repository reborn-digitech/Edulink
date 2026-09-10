import { communityMentorAskSchema, communityMentorThreadSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { requestMentor } from "@/lib/mentoring";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/**
 * POST /api/v1/community/mentoring/ask — the web's `askForMentor`: a pupil
 * asks their own school. It grants nothing; the office decides, then a
 * guardian. The library's refusals ("say a bit more", "already asked",
 * "three waiting") come back as 422 in the pupil's language.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = communityMentorAskSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await requestMentor(ctx, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(communityMentorThreadSchema.parse({ threadId: result.threadId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/community/mentoring/ask");
  }
}
