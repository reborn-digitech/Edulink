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
  /** `hard`: a chapter's own start, set by the book's contents (owner-batch-item7): the chunk ends there whatever its size. */
  | { type: "heading"; level: number; text: string; page: number; hard?: boolean }
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
/**
 * A heading as the PDF printed it, made readable (10 Oct 2026; Phase D found one citation heading in twenty
 * garbled): letters drawn twice over for a shadow ("TheThe dd-- andand f-f- Block", "COMPOUNDSCOMPOUNDS")
 * collapsed, a Devanagari matra split from its letter by a space rejoined, a leading punctuation mark dropped.
 * Pure. A lost drop capital ("ROBABILITY") is not repaired here but by the running head, below.
 */
export function cleanHeading(text: string): string {
  let t = text.replace(/\s+/g, " ").trim();
  t = t.replace(/\S+/g, (w) => {
    // Every glyph doubled ("dd--": "d" twice then "-" twice).
    if (w.length >= 4 && /^(?:(.)\1)+$/u.test(w)) return w.replace(/(.)\1/gu, "$1");
    // The whole word twice ("TheThe", "andand", "f-f-"); a word of three letters or more, so "papa" and "Tata" stand.
    const half = w.length / 2;
    if (Number.isInteger(half) && half >= 2 && w.slice(0, half) === w.slice(half) && (half >= 3 || /[^\p{L}]/u.test(w.slice(0, half)))) return w.slice(0, half);
    return w;
  });
  // A run of five or more characters repeated at once ("COORDINACOORDINATION"), until none is left; shorter
  // repeats are a word's own ("Mississippi"), except a word's own tail printed twice ("COORDINATIONTION").
  for (let i = 0; i < 8; i++) {
    const next = t.replace(/(\S{5,}?)\1/gu, "$1").replace(/(\S{3,})\1(?=\s|$)/gu, "$1");
    if (next === t) break;
    t = next;
  }
  t = t.replace(/\s+(?=[\u093e-\u094d\u0902\u0903\u0962\u0963])/g, "");
  // "Chapter 5 Chapter 5", "UNIT UNIT": a label printed twice is one label, and a label alone names nothing.
  for (let i = 0; i < 4; i++) {
    const next = t.replace(/\b((?:chapter|unit|lesson)\s*[0-9ivx]*)\s+\1\b/gi, "$1");
    if (next === t) break;
    t = next;
  }
  t = t.replace(/^[\s:;,.\-–—]+/, "").replace(/\s+/g, " ").trim();
  return /^(?:chapter|unit|lesson)\s*[0-9ivx]*$/i.test(t) ? "" : t;
}

/**
 * The chapter's name from its running head when the title page's own letters are short of it: NCERT draws
 * the first capital as an outline the extractor never sees ("ROBABILITY"; "ATURAL AZARDS AND ISASTERS" in
 * small capitals), while the running head on every other page carries the plain words. The head wins when
 * the found title's letters are a subsequence of it covering at least three fifths; an all-capitals head is
 * given title case. Pure.
 */
const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
const subsequence = (small: string, big: string) => {
  let i = 0;
  for (const ch of big) if (ch === small[i]) i++;
  return i === small.length;
};

const LABEL = /^(?:chapter|unit|lesson)\s*\d+\s*[:.\-–•]?\s*/i;

/** The longest common subsequence of two short strings, by length. */
function lcsLength(a: string, b: string): number {
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1]! + 1 : Math.max(prev[j]!, cur[j - 1]!);
    prev = cur;
  }
  return prev[b.length]!;
}

/**
 * Are these letters mostly the chapter title's, in order: a title page's own line short of its drop capitals,
 * or the same words printed over themselves? Seven in ten of the shorter string's letters must run through
 * the longer in order. Pure.
 */
