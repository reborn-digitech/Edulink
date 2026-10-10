/**
 * STRIPPING, IN AND OUT (the owner's rule 5). Everything that reaches the model — the person's own
 * question, a door's answer, a teacher's text — has names, ids, codes, e-mails, phone numbers and links
 * replaced by placeholders; the conversation row keeps the original for the person to re-read. On the
 * way out, `answerProblems` finds what an answer must never carry (gate.ts discards it).
 *
 * Names come from a lexicon the service builds for the person (lexicon.ts: their own name, their
 * school's name, the people of their school), plus the shapes "my friend Asha", "Asha ma'am". A name
 * the lexicon does not hold and no shape gives away is not found: that is the honest limit, and the
 * answer gate's own check is the second line. Pure: tests/assistant-strip.test.ts.
 */

export type NameKind = "SELF" | "PERSON" | "SCHOOL";
export type NameEntry = { name: string; kind: NameKind };
export type Replacement = { placeholder: string; original: string; kind: "SELF" | "PERSON" | "SCHOOL" | "EMAIL" | "PHONE" | "LINK" | "ID" | "CODE" };
export type Stripped = { text: string; replacements: Replacement[] };

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const URL_FULL = /\b(?:https?:\/\/|www\.)[^\s<>"')\]]+/gi;
const URL_BARE = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|in|org|net|io|co|edu|gov|app|xyz|info|me|ly|gg|tv|online|site|link|ai)\b(?:\/[^\s<>"')\]]*)?/gi;
/** Ten or more digits, spaces and dashes allowed between: a phone number, an Aadhaar, a PEN. A schoolbook number is shorter. */
const LONG_NUMBER = /(?<![\d.])\+?\d(?:[\s-]?\d){9,}(?![\d.])/g;
/** A cuid, the form of every id on the platform. */
const CUID = /\bc[a-z0-9]{20,30}\b/g;
/** A serial or code with separators carrying at least three digits and two capital letters: TC/2025–26/0001, ZZN-7Q2K-91. */
const CODE_SEPARATED = /\b[A-Z0-9]+(?:[/–-][A-Z0-9]+){1,4}\b/g;
const CHEMICAL_FORMULA = /^(?:\(?[A-Z][a-z]?\d*\)?\d*)+$/;

function isCode(token: string): boolean {
  if (CHEMICAL_FORMULA.test(token)) return false;
  const digits = (token.match(/\d/g) ?? []).length;
  const capitals = (token.match(/[A-Z]/g) ?? []).length;
  return digits >= 3 && capitals >= 2;
}

/** Words that look like names after "my friend …" but are not: "my friend said", "my teacher told". */
const NOT_A_NAME = new Set(["said", "says", "told", "asked", "and", "is", "was", "has", "had", "the", "who", "from", "in", "at", "will", "can", "does", "did", "gave", "wants", "thinks"]);
const RELATION_BEFORE = /\b(?:my|our)\s+(?:friend|classmate|teacher|brother|sister|cousin|neighbou?r|sir|madam|bhaiya|didi|tai|dada|mentor)\s+([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)/g;
const HONORIFIC_AFTER = /\b([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,})?)\s+(?:sir|madam|ma'am|maam|miss|teacher|ji|tai|dada)\b/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A name as a whole word, any case; Devanagari edges are spaces and punctuation. */
function namePattern(name: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{M}\\p{N}])${escapeRegExp(name)}(?![\\p{L}\\p{M}\\p{N}])`, "giu");
}

/** The lexicon's names, the full name and each given name of four letters or more, longest first. */
export function expandLexicon(entries: NameEntry[]): NameEntry[] {
  const out = new Map<string, NameEntry>();
  for (const e of entries) {
    const full = e.name.trim().replace(/\s+/g, " ");
    if (full.length < 3) continue;
    if (!out.has(full.toLowerCase()) || e.kind === "SELF") out.set(full.toLowerCase(), { name: full, kind: e.kind });
    if (e.kind === "SCHOOL") continue;
    // The given name alone ("Asha" of "Asha Patil"); a surname alone is not taken: "Gandhi" is a chapter, not only a pupil.
    const given = full.split(" ")[0]!;
    if (given.length >= 4 && given !== full && (!out.has(given.toLowerCase()) || e.kind === "SELF")) out.set(given.toLowerCase(), { name: given, kind: e.kind });
  }
  return [...out.values()].sort((a, b) => b.name.length - a.name.length);
}

/**
 * Replace every identifier in `text` with a placeholder: [YOU] for the person's own name, [SCHOOL],
 * [PERSON_1]…, [EMAIL_1]…, [PHONE_1]…, [LINK_1]…, [ID_1]…, [CODE_1]…. The same original gets the same
 * placeholder throughout.
 */
export function stripIdentifiers(text: string, lexicon: NameEntry[] = []): Stripped {
  const replacements: Replacement[] = [];
  const counters: Record<string, number> = {};
  const placeholderFor = (original: string, kind: Replacement["kind"]): string => {
    const seen = replacements.find((r) => r.original.toLowerCase() === original.toLowerCase() && r.kind === kind);
    if (seen) return seen.placeholder;
    let placeholder: string;
    if (kind === "SELF") placeholder = "[YOU]";
    else if (kind === "SCHOOL") placeholder = "[SCHOOL]";
    else placeholder = `[${kind}_${(counters[kind] = (counters[kind] ?? 0) + 1)}]`;
    replacements.push({ placeholder, original, kind });
    return placeholder;
  };
  let out = text;
  out = out.replace(EMAIL, (m) => placeholderFor(m, "EMAIL"));
  out = out.replace(URL_FULL, (m) => placeholderFor(m, "LINK"));
  out = out.replace(URL_BARE, (m) => placeholderFor(m, "LINK"));
  out = out.replace(CUID, (m) => placeholderFor(m, "ID"));
  out = out.replace(LONG_NUMBER, (m) => placeholderFor(m, "PHONE"));
  out = out.replace(CODE_SEPARATED, (m) => (isCode(m) ? placeholderFor(m, "CODE") : m));
  for (const entry of expandLexicon(lexicon)) {
    out = out.replace(namePattern(entry.name), (m) => placeholderFor(m, entry.kind));
  }
  const shaped = (m: string, name: string) => {
    const first = name.split(" ")[0]!;
    if (NOT_A_NAME.has(first.toLowerCase())) return m;
    return m.replace(name, placeholderFor(name, "PERSON"));
  };
  out = out.replace(RELATION_BEFORE, shaped);
  out = out.replace(HONORIFIC_AFTER, shaped);
  return { text: out, replacements };
}

/** The person's own name put back where the model wrote [YOU]; every other placeholder stays (and the answer gate refuses it). */
export function restoreSelf(text: string, replacements: Replacement[], fallback: string): string {
  const self = replacements.find((r) => r.kind === "SELF");
  return text.replace(/\[YOU\]/g, self ? self.original.split(" ")[0]! : fallback);
}

export type AnswerProblem = "LINK" | "EMAIL" | "PHONE" | "ADDRESS" | "NAME" | "PLACEHOLDER";

const ADDRESS_PATTERNS = [
  /\b(?:house|flat|plot|room|door|shop)\s*(?:no\.?|number|#)\s*\d+/i,
  /\b\d+[\s,/-]+(?:[A-Za-z]+\s){0,3}(?:road|rd\.?|street|st\.?|lane|nagar|colony|marg|chowk|society|apartments?|sector)\b/i,
  /\b(?:pin ?code|pincode)\b[\s:-]*\d{6}\b/i,
  /\b(?:road|street|lane|nagar|colony|marg)\b[^.\n]{0,40}\b[1-8]\d{5}\b/i,
  /(?:मकान|फ़्लैट|फ्लैट|घर)\s*(?:नं|नंबर|क्रमांक)\.?\s*\d+/,
  /(?:पिन ?कोड|पिनकोड)\s*[:-]?\s*\d{6}/,
  /\d+\s*,?\s*[\p{L}\p{M}\s]{0,30}(?:मार्ग|रोड|गली|गल्ली|कॉलनी|सोसायटी)/u,
];

/**
 * What an answer must not carry (the owner's rule 3): a link off the platform (a path such as
 * /admin/people is fine), an e-mail, a phone number, an address, a person's name from the lexicon that
 * is not in the passages the answer was built from (a textbook's Shivaji is the book's; a classmate
 * named Shivaji is not), or a placeholder other than [YOU].
 */
export function answerProblems(answer: string, lexicon: NameEntry[], allowedText: string): AnswerProblem[] {
  const problems = new Set<AnswerProblem>();
  if (new RegExp(URL_FULL.source, "i").test(answer) || new RegExp(URL_BARE.source, "i").test(answer)) problems.add("LINK");
  if (new RegExp(EMAIL.source).test(answer)) problems.add("EMAIL");
  if (new RegExp(LONG_NUMBER.source).test(answer)) problems.add("PHONE");
  if (ADDRESS_PATTERNS.some((p) => p.test(answer))) problems.add("ADDRESS");
  if (/\[(?:PERSON|SCHOOL|EMAIL|PHONE|LINK|ID|CODE)(?:_\d+)?\]/.test(answer)) problems.add("PLACEHOLDER");
  const allowed = allowedText.toLowerCase();
  for (const entry of expandLexicon(lexicon)) {
    if (entry.kind !== "PERSON") continue;
    if (namePattern(entry.name).test(answer) && !namePattern(entry.name).test(allowed)) {
      problems.add("NAME");
      break;
    }
  }
  return [...problems];
}
