/**
 * A past paper's pages to chunks, one numbered question per chunk (the papers source, 10 October 2026;
 * docs/runbooks/assistant-local.md §8). Pure: no file, no database, so the tests can call it.
 *
 * A book is cut by chapter and section (scripts/corpus-chunk.ts); a paper is cut by QUESTION, because
 * the quiz generator reads it for the style of one question at a time (src/lib/quiz-style.ts):
 *
 *   1. Lines: each page's runs in reading order (two columns read as two), joined on one baseline. A
 *      line on a quarter of the pages or more (the running head, "JEE (Advanced) 2025 Paper 1"), a page
 *      number ("3", "3/9", "Page 3 of 20") and the computer-based test's own labels (NTA's "Question Id",
 *      "Option Orientation", the option ids) are dropped.
 *   2. A question starts at a line that begins with its number ("Q.7", "Question Number : 7", "7.",
 *      "7)", or a number alone in the left column, as CBSE's tables print it). A number is taken only
 *      in sequence (the last one plus one, a few more when the paper writes "Q."), or as 1 after a
 *      section or subject heading, so a numbered list inside a stem never cuts the question in two.
 *   3. The options stay with their question; a question longer than MAX_CHARS is cut at line
 *      boundaries into parts that keep the question's heading path.
 *   4. A section or subject heading ("SECTION 1", "PART B — CHEMISTRY", "Mathematics Section A") names
 *      the subject of the questions under it; a paper of several subjects with no such heading gets the
 *      subject its words point to (counted from a short list per subject), or none.
 *   5. What comes before the first question, and a section's own instructions, are "instructions".
 *      An answer key, a model solution or a marking scheme is "answer-key": cut by question when its
 *      entries are long enough to be answers, by size when it is a grid of letters. A file holding the
 *      paper and its solutions turns to "answer-key" at the heading that says so.
 *   6. A paper whose numbering cannot be read (fewer than three questions found) is cut by size into
 *      "questions" blocks, so nothing it holds is lost.
 */
import { MAX_CHARS, TARGET_CHARS, estimateTokens, readingOrder, type Chunk } from "./corpus-chunk";
import type { PageContent } from "./corpus-pdf";

export type PaperChunkKind = "question" | "questions" | "answer-key" | "instructions";

export type PaperChunk = Chunk & { kind: PaperChunkKind; question: number | null };

export type PaperLine = { text: string; page: number; y: number; x: number; size: number; firstRun: string; firstRunX?: number; marginX?: number };

const normalise = (t: string) => t.toLowerCase().replace(/[0-9०-९]+/g, "#").replace(/\s+/g, " ").trim();

/** A page number or a page count: "3", "3/9", "- 3 -", "Page 3 of 20", "P.T.O.". */
const PAGE_NUMBER = /^(?:[-–—\s]*\d{1,3}[-–—\s]*|\d{1,3}\s*\/\s*\d{1,3}|page\s*\d{1,3}(?:\s*(?:of|\/)\s*\d{1,3})?|p\.?\s*t\.?\s*o\.?)$/i;

/** The labels NTA's computer-based papers print around each question (JEE (Main) 2026). */
const CBT_LABEL = /^(?:question mandatory|single line question option|option orientation|options\s*:|section id|section number|section type|mandatory or optional|number of questions|section marks|maximum instruction time|sub-section|question shuffling|is section default|group (?:number|id|maximum|minimum|marks)|show attended|edit attended|break time|question paper name|subject name|creation date|duration\s*:|total marks|display marks|clear response|calculator|chosen option|status\s*:)/i;
const OPTION_ID = /^\d{6,}\.?$/;

/** "Q.7", "Q 7", "Question 7", "Question Number : 7", "Que. 7", "Q7." — an explicit question number. */
const EXPLICIT = /^(?:q(?:ue(?:stion)?)?\.?\s*(?:no\.?|number)?\s*[.:-]?\s*)(\d{1,3})\b\s*[.):-]?\s*/i;
/** "7. text", "7) text", "7 . text". */
const NUMBERED = /^(\d{1,3})\s*[.)]\s*(?=\S)/;
/** A number alone (a table's number column). */
const BARE = /^(\d{1,3})\s*[.)]?$/;

const SUBJECTS: [RegExp, string][] = [
  [/\bphysics\b/i, "Physics"],
  [/\bchemistry\b/i, "Chemistry"],
  [/\b(?:mathematics|maths?)\b/i, "Mathematics"],
  [/\b(?:biology|botany|zoology)\b/i, "Biology"],
  [/\bsocial science\b/i, "Social Science"],
  [/\bscience\b/i, "Science"],
  [/\bmental ability\b/i, "Mental Ability"],
];

