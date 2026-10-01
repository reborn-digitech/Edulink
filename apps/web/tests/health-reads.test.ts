/**
 * Who read my child's health card (health.ts): a teacher's read, the
 * office's and the head's appear for the guardian with name, role and time,
 * newest first; the guardian's own read does not; a write's read-back does
 * not; a teacher of another class never reached the card so is not there;
 * only a guardian of the child may ask; reads older than ninety days drop
 * off.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as familyGet } from "@/app/api/v1/family/health/route";
import { GET as readsGet } from "@/app/api/v1/family/students/[membershipId]/health/reads/route";
import { GET as staffGet, POST as staffPost } from "@/app/api/v1/staff/pupils/[membershipId]/health/route";
import { healthCardReadsFor, HEALTH_READS_DAYS } from "@/lib/health";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let parentUserId = "";
let strangerUserId = "";
let pupilMembershipId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const params = (membershipId: string) => ({ params: Promise.resolve({ membershipId }) });
const reads = (membershipId: string) => readsGet(get(`/api/v1/family/students/${membershipId}/health/reads`), params(membershipId));
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "PARENT" | "STRANGER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER_TEACHER") await createSession(otherTeacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Reads School ${STAMP}`, slug: `zz-reads-${STAMP}`, code: `ZR${suffix}`, contactEmail: `zz-reads-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Reads ${who}`, email: `zz-reads-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, otherTeacher, parent, stranger, pupil, strangerChild] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Other Teacher"), mk("Parent"), mk("Stranger"), mk("Pupil"), mk("Stranger Child")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = otherTeacher.id;
  parentUserId = parent.id;
  strangerUserId = stranger.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }] });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRP${STAMP}`, gradeLevel: "4" }, select: { id: true } });
  pupilMembershipId = pm.id;
  const sm = await db.membership.create({ data: { userId: strangerChild.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZRS${STAMP}`, gradeLevel: "4" }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Reads 4A", gradeLevel: "4", joinCode: `ZR${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: pm.id, status: "ACTIVE" } });
  await db.guardianship.createMany({
    data: [
      { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" },
      { parentUserId: strangerUserId, studentMembershipId: sm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, otherTeacherUserId, parentUserId, strangerUserId] } } });
  await db.school.deleteMany({ where: { slug: `zz-reads-${STAMP}` } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("who read the card", () => {
  it("starts empty, and the guardian's own read adds nothing", async () => {
    await as("PARENT");
    expect((await familyGet(get("/api/v1/family/health"))).status).toBe(200);
    const res = await reads(pupilMembershipId);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ studentMembershipId: pupilMembershipId, childName: "ZZ Reads Pupil", days: HEALTH_READS_DAYS, reads: [] });
  });

  it("a teacher's read appears for the guardian with name, role and time; a teacher of another class never got in", async () => {
    await as("TEACHER");
    expect((await staffGet(get("/x"), params(pupilMembershipId))).status).toBe(200);
    await as("OTHER_TEACHER");
    expect((await staffGet(get("/x"), params(pupilMembershipId))).status).toBe(404);
    await as("PARENT");
    const body = await (await reads(pupilMembershipId)).json();
    expect(body.reads).toHaveLength(1);
    expect(body.reads[0]).toMatchObject({ readerName: "ZZ Reads Teacher", readerRole: "TEACHER" });
    expect(Date.now() - new Date(body.reads[0].readAt).getTime()).toBeLessThan(60_000);
    // Before the card was written the row says so; the read itself still counts.
    const row = await db.healthCardRead.findFirstOrThrow({ where: { schoolId, studentMembershipId: pupilMembershipId } });
    expect(row.healthCardId).toBeNull();
  });

  it("the head's write is not a read; the office's read is, newest first", async () => {
    await as("PRINCIPAL");
    expect((await staffPost(new Request("http://localhost/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ allergies: "Pollen" }) }), params(pupilMembershipId))).status).toBe(200);
    await as("ADMIN");
    expect((await staffGet(get("/x"), params(pupilMembershipId))).status).toBe(200);
    await as("PARENT");
    const body = await (await reads(pupilMembershipId)).json();
    expect(body.reads.map((r: { readerRole: string }) => r.readerRole)).toEqual(["ADMIN", "TEACHER"]);
    const latest = await db.healthCardRead.findFirstOrThrow({ where: { schoolId, studentMembershipId: pupilMembershipId, readerRole: "ADMIN" } });
    expect(latest.healthCardId).not.toBeNull();
  });

  it("only a guardian of the child asks; a read older than ninety days has dropped off", async () => {
    await as(null);
    expect((await reads(pupilMembershipId)).status).toBe(401);
    await as("TEACHER");
    expect((await reads(pupilMembershipId)).status).toBe(403);
    await as("STRANGER");
    expect((await reads(pupilMembershipId)).status).toBe(404);
    await db.healthCardRead.create({ data: { schoolId, studentMembershipId: pupilMembershipId, readerUserId: teacherUserId, readerRole: "TEACHER", readAt: new Date(Date.now() - (HEALTH_READS_DAYS + 1) * 86_400_000) } });
    const parent = { user: { id: parentUserId }, role: "PARENT" as const, schoolId: null, membershipId: null } as unknown as Parameters<typeof healthCardReadsFor>[0];
    expect((await healthCardReadsFor(parent, pupilMembershipId)).reads).toHaveLength(2);
    // A hundred days on, today's reads have dropped off too.
    expect((await healthCardReadsFor(parent, pupilMembershipId, new Date(Date.now() + 100 * 86_400_000))).reads).toHaveLength(0);
  });
});
