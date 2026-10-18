/**
 * VIDURA PASS 1 (docs/plans/vidura.md; 17 October 2026), against the database with a FAKE MODEL and fake searches that
 * record every call, on a ZZ school of this suite's own. Proved here, each failing without its rule:
 *
 *   - the three modes: the status door names the person's, the answer wears its chip (kept in the row and read back),
 *     a person's pick re-routes the next question only between the scopes the gate allows — never past REFUSE, a
 *     table, a threshold or the tutor's roles;
 *   - the length rule: the cap by the question's kind and language, a hint keeping Phase B's; an answer stopped at its
 *     cap is marked cut and "go on" continues it from the parts so far, as one more question of the day, at most
 *     GO_ON_MAX times;
 *   - restricted Markdown narrowed before the answer gate;
 *   - page awareness: a question pointing at the page reads that page's card first; any other question, or another
 *     role's page, reads nothing of it;
 *   - "Ask a person": the class teacher for a pupil and a guardian, the head for the office, the office for staff;
 *     offered on a fixed sentence and a not-sure answer, never on the counsellor route;
 *   - the suggested questions for an empty drawer;
 *   - the pure rules (vidura.ts, the prompt's kinds, the caps).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, assistantStatus, assistantSuggestions, getConversation, openConversation, type AssistantDeps } from "@/lib/assistant/service";
import { ANSWER_TOKENS, CURRICULUM_THRESHOLD, GO_ON_MAX, HELP_THRESHOLD, MAX_ANSWER_TOKENS, answerTokenCap } from "@/lib/assistant/config";
import { GO_ON_INSTRUCTION, answerKindFor, helpKind } from "@/lib/assistant/prompt";
import { gateQuestion } from "@/lib/assistant/gate";
import { policyFor } from "@/lib/assistant/policy";
import { asksAboutThisPage, asksToGoOn, chipOf, helpChip, jobOf, modesFor, offersAskPerson, preferFor, saysNotSure } from "@/lib/assistant/vidura";
import { guideQuestion } from "@/lib/assistant/suggestions";
import { doorsShownOn } from "@/lib/assistant/data";
import { pageIsRoles } from "@/lib/assistant/pages";
import { ENDPOINTS } from "@/lib/api-catalog";
import { permits } from "@/lib/api-catalog/types";
import { ROLES } from "@/lib/constants";
import type { CurriculumHit, HelpHit } from "@/lib/assistant-retrieval";
import type { ChatMessage, ChatOptions, ChatResult } from "@/lib/assistant-model";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", pupil: "", pupilM: "", teacher: "", teacherM: "", admin: "", principal: "", parent: "", klass: "" };

async function as(userId: string, role: string, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

type Reply = string | { content: string; finishReason?: string };
/** A fake model and fake searches. `label` is the classifier's word; `answers` the answering model's replies in turn. */
function fake(opts: { help?: number; curriculum?: number; label?: string; answers?: Reply[]; cards?: HelpHit[] } = {}) {
  const calls = { chat: [] as { messages: ChatMessage[]; opts: ChatOptions }[], helpQueries: [] as string[], cards: [] as string[] };
  let turn = 0;
  const helpHit = (sim: number, over: Partial<HelpHit> = {}): HelpHit => ({ entryId: "help-1", kind: "nav", title: "Attendance", text: "Open /teacher/attendance to mark the register.", pagePath: null, door: null, module: null, roles: [], language: "en", sourceFile: "nav", commit: "test", similarity: sim, vectorRank: 1, keywordRank: 1, score: 1, ...over });
  const hit = (sim: number): CurriculumHit => ({
    chunkId: "chunk-1", documentId: "doc-1", board: "NCERT", grade: "9", subject: "Science", book: "Exploration", edition: null, chapter: "Chapter 6", section: "6.6", headingPath: ["Chapter 6", "6.6"],
    pageStart: 16, pageEnd: 16, text: "For every action there is an equal and opposite reaction.", language: "en", figureKeys: [], sourceUrl: "https://ncert.nic.in/textbook/pdf/iesc106.pdf", source: "ncert", attribution: null, similarity: sim, vectorRank: 1, keywordRank: 1, score: 1,
    citation: { board: "NCERT", book: "Exploration", chapter: null, section: null, page: 16, documentId: "doc-1", chunkId: "chunk-1", attribution: null },
  });
  const deps: AssistantDeps = {
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages, o): Promise<ChatResult> => {
      calls.chat.push({ messages, opts: o });
      const classifying = messages[0]!.content.startsWith("You classify");
      const base = { usage: { promptTokens: 100, completionTokens: classifying ? 1 : 20 }, tokensPerSecond: null, promptTokensPerSecond: null };
      if (classifying) {
        const isAnswer = messages[0]!.content.includes("an answer");
        // The answer classifier agrees with the mode the answer was written in (the tutor's prompt names "the tutor").
        const lastAnswer = [...calls.chat].reverse().find((c) => !c.messages[0]!.content.startsWith("You classify"));
        const word = isAnswer ? (lastAnswer?.messages[0]!.content.includes("Vidura, the tutor") ? "CURRICULUM" : "PLATFORM") : (opts.label ?? "PLATFORM");
        return { ...base, content: word, firstTokenLogprob: 0 };
      }
      const reply = opts.answers?.[Math.min(turn++, (opts.answers?.length ?? 1) - 1)] ?? "Open /student/assignments and press Hand it in [1].";
      const r = typeof reply === "string" ? { content: reply } : reply;
      return { ...base, content: r.content, firstTokenLogprob: null, finishReason: r.finishReason ?? "stop" };
    },
    searchHelp: async (q) => {
      calls.helpQueries.push(q.query);
      if (q.kinds?.includes("door")) return [];
      return [helpHit(opts.help ?? 0.2, q.role === "TEACHER" ? { pagePath: "/teacher/attendance" } : { pagePath: "/student/assignments", title: "Assignments" })];
    },
    searchCurriculum: async () => [hit(opts.curriculum ?? 0.2)],
    runDoors: async () => [],
    publish: () => {},
    now: () => new Date(),
    pageCards: async (q) => {
      calls.cards.push(q.page);
      return opts.cards ?? [helpHit(0, { entryId: "card-1", title: "Assignments", text: "Assignments — page /student/assignments (STUDENT). On this page: To do; Handed in; Marked.", pagePath: q.page })];
    },
  };
  return { deps, calls };
}
const TOPIC = { curriculum: CURRICULUM_THRESHOLD.en + 0.2, help: HELP_THRESHOLD.en - 0.2, label: "CURRICULUM" };
const HELP = { curriculum: CURRICULUM_THRESHOLD.en - 0.2, help: HELP_THRESHOLD.en + 0.2, label: "PLATFORM" };
const BOTH = { curriculum: CURRICULUM_THRESHOLD.en + 0.2, help: HELP_THRESHOLD.en + 0.2 };
const NOTHING = { curriculum: 0.1, help: 0.1 };

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Vidura ${STAMP}`, slug: `zz-vidura-${STAMP}`, code: `ZVD${String(STAMP).slice(-6)}`, contactEmail: `zz-vidura-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "ASSISTANT" } });
  const mk = (who: string, name: string) => db.user.create({ data: { name, email: `zz-vidura-${who}-${STAMP}@test.invalid` }, select: { id: true } });
  const [pupil, teacher, admin, principal, parent] = await Promise.all([mk("pupil", "ZZ Vidura Pupil"), mk("teacher", "ZZ Vidura Teacher"), mk("admin", "ZZ Vidura Office"), mk("principal", "ZZ Vidura Head"), mk("parent", "ZZ Vidura Parent")]);
  Object.assign(ids, { pupil: pupil.id, teacher: teacher.id, admin: admin.id, principal: principal.id, parent: parent.id });
  ids.pupilM = (await db.membership.create({ data: { userId: pupil.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", gradeLevel: "9", studentCode: `ZVDP${STAMP}` }, select: { id: true } })).id;
  ids.teacherM = (await db.membership.create({ data: { userId: teacher.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: admin.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: principal.id, schoolId: ids.school, role: "PRINCIPAL", status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, status: "ACTIVE" } });
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: `ZZ 9V ${STAMP}`, subject: "Science", gradeLevel: "9", joinCode: `ZVDK${STAMP}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { classId: ids.klass, schoolId: ids.school, studentMembershipId: ids.pupilM } });
  await db.classTeacher.create({ data: { classId: ids.klass, schoolId: ids.school, teacherMembershipId: ids.teacherM } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the three modes", () => {
  it("names each person's modes on the status door: Learning only for the tutor's roles", async () => {
    expect((await assistantStatus(await as(ids.pupil, "STUDENT", ids.school))).modes).toEqual(["USING", "RECORDS", "LEARNING"]);
    expect((await assistantStatus(await as(ids.teacher, "TEACHER", ids.school))).modes).toEqual(["USING", "RECORDS", "LEARNING"]);
    expect((await assistantStatus(await as(ids.admin, "ADMIN", ids.school))).modes).toEqual(["USING", "RECORDS"]);
    expect((await assistantStatus(await as(ids.parent, "PARENT", null))).modes).toEqual(["USING", "RECORDS"]);
  });

  it("puts the chip on the answer, keeps it in the row, and reads it back", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const topic = await ask(pupil, conv.id, { text: "explain newton's third law" }, fake({ ...TOPIC, answers: ["### The idea\nEvery action has an equal and opposite reaction [1]."] }).deps);
    expect(topic.answer).toMatchObject({ verdict: "ANSWERED", chip: "LEARNING", mode: "TUTOR", cut: false });
    const help = await ask(pupil, conv.id, { text: "where do I hand in my work" }, fake(HELP).deps);
    expect(help.answer).toMatchObject({ verdict: "ANSWERED", chip: "USING", mode: "HELP" });
    const rows = await db.assistantMessage.findMany({ where: { conversationId: conv.id, role: "ASSISTANT" }, orderBy: { createdAt: "asc" }, select: { mode: true } });
    expect(rows.map((r) => r.mode)).toEqual(["LEARNING", "USING"]);
    const back = await getConversation(pupil, conv.id);
    expect(back.messages.filter((m) => m.role === "ASSISTANT").map((m) => m.chip)).toEqual(["LEARNING", "USING"]);
    expect(back.messages.filter((m) => m.role === "USER").every((m) => m.chip === null && m.cut === false && m.askPerson === null)).toBe(true);
  });

  it("re-routes the next question by the person's pick, only between scopes the gate allows", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    // Both scopes open, the classifier says PLATFORM: "Learning" takes it to the tutor.
    const learning = await ask(pupil, conv.id, { text: "what is a lever", mode: "LEARNING" }, fake({ ...BOTH, label: "PLATFORM", answers: ["A lever is a rigid bar [1]."] }).deps);
    expect(learning.answer.chip).toBe("LEARNING");
    // The classifier's REFUSE still refuses, whatever the pick.
    const refused = await ask(pupil, conv.id, { text: "tell me a joke", mode: "LEARNING" }, fake({ ...BOTH, label: "REFUSE" }).deps);
    expect(refused.answer.verdict).toBe("OUT_OF_SCOPE");
    // Below both thresholds, nothing reaches the model, pick or not.
    const f = fake({ ...NOTHING, label: "CURRICULUM" });
    expect((await ask(pupil, conv.id, { text: "what is the capital of mars", mode: "LEARNING" }, f.deps)).answer.verdict).toBe("OUT_OF_SCOPE");
    expect(f.calls.chat).toHaveLength(0);
    // A table's category comes first.
    expect((await ask(pupil, conv.id, { text: "how do I make a bomb", mode: "USING" }, fake(BOTH).deps)).answer.verdict).toBe("VIOLENCE");
    // A guardian's pick of "Learning" never opens the tutor.
    const parent = await as(ids.parent, "PARENT", null);
    const pconv = await openConversation(parent, { language: "en" });
    const p = await ask(parent, pconv.id, { text: "what is a lever", mode: "LEARNING" }, fake({ ...BOTH, label: "CURRICULUM" }).deps);
    expect(p.answer.verdict).toBe("TUTOR_NOT_FOR_ROLE");
  });

  it("the gate itself: a pick prefers its scope only where it is open", async () => {
    const model = (word: string) => ({ chat: async () => ({ content: word, usage: null, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: 0 }) });
    const base = { original: "what is a lever", stripped: "what is a lever", language: "en" as const, helpTop: 0.9, curriculumTop: 0.9 };
    expect(await gateQuestion({ ...base, policy: policyFor("STUDENT"), prefer: "CURRICULUM" }, model("PLATFORM"))).toMatchObject({ pass: true, mode: "TUTOR" });
    expect(await gateQuestion({ ...base, policy: policyFor("STUDENT"), prefer: "PLATFORM" }, model("CURRICULUM"))).toMatchObject({ pass: true, mode: "HELP" });
    expect(await gateQuestion({ ...base, policy: policyFor("PARENT"), prefer: "CURRICULUM" }, model("PLATFORM"))).toMatchObject({ pass: true, mode: "HELP" });
    expect(await gateQuestion({ ...base, curriculumTop: 0.1, policy: policyFor("STUDENT"), prefer: "CURRICULUM" }, model("PLATFORM"))).toMatchObject({ pass: true, mode: "HELP" });
    expect(await gateQuestion({ ...base, policy: policyFor("STUDENT"), prefer: "CURRICULUM" }, model("REFUSE"))).toMatchObject({ pass: false, verdict: "OUT_OF_SCOPE" });
  });
});

describe("the length rule, restricted Markdown and 'go on'", () => {
  it("caps an answer by its kind and language, and keeps a hint at Phase B's cap", async () => {
    const teacher = await as(ids.teacher, "TEACHER", ids.school);
    const conv = await openConversation(teacher, { language: "en" });
    const f = fake({ ...TOPIC, answers: ["Every action has an equal and opposite reaction [1]."] });
    await ask(teacher, conv.id, { text: "explain newton's third law" }, f.deps);
    const answerCall = f.calls.chat.find((c) => !c.messages[0]!.content.startsWith("You classify"))!;
    expect(answerCall.opts.maxTokens).toBe(ANSWER_TOKENS.EXPLAIN.en);
    const g = fake({ ...TOPIC, answers: ["प्रत्येक क्रिया की समान और विपरीत प्रतिक्रिया होती है [1]।"] });
    await ask(teacher, conv.id, { text: "न्यूटन का तीसरा नियम समझाइए" }, g.deps);
    expect(g.calls.chat.find((c) => !c.messages[0]!.content.startsWith("You classify"))!.opts.maxTokens).toBe(ANSWER_TOKENS.EXPLAIN.deva);
    expect(answerTokenCap("DEFINE", "en")).toBeLessThan(answerTokenCap("HOWTO", "en"));
    expect(MAX_ANSWER_TOKENS).toBe(700);
  });

  it("narrows the Markdown before the gate: a link keeps its words, a heading becomes ###", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const out = await ask(pupil, conv.id, { text: "how do I hand in my work" }, fake({ ...HELP, answers: ["# Steps\n1. Open [Assignments](/student/assignments) [1].\n2. Press **Hand it in**."] }).deps);
    expect(out.answer.verdict).toBe("ANSWERED");
    expect(out.answer.text).toBe("### Steps\n1. Open Assignments (/student/assignments) [1].\n2. Press **Hand it in**.");
    // A Markdown link off the platform keeps its words only, so nothing is discarded for it and no host is shown.
    const off = await ask(pupil, conv.id, { text: "how do I hand in my work" }, fake({ ...HELP, answers: ["Open [the page](https://evil.example/x) on /student/assignments [1]."] }).deps);
    expect(off.answer.text).not.toContain("evil.example");
  });

  it("marks an answer stopped at its cap, and 'go on' continues it from the parts so far, at most GO_ON_MAX times", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const parts = [
      { content: "### The idea\nEvery action has an equal and opposite reaction [1].", finishReason: "length" },
      { content: "### An example\nA swimmer pushes the water back [1].", finishReason: "length" },
      { content: "### Check yourself\nWhat pushes a rocket up [1]?", finishReason: "length" },
    ];
    const f = fake({ ...TOPIC, answers: parts });
    const first = await ask(pupil, conv.id, { text: "explain newton's third law" }, f.deps);
    expect(first.answer.cut).toBe(true);
    const usedBefore = (await assistantStatus(pupil)).usedToday;
    const second = await ask(pupil, conv.id, { text: "Go on", goOn: true }, f.deps);
    expect(second.question.text).toBe("Go on");
    expect(second.answer.text).toContain("A swimmer pushes the water back");
    expect(second.answer.cut).toBe(true);
    // One more question of the day.
    expect((await assistantStatus(pupil)).usedToday).toBe(usedBefore + 1);
    // The model was given the answer so far and told to continue it.
    const continued = f.calls.chat.filter((c) => !c.messages[0]!.content.startsWith("You classify"))[1]!.messages;
    expect(continued.at(-2)).toEqual({ role: "assistant", content: first.answer.text });
    expect(continued.at(-1)).toEqual({ role: "user", content: GO_ON_INSTRUCTION });
    expect(continued[1]!.content).toContain("explain newton");
    // Typed rather than pressed counts the same; the last allowed continuation is no longer offered "Go on".
    const third = await ask(pupil, conv.id, { text: "go on" }, f.deps);
    expect(third.answer.text).toContain("What pushes a rocket up");
    expect(GO_ON_MAX).toBe(2);
    expect(third.answer.cut).toBe(false);
  });
});

describe("page awareness", () => {
  it("reads a question pointing at the page against that page's card, first", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const f = fake({ ...HELP, answers: ["On /student/assignments, open the To do tab [1]."] });
    const out = await ask(pupil, conv.id, { text: "how do I do this?", page: "/student/assignments" }, f.deps);
    expect(out.answer.verdict).toBe("ANSWERED");
    expect(f.calls.cards).toEqual(["/student/assignments"]);
    expect(f.calls.helpQueries[0]).toContain("Assignments — /student/assignments");
    const prompt = f.calls.chat.find((c) => c.messages[0]!.content.includes("help desk"))!.messages;
    expect(prompt[0]!.content).toContain("The person is on the page /student/assignments");
    expect(prompt[1]!.content.indexOf("To do; Handed in; Marked")).toBeLessThan(prompt[1]!.content.indexOf("Open /teacher/attendance"));
    expect(out.answer.citations[0]).toMatchObject({ kind: "HELP", pagePath: "/student/assignments" });
    const classifier = f.calls.chat.find((c) => c.messages[0]!.content.startsWith("You classify a question"))!.messages[1]!.content;
    expect(classifier).toContain("(asked on the page");
  });

  it("reads nothing of the page for a question that does not point at it, or for another role's page", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const f = fake(HELP);
    await ask(pupil, conv.id, { text: "where do I see my timetable", page: "/student/assignments" }, f.deps);
    await ask(pupil, conv.id, { text: "how do I do this?", page: "/admin/people" }, f.deps);
    expect(f.calls.cards).toEqual([]);
  });

  it("knows the doors whose data a page shows, for the person's role only", () => {
    expect(doorsShownOn("/parent/fees", "PARENT")).toEqual(["/api/v1/fees/family"]);
    expect(doorsShownOn("/parent/fees", "STUDENT")).toEqual([]);
  });
});

describe("Ask a person", () => {
  it("names the class teacher for a pupil and for their guardian, on a fixed sentence", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const conv = await openConversation(pupil, { language: "en" });
    const out = await ask(pupil, conv.id, { text: "what is the capital of mars" }, fake(NOTHING).deps);
    expect(out.answer.verdict).toBe("OUT_OF_SCOPE");
    expect(out.answer.askPerson).toEqual({ who: "CLASS_TEACHER", schoolId: ids.school, userId: ids.teacher });
    // And again when the conversation is read back.
    expect((await getConversation(pupil, conv.id)).messages.find((m) => m.id === out.answer.id)?.askPerson).toEqual(out.answer.askPerson);
    const parent = await as(ids.parent, "PARENT", null);
    const pconv = await openConversation(parent, { language: "en" });
    expect((await ask(parent, pconv.id, { text: "what is the capital of mars" }, fake(NOTHING).deps)).answer.askPerson).toMatchObject({ who: "CLASS_TEACHER", userId: ids.teacher });
  });

  it("names the head for the office and the office for a teacher; offers it on a not-sure answer, never on a good one", async () => {
    const admin = await as(ids.admin, "ADMIN", ids.school);
    const aconv = await openConversation(admin, { language: "en" });
    expect((await ask(admin, aconv.id, { text: "what is the capital of mars" }, fake(NOTHING).deps)).answer.askPerson).toEqual({ who: "HEAD", schoolId: ids.school, userId: ids.principal });
    const teacher = await as(ids.teacher, "TEACHER", ids.school);
    const tconv = await openConversation(teacher, { language: "en" });
    const unsure = await ask(teacher, tconv.id, { text: "how do I mark the register" }, fake({ ...HELP, answers: ["I am not sure; ask the office about /teacher/attendance [1]."] }).deps);
    expect(unsure.answer.verdict).toBe("ANSWERED");
    expect(unsure.answer.askPerson).toEqual({ who: "OFFICE", schoolId: ids.school, userId: ids.admin });
    const sure = await ask(teacher, tconv.id, { text: "how do I mark the register" }, fake({ ...HELP, answers: ["Open /teacher/attendance [1]."] }).deps);
    expect(sure.answer.askPerson).toBeNull();
  });

  it("is offered only to a role the messaging door opens to (the menu's Messages), never widened", () => {
    const door = ENDPOINTS.find((e) => e.method === "POST" && e.path === "/api/v1/shared/conversations")!;
    for (const role of ROLES) if (pageIsRoles("/remarks", role)) expect({ role, opens: permits(door, role) }).toEqual({ role, opens: true });
    expect(pageIsRoles("/remarks", "DRIVER")).toBe(false);
  });

  it("is never offered on the counsellor route", async () => {
    const teacher = await as(ids.teacher, "TEACHER", ids.school);
    const conv = await openConversation(teacher, { language: "en" });
    const out = await ask(teacher, conv.id, { text: "I want to kill myself" }, fake(NOTHING).deps);
    expect(out.answer.verdict).toBe("SELF_HARM");
    expect(out.answer.askPerson).toBeNull();
  });
});

describe("the suggested questions", () => {
  it("open with 'How do I use this page?' away from home, then the guide's own questions; never another role's page", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    const away = await assistantSuggestions(pupil, "/student/assignments");
    expect(away.suggestions[0]).toEqual({ text: "How do I use this page?", mode: "USING" });
    expect(away.suggestions.length).toBeLessThanOrEqual(3);
    for (const s of away.suggestions) expect(s.text.endsWith("?")).toBe(true);
    const foreign = await assistantSuggestions(pupil, "/admin/people");
    expect(foreign.suggestions[0]?.text).not.toBe("How do I use this page?");
    const home = await assistantSuggestions(pupil, "/student");
    expect(home.suggestions.map((s) => s.text)).not.toContain("How do I use this page?");
  });

  it("speak the person's language", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.school);
    await db.user.update({ where: { id: ids.pupil }, data: { prefs: JSON.stringify({ locale: "hi" }) } });
    const hindi = await assistantSuggestions(await as(ids.pupil, "STUDENT", ids.school), "/student/assignments");
    expect(hindi.suggestions[0]?.text).toBe("इस पेज का उपयोग कैसे करें?");
    for (const s of hindi.suggestions) expect(/[ऀ-ॿ]/.test(s.text)).toBe(true);
    await db.user.update({ where: { id: ids.pupil }, data: { prefs: "{}" } });
    void pupil;
  });

  it("take a guide heading's question, never the assistant's own section", () => {
    expect(guideQuestion("The pupil's guide › How do I hand in my work?")).toBe("How do I hand in my work?");
    expect(guideQuestion("The pupil's guide › How do I ask Vidura, and what will it answer?")).toBeNull();
    expect(guideQuestion("The pupil's guide")).toBeNull();
  });
});

describe("the pure rules", () => {
  it("reads a stored mode as a chip, the old HELP and TUTOR too", () => {
    expect([chipOf("USING"), chipOf("RECORDS"), chipOf("LEARNING"), chipOf("HELP"), chipOf("TUTOR"), chipOf(null)]).toEqual(["USING", "RECORDS", "LEARNING", "USING", "LEARNING", null]);
    expect([jobOf("RECORDS"), jobOf("LEARNING"), jobOf(null)]).toEqual(["HELP", "TUTOR", null]);
    expect(modesFor(policyFor("DRIVER"))).toEqual(["USING", "RECORDS"]);
    expect(modesFor(policyFor("EXPERT"))).toEqual([]);
    expect([preferFor("LEARNING"), preferFor("RECORDS"), preferFor("USING"), preferFor(null)]).toEqual(["CURRICULUM", "PLATFORM", "PLATFORM", null]);
  });

  it("tells a question pointing at the page, a not-sure answer and a 'go on', in the three languages", () => {
    for (const q of ["How do I use this page?", "how do I do this here", "इस पेज का उपयोग कैसे करें?", "यहाँ क्या करना है", "हे पान कसे वापरावे?", "इथे काय करायचे"]) expect({ q, yes: asksAboutThisPage(q) }).toEqual({ q, yes: true });
    for (const q of ["explain newton's third law", "where is /parent/fees", "how much fee is due for my child"]) expect({ q, yes: asksAboutThisPage(q) }).toEqual({ q, yes: false });
    for (const a of ["I'm not sure which page that is.", "मुझे पक्का नहीं पता।", "मला खात्री नाही."]) expect(saysNotSure(a)).toBe(true);
    expect(saysNotSure("Open /parent/fees [1].")).toBe(false);
    for (const q of ["Go on", "continue.", "आगे बताइए", "पुढे सांगा"]) expect(asksToGoOn(q)).toBe(true);
    expect(asksToGoOn("go on and explain friction")).toBe(false);
    expect(offersAskPerson("OUT_OF_SCOPE", "")).toBe(true);
    expect(offersAskPerson("SELF_HARM", "")).toBe(false);
    expect(offersAskPerson("INJECTION", "")).toBe(false);
    expect(offersAskPerson("MODEL_UNAVAILABLE", "")).toBe(false);
    expect(offersAskPerson("ANSWERED", "Open /x [1].")).toBe(false);
  });

  it("wears My records for the person's own figures, Using Shalaghar for a how-to or a where-is the guide answers", () => {
    expect(helpChip({ data: 1, passages: 3, prefer: null, question: "how much fee is due for my child" })).toBe("RECORDS");
    expect(helpChip({ data: 1, passages: 3, prefer: null, question: "how do I issue a book" })).toBe("USING");
    expect(helpChip({ data: 1, passages: 3, prefer: null, question: "where is the fee ledger" })).toBe("USING");
    expect(helpChip({ data: 1, passages: 0, prefer: null, question: "how do I issue a book" })).toBe("RECORDS");
    expect(helpChip({ data: 1, passages: 3, prefer: "RECORDS", question: "how do I issue a book" })).toBe("RECORDS");
    expect(helpChip({ data: 0, passages: 3, prefer: "RECORDS", question: "how many forms are waiting" })).toBe("USING");
  });

  it("sizes an answer by its kind: steps for a how-to, a sentence for a where-is, the data's rows for my records", () => {
    expect([helpKind("how do I pay the fee"), helpKind("where is the timetable"), helpKind("what is my rank"), helpKind("फ़ीस कैसे भरें"), helpKind("वेळापत्रक कुठे आहे")]).toEqual(["HOWTO", "WHERE", "OTHER", "HOWTO", "WHERE"]);
    expect([answerKindFor("RECORDS", "how much is due"), answerKindFor("USING", "how do I pay"), answerKindFor("LEARNING", "define force"), answerKindFor("LEARNING", "explain force"), answerKindFor("LEARNING", "why does ice float")]).toEqual(["DATA", "HOWTO", "DEFINE", "EXPLAIN", "WHY"]);
  });
});