export function lettersOfTitle(text: string, title: string | null): boolean {
  const t = squash(text);
  const c = squash((title ?? "").replace(LABEL, ""));
  if (!t || !c || t.length < 3) return false;
  return lcsLength(t, c) >= Math.min(t.length, c.length) * 0.7 && Math.max(t.length, c.length) <= Math.min(t.length, c.length) * 3;
}

/**
 * The chapter's name the manifest carries, when the fetcher read it off the publisher's listing: NCERT's
 * exemplars are titled "… — Unit 2(Is Matter Around Us Pure)". Pure.
 */
export function chapterNameFromTitle(title: string | null | undefined): string | null {
  const m = / — (?:Chapter|Unit|Lesson) \d+\s*\((.+)\)\s*$/.exec(title ?? "");
  return m ? m[1]!.trim() : null;
}

export function recoverChapterTitle(found: string | null, runningHeads: readonly string[], lines: readonly string[] = found ? [found] : []): string | null {
  if (!found) return null;
  let best: string | null = null;
  // The whole title first, then each of its lines: a unit's heading or a subtitle set with it is not the running head's.
  for (const candidate of [found, ...lines]) {
    const f = squash(candidate);
    if (!f) continue;
    for (const printed of runningHeads) {
      // "Chapter 1 • Variations in Psychological Attributes": the running head without its label.
      const head = printed.replace(LABEL, "").trim();
      const h = squash(head);
      if (h.length < 4) continue;
      // The found title short of letters (a drop capital drawn as an outline), or the head's letters running
      // through a found title printed over itself ("VARIATIONS IN PSYVARIATIONS IN PSY…").
      const short = f.length <= h.length && f.length >= h.length * 0.6 && subsequence(f, h);
      const overprinted = h.length >= 10 && f.length > h.length && f.length <= h.length * 3 && subsequence(h, f);
      if (!short && !overprinted) continue;
      if (!best || head.length > best.length) best = head;
    }
    if (best) break;
  }
  if (!best) return found;
  const head = best.replace(/\s+/g, " ").trim();
  if (head !== head.toUpperCase() || !/[A-Z]/.test(head)) return head;
  const small = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);
  return head
    .toLowerCase()
    .split(" ")
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Running heads and feet: the same line (digits ignored) on a quarter of the pages or more, in a file of six
 * pages or more. `boilerplate` holds their normalised keys (dropped from the text), `runningHeads` the lines as
 * printed: one of them is often the chapter's own name (recoverChapterTitle; scripts/corpus-titles.ts). Pure.
 */
export function runningHeadsOf(pages: PageContent[]): { boilerplate: Set<string>; runningHeads: string[] } {
  const seenOn = new Map<string, Set<number>>();
  const asPrinted = new Map<string, string>();
  for (const p of pages) for (const r of p.runs) {
    const k = normalise(r.text);
    if (k.length < 3) continue;
    const set = seenOn.get(k) ?? new Set<number>();
    set.add(p.page);
    seenOn.set(k, set);
    if (!asPrinted.has(k)) asPrinted.set(k, r.text);
  }
  const repeatFloor = Math.max(3, Math.ceil(pages.length * 0.25));
  const boilerplate = new Set([...seenOn].filter(([, s]) => pages.length >= 6 && s.size >= repeatFloor).map(([k]) => k));
  return { boilerplate, runningHeads: [...boilerplate].map((k) => asPrinted.get(k) ?? "").filter(Boolean) };
}

/** The body size of a run of pages: the font size most characters are set in. Pure. */
export function bodySizeOfPages(pages: PageContent[]): number {
  return bodySizeOf(pages);
}

