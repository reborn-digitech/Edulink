import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readEmbedConfig } from "@/lib/assistant-env";
import { embedTexts, vectorLiteral } from "@/lib/assistant-model";
import { searchCurriculum } from "@/lib/assistant-retrieval";
import { bandOf, gradeDistance, LEVEL_KINDS, papersStyleFor, styleScore, styleSubjects } from "@/lib/quiz-style";
import { chunkPaper, paperLines, questionStart, sectionHeading } from "../scripts/corpus-papers-chunk";
import { classifyHbcse, copyrightLine, fourDigitYear, iaptPageYear, linksWithContext, parseCbseSession, parseHbcse, parseIapt, parseJeeAdvanced, parseJeeMain, parseNeet, questionPaperLinks, renderedByScript, stampedYear, termsSlice } from "../scripts/corpus-papers";
import { garbledShare, type PageContent, type Run } from "../scripts/corpus-pdf";

/**
 * The papers source (10 October 2026): the past entrance, olympiad and board sample papers as a STYLE
 * corpus for the quiz bank's levels 5 and 6. The pure parts always — the pages' parsers on small
 * copies of the bodies' own markup, the question chunker on pages built by hand, the ranking helpers —
 * and, when the local embeddings endpoint answers:
 *   - the tutor's searchCurriculum never returns a paper, scoped or not, even when a paper's question is
 *     the nearest text to the question asked (fixture rows, source "papers", board "ZZ Fixture Papers",
 *     removed afterwards by the same marker);
 *   - papersStyleFor against the INGESTED papers (skipped, saying so, until `npm run corpus:ingest --
 *     --source=papers` has run on this machine).
 */

const LICENCE = { url: "https://fixture.invalid/terms" };

