/**
 * The pure parts of the quiz bank generator: every rule that needs no model and no database, so
 * tests/quiz-gen.test.ts can hold each one (docs/plans/assistant-and-quiz-bank.md, Phase 1).
 *
 *   - the ladder: the plan's six levels onto the bank's QUIZ_LEVELS (the identity, checked);
 *   - form checks on an item (the plan's third distractor check): option lengths and forms alike,
 *     no "all of the above", no option repeating the stem, no two distractors alike, one unit and
 *     precision, and the bank's own structural rules (four options, a worked solution, a checkExpr
 *     that computes and lands on the key);
 *   - the blind solver's verdict from its five answers;
 *   - near-duplicates by cosine similarity, against the served bank and within the batch;
 *   - chunk grouping for the drafting prompt and the chapter-to-topic match.
 */
import { evaluate, numberIn } from "../quiz-arith";
import { FIGURE_KINDS, LEVELS, type FigureSpec, type Level } from "./shape";

/* ---------------------------------------------------------------------------
   The ladder
   --------------------------------------------------------------------------- */

/**
 * The plan's ladder (1 recall, 2 understand, 3 apply, 4 analyse, 5 competitive, 6 olympiad) IS the
 * bank's scale (QUIZ_LEVELS in src/lib/quiz.ts: RECALL, UNDERSTAND, APPLY, ANALYSE, COMPETITIVE,
 * OLYMPIAD), level for level, so the mapping is the identity. It is still a function with a test
 * so that a change to either scale fails here rather than silently shifting every item a rung.
 */
export function ladderToBank(planLevel: number): Level {
  if (!Number.isInteger(planLevel) || planLevel < 1 || planLevel > 6) throw new Error(`level ${planLevel} is not on the ladder 1–6`);
  return planLevel as Level;
}

/* ---------------------------------------------------------------------------
   Form checks
   --------------------------------------------------------------------------- */

export type FormItem = {
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: string | null;
  distractorReason: (string | null)[];
  figure: Pick<FigureSpec, "kind" | "spec"> | null;
  imageAlt: string | null;
};

/** The wording of an item written with the passage in view, which the pupil never has. Exported: the pipeline rewrites a solution that carries it before the form checks refuse it. */
export const REFERS_TO_PASSAGE = /\b(the|this) (passage|text|excerpt|paragraph)\b|\baccording to the (passage|text|chapter|book|author)\b|\b(described|mentioned|stated|shown|given|explained) (above|in the text|in the passage|in the chapter)\b|\bthe (passage|text|chapter) (says|states|explains|mentions|describes)\b/i;

const CATCH_ALL = /\b(all|none|both|neither)\s+of\s+(the\s+)?(above|these|them)\b|\b(both|all)\s+\(?[a-d]\)?\s+and\s+\(?[a-d]\)?\b|\ball\s+options\b/i;

function normalise(s: string): string {
  return s
    .toLowerCase()
    .replace(/[−–—]/g, "-")
    .replace(/[^\p{L}\p{N}\s./-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.\s]+$/, "");
}

const STOP = new Set(["and", "the", "of", "in", "a", "an", "its", "their", "to", "on", "for", "with", "that", "which", "is", "are", "it"]);

export function words(s: string): string[] {
  return normalise(s).split(" ").filter((w) => w.length > 0);
}

/** A translated option or stem with a number, letter or bullet the model copied from the listing: the text alone. */
export function stripListMarker(s: string): string {
  return s.replace(/^\s*(?:\(?[0-9a-dA-D]\)?[.:)]|[-•*])\s+/, "").trim();
}

/**
 * The sentence-end rule of each language, applied after the model (which keeps forgetting it): Hindi
 * ends a statement with the danda and a question with "?" alone; Marathi ends with a full stop and
 * never a danda. A danda after a question mark goes in both.
 */
