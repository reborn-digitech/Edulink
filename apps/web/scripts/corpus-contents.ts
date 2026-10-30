/**
 * A WHOLE BOOK'S CHAPTERS FROM ITS OWN CONTENTS PAGE (owner-batch-item7, 30 October 2026). Pure: pages in, chapters out.
 *
 * THE FAULT. The chunker (scripts/corpus-chunk.ts elementsOf, cutChunks) opens a chapter only at a level-0 heading, and
 * in a file that holds a whole book (Balbharati serves one PDF a book; NCERT one a chapter) a heading is level 0 only
 * when it is a "Chapter N" / "Unit N" line or is set in the LARGEST heading face of the book. Balbharati prints neither:
 * the chapter's number is a picture (a coloured disc or tab the text layer never carries) and its title stands alone
 * in a face smaller than the cover's ("Basic Concepts in Geometry" at 21 pt under "MATHEMATICS" at 36 pt), so the
 * cover's title became the one chapter of every chunk ("Mathematics", "GENERAL SCIENCE") and the real chapter titles
 * sections or subsections of it. Only a book that prints "N. Title" in its biggest face (class 8 science) came out
 * split. The contents pages are tables whose number column is drawn too, and in some books the whole page is a
 * picture (class 9 and 10 mathematics part 2, class 5 and 7 mathematics), read here only by OCR.
 *
 * THE METHOD, most reliable source first.
 *   1. The contents: a page headed "Contents" or "Index" (or, read by OCR, a header row "Chapters … Pages"); its rows
 *      in the entries' own face, a title wrapped onto a second line joined back, dot leaders and page numbers taken
 *      off ("Basic Concepts in Geometry ........ 1 to 12"); the number printed in front when the text layer has it,
 *      else the row's place in the list; "Answers", "Glossary", "Appendix"… kept as the end of the last chapter. A row
 *      in a larger face below the first entry opens a second sequence (a History and Civics book's Civics).
 *   2. Each title is found on its opening page in the body: a line set at 1.2 times the body or more whose letters
 *      are the title's (the number in front, a label or a line break allowed), searched in order after the contents.
 *      Where the contents prints page numbers, the book's page offset is the one most titles agree with, and a title
 *      the body does not show in a large face is placed by its printed page alone.
 *   3. Failing a contents page, the body's own "N Title" lines in a large face, numbered 1, 2, 3… in page order.
 *   A book is REFUSED, never guessed, when the contents cannot be read, a title cannot be placed, the opening pages do
 *   not rise, or a printed number contradicts the list's order; the refusal says which.
 * Every chunk is then its chapter's by the page it starts on (chaptersByPage, labelChunks).
 */
import type { PageContent, Run } from "./corpus-pdf";
import { cleanHeading, type Element } from "./corpus-chunk";
import { titleCase } from "./corpus-titles";
import { fixTitleCase } from "../src/lib/chapter-title-case";

export type ContentsEntry = { number: number; title: string; page: number | null; endPage: number | null; explicit: boolean; sub?: string };
/** One numbered sequence of a contents page: the book itself, or a second part of it ("Civics") with its own numbers. */
export type ContentsPart = { name: string | null; entries: ContentsEntry[]; /** End matter and exercises between or after the chapters: `after` is how many entries come before it. */ extras: { title: string; page: number | null; after?: number }[] };
export type ContentsBlock = { page: number; parts: ContentsPart[]; ocr: boolean; /** The size of the "Contents" heading, when the page has one. */ headSize?: number };

export type BookChapter = {
  /** 1 for the book's first numbered sequence, 2 for a second one in the same file (a History and Civics book's Civics). */
  part: number;
  partName: string | null;
  number: number;
  title: string;
  /** PDF pages, both inclusive. */
  startPage: number;
  endPage: number;
  /** How the opening page was found. */
  how: "title" | "printed-page" | "numbered-line";
};

export type BookSplit = { chapters: BookChapter[]; refusal: string | null; notes: string[]; method: "contents" | "numbered-lines" | null; contentsPage: number | null };

/* ---------------------------------------------------------------------------------------------------------------
   Small helpers
   --------------------------------------------------------------------------------------------------------------- */

const DEVANAGARI_DIGITS = /[०-९]/g;
export const asciiDigits = (s: string) => s.replace(DEVANAGARI_DIGITS, (d) => String(d.charCodeAt(0) - 0x0966));
export const squash = (s: string) => asciiDigits(s).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

function lcsLength(a: string, b: string): number {
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1]! + 1 : Math.max(prev[j]!, cur[j - 1]!);
    prev = cur;
  }
  return prev[b.length]!;
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
/** "POLITICAL SCIENCE" → "Political Science"; a name in mixed case is left as printed. Pure. */
export function capitalsToTitle(text: string): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t !== t.toUpperCase() || !/\p{Lu}{2}/u.test(t)) return t;
  return t
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** The size most characters of these pages are set in. */
export function bodySize(pages: PageContent[]): number {
  const weight = new Map<number, number>();
  for (const p of pages) if (!p.ocr) for (const r of p.runs) weight.set(Math.round(r.size * 2) / 2, (weight.get(Math.round(r.size * 2) / 2) ?? 0) + r.text.length);
  let best = 10;
  let bestW = -1;
  for (const [s, w] of weight) if (w > bestW) [best, bestW] = [s, w];
  return best;
}

export type Row = { y: number; x: number; size: number; text: string; runs: Run[] };

const joinRuns = (runs: Run[]) => runs.map((r) => r.text.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

/** A page's rows, top to bottom: runs on one baseline (within three points) joined left to right. */
export function rowsOf(page: PageContent): Row[] {
  const sorted = [...page.runs].sort((a, b) => b.y - a.y || a.x - b.x);
  const rows: Run[][] = [];
  for (const r of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last[0]!.y - r.y) <= 3) last.push(r);
    else rows.push([r]);
  }
  return rows.map((runs) => {
    runs.sort((a, b) => a.x - b.x);
    return { y: runs[0]!.y, x: runs[0]!.x, size: Math.max(...runs.map((r) => r.size)), text: joinRuns(runs), runs };
  });
}

/* ---------------------------------------------------------------------------------------------------------------
   1. The contents page
   --------------------------------------------------------------------------------------------------------------- */

const CONTENTS_WORD = /^[-–—*•\s]*(?:table\s+of\s+)?(?:contents?|index|अनुक्रमणिका|अनुक्रम|विषय\s*सूची)[-–—*•\s:.]*$/i;
const HEADER_WORDS = new Set(["sr", "s", "sl", "no", "nos", "number", "chapter", "chapters", "chapter's", "name", "names", "lesson", "lessons", "lesson's", "title", "titles", "page", "pages", "pg", "unit", "units", "topic", "topics", "part", "contents", "content", "index", "of", "the", "sub", "subject", "month", "months", "period", "periods", "and", "area", "field", "expected", "tentative", "proposed"]);
/** A contents row that ends the chapters rather than being one. */
const EXTRA = /^(?:answers?\b|answer key|glossary|appendix|appendices|annexure|bibliography|references|reference books|logarithm|(?:statistical |log(?:arithm)? )?tables?$|model (?:question )?paper|question bank|terminology|practicals?$|projects?$|activities$|activity pages?$|index$|list of practicals|list of abbreviations|miscellaneous exercises?\b|revision exercises?\b|practice papers?\b|(?:world |outline )?maps? for reference|world maps?\b)/i;

