/**
 * Every chapter carries its own title, never a bare "Chapter N" (the owner's ask of 19 October 2026).
 *
 *   npm run corpus:titles                       the review table: path, old heading, new title, where it came from
 *   npm run corpus:titles -- --apply            writes the titles into the chunks (chapter and the heading path's first)
 *   npm run corpus:titles -- --topics [--dry]   renames the bank's "Chapter N" and garbled practice chapters
 *   [--prefix=ncert/8]                          limits the corpus pass to paths under a folder
 *
 * THE FAULT. 228 NCERT chapters ingested with a first heading that is only the number ("Chapter 4"): the chunker's
 * title recovery (scripts/corpus-chunk.ts elementsOf, recoverChapterTitle) wants the title page's own lines set at
 * one and a half times the body or more, and these books print theirs smaller (Ganita Manjari's 16 over 11), draw
 * them as outlines the text layer never carries (the 2008 class 8 Mathematics), or put them on a unit's opening
 * page. A few more came out garbled, a drop capital lost ("Xpressions and", "Ensuration", "Actorisation"). The
 * generator names a chapter after its first heading, so the bank holds chapters called "Chapter 10".
 *
 * WHAT IT READS. Each document whose first heading is bare, or (one chapter a file) whose title is cut short or short of
 * a letter, is read again with the ingest's own pdfjs path (scripts/corpus-pdf.ts extractPdf, no figures, no OCR), and
 * the title is looked for four ways:
 *   chapter-line   the line after "Chapter N" (or "Chapter N: Title" on one line) on the first two pages, a unit's
 *                  opening page included (it lists its chapters);
 *   title-page     the first page's largest lines that are words (three at most), set at 1.2 times the body or more,
 *                  labels, numbers and sections left out; the second page when the first opens a unit or is a picture;
 *   contents       the book's prelims file beside it (<bookCode>ps.pdf or pr.pdf): "Chapter N" and its line, or
 *                  "N. Title ...... page"; where no numbers are printed, the Nth of an evenly spaced list exactly as
 *                  long as the book's chapters (Contemporary India);
 *   running-head   a line printed on a quarter of the pages or more, not the book's title, not a label, and not printed
 *                  in another chapter of the same book (a strand's or a unit's head).
 * Each candidate is cleaned (cleanHeading), mended from a running head that carries more of its letters
 * (recoverChapterTitle, never a fragment of it), its drop capitals restored from the chapter's own words ("ROP RODUCTION
 * AND ANAGEMENT" becomes "Crop Production and Management": "crop" is far the commonest word the chapter has that ends
 * "rop"), small capitals read as mixed case ("SportS and WeLLneSS") lowered, and put in title case. It is refused when
 * it is a label, a number, "Contents", a section ("1.1 …"), a sentence (a full stop at the end, more than twelve words,
 * a quotation), the book's own title, ends in "and"/"of"/"the"…, has a word short of its first letter or a letter
 * printed apart from its word, words run together, or one word the chapter and the dictionary (/usr/share/dict/words,
 * when this machine has it) both do not know. A "Chapter N" line or the contents scores 3, the title page 2, a running
 * head of two words or more standing alone on its line 2.5 (any other 1), and every other source that agrees adds 2;
 * 2 is enough. A garbled heading takes only a title whose letters it shares, and its own letters mended are the last
 * resort. The review of 19 October 2026 refused nine more by hand (REVIEWED_REFUSED). Nothing found: the document is
 * left as it is and listed.
 *
 * WHAT IT WRITES (--apply, through the owner connection: npm run corpus:titles wraps it in with-admin-db.mjs).
 * `chapter` and the first of `headingPath` (SQL "headingPath"[1]) of every chunk of the document that carried the old heading become
 * "Chapter N: Title" (N the number the old heading carried, which is the file's extra.chapter). The text and the
 * embeddings are not touched. THE HEADING IS PART OF THE EMBEDDED TEXT: corpus-ingest.ts embeddingInput() embeds
 * "<book> › <headingPath…>\n\n<text>", so the stored vectors were made with the old heading. They are not re-embedded
 * here (the brief's rule): the text, which is nearly all of each input, is unchanged; `npm run corpus:ingest --
 * --reembed --prefix=…` would refresh them. Every decision of an applied run is written to
 * storage/corpus/titles-<date>.json (never overwritten: -2, -3… after it), a review run's to titles-<date>-review.json.
 *
 * THE BANK (--topics, after --apply). Every SCHOOL practice chapter (QuizTopic) whose name is a bare "Chapter N", or
 * a garbled title this pass corrected (the decisions file), is renamed to the title the generator now reads for it:
 * selectChapter (scripts/quiz-gen/select.ts) picks the document the way a generation run does, cross-checked against
 * the batch file's `book` when content/quiz/generated holds one. `name` = Title, `chapter` = "Chapter N — Title"; the
 * slug is UNCHANGED (it is in links and on the phone) and the Hindi and Marathi names are left for a speaker. Each
 * rename is a plain owner write with an audit row naming this script ("operator.quizTopic.rename", no actor, no
 * school; meta.via = "scripts/corpus-titles.ts", the old and new name and chapter, the document). A chapter whose new
 * name another chapter of its class, subject and number already carries is left and listed: its questions belong
 * in the other, which is a decision, not a rename.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { CORPUS_ROOT } from "./corpus-lib";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";
import { bodySizeOfPages, cleanHeading, lettersOfTitle, recoverChapterTitle, runningHeadsOf } from "./corpus-chunk";
import type { PageContent } from "./corpus-pdf";

/* ===========================================================================
   Pure: the reading of a title from pages, and its plausibility.
   =========================================================================== */

/** A first heading that is only the chapter's number: "Chapter 4", "Unit 3", "7", "12." */
export const BARE_HEADING = /^(?:chapter|unit)?\s*\d{1,2}\s*[:.]?\s*$/i;
export function isBareHeading(heading: string | null | undefined): boolean {
  return BARE_HEADING.test((heading ?? "").trim());
}

/** A practice chapter's name that is only its label: "Chapter 10". */
export function isBareName(name: string | null | undefined): boolean {
  return /^(?:chapter|unit|lesson)\s*\d{1,2}\s*$/i.test((name ?? "").trim());
}

export type Vocabulary = Map<string, number>;

/** Every word of the chapter's text, lower case, with how often it occurs. Pure. */
export function vocabularyOf(texts: readonly string[]): Vocabulary {
  const out: Vocabulary = new Map();
  for (const t of texts) for (const w of t.toLowerCase().match(/\p{L}+/gu) ?? []) out.set(w, (out.get(w) ?? 0) + 1);
  return out;
}

const SMALL = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "with"]);
/** A title ending in one of these was cut: "Xpressions and", "Ntroduction to". */
const TRAILING = new Set(["a", "an", "and", "as", "at", "by", "for", "from", "in", "into", "of", "on", "or", "the", "to", "with"]);

/**
 * Title case, the small words lower except first and after a colon. Only an all-capitals title is changed unless
 * `force` (a title printed in small capitals the extractor read as mixed case, "NeLson MAndeLA"). Pure.
 */
