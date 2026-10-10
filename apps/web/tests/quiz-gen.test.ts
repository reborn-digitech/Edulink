import { describe, expect, it } from "vitest";
import { chapterNameOf, chapterNumberOf, cosine, devanagariPunctuation, DUPLICATE_THRESHOLD, formChecks, groupChunks, ladderToBank, matchTopic, nearDuplicates, newTopicSlug, numericForm, perLevelTargets, slugify, solverVerdict, stripListMarker, wordJaccard } from "../scripts/quiz-gen/checks";
import { critiqueOutcome, draftSchemaFor, fromDraft } from "../scripts/quiz-gen/pipeline";
import { glossaryLinesFor, subjectCodeOf } from "../scripts/quiz-gen/select";
import { DRAFT_SCHEMA, FIGURE_KINDS, LEVELS, STAMP_ROLES, type DraftItem } from "../scripts/quiz-gen/shape";
import { fileNameFor, sourceLine } from "../scripts/quiz-gen/cli";
import { createVerifier, isStamped, questionErrors, type Question, type TopicFile } from "../scripts/verify-quiz";
import { QUIZ_LEVELS } from "../src/lib/quiz";

/**
 * The quiz bank generator's pure parts (docs/plans/assistant-and-quiz-bank.md, Phase 1 step 1,
 * 10 October 2026): the form checks, the ladder mapping, the solver's verdicts, the duplicate
 * threshold, the JSON shape, the chapter-to-topic match and the verifier's rules for a generated
 * batch. No model and no database: everything here is a rule the pipeline applies to what the
 * model said.
 */

const good = {
  stem: "A wire carrying a current is placed over a compass. What happens to the needle?",
  choices: ["It deflects", "It stays still", "It spins without stopping", "It points to the wire"],
  answerIndex: 0,
  solution: "A current produces a magnetic field around the wire, and the field turns the needle; it does not keep it spinning and it does not point the needle at the wire. A needle that stays still would mean no current flows.",
  checkExpr: null,
  distractorReason: [null, "thinks a compass reacts only to a magnet, not to a current", "confuses a steady deflection with continuous motion", "thinks the needle is attracted to the wire itself"],
  figure: null,
  imageAlt: null,
};

describe("the ladder", () => {
  it("is the bank's own six levels, name for name", () => {
    expect(QUIZ_LEVELS.map((l) => l.key)).toEqual(["RECALL", "UNDERSTAND", "APPLY", "ANALYSE", "COMPETITIVE", "OLYMPIAD"]);
    for (const l of LEVELS) expect(ladderToBank(l)).toBe(l);
    expect(() => ladderToBank(7)).toThrow(/ladder/);
    expect(() => ladderToBank(0)).toThrow(/ladder/);
  });
  it("spreads a limit over the rungs, the remainder to the low rungs, and never past the per-level ask", () => {
    expect(perLevelTargets(0, 4)).toEqual({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 });
    expect(perLevelTargets(8, 4)).toEqual({ 1: 2, 2: 2, 3: 1, 4: 1, 5: 1, 6: 1 });
    expect(perLevelTargets(60, 4)).toEqual({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 4, 6: 4 });
  });
});

