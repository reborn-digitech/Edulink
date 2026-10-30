import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { chunk } from "../scripts/corpus-chunk";
import { chapterLabel, chooseBooks, contentsOf, labelChunks, ocrRow, parseContentsRow, splitBook, splitBookWithOcr, standardOfBookId, withChapterHeadings } from "../scripts/corpus-contents";
import type { PageContent, Run } from "../scripts/corpus-pdf";
import { bookChapterOf, listChapters, planBalbharati, selectChapter } from "../scripts/quiz-gen/select";
import { chapterNumberOf } from "../scripts/quiz-gen/checks";

/**
 * owner-batch-item7 (30 October 2026): a Balbharati book is one PDF whose chapter numbers are drawn and whose titles sit in
 * a face smaller than the cover's, so the chunker gave every chunk the cover's title and the generator found no chapters.
 * The book's own contents page now gives them (scripts/corpus-contents.ts), and the generator plans one book of each
 * edition with its parts in order (scripts/quiz-gen/select.ts planBalbharati).
 */

const run = (text: string, y: number, size = 13, x = 70): Run => ({ text, x, y, width: text.length * size * 0.5, size, bold: false });
const page = (n: number, runs: Run[], ocr = false): PageContent => ({ page: n, width: 595, height: 842, runs, images: [], ocr });
const WORDS = ["line", "ray", "segment", "angle", "point", "plane", "triangle", "circle", "chord", "arc", "vertex", "side", "median", "altitude"];
/** Body lines no two of which repeat (a line on a quarter of the pages is taken for a running head and dropped). */
const prose = (n: number, lines = 14) =>
  Array.from({ length: lines }, (_, i) => run(`The ${WORDS[(n + i) % WORDS.length]} and the ${WORDS[(n * 3 + i * 5) % WORDS.length]} meet as the ${WORDS[(n * 7 + i) % WORDS.length]} shows on page ${n}, line ${i}.`, 700 - i * 18));

/** A fixture excerpt: a cover, a contents page (numbers drawn, so absent), two chapter openings and the pages after them. */
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
      run("S.O.I. Note : The following foot notes are applicable : (1) © Government of India, Copyright : 2017.", 300, 9, 66),
    ]),
    page(4, [run("Basic Concepts in Geometry", 753, 21, 141), run("Let’s study.", 669, 14, 309), ...prose(4)]),
    page(5, prose(5)),
    page(6, prose(6)),
    page(7, [run("Parallel Lines", 753, 21, 141), ...prose(7)]),
    page(8, prose(8)),
    page(9, [run("Empowerment of Women and", 753, 21, 141), run("other Weaker Sections", 727, 21, 141), ...prose(9)]),
    page(10, prose(10)),
    page(11, [run("Answers", 753, 18, 141), ...prose(11, 4)]),
  ];
}

describe("the contents page", () => {
  it("reads a row's title, its leaders and its page range, and a number before the leaders as the title's", () => {
    expect(parseContentsRow("Basic Concepts in Geometry ........ 1 to 12")).toMatchObject({ number: null, title: "Basic Concepts in Geometry", page: 1, endPage: 12 });
    expect(parseContentsRow("10. Banks and Simple Interest........ 69 to 74")).toMatchObject({ number: 10, title: "Banks and Simple Interest", page: 69, endPage: 74 });
    expect(parseContentsRow("Changing Life : 1 ......................")).toMatchObject({ title: "Changing Life : 1", page: null });
    expect(parseContentsRow("Motion and Types of Motion 106")).toMatchObject({ title: "Motion and Types of Motion", page: 106 });
    expect(parseContentsRow("3. A DEMAND ANALYSIS 17 - 26")).toMatchObject({ number: 3, sub: "A", title: "DEMAND ANALYSIS", page: 17, endPage: 26 });
  });

  it("makes an OCR'd row plain: leaders read as letters, a 'to' read as 10, a range run together", () => {
    expect(ocrRow("1. SIMIarity oiiieniininieniisissessnsnssssesesnees 1 10 29")).toBe("1. SIMIarity ........ 1 to 29");
    expect(ocrRow("11. Circle icici. 191079")).toBe("11. Circle");
    expect(ocrRow("1. Geometrical Constructions............cccceeevvevevceeee. 1 t0 10")).toBe("1. Geometrical Constructions ........ ........ 1 to 10");
  });

  it("numbers the entries by their place when the numbers are drawn, joins a wrapped title, keeps answers as end matter and stops at the note", () => {
    const block = contentsOf(book()[2]!);
    expect(block?.parts).toHaveLength(1);
    expect(block!.parts[0]!.entries.map((e) => [e.number, e.title, e.page, e.endPage])).toEqual([
      [1, "Basic Concepts in Geometry", 1, 3],
      [2, "Parallel Lines", 4, 5],
      [3, "Empowerment of Women and other Weaker Sections", 6, 7],
    ]);
    expect(block!.parts[0]!.extras.map((x) => x.title)).toEqual(["Answers"]);
  });

  it("runs one sequence on under a 'Part 2' heading, and makes '3. A' and '3. B' one chapter", () => {
    const p = page(10, [
      run("index", 748, 18, 261),
      run("Part 1", 669, 18, 260),
      run("Rational numbers ........ 01 to 06", 635, 14, 130),
      run("Indices ........ 07 to 13", 613, 14, 130),
      run("3. A Demand Analysis ........ 14 to 18", 590, 14, 92),
      run("3. B Elasticity of Demand ........ 19 to 22", 568, 14, 92),
      run("Part 2", 500, 18, 260),
      run("4. Division of Polynomials ........ 23 to 30", 466, 14, 92),
      run("5. Statistics ........ 31 to 40", 444, 14, 92),
    ]);
    const entries = contentsOf(p)!.parts.flatMap((x) => x.entries);
    expect(entries.map((e) => `${e.number}. ${e.title}`)).toEqual(["1. Rational numbers", "2. Indices", "3. Demand Analysis and Elasticity of Demand", "4. Division of Polynomials", "5. Statistics"]);
  });
});