/** A heading that starts a section or names a subject: short, and nothing but the heading's words. */
export function sectionHeading(text: string): { subject: string | null } | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length > 80 || t.length < 4) return null;
  const section = /^(?:section|part|paper)\s*[-–:]?\s*(?:[A-H]|[IVX]{1,4}|\d{1,2})\b/i.test(t);
  // "PHYSICS", "Part B — Chemistry", "Mathematics Section A", "SUBJECT: BIOLOGY": the subject word with
  // little else, so a stem that mentions physics is not a heading.
  const subjectOnly = /^(?:(?:part|section|subject)\s*[-–:]?\s*(?:[A-H]|[IVX]{1,4}|\d{1,2})?\s*[-–:]?\s*)?(?:physics|chemistry|mathematics|maths|biology|botany|zoology|science|social science|mental ability)(?:\s*[-–:(]?\s*(?:section|part)?\s*[-–:]?\s*(?:[A-H]|[IVX]{1,4}|\d{1,2})?\)?)?\s*(?:\(maximum marks[^)]*\))?$/i.test(t);
  if (!section && !subjectOnly) return null;
  const subject = SUBJECTS.find(([re]) => re.test(t))?.[1] ?? null;
  return { subject };
}

/** The words of a paper's front matter: numbered instructions are not questions. */
const INSTRUCTION_WORDS = /\b(?:booklet|candidates?|answer sheet|answer booklet|OMR|roll number|instructions?|negative mark|calculators?|mobile phones?|invigilator|rough work|darken|bubble|question paper (?:consists|contains|has)|marks? (?:will|shall) be|is allowed|are allowed|not allowed|duration|time allowed|maximum marks)\b/i;

const ANSWERS_HEADING = /^(?:answer\s*keys?|answers?|solutions?|model solutions?|marking scheme|hints?\s*(?:and|&)\s*solutions?|final answer keys?)\b.{0,40}$/i;

/** Words that point to a subject, for a paper of several subjects whose sections carry no heading. */
const SUBJECT_WORDS: Record<string, RegExp> = {
  Physics: /\b(?:velocity|speed|acceleration|forces?|momentum|friction|current|voltage|resistance|resistor|circuit|wire|magnetic|electric|charge[ds]?|capacitor|lens|mirror|ray|wavelength|frequency|oscillat\w*|photon|nucleus|kinetic|potential energy|torque|pendulum|spring|block|pulley|string|collides?|collision|particle|refractive|gravitational|temperature|heat|gas|joule|newton|ohm|tesla|m\/s|m s|kg|radiation|interference|diffraction)\b/gi,
  Chemistry: /\b(?:reaction|mol(?:e|es|ar|ality)?|compound|acid|base|oxidation|reduction|bond|electron configuration|isomer|alkane|alkene|benzene|organic|ion(?:ic)?|salt|equilibrium constant|enthalpy|catalyst|precipitate|titration|hybridi[sz]ation|ph\b|iupac)\b/gi,
  Mathematics: /(?:\b(?:function|matrix|matrices|determinant|integral|derivative|differentiable|probability|equation|polynomial|triangle|circle|parabola|ellipse|hyperbola|vector|real numbers?|integer|sequence|series|limit|sin|cos|tan|log)\b|[ℝ∈∫∑√])/gi,
  Biology: /\b(?:cell|tissue|plant|animal|gene|chromosome|dna|rna|protein|enzyme|species|photosynthesis|respiration|hormone|organ|blood|bacteria|virus|ecosystem|evolution|mitosis|meiosis|kidney|leaf|root|flower)\b/gi,
};

export function guessSubject(text: string, allowed: readonly string[]): string | null {
  let best: string | null = null;
  let bestN = 0;
  for (const s of allowed) {
    const re = SUBJECT_WORDS[s];
    if (!re) continue;
    const n = (text.match(re) ?? []).length;
    if (n > bestN) [best, bestN] = [s, n];
  }
  return bestN >= 2 ? best : null;
}

