/**
 * The first two /api/v1 handlers, invoked directly with a primed session the
 * way api-routes.test.ts does: the happy path, each refusal (401, 403, 404,
 * 422), the tenancy boundary, and the replay guarantee each one makes.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { openConversation } from "@/lib/conversations";
import { POST as marksPost } from "@/app/api/v1/marks/route";
import { POST as messagesPost } from "@/app/api/v1/messages/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let otherSchoolId = "";
let classId = "";
let slotId = "";
let otherSlotId = "";
let teacherUserId = "";
let adminUserId = "";
let pupilUserId = "";
let pupilMembershipId = "";
let conversationId = "";

const json = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ V1 School ${STAMP}`, slug: `zz-v1-${STAMP}`, code: `ZV${String(STAMP).slice(-6)}`, contactEmail: `zz-v1-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `ZZ V1 Other ${STAMP}`, slug: `zz-v1o-${STAMP}`, code: `ZW${String(STAMP).slice(-6)}`, contactEmail: `zz-v1o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  otherSchoolId = other.id;
  const [teacher, admin, pupil] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1 Teacher", email: `zz-v1-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1 Admin", email: `zz-v1-admin-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1 Pupil", email: `zz-v1-pupil-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  adminUserId = admin.id;
  pupilUserId = pupil.id;
  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: admin.id, schoolId, role: "ADMIN", status: "ACTIVE" } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZVP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ V1 Class 4", gradeLevel: "4", joinCode: `ZV${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });
  const series = await db.examSeries.create({ data: { schoolId, name: "ZZ V1 Unit Test", gradeLevel: "4" }, select: { id: true } });
  const slot = await db.examSlot.create({ data: { schoolId, seriesId: series.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } });
  slotId = slot.id;
  const otherSeries = await db.examSeries.create({ data: { schoolId: otherSchoolId, name: "ZZ V1 Elsewhere", gradeLevel: "4" }, select: { id: true } });
  const otherSlot = await db.examSlot.create({ data: { schoolId: otherSchoolId, seriesId: otherSeries.id, subject: "Mathematics", dateKey: "2026-09-01", pointsMilli: 50_000 }, select: { id: true } });
  otherSlotId = otherSlot.id;

  await createSession(teacher.id, { schoolId, role: "TEACHER" });
  const ctx = (await getSession())!;
  ({ conversationId } = await openConversation(ctx, schoolId, admin.id));
  __resetCookies();
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [teacherUserId, adminUserId, pupilUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("both handlers answer 401 in the contract's envelope", async () => {
    __resetCookies();
    for (const handler of [marksPost, messagesPost]) {
      const res = await handler(json("/api/v1/x", {}));
      expect(res.status).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });
});

describe("marks", () => {
  beforeAll(async () => {
    __resetCookies();
    await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  });

  it("an invalid body is 422 with the fields named; a sheet saves and saves again to the same state", async () => {
    const bad = await marksPost(json("/api/v1/marks", { slotId, classId, entries: [] }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ code: "BAD_REQUEST", issues: { entries: expect.any(String) } });

    const body = { slotId, classId, entries: [{ membershipId: pupilMembershipId, marks: 42.5 }] };
    const first = await marksPost(json("/api/v1/marks", body));
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ saved: 1, cleared: 0 });
    const again = await marksPost(json("/api/v1/marks", body));
    expect(again.status).toBe(200);
    const rows = await db.grade.count({ where: { studentMembershipId: pupilMembershipId, assignment: { examSlotId: slotId } } });
    expect(rows).toBe(1);
  });

  it("another school's slot is a 404, never a leak", async () => {
    const res = await marksPost(json("/api/v1/marks", { slotId: otherSlotId, classId, entries: [{ membershipId: pupilMembershipId, marks: 1 }] }));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ code: "NOT_FOUND" });
  });

  it("a pupil is refused", async () => {
    __resetCookies();
    await createSession(pupilUserId, { schoolId, role: "STUDENT" });
    const res = await marksPost(json("/api/v1/marks", { slotId, classId, entries: [{ membershipId: pupilMembershipId, marks: 1 }] }));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("messages", () => {
  beforeAll(async () => {
    __resetCookies();
    await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  });

  it("lands once per client id however many times the outbox replays it", async () => {
    const clientId = `replay-${STAMP}`;
    const body = { conversationId, body: "Marked offline, sending now.", clientId };
    const first = await messagesPost(json("/api/v1/messages", body));
    expect(first.status).toBe(200);
    const { messageId } = (await first.json()) as { messageId: string };
    const second = await messagesPost(json("/api/v1/messages", body));
    expect(await second.json()).toEqual({ messageId });
    expect(await db.conversationMessage.count({ where: { conversationId } })).toBe(1);
  });

  it("an unknown room is refused, and a missing client id is 422", async () => {
    const nowhere = await messagesPost(json("/api/v1/messages", { conversationId: "c" + "z".repeat(24), body: "hi", clientId: "abcdefgh" }));
    expect([403, 404]).toContain(nowhere.status);
    const noId = await messagesPost(json("/api/v1/messages", { conversationId, body: "hi" }));
    expect(noId.status).toBe(422);
  });
});