function headerWords(text: string): string[] {
  return text.toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z' ]+/g, " ").split(/\s+/).filter(Boolean);
}
/** "Sr. No.  Chapter  Page No.", "Chapters Pages": every word a column header's. */
/** "I N D E X", "C O N T E N T S": a heading set letter-spaced, read as its word. */
const unspaced = (t: string) => (/^[-–—*•\s]*(?:\p{L} ){3,}\p{L}[-–—*•\s]*$/u.test(t) ? t.replace(/(?<=\p{L}) (?=\p{L})/gu, "") : t);
const isContentsWord = (t: string) => CONTENTS_WORD.test(unspaced(t));

export function isHeaderRow(text: string): boolean {
  // A header carries no number: "Part 2" over a table's second half is a heading of its own.
  if (/\d/.test(text)) return false;
  const w = headerWords(text);
  return w.length > 0 && w.every((x) => HEADER_WORDS.has(x));
}

/** A title ending in a word that cannot end one: its line runs on ("Biodiversity, Conservation and" / "Environmental Issues"). */
const HANGING = /(?:\b(?:a|an|and|as|at|by|for|from|in|into|of|on|or|the|to|with)|[-–,:&])$/i;

type RawEntry = { number: number | null; title: string; page: number | null; endPage: number | null; size: number; y: number; /** "3. A": the letter of a chapter printed in two. */ sub?: string; hangs?: boolean; /** The mark the line ended in: ":", ",", "-". */ mark?: string };

/** One row of a contents table: the number in front, the title, the page or page range after its leaders. Pure. */
/**
 * An OCR'd contents row made plain: dot leaders read as letters ("Similarity oiiieniininieniisissessn… 1 to 29") turned
 * back into dots, a page range whose "to" ran into its numbers dropped, and "to" read as "10" between two page numbers
 * ("47 10 90") put back. Pure.
 */
export function ocrRow(text: string): string {
  // A word of ten letters or more with one letter three times running ("oiiieniini…", "cccceeevv…"): no English word does.
  let t = text.replace(/[.…·_]{3,}/g, " ........ ").replace(/\S{10,}/g, (w) => (/(\p{L})\1\1/u.test(w.toLowerCase()) ? " ........ " : w));
  // A word of four letters or more drawn from two letters at most ("icici", "cccc") is a leader's remains.
  t = t.replace(/(?<=\s)\p{Ll}{4,}[.,]?(?=\s|$)/gu, (w) => (new Set(w.replace(/[.,]$/, "")).size <= 2 ? " " : w));
  // A page range read with its "to" run into the numbers ("191079", "11029"): no page is told from it.
  t = t.replace(/\s\d{4,6}\s*$/, "");
  t = t.replace(/(?:^|\s)(\d{1,3})\s*(?:to|t0|lo|io)\s*(\d{1,3})\s*$/i, (m, a: string, b: string) => (Number(b) > Number(a) ? ` ${a} to ${b}` : m));
  t = t.replace(/(?:^|\s)(\d{1,3})\s+(?:10|t0|lo|io)\s+(\d{1,3})\s*$/i, (m, a: string, b: string) => (Number(b) > Number(a) ? ` ${a} to ${b}` : m));
  return t.replace(/\s+/g, " ").trim();
}

