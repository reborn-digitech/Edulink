/**
 * A person's own data as one document — GET /api/v1/family/export (DPDP
 * s.11) — invoked directly with a primed session. A ZZ school with two
 * pupils, each with a guardian: a guardian gets their own child and not the
 * other family's (404, the family pages' answer), and one child per call; a
 * pupil gets themselves with the guardian-only sections absent; the file is
 * a JSON attachment named for the person and the day; the audit row exists;
 * and the hour's budget, filled by hand, refuses with 429.
 *
 * Everything created here is ZZ-prefixed and deleted in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { consume } from "@/lib/rate-limit";
import { PERSON_EXPORT_BUDGET } from "@/lib/person-export";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as exportGet } from "@/app/api/v1/family/export/route";
import { familyExportDocumentSchema } from "@edulink/contracts";
import { ENDPOINTS } from "@/lib/api-catalog";

const db = new PrismaClient();
const STAMP = Date.now();
const tail = String(STAMP).slice(-6);

let schoolId = "";
let classId = "";
let parentUserId = "";
let otherParentUserId = "";
let ashaUserId = "";
let ashaId = "";
let bhavId = "";
let teacherUserId = "";

const get = (path: string) => new Request(`http://localhost${path}`);

async function as(userId: string, role: "PARENT" | "STUDENT" | "TEACHER") {
  __resetCookies();
  await createSession(userId, { schoolId: role === "PARENT" ? null : schoolId, role });
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ Export School ${STAMP}`, slug: `zz-fexport-${STAMP}`, code: `ZE${tail}`, contactEmail: `zz-fexport-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
    select: { id: true },
  });
  schoolId = school.id;
  const [parent, otherParent, asha, bhav, teacher] = await Promise.all([
    db.user.create({ data: { name: "ZZ Export Parent", email: `zz-fexport-parent-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Export Other Parent", email: `zz-fexport-otherparent-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Asha Export", preferredName: "Asha", email: `zz-fexport-asha-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Bhavesh Export", email: `zz-fexport-bhav-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ Export Teacher", email: `zz-fexport-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  parentUserId = parent.id;
  otherParentUserId = otherParent.id;
  ashaUserId = asha.id;
  teacherUserId = teacher.id;

  const tm = await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const am = await db.membership.create({ data: { userId: asha.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZEA${STAMP}` }, select: { id: true } });
  const bm = await db.membership.create({ data: { userId: bhav.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZEB${STAMP}` }, select: { id: true } });
  ashaId = am.id;
  bhavId = bm.id;
  await db.guardianship.create({ data: { parentUserId: parent.id, studentMembershipId: am.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId: otherParent.id, studentMembershipId: bm.id, studentSchoolId: schoolId, status: "ACTIVE" } });

  const klass = await db.class.create({ data: { schoolId, name: "ZZ Export 5A", gradeLevel: "5", joinCode: `ZE${tail}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: am.id, status: "ACTIVE" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: bm.id, status: "ACTIVE" } });

  // A register, a piece of work handed in, a thread with the family, a health card and an incident — each a section of the file.
  const session = await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2026-09-01", takenByMembershipId: tm.id }, select: { id: true } });
  await db.attendanceRecord.create({ data: { sessionId: session.id, schoolId, studentMembershipId: am.id, status: "LATE" } });
  const work = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: tm.id, title: "ZZ Export reading log", pointsMilli: 10_000, publishedAt: new Date() }, select: { id: true } });
  await db.submission.create({ data: { schoolId, assignmentId: work.id, studentMembershipId: am.id, body: "ZZ I read three chapters", status: "SUBMITTED", submittedAt: new Date() } });
  const thread = await db.remarkThread.create({ data: { schoolId, studentMembershipId: am.id, teacherMembershipId: tm.id, subject: "ZZ Export a good week" }, select: { id: true } });
  await db.remarkMessage.create({ data: { threadId: thread.id, schoolId, authorUserId: teacher.id, body: "ZZ Asha read aloud beautifully." } });
  await db.healthCard.create({ data: { schoolId, studentMembershipId: am.id, bloodGroup: "O+", allergies: "ZZ peanuts" } });
  await db.incident.create({ data: { schoolId, studentMembershipId: am.id, reportedByMembershipId: tm.id, kind: "ILLNESS", occurredAt: new Date(), title: "ZZ Export headache", body: "ZZ rested in the sick room" } });
});

afterAll(async () => {
  __resetCookies();
  const userIds = [parentUserId, otherParentUserId, ashaUserId, teacherUserId];
  await db.rateLimit.deleteMany({ where: { bucket: { in: userIds.map((id) => `family-export:${id}`) } } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("a guardian's export", () => {
  it("is their child's whole record as a JSON attachment named for the child and the day, with the guardian-only sections, and is audited", async () => {
    await as(parentUserId, "PARENT");
    const res = await exportGet(get(`/x?student=${ashaId}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toMatch(/^attachment; filename="relay-export-Asha-\d{4}-\d{2}-\d{2}\.json"$/);
    expect(res.headers.get("cache-control")).toContain("no-store");
    const doc = (await res.json()) as Record<string, unknown> & { sections: string[] };
    // QA-56: the body is the document the catalog now describes, not `{ ok: true }`.
    expect(familyExportDocumentSchema.safeParse(doc).success).toBe(true);
    expect(ENDPOINTS.find((e) => e.method === "GET" && e.path === "/api/v1/family/export")?.response).toBe(familyExportDocumentSchema);
    expect(doc).toMatchObject({ format: "relay-person-export", version: 1, exportedBy: { userId: parentUserId, role: "PARENT" }, subject: { studentMembershipId: ashaId, name: "Asha", schoolId } });
    expect(doc.sections).toEqual(["profile", "record", "memberships", "attendance", "marks", "reportCards", "assignments", "remarks", "conversations", "consents", "sessions", "health", "incidents", "fees"]);
    expect(doc.attendance).toEqual([{ dateKey: "2026-09-01", status: "LATE" }]);
    expect(doc.health).toMatchObject({ card: { bloodGroup: "O+", allergies: "ZZ peanuts" } });
    expect(doc.incidents).toEqual([expect.objectContaining({ title: "ZZ Export headache" })]);
    expect(doc.remarks).toEqual([expect.objectContaining({ subject: "ZZ Export a good week", messages: [expect.objectContaining({ body: "ZZ Asha read aloud beautifully." })] })]);
    // The guardian's diary carries the hand-in's fact, never its words (childWork's rule).
    expect(JSON.stringify(doc.assignments)).toContain("ZZ Export reading log");
    expect(JSON.stringify(doc.assignments)).not.toContain("three chapters");
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "family.export", actorUserId: parentUserId, targetId: ashaId } });
    expect(audit).not.toBeNull();
    expect(JSON.parse(audit!.meta)).toMatchObject({ role: "PARENT" });
  });

  it("names the first child when none is named, and another family's child is not found", async () => {
    await as(parentUserId, "PARENT");
    const own = await exportGet(get("/x"));
    expect(own.status).toBe(200);
    expect((await own.json()).subject.studentMembershipId).toBe(ashaId);
    expect((await exportGet(get(`/x?student=${bhavId}`))).status).toBe(404);
    expect((await exportGet(get("/x?student=not-an-id"))).status).toBe(422);
    await as(otherParentUserId, "PARENT");
    const theirs = await exportGet(get(`/x?student=${bhavId}`));
    expect(theirs.status).toBe(200);
    expect((await theirs.json()).subject.studentMembershipId).toBe(bhavId);
    expect((await exportGet(get(`/x?student=${ashaId}`))).status).toBe(404);
  });
});

describe("a pupil's export", () => {
  it("is themselves, with their own hand-in's words and without the guardian-only sections; staff are refused", async () => {
    await as(ashaUserId, "STUDENT");
    const res = await exportGet(get(`/x?student=${bhavId}`));
    expect(res.status).toBe(200);
    const doc = (await res.json()) as Record<string, unknown> & { sections: string[]; subject: { studentMembershipId: string } };
    // A pupil's own, whatever the query names.
    expect(doc.subject.studentMembershipId).toBe(ashaId);
    expect(doc.exportedBy).toEqual({ userId: ashaUserId, role: "STUDENT" });
    expect(doc.sections).not.toContain("health");
    expect(doc.sections).not.toContain("incidents");
    expect(doc.sections).not.toContain("fees");
    expect(doc.health).toBeUndefined();
    expect(JSON.stringify(doc.assignments)).toContain("ZZ I read three chapters");
    expect(doc.memberships).toEqual([expect.objectContaining({ membershipId: ashaId, role: "STUDENT" })]);
    await as(teacherUserId, "TEACHER");
    expect((await exportGet(get("/x"))).status).toBe(403);
    __resetCookies();
    expect((await exportGet(get("/x"))).status).toBe(401);
  });

  it("the hour's budget, once spent, refuses with 429 and counts the person alone", async () => {
    for (let i = 0; i < PERSON_EXPORT_BUDGET.limit; i++) await consume(`family-export:${ashaUserId}`, PERSON_EXPORT_BUDGET.limit, PERSON_EXPORT_BUDGET.windowMs);
    await as(ashaUserId, "STUDENT");
    const refused = await exportGet(get("/x"));
    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
    await as(otherParentUserId, "PARENT");
    expect((await exportGet(get("/x"))).status).toBe(200);
  });
});
