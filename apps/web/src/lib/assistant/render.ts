/**
 * RETRIEVAL IN THE QUESTION'S LANGUAGE (docs/plans/vidura.md, the owner's decision 4; pass 2, 17 Oct 2026): a Hindi or
 * Marathi question is rendered into English by the local model FOR RETRIEVAL ONLY. The help index, the person's doors
 * and the curriculum (English books) are searched with the rendering beside the question itself; the classifier, the
 * prompt and the answer still read the person's own words, and the answer is written in the question's language.
 *
 *   - The rendering is made from the STRIPPED question (strip.ts): names, ids and codes never reach it.
 *   - It is cached per normalised question (lower case, one space, no closing mark), so the same question asked again
 *     costs no model call.
 *   - A failure (the endpoint down or slow, an answer that is not English, too long, or carrying a line break) is
 *     `null`, and the question is searched exactly as before pass 2.
 *   - What the model writes is used as a search query and nothing else: never shown, never in a prompt.
 *
 * Pure but for the port it is handed (`chat`), so the tests drive it with a fake.
 */
import type { AssistantLanguage } from "@edulink/contracts";
import type { ChatMessage, ChatOptions, ChatResult } from "../assistant-model";
import { renderQuestionMessages } from "./prompt";

/** The rendering call's dials: short, deterministic, and quicker than the classifier's own timeout. */
export const RENDER_MAX_TOKENS = 96;
export const RENDER_TIMEOUT_MS = 6_000;
/** A rendering longer than this is not a question rendered; refused. */
export const RENDER_MAX_CHARS = 400;
const CACHE_MAX = 2_000;

export type Rendered = { text: string; tokens: number; cached: boolean };

const CACHE = new Map<string, string>();

/** The cache's key: the language and the question in one normal form. Pure. */
export function renderKey(question: string, language: AssistantLanguage): string {
  return `${language}|${question.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim().replace(/[\s?？!।.]+$/u, "")}`;
}

/** For the tests: the cache as it stands, and a way to empty it. */
export const renderCache = { size: () => CACHE.size, clear: () => CACHE.clear() };

/** The rendering's prompt lives with every other instruction the model reads (prompt.ts, the one channel). */
export const renderMessages = renderQuestionMessages;

/** Is what the model wrote a usable English rendering? Pure. */
export function cleanRendering(raw: string): string | null {
  const text = raw.trim().replace(/^["'“”‘’`]+|["'“”‘’`]+$/g, "").replace(/^(?:english|rendering|translation)\s*:\s*/i, "").trim();
  if (!text || text.length > RENDER_MAX_CHARS || /\n/.test(text)) return null;
  const deva = (text.match(/[ऀ-ॿ]/g) ?? []).length;
  const latin = (text.match(/[A-Za-z]/g) ?? []).length;
  // Mostly Devanagari is no rendering at all (the model echoed the question); a stray term in brackets is fine.
  if (latin < 3 || deva > latin / 4) return null;
  return text;
}

/**
 * The English rendering of a Hindi or Marathi question, for retrieval; null for English, on any failure, and for a
 * question with nothing to render. Never throws.
 */
export async function renderForSearch(
  question: string,
  language: AssistantLanguage,
  model: { chat: (messages: ChatMessage[], opts: ChatOptions) => Promise<ChatResult> },
): Promise<Rendered | null> {
  if (language === "en" || !/[ऀ-ॿ]/.test(question)) return null;
  const key = renderKey(question, language);
  const hit = CACHE.get(key);
  if (hit !== undefined) return { text: hit, tokens: 0, cached: true };
  try {
    const res = await model.chat(renderMessages(question, language), { maxTokens: RENDER_MAX_TOKENS, temperature: 0, timeoutMs: RENDER_TIMEOUT_MS });
    const text = cleanRendering(res.content);
    if (!text) return null;
    if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value!);
    CACHE.set(key, text);
    return { text, tokens: (res.usage?.promptTokens ?? 0) + (res.usage?.completionTokens ?? 0), cached: false };
  } catch {
    return null;
  }
}

/**
 * Two searches of the help index (or of the doors' entries) as one list: the question's own, in its language and
 * English, and the rendering's, in English. Merged by reciprocal rank on the entry, each hit keeping its better
 * similarity; a hit found by the rendering is put on the question's language's scale first (`shift`: the English
 * threshold above that language's, so a rendered hit must clear the English bar to clear the question's), and the
 * gate's thresholds read the merged list unchanged. Pure.
 */
export function mergeRendered<T extends { entryId: string; similarity: number | null }>(own: T[], rendered: T[], shift: number, k = 60): T[] {
  if (!rendered.length) return own;
  const merged = new Map<string, { hit: T; score: number; similarity: number | null }>();
  const add = (list: T[], adjust: number) =>
    list.forEach((hit, i) => {
      const sim = hit.similarity === null ? null : hit.similarity - adjust;
      const got = merged.get(hit.entryId);
      if (!got) merged.set(hit.entryId, { hit, score: 1 / (k + i + 1), similarity: sim });
      else {
        got.score += 1 / (k + i + 1);
        if (sim !== null && (got.similarity === null || sim > got.similarity)) got.similarity = sim;
      }
    });
  add(own, 0);
  add(rendered, Math.max(0, shift));
  return [...merged.values()].sort((a, b) => b.score - a.score || a.hit.entryId.localeCompare(b.hit.entryId)).map((m) => ({ ...m.hit, similarity: m.similarity }));
}