describe("the split and the chunker's cut", () => {
  it("places each title on its opening page by the page offset, and ends the last chapter before the answers", () => {
    const split = splitBook(book());
    expect(split.refusal).toBeNull();
    expect(split.method).toBe("contents");
    expect(split.chapters.map((c) => [c.number, c.title, c.startPage, c.endPage, c.how])).toEqual([
      [1, "Basic Concepts in Geometry", 4, 6, "title"],
      [2, "Parallel Lines", 7, 8, "title"],
      [3, "Empowerment of Women and other Weaker Sections", 9, 10, "title"],
    ]);
    expect(split.notes).toContain("the book: printed page + 3 = PDF page");
  });

  it("refuses a book whose titles the body does not print, rather than guessing", () => {
    const pages = book().map((p) => (p.page >= 4 ? page(p.page, prose(p.page)) : p));
    const split = splitBook(pages.map((p) => (p.page === 3 ? page(3, p.runs.map((r) => ({ ...r, text: r.text.replace(/\d+ to \d+/, "") }))) : p)));
    expect(split.chapters).toEqual([]);
    expect(split.refusal).toMatch(/3 of 3 chapters not found in the body/);
  });

  it("cuts a chunk at every chapter's opening page and labels it as the generator reads it", async () => {
    const pages = book();
    const { split } = await splitBookWithOcr(pages, null);
    const result = chunk(pages, { perChapterFile: false, figureKey: (p, i) => `${p}-${i}`, transformElements: (els) => withChapterHeadings(els, split.chapters) });
    const byLabel = new Map<string, number[]>();
    for (const c of result.chunks) byLabel.set(c.chapter ?? "", [...(byLabel.get(c.chapter ?? "") ?? []), c.pageStart]);
    expect([...byLabel.keys()].filter((k) => chapterNumberOf(k) !== null)).toEqual(["1. Basic Concepts in Geometry", "2. Parallel Lines", "3. Empowerment of Women and other Weaker Sections"]);
    // Each chapter's chunks start on its own pages: no chunk runs over a chapter's start.
    for (const c of result.chunks) {
      const n = chapterNumberOf(c.chapter ?? "");
      if (n === null) continue;
      const ch = split.chapters.find((x) => x.number === n)!;
      expect(c.pageStart).toBeGreaterThanOrEqual(ch.startPage);
      expect(c.headingPath[0]).toBe(c.chapter);
      expect(c.headingPath).not.toContain("Basic Concepts in Geometry");
    }
    // Before chapter 1 the cover's face still names the front matter, which no chapter number reads.
    expect(result.chunks[0]!.chapter).toBe("MATHEMATICS");
  });

  it("relabels stored chunks by the page they start on, dropping the front matter's headings that ran on", () => {
    const { chapters } = splitBook(book());
    const rows = [
      { id: "a", chapter: "MATHEMATICS", headingPath: ["MATHEMATICS", "The Constitution of India"], pageStart: 2, pageEnd: 3 },
      { id: "b", chapter: "MATHEMATICS", headingPath: ["MATHEMATICS", "The Constitution of India", "Basic Concepts in Geometry"], pageStart: 4, pageEnd: 5 },
      { id: "c", chapter: "MATHEMATICS", headingPath: ["MATHEMATICS", "The Constitution of India", "Co-ordinates of points"], pageStart: 5, pageEnd: 6 },
      { id: "d", chapter: "MATHEMATICS", headingPath: ["MATHEMATICS", "The Constitution of India", "Parallel Lines"], pageStart: 7, pageEnd: 8 },
      { id: "e", chapter: "MATHEMATICS", headingPath: ["MATHEMATICS"], pageStart: 11, pageEnd: 11 },
    ];
    const out = labelChunks(rows, chapters, "९ वी गणित भाग-२ इंग्रजी");
    expect(out.map((o) => o.headingPath)).toEqual([
      ["MATHEMATICS", "The Constitution of India"],
      ["1. Basic Concepts in Geometry"],
      ["1. Basic Concepts in Geometry", "Co-ordinates of points"],
      ["2. Parallel Lines"],
      ["MATHEMATICS"],
    ]);
    expect(out.map((o) => o.changed)).toEqual([false, true, true, true, false]);
    // Idempotent: the written labels read back unchanged.
    const again = labelChunks(rows.map((r, i) => ({ ...r, chapter: out[i]!.chapter, headingPath: out[i]!.headingPath })), chapters, "x");
    expect(again.every((o) => !o.changed)).toBe(true);
    expect(chapterLabel({ part: 2, partName: "Political Science", number: 2, title: "India’s Foreign Policy" })).toBe("Political Science · 2. India’s Foreign Policy");
  });
});

