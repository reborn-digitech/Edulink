import { alumniConversationClosedSchema, alumniConversationCloseSchema } from "@edulink/contracts";
import { setConversationClosed } from "@/lib/alumni";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";

/** POST /api/v1/alumni/conversations/close — staff close a room a former pupil writes in, or open it again. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "TEACHER");
    const parsed = alumniConversationCloseSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setConversationClosed(ctx, parsed.data.conversationId, parsed.data.closed);
    return ok(alumniConversationClosedSchema.parse({ ...result, closedAt: result.closedAt?.toISOString() ?? null }));
  } catch (error) {
    return apiFailure(error, "api/v1/alumni/conversations/close");
  }
}
