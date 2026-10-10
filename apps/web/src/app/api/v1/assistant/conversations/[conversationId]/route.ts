import { assistantConversationDetailSchema, assistantDeletedSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { deleteConversation, getConversation } from "@/lib/assistant/service";
import { assistantFailure } from "@/lib/assistant/http";

type Params = { params: Promise<{ conversationId: string }> };

/** GET /api/v1/assistant/conversations/{conversationId} — one of my own, every message; anyone else's is 404. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiSession();
    const { conversationId } = await params;
    return ok(assistantConversationDetailSchema.parse(await getConversation(ctx, conversationId)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/conversations/[conversationId]");
  }
}

/** DELETE /api/v1/assistant/conversations/{conversationId} — delete one of my own now. */
export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiSession();
    const { conversationId } = await params;
    return ok(assistantDeletedSchema.parse(await deleteConversation(ctx, conversationId)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/conversations/[conversationId]");
  }
}
