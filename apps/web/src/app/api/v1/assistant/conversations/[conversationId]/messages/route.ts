import { assistantAnswerSchema, assistantAskSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { ask } from "@/lib/assistant/service";
import { assistantFailure, requireAssistantSession } from "@/lib/assistant/http";

/** A question with a pasted homework text is a few kilobytes. */
const ASK_BODY_LIMIT = 16 * 1024;

/**
 * POST /api/v1/assistant/conversations/{conversationId}/messages — ask. The gate before the model, the
 * answer, the gate after it; the checked answer streamed over GET /api/v1/events and returned whole. A
 * refusal is a 200 whose answer is the fixed sentence with its verdict; only the caps and the switches
 * are errors (assistantFailure).
 */
export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const ctx = await requireAssistantSession();
    const parsed = assistantAskSchema.safeParse(await readJson(request, ASK_BODY_LIMIT));
    if (!parsed.success) return apiInvalid(parsed);
    const { conversationId } = await params;
    return ok(assistantAnswerSchema.parse(await ask(ctx, conversationId, parsed.data)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/conversations/[conversationId]/messages");
  }
}
