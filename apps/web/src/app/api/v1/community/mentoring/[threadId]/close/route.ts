import { okSchema } from "@edulink/contracts";
import { closeMentorship } from "@/lib/mentoring";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/community/mentoring/{threadId}/close — the web's `close`: the
 * school (the office, or a teacher of the pupil) or a guardian ends it; the
 * expert cannot trap anyone and cannot end it either. Ending one already
 * ended is a no-op, so two people pressing it at once release one place.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { threadId } = await params;
    await closeMentorship(ctx, threadId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/community/mentoring/[threadId]/close");
  }
}
