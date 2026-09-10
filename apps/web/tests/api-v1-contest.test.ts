/**
 * The /api/v1/contest handlers and the content team's new /api/v1/appadmin
 * writes, invoked directly with a primed session the way
 * api-v1-operator.test.ts does: 401 signed out, 403 for a role that may not,
 * 200/201 for one that may with a body the contract parses, and a refusal
 * for every write — the web form's rule, in the reader's language, with the
 * field named. Every row here is a ZZ row created in beforeAll (or by the
 * handlers under test) and deleted in afterAll; nothing else is touched.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  apiErrorSchema,
  contestBankSchema,
  contestBankTopicSchema,
  contestCreatedSchema,
  contestEntriesSchema,
  contestLeaderboardSetSchema,
  contestQuestionSavedSchema,
  contestResultSetSchema,
  contestStatusSetSchema,
  okSchema,
} from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as createPost } from "@/app/api/v1/contest/competitions/route";
import { POST as statusPost } from "@/app/api/v1/contest/competitions/[competitionId]/status/route";
import { POST as leaderboardPost } from "@/app/api/v1/contest/competitions/[competitionId]/leaderboard/route";
import { POST as submitPost } from "@/app/api/v1/contest/competitions/[competitionId]/submit/route";
import { GET as entriesGet } from "@/app/api/v1/contest/competitions/[competitionId]/entries/route";
import { DELETE as entryDelete } from "@/app/api/v1/contest/entries/[entryId]/route";
import { POST as resultPost } from "@/app/api/v1/contest/entries/[entryId]/result/route";
import { POST as draftsPost } from "@/app/api/v1/appadmin/competitions/drafts/route";
import { POST as platformStatusPost } from "@/app/api/v1/appadmin/competitions/[competitionId]/status/route";
import { GET as bankGet } from "@/app/api/v1/appadmin/bank/route";
import { GET as topicGet } from "@/app/api/v1/appadmin/bank/[topicId]/route";
import { POST as questionPost } from "@/app/api/v1/appadmin/bank/[topicId]/questions/route";
import { POST as questionEditPost } from "@/app/api/v1/appadmin/bank/[topicId]/questions/[questionId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TAG = `ZZ V1C ${STAMP}`;
const MISSING = "cmissingzzv1c000000000000";

let schoolId = "";
let adminUserId = "";
let teacherUserId = "";
let studentUserId = "";
let parentUserId = "";
let curatorUserId = "";
let studentMembershipId = "";
let beeId = ""; // the school's own, published; the pupil is in and consented
let quizId = ""; // the school's own, published; the pupil asked, nobody said yes yet
let platformId = ""; // a platform draft
let entryId = "";
let askingEntryId = "";
let topicId = "";
let questionId = "";
const created: string[] = [];
let savedKey: string | undefined;

type Who = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT" | "CURATOR";
async function signInAs(who: Who) {
  __resetCookies();
  if (who === "CURATOR") await createSession(curatorUserId);
  else if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  else await createSession({ ADMIN: adminUserId, TEACHER: teacherUserId, STUDENT: studentUserId }[who], { schoolId, role: who });
}

const send = (method: string, body?: unknown) =>
  new Request("http://localhost/api/v1/contest", { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const post = (body: unknown) => send("POST", body);
const p = <T extends Record<string, string>>(v: T) => ({ params: Promise.resolve(v) });

async function refusal(res: Response) {
  return apiErrorSchema.parse(await res.json());
}

/** Every handler, with a body a permitted caller could send, so the gates are proved on all of them at once. */
function everyHandler() {
  return [
    { name: "create", who: ["TEACHER", "CURATOR"] as Who[], call: () => createPost(post({ title: `${TAG} x`, summary: "ZZ one line", requiresParentConsent: true })) },
    { name: "status", who: ["TEACHER"] as Who[], call: () => statusPost(post({ status: "PUBLISHED" }), p({ competitionId: beeId })) },
    { name: "leaderboard", who: ["TEACHER"] as Who[], call: () => leaderboardPost(post({ enabled: true }), p({ competitionId: beeId })) },
    { name: "submit", who: ["TEACHER"] as Who[], call: () => submitPost(post({ url: "https://example.org/zz" }), p({ competitionId: beeId })) },
    { name: "entries", who: ["STUDENT"] as Who[], call: () => entriesGet(send("GET"), p({ competitionId: beeId })) },
    { name: "result", who: ["STUDENT"] as Who[], call: () => resultPost(post({ score: "1", rank: "" }), p({ entryId })) },
    { name: "withdraw", who: ["TEACHER"] as Who[], call: () => entryDelete(send("DELETE"), p({ entryId })) },
    { name: "drafts", who: ["TEACHER"] as Who[], call: () => draftsPost(post({ title: `${TAG} y`, summary: "ZZ one line", requiresParentConsent: true })) },
    { name: "platform status", who: ["TEACHER"] as Who[], call: () => platformStatusPost(post({ status: "PUBLISHED" }), p({ competitionId: platformId })) },
    { name: "bank", who: ["TEACHER"] as Who[], call: () => bankGet() },
    { name: "topic", who: ["TEACHER"] as Who[], call: () => topicGet(send("GET"), p({ topicId })) },
    { name: "question add", who: ["TEACHER"] as Who[], call: () => questionPost(post({ difficulty: 1, stem: "ZZ a stem", choices: ["a", "b"], answerIndex: 0, solution: "ZZ because" }), p({ topicId })) },
    { name: "question edit", who: ["TEACHER"] as Who[], call: () => questionEditPost(post({ difficulty: 1, stem: "ZZ a stem", choices: ["a", "b"], answerIndex: 0, solution: "ZZ because" }), p({ topicId, questionId })) },
  ];
}

