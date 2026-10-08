/**
 * From a PDF's runs to chunks with a heading path (docs/plans/assistant.md, Phase A).
 *
 * Pure: no file, no database, so the tests and the parked quiz bank generator (plan §6) can call it.
 *
 *   1. The body size is the font size most characters are set in.
 *   2. Running heads and feet (a line on a quarter of the pages or more), page numbers and the tiny
 *      cross-reference tags in the margins are dropped; the edition line is read before they go.
 *   3. Headings are lines set larger than the body, or numbered ("4.2 A Force …") and bold; their
 *      level comes from the numbering when there is one, from the size otherwise; a title broken
 *      over two lines is joined.
 *   4. Body lines become paragraphs (a gap of one and a half lines starts a new one; a word broken
 *      at a hyphen is mended); smaller text (captions, margin notes) becomes its own paragraphs
 *      after the page's body, so a sidebar never splits a sentence.
 *   5. Chunks of about 500 tokens (2,000 characters) are cut at chapter and section boundaries and
 *      never mid-sentence, each with its heading path, page range and the figures it refers to.
 */
import type { PageContent, PageImage, Run } from "./corpus-pdf";

export const TARGET_CHARS = 2000;
export const MAX_CHARS = 2600;
export const MIN_CHARS = 350;

export type Element =
  | { type: "heading"; level: number; text: string; page: number }
  | { type: "para"; text: string; page: number; aside: boolean };

export type FigureRef = { key: string; page: number; index: number; caption: string | null; image: PageImage };

export type Chunk = {
  ordinal: number;
  chapter: string | null;
  section: string | null;
  headingPath: string[];
  pageStart: number;
  pageEnd: number;
  text: string;
  tokens: number;
  figureKeys: string[];
};

export type Structured = { chunks: Chunk[]; figures: FigureRef[]; edition: string | null; bodySize: number; chapter: string | null };

export function estimateTokens(text: string): number {
  return Math.max(1, Math.round(text.length / 4));
}

function bodySizeOf(pages: PageContent[]): number {
  const weight = new Map<number, number>();
  for (const p of pages) for (const r of p.runs) {
    const s = Math.round(r.size * 2) / 2;
    weight.set(s, (weight.get(s) ?? 0) + r.text.length);
  }
  let best = 10;
  let bestW = -1;
  for (const [s, w] of weight) if (w > bestW) [best, bestW] = [s, w];
  return best;
}

const normalise = (t: string) => t.toLowerCase().replace(/[0-9०-९]+/g, "#").replace(/\s+/g, " ").trim();

/** The edition as the book prints it: "Reprint 2025-26", "First Edition March 2026". */
export function editionIn(texts: string[]): string | null {
  for (const t of texts) {
    const reprint = /\bReprint\s*:?\s*(\d{4}\s*[-–]\s*\d{2,4})/i.exec(t);
    if (reprint) return `Reprint ${(reprint[1] ?? "").replace(/\s+/g, "")}`;
  }
  for (const t of texts) {
    const ed = /\b((?:First|Second|Third|Fourth|Fifth|Revised|New)\s+Edition)\b[^0-9]{0,24}(\d{4})/i.exec(t);
    if (ed) return `${ed[1]} ${ed[2]}`;
  }
  return null;
}

/**
 * Two columns read as two columns. The page is cut into rows (one baseline each); a row whose lines
 * sit wholly in the left half and wholly in the right half is a split row. A stretch of rows with
 * no line across the middle that holds three split rows or more is a two-column block, read left
 * column first, then right; everything else keeps top-to-bottom order. A page may change from one
 * column to two and back (a lesson above, its exercises below).
 */