export function parseContentsRow(text: string): Omit<RawEntry, "size" | "y"> | null {
  // Dot leaders part the title from its page: a number before them is the title's ("Changing Life : 1 ......").
  const pieces = asciiDigits(text).split(/\s*[.…·_]{3,}\s*/);
  let t = pieces[0]!.replace(/\s+/g, " ").trim();
  const tail = pieces.length > 1 ? pieces.slice(1).join(" ").replace(/\s+/g, " ").trim() : null;
  // A bullet in front: a dingbat, or a symbol font's "x" ("x GLOSSARY OF ECONOMIC TERMS").
  t = t.replace(/^[|•▪●➢❖\-–\s]+|[|•▪●\s]+$/g, "").replace(/^[xX]\s+(?=\p{Lu})/u, "");
  let number: number | null = null;
  let sub: string | undefined;
  const subLead = /^(\d{1,2})\s*[.)]?\s*([A-E])\s+(?=\p{L})/u.exec(t);
  const lead = /^(\d{1,2})\s*[.)]?\s+(?=[\p{L}“"'(])/u.exec(t);
  if (subLead) {
    number = Number(subLead[1]);
    sub = subLead[2];
    t = t.slice(subLead[0].length);
  } else if (lead) {
    number = Number(lead[1]);
    t = t.slice(lead[0].length);
  }
  let page: number | null = null;
  let endPage: number | null = null;
  const RANGE = /(?:^|\s)(\d{1,3})\s*(?:-|–|—|to)\s*(\d{1,3})\s*$/i;
  const SINGLE = /(?:^|\s)(\d{1,3})\s*$/;
  if (tail !== null) {
    const r = RANGE.exec(tail) ?? SINGLE.exec(tail);
    if (r) [page, endPage] = [Number(r[1]), r[2] ? Number(r[2]) : null];
  } else {
    const r = RANGE.exec(t) ?? SINGLE.exec(t);
    // A number after a colon or a label is the title's own ("Changing Life : 2", "Exogenetic Processes Part 1").
    if (r && !/(?::|\bpart|\bno\.?|\bclass|\bstd\.?)\s*$/i.test(t.slice(0, r.index))) {
      [page, endPage] = [Number(r[1]), r[2] ? Number(r[2]) : null];
      t = t.slice(0, r.index).trim();
    }
  }
  // A title that cannot end where the line does ("Maratha Sardars -", "… Conservation and") runs on below.
  const hangs = HANGING.test(t.trim());
  // The mark a wrapped title broke after ("Maratha Sardars -", "since 1991:"), kept for the join.
  const mark = /\s*([:,;]|\s[-–])\s*$/.exec(t)?.[1]?.trim() ?? "";
  t = t.replace(/[\s.:;,\-–]+$/, "").trim();
  if ((t.match(/\p{L}/gu) ?? []).length < 3 || t.length > 140) return null;
  return { number, title: t, page, endPage, ...(sub ? { sub } : {}), ...(hangs ? { hangs } : {}), ...(mark ? { mark } : {}) };
}

/** A line under a contents table that is not an entry. */
const NOTE = /^(?:s\.?\s*o\.?\s*i\.?\b|note\b|disclaimer|front cover|back cover|cover\b|\(\d\)|©|the following foot ?notes|maps? in (?:the )?textbooks?)/i;

/** A column of a contents table that is neither the number, the title nor the page: "Area", "Field", "Expected Number of Periods". */
const OTHER_COLUMN = /^(?:area|field|expected|tentative|proposed|number of periods|periods?|months?|marks|weightage|skills?|competenc)/i;

/**
 * The contents of a page, or null: the rows after the "Contents" heading (or, `headless`, after a header row "Chapters …
 * Pages": an OCR'd page or a continuation page), in the entries' own face, as numbered entries. A column the header
 * names that is not the title's ("Area": Physical Geography) is left out of the titles; a number printed on its own
 * line goes with the title beside it; a title wrapped onto a second line is joined back; the table ends at a note under
 * it or a gap of more than two and a half rows. Where most entries print their number, an unnumbered line is a
 * section's heading ("Section II: Comparative Government"), not a chapter; "3. A" and "3. B" are one chapter 3. Pure.
 */
export function contentsOf(page: PageContent, opts: { headless?: boolean } = {}): ContentsBlock | null {
  const rows = rowsOf(page).filter((r) => r.text);
  let start = rows.findIndex((r) => isContentsWord(r.text));
  // The part's own title over its contents ("POLITICAL SCIENCE" above "Contents"): the largest row above the word.
  const above = start > 0 ? rows.slice(0, start).filter((r) => r.size > (rows[start]?.size ?? 0) * 0.9 && /\p{L}{3}/u.test(r.text)).sort((a, b) => b.size - a.size)[0] : undefined;
  const tableHeader = rows.findIndex((r) => isHeaderRow(r.text) && headerWords(r.text).some((w) => /^(chapters?|lessons?|titles?|units?|topics?|pages?)$/.test(w)));
  if (start < 0) {
    if (!opts.headless) return null;
    // Headless, a text layer's table needs a page column too ("Sr. No. Topic Page No."): a competency table has none.
    if (tableHeader >= 0 && (page.ocr || headerWords(rows[tableHeader]!.text).some((w) => /^(pages?|pg)$/.test(w)))) start = tableHeader - 1;
    else if (page.ocr) {
      // An OCR'd contents with neither its heading nor a header row read (both drawn): four rows or more numbered 1, 2,
      // 3… from the top of the list.
      const first = rows.findIndex((r) => /^1\s*[.)]\s+\p{L}/u.test(asciiDigits(r.text)));
      let n = 0;
      for (let i = Math.max(first, 0); first >= 0 && i < rows.length; i++) if (new RegExp(`^${n + 1}\\s*[.)]\\s+\\p{L}`, "u").test(asciiDigits(rows[i]!.text))) n++;
      if (first < 0 || n < 4) return null;
      start = first - 1;
    } else return null;
  } else if (tableHeader >= 0 && tableHeader < start) {
    // "CONTENTS" set down the margin beside its table (the Standard XII physics): the table starts at its header row.
    start = tableHeader - 1;
  }
  const after = rows.slice(start + 1);
  // The table's header rows (one or two lines: "Expected Number" over "of Periods") end the lines above them.
  let lastHeader = -1;
  for (let i = 0; i < Math.min(after.length, 7); i++) if (isHeaderRow(after[i]!.text)) lastHeader = i;
  const headerRuns = lastHeader >= 0 ? after.slice(0, lastHeader + 1).flatMap((r) => r.runs) : [];
  // Each run goes to the header nearest its middle; a run under "Area" or "Field" is not the title's.
  const columns = headerRuns.map((r) => ({ mid: r.x + r.width / 2, other: OTHER_COLUMN.test(r.text.trim()) }));
  const inOtherColumn = (r: Run) => {
    const mid = r.x + r.width / 2;
    const col = [...columns].sort((a, b) => Math.abs(a.mid - mid) - Math.abs(b.mid - mid))[0];
    return !!col?.other;
  };
  const tableRows = (lastHeader >= 0 ? after.slice(lastHeader + 1) : after).map((row) => ({ ...row, text: page.ocr ? ocrRow(row.text) : columns.some((c) => c.other) ? joinRuns(row.runs.filter((r) => !inOtherColumn(r))) : row.text })).filter((r) => r.text && !isHeaderRow(r.text) && !isContentsWord(r.text));
  // A number printed on a line of its own ("11." between "Directions for Sustainable" and "Development") goes in front
  // of the nearest title line, the upper one on a tie.
  const lines: { y: number; size: number; text: string }[] = [];
  for (let i = 0; i < tableRows.length; i++) {
    const r = tableRows[i]!;
    const lone = /^(\d{1,2})\s*\.?$/.exec(asciiDigits(r.text).trim());
    if (lone && /\./.test(r.text)) {
      const upper = lines[lines.length - 1];
      const lower = tableRows[i + 1];
      const dUp = upper ? upper.y - r.y : Infinity;
      const dDown = lower ? r.y - lower.y : Infinity;
      if (upper && dUp <= dDown && dUp < r.size * 1.4 && !/^\d/.test(upper.text)) upper.text = `${lone[1]}. ${upper.text}`;
      else if (lower && dDown < r.size * 1.4) tableRows[i + 1] = { ...lower, text: `${lone[1]}. ${lower.text}` };
      continue;
    }
    lines.push({ y: r.y, size: r.size, text: r.text });
  }
  const raw: RawEntry[] = [];
  for (const line of lines) {
    const e = parseContentsRow(line.text);
    if (e) raw.push({ ...e, size: line.size, y: line.y });
    else if (/^\s*[.…·_\d\s\-–]+$/.test(asciiDigits(line.text)) && raw.length) {
      // A page number or range alone on the row (its title's leaders ran to the next baseline).
      const p = parseContentsRow(`x x x ${line.text}`);
      const last = raw[raw.length - 1]!;
      if (p && last.page === null && Math.abs(last.y - line.y) < line.size * 1.4) [last.page, last.endPage] = [p.page, p.endPage];
    }
  }
  if (raw.length < 3) return null;
  // The entries' face: the commonest size among the short rows; a footnote is smaller, a page's or part's title larger.
  const sizes = new Map<number, number>();
  for (const e of raw) if (e.title.length <= 70) sizes.set(Math.round(e.size), (sizes.get(Math.round(e.size)) ?? 0) + 1);
  if (!sizes.size) return null;
  const face = [...sizes].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]![0];
  // The table ends at a gap of more than two and a half of its rows, once it has three entries.
  const inFace = raw.filter((e) => e.size >= face * 0.8 && e.size <= face * 1.2);
  const steps = inFace.slice(1).map((e, i) => inFace[i]!.y - e.y).filter((g) => g > 0).sort((a, b) => a - b);
  const step = steps[Math.floor(steps.length / 2)] ?? face * 2;
  const parts: ContentsPart[] = [{ name: null, entries: [], extras: [] }];
  const kept: RawEntry[] = [];
  let lastY: number | null = null;
  let count = 0;
  for (const e of raw) {
    if (e.size < face * 0.8) continue;
    if (lastY !== null && count >= 3 && e.size <= face * 1.2 && lastY - e.y > Math.max(step * 2.5, face * 4)) break;
    // A note under the table ends it: a footnote, a disclaimer, the covers' captions, a sentence.
    if (count >= 3 && (NOTE.test(e.title) || e.title.length > 100)) break;
    if (NOTE.test(e.title) || e.title.length > 100) continue;
    // A larger row with its page printed is an entry set larger ("GCD and LCM", 33-42); without one, below the entries
    // it opens a second sequence, above them it is the page's title.
    if (e.size > face * 1.2 && e.page === null) {
      if (kept.length && e.title.length <= 60) {
        parts.push({ name: e.title, entries: [], extras: [] });
        kept.push({ ...e, number: -1 });
        lastY = e.y;
      }
      continue;
    }
    kept.push(e);
    lastY = e.y;
    count++;
  }
  // A title wrapped onto a second row: a row with no number of its own, closer under the one above than the rows are
  // to each other, or starting in lower case, or under a title that cannot end where it does.
  const gaps: number[] = [];
  for (let i = 1; i < kept.length; i++) if (kept[i]!.number !== -1 && kept[i - 1]!.number !== -1) gaps.push(kept[i - 1]!.y - kept[i]!.y);
  const sortedGaps = [...gaps].sort((a, b) => a - b);
  const median = sortedGaps[Math.floor(sortedGaps.length / 2)] ?? 0;
  const joined: RawEntry[] = [];
  for (const e of kept) {
    const prev = joined[joined.length - 1];
    const close = prev ? prev.y - e.y < median * 0.72 : false;
    if (prev && prev.number !== -1 && e.number === null && !EXTRA.test(e.title) && (close || /^[\p{Ll}&(]/u.test(e.title) || prev.hangs) && `${prev.title} ${e.title}`.length <= 120) {
      const mark = prev.mark ? (/[-–]/.test(prev.mark) ? ` ${prev.mark}` : prev.mark) : "";
      prev.title = `${prev.title}${mark} ${e.title}`.replace(/\s+/g, " ");
      prev.hangs = e.hangs;
      prev.mark = e.mark;
      if (e.page !== null) [prev.page, prev.endPage] = [e.page, e.endPage];
      prev.y = e.y;
      continue;
    }
    joined.push({ ...e });
  }
  // The numbers printed from 1 on: a line without one is a section's heading or a map's page, not a chapter. (Printed
  // only from 10 on, the first nine were drawn: every line is an entry.)
  const firstPrinted = joined.find((e) => e.number !== null && e.number !== -1);
  const printsAll = !!firstPrinted && firstPrinted.number === 1 && joined.filter((e) => e.number !== null && e.number !== -1).length >= 3;
  const entries = printsAll ? joined.filter((e) => e.number !== null || EXTRA.test(stripRomanLead(e.title))) : joined;
  let part = parts[0]!;
  let partIndex = 0;
  for (const e of entries) {
    if (e.number === -1) {
      part = parts[++partIndex]!;
      continue;
    }
    const extra = EXTRA.test(stripRomanLead(e.title));
    // A printed number 1 again after entries opens a second sequence too (the same face, no title row between).
    if (e.number === 1 && part.entries.length >= 2 && !extra && !e.sub) {
      parts.splice(++partIndex, 0, { name: null, entries: [], extras: [] });
      part = parts[partIndex]!;
    }
    if (extra || (part.extras.length && e.number === null)) {
      part.extras.push({ title: stripRomanLead(e.title), page: e.page, after: part.entries.length });
      continue;
    }
    // "3. A Demand Analysis", "3. B Elasticity of Demand": one chapter 3, its two titles joined.
    const prev = part.entries[part.entries.length - 1];
    if (e.sub && prev && prev.explicit && prev.number === e.number && prev.sub) {
      prev.title = `${prev.title} and ${e.title}`;
      if (e.endPage !== null || e.page !== null) prev.endPage = e.endPage ?? prev.endPage;
      prev.sub = e.sub;
      continue;
    }
    part.entries.push({ number: e.number ?? 0, title: e.title, page: e.page, endPage: e.endPage, explicit: e.number !== null, ...(e.sub ? { sub: e.sub } : {}) });
  }
  // A heading over the rest of the table whose numbers run on ("Part 2" over 10. Division of Polynomials): one sequence.
  for (let i = parts.length - 1; i > 0; i--) {
    const first = parts[i]!.entries[0];
    const before = parts[i - 1]!;
    const lastNo = before.entries.length ? Math.max(...before.entries.map((e, k) => (e.explicit ? e.number : k + 1))) : 0;
    if (first?.explicit && before.entries.length && first.number === lastNo + 1) {
      const n = before.entries.length;
      before.entries.push(...parts[i]!.entries);
      before.extras.push(...parts[i]!.extras.map((x) => ({ ...x, after: (x.after ?? 0) + n })));
      parts.splice(i, 1);
    }
  }
  for (const p of parts) {
    // A sub-letter with no sibling was the title's first word ("1. A Journey of Light").
    for (const e of p.entries) {
      if (e.sub && !p.entries.some((o) => o !== e && o.number === e.number) && !/ and /.test(e.title)) e.title = `${e.sub} ${e.title}`;
      delete e.sub;
    }
    // A trailing number that is not a page (it breaks the pages' rise): part of the title ("Changing Life : 1").
    let last = 0;
    for (const e of p.entries) {
      if (e.page !== null && e.endPage === null && e.page < last) {
        e.title = `${e.title} ${e.page}`;
        e.page = null;
      }
      if (e.page !== null) last = e.page;
    }
    // The numbers: printed where the text layer has them, else the place in the list.
    p.entries.forEach((e, i) => {
      if (!e.explicit) e.number = i + 1;
    });
  }
  const real = parts.filter((p) => p.entries.length > 0);
  if (!real.length || real.reduce((n, p) => n + p.entries.length, 0) < 3) return null;
  if (above && real.length) real[0]!.name = real[0]!.name ?? above.text;
  const head = rows.find((r) => isContentsWord(r.text));
  return { page: page.page, parts: real, ocr: page.ocr, ...(head ? { headSize: head.size } : {}) };
}

