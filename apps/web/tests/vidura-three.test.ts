/**
 * VIDURA PASS 3 (docs/plans/vidura.md; 18 October 2026): speed and operations. Against the database with a FAKE MODEL
 * and fake searches that record every call, on a ZZ school and ZZ people of this suite's own (and its own standard
 * answers, evaluation runs and audit rows, removed afterwards). Proved here, each failing without its rule:
 *
 *   1. the gate: the corpus is searched only when it can change the verdict, and the verdicts are the same as when it
 *      is read first; the small model's port falls back to the chat model only when its server does not answer at all;
 *      the model servers a kind of run needs, and a run's servers handed to another kind's active run;
 *   2. standard answers: the normal form of a question; only an answered "Using Shalaghar" how-to may be checked; a
 *      checked answer is served to that role and language with no answering model, counted on the answer and on the
 *      school's card, never for a pick of My records, never to another role, never once revoked; audited;
 *   3. the unanswered report: the mode and the gate's reason codes kept on every answer row, the counts per school,
 *      day, role, mode and verdict (never the counsellor routes), the stems kept only when two people asked, the CSV;
 *   4. evaluation runs: one at a time, the servers it needs brought up and recorded, Stop, a dead runner reaped, the
 *      scores kept on the row when it ends, the servers it brought up taken down or handed on.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { ask, gateClassifier, openConversation, type AssistantDeps } from "@/lib/assistant/service";
import { gateQuestion } from "@/lib/assistant/gate";
import { CURRICULUM_THRESHOLD, HELP_THRESHOLD } from "@/lib/assistant/config";
import { policyFor } from "@/lib/assistant/policy";
import { endpointUnreachable, type ChatMessage, type ChatOptions, type ChatResult } from "@/lib/assistant-model";
import { readGateConfig } from "@/lib/assistant-env";
import { handOverTo, neededServers, splitAtEnd, type HolderDb } from "@/lib/model-holders";
import { actOnStandardAnswer, listStandardAnswers, markable, tryStandardAnswer } from "@/lib/assistant/standard";
import { findStandardAnswer, questionKey } from "@/lib/assistant/standard-store";
import { countGaps, groupStems, stemOf, unansweredCsv, unansweredReport, verdictColumn } from "@/lib/assistant/gaps";
import { finishEval, readEvals, startEval, stopEval, type EvalDb, type EvalDeps } from "@/lib/eval-jobs";
import { JOBS } from "@/lib/jobs";
import type { HelpHit, CurriculumHit } from "@/lib/assistant-retrieval";
import type { ModelServer } from "@edulink/contracts";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";
import { ViduraOpsCard } from "@/components/vidura-ops/ops-card";
import RootViduraUnansweredPage from "@/app/root/vidura-unanswered/page";
import { useEvalDepsForTests } from "@/lib/eval-jobs-desk";

// The components are compiled with the classic JSX transform here, as in the other suites that draw them.
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { school: "", teacher: "", teacherM: "", other: "", otherM: "", parent: "", pupilM: "", operator: "" };
const EVAL_IDS: string[] = [];

async function as(userId: string, role: string | null, schoolId: string | null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, role ? { schoolId, role: role as never } : {});
  const ctx = await getSession();
  if (!ctx) throw new Error("no session");
  return ctx;
}

type Calls = { chat: ChatMessage[][]; curriculum: number; help: number };
/** A fake model and fake searches: the help passage at `help`, the books at `curriculum`, the classifier's word `label`. */
function fake(opts: { help?: number; curriculum?: number; label?: string; answer?: string; standard?: AssistantDeps["standardAnswer"] } = {}) {
  const calls: Calls = { chat: [], curriculum: 0, help: 0 };
  const helpHit = (sim: number): HelpHit => ({ entryId: "help-1", kind: "guide", title: "Asking for leave", text: "Open the leave page and press Apply.", pagePath: null, door: null, module: null, roles: [], language: "en", sourceFile: "guide", commit: "test", similarity: sim, vectorRank: 1, keywordRank: 1, score: 1 });
  const book = (sim: number): CurriculumHit => ({
    chunkId: "chunk-1", documentId: "doc-1", board: "NCERT", grade: "9", subject: "Science", book: "Exploration", edition: null, chapter: "Chapter 6", section: "6.6", headingPath: ["Chapter 6"],
    pageStart: 16, pageEnd: 16, text: "For every action there is an equal and opposite reaction.", language: "en", figureKeys: [], sourceUrl: "https://ncert.nic.in/textbook/pdf/iesc106.pdf", source: "ncert", attribution: null, similarity: sim, vectorRank: 1, keywordRank: 1, score: 1,
    citation: { board: "NCERT", book: "Exploration", chapter: null, section: null, page: 16, documentId: "doc-1", chunkId: "chunk-1", attribution: null },
  });
  const deps: AssistantDeps = {
    embed: async (texts) => texts.map(() => [0, 0, 1]),
    chat: async (messages): Promise<ChatResult> => {
      calls.chat.push(messages);
      const classifying = messages[0]!.content.startsWith("You classify");
      const base = { usage: { promptTokens: 100, completionTokens: classifying ? 1 : 20 }, tokensPerSecond: null, promptTokensPerSecond: null };
      if (classifying) return { ...base, content: messages[0]!.content.includes("an answer") ? (messages[1]!.content.includes("reaction") ? "CURRICULUM" : "PLATFORM") : (opts.label ?? "PLATFORM"), firstTokenLogprob: 0 };
      return { ...base, content: opts.answer ?? "Open the leave page and press Apply [1].", firstTokenLogprob: null, finishReason: "stop" };
    },
    searchHelp: async (q) => {
      calls.help++;
      return q.kinds?.includes("door") ? [] : [helpHit(opts.help ?? 0.2)];
    },
    searchCurriculum: async () => {
      calls.curriculum++;
      return [book(opts.curriculum ?? 0.2)];
    },
    runDoors: async () => [],
    publish: () => {},
    now: () => new Date(),
    standardAnswer: opts.standard,
  };
  return { deps, calls };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Vidura Three ${STAMP}`, slug: `zz-vidura3-${STAMP}`, code: `ZV3${String(STAMP).slice(-6)}`, contactEmail: `zz-vidura3-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", board: "CBSE" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "ASSISTANT" } });
  const mk = (who: string, name: string, extra: Record<string, boolean> = {}) => db.user.create({ data: { name, email: `zz-vidura3-${who}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [teacher, other, parent, pupil, operator] = await Promise.all([mk("teacher", "ZZ Three Teacher"), mk("other", "ZZ Three Other Teacher"), mk("parent", "ZZ Three Parent"), mk("pupil", "ZZ Three Pupil"), mk("operator", "ZZ Three Operator", { isSuperuser: true })]);
  Object.assign(ids, { teacher: teacher.id, other: other.id, parent: parent.id, operator: operator.id });
  ids.teacherM = (await db.membership.create({ data: { userId: teacher.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.otherM = (await db.membership.create({ data: { userId: other.id, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: pupil.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", gradeLevel: "9", studentCode: `ZV3P${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.cachedAnswer.deleteMany({ where: { createdByUserId: ids.operator } });
  await db.assistantEvalJob.deleteMany({ where: { id: { in: EVAL_IDS } } });
  await db.auditLog.deleteMany({ where: { actorUserId: ids.operator } });
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* 1. The gate                                                                 */
/* -------------------------------------------------------------------------- */

describe("1. the gate: the corpus only when it can change the verdict; the small model's port", () => {
  const classifier = (label: string) => ({ chat: async (): Promise<ChatResult> => ({ content: label, usage: { promptTokens: 10, completionTokens: 1 }, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: 0 }) });
  const base = { original: "q", stripped: "q", language: "en" as const };

  it("a help question the classifier calls PLATFORM never waits for the corpus; every other way reads it once", async () => {
    let searched = 0;
    const lazy = (top: number) => async () => (searched++, top);
    const admin = policyFor("ADMIN");
    const pupil = policyFor("STUDENT");
    // Help open, PLATFORM: no search.
    expect(await gateQuestion({ ...base, policy: admin, helpTop: HELP_THRESHOLD.en + 0.1, curriculumTop: lazy(0.9) }, classifier("PLATFORM"))).toMatchObject({ pass: true, mode: "HELP" });
    expect(searched).toBe(0);
    // Help closed: searched first, once, and below it nothing is sent to the classifier.
    expect(await gateQuestion({ ...base, policy: admin, helpTop: 0.1, curriculumTop: lazy(0.1) }, classifier("PLATFORM"))).toMatchObject({ pass: false, verdict: "OUT_OF_SCOPE", modelCalled: false });
    expect(searched).toBe(1);
    // CURRICULUM from a role without the tutor: read, and the one sentence.
    expect(await gateQuestion({ ...base, policy: admin, helpTop: HELP_THRESHOLD.en + 0.1, curriculumTop: lazy(CURRICULUM_THRESHOLD.en + 0.1) }, classifier("CURRICULUM"))).toMatchObject({ pass: false, verdict: "TUTOR_NOT_FOR_ROLE", label: "CURRICULUM" });
    expect(searched).toBe(2);
    // A pupil's pick of Learning reads it; the tutor's answer.
    expect(await gateQuestion({ ...base, policy: pupil, helpTop: HELP_THRESHOLD.en + 0.1, curriculumTop: lazy(CURRICULUM_THRESHOLD.en + 0.1), prefer: "CURRICULUM" }, classifier("PLATFORM"))).toMatchObject({ pass: true, mode: "TUTOR" });
    expect(searched).toBe(3);
    // The classifier's REFUSE is its own, marked so for the report.
    expect(await gateQuestion({ ...base, policy: admin, helpTop: HELP_THRESHOLD.en + 0.1, curriculumTop: lazy(0.9) }, classifier("REFUSE"))).toMatchObject({ verdict: "OUT_OF_SCOPE", label: "REFUSE" });
  });

  it("the same verdicts as reading the corpus first, over every label and scope", async () => {
    for (const role of ["ADMIN", "STUDENT"] as const)
      for (const label of ["PLATFORM", "CURRICULUM", "REFUSE"])
        for (const helpTop of [0.1, 0.9])
          for (const top of [0.1, 0.9])
            for (const prefer of [null, "PLATFORM", "CURRICULUM"] as const) {
              const input = { ...base, policy: policyFor(role), helpTop, prefer };
              const eager = await gateQuestion({ ...input, curriculumTop: top }, classifier(label));
              const lazy = await gateQuestion({ ...input, curriculumTop: async () => top }, classifier(label));
              expect(lazy).toEqual(eager);
            }
  });

  it("asks the small model, and the chat model only when the small one does not answer at all", async () => {
    const asked: string[] = [];
    const chat = { url: "http://127.0.0.1:8180/v1", model: "big", key: null };
    const small = { url: "http://127.0.0.1:8182/v1", model: "small", key: null };
    const ok = (content: string): ChatResult => ({ content, usage: null, tokensPerSecond: null, promptTokensPerSecond: null, firstTokenLogprob: 0 });
    const down = async (ep: { model: string }): Promise<ChatResult> => {
      asked.push(ep.model);
      if (ep.model === "small") throw Object.assign(new TypeError("fetch failed"), { cause: new Error("connect ECONNREFUSED 127.0.0.1:8182") });
      return ok("PLATFORM");
    };
    const port = gateClassifier(small, () => chat, down as never)!;
    expect((await port([], {} as ChatOptions)).content).toBe("PLATFORM");
    expect(asked).toEqual(["small", "big"]);
    // A slow small model is the classifier's own timeout: not asked twice.
    const slow = gateClassifier(small, () => chat, (async () => {
      throw Object.assign(new Error("timed out"), { name: "TimeoutError" });
    }) as never)!;
    await expect(slow([], {} as ChatOptions)).rejects.toThrow("timed out");
    expect(gateClassifier(null, () => chat)).toBeUndefined();
    expect(endpointUnreachable(new Error("chat endpoint answered 503: Loading model"))).toBe(true);
    expect(endpointUnreachable(new Error("chat endpoint answered 500: oops"))).toBe(false);
    expect(readGateConfig({})).toEqual({ ok: true, config: null });
    expect(readGateConfig({ ASSISTANT_GATE_MODEL_URL: "http://127.0.0.1:8182/v1", ASSISTANT_GATE_MODEL: "qwen3-4b" })).toMatchObject({ ok: true, config: { model: "qwen3-4b" } });
    expect(readGateConfig({ ASSISTANT_GATE_MODEL_URL: "http://127.0.0.1:8182/v1" }).ok).toBe(false);
  });

  it("each kind of run needs its servers, and hands its own to another kind's active run", async () => {
    expect(neededServers("QUIZ", { ASSISTANT_GATE_MODEL_URL: "x" })).toEqual(["chat", "embed"]);
    expect(neededServers("EVAL", {})).toEqual(["chat", "embed"]);
    expect(neededServers("EVAL", { ASSISTANT_GATE_MODEL_URL: "http://127.0.0.1:8182/v1" })).toEqual(["chat", "embed", "small"]);
    expect(splitAtEnd(["small"], { startedServers: ["chat"] })).toEqual({ stop: [], keepFor: ["chat", "small"] });
    // A fake database: an evaluation ending while only a crawl is active hands the crawl its servers.
    const given: { kind: string; servers: string[] }[] = [];
    const table = (kind: string, active: boolean) => ({
      findFirst: async () => (active ? { id: `${kind}-1`, startedServers: [] as string[] } : null),
      updateMany: async ({ data }: { data: { startedServers: string[] } }) => (given.push({ kind, servers: data.startedServers }), { count: 1 }),
      count: async () => (active ? 1 : 0),
    });
    const fakeDb = { quizGenJob: table("quiz", false), competitionCrawlJob: table("crawl", true), assistantEvalJob: table("eval", false) } as unknown as HolderDb;
    expect(await handOverTo(fakeDb, "EVAL")(["chat", "small"] as ModelServer[])).toEqual([]);
    expect(given).toEqual([{ kind: "crawl", servers: ["chat", "small"] }]);
    const none = { quizGenJob: table("quiz", false), competitionCrawlJob: table("crawl", false), assistantEvalJob: table("eval", false) } as unknown as HolderDb;
    expect(await handOverTo(none, "QUIZ")(["embed"] as ModelServer[])).toEqual(["embed"]);
  });
});

/* -------------------------------------------------------------------------- */
/* 2. Standard answers                                                         */
/* -------------------------------------------------------------------------- */

describe("2. standard answers", () => {
  it("reads two ways of asking as one question, per language", () => {
    expect(questionKey("How can I apply for leave?", "en")).toBe(questionKey("  how do i apply for LEAVE ", "en"));
    expect(questionKey("Please, how to apply for leave", "en")).toBe("en|how do i apply for leave");
    expect(questionKey("Where can I see the timetable?", "en")).toBe("en|where do i see the timetable");
    expect(questionKey("छुट्टी के लिए आवेदन कैसे करें?", "hi")).toBe("hi|छुट्टी के लिए आवेदन कैसे करें");
    expect(questionKey("कृपया रजेसाठी अर्ज कसा करावा।", "mr")).toBe("mr|रजेसाठी अर्ज कसा करावा");
    expect(questionKey("how do i apply for leave", "en")).not.toBe(questionKey("how do i apply for leave", "hi"));
  });

  it("only an answered \"Using Shalaghar\" how-to or where-is answer that cites nobody's records may be checked", () => {
    const ok = { verdict: "ANSWERED", chip: "USING", citationsJson: "[]", question: "how do I apply for leave" };
    expect(markable(ok)).toBe(true);
    expect(markable({ ...ok, chip: "RECORDS" })).toBe(false);
    expect(markable({ ...ok, verdict: "OUT_OF_SCOPE" })).toBe(false);
    expect(markable({ ...ok, question: "how much fee is due" })).toBe(false);
    expect(markable({ ...ok, citationsJson: JSON.stringify([{ kind: "LINK", n: 7 }]) })).toBe(false);
  });

  it("the operator asks as a role, checks the answer, and a teacher asking the same is served it with no model; counted; revoked, never again", async () => {
    const operator = await as(ids.operator, null, null);
    const trial = fake({ help: HELP_THRESHOLD.en + 0.1 });
    const draft = await tryStandardAnswer(operator, { role: "TEACHER", question: "How can I apply for leave?" }, trial.deps);
    expect(draft).toMatchObject({ state: "DRAFT", verdict: "ANSWERED", chip: "USING", markable: true, role: "TEACHER", language: "en", questionKey: "en|how do i apply for leave" });
    // A draft is never served.
    expect(await findStandardAnswer({ role: "TEACHER", language: "en", question: "how do I apply for leave" })).toBeNull();
    const checked = await actOnStandardAnswer(operator, draft.id, { action: "CHECK" });
    expect(checked).toMatchObject({ state: "STANDARD", checkedBy: "ZZ Three Operator" });
    expect(await actOnStandardAnswer(operator, draft.id, { action: "CHECK" })).toMatchObject({ state: "STANDARD" });

    const teacher = await as(ids.teacher, "TEACHER", ids.school);
    const conv = await openConversation(teacher, { language: "en" });
    const served = fake({ help: HELP_THRESHOLD.en + 0.1, standard: findStandardAnswer });
    const out = await ask(teacher, conv.id, { text: "how do I apply for leave" }, served.deps);
    expect(out.answer).toMatchObject({ verdict: "ANSWERED", chip: "USING", standard: true, text: draft.text });
    // The tables, the thresholds and the classifier were asked; the answering model and the answer's check were not.
    expect(served.calls.chat.map((m) => m[0]!.content.slice(0, 40))).toEqual([expect.stringContaining("You classify a question")]);
    expect(served.calls.curriculum).toBe(0);
    const row = await db.assistantMessage.findFirst({ where: { conversationId: conv.id, role: "ASSISTANT" }, select: { cachedAnswerId: true, scope: true } });
    expect(row).toEqual({ cachedAnswerId: draft.id, scope: "USING" });
    expect((await db.cachedAnswer.findUnique({ where: { id: draft.id } }))!.hitCount).toBe(1);
    const usage = await db.assistantUsage.findFirst({ where: { schoolId: ids.school, userId: ids.teacher }, select: { standardAnswers: true, answered: true } });
    expect(usage).toEqual({ standardAnswers: 1, answered: 1 });

    // The pick of My records, a parent, another language: the model as before.
    const pick = fake({ help: HELP_THRESHOLD.en + 0.1, standard: findStandardAnswer });
    expect((await ask(teacher, conv.id, { text: "how do I apply for leave", mode: "RECORDS" }, pick.deps)).answer.standard).toBe(false);
    expect(await findStandardAnswer({ role: "PARENT", language: "en", question: "how do I apply for leave" })).toBeNull();
    expect(await findStandardAnswer({ role: "TEACHER", language: "hi", question: "how do I apply for leave" })).toBeNull();

    // Revoked: the model again, and the desk lists it under revoked with its hits.
    expect(await actOnStandardAnswer(operator, draft.id, { action: "REVOKE" })).toMatchObject({ state: "REVOKED", hits: 1 });
    const after = fake({ help: HELP_THRESHOLD.en + 0.1, standard: findStandardAnswer });
    expect((await ask(teacher, conv.id, { text: "How can I apply for leave?" }, after.deps)).answer.standard).toBe(false);
    expect(after.calls.chat.some((m) => m[0]!.content.startsWith("You are Vidura"))).toBe(true);
    const desk = await listStandardAnswers(operator);
    expect(desk.revoked.some((a) => a.id === draft.id)).toBe(true);
    await expect(actOnStandardAnswer(operator, draft.id, { action: "CHECK" })).rejects.toMatchObject({ key: "viduraOps.errRevokedStays" });
    const audits = await db.auditLog.findMany({ where: { actorUserId: ids.operator, targetId: draft.id }, select: { action: true } });
    expect(audits.map((a) => a.action).sort()).toEqual(["vidura.answer.check", "vidura.answer.revoke", "vidura.answer.try"]);
  });

  it("an answer that is not markable cannot be checked; a draft can be discarded; nobody else may act", async () => {
    const operator = await as(ids.operator, null, null);
    const refused = await tryStandardAnswer(operator, { role: "TEACHER", question: "how do I apply for leave tomorrow please" }, fake({ help: 0.1 }).deps);
    expect(refused).toMatchObject({ verdict: "OUT_OF_SCOPE", markable: false });
    await expect(actOnStandardAnswer(operator, refused.id, { action: "CHECK" })).rejects.toMatchObject({ key: "viduraOps.errNotMarkable" });
    expect(await actOnStandardAnswer(operator, refused.id, { action: "DISCARD" })).toBeNull();
    expect(await db.cachedAnswer.findUnique({ where: { id: refused.id } })).toBeNull();
    const teacher = await as(ids.teacher, "TEACHER", ids.school);
    await expect(listStandardAnswers(teacher)).rejects.toMatchObject({ key: "access.thisAreaBelongsToWhoeverRunsThe" });
  });
});

/* -------------------------------------------------------------------------- */
/* 3. The unanswered report                                                    */
/* -------------------------------------------------------------------------- */

describe("3. the unanswered report", () => {
  it("keeps the mode and the reason on the answer row: nothing found, the classifier's refusal", async () => {
    const teacher = await as(ids.other, "TEACHER", ids.school);
    const conv = await openConversation(teacher, { language: "en" });
    await ask(teacher, conv.id, { text: "who won the cricket match" }, fake({ help: 0.1, curriculum: 0.1 }).deps);
    await ask(teacher, conv.id, { text: "tell me a joke about a register" }, fake({ help: HELP_THRESHOLD.en + 0.1, label: "REFUSE" }).deps);
    const rows = await db.assistantMessage.findMany({ where: { conversationId: conv.id, role: "ASSISTANT" }, orderBy: { createdAt: "asc" }, select: { verdict: true, scope: true, gateReasons: true } });
    expect(rows).toEqual([
      { verdict: "OUT_OF_SCOPE", scope: null, gateReasons: "NOTHING_FOUND" },
      { verdict: "OUT_OF_SCOPE", scope: null, gateReasons: "CLASSIFIER" },
    ]);
  });

  it("counts per school, day, role, mode, verdict and reason; never the counsellor routes; the report and its CSV", async () => {
    // A self-harm row of this school, which is never counted here.
    const conv = await db.assistantConversation.create({ data: { schoolId: ids.school, membershipId: ids.pupilM, userId: ids.parent, role: "STUDENT", language: "en" } });
    await db.assistantMessage.create({ data: { conversationId: conv.id, schoolId: ids.school, role: "ASSISTANT", text: "x", verdict: "SELF_HARM" } });
    const now = new Date();
    const counted = await countGaps(now, { schoolIds: [ids.school] });
    expect(counted.perSchool[ids.school]).toMatchObject({ refused: 2 });
    const rows = await db.assistantGapCount.findMany({ where: { schoolId: ids.school }, select: { role: true, scope: true, verdict: true, reason: true, count: true } });
    expect(rows.some((r) => r.verdict === "SELF_HARM")).toBe(false);
    expect(rows).toEqual(expect.arrayContaining([{ role: "TEACHER", scope: "NONE", verdict: "OUT_OF_SCOPE", reason: "NOTHING_FOUND", count: 1 }, { role: "TEACHER", scope: "NONE", verdict: "OUT_OF_SCOPE", reason: "CLASSIFIER", count: 1 }]));
    // Again: the window rewritten, not added to.
    await countGaps(now, { schoolIds: [ids.school] });
    expect(await db.assistantGapCount.count({ where: { schoolId: ids.school } })).toBe(rows.length);

    const operator = await as(ids.operator, null, null);
    const report = await unansweredReport(operator, now);
    expect(report.bySchool.find((s) => s.schoolId === ids.school)).toMatchObject({ refused: 2 });
    expect(report.byReason.map((r) => r.reason)).toEqual(expect.arrayContaining(["NOTHING_FOUND", "CLASSIFIER"]));
    const csv = await unansweredCsv(operator, now);
    expect(csv.filename).toMatch(/^vidura-unanswered-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(csv.csv.split("\r\n")[0]).toBe("table,key,language,role,questions,refused,discarded,count,people");
    expect(csv.csv).toContain(`school,ZZ Vidura Three ${STAMP}`);
    expect(await db.auditLog.count({ where: { actorUserId: ids.operator, action: "vidura.unanswered.export" } })).toBe(1);
    await expect(unansweredReport(await as(ids.teacher, "TEACHER", ids.school), now)).rejects.toMatchObject({ key: "access.thisAreaBelongsToWhoeverRunsThe" });
  });

  it("keeps a stem only when two people asked it, never a whole question, and reads the stripped words only", () => {
    expect(stemOf("How do I find the [PERSON_1] bus route for Grade 6 tomorrow morning?")).toBe("how do i find the bus");
    expect(verdictColumn("ANSWER_DISCARDED")).toBe("discarded");
    expect(verdictColumn("OUT_OF_SCOPE")).toBe("refused");
    expect(verdictColumn("HINT")).toBe("answered");
    const kept = groupStems([
      { stripped: "where is the bus route page today", role: "PARENT", userId: "a", conversationLanguage: "en" },
      { stripped: "Where is the bus route page, please?", role: "PARENT", userId: "b", conversationLanguage: "en" },
      { stripped: "where is the hostel menu", role: "PARENT", userId: "a", conversationLanguage: "en" },
      { stripped: "where is the hostel menu", role: "PARENT", userId: "a", conversationLanguage: "en" },
      { stripped: null, role: "PARENT", userId: "c", conversationLanguage: "en" },
    ]);
    expect(kept).toEqual([{ language: "en", role: "PARENT", stem: "where is the bus route page", questions: 2, people: 2 }]);
  });

  it("the job is on the registry, nightly, clear of the busy minutes", () => {
    expect(JOBS["vidura:gaps"]).toMatchObject({ schedule: "50 2 * * *", describeKey: "root.jobDescViduraGaps", narrows: ["schoolIds"] });
  });
});

/* -------------------------------------------------------------------------- */
/* 4. Evaluation runs                                                          */
/* -------------------------------------------------------------------------- */

describe("4. evaluation runs from the panel", () => {
  /** The fake machine: servers up or down, the script's calls recorded, runners that are pids we say live. */
  function machine(up: Partial<Record<ModelServer, boolean>>) {
    const calls: string[] = [];
    const alive = new Set<number>();
    let next = 970_000 + Math.floor(Math.random() * 20_000);
    const deps: EvalDeps = {
      health: async (s) => (up[s] ? "ok" : "down"),
      serve: async (command) => {
        calls.push(command);
        const [verb, server] = command.split("-") as ["start" | "stop", ModelServer];
        up[server] = verb === "start";
      },
      pidAlive: (pid) => alive.has(pid),
      serverPid: (s) => (up[s] ? 4_242 : null),
      spawnRunner: (jobId) => {
        calls.push(`spawn ${jobId}`);
        const pid = next++;
        alive.add(pid);
        return pid;
      },
      now: () => new Date(),
      handOver: async (servers) => servers,
    };
    return { deps, calls, alive };
  }
  const evalDb = db as unknown as EvalDb;

  /**
   * A real evaluation run may be going on this database (the panel's, on this machine): every read reaps, and a fake
   * machine's pids would read the real runner as dead and end it (it happened twice on 18 October 2026). These cases
   * skip while one is active — and while a real generation run or crawl holds the model (19 October 2026), since
   * startEval then refuses with errModelBusy by design, which is the holders rule, not these cases' question.
   */
  const realRunActive = async () =>
    (await db.assistantEvalJob.count({ where: { active: true } })) > 0 ||
    (await db.quizGenJob.count({ where: { active: true } })) > 0 ||
    (await db.competitionCrawlJob.count({ where: { active: true } })) > 0;

  it("starts one run at a time, bringing up the servers it needs that were down, and records them", async (ctx) => {
    if (await realRunActive()) ctx.skip();
    const m = machine({ chat: true, embed: false });
    const job = await startEval(evalDb, { userId: ids.operator }, { sets: ["refusal", "refusal", "role"], limit: 5 }, m.deps);
    EVAL_IDS.push(job.id);
    expect(job).toMatchObject({ state: "QUEUED", request: { sets: ["refusal", "role"], limit: 5 }, startedServers: ["embed"] });
    expect(m.calls).toEqual(["start-embed", `spawn ${job.id}`]);
    await expect(startEval(evalDb, { userId: ids.operator }, { sets: ["help"] }, m.deps)).rejects.toMatchObject({ errorKey: "viduraOps.errOneAtATime", status: 409 });
    const state = await readEvals(evalDb, m.deps);
    expect(state.current?.id).toBe(job.id);
    expect(state.servers.map((s) => s.server)).toEqual(["chat", "chat2", "embed", "small"]);

    // The runner's end: the scores kept, the slot freed, the server it brought up taken down.
    expect(await finishEval(evalDb, job.id, "FINISHED", m.deps, { scores: [{ set: "refusal", cases: 5, pass: 5, gate: true, lines: ["by language: en 5/5"] }], gate: true })).toBe(true);
    expect(await finishEval(evalDb, job.id, "FAILED", m.deps)).toBe(false);
    expect(m.calls.at(-1)).toBe("stop-embed");
    const ended = (await readEvals(evalDb, m.deps)).recent.find((r) => r.id === job.id)!;
    expect(ended).toMatchObject({ state: "FINISHED", gate: true, scores: [{ set: "refusal", pass: 5, cases: 5 }] });
  });

  it("Stop asks the runner, and a runner that is gone is reaped STOPPED at once", async (ctx) => {
    if (await realRunActive()) ctx.skip();
    const m = machine({ chat: true, embed: true });
    const job = await startEval(evalDb, { userId: ids.operator }, { sets: ["counsellor"] }, m.deps);
    EVAL_IDS.push(job.id);
    expect(job.startedServers).toEqual([]);
    m.alive.clear();
    expect(await stopEval(evalDb, job.id, { userId: ids.operator }, m.deps)).toMatchObject({ state: "STOPPED" });
    await expect(stopEval(evalDb, "zz-no-such-run", { userId: ids.operator }, m.deps)).rejects.toMatchObject({ errorKey: "viduraOps.errNoSuchRun", status: 404 });
  });
});

/* -------------------------------------------------------------------------- */
/* 5. The operator's pages                                                     */
/* -------------------------------------------------------------------------- */

describe("5. the operator's pages", () => {
  it("the dashboard's card and the unanswered report draw from the libraries, in the reader's words", async () => {
    const t = translator("en");
    // Every pid alive: a real run going on this database is never reaped by this read.
    useEvalDepsForTests({ health: async () => "ok", serve: async () => {}, pidAlive: () => true, serverPid: () => null, spawnRunner: () => 0, now: () => new Date(), handOver: async (s) => s });
    await as(ids.operator, null, null);
    const card = renderToStaticMarkup(await ViduraOpsCard({ session: (await getSession())! }));
    expect(card).toContain('data-testid="vidura-ops-card"');
    expect(card).toContain(t("viduraOps.cardTitle"));
    expect(card).toContain('href="/root/vidura-unanswered"');
    expect(card).toContain('href="/root/vidura-evals"');
    const page = renderToStaticMarkup(await RootViduraUnansweredPage());
    expect(page).toContain(t("viduraOps.gapsTitle"));
    expect(page).toContain('href="/api/v1/operator/vidura/unanswered/export"');
    expect(page).toContain(`ZZ Vidura Three ${STAMP}`);
    expect(page).toContain(t("viduraOps.reason.NOTHING_FOUND"));
    expect(page).toContain(t("viduraOps.stemsTitle"));
    useEvalDepsForTests(null);
  });
});
