/**
 * The register's write and the web's practice answer, now catalogued where
 * they stand (/api, not /api/v1: A3-inventory-9, audit of 5 October 2026).
 *
 * Three things the catalog now promises, held here against the handlers:
 *   1. the contract's body for POST /api/attendance (what openapi.json
 *      publishes) accepts and refuses what the handler's own schema does;
 *   2. the sweep's sample body is a register the sweep may write at a ZZ
 *      school: the first call stores one PRESENT mark and audits it, every
 *      later one is a replay the register skips — the same answer each run;
 *   3. who is let through is exactly the entry's `access`, and the declared
 *      empty-body answers are the handlers' (422 for the register, 400 for the
 *      practice answer).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { attendanceRegisterBodySchema, attendanceRegisterRosterSchema, attendanceRegisterSavedSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { PLATFORM_FEATURES } from "@edulink/contracts";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { attendanceBatchSchema } from "@/lib/validation";
import { ENDPOINTS, type SweepFixture } from "@/lib/api-catalog";
import { SWEEP_REGISTER_CLIENT_ID, SWEEP_REGISTER_DAY } from "@/lib/api-catalog/unversioned";
import { POST as attendancePost, GET as attendanceGet } from "@/app/api/attendance/route";
import { POST as answerPost } from "@/app/api/practice/answer/route";

const db = new PrismaClient();
const STAMP = Date.now();
type Who = "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
const users: Record<Who, string> = { ADMIN: "", PRINCIPAL: "", TEACHER: "", STUDENT: "" };
let schoolId = "";
let classId = "";
let pupilMembershipId = "";

const door = (method: string, path: string) => {
  const e = ENDPOINTS.find((x) => x.method === method && x.path === path);
  if (!e) throw new Error(`${method} ${path} is not in the catalog`);
  return e;
};
const post = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function signInAs(who: Who | null) {
  __resetCookies();
  if (who) await createSession(users[who], { schoolId, role: who });
}
/** The sweep's fixture, as far as these two doors read it. */
const fixture = () => ({ classId, studentMembershipId: pupilMembershipId }) as unknown as SweepFixture;