beforeAll(async () => {
  // The bank's saves translate through the model when a key is set; the suite
  // must never reach the network, so it runs as a server with none.
  savedKey = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;

  const school = await db.school.create({
    data: { name: `${TAG} School`, slug: `zz-v1c-${STAMP}`, code: `ZC${String(STAMP).slice(-6)}`, contactEmail: `zz-v1c-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const user = (who: string, extra: Record<string, unknown> = {}) =>
    db.user.create({ data: { name: `ZZ V1C ${who}`, email: `zz-v1c-${who.toLowerCase()}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, teacher, student, parent, curator] = await Promise.all([user("Admin"), user("Teacher"), user("Pupil"), user("Parent"), user("Curator", { isAppAdmin: true })]);
  adminUserId = admin.id;
  teacherUserId = teacher.id;
  studentUserId = student.id;
  parentUserId = parent.id;
  curatorUserId = curator.id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });
  const pupil = await db.membership.create({ data: { userId: studentUserId, schoolId, role: "STUDENT", status: "ACTIVE", gradeLevel: "5" }, select: { id: true } });
  studentMembershipId = pupil.id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId, studentSchoolId: schoolId, status: "ACTIVE" } });

  const [bee, quiz, platform] = await Promise.all([
    db.competition.create({ data: { organizerSchoolId: schoolId, organizerName: `${TAG} School`, title: `${TAG} Bee`, summary: "ZZ our own bee", status: "PUBLISHED", requiresParentConsent: true }, select: { id: true } }),
    db.competition.create({ data: { organizerSchoolId: schoolId, organizerName: `${TAG} School`, title: `${TAG} Quiz`, summary: "ZZ our own quiz", status: "PUBLISHED", requiresParentConsent: true }, select: { id: true } }),
    db.competition.create({ data: { organizerSchoolId: null, organizerName: "ZZ V1C Platform", title: `${TAG} Olympiad`, summary: "ZZ for every school", status: "DRAFT" }, select: { id: true } }),
  ]);
  beeId = bee.id;
  quizId = quiz.id;
  platformId = platform.id;
  created.push(beeId, quizId, platformId);
  entryId = (await db.competitionEntry.create({ data: { competitionId: beeId, studentMembershipId, schoolId, parentConsentAt: new Date(), parentConsentBy: parentUserId }, select: { id: true } })).id;
  askingEntryId = (await db.competitionEntry.create({ data: { competitionId: quizId, studentMembershipId, schoolId }, select: { id: true } })).id;

  const topic = await db.quizTopic.create({ data: { subject: "maths", classLevel: 5, chapter: "ZZ V1C Chapter", name: `${TAG} Fractions`, slug: `zz-v1c-${STAMP}` }, select: { id: true } });
  topicId = topic.id;
  questionId = (
    await db.quizQuestion.create({
      data: { topicId, difficulty: 1, stem: "ZZ What is a half and a half?", choices: JSON.stringify(["One", "Two"]), answerIndex: 0, solution: "ZZ Two halves make one.", source: "ZZ", licence: "ZZ" },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  __resetCookies();
  if (savedKey !== undefined) process.env.ANTHROPIC_API_KEY = savedKey;
  const ids = [adminUserId, teacherUserId, studentUserId, parentUserId, curatorUserId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  if (created.length) await db.competition.deleteMany({ where: { id: { in: created } } });
  if (topicId) await db.quizTopic.deleteMany({ where: { id: topicId } });
  await db.notification.deleteMany({ where: { userId: { in: ids } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.guardianship.deleteMany({ where: { parentUserId: { in: ids } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("every handler answers 401 signed out, in the contract's envelope", async () => {
    __resetCookies();
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, h.name).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("a role that may not is refused with a 403, and nothing changes", async () => {
    for (const h of everyHandler()) {
      for (const who of h.who) {
        await signInAs(who);
        const res = await h.call();
        expect(res.status, `${who} ${h.name}`).toBe(403);
        expect((await refusal(res)).code).toBe("FORBIDDEN");
      }
    }
    expect(await db.competitionEntry.count({ where: { id: entryId } })).toBe(1);
    expect((await db.competition.findUniqueOrThrow({ where: { id: platformId } })).status).toBe("DRAFT");
  });
});

describe("a pupil and a guardian", () => {
  it("submit: an http link is refused on the field; an https one is handed in", async () => {
    await signInAs("STUDENT");
    const bad = await submitPost(post({ url: "http://example.org/zz" }), p({ competitionId: beeId }));
    expect(bad.status).toBe(422);
    expect(await refusal(bad)).toMatchObject({ error: "Links must start with https://", issues: { url: "Links must start with https://" } });
    expect((await submitPost(post({}), p({ competitionId: beeId }))).status).toBe(422);

    const res = await submitPost(post({ url: "https://example.org/zz-entry" }), p({ competitionId: beeId }));
    expect(res.status).toBe(200);
    okSchema.parse(await res.json());
    expect(await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } })).toMatchObject({ status: "SUBMITTED", submissionUrl: "https://example.org/zz-entry" });
  });

  it("submit: a pupil whose grown-up has not said yes cannot hand in", async () => {
    await signInAs("STUDENT");
    const res = await submitPost(post({ url: "https://example.org/zz" }), p({ competitionId: quizId }));
    expect(res.status).toBe(403);
  });

  it("withdraw: the guardian says not this time, and the entry is gone; again is a 404", async () => {
    await signInAs("PARENT");
    const res = await entryDelete(send("DELETE"), p({ entryId: askingEntryId }));
    expect(res.status).toBe(200);
    okSchema.parse(await res.json());
    expect(await db.competitionEntry.count({ where: { id: askingEntryId } })).toBe(0);
    expect((await entryDelete(send("DELETE"), p({ entryId: askingEntryId }))).status).toBe(404);
  });
});

describe("a school admin organising one", () => {
  it("create: the form's rules come back per field; a good one is a draft of this school's", async () => {
    await signInAs("ADMIN");
    expect((await createPost(post({}))).status).toBe(422);

    const short = await createPost(post({ title: "ab", summary: "x", requiresParentConsent: true }));
    expect(short.status).toBe(422);
    expect((await refusal(short)).issues).toMatchObject({ title: "Give it a title.", summary: "One line about it, please." });

    const backwards = await createPost(post({ title: `${TAG} Race`, summary: "ZZ a race", startsAt: "2026-11-02", endsAt: "2026-11-01", requiresParentConsent: true }));
    expect(backwards.status).toBe(422);
    expect((await refusal(backwards)).issues).toMatchObject({ endsAt: "The end cannot be before the start." });
    const plain = await createPost(post({ title: `${TAG} Race`, summary: "ZZ a race", externalUrl: "http://example.org", requiresParentConsent: true }));
    expect((await refusal(plain)).issues).toMatchObject({ externalUrl: "Links must start with https://" });

    const res = await createPost(post({ title: `${TAG} Race`, summary: "ZZ a race round the field", body: "", registrationClosesAt: "2026-10-01", startsAt: "2026-10-05", endsAt: "", requiresParentConsent: false, leaderboardEnabled: true }));
    expect(res.status).toBe(201);
    const body = contestCreatedSchema.parse(await res.json());
    created.push(body.competitionId);
    expect(await db.competition.findUniqueOrThrow({ where: { id: body.competitionId } })).toMatchObject({
      organizerSchoolId: schoolId,
      organizerName: `${TAG} School`,
      status: "DRAFT",
      verified: false,
      requiresParentConsent: false,
      leaderboardEnabled: true,
      endsAt: null,
    });
  });

  it("status: the organiser publishes its own; a bad status is 422; a platform competition is not theirs (404)", async () => {
    await signInAs("ADMIN");
    const race = created[created.length - 1]!;
    const res = await statusPost(post({ status: "PUBLISHED" }), p({ competitionId: race }));
    expect(res.status).toBe(200);
    expect(contestStatusSetSchema.parse(await res.json())).toEqual({ ok: true, status: "PUBLISHED" });
    expect((await db.competition.findUniqueOrThrow({ where: { id: race } })).status).toBe("PUBLISHED");
    expect((await statusPost(post({ status: "LIVE" }), p({ competitionId: race }))).status).toBe(422);
    expect((await statusPost(post({ status: "ARCHIVED" }), p({ competitionId: platformId }))).status).toBe(404);
  });

  it("leaderboard: switched on; a string for the switch is 422", async () => {
    await signInAs("ADMIN");
    const res = await leaderboardPost(post({ enabled: true }), p({ competitionId: beeId }));
    expect(res.status).toBe(200);
    expect(contestLeaderboardSetSchema.parse(await res.json())).toEqual({ ok: true, enabled: true });
    expect((await db.competition.findUniqueOrThrow({ where: { id: beeId } })).leaderboardEnabled).toBe(true);
    expect((await leaderboardPost(post({ enabled: "yes" }), p({ competitionId: beeId }))).status).toBe(422);
  });
});

describe("staff and results", () => {
  it("entries: this school's, with the organiser flag for its admin; a missing competition is 404", async () => {
    await signInAs("TEACHER");
    const res = await entriesGet(send("GET"), p({ competitionId: beeId }));
    expect(res.status).toBe(200);
    const body = contestEntriesSchema.parse(await res.json());
    expect(body.competition).toMatchObject({ id: beeId, title: `${TAG} Bee`, isOrganiser: false, leaderboardEnabled: true });
    expect(body.entries).toEqual([expect.objectContaining({ entryId, studentName: "ZZ V1C Pupil", status: "SUBMITTED", submissionUrl: "https://example.org/zz-entry", awaitingConsent: false })]);
    expect((await entriesGet(send("GET"), p({ competitionId: MISSING }))).status).toBe(404);

    await signInAs("ADMIN");
    expect(contestEntriesSchema.parse(await (await entriesGet(send("GET"), p({ competitionId: beeId }))).json()).competition.isOrganiser).toBe(true);
  });

  it("result: a negative score is refused on the field; a score and place save; both empty clears", async () => {
    await signInAs("TEACHER");
    const bad = await resultPost(post({ score: "-1", rank: "" }), p({ entryId }));
    expect(bad.status).toBe(422);
    expect((await refusal(bad)).issues).toMatchObject({ score: "A score has to be a number, and cannot be negative." });

    const res = await resultPost(post({ score: "7.5", rank: "2" }), p({ entryId }));
    expect(res.status).toBe(200);
    expect(contestResultSetSchema.parse(await res.json())).toEqual({ ok: true, cleared: false });
    expect(await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } })).toMatchObject({ scoreMilli: 7500, rank: 2, status: "RESULTS" });

    // With a result on it, the pupil can no longer replace the hand-in.
    await signInAs("STUDENT");
    expect((await submitPost(post({ url: "https://example.org/zz-late" }), p({ competitionId: beeId }))).status).toBe(403);

    await signInAs("TEACHER");
    const clear = await resultPost(post({ score: "", rank: "" }), p({ entryId }));
    expect(contestResultSetSchema.parse(await clear.json())).toEqual({ ok: true, cleared: true });
    expect(await db.competitionEntry.findUniqueOrThrow({ where: { id: entryId } })).toMatchObject({ scoreMilli: null, rank: null, status: "SUBMITTED" });
    expect((await resultPost(post({ score: "1", rank: "" }), p({ entryId: MISSING }))).status).toBe(404);
  });
});

describe("the content team", () => {
  it("drafts: a short title is refused in words; a good one is a verified platform draft", async () => {
    await signInAs("CURATOR");
    const short = await draftsPost(post({ title: "x", summary: "ZZ one line", requiresParentConsent: true }));
    expect(short.status).toBe(422);
    expect((await refusal(short)).error).toBe("Give it a title.");

    const res = await draftsPost(post({ title: `${TAG} Essay`, summary: "ZZ five hundred words", organizerName: "ZZ V1C Trust", registrationClosesAt: "2026-12-01", requiresParentConsent: true, leaderboardEnabled: false }));
    expect(res.status).toBe(201);
    const body = contestCreatedSchema.parse(await res.json());
    created.push(body.competitionId);
    expect(await db.competition.findUniqueOrThrow({ where: { id: body.competitionId } })).toMatchObject({ organizerSchoolId: null, organizerName: "ZZ V1C Trust", verified: true, status: "DRAFT", requiresParentConsent: true });
  });

  it("status: a platform draft is published; a school's own is not the team's (404)", async () => {
    await signInAs("CURATOR");
    const res = await platformStatusPost(post({ status: "PUBLISHED" }), p({ competitionId: platformId }));
    expect(res.status).toBe(200);
    expect(contestStatusSetSchema.parse(await res.json())).toEqual({ ok: true, status: "PUBLISHED" });
    expect((await db.competition.findUniqueOrThrow({ where: { id: platformId } })).status).toBe("PUBLISHED");
    expect((await platformStatusPost(post({ status: "ARCHIVED" }), p({ competitionId: beeId }))).status).toBe(404);
    expect((await platformStatusPost(post({}), p({ competitionId: platformId }))).status).toBe(422);
  });

  it("bank: the chapters with their counts; one chapter with its questions; a missing one is 404", async () => {
    await signInAs("CURATOR");
    const res = await bankGet();
    expect(res.status).toBe(200);
    const bank = contestBankSchema.parse(await res.json());
    expect(bank.translationOn).toBe(false);
    expect(bank.topics.find((t) => t.id === topicId)).toMatchObject({ name: `${TAG} Fractions`, classLevel: 5, questionCount: 1 });

    const one = await topicGet(send("GET"), p({ topicId }));
    expect(one.status).toBe(200);
    const topic = contestBankTopicSchema.parse(await one.json());
    expect(topic.topic).toMatchObject({ id: topicId, chapter: "ZZ V1C Chapter" });
    expect(topic.questions).toEqual([expect.objectContaining({ id: questionId, choices: ["One", "Two"], answerIndex: 0, languages: [] })]);
    expect((await topicGet(send("GET"), p({ topicId: MISSING }))).status).toBe(404);
  });

  it("questions: one option is refused in words; a good one is added in English; an edit saves; another chapter's is 404", async () => {
    await signInAs("CURATOR");
    const lonely = await questionPost(post({ difficulty: 2, stem: "ZZ Which is bigger?", choices: ["Only"], answerIndex: 0, solution: "ZZ There is only one." }), p({ topicId }));
    expect(lonely.status).toBe(422);
    expect((await refusal(lonely)).error).toBe("Give at least two options, none of them empty.");
    expect((await questionPost(post({ stem: "ZZ" }), p({ topicId }))).status).toBe(422);

    const res = await questionPost(post({ difficulty: 2, stem: "ZZ Which is bigger, 1/2 or 1/3?", choices: ["1/2", "1/3"], answerIndex: 0, solution: "ZZ Halves are bigger than thirds." }), p({ topicId }));
    expect(res.status).toBe(201);
    const added = contestQuestionSavedSchema.parse(await res.json());
    expect(added.translated).toBe(false);
    expect(await db.quizQuestion.findUniqueOrThrow({ where: { id: added.questionId } })).toMatchObject({ topicId, difficulty: 2, answerIndex: 0, choices: JSON.stringify(["1/2", "1/3"]) });

    const edit = await questionEditPost(post({ difficulty: 3, stem: "ZZ What is a half and a half, in all?", choices: ["One", "Two", "Half"], answerIndex: 0, solution: "ZZ Two halves make one whole." }), p({ topicId, questionId }));
    expect(edit.status).toBe(200);
    expect(contestQuestionSavedSchema.parse(await edit.json())).toEqual({ questionId, translated: false });
    expect(await db.quizQuestion.findUniqueOrThrow({ where: { id: questionId } })).toMatchObject({ difficulty: 3, stem: "ZZ What is a half and a half, in all?", choices: JSON.stringify(["One", "Two", "Half"]) });

    const wrongAnswer = await questionEditPost(post({ difficulty: 3, stem: "ZZ What is a half and a half?", choices: ["One", "Two"], answerIndex: 5, solution: "ZZ Two halves make one." }), p({ topicId, questionId }));
    expect(wrongAnswer.status).toBe(422);
    expect((await refusal(wrongAnswer)).error).toBe("Mark which option is the correct answer.");
    expect((await questionEditPost(post({ difficulty: 1, stem: "ZZ a stem", choices: ["a", "b"], answerIndex: 0, solution: "ZZ because" }), p({ topicId: MISSING, questionId }))).status).toBe(404);
  });
});
