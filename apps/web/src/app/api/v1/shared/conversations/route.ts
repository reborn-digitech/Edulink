import { inboxConversationOpenedSchema, inboxOpenConversationSchema } from "@edulink/contracts";
import { openConversation } from "@/lib/conversations";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/shared/conversations — the one room with one person at one school, found if it exists, made if not. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = inboxOpenConversationSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await openConversation(ctx, parsed.data.schoolId, parsed.data.userId);
    return ok(inboxConversationOpenedSchema.parse(result), result.created ? 201 : 200);
  } catch (error) {
    return apiFailure(error, "api/v1/shared/conversations");
  }
}