describe("the bodies' pages, read as the fetcher reads them", () => {
  it("JEE (Advanced): the English papers by year and paper; the Hindi copies and the drawing test are not taken", () => {
    const html = `<p>Indian Institute of Technology Roorkee</p><table><tr><td>2025</td><td>Paper 1 (English)</td><td><a href="past_qps/2025_1_English.pdf">Download</a></td>
      <td><a href="past_qps/2025_1_Hindi.pdf">Download</a></td></tr><tr><td>2018</td><td><a href="past_qps/2018_2.pdf">Download</a></td><td><a href="past_qps/AAT-2018.pdf">Download</a></td></tr></table>`;
    const items = parseJeeAdvanced(html, "https://jeeadv.ac.in/archive.html", LICENCE);
    expect(items.map((i) => [i.year, i.paper.sitting, i.sourceUrl])).toEqual([
      ["2025", "Paper 1", "https://jeeadv.ac.in/past_qps/2025_1_English.pdf"],
      ["2018", "Paper 2", "https://jeeadv.ac.in/past_qps/2018_2.pdf"],
    ]);
    const first = items[0]!;
    expect(first.source).toBe("papers");
    expect(first.kind).toBe("entrance-paper");
    expect(first.paper.level).toBe(5);
    expect(first.gradeOrProgramme).toBe("11-12");
    expect(first.subject).toBe("Physics, Chemistry, Mathematics");
    expect(first.paper.body).toContain("Indian Institute of Technology Roorkee");
    expect(first.folder).toBe("papers/jee-advanced/11-12/jee-advanced");
    expect(first.file).toBe("jee-advanced-2025-2025_1_English.pdf");
  });

  it("JEE (Main): the B.Tech papers of NTA's menu, read by OCR; the drawing paper and the answer keys are not taken", () => {
    const html = `<li><a href="#">Question Papers</a><ul><li><a href="https://cdnbbsr.s3waas.gov.in/x/uploads/2026/04/1.pdf">B Tech 2nd Apr 2026 Shift 1</a></li>
      <li><a href="https://cdnbbsr.s3waas.gov.in/x/uploads/2026/04/2.pdf">B Arch 2nd Apr 2026 Shift 2</a></li>
      <li><a href="https://cdnbbsr.s3waas.gov.in/x/uploads/2026/02/3.pdf">Final Answer Keys of JEE (Main)–2026 [Session-I] Paper-1</a></li></ul></li>`;
    const items = parseJeeMain(html, "https://jeemain.nta.nic.in/", LICENCE);
    expect(items).toHaveLength(1);
    expect(items[0]!.paper.sitting).toBe("Paper 1 (B.E./B.Tech.), 2 Apr 2026, Shift 1");
    expect(items[0]!.paper.textInPictures).toBe(true);
    expect(items[0]!.year).toBe("2026");
  });

  it("NEET (UG): one English set a year, the first by its code; the other languages are not taken", () => {
    const html = ["English Set F1", "English Set E2", "English Set E1", "Eng &amp; Hindi Set E4", "Marathi Set E1", "Bengali Set F5"].map((t, i) => `<a href="https://cdn.invalid/${i}.pdf">${t} NEET QP 2020</a>`).join("");
    const items = parseNeet(html, "https://neet.nta.nic.in/archive/", LICENCE);
    expect(items.map((i) => [i.year, i.paper.sitting, i.sourceUrl])).toEqual([["2020", "Set E1", "https://cdn.invalid/2.pdf"]]);
    expect(items[0]!.paper.twoColumns).toBe(true);
  });

  it("HBCSE: the test from the file or its cell, the year from the name (four digits, two, or a date stamp), Hindi copies and answer booklets left, a locked PDF set aside", () => {
    const base = "https://olympiads.hbcse.tifr.res.in/how-to-prepare/past-papers/";
    const html = `<h2>Question papers and Solutions of RMO, INMO, and PRMO</h2><table>
      <tr><td>IOQM(Earlier-PRMO)</td><td>RMO</td><td>INMO</td></tr>
      <tr><td>QP of IOQM 2025 <a href="/wp-content/uploads/2025/09/en.M1.pdf">English</a> , <a href="/wp-content/uploads/2025/09/hi.M1.pdf">Hindi</a> <a href="/wp-content/uploads/2025/09/final-key-7th-September.pdf">Answer Key</a></td>
          <td><p>CRMO 2016 Paper 2</p><p><a href="/wp-content/uploads/2016/09/QPcrmo-16_2.pdf">Paper</a> <a href="/wp-content/uploads/2016/09/2sol.pdf">Solution</a></p></td>
          <td>INMO 2021 – <a href="/wp-content/uploads/2021/03/INMO21FINAL.pdf">Questions</a> PDF password: secret <a href="/wp-content/uploads/2021/03/INMO_2021_solutions.pdf">Solution</a></td></tr></table>
      <table><tr><td>INPhO 2025</td><td><a href="/wp-content/uploads/2025/02/INPhO2025-Question.pdf">QP (English)</a>, <a href="/wp-content/uploads/2025/02/INPhO2025-Question-hi.pdf">QP (Hindi)</a></td>
      <td><a href="/wp-content/uploads/2025/02/INPhO2025-Solution-20250219.pdf">Model Solutions</a> <a href="/wp-content/uploads/2026/01/INPHO2025-Answerbooklet.pdf">Answer Booklet</a></td></tr>
      <tr><td>INPhO 2016</td><td><a href="/wp-content/uploads/2016/09/inpho2016-Q-S.pdf">Question Paper &amp; Model Solutions</a></td></tr></table>`;
    const { items, locked } = parseHbcse(html, base, LICENCE);
    const seen = items.map((i) => `${i.paper.test} ${i.year} ${i.paper.part} ${i.sourceUrl.split("/").pop()}`);
    expect(seen).toEqual([
      "IOQM 2025 paper en.M1.pdf",
      "IOQM 2025 answer-key final-key-7th-September.pdf",
      "RMO 2016 paper QPcrmo-16_2.pdf",
      "RMO 2016 answer-key 2sol.pdf",
      "INMO 2021 answer-key INMO_2021_solutions.pdf",
      "INPhO 2025 paper INPhO2025-Question.pdf",
      "INPhO 2025 answer-key INPhO2025-Solution-20250219.pdf",
      "INPhO 2016 paper+answers inpho2016-Q-S.pdf",
    ]);
    expect(locked.map((i) => i.sourceUrl.split("/").pop())).toEqual(["INMO21FINAL.pdf"]);
    const inpho = items.find((i) => i.paper.test === "INPhO")!;
    expect([inpho.kind, inpho.paper.level, inpho.subject, inpho.gradeOrProgramme]).toEqual(["olympiad-paper", 6, "Physics", "11-12"]);
    expect(items.find((i) => i.paper.test === "RMO")!.paper.sitting).toBe("Paper 2");
  });

  it("IAPT: the file's own name names the test before the link's words; result lists are never taken", () => {
    const base = "https://iapt.org.in/nse-2025-26/";
    const html = `<a href="https://iapt.org.in/wp-content/uploads/images/NSEP_-_2025_Final_Answer_Key.pdf">NSEJS</a>
      <a href="https://iapt.org.in/wp-content/uploads/NSEA_-_2024_ST_1.pdf">NSEA - 2024 ST 1%</a>
      <a href="https://iapt.org.in/wp-content/uploads/NSEP_GROUP-A_SHORTLISTED.pdf">NSEP (Group A)</a>
      <a href="https://iapt.org.in/wp-content/uploads/NSEJS-JS530.pdf">📄 Question Paper</a>`;
    const items = parseIapt(html, base, LICENCE);
    expect(items.map((i) => `${i.paper.test} ${i.year} ${i.paper.part}`)).toEqual(["NSEP 2025 answer-key", "NSEJS 2025 paper"]);
    expect(items[1]!.gradeOrProgramme).toBe("9-10");
    expect(iaptPageYear("https://iapt.org.in/nse-2024-25/")).toBe("2024");
  });

  it("CBSE: subject rows of the session's table, the English paper and marking scheme; the Hindi and visually impaired copies, languages and music are not taken", () => {
    const html = `<table><tr><td>Subject</td><td>Sample Question Paper</td><td>Marking Scheme</td></tr>
      <tr><td>Science</td><td><a href="web_material/SQP/ClassX_2025_26/Science-SQP.pdf">SQP</a> | <a href="web_material/SQP/ClassX_2025_26/Science-SQP_hi.pdf">प्रतिदर्श प्रश्न पत्र</a></td><td><a href="web_material/SQP/ClassX_2025_26/Science-MS.pdf">MS</a></td></tr>
      <tr><td>Mathematics (Standard)</td><td><a href="web_material/SQP/ClassX_2025_26/MathsStandard-SQP.pdf">SQP</a></td></tr>
      <tr><td>Mathematics (Standard) (For Visually Impaired)</td><td><a href="web_material/SQP/ClassX_2025_26/MathsStandardVIC-SQP.pdf">SQP</a></td></tr>
      <tr><td>Hindustani Music (Vocal)</td><td><a href="web_material/SQP/ClassX_2025_26/HindustaniVocal-SQP.pdf">SQP</a></td></tr></table>`;
    const items = parseCbseSession(html, "https://cbseacademic.nic.in/SQP_CLASSX_2025-26.html", "10", "2025-26", LICENCE);
    expect(items.map((i) => `${i.subject} ${i.paper.part} ${i.paper.sitting}`)).toEqual(["Science paper null", "Science answer-key null", "Mathematics paper Mathematics (Standard)"]);
    expect(items[0]!.kind).toBe("board-sample-paper");
    expect(items[0]!.year).toBe("2025-26");
    expect(items[0]!.paper.level).toBe(5);
  });

  it("a site rendered by script, a page with no paper, a copyright line and a terms paragraph, as published", () => {
    expect(renderedByScript(`<body data-sveltekit-preload-data="hover"><div style="display: contents"><script>__sveltekit_x = {}</script></div></body>`)).toBe(true);
    expect(renderedByScript(`<a href="/a">a</a><a href="/b">b</a><a href="/c">c</a><div id="root"></div>`)).toBe(false);
    const ntse = `<a href="pdf/notice/MAT.pdf">Mental Ability Test(MAT)</a><a href="pdf/programmes/NTSE/Answer_Key_Mat.pdf">MAT Key</a>`;
    expect(questionPaperLinks(ntse, "https://ncert.nic.in/")).toEqual([]);
    expect(copyrightLine(`<footer><p>© 2026 Olympiads, HBCSE</p></footer>`)).toBe("© 2026 Olympiads, HBCSE");
    expect(termsSlice(`<div>Copyright Policy Material featured on this site may be reproduced free of charge after taking proper permission. Authorization must be obtained from the copyright holders concerned. Privacy</div>`, "Material featured", "copyright holders concerned.")).toBe("Material featured on this site may be reproduced free of charge after taking proper permission. Authorization must be obtained from the copyright holders concerned.");
  });

  it("years: four digits not inside a longer number, and a date stamp", () => {
    expect(fourDigitYear("INAO2025-Question.pdf")).toBe("2025");
    expect(fourDigitYear("20220215100.pdf")).toBeNull();
    expect(stampedYear("INAO-Solutions-20250221.pdf")).toBe("2025");
    const l = linksWithContext(`<table><tr><td>CRMO 2015 Paper 1 <a href="/x/sol-crmo15-1.pdf">Solution</a></td></tr></table>`, "https://olympiads.hbcse.tifr.res.in/")[0]!;
    expect(classifyHbcse(l)).toMatchObject({ part: "answer-key", year: "2015", locked: false });
  });
});