export function titleCase(text: string, force = false): string {
  if (!force && (text !== text.toUpperCase() || !/\p{Lu}/u.test(text))) return text;
  let afterColon = true;
  return text
    .toLowerCase()
    .split(" ")
    .map((w) => {
      const keep = !afterColon && SMALL.has(w);
      afterColon = /[:—–]$/.test(w);
      return keep ? w : w.replace(/^(\P{L}*)(\p{L})/u, (_, pre: string, c: string) => pre + c.toUpperCase());
    })
    .join(" ");
}

/** Small capitals read as mixed case: a capital after a small letter inside a word ("SportS", "WeLLneSS", "PorTraiT"). */
export function smallCapsGarble(text: string): boolean {
  return text.split(/\s+/).some((w) => /\p{Ll}\p{Lu}/u.test(w.replace(/^\P{L}+|\P{L}+$/gu, "")));
}

/**
 * Drop capitals put back from the chapter's own words. Lone letters before a word join it when together they make a
 * word the chapter uses and the word alone is not one ("D ETERMINATION" → "DETERMINATION", "C l ass" → "Class"); a
 * word the chapter never uses takes the one letter in front that makes a word it does use, when that word is at
 * least three times as common there as the next such ("ROP" → "CROP", "RODUCTION" → "PRODUCTION"; "OST" is left,
 * "most" and "post" being near). A word the dictionary knows is left as printed unless the title is in capitals. Pure.
 */
export function restoreDropCaps(text: string, vocab: Vocabulary, dictionary?: ReadonlySet<string>): { text: string; repaired: string[] } {
  const repaired: string[] = [];
  const known = (w: string) => (vocab.get(w.toLowerCase()) ?? 0) > 0;
  const tokens = text.split(/\s+/).filter(Boolean);
  const merged: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const cur = tokens[i]!;
    const lone = /^(\P{L}*)(\p{L})$/u.exec(cur);
    if (lone) {
      // Up to three more single letters, then the word they belong to.
      let letters = lone[2]!;
      let j = i + 1;
      while (j < tokens.length && j - i <= 3 && /^\p{L}$/u.test(tokens[j]!)) letters += tokens[j++]!;
      const next = tokens[j];
      const core = next ? /^\p{L}+/u.exec(next)?.[0] : undefined;
      const together = vocab.get((letters + core).toLowerCase()) ?? 0;
      if (next && core && together > 0 && (!known(core) || together >= (vocab.get(core.toLowerCase()) ?? 0) || (dictionary && !dictionary.has(core.toLowerCase())))) {
        // "T Rade" → "Trade"; "D ETERMINATION" stays in capitals.
        merged.push(lone[1]! + letters + (next === next.toUpperCase() ? next : next.toLowerCase()));
        repaired.push(`${tokens.slice(i, j).join(" ")} ${core}`);
        i = j;
        continue;
      }
    }
    merged.push(cur);
  }
  const out = merged.map((tok) => {
    const m = /^(\P{L}*)(\p{L}+)(.*)$/u.exec(tok);
    if (!m) return tok;
    const [, pre, core, rest] = m as unknown as [string, string, string, string];
    const lower = core.toLowerCase();
    // A word the dictionary knows is mended only in a title set in capitals ("LAME" under "OMBUSTION AND"), never in
    // one set in mixed case ("The Ever-Evolving World", "in Our Society").
    if (core.length < 2 || known(core) || /^[ivxlc]+$/.test(lower) || (dictionary?.has(lower) && core !== core.toUpperCase())) return tok;
    const counts = [..."abcdefghijklmnopqrstuvwxyz"].map((letter) => ({ letter, count: vocab.get(letter + lower) ?? 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count);
    const best = counts[0];
    if (!best || (counts[1] && best.count < counts[1].count * 3)) return tok;
    // "ROP" → "CROP"; "Xpressions" → "Expressions" (the letter that stood first was taken for the capital).
    const allCaps = core === core.toUpperCase();
    repaired.push(core);
    return `${pre}${best.letter.toUpperCase()}${allCaps ? core : core.charAt(0).toLowerCase() + core.slice(1)}${rest}`;
  });
  return { text: out.join(" "), repaired };
}

const LABEL_LINE =
  /^(?:let us\b|let's\b|activity\b|note (?:to|for) (?:the )?teachers?|think and reflect|think, discuss and write|try these|do this|comprehension check|before you read|about the unit|fig(?:ure)?\.?\s*\d|table\s*\d|example\b|exercises?\b|warm-?up|cool-?down|circle time|how to play|answers?$|contents?$|index$|foreword|preface|picture (?:reading|time)|reprint\b|rationali[sz]|illustration\b|solution\b|therefore\b|total\b|task\b|purpose$|variations$|required material|chapter$|c?hapter$|u?nit$|part\s*[0-9ivx]+$|unit\s*[-–:]?\s*[0-9ivx]+\b|grade(?:\s*\d+)?$|class(?:\s*\d+)?$|step\s*\d|section\b|\(?[ivx]+\)$|\(?[a-z]\)$)/i;
const NUMBERISH = /^[\s\d.,:;|\-–—()…·•ivxlc]+$/i;
const SECTION = /^\d{1,2}(?:\.\d{1,2})+\.?(?:\s|$)/;

/** "Chapter 4", "Chapter 4: Title", "CHAPTER 4 — Title", "Unit 4 Title": the number and what follows. */
function chapterLine(text: string): { n: number; rest: string } | null {
  const m = /^(?:c?hapter|unit|lesson)\s*[-–:]?\s*(\d{1,2})(?![\d.]\d)\s*[:.\-–—]?\s*(.*)$/i.exec(text.trim());
  return m ? { n: Number(m[1]), rest: (m[2] ?? "").trim() } : null;
}

/** "E v e l i n e" → "Eveline"; a page range or trailing page number, dot leaders and edge bars off a line. */
function tidy(text: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  if (/^(?:\p{L} ){3,}\p{L}$/u.test(t)) t = t.replace(/ /g, "");
  t = t.replace(/\s*[.…·]{3,}.*$/, "").replace(/\s+\d{1,3}\s*[-–]\s*\d{1,3}$/, "").replace(/\s+\d{1,3}$/, "");
  t = t.replace(/^[|•·\s]+|[|•·\s]+$/g, "");
  return t.replace(/\s+([:;,])/g, "$1").replace(/:(?=\S)/g, ": ").trim();
}

export type Line = { text: string; size: number; y: number; x: number; page: number };

/**
 * A symbol font's letters read back: the 2008 class 8 Mathematics sets its titles in a font whose text layer carries
 * each letter at U+F000 above its ASCII code ("\uF045\uF078\uF070…" is "Exp…"). Pure.
 */
export function decodePrivateUse(text: string): string {
  return text.replace(/[\uF020-\uF07E]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xf000));
}

/**
 * A page's lines in reading order, top to bottom: runs on one baseline joined when the gap between them is under
 * two and a half of their size (a drop capital and its word, "ROP" "RODUCTION AND" "ANAGEMENT"), cut where a column's
 * gutter opens ("Chapter 1" in a margin beside the body is its own line). A line's size is the size most of its
 * letters are set in (a drop capital does not lift it). Pure.
 */
export function linesOf(page: PageContent): Line[] {
  const runs = page.runs.filter((r) => r.text.trim()).sort((a, b) => b.y - a.y || a.x - b.x);
  // Baselines first (a drop capital sits a little off its word's), then each cut where a gutter opens.
  const rows: (typeof runs)[] = [];
  for (const r of runs) {
    const row = rows[rows.length - 1];
    if (row && Math.abs(row[0]!.y - r.y) <= Math.max(2, Math.min(r.size, row[0]!.size) * 0.3)) row.push(r);
    else rows.push([r]);
  }
  const out: Line[] = [];
  for (const row of rows) {
    row.sort((a, b) => a.x - b.x);
    let seg: typeof row = [];
    const flush = () => {
      if (!seg.length) return;
      const weights = new Map<number, number>();
      for (const r of seg) weights.set(r.size, (weights.get(r.size) ?? 0) + r.text.length);
      const size = [...weights].sort((a, b) => b[1] - a[1])[0]![0];
      out.push({ text: decodePrivateUse(seg.map((r) => r.text).join(" ")).replace(/\s+/g, " ").trim(), size, y: seg[0]!.y, x: seg[0]!.x, page: page.page });
      seg = [];
    };
    for (const r of row) {
      const last = seg[seg.length - 1];
      if (last && r.x - (last.x + last.width) > Math.max(r.size, last.size) * 2.5) flush();
      seg.push(r);
    }
    flush();
  }
  // Reading order: top to bottom, and on one baseline left to right.
  return out;
}

const isUnitOpener = (lines: Line[], body: number) => lines.some((l) => l.size >= body * 1.2 && /^(?:u?nit|part)\b\s*[-–:]?\s*([0-9ivx]+)?\s*$/i.test(l.text));
const wordy = (t: string) => /\p{L}{3}/u.test(t);
const skippable = (t: string) => NUMBERISH.test(t) || LABEL_LINE.test(t) || !wordy(t);

/**
 * The lines that follow a "Chapter N" line: page numbers and labels skipped, then the first line with words and the
 * lines after it in the same size until a gap, another chapter or unit, a section or a label. "Introduction" set
 * smaller than a line just after it is a section beside the title ("Chapter 2 / Introduction / Kicking and
 * Receiving"), and gives way to it.
 */
function followers(lines: Line[], from: number): string | null {
  let i = from + 1;
  while (i < lines.length && skippable(lines[i]!.text) && !chapterLine(lines[i]!.text)) i++;
  const first = lines[i];
  if (!first || chapterLine(first.text) || SECTION.test(first.text)) return null;
  if (/^introduction$/i.test(first.text.trim())) {
    const bigger = lines.slice(i + 1, i + 4).findIndex((l) => l.size >= first.size * 1.05 && wordy(l.text) && !skippable(l.text));
    if (bigger >= 0) i = i + 1 + bigger;
  }
  const start = lines[i]!;
  const parts = [start.text];
  let prev = start;
  for (let j = i + 1; j < lines.length && parts.length < 3; j++) {
    const l = lines[j]!;
    if (Math.abs(l.size - start.size) > 0.6 || prev.y - l.y > l.size * 2 || chapterLine(l.text) || SECTION.test(l.text) || LABEL_LINE.test(l.text) || /^\d{1,2}\s*[.)]\s/.test(l.text)) break;
    if (NUMBERISH.test(l.text)) continue;
    parts.push(l.text);
    prev = l;
  }
  return parts.join(" ");
}

