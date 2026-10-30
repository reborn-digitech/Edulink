/**
 * owner-batch-item8 (31 October 2026): the generation plan's books.
 *
 * Proved here, without a database or a model: an NCERT class and subject with two different books under one chapter
 * number plans both (class 12 political science: Contemporary World Politics and Politics in India since Independence),
 * each chapter naming its book in the bank's line, the batch file's name (read back) and the run's chapter, and
 * selectChapter takes the book asked for, not the newest; a book another replaced is left out while the other is in the
 * corpus (class 8: the 2024 Science beside Curiosity, the owner's choice of 23 October) and planned when alone or asked
 * for by code; the parts of one book are numbered on (Mathematics Part II's "Integrals" is 7) and a part the corpus
 * already numbers on keeps its numbers (Ganita Prakash Part II's 8 to 14); a chapter of a named book matches and counts
 * only its book's chapters, and a new one's slug carries the book's short name beside another book's chapter of the same
 * name; the Balbharati Commerce "Mathematics and Statistics" books are left out of the school plan.
 */
import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { bookSlug, chapterBookOf, chapterLineFor, chapterNameOf, chapterNumberOf, matchTopic, nearDuplicates, slugForNewTopic } from "../scripts/quiz-gen/checks";
import { bankStems, chapterLineFilter, listChapters, ncertPartOf, NCERT_SUPERSEDED, planNcert, selectChapter } from "../scripts/quiz-gen/select";
import { createVerifier, type TopicFile } from "../scripts/verify-quiz";
import { fileNameFor, readFileName } from "../scripts/quiz-gen/cli";
import { chapterWork } from "../scripts/quiz-gen/job";
import { chooseBooks } from "../scripts/corpus-contents";
import type { Combo } from "../scripts/quiz-gen/plan";

type Doc = { id: string; path: string; title: string; subject: string; board: string; edition: string | null; year: string | null; sourceUrl: string; gradeOrProgramme: string; extra: unknown };
type Chunk = { id: string; documentId: string; ordinal: number; chapter: string | null; headingPath: string[]; pageStart: number; pageEnd: number; text: string; tokens: number; figureKeys: string[] };

const ncertDoc = (id: string, title: string, code: string, chapter: number, grade = "12", subject = "Political Science"): Doc => ({
  id,
  path: `ncert/${grade}/${subject.toLowerCase().replace(/ /g, "-")}/${id}.pdf`,
  title,
  subject,
  board: "NCERT",
  edition: null,
  year: null,
  sourceUrl: `https://ncert.nic.in/textbook/pdf/${id}.pdf`,
  gradeOrProgramme: grade,
  extra: { chapter, bookCode: code, lastModified: code.endsWith("2") ? "Sat, 28 Mar 2026 05:59:30 GMT" : "Fri, 27 Mar 2026 09:52:23 GMT" },
});

/** A fake client over a few documents and their chunks: the reads listChapters and selectChapter make. */
function fakeDb(docs: Doc[], chunks: Chunk[]): PrismaClient {
  return {
    contentDocument: { findMany: async () => docs },
    contentChunk: {
      findMany: async ({ where }: { where: { documentId: string | { in: string[] } } }) => {
        const ids = typeof where.documentId === "string" ? [where.documentId] : where.documentId.in;
        return chunks.filter((c) => ids.includes(c.documentId)).sort((x, y) => x.documentId.localeCompare(y.documentId) || x.ordinal - y.ordinal);
      },
    },
    quizTopic: { findFirst: async () => null },
  } as unknown as PrismaClient;
}

const chunk = (documentId: string, label: string, words: string): Chunk => ({
  id: `${documentId}-c0`,
  documentId,
  ordinal: 0,
  chapter: label,
  headingPath: [label],
  pageStart: 1,
  pageEnd: 2,
  text: `${words} ${words} The chapter speaks of ${words.toLowerCase()} at length, with examples and questions about them.`,
  tokens: 60,
  figureKeys: [],
});

