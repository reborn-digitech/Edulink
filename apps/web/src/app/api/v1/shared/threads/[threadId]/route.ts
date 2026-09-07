import { inboxThreadDetailSchema } from "@edulink/contracts";
import { getThread, markThreadRead } from "@/lib/remarks";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound } from "../../helpers";

/** GET /api/v1/shared/threads/{threadId} — a remark thread about a pupil; opening it marks it read, as the page does. */
export async function GET(_request: Request, { params }: { params: Promise<{ threadId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { threadId } = await params;
    const thread = await asNotFound(() => getThread(ctx, threadId));
    await markThreadRead(ctx, threadId).catch(() => undefined);
    return ok(
      inboxThreadDetailSchema.parse({
        ...thread,
        closedAt: thread.closedAt?.toISOString() ?? null,
        messages: thread.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/shared/threads/[threadId]");
  }
}