type FakeDoc = { id: string; path: string; board: string; subject: string; title: string; edition: string | null; year: string | null; sourceUrl: string; extra: unknown; gradeOrProgramme: string };
type FakeChunk = { id: string; documentId: string; ordinal: number; chapter: string | null; headingPath: string[]; pageStart: number; pageEnd: number; text: string; tokens: number; figureKeys: string[] };

const doc = (id: string, title: string, bookId: string, lastModified: string): FakeDoc => ({
  id,
  path: `balbharati/9/mathematics/${bookId}.pdf`,
  board: "Balbharati",
  subject: "Mathematics",
  title,
  edition: null,
  year: "2026",
  sourceUrl: `https://ebooks.ebalbharati.in/pdfs/${bookId}.pdf`,
  extra: { bookId, medium: "English", lastModified },
  gradeOrProgramme: "9",
});

describe("which documents are one book", () => {
  const district = (id: string, d: string, lm: string) => ({ ...doc(id, `३ री जि. ${d} आ.स.ज. भा-१ इंग्रजी`, `3030305${id}`, lm), gradeOrProgramme: "3" });
  it("plans one edition of a book printed for every district: the one naming no district, else the newest", () => {
    const editions = [district("44", "मुंबई", "Wed, 19 Aug 2026 11:25:36 GMT"), district("51", "रायगड", "Fri, 21 Aug 2026 08:03:36 GMT"), district("45", "ठाणे", "Thu, 20 Aug 2026 10:03:58 GMT")];
    const part2 = { ...doc("69", "३ री आपल्या सभोवतालचे जग भा २ इंग्रजी", "303000869", "Tue, 28 Jul 2026 10:23:00 GMT"), gradeOrProgramme: "3" };
    const choice = chooseBooks([...editions, part2]);
    expect(choice.books.map((b) => b.id)).toEqual(["51", "69"]);
    expect(choice.editions.map((e) => [e.doc.id, e.of.id])).toEqual([
      ["45", "51"],
      ["44", "51"],
    ]);
    const plain = { ...doc("00", "३ री आपल्या सभोवतालचे जग भा १ इंग्रजी", "303000868", "Mon, 06 Apr 2026 05:17:49 GMT"), gradeOrProgramme: "3" };
    expect(chooseBooks([...editions, plain, part2]).books.map((b) => b.id)).toEqual(["00", "69"]);
  });
  it("sets aside a book whose id names another standard, and orders a class's parts", () => {
    expect(standardOfBookId("1203020415")).toBe(12);
    expect(standardOfBookId("303030544")).toBe(3);
    const misfiled = { ...doc("x", "११ वी भौतिकशास्त्र इंग्रजी", "1203020415", "Mon, 06 Apr 2026 05:11:56 GMT"), gradeOrProgramme: "11" };
    const physics = { ...doc("y", "११ वी भौतिकशास्त्र इंग्रजी", "1103020415", "Mon, 06 Apr 2026 05:11:18 GMT"), gradeOrProgramme: "11" };
    const choice = chooseBooks([misfiled, physics]);
    expect(choice.books.map((b) => b.id)).toEqual(["y"]);
    expect(choice.misfiled.map((m) => m.doc.id)).toEqual(["x"]);
    expect(chooseBooks([doc("p2", "९ वी गणित भाग-२ इंग्रजी", "903000609", "x"), doc("p1", "९ वी गणित भाग-१ इंग्रजी", "903000608", "x")]).books.map((b) => b.id)).toEqual(["p1", "p2"]);
  });
});