/** "I. Annexure : Acronyms" → "Annexure : Acronyms": a Roman numeral in front of an end-matter row. */
const stripRomanLead = (t: string) => t.replace(/^[IVX]{1,4}\s*[.)]\s*/, "");

/** A block's numbering problem, or null: the numbers must run 1, 2, 3… in each part (a printed one must agree with its place). */
export function numberingProblem(block: ContentsBlock): string | null {
  for (const p of block.parts) {
    for (let i = 0; i < p.entries.length; i++) {
      const e = p.entries[i]!;
      if (e.number !== i + 1) return `the contents on page ${block.page} prints ${e.number} for its ${i + 1}${["st", "nd", "rd"][i] ?? "th"} entry ("${e.title}")`;
    }
  }
  return null;
}

/* ---------------------------------------------------------------------------------------------------------------
   2. The opening pages
   --------------------------------------------------------------------------------------------------------------- */

/** A chapter's title is set at this many times the body or more (class 4 EVS part 2 sets its last two at 16 over 14). */
const LARGE = 1.12;

/** The title lines a page sets in a large face (LARGE times the body or more), each line and each pair of lines joined. */
export function titleLines(page: PageContent, body: number): string[] {
  const big = rowsOf({ ...page, runs: page.runs.filter((r) => r.size >= body * LARGE && /\p{L}/u.test(r.text) && r.text.length <= 150) });
  const out: string[] = [];
  for (let i = 0; i < big.length; i++) {
    out.push(big[i]!.text);
    let joined = big[i]!.text;
    for (let j = i + 1; j < Math.min(big.length, i + 3); j++) {
      if (big[j - 1]!.y - big[j]!.y > big[j]!.size * 2.6) break;
      joined = `${joined} ${big[j]!.text}`;
      out.push(joined);
    }
  }
  return out;
}

const LEAD_LABEL = /^(?:(?:chapter|lesson|unit)\s*[-–:]?\s*)?\d{1,2}\s*[.:)\-–]?\s*/i;
const stripLead = (s: string) => asciiDigits(s).replace(LEAD_LABEL, "");

