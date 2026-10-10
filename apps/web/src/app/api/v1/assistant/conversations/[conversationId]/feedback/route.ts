import { assistantFeedbackSavedSchema, assistantFeedbackSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { saveFeedback } from "@/lib/assistant/service";
import { assistantFailure } from "@/lib/assistant/http";

/** POST /api/v1/assistant/conversations/{conversationId}/feedback — was this answer helpful (changeable; counted, never read for text). */
export async function POST(request: Request, { params }: { params: Promise<{ conversationId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const parsed = assistantFeedbackSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { conversationId } = await params;
    return ok(assistantFeedbackSavedSchema.parse(await saveFeedback(ctx, conversationId, parsed.data)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/conversations/[conversationId]/feedback");
  }
}
