/**
 * Generation started and stopped from the bank desk, and the two model servers (quiz-publish-jobs,
 * 11 October 2026): src/lib/quiz-jobs.ts (the one writer of a run's row and the only caller of
 * scripts/model-serve.sh), its desk gate src/lib/quiz-jobs-desk.ts, the doors under
 * /api/v1/appadmin/quiz-jobs, the runner's plan (scripts/quiz-gen/plan.ts) and its halt
 * (scripts/quiz-gen/pipeline.ts shouldStop), and the dashboards' line.
 *
 * The machine is FAKED here: the servers' health, the script, the runner's spawn and its pid are the
 * suite's own (JobDeps), so nothing is started or stopped on the machine and no model is called. The one
 * real run, end to end with the real servers, is the builder's report's. Every row is a ZZ row made here
 * and removed after.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { modelServersSchema, quizGenJobReadSchema, quizGenRequestSchema, quizJobsStateSchema, type ModelServer, type QuizGenRequest } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { deadReason, emptyProgress, finishJob, forgetHealth, heartbeat, JobRefusal, markRunning, modelServers, readJobs, reapJobs, startJob, startModelServer, stopJob, stopModelServer, writeProgress, type JobDb, type JobDeps, type ServeCommand } from "@/lib/quiz-jobs";
import { useJobDepsForTests } from "@/lib/quiz-jobs-desk";
import { ENDPOINTS } from "@/lib/api-catalog";
import { translator } from "@/lib/i18n/dictionary";
import { ModelServersCard } from "@/components/quiz-review/model-servers-card";
import { GET as jobsGet, POST as jobsPost } from "@/app/api/v1/appadmin/quiz-jobs/route";
import { GET as jobGet } from "@/app/api/v1/appadmin/quiz-jobs/[jobId]/route";
import { POST as jobStopPost } from "@/app/api/v1/appadmin/quiz-jobs/[jobId]/stop/route";
import { GET as serversGet } from "@/app/api/v1/appadmin/quiz-jobs/servers/route";
import { POST as serverStartPost } from "@/app/api/v1/appadmin/quiz-jobs/servers/[server]/start/route";
import { POST as serverStopPost } from "@/app/api/v1/appadmin/quiz-jobs/servers/[server]/stop/route";
import { chaptersWanted, planCombos } from "../scripts/quiz-gen/plan";
import { landChapter } from "../scripts/quiz-gen/job";
import type { GeneratedTopicFile } from "../scripts/quiz-gen/shape";
import { isServed } from "@/lib/quiz-served";
import { runChapter } from "../scripts/quiz-gen/pipeline";
import type { ChatClient } from "../scripts/quiz-gen/model";
import type { SelectedChapter } from "../scripts/quiz-gen/select";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });
// The components compile with the classic JSX runtime under vitest (as tests/accounts-refunds-awaiting-page.test.ts does).
(globalThis as { React?: typeof React }).React = React;

const db = new PrismaClient();
const jobDb = db as unknown as JobDb;
const STAMP = Date.now();
const P = "/api/v1/appadmin/quiz-jobs";
const ids = { curator: "", operator: "", admin: "", teacher: "" };
let schoolId = "";
const made: string[] = [];
const LAND_SLUG = `zz-qj-land-${STAMP}`;

/** The fake machine: two servers up or down, the script's calls recorded, runners that are pids we say live. */
function machine(up: Record<ModelServer, boolean>) {
  const calls: string[] = [];
  const alive = new Set<number>();
  const started = new Set<ModelServer>();
  let nextPid = 900_000 + Math.floor(Math.random() * 50_000);
  const deps: JobDeps = {
    health: async (s) => (up[s] ? "ok" : "down"),
    serve: async (command: ServeCommand) => {
      calls.push(command);
      const [verb, server] = command.split("-") as ["start" | "stop", ModelServer];
      up[server] = verb === "start";
      if (verb === "start") started.add(server);
      else started.delete(server);
    },
    pidAlive: (pid) => alive.has(pid),
    // The script's pid file: a server it started; one already up "for the assistant" was started by the script too.
    serverPid: (s) => (up[s] ? 4_242 : null),
    spawnRunner: (jobId) => {
      calls.push(`spawn ${jobId}`);
      const pid = nextPid++;
      alive.add(pid);
      return pid;
    },
    now: () => new Date(),
  };
  return { deps, calls, alive, up };
}