export type Source = "chapter-line" | "title-page" | "contents" | "running-head" | "heading";
export type Candidate = { text: string; source: Source; strong?: boolean };

/** Candidates from the chapter's own first two pages: the line after "Chapter N", and the title page's largest lines. Pure. */
export function pageCandidates(pages: PageContent[], n: number): Candidate[] {
  const body = bodySizeOfPages(pages);
  const out: Candidate[] = [];
  for (const page of pages.slice(0, 2)) {
    const lines = linesOf(page);
    for (let i = 0; i < lines.length; i++) {
      const c = chapterLine(lines[i]!.text);
      if (!c || c.n !== n) continue;
      const text = c.rest && wordy(c.rest) && !NUMBERISH.test(c.rest) ? c.rest : followers(lines, i);
      if (text) out.push({ text, source: "chapter-line" });
      break;
    }
    if (out.length) break;
  }
  // The title page: the first page, or the second when the first opens a unit or carries no words (a picture).
  for (const page of pages.slice(0, 2)) {
    const lines = linesOf(page);
    const opener = isUnitOpener(lines, body);
    const big = lines.filter((l) => l.size >= body * 1.2 && wordy(l.text) && !NUMBERISH.test(l.text) && !SECTION.test(l.text) && !LABEL_LINE.test(l.text) && !chapterLine(l.text) && l.text.length <= 140);
    if (!opener && big.length) {
      const top = Math.max(...big.map((l) => l.size));
      const largest = new Set(big.filter((l) => Math.abs(l.size - top) <= Math.max(0.6, top * 0.1)));
      // The first lines of the largest size, in reading order, joined while they run on (three at most); a big
      // number or a "Chapter N" between them is passed over, anything else ends the title.
      const group: Line[] = [];
      for (const l of lines) {
        if (largest.has(l)) {
          const prev = group[group.length - 1];
          if ((prev && prev.y - l.y > l.size * 2.4) || group.length === 3) break;
          group.push(l);
        } else if (group.length && !(NUMBERISH.test(l.text) || chapterLine(l.text))) break;
      }
      if (group.length) out.push({ text: group.map((l) => l.text).join(" "), source: "title-page" });
      break;
    }
    // A page of text without a title ends the search; an opening page, or one with no words (a picture), does not.
    if (!opener && lines.some((l) => wordy(l.text) && l.size <= body * 1.05)) break;
  }
  return out;
}

const FRONT_MATTER = /^(?:contents|foreword|preface|rationali[sz]ation|about the book|acknowledg|a note|note for|how to use|textbook development|appendix|glossary|answers|index|references|bibliography|suggested|annexure|reprint|\(?[ivxlc]+\)?$)/i;

/**
 * The book's prelims: the Contents entry for chapter N ("Chapter N" and its line, or "N. Title …… page"); or, where
 * the contents print no numbers (Contemporary India), its Nth entry, front and back matter left out, when the entries
 * are exactly as many as the book's chapters (`chapters`). Pure.
 */
