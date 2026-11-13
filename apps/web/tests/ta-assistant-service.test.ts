/**
 * The assistant batch of the testing analysis of 13 November 2026, the cases that need a school: a pupil at the
 * day's cap or the school's budget who types a self-harm message (TA-019), a classifier that does not answer
 * charging the person's day (TA-025), forty open hand-ins pushing a closed sitting out of the assessment rule
 * (TA-021), a guardian with children at two schools asking about the one at the other (TA-024), and the daily
 * cap's Retry-After counted to the school's midnight (TA-279). Two ZZ schools of this file's own, stamped, with
 * their people, made through the owner connection and removed afterwards; the model and the searches are fakes.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, openConversation, type AssistantDeps } from "@/lib/assistant/service";
import { assistantFailure } from "@/lib/assistant/http";
import { pupilAssessmentItems } from "@/lib/assistant/assessment";
import { dataContextFor } from "@/lib/assistant/data";
import { dayKeyFor } from "@/lib/assistant/usage";
import { HELP_THRESHOLD, MAX_ASSESSMENT_ITEMS } from "@/lib/assistant/config";
import type { HelpHit } from "@/lib/assistant-retrieval";
import type { RunInput } from "@/lib/assistant/router";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const ids = { lark: "", fen: "", pupil: "", pupilM: "", teacher: "", teacherM: "", counsellor: "", parent: "", larkChildM: "", fenChildM: "", klass: "", topic: "" };

async function as(userId: string, role: string, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

const helpHit: HelpHit = { entryId: "help-1", kind: "nav", title: "Attendance", text: "Open /teacher/attendance to mark the register.", pagePath: "/teacher/attendance", door: null, module: null, roles: [], language: "en", sourceFile: "nav", commit: "test", similarity: HELP_THRESHOLD.en + 0.2, vectorRank: 1, keywordRank: 1, score: 1 };

function fake(opts: { classify?: (n: number) => string | Error; doors?: string[]; now?: Date } = {}) {
  const calls = { chat: 0, classify: 0, runDoors: [] as RunInput[] };
  const deps: AssistantDeps = {
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages) => {
      const classifying = messages[0]!.content.startsWith("You classify");
      if (classifying) {
        calls.classify += 1;
        const word = opts.classify ? opts.classify(calls.classify) : "PLATFORM";
        if (word instanceof Error) throw word;
        return { content: word, usage: { promptTokens: 10, completionTokens: 1 }, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: 0 };
      }
      calls.chat += 1;
      return { content: "Open /teacher/attendance and mark the register [1].", usage: { promptTokens: 10, completionTokens: 10 }, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: null };
    },
    searchHelp: async (q) => (q.kinds?.includes("door") ? (opts.doors ?? []).map((door) => ({ ...helpHit, entryId: door, kind: "door", door: `GET ${door}`, pagePath: null, similarity: 0.95 })) : [helpHit]),
    searchCurriculum: async () => [],
    runDoors: async (input) => {
      calls.runDoors.push(input);
      return [];
    },
    publish: () => {},
    now: () => opts.now ?? new Date(),
  };
  return { deps, calls };
}

const timeout = () => Object.assign(new Error("The operation was aborted due to timeout"), { name: "TimeoutError" });

const savedEnv = { ...process.env };
afterEach(() => {
  for (const k of ["ASSISTANT_DAILY_CAP", "ASSISTANT_MONTHLY_TOKENS", "ASSISTANT_ENABLED"]) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

beforeAll(async () => {
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ TA Assistant ${tag} ${STAMP}`, slug: `zz-ta-asst-${tag.toLowerCase()}-${STAMP}`, code: `ZTA${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-ta-asst-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ, board: "CBSE" }, select: { id: true } });
  ids.lark = (await mkSchool("Lark")).id;
  ids.fen = (await mkSchool("Fen")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: ids.lark, module: "ASSISTANT" }, { schoolId: ids.fen, module: "ASSISTANT" }] });
  const mk = (who: string, name: string, preferredName?: string) => db.user.create({ data: { name, preferredName, email: `zz-ta-asst-${who}-${STAMP}@test.invalid` }, select: { id: true } });
  const [pupil, teacher, counsellor, parent, larkChild, fenChild] = await Promise.all([
    mk("pupil", "ZZ Asha Patil"),
    mk("teacher", "ZZ Teacher Kale"),
    mk("counsellor", "ZZ Counsellor Joshi"),
    mk("parent", "ZZ Parent Kale"),
    mk("larkchild", "ZZ Meerazz Kale", "Meerazz"),
    mk("fenchild", "ZZ Rohitzz Kale", "Rohitzz"),
  ]);
  Object.assign(ids, { pupil: pupil.id, teacher: teacher.id, counsellor: counsellor.id, parent: parent.id });
  ids.pupilM = (await db.membership.create({ data: { userId: pupil.id, schoolId: ids.lark, role: "STUDENT", status: "ACTIVE", gradeLevel: "9", studentCode: `ZTAP${STAMP}` }, select: { id: true } })).id;
  ids.teacherM = (await db.membership.create({ data: { userId: teacher.id, schoolId: ids.lark, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const counsellorM = await db.membership.create({ data: { userId: counsellor.id, schoolId: ids.lark, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.staffRecord.create({ data: { schoolId: ids.lark, membershipId: counsellorM.id, designation: "School Counsellor" } });
  ids.larkChildM = (await db.membership.create({ data: { userId: larkChild.id, schoolId: ids.lark, role: "STUDENT", status: "ACTIVE", gradeLevel: "6", studentCode: `ZTAL${STAMP}` }, select: { id: true } })).id;
  ids.fenChildM = (await db.membership.create({ data: { userId: fenChild.id, schoolId: ids.fen, role: "STUDENT", status: "ACTIVE", gradeLevel: "8", studentCode: `ZTAF${STAMP}` }, select: { id: true } })).id;
  // The Lark child is linked first: a conversation the guardian opens is filed under Lark.
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.larkChildM, studentSchoolId: ids.lark, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.fenChildM, studentSchoolId: ids.fen, status: "ACTIVE" } });
  ids.klass = (await db.class.create({ data: { schoolId: ids.lark, name: `ZZ TA 9A ${STAMP}`, subject: "Science", gradeLevel: "9", joinCode: `ZTAK${STAMP}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { classId: ids.klass, schoolId: ids.lark, studentMembershipId: ids.pupilM } });
  const larkKlass = await db.class.create({ data: { schoolId: ids.lark, name: `ZZ TA 6A ${STAMP}`, subject: "All", gradeLevel: "6", joinCode: `ZTAM${STAMP}` }, select: { id: true } });
  await db.enrollment.create({ data: { classId: larkKlass.id, schoolId: ids.lark, studentMembershipId: ids.larkChildM } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.lark, ids.fen] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.lark, ids.fen] } } });
  if (ids.topic) await db.quizTopic.deleteMany({ where: { id: ids.topic } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

async function usageToday(userId: string, now = new Date()) {
  return db.assistantUsage.findUnique({ where: { schoolId_userId_dayKey: { schoolId: ids.lark, userId, dayKey: dayKeyFor(TZ, now) } } });
}

describe("a pupil in danger past the caps", () => {
  it("TA-019: a self-harm message at the day's cap is answered with the helpline, and the counsellor is told", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.lark);
    const conv = await openConversation(pupil, { language: "en" });
    process.env.ASSISTANT_DAILY_CAP = "1";
    const dayKey = dayKeyFor(TZ, new Date());
    await db.assistantUsage.upsert({ where: { schoolId_userId_dayKey: { schoolId: ids.lark, userId: ids.pupil, dayKey } }, create: { schoolId: ids.lark, userId: ids.pupil, dayKey, questions: 1 }, update: { questions: 1 } });
    const f = fake();
    // An ordinary question is still refused at the cap.
    await expect(ask(pupil, conv.id, { text: "how do I see my homework" }, f.deps)).rejects.toMatchObject({ reason: "DAILY_CAP" });
    const out = await ask(pupil, conv.id, { text: "I want to kill myself" }, f.deps);
    expect(out.answer.verdict).toBe("SELF_HARM");
    expect(out.answer.text).toContain("14416");
    expect(f.calls.chat + f.calls.classify).toBe(0);
    expect(await db.notification.count({ where: { userId: ids.counsellor, titleKey: "assistantService.counsellorTitle" } })).toBe(1);
    expect((await usageToday(ids.pupil))?.counsellorRoutes).toBe(1);
  });

  it("TA-019: the same at the school's monthly budget, and an ordinary question is still refused there", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.lark);
    const conv = await openConversation(pupil, { language: "en" }).catch(() => null);
    const convId = conv?.id ?? (await db.assistantConversation.findFirst({ where: { userId: ids.pupil }, select: { id: true } }))!.id;
    process.env.ASSISTANT_MONTHLY_TOKENS = "1";
    const dayKey = dayKeyFor(TZ, new Date());
    await db.assistantUsage.upsert({ where: { schoolId_userId_dayKey: { schoolId: ids.lark, userId: ids.pupil, dayKey } }, create: { schoolId: ids.lark, userId: ids.pupil, dayKey, promptTokens: 5 }, update: { promptTokens: { increment: 5 } } });
    const f = fake();
    await expect(ask(pupil, convId, { text: "how do I see my homework" }, f.deps)).rejects.toMatchObject({ reason: "SCHOOL_BUDGET" });
    const out = await ask(pupil, convId, { text: "someone at home hits me and touches me, I am scared" }, f.deps);
    expect(out.answer.verdict).toBe("ABUSE_DISCLOSURE");
    expect(f.calls.chat + f.calls.classify).toBe(0);
  });

  it("TA-019: a fresh drawer at the cap or the budget opens on a self-harm or abuse first question, and on nothing else", async () => {
    const pupil = await as(ids.pupil, "STUDENT", ids.lark);
    const dayKey = dayKeyFor(TZ, new Date());
    process.env.ASSISTANT_DAILY_CAP = "1";
    await db.assistantUsage.upsert({ where: { schoolId_userId_dayKey: { schoolId: ids.lark, userId: ids.pupil, dayKey } }, create: { schoolId: ids.lark, userId: ids.pupil, dayKey, questions: 1 }, update: { questions: 1 } });
    // The open with no text, or with an ordinary question, still refuses at the cap.
    await expect(openConversation(pupil, { language: "en" })).rejects.toMatchObject({ reason: "DAILY_CAP" });
    await expect(openConversation(pupil, { language: "en", text: "how do I see my homework" })).rejects.toMatchObject({ reason: "DAILY_CAP" });
    const conv = await openConversation(pupil, { language: "en", text: "I want to kill myself" });
    const f = fake();
    const out = await ask(pupil, conv.id, { text: "I want to kill myself" }, f.deps);
    expect(out.answer.verdict).toBe("SELF_HARM");
    expect(out.answer.text).toContain("14416");
    expect(f.calls.chat + f.calls.classify).toBe(0);
    // The counsellor is told once a school day per pupil (counsellor.ts): told today, by this case or the first.
    expect(await db.notification.count({ where: { userId: ids.counsellor, titleKey: "assistantService.counsellorTitle" } })).toBe(1);
    delete process.env.ASSISTANT_DAILY_CAP;
    // The school's month spent: the same.
    process.env.ASSISTANT_MONTHLY_TOKENS = "1";
    await db.assistantUsage.update({ where: { schoolId_userId_dayKey: { schoolId: ids.lark, userId: ids.pupil, dayKey } }, data: { promptTokens: { increment: 5 } } });
    await expect(openConversation(pupil, { language: "en" })).rejects.toMatchObject({ reason: "SCHOOL_BUDGET" });
    await expect(openConversation(pupil, { language: "en", text: "how do I see my homework" })).rejects.toMatchObject({ reason: "SCHOOL_BUDGET" });
    const opened = await openConversation(pupil, { language: "en", text: "someone at home hits me and touches me, I am scared" });
    expect((await ask(pupil, opened.id, { text: "someone at home hits me and touches me, I am scared" }, f.deps)).answer.verdict).toBe("ABUSE_DISCLOSURE");
    // The platform's switch still refuses, whatever the text.
    process.env.ASSISTANT_ENABLED = "false";
    await expect(openConversation(pupil, { language: "en", text: "I want to kill myself" })).rejects.toMatchObject({ reason: "KILL_SWITCH" });
  });
});

describe("a classifier that does not answer", () => {
  it("TA-025: the question is MODEL_UNAVAILABLE and given back to the person's day", async () => {
    const teacher = await as(ids.teacher, "TEACHER", ids.lark);
    const conv = await openConversation(teacher, { language: "en" });
    const before = (await usageToday(ids.teacher))?.questions ?? 0;
    const f = fake({ classify: () => timeout() });
    const out = await ask(teacher, conv.id, { text: "how do I mark the register" }, f.deps);
    expect(out.answer.verdict).toBe("MODEL_UNAVAILABLE");
    expect((await usageToday(ids.teacher))?.questions ?? 0).toBe(before);
    expect((await usageToday(ids.teacher))?.refused ?? 0).toBe(0);
  });

  it("TA-025: a finished answer whose check timed out is MODEL_UNAVAILABLE too, not discarded as out of scope", async () => {
    const teacher = await as(ids.teacher, "TEACHER", ids.lark);
    const conv = await openConversation(teacher, { language: "en" });
    const before = (await usageToday(ids.teacher))?.questions ?? 0;
    const f = fake({ classify: (n) => (n === 1 ? "PLATFORM" : timeout()) });
    const out = await ask(teacher, conv.id, { text: "how do I mark the register" }, f.deps);
    expect(f.calls.chat).toBe(1);
    expect(out.answer.verdict).toBe("MODEL_UNAVAILABLE");
    expect((await usageToday(ids.teacher))?.questions ?? 0).toBe(before);
  });
});

describe("the assessment rule's items", () => {
  it("TA-021: forty open hand-ins do not push a practice sitting in progress out of the rule", async () => {
    const now = new Date();
    await db.assignment.createMany({
      data: Array.from({ length: MAX_ASSESSMENT_ITEMS + 1 }, (_, i) => ({ schoolId: ids.lark, classId: ids.klass, authorMembershipId: ids.teacherM, title: `ZZ TA homework ${i}`, body: "Write two lines.", publishedAt: now, dueAt: i % 2 ? new Date(now.getTime() + (i + 1) * 3_600_000) : null })),
    });
    ids.topic = (await db.quizTopic.create({ data: { subject: "Science", classLevel: 9, chapter: "ZZ TA Motion", name: "ZZ TA Newton's laws", slug: `zz-ta-asst-topic-${STAMP}`, retiredAt: now }, select: { id: true } })).id;
    await db.quizAttempt.create({ data: { schoolId: ids.lark, studentMembershipId: ids.pupilM, topicId: ids.topic, startedAt: new Date(now.getTime() - 5 * 60_000) } });
    const items = await pupilAssessmentItems({ schoolId: ids.lark, membershipId: ids.pupilM, timezone: TZ, now });
    expect(items.some((i) => i.kind === "TIMED_PRACTICE")).toBe(true);
    expect(items.length).toBeLessThanOrEqual(MAX_ASSESSMENT_ITEMS);
    expect(items.filter((i) => i.kind === "HAND_IN").length).toBe(MAX_ASSESSMENT_ITEMS - 1);
  });
});

describe("a guardian with children at two schools", () => {
  it("TA-024: a question naming the child at the other school is not answered from the child at this one", async () => {
    const context = await dataContextFor({ role: "PARENT", userId: ids.parent, membershipId: null, schoolId: ids.lark, question: "How many days was Rohitzz absent this month?", now: new Date(), timezone: TZ });
    expect(context.childId).toBeNull();
    expect(context.children).toEqual([]);
    expect(context.otherSchoolChild).toMatchObject({ name: "Rohitzz" });
    // The child at this school, named or the only one, as before.
    const own = await dataContextFor({ role: "PARENT", userId: ids.parent, membershipId: null, schoolId: ids.lark, question: "How many days was Meerazz absent this month?", now: new Date(), timezone: TZ });
    expect(own.childId).toBe(ids.larkChildM);
    expect(own.otherSchoolChild ?? null).toBeNull();
    const unnamed = await dataContextFor({ role: "PARENT", userId: ids.parent, membershipId: null, schoolId: ids.lark, question: "How many days was my child absent this month?", now: new Date(), timezone: TZ });
    expect(unnamed.childId).toBe(ids.larkChildM);
  });

  it("TA-024: asked in the drawer, no door is read and the answer says which school the conversation is about", async () => {
    const parent = await as(ids.parent, "PARENT", null);
    const conv = await openConversation(parent, { language: "en" });
    expect((await db.assistantConversation.findUnique({ where: { id: conv.id }, select: { schoolId: true } }))?.schoolId).toBe(ids.lark);
    const f = fake({ doors: ["/api/v1/family/attendance"] });
    const out = await ask(parent, conv.id, { text: "How many days was Rohitzz absent this month?" }, f.deps);
    expect(f.calls.runDoors).toHaveLength(0);
    expect(f.calls.chat).toBe(0);
    expect(out.answer.text).toContain(`ZZ TA Assistant Lark ${STAMP}`);
    expect(out.answer.text).toContain("Rohitzz");
    // The child at this school is still answered from their own doors.
    const g = fake({ doors: ["/api/v1/family/attendance"] });
    await ask(parent, conv.id, { text: "How many days was Meerazz absent this month?" }, g.deps);
    expect(g.calls.runDoors.length).toBe(1);
    expect(g.calls.runDoors[0]!.ctx.childId).toBe(ids.larkChildM);
  });
});

describe("the cap's Retry-After", () => {
  it("TA-279: counts to the school's next midnight, not UTC's", async () => {
    const teacher = await as(ids.teacher, "TEACHER", ids.lark);
    const conv = await openConversation(teacher, { language: "en" });
    // 02:00 on 1 December 2026 in India: the school's day ends at 18:30 UTC, twenty-two hours on.
    const now = new Date("2026-11-30T20:30:00Z");
    process.env.ASSISTANT_DAILY_CAP = "1";
    const dayKey = dayKeyFor(TZ, now);
    expect(dayKey).toBe("2026-12-01");
    await db.assistantUsage.upsert({ where: { schoolId_userId_dayKey: { schoolId: ids.lark, userId: ids.teacher, dayKey } }, create: { schoolId: ids.lark, userId: ids.teacher, dayKey, questions: 1 }, update: { questions: 1 } });
    const error = await ask(teacher, conv.id, { text: "how do I mark the register" }, fake({ now }).deps).catch((e: unknown) => e);
    expect(error).toMatchObject({ reason: "DAILY_CAP" });
    const res = await assistantFailure(error, "test");
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe(String(22 * 3600));
  });
});
