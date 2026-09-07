import { mentoringMessageBodySchema, okSchema } from "@edulink/contracts";
import { postMentorMessage } from "@/lib/mentoring";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/mentoring/{threadId}/messages — only the mentor and the pupil, and only once consent exists. */
export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { threadId } = await params;
    const parsed = mentoringMessageBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await postMentorMessage(ctx, threadId, parsed.data.body);
    return ok(okSchema.parse({ ok: true }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/mentoring/[threadId]/messages");
  }
}