describe("two NCERT books under one chapter number: class 12 political science", () => {
  const docs = [
    ncertDoc("leps101", "Contemporary World Politics", "leps1", 1),
    ncertDoc("leps105", "Contemporary World Politics", "leps1", 5),
    ncertDoc("leps201", "Politics in India Since Independence", "leps2", 1),
    ncertDoc("leps205", "Politics in India Since Independence", "leps2", 5),
  ];
  const chunks = [
    chunk("leps101", "Chapter 1: The End of Bipolarity", "Bipolarity End Soviet Union"),
    chunk("leps105", "Chapter 5: Security in the Contemporary World", "Security Contemporary World"),
    chunk("leps201", "Chapter 1: Challenges of Nation Building", "Challenges Nation Building"),
    chunk("leps205", "Chapter 5: Challenges to and Restoration of the Congress System", "Challenges Restoration Congress System"),
  ];
  const db = fakeDb(docs, chunks);

  it("plans both books, each chapter naming its book; one book alone names none", () => {
    const label = (d: Doc) => chunks.find((c) => c.documentId === d.id)!.chapter!;
    const plan = planNcert(docs, label);
    expect(plan.named).toBe(true);
    expect(plan.chapters.map((c) => [c.planNumber, c.book?.code])).toEqual([
      [1, "leps1"],
      [5, "leps1"],
      [1, "leps2"],
      [5, "leps2"],
    ]);
    expect(plan.chapters[1]!.book).toEqual({ code: "leps1", title: "Contemporary World Politics" });
    const alone = planNcert(docs.filter((d) => d.id.startsWith("leps2")), label);
    expect(alone.named).toBe(false);
    expect(alone.chapters.map((c) => [c.planNumber, c.book])).toEqual([
      [1, null],
      [5, null],
    ]);
  });

  it("listChapters lists each book's chapters in turn; selectChapter takes the book asked for, not the newest", async () => {
    const lines: string[] = [];
    const listed = await listChapters(db, { board: "NCERT", grade: 12, subject: "Political Science" }, (l) => lines.push(l));
    expect(listed.map((c) => [c.number, c.name, c.bookCode, c.planBook])).toEqual([
      [1, "The End of Bipolarity", "leps1", "Contemporary World Politics"],
      [5, "Security in the Contemporary World", "leps1", "Contemporary World Politics"],
      [1, "Challenges of Nation Building", "leps2", "Politics in India Since Independence"],
      [5, "Challenges to and Restoration of the Congress System", "leps2", "Politics in India Since Independence"],
    ]);
    expect(lines.join("\n")).toMatch(/two books share chapter numbers/);
    // leps2 is the newer book; the old rule took it for every number. The book asked for is the one taken.
    const older = await selectChapter(db, { board: "NCERT", grade: 12, subject: "Political Science", chapter: 5, book: "leps1" });
    expect(older.documentPath).toBe("ncert/12/political-science/leps105.pdf");
    expect(older.chapterName).toBe("Security in the Contemporary World");
    expect(older.chapterLabel).toBe("Chapter 5 (Contemporary World Politics) — Security in the Contemporary World");
    expect(older.planBook).toEqual({ code: "leps1", title: "Contemporary World Politics" });
    expect(fileNameFor(older)).toBe("ncert-12-civics-leps1-5");
    const newer = await selectChapter(db, { board: "NCERT", grade: 12, subject: "Political Science", chapter: 5, book: "leps2" });
    expect(newer.chapterLabel).toBe("Chapter 5 (Politics in India Since Independence) — Challenges to and Restoration of the Congress System");
    expect(fileNameFor(newer)).toBe("ncert-12-civics-leps2-5");
    // With no book named, the plan's first is taken and the log says so.
    const said: string[] = [];
    expect((await selectChapter(db, { board: "NCERT", grade: 12, subject: "Political Science", chapter: 1 }, (l) => said.push(l))).bookCode).toBe("leps1");
    expect(said.join("\n")).toMatch(/2 books carry chapter 1/);
  });

  it("a run takes one chapter per book and number, with its own batch file, line and served count", async () => {
    const combo: Combo = { board: "NCERT", boardCode: "NCERT", grade: 12, subject: "Political Science", subjectCode: "CIVICS" };
    const work = chapterWork(combo, await listChapters(db, { board: "NCERT", grade: 12, subject: "Political Science" }), {});
    expect(work.map((w) => w.fileName)).toEqual(["ncert-12-civics-leps1-1.json", "ncert-12-civics-leps1-5.json", "ncert-12-civics-leps2-1.json", "ncert-12-civics-leps2-5.json"]);
    expect(work[1]!.ref).toEqual({ board: "NCERT", grade: 12, subject: "CIVICS", number: 5, name: "Security in the Contemporary World · Contemporary World Politics" });
    expect(work[1]!.book).toEqual({ code: "leps1", title: "Contemporary World Politics" });
    expect(work[1]!.label).toBe('NCERT class 12 Political Science, "Contemporary World Politics" chapter 5 (Security in the Contemporary World)');
    expect(chapterWork(combo, await listChapters(db, { board: "NCERT", grade: 12, subject: "Political Science" }), { chapterFrom: 5 }).map((w) => w.fileName)).toEqual(["ncert-12-civics-leps1-5.json", "ncert-12-civics-leps2-5.json"]);
    // The served count reads the book's own lines; a plain chapter never another book's.
    expect(chapterLineFilter(5, "Contemporary World Politics")).toEqual({ startsWith: "Chapter 5 (Contemporary World Politics) " });
    expect(chapterLineFilter(5, null)).toEqual({ startsWith: "Chapter 5 ", not: { startsWith: "Chapter 5 (" } });
  });

  it("the line and the file name carry the book and read back", () => {
    const line = chapterLineFor(5, "Security in the Contemporary World", "Contemporary World Politics");
    expect(line).toBe("Chapter 5 (Contemporary World Politics) — Security in the Contemporary World");
    expect(chapterBookOf(line)).toBe("Contemporary World Politics");
    expect(chapterNumberOf(line)).toBe(5);
    expect(chapterNameOf(line)).toBe("Security in the Contemporary World");
    expect(chapterBookOf("Chapter 5 — Rights")).toBeNull();
    expect(chapterLineFor(5, "Rights")).toBe("Chapter 5 — Rights");
    expect(readFileName("ncert-12-civics-leps1-5.json")).toEqual({ board: "ncert", classLevel: 12, subjectCode: "CIVICS", bookCode: "leps1", chapterNumber: 5 });
    expect(readFileName("ncert-8-science-4")).toEqual({ board: "ncert", classLevel: 8, subjectCode: "SCIENCE", bookCode: null, chapterNumber: 4 });
    expect(readFileName("balbharati-11-maths-12.json")).toEqual({ board: "balbharati", classLevel: 11, subjectCode: "MATHS", bookCode: null, chapterNumber: 12 });
    expect(readFileName("college-law-ll-m-a7b47827-u3.json")).toBeNull();
    expect(fileNameFor({ board: "NCERT", classLevel: 8, subjectCode: "SCIENCE", chapterNumber: 4 })).toBe("ncert-8-science-4");
  });

  it("a named book's chapter matches only its book's topic, and a new one's slug carries the book beside the other book's same name", () => {
    const topics = [
      { slug: "geography-12-transport-and-communication", chapter: "Chapter 7 (Fundamentals of Human Geography) — Transport and Communication", name: "Transport and Communication", position: 7, retired: false },
      { slug: "civics-12-rights", chapter: "Chapter 5 — Rights", name: "Rights", position: 5, retired: false },
    ];
    expect(matchTopic(topics, 7, "Transport and Communication", "Fundamentals of Human Geography")?.slug).toBe("geography-12-transport-and-communication");
    expect(matchTopic(topics, 7, "Transport and Communication", "India: People and Economy")).toBeNull();
    expect(matchTopic(topics, 7, "Transport and Communication")).toBeNull();
    expect(matchTopic(topics, 5, "Rights", "Political Theory")).toBeNull();
    expect(bookSlug("India: People and Economy")).toBe("india-people-and-economy");
    expect(bookSlug("Politics in India Since Independence")).toBe("politics-in-india-since");
    expect(slugForNewTopic(topics, "NCERT", "GEOGRAPHY", 12, "Transport and Communication", 7, "India: People and Economy")).toBe("geography-12-transport-and-communication-india-people-and-economy");
    expect(slugForNewTopic(topics, "NCERT", "GEOGRAPHY", 12, "Transport and Communication", 7, "Fundamentals of Human Geography")).toBe("geography-12-transport-and-communication");
    // Without a book the rule is item 6's: a holder of another name gives the number.
    expect(slugForNewTopic([{ slug: "civics-11-equality", name: "Political Theory: An Introduction" }], "NCERT", "CIVICS", 11, "Equality", 3)).toBe("civics-11-equality-3");
  });
});