export function readingOrder(runs: Run[], pageWidth: number): Run[] {
  const mid = pageWidth / 2;
  const byY = (a: Run, b: Run) => b.y - a.y || a.x - b.x;
  const rows: Run[][] = [];
  for (const r of [...runs].sort(byY)) {
    const last = rows[rows.length - 1];
    if (last && Math.abs((last[0]?.y ?? 0) - r.y) <= 2) last.push(r);
    else rows.push([r]);
  }
  const isLeft = (r: Run) => r.x + r.width <= mid + 8;
  const isRight = (r: Run) => r.x >= mid - 8;
  const across = (row: Run[]) => row.some((r) => !isLeft(r) && !isRight(r));
  const out: Run[] = [];
  let block: Run[][] = [];
  const flush = () => {
    const split = block.filter((row) => row.some(isLeft) && row.some(isRight)).length;
    const flat = block.flat();
    if (split >= 3) out.push(...flat.filter(isLeft).sort(byY), ...flat.filter((r) => !isLeft(r)).sort(byY));
    else out.push(...flat);
    block = [];
  };
  for (const row of rows) {
    if (across(row)) {
      flush();
      out.push(...row);
    } else block.push(row);
  }
  flush();
  return out;
}

const NUMBERED = /^(\d{1,2})((?:\.\d{1,2}){1,3})\.?\s+\S/;
const CHAPTER_LINE = /^(chapter|unit|lesson|module|part)\s*[-–:]?\s*([0-9]{1,2}|[IVXLC]{1,5})\b/i;
const CAPTION = /^(fig(?:ure)?\.?|table)\s*[0-9]+(?:[.\-–][0-9]+)*\s*[:.)-]?/i;

/**
 * Elements in reading order. `chapterTitle` is the title the file is known by when the file is one
 * chapter (NCERT serves one PDF per chapter): its own big title lines on the first page are then
 * the chapter, not a section.
 */