export function contentsCandidate(prelims: PageContent[], n: number, chapters = 0): Candidate | null {
  const pages = prelims
    .map((p) => linesOf(p))
    .filter((lines) => lines.some((l) => /^(?:contents)+$/i.test(squash(l.text))) || lines.filter((l) => chapterLine(l.text)).length >= 3);
  for (const lines of pages) {
    for (let i = 0; i < lines.length; i++) {
      const text = lines[i]!.text;
      const c = chapterLine(text);
      if (c && c.n === n) {
        const rest = tidy(c.rest);
        const title = rest && wordy(rest) && !NUMBERISH.test(rest) ? rest : followers(lines, i);
        if (title) return { text: tidy(title), source: "contents" };
      }
      const numbered = new RegExp(`^0?${n}\\s*[.)]\\s*(\\S.*)$`).exec(text);
      if (numbered && !SECTION.test(text)) {
        const title = tidy(numbered[1]!);
        if (wordy(title)) return { text: title, source: "contents" };
      }
    }
  }
  // No numbers printed: the Nth entry of a page that is a plain list, as many entries as the book has chapters, set
  // one size and spaced evenly.
  for (const lines of pages) {
    if (chapters < 2 || lines.some((l) => chapterLine(l.text) || /^\d{1,2}\s*[.)]\s*\S/.test(l.text))) continue;
    const sizes = new Map<number, number>();
    for (const l of lines) if (wordy(l.text)) sizes.set(Math.round(l.size), (sizes.get(Math.round(l.size)) ?? 0) + 1);
    const body = [...sizes].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    const rows = lines.filter((l) => wordy(l.text) && Math.round(l.size) === body && !FRONT_MATTER.test(tidy(l.text)) && !SECTION.test(l.text) && !/^reprint/i.test(l.text));
    if (rows.length !== chapters || !rows.every((l) => /^\p{Lu}/u.test(tidy(l.text)))) continue;
    const gaps = rows.slice(1).map((l, i) => rows[i]!.y - l.y);
    if (gaps.some((g) => g <= 0) || Math.max(...gaps) > Math.min(...gaps) * 1.5) continue;
    return { text: tidy(rows[n - 1]!.text), source: "contents" };
  }
  return null;
}

const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
/** A running head as a title would read: its page number and bar off ("5 | UNDERSTANDING EMOTIONS"). */
const headText = (h: string) => tidy(h.replace(/^\d{1,3}\s*\|\s*|\s*\|\s*\d{1,3}$/g, ""));
/** The key two chapters' running heads are compared by. */
export const headKey = (h: string) => squash(headText(h));
const subsequence = (small: string, big: string) => {
  let i = 0;
  for (const ch of big) if (ch === small[i]) i++;
  return small.length > 0 && i === small.length;
};
const normaliseLine = (t: string) => t.toLowerCase().replace(/[0-9०-९]+/g, "#").replace(/\s+/g, " ").trim();

/**
 * On what share of the pages a running head is printed, and on what share of those it stands alone on its line: a
 * head that shares its baseline with another run of its size is a piece of a line ("RODUCTION AND"). Pure.
 */
export function headStats(pages: PageContent[], head: string): { coverage: number; alone: number } {
  if (!pages.length) return { coverage: 0, alone: 0 };
  const k = normaliseLine(head);
  let on = 0;
  let alone = 0;
  for (const p of pages) {
    const hits = p.runs.filter((r) => normaliseLine(r.text) === k);
    if (!hits.length) continue;
    on++;
    // A neighbour on the baseline that is words, not a page number, makes the head a piece of a line.
    if (hits.some((h) => !p.runs.some((r) => r !== h && !NUMBERISH.test(r.text) && Math.abs(r.y - h.y) <= 2 && Math.abs(r.size - h.size) <= 1 && (Math.abs(r.x - (h.x + h.width)) < h.size * 3 || Math.abs(h.x - (r.x + r.width)) < h.size * 3)))) alone++;
  }
  return { coverage: on / pages.length, alone: on ? alone / on : 0 };
}

/**
 * The running heads that may be a chapter's title: not the book's, not a label, words, and not printed in another
 * chapter of the same book (`elsewhere`, keys by headKey: a book's, a strand's or a unit's head, "Visual Arts"). A
 * head of two words or more that stands alone on its line on three pages in ten or more is `strong`: it may stand
 * alone. Pure.
 */
export function headCandidates(heads: readonly { text: string; coverage: number; alone: number }[], bookTitle: string, elsewhere: ReadonlySet<string> = new Set()): Candidate[] {
  const book = squash(bookTitle);
  const out: Candidate[] = [];
  for (const h of heads) {
    const text = headText(h.text);
    const s = squash(text);
    if (!wordy(text) || NUMBERISH.test(text) || LABEL_LINE.test(text) || SECTION.test(text) || /\d{4}/.test(text)) continue;
    if (s.length < 4 || (book && (book.includes(s) || s.includes(book))) || elsewhere.has(s)) continue;
    // One word is too often a piece of a line or a strand's name ("Management", "Dance") to stand alone.
    const strong = h.alone >= 0.5 && h.coverage >= 0.3 && text.split(/\s+/).length >= 2;
    out.push({ text, source: "running-head", strong });
  }
  return out;
}

export type TitleContext = { vocab: Vocabulary; bookTitle: string; subject?: string; dictionary?: ReadonlySet<string> };

/** A word the dictionary knows, as printed or without a common ending ("Orienting" → "orient"). */
function inDictionary(w: string, dictionary: ReadonlySet<string>): boolean {
  if (dictionary.has(w)) return true;
  for (const [end, put] of [["ies", "y"], ["es", ""], ["s", ""], ["ed", ""], ["ed", "e"], ["ing", ""], ["ing", "e"], ["ly", ""], ["isation", "ise"], ["isation", "ize"]] as const) {
    if (w.endsWith(end) && w.length > end.length + 2 && dictionary.has(w.slice(0, -end.length) + put)) return true;
  }
  return false;
}

/**
 * Why a title cannot be the chapter's, or null when it can. `vocab` is the chapter's own words (its text and its
 * section headings); `dictionary` an English word list when this machine has one (/usr/share/dict/words). Pure.
 */