export function devanagariPunctuation(text: string, language: "hi" | "mr"): string {
  let t = text.replace(/\?\s*।/g, "?").replace(/।{2,}/g, "।");
  if (language === "mr") t = t.replace(/।/g, ".");
  return t.trim();
}

/** Jaccard similarity of two word sets. */
export function wordJaccard(a: string, b: string): number {
  const A = new Set(words(a));
  const B = new Set(words(b));
  if (A.size === 0 && B.size === 0) return 1;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / (A.size + B.size - both);
}

/** "12 cm", "0.5 kg", "−3": the number, the unit after it, and the decimals it is written to. */
export function numericForm(option: string): { value: number; unit: string; decimals: number } | null {
  const norm = option.replace(/[−–—]/g, "-").replace(/,/g, "").trim();
  const m = /^(-?\d+(?:\.\d+)?)(?:\s*(?:×|x)\s*10\^?-?\d+)?\s*([^\d\s][^\d]*)?$/.exec(norm);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  const decimals = m[1]!.includes(".") ? m[1]!.split(".")[1]!.length : 0;
  return { value, unit: (m[2] ?? "").trim().toLowerCase(), decimals };
}

/**
 * Every failure, in words a reviewer reads; an empty list means the item passed. Each rule is the
 * plan's or the bank's, named in its message.
 */
