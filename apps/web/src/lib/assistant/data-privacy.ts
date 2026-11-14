/**
 * ANOTHER PERSON'S RECORD IS NEVER ASKED FOR BY NAME (the owner's decision 3 of 10 October 2026, privacy
 * unchanged). The data questions read only doors the person may already open, so another pupil's marks never
 * reach the model; but a question that names someone of the school ("what are Kiara's marks in maths?") must
 * not be answered with the asker's OWN record either, as if it were the other pupil's. Such a question is
 * refused with PERSONAL_DATA's fixed sentence before anything is searched. A guardian naming their own child is
 * asking about their own child; a person naming a teacher in a messages question ("did Mrs Rao reply") is not
 * asking for a record. Pure: tests/assistant-data.test.ts.
 */
import type { NameEntry } from "./strip";
import { bareNameSignalled, expandLexicon, RECORD_WORDS } from "./strip";

function pattern(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{M}\\p{N}])`, "iu");
}

/**
 * Does the question name a person of the school (the lexicon's PERSON entries, a given name or the whole name)
 * other than the asker's own children, beside a word of a person's record? Pure.
 */
export function asksAnotherPersonsRecord(question: string, lexicon: NameEntry[], ownChildren: readonly string[] = []): boolean {
  if (!RECORD_WORDS.test(question.toLowerCase())) return false;
  const own = expandLexicon(ownChildren.map((name) => ({ name, kind: "SELF" as const }))).map((e) => e.name.toLowerCase());
  for (const entry of expandLexicon(lexicon)) {
    if (entry.kind !== "PERSON") continue;
    if (own.includes(entry.name.toLowerCase())) continue;
    if (namesThePerson(question, entry.name, lexicon)) return true;
  }
  return false;
}

/**
 * TA-018 (decision 0005 as amended on 14 November 2026): a whole name names the person wherever it stands, as before; a
 * bare given name (one word: "Shivaji" of "Shivaji Jadhav", "Mark" of "Mark Dsouza") only with a second signal
 * (strip.ts bareNameSignalled): the full name in the question, a shape such as "my friend X" or "X ma'am", or a
 * possessive beside a record word ("Mark's marks", "Kiara ki attendance", "the fee for Kiara"). "Which exam has the
 * chapter on Shivaji?" and "How do I mark attendance?" ask for nobody's record. Pure.
 */
function namesThePerson(question: string, name: string, lexicon: NameEntry[]): boolean {
  if (/\s/.test(name)) return pattern(name).test(question);
  for (const m of question.matchAll(new RegExp(pattern(name).source, "giu"))) {
    if (bareNameSignalled(question, m.index ?? 0, m[0], lexicon)) return true;
  }
  return false;
}

/** The guardian's child the question names (by a given name or the whole name), or null. Pure. */
export function childNamed<T extends { names: string[] }>(question: string, children: readonly T[]): T | null {
  const hits = children.filter((c) => c.names.some((n) => expandLexicon([{ name: n, kind: "SELF" }]).some((e) => pattern(e.name).test(question))));
  return hits.length === 1 ? hits[0]! : null;
}

/**
 * A guardian's own child named in the question becomes "your child" in what the model reads ("how much of Rohan's
 * fee is overdue" → "how much of your child's fee is overdue"): stripped to a placeholder instead, the model wrote
 * the placeholder back and the answer gate discarded the answer. Which child is meant is the router's (childNamed). Pure.
 */
export function ownChildrenAsWords(question: string, childNames: readonly string[]): string {
  let out = question;
  for (const e of expandLexicon(childNames.map((name) => ({ name, kind: "SELF" as const })))) out = out.replace(new RegExp(pattern(e.name).source, "giu"), "your child");
  return out;
}