export function implausible(title: string, ctx: TitleContext): string | null {
  const t = title.trim();
  if (!wordy(t)) return "no words";
  if (/[ࠀ-ࣿ-�]/u.test(t)) return "glyphs with no letters behind them";
  if (/\p{Script=Devanagari}/u.test(t)) return "a Devanagari title page, whose text layer is not to be trusted";
  if (SECTION.test(t)) return "a section heading";
  if (NUMBERISH.test(t) || /^\d/.test(t)) return "a number";
  if (LABEL_LINE.test(t) || chapterLine(t) || /^(?:c?hapter|u?nit|lesson)\b/i.test(t)) return "a label";
  if (/\bchapter\b/i.test(t)) return "the word Chapter inside it (a label set over the title)";
  if (/^(?:contents|index|answers|glossary|appendix|bibliography)\b/i.test(t)) return "a prelims heading";
  if (/^\p{Ll}/u.test(t)) return "starts in lower case";
  const words = t.split(/\s+/);
  if (words.length > 12) return "a sentence (more than twelve words)";
  if (/[^.]\.$/.test(t) && !/\b(?:etc|vs|St|Dr|Mr|Mrs)\.$/.test(t)) return "a sentence (ends with a full stop)";
  if (/[’”'"],?\s+\p{Ll}/u.test(t) || /[“”"]/.test(t)) return "a sentence about a title, or several titles";
  if (/[:,;]$/.test(t)) return "cut after a mark";
  const book = squash(ctx.bookTitle);
  if (book && squash(t) === book) return "the book's own title";
  if (ctx.subject && squash(t) === squash(ctx.subject)) return "the subject's name";
  if (t.split(/\s+/).some((w) => /(\p{L}{3,})\1/iu.test(w))) return "letters printed twice over";
  const last = words[words.length - 1]!.toLowerCase().replace(/[^\p{L}]/gu, "");
  if (TRAILING.has(last)) return `ends in "${last}"`;
  const letters = words.flatMap((w) => w.toLowerCase().split(/[^\p{L}]+/u)).filter(Boolean);
  // A word neither the chapter nor the dictionary knows, which one letter in front makes a word one of them knows.
  for (const w of letters) {
    if (w.length < 2 || (ctx.vocab.get(w) ?? 0) > 0 || (ctx.dictionary && inDictionary(w, ctx.dictionary))) continue;
    for (const letter of "abcdefghijklmnopqrstuvwxyz") {
      if ((ctx.vocab.get(letter + w) ?? 0) > 0 || (w.length >= 3 && ctx.dictionary?.has(letter + w))) return `"${w}" is short of its first letter ("${letter}${w}")`;
    }
  }
  if (letters.length === 1 && letters[0]!.length <= 3) return "one short word";
  // A letter printed apart from its word ("Fair S hare", "Glass B angles").
  for (let i = 0; i + 1 < words.length; i++) {
    const lone = /^\P{L}*(\p{L})$/u.exec(words[i]!)?.[1];
    const next = /^\p{L}+/u.exec(words[i + 1]!)?.[0];
    if (lone && next && !/^[aAI]$/.test(lone) && (ctx.vocab.get((lone + next).toLowerCase()) ?? 0) > 0) return `a letter printed apart from its word ("${lone} ${next}")`;
  }
  // A long word neither the chapter nor the dictionary knows is two run together ("Competitionthe", "Budgettbudget").
  for (const w of letters) if (w.length >= 10 && !(ctx.vocab.get(w) ?? 0) && ctx.dictionary && !inDictionary(w, ctx.dictionary)) return `"${w}" is words run together`;
  if (letters.length === 1 && (ctx.vocab.get(letters[0]!) ?? 0) === 0 && !(ctx.dictionary && inDictionary(letters[0]!, ctx.dictionary))) return "one word neither the chapter nor the dictionary knows";
  const content = letters.filter((w) => w.length >= 4 && !SMALL.has(w));
  if (content.length >= 2 && !content.some((w) => (ctx.vocab.get(w) ?? 0) > 0)) return "none of its words is the chapter's";
  return null;
}

/**
 * A candidate made readable: cleaned, mended from a running head that carries more of its letters, its drop capitals
 * restored, small capitals read as mixed case lowered, in title case. Pure.
 */
export function mend(text: string, runningHeads: readonly string[], vocab: Vocabulary, dictionary?: ReadonlySet<string>): { text: string; repaired: string[] } {
  const cleaned = cleanHeading(tidy(text));
  if (!cleaned) return { text: "", repaired: [] };
  // A running head wins only when it carries more of the title than the line found (a drop capital the line lost),
  // never a fragment of it ("RODUCTION AND" under "ROP RODUCTION AND ANAGEMENT").
  const recovered = recoverChapterTitle(cleaned, runningHeads, [cleaned]) ?? cleaned;
  const base = squash(recovered).length >= squash(cleaned).length ? recovered : cleaned;
  const garbledCase = smallCapsGarble(base);
  const restored = restoreDropCaps(garbledCase ? base.toLowerCase() : base, vocab, dictionary);
  return { text: titleCase(tidy(restored.text), garbledCase), repaired: restored.repaired };
}

export type Choice = {
  title: string | null;
  source: Source | null;
  agreed: Source[];
  repaired: string[];
  considered: { text: string; source: Source; refused: string | null }[];
};

const BASE: Record<Source, number> = { "chapter-line": 3, contents: 3, "title-page": 2, heading: 2, "running-head": 1 };
const ORDER: Source[] = ["chapter-line", "contents", "title-page", "running-head", "heading"];
const agree = (a: string, b: string) => squash(a) === squash(b) || (lettersOfTitle(a, b) && lettersOfTitle(b, a));

/**
 * The title from the candidates: the plausible ones scored by their source (a "Chapter N" line or the contents 3,
 * the title page 2, a strong running head 2.5, any other 1) and 2 for every other source that agrees; 2 is enough.
 * For a garbled heading (`garbled`, the title as it stands) only a candidate whose letters the garbled one shares is
 * taken, the garbled title itself mended among them. Ties go to the fewest letters mended, then the source. Pure.
 */
export function chooseTitle(candidates: Candidate[], ctx: TitleContext & { runningHeads: readonly string[]; garbled?: string | null }): Choice {
  const all = ctx.garbled ? [...candidates, { text: ctx.garbled, source: "heading" as const }] : candidates;
  const considered = all.map((c) => {
    const m = mend(c.text, ctx.runningHeads, ctx.vocab, ctx.dictionary);
    let refused = m.text ? implausible(m.text, ctx) : "nothing left once cleaned";
    // A garbled title of three letters or fewer ("Uni" of "Unit 3") says nothing about the title it lost.
    if (!refused && ctx.garbled && squash(ctx.garbled).length > 3 && c.source !== "heading" && !lettersOfTitle(ctx.garbled, m.text) && !subsequence(squash(ctx.garbled), squash(m.text))) refused = "not the garbled title's letters";
    return { text: m.text, source: c.source, strong: c.strong === true, repaired: m.repaired, refused };
  });
  const live = considered.filter((c) => !c.refused);
  // The garbled heading mended is the last resort: it neither lends agreement nor takes any.
  const scored = live
    .map((c) => {
      const agreed = c.source === "heading" ? [] : [...new Set(live.filter((o) => o.source !== c.source && o.source !== "heading" && agree(o.text, c.text)).map((o) => o.source))];
      return { ...c, agreed, score: (c.strong ? 2.5 : BASE[c.source]) + 2 * agreed.length };
    })
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score || a.repaired.length - b.repaired.length || ORDER.indexOf(a.source) - ORDER.indexOf(b.source));
  // The words as printed best: among the winner and the candidates that agree with it, the one with the fewest words
  // the dictionary does not know, then the fewest letters mended ("Determination of Income" over "D Etermination
  // of Ncome", which the contents printed with its drop capitals apart).
  const top = scored[0];
  const unknown = (t: string) => (ctx.dictionary ? t.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 3 && !inDictionary(w, ctx.dictionary!) && !(ctx.vocab.get(w) ?? 0)).length : 0);
  const odd = (t: string) => t.toLowerCase().split(/[^\p{L}]+/u).filter((w) => w.length >= 2 && ctx.dictionary && !inDictionary(w, ctx.dictionary)).length;
  const best = top
    ? [top, ...scored.filter((c) => c !== top && agree(c.text, top.text) && Math.abs(squash(c.text).length - squash(top.text).length) <= squash(top.text).length * 0.15)].sort((a, b) => unknown(a.text) - unknown(b.text) || odd(a.text) - odd(b.text) || a.repaired.length - b.repaired.length)[0]!
    : undefined;
  return {
    title: best?.text ?? null,
    source: top?.source ?? null,
    agreed: top?.agreed ?? [],
    repaired: best?.repaired ?? [],
    considered: considered.map(({ text, source, refused }) => ({ text, source, refused })),
  };
}

