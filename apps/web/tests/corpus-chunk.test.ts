import { describe, expect, it } from "vitest";
import { chapterNameFromTitle, chunk, cleanHeading, lettersOfTitle, recoverChapterTitle } from "../scripts/corpus-chunk";
import type { PageContent, Run } from "../scripts/corpus-pdf";

/**
 * Citation headings (10 October 2026): Phase D found one heading in twenty garbled and three in ten NCERT chapters
 * untitled. The chunker now recovers a chapter's name from its running head, collapses overprinted letters,
 * rejoins split matras, keeps a cut section's number alone and never takes a web address for a heading.
 */
describe("cleanHeading", () => {
  it("collapses letters drawn twice over", () => {
    expect(cleanHeading("TheThe dd-- andand f-f- Block Elements")).toBe("The d- and f- Block Elements");
    expect(cleanHeading("Unit COORDINACOORDINATIONCOORDINACOORDINATIONCOORDINATIONTION COMPOUNDSCOMPOUNDS")).toBe("Unit COORDINATION COMPOUNDS");
    expect(cleanHeading("VARIAVARIATIONS IN PSYVARIATIONS IN PSYTIONS IN PSYCHOLOGICALTIONS IN PSYCHOLOGICAL ATATTRIBUTESATTRIBUTES")).not.toMatch(/([A-Z]{3,})\1/);
  });
  it("rejoins a matra split from its letter and drops a leading mark", () => {
    // The matra rejoins its letter; the space inside "गु णवत्" is a letter split that nothing can tell from a word break.
    expect(cleanHeading("खाद्य गु णवत् ा और")).toBe("खाद्य गु णवत्ा और");
    expect(cleanHeading(": G")).toBe("G");
    expect(cleanHeading("  Seasons   of   India ")).toBe("Seasons of India");
  });
  it("a label printed twice is one label, and a label alone names nothing", () => {
    expect(cleanHeading("Chapter 5 Chapter 5 Chapter 5")).toBe("");
    expect(cleanHeading("UNIT UNIT")).toBe("");
    expect(cleanHeading("Unit 1")).toBe("");
    expect(cleanHeading("Chapter 2 Chapter 2 Contemporary Centres of Power")).toBe("Chapter 2 Contemporary Centres of Power");
  });
  it("leaves an honest heading alone", () => {
    expect(cleanHeading("9.2 Third Law of Motion")).toBe("9.2 Third Law of Motion");
    expect(cleanHeading("Coal and Petroleum")).toBe("Coal and Petroleum");
    expect(cleanHeading("Mississippi")).toBe("Mississippi");
    expect(cleanHeading("Papa and Tata")).toBe("Papa and Tata");
  });
});

describe("recoverChapterTitle", () => {
  const heads = ["MATHEMATICS", "PROBABILITY", "Reprint 2025-26"];
  it("takes the running head whose letters the found title is a subsequence of, in title case", () => {
    expect(recoverChapterTitle("ROBABILITY", heads)).toBe("Probability");
    expect(recoverChapterTitle("ATURAL AZARDS AND ISASTERS", ["NATURAL HAZARDS AND DISASTERS", "FUNDAMENTALS OF PHYSICAL GEOGRAPHY"])).toBe("Natural Hazards and Disasters");
    expect(recoverChapterTitle("A Question of Trust", ["A Question of Trust", "Footprints without Feet"])).toBe("A Question of Trust");
  });
  it("tries the title's lines one by one when a unit heading or a subtitle was set with it", () => {
    const geo = ["FUNDAMENTALS OF PHYSICAL GEOGRAPHY", "NATURAL HAZARDS AND DISASTERS"];
    expect(recoverChapterTitle("NIT ATURAL AZARDS AND ISASTERS AUSES ONSEQUENCES AND ANAGEMENT", geo, ["NIT", "ATURAL AZARDS AND ISASTERS", "AUSES ONSEQUENCES AND ANAGEMENT"])).toBe("Natural Hazards and Disasters");
    expect(lettersOfTitle("ATURAL AZARDS AND ISASTERS", "Chapter 6: Natural Hazards and Disasters")).toBe(true);
    expect(lettersOfTitle("Floods and droughts", "Chapter 6: Natural Hazards and Disasters")).toBe(false);
    // The same words printed over themselves: the running head's letters run through the found title.
    const psy = ["PSYCHOLOGY", "VARIATIONS IN PSYCHOLOGICAL ATTRIBUTES"];
    expect(recoverChapterTitle("VARIATIONS IN PSYVARIATIONS IN PSYTIONS IN PSYCHOLOGICALTIONS IN PSYCHOLOGICAL ATATTRIBUTES", psy)).toBe("Variations in Psychological Attributes");
    expect(lettersOfTitle("VARIATIONS IN PSYVARIATIONS IN PSYTIONS IN PSYCHOLOGICALTIONS IN PSYCHOLOGICAL ATATTRIBUTES", "Chapter 1: Variations in Psychological Attributes")).toBe(true);
    expect(lettersOfTitle("Introduction", "Chapter 1: Variations in Psychological Attributes")).toBe(false);
    // The running head with its own label, and a title-page line with a word more than the title.
    expect(recoverChapterTitle("VARIATIONS IN PSYVARIATIONS IN PSYTIONS IN PSYCHOLOGICALTIONS IN PSYCHOLOGICAL ATATTRIBUTES", ["Psychology", "Chapter 1 • Variations in Psychological Attributes"])).toBe("Variations in Psychological Attributes");
    expect(lettersOfTitle("ATURAL AZARDS AND ISASTERS AUSES", "Chapter 6: Natural Hazards and Disasters")).toBe(true);
    expect(lettersOfTitle("ONSEQUENCES AND ANAGEMENT", "Chapter 6: Natural Hazards and Disasters")).toBe(false);
  });
  it("keeps the found title when no head matches, and nothing when nothing was found", () => {
    expect(recoverChapterTitle("Coal and Petroleum", heads)).toBe("Coal and Petroleum");
    expect(recoverChapterTitle("ROB", heads)).toBe("ROB");
    expect(recoverChapterTitle(null, heads)).toBeNull();
  });
});

