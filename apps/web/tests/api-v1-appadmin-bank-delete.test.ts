/**
 * The content team's bank-question delete, from the phone (A3-inventory-7,
 * R-50; risks batch of 5 October 2026). The web had it as a server action
 * alone (app/appadmin/actions.ts deleteBankQuestion); the door calls the same
 * library. Held here: the catalog names the content team; signed out is 401;
 * a school office is refused (403) before the ids are read; a question that is
 * not in the named chapter is a 404 and stays; the delete removes the question
 * with the library's audit row. Every row is made by this run and deleted.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { ENDPOINTS } from "@/lib/api-catalog";
import { DELETE as questionDelete } from "@/app/api/v1/appadmin/bank/[topicId]/questions/[questionId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let curatorUserId = "";
let topicId = "";
let otherTopicId = "";
let questionId = "";

const bare = () => new Request("http://localhost/api/v1/x", { method: "DELETE" });
const params = (p: { topicId: string; questionId: string }) => ({ params: Promise.resolve(p) });

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ BQD School ${STAMP}`, slug: `zz-bqd-${STAMP}`, code: `ZQ${String(STAMP).slice(-6)}`, contactEmail: `zz-bqd-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  adminUserId = (await db.user.create({ data: { name: "ZZ BQD Admin", email: `zz-bqd-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  curatorUserId = (await db.user.create({ data: { name: "ZZ BQD Curator", email: `zz-bqd-curator-${STAMP}@test.invalid`, isAppAdmin: true }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" } });
  const topic = (n: number) => db.quizTopic.create({ data: { subject: "maths", classLevel: 5, chapter: `ZZ BQD Chapter ${n}`, name: `ZZ BQD Topic ${n} ${STAMP}`, slug: `zz-bqd-${n}-${STAMP}` }, select: { id: true } });
  topicId = (await topic(1)).id;
  otherTopicId = (await topic(2)).id;
  questionId = (await db.quizQuestion.create({ data: { topicId, difficulty: 1, stem: "ZZ BQD What is two and two?", choices: JSON.stringify(["Four", "Five"]), answerIndex: 0, solution: "ZZ Four.", source: "ZZ", licence: "ZZ" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const ids = [adminUserId, curatorUserId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.quizTopic.deleteMany({ where: { id: { in: [topicId, otherTopicId].filter(Boolean) } } });
  await db.auditLog.deleteMany({ where: { actorUserId: { in: ids } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  if (schoolId) await db.school.deleteMany({ where: { id: schoolId } });
  await db.$disconnect();
});

describe("DELETE /api/v1/appadmin/bank/{topicId}/questions/{questionId}", () => {
  it("is in the catalog for the content team, with a sample", () => {
    const door = ENDPOINTS.find((e) => e.method === "DELETE" && e.path === "/api/v1/appadmin/bank/{topicId}/questions/{questionId}");
    expect(door?.access).toBe("app-admin");
    expect(door?.sample).toBeDefined();
  });

  it("signed out is 401; a school's office is 403 before the ids are read", async () => {
    __resetCookies();
    expect((await questionDelete(bare(), params({ topicId, questionId }))).status).toBe(401);
    await createSession(adminUserId, { schoolId, role: "ADMIN" });
    const res = await questionDelete(bare(), params({ topicId: "zz-bqd-no-such-topic", questionId: "zz-bqd-no-such-question" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
    expect(await db.quizQuestion.count({ where: { id: questionId } })).toBe(1);
  });

  it("the content team deletes the question, audited; another chapter's id or a second delete is 404", async () => {
    __resetCookies();
    await createSession(curatorUserId);
    expect((await questionDelete(bare(), params({ topicId: otherTopicId, questionId }))).status).toBe(404);
    expect(await db.quizQuestion.count({ where: { id: questionId } })).toBe(1);
    const res = await questionDelete(bare(), params({ topicId, questionId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await db.quizQuestion.count({ where: { id: questionId } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: "appadmin.question.delete", targetId: questionId, actorUserId: curatorUserId } })).toBe(1);
    expect((await questionDelete(bare(), params({ topicId, questionId }))).status).toBe(404);
  });
});