/* ---- the question chunker, on pages built by hand ------------------------- */

const run = (text: string, y: number, x = 72, size = 11): Run => ({ text, x, y, width: text.length * size * 0.5, size, bold: false });
const page = (n: number, runs: Run[]): PageContent => ({ page: n, width: 612, height: 792, runs, images: [], ocr: false });

describe("a paper cut by question", () => {
  it("keeps each question with its options, hands numbered instructions back, and files questions under their section's subject", () => {
    const pages = [
      page(1, [
        run("1. This booklet has 4 pages and the instructions below.", 760),
        run("2. Each correct answer carries 3 marks; negative marking applies.", 744),
        run("PHYSICS", 700),
        run("1. A block of mass 2 kg slides on a rough floor where the friction force is 4 N.", 680),
        run("What is its acceleration?", 666),
        run("(A) 1 m/s2", 650),
        run("(B) 2 m/s2", 636),
        run("(C) 3 m/s2", 622),
        run("(D) 4 m/s2", 608),
        run("2. A ball is thrown up with a speed of 10 m/s. Consider the statements:", 580),
        run("1. its speed decreases on the way up", 566),
        run("2. its acceleration is constant", 552),
        run("Which statements are true?", 538),
      ]),
      page(2, [
        run("CHEMISTRY", 760),
        run("1. Which compound forms when sodium reacts with chlorine in a reaction that releases energy?", 740),
        run("(A) NaCl (B) NaOH (C) Na2O (D) HCl", 724),
      ]),
    ];
    const { chunks } = chunkPaper(pages, { title: "ZZ Paper 2025", part: "paper", subjects: ["Physics", "Chemistry", "Mathematics"] });
    const questions = chunks.filter((c) => c.kind === "question");
    expect(questions.map((c) => [c.question, c.section])).toEqual([
      [1, "Physics"],
      [2, "Physics"],
      [1, "Chemistry"],
    ]);
    expect(questions[0]!.text).toContain("(D) 4 m/s2");
    // A numbered list inside a stem is the stem's.
    expect(questions[1]!.text).toContain("2. its acceleration is constant");
    expect(questions[0]!.headingPath).toEqual(["ZZ Paper 2025", "PHYSICS", "Question 1"]);
    const instructions = chunks.filter((c) => c.kind === "instructions").map((c) => c.text).join("\n");
    expect(instructions).toContain("This booklet has 4 pages");
  });

  it("drops running heads, page numbers and NTA's labels, and starts a question at NTA's 'Question Number'", () => {
    const pages = [1, 2, 3, 4].map((n) =>
      page(n, [
        run("ZZ Entrance Test 2026 Paper 1", 780),
        run(`Question Number : ${n} Question Id : 69112${n} Question Type : MCQ Option Shuffling : Yes`, 700),
        run("Question Mandatory : No Single Line Question Option : No Option Orientation : Vertical", 690),
        run(`Let x be a real number such that x squared equals ${n * 4}; find the value of x for question ${n}.`, 670),
        run("Options :", 650),
        run(`69112${n}1.`, 640),
        run(`${n}/4`, 40),
      ]),
    );
    const { chunks } = chunkPaper(pages, { title: "ZZ Entrance Test 2026", part: "paper", subjects: ["Mathematics"] });
    expect(chunks.map((c) => c.question)).toEqual([1, 2, 3, 4]);
    for (const c of chunks) {
      expect(c.text).not.toMatch(/ZZ Entrance Test|Question Id|Option Orientation|Options :|69112\d1|\/4/);
      expect(c.section).toBe("Mathematics");
    }
  });

  it("reads a number alone at the left edge as a question's (a table), never a superscript's", () => {
    const pages = [
      page(1, [
        run("1", 700, 50), run("Select the group in which all organisms have the same mode of nutrition.", 700, 80), run("1", 700, 520),
        run("A. Cuscuta, yeast and tapeworm B. Cactus, ticks and cow", 684, 80),
        run("2", 650, 50), run("The value of 10 raised to the power", 650, 80), run("26", 655, 260, 7),
        run("is a very large number; which of these is larger?", 636, 80),
        run("3", 600, 50), run("Name the process by which plants make food from sunlight and water.", 600, 80),
      ]),
    ];
    const { chunks } = chunkPaper(pages, { title: "ZZ Sample Paper", part: "paper", subjects: ["Science"] });
    expect(chunks.filter((c) => c.kind === "question").map((c) => c.question)).toEqual([1, 2, 3]);
    expect(questionStart({ text: "26 is a power", firstRun: "26", firstRunX: 260, marginX: 50 })).toBeNull();
  });

  it("cuts an answer grid by size, a long question into parts, and a paper with no numbering into blocks", () => {
    const grid = chunkPaper([page(1, Array.from({ length: 20 }, (_, i) => run(`${i + 1} ${"ABCD"[i % 4]}`, 760 - i * 14)))], { title: "ZZ Key", part: "answer-key", subjects: ["Physics"] });
    expect(grid.chunks.map((c) => c.kind)).toEqual(["answer-key"]);
    expect(grid.chunks[0]!.question).toBeNull();

    const long = Array.from({ length: 40 }, (_, i) => run(`Part (${i}) of the problem asks for a careful derivation of the moment of inertia of the flywheel and its axle, line ${i}.`, 760 - i * 14));
    const { chunks } = chunkPaper([page(1, [run("1. The Flywheel Chronicles: an experiment in rotation and friction", 780), ...long]), page(2, [run("2. A second problem about gears, motors and generators coupled through a gearbox", 760)]), page(3, [run("3. A third problem: a heart-shaped thermodynamic cycle of an ideal gas", 760)])], { title: "ZZ Olympiad", part: "paper", subjects: ["Physics"] });
    const first = chunks.filter((c) => c.question === 1);
    expect(first.length).toBeGreaterThan(1);
    expect(first.every((c) => c.text.length <= 2600)).toBe(true);
    expect(first[1]!.headingPath.at(-1)).toMatch(/^Question 1 \(part 2 of \d\)$/);

    const plain = chunkPaper([page(1, [run("Read the passage and answer what follows about rivers and their basins in India today.", 760), run("Rivers carry water from the hills to the sea and shape the plains they cross.", 744)])], { title: "ZZ Unnumbered", part: "paper", subjects: ["Geography"] });
    expect(plain.chunks.map((c) => c.kind)).toEqual(["questions"]);
  });

  it("tells a garbled text layer (a font with no Unicode map) from English and mathematics", () => {
    expect(garbledShare([`! #"%$!& ')(+*-, .0/21 $!&435, 687:9 /!*-.)(+;</>=), .?/5; @BADCFE G-(+&IHKJL(<1MJONPG`])).toBeGreaterThan(0.15);
    expect(garbledShare(["ÉCð ¬ ð Ë ±íÕNð ¬ 'R£ 7)F[,7gBHBrT6UCW=GÌ-NGÌ^C,&F[, 7)B 8J;AQ 46"])).toBeGreaterThan(0.15);
    expect(garbledShare(["Let ℝ denote the set of all real numbers. If 𝑓(𝑥) ≠ 𝑔(𝑥) for every 𝑥 ∈ ℝ, then (A) 8 (B) 2"])).toBeLessThan(0.05);
    expect(garbledShare(["Which of the following is not a quadratic equation? (A) (x + 2)^2 = 2(x + 3)"])).toBeLessThan(0.05);
  });

  it("knows a section heading from a stem that mentions a subject", () => {
    expect(sectionHeading("PART B — CHEMISTRY")).toEqual({ subject: "Chemistry" });
    expect(sectionHeading("Mathematics Section A")).toEqual({ subject: "Mathematics" });
    expect(sectionHeading("SECTION 2 (Maximum Marks: 12)")).toEqual({ subject: null });
    expect(sectionHeading("In physics, a force is a push or a pull acting on a body")).toBeNull();
    expect(paperLines([page(1, [run("3", 40)]), page(2, [run("Page 2 of 9", 40)])])).toEqual([]);
  });
});

