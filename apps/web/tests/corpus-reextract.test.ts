import { describe, expect, it } from "vitest";
import { chunk } from "../scripts/corpus-chunk";
import { chapterLabel, splitBookWithOcr, withChapterHeadings } from "../scripts/corpus-contents";
import type { PageContent, Run } from "../scripts/corpus-pdf";
import { MAX_CHUNK_TOKENS, applyRefusal, bookTransaction, boundariesCrossed, chapterLabelsOf, chunksCrossing, labelProblems, tokenStats, type ChapterSpan, type CheckedForApply, type StagedChunk, type StagedForApply } from "../scripts/corpus-reextract-lib";

/**
 * owner-batch-item11 (31 October 2026): a Balbharati book re-cut at its chapter starts. Item 7 relabelled the stored chunks
 * by the page each starts on, so a chunk could run onto the next chapter's opening page; the ingest now cuts there
 * (withChapterHeadings, a hard level-0 heading), ends the last chapter where its pages end (the answers take the book's
 * title, as item 7 gave them), and scripts/corpus-reextract.ts checks a staged book with these functions.
 */

const run = (text: string, y: number, size = 13, x = 70): Run => ({ text, x, y, width: text.length * size * 0.5, size, bold: false });
const page = (n: number, runs: Run[]): PageContent => ({ page: n, width: 595, height: 842, runs, images: [], ocr: false });
const WORDS = ["line", "ray", "segment", "angle", "point", "plane", "triangle", "circle", "chord", "arc", "vertex", "side", "median", "altitude"];
const prose = (n: number, lines = 14) =>
  Array.from({ length: lines }, (_, i) => run(`The ${WORDS[(n + i) % WORDS.length]} and the ${WORDS[(n * 3 + i * 5) % WORDS.length]} meet as the ${WORDS[(n * 7 + i) % WORDS.length]} shows on page ${n}, line ${i}.`, 700 - i * 18));

/** A cover, a contents page whose numbers are drawn, three chapters (the third two pages, a short last page) and the answers. */
function book(): PageContent[] {
  return [
    page(1, [run("MATHEMATICS", 752, 36, 200), run("STANDARD NINE", 694, 22, 220)]),
    page(2, [run("The Constitution of India", 679, 26, 134), ...prose(2, 6)]),
    page(3, [
      run("CONTENTS", 720, 20, 242),
      run("Sr. No.", 683, 12, 66),
      run("Chapters", 683, 12, 180),
      run("Page No.", 683, 12, 382),
      run("Basic Concepts in Geometry ......................", 650, 13, 124),
      run("1 to 3", 650, 13, 400),
      run("Parallel Lines ......................................", 620, 13, 124),
      run("4 to 5", 620, 13, 400),
      run("Empowerment of Women and", 590, 13, 124),
      run("other Weaker Sections .......................", 572, 13, 124),
      run("6 to 7", 572, 13, 400),
      run("Answers ................................................", 542, 13, 124),
      run("8 to 8", 542, 13, 400),
    ]),
    page(4, [run("Basic Concepts in Geometry", 753, 21, 141), ...prose(4)]),
    page(5, prose(5)),
    // Chapter 1 ends a few lines into its last page: the old cut ran on into chapter 2's opening page.
    page(6, prose(6, 3)),
    page(7, [run("Parallel Lines", 753, 21, 141), ...prose(7)]),
    page(8, prose(8)),
    page(9, [run("Empowerment of Women and", 753, 21, 141), run("other Weaker Sections", 727, 21, 141), ...prose(9)]),
    page(10, prose(10, 3)),
    page(11, [run("Answers", 753, 18, 141), ...prose(11, 10)]),
  ];
}

