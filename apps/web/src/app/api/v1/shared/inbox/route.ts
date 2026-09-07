import { inboxSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { readInbox, requireApiSession } from "@/lib/api-reads/shared";
import { query, text } from "../helpers";

/** GET /api/v1/shared/inbox — conversations and remark threads in one list, `?q=` and `?unread=1` as the page filters. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiSession();
    const params = query(request);
    return ok(inboxSchema.parse(await readInbox(ctx, { q: text(params, "q"), unreadOnly: params.get("unread") === "1" })));
  } catch (error) {
    return apiFailure(error, "api/v1/shared/inbox");
  }
}