export function formChecks(item: FormItem): string[] {
  const out: string[] = [];
  const { choices, answerIndex } = item;
  if (!item.stem?.trim()) out.push("stem is empty");
  if (!Array.isArray(choices) || choices.length !== 4) {
    out.push(`needs exactly four options, has ${Array.isArray(choices) ? choices.length : 0}`);
    return out;
  }
  if (choices.some((c) => typeof c !== "string" || !c.trim())) out.push("has a blank option");
  if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex > 3) {
    out.push(`answerIndex ${answerIndex} does not point at an option`);
    return out;
  }
  if ((item.solution ?? "").trim().length < 20) out.push("solution is too short to be a worked solution (the bank's rule)");
  // The pupil never sees the passage the item was drafted from.
  if (REFERS_TO_PASSAGE.test(item.stem)) out.push("the stem refers to the passage or the text, which the pupil never sees");
  if (REFERS_TO_PASSAGE.test(item.solution)) out.push("the solution refers to the passage or the text, which the pupil never sees");

  // The catch-all forms the plan forbids.
  choices.forEach((c, i) => {
    if (CATCH_ALL.test(c)) out.push(`option ${i} is a catch-all ("${c}")`);
  });

  // No two options alike: identical after normalising, or nearly the same words (the bank refuses
  // identical strings; the plan refuses two distractors meaning the same thing).
  const norms = choices.map(normalise);
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      if (norms[i] === norms[j]) out.push(`options ${i} and ${j} are the same ("${choices[i]}")`);
      else if (words(choices[i]!).length >= 3 && wordJaccard(choices[i]!, choices[j]!) >= 0.8) out.push(`options ${i} and ${j} say the same thing ("${choices[i]}" / "${choices[j]}")`);
    }
  }

  // An option repeating the stem's wording gives the key away (or hides it): verbatim inside the
  // stem, or four content words or more of which nine tenths the stem already says.
  const stemNorm = normalise(item.stem);
  const stemWords = new Set(words(item.stem));
  choices.forEach((c, i) => {
    const n = normalise(c);
    const content = words(c).filter((w) => !STOP.has(w));
    const found = content.filter((w) => stemWords.has(w)).length;
    if ((words(c).length >= 3 && n.length >= 12 && stemNorm.includes(n)) || (content.length >= 4 && found / content.length >= 0.9)) out.push(`option ${i} repeats the stem's wording ("${c}")`);
  });

  // Length alike: a key that stands out by length is the oldest tell there is.
  const lengths = choices.map((c) => c.trim().length);
  const keyLength = lengths[answerIndex]!;
  const longestDistractor = Math.max(...lengths.filter((_, i) => i !== answerIndex));
  if (keyLength > 1.6 * longestDistractor && keyLength - longestDistractor > 20) out.push(`the key is far longer than every distractor (${keyLength} vs ${longestDistractor} characters)`);
  // Options vary two- or threefold in honest items ("It deflects" beside "It spins without stopping");
  // the rule catches a sentence beside a word, not that.
  const shortest = Math.min(...lengths);
  const longest = Math.max(...lengths);
  if (longest > 40 && longest > 5 * shortest) out.push(`option lengths are unalike (${shortest} to ${longest} characters)`);

  // Form alike: numeric options all numeric, in one unit, to one precision.
  const numeric = choices.map(numericForm);
  const numericCount = numeric.filter(Boolean).length;
  if (numericCount > 0 && numericCount < 4) out.push(`options mix numbers and words (${numericCount} of 4 are numbers)`);
  if (numericCount === 4) {
    const units = new Set(numeric.map((n) => n!.unit));
    if (units.size > 1) out.push(`options are in more than one unit (${[...units].map((u) => u || "none").join(", ")})`);
    const decimals = new Set(numeric.map((n) => n!.decimals));
    if (decimals.size > 1) out.push(`options are written to different precisions (${[...decimals].sort().join(" and ")} decimals)`);
    const values = numeric.map((n) => n!.value);
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (values[i] === values[j]) out.push(`options ${i} and ${j} are the same number`);
  }

  // A reason per distractor, none at the key.
  if (!Array.isArray(item.distractorReason) || item.distractorReason.length !== 4) out.push("distractorReason must have one entry per option");
  else {
    item.distractorReason.forEach((r, i) => {
      if (i === answerIndex) {
        if (r) out.push("the key carries a distractor reason");
      } else if (!r || r.trim().length < 4) out.push(`distractor ${i} has no reason`);
      else if (r.trim().length > 220 || /^\s*correct\b/i.test(r) || REFERS_TO_PASSAGE.test(r)) out.push(`distractor ${i}'s reason is not a one-line misconception ("${r.trim().slice(0, 60)}…")`);
    });
  }

  // The figure: a spec needs an alt and a known kind; an alt needs a spec. The books' drawings are
  // never cropped (the owner, 10 October 2026), so there is no image key to check here.
  if (item.figure) {
    if (!(FIGURE_KINDS as readonly string[]).includes(item.figure.kind)) out.push(`figure kind "${item.figure.kind}" is not one the figure builder draws`);
    if (!item.figure.spec || typeof item.figure.spec !== "object" || Object.keys(item.figure.spec).length === 0) out.push("figure has an empty spec");
    if (!item.imageAlt?.trim()) out.push("figure is set without imageAlt");
  } else if (item.imageAlt) out.push("imageAlt is set without a figure");

  // The bank's own arithmetic rule, the one real correctness check: an expression that computes and
  // lands where the key says. A bare literal is refused as the verifier refuses it.
  if (item.checkExpr) {
    if (!/[+\-*/^]/.test(item.checkExpr)) out.push(`checkExpr "${item.checkExpr}" is a bare literal`);
    else {
      const expected = evaluate(item.checkExpr);
      if (expected === null) out.push(`checkExpr "${item.checkExpr}" is not arithmetic the bank can evaluate`);
      else {
        const stated = numberIn(choices[answerIndex]!);
        if (stated === null) out.push(`checkExpr is set but the key "${choices[answerIndex]}" states no number`);
        else if (Math.abs(stated - expected) > 1e-6 * Math.max(1, Math.abs(expected))) out.push(`ARITHMETIC MISMATCH — checkExpr "${item.checkExpr}" = ${expected}, but the key says ${stated}`);
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------
   The blind solver's verdict
   --------------------------------------------------------------------------- */

export type SolverVerdict = {
  correct: number;
  picks: number[];
  /** The item is refused: a distractor was picked more often than the key (the key is wrong or the stem ambiguous). */
  reject: string | null;
  /** The level disagrees with the record; kept, flagged for the reviewer. */
  levelFlag: string | null;
  /** Distractor indexes no run picked. */
  unpicked: number[];
};

/**
 * Five answers, one verdict (the plan's "measured, not trusted"):
 *   - a distractor picked more often than the key rejects the item;
 *   - at levels 1–2 the solver should get it right: two misses or more flag the level (one miss at
 *     sampling temperature is noise, not a signal);
 *   - at levels 4–6 the solver should not get it right every time with no working: five of five flags it;
 *   - the distractors nobody picked are listed; whether one is replaced is the critique's call too
 *     (a reason that is a real misconception keeps it).
 */
export function solverVerdict(level: Level, answerIndex: number, answers: number[]): SolverVerdict {
  const picks = [0, 0, 0, 0];
  for (const a of answers) if (Number.isInteger(a) && a >= 0 && a < 4) picks[a]!++;
  const correct = picks[answerIndex]!;
  let reject: string | null = null;
  for (let i = 0; i < 4; i++) {
    if (i !== answerIndex && picks[i]! > correct) {
      reject = `the solver picked option ${i} ${picks[i]} times against the key's ${correct}: the key is wrong or the stem is ambiguous`;
      break;
    }
  }
  let levelFlag: string | null = null;
  const n = answers.length;
  if ((level === 1 || level === 2) && n - correct >= 2) levelFlag = `level ${level} but the solver missed it ${n - correct} of ${n} times`;
  if (level >= 4 && n > 0 && correct === n) levelFlag = `level ${level} but the solver got it right ${n} of ${n} times without the working`;
  const unpicked = [0, 1, 2, 3].filter((i) => i !== answerIndex && picks[i] === 0);
  return { correct, picks, reject, levelFlag, unpicked };
}

/* ---------------------------------------------------------------------------
   Near-duplicates
   --------------------------------------------------------------------------- */

/** Two stems whose embeddings sit this close are the same question in other words. */
export const DUPLICATE_THRESHOLD = 0.9;

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) throw new Error("cosine over vectors of different length");
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / Math.sqrt(na * nb);
}

export type Duplicate = { index: number; against: string; similarity: number };

/**
 * Which batch items to drop: one too close to a served question (by the bank question's id) or to an
 * EARLIER batch item (the first of a pair stays). Pure over vectors; the caller embeds.
 */
export function nearDuplicates(batch: number[][], bank: { id: string; vector: number[] }[], threshold = DUPLICATE_THRESHOLD): Duplicate[] {
  const out: Duplicate[] = [];
  const dropped = new Set<number>();
  batch.forEach((v, i) => {
    for (const b of bank) {
      const s = cosine(v, b.vector);
      if (s >= threshold) {
        out.push({ index: i, against: `bank:${b.id}`, similarity: s });
        dropped.add(i);
        return;
      }
    }
    for (let j = 0; j < i; j++) {
      if (dropped.has(j)) continue;
      const s = cosine(v, batch[j]!);
      if (s >= threshold) {
        out.push({ index: i, against: `batch:${j}`, similarity: s });
        dropped.add(i);
        return;
      }
    }
  });
  return out;
}

/* ---------------------------------------------------------------------------
   Chunk groups and the topic match
   --------------------------------------------------------------------------- */

export type ChunkLike = { ordinal: number; tokens: number; text: string; figureKeys: string[] };

/**
 * Consecutive chunks folded into groups of about `maxTokens` (the drafting prompt reads one group;
 * the chat server's context is 8k, the rubrics take about 1,200, the answer up to 3,500). A chunk
 * larger than the budget stands alone.
 */
export function groupChunks<T extends ChunkLike>(chunks: T[], maxTokens = 1800): T[][] {
  const groups: T[][] = [];
  let current: T[] = [];
  let size = 0;
  for (const c of [...chunks].sort((a, b) => a.ordinal - b.ordinal)) {
    if (current.length && size + c.tokens > maxTokens) {
      groups.push(current);
      current = [];
      size = 0;
    }
    current.push(c);
    size += c.tokens;
  }
  if (current.length) groups.push(current);
  return groups;
}

/** How many items each level gets when `limit` is spread over the six rungs: the remainder goes to the low rungs first. */
export function perLevelTargets(limit: number, perLevel: number): Record<Level, number> {
  const out = {} as Record<Level, number>;
  if (limit <= 0) {
    for (const l of LEVELS) out[l] = perLevel;
    return out;
  }
  const base = Math.floor(limit / 6);
  let rest = limit - base * 6;
  for (const l of LEVELS) {
    out[l] = Math.min(perLevel, base + (rest > 0 ? 1 : 0));
    if (rest > 0) rest--;
  }
  return out;
}

/** "Chapter 4 — Materials: Metals and Non-Metals" → 4; "3. Force and Pressure" → 3; null when none. */
export function chapterNumberOf(chapter: string): number | null {
  const m = /^(?:chapter|unit)?\s*(\d{1,2})\s*[:.—–-]/i.exec(chapter.trim()) ?? /^(?:chapter|unit)\s+(\d{1,2})\b/i.exec(chapter.trim());
  return m ? Number(m[1]) : null;
}

/** The chapter's name without its label: "Chapter 4: — Electricity: Magnetic and Heating Effects" → "Electricity: Magnetic and Heating Effects". */
export function chapterNameOf(chapter: string): string {
  return chapter
    .trim()
    .replace(/^(?:chapter|unit)?\s*\d{1,2}\s*[:.]?\s*[—–-]?\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}


function contentWords(s: string): Set<string> {
  return new Set(words(s).filter((w) => !STOP.has(w) && w.length > 1));
}

export type ExistingTopic = { slug: string; chapter: string; name: string; position: number; retired: boolean };

/**
 * The bank's topic for a chapter, by subject and class (the caller's query), then by the chapter's
 * NUMBER and its NAME together: the number alone would send Curiosity's chapter 4 (electricity) into
 * the old book's chapter 4 (metals). Three fifths of the name's content words must match.
 */
export function matchTopic(existing: ExistingTopic[], chapterNumber: number | null, chapterName: string): ExistingTopic | null {
  const want = contentWords(chapterName);
  let best: { topic: ExistingTopic; score: number } | null = null;
  for (const t of existing) {
    if (t.retired) continue;
    const have = contentWords(`${chapterNameOf(t.chapter)} ${t.name}`);
    let both = 0;
    for (const w of want) if (have.has(w)) both++;
    const score = want.size ? both / want.size : 0;
    const numberAgrees = chapterNumber === null || chapterNumberOf(t.chapter) === null || chapterNumberOf(t.chapter) === chapterNumber;
    if (score >= 0.6 && numberAgrees && (!best || score > best.score)) best = { topic: t, score };
  }
  return best?.topic ?? null;
}

/** Lowercase-with-hyphens, the bank's SLUG_RE. */
export function slugify(s: string, max = 60): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/g, "");
}

/**
 * A new topic's slug. NCERT keeps the bank's own convention (`science-8-friction`: the bank was
 * written against NCERT); another board is prefixed, because QuizTopic carries no board column and
 * "science-8-force-and-pressure" from Balbharati would otherwise sit beside NCERT's as a twin.
 */
export function newTopicSlug(board: string, subject: string, classLevel: number, chapterName: string): string {
  const prefix = /^ncert/i.test(board) ? "" : `${slugify(board.split(/[\s(]/)[0] ?? board)}-`;
  return `${prefix}${subject.toLowerCase()}-${classLevel}-${slugify(chapterName, 40)}`;
}