describe("a book another replaced, and the parts of one book", () => {
  const label = (labels: Record<string, string>) => (d: { id: string }) => labels[d.id] ?? "";

  it("class 8 science plans Curiosity alone while it is in the corpus, as the owner chose; the 2024 Science alone is planned", async () => {
    const docs = [ncertDoc("hecu101", "Curiosity", "hecu1", 1, "8", "Science"), ncertDoc("hesc101", "Science", "hesc1", 1, "8", "Science")];
    const labels = { hecu101: "Chapter 1: — Exploring the Investigative World of Science", hesc101: "Chapter 1: Crop Production and Management" };
    const plan = planNcert(docs, label(labels));
    expect(plan.chapters.map((c) => [c.planNumber, c.doc.id, c.book])).toEqual([[1, "hecu101", null]]);
    expect(plan.superseded.map((s) => [s.code, s.docs.map((d) => d.id)])).toEqual([["hesc1", ["hesc101"]]]);
    expect(NCERT_SUPERSEDED.hesc1!.by).toEqual(["hecu1"]);
    expect(planNcert([docs[1]!], label(labels)).chapters.map((c) => c.doc.id)).toEqual(["hesc101"]);
    // Asked for by its code, the replaced book is drafted on purpose.
    const db = fakeDb(docs, [chunk("hecu101", labels.hecu101, "Science Investigation Questions"), chunk("hesc101", labels.hesc101, "Crop Production Management")]);
    const lines: string[] = [];
    expect((await listChapters(db, { board: "NCERT", grade: 8, subject: "Science" }, (l) => lines.push(l))).map((c) => c.bookCode)).toEqual(["hecu1"]);
    expect(lines.join("\n")).toMatch(/hesc1 "Science" left out/);
    expect((await selectChapter(db, { board: "NCERT", grade: 8, subject: "Science", chapter: 1, book: "hesc1" })).chapterName).toBe("Crop Production and Management");
    expect((await selectChapter(db, { board: "NCERT", grade: 8, subject: "Science", chapter: 1 })).chapterLabel).toBe("Chapter 1 — Exploring the Investigative World of Science");
  });

  it("numbers Part II on after Part I, keeps a part the corpus already numbers on, and says where the book prints it", async () => {
    const maths = [ncertDoc("lemh101", "Mathematics Part-I", "lemh1", 1, "12", "Mathematics"), ncertDoc("lemh106", "Mathematics Part-I", "lemh1", 6, "12", "Mathematics"), ncertDoc("lemh201", "Mathematics Part-II", "lemh2", 1, "12", "Mathematics")];
    const labels = { lemh101: "Chapter 1: Relations and Functions", lemh106: "Chapter 6: Application of Derivatives", lemh201: "Chapter 1: Integrals" };
    const plan = planNcert(maths, label(labels));
    expect(plan.named).toBe(false);
    expect(plan.chapters.map((c) => [c.planNumber, c.number, c.fileNumber, c.doc.id])).toEqual([
      [1, 1, 1, "lemh101"],
      [6, 6, 6, "lemh106"],
      [7, 1, 1, "lemh201"],
    ]);
    const db = fakeDb(maths, [chunk("lemh101", labels.lemh101, "Relations Functions"), chunk("lemh106", labels.lemh106, "Application Derivatives"), chunk("lemh201", labels.lemh201, "Integrals Integration")]);
    const integrals = await selectChapter(db, { board: "NCERT", grade: 12, subject: "Mathematics", chapter: 7 });
    expect(integrals.documentPath).toBe("ncert/12/mathematics/lemh201.pdf");
    expect(integrals.chapterLabel).toBe("Chapter 7 — Integrals");
    expect(integrals.bookPlace).toBe('"Mathematics Part-II", chapter 1');
    expect(fileNameFor(integrals)).toBe("ncert-12-maths-7");
    // Ganita Prakash Part II's files say 1 to 7, its headings 8 to 14 (the owner's serial of 23 October): kept.
    const gp = [ncertDoc("hegp101", "Ganita Prakash Part-I", "hegp1", 1, "8", "Mathematics"), ncertDoc("hegp201", "Ganita Prakash Part-II", "hegp2", 1, "8", "Mathematics"), ncertDoc("hemh101", "Mathematics", "hemh1", 1, "8", "Mathematics")];
    const gpPlan = planNcert(gp, label({ hegp101: "Chapter 1: A Square and a Cube", hegp201: "Chapter 8: Fractions in Disguise", hemh101: "Chapter 1: Rational Numbers" }));
    expect(gpPlan.chapters.map((c) => [c.planNumber, c.doc.id])).toEqual([
      [1, "hegp101"],
      [8, "hegp201"],
    ]);
    expect(gpPlan.superseded.map((s) => s.code)).toEqual(["hemh1"]);
    expect(ncertPartOf("Physics Part-II")).toEqual({ work: "physics", part: 2 });
    expect(ncertPartOf("Chemistry-I")).toEqual({ work: "chemistry", part: 1 });
    expect(ncertPartOf("Ganita Manjari PART-II")).toEqual({ work: "ganita manjari", part: 2 });
    expect(ncertPartOf("Themes in Indian History-III")).toEqual({ work: "themes in indian history", part: 3 });
    expect(ncertPartOf("Ganita Prakash")).toEqual({ work: "ganita prakash", part: 1 });
    expect(ncertPartOf("Contemporary World Politics")).toEqual({ work: "contemporary world politics", part: 1 });
  });
});