beforeAll(async () => {
  schoolId = (await db.school.create({ data: { name: `ZZ UV School ${STAMP}`, slug: `zz-uv-${STAMP}`, code: `ZU${String(STAMP).slice(-6)}`, contactEmail: `zz-uv-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  for (const who of Object.keys(users) as Who[]) users[who] = (await db.user.create({ data: { name: `ZZ UV ${who}`, email: `zz-uv-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: users.ADMIN, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.PRINCIPAL, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const teacher = await db.membership.create({ data: { userId: users.TEACHER, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  pupilMembershipId = (await db.membership.create({ data: { userId: users.STUDENT, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZUV${STAMP}` }, select: { id: true } })).id;
  classId = (await db.class.create({ data: { schoolId, name: `ZZ UV Class ${STAMP}`, gradeLevel: "3", joinCode: `ZUV${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: teacher.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupilMembershipId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: Object.values(users) } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("POST /api/attendance in the catalog", () => {
  it("the published body accepts and refuses what the handler's own schema does", () => {
    const mark = { studentMembershipId: "c" + "a".repeat(24), status: "PRESENT", clientId: "client-0001" };
    const bodies: unknown[] = [
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: [mark] },
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: [{ ...mark, note: "ZZ", markedAt: "2026-10-05T03:45:00.000Z" }] },
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: [] },
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: [{ ...mark, clientId: "short" }] },
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: [{ ...mark, status: "GONE" }] },
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: [{ ...mark, note: "x".repeat(501) }] },
      { classId: "c" + "b".repeat(24), dateKey: "2026-10-05", marks: Array.from({ length: 501 }, () => mark) },
      { classId: "not-an-id", dateKey: "2026-10-05", marks: [mark] },
      { classId: "c" + "b".repeat(24), dateKey: "5 Oct", marks: [mark] },
      {},
    ];
    for (const body of bodies) expect(attendanceRegisterBodySchema.safeParse(body).success, JSON.stringify(body).slice(0, 80)).toBe(attendanceBatchSchema.safeParse(body).success);
  });

  it("a batch naming only pupils who are not in the class is refused with 422, not answered 200 with the rejections", async () => {
    const e = door("POST", "/api/attendance");
    const body = e.sampleBody!(fixture()) as { marks: { studentMembershipId: string }[] };
    await signInAs("TEACHER");
    const res = await attendancePost(post("/api/attendance", { ...body, marks: body.marks.map((m) => ({ ...m, studentMembershipId: "c" + "z".repeat(24) })) }));
    const answer = await res.json();
    expect([res.status, answer]).toEqual([422, expect.objectContaining({ rejected: [expect.objectContaining({ studentMembershipId: "c" + "z".repeat(24) })] })]);
    expect(await db.attendanceSession.count({ where: { schoolId, classId } })).toBe(0);
  });

  it("the sweep's sample is a register it may write: stored once and audited, then a replay with the same answer", async () => {
    const e = door("POST", "/api/attendance");
    const body = e.sampleBody!(fixture());
    expect(body).toMatchObject({ classId, dateKey: SWEEP_REGISTER_DAY, marks: [{ studentMembershipId: pupilMembershipId, status: "PRESENT", clientId: SWEEP_REGISTER_CLIENT_ID }] });
    await signInAs("TEACHER");
    const first = await attendancePost(post("/api/attendance", body));
    expect(first.status).toBe(200);
    const saved = attendanceRegisterSavedSchema.parse(await first.json());
    expect(saved).toMatchObject({ applied: 1, skipped: 0, rejected: [] });
    await signInAs("ADMIN");
    const again = await attendancePost(post("/api/attendance", body));
    expect(again.status).toBe(200);
    expect(attendanceRegisterSavedSchema.parse(await again.json())).toMatchObject({ applied: 0, skipped: 1, rejected: [], sessionId: saved.sessionId });
    expect(await db.attendanceRecord.findMany({ where: { schoolId, studentMembershipId: pupilMembershipId }, select: { status: true, clientId: true } })).toEqual([{ status: "PRESENT", clientId: SWEEP_REGISTER_CLIENT_ID }]);
    expect(await db.auditLog.count({ where: { schoolId, action: "attendance.mark", targetId: saved.sessionId! } })).toBe(1);
    // Present: no guardian is told anything.
    expect(await db.notification.count({ where: { schoolId } })).toBe(0);
  });

  it("its GET sample reads that register back in the published shape", async () => {
    const e = door("GET", "/api/attendance");
    const path = (e.sample as (f: SweepFixture) => string)(fixture());
    await signInAs("TEACHER");
    const res = await attendanceGet(new Request(`http://localhost${path}`));
    expect(res.status).toBe(200);
    const roster = attendanceRegisterRosterSchema.parse(await res.json());
    expect(roster.roster).toEqual([expect.objectContaining({ membershipId: pupilMembershipId, status: "PRESENT" })]);
  });

  it("lets through exactly the entry's access, signed out 401, and an empty body is the declared 422", async () => {
    const e = door("POST", "/api/attendance");
    expect(e.access).toEqual(["TEACHER", "ADMIN"]);
    for (const who of ["PRINCIPAL", "STUDENT"] as Who[]) {
      await signInAs(who);
      expect((await attendancePost(post("/api/attendance", e.sampleBody!(fixture())))).status, who).toBe(403);
      expect((await attendanceGet(new Request(`http://localhost/api/attendance?classId=${classId}`))).status, who).toBe(403);
    }
    await signInAs(null);
    expect((await attendancePost(post("/api/attendance", {}))).status).toBe(401);
    await signInAs("TEACHER");
    expect((await attendancePost(post("/api/attendance", {}))).status).toBe(e.emptyBodyStatus);
  });
});

describe("POST /api/practice/answer in the catalog", () => {
  it("is the pupil's alone, and an empty body is the declared 400", async () => {
    const e = door("POST", "/api/practice/answer");
    expect(e.access).toEqual(["STUDENT"]);
    for (const who of ["TEACHER", "ADMIN", "PRINCIPAL"] as Who[]) {
      await signInAs(who);
      expect((await answerPost(post("/api/practice/answer", {}))).status, who).toBe(403);
    }
    await signInAs(null);
    expect((await answerPost(post("/api/practice/answer", {}))).status).toBe(401);
    await signInAs("STUDENT");
    expect((await answerPost(post("/api/practice/answer", {}))).status).toBe(e.emptyBodyStatus);
  });

  it("answers the question bank switched off and a plan the pupil lacks as the v1 doors do (16 Oct 2026)", async () => {
    // The session's gate reads the route the middleware stamps.
    __setHeaders({ "x-edulink-route": "POST /api/practice/answer" });
    try {
      await signInAs("STUDENT");
      setFeaturesForTests(PLATFORM_FEATURES.filter((c) => c !== "QUESTION_BANK"));
      const off = await answerPost(post("/api/practice/answer", {}));
      expect(off.status).toBe(404);
      expect(off.headers.get("x-edulink-code")).toBe("FEATURE_OFF");
      expect(((await off.json()) as { code?: string }).code).toBe("FEATURE_OFF");
      setFeaturesForTests([...PLATFORM_FEATURES]);
      setActivePlansForTests(["STUDENT"]);
      const locked = await answerPost(post("/api/practice/answer", {}));
      expect(locked.status).toBe(402);
      expect(((await locked.json()) as { code?: string; plan?: string })).toMatchObject({ code: "PLAN_REQUIRED", plan: "STUDENT" });
    } finally {
      setFeaturesForTests([...PLATFORM_FEATURES]);
      setActivePlansForTests([]);
      __setHeaders({});
    }
  });
});