export function elementsOf(pages: PageContent[], opts: { perChapterFile: boolean }): { elements: Element[]; edition: string | null; bodySize: number; chapter: string | null } {
  const body = bodySizeOf(pages);
  const edition = editionIn(pages.flatMap((p) => p.runs.map((r) => r.text)));

  // Running heads and feet: the same line (digits ignored) on a quarter of the pages or more.
  const seenOn = new Map<string, Set<number>>();
  for (const p of pages) for (const r of p.runs) {
    const k = normalise(r.text);
    if (k.length < 3) continue;
    const set = seenOn.get(k) ?? new Set<number>();
    set.add(p.page);
    seenOn.set(k, set);
  }
  const repeatFloor = Math.max(3, Math.ceil(pages.length * 0.25));
  const boilerplate = new Set([...seenOn].filter(([, s]) => pages.length >= 6 && s.size >= repeatFloor).map(([k]) => k));
  const keep = (r: Run) =>
    r.size >= body * 0.62 && !/^[\s\d.,|\-–—()ivx]+$/i.test(r.text) && !boilerplate.has(normalise(r.text)) && !/^reprint\s*\d{4}/i.test(r.text);

  const isHeadingRun = (r: Run) => {
    if (r.text.length > 140 || !/\p{L}/u.test(r.text) || CAPTION.test(r.text)) return false;
    if (r.size >= body * 1.18) return true;
    return r.bold && r.size >= body * 0.98 && (NUMBERED.test(r.text) || CHAPTER_LINE.test(r.text));
  };

  // Heading size tiers, largest first, for levels where there is no numbering.
  const headingSizes = [...new Set(pages.flatMap((p) => p.runs.filter((r) => keep(r) && isHeadingRun(r)).map((r) => Math.round(r.size))))].sort((a, b) => b - a);
  const tier = (size: number) => Math.max(0, headingSizes.indexOf(Math.round(size)));

  // The chapter title of a one-chapter file: the first page's largest lines that are words.
  let chapter: string | null = null;
  if (opts.perChapterFile && pages[0]) {
    const big = pages[0].runs.filter((r) => keep(r) && r.size >= body * 1.5 && /\p{L}{3}/u.test(r.text) && !/^chapter$/i.test(r.text.trim()));
    if (big.length) {
      const top = Math.max(...big.map((r) => r.size));
      chapter = big.filter((r) => r.size >= top * 0.8).sort((a, b) => b.y - a.y).map((r) => r.text).join(" ").replace(/\s+/g, " ").trim().slice(0, 160) || null;
    }
  }

  const elements: Element[] = [];
  for (const p of pages) {
    const runs = readingOrder(p.runs.filter(keep), p.width);
    const asides: Run[] = [];
    let para: { text: string; lastY: number; size: number } | null = null;
    const flush = (aside = false) => {
      if (para && para.text.trim()) elements.push({ type: "para", text: para.text.trim(), page: p.page, aside });
      para = null;
    };
    let lastHeading: { level: number; y: number; size: number } | null = null;
    for (const r of runs) {
      if (r.size < body * 0.95 && !p.ocr) {
        asides.push(r);
        continue;
      }
      if (isHeadingRun(r)) {
        flush();
        if (opts.perChapterFile && p.page === 1 && (/^chapter\s*[0-9ivx]*$/i.test(r.text.trim()) || (chapter && chapter.includes(r.text)))) continue;
        const numbered = NUMBERED.exec(r.text);
        let level: number;
        if (CHAPTER_LINE.test(r.text) && !opts.perChapterFile) level = 0;
        // "9.1 Title" is a section (1), "9.1.2 Title" a subsection (2).
        else if (numbered) level = Math.min(3, (numbered[2] ?? "").split(".").length - 1);
        else level = opts.perChapterFile ? Math.min(3, tier(r.size) + 1) : Math.min(3, tier(r.size));
        const prev = elements[elements.length - 1];
        if (prev?.type === "heading" && lastHeading && lastHeading.level === level && Math.abs(lastHeading.size - r.size) < 0.6 && lastHeading.y - r.y < r.size * 2.2 && prev.page === p.page) {
          prev.text = `${prev.text} ${r.text}`.replace(/\s+/g, " ");
        } else {
          elements.push({ type: "heading", level, text: r.text, page: p.page });
        }
        lastHeading = { level, y: r.y, size: r.size };
        continue;
      }
      lastHeading = null;
      const startsNew = !para || para.lastY - r.y > Math.max(r.size, para.size) * 1.65 || CAPTION.test(r.text) || /^(\d+\.|[a-z]\)|\(\w\)|•|▪|–)\s/.test(r.text);
      if (startsNew) {
        flush();
        para = { text: r.text, lastY: r.y, size: r.size };
      } else if (para) {
        para.text = /[A-Za-z]-$/.test(para.text) && /^[a-z]/.test(r.text) ? para.text.slice(0, -1) + r.text : `${para.text} ${r.text}`;
        para.lastY = r.y;
      }
    }
    flush();
    // Captions and margin notes: their own paragraphs, after the body of the page.
    asides.sort((a, b) => a.x - b.x || b.y - a.y);
    let aside: { text: string; lastY: number; x: number; size: number } | null = null;
    const flushAside = () => {
      if (aside && aside.text.trim().length > 1) elements.push({ type: "para", text: aside.text.trim(), page: p.page, aside: true });
      aside = null;
    };
    for (const r of asides.sort((a, b) => (Math.abs(a.x - b.x) > 40 ? a.x - b.x : b.y - a.y))) {
      if (!aside || Math.abs(aside.x - r.x) > 40 || aside.lastY - r.y > r.size * 1.8 || CAPTION.test(r.text)) {
        flushAside();
        aside = { text: r.text, lastY: r.y, x: r.x, size: r.size };
      } else {
        aside.text = /[A-Za-z]-$/.test(aside.text) && /^[a-z]/.test(r.text) ? aside.text.slice(0, -1) + r.text : `${aside.text} ${r.text}`;
        aside.lastY = r.y;
      }
    }
    flushAside();
  }
  return { elements, edition, bodySize: body, chapter };
}

