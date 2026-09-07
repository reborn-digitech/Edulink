import { NextResponse } from "next/server";
import { conversationMessageSchema } from "@edulink/contracts";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/tenancy";
import { sendConversationMessage } from "@/lib/conversations";
import { apiFailure, apiInvalid, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/messages — one message into a room.
 *
 * The offline outbox's third write path. Replay-safe through `clientId`: the
 * room keeps it unique, so the second delivery of a queued message answers
 * with the id of the one that already landed and sends nobody a twin.
 * Who may write into which room is mayConverse, inside the library.
 */
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const parsed = conversationMessageSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { conversationId, body, clientId } = parsed.data;
    const result = await sendConversationMessage(session, conversationId, body, { clientId });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/messages");
  }
}