describe("the style read's ranking", () => {
  it("bands, distances, subjects and levels", () => {
    expect(bandOf("11-12")).toEqual([11, 12]);
    expect(bandOf("10")).toEqual([10, 10]);
    expect(bandOf("glossary")).toBeNull();
    expect(gradeDistance(9, "11-12")).toBe(2);
    expect(gradeDistance(12, "8-12")).toBe(0);
    expect(styleSubjects("Science")).toEqual(["Science", "Physics", "Chemistry", "Biology"]);
    expect(styleSubjects("Physics")[0]).toBe("Physics");
    expect(styleSubjects("Accountancy")).toEqual(["Accountancy"]);
    expect(LEVEL_KINDS[5]).toEqual(["entrance-paper", "board-sample-paper"]);
    expect(LEVEL_KINDS[6]).toEqual(["olympiad-paper"]);
    // In the band beats a slightly closer text two classes away; the subject beats its neighbour.
    expect(styleScore(0.6, 0, false)).toBeGreaterThan(styleScore(0.64, 2, false));
    expect(styleScore(0.6, 0, false)).toBeGreaterThan(styleScore(0.61, 0, true));
  });
});

/* ---- the database: the tutor skips the papers; the style read finds them ---- */

const embed = readEmbedConfig();
// The endpoint must also answer: a configured but stopped server skips the suite rather than failing it.
const up = embed.ok ? await fetch(new URL("models", embed.config.url.endsWith("/") ? embed.config.url : `${embed.config.url}/`), { signal: AbortSignal.timeout(2_000) }).then((r) => r.ok, () => false) : false;