/** "Chapter 4" → 4; null when the heading carries no number. */
export function headingNumber(heading: string): number | null {
  const m = /^(?:chapter|unit)?\s*(\d{1,2})\b/i.exec(heading.trim());
  return m ? Number(m[1]) : null;
}

/* ===========================================================================
   The run.
   =========================================================================== */

type Decision = {
  path: string;
  documentId: string;
  kind: "bare" | "garbled";
  chapterNumber: number;
  oldHeading: string;
  oldTitle: string | null;
  /** Why a heading that is not bare was read again (the plausibility check's words). */
  flagged: string | null;
  newHeading: string | null;
  title: string | null;
  source: Source | null;
  agreed: Source[];
  repaired: string[];
  prelims: string | null;
  considered: Choice["considered"];
  reason: string | null;
  applied: boolean;
};

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** The chapter part of a heading: "Chapter 8: Xpressions and" → "Xpressions and". */
const titlePart = (heading: string) => heading.replace(/^(?:chapter|unit)?\s*\d{1,2}\s*[:.]?\s*[—–-]?\s*/i, "").trim();

/**
 * Titles the review of 19 October 2026 refused although the reading passed them: the path and why. The document is
 * left as it is and listed with the reason.
 */
export const REVIEWED_REFUSED: Record<string, string> = {
  "ncert/3/arts/cebu108.pdf": "an activity's heading; the chapter's own title (\"Travel Around\") is set over it in another size",
  "ncert/3/arts/cebu116.pdf": "\"Time !\" is a piece of the running \"It's Circle Time!\" box, not a title",
  "ncert/3/arts/cebu117.pdf": "\"Role Play\" is the activity; the title is run into \"ACT 3 SCENE 5\" on its line",
  "ncert/4/arts/debu109.pdf": "\"Music\" is the strand's opening page, not the chapter's title",
  "ncert/4/arts/debu114.pdf": "\"Dance\" is the strand's opening page, not the chapter's title",
  "ncert/5/arts/eebu101.pdf": "\"Visual Arts\" is the strand's running head",
  "ncert/9/skill-education/iekv109.pdf": "the words of a table's cells, read as a list of chapters",
  "ncert/4/english/desa104.pdf": "\"One Thing a T a Time\": the letters of \"at\" printed apart, mended wrongly",
  "ncert/11/fine-art/kefa103.pdf": "\"Rts\" mended to \"Parts\"; the title is \"Arts of the Mauryan Period\"",
};

/** The English word list on this machine, lower case, or undefined when there is none. */
function loadDictionary(): Set<string> | undefined {
  const file = "/usr/share/dict/words";
  if (!existsSync(file)) return undefined;
  return new Set(readFileSync(file, "utf8").split("\n").map((w) => w.trim().toLowerCase()).filter(Boolean));
}