const who = (role: "APP_ADMIN" | "OPERATOR" = "OPERATOR") => ({ userId: role === "OPERATOR" ? ids.operator : ids.curator, role });
const CHAPTER: QuizGenRequest = { scope: "CHAPTERS", board: "NCERT", grade: 8, subject: "SCIENCE", chapterFrom: 4, chapterTo: 4, limit: 4 };

async function start(m: ReturnType<typeof machine>, request: QuizGenRequest = CHAPTER, role: "APP_ADMIN" | "OPERATOR" = "OPERATOR") {
  const job = await startJob(jobDb, who(role), request, m.deps);
  made.push(job.id);
  return job;
}

/** What the runner does when it halts: its own finish through the library. */
const runnerHalts = (jobId: string, m: ReturnType<typeof machine>) => finishJob(jobDb, jobId, "STOPPED", m.deps);

const get = (path: string) => new Request(`http://localhost${path}`);
const post = (path: string, body?: unknown) =>
  new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });

async function signInAs(whom: "CURATOR" | "OPERATOR" | "ADMIN" | "TEACHER" | "OUT") {
  __resetCookies();
  if (whom === "CURATOR") await createSession(ids.curator);
  else if (whom === "OPERATOR") await createSession(ids.operator);
  else if (whom === "ADMIN") await createSession(ids.admin, { schoolId, role: "ADMIN" });
  else if (whom === "TEACHER") await createSession(ids.teacher, { schoolId, role: "TEACHER" });
}

/** Ends every run this suite left active, through the library (never a bare update). */
async function settle(m: ReturnType<typeof machine>) {
  for (const id of made) await finishJob(jobDb, id, "STOPPED", m.deps);
}