const FIX_BOARD = "ZZ Fixture Papers";
const PASSAGE = "When a gun is fired the bullet moves forward and the gun recoils backward: the force on the gun is equal and opposite to the force on the bullet, Newton's third law of motion.";

// Generous timeouts: the embeddings server is shared with the quiz generator's runs on this machine.
describe.skipIf(!embed.ok || !up)("the tutor never cites a paper (fixture rows)", { timeout: 240_000 }, () => {
  const owner = new PrismaClient();
  const appUrl = process.env.DATABASE_APP_URL;
  const app = appUrl && appUrl !== process.env.DATABASE_URL ? new PrismaClient({ datasourceUrl: appUrl }) : null;
  const ep = embed.ok ? embed.config : null!;
  const ids: Record<string, string> = {};

  async function cleanup() {
    await owner.contentDocument.deleteMany({ where: { board: FIX_BOARD } });
  }

  beforeAll(async () => {
    await cleanup();
    const [vec] = await embedTexts(ep, [`ZZ › ${PASSAGE}`]);
    for (const [key, source, styleOnly, kind] of [
      ["paper", "papers", true, "question"],
      ["book", "fixture", false, null],
    ] as const) {
      const doc = await owner.contentDocument.create({
        data: { path: `fixture/papers-test/${key}.pdf`, source, kind: key === "paper" ? "olympiad-paper" : "textbook", board: FIX_BOARD, gradeOrProgramme: "9", subject: "Science", title: `ZZ ${key}`, language: "en", sourceUrl: `https://fixture.invalid/${key}`, licenceUrl: "https://fixture.invalid/", retrievedAt: new Date(), sha256: "fixture", bytes: 0, pageCount: 1, styleOnly, extra: key === "paper" ? { test: "ZZ Olympiad", sitting: null, body: "ZZ Body" } : {} },
      });
      const row = await owner.contentChunk.create({ data: { documentId: doc.id, ordinal: 0, chapter: `ZZ ${key}`, section: "Science", headingPath: [`ZZ ${key}`, "Question 1"], pageStart: 1, pageEnd: 1, text: PASSAGE, language: "en", tokens: 40, figureKeys: [], kind } });
      await owner.$executeRaw`UPDATE "ContentChunk" SET "embedding" = ${vectorLiteral(vec!)}::vector, "embeddedAt" = now() WHERE "id" = ${row.id}`;
      ids[key] = row.id;
      ids[`${key}Doc`] = doc.id;
    }
  }, 120_000);

  afterAll(async () => {
    await cleanup();
    await owner.$disconnect();
    await app?.$disconnect();
  });

  const ctx = () => ({ db: app ?? owner, embed: ep });

  it("scoped to the papers' own board and class, the book's passage comes back and the paper's identical question does not", async () => {
    const hits = await searchCurriculum({ query: "why does a gun recoil when it is fired?", language: "en", board: FIX_BOARD, grade: 9, limit: 10 }, ctx());
    expect(hits.map((h) => h.chunkId)).toContain(ids.book);
    expect(hits.map((h) => h.chunkId)).not.toContain(ids.paper);
  });

  it("unscoped, over the whole corpus, no hit is a paper", async () => {
    const hits = await searchCurriculum({ query: "why does a gun recoil backward when the bullet is fired forward", language: "en", limit: 50 }, ctx());
    expect(hits.map((h) => h.chunkId)).not.toContain(ids.paper);
    const sources = await owner.contentDocument.findMany({ where: { id: { in: [...new Set(hits.map((h) => h.documentId))] } }, select: { source: true, styleOnly: true } });
    expect(sources.every((s) => s.source !== "papers" && !s.styleOnly)).toBe(true);
  });

  it("the style read finds the paper's question for the same topic", async () => {
    const got = await papersStyleFor({ subject: "Science", grade: 9, level: 6, topic: "Newton's third law of motion: action and reaction, recoil of a gun", limit: 50 }, ctx());
    expect(got.map((g) => g.chunkId)).toContain(ids.paper);
    expect(got.map((g) => g.chunkId)).not.toContain(ids.book);
    const mine = got.find((g) => g.chunkId === ids.paper)!;
    expect([mine.test, mine.body, mine.inBand, mine.question]).toEqual(["ZZ Olympiad", "ZZ Body", true, 1]);
  });
});