describe("a re-cut book", () => {
  it("has no chunk crossing a chapter start, every chunk labelled by its pages, and the answers under the book's title", async () => {
    const pages = book();
    const { split } = await splitBookWithOcr(pages, null);
    expect(split.refusal).toBeNull();
    const chapters: ChapterSpan[] = split.chapters.map((c) => ({ label: chapterLabel(c), startPage: c.startPage, endPage: c.endPage }));
    expect(chapters.map((c) => [c.label, c.startPage, c.endPage])).toEqual([
      ["1. Basic Concepts in Geometry", 4, 6],
      ["2. Parallel Lines", 7, 8],
      ["3. Empowerment of Women and other Weaker Sections", 9, 10],
    ]);
    const { chunks } = chunk(pages, { perChapterFile: false, figureKey: (p, i) => `${p}-${i}`, transformElements: (els) => withChapterHeadings(els, split.chapters, { outside: "९ वी गणित भाग-२ इंग्रजी" }) });
    expect(chunksCrossing(chunks, chapters)).toEqual([]);
    expect(boundariesCrossed(chunks, chapters)).toEqual({ boundaries: 2, crossed: [] });
    expect(labelProblems(chunks, chapters)).toEqual([]);
    expect(chapterLabelsOf(chunks)).toEqual(chapters.map((c) => c.label));
    const answers = chunks.filter((c) => c.pageStart === 11);
    expect(answers.length).toBeGreaterThan(0);
    for (const a of answers) expect(a.chapter).toBe("९ वी गणित भाग-२ इंग्रजी");
    // The cover's own heading still names the front matter, as before.
    expect(chunks[0]!.chapter).toBe("MATHEMATICS");
    const t = tokenStats(chunks);
    expect(t.overMax).toBe(0);
    expect(t.max).toBeLessThanOrEqual(MAX_CHUNK_TOKENS);
  });

  it("without the end of the last chapter, the answers would run on under its label, and the check says so", async () => {
    const pages = book();
    const { split } = await splitBookWithOcr(pages, null);
    const chapters: ChapterSpan[] = split.chapters.map((c) => ({ label: chapterLabel(c), startPage: c.startPage, endPage: c.endPage }));
    const { chunks } = chunk(pages, { perChapterFile: false, figureKey: (p, i) => `${p}-${i}`, transformElements: (els) => withChapterHeadings(els, split.chapters) });
    expect(chunksCrossing(chunks, chapters)).toEqual([]);
    const problems = labelProblems(chunks, chapters);
    expect(problems.length).toBeGreaterThan(0);
    // The answers' first lines run on in the last chapter's chunk, and the rest carry its label outside its pages.
    expect(problems.join("\n")).toMatch(/runs past 3\. Empowerment of Women and other Weaker Sections's last page 10|outside every chapter but labelled "3\. Empowerment/);
  });

  it("finds the chunks item 7 left running onto the next chapter's opening page", () => {
    const chapters: ChapterSpan[] = [
      { label: "1. Sets", startPage: 11, endPage: 28 },
      { label: "2. Real Numbers", startPage: 29, endPage: 45 },
      { label: "3. Polynomials", startPage: 46, endPage: 66 },
    ];
    // Relabelled by the page each starts on: the chunk from 27 to 29 is chapter 1's but holds chapter 2's first lines.
    const relabelled = [
      { chapter: "MATHEMATICS", headingPath: ["MATHEMATICS"], pageStart: 9, pageEnd: 11 },
      { chapter: "1. Sets", headingPath: ["1. Sets"], pageStart: 12, pageEnd: 26 },
      { chapter: "1. Sets", headingPath: ["1. Sets"], pageStart: 27, pageEnd: 29 },
      { chapter: "2. Real Numbers", headingPath: ["2. Real Numbers"], pageStart: 30, pageEnd: 45 },
      { chapter: "3. Polynomials", headingPath: ["3. Polynomials"], pageStart: 46, pageEnd: 66 },
    ];
    expect(chunksCrossing(relabelled, chapters).map((x) => [x.chunk.pageStart, x.chapter.label])).toEqual([
      [9, "1. Sets"],
      [27, "2. Real Numbers"],
    ]);
    const b = boundariesCrossed(relabelled, chapters);
    expect(b.boundaries).toBe(2);
    expect(b.crossed).toEqual(["1. Sets → 2. Real Numbers (chunk pp. 27–29, next opens p. 29)"]);
    expect(labelProblems(relabelled, chapters)).toEqual(["chunk 2 (pp. 27–29) runs past 1. Sets's last page 28"]);
  });

  it("counts tokens against the chunker's bound", () => {
    expect(MAX_CHUNK_TOKENS).toBe(650);
    expect(tokenStats([{ tokens: 700, text: "x".repeat(2800) }, { tokens: 50, text: "x".repeat(200) }, { tokens: 500, text: "x".repeat(2000) }])).toEqual({ chunks: 3, min: 50, median: 500, max: 700, overMax: 1, short: 1 });
  });
});

describe("the apply (phase 2)", () => {
  const chunkAt = (ordinal: number): StagedChunk => ({ ordinal, chapter: "1. Sets", section: null, headingPath: ["1. Sets"], pageStart: 11 + ordinal, pageEnd: 11 + ordinal, text: `text ${ordinal}`, language: "en", tokens: 2, figureKeys: [], edition: "First Edition 2026", kind: null });
  const staged = (over: Partial<StagedForApply> = {}): StagedForApply => ({ at: "2026-10-31T03:00:00.000Z", path: "balbharati/9/mathematics/903000608.pdf", documentId: "doc1", sha256: "abc", split: { refusal: null }, chunks: [chunkAt(1), chunkAt(0), chunkAt(2)], ...over });
  const check = (over: Partial<CheckedForApply> = {}): CheckedForApply => ({ path: "balbharati/9/mathematics/903000608.pdf", outcome: "staged", chunksBefore: 2, chunksAfter: 3, crossingAfter: { chunks: 0 }, problems: [], ...over });
  const live = { documentId: "doc1", sha256: "abc", chunks: 2 };
  const at = "2026-10-31T03:10:00.000Z";

  it("passes a book whose staging is checked clean and whose live document is the one the staging read", () => {
    expect(applyRefusal({ staged: staged(), check: check(), checkAt: at, live })).toBeNull();
  });

  it("refuses a book whose staged set is missing, unsplit or empty, or that --check did not pass", () => {
    expect(applyRefusal({ staged: null, check: check(), checkAt: at, live })).toBe("no staged file");
    expect(applyRefusal({ staged: staged({ split: { refusal: "no contents page" } }), check: check(), checkAt: at, live })).toMatch(/not split in staging \(no contents page\)/);
    expect(applyRefusal({ staged: staged({ split: null }), check: check(), checkAt: at, live })).toMatch(/not split/);
    expect(applyRefusal({ staged: staged({ chunks: [] }), check: check(), checkAt: at, live })).toMatch(/holds no chunk/);
    expect(applyRefusal({ staged: staged(), check: null, checkAt: at, live })).toMatch(/run --check/);
    expect(applyRefusal({ staged: staged(), check: check(), checkAt: "2026-10-31T02:00:00.000Z", live })).toMatch(/older than the staged file/);
    expect(applyRefusal({ staged: staged(), check: check({ outcome: "problems", problems: ["2 label problem(s)"] }), checkAt: at, live })).toMatch(/did not pass it \(problems: 2 label problem/);
    expect(applyRefusal({ staged: staged(), check: check({ crossingAfter: { chunks: 1 } }), checkAt: at, live })).toMatch(/cross a chapter start/);
    expect(applyRefusal({ staged: staged(), check: check({ chunksAfter: 4 }), checkAt: at, live })).toMatch(/counted 4 staged chunks/);
  });

  it("refuses a book whose live document is gone, another, or written since the check", () => {
    expect(applyRefusal({ staged: staged(), check: check(), checkAt: at, live: null })).toMatch(/creates none/);
    expect(applyRefusal({ staged: staged(), check: check(), checkAt: at, live: { ...live, documentId: "doc2" } })).toMatch(/live document is doc2/);
    expect(applyRefusal({ staged: staged(), check: check(), checkAt: at, live: { ...live, sha256: "zzz" } })).toMatch(/checksum/);
    expect(applyRefusal({ staged: staged(), check: check(), checkAt: at, live: { ...live, chunks: 5 } })).toMatch(/holds 5 chunks, 2 when it was checked/);
  });

  it("plans one transaction per book: the document kept by id, its live rows deleted, the staged ones created in ordinal order", () => {
    const tx = bookTransaction({ ...staged(), documentId: "doc1" }, 2);
    expect(tx.documentId).toBe("doc1");
    expect(tx.deletes).toBe(2);
    expect(tx.creates.map((c) => [c.ordinal, c.documentId, c.pageStart])).toEqual([
      [0, "doc1", 11],
      [1, "doc1", 12],
      [2, "doc1", 13],
    ]);
    expect(Object.keys(tx.creates[0]!).sort()).toEqual(["chapter", "documentId", "edition", "figureKeys", "headingPath", "kind", "language", "ordinal", "pageEnd", "pageStart", "section", "text", "tokens"]);
    expect(() => bookTransaction({ ...staged({ chunks: [chunkAt(0), chunkAt(2)] }), documentId: "doc1" }, 2)).toThrow(/ordinals are not 0…1/);
  });
});
