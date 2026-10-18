import "server-only";
import type { AssistantCitation, AssistantLanguage } from "@edulink/contracts";
import { db } from "../db";
import type { Role } from "../constants";

/**
 * THE STANDARD ANSWERS' TWO READS FOR THE SERVICE (Vidura pass 3, 18 Oct 2026; standard.ts has the operator's desk):
 * the checked answer for a role, language and question key, and a serving counted on it. Kept apart from standard.ts,
 * which asks through the service, so the service can import these without a cycle.
 */

/** A stored citations column read back; anything unreadable is none. */
export function citationsOf(json: string): AssistantCitation[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    return Array.isArray(parsed) ? (parsed as AssistantCitation[]) : [];
  } catch {
    return [];
  }
}

const POLITE_START = /^(?:please|pls|plz|kindly|कृपया|कृपा करके|कृपा करून)\s+/u;
const POLITE_END = /\s+(?:please|pls|plz|कृपया)$/u;

/**
 * A question's normal form, per language: one Unicode form, lower case, the marks of a sentence gone (? ! . , ; : । ॥
 * quotes and brackets), one space, a "please" at either end dropped, and — in English — "how can I", "how should I"
 * and "how to" read as "how do I", "where can I" and "where should I" as "where do I". Two questions with one normal
 * form are served one standard answer. Pure.
 */
export function questionKey(question: string, language: AssistantLanguage): string {
  let q = question
    .normalize("NFC")
    .toLowerCase()
    .replace(/[?？!¡.,;:।॥"'“”‘’`()[\]{}<>]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (let i = 0; i < 2; i++) q = q.replace(POLITE_START, "").replace(POLITE_END, "").trim();
  if (language === "en") {
    q = q
      .replace(/^how (?:can|should|could|would) i\b/, "how do i")
      .replace(/^how to\b/, "how do i")
      .replace(/^where (?:can|should|could) i\b/, "where do i");
  }
  return `${language}|${q}`;
}

/** The service's port (service.ts `standardAnswer`): the checked, unrevoked answer for this role, language and key, newest checked first. */
export async function findStandardAnswer(q: { role: Role; language: AssistantLanguage; question: string }): Promise<{ id: string; text: string; citations: AssistantCitation[] } | null> {
  const row = await db.cachedAnswer.findFirst({
    where: { role: q.role, language: q.language, questionKey: questionKey(q.question, q.language), checkedAt: { not: null }, revokedAt: null },
    orderBy: { checkedAt: "desc" },
    select: { id: true, text: true, citationsJson: true },
  });
  return row ? { id: row.id, text: row.text, citations: citationsOf(row.citationsJson) } : null;
}

/** A serving counted on the answer (its hits); the school's count is the usage row's (service.ts). */
export async function countStandardHit(id: string, now = new Date()): Promise<void> {
  await db.cachedAnswer.updateMany({ where: { id }, data: { hitCount: { increment: 1 }, lastHitAt: now } });
}
