import { communityMentorPairSchema, communityMentorThreadSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createMentorship } from "@/lib/mentoring";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/community/mentoring/pair — the web's `pair` action: a teacher
 * or an admin pairs a pupil with a published expert. Nothing starts: the
 * guardians are asked, and nobody can write until one agrees. A sessions-only
 * expert or a full one is refused by createMentorship with a sentence.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const parsed = communityMentorPairSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { threadId } = await createMentorship(ctx, parsed.data);
    return ok(communityMentorThreadSchema.parse({ threadId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/community/mentoring/pair");
  }
}