/* ---- the ingested papers ------------------------------------------------------ */

const probe = new PrismaClient();
const ingested = up
  ? Number(((await probe.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId" WHERE d."source" = 'papers' AND d."styleOnly" AND c."embedding" IS NOT NULL AND c."kind" = 'question'`)[0]?.n) ?? 0n)
  : 0;
await probe.$disconnect();

describe.skipIf(!embed.ok || !up || ingested < 500)("papersStyleFor against the ingested papers", { timeout: 240_000 }, () => {
  const db = new PrismaClient();
  const ctx = () => ({ db, embed: embed.ok ? embed.config : null! });
  afterAll(async () => {
    await db.$disconnect();
  });

  const OLYMPIADS = ["INPhO", "INChO", "INBO", "INAO", "INJSO", "INMO", "RMO", "PRMO", "IOQM", "NSEP", "NSEC", "NSEB", "NSEA", "NSEJS"];
  const ENTRANCE = ["JEE (Advanced)", "JEE (Main)", "NEET (UG)", "CBSE Class X", "CBSE Class XII"];

  it("level 6 physics for class 11: olympiad questions on the topic, in the class band, with test and year", async () => {
    const got = await papersStyleFor({ subject: "Physics", grade: 11, level: 6, topic: "Laws of motion: Newton's laws, friction, a block on an inclined plane", limit: 6 }, ctx());
    expect(got).toHaveLength(6);
    for (const g of got) {
      expect(OLYMPIADS).toContain(g.test);
      expect(g.paperKind).toBe("olympiad-paper");
      expect(["Physics", "Astronomy"]).toContain(g.subject);
      expect(g.year).toMatch(/^\d{4}/);
      expect(g.inBand).toBe(true);
    }
    expect(got.some((g) => /force|friction|block|incline|mass/i.test(g.text))).toBe(true);
    // At most two questions from one paper.
    const perDoc = new Map<string, number>();
    for (const g of got) perDoc.set(g.documentId, (perDoc.get(g.documentId) ?? 0) + 1);
    expect(Math.max(...perDoc.values())).toBeLessThanOrEqual(2);
  });

  it("level 5 mathematics for class 12: entrance and board questions, never an olympiad's", async () => {
    const got = await papersStyleFor({ subject: "Mathematics", grade: 12, level: 5, topic: "Integrals: definite integrals and their properties, area under a curve", limit: 6 }, ctx());
    expect(got.length).toBeGreaterThan(0);
    for (const g of got) {
      expect(ENTRANCE).toContain(g.test);
      expect(["entrance-paper", "board-sample-paper"]).toContain(g.paperKind);
      expect(g.subject).toBe("Mathematics");
    }
    expect(got.some((g) => /integra|∫|area/i.test(g.text))).toBe(true);
  });

  it("level 6 science for class 9: the junior olympiads first; a test asked for is the only test", async () => {
    const got = await papersStyleFor({ subject: "Science", grade: 9, level: 6, topic: "Atoms and molecules: atomic mass, mole concept, chemical formulae", limit: 4 }, ctx());
    expect(["INJSO", "NSEJS"]).toContain(got[0]?.test);
    expect(got[0]?.inBand).toBe(true);
    const only = await papersStyleFor({ subject: "Physics", grade: 12, level: 5, topic: "Current electricity: Ohm's law, resistors in series and parallel", test: "JEE (Advanced)", limit: 4 }, ctx());
    expect(only.length).toBeGreaterThan(0);
    expect(only.every((g) => g.test === "JEE (Advanced)" && g.subject === "Physics")).toBe(true);
  });
});