describe("the generator's chapters of a Balbharati class and subject", () => {
  const part1 = doc("p1", "९ वी गणित भाग-१ इंग्रजी", "903000608", "Mon, 06 Apr 2026 05:22:14 GMT");
  const part2 = doc("p2", "९ वी गणित भाग-२ इंग्रजी", "903000609", "Mon, 06 Apr 2026 05:22:15 GMT");
  const chunkRow = (id: string, documentId: string, ordinal: number, label: string, page: number): FakeChunk => ({
    id,
    documentId,
    ordinal,
    chapter: label,
    headingPath: [label],
    pageStart: page,
    pageEnd: page,
    text: `Chunk ${id}: sets, real numbers, lines, rays, segments, triangles and their properties, with worked examples.`,
    tokens: 30,
    figureKeys: [],
  });
  const chunks: FakeChunk[] = [
    chunkRow("a0", "p1", 0, "MATHEMATICS", 2),
    chunkRow("a1", "p1", 1, "1. Sets", 11),
    chunkRow("a2", "p1", 2, "2. Real Numbers", 29),
    chunkRow("b0", "p2", 0, "MATHEMATICS", 2),
    chunkRow("b1", "p2", 1, "1. Basic Concepts in Geometry", 11),
    chunkRow("b2", "p2", 2, "1. Basic Concepts in Geometry", 15),
    chunkRow("b3", "p2", 3, "2. Parallel Lines", 23),
  ];
  const db = {
    contentDocument: { findMany: async () => [part2, part1] },
    contentChunk: {
      findMany: async ({ where }: { where: { documentId: string | { in: string[] } } }) => {
        const ids = typeof where.documentId === "string" ? [where.documentId] : where.documentId.in;
        return chunks.filter((c) => ids.includes(c.documentId)).sort((x, y) => x.documentId.localeCompare(y.documentId) || x.ordinal - y.ordinal);
      },
    },
    quizTopic: { findFirst: async () => null },
  } as unknown as PrismaClient;

  it("reads a label with its part, and plans part 2's chapters after part 1's", () => {
    expect(bookChapterOf("Political Science · 2. India’s Foreign Policy")).toEqual({ part: "Political Science", number: 2, label: "2. India’s Foreign Policy" });
    expect(bookChapterOf("3. Force and Pressure")).toEqual({ part: null, number: 3, label: "3. Force and Pressure" });
    expect(bookChapterOf("MATHEMATICS")).toBeNull();
    // An older reader never takes a second part's chapter for the first's.
    expect(chapterNumberOf("Political Science · 2. India’s Foreign Policy")).toBeNull();
    const plan = planBalbharati([part2, part1], (d) => chunks.filter((c) => c.documentId === d.id).map((c) => c.chapter ?? ""));
    expect(plan.chapters.map((c) => [c.planNumber, c.number, c.doc.id])).toEqual([
      [1, 1, "p1"],
      [2, 2, "p1"],
      [3, 1, "p2"],
      [4, 2, "p2"],
    ]);
  });

  it("listChapters returns every book's chapters with names, and selectChapter takes part 2's chunks for its plan number", async () => {
    const lines: string[] = [];
    const listed = await listChapters(db, { board: "Balbharati", grade: 9, subject: "Mathematics" }, (l) => lines.push(l));
    expect(listed.map((c) => [c.number, c.name, c.bookCode])).toEqual([
      [1, "Sets", "903000608"],
      [2, "Real Numbers", "903000608"],
      [3, "Basic Concepts in Geometry", "903000609"],
      [4, "Parallel Lines", "903000609"],
    ]);
    expect(lines.join("\n")).toMatch(/2 books planned in this order/);
    const chapter = await selectChapter(db, { board: "Balbharati", grade: 9, subject: "Mathematics", chapter: 3 });
    expect(chapter.chunks.map((c) => c.id)).toEqual(["b1", "b2"]);
    expect(chapter.chapterName).toBe("Basic Concepts in Geometry");
    expect(chapter.chapterLabel).toBe("Chapter 3 — Basic Concepts in Geometry");
    expect(chapter.bookPlace).toBe(`"९ वी गणित भाग-२ इंग्रजी", chapter 1`);
  });
});

describe("a chapter's title as written", () => {
  it("puts a title in capitals in title case, and leaves initials alone", async () => {
    const { chapterTitleFor } = await import("../scripts/corpus-contents");
    const at = (title: string) => chapterTitleFor({ title, startPage: 1, how: "title" }, [], 13, false).title;
    expect(at("BASIC CONCEPTS IN ECONOMICS")).toBe("Basic Concepts in Economics");
    expect(at("DEMAND ANALYSIS and ELASTICITY OF DEMAND")).toBe("Demand Analysis and Elasticity of Demand");
    expect(at("HCF and LCM")).toBe("HCF and LCM");
    expect(at("Lines and angLes")).toBe("Lines and angles");
  });
});
