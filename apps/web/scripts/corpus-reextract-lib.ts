/**
 * owner-batch-item11 (31 October 2026): the checks a re-cut Balbharati book must pass before its staged chunks replace the
 * live ones (scripts/corpus-reextract.ts; the staging itself is `npm run corpus:ingest -- --to-staging`). Pure: no file,
 * no database, so the tests can call it.
 *
 * Item 7 relabelled the chunks by the page each starts on without re-cutting them, so a chunk could start in one chapter
 * and run onto the next chapter's opening page (its text two chapters'). A re-extract cuts at each chapter's start
 * (corpus-contents.ts withChapterHeadings, a hard level-0 heading), and these functions show that it did.
 */
import { MAX_CHARS, MIN_CHARS, estimateTokens } from "./corpus-chunk";

export type PageSpan = { pageStart: number; pageEnd: number };
export type LabelledSpan = PageSpan & { chapter: string | null; headingPath: string[] };
/** A chapter as the split gives it: its label ("N. Title", "Civics · N. Title") and its PDF pages, both inclusive. */
export type ChapterSpan = { label: string; startPage: number; endPage: number };

/** The most tokens a chunk can carry: the chunker never lets a chunk pass MAX_CHARS characters (corpus-chunk.ts cutChunks). */
export const MAX_CHUNK_TOKENS = estimateTokens("x".repeat(MAX_CHARS));

/** A label a chapter number reads: "3. Triangles", "Political Science · 2. India’s Foreign Policy". */
export const CHAPTER_LABEL = /^(?:[^·]+ · )?\d{1,2}\. \S/;

/** The chunks that start before a chapter's opening page and end on it or after it: their text is two chapters'. */
export function chunksCrossing<C extends PageSpan>(chunks: readonly C[], chapters: readonly ChapterSpan[]): { chunk: C; chapter: ChapterSpan }[] {
  const out: { chunk: C; chapter: ChapterSpan }[] = [];
  for (const c of chunks) {
    const crossed = chapters.find((ch) => c.pageStart < ch.startPage && ch.startPage <= c.pageEnd);
    if (crossed) out.push({ chunk: c, chapter: crossed });
  }
  return out;
}

/**
 * Item 7's own count: of each book's chapter boundaries (a chapter and the next by page), those at which the last chunk
 * carrying the chapter's label ends on or after the next chapter's opening page.
 */
export function boundariesCrossed(chunks: readonly LabelledSpan[], chapters: readonly ChapterSpan[]): { boundaries: number; crossed: string[] } {
  const sorted = [...chapters].sort((a, b) => a.startPage - b.startPage);
  const crossed: string[] = [];
  for (let i = 0; i + 1 < sorted.length; i++) {
    const here = sorted[i]!;
    const next = sorted[i + 1]!;
    const mine = chunks.filter((c) => c.chapter === here.label);
    const last = mine.reduce<LabelledSpan | null>((a, c) => (!a || c.pageEnd > a.pageEnd ? c : a), null);
    if (last && last.pageEnd >= next.startPage) crossed.push(`${here.label} → ${next.label} (chunk pp. ${last.pageStart}–${last.pageEnd}, next opens p. ${next.startPage})`);
  }
  return { boundaries: Math.max(0, sorted.length - 1), crossed };
}

/**
 * Chunks whose label is not their pages' chapter: inside a chapter the label must be the chapter's and the heading path
 * must begin with it; outside every chapter (front matter, answers, a part's cover) no chapter's label may be carried,
 * or the generator would take the end matter for the last chapter.
 */
export function labelProblems(chunks: readonly LabelledSpan[], chapters: readonly ChapterSpan[]): string[] {
  const out: string[] = [];
  const labels = new Set(chapters.map((c) => c.label));
  chunks.forEach((c, i) => {
    const ch = chapters.find((x) => x.startPage <= c.pageStart && c.pageStart <= x.endPage) ?? null;
    if (ch) {
      if (c.chapter !== ch.label) out.push(`chunk ${i} (pp. ${c.pageStart}–${c.pageEnd}) labelled "${c.chapter ?? ""}", its pages are ${ch.label}`);
      else if (c.headingPath[0] !== ch.label) out.push(`chunk ${i} (pp. ${c.pageStart}–${c.pageEnd}) heading path begins "${c.headingPath[0] ?? ""}", not its label`);
      if (c.pageEnd > ch.endPage) out.push(`chunk ${i} (pp. ${c.pageStart}–${c.pageEnd}) runs past ${ch.label}'s last page ${ch.endPage}`);
    } else if (c.chapter && (labels.has(c.chapter) || CHAPTER_LABEL.test(c.chapter))) {
      out.push(`chunk ${i} (pp. ${c.pageStart}–${c.pageEnd}) is outside every chapter but labelled "${c.chapter}"`);
    }
  });
  return out;
}