describe("a title both boards carry: class 6 mathematics' \"Lines and Angles\"", () => {
  it("a Balbharati chapter matches only Balbharati topics and gets the board's slug; an NCERT chapter never takes a Balbharati topic", () => {
    const topics = [
      { slug: "maths-6-lines-and-angles", chapter: "Chapter 2 — Lines and Angles", name: "Lines and Angles", position: 2, retired: false, board: "NCERT" },
      { slug: "balbharati-maths-6-equations", chapter: "Chapter 9 — Equations", name: "Equations", position: 9, retired: false, board: "BALBHARATI" },
    ];
    // The held batch of 30 October: Balbharati's chapter 2 took the NCERT topic's slug and the loader refused the board clash.
    expect(matchTopic(topics, 2, "Lines and Angles", null, "BALBHARATI")).toBeNull();
    expect(slugForNewTopic(topics, "Balbharati", "MATHS", 6, "Lines and Angles", 2)).toBe("balbharati-maths-6-lines-and-angles");
    expect(matchTopic(topics, 2, "Lines and Angles", null, "NCERT")?.slug).toBe("maths-6-lines-and-angles");
    expect(matchTopic(topics, 9, "Equations", null, "NCERT")).toBeNull();
    expect(matchTopic(topics, 9, "Equations", null, "BALBHARATI")?.slug).toBe("balbharati-maths-6-equations");
    // A Balbharati topic that lost its prefix is never extended by an NCERT chapter of its name.
    const unprefixed = [{ slug: "maths-6-symmetry", name: "Symmetry", board: "BALBHARATI" }];
    expect(slugForNewTopic(unprefixed, "NCERT", "MATHS", 6, "Symmetry", 9)).toBe("maths-6-symmetry-9");
  });
});

