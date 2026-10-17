/**
 * VIDURA PASS 1 (docs/plans/vidura.md; 17 October 2026): the small pure rules the service, the doors and the tests
 * share — which mode an answer wears, what a person's pick of mode asks of the gate, when a question points at the
 * page the drawer is beside, when an answer says it is not sure, and when "go on" asks for the rest of a cut answer.
 * Pure: no database, no network (tests/vidura.test.ts).
 */
import type { AssistantChip, AssistantVerdict } from "@edulink/contracts";
import type { RolePolicy } from "./policy";
import { helpKind } from "./prompt";

/**
 * The chip a stored answer wears. The message row's `mode` column holds the chip since pass 1 (USING, RECORDS,
 * LEARNING); a row from before holds HELP or TUTOR, read as USING and LEARNING. A fixed sentence wears none.
 */
export function chipOf(stored: string | null | undefined): AssistantChip | null {
  if (stored === "USING" || stored === "RECORDS" || stored === "LEARNING") return stored;
  if (stored === "HELP") return "USING";
  if (stored === "TUTOR") return "LEARNING";
  return null;
}

/** The contract's older field, kept for the clients that read it: which job answered. */
export function jobOf(stored: string | null | undefined): "HELP" | "TUTOR" | null {
  const chip = chipOf(stored);
  return chip === null ? null : chip === "LEARNING" ? "TUTOR" : "HELP";
}

/** The modes a person may pick: USING for every role with help, RECORDS with their own data, LEARNING for the tutor's roles. */
export function modesFor(policy: Pick<RolePolicy, "help" | "data" | "tutor">): AssistantChip[] {
  return [...(policy.help ? (["USING"] as const) : []), ...(policy.help && policy.data ? (["RECORDS"] as const) : []), ...(policy.tutor ? (["LEARNING"] as const) : [])];
}

/** What a pick of mode asks of the gate (gate.ts `prefer`): the scope it prefers, never more. */
export function preferFor(chip: AssistantChip | null | undefined): "PLATFORM" | "CURRICULUM" | null {
  if (chip === "LEARNING") return "CURRICULUM";
  if (chip === "USING" || chip === "RECORDS") return "PLATFORM";
  return null;
}

/**
 * A question that points at the page the person is on ("how do I do this?", "what is this page for", "यहाँ क्या
 * करूँ", "हे पान कसे वापरावे"): short, and with a word for "this" or "here". Only such a question is read against the
 * page's help card and the person's data shown there; any other question is answered as if asked from nowhere.
 */
export function asksAboutThisPage(question: string): boolean {
  const q = question.toLowerCase().trim();
  if (!q || q.split(/\s+/).length > 14) return false;
  if (/(?<![\w.:/-])\/[a-z]/.test(q)) return false;
  return /\b(?:this|these|here)\b/.test(q) || /(?<![\p{L}\p{M}])(?:यह|ये|इस|इसे|इसमें|इसका|इसकी|यहाँ|यहां|हे|हा|ही|या|इथे|येथे|यात|याचा|याची|याचे)(?![\p{L}\p{M}])/u.test(q);
}

/**
 * An answer that says it could not find what was asked ("I am not sure", "मुझे पक्का नहीं पता", "मला खात्री नाही"):
 * an empty answer, which offers "Ask a person" as a refusal does.
 */
export function saysNotSure(text: string): boolean {
  return /\b(?:not sure|i don't know|i do not know|can't find|cannot find|could not find|couldn't find|no information|not able to find|unable to find)\b|पक्का नहीं|निश्चित नहीं|पता नहीं|जानकारी नहीं|नहीं मिली|नहीं मिला|खात्री नाही|माहित नाही|माहिती नाही|सापडली नाही|सापडले नाही/i.test(text);
}

/** The person typed "go on" ("continue", "आगे बताइए", "पुढे सांगा") rather than pressing it. */
export function asksToGoOn(text: string): boolean {
  const q = text.toLowerCase().trim().replace(/[.!?।]+$/, "");
  return /^(?:go on|continue|carry on|keep going|more|tell me more|and then|आगे|आगे बताइए|आगे बताओ|आगे बताएँ|जारी रखें|और बताइए|पुढे|पुढे सांगा|पुढे सांग|सुरू ठेवा|अजून सांगा)$/.test(q);
}

/**
 * The verdicts on which "Ask a person" is offered: every fixed sentence that is a refusal or a sentence saying what
 * Vidura is for, but never the counsellor routes (the pupil is already given a helpline and an adult is told), an
 * injection, or the model being down (asking again is the way on).
 */
const NO_PERSON: readonly AssistantVerdict[] = ["ANSWERED", "HINT", "SELF_HARM", "ABUSE_DISCLOSURE", "INJECTION", "MODEL_UNAVAILABLE"];
export function offersAskPerson(verdict: AssistantVerdict | null, text: string): boolean {
  if (!verdict) return false;
  if (verdict === "ANSWERED") return saysNotSure(text);
  return !NO_PERSON.includes(verdict);
}

/**
 * A platform answer's chip: "My records" when it is the person's own figures — data was read and the question is not
 * a how-to or a where-is a guide passage answers (the live walk of 17 Oct 2026: "how do I issue a book" wore My
 * records because a door had been read beside the guide) — or when the person picked "My records" and data was read;
 * "Using Shalaghar" otherwise.
 */
export function helpChip(input: { data: number; passages: number; prefer: AssistantChip | null; question: string }): "USING" | "RECORDS" {
  if (!input.data) return "USING";
  return input.prefer === "RECORDS" || !input.passages || helpKind(input.question) === "OTHER" ? "RECORDS" : "USING";
}