/** The chapter labels the chunks carry, in the order they first appear. */
export function chapterLabelsOf(chunks: readonly { chapter: string | null }[]): string[] {
  const seen: string[] = [];
  for (const c of chunks) if (c.chapter && CHAPTER_LABEL.test(c.chapter) && !seen.includes(c.chapter)) seen.push(c.chapter);
  return seen;
}

export type TokenStats = { chunks: number; min: number; median: number; max: number; overMax: number; short: number };

/** Tokens per chunk: the extremes, the middle, how many pass the chunker's bound and how many are under its minimum size. */
export function tokenStats(chunks: readonly { tokens: number; text: string }[]): TokenStats {
  const t = chunks.map((c) => c.tokens).sort((a, b) => a - b);
  return {
    chunks: t.length,
    min: t[0] ?? 0,
    median: t[Math.floor(t.length / 2)] ?? 0,
    max: t[t.length - 1] ?? 0,
    overMax: chunks.filter((c) => c.tokens > MAX_CHUNK_TOKENS || c.text.length > MAX_CHARS).length,
    short: chunks.filter((c) => c.text.length < MIN_CHARS).length,
  };
}

/* ---------------------------------------------------------------------------------------------------------------
   The apply (phase 2): what each book's transaction does, and when a book is refused
   --------------------------------------------------------------------------------------------------------------- */

/** A staged chunk as corpus:ingest --to-staging writes it, the row createMany takes. */
export type StagedChunk = { ordinal: number; chapter: string | null; section: string | null; headingPath: string[]; pageStart: number; pageEnd: number; text: string; language: string; tokens: number; figureKeys: string[]; edition: string | null; kind: string | null };

/** What the apply needs of a staged book. */
export type StagedForApply = { at: string; path: string; documentId: string | null; sha256: string; split: { refusal: string | null } | null; chunks: StagedChunk[] };

/** What the apply needs of a book's line in check.json. */
export type CheckedForApply = { path: string; outcome: string; chunksBefore: number; chunksAfter: number; crossingAfter: { chunks: number }; problems: string[] };

/** The live document as the apply finds it. */
export type LiveForApply = { documentId: string; sha256: string; chunks: number } | null;

/**
 * Why a book's staged chunks may not replace its live ones, or null. Refused: no staged file; a staged book whose
 * chapters were not split or that holds no chunk; no line for it in check.json, a check older than the staging, or a
 * check whose outcome is not clean (a chunk crossing a chapter start, a label problem, labels not item 7's, tokens over
 * the bound); no live document, or one that is not the staged book's (another id, another file's checksum); live chunks
 * that changed in number since the check (somebody wrote them in between). Pure.
 */
export function applyRefusal(a: { staged: StagedForApply | null; check: CheckedForApply | null; checkAt: string | null; live: LiveForApply }): string | null {
  const { staged, check, live } = a;
  if (!staged) return "no staged file";
  if (!staged.split || staged.split.refusal) return `its chapters were not split in staging${staged.split?.refusal ? ` (${staged.split.refusal})` : ""}`;
  if (!staged.chunks.length) return "the staged book holds no chunk";
  if (!check) return "no line for it in check.json: run --check";
  if (!a.checkAt || Date.parse(a.checkAt) < Date.parse(staged.at)) return "check.json is older than the staged file: run --check again";
  if (check.outcome !== "staged") return `--check did not pass it (${check.outcome}${check.problems.length ? `: ${check.problems.join("; ")}` : ""})`;
  if (check.crossingAfter.chunks !== 0) return `${check.crossingAfter.chunks} staged chunk(s) cross a chapter start`;
  if (check.chunksAfter !== staged.chunks.length) return `check.json counted ${check.chunksAfter} staged chunks, the file holds ${staged.chunks.length}: run --check again`;
  if (!live) return "no live document: the apply replaces chunks of a document that exists, it creates none";
  if (staged.documentId !== live.documentId) return `the live document is ${live.documentId}, the staged book was read for ${staged.documentId ?? "none"}`;
  if (staged.sha256 !== live.sha256) return "the live document's checksum is not the staged file's";
  if (live.chunks !== check.chunksBefore) return `the live document holds ${live.chunks} chunks, ${check.chunksBefore} when it was checked: run --check again`;
  return null;
}

/** One book's transaction: the document kept by id, its live chunks deleted, the staged ones created in ordinal order. Pure. */
export type BookTransaction = {
  path: string;
  documentId: string;
  deletes: number;
  creates: (StagedChunk & { documentId: string })[];
};

export function bookTransaction(staged: StagedForApply & { documentId: string }, liveChunks: number): BookTransaction {
  const creates = [...staged.chunks].sort((x, y) => x.ordinal - y.ordinal).map((c) => ({ ...c, documentId: staged.documentId }));
  creates.forEach((c, i) => {
    if (c.ordinal !== i) throw new Error(`${staged.path}: staged ordinals are not 0…${creates.length - 1} (ordinal ${c.ordinal} at ${i})`);
  });
  return { path: staged.path, documentId: staged.documentId, deletes: liveChunks, creates };
}
