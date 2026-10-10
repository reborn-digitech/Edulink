import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readAssistantConfig, readEmbedConfig } from "@/lib/assistant-env";
import { embedTexts, vectorLiteral } from "@/lib/assistant-model";
import { keywordQuery, reciprocalRankFusion, searchCurriculum, searchHelp } from "@/lib/assistant-retrieval";
import { chunk, editionIn, MAX_CHARS } from "../scripts/corpus-chunk";
import type { PageContent, Run } from "../scripts/corpus-pdf";

/**
 * The assistant's retrieval (docs/plans/assistant.md, Phase A): the pure parts always, and the
 * hybrid search against a small fixture corpus — three chapters and twenty help entries — that
 * the suite embeds through the local endpoint when ASSISTANT_EMBED_URL is set, and skips, saying
 * why, when it is not (CI has no model server).
 *
 * The fixture rows are written as the owner, scoped by their own markers (source "fixture", board
 * "ZZ Fixture Board", commit "zz-fixture") and removed by the same markers afterwards; nothing else
 * in the content tables is touched.
 */

describe("reciprocal rank fusion", () => {
  it("puts an item found by both halves above one found by either alone, and keeps every item once", () => {
    const vector = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const keyword = [{ id: "c" }, { id: "d" }];
    const fused = reciprocalRankFusion([vector, keyword]);
    expect(fused.map((f) => f.item.id)).toEqual(["c", "a", "b", "d"]);
    expect(fused[0]!.ranks).toEqual([3, 1]);
    expect(fused[0]!.score).toBeCloseTo(1 / 63 + 1 / 61, 10);
    expect(new Set(fused.map((f) => f.item.id)).size).toBe(4);
  });
});

describe("the keyword query", () => {
  it("ORs the question's own words, drops the asking words, and lets nothing of to_tsquery's syntax through", () => {
    expect(keywordQuery("Explain Newton's third law to me")).toBe("newton | third | law | to");
    expect(keywordQuery("a & b | !c (d)")).toBeNull();
    expect(keywordQuery("न्यूटन का तीसरा नियम")).toBe("न्यूटन | का | तीसरा | नियम");
    expect(keywordQuery("why?")).toBeNull();
  });
});

describe("the model endpoints' configuration", () => {
  it("names every missing or malformed variable, and reads a complete set", () => {
    const missing = readAssistantConfig({});
    expect(missing.ok).toBe(false);
    if (!missing.ok) expect(missing.problems.map((p) => p.key).sort()).toEqual(["ASSISTANT_EMBED_MODEL", "ASSISTANT_EMBED_URL", "ASSISTANT_MODEL", "ASSISTANT_MODEL_URL"]);
    const bad = readEmbedConfig({ ASSISTANT_EMBED_URL: "localhost:8181", ASSISTANT_EMBED_MODEL: "m" });
    expect(bad.ok).toBe(false);
    const good = readAssistantConfig({ ASSISTANT_MODEL_URL: "http://127.0.0.1:8180/v1/", ASSISTANT_MODEL: "qwen3-30b-a3b", ASSISTANT_EMBED_URL: "http://127.0.0.1:8181/v1", ASSISTANT_EMBED_MODEL: "qwen3-embedding-0.6b" });
    expect(good.ok && good.config.chat.url).toBe("http://127.0.0.1:8180/v1");
    expect(good.ok && good.config.embed.key).toBeNull();
  });
});

/* ---- chunking, on pages built by hand ----------------------------------- */

const run = (text: string, y: number, size = 11, x = 72): Run => ({ text, x, y, width: text.length * size * 0.5, size, bold: false });

function page(n: number, runs: Run[]): PageContent {
  return { page: n, width: 612, height: 792, runs, images: [], ocr: false };
}