/** How well a line printed on a page is the title: 1 the same letters, down to 0. Pure. */
export function titleScore(title: string, line: string): number {
  const t = squash(stripLead(title));
  const c = squash(stripLead(cleanHeading(line) || line));
  if (t.length < 3 || c.length < 3) return 0;
  if (c === t) return 1;
  // The title and then a subtitle after a mark ("Our District-Brihanmumbai" for "Our District").
  const lineWords = stripLead(cleanHeading(line) || line).toLowerCase().replace(/\s+/g, " ").trim();
  const titleWords = stripLead(title).toLowerCase().replace(/\s+/g, " ").trim();
  if (titleWords.length >= 6 && lineWords.startsWith(titleWords) && /^\s*[-–:(]/.test(lineWords.slice(titleWords.length))) return 0.9;
  if (c.includes(t) && t.length >= c.length * 0.55) return 0.95;
  if (t.includes(c) && c.length >= t.length * 0.8) return 0.9;
  const lcs = lcsLength(t, c);
  const r = lcs / Math.max(t.length, c.length);
  return r >= 0.85 ? r * 0.95 : 0;
}

function bestOnPage(title: string, page: PageContent, body: number): number {
  let best = 0;
  for (const line of titleLines(page, body)) best = Math.max(best, titleScore(title, line));
  return best;
}

/** The title's line on the page in the body's large face, as printed, or null. */
export function printedTitle(title: string, page: PageContent, body: number): string | null {
  let best: { line: string; score: number } | null = null;
  for (const line of titleLines(page, body)) {
    const s = titleScore(title, line);
    if (s >= 0.85 && (!best || s > best.score || (s === best.score && line.length < best.line.length))) best = { line, score: s };
  }
  return best ? cleanHeading(stripLead(best.line)) : null;
}

type Placed = { entry: ContentsEntry; page: number | null; how: BookChapter["how"] | null; /** The opening page's own title, when it is not the contents' (an older edition's contents). */ printed?: string };

/**
 * The opening page of each entry of one part, between `from` and `to` (PDF pages, inclusive). Pure. The offset between
 * printed and PDF pages is the one most titles found agree with; a title not found in a large face is placed by its
 * printed page; a title found far from where its printed page puts it is moved there when two thirds agree on the offset.
 */
export function placeEntries(pages: PageContent[], entries: ContentsEntry[], from: number, to: number, body: number): { placed: Placed[]; offset: number | null } {
  const byNumber = new Map(pages.map((p) => [p.page, p]));
  const candidates = entries.map((e) => {
    const out: number[] = [];
    for (let p = from; p <= to; p++) {
      const page = byNumber.get(p);
      if (page && bestOnPage(e.title, page, body) >= 0.85) out.push(p);
    }
    return out;
  });
  // The offset most entries with a printed page support.
  const votes = new Map<number, Set<number>>();
  entries.forEach((e, i) => {
    if (e.page === null) return;
    for (const p of candidates[i]!) {
      const o = p - e.page;
      votes.set(o, (votes.get(o) ?? new Set()).add(i));
    }
  });
  const printed = entries.filter((e) => e.page !== null).length;
  const top = [...votes].sort((a, b) => b[1].size - a[1].size)[0];
  const offset = top && top[1].size >= Math.max(2, Math.ceil(printed * 0.5)) ? top[0] : null;
  const placed: Placed[] = [];
  let prev = from - 1;
  entries.forEach((e, i) => {
    const after = candidates[i]!.filter((p) => p > prev);
    let page: number | null = null;
    let how: Placed["how"] = null;
    if (offset !== null && e.page !== null) {
      const expected = e.page + offset;
      const near = after.find((p) => Math.abs(p - expected) <= 1);
      // Before the next entry's printed page: where the title itself is printed beats a page number misread.
      const nextPrinted = entries.slice(i + 1).find((x) => x.page !== null)?.page ?? null;
      const before = after.find((p) => p < (nextPrinted !== null ? nextPrinted + offset : to + 1));
      if (near !== undefined) [page, how] = [near, "title"];
      else if (before !== undefined) [page, how] = [before, "title"];
      else if (expected > prev && expected <= to) [page, how] = [expected, "printed-page"];
    } else if (after.length) [page, how] = [after[0]!, "title"];
    if (page !== null) prev = page;
    placed.push({ entry: e, page, how });
  });
  // A title the body does not print: its number on an opening page between its neighbours' ("6. Water Literacy" where
  // the contents, an older edition's, says "Water Awareness"); the body's title is then the chapter's.
  placed.forEach((p, i) => {
    if (p.page !== null) return;
    const lo = (placed.slice(0, i).reverse().find((x) => x.page !== null)?.page ?? from - 1) + 1;
    const hi = (placed.slice(i + 1).find((x) => x.page !== null)?.page ?? to + 1) - 1;
    for (let pg = lo; pg <= hi; pg++) {
      const page = byNumber.get(pg);
      if (!page) continue;
      const line = titleLines(page, body)
        .map((l) => ({ l, m: new RegExp(`^(?:(?:chapter|lesson|unit)\\s*[-–:]?\\s*)?${p.entry.number}\\s*[.:)\\-–]?\\s+(\\p{L}.{2,})$`, "iu").exec(asciiDigits(l.trim())) }))
        .find((x) => x.m);
      if (line) {
        p.page = pg;
        p.how = "numbered-line";
        p.printed = cleanHeading(line.m![1]!);
        break;
      }
    }
  });
  return { placed, offset };
}

/* ---------------------------------------------------------------------------------------------------------------
   3. No contents: the body's own numbered titles
   --------------------------------------------------------------------------------------------------------------- */

/** "1 Sources of History", "3. Force and Pressure" in a large face, numbered 1, 2, 3… in page order. Pure. */
export function numberedStarts(pages: PageContent[], body: number, from = 1): { number: number; title: string; page: number }[] {
  const out: { number: number; title: string; page: number }[] = [];
  for (const p of pages) {
    if (p.page < from) continue;
    const want = out.length + 1;
    for (const line of titleLines(p, body)) {
      const m = /^(?:(?:chapter|lesson|unit)\s*[-–:]?\s*)?(\d{1,2})\s*[.:)\-–]?\s+(\p{L}.{2,})$/iu.exec(asciiDigits(line.trim()));
      if (m && Number(m[1]) === want) {
        out.push({ number: want, title: cleanHeading(m[2]!), page: p.page });
        break;
      }
    }
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------------------------
   The split
   --------------------------------------------------------------------------------------------------------------- */

/** Where a contents block is read from: a page's text layer, or an OCR'd page given by the caller. */
export function contentsBlocks(pages: PageContent[], frontPages = 24): ContentsBlock[] {
  const out: ContentsBlock[] = [];
  const merged = new Set<number>();
  for (const p of pages) {
    if (merged.has(p.page)) continue;
    const front = p.page <= frontPages;
    const block = contentsOf(p, { headless: front });
    if (!block) continue;
    out.push(block);
    // A contents table run over to the next page: its rows continue the numbers or the pages.
    const next = pages.find((q) => q.page === p.page + 1);
    if (next && !contentsOf(next)) {
      const more = contentsOf(next, { headless: true });
      const lastPart = block.parts[block.parts.length - 1]!;
      const lastEntry = lastPart.entries[lastPart.entries.length - 1];
      const firstMore = more?.parts[0]?.entries[0];
      const continues = more && firstMore && lastEntry && ((firstMore.explicit && firstMore.number === lastEntry.number + 1) || (firstMore.page !== null && lastEntry.page !== null && firstMore.page > lastEntry.page));
      if (more && continues) {
        for (const e of more.parts[0]!.entries) lastPart.entries.push({ ...e, number: e.explicit ? e.number : lastPart.entries.length + 1 });
        lastPart.extras.push(...more.parts[0]!.extras);
        block.parts.push(...more.parts.slice(1));
        merged.add(next.page);
      }
    }
  }
  return out;
}

/**
 * The book's chapters, or a refusal. `pages` are the book's pages (the contents page may be an OCR'd one). Pure.
 */
/** The split from one contents block found in the front pages, or its refusal. Pure. */
function splitFrom(pages: PageContent[], blocks: ContentsBlock[], front: ContentsBlock, body: number, last: number): BookSplit {
  const notes: string[] = [];
  const problem = numberingProblem(front);
  if (problem) return { chapters: [], refusal: problem, notes, method: null, contentsPage: front.page };
  // A later contents page opens a part of its own when its titles are found after it (a History and Civics book).
  // Only a block every one of whose titles is printed after it, in a contents heading set larger than the body (a
  // map's legend headed "Index" is neither); a refused one does not end the chapters before it.
  const later = blocks.filter((b) => {
    if (b.page <= front.page + 2 || numberingProblem(b) || (b.headSize ?? 0) < body * 1.15) return false;
    const all = b.parts.flatMap((p) => p.entries);
    const ok = placeEntries(pages, all, b.page + 1, last, body).placed.every((x) => x.page !== null);
    if (!ok) notes.push(`the contents on page ${b.page} was not taken as a part: its titles are not all printed after it ("${all[0]?.title ?? ""}"…)`);
    return ok;
  });
  // A later part's own cover a few pages before its contents ("Civics" alone on a page, in a very large face): its
  // name when the contents page carries none, and the end of the part before it.
  const coverOf = (b: ContentsBlock): { page: number; name: string } | null => {
    for (let pg = b.page; pg >= Math.max(front.page + 1, b.page - 4); pg--) {
      const page = pages.find((x) => x.page === pg);
      if (!page) continue;
      const words = page.runs.filter((r) => /\p{L}{3}/u.test(r.text));
      const top = [...words].sort((a, b2) => b2.size - a.size)[0];
      if (pg < b.page && top && words.length <= 4 && top.size >= body * 2 && top.text.trim().length <= 40) return { page: pg, name: top.text.trim() };
      if (pg === b.page && b.parts[0]?.name) return { page: pg, name: b.parts[0].name };
    }
    return null;
  };
  const sequences: { block: ContentsBlock; part: ContentsPart; from: number; startsAt: number }[] = [];
  for (const part of front.parts) sequences.push({ block: front, part, from: front.page + 1, startsAt: front.page });
  for (const b of later) {
    const cover = coverOf(b);
    if (cover && b.parts[0] && !b.parts[0].name) b.parts[0].name = cover.name;
    for (const part of b.parts) sequences.push({ block: b, part, from: b.page + 1, startsAt: cover?.page ?? b.page });
  }
  const chapters: BookChapter[] = [];
  let partNo = 0;
  for (let s = 0; s < sequences.length; s++) {
    const seq = sequences[s]!;
    const nextSeq = sequences.slice(s + 1).find((x) => x.block !== seq.block);
    const to = nextSeq ? nextSeq.startsAt - 1 : last;
    // A part of the front page's table after the first starts after the previous part's chapters.
    const from = s > 0 && seq.block === sequences[s - 1]!.block ? (chapters[chapters.length - 1]?.startPage ?? seq.from) + 1 : seq.from;
    const { placed, offset } = placeEntries(pages, seq.part.entries, from, to, body);
    const missing = placed.filter((p) => p.page === null);
    if (missing.length) {
      if (seq.block !== front) {
        notes.push(`the contents on page ${seq.block.page} was not taken as a part: ${missing.length} of its ${placed.length} titles are not printed after it ("${missing[0]!.entry.title}")`);
        continue;
      }
      return { chapters: [], refusal: `${missing.length} of ${placed.length} chapters not found in the body: ${missing.slice(0, 4).map((m) => `${m.entry.number}. "${m.entry.title}"`).join(", ")}${missing.length > 4 ? "…" : ""}`, notes, method: null, contentsPage: front.page };
    }
    partNo++;
    const partName = partNo === 1 ? null : capitalsToTitle(seq.part.name ?? `Part ${partNo}`);
    const extraPage = seq.part.extras.find((x) => x.page !== null)?.page ?? null;
    const lastEntry = seq.part.entries[seq.part.entries.length - 1]!;
    let partEnd = to;
    if (offset !== null && lastEntry.endPage !== null && lastEntry.endPage + offset <= to) partEnd = lastEntry.endPage + offset;
    else if (offset !== null && extraPage !== null && extraPage + offset - 1 <= to && extraPage + offset - 1 >= placed[placed.length - 1]!.page!) partEnd = extraPage + offset - 1;
    placed.forEach((p, i) => {
      // End matter printed right after this chapter ("Miscellaneous Exercise 1", 59 to 60) ends it a page before.
      const between = seq.part.extras.find((x) => x.after === i + 1 && x.page !== null && offset !== null);
      const byExtra = between && offset !== null ? between.page! + offset - 1 : null;
      const nextStart0 = placed[i + 1]?.page ?? null;
      const nextStart = nextStart0 !== null && byExtra !== null && byExtra >= p.page! && byExtra < nextStart0 - 1 ? byExtra + 1 : nextStart0;
      chapters.push({
        part: partNo,
        partName,
        number: p.entry.number,
        title: p.printed ?? p.entry.title,
        startPage: p.page!,
        endPage: nextStart !== null ? nextStart - 1 : partEnd,
        how: p.how!,
      });
    });
    if (offset !== null) notes.push(`${partName ?? "the book"}: printed page + ${offset} = PDF page`);
    for (const p of placed) if (p.printed) notes.push(`chapter ${p.entry.number}: the contents says "${p.entry.title}", its opening page "${p.printed}" (the page's title is taken)`);
    const byPage = placed.filter((p) => p.how === "printed-page").length;
    if (byPage) notes.push(`${byPage} of ${placed.length} opening pages placed by the printed page alone (the title is not in a large face there)`);
  }
  // A part ends where the next begins.
  for (let i = 0; i + 1 < chapters.length; i++) if (chapters[i]!.endPage >= chapters[i + 1]!.startPage) chapters[i]!.endPage = chapters[i + 1]!.startPage - 1;
  for (const c of chapters) if (c.endPage < c.startPage) return { chapters: [], refusal: `chapter ${c.number} ("${c.title}") would end before it begins (pages ${c.startPage}–${c.endPage})`, notes, method: null, contentsPage: front.page };
  // A contents read by OCR may lose a line: its chapters must reach the book's end (a tenth of it left at most) unless it
  // lists what follows them (answers, an appendix).
  const end = chapters.length ? Math.max(...chapters.map((c) => c.endPage)) : 0;
  if (front.ocr && !front.parts.some((p) => p.extras.length) && last - end > Math.max(8, last * 0.1)) {
    return { chapters: [], refusal: `the contents read by OCR ends at chapter ${chapters[chapters.length - 1]?.number ?? 0} (page ${end}) with ${last - end} of ${last} pages left and nothing listed after it: a line may be lost`, notes, method: null, contentsPage: front.page };
  }
  return { chapters, refusal: null, notes, method: "contents", contentsPage: front.page };
}

export function splitBook(pages: PageContent[]): BookSplit {
  const notes: string[] = [];
  const body = bodySize(pages);
  const last = pages[pages.length - 1]?.page ?? 0;
  const blocks = contentsBlocks(pages);
  // Each table in the front pages in turn (a numbered competency list read by OCR can come before the contents): the
  // first that splits the book; else the refusal of the first headed "Contents", or the first.
  const fronts = blocks.filter((b) => b.page <= 24);
  const tries = fronts.map((f) => splitFrom(pages, blocks, f, body, last));
  const won = tries.find((t) => !t.refusal);
  if (won) return won;
  if (tries.length) return tries[fronts.findIndex((f) => f.headSize !== undefined)] ?? tries[0]!;
  const numbered = numberedStarts(pages, body, 3);
  // The body's numbered titles must cover the book: a last chapter three times as long as the others' middle length
  // means the numbers stopped being found (class 6 mathematics: four of its chapters, then nothing).
  const spans = numbered.map((n, i) => (numbered[i + 1]?.page ?? last + 1) - n.page).sort((a, b) => a - b);
  const middle = spans[Math.floor(spans.length / 2)] ?? 0;
  const lastSpan = numbered.length ? last + 1 - numbered[numbered.length - 1]!.page : 0;
  const firstStart = numbered[0]?.page ?? 0;
  if (numbered.length >= 3 && firstStart > Math.max(30, last * 0.3)) {
    return { chapters: [], refusal: `no contents page, and the body's numbered titles begin only on page ${firstStart} of ${last} (an answers section, not the chapters)`, notes, method: null, contentsPage: null };
  }
  if (numbered.length >= 3 && lastSpan > Math.max(middle * 3, 12)) {
    return { chapters: [], refusal: `no contents page, and the body's numbered titles stop at chapter ${numbered.length} with ${lastSpan} pages left`, notes, method: null, contentsPage: null };
  }
  if (numbered.length >= 3) {
    notes.push("no contents page could be read: the body's own numbered titles");
    return {
      chapters: numbered.map((n, i) => ({ part: 1, partName: null, number: n.number, title: n.title, startPage: n.page, endPage: (numbered[i + 1]?.page ?? last + 1) - 1, how: "numbered-line" })),
      refusal: null,
      notes,
      method: "numbered-lines",
      contentsPage: null,
    };
  }
  return { chapters: [], refusal: "no contents page and no numbered chapter titles in the body", notes, method: null, contentsPage: null };
}

/* ---------------------------------------------------------------------------------------------------------------
   The titles as written, the OCR fallback, and the chunker's cut
   --------------------------------------------------------------------------------------------------------------- */

/**
 * A chapter's title as it is written: the contents' words, or the opening page's printed line when the contents was read
 * by OCR (its letters are the text layer's, not a guess); a title in capitals ("BASIC CONCEPTS IN ECONOMICS", "DEMAND
 * ANALYSIS and ELASTICITY OF DEMAND") in title case; the case rule for a capital inside a word (chapter-title-case.ts). Pure.
 */
export function chapterTitleFor(c: Pick<BookChapter, "title" | "startPage" | "how">, pages: PageContent[], body: number, byOcr: boolean): { title: string; from: string } {
  const page = pages.find((p) => p.page === c.startPage);
  // Read by OCR and placed by its printed page alone (its OCR'd title matches nothing): the opening page's first title line.
  const top = byOcr && page && c.how === "printed-page" ? (titleLines(page, body).find((l) => !/^\d+$/.test(l.trim()) && /\p{L}{3}/u.test(l)) ?? null) : null;
  const printed = byOcr && page ? (printedTitle(c.title, page, body) ?? (top ? cleanHeading(stripLead(top)) : null)) : null;
  let title = (printed ?? c.title).replace(/\s+/g, " ").trim();
  const from = printed ? "the opening page (the contents read by OCR)" : byOcr ? "the contents, read by OCR" : "the contents";
  // Initials stay ("HCF and LCM"): only a title with a word of four capitals or more is in capitals.
  const caps = title.replace(/\b(?:and|of|the|in|to|for)\b/g, "");
  title = fixTitleCase(caps === caps.toUpperCase() && /\p{Lu}{4}/u.test(caps) ? titleCase(title.toUpperCase()) : title);
  return { title, from };
}

/**
 * The split, reading the front pages by OCR when the text layer has no contents page (a contents drawn as a picture):
 * a contents read so beats the body's numbered lines, which stand only when OCR finds no contents either. `readOcr`
 * reads the same book with its front pages OCR'd. The titles are final (chapterTitleFor).
 */
export async function splitBookWithOcr(pages: PageContent[], readOcr: (() => Promise<PageContent[]>) | readonly (() => Promise<PageContent[]>)[] | null): Promise<{ split: BookSplit; pages: PageContent[]; byOcr: boolean; titleFrom: string[] }> {
  let split = splitBook(pages);
  let used = pages;
  let byOcr = false;
  // Each OCR reading in turn (plain, then the page made black on white) until one gives the contents.
  const readers = readOcr ? (Array.isArray(readOcr) ? readOcr : [readOcr]) : [];
  const textLayerHasContents = split.contentsPage !== null;
  for (const reader of textLayerHasContents ? [] : readers) {
    if (!split.refusal && split.method === "contents") break;
    const read = await (reader as () => Promise<PageContent[]>)();
    const again = splitBook(read);
    if ((!again.refusal && again.method === "contents") || (split.refusal && !again.refusal)) {
      used = read;
      split = again;
      byOcr = again.contentsPage !== null && (read.find((p) => p.page === again.contentsPage)?.ocr ?? false);
    } else if (split.refusal && again.refusal) split = { ...split, refusal: `${split.refusal}; read by OCR: ${again.refusal}` };
  }
  const body = bodySize(used);
  const titleFrom: string[] = [];
  split = {
    ...split,
    chapters: split.chapters.map((c) => {
      const t = chapterTitleFor(c, used, body, byOcr);
      titleFrom.push(t.from);
      return { ...c, title: t.title };
    }),
  };
  return { split, pages: used, byOcr, titleFrom };
}

/**
 * The chunker's elements with each chapter's start made a hard level-0 heading, "N. Title", before the first element of
 * its opening page; the title's own heading on that page dropped; a level-0 heading the book's largest face made inside
 * the chapters (the cover's face reused) demoted to a section. Pure.
 */
export function withChapterHeadings(elements: Element[], chapters: readonly BookChapter[]): Element[] {
  if (!chapters.length) return elements;
  const sorted = [...chapters].sort((a, b) => a.startPage - b.startPage);
  const first = sorted[0]!.startPage;
  const out: Element[] = [];
  let next = 0;
  for (const el of elements) {
    while (next < sorted.length && el.page >= sorted[next]!.startPage) {
      const c = sorted[next]!;
      out.push({ type: "heading", level: 0, text: chapterLabel(c), page: c.startPage, hard: true });
      next++;
    }
    if (el.type === "heading") {
      const c = chapterOfPage(sorted, el.page);
      if (c && el.page === c.startPage && titleScore(c.title, el.text) >= 0.85) continue;
      if (el.level === 0 && el.page >= first) {
        out.push({ ...el, level: 1 });
        continue;
      }
    }
    out.push(el);
  }
  return out;
}

/* ---------------------------------------------------------------------------------------------------------------
   The labels the generator reads
   --------------------------------------------------------------------------------------------------------------- */

/**
 * A chapter's label, the first of every one of its chunks' heading paths: "3. Triangles" as class 8 science's own
 * headings read; a second sequence of the same file "Civics · 2. The Constitution" (scripts/quiz-gen/select.ts
 * bookChapterOf reads both; checks.ts chapterNumberOf reads only the first, so older readers never mix the two).
 */
export function chapterLabel(c: Pick<BookChapter, "part" | "partName" | "number" | "title">): string {
  const head = `${c.number}. ${c.title}`.trim();
  return c.part > 1 ? `${c.partName ?? `Part ${c.part}`} · ${head}` : head;
}

/** The chapter a chunk belongs to: the one whose pages hold the page it starts on. Pure. */
export function chapterOfPage(chapters: readonly BookChapter[], page: number): BookChapter | null {
  return chapters.find((c) => c.startPage <= page && page <= c.endPage) ?? null;
}

export type ChunkLabelRow = { id: string; chapter: string | null; headingPath: string[]; pageStart: number; pageEnd: number };

/**
 * Each chunk's new chapter and heading path. A chapter's chunk: [label, …its own headings], every chapter's own title
 * dropped from below the label and then the front matter's headings that ran on into the chapters at the top of the
 * path ("The Constitution of India › Fundamental Duties"). A chunk outside every chapter (front matter, answers) keeps what it had, unless
 * that reads as a chapter, when it takes the book's title. Pure.
 */
export function labelChunks(rows: readonly ChunkLabelRow[], chapters: readonly BookChapter[], bookTitle: string): { id: string; chapter: string; headingPath: string[]; changed: boolean; chapterNo: string | null }[] {
  const first = Math.min(...chapters.map((c) => c.startPage));
  const front = new Set(rows.filter((r) => r.pageStart < first).flatMap((r) => r.headingPath.map(squash)));
  const titles = new Set(chapters.map((c) => squash(c.title)));
  const isChapterTitle = (h: string) => titles.has(squash(stripLead(h)));
  const labels = new Set(chapters.map((c) => chapterLabel(c)));
  return rows.map((r) => {
    const c = chapterOfPage(chapters, r.pageStart);
    let chapter: string;
    let headingPath: string[];
    if (c) {
      chapter = chapterLabel(c);
      const own = r.headingPath.slice(1).filter((h) => h && !isChapterTitle(h) && !labels.has(h));
      // The front matter's headings ran on only from the top of the path (the chunker never reset its levels).
      while (own.length && front.has(squash(own[0]!))) own.shift();
      headingPath = [chapter, ...own];
    } else {
      const old = r.chapter ?? r.headingPath[0] ?? "";
      const readsAsChapter = /^\s*(?:chapter|unit|lesson)?\s*[-–]?\s*\d{1,2}\s*[:.—–-]/i.test(old) || labels.has(old) || / · \d{1,2}\. /.test(old);
      chapter = readsAsChapter || !old ? bookTitle : old;
      headingPath = [chapter, ...r.headingPath.slice(1).filter((h) => !labels.has(h))];
    }
    const changed = chapter !== (r.chapter ?? "") || headingPath.length !== r.headingPath.length || headingPath.some((h, i) => h !== r.headingPath[i]);
    return { id: r.id, chapter, headingPath, changed, chapterNo: c ? `${c.part}:${c.number}` : null };
  });
}

/* ---------------------------------------------------------------------------------------------------------------
   Which documents of a class and subject are one book (owner-batch-item7: editions, parts, misfiled)
   --------------------------------------------------------------------------------------------------------------- */

export type BookDoc = { id: string; path: string; title: string; gradeOrProgramme: string; extra: unknown };
export type BookChoice<D extends BookDoc> = {
  /** The documents planned, in the order their chapters are numbered: part 1 before part 2, a stream's books together. */
  books: D[];
  /** Editions of a planned book left out: the district editions of class 3's EVS part 1. */
  editions: { doc: D; of: D; reason: string }[];
  /** Filed under another class than the one the book's id names. */
  misfiled: { doc: D; reason: string }[];
};

/** "जि. मुंबई": a district edition's mark in a Balbharati title. */
const DISTRICT = /जि\.\s*\S+/u;
/** "भा-१", "भा १", "भाग-२", "भाग - २", "Part II". */
const PART = /(?:भाग|भा)\s*[-–]?\s*([०-९\d]+)|\bpart\s*[-–]?\s*([0-9]+|[ivx]+)\b/iu;
const ROMAN: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4, v: 5 };

export function partOfTitle(title: string): number | null {
  const m = PART.exec(title);
  if (!m) return null;
  if (m[1]) return Number(asciiDigits(m[1]));
  const p = (m[2] ?? "").toLowerCase();
  return ROMAN[p] ?? (Number(p) || null);
}

/** The book a title names, its district and part taken off: one key for the 36 district editions of one book. */
export function bookKey(title: string): string {
  return asciiDigits(title).replace("आ.स.ज.", "आपल्या सभोवतालचे जग").replace(DISTRICT, " ").replace(PART, " ").replace(/\s+/g, " ").trim();
}

function lastModifiedOf(extra: unknown): number {
  const lm = (extra as { lastModified?: string } | null)?.lastModified;
  const t = lm ? Date.parse(lm) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/** The standard a Balbharati book id names: 303… class 3, 1003… class 10, 1203… class 12 (the id begins with it, then 0). */
export function standardOfBookId(id: string | null | undefined): number | null {
  const m = /^(1[0-2]|[1-9])0\d{5,}$/.exec(id ?? "");
  return m ? Number(m[1]) : null;
}

/**
 * The books to plan for one class and subject (owner-batch-item7). A document whose book id names another standard is
 * set aside as misfiled (1203020415, the Standard XII physics, is filed under class 11). Documents whose titles name one
 * book once the district and the part are taken off are editions of it when they are the same part: the one whose title
 * names no district is planned, else the newest by the site's Last-Modified (then the path), the rest listed. The books
 * left are ordered by that key (a stream's books together: Arts and Science before Commerce) and then by part. Pure.
 */
export function chooseBooks<D extends BookDoc>(docs: readonly D[]): BookChoice<D> {
  const misfiled: BookChoice<D>["misfiled"] = [];
  const kept: D[] = [];
  for (const d of docs) {
    const id = (d.extra as { bookId?: string } | null)?.bookId ?? null;
    const std = standardOfBookId(id);
    if (std !== null && String(std) !== d.gradeOrProgramme) misfiled.push({ doc: d, reason: `its book id ${id} names Standard ${std}, not ${d.gradeOrProgramme}` });
    else kept.push(d);
  }
  const groups = new Map<string, D[]>();
  for (const d of kept) {
    const key = `${bookKey(d.title)}|${partOfTitle(d.title) ?? 0}`;
    groups.set(key, [...(groups.get(key) ?? []), d]);
  }
  const editions: BookChoice<D>["editions"] = [];
  const books: D[] = [];
  for (const group of groups.values()) {
    const sorted = [...group].sort((a, b) => Number(DISTRICT.test(a.title)) - Number(DISTRICT.test(b.title)) || lastModifiedOf(b.extra) - lastModifiedOf(a.extra) || a.path.localeCompare(b.path));
    const chosen = sorted[0]!;
    books.push(chosen);
    const why = DISTRICT.test(chosen.title) ? "every edition names a district: the newest is planned" : "the edition that names no district is planned";
    for (const d of sorted.slice(1)) editions.push({ doc: d, of: chosen, reason: why });
  }
  books.sort((a, b) => bookKey(a.title).localeCompare(bookKey(b.title)) || (partOfTitle(a.title) ?? 0) - (partOfTitle(b.title) ?? 0) || a.path.localeCompare(b.path));
  return { books, editions, misfiled };
}