beforeAll(async () => {
  // The suite reaps with a fake machine: a real run going on the dev database would be reaped too. Refuse to run under one.
  const real = await db.quizGenJob.count({ where: { active: true } });
  if (real > 0) throw new Error("a generation run is active on this database: stop it before running tests/quiz-jobs.test.ts");
  const school = await db.school.create({
    data: { name: `ZZ QJ School ${STAMP}`, slug: `zz-qj-${STAMP}`, code: `ZJ${String(STAMP).slice(-6)}`, contactEmail: `zz-qj-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true },
    select: { id: true },
  });
  schoolId = school.id;
  const make = (name: string, flags: { isAppAdmin?: boolean; isSuperuser?: boolean } = {}) =>
    db.user.create({ data: { name: `ZZ QJ ${name}`, email: `zz-qj-${name.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true, ...flags }, select: { id: true } });
  const [c, o, a, t] = await Promise.all([make("Curator", { isAppAdmin: true }), make("Operator", { isSuperuser: true }), make("Admin"), make("Teacher")]);
  Object.assign(ids, { curator: c.id, operator: o.id, admin: a.id, teacher: t.id });
  await db.membership.create({ data: { userId: a.id, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: t.id, schoolId, role: "TEACHER", status: "ACTIVE" } });
});

beforeEach(() => forgetHealth());

afterAll(async () => {
  __resetCookies();
  useJobDepsForTests(null);
  forgetHealth();
  const people = Object.values(ids).filter(Boolean);
  await db.quizGenJob.deleteMany({ where: { OR: [{ id: { in: made } }, { startedByUserId: { in: people } }] } });
  // The landed ZZ chapter: its questions and translations cascade with it.
  await db.quizTopic.deleteMany({ where: { slug: LAND_SLUG } });
  await db.session.deleteMany({ where: { userId: { in: people } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: people } } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

describe("the request and the plan", () => {
  it("a chapter run names its board, class and subject; a range runs low to high", () => {
    expect(quizGenRequestSchema.safeParse({ scope: "EVERYTHING" }).success).toBe(true);
    expect(quizGenRequestSchema.safeParse({ scope: "CHAPTERS", board: "NCERT" }).success).toBe(false);
    expect(quizGenRequestSchema.safeParse({ ...CHAPTER, chapterFrom: 5, chapterTo: 4 }).success).toBe(false);
    expect(quizGenRequestSchema.safeParse({ ...CHAPTER, subject: "ASTROLOGY" }).success).toBe(false);
    expect(chaptersWanted([3, 1, 2, 2, 7], { chapterFrom: 2, chapterTo: 3 })).toEqual([2, 3]);
    expect(chaptersWanted([3, 1, 2], {})).toEqual([1, 2, 3]);
  });

  it("everything not yet generated: classes 6 to 10 mathematics and science first, both boards, then the rest", () => {
    const inventory = [
      { source: "ncert", grade: "11", subject: "Physics" },
      { source: "balbharati", grade: "6", subject: "Science" },
      { source: "ncert", grade: "3", subject: "Mathematics" },
      { source: "ncert", grade: "6", subject: "Mathematics" },
      { source: "ncert", grade: "8", subject: "Social Science" }, // no bank code: left out
      { source: "balbharati", grade: "6", subject: "Mathematics" },
      { source: "ncert", grade: "10", subject: "Science" },
      { source: "ncert", grade: "6", subject: "Science" },
      { source: "balbharati", grade: "8", subject: "History" },
    ];
    const plan = planCombos({ scope: "EVERYTHING" }, inventory).map((c) => `${c.boardCode} ${c.grade} ${c.subjectCode}`);
    expect(plan).toEqual(["BALBHARATI 6 MATHS", "NCERT 6 MATHS", "BALBHARATI 6 SCIENCE", "NCERT 6 SCIENCE", "NCERT 10 SCIENCE", "NCERT 3 MATHS", "BALBHARATI 8 HISTORY", "NCERT 11 PHYSICS"]);
    expect(planCombos(CHAPTER, [...inventory, { source: "ncert", grade: "8", subject: "Science" }]).map((c) => `${c.board} ${c.grade} ${c.subject}`)).toEqual(["NCERT 8 Science"]);
  });

  it("a stop halts a chapter before anything is drafted: the pipeline returns stopped and writes nothing", async () => {
    const client: ChatClient = {
      model: "zz-no-model",
      json: async () => {
        throw new Error("no model call may happen after a stop");
      },
      embed: async () => {
        throw new Error("no model call may happen after a stop");
      },
    };
    const chunk = { id: "zz-c1", ordinal: 0, headingPath: ["ZZ"], pageStart: 1, pageEnd: 1, text: "ZZ a passage about magnets.", tokens: 400, figureKeys: [] };
    const chapter = { board: "NCERT", source: "ncert", book: "ZZ", bookCode: null, documentPath: "zz/zz.pdf", classLevel: 8, subject: "Science", subjectCode: "SCIENCE", chapterNumber: 4, chapterName: "ZZ", chapterLabel: "Chapter 4 — ZZ", edition: null, sourceUrl: "https://zz.invalid", chunks: [chunk], figures: new Map(), headings: [] } as unknown as SelectedChapter;
    const seen: unknown[] = [];
    const r = await runChapter(client, chapter, { limit: 4, perLevel: 4, bankStems: [], glossary: [], style: { present: false, excerpts: [], note: "zz" }, log: () => {}, shouldStop: () => true, onProgress: (p) => seen.push(p) });
    expect(r.stopped).toBe(true);
    expect(r.questions).toEqual([]);
    expect(r.log.kept).toBe(0);
  });
});

describe("a finished chapter lands in the bank as it goes", () => {
  it("the runner's landing verifies, loads the batch and the items are served at once; a bank that does not verify leaves it unloaded", async () => {
    const file = {
      subject: "SCIENCE",
      classLevel: 8,
      chapter: "ZZ Chapter",
      name: `ZZ QJ Landing ${STAMP}`,
      slug: LAND_SLUG,
      summary: "",
      position: 99,
      source: "generated against ZZ",
      licence: "test",
      board: "NCERT",
      translations: {},
      questions: [
        { difficulty: 1, stem: `ZZ QJ ${STAMP}: what is 3+4?`, choices: ["7", "5", "12", "-7"], answerIndex: 0, solution: "ZZ: three and four make seven.", checkExpr: "3+4", translations: { hi: { stem: `ZZ QJ ${STAMP}: 3+4 कितना है?`, choices: ["७", "५", "१२", "-७"], solution: "ZZ: सात।" } } },
      ],
    } as unknown as GeneratedTopicFile;
    const refused = await landChapter(db, "zz-qj.json", file, () => "ZZ: the bank did not verify");
    expect(refused).toEqual({ loaded: 0, figuresHeld: 0, problem: "ZZ: the bank did not verify" });
    expect(await db.quizTopic.count({ where: { slug: LAND_SLUG } })).toBe(0);
    const landed = await landChapter(db, "zz-qj.json", file, () => null);
    expect(landed).toEqual({ loaded: 1, figuresHeld: 0, problem: null });
    const row = await db.quizQuestion.findFirstOrThrow({ where: { topic: { slug: LAND_SLUG } }, select: { generated: true, takenDownAt: true, needsFigure: true, imageKey: true, reviewedAt: true, translations: { select: { language: true } } } });
    expect(row).toMatchObject({ generated: true, reviewedAt: null });
    expect(isServed(row), "published without review").toBe(true);
    expect(row.translations.map((t) => t.language)).toEqual(["hi"]);
  });
});

describe("the job's state machine", () => {
  it("Start with both servers up: none started, the runner spawned and its pid kept, QUEUED → RUNNING; a second Start is refused", async () => {
    const m = machine({ chat: true, embed: true });
    const job = await start(m);
    expect(job.state).toBe("QUEUED");
    expect(job.startedServers).toEqual([]);
    expect(job.progress?.phase).toBe("PLANNING");
    expect(m.calls).toEqual([`spawn ${job.id}`]);
    const row = await db.quizGenJob.findUniqueOrThrow({ where: { id: job.id }, select: { pid: true, active: true, startedByRole: true } });
    expect(row.active).toBe(true);
    expect(m.alive.has(row.pid!)).toBe(true);
    expect(row.startedByRole).toBe("OPERATOR");
    await expect(start(m, { scope: "EVERYTHING" }, "APP_ADMIN")).rejects.toMatchObject({ errorKey: "quizJobs.oneAtATime", status: 409 });
    expect(await db.quizGenJob.count({ where: { active: true } })).toBe(1);

    // The runner's side: running, a progress line after an item, its beat.
    expect(await markRunning(jobDb, job.id)).toBe(true);
    const p = { ...emptyProgress("GENERATING"), drafted: 3, kept: 2 };
    await writeProgress(jobDb, job.id, p);
    expect((await readJobs(jobDb, m.deps)).current).toMatchObject({ id: job.id, state: "RUNNING", progress: { phase: "GENERATING", drafted: 3, kept: 2 } });
    expect(await heartbeat(jobDb, job.id)).toBe("RUNNING");

    // Stop while running: STOPPING, read by the runner on its next beat; the runner halts and ends its run.
    expect((await stopJob(jobDb, job.id, { userId: ids.curator }, m.deps)).state).toBe("STOPPING");
    expect(await heartbeat(jobDb, job.id)).toBe("STOPPING");
    expect(await runnerHalts(job.id, m)).toBe(true);
    const ended = await db.quizGenJob.findUniqueOrThrow({ where: { id: job.id }, select: { state: true, active: true, pid: true, finishedAt: true, stopRequestedBy: true } });
    expect(ended).toMatchObject({ state: "STOPPED", active: null, pid: null, stopRequestedBy: ids.curator });
    expect(ended.finishedAt).not.toBeNull();
    // This run started no server, so it stopped none: they were up for the assistant and stay up.
    expect(m.calls.filter((c) => c.startsWith("stop-"))).toEqual([]);
    expect(m.up).toEqual({ chat: true, embed: true });
    // Ended once: a second finish changes nothing; a stop of an ended run is left as it is.
    expect(await finishJob(jobDb, job.id, "FAILED", m.deps, "zz")).toBe(false);
    expect((await stopJob(jobDb, job.id, { userId: ids.curator }, m.deps)).state).toBe("STOPPED");
  });

  it("Start with the servers down brings both up through the script and records them; the run's end takes exactly those down", async () => {
    const m = machine({ chat: false, embed: false });
    const job = await start(m);
    expect(job.startedServers.sort()).toEqual(["chat", "embed"]);
    expect(job.progress?.phase).toBe("STARTING_MODEL");
    expect(m.calls.slice(0, 2).sort()).toEqual(["start-chat", "start-embed"]);
    await stopJob(jobDb, job.id, { userId: ids.operator }, m.deps);
    await runnerHalts(job.id, m);
    expect(m.calls.filter((c) => c.startsWith("stop-")).sort()).toEqual(["stop-chat", "stop-embed"]);
    expect(m.up).toEqual({ chat: false, embed: false });
  });

  it("only the server that was down is started, and only it goes down at the end (the other stays up for the assistant)", async () => {
    const m = machine({ chat: true, embed: false });
    const job = await start(m);
    expect(job.startedServers).toEqual(["embed"]);
    await markRunning(jobDb, job.id);
    await finishJob(jobDb, job.id, "FINISHED", m.deps);
    expect(m.calls.filter((c) => /^(start|stop)-/.test(c))).toEqual(["start-embed", "stop-embed"]);
    expect(m.up).toEqual({ chat: true, embed: false });
  });

  it("a dead pid: the active row becomes FAILED with the reason on the next read, the slot frees, its servers go down; stopping a dead STOPPING runner reaps it STOPPED", async () => {
    const m = machine({ chat: false, embed: true });
    const job = await start(m);
    await markRunning(jobDb, job.id);
    const { pid } = await db.quizGenJob.findUniqueOrThrow({ where: { id: job.id }, select: { pid: true } });
    expect(deadReason({ pid, state: "RUNNING", createdAt: new Date(), heartbeatAt: new Date() }, m.deps)).toBeNull();
    m.alive.delete(pid!);
    const state = await readJobs(jobDb, m.deps);
    expect(state.current).toMatchObject({ id: job.id, state: "FAILED" });
    expect(state.current?.error).toContain(`pid ${pid}`);
    expect(m.calls).toContain("stop-chat");
    expect(m.calls).not.toContain("stop-embed");
    // A stale heartbeat counts as dead too (a pid reused after a restart).
    expect(deadReason({ pid: 1, state: "RUNNING", createdAt: new Date(), heartbeatAt: new Date(Date.now() - 11 * 60_000) }, { ...m.deps, pidAlive: () => true })).toContain("has not written");

    const second = await start(m);
    await stopJob(jobDb, second.id, { userId: ids.operator }, { ...m.deps, pidAlive: () => true });
    m.alive.clear();
    expect((await stopJob(jobDb, second.id, { userId: ids.operator }, m.deps)).state, "reaped on Stop").toBe("STOPPED");
    expect(await reapJobs(jobDb, m.deps)).toBe(0);
  });

  it("the model servers' own Start and Stop: a stopped server starts; stopping one under an active run is refused; a server the script did not start is refused", async () => {
    const m = machine({ chat: false, embed: true });
    expect((await modelServers(m.deps, { fresh: true })).map((s) => `${s.server}:${s.state}`)).toEqual(["chat:STOPPED", "embed:RUNNING"]);
    const afterStart = await startModelServer("chat", m.deps);
    expect(afterStart.find((s) => s.server === "chat")?.state).toBe("RUNNING");
    expect(m.calls).toEqual(["start-chat"]);
    const job = await start(m);
    await expect(stopModelServer(jobDb, "chat", m.deps)).rejects.toMatchObject({ errorKey: "quizJobs.stopRunFirst", status: 409 });
    await stopJob(jobDb, job.id, { userId: ids.operator }, m.deps);
    await runnerHalts(job.id, m);
    const stopped = await stopModelServer(jobDb, "chat", m.deps);
    expect(stopped.find((s) => s.server === "chat")?.state).toBe("STOPPED");
    const handStarted = machine({ chat: true, embed: true });
    await expect(stopModelServer(jobDb, "embed", { ...handStarted.deps, serverPid: () => null })).rejects.toBeInstanceOf(JobRefusal);
    // A server loading, or whose script pid lives while the port is still closed, reads Starting.
    const loading = machine({ chat: false, embed: false });
    const states = await modelServers({ ...loading.deps, health: async (s) => (s === "chat" ? "loading" : "down"), serverPid: (s) => (s === "embed" ? 77 : null), pidAlive: (pid) => pid === 77 }, { fresh: true });
    expect(states.map((s) => s.state)).toEqual(["STARTING", "STARTING"]);
    expect(states.map((s) => s.port)).toEqual([8180, 8181]);
  });
});

describe("the dashboards' line", () => {
  it("reads Running and Stopped from the health endpoints, with the model and the port, and links to the bank desk", async () => {
    const t = translator("en");
    useJobDepsForTests(machine({ chat: true, embed: false }).deps);
    forgetHealth();
    let html = renderToStaticMarkup(await ModelServersCard({ deskHref: "/root/quiz-review" }));
    expect(html).toContain('data-testid="model-servers"');
    expect(html).toContain(t("quizJobs.serverRUNNING"));
    expect(html).toContain(t("quizJobs.serverSTOPPED"));
    expect(html).toContain(t("quizJobs.serverLine", { model: "qwen3-30b-a3b", port: 8180 }));
    expect(html).toContain('href="/root/quiz-review"');
    useJobDepsForTests(machine({ chat: false, embed: false }).deps);
    forgetHealth();
    html = renderToStaticMarkup(await ModelServersCard({ deskHref: "/appadmin/quiz-review" }));
    expect(html).not.toContain(`>${t("quizJobs.serverRUNNING")}<`);
    expect(html).toContain('href="/appadmin/quiz-review"');
    useJobDepsForTests(null);
  });

  it("both dashboards draw it", async () => {
    const { readFileSync } = await import("node:fs");
    for (const [page, href] of [["src/app/root/page.tsx", "/root/quiz-review"], ["src/app/appadmin/page.tsx", "/appadmin/quiz-review"]] as const) {
      expect(readFileSync(page, "utf8"), page).toContain(`<ModelServersCard deskHref="${href}" />`);
    }
  });
});

describe("the doors by role", () => {
  it("the content team and the operator read, start and stop; a school's ADMIN and TEACHER are refused 403; signed out 401", async () => {
    const m = machine({ chat: true, embed: true });
    useJobDepsForTests(m.deps);
    try {
      for (const whom of ["CURATOR", "OPERATOR"] as const) {
        await signInAs(whom);
        expect((await jobsGet()).status, whom).toBe(200);
        expect(modelServersSchema.parse(await (await serversGet()).json()).servers).toHaveLength(2);
        expect((await jobGet(get(`${P}/zz-no-such`), { params: Promise.resolve({ jobId: "zz-no-such" }) })).status).toBe(404);
        expect((await serverStartPost(post(`${P}/servers/zz/start`), { params: Promise.resolve({ server: "zz" }) })).status).toBe(404);
      }
      await signInAs("OPERATOR");
      expect((await jobsPost(post(P, { scope: "CHAPTERS" }))).status, "a chapter run names its book").toBe(422);
      const res = await jobsPost(post(P, CHAPTER));
      expect(res.status).toBe(201);
      const { job } = quizGenJobReadSchema.parse(await res.json());
      made.push(job.id);
      expect((await jobsPost(post(P, { scope: "EVERYTHING" }))).status, "one at a time").toBe(409);
      expect((await serverStopPost(post(`${P}/servers/chat/stop`), { params: Promise.resolve({ server: "chat" }) })).status, "not under a run").toBe(409);
      const state = quizJobsStateSchema.parse(await (await jobsGet()).json());
      expect(state.current?.id).toBe(job.id);
      await signInAs("CURATOR");
      const stopped = await jobStopPost(post(`${P}/${job.id}/stop`), { params: Promise.resolve({ jobId: job.id }) });
      expect(stopped.status).toBe(200);
      expect(quizGenJobReadSchema.parse(await stopped.json()).job.state).toBe("STOPPING");
      expect(await db.auditLog.count({ where: { action: { in: ["appadmin.quizJobs.start", "appadmin.quizJobs.stop"] }, targetId: job.id } })).toBe(2);
      for (const whom of ["ADMIN", "TEACHER"] as const) {
        await signInAs(whom);
        expect((await jobsGet()).status, whom).toBe(403);
        expect((await jobsPost(post(P, CHAPTER))).status, whom).toBe(403);
        expect((await jobGet(get(`${P}/${job.id}`), { params: Promise.resolve({ jobId: job.id }) })).status, whom).toBe(403);
        expect((await jobStopPost(post(`${P}/${job.id}/stop`), { params: Promise.resolve({ jobId: job.id }) })).status, whom).toBe(403);
        expect((await serversGet()).status, whom).toBe(403);
        expect((await serverStartPost(post(`${P}/servers/chat/start`), { params: Promise.resolve({ server: "chat" }) })).status, whom).toBe(403);
        expect((await serverStopPost(post(`${P}/servers/chat/stop`), { params: Promise.resolve({ server: "chat" }) })).status, whom).toBe(403);
      }
      await signInAs("OUT");
      expect((await jobsGet()).status).toBe(401);
      expect((await jobsPost(post(P, CHAPTER))).status).toBe(401);
      await settle(m);
    } finally {
      useJobDepsForTests(null);
    }
  });

  it("are catalogued, all app-admin, the writes sampled on ids nothing holds", () => {
    const doors = ENDPOINTS.filter((e) => e.path.startsWith(P));
    expect(doors.map((d) => `${d.method} ${d.path}`).sort()).toEqual([
      `GET ${P}`,
      `GET ${P}/servers`,
      `GET ${P}/{jobId}`,
      `POST ${P}`,
      `POST ${P}/servers/{server}/start`,
      `POST ${P}/servers/{server}/stop`,
      `POST ${P}/{jobId}/stop`,
    ]);
    for (const d of doors) {
      expect(d.access, d.path).toBe("app-admin");
      if (d.path.includes("{")) expect(String(d.sample), d.path).toMatch(/zz-sweep-no-such/);
    }
  });
});