describe("chunking by chapter and section", () => {
  const body = (words: string, y: number) => run(words, y);
  const filler = "A force is a push or a pull on an object that can change its state of motion or its shape.";
  const pages: PageContent[] = [1, 2, 3, 4, 5, 6].map((n) =>
    page(n, [
      run("Force and Laws of Motion", 760, 10), // a running head on every page
      run(String(100 + n), 40, 10), // the page number
      ...(n === 1 ? [run("Force and Laws", 700, 24), run("of Motion", 676, 24)] : []),
      ...(n === 2 ? [run("9.1 Balanced and Unbalanced Forces", 700, 14)] : []),
      ...(n === 4 ? [run("9.2 Third Law of Motion", 700, 14), body("To every action there is an equal and opposite reaction.", 680)] : []),
      // Lines that differ by more than their digits: a line repeated on every page is a running head.
      ...Array.from({ length: 12 }, (_, i) => body(`${filler} (${"uvwxyz"[n - 1]}${"abcdefghijkl"[i]})`, 640 - i * 14)),
      ...(n === 6 ? [run("Reprint 2025-26", 30, 9)] : []),
    ]),
  );

  const result = chunk(pages, { perChapterFile: true, chapterLabel: (found) => (found ? `Chapter 9: ${found}` : null), figureKey: (p, i) => `figures/t-p${p}-${i}.png` });

  it("finds the chapter title, cuts at the sections, and gives every chunk its heading path", () => {
    expect(result.chapter).toBe("Chapter 9: Force and Laws of Motion");
    expect(result.chunks.length).toBeGreaterThan(2);
    for (const c of result.chunks) expect(c.headingPath[0]).toBe("Chapter 9: Force and Laws of Motion");
    const third = result.chunks.find((c) => c.text.includes("equal and opposite reaction"));
    expect(third?.headingPath).toEqual(["Chapter 9: Force and Laws of Motion", "9.2 Third Law of Motion"]);
    expect(third?.section).toBe("9.2 Third Law of Motion");
    expect(third?.pageStart).toBe(4);
  });

  it("drops the running head and the page numbers, keeps chunks under the cap, and reads the edition", () => {
    for (const c of result.chunks) {
      expect(c.text).not.toContain("Force and Laws of Motion\n");
      expect(c.text).not.toMatch(/^10\d$/m);
      expect(c.text.length).toBeLessThanOrEqual(MAX_CHARS);
      expect(c.tokens).toBe(Math.max(1, Math.round(c.text.length / 4)));
    }
    expect(result.edition).toBe("Reprint 2025-26");
    expect(editionIn(["First Edition March 2026"])).toBe("First Edition 2026");
    expect(editionIn(["nothing here"])).toBeNull();
  });
});

/* ---- the hybrid search, against the local embedding endpoint ------------ */

const embed = readEmbedConfig();
// Set is not the same as up (10 Oct 2026: the variables stayed in .env after the servers were stopped and the
// whole suite failed on ECONNREFUSED): the endpoint is probed once, and a silent server skips the suite too.
const up = embed.ok ? await fetch(new URL("models", embed.config.url.endsWith("/") ? embed.config.url : `${embed.config.url}/`), { signal: AbortSignal.timeout(2_000) }).then((r) => r.ok, () => false) : false;
const reason = !embed.ok
  ? `ASSISTANT_EMBED_URL / ASSISTANT_EMBED_MODEL are not set (${embed.problems.map((p) => p.key).join(", ")}): no embedding endpoint to build the fixture corpus with`
  : !up
    ? `the embedding server at ${embed.config.url} does not answer (start it with npm run model:serve)`
    : "";
if (reason) console.log(`  skipped: the assistant's retrieval against a fixture corpus — ${reason}`);

const BOARD = "ZZ Fixture Board";
const COMMIT = "zz-fixture";

const CHAPTERS = [
  {
    path: "fixture/9/science/force.pdf",
    grade: "9",
    subject: "Science",
    title: "ZZ Science for Class 9",
    chapter: "Chapter 9: Force and Laws of Motion",
    chunks: [
      { section: "9.1 Balanced and Unbalanced Forces", page: 115, text: "When the forces acting on an object are balanced, the object stays at rest or keeps moving with the same velocity. An unbalanced force changes the speed or the direction of motion of the object." },
      { section: "9.4 Third Law of Motion", page: 122, text: "The third law of motion states that when one object exerts a force on another object, the second object instantaneously exerts a force back on the first. These two forces are always equal in magnitude but opposite in direction: to every action there is an equal and opposite reaction. When a gun is fired, it exerts a forward force on the bullet, and the bullet exerts an equal and opposite force on the gun, so the gun recoils." },
      { section: "9.4 Third Law of Motion", page: 123, text: "A swimmer pushes the water backwards and the water pushes the swimmer forwards. A boat moves away from the shore as a sailor jumps out of it onto the land. Action and reaction act on two different objects, so they never cancel each other." },
    ],
  },
  {
    path: "fixture/7/science/photosynthesis.pdf",
    grade: "7",
    subject: "Science",
    title: "ZZ Science for Class 7",
    chapter: "Chapter 1: Nutrition in Plants",
    chunks: [
      { section: "1.2 Photosynthesis", page: 3, text: "Leaves are the food factories of plants. The green pigment chlorophyll in the leaves captures the energy of sunlight, which is used to make food from carbon dioxide and water. This process is called photosynthesis, and oxygen is released during it." },
      { section: "1.3 Other Modes of Nutrition", page: 6, text: "Some plants do not have chlorophyll and cannot make their own food. Cuscuta, the dodder plant, takes its readymade food from the plant on which it climbs; such a plant is called a parasite." },
    ],
  },
  {
    path: "fixture/8/mathematics/fractions.pdf",
    grade: "8",
    subject: "Mathematics",
    title: "ZZ Mathematics for Class 8",
    chapter: "Chapter 2: Rational Numbers",
    chunks: [
      { section: "2.1 Introduction", page: 18, text: "A rational number is a number that can be written in the form p/q, where p and q are integers and q is not zero. Every fraction and every integer is a rational number." },
      { section: "2.2 Properties", page: 20, text: "Rational numbers are closed under addition, subtraction and multiplication. The sum of two rational numbers is always a rational number, and so is their product." },
    ],
  },
];