/** Every page's lines in reading order, with the running heads, page numbers and test labels gone. */
export function paperLines(pages: PageContent[]): PaperLine[] {
  const perPage: PaperLine[][] = pages.map((p) => {
    const runs = p.ocr ? [...p.runs].sort((a, b) => b.y - a.y || a.x - b.x) : readingOrder(p.runs, p.width);
    const lines: PaperLine[] = [];
    let cur: { parts: { text: string; x: number }[]; y: number; size: number } | null = null;
    // A line's runs left to right: a superscript sits above its baseline and would otherwise come first
    // ("26 4. The Sun's core contains about 10 particles" for "4. … about 10^26 particles").
    const flush = () => {
      if (cur) {
        const parts = [...cur.parts].sort((a, b) => a.x - b.x);
        const text = parts.map((q) => q.text).join(" ").replace(/\s+/g, " ").trim();
        if (text) lines.push({ text, page: p.page, y: cur.y, x: parts[0]!.x, size: cur.size, firstRun: parts[0]!.text.trim(), firstRunX: parts[0]!.x });
      }
      cur = null;
    };
    for (const r of runs) {
      if (cur && Math.abs(cur.y - r.y) <= Math.max(cur.size, r.size) * 0.6) {
        cur.parts.push({ text: r.text, x: r.x });
        // The baseline is the body text's, not a superscript's.
        if (r.size > cur.size) cur.y = r.y;
        cur.size = Math.max(cur.size, r.size);
      } else {
        flush();
        cur = { parts: [{ text: r.text, x: r.x }], y: r.y, size: r.size };
      }
    }
    flush();
    // The page's left text edge: a number alone counts as a question's only when it sits there.
    const xs = lines.filter((l) => !PAGE_NUMBER.test(l.text)).map((l) => l.x).sort((a, b) => a - b);
    const marginX = xs[Math.floor(xs.length * 0.05)] ?? 0;
    for (const l of lines) l.marginX = marginX;
    return lines;
  });
  // Running heads and feet: the same line (digits ignored), in the top or bottom band of the page, on a
  // quarter of the pages or more. Only the bands: a stem the paper repeats is not a running head.
  const heightOf = new Map(pages.map((p) => [p.page, p.height || 792]));
  const inBand = (l: PaperLine) => {
    const h = heightOf.get(l.page) ?? 792;
    return l.y >= h * 0.86 || l.y <= h * 0.1;
  };
  const seenOn = new Map<string, Set<number>>();
  for (const lines of perPage) for (const l of lines) {
    if (!inBand(l)) continue;
    const k = normalise(l.text);
    if (k.length < 4) continue;
    seenOn.set(k, (seenOn.get(k) ?? new Set<number>()).add(l.page));
  }
  const floor = Math.max(3, Math.ceil(pages.length * 0.25));
  const repeated = new Set([...seenOn].filter(([, s]) => pages.length >= 4 && s.size >= floor).map(([k]) => k));
  // A subject's running head ("PHYSICS" over that section's pages) stays: it is how a question learns
  // its subject. The chunker skips it where it repeats the heading already in force.
  // NTA's "Question Number : 7 Question Id : …" repeats on every page digits aside, and is the question's start.
  return perPage.flat().filter((l) => !PAGE_NUMBER.test(l.text) && (!inBand(l) || !repeated.has(normalise(l.text)) || !!sectionHeading(l.text)?.subject || !!questionStart(l)?.explicit) && !CBT_LABEL.test(l.text) && !OPTION_ID.test(l.text));
}