function splitSentences(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const sentences = text.match(/[^.!?।]+[.!?।]+["')\]]*\s*|[^.!?।]+$/g) ?? [text];
  const out: string[] = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && cur.length + s.length > max) {
      out.push(cur.trim());
      cur = "";
    }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
      continue;
    }
    cur += s;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Captions on a page, nearest below each image first; a figure without one keeps a null caption. */
export function figuresOf(pages: PageContent[], keyFor: (page: number, index: number) => string): FigureRef[] {
  const out: FigureRef[] = [];
  // The same picture on three pages or more is a running ornament (a logo, a margin icon), not a figure.
  const fingerprint = (im: PageImage) => {
    const d = im.data;
    const mid = Math.floor(d.length / 2);
    return `${im.width}x${im.height}:${Array.from(d.subarray(0, 48)).join(".")}:${Array.from(d.subarray(mid, mid + 48)).join(".")}`;
  };
  const pagesWith = new Map<string, Set<number>>();
  for (const p of pages) for (const im of p.images) {
    const k = fingerprint(im);
    pagesWith.set(k, (pagesWith.get(k) ?? new Set<number>()).add(p.page));
  }
  for (const p of pages) {
    p.images = p.images.filter((im) => (pagesWith.get(fingerprint(im))?.size ?? 0) < 3);
    const captions = p.runs.filter((r) => CAPTION.test(r.text) && /^fig/i.test(r.text));
    p.images.forEach((image, i) => {
      const below = captions.filter((c) => c.y <= image.y + 4 && image.y - c.y < 140).sort((a, b) => b.y - a.y)[0];
      const any = below ?? captions.sort((a, b) => Math.abs(a.y - image.y) - Math.abs(b.y - image.y))[0];
      out.push({ key: keyFor(p.page, i + 1), page: p.page, index: i + 1, caption: any?.text ?? null, image });
    });
  }
  return out;
}

/**
 * `chapterLabel` turns the chapter title the pages carry (or null) into the name every chunk's
 * heading path starts with: "Chapter 9: Atomic Foundations of Matter" when the caller knows the number.
 */
export function chunk(pages: PageContent[], opts: { perChapterFile: boolean; chapterLabel?: (found: string | null) => string | null; figureKey: (page: number, index: number) => string }): Structured {
  const { elements, edition, bodySize, chapter: found } = elementsOf(pages, { perChapterFile: opts.perChapterFile });
  const figures = figuresOf(pages, opts.figureKey);
  const chapterName = opts.chapterLabel ? opts.chapterLabel(found) : found;
  const chunks: Chunk[] = [];
  // Index 0 of `levels` is the chapter; 1–3 sections, subsections.
  const levels: (string | null)[] = [chapterName, null, null, null];
  let cur: { parts: string[]; pageStart: number; pageEnd: number; path: string[] } | null = null;

  const pathNow = () => levels.filter((x): x is string => !!x);
  const flush = () => {
    if (!cur) return;
    const text = cur.parts.join("\n\n").trim();
    if (text) {
      const headingPath = cur.path;
      chunks.push({
        ordinal: chunks.length,
        chapter: levels[0] ?? headingPath[0] ?? null,
        section: headingPath.length > 1 ? (headingPath[headingPath.length - 1] ?? null) : null,
        headingPath,
        pageStart: cur.pageStart,
        pageEnd: cur.pageEnd,
        text,
        tokens: estimateTokens(text),
        figureKeys: [],
      });
    }
    cur = null;
  };
  const size = () => (cur ? cur.parts.reduce((n, s) => n + s.length + 2, 0) : 0);

  for (const el of elements) {
    if (el.type === "heading") {
      // A chapter or section boundary ends the chunk unless it holds almost nothing yet.
      if (el.level <= 2 && size() >= MIN_CHARS) flush();
      if (el.level === 0) levels.splice(0, 4, el.text, null, null, null);
      else {
        levels[el.level] = el.text;
        for (let l = el.level + 1; l < 4; l++) levels[l] = null;
      }
      if (cur && size() < MIN_CHARS) cur.path = pathNow();
      continue;
    }
    for (const piece of splitSentences(el.text, TARGET_CHARS)) {
      if (cur && size() + piece.length > MAX_CHARS) flush();
      if (cur && size() >= TARGET_CHARS) flush();
      if (!cur) cur = { parts: [], pageStart: el.page, pageEnd: el.page, path: pathNow() };
      cur.parts.push(piece);
      cur.pageEnd = el.page;
    }
  }
  flush();

  // A figure belongs to the chunk that carries its caption, else the first chunk covering its page.
  for (const f of figures) {
    const byCaption = f.caption ? chunks.find((c) => c.pageStart <= f.page && f.page <= c.pageEnd && c.text.includes(f.caption!.slice(0, 40))) : undefined;
    const target = byCaption ?? chunks.find((c) => c.pageStart <= f.page && f.page <= c.pageEnd) ?? chunks.filter((c) => c.pageStart <= f.page).at(-1);
    target?.figureKeys.push(f.key);
  }
  return { chunks, figures, edition, bodySize, chapter: chapterName };
}
