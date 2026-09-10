import { okSchema } from "@edulink/contracts";
import { consentToMentorship } from "@/lib/mentoring";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/community/mentoring/{threadId}/consent — the web's `consent`:
 * a guardian of this child says yes, and only then may anybody write. A
 * guardian has no membership, so the role is checked by consentToMentorship
 * (403 for anyone else, 404 for a child who is not theirs).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { threadId } = await params;
    await consentToMentorship(ctx, threadId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/community/mentoring/[threadId]/consent");
  }
}