async function corpusPass(db: PrismaClient): Promise<void> {
  const { extractPdf } = await import("./corpus-pdf");
  const apply = arg("apply") === "true";
  const prefix = arg("prefix")?.replace(/^\/+|\/+$/g, "");
  const dictionary = loadDictionary();
  console.log(dictionary ? `Dictionary: /usr/share/dict/words, ${dictionary.size} words.` : "No dictionary on this machine: the word check uses the chapter's own words alone.");
  // The first chunk of every NCERT and Balbharati textbook: its heading, its number and the book.
  const firsts = await db.$queryRaw<{ id: string; path: string; title: string; subject: string; extra: unknown; heading: string | null }[]>`
    SELECT d."id", d."path", d."title", d."subject", d."extra", c."headingPath"[1] AS "heading"
      FROM "ContentDocument" d
      JOIN "ContentChunk" c ON c."documentId" = d."id"
     WHERE d."kind" = 'textbook' AND d."source" IN ('ncert', 'balbharati')
       AND c."ordinal" = (SELECT min(x."ordinal") FROM "ContentChunk" x WHERE x."documentId" = d."id")
     ORDER BY d."path"`;
  const docs = firsts.filter((d) => !prefix || d.path.startsWith(prefix));
  // The chapter's own words: its text, and the words of its section headings the dictionary knows (a title's words
  // are often a section's too; a heading's drop capitals, "RIGIN", must not become words).
  const vocabFor = async (documentId: string) => {
    const rows = await db.contentChunk.findMany({ where: { documentId }, select: { text: true, headingPath: true } });
    const headingWords = rows.flatMap((c) => c.headingPath.slice(1)).join(" ").toLowerCase().match(/\p{L}+/gu) ?? [];
    return vocabularyOf([...rows.map((c) => c.text), headingWords.filter((w) => !dictionary || dictionary.has(w)).join(" ")]);
  };
  // How many chapters each book has in the corpus (for a contents page that prints no numbers).
  const bookKey = (path: string, extra: unknown) => `${dirname(path)}/${(extra as { bookCode?: string } | null)?.bookCode ?? ""}`;
  const chaptersOf = new Map<string, Set<number>>();
  for (const d of firsts) {
    const n = (d.extra as { chapter?: number } | null)?.chapter;
    if (typeof n !== "number") continue;
    const set = chaptersOf.get(bookKey(d.path, d.extra)) ?? new Set<number>();
    set.add(n);
    chaptersOf.set(bookKey(d.path, d.extra), set);
  }

  // Which documents to read: a bare first heading, or (one chapter a file) a title cut short or short of a letter.
  const work: { doc: (typeof docs)[number]; kind: "bare" | "garbled"; vocab: Vocabulary; n: number; flagged?: string }[] = [];
  const garbledBooks: string[] = [];
  for (const d of docs) {
    const heading = (d.heading ?? "").trim();
    const n = headingNumber(heading) ?? ((d.extra as { chapter?: number } | null)?.chapter ?? null);
    if (isBareHeading(heading)) {
      if (n === null) continue;
      work.push({ doc: d, kind: "bare", vocab: await vocabFor(d.id), n });
      continue;
    }
    const old = titlePart(heading);
    if (!old || n === null) continue;
    const vocab = await vocabFor(d.id);
    const why = implausible(old, { vocab, bookTitle: d.title, subject: d.subject, dictionary });
    if (!why || !/short of its first letter|ends in|printed twice|printed apart|run together/.test(why)) continue;
    // A book a file (Balbharati) carries its chapters' names further in; only a chapter a file is read again here.
    if (typeof (d.extra as { chapter?: number } | null)?.chapter !== "number") {
      garbledBooks.push(`${d.path}  ${heading}  — ${why}`);
      continue;
    }
    work.push({ doc: d, kind: "garbled", vocab, n, flagged: why });
  }
  console.log(`${work.length} document(s) to read again (${work.filter((w) => w.kind === "bare").length} bare, ${work.filter((w) => w.kind === "garbled").length} garbled).`);

  // 1. Every document's pages: its running heads with their reach, and the candidates on its first two pages.
  const readPdf = async (file: string) => (await extractPdf(new Uint8Array(readFileSync(file)), { figures: false, ocrLangs: null })).pages;
  const read = new Map<string, { runningHeads: string[]; heads: { text: string; coverage: number; alone: number }[]; candidates: Candidate[] } | string>();
  for (const { doc, n } of work) {
    const file = join(CORPUS_ROOT, doc.path);
    if (!existsSync(file)) {
      read.set(doc.id, "the PDF is not on disk");
      continue;
    }
    try {
      const pages = await readPdf(file);
      const { runningHeads } = runningHeadsOf(pages);
      read.set(doc.id, { runningHeads, heads: runningHeads.map((text) => ({ text, ...headStats(pages, text) })), candidates: pageCandidates(pages, n) });
    } catch (err) {
      read.set(doc.id, `the PDF could not be read: ${(err as Error).message}`);
    }
  }
  // 2. A running head printed in two chapters of one book is the book's, a strand's or a unit's, not a chapter's.
  const bookOf = (doc: (typeof docs)[number]) => bookKey(doc.path, doc.extra);
  const headDocs = new Map<string, Map<string, number>>();
  for (const { doc } of work) {
    const r = read.get(doc.id);
    if (!r || typeof r === "string") continue;
    const counts = headDocs.get(bookOf(doc)) ?? new Map<string, number>();
    for (const h of new Set(r.runningHeads.map(headKey))) counts.set(h, (counts.get(h) ?? 0) + 1);
    headDocs.set(bookOf(doc), counts);
  }

  // 3. The choice, with the book's contents from its prelims.
  const prelimsCache = new Map<string, PageContent[] | null>();
  const decisions: Decision[] = [];
  for (const { doc, kind, vocab, n, flagged } of work) {
    const file = join(CORPUS_ROOT, doc.path);
    const heading = (doc.heading ?? "").trim();
    const base: Omit<Decision, "title" | "source" | "agreed" | "repaired" | "considered" | "reason" | "newHeading" | "prelims"> = {
      path: doc.path,
      documentId: doc.id,
      kind,
      chapterNumber: n,
      oldHeading: heading,
      oldTitle: kind === "garbled" ? titlePart(heading) : null,
      flagged: flagged ?? null,
      applied: false,
    };
    const r = read.get(doc.id);
    if (!r || typeof r === "string") {
      decisions.push({ ...base, title: null, source: null, agreed: [], repaired: [], considered: [], prelims: null, newHeading: null, reason: typeof r === "string" ? r : "not read" });
      continue;
    }
    const elsewhere = new Set([...(headDocs.get(bookOf(doc)) ?? new Map<string, number>())].filter(([, c]) => c >= 2).map(([h]) => h));
    const candidates: Candidate[] = [...r.candidates, ...headCandidates(r.heads, doc.title, elsewhere)];
    // The book's prelims beside it: <bookCode>ps.pdf (or pr.pdf).
    const code = (doc.extra as { bookCode?: string } | null)?.bookCode;
    let prelimsPath: string | null = null;
    for (const suffix of code ? ["ps.pdf", "pr.pdf"] : []) {
      const p = join(dirname(file), `${code}${suffix}`);
      if (existsSync(p)) {
        prelimsPath = p;
        break;
      }
    }
    if (prelimsPath) {
      if (!prelimsCache.has(prelimsPath)) prelimsCache.set(prelimsPath, await readPdf(prelimsPath).catch(() => null));
      const prelims = prelimsCache.get(prelimsPath);
      const c = prelims ? contentsCandidate(prelims, n, chaptersOf.get(bookOf(doc))?.size ?? 0) : null;
      if (c) candidates.push(c);
    }
    const oldTitle = titlePart(heading);
    const choice = chooseTitle(candidates, { runningHeads: r.runningHeads, vocab, bookTitle: doc.title, subject: doc.subject, dictionary, garbled: kind === "garbled" ? oldTitle : null });
    const refusedOnReview = choice.title ? REVIEWED_REFUSED[doc.path] : undefined;
    const same = kind === "garbled" && choice.title === oldTitle;
    const title = same || refusedOnReview ? null : choice.title;
    decisions.push({
      ...base,
      title,
      source: title ? choice.source : null,
      agreed: choice.agreed,
      repaired: choice.repaired,
      considered: choice.considered,
      prelims: prelimsPath ? prelimsPath.slice(CORPUS_ROOT.length + 1) : null,
      newHeading: title ? `Chapter ${n}: ${title}` : null,
      reason: refusedOnReview
        ? `refused on review ("${choice.title}"): ${refusedOnReview}`
        : same
          ? "the pages give the same title back"
          : title
            ? null
            : kind === "garbled"
              ? "no better title found: kept as it is"
              : "no candidate passed the check",
    });
  }

  // The review table.
  const resolved = decisions.filter((d) => d.newHeading);
  const left = decisions.filter((d) => !d.newHeading);
  const pad = (s: string, w: number) => (s.length > w ? `${s.slice(0, w - 1)}…` : s.padEnd(w));
  console.log(`\n${pad("path", 44)} ${pad("old heading", 30)} ${pad("new title", 58)} source`);
  for (const d of decisions) {
    console.log(`${pad(d.path, 44)} ${pad(d.oldHeading, 30)} ${pad(d.title ?? `— ${d.reason}`, 58)} ${d.source ?? ""}${d.agreed.length ? ` +${d.agreed.join("+")}` : ""}${d.repaired.length ? ` (mended: ${d.repaired.join(", ")})` : ""}`);
  }
  console.log(`\n${decisions.length} document(s) read: ${decisions.filter((d) => d.kind === "bare").length} with a bare heading, ${decisions.filter((d) => d.kind === "garbled").length} with a garbled one; ${resolved.length} titled, ${left.length} left as they are.`);
  if (garbledBooks.length) {
    console.log(`${garbledBooks.length} book-a-file document(s) (Balbharati) open on a heading that fails the check; a book is not read again here:`);
    for (const g of garbledBooks) console.log(`  ${g}`);
  }

  if (apply) {
    for (const d of resolved) {
      const updated = await db.$executeRaw`
        UPDATE "ContentChunk"
           SET "chapter" = CASE WHEN "chapter" = ${d.oldHeading} OR "chapter" IS NULL THEN ${d.newHeading} ELSE "chapter" END,
               "headingPath"[1] = ${d.newHeading}
         WHERE "documentId" = ${d.documentId} AND "headingPath"[1] = ${d.oldHeading}`;
      d.applied = updated > 0;
      if (!d.applied) d.reason = "no chunk carried the old heading any more";
    }
    console.log(`Applied: ${resolved.filter((d) => d.applied).length} document(s) retitled (chapter and headingPath[1] of their chunks; text and embeddings untouched).`);
  } else {
    console.log("Nothing written: --apply writes the titles.");
  }
  // An applied run's record is never overwritten (the bank pass reads it): titles-<date>.json, then -2, -3…; a review
  // run writes titles-<date>-review.json.
  mkdirSync(CORPUS_ROOT, { recursive: true });
  let out = join(CORPUS_ROOT, `titles-${today()}${apply ? "" : "-review"}.json`);
  for (let i = 2; apply && existsSync(out); i++) out = join(CORPUS_ROOT, `titles-${today()}-${i}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), applied: apply, decisions }, null, 2) + "\n");
  console.log(`Decisions: ${out}`);
  if (left.length) {
    console.log(`\nLeft as they are (${left.length}):`);
    for (const d of left) console.log(`  ${d.path}  ${d.oldHeading}  — ${d.reason}`);
  }
}

/* ===========================================================================
   The bank: rename the practice chapters named "Chapter N" or a garbled heading.
   =========================================================================== */

/** The garbled titles the corpus pass corrected, by class, subject and number (from the newest decisions file). */
function correctedGarbles(): { path: string; chapterNumber: number; oldTitle: string; title: string }[] {
  if (!existsSync(CORPUS_ROOT)) return [];
  const files = readdirSync(CORPUS_ROOT).filter((f) => /^titles-\d{4}-\d{2}-\d{2}(?:-\d+)?\.json$/.test(f)).sort();
  const out: { path: string; chapterNumber: number; oldTitle: string; title: string }[] = [];
  for (const f of files) {
    try {
      const data = JSON.parse(readFileSync(join(CORPUS_ROOT, f), "utf8")) as { decisions?: Decision[] };
      for (const d of data.decisions ?? []) if (d.kind === "garbled" && d.applied && d.oldTitle && d.title) out.push({ path: d.path, chapterNumber: d.chapterNumber, oldTitle: d.oldTitle, title: d.title });
    } catch {
      continue;
    }
  }
  return out;
}

/** The batch file the generator wrote for a slug, if content/quiz/generated holds one: its `book`. */
function batchBookFor(slug: string): string | null {
  const dir = join("content", "quiz", "generated");
  if (!existsSync(dir)) return null;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    try {
      const b = JSON.parse(readFileSync(join(dir, f), "utf8")) as { slug?: string; book?: string };
      if (b.slug === slug) return b.book ?? null;
    } catch {
      continue;
    }
  }
  return null;
}

async function topicsPass(db: PrismaClient): Promise<void> {
  const dry = arg("dry") === "true";
  const { selectChapter, subjectCodeOf } = await import("./quiz-gen/select");
  const { chapterNumberOf } = await import("./quiz-gen/checks");
  const garbles = correctedGarbles();
  const topics = await db.quizTopic.findMany({
    where: { audience: "SCHOOL", board: { in: ["NCERT", "BALBHARATI"] } },
    select: { id: true, slug: true, board: true, classLevel: true, subject: true, chapter: true, name: true, retiredAt: true },
    orderBy: [{ board: "asc" }, { classLevel: "asc" }, { subject: "asc" }, { position: "asc" }],
  });
  const subjects = await db.contentDocument.groupBy({ by: ["source", "gradeOrProgramme", "subject"], where: { kind: "textbook", source: { in: ["ncert", "balbharati"] } } });
  let renamed = 0;
  const left: string[] = [];
  for (const t of topics) {
    const n = chapterNumberOf(t.chapter);
    const bare = isBareName(t.name);
    const garble = !bare && n !== null ? garbles.find((g) => g.chapterNumber === n && g.oldTitle === t.name && g.path.startsWith(`${t.board === "NCERT" ? "ncert" : "balbharati"}/${t.classLevel}/`)) : undefined;
    if (!bare && !garble) continue;
    if (n === null) {
      left.push(`${t.slug}: its chapter line "${t.chapter}" carries no number`);
      continue;
    }
    const source = t.board === "NCERT" ? "ncert" : "balbharati";
    const names = subjects
      .filter((s) => s.source === source && s.gradeOrProgramme === String(t.classLevel))
      .map((s) => s.subject)
      .filter((s) => {
        try {
          return subjectCodeOf(s) === t.subject;
        } catch {
          return false;
        }
      });
    let picked: { title: string; book: string; path: string } | null = null;
    for (const subject of names) {
      try {
        const ch = await selectChapter(db, { board: t.board === "NCERT" ? "NCERT" : "Balbharati", grade: t.classLevel, subject, chapter: n });
        picked = { title: ch.chapterName, book: ch.book, path: ch.documentPath };
        break;
      } catch {
        continue;
      }
    }
    if (!picked) {
      left.push(`${t.slug}: no ${t.board} class ${t.classLevel} ${t.subject} chapter ${n} in the corpus`);
      continue;
    }
    if (isBareName(picked.title) || isBareHeading(picked.title)) {
      left.push(`${t.slug}: ${picked.path} still has no title`);
      continue;
    }
    const book = batchBookFor(t.slug);
    if (book && book !== picked.book) {
      left.push(`${t.slug}: its batch was drafted from "${book}", the generator now reads "${picked.book}" (${picked.path})`);
      continue;
    }
    const chapter = `Chapter ${n} — ${picked.title}`;
    // Never two chapters of one name: a run that drafted under a garbled heading made a topic beside the bank's own
    // ("EAL UMBERS" beside "Real Numbers"); its questions belong in the other, which is a decision, not a rename.
    const twin = topics.find((o) => o.id !== t.id && !o.retiredAt && o.board === t.board && o.classLevel === t.classLevel && o.subject === t.subject && squash(o.name) === squash(picked.title) && chapterNumberOf(o.chapter) === n);
    if (twin) {
      left.push(`${t.slug}: "${picked.title}" is already ${twin.slug}'s name; its questions belong there (not moved here)`);
      continue;
    }
    console.log(`${t.slug}: "${t.name}" → "${picked.title}" (${chapter}; ${picked.path})`);
    if (dry) continue;
    await db.quizTopic.update({ where: { id: t.id }, data: { name: picked.title, chapter } });
    // The audit row: no actor and no school; the script that wrote it named in meta.via. Raw, as src/lib/audit.ts writes an unattributed row.
    const meta = JSON.stringify({ via: "scripts/corpus-titles.ts", slug: t.slug, from: { name: t.name, chapter: t.chapter }, to: { name: picked.title, chapter }, document: picked.path, book: picked.book });
    await db.$executeRaw`
      INSERT INTO "AuditLog" ("id", "schoolId", "actorUserId", "action", "targetType", "targetId", "meta", "ip", "createdAt")
      VALUES (${randomUUID()}, NULL, NULL, ${"operator.quizTopic.rename"}, ${"QuizTopic"}, ${t.id}, ${meta}, NULL, ${new Date().toISOString()}::timestamp)`;
    renamed++;
  }
  console.log(`\n${dry ? "Would rename" : "Renamed"} ${dry ? "the chapters above" : `${renamed} practice chapter(s)`}; slugs unchanged, Hindi and Marathi names left for a speaker.`);
  if (left.length) {
    console.log(`Left (${left.length}):`);
    for (const l of left) console.log(`  ${l}`);
  }
}

async function main() {
  config();
  const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
  try {
    await refuseUnlessLocalDatabase(db, "corpus:titles");
    if (arg("topics") === "true") await topicsPass(db);
    else await corpusPass(db);
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && /corpus-titles\.ts$/.test(process.argv[1])) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