describe("form checks", () => {
  it("pass a well-formed item", () => {
    expect(formChecks(good)).toEqual([]);
  });
  it("refuse a catch-all option", () => {
    expect(formChecks({ ...good, choices: ["It deflects", "All of the above", "It spins", "It points to the wire"] })).toEqual(expect.arrayContaining([expect.stringMatching(/catch-all/)]));
    expect(formChecks({ ...good, choices: ["It deflects", "None of these", "It spins", "It points"] })).toEqual(expect.arrayContaining([expect.stringMatching(/catch-all/)]));
    expect(formChecks({ ...good, choices: ["It deflects", "Both (a) and (c)", "It spins", "It points"] })).toEqual(expect.arrayContaining([expect.stringMatching(/catch-all/)]));
  });
  it("refuse an option that repeats the stem's wording", () => {
    const stem = "Which force opposes the motion of an object when it moves over a surface?";
    const out = formChecks({ ...good, stem, choices: ["the force that opposes the motion of an object", "gravity", "magnetism", "the electrostatic pull"] });
    expect(out).toEqual(expect.arrayContaining([expect.stringMatching(/repeats the stem/)]));
  });
  it("refuse two distractors alike and a key that stands out by length", () => {
    expect(formChecks({ ...good, choices: ["It deflects", "The needle does not move at all", "The needle does not move at all.", "It points"] })).toEqual(expect.arrayContaining([expect.stringMatching(/same thing|are the same/)]));
    const long = "It deflects, because the current in the wire produces a magnetic field around it which turns the needle";
    expect(formChecks({ ...good, choices: [long, "It stays still", "It spins", "It points"] })).toEqual(expect.arrayContaining([expect.stringMatching(/far longer/)]));
  });
  it("hold numeric options to one unit and one precision, and all numeric or none", () => {
    const num = { ...good, stem: "A 2 kg mass is pushed with 6 N. What is its acceleration?", distractorReason: [null, "divides the other way", "multiplies", "adds"] };
    expect(formChecks({ ...num, choices: ["3 m/s²", "0.33 m/s²", "12 m/s²", "8 m/s²"] })).toEqual(expect.arrayContaining([expect.stringMatching(/precisions/)]));
    expect(formChecks({ ...num, choices: ["3 m/s²", "3 cm/s²", "12 m/s²", "8 m/s²"] })).toEqual(expect.arrayContaining([expect.stringMatching(/more than one unit/)]));
    expect(formChecks({ ...num, choices: ["3 m/s²", "it stops", "12 m/s²", "8 m/s²"] })).toEqual(expect.arrayContaining([expect.stringMatching(/mix numbers and words/)]));
    expect(formChecks({ ...num, choices: ["3 m/s²", "4 m/s²", "12 m/s²", "8 m/s²"] })).toEqual([]);
    expect(numericForm("−3.50 kg")).toEqual({ value: -3.5, unit: "kg", decimals: 2 });
    expect(numericForm("about 3")).toBeNull();
  });
  it("prove a checkExpr the bank's way: an operator, evaluated, landing on the key", () => {
    const num = { ...good, stem: "6 N on 2 kg: the acceleration?", distractorReason: [null, "adds the numbers", "multiplies instead of dividing", "subtracts"], choices: ["3 m/s²", "4 m/s²", "12 m/s²", "8 m/s²"] };
    expect(formChecks({ ...num, checkExpr: "6/2" })).toEqual([]);
    expect(formChecks({ ...num, checkExpr: "3" })).toEqual(expect.arrayContaining([expect.stringMatching(/bare literal/)]));
    expect(formChecks({ ...num, checkExpr: "6*2" })).toEqual(expect.arrayContaining([expect.stringMatching(/ARITHMETIC MISMATCH/)]));
  });
  it("want a reason per distractor, none at the key, and an alt with every figure", () => {
    expect(formChecks({ ...good, distractorReason: ["x", "a", "b", "c"] })).toEqual(expect.arrayContaining([expect.stringMatching(/key carries/)]));
    expect(formChecks({ ...good, distractorReason: [null, "a", null, "c"] })).toEqual(expect.arrayContaining([expect.stringMatching(/distractor 2 has no reason/)]));
    expect(formChecks({ ...good, figure: { kind: "circuit", spec: { components: [] } }, imageAlt: null })).toEqual(expect.arrayContaining([expect.stringMatching(/without imageAlt/)]));
    expect(formChecks({ ...good, figure: { kind: "photo" as never, spec: { a: 1 } }, imageAlt: "a photo" })).toEqual(expect.arrayContaining([expect.stringMatching(/not one the figure builder draws/)]));
    expect(formChecks({ ...good, figure: { kind: "circuit", spec: { components: [{ type: "cell", id: "C1" }] } }, imageAlt: "A cell, a switch and a bulb in series" })).toEqual([]);
    expect(formChecks({ ...good, imageAlt: "stray" })).toEqual(expect.arrayContaining([expect.stringMatching(/without a figure/)]));
  });
  it("refuse a stem or solution that speaks of the passage the pupil never sees", () => {
    expect(formChecks({ ...good, stem: "According to the passage, what happens to the needle?" })).toEqual(expect.arrayContaining([expect.stringMatching(/stem refers to the passage/)]));
    expect(formChecks({ ...good, solution: "The text above says the needle deflects, and the other options contradict what is described in the passage." })).toEqual(expect.arrayContaining([expect.stringMatching(/solution refers to the passage/)]));
  });
  it("refuse a distractor reason that is not a one-line misconception", () => {
    expect(formChecks({ ...good, distractorReason: [null, "Correct answer: buoyant force is the upward force on an object in a fluid as defined in the passage", "confuses mass with weight", "adds the denominators"] })).toEqual(expect.arrayContaining([expect.stringMatching(/distractor 1's reason is not a one-line misconception/)]));
    expect(formChecks({ ...good, distractorReason: [null, "x".repeat(221), "confuses mass with weight", "adds the denominators"] })).toEqual(expect.arrayContaining([expect.stringMatching(/distractor 1's reason/)]));
  });
  it("end Hindi and Marathi sentences the way the dictionaries do", () => {
    expect(devanagariPunctuation("यह क्या है?।", "hi")).toBe("यह क्या है?");
    expect(devanagariPunctuation("बल एक धक्का है।", "hi")).toBe("बल एक धक्का है।");
    expect(devanagariPunctuation("बल हा एक धक्का असतो।", "mr")).toBe("बल हा एक धक्का असतो.");
    expect(devanagariPunctuation("हे काय आहे? ।", "mr")).toBe("हे काय आहे?");
  });
  it("strip a list marker a translation copied", () => {
    expect(stripListMarker("0: यह विक्षेपित हो जाती है")).toBe("यह विक्षेपित हो जाती है");
    expect(stripListMarker("(b) It deflects")).toBe("It deflects");
    expect(stripListMarker("- It deflects")).toBe("It deflects");
    expect(stripListMarker("3 m/s²")).toBe("3 m/s²");
    expect(stripListMarker("2. Health")).toBe("Health");
  });
  it("measure word overlap", () => {
    expect(wordJaccard("the needle turns", "the needle turns")).toBe(1);
    expect(wordJaccard("red", "blue")).toBe(0);
  });
});

describe("the blind solver's verdict", () => {
  it("rejects an item whose distractor beats the key", () => {
    const v = solverVerdict(3, 0, [1, 1, 1, 0, 2]);
    expect(v.reject).toMatch(/option 1 3 times against the key's 1/);
  });
  it("flags a level 1–2 item missed twice, not once", () => {
    expect(solverVerdict(1, 0, [0, 0, 0, 0, 1]).levelFlag).toBeNull();
    expect(solverVerdict(2, 0, [0, 0, 0, 1, 2]).levelFlag).toMatch(/missed it 2 of 5/);
  });
  it("flags a level 4–6 item the solver always gets right, and lists unpicked distractors", () => {
    const v = solverVerdict(5, 2, [2, 2, 2, 2, 2]);
    expect(v.levelFlag).toMatch(/right 5 of 5/);
    expect(v.unpicked).toEqual([0, 1, 3]);
    expect(solverVerdict(4, 2, [2, 2, 2, 2, 0]).levelFlag).toBeNull();
    expect(solverVerdict(4, 2, [2, 2, 2, 2, 0]).unpicked).toEqual([1, 3]);
  });
  it("ignores an answer outside 0–3", () => {
    expect(solverVerdict(1, 0, [0, 0, 7, -1, 0]).correct).toBe(3);
  });
});

describe("the critique's outcome", () => {
  const verdict = { correctIndex: 0, oneAnswer: true, solutionSound: true, note: "fine", distractors: [{ index: 1, isWrong: true, reasonIsRealMisconception: true }, { index: 2, isWrong: true, reasonIsRealMisconception: false }, { index: 3, isWrong: true, reasonIsRealMisconception: true }] };
  it("passes with the weak reasons listed for the solver pass", () => {
    expect(critiqueOutcome({ answerIndex: 0 }, verdict)).toEqual({ reject: null, weak: [2] });
  });
  it("rejects a key the critic disagrees with, a second defensible answer, an unsound solution or a distractor that is not wrong", () => {
    expect(critiqueOutcome({ answerIndex: 1 }, verdict).reject).toMatch(/finds option 0 correct, the key is 1/);
    expect(critiqueOutcome({ answerIndex: 0 }, { ...verdict, oneAnswer: false }).reject).toMatch(/more than one defensible/);
    expect(critiqueOutcome({ answerIndex: 0 }, { ...verdict, solutionSound: false }).reject).toMatch(/not sound/);
    expect(critiqueOutcome({ answerIndex: 0 }, { ...verdict, distractors: [{ index: 1, isWrong: false, reasonIsRealMisconception: true }, verdict.distractors[1]!, verdict.distractors[2]!] }).reject).toMatch(/option 1 is not wrong/);
  });
});

describe("near-duplicates", () => {
  const a = [1, 0, 0];
  const b = [0.95, 0.31, 0]; // cosine 0.95 with a
  const c = [0, 1, 0];
  it("drop a batch item too close to a served question, and the later of a close pair in the batch", () => {
    expect(cosine(a, b)).toBeGreaterThan(DUPLICATE_THRESHOLD);
    expect(nearDuplicates([b, c], [{ id: "q1", vector: a }])).toEqual([{ index: 0, against: "bank:q1", similarity: expect.closeTo(0.95, 2) }]);
    expect(nearDuplicates([a, c, b], [])).toEqual([{ index: 2, against: "batch:0", similarity: expect.closeTo(0.95, 2) }]);
    expect(nearDuplicates([a, c], [])).toEqual([]);
  });
  it("keep the threshold where the plan set it", () => {
    expect(DUPLICATE_THRESHOLD).toBe(0.9);
    expect(nearDuplicates([[0.89, 0.46, 0]], [{ id: "q", vector: a }])).toEqual([]);
  });
});

describe("chunk groups and the topic match", () => {
  it("fold consecutive chunks under the token budget, in order", () => {
    const chunks = [3, 1, 2, 0].map((o) => ({ ordinal: o, tokens: 600, text: "", figureKeys: [] }));
    const groups = groupChunks(chunks, 1300);
    expect(groups.map((g) => g.map((c) => c.ordinal))).toEqual([[0, 1], [2, 3]]);
    expect(groupChunks([{ ordinal: 0, tokens: 5000, text: "", figureKeys: [] }], 1800)).toHaveLength(1);
  });
  it("read a chapter's number and name from the bank's and the corpus's labels", () => {
    expect(chapterNumberOf("Chapter 4 — Materials: Metals and Non-Metals")).toBe(4);
    expect(chapterNumberOf("Chapter 4: — Electricity: Magnetic and Heating Effects")).toBe(4);
    expect(chapterNumberOf("3. Force and Pressure")).toBe(3);
    expect(chapterNumberOf("Force and Pressure")).toBeNull();
    expect(chapterNameOf("Chapter 4: — Electricity: Magnetic and Heating Effects")).toBe("Electricity: Magnetic and Heating Effects");
    expect(chapterNameOf("3. Force and Pressure")).toBe("Force and Pressure");
  });
  it("match an existing topic by number AND name, never by number alone", () => {
    const topics = [
      { slug: "science-8-metals-non-metals", chapter: "Chapter 4 — Materials: Metals and Non-Metals", name: "Metals and Non-Metals", position: 4, retired: false },
      { slug: "science-8-force-pressure", chapter: "Chapter 11 — Force and Pressure", name: "Force and Pressure", position: 11, retired: false },
      { slug: "old-force", chapter: "Chapter 11 — Force and Pressure", name: "Force and Pressure", position: 11, retired: true },
    ];
    expect(matchTopic(topics, 4, "Materials: Metals and Non-Metals")?.slug).toBe("science-8-metals-non-metals");
    expect(matchTopic(topics, 4, "Electricity: Magnetic and Heating Effects")).toBeNull();
    expect(matchTopic(topics, 3, "Force and Pressure")).toBeNull();
    expect(matchTopic(topics, 11, "Force and Pressure")?.slug).toBe("science-8-force-pressure");
  });
  it("name a new topic the bank's way for NCERT and with the board's prefix otherwise", () => {
    expect(newTopicSlug("NCERT", "SCIENCE", 8, "Electricity: Magnetic and Heating Effects")).toBe("science-8-electricity-magnetic-and-heating-effects");
    expect(newTopicSlug("Balbharati", "SCIENCE", 8, "Force and Pressure")).toBe("balbharati-science-8-force-and-pressure");
    expect(slugify("  Acid & Base! ")).toBe("acid-base");
    expect(subjectCodeOf("Science")).toBe("SCIENCE");
    expect(subjectCodeOf("mathematics")).toBe("MATHS");
    expect(() => subjectCodeOf("Sanskrit")).toThrow(/no subject code/);
  });
  it("names the file and the source line as the brief asks", () => {
    const chapter = { board: "NCERT", classLevel: 8, subjectCode: "SCIENCE", subject: "Science", chapterNumber: 4, edition: "2024 edition" };
    expect(fileNameFor(chapter)).toBe("ncert-8-science-4");
    expect(sourceLine(chapter)).toBe("generated against NCERT Science, Class 8, chapter 4 (2024 edition)");
  });
  it("pulls only the glossary lines whose head word the item uses", () => {
    const glossary = [{ text: "Demand — माँग\nSupply: आपूर्ति\nInflation – मुद्रास्फीति" }];
    expect(glossaryLinesFor(glossary, { stem: "What happens to demand when the price rises?", choices: ["supply falls", "x", "y", "z"] })).toEqual(["Demand — माँग", "Supply: आपूर्ति"]);
  });
});

describe("the JSON shape", () => {
  const draft: DraftItem = {
    difficulty: 2,
    stem: "Which of these is a non-contact force?",
    options: ["Friction", "Muscular force", "Magnetic force", "Tension"],
    answerIndex: 2,
    solution: "A magnet pulls iron without touching it, so the force acts at a distance; friction, muscular force and tension all need contact.",
    checkExpr: "",
    figure: { kind: "", spec: {}, labels: {} },
    figureAlt: "",
    distractorReasons: ["thinks friction acts at a distance", "thinks any force a person applies is non-contact", "confuses tension with attraction"],
  };
  const group = [{ id: "c", ordinal: 3, headingPath: ["Chapter 3", "3.1"], pageStart: 24, pageEnd: 25, text: "…", tokens: 500, figureKeys: [] }];
  it("spreads the three reasons onto four slots with null at the key, reads the figure, and keeps the sources", () => {
    const w = fromDraft(draft, group, "balbharati/8/science/803020012.pdf", "k");
    expect("error" in w).toBe(false);
    if ("error" in w) return;
    expect(w.distractorReason).toEqual(["thinks friction acts at a distance", "thinks any force a person applies is non-contact", null, "confuses tension with attraction"]);
    expect(w.figure).toBeNull();
    expect(w.imageAlt).toBeNull();
    expect(w.checkExpr).toBeNull();
    expect(w.sources).toEqual([{ document: "balbharati/8/science/803020012.pdf", ordinal: 3, pageStart: 24, pageEnd: 25, headingPath: ["Chapter 3", "3.1"] }]);
    const withFigure = fromDraft({ ...draft, figure: { kind: "circuit", spec: { nodes: [{ id: "a", x: 0, y: 0 }] }, labels: { bulbA: { en: "bulb A" } } }, figureAlt: "A cell and a bulb" }, group, "d", "k");
    if ("error" in withFigure) throw new Error(withFigure.error);
    expect(withFigure.figure).toEqual({ kind: "circuit", spec: { nodes: [{ id: "a", x: 0, y: 0 }] }, labels: { bulbA: { en: "bulb A" } } });
    expect(withFigure.imageAlt).toBe("A cell and a bulb");
  });
  it("refuses a draft off the ladder or with the wrong counts", () => {
    expect(fromDraft({ ...draft, difficulty: 9 }, group, "d", "k")).toEqual({ error: expect.stringMatching(/ladder/) });
    expect(fromDraft({ ...draft, options: ["a", "b"] }, group, "d", "k")).toEqual({ error: "not four options" });
  });
  it("bounds the drafting array to the count asked for", () => {
    const s = draftSchemaFor(3) as { properties: { items: { minItems: number; maxItems: number } } };
    expect([s.properties.items.minItems, s.properties.items.maxItems]).toEqual([3, 3]);
    expect((draftSchemaFor(40) as typeof s).properties.items.maxItems).toBe(14);
  });
  it("constrains the model to the figure kinds and the bank's option count", () => {
    const item = DRAFT_SCHEMA.properties.items.items;
    expect(item.properties.options.minItems).toBe(4);
    expect(item.properties.options.maxItems).toBe(4);
    expect(item.properties.figure.properties.kind.enum).toEqual(["", ...FIGURE_KINDS]);
    expect(FIGURE_KINDS).toContain("pie");
    expect(item.properties.distractorReasons.minItems).toBe(3);
    expect(STAMP_ROLES).toEqual(["APP_ADMIN", "OPERATOR"]);
  });
});

describe("the verifier on a generated batch", () => {
  const question = (over: Partial<Question> = {}): Question => ({
    difficulty: 1,
    stem: "Which of these is a non-contact force?",
    choices: ["Friction", "Muscular force", "Magnetic force", "Tension"],
    answerIndex: 2,
    solution: "A magnet pulls iron without touching it, so the force acts at a distance; the others need contact.",
    checkExpr: null,
    ...over,
  });
  const topic = (questions: Question[], slug = "science-8-force-pressure"): TopicFile => ({ subject: "SCIENCE", classLevel: 8, chapter: "Chapter 11 — Force and Pressure", name: "Force and Pressure", slug, source: "generated against NCERT Science, Class 8, chapter 11", licence: "Original questions written for Shalaghar · CC BY-SA 4.0", board: "NCERT" /* quiz-board (11 Oct 2026): a generated batch names its board */, questions });

  it("checks a stamp's shape and reads one stamp as served", () => {
    expect(questionErrors(question({ stamps: [] }))).toEqual([]);
    expect(questionErrors(question({ stamps: [{ reviewer: "u1", role: "TEACHER", at: "2026-10-11T00:00:00Z" }] }))).toEqual([expect.stringMatching(/role "TEACHER"/)]);
    expect(questionErrors(question({ stamps: [{ reviewer: "", role: "APP_ADMIN", at: "nope" }] }))).toEqual(expect.arrayContaining([expect.stringMatching(/no reviewer/), expect.stringMatching(/readable time/)]));
    expect(isStamped(question({ stamps: [] }))).toBe(false);
    expect(isStamped(question({ stamps: [{ reviewer: "u1", role: "OPERATOR", at: "2026-10-11T00:00:00Z" }] }))).toBe(true);
    expect(isStamped(question({ stamps: [{ reviewer: "u1", role: "TEACHER", at: "2026-10-11T00:00:00Z" }] }))).toBe(false);
  });
  it("wants an alt with a figure or an image, a figure the contract accepts, and an image file that exists", () => {
    const circuit = {
      kind: "circuit",
      spec: { nodes: [{ id: "a", x: 0, y: 0 }, { id: "b", x: 4, y: 0 }, { id: "c", x: 4, y: 3 }, { id: "d", x: 0, y: 3 }], parts: [{ type: "cell", from: "a", to: "b" }, { type: "bulb", from: "b", to: "c" }, { type: "switchOpen", from: "c", to: "d" }, { type: "wire", from: "d", to: "a" }] },
      labels: {},
    };
    expect(questionErrors(question({ figure: circuit }))).toEqual([expect.stringMatching(/figure is set without imageAlt/)]);
    expect(questionErrors(question({ figure: circuit, imageAlt: "a circuit" }))).toEqual([]);
    expect(questionErrors(question({ figure: { kind: "circuit", spec: { a: 1 } }, imageAlt: "a circuit" }))).toEqual([expect.stringMatching(/figure spec refused/)]);
    expect(questionErrors(question({ imageKey: "x.png", imageAlt: "a drawing" }), { figureExists: () => true })).toEqual([]);
    expect(questionErrors(question({ imageKey: "x.png", imageAlt: "a drawing" }), { figureExists: () => false })).toEqual([expect.stringMatching(/names no file/)]);
    expect(questionErrors(question({ imageKey: "../x.png", imageAlt: "a" }), { figureExists: () => true })).toEqual([expect.stringMatching(/names no file/)]);
    expect(questionErrors(question({ imageAlt: "stray" }))).toEqual([expect.stringMatching(/without an imageKey or a figure/)]);
  });
  it("lets a batch share an authored topic's slug, warns on its missing rungs, and still refuses two batches on one slug", () => {
    const v = createVerifier();
    const full = LEVELS.map((l) => question({ difficulty: l, stem: `authored ${l}` }));
    v.verifyTopic("science-8-force-pressure.json", topic(full));
    v.verifyTopic("generated/ncert-8-science-11.json", topic([question({ stem: "generated one" })]), { generated: true });
    v.verifyTopic("generated/ncert-8-science-11-again.json", topic([question({ stem: "generated two" })]), { generated: true });
    const r = v.report();
    expect(r.errors).toEqual([expect.stringMatching(/again\.json: slug "science-8-force-pressure" is already used/)]);
    expect(r.warnings.filter((w) => /generated batch has nothing at level/.test(w))).toHaveLength(10);
    expect(r.files).toBe(1);
    expect(r.generatedFiles).toBe(2);
  });
  it("still fails an authored file with a hole in its ladder and a duplicate stem anywhere", () => {
    const v = createVerifier();
    v.verifyTopic("a.json", topic([question({ difficulty: 1 })], "a"));
    v.verifyTopic("generated/b.json", topic([question({ difficulty: 1 })], "b"), { generated: true });
    const r = v.report();
    expect(r.errors).toEqual(expect.arrayContaining([expect.stringMatching(/a\.json: has nothing at level 2/), expect.stringMatching(/generated\/b\.json\[0\]: duplicate of a question already in a\.json/)]));
  });
});
