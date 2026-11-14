import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as attendancePost, GET as attendanceGet } from "@/app/api/attendance/route";
import { POST as answerPost } from "@/app/api/practice/answer/route";
import { POST as pushPost } from "@/app/api/push/route";
import { GET as fileGet } from "@/app/api/files/[fileId]/route";
import { GET as healthGet } from "@/app/api/health/route";
import { todayKey } from "@/lib/dates";

/**
 * The route handlers themselves — the request/response shell, the auth gate
 * and the error mapping — which no suite had invoked. The libraries beneath
 * them are covered elsewhere; this pins that a malformed body, a wrong role
 * and a missing session come back as the right status and never as a 500.
 */
const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let classId = "";
let teacherUserId = "";
let pupilUserId = "";
let pupilMembershipId = "";
// A day inside a class teacher's fourteen days (TA-285): the register door refuses them an older one.
const DAY = todayKey("Asia/Kolkata");

const json = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Routes School ${STAMP}`, slug: `zz-routes-${STAMP}`, code: `ZX${String(STAMP).slice(-6)}`, contactEmail: `zz-routes-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const teacher = await db.user.create({ data: { name: "ZZ Route Teacher", email: `zz-routes-teacher-${STAMP}@test.invalid` }, select: { id: true } });
  const pupil = await db.user.create({ data: { name: "ZZ Route Pupil", email: `zz-routes-pupil-${STAMP}@test.invalid` }, select: { id: true } });
  teacherUserId = teacher.id;
  pupilUserId = pupil.id;
  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZXP${STAMP}` }, select: { id: true } });
  pupilMembershipId = pm.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Routes 4", joinCode: `ZX${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [teacherUserId, pupilUserId] } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("signed out", () => {
  it("every handler answers 401 (or 404 for a file), never 500", async () => {
    __resetCookies();
    expect((await attendancePost(json("/api/attendance", {}))).status).toBe(401);
    expect((await answerPost(json("/api/practice/answer", {}))).status).toBe(401);
    expect((await pushPost(json("/api/push", {}))).status).toBe(401);
    expect((await fileGet(new Request("http://localhost/api/files/nope"), { params: Promise.resolve({ fileId: "nope" }) })).status).toBe(404);
  });

  it("the health probe answers 200 signed out, names the database as ok, and says nothing personal", async () => {
    __resetCookies();
    const res = await healthGet();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.ok).toBe(true);
    expect(body.database).toBe("ok");
    expect(Object.keys(body).sort()).toEqual(["commit", "database", "databaseMs", "ok", "uptimeSeconds"]);
  });
});

describe("as the teacher", () => {
  beforeAll(async () => {
    await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  });

  it("attendance: not JSON → 400, empty → 422 with the fields named, an unknown pupil → 422", async () => {
    const a = await attendancePost(json("/api/attendance", "not json"));
    expect(a.status).toBe(400);
    const b = await attendancePost(json("/api/attendance", {}));
    expect(b.status).toBe(422);
    const issues = (await b.json()).issues as Record<string, string>;
    expect(Object.keys(issues).sort()).toEqual(["classId", "dateKey", "marks"]);
    const c = await attendancePost(json("/api/attendance", { classId, dateKey: DAY, marks: [{ studentMembershipId: "nope", status: "PRESENT", clientId: "c1" }] }));
    expect(c.status).toBe(422);
  });

  it("attendance: a real mark is saved and read back", async () => {
    const saved = await attendancePost(json("/api/attendance", { classId, dateKey: DAY, marks: [{ studentMembershipId: pupilMembershipId, status: "PRESENT", clientId: `route-${STAMP}` }] }));
    expect(saved.status).toBe(200);
    const read = await attendanceGet(new Request(`http://localhost/api/attendance?classId=${classId}&date=${DAY}`));
    expect(read.status).toBe(200);
    const body = await read.json();
    expect(JSON.stringify(body)).toContain(pupilMembershipId);
  });

  it("push: empty → 422, a non-https endpoint → 422", async () => {
    expect((await pushPost(json("/api/push", {}))).status).toBe(422);
    expect((await pushPost(json("/api/push", { subscription: { endpoint: "http://evil.example/x", keys: { p256dh: "a", auth: "b" } } }))).status).toBe(422);
  });
});

describe("as the pupil", () => {
  beforeAll(async () => {
    await createSession(pupilUserId, { schoolId, role: "STUDENT" });
  });

  it("the attendance endpoint is the wrong role → 403", async () => {
    expect((await attendancePost(json("/api/attendance", { classId, dateKey: DAY, marks: [] }))).status).toBe(403);
  });

  it("practice answer: garbage and wrong shapes → 422", async () => {
    // A malformed body is 422, as every v1 door and the catalog say (R-51); it was 400.
    expect((await answerPost(json("/api/practice/answer", "not json"))).status).toBe(422);
    const wrong = await answerPost(json("/api/practice/answer", { attemptId: "x", questionId: "y", choice: 9 }));
    expect(wrong.status).toBe(422);
    expect(await wrong.json()).toMatchObject({ error: expect.any(String) });
  });
});
