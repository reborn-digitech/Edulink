import { mentoringThreadDetailSchema } from "@edulink/contracts";
import { getMentorship } from "@/lib/mentoring";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound } from "../../helpers";

/** GET /api/v1/shared/mentoring/{threadId} — one mentorship, readable by the expert, the pupil, their guardians and their school. */
export async function GET(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { threadId } = await params;
    const thread = await asNotFound(() => getMentorship(ctx, threadId));
    return ok(mentoringThreadDetailSchema.parse({ ...thread, messages: thread.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })) }));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/mentoring/[threadId]");
  }
}