/** The question number a line starts with, and the line without it; `explicit` when the paper wrote "Q" or "Question". */
export function questionStart(line: Pick<PaperLine, "text" | "firstRun" | "firstRunX" | "marginX">): { n: number; explicit: boolean; rest: string; column?: boolean } | null {
  const e = EXPLICIT.exec(line.text);
  if (e && /^q/i.test(line.text)) {
    // NTA's computer-based papers: the rest of the label line ("Question Id : …") is not the question.
    const rest = /question id\s*:/i.test(line.text) ? "" : line.text.slice(e[0].length).trim();
    return { n: Number(e[1]), explicit: true, rest };
  }
  const m = NUMBERED.exec(line.text);
  if (m) return { n: Number(m[1]), explicit: false, rest: line.text.slice(m[0].length).trim() };
  // A number alone in its own run, with the question's words beside it (CBSE's table) or below it.
  // Only at the page's left text edge, and before words that begin a sentence: a superscript or a
  // subscript is a number alone in its own run too.
  if (BARE.test(line.firstRun)) {
    const n = Number(BARE.exec(line.firstRun)![1]);
    const rest = line.text.slice(line.firstRun.length).trim();
    const atMargin = line.firstRunX === undefined || line.marginX === undefined || line.firstRunX <= line.marginX + 12;
    // The rest may be the marks column alone ("33 … 2"), the question's words on the lines below.
    if (atMargin && (rest === "" || /^[A-Z“"‘'(]/.test(rest) || /^\d{1,2}$/.test(rest))) return { n, explicit: false, rest: /^\d{1,2}$/.test(rest) ? "" : rest, column: true };
  }
  return null;
}

export type PaperChunkOptions = {
  /** The paper's own name, first in every heading path: "JEE (Advanced) 2025, Paper 1". */
  title: string;
  part: "paper" | "answer-key" | "paper+answers";
  /** The paper's subjects; with more than one, each question is tagged with its section's subject. */
  subjects: string[];
};

export function chunkPaper(pages: PageContent[], opts: PaperChunkOptions): { chunks: PaperChunk[] } {
  const lines = paperLines(pages);
  const single = opts.subjects.length === 1 ? (opts.subjects[0] ?? null) : null;
  type Block = { kind: PaperChunkKind; question: number | null; subject: string | null; heading: string | null; lines: PaperLine[] };
  const blocks: Block[] = [];
  let mode: "paper" | "answer-key" = opts.part === "answer-key" ? "answer-key" : "paper";
  let last = 0;
  let afterHeading = false;
  let subject: string | null = single;
  let heading: string | null = null;
  let cur: Block | null = null;
  /** The question blocks of the numbering in force, so numbered instructions can be given back. */
  let seq: Block[] = [];
  const open = (b: Block) => {
    if (cur && cur.lines.length) blocks.push(cur);
    cur = b;
    if (b.kind === "question" || (b.kind === "answer-key" && b.question !== null)) seq.push(b);
  };
  const textOf = (b: Block) => b.lines.map((l) => l.text).join("\n");
  for (const line of lines) {
    if (opts.part === "paper+answers" && mode === "paper" && ANSWERS_HEADING.test(line.text) && last >= 3) {
      mode = "answer-key";
      last = 0;
      seq = [];
      open({ kind: "answer-key", question: null, subject, heading: line.text, lines: [] });
      continue;
    }
    const h = sectionHeading(line.text);
    if (h) {
      // A subject's running head over every page of its section: nothing new, the question goes on.
      if (line.text === heading || (h.subject && h.subject === subject && !/^(?:section|part|paper)\b/i.test(line.text))) continue;
      if (h.subject && !single) subject = h.subject;
      heading = line.text;
      afterHeading = true;
      open({ kind: mode === "answer-key" ? "answer-key" : "instructions", question: null, subject, heading, lines: [line] });
      continue;
    }
    const q = questionStart(line);
    let take = !!q && q.n >= 1 && (q.n === last + 1 || (q.n === 1 && (last === 0 || afterHeading || q.explicit)) || (q.explicit && q.n > last && q.n <= last + 5) || (afterHeading && q.n > last && q.n <= last + 3) || (!!q.column && q.n > last && q.n <= last + 3) ||
      // A question that has run on past a few lines has swallowed the next one or two whose
      // numbers OCR lost ("9." read as "Q,"): the next number a little ahead is taken.
      (!!cur && (cur as Block).kind === "question" && textOf(cur as Block).length > 300 && q.n > last && q.n <= last + 4));
    // "1." again after a run of numbered instructions ("1. This booklet has 9 pages…"): those were not
    // questions; they go back to the front matter and the numbering starts here.
    if (q && q.n === 1 && seq.length && seq.filter((b) => INSTRUCTION_WORDS.test(textOf(b))).length * 2 >= seq.length) {
      for (const b of seq) {
        b.kind = "instructions";
        b.question = null;
      }
      seq = [];
      last = 0;
      take = true;
    } else if (q && take && q.n === 1) seq = [];
    if (q && take) {
      last = q.n;
      afterHeading = false;
      open({ kind: mode === "answer-key" ? "answer-key" : "question", question: q.n, subject, heading, lines: [{ ...line, text: `${q.n}. ${q.rest}`.trim() }] });
      continue;
    }
    if (!cur) cur = { kind: mode === "answer-key" ? "answer-key" : "instructions", question: null, subject, heading, lines: [] };
    (cur as Block).lines.push(line);
  }
  if (cur && (cur as Block).lines.length) blocks.push(cur);

  const questions = blocks.filter((b) => b.kind === "question");
  const keyEntries = blocks.filter((b) => b.kind === "answer-key" && b.question !== null);
  // A grid of letters ("1 a 2 c 3 b"): its "answers" are a few characters each; cut it by size instead.
  const gridKey = keyEntries.length > 0 && keyEntries.reduce((n, b) => n + textOf(b).length, 0) / keyEntries.length < 60;

  let use: Block[] = blocks;
  if (mode === "paper" && opts.part !== "answer-key" && questions.length < 3) {
    use = [{ kind: "questions", question: null, subject: single, heading: null, lines }];
  } else if (opts.part === "answer-key" && (keyEntries.length < 3 || gridKey)) {
    use = [{ kind: "answer-key", question: null, subject: single, heading: null, lines }];
  } else if (gridKey) {
    // A paper with a grid key at its end: the questions stay, the key becomes size-cut blocks.
    const firstKey = blocks.findIndex((b) => b.kind === "answer-key");
    use = [...blocks.slice(0, firstKey), { kind: "answer-key", question: null, subject: single, heading: null, lines: blocks.slice(firstKey).flatMap((b) => b.lines) }];
  }

  const chunks: PaperChunk[] = [];
  /** Which chunks' subjects were guessed from their words rather than read from a heading. */
  const guessed = new Set<number>();
  const push = (b: Block, part: PaperLine[], partNo: number, parts: number) => {
    const text = part.map((l) => l.text).join("\n").trim();
    // OCR noise and stray labels: a "question" with almost no words is not one.
    if ((text.match(/\p{L}/gu) ?? []).length < (b.kind === "answer-key" ? 1 : 12)) return;
    const subj = b.subject ?? (opts.subjects.length > 1 && b.kind === "question" ? guessSubject(text, opts.subjects) : null);
    if (!b.subject && opts.subjects.length > 1 && b.kind === "question") guessed.add(chunks.length);
    const label = b.kind === "question" ? `Question ${b.question}` : b.kind === "answer-key" ? (b.question !== null ? `Answer ${b.question}` : "Answer key") : b.kind === "instructions" ? "Instructions" : "Questions";
    const headingPath = [opts.title, ...(b.heading && b.heading !== label ? [b.heading.slice(0, 120)] : []), parts > 1 ? `${label} (part ${partNo} of ${parts})` : label];
    chunks.push({
      ordinal: chunks.length,
      chapter: opts.title,
      section: subj,
      headingPath,
      pageStart: part[0]!.page,
      pageEnd: part[part.length - 1]!.page,
      text,
      tokens: estimateTokens(text),
      figureKeys: [],
      kind: b.kind,
      question: b.question,
    });
  };
  for (const b of use) {
    // One question per chunk; a long one (or a size-cut block) in parts at line boundaries.
    const cap = b.kind === "question" || (b.kind === "answer-key" && b.question !== null) ? MAX_CHARS : TARGET_CHARS;
    const parts: PaperLine[][] = [];
    let part: PaperLine[] = [];
    let size = 0;
    for (const l of b.lines) {
      const add = l.text.length + 1;
      if (part.length && size + add > cap) {
        parts.push(part);
        part = [];
        size = 0;
      }
      // A single line longer than the cap (OCR of a whole page as one line) is cut by characters.
      if (add > cap) {
        for (let i = 0; i < l.text.length; i += cap) parts.push([{ ...l, text: l.text.slice(i, i + cap) }]);
        continue;
      }
      part.push(l);
      size += add;
    }
    if (part.length) parts.push(part);
    parts.forEach((p, i) => push(b, p, i + 1, parts.length));
  }
  // A paper of several subjects that names none (JEE (Advanced): "SECTION 1" again for each subject; NEET
  // (UG) read by OCR, numbered 1 to 180 straight through): a question's subject is the one most of its
  // neighbours' words point to — the questions within six of it, between two restarts of the numbering.
  if (opts.subjects.length > 1 && guessed.size) {
    const own = new Map<number, string | null>([...guessed].map((i) => [i, chunks[i]!.section]));
    let run: number[] = [];
    const settle = () => {
      run.forEach((i, k) => {
        if (!guessed.has(i)) return;
        const votes = new Map<string, number>();
        for (const j of run.slice(Math.max(0, k - 6), k + 7)) {
          const g = own.get(j);
          if (g) votes.set(g, (votes.get(g) ?? 0) + 1);
        }
        const ranked = [...votes].sort((a, b) => b[1] - a[1]);
        const [top, second] = ranked;
        if (top && top[1] >= 2 && top[1] > (second?.[1] ?? 0)) chunks[i]!.section = top[0];
      });
      run = [];
    };
    chunks.forEach((c, i) => {
      if (c.kind !== "question") return;
      const prev = run.length ? chunks[run[run.length - 1]!]! : null;
      if (prev && (c.question ?? 0) < (prev.question ?? 0)) settle();
      run.push(i);
    });
    settle();
  }
  return { chunks };
}
