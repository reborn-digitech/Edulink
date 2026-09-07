import { inboxThreadReplyBodySchema, inboxThreadReplyResultSchema } from "@edulink/contracts";
import { replyToThread } from "@/lib/remarks";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/threads/{threadId}/reply — one message into a remark thread; a closed thread refuses. */
export async function POST(request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { threadId } = await params;
    const parsed = inboxThreadReplyBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(inboxThreadReplyResultSchema.parse(await replyToThread(ctx, { threadId, body: parsed.data.body })), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/threads/[threadId]/reply");
  }
}
