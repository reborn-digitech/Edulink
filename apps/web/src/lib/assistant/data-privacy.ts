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
import { expandLexicon } from "./strip";

/** What a person's record is made of, in en, hi and mr: what another person's name beside it asks for. */
const RECORD_WORDS =
  /\b(?:marks?|scores?|results?|report ?cards?|grades?|percent(?:age)?|rank|attendance|absent|absences?|present|fees?|dues|paid|homework|assignments?|health|incidents?|address|phone|number|record|certificates?|timetable|exams?|leave)\b|अंक|नंबर|परिणाम|रिपोर्ट कार्ड|हाज़िरी|हाजिरी|उपस्थिति|फीस|शुल्क|गृहकार्य|पता|फोन|गुण|मार्क्स|निकाल|उपस्थिती|हजेरी|फी(?![ऀ-ॿ])|पत्ता|प्रगती/;

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
    if (pattern(entry.name).test(question)) return true;
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
