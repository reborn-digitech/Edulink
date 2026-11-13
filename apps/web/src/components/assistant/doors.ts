import type { AssistantAbout, AssistantAnswer, AssistantChip, AssistantConversation, AssistantConversationDetail, AssistantLanguage, AssistantStatus } from "@edulink/contracts";
import { ASSISTANT_DOORS } from "./model";

/**
 * The panel's calls to Phase B's doors, with the session cookie, same origin (the middleware's Origin lock passes a
 * page's own requests). Every call answers a result and never throws: status 0 is "not reached" (offline, a dropped
 * connection); anything else that is not ok carries the envelope's sentence and code, and the sentence is what the
 * reader is shown.
 */

export type DoorFailure = { ok: false; status: number; error: string; code?: string };
export type DoorResult<T> = { ok: true; data: T } | DoorFailure;

type Fetcher = typeof fetch;
let fetcher: Fetcher | null = null;
/** Tests hand in a fake fetch; the page uses the browser's. */
export function __setAssistantFetch(next: Fetcher | null): void {
  fetcher = next;
}

export async function call<T>(method: "GET" | "POST" | "DELETE", path: string, body?: unknown): Promise<DoorResult<T>> {
  const doFetch = fetcher ?? fetch;
  let response: Response;
  try {
    response = await doFetch(path, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: { accept: "application/json", ...(body === undefined ? {} : { "content-type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, error: "" };
  }
  const text = await response.text().catch(() => "");
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (response.ok) return { ok: true, data: json as T };
  const envelope = (json ?? {}) as { error?: unknown; code?: unknown };
  return { ok: false, status: response.status, error: typeof envelope.error === "string" ? envelope.error : "", code: typeof envelope.code === "string" ? envelope.code : undefined };
}

export const readStatus = () => call<AssistantStatus>("GET", ASSISTANT_DOORS.status);
/** TA-019: `text` is the first question, which the open reads only to let a message about self-harm or abuse past the caps. */
export const openConversation = (language: AssistantLanguage, childId?: string, text?: string) => call<AssistantConversation>("POST", ASSISTANT_DOORS.conversations, { language, ...(childId ? { childId } : {}), ...(text ? { text } : {}) });
/** The question, with the mode the person picked, the page the drawer is beside and "go on" (Vidura pass 1), each only when set. */
export const askQuestion = (conversationId: string, text: string, opts: { mode?: AssistantChip; page?: string; goOn?: boolean; about?: AssistantAbout } = {}) =>
  call<AssistantAnswer>("POST", ASSISTANT_DOORS.messages(conversationId), { text, ...(opts.mode ? { mode: opts.mode } : {}), ...(opts.page ? { page: opts.page } : {}), ...(opts.goOn ? { goOn: true } : {}), ...(opts.about ? { about: opts.about } : {}) });
/** "Ask a person" (Vidura pass 1): open, or find, the room with them through the messaging door every "Message" button uses. */
export const openRoomWith = (schoolId: string, userId: string) => call<{ conversationId: string; created: boolean }>("POST", "/api/v1/shared/conversations", { schoolId, userId });
export const sendFeedback = (conversationId: string, messageId: string, helpful: boolean) => call<unknown>("POST", ASSISTANT_DOORS.feedback(conversationId), { messageId, helpful });
export const listConversations = () => call<{ conversations: AssistantConversation[]; retentionDays: number }>("GET", ASSISTANT_DOORS.conversations);
export const readConversation = (id: string) => call<AssistantConversationDetail>("GET", ASSISTANT_DOORS.conversation(id));
export const deleteConversation = (id: string) => call<unknown>("DELETE", ASSISTANT_DOORS.conversation(id));
