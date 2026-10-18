/**
 * VIDURA PASS 2 (docs/plans/vidura.md; 17 October 2026): languages and personal answers. Against the database with a
 * FAKE MODEL and fake searches that record every call, on a ZZ school and ZZ people of this suite's own (and its own
 * HelpRendering and HelpEntry rows, removed afterwards). Proved here, each failing without its rule:
 *
 *   1. retrieval in the question's language: a Hindi or Marathi question is rendered into English from its STRIPPED
 *      words for the searches only (the help, the doors, the books), cached per normalised question, its cost counted;
 *      a failed rendering searches as before; the prompt and the classifier keep the person's own words; a rendered
 *      hit is put on the question's language's scale before the gate reads it;
 *   2. the guide in Hindi and Marathi: the units, the check of what the model wrote, the screen's own words, the
 *      speaker's review (the operator approves, edits, rejects, audited, a repeat a no-op; the content team reads and
 *      may not act), a rejected rendering out of the page cards at once, the suggestions from rendered headings;
 *   3. week and day offsets: the window in en, hi and mr in the school's calendar, the door parameters it fills, the
 *      rows it picks and counts, a record that cannot be narrowed to it said so;
 *   4. the composite answer: the figures, then where to see them, by code;
 *   5. "Explain this to me": the row read again through the person's own door and only that row kept; another
 *      child's or a role with no door for it reads nothing.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, composeAnswer, namedPage, openConversation, previewAnswer, type AssistantDeps } from "@/lib/assistant/service";
import { CURRICULUM_THRESHOLD, HELP_THRESHOLD } from "@/lib/assistant/config";
import { cleanRendering, mergeRendered, renderCache, renderForSearch, renderKey } from "@/lib/assistant/render";
import { checkGuideRendering, glossaryFor, glossaryIndex, guideUnits, pathsOf, renderedTitle, sourceKeyOf } from "@/lib/assistant/guide-render";
import { listRenderings, renderingCounts, reviewRendering } from "@/lib/assistant/renderings";
import { daysAhead, mondayOf, timeWindowOf, windowWords, withinOneWeek } from "@/lib/assistant/when";
import { callsFor, hintsOf, readableDoor, type DataContext } from "@/lib/assistant/doors";
import { runDoors, type ChosenDoor, type DataRun } from "@/lib/assistant/router";
import { carriesDays, rowInWindow, summariseDoor } from "@/lib/assistant/summary";
import { aboutCall, aboutRow } from "@/lib/assistant/explain";
import { helpForPage } from "@/lib/assistant-retrieval";
import { suggestionsFor } from "@/lib/assistant/suggestions";
import { assistantAboutSchema, assistantAskSchema } from "@edulink/contracts";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import type { CurriculumHit, HelpHit } from "@/lib/assistant-retrieval";
import type { ChatMessage, ChatOptions, ChatResult } from "@/lib/assistant-model";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", pupil: "", pupilM: "", parent: "", teacher: "", teacherM: "", operator: "", appAdmin: "", otherChild: "" };
const RENDER_KEYS: string[] = [];
const COMMIT = `zz-vidura2-${STAMP}`;

async function as(userId: string, role: string | null, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, role ? { schoolId, role: role as never } : {});
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

type Calls = { chat: { messages: ChatMessage[]; opts: ChatOptions }[]; help: { query: string; language: string; kinds?: string[] }[]; curriculum: string[]; render: string[]; runs: { door: string; url: string }[] };
/** A fake model and fake searches; `render` is the rendering the fake gives (null: it fails). */
function fake(opts: { help?: number; renderedHelp?: number; curriculum?: number; renderedCurriculum?: number; label?: string; answer?: string; render?: string | null; runs?: (c: ChosenDoor) => DataRun[] } = {}) {
  const calls: Calls = { chat: [], help: [], curriculum: [], render: [], runs: [] };
  const helpHit = (id: string, sim: number, over: Partial<HelpHit> = {}): HelpHit => ({ entryId: id, kind: "nav", title: "Fees", text: "Fees — page /parent/fees (PARENT).", pagePath: "/parent/fees", door: null, module: null, roles: [], language: "en", sourceFile: "nav", commit: "test", similarity: sim, vectorRank: 1, keywordRank: 1, score: 1, ...over });
  const hit = (sim: number): CurriculumHit => ({
    chunkId: "chunk-1", documentId: "doc-1", board: "NCERT", grade: "9", subject: "Science", book: "Exploration", edition: null, chapter: "Chapter 6", section: "6.6", headingPath: ["Chapter 6"],
    pageStart: 16, pageEnd: 16, text: "For every action there is an equal and opposite reaction.", language: "en", figureKeys: [], sourceUrl: "https://ncert.nic.in/textbook/pdf/iesc106.pdf", similarity: sim, vectorRank: 1, keywordRank: 1, score: 1,
    citation: { board: "NCERT", book: "Exploration", chapter: null, section: null, page: 16, documentId: "doc-1", chunkId: "chunk-1" },
  });
  const deps: AssistantDeps = {
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages, o): Promise<ChatResult> => {
      calls.chat.push({ messages, opts: o });
      const classifying = messages[0]!.content.startsWith("You classify");
      const base = { usage: { promptTokens: 100, completionTokens: classifying ? 1 : 20 }, tokensPerSecond: null, promptTokensPerSecond: null };
      if (classifying) {
        const isAnswer = messages[0]!.content.includes("an answer");
        const lastAnswer = [...calls.chat].reverse().find((c) => !c.messages[0]!.content.startsWith("You classify"));
        return { ...base, content: isAnswer ? (lastAnswer?.messages[0]!.content.includes("Vidura, the tutor") ? "CURRICULUM" : "PLATFORM") : (opts.label ?? "PLATFORM"), firstTokenLogprob: 0 };
      }
      return { ...base, content: opts.answer ?? "Open /parent/fees [1].", firstTokenLogprob: null, finishReason: "stop" };
    },
    searchHelp: async (q) => {
      calls.help.push({ query: q.query, language: q.language, kinds: q.kinds });
      if (q.kinds?.includes("door")) return [];
      const rendered = q.language === "en" && opts.render !== undefined && q.query.startsWith(opts.render ?? "\u0000");
      return [rendered ? helpHit("help-en", opts.renderedHelp ?? 0.2) : helpHit("help-own", opts.help ?? 0.2)];
    },
    searchCurriculum: async (q) => {
      calls.curriculum.push(q.query);
      return [hit(opts.render && q.query === opts.render ? (opts.renderedCurriculum ?? 0.2) : (opts.curriculum ?? 0.2))];
    },
    runDoors: async (input) => {
      for (const c of input.chosen) for (const call of c.calls) calls.runs.push({ door: c.door, url: call.url });
      return opts.runs ? input.chosen.flatMap(opts.runs) : [];
    },
    publish: () => {},
    now: () => new Date("2026-10-17T06:30:00Z"),
    render: async (stripped) => {
      calls.render.push(stripped);
      return opts.render ? { text: opts.render, tokens: 30, cached: false } : null;
    },
  };
  return { deps, calls };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Vidura Two ${STAMP}`, slug: `zz-vidura2-${STAMP}`, code: `ZV2${String(STAMP).slice(-6)}`, contactEmail: `zz-vidura2-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "ASSISTANT" } });
  const mk = (who: string, name: string, extra: Record<string, boolean> = {}) => db.user.create({ data: { name, email: `zz-vidura2-${who}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [pupil, parent, teacher, operator, appAdmin, other] = await Promise.all([mk("pupil", "ZZ Two Pupil"), mk("parent", "ZZ Two Parent"), mk("teacher", "ZZ Two Teacher"), mk("operator", "ZZ Two Operator", { isSuperuser: true }), mk("appadmin", "ZZ Two Content", { isAppAdmin: true }), mk("other", "ZZ Two Other Pupil")]);
  Object.assign(ids, { pupil: pupil.id, parent: parent.id, teacher: teacher.id, operator: operator.id, appAdmin: appAdmin.id });
  ids.pupilM = (await db.membership.create({ data: { userId: pupil.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", gradeLevel: "9", studentCode: `ZV2P${STAMP}` }, select: { id: true } })).id;
  ids.otherChild = (await db.membership.create({ data: { userId: other.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", gradeLevel: "9", studentCode: `ZV2O${STAMP}` }, select: { id: true } })).id;
  ids.teacherM = (await db.membership.create({ data: { userId: teacher.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const renderings = await db.helpRendering.findMany({ where: { sourceKey: { in: RENDER_KEYS } }, select: { id: true } });
  await db.auditLog.deleteMany({ where: { targetType: "HelpRendering", targetId: { in: renderings.map((r) => r.id) } } });
  await db.helpEntry.deleteMany({ where: { commit: COMMIT } });
  await db.helpRendering.deleteMany({ where: { sourceKey: { in: RENDER_KEYS } } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* 1. Retrieval in the question's language                                     */
/* -------------------------------------------------------------------------- */

describe("1. retrieval in the question's language", () => {
  it("renders a Hindi or Marathi question only, caches it per normalised question, and refuses what is no rendering", async () => {
    renderCache.clear();
    let asked = 0;
    const model = { chat: async (): Promise<ChatResult> => (asked++, { content: '"Where do I see my child\'s fees?"', usage: { promptTokens: 40, completionTokens: 9 }, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: null }) };
    expect(await renderForSearch("where are the fees", "en", model)).toBeNull();
    const first = await renderForSearch("मेरे बच्चे की फ़ीस कहाँ दिखेगी?", "hi", model);
    expect(first).toEqual({ text: "Where do I see my child's fees?", tokens: 49, cached: false });
    const again = await renderForSearch("  मेरे बच्चे की   फ़ीस कहाँ दिखेगी ", "hi", model);
    expect(again).toMatchObject({ cached: true, tokens: 0 });
    expect(asked).toBe(1);
    expect(renderKey("A  b?", "mr")).toBe("mr|a b");
    // An echo in Devanagari, a line break, a failure: no rendering, never a throw.
    expect(cleanRendering("मेरे बच्चे की फ़ीस")).toBeNull();
    expect(cleanRendering("first line\nsecond line")).toBeNull();
    expect(await renderForSearch("फ़ीस कब देनी है", "hi", { chat: async () => { throw new Error("fetch failed"); } })).toBeNull();
  });

  it("merges the rendering's hits on the question's language's scale, each entry once at its better score", () => {
    const h = (id: string, sim: number) => ({ entryId: id, similarity: sim });
    const merged = mergeRendered([h("a", 0.5), h("b", 0.4)], [h("b", 0.8), h("c", 0.7)], 0.05);
    expect(merged.map((m) => m.entryId).sort()).toEqual(["a", "b", "c"]);
    expect(merged.find((m) => m.entryId === "b")!.similarity).toBeCloseTo(0.75);
    expect(merged.find((m) => m.entryId === "c")!.similarity).toBeCloseTo(0.65);
    expect(mergeRendered([h("a", 0.5)], [], 0.05)).toEqual([h("a", 0.5)]);
  });

  it("searches the help, the doors and the books with the rendering, and keeps the person's words for the classifier and the prompt", async () => {
    const parent = await as(ids.parent, "PARENT", null);
    const conv = await openConversation(parent, { language: "hi" });
    // Below Hindi's help threshold as typed; the rendering meets English help at 0.8, which is 0.75 on Hindi's scale.
    const f = fake({ help: 0.3, render: "Where do I see my child's fees?", renderedHelp: 0.8, answer: "फ़ीस /parent/fees पर दिखती है [1]।" });
    const out = await ask(parent, conv.id, { text: "मेरे बच्चे की फ़ीस कहाँ दिखेगी?" }, f.deps);
    expect(out.answer.verdict).toBe("ANSWERED");
    expect(f.calls.render).toEqual(["मेरे बच्चे की फ़ीस कहाँ दिखेगी?"]);
    expect(f.calls.help.some((q) => q.language === "en" && q.query.startsWith("Where do I see") && !q.kinds)).toBe(true);
    expect(f.calls.help.some((q) => q.language === "en" && q.query.startsWith("Where do I see") && q.kinds?.includes("door"))).toBe(true);
    expect(f.calls.help.some((q) => q.language === "hi" && q.query.includes("फ़ीस"))).toBe(true);
    const classifier = f.calls.chat.find((c) => c.messages[0]!.content.startsWith("You classify a question"))!;
    expect(classifier.messages[1]!.content).toContain("फ़ीस");
    expect(classifier.messages[1]!.content).not.toContain("Where do I see");
    const prompt = f.calls.chat.find((c) => c.messages[0]!.content.startsWith("You are Vidura"))!;
    expect(prompt.messages[1]!.content).not.toContain("Where do I see");
    // The rendering is a model call of its own, counted.
    const row = await db.assistantMessage.findFirst({ where: { conversationId: conv.id, role: "ASSISTANT" }, select: { promptTokens: true } });
    expect(row!.promptTokens).toBeGreaterThanOrEqual(30);
  });

  it("a failed rendering searches as before: the question as typed, nothing in English, and the same thresholds", async () => {
    const parent = await as(ids.parent, "PARENT", null);
    const conv = await openConversation(parent, { language: "hi" });
    const f = fake({ help: 0.3, render: null });
    const out = await ask(parent, conv.id, { text: "मेरे बच्चे की फ़ीस कहाँ दिखेगी?" }, f.deps);
    expect(out.answer.verdict).toBe("OUT_OF_SCOPE");
    expect(f.calls.help.every((q) => q.language === "hi")).toBe(true);
  });

  it("reads the books with the rendering on English's scale: a pupil's Hindi topic question", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "hi" });
    const f = fake({ label: "CURRICULUM", curriculum: 0.3, render: "Explain Newton's third law", renderedCurriculum: CURRICULUM_THRESHOLD.en + 0.1, answer: "हर क्रिया की समान और विपरीत प्रतिक्रिया होती है [1]।" });
    const out = await ask(pupil, conv.id, { text: "न्यूटन का तीसरा नियम समझाइए" }, f.deps);
    expect(out.answer).toMatchObject({ verdict: "ANSWERED", chip: "LEARNING" });
    expect(f.calls.curriculum.every((q) => q === "Explain Newton's third law")).toBe(true);
    // A rendered best below English's threshold stays out of scope, though it is above Hindi's.
    const g = fake({ label: "CURRICULUM", curriculum: 0.1, render: "Explain Newton's third law", renderedCurriculum: CURRICULUM_THRESHOLD.en - 0.05 });
    expect(CURRICULUM_THRESHOLD.en - 0.05).toBeGreaterThan(CURRICULUM_THRESHOLD.hi);
    expect((await ask(pupil, conv.id, { text: "न्यूटन का तीसरा नियम समझाइए" }, g.deps)).answer.verdict).toBe("OUT_OF_SCOPE");
    expect(HELP_THRESHOLD.en).toBeGreaterThan(HELP_THRESHOLD.hi);
    // …but where the question as typed meets its book on Hindi's own scale, that search is kept (a rendering never loses a book).
    const h = fake({ label: "CURRICULUM", curriculum: CURRICULUM_THRESHOLD.hi + 0.05, render: "Explain Newton's third law", renderedCurriculum: CURRICULUM_THRESHOLD.en - 0.05, answer: "हर क्रिया की समान और विपरीत प्रतिक्रिया होती है [1]।" });
    expect((await ask(pupil, conv.id, { text: "न्यूटन का तीसरा नियम समझाइए" }, h.deps)).answer.verdict).toBe("ANSWERED");
    expect(h.calls.curriculum).toContain("न्यूटन का तीसरा नियम समझाइए");
  });

  it("tells the classifier when a short where-is question names one of the person's pages by its menu label", () => {
    const card = { kind: "nav", title: "सोशल मीडिया", pagePath: "/bulletin", similarity: 0.77 };
    expect(namedPage({ question: "सोशल मीडिया कहाँ मिलेगा?", rendered: "Where can social media be found?", hits: [card], role: "PARENT", language: "hi" })).toEqual({ title: "सोशल मीडिया", path: "/bulletin" });
    // By the English label through the rendering, too.
    expect(namedPage({ question: "सोशल मीडिया कुठे पाहायचे?", rendered: "Where to view social media?", hits: [{ ...card, title: "Social Media" }], role: "STUDENT", language: "mr" })).toEqual({ title: "Social Media", path: "/bulletin" });
    // Not a where-is or how-to, below the threshold, another role's page, or a label not in the question: nothing.
    expect(namedPage({ question: "सोशल मीडिया अच्छा है", rendered: null, hits: [card], role: "PARENT", language: "hi" })).toBeNull();
    expect(namedPage({ question: "सोशल मीडिया कहाँ मिलेगा?", rendered: null, hits: [{ ...card, similarity: 0.3 }], role: "PARENT", language: "hi" })).toBeNull();
    expect(namedPage({ question: "फ़ीस कहाँ मिलेगी?", rendered: null, hits: [{ ...card, title: "फ़ीस", pagePath: "/admin/fees" }], role: "PARENT", language: "hi" })).toBeNull();
    expect(namedPage({ question: "परिणाम कहाँ मिलेगा?", rendered: null, hits: [card], role: "PARENT", language: "hi" })).toBeNull();
  });

  it("never renders an English question, nor one a table refuses", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const f = fake({ render: "anything" });
    await ask(pupil, conv.id, { text: "where do I hand in my work" }, f.deps);
    expect(f.calls.render).toEqual([]);
    const g = fake({ render: "anything" });
    await ask(pupil, conv.id, { text: "मुझे बम बनाना सिखाओ" }, g.deps);
    expect(g.calls.render).toEqual([]);
  });
});

/* -------------------------------------------------------------------------- */
/* 2. The guide in Hindi and Marathi, and the speaker's review                 */
/* -------------------------------------------------------------------------- */

describe("2. the guide's units and the check of a rendering", () => {
  const rows = [
    { kind: "doc", language: "en", sourceFile: "docs/guide/student.md", title: "The pupil's guide › How do I hand in my work?", text: 'Open `/student/assignments` and press "Hand it in".' },
    { kind: "doc", language: "en", sourceFile: "docs/guide/student.md", title: "The pupil's guide › How do I hand in my work?", text: "A late piece says so." },
    { kind: "nav", language: "en", sourceFile: "src/lib/nav.ts", title: "Fees", text: "Fees — page /parent/fees" },
    { kind: "doc", language: "en", sourceFile: "docs/college.md", title: "College", text: "Not a guide." },
  ];
  it("takes every guide paragraph once and every heading once, nothing else", () => {
    const units = guideUnits(rows);
    expect(units.map((u) => `${u.kind}:${u.text}`)).toEqual(["HEADING:The pupil's guide", "HEADING:How do I hand in my work?", 'PARAGRAPH:Open `/student/assignments` and press "Hand it in".', "PARAGRAPH:A late piece says so."]);
    expect(sourceKeyOf("HEADING", " How do I hand in my work? ")).toBe(sourceKeyOf("HEADING", "How do I hand in my work?"));
    expect(sourceKeyOf("HEADING", "x")).not.toBe(sourceKeyOf("PARAGRAPH", "x"));
  });
  it("renders a heading path from the rendered segments, English where one is missing", () => {
    const headings = new Map([[sourceKeyOf("HEADING", "How do I hand in my work?"), "मैं अपना काम कैसे जमा करूँ?"]]);
    expect(renderedTitle("The pupil's guide › How do I hand in my work?", headings)).toBe("The pupil's guide › मैं अपना काम कैसे जमा करूँ?");
  });
  it("gives the model the screen's own words for a quoted label", () => {
    const index = glossaryIndex(en as never, hi as never);
    const label = en.viduraReview.saveEdit;
    const got = glossaryFor(`Press "${label}" and wait.`, index);
    expect(got).toEqual([[label, hi.viduraReview.saveEdit]]);
    expect(glossaryFor('Press "No such label anywhere".', index)).toEqual([]);
  });
  it("keeps a rendering only in Devanagari, with every page path of the English, one line for a heading", () => {
    const unit = { kind: "PARAGRAPH" as const, text: 'Open `/student/assignments` and press "Hand it in".' };
    expect(checkGuideRendering(unit, '`/student/assignments` खोलें और "जमा करें" दबाएँ।')).toBe('`/student/assignments` खोलें और "जमा करें" दबाएँ।');
    expect(checkGuideRendering(unit, '"जमा करें" दबाएँ।')).toBeNull();
    expect(checkGuideRendering(unit, "Open the assignments page and press Hand it in.")).toBeNull();
    expect(checkGuideRendering({ kind: "HEADING", text: "How do I hand in my work?" }, "मैं अपना काम\nकैसे जमा करूँ?")).toBeNull();
    expect(pathsOf("see /parent/fees, then /parent/fees/x and/or more")).toEqual(["/parent/fees", "/parent/fees/x"]);
  });
});

describe("2. the speaker's review on the operator's panel", () => {
  const make = async (kind: "HEADING" | "PARAGRAPH", english: string, text: string, language = "hi") => {
    const sourceKey = `zz-vidura2-${STAMP}-${RENDER_KEYS.length}`;
    RENDER_KEYS.push(sourceKey);
    return db.helpRendering.create({ data: { kind, language, sourceKey, sourceText: english, sourceFile: "docs/guide/student.md", text, modelText: text, model: "zz-test" } });
  };

  it("lets the content team read the queue and the operator act on it; anyone else is refused", async () => {
    await make("HEADING", "How do I hand in my work?", "मैं अपना काम कैसे जमा करूँ?");
    const content = await as(ids.appAdmin, null, null);
    const read = await listRenderings(content, { language: "hi", status: "UNREVIEWED" });
    expect(read.mayReview).toBe(false);
    expect(read.counts.hi.unreviewed).toBeGreaterThanOrEqual(1);
    const operator = await as(ids.operator, null, null);
    expect((await listRenderings(operator, { language: "hi" })).mayReview).toBe(true);
    const r = (await db.helpRendering.findFirst({ where: { sourceKey: RENDER_KEYS[0] } }))!;
    await expect(reviewRendering(content, r.id, { action: "APPROVE" })).rejects.toThrow();
    const teacher = await as(ids.teacher, "TEACHER", ids.school);
    await expect(listRenderings(teacher, {})).rejects.toThrow();
  });

  it("approves, corrects and rejects, audited once per change, a repeat a no-op; a correction is checked like the model's", async () => {
    const operator = await as(ids.operator, null, null);
    const r = await make("PARAGRAPH", "Open `/student/assignments`.", "`/student/assignments` खोलें।");
    const approved = await reviewRendering(operator, r.id, { action: "APPROVE" });
    expect(approved).toMatchObject({ status: "APPROVED", edited: false, reviewedBy: "ZZ Two Operator" });
    await reviewRendering(operator, r.id, { action: "APPROVE" });
    expect(await db.auditLog.count({ where: { targetId: r.id, action: "vidura.rendering.approve" } })).toBe(1);
    await expect(reviewRendering(operator, r.id, { action: "EDIT", text: "Open the page." })).rejects.toThrow("viduraReview.editRefused");
    await expect(reviewRendering(operator, r.id, { action: "EDIT", text: "असाइनमेंट पेज खोलें।" })).rejects.toThrow("viduraReview.editRefused");
    const edited = await reviewRendering(operator, r.id, { action: "EDIT", text: "  `/student/assignments` पेज खोलें। " });
    expect(edited).toMatchObject({ status: "APPROVED", edited: true, text: "`/student/assignments` पेज खोलें।", modelText: "`/student/assignments` खोलें।" });
    const rejected = await reviewRendering(operator, r.id, { action: "REJECT" });
    expect(rejected.status).toBe("REJECTED");
    const audit = await db.auditLog.findMany({ where: { targetId: r.id }, select: { action: true, schoolId: true, meta: true } });
    expect(audit.map((a) => a.action).sort()).toEqual(["vidura.rendering.approve", "vidura.rendering.edit", "vidura.rendering.reject"]);
    expect(audit.every((a) => a.schoolId === null && !JSON.stringify(a.meta).includes("खोलें"))).toBe(true);
    await expect(reviewRendering(operator, "zz-no-such-rendering", { action: "APPROVE" })).rejects.toThrow("viduraReview.notFound");
    const counts = await renderingCounts();
    expect(counts.hi.rejected).toBeGreaterThanOrEqual(1);
  });

  it("takes a rejected rendering out of retrieval at once, and reads an edited one in its new words", async () => {
    const page = `/zz-vidura2-${STAMP}`;
    const kept = await make("PARAGRAPH", `Open ${page}.`, `${page} खोलें।`);
    const gone = await make("PARAGRAPH", `Press ${page}.`, `${page} दबाएँ।`);
    await db.helpEntry.createMany({
      data: [
        { kind: "doc", roles: ["PARENT"], pagePath: page, title: "ZZ", text: `${page} खोलें।`, sourceFile: "docs/guide/guardian.md", commit: COMMIT, language: "hi", renderingId: kept.id },
        { kind: "doc", roles: ["PARENT"], pagePath: page, title: "ZZ", text: `${page} दबाएँ।`, sourceFile: "docs/guide/guardian.md", commit: COMMIT, language: "hi", renderingId: gone.id },
      ],
    });
    const before = await helpForPage({ page, language: "hi", role: "PARENT", limit: 10 }, { db });
    expect(before).toHaveLength(2);
    const operator = await as(ids.operator, null, null);
    await reviewRendering(operator, gone.id, { action: "REJECT" });
    await reviewRendering(operator, kept.id, { action: "EDIT", text: `${page} पेज खोलें।` });
    const after = await helpForPage({ page, language: "hi", role: "PARENT", limit: 10 }, { db });
    expect(after.map((h) => h.text)).toEqual([`${page} पेज खोलें।`]);
  });

  it("suggests the guide's own questions in Hindi from the rendered headings, never a rejected one", async () => {
    const operator = await as(ids.operator, null, null);
    const ok = await make("PARAGRAPH", "Open /parent/fees.", "/parent/fees खोलें।");
    const no = await make("PARAGRAPH", "Open /parent/attendance.", "/parent/attendance खोलें।");
    await db.helpEntry.createMany({
      data: [
        { kind: "doc", roles: ["PARENT"], pagePath: "/parent/fees", title: "अभिभावक की मार्गदर्शिका › ZZ फ़ीस कहाँ देखूँ?", text: "/parent/fees खोलें।", sourceFile: "docs/guide/guardian.md", commit: COMMIT, language: "hi", renderingId: ok.id },
        { kind: "doc", roles: ["PARENT"], pagePath: "/parent/attendance", title: "अभिभावक की मार्गदर्शिका › ZZ उपस्थिति कहाँ देखूँ?", text: "/parent/attendance खोलें।", sourceFile: "docs/guide/guardian.md", commit: COMMIT, language: "hi", renderingId: no.id },
      ],
    });
    await reviewRendering(operator, no.id, { action: "REJECT" });
    const list = await suggestionsFor({ role: "PARENT", language: "hi", page: "/parent/fees" }, Date.now() + STAMP);
    expect(list.map((s) => s.text)).not.toContain("ZZ उपस्थिति कहाँ देखूँ?");
    // Ours is the page's own question, first after "How do I use this page?", unless the index already holds rendered
    // questions for this page (they come in the index's order).
    const others = await db.helpEntry.count({ where: { kind: "doc", language: "hi", pagePath: "/parent/fees", roles: { has: "PARENT" }, sourceFile: { startsWith: "docs/guide/" }, commit: { not: COMMIT } } });
    if (others === 0) expect(list.map((s) => s.text)).toContain("ZZ फ़ीस कहाँ देखूँ?");
    expect(list.length).toBeLessThanOrEqual(3);
  });
});

/* -------------------------------------------------------------------------- */
/* 3. Week and day offsets                                                      */
/* -------------------------------------------------------------------------- */

describe("3. the window of days, in the school's own calendar", () => {
  // Saturday 17 October 2026.
  const today = "2026-10-17";
  const terms = [
    { id: "t1", n: 1, from: "2026-06-15", to: "2026-10-10" },
    { id: "t2", n: 2, from: "2026-10-12", to: "2027-03-31" },
  ];
  it("reads days, weeks, months and terms in English, Hindi and Marathi", () => {
    const w = (q: string) => {
      const got = timeWindowOf(q, today, terms);
      return got ? `${got.label} ${got.from} ${got.to}` : null;
    };
    expect(w("what do I have tomorrow")).toBe("TOMORROW 2026-10-18 2026-10-18");
    expect(w("my timetable for next week")).toBe("NEXT_WEEK 2026-10-19 2026-10-25");
    expect(w("how many days was I absent last week")).toBe("LAST_WEEK 2026-10-05 2026-10-11");
    expect(w("fees due this week")).toBe("THIS_WEEK 2026-10-12 2026-10-18");
    expect(w("attendance last month")).toBe("LAST_MONTH 2026-09-01 2026-09-30");
    expect(w("what is due next month")).toBe("NEXT_MONTH 2026-11-01 2026-11-30");
    expect(w("which course do I teach this term")).toBe("THIS_TERM 2026-10-12 2027-03-31");
    expect(w("my marks last term")).toBe("LAST_TERM 2026-06-15 2026-10-10");
    expect(w("what is on friday")).toBe("WEEKDAY 2026-10-23 2026-10-23");
    expect(w("what is on next monday")).toBe("WEEKDAY 2026-10-19 2026-10-19");
    expect(w("how many visitors came today")).toBe("TODAY 2026-10-17 2026-10-17");
    expect(w("कल मेरी कौन सी कक्षाएँ हैं?")).toBe("TOMORROW 2026-10-18 2026-10-18");
    expect(w("कल मेरा बच्चा स्कूल आया था क्या?")).toBe("YESTERDAY 2026-10-16 2026-10-16");
    expect(w("अगले हफ़्ते की समय-सारणी")).toBe("NEXT_WEEK 2026-10-19 2026-10-25");
    expect(w("पिछले महीने कितनी अनुपस्थिति थी?")).toBe("LAST_MONTH 2026-09-01 2026-09-30");
    expect(w("उद्या माझे कोणते तास आहेत?")).toBe("TOMORROW 2026-10-18 2026-10-18");
    expect(w("काल किती पाहुणे आले?")).toBe("YESTERDAY 2026-10-16 2026-10-16");
    expect(w("पुढच्या आठवड्यात कोणत्या परीक्षा आहेत?")).toBe("NEXT_WEEK 2026-10-19 2026-10-25");
    expect(w("मागील महिन्यात माझी उपस्थिती")).toBe("LAST_MONTH 2026-09-01 2026-09-30");
    expect(w("या सत्रात मी कोणता विषय शिकवतो?")).toBe("THIS_TERM 2026-10-12 2027-03-31");
    expect(w("सोमवारी काय आहे?")).toBe("WEEKDAY 2026-10-19 2026-10-19");
    expect(w("how do I mark the register")).toBeNull();
    expect(w("कलम 21 क्या है")).toBeNull();
    // No term recorded: "this term" names no window.
    expect(timeWindowOf("this term", today, [])).toBeNull();
  });
  it("knows its weeks and the days ahead", () => {
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
    expect(withinOneWeek({ from: "2026-10-19", to: "2026-10-25" })).toBe(true);
    expect(withinOneWeek({ from: "2026-10-01", to: "2026-10-31" })).toBe(false);
    expect(daysAhead({ from: "2026-10-19", to: "2026-10-25" }, today)).toBe(9);
    expect(daysAhead({ from: "2026-10-01", to: "2026-10-02" }, today)).toBeNull();
    expect(windowWords({ kind: "WEEK", label: "NEXT_WEEK", from: "2026-10-19", to: "2026-10-25" })).toBe("next week, Monday 19 October 2026 to Sunday 25 October 2026");
  });
  it("fills a door's day, week, days ahead, span and month from the window, and marks the call", () => {
    const NOW = new Date("2026-10-17T06:30:00Z");
    const cal = { today, terms };
    const ctx: DataContext = { role: "TEACHER", membershipId: "m1", children: [], childId: null, duties: [], now: NOW, calendar: cal };
    const day = callsFor(readableDoor("/api/v1/staff/attendance/classes", "TEACHER", [])!, ctx, hintsOf("which registers are left tomorrow", NOW, cal))!;
    expect(day[0]!.url).toContain("date=2026-10-18");
    expect(day[0]!.windowed).toBe(true);
    const week = callsFor(readableDoor("/api/v1/staff/timetable", "TEACHER", [])!, ctx, hintsOf("my timetable next week", NOW, cal))!;
    expect(week[0]!.url).toContain("week=2026-10-19");
    const month = callsFor(readableDoor("/api/v1/staff/attendance/me", "TEACHER", [])!, ctx, hintsOf("my attendance last month", NOW, cal))!;
    expect(month[0]).toMatchObject({ windowed: true });
    expect(month[0]!.url).toContain("month=2026-09");
    const parent: DataContext = { role: "PARENT", membershipId: null, children: [{ id: "c1", className: "9 A" }], childId: "c1", duties: [], now: NOW, calendar: cal };
    const agenda = callsFor(readableDoor("/api/v1/family/agenda", "PARENT", [])!, parent, hintsOf("what is due next week", NOW, cal))!;
    expect(agenda[0]!.url).toContain("days=9");
    // No window, no flag: a call is as before.
    expect(callsFor(readableDoor("/api/v1/staff/timetable", "TEACHER", [])!, ctx, hintsOf("my timetable", NOW, cal))![0]!.windowed).toBeUndefined();
    // The month hint comes from the school's today, not the UTC day.
    expect(hintsOf("tomorrow", new Date("2026-10-31T20:00:00Z"), { today: "2026-11-01", terms: [] }).month).toBe("2026-11");
  });
  it("picks and counts the rows that fall in the window, and says when a record keeps no days", async () => {
    const NOW = new Date("2026-10-17T06:30:00Z");
    const cal = { today, terms };
    const hints = hintsOf("what is due next week", NOW, cal);
    const rows = { items: [{ title: "Old", dueDateKey: "2026-10-02" }, { title: "Soon", dueDateKey: "2026-10-21" }, { title: "Later", dueDateKey: "2026-11-30" }] };
    expect(rowInWindow(rows.items[1]!, hints)).toBe(true);
    const s = summariseDoor(rows, { door: "/api/v1/family/agenda", hints, question: "what is due next week", firstNumber: 1 });
    expect(s.text).toContain("in next week, Monday 19 October 2026 to Sunday 25 October 2026: 1 row");
    expect(s.text.indexOf("Soon")).toBeLessThan(s.text.indexOf("Old"));
    expect(carriesDays({ count: 3, unread: 1 })).toBe(false);
    expect(carriesDays({ rows: [{ lastMessageAt: "2026-10-12T05:00:00Z" }] })).toBe(true);
    const ctx: DataContext = { role: "TEACHER", membershipId: "m1", children: [], childId: null, duties: [], now: NOW, calendar: cal };
    const chosen: ChosenDoor[] = [
      { door: "/api/v1/shared/inbox", similarity: 0.9, calls: [{ door: "/api/v1/shared/inbox", url: "/api/v1/shared/inbox", params: {}, child: null, windowed: false }], module: null, fromCache: false },
    ];
    const runs = await runDoors({ chosen, ctx, schoolId: "s", userId: `zz-v2-${STAMP}`, question: "messages next week", hints, lexicon: [], firstNumber: 1, conversationId: null, now: NOW, call: async () => ({ status: 200, raw: { unreadTotal: 2 } }), moduleOn: async () => true, featureOn: async () => true });
    expect(runs[0]!.window).toBe("UNSERVED");
    expect(runs[0]!.data).toContain("cannot be narrowed to those days");
    const served = await runDoors({ chosen, ctx, schoolId: "s", userId: `zz-v2b-${STAMP}`, question: "messages next week", hints, lexicon: [], firstNumber: 1, conversationId: null, now: NOW, call: async () => ({ status: 200, raw: { conversations: [{ id: "c", lastMessageAt: "2026-10-20T05:00:00Z", unread: 1 }] } }), moduleOn: async () => true, featureOn: async () => true });
    expect(served[0]!.window).toBe("SERVED");
  });
  it("puts the platform's sentence before an answer whose records could not be narrowed, in the reader's language", () => {
    const text = composeAnswer({ body: "You have 2 unread messages.", language: "en", examScope: false, window: { from: "2026-10-19", to: "2026-10-25" }, seePage: null });
    expect(text.startsWith("Your records here are not kept by date")).toBe(true);
    // The dates in the platform's own form for the reader's language (lib/dates formatDateKey).
    expect(text).toMatch(/19\D+10\D+2026|19 October 2026/);
    expect(composeAnswer({ body: "x", language: "hi", examScope: false, window: { from: "2026-10-18", to: "2026-10-18" }, seePage: null })).toMatch(/^यहाँ आपके रिकॉर्ड/);
  });
});

/* -------------------------------------------------------------------------- */
/* 4. The composite answer                                                     */
/* -------------------------------------------------------------------------- */

describe("4. the composite answer: the figures, then where to see them", () => {
  it("adds where to see it by code after the checked figures, once, in the reader's language", () => {
    expect(composeAnswer({ body: "₹16,000 is due.", language: "en", examScope: false, window: null, seePage: "/parent/fees" })).toBe("₹16,000 is due.\n\nWhere to see it: /parent/fees");
    expect(composeAnswer({ body: "₹16,000 is due on /parent/fees.", language: "en", examScope: false, window: null, seePage: "/parent/fees" })).toBe("₹16,000 is due on /parent/fees.");
    expect(composeAnswer({ body: "₹16,000 बाकी है।", language: "hi", examScope: false, window: null, seePage: "/parent/fees" })).toBe("₹16,000 बाकी है।\n\nकहाँ देखें: /parent/fees");
  });
  it("a data answer through the service carries the page and tells the model not to name it", async () => {
    const run: DataRun = { door: "/api/v1/fees/family", url: "/api/v1/fees/family", ok: true, status: 200, data: "child.totals.outstanding in rupees: ₹16,000", child: null, links: [], fromCache: false };
    const f = fake({ help: HELP_THRESHOLD.en + 0.1, answer: "₹16,000 is still due." });
    const out = await previewAnswer({ role: "PARENT", question: "how much fee is still due", toolRuns: [{ name: run.door, ok: true, status: 200, data: run.data, links: [] }] }, f.deps);
    expect(out).toMatchObject({ verdict: "ANSWERED", chip: "RECORDS" });
    expect(out.text).toBe("₹16,000 is still due.\n\nWhere to see it: /parent/fees");
    const prompt = f.calls.chat.find((c) => c.messages[0]!.content.startsWith("You are Vidura"))!;
    expect(prompt.messages[0]!.content).toContain("the platform adds that line after your answer itself");
  });
});

/* -------------------------------------------------------------------------- */
/* 5. "Explain this to me"                                                     */
/* -------------------------------------------------------------------------- */

describe("5. \"Explain this to me\"", () => {
  const fees = (demandId: string) => ({
    children: [],
    child: { studentMembershipId: "x", name: "Child", schoolId: "s", schoolName: "School", year: null, options: { online: false, upi: null, bankNote: null }, totals: { outstandingPaise: 1_600_000, overduePaise: 0, paidPaise: 0 }, payments: [], demands: [{ id: demandId, label: "Term 1 fee", dueDateKey: "2026-10-30", grossPaise: 2_000_000, concessionPaise: 400_000, netPaise: 1_600_000, paidPaise: 0, outstandingPaise: 1_600_000, status: "OPEN", overdue: false, lines: [] }, { id: "other-demand", label: "Bus fee", dueDateKey: "2026-11-30", grossPaise: 500_000, concessionPaise: 0, netPaise: 500_000, paidPaise: 0, outstandingPaise: 500_000, status: "OPEN", overdue: false, lines: [] }] },
  });

  it("knows which door a row is read from, by role, and picks only that row", () => {
    const kids = [{ id: "c1", className: "9 A" }];
    expect(aboutCall({ kind: "FEE_DEMAND", id: "d1", childId: "c1" }, "PARENT", kids)!.url).toBe("/api/v1/fees/family?childId=c1");
    expect(aboutCall({ kind: "FEE_DEMAND", id: "d1", childId: "not-mine" }, "PARENT", kids)).toBeNull();
    expect(aboutCall({ kind: "FEE_DEMAND", id: "d1" }, "STUDENT", [])).toBeNull();
    expect(aboutCall({ kind: "REPORT_LINE", id: "card1:s2" }, "STUDENT", [])!.url).toBe("/api/v1/family/report-cards/card1");
    expect(aboutCall({ kind: "REPORT_LINE", id: "card1:x" }, "STUDENT", [])).toBeNull();
    expect(aboutCall({ kind: "ATTENDANCE", id: "2026-10" }, "TEACHER", [])!.url).toBe("/api/v1/staff/attendance/me?month=2026-10");
    expect(aboutCall({ kind: "ATTENDANCE", id: "2026-10", childId: "c1" }, "PARENT", kids)!.url).toBe("/api/v1/family/attendance?childId=c1&month=2026-10");
    expect(aboutCall({ kind: "ATTENDANCE", id: "October" }, "TEACHER", [])).toBeNull();
    expect(aboutRow({ kind: "FEE_DEMAND", id: "d1" }, fees("d1"))).toMatchObject({ demand: { id: "d1", label: "Term 1 fee" } });
    expect(JSON.stringify(aboutRow({ kind: "FEE_DEMAND", id: "d1" }, fees("d1")))).not.toContain("Bus fee");
    expect(aboutRow({ kind: "FEE_DEMAND", id: "gone" }, fees("d1"))).toBeNull();
    const card = { items: [{ title: "Unit test 1", scoreMilli: 18000, pointsMilli: 20000 }], subjects: [{ subject: "Mathematics", percent: 88 }], title: "Term 1", overallPercent: 86 };
    expect(aboutRow({ kind: "REPORT_LINE", id: "c:0" }, card)).toMatchObject({ line: { title: "Unit test 1" }, card: { title: "Term 1", overallPercent: 86 } });
    expect(aboutRow({ kind: "REPORT_LINE", id: "c:s0" }, card)).toMatchObject({ line: { subject: "Mathematics" } });
    expect(aboutRow({ kind: "ATTENDANCE", id: "2026-09" }, { month: "2026-10", summary: {} })).toBeNull();
    expect(assistantAboutSchema.safeParse({ kind: "FEE_DEMAND", id: "../x" }).success).toBe(false);
    expect(assistantAskSchema.safeParse({ text: "x", about: { kind: "ATTENDANCE", id: "2026-10" } }).success).toBe(true);
  });

  it("reads the row again through the guardian's own door, keeps only it, and answers in My records", async () => {
    const parent = await as(ids.parent, "PARENT", null);
    const conv = await openConversation(parent, { language: "en" });
    const f = fake({ help: 0.1, answer: "This is the Term 1 fee: ₹20,000 asked, ₹4,000 taken off, ₹16,000 still due by 30 October 2026.", runs: (c) => [{ door: c.door, url: c.calls[0]!.url, ok: true, status: 200, data: "x", raw: fees("d1"), child: null, links: [], fromCache: false }] });
    const out = await ask(parent, conv.id, { text: "Explain this fee demand to me.", about: { kind: "FEE_DEMAND", id: "d1", childId: ids.pupilM } }, f.deps);
    expect(out.answer).toMatchObject({ verdict: "ANSWERED", chip: "RECORDS" });
    expect(f.calls.runs).toEqual([{ door: "/api/v1/fees/family", url: `/api/v1/fees/family?childId=${ids.pupilM}` }]);
    const prompt = f.calls.chat.find((c) => c.messages[0]!.content.startsWith("You are Vidura"))!;
    expect(prompt.messages[1]!.content).toContain('name="the fee demand the person asked about"');
    expect(prompt.messages[1]!.content).toContain("Term 1 fee");
    expect(prompt.messages[1]!.content).not.toContain("Bus fee");
    expect(prompt.messages[0]!.content).toContain("asked to have explained");
    // Not beside the page they are on: no "where to see it".
    expect(out.answer.text).not.toContain("Where to see it");
  });

  it("reads nothing for another child, and answers the question as asked", async () => {
    const parent = await as(ids.parent, "PARENT", null);
    const conv = await openConversation(parent, { language: "en" });
    const f = fake({ help: 0.1, runs: () => [] });
    const out = await ask(parent, conv.id, { text: "Explain this fee demand to me.", about: { kind: "FEE_DEMAND", id: "d1", childId: ids.otherChild } }, f.deps);
    expect(f.calls.runs.some((r) => r.url.includes(ids.otherChild))).toBe(false);
    expect(out.answer.verdict).toBe("OUT_OF_SCOPE");
  });
});