const run = (text: string, y: number, size = 11, x = 70): Run => ({ text, x, y, width: text.length * size * 0.5, size, bold: false });
const page = (n: number, runs: Run[]): PageContent => ({ page: n, width: 500, height: 800, runs, images: [], ocr: false });

describe("a chapter whose opening page carries only a label", () => {
  const filler = "Society and environment shape each other through settlement, farming and the use of resources.";
  const pages: PageContent[] = [1, 2, 3, 4, 5, 6].map((n) =>
    page(n, [
      run(n % 2 ? "ENVIRONMENT AND SOCIETY" : "FUNDAMENTALS OF HUMAN GEOGRAPHY", 760, 10),
      ...(n === 1 ? [run("UNIT", 700, 22), run("NVIRONMENT AND OCIETY", 660, 18)] : []), // small capitals drawn as outlines
      ...Array.from({ length: 12 }, (_, i) => run(`${filler} (${"uvwxyz"[n - 1]}${"abcdefghijkl"[i]})`, 640 - i * 14)),
    ]),
  );
  const result = chunk(pages, { perChapterFile: true, chapterLabel: (found) => (found ? `Chapter 3: ${found}` : "Chapter 3"), figureKey: (p, i) => `${p}-${i}` });
  it("takes the name from the running head the first big heading's letters belong to, and keeps that heading out of the sections", () => {
    expect(result.chapter).toBe("Chapter 3: Environment and Society");
    expect(result.chunks.every((c) => c.headingPath.length === 1)).toBe(true);
  });
});

describe("the chunker's headings", () => {
  const filler = "A coin tossed at random comes down heads or tails with no reason to favour either face.";
  const pages: PageContent[] = [1, 2, 3, 4, 5, 6].map((n) =>
    page(n, [
      run(n % 2 ? "PROBABILITY" : "MATHEMATICS", 760, 10), // running heads: the chapter on odd pages, the book on even
      run(String(300 + n), 40, 10),
      ...(n === 1 ? [run("ROBABILITY", 700, 20, 90)] : []), // the title with its drop capital drawn as an outline
      ...(n === 2 ? [run("14.1 Probability — A Theoretical Approach", 700, 14)] : []),
      ...(n === 3 ? [run("14.2 F", 700, 14)] : []), // a section whose words were lost
      ...(n === 4 ? [run("For further enquiries, please visit www.ncert.nic.in", 700, 14)] : []),
      ...(n === 5 ? [run("TheThe EndEnd", 700, 14)] : []),
      ...Array.from({ length: 12 }, (_, i) => run(`${filler} (${"uvwxyz"[n - 1]}${"abcdefghijkl"[i]})`, 640 - i * 14)),
    ]),
  );
  const result = chunk(pages, { perChapterFile: true, chapterLabel: (found) => (found ? `Chapter 14: ${found}` : "Chapter 14"), figureKey: (p, i) => `${p}-${i}` });
  it("names the chapter from the running head, keeps a cut section's number, never a web address, and collapses an overprint", () => {
    expect(result.chapter).toBe("Chapter 14: Probability");
    const paths = new Set(result.chunks.map((c) => c.headingPath.join(" › ")));
    expect([...paths].some((p) => p.endsWith("14.2"))).toBe(true);
    expect([...paths].some((p) => /14\.2 F$/.test(p))).toBe(false);
    expect([...paths].some((p) => /www\./.test(p))).toBe(false);
    expect([...paths].some((p) => p.endsWith("The End"))).toBe(true);
    // The title page's own "ROBABILITY" is the title, not a section under it.
    expect([...paths].some((p) => /ROBABILITY/.test(p))).toBe(false);
    for (const c of result.chunks) expect(c.headingPath[0]).toBe("Chapter 14: Probability");
  });
});

describe("chapterNameFromTitle", () => {
  it("reads the publisher's chapter name off an exemplar's manifest title, and nothing off a book's", () => {
    expect(chapterNameFromTitle("Exemplar Problems — science, Class 9 — Unit 2(Is Matter Around Us Pure)")).toBe("Is Matter Around Us Pure");
    expect(chapterNameFromTitle("Exemplar Problems — chemistry, Class 11 — Unit 2 (Structure of Atom)")).toBe("Structure of Atom");
    expect(chapterNameFromTitle("Madhurima")).toBeNull();
    expect(chapterNameFromTitle("Exemplar Problems — science, Class 9 — Answers")).toBeNull();
  });
});