type FixtureHelp = { roles: string[]; pagePath: string | null; title: string; text: string; language?: "en" | "hi" | "mr" };
const HELP_WRITTEN: FixtureHelp[] = [
  { roles: ["ADMIN"], pagePath: "/admin/zz-departures", title: "Recording a pupil's departure", text: "The office records that a pupil has left from the zz departures page: open the pupil, choose Leaving, set the last day and the reason, and issue the zebra-stamped leaving certificate." },
  { roles: ["ADMIN"], pagePath: "/admin/zz-fees", title: "Fee heads", text: "The office sets up fee heads under the zz fee page: add a head, give it an amount and the classes it applies to." },
  { roles: ["ADMIN"], pagePath: "/admin/zz-timetable", title: "Building the timetable", text: "Build the week's timetable on the zz timetable page: periods first, then drag a teacher and a subject into each slot." },
  { roles: ["ADMIN", "PRINCIPAL"], pagePath: "/admin/zz-calendar", title: "Holidays", text: "Add a holiday to the school calendar on the zz calendar page; a closed day takes no register." },
  { roles: ["PRINCIPAL"], pagePath: "/principal/zz-leave", title: "Approving leave", text: "The principal approves or declines a teacher's leave request on the zz leave page and names the cover." },
  { roles: ["TEACHER"], pagePath: "/teacher/zz-register", title: "Taking the register", text: "A teacher takes the morning register on the zz register page: everyone is marked present, tap the absent ones and save." },
  { roles: ["TEACHER"], pagePath: "/teacher/zz-homework", title: "Setting homework", text: "Set homework for a class on the zz homework page with a due date; the pupils see it on their own page." },
  { roles: ["TEACHER"], pagePath: "/teacher/zz-marks", title: "Entering marks", text: "Enter marks for an exam on the zz marks page; a mark above the maximum is refused." },
  { roles: ["STUDENT"], pagePath: "/student/zz-practice", title: "Practice", text: "Practise a chapter's quiz on the zz practice page; badges come with streaks." },
  { roles: ["STUDENT"], pagePath: "/student/zz-timetable", title: "My timetable", text: "A pupil's own timetable for the week is on the zz my-timetable page." },
  { roles: ["PARENT"], pagePath: "/parent/zz-fees", title: "Fees for my child", text: "A parent sees what is owed and the receipts on the zz family fees page; the platform never takes the money." },
  { roles: ["PARENT"], pagePath: "/parent/zz-absence", title: "Reporting an absence", text: "A parent tells the school that a child will be away from the zz absence page, with the dates and a reason." },
  { roles: [], pagePath: "/zz-account", title: "Changing the language", text: "Anyone changes the language of the app between English, Hindi and Marathi on the zz account page." },
  { roles: [], pagePath: "/zz-notifications", title: "Notifications", text: "Every notification is on the zz notifications page; mark them read one by one or all at once." },
  { roles: ["EXPERT"], pagePath: "/expert/zz-slots", title: "Offering mentoring slots", text: "An expert offers mentoring times on the zz slots page; a school's pupil books one with consent." },
  { roles: ["LIBRARIAN"], pagePath: "/library/zz-issue", title: "Issuing a book", text: "The librarian issues a book on the zz issue desk page by scanning the accession number and the borrower's card." },
  { roles: ["WARDEN"], pagePath: "/hostel/zz-rollcall", title: "Night roll-call", text: "The warden takes the hostel's night roll-call on the zz roll-call page." },
  { roles: ["ADMIN"], pagePath: "/admin/zz-departures", title: "विद्यार्थी का स्कूल छोड़ना", text: "कार्यालय zz departures पृष्ठ पर विद्यार्थी के स्कूल छोड़ने को दर्ज करता है और स्थानांतरण प्रमाणपत्र जारी करता है।", language: "hi" },
  { roles: ["ADMIN"], pagePath: "/admin/zz-departures", title: "विद्यार्थ्याने शाळा सोडणे", text: "कार्यालय zz departures पानावर विद्यार्थ्याने शाळा सोडल्याची नोंद करते आणि शाळा सोडल्याचा दाखला देते.", language: "mr" },
  { roles: ["TEACHER"], pagePath: "/teacher/zz-register", title: "हजेरी घेणे", text: "शिक्षक zz register पानावर सकाळची हजेरी घेतात.", language: "mr" },
];
const HELP = HELP_WRITTEN.map((h) => ({ ...h, language: h.language ?? ("en" as const) }));