describe("the duplicate check is the chapter's board's", () => {
  const stem = "What fraction of the circle is shaded?";
  const bank = [
    { id: "n1", stem, board: "NCERT", subject: "MATHS", classLevel: 6, slug: "maths-6-fractions" },
    { id: "b1", stem: "How many halves make a whole?", board: "BALBHARATI", subject: "MATHS", classLevel: 6, slug: "balbharati-maths-6-fractions" },
  ];
  const db = {
    quizQuestion: {
      findMany: async ({ where }: { where: { topic: { subject: string; classLevel: number; board?: string } } }) =>
        bank.filter((q) => q.subject === where.topic.subject && q.classLevel === where.topic.classLevel && (!where.topic.board || q.board === where.topic.board)).map((q) => ({ id: q.id, stem: q.stem, topic: { slug: q.slug } })),
    },
  } as unknown as PrismaClient;

  it("an NCERT stem does not make a Balbharati chapter saturated, and still counts within NCERT", async () => {
    const balbharati = await bankStems(db, "MATHS", 6, "BALBHARATI");
    expect(balbharati.map((b) => b.id)).toEqual(["b1"]);
    // The drafted item is the NCERT stem itself (vector [1, 0]); only Balbharati's own question ([0, 1]) is compared.
    const vectors: Record<string, number[]> = { [stem]: [1, 0], "How many halves make a whole?": [0, 1] };
    expect(nearDuplicates([[1, 0]], balbharati.map((b) => ({ id: b.id, vector: vectors[b.stem]! })))).toEqual([]);
    const ncert = await bankStems(db, "MATHS", 6, "NCERT");
    expect(nearDuplicates([[1, 0]], ncert.map((b) => ({ id: b.id, vector: vectors[b.stem]! })))).toEqual([{ index: 0, against: "bank:n1", similarity: 1 }]);
    // A college unit passes no board: every board's questions, as before.
    expect((await bankStems(db, "MATHS", 6)).map((b) => b.id)).toEqual(["n1", "b1"]);
  });

  it("the bank check lets the same stem stand in an NCERT and a Balbharati batch, and refuses it twice within one board", () => {
    const batch = (board: string, slug: string, s: string): TopicFile => ({ subject: "MATHS", classLevel: 6, chapter: "Chapter 6 — Fractions", name: "Fractions", slug, source: `generated against ${board}`, licence: "test", board, questions: [{ difficulty: 1, stem: s, choices: ["1/2", "1/3", "1/4", "1/5"], answerIndex: 0, solution: "Half the circle is shaded, which is one half of it.", checkExpr: null }] });
    const v = createVerifier();
    v.verifyTopic("generated/ncert-6-maths-6.json", batch("NCERT", "maths-6-fractions", stem), { generated: true });
    v.verifyTopic("generated/balbharati-6-maths-6.json", batch("BALBHARATI", "balbharati-maths-6-fractions", stem), { generated: true });
    expect(v.report().errors.filter((e) => /duplicate/.test(e))).toEqual([]);
    v.verifyTopic("generated/balbharati-6-maths-11.json", batch("BALBHARATI", "balbharati-maths-6-decimal-fractions", stem), { generated: true });
    expect(v.report().errors.filter((e) => /duplicate/.test(e))).toEqual(["generated/balbharati-6-maths-11.json[0]: duplicate of a question already in generated/balbharati-6-maths-6.json"]);
  });
});

describe("the Balbharati Commerce books", () => {
  it("are left out of the school bank's plan, the Arts and Science books kept", () => {
    const doc = (id: string, title: string, bookId: string) => ({ id, path: `balbharati/11/mathematics/${bookId}.pdf`, title, gradeOrProgramme: "11", extra: { bookId } });
    const choice = chooseBooks([
      doc("c1", "११ वी गणित व सं.शास्त्र(वाणिज्य)भा-१ इंग्रजी", "1103030418"),
      doc("a2", "११ वी गणित कला-विज्ञान भा-२ इंग्रजी", "1103020424"),
      doc("a1", "११ वी गणित कला-विज्ञान भा-१ इंग्रजी", "1103020423"),
      doc("c2", "११ वी गणित व सं.शास्त्र(वाणिज्य)भा-२ इंग्रजी", "1103030419"),
    ]);
    expect(choice.books.map((b) => b.id)).toEqual(["a1", "a2"]);
    expect(choice.otherStream.map((o) => o.doc.id)).toEqual(["c1", "c2"]);
    expect(choice.otherStream[0]!.reason).toMatch(/Commerce stream/);
  });
});
