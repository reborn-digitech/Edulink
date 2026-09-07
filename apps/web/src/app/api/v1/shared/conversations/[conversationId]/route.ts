import { inboxConversationDetailSchema } from "@edulink/contracts";
import { getConversation, markConversationRead } from "@/lib/conversations";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { asNotFound } from "../../helpers";

/** GET /api/v1/shared/conversations/{conversationId} — the room's messages; opening it marks it read, as the page does. */
export async function GET(_request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { conversationId } = await params;
    const conversation = await asNotFound(() => getConversation(ctx, conversationId));
    await markConversationRead(ctx, conversationId).catch(() => undefined);
    return ok(
      inboxConversationDetailSchema.parse({
        ...conversation,
        myLastReadAt: conversation.myLastReadAt?.toISOString() ?? null,
        messages: conversation.messages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/shared/conversations/[conversationId]");
  }
}
