/**
 * The bank desk by class and subject (src/lib/bank-desk.ts, the doors /api/v1/appadmin/quiz-review/matrix, /chapters
 * and /chapters/{slug}; the owner's ask of 20 October 2026), and the case rule for a chapter's title
 * (src/lib/chapter-title-case.ts).
 *
 * Proved here: the case rule lowers a lone capital inside a word and keeps known forms, abbreviations and words set in
 * capitals; the matrix counts a book's chapter once across two topics, sums the served questions, counts the chapters
 * at the target and leaves a cell with no chapter empty, with a college row per stream; the chapters are grouped by
 * class, subject and board in book order (number, then position) with the Generated / Authored / Mixed chip and the
 * name under the case rule; a chapter's page reads every stem, option and solution in English, Hindi or Marathi, says
 * MISSING, STALE and BAD_TRANSLATION where it should, and pages by fifty; the doors answer the content team in their
 * contracts' shapes, a no-such chapter 404 and a signed-out caller 401. Every row is a ZZ row made here (a fixture
 * reviewer, zz- chapters in a cell no real chapter sits in: Balbharati class 3 physics) and removed after.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { quizBankChapterSchema, quizBankChaptersSchema, quizBankMatrixSchema, type QuizBankMatrix } from "@edulink/contracts";
import { createSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { fixTitleCase, fixWordCase } from "@/lib/chapter-title-case";
import { bankChapter, bankChapters, bankMatrix, bankTarget, buildMatrix, chapterNumberOfLine, groupChapters, makerOf, wordsIn, type ChapterCounts } from "@/lib/bank-desk";
import { GET as matrixGet } from "@/app/api/v1/appadmin/quiz-review/matrix/route";
import { GET as chaptersGet } from "@/app/api/v1/appadmin/quiz-review/chapters/route";
import { GET as chapterGet } from "@/app/api/v1/appadmin/quiz-review/chapters/[slug]/route";
import { ENDPOINTS } from "@/lib/api-catalog";

vi.setConfig({ testTimeout: 120_000, hookTimeout: 120_000 });

const db = new PrismaClient();
const STAMP = Date.now();
const P = "/api/v1/appadmin/quiz-review";
const slug = (s: string) => `zz-bd-${STAMP}-${s}`;
const ids = { curator: "" };
const topic = { light: "", again: "", lines: "", extra: "" };
const q = { hiOnly: "", none: "", down: "" };
let target = 100;

const get = (path: string) => new Request(`http://localhost${path}`);
const curator = (): ActiveContext =>
  ({
    sessionId: "test",
    membershipId: null,
    schoolId: null,
    role: null,
    user: { id: ids.curator, name: "ZZ BD", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: true },
  }) as ActiveContext;

async function question(topicId: string, n: number, data: { generated?: boolean; difficulty?: number; takenDown?: string; held?: boolean; stem?: string } = {}) {
  const made: string[] = [];
  for (let i = 0; i < n; i++) {
    const row = await db.quizQuestion.create({
      data: {
        topicId,
        difficulty: data.difficulty ?? 1,
        stem: `${data.stem ?? "ZZ BD question"} ${STAMP} ${i}`,
        choices: JSON.stringify(["Ray", "Wave", "Lens", "Prism"]),
        answerIndex: 0,
        solution: "ZZ: light travels in a straight line.",
        source: "test",
        licence: "test",
        generated: data.generated ?? false,
        generatedBoard: data.generated ? "BALBHARATI" : null,
        generation: data.generated ? JSON.stringify({ generatedAt: "2026-10-19T10:00:00.000Z", translations: { hi: { imageAlt: null, critique: null, flag: null } } }) : null,
        needsFigure: data.held === true,
        ...(data.takenDown ? { takenDownAt: new Date(), takenDownReason: data.takenDown } : {}),
      },
      select: { id: true },
    });
    made.push(row.id);
  }
  return made;
}

beforeAll(async () => {
  ids.curator = (await db.user.create({ data: { name: "ZZ BD Curator", email: `zz-bd-curator-${STAMP}@test.invalid`, isTestFixture: true, isAppAdmin: true }, select: { id: true } })).id;
  target = (await bankTarget()).target;
  const make = (s: string, chapter: string, name: string, position: number) =>
    db.quizTopic.create({ data: { slug: slug(s), subject: "PHYSICS", classLevel: 3, board: "BALBHARATI", chapter, name, position }, select: { id: true } }).then((t) => t.id);
  topic.light = await make("light", "Chapter 1 — ZZ Light", "ZZ Light", 2);
  topic.again = await make("again", "Chapter 1 — ZZ Light Again", "ZZ Light Again", 1);
  topic.lines = await make("lines", "Chapter 2 — ZZ lines and angLes", "ZZ lines and angLes", 0);
  topic.extra = await make("extra", "ZZ Extra", "ZZ Extra", 5);
  // Chapter 1, two topics: 3 authored + 1 generated in one (Mixed), 2 generated served + 1 down + 1 held in the other.
  await question(topic.light, 2, { difficulty: 1 });
  await question(topic.light, 1, { difficulty: 2 });
  await question(topic.light, 1, { generated: true, difficulty: 2 });
  const again = await question(topic.again, 2, { generated: true, difficulty: 3, stem: "ZZ BD again" });
  q.hiOnly = again[0]!;
  q.none = again[1]!;
  q.down = (await question(topic.again, 1, { generated: true, difficulty: 3, takenDown: "BAD_TRANSLATION" }))[0]!;
  await question(topic.again, 1, { generated: true, difficulty: 4, held: true });
  // Chapter 2: exactly the target, served.
  await question(topic.lines, target, { generated: true, difficulty: 1, stem: "ZZ BD lines" });
  // The Hindi of one served item and of the taken-down one; the Marathi of none but one, written before an edit.
  await db.quizQuestionTranslation.create({ data: { questionId: q.hiOnly, language: "hi", stem: "ZZ BD: प्रकाश सीधी रेखा में चलता है?", choices: JSON.stringify(["किरण", "तरंग", "लेंस", "प्रिज़्म"]), solution: "ZZ: प्रकाश सीधी रेखा में चलता है।" } });
  await db.quizQuestionTranslation.create({ data: { questionId: q.down, language: "hi", stem: "ZZ BD: गलत अनुवाद", choices: JSON.stringify(["क", "ख", "ग", "घ"]), solution: "ZZ: गलत।" } });
  await db.quizQuestionTranslation.create({ data: { questionId: q.hiOnly, language: "mr", stem: "ZZ BD: प्रकाश सरळ रेषेत जातो का?", choices: JSON.stringify(["किरण", "लहर", "भिंग", "लोलक"]), solution: "ZZ: प्रकाश सरळ रेषेत जातो." } });
  await db.quizQuestion.update({ where: { id: q.hiOnly }, data: { editedAfterSolvingAt: new Date(Date.now() + 60_000) } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: ids.curator } });
  // Questions and translations cascade with the topics.
  await db.quizTopic.deleteMany({ where: { slug: { startsWith: `zz-bd-${STAMP}-` } } });
  await db.user.deleteMany({ where: { id: ids.curator } });
  await db.$disconnect();
});

describe("the case rule for a chapter's title", () => {
  it("lowers a lone capital inside a word and keeps the first letter as printed", () => {
    expect(fixTitleCase("Lines and angLes")).toBe("Lines and angles");
    expect(fixTitleCase("Chapter 2 — Lines and angLes")).toBe("Chapter 2 — Lines and angles");
    expect(fixWordCase("AngLes")).toBe("Angles");
    expect(fixTitleCase("Living Creatures: Exploring theirCharacteristics")).toBe("Living Creatures: Exploring their Characteristics");
  });

  it("keeps known forms, short words, words in capitals, words with two inner capitals, hyphens and Devanagari", () => {
    for (const kept of ["pH", "DNA", "SI", "kWh", "NumPy", "YouTube", "MARKETING", "mA", "EqUilibriUm", "Self-Reliance", "O'Brien", "The Earth in Our Solar System", "रेखा और कोण"]) expect(fixTitleCase(kept), kept).toBe(kept);
    expect(fixTitleCase("The pH of Soil")).toBe("The pH of Soil");
  });
});

describe("the matrix and the grouping, pure", () => {
  const topics = [
    { id: "a", board: "NCERT", grade: 6, subject: "MATHS", chapter: "Chapter 1 — Knowing Our Numbers", audience: "SCHOOL", streams: [] },
    { id: "b", board: "NCERT", grade: 6, subject: "MATHS", chapter: "Chapter 1 — Patterns in Mathematics", audience: "SCHOOL", streams: [] },
    { id: "c", board: "NCERT", grade: 6, subject: "MATHS", chapter: "Chapter 2 — Lines and angLes", audience: "SCHOOL", streams: [] },
    { id: "d", board: "BALBHARATI", grade: 6, subject: "MATHS", chapter: "Chapter 1 — Sets", audience: "SCHOOL", streams: [] },
    { id: "e", board: "NCERT", grade: 6, subject: "ENGLISH", chapter: "Chapter 1 — A Story", audience: "SCHOOL", streams: [] },
    { id: "f", board: null, grade: 13, subject: "LAW", chapter: "Unit 1", audience: "COLLEGE", streams: ["LAW"] },
    { id: "g", board: null, grade: 13, subject: "APTITUDE", chapter: "Percentages", audience: "COLLEGE", streams: [] },
  ];
  const served = new Map([["a", 60], ["b", 50], ["c", 20], ["d", 100], ["e", 9], ["f", 7], ["g", 3]]);

  it("counts a book's chapter once, sums its topics, counts the chapters at the target and leaves empty cells empty", () => {
    const m: QuizBankMatrix = buildMatrix(topics, served, 100);
    expect(m.subjects[0]).toBe("MATHS");
    expect(m.rows.map((r) => r.grade)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const six = m.rows.find((r) => r.grade === 6)!;
    // NCERT 1 (60 + 50 = 110, at target), NCERT 2 (20), Balbharati 1 (100, at target): three chapters, two at 100.
    expect(six.cells.find((c) => c.subject === "MATHS")).toEqual({ subject: "MATHS", served: 230, chapters: 3, atTarget: 2 });
    expect(six.cells.find((c) => c.subject === "SCIENCE")).toEqual({ subject: "SCIENCE", served: 0, chapters: 0, atTarget: 0 });
    // English has no column: not in the matrix.
    expect(six.served).toBe(230);
    expect(m.college.subjects).toEqual(["APTITUDE", "LAW"]);
    expect(m.college.rows.map((r) => r.stream)).toEqual(["LAW", null]);
    expect(m.college.rows[0]!.cells.find((c) => c.subject === "LAW")).toEqual({ subject: "LAW", served: 7, chapters: 1, atTarget: 0 });
    expect(buildMatrix(topics, served, 50).rows.find((r) => r.grade === 6)!.cells[0]!.atTarget).toBe(2);
    expect(chapterNumberOfLine("Chapter 12 — Ratio")).toBe(12);
    expect(chapterNumberOfLine("ZZ Extra")).toBeNull();
  });

  it("groups by class, subject and board in book order with the maker's chip and the case rule", () => {
    const t = (id: string, grade: number, subject: string, board: string | null, chapter: string, position: number) => ({ id, slug: id, board, grade, subject, chapter, name: chapter.replace(/^Chapter \d+ — /, ""), position });
    const rows = [
      t("s1", 6, "SCIENCE", "NCERT", "Chapter 1 — Food", 0),
      t("m3", 6, "MATHS", "NCERT", "Chapter 3 — Number Play", 0),
      t("m1b", 6, "MATHS", "NCERT", "Chapter 1 — Patterns", 1),
      t("m1a", 6, "MATHS", "NCERT", "Chapter 1 — Knowing Our Numbers", 0),
      t("m2", 6, "MATHS", "NCERT", "Chapter 2 — Lines and angLes", 9),
      t("bb", 6, "MATHS", "BALBHARATI", "Chapter 1 — Sets", 0),
      t("x", 6, "MATHS", "NCERT", "Extra practice", 0),
      t("c5", 5, "EVS", "NCERT", "Chapter 1 — Super Senses", 0),
    ];
    const counts = new Map<string, ChapterCounts>([
      ["m1a", { levels: [5, 0, 0, 0, 0, 0], served: 5, down: 0, held: 0, generated: 0, authored: 5 }],
      ["m1b", { levels: [0, 3, 0, 0, 0, 0], served: 3, down: 1, held: 0, generated: 3, authored: 0 }],
      ["m2", { levels: [1, 0, 0, 0, 0, 1], served: 2, down: 0, held: 0, generated: 1, authored: 1 }],
    ]);
    const g = groupChapters(rows, counts, new Map([["x", { generated: 2, authored: 0 }]]), 100);
    expect(g.groups.map((x) => `${x.grade}|${x.subject}|${x.board}`)).toEqual(["5|EVS|NCERT", "6|MATHS|NCERT", "6|MATHS|BALBHARATI", "6|SCIENCE|NCERT"]);
    const maths = g.groups[1]!;
    expect(maths.chapters.map((c) => c.topicId)).toEqual(["m1a", "m1b", "m2", "m3", "x"]);
    expect(maths.chapters.map((c) => c.maker)).toEqual(["AUTHORED", "GENERATED", "MIXED", null, "GENERATED"]);
    expect(maths.chapters[2]!.name).toBe("Lines and angles");
    expect(maths.chapters[2]!.chapter).toBe("Chapter 2 — Lines and angles");
    expect(maths.served).toBe(10);
    expect(makerOf({ generated: 0, authored: 0 }, { generated: 0, authored: 0 })).toBeNull();
  });
});

describe("a chapter's words in three languages, pure", () => {
  const english = { stem: "Does light travel straight?", choices: ["Yes", "No"], solution: "Yes, it does.", imageKey: "en-fig", imageAlt: "A ray", takenDownReason: null, editedAfterSolvingAt: null };
  const hindi = { stem: "क्या प्रकाश सीधा चलता है?", choices: JSON.stringify(["हाँ", "नहीं"]), solution: "हाँ।", imageKey: "hi-fig", imageAlt: null, updatedAt: new Date("2026-10-19T00:00:00Z") };
  it("English as stored, a translation as stored with its own figure, the English with a note when there is none", () => {
    expect(wordsIn("en", english, null)).toMatchObject({ language: "en", stem: english.stem, notes: [] });
    expect(wordsIn("hi", english, hindi, "एक किरण")).toMatchObject({ language: "hi", stem: hindi.stem, choices: ["हाँ", "नहीं"], solution: "हाँ।", imageKey: "hi-fig", imageAlt: "एक किरण", notes: [] });
    expect(wordsIn("mr", english, null)).toMatchObject({ language: "en", stem: english.stem, notes: ["MISSING"] });
    expect(wordsIn("hi", { ...english, takenDownReason: "BAD_TRANSLATION" }, hindi).notes).toEqual(["BAD_TRANSLATION"]);
    expect(wordsIn("hi", { ...english, editedAfterSolvingAt: new Date("2026-10-20T00:00:00Z") }, hindi).notes).toEqual(["STALE"]);
  });
});

describe("the bank desk on the database (a ZZ cell: Balbharati class 3 physics)", () => {
  it("the matrix: chapter 1 counted once over two topics, chapter 2 at the target, the unnumbered topic its own chapter", async () => {
    const m = await bankMatrix(curator(), { board: "BALBHARATI" });
    expect(m.target).toBe(target);
    const cell = m.rows.find((r) => r.grade === 3)!.cells.find((c) => c.subject === "PHYSICS")!;
    // 4 (3 authored + 1 generated) + 2 served of the second topic + the target in chapter 2; the down and the held do not count.
    expect(cell).toEqual({ subject: "PHYSICS", served: 4 + 2 + target, chapters: 3, atTarget: 1 });
    const ncert = await bankMatrix(curator(), { board: "NCERT" });
    expect(ncert.rows.find((r) => r.grade === 3)!.cells.find((c) => c.subject === "PHYSICS")!.chapters).toBe(0);
  });

  it("the chapters: grouped and in book order, the chips, the levels, the down and held, the case rule", async () => {
    const data = await bankChapters(curator(), { board: "BALBHARATI", grade: 3, subject: "PHYSICS" });
    expect(data.groups).toHaveLength(1);
    const rows = data.groups[0]!.chapters;
    expect(rows.map((r) => r.slug)).toEqual([slug("again"), slug("light"), slug("lines"), slug("extra")]);
    expect(rows.map((r) => r.maker)).toEqual(["GENERATED", "MIXED", "GENERATED", null]);
    expect(rows[0]).toMatchObject({ levels: [0, 0, 2, 0, 0, 0], total: 2, down: 1, held: 1, number: 1 });
    expect(rows[1]).toMatchObject({ levels: [2, 2, 0, 0, 0, 0], total: 4 });
    expect(rows[2]).toMatchObject({ name: "ZZ lines and angles", chapter: "Chapter 2 — ZZ lines and angles", total: target });
  });

  it("a chapter's page in English, Hindi and Marathi, with the notes, the standings and fifty a page", async () => {
    const en = await bankChapter(curator(), slug("again"), {});
    expect(en.counts).toEqual({ served: 2, down: 1, held: 1 });
    expect(en.items.map((i) => i.id).sort()).toEqual([q.hiOnly, q.none].sort());
    expect(en.items.every((i) => i.language === "en" && i.notes.length === 0 && i.generated && i.madeAt === "2026-10-19T10:00:00.000Z")).toBe(true);

    const hi = await bankChapter(curator(), slug("again"), { lang: "hi" });
    const hiOne = hi.items.find((i) => i.id === q.hiOnly)!;
    expect(hiOne).toMatchObject({ language: "hi", choices: ["किरण", "तरंग", "लेंस", "प्रिज़्म"], notes: ["STALE"] });
    expect(hiOne.stem).toContain("प्रकाश");
    expect(hi.items.find((i) => i.id === q.none)).toMatchObject({ language: "en", notes: ["MISSING"] });

    const mr = await bankChapter(curator(), slug("again"), { lang: "mr" });
    expect(mr.items.find((i) => i.id === q.hiOnly)).toMatchObject({ language: "mr", choices: ["किरण", "लहर", "भिंग", "लोलक"] });
    expect(mr.items.find((i) => i.id === q.none)!.notes).toEqual(["MISSING"]);

    const down = await bankChapter(curator(), slug("again"), { lang: "hi", state: "DOWN" });
    expect(down.items).toHaveLength(1);
    expect(down.items[0]).toMatchObject({ id: q.down, state: "DOWN", takenDownReason: "BAD_TRANSLATION", notes: ["BAD_TRANSLATION"] });
    expect((await bankChapter(curator(), slug("again"), { state: "HELD" })).items).toHaveLength(1);

    const authored = await bankChapter(curator(), slug("light"), {});
    expect(authored.items.filter((i) => !i.generated)).toHaveLength(3);

    const page1 = await bankChapter(curator(), slug("lines"), {});
    const page2 = await bankChapter(curator(), slug("lines"), { page: 2 });
    expect(page1.pages).toBe(Math.ceil(target / 50));
    expect(page1.items).toHaveLength(Math.min(50, target));
    expect(page2.page).toBe(Math.min(2, page1.pages));
    expect(page1.topic.name).toBe("ZZ lines and angles");
    await expect(bankChapter(curator(), "zz-bd-no-such-chapter", {})).rejects.toMatchObject({ key: "bankDesk.noSuchChapter" });
  });

  it("the doors answer the content team in their contracts' shapes, a no-such chapter 404, signed out 401; listed in the catalog", async () => {
    __resetCookies();
    await createSession(ids.curator);
    const m = await matrixGet(get(`${P}/matrix?board=BALBHARATI`));
    expect(m.status).toBe(200);
    expect(quizBankMatrixSchema.parse(await m.json()).board).toBe("BALBHARATI");
    const c = await chaptersGet(get(`${P}/chapters?board=BALBHARATI&grade=3&subject=PHYSICS`));
    expect(c.status).toBe(200);
    expect(quizBankChaptersSchema.parse(await c.json()).groups[0]!.chapters).toHaveLength(4);
    const one = await chapterGet(get(`${P}/chapters/${slug("again")}?lang=mr`), { params: Promise.resolve({ slug: slug("again") }) });
    expect(one.status).toBe(200);
    expect(quizBankChapterSchema.parse(await one.json()).language).toBe("mr");
    expect((await chapterGet(get(`${P}/chapters/zz-bd-no-such`), { params: Promise.resolve({ slug: "zz-bd-no-such" }) })).status).toBe(404);
    expect((await matrixGet(get(`${P}/matrix?board=CBSE`))).status).toBe(422);
    __resetCookies();
    expect((await matrixGet(get(`${P}/matrix`))).status).toBe(401);
    for (const path of [`${P}/matrix`, `${P}/chapters`, `${P}/chapters/{slug}`]) expect(ENDPOINTS.find((e) => e.path === path && e.method === "GET")?.access, path).toBe("app-admin");
  });
});
