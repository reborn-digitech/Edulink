import { afterAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import type { PageContent } from "../scripts/corpus-pdf";
import {
  chooseTitle,
  contentsCandidate,
  decodePrivateUse,
  implausible,
  isBareHeading,
  isBareName,
  pageCandidates,
  headCandidates,
  restoreDropCaps,
  smallCapsGarble,
  titleCase,
  type Candidate,
  type Vocabulary,
} from "../scripts/corpus-titles";
import { chapterNameOf, slugForNewTopic } from "../scripts/quiz-gen/checks";
import { adoptsTopic, batchNameRefusal, chapterLineNumber, cleanTranslatedName, isBareChapterName, loadGeneratedBatches, type QueueBatch } from "../scripts/quiz-queue-load";
// owner-batch-item6 (30 Oct 2026): a chapter's name is its book's title, never a fragment and never the model's.
import { titleFragment } from "../scripts/corpus-titles";
import { chapterTitleOf } from "../scripts/quiz-gen/select";
import { slugWords, titleVerdict, titlesAgree, type CorpusChapter } from "../scripts/topic-titles";

/**
 * Every chapter carries its own title, never a bare "Chapter N" (chapter-titles, 19 October 2026).
 *
 * Proved here: the reading of a chapter's title from its pages (scripts/corpus-titles.ts) on three first pages saved
 * as fixtures (tests/fixtures/chapter-titles: the page as pdfjs reads it, its body text replaced by filler of the same
 * length, the running heads, the prelims' contents entry and the chapter's counts of the title's words) — a title set
 * in small capitals with its drop capitals lost (class 8 Science, 2024), a title set smaller than the chunker's floor
 * (Ganita Manjari, 2026), and one drawn in a symbol font whose letters sit in the private-use block (class 8
 * Mathematics, 2008); the plausibility check; the generator's bare name; and the loader's adoption of a "Chapter N"
 * topic, and its refusal of a topic with a title of its own. The loader's rows are ZZ rows made here and removed.
 */

type Fixture = { chapter: number; book: string; subject: string; pages: PageContent[]; runningHeads: string[]; contents: PageContent | null; vocab: Record<string, number> };
const fixture = (name: string): Fixture => JSON.parse(readFileSync(resolve(process.cwd(), "tests/fixtures/chapter-titles", `${name}.json`), "utf8")) as Fixture;
const vocabOf = (v: Record<string, number>): Vocabulary => new Map(Object.entries(v));

function titleFrom(f: Fixture): ReturnType<typeof chooseTitle> {
  const candidates: Candidate[] = [...pageCandidates(f.pages, f.chapter), ...headCandidates(f.runningHeads.map((text) => ({ text, coverage: 0.5, alone: 1 })), f.book)];
  const c = f.contents ? contentsCandidate([f.contents], f.chapter) : null;
  if (c) candidates.push(c);
  return chooseTitle(candidates, { runningHeads: f.runningHeads, vocab: vocabOf(f.vocab), bookTitle: f.book, subject: f.subject });
}

describe("the title read from a chapter's first page", () => {
  it("small capitals with their drop capitals lost: mended from the chapter's own words, the contents agreeing", () => {
    const f = fixture("hesc101");
    const choice = titleFrom(f);
    expect(choice.title).toBe("Crop Production and Management");
    expect(choice.agreed).toContain("title-page");
    expect(choice.repaired).toEqual(expect.arrayContaining(["ROP", "RODUCTION", "ANAGEMENT"]));
  });
  it("a title set at 16 over an 11 body, under the chunker's floor: the title page and its running head", () => {
    const f = fixture("iemh101");
    expect(pageCandidates(f.pages, 1)).toEqual([{ text: "Orienting Yourself: The Use of Coordinates", source: "title-page" }]);
    expect(titleFrom(f).title).toBe("Orienting Yourself: The Use of Coordinates");
  });
  it("a title in a symbol font's private-use letters: read back, and the contents' entry for chapter 10", () => {
    const f = fixture("hemh110");
    expect(decodePrivateUse("")).toBe("Exponents");
    expect(contentsCandidate([f.contents!], 10)).toEqual({ text: "Exponents and Powers", source: "contents" });
    expect(contentsCandidate([f.contents!], 11)).toBeNull();
    expect(titleFrom(f).title).toBe("Exponents and Powers");
  });
});

describe("the plausibility check and the mending, pure", () => {
  const vocab = vocabOf({ crop: 40, drop: 2, expressions: 12, mensuration: 3, introduction: 4, graphs: 9, most: 10, post: 5, age: 6 });
  it("knows a bare heading and a bare name", () => {
    for (const h of ["Chapter 4", "Unit 3", "7", "12.", "Chapter 10:"]) expect(isBareHeading(h), h).toBe(true);
    for (const h of ["Chapter 4: Friction", "Friction", "1.1 Introduction"]) expect(isBareHeading(h), h).toBe(false);
    expect(isBareName("Chapter 10")).toBe(true);
    expect(isBareName("Exponents and Powers")).toBe(false);
  });
  it("refuses the garbled titles the bank carried, and a label, a sentence, the book's own title", () => {
    const ctx = { vocab, bookTitle: "Mathematics" };
    expect(implausible("Xpressions and", ctx)).toMatch(/short of its first letter|ends in "and"/);
    expect(implausible("Ensuration", ctx)).toMatch(/short of its first letter/);
    expect(implausible("Ntroduction to", ctx)).toMatch(/short of its first letter|ends in "to"/);
    expect(implausible("Chapter 10", ctx)).toBe("a label");
    expect(implausible("1.1 Introduction", ctx)).toBe("a section heading");
    expect(implausible("Mathematics", ctx)).toBe("the book's own title");
    expect(implausible("This lesson is about graphs and how we read them.", ctx)).toMatch(/sentence/);
    // "hare" is a word the dictionary knows, so it is the letter printed apart that gives this one away.
    expect(implausible("Fair S hare", { vocab: vocabOf({ share: 3, fair: 2 }), bookTitle: "Maths Mela", dictionary: new Set(["fair", "hare", "share"]) })).toMatch(/printed apart/);
    expect(implausible("Introduction to Graphs", ctx)).toBeNull();
  });
  it("puts back a drop capital only when one letter makes a word the chapter clearly uses", () => {
    expect(restoreDropCaps("ROP", vocab).text).toBe("CROP");
    expect(restoreDropCaps("Xpressions", vocab).text).toBe("Expressions");
    expect(restoreDropCaps("D ETERMINATION", vocabOf({ determination: 3 })).text).toBe("DETERMINATION");
    expect(restoreDropCaps("C l ass Party", vocabOf({ class: 9, party: 2 })).text).toBe("Class Party");
    // "most" and "post" too near to choose; a dictionary word in a mixed-case title is left as printed.
    expect(restoreDropCaps("OST", vocab).text).toBe("OST");
    expect(restoreDropCaps("The Ever-Evolving World", vocabOf({ never: 5 }), new Set(["ever"])).text).toBe("The Ever-Evolving World");
  });
  it("puts a title in capitals or in small capitals read as mixed case into title case", () => {
    expect(titleCase("CROP PRODUCTION AND MANAGEMENT")).toBe("Crop Production and Management");
    expect(titleCase("Liberalisation: an appraisal")).toBe("Liberalisation: an appraisal");
    expect(smallCapsGarble("SportS and WeLLneSS")).toBe(true);
    expect(titleCase("sports and wellness", true)).toBe("Sports and Wellness");
    expect(smallCapsGarble("Two Variables, One Line")).toBe(false);
  });
});

describe("the generator's name for a chapter", () => {
  it("is empty for a bare heading, so selectChapter's \"Chapter N\" is only the last resort", () => {
    for (const h of ["Chapter 4", "Unit 3", "Lesson 2", "7.", "Chapter 10 — Chapter 10"]) expect(chapterNameOf(h), h).toBe("");
    expect(chapterNameOf("Chapter 1: Orienting Yourself: The Use of Coordinates")).toBe("Orienting Yourself: The Use of Coordinates");
    expect(chapterNameOf("3. Force and Pressure")).toBe("Force and Pressure");
  });
});

describe("the loader takes a \"Chapter N\" topic before it makes a new one", () => {
  const base = { slug: "x", name: "Chapter 9", chapter: "Chapter 9 — Chapter 9", board: "NCERT", subject: "MATHS", classLevel: 9, audience: "SCHOOL", retiredAt: null };
  const batch = { subject: "MATHS", classLevel: 9, chapter: "Chapter 9 — Propositions and their Converses", name: "Propositions and their Converses", position: 9 };

  it("the rule, pure: a bare name or the chapter-N slug with the batch's own name; never a titled topic, another number, board or a retired one", () => {
    expect(isBareChapterName("Chapter 9")).toBe(true);
    expect(chapterLineNumber("Chapter 9 — X")).toBe(9);
    expect(chapterLineNumber("Chapter 9: X")).toBe(9);
    expect(chapterLineNumber("Chapter 90 — X")).toBe(90);
    expect(chapterLineNumber("Chapter 9")).toBe(9);
    expect(adoptsTopic(base, batch, "NCERT")).toBe(true);
    expect(adoptsTopic({ ...base, slug: "maths-9-chapter-9", name: "Propositions and their Converses", chapter: batch.chapter }, batch, "NCERT")).toBe(true);
    expect(adoptsTopic({ ...base, slug: "maths-9-something", name: "Number Systems", chapter: "Chapter 9 — Number Systems" }, batch, "NCERT")).toBe(false);
    expect(adoptsTopic({ ...base, slug: "maths-9-chapter-9", name: "Number Systems", chapter: "Chapter 9 — Number Systems" }, batch, "NCERT")).toBe(false);
    expect(adoptsTopic({ ...base, chapter: "Chapter 19 — Chapter 19", name: "Chapter 19" }, batch, "NCERT")).toBe(false);
    expect(adoptsTopic(base, batch, "BALBHARATI")).toBe(false);
    expect(adoptsTopic({ ...base, retiredAt: new Date() }, batch, "NCERT")).toBe(false);
    expect(adoptsTopic({ ...base, audience: "COLLEGE" }, batch, "NCERT")).toBe(false);
  });

  const db = new PrismaClient();
  const P = `zz-ct-${Date.now()}`;
  afterAll(async () => {
    const mine = await db.quizTopic.findMany({ where: { slug: { startsWith: P } }, select: { id: true } });
    await db.auditLog.deleteMany({ where: { action: "operator.quizTopic.rename", targetId: { in: mine.map((t) => t.id) } } });
    await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
    await db.$disconnect();
  });
  // Chapter numbers 47 and 48 of class 8 Science: no book has them, so no real topic is in reach of the rule.
  const make = (n: number, name: string, slug: string) =>
    db.quizTopic.create({ data: { subject: "SCIENCE", classLevel: 8, chapter: `Chapter ${n} — ${name}`, name, slug, board: "NCERT", position: n }, select: { id: true } });
  const zzBatch = (n: number, name: string, slug: string): QueueBatch => ({
    subject: "SCIENCE",
    classLevel: 8,
    chapter: `Chapter ${n} — ${name}`,
    name,
    slug,
    position: n,
    source: "generated against ZZ",
    licence: "test",
    board: "NCERT",
    questions: [{ difficulty: 1, stem: `ZZ CT ${slug}: what is 2+2?`, choices: ["4", "5", "3", "22"], answerIndex: 0, solution: "ZZ: two and two make four." }],
  });

  it("a batch with a title loads into the \"Chapter 47\" topic and renames it; the slug stays, and the rename is audited", async () => {
    const bare = await make(47, "Chapter 47", `${P}-bare`);
    const r = await loadGeneratedBatches(db, [{ file: "zz-ct.json", batch: zzBatch(47, "ZZ Titles Real", `${P}-titled`) }]);
    expect(r).toMatchObject({ created: 1, topicsMade: 0, topicsAdopted: 1 });
    const topic = await db.quizTopic.findUniqueOrThrow({ where: { id: bare.id }, select: { slug: true, name: true, chapter: true, questions: { select: { stem: true } } } });
    expect(topic).toMatchObject({ slug: `${P}-bare`, name: "ZZ Titles Real", chapter: "Chapter 47 — ZZ Titles Real" });
    expect(topic.questions).toHaveLength(1);
    expect(await db.quizTopic.count({ where: { slug: `${P}-titled` } })).toBe(0);
    const rows = await db.auditLog.findMany({ where: { action: "operator.quizTopic.rename", targetId: bare.id }, select: { schoolId: true, actorUserId: true, targetType: true, meta: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ schoolId: null, actorUserId: null, targetType: "QuizTopic" });
    expect(JSON.parse(rows[0]!.meta ?? "{}")).toMatchObject({ via: "scripts/quiz-queue-load.ts", from: { name: "Chapter 47" }, to: { name: "ZZ Titles Real" } });
  });

  it("a topic with a title of its own is never taken: the batch for chapter 48 makes its own", async () => {
    const other = await make(48, "ZZ CT The Other Book", `${P}-other`);
    const r = await loadGeneratedBatches(db, [{ file: "zz-ct.json", batch: zzBatch(48, "ZZ CT A New Title", `${P}-new`) }]);
    expect(r).toMatchObject({ created: 1, topicsMade: 1, topicsAdopted: 0 });
    expect(await db.quizTopic.findUniqueOrThrow({ where: { id: other.id }, select: { name: true } })).toEqual({ name: "ZZ CT The Other Book" });
    expect(await db.quizQuestion.count({ where: { topicId: other.id } })).toBe(0);
    expect(await db.quizTopic.count({ where: { slug: `${P}-new` } })).toBe(1);
  });
});

describe("owner-batch-item6: a chapter's name is its book's title", () => {
  const ctxOf = (words: Record<string, number>, bookTitle = "Biology") => ({ vocab: vocabOf(words), bookTitle, dictionary: new Set(["ever", "air", "europe", "the", "living", "world"]) });
  it("refuses the fragments the bank was named with, judged by the chapter's own words", () => {
    expect(titleFragment("NIT", ctxOf({ living: 9 }))).toBe("a label");
    expect(titleFragment("Nit of", ctxOf({ cell: 9 }))).toBe("a label");
    expect(titleFragment("Unit Objectives Solutions", ctxOf({ solutions: 9 }))).toBe("a label");
    expect(titleFragment("In this chapter…", ctxOf({ nation: 9 }))).toMatch(/word Chapter inside it/);
    expect(titleFragment("Roducts and Their", ctxOf({ products: 12, roducts: 1 }))).toMatch(/short of its first letter \("products"\)/);
    expect(titleFragment("REAS ELATED TO IRCLES", ctxOf({ circles: 2, ircles: 1, areas: 5 }))).toMatch(/short of its first letter/);
    expect(titleFragment("Time G oes O n", ctxOf({ goes: 4, time: 9 }))).toMatch(/letter printed apart|short of its first letter/);
    expect(titleFragment("Methods of Separationin Everyday Life", ctxOf({ separation: 8, in: 50, methods: 3 }))).toMatch(/run together/);
    expect(titleFragment("22. On the Move Again", ctxOf({ move: 3 }))).toBe("a number in front");
    expect(titleFragment("Chapter 4", ctxOf({}))).toBe("only the chapter's label");
    expect(titleFragment("Xpressions and", ctxOf({ expressions: 9 }))).toMatch(/short of its first letter|cut short/);
  });
  it("lets real names stand: a word the dictionary knows is never short, and 'from', 'on', a short word or an unknown word are no reason", () => {
    for (const name of ["Where to Look From", "Time Goes On", "Hu Tu Tu, Hu Tu Tu", "Air", "Index Numbers", "The Ever-Evolving World of Science", "Pochampalli", "Be My Multiple, I'll be Your Factor", "Photosynthesis in Higher Plants"]) {
      expect(titleFragment(name, ctxOf({ never: 5, hair: 3, pochampalli: 4, photosynthesis: 20 })), name).toBeNull();
    }
    expect(titleFragment("The Rise of Nationalism in Europe", ctxOf({ neurope: 0, nationalism: 9 }))).toBeNull();
  });
  it("reads a chapter's title from its label: the number printed again dropped, a lower-case title put in title case", () => {
    expect(chapterTitleOf("Chapter 9: 9. Up You Go!", 9)).toBe("Up You Go!");
    expect(chapterTitleOf("Chapter 1: early societies", 1)).toBe("Early Societies");
    expect(chapterTitleOf("Chapter 2: Lines and angLes", 2)).toBe("Lines and angles");
    expect(chapterTitleOf("Chapter 4", 4)).toBe("");
    expect(chapterTitleOf("Chapter 12: 12 Angry Men", 12)).toBe("12 Angry Men");
  });
  it("the loader judges a new topic's name by the batch's own items, and cleans the model's Hindi and Marathi names", () => {
    const items = [{ difficulty: 1, stem: "Which excretory products leave by the kidneys?", choices: ["urea", "glucose", "protein", "fat"], answerIndex: 0, solution: "Urea is among the excretory products." }];
    expect(batchNameRefusal({ name: "Roducts and Their", questions: items })).toMatch(/short of its first letter|cut short/);
    expect(batchNameRefusal({ name: "NIT", questions: items })).toBe("a label");
    expect(batchNameRefusal({ name: "Excretory Products and their Elimination", questions: items })).toBeNull();
    expect(batchNameRefusal({ name: "Biology", book: "Biology", questions: items })).toBe("the book's own title");
    expect(cleanTranslatedName("अध्याय 1: राष्ट्र निर्माण की चुनौतियाँ।")).toBe("राष्ट्र निर्माण की चुनौतियाँ");
    expect(cleanTranslatedName("प्रकरण ४ – जीवसृष्टी.")).toBe("जीवसृष्टी");
    expect(cleanTranslatedName("सजीव जगत")).toBe("सजीव जगत");
    expect(cleanTranslatedName("रेसिंग सेकंड अध्याय 12।")).toBe("रेसिंग सेकंड");
    expect(cleanTranslatedName("अध्याय 3")).toBe("");
  });
  it("a new topic never takes a slug a chapter of another name holds; the same name is the same chapter renumbered", () => {
    const topics = [{ slug: "civics-11-equality", name: "Political Theory: An Introduction" }, { slug: "maths-12-integrals", name: "Integrals" }];
    expect(slugForNewTopic(topics, "NCERT", "CIVICS", 11, "Equality", 3)).toBe("civics-11-equality-3");
    expect(slugForNewTopic([...topics, { slug: "civics-11-equality-3", name: "x" }], "NCERT", "CIVICS", 11, "Equality", 3)).toBe("civics-11-equality-3-2");
    expect(slugForNewTopic(topics, "NCERT", "MATHS", 12, "Integrals", 1)).toBe("maths-12-integrals");
    expect(slugForNewTopic(topics, "NCERT", "CIVICS", 12, "Regional Aspirations", 7)).toBe("civics-12-regional-aspirations");
  });
  it("compares a topic's name with its corpus chapter's title only where the chapter agrees with it, and renames only where its line or slug spells the title", () => {
    const ch = (number: number, title: string, book = "Biology", refusal: string | null = null): CorpusChapter => ({ board: "NCERT", grade: 11, subjectCode: "BIOLOGY", number, title, refusal, book, bookCode: "kebo1", path: `ncert/11/biology/kebo1${number}.pdf`, vocab: vocabOf({ photosynthesis: 9, plants: 9 }) });
    const corpus = [ch(11, "Photosynthesis in Higher Plants"), ch(12, "Respiration in Plants"), ch(1, "NIT", "Biology", "a label"), ch(2, "Electric Charges")];
    const topic = (slug: string, chapter: string, name: string) => ({ id: slug, slug, board: "NCERT", classLevel: 11, subject: "BIOLOGY", chapter, name });
    expect(slugWords("biology-11-photosynthesis-in-higher-plants")).toBe("photosynthesis in higher plants");
    expect(titlesAgree("Electric Charges", "Electric Charges and Fields")).toBe(true);
    expect(titleVerdict(topic("biology-11-photosynthesis-in-higher-plants", "Chapter 11 — Photosynthesis in Higher Plants", "How a Leaf Spends Light"), corpus)).toMatchObject({ kind: "DIFFERS", title: "Photosynthesis in Higher Plants" });
    expect(titleVerdict(topic("biology-11-respiration-in-plants", "Chapter 12 — Respiration in Plants", "Respiration in Plants"), corpus)).toMatchObject({ kind: "OK" });
    expect(titleVerdict(topic("biology-11-nit", "Chapter 1 — NIT", "NIT"), corpus)).toMatchObject({ kind: "FRAGMENT", reason: "a label", title: null });
    // A corpus title cut short ("Electric Charges") agrees, but neither the line nor the slug spells it: listed, never renamed.
    expect(titleVerdict(topic("biology-11-electric-charges-and-fields", "Chapter 2 — Electric Charges and Fields", "Electric Charges and Fields"), corpus)).toMatchObject({ kind: "CLOSE" });
    expect(titleVerdict(topic("biology-11-x", "Chapter 30 — X", "X"), corpus)).toMatchObject({ kind: "UNKNOWN" });
  });

  const db = new PrismaClient();
  const P = `zz-ct6-${Date.now()}`;
  afterAll(async () => {
    await db.quizTopic.deleteMany({ where: { slug: { startsWith: P } } });
    await db.$disconnect();
  });
  const zz = (n: number, name: string, slug: string): QueueBatch => ({
    subject: "SCIENCE",
    classLevel: 8,
    chapter: `Chapter ${n} — ${name}`,
    name,
    slug,
    position: n,
    source: "generated against ZZ",
    licence: "test",
    board: "NCERT",
    translations: { hi: { name: "अध्याय 49: ZZ नाम।", summary: "" } },
    questions: [{ difficulty: 1, stem: `ZZ CT6 ${slug}: which products leave the body?`, choices: ["urea", "air", "sand", "salt"], answerIndex: 0, solution: "ZZ: urea is among the products." }],
  });
  it("the loader refuses a fragment name before anything is written, never renames an existing topic, and names a new one's translation as a name", async () => {
    await expect(loadGeneratedBatches(db, [{ file: "zz-ct6.json", batch: zz(49, "Roducts and Their", `${P}-frag`) }])).rejects.toThrow(/is "roducts" is short of its first letter|not a title/);
    expect(await db.quizTopic.count({ where: { slug: { startsWith: P } } })).toBe(0);
    const made = await loadGeneratedBatches(db, [{ file: "zz-ct6.json", batch: zz(49, "ZZ Products of the Body", `${P}-titled`) }]);
    expect(made).toMatchObject({ created: 1, topicsMade: 1 });
    const t = await db.quizTopic.findUniqueOrThrow({ where: { slug: `${P}-titled` }, select: { id: true, name: true, translations: { select: { language: true, name: true } } } });
    expect(t.name).toBe("ZZ Products of the Body");
    expect(t.translations).toEqual([{ language: "hi", name: "ZZ नाम" }]);
    // A later batch for the same slug carrying another name (even a fragment) leaves the topic's name alone.
    const again = await loadGeneratedBatches(db, [{ file: "zz-ct6.json", batch: { ...zz(49, "NIT", `${P}-titled`), questions: [{ ...zz(49, "x", "y").questions[0]!, stem: `ZZ CT6 ${P}: a second question?` }] } }]);
    expect(again).toMatchObject({ created: 1, topicsMade: 0 });
    expect(await db.quizTopic.findUniqueOrThrow({ where: { id: t.id }, select: { name: true } })).toEqual({ name: "ZZ Products of the Body" });
  });
});
