import { assistantConversationListSchema, assistantConversationSchema, assistantOpenSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { listConversations, openConversation } from "@/lib/assistant/service";
import { assistantFailure } from "@/lib/assistant/http";

/** GET /api/v1/assistant/conversations — my own, newest first, the retention window's. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(assistantConversationListSchema.parse(await listConversations(ctx)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/conversations");
  }
}

/** POST /api/v1/assistant/conversations — open one (the module gate runs first, role-gate.ts; then the platform's switch, the opt-out and the caps). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = assistantOpenSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(assistantConversationSchema.parse(await openConversation(ctx, parsed.data)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant/conversations");
  }
}
