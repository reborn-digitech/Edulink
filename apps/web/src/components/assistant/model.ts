import { ASSISTANT_QUESTION_MAX, type AssistantCitation, type AssistantEvent, type AssistantMessage, type AssistantStatus } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@/lib/i18n";

/**
 * The assistant's surfaces (Phase C, docs/plans/assistant.md section 5): what the panel, the page and their tests
 * share, pure of React and of the network so a test reads it directly.
 *
 * The doors are Phase B's (packages/contracts v1/assistant.ts, the catalog's src/lib/api-catalog/assistant.ts); the
 * panel reads them with the session cookie like the command palette's search, never through a server action, so the
 * web and the phone ask the same doors the same way and the role gate, the module gate, the kill switch, the opt-out
 * and the caps all answer from one place.
 */

export const ASSISTANT_DOORS = {
  status: "/api/v1/assistant",
  conversations: "/api/v1/assistant/conversations",
  conversation: (id: string) => `/api/v1/assistant/conversations/${encodeURIComponent(id)}`,
  messages: (id: string) => `/api/v1/assistant/conversations/${encodeURIComponent(id)}/messages`,
  feedback: (id: string) => `/api/v1/assistant/conversations/${encodeURIComponent(id)}/feedback`,
} as const;

/** The page that lists a person's conversations, and one conversation on it. */
export const ASSISTANT_PAGE = "/assistant";
export const conversationHref = (id: string) => `${ASSISTANT_PAGE}/${encodeURIComponent(id)}`;

/** A question is sent trimmed and at most this long: the door's own limit. */
export const QUESTION_MAX = ASSISTANT_QUESTION_MAX;

/**
 * The first screen (the plan's section 8.10, Phase C's brief): what the assistant is for in the reader's role (the
 * status door says whether the tutor is theirs), that a conversation is the unit and nothing is remembered across
 * them, how long a conversation is kept; for a guardian, where the opt-out is (`optOutPath`, drawn as a link).
 */
export function firstScreenKeys(status: Pick<AssistantStatus, "tutor" | "optOutPath">): TranslationKey[] {
  return [
    "assistantUi.firstHelp",
    status.tutor ? "assistantUi.firstTutor" : "assistantUi.firstHelpOnly",
    "assistantUi.firstNotGeneral",
    "assistantUi.firstConversation",
    "assistantUi.firstKept",
    ...(status.optOutPath ? (["assistantUi.firstFamily"] as TranslationKey[]) : []),
  ];
}

/** The citation as the reader sees it: a book with its chapter, section and page, or the platform page a help entry names. */
export function citationLabel(c: AssistantCitation, t: Translate): string {
  if (c.kind === "HELP") return c.title;
  // The board by its short name: "Balbharati (Maharashtra State Bureau of …)" is "Balbharati" (the live walk of 10 Oct).
  const board = c.board.split(" (")[0]!.trim();
  const book = board && !c.book.toLowerCase().includes(board.toLowerCase()) ? `${board} · ${c.book}` : c.book;
  if (!c.chapter) return t("assistantUi.citationNoChapter", { book, page: c.page });
  return c.section ? t("assistantUi.citationSection", { book, chapter: c.chapter, section: c.section, page: c.page }) : t("assistantUi.citation", { book, chapter: c.chapter, page: c.page });
}

/**
 * Who may follow a book's citation off the platform (the coordinator's rule of 10 Oct 2026, under the owner's gate on
 * links off the platform for minors): members of staff who teach or run the school. A STUDENT, a PARENT and every
 * other role read the book, chapter, section and page as text.
 */
export const BOOK_LINK_ROLES: readonly string[] = ["TEACHER", "FACULTY", "HOD", "ADMIN", "PRINCIPAL"];

/**
 * The link a citation opens. A book's: for BOOK_LINK_ROLES only, the publisher's own copy of the chapter at the cited page, and only over https
 * (an answer never carries an address of its own; Phase B's answer gate discards one, so this is the one way off the
 * platform the panel offers, and it is the textbook the passage came from). A help entry's: the page on this
 * platform, and only a path on it.
 */
export function citationHref(c: AssistantCitation, role: string | null): { href: string; external: boolean } | null {
  if (c.kind === "HELP") {
    if (!c.pagePath || !c.pagePath.startsWith("/") || c.pagePath.startsWith("//")) return null;
    return { href: c.pagePath, external: false };
  }
  if (!role || !BOOK_LINK_ROLES.includes(role) || !c.sourceUrl) return null;
  let url: URL;
  try {
    url = new URL(c.sourceUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;
  if (c.page > 0 && !url.hash) url.hash = `page=${c.page}`;
  return { href: url.toString(), external: true };
}

/** The verdicts that are the model's words (after both gates); every other one is a fixed sentence the server wrote. */
export const MODEL_VERDICTS: readonly string[] = ["ANSWERED", "HINT"];
export const isFixedSentence = (m: Pick<AssistantMessage, "role" | "verdict">): boolean => m.role === "ASSISTANT" && !!m.verdict && !MODEL_VERDICTS.includes(m.verdict);

/**
 * What a screen reader hears, ONCE PER ANSWER (the plan's section 9.11): the whole answer when it is complete, never
 * the tokens as they stream. The streamed text is drawn in a region that is not live; this sentence is the only thing
 * put into the live region, and only when the door has answered.
 */
export function announcement(m: AssistantMessage | null, t: Translate): string {
  if (!m || m.role !== "ASSISTANT") return "";
  return t("assistantUi.announce", { answer: m.text });
}

/**
 * The streamed answer so far, from the person's own channel: the stage while it searches, writes and checks, then
 * the checked answer's pieces in order of `seq` (a piece that arrives twice or out of order is placed by its seq, so
 * the text never doubles). An event for another conversation (a second tab) is not this panel's.
 */
export type StreamState = { conversationId: string | null; stage: "SEARCHING" | "WRITING" | "CHECKING" | null; pieces: string[]; done: boolean };
export const streamIdle = (conversationId: string | null): StreamState => ({ conversationId, stage: null, pieces: [], done: false });
export function streamReduce(state: StreamState, event: AssistantEvent): StreamState {
  if (!state.conversationId || event.conversationId !== state.conversationId) return state;
  if (event.type === "assistant.stage") return { ...state, stage: event.stage };
  if (event.type === "assistant.delta") {
    const pieces = state.pieces.slice();
    pieces[event.seq] = event.text;
    return { ...state, pieces };
  }
  return { ...state, done: true };
}
export const streamText = (state: StreamState): string => state.pieces.map((p) => p ?? "").join("");