export function elementsOf(pages: PageContent[], opts: { perChapterFile: boolean }): { elements: Element[]; edition: string | null; bodySize: number; chapter: string | null } {
  const body = bodySizeOf(pages);
  const edition = editionIn(pages.flatMap((p) => p.runs.map((r) => r.text)));

  // Running heads and feet; the running heads as printed: one of them is the chapter's own name (recoverChapterTitle).
  const { boilerplate, runningHeads } = runningHeadsOf(pages);
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
    // The title page's own lines, boilerplate or not: the chapter's name IS the running head of every page
    // (10 Oct 2026: "A Question of Trust" was dropped as boilerplate and the chapter left untitled).
    const keepForTitle = (r: Run) => r.size >= body * 0.62 && !/^[\s\d.,|\-–—()ivx]+$/i.test(r.text) && !/^reprint\s*\d{4}/i.test(r.text);
    const big = pages[0].runs.filter((r) => keepForTitle(r) && r.size >= body * 1.5 && /\p{L}{3}/u.test(r.text) && !/^chapter$/i.test(r.text.trim()));
    if (big.length) {
      const top = Math.max(...big.map((r) => r.size));
      const titleRuns = big.filter((r) => r.size >= top * 0.8).sort((a, b) => b.y - a.y || a.x - b.x);
      const found = cleanHeading(titleRuns.map((r) => r.text).join(" ")).slice(0, 160) || null;
      // Its lines, by their baseline, for the running-head match.
      const lines: string[] = [];
      let lastY: number | null = null;
      for (const r of titleRuns) {
        if (lastY !== null && Math.abs(lastY - r.y) < r.size * 0.6) lines[lines.length - 1] = `${lines[lines.length - 1]} ${r.text}`;
        else lines.push(r.text);
        lastY = r.y;
      }
      chapter = recoverChapterTitle(found, runningHeads, lines.map(cleanHeading));
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
      // A web address is never a heading, nor a lone letter (a drop capital drawn apart from its word).
      if (isHeadingRun(r) && !/www\.|https?:\/\//i.test(r.text) && (/\p{L}.*\p{L}/su.test(r.text) || NUMBERED.test(r.text))) {
        flush();
        // The chapter's own name on its opening pages (a unit's cover may come first) is the title, not a section.
        if (opts.perChapterFile && p.page <= 3 && (/^chapter\s*[0-9ivx]*$/i.test(r.text.trim()) || (chapter && chapter.includes(r.text)) || lettersOfTitle(r.text, chapter))) continue;
        const numbered = NUMBERED.exec(r.text);
        let level: number;
        if (CHAPTER_LINE.test(r.text) && !opts.perChapterFile) level = 0;
        // "9.1 Title" is a section (1), "9.1.2 Title" a subsection (2).
        else if (numbered) level = Math.min(3, (numbered[2] ?? "").split(".").length - 1);
        else level = opts.perChapterFile ? Math.min(3, tier(r.size) + 1) : Math.min(3, tier(r.size));
        const prev = elements[elements.length - 1];
        if (prev?.type === "heading" && lastHeading && lastHeading.level === level && Math.abs(lastHeading.size - r.size) < 0.6 && lastHeading.y - r.y < r.size * 2.2 && prev.page === p.page) {
          prev.text = cleanHeading(`${prev.text} ${r.text}`);
        } else {
          elements.push({ type: "heading", level, text: cleanHeading(r.text), page: p.page });
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
  // No title on the opening page, or only a label: the chapter's name is then the first big heading on the
  // opening pages whose letters a running head carries ("NVIRONMENT AND OCIETY" under the head "ENVIRONMENT AND SOCIETY").
  if (opts.perChapterFile && !chapter) {
    for (const el of elements) {
      if (el.type !== "heading" || el.page > 3) continue;
      const head = recoverChapterTitle(el.text, runningHeads);
      if (head && head !== el.text) {
        chapter = head;
        el.text = "";
        break;
      }
    }
    if (chapter) for (const el of elements) if (el.type === "heading" && el.page <= 3 && lettersOfTitle(el.text, chapter)) el.text = "";
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
export function chunk(
  pages: PageContent[],
  opts: {
    perChapterFile: boolean;
    chapterLabel?: (found: string | null) => string | null;
    figureKey: (page: number, index: number) => string;
    /**
     * owner-batch-item7: the elements reworked before they are cut, for a whole book whose chapters its contents page
     * gives (scripts/corpus-contents.ts withChapterHeadings): a hard level-0 heading at each chapter's opening page.
     */
    transformElements?: (elements: Element[]) => Element[];
  },
): Structured {
  const read = elementsOf(pages, { perChapterFile: opts.perChapterFile });
  const { edition, bodySize, chapter: found } = read;
  const elements = opts.transformElements ? opts.transformElements(read.elements) : read.elements;
  const figures = figuresOf(pages, opts.figureKey);
  const chapterName = opts.chapterLabel ? opts.chapterLabel(found) : found;
  const chunks = cutChunks(elements, chapterName);

  // A figure belongs to the chunk that carries its caption, else the first chunk covering its page.
  for (const f of figures) {
    const byCaption = f.caption ? chunks.find((c) => c.pageStart <= f.page && f.page <= c.pageEnd && c.text.includes(f.caption!.slice(0, 40))) : undefined;
    const target = byCaption ?? chunks.find((c) => c.pageStart <= f.page && f.page <= c.pageEnd) ?? chunks.filter((c) => c.pageStart <= f.page).at(-1);
    target?.figureKeys.push(f.key);
  }
  return { chunks, figures, edition, bodySize, chapter: chapterName };
}

/** The elements cut into chunks of about TARGET_CHARS at chapter and section boundaries, never mid-sentence. */
function cutChunks(elements: Element[], chapterName: string | null): Chunk[] {
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
      if (!el.text) continue;
      // "12.6 F": a numbered section whose words the extractor lost keeps its number alone, never a stray letter.
      const cut = /^(\d{1,2}(?:\.\d{1,2}){1,3})\.?\s+\p{L}{1,2}$/u.exec(el.text);
      if (cut) el.text = cut[1]!;
      // A chapter or section boundary ends the chunk unless it holds almost nothing yet; a chapter's own start always.
      if ((el.level <= 2 && size() >= MIN_CHARS) || el.hard) flush();
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
  return chunks;
}

/**
 * VIDURA PASS 4 (18 Oct 2026): a plain-text article (a Wikipedia article as the MediaWiki API's plain extract gives it,
 * "== Heading ==" lines for its sections) as elements: the article's title is the chapter, "==" a section, "===" and
 * deeper a subsection; the reference sections at the end ("See also", "References", "External links"…) are dropped
 * with everything under them, and so is a line of punctuation alone. Every element is "page" 1: an article has none.
 */
export const DROPPED_ARTICLE_SECTIONS = /^(see also|references|notes|notes and references|further reading|external links|bibliography|sources|citations|footnotes|explanatory notes|works cited|gallery|literature|reference list|primary sources|secondary sources)$/i;

export function elementsOfPlainText(text: string): Element[] {
  const out: Element[] = [];
  let dropLevel: number | null = null;
  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const h = /^(={2,6})\s*(.+?)\s*\1$/.exec(line);
    if (h) {
      const level = Math.min(3, h[1]!.length - 1);
      const title = h[2]!.trim();
      if (dropLevel !== null && level > dropLevel) continue;
      dropLevel = DROPPED_ARTICLE_SECTIONS.test(title) ? level : null;
      if (dropLevel === null) out.push({ type: "heading", level, text: title, page: 1 });
      continue;
    }
    if (dropLevel !== null) continue;
    if (!/[\p{L}\p{N}]/u.test(line)) continue;
    out.push({ type: "para", text: line.replace(/\s+/g, " "), page: 1, aside: false });
  }
  return out;
}

/** A plain-text article cut as a book's chapter is (cutChunks), its title the chapter of every chunk. Pure. */
export function chunkPlainText(text: string, opts: { title: string }): Structured {
  const chunks = cutChunks(elementsOfPlainText(text), opts.title);
  return { chunks, figures: [], edition: null, bodySize: 0, chapter: opts.title };
}