// Generous timeouts: the local embedding server may be busy with an ingest when the suite runs.
describe.skipIf(!embed.ok || !up)("hybrid search over a fixture corpus (three chapters, twenty help entries)", { timeout: 60_000 }, () => {
  const owner = new PrismaClient();
  const appUrl = process.env.DATABASE_APP_URL;
  const app = appUrl && appUrl !== process.env.DATABASE_URL ? new PrismaClient({ datasourceUrl: appUrl }) : null;
  const ep = embed.ok ? embed.config : null!;
  const ids: Record<string, string> = {};

  async function cleanup() {
    await owner.contentDocument.deleteMany({ where: { source: "fixture", board: BOARD } });
    await owner.helpEntry.deleteMany({ where: { commit: COMMIT } });
  }

  beforeAll(async () => {
    await cleanup();
    for (const ch of CHAPTERS) {
      const doc = await owner.contentDocument.create({
        data: { path: ch.path, source: "fixture", kind: "textbook", board: BOARD, gradeOrProgramme: ch.grade, subject: ch.subject, title: ch.title, language: "en", edition: "Fixture 2026", sourceUrl: `https://fixture.invalid/${ch.path}`, licenceUrl: "https://fixture.invalid/", retrievedAt: new Date(), sha256: "fixture", bytes: 0, pageCount: 1 },
      });
      const vectors = await embedTexts(ep, ch.chunks.map((c) => `${ch.title} › ${ch.chapter} › ${c.section}\n\n${c.text}`));
      for (const [i, c] of ch.chunks.entries()) {
        const row = await owner.contentChunk.create({
          data: { documentId: doc.id, ordinal: i, chapter: ch.chapter, section: c.section, headingPath: [ch.chapter, c.section], pageStart: c.page, pageEnd: c.page, text: c.text, language: "en", tokens: Math.round(c.text.length / 4), figureKeys: [], edition: "Fixture 2026" },
        });
        await owner.$executeRaw`UPDATE "ContentChunk" SET "embedding" = ${vectorLiteral(vectors[i]!)}::vector, "embeddedAt" = now() WHERE "id" = ${row.id}`;
        ids[`${ch.path}#${i}`] = row.id;
      }
    }
    const vectors = await embedTexts(ep, HELP.map((h) => `${h.title}\n${h.text}`));
    for (const [i, h] of HELP.entries()) {
      const row = await owner.helpEntry.create({ data: { kind: "doc", roles: h.roles, pagePath: h.pagePath, title: h.title, text: h.text, sourceFile: "tests/assistant-retrieval.test.ts", commit: COMMIT, language: h.language } });
      await owner.$executeRaw`UPDATE "HelpEntry" SET "embedding" = ${vectorLiteral(vectors[i]!)}::vector WHERE "id" = ${row.id}`;
      ids[`help#${i}`] = row.id;
    }
  }, 120_000);

  afterAll(async () => {
    await cleanup();
    await owner.$disconnect();
    await app?.$disconnect();
  });

  const ctx = () => ({ db: app ?? owner, embed: ep });
  // The real help index may sit in the same table: the fixture's own rows are judged among themselves.
  const fixtureOnly = <T extends { entryId: string }>(hits: T[]) => hits.filter((h) => Object.entries(ids).some(([k, v]) => k.startsWith("help#") && v === h.entryId));

  it("answers a question with the passage that carries it, and cites board, book, chapter, section and page", async () => {
    const hits = await searchCurriculum({ query: "why does a gun recoil when it is fired?", language: "en", board: "ZZ Fixture", limit: 3 }, ctx());
    expect(hits[0]?.chunkId).toBe(ids["fixture/9/science/force.pdf#1"]);
    expect(hits[0]?.citation).toEqual({ board: BOARD, book: "ZZ Science for Class 9", chapter: "Chapter 9: Force and Laws of Motion", section: "9.4 Third Law of Motion", page: 122, documentId: hits[0]!.documentId, chunkId: hits[0]!.chunkId });
    // Found by both halves: the vector and the words "gun" and "fired".
    expect(hits[0]?.vectorRank).not.toBeNull();
    expect(hits[0]?.keywordRank).not.toBeNull();
    expect(hits[0]?.edition).toBe("Fixture 2026");
  });

  it("scopes by grade and subject, and widens to the classes either side only when asked", async () => {
    const own = await searchCurriculum({ query: "explain newton's third law", language: "en", board: "ZZ Fixture", grade: 8, limit: 5 }, ctx());
    expect(own.every((h) => h.grade === "8")).toBe(true);
    const wider = await searchCurriculum({ query: "explain newton's third law", language: "en", board: "ZZ Fixture", grade: 8, gradeWindow: 1, limit: 5 }, ctx());
    expect(wider[0]?.grade).toBe("9");
    expect(wider[0]?.section).toBe("9.4 Third Law of Motion");
    const maths = await searchCurriculum({ query: "food from sunlight", language: "en", board: "ZZ Fixture", subject: "Mathematics", limit: 5 }, ctx());
    expect(maths.every((h) => h.subject === "Mathematics")).toBe(true);
  });

  it("finds the English passage for a question asked in Hindi or in Marathi", async () => {
    const hi = await searchCurriculum({ query: "पौधे सूर्य के प्रकाश से भोजन कैसे बनाते हैं?", language: "hi", board: "ZZ Fixture", limit: 3 }, ctx());
    expect(hi[0]?.section).toBe("1.2 Photosynthesis");
    const mr = await searchCurriculum({ query: "न्यूटनचा गतीचा तिसरा नियम समजावून सांगा", language: "mr", board: "ZZ Fixture", limit: 3 }, ctx());
    expect(mr[0]?.section).toBe("9.4 Third Law of Motion");
  });

  it("gives a role its own help and every role's, never another role's", async () => {
    const admin = fixtureOnly(await searchHelp({ query: "where do I record that a pupil has left the school", language: "en", role: "ADMIN", limit: 50 }, ctx()));
    expect(admin[0]?.entryId).toBe(ids["help#0"]);
    expect(admin[0]?.pagePath).toBe("/admin/zz-departures");
    const student = await searchHelp({ query: "where do I record that a pupil has left the school", language: "en", role: "STUDENT", limit: 50 }, ctx());
    const adminOnly = HELP.map((h, i) => (h.roles.length && !h.roles.includes("STUDENT") ? ids[`help#${i}`] : null)).filter(Boolean);
    expect(student.some((h) => adminOnly.includes(h.entryId))).toBe(false);
    const anyone = fixtureOnly(await searchHelp({ query: "change the app's language to Marathi", language: "en", role: "WARDEN", limit: 50 }, ctx()));
    expect(anyone[0]?.entryId).toBe(ids["help#12"]);
  });

  it("reads the person's language and English, not the third language", async () => {
    const hits = await searchHelp({ query: "विद्यार्थी के स्कूल छोड़ने को कहाँ दर्ज करें", language: "hi", role: "ADMIN", limit: 50 }, ctx());
    expect(hits.every((h) => h.language === "hi" || h.language === "en")).toBe(true);
    expect(fixtureOnly(hits).slice(0, 3).map((h) => h.entryId)).toContain(ids["help#17"]);
  });

  it.skipIf(!app)("lets the app role read the content tables and nothing more", async () => {
    await expect(app!.$executeRaw`INSERT INTO "HelpEntry" ("id","kind","roles","title","text","sourceFile","commit","language") VALUES ('zz-denied','doc','{}','t','t','f',${COMMIT},'en')`).rejects.toThrow(/permission denied/);
    await expect(app!.$executeRaw`DELETE FROM "ContentChunk" WHERE "id" = ${ids["fixture/7/science/photosynthesis.pdf#0"]!}`).rejects.toThrow(/permission denied/);
    const [{ n }] = (await app!.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM "ContentDocument" WHERE "board" = ${BOARD}`) as [{ n: bigint }];
    expect(n).toBe(3n);
  });
});
