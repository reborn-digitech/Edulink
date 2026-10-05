/**
 * Permission slips (5 Oct 2026; the campaign's parent recommendation): a circular asking each child's family a
 * yes-or-no until a day. One answer per child, from any guardian, changeable until the day, the last one standing;
 * answering counts as the circular's "seen and understood"; nobody answers for a child outside the audience or not
 * theirs; a minor never answers for themself; the staff read the answers child by child, the unanswered first.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createPost } from "@/lib/bulletin";
import { answerSlip, slipForReader, slipReport } from "@/lib/permission-slips";
import { POST as consentPost } from "@/app/api/v1/shared/bulletin/[postId]/consent/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { school: "", users: [] as string[], admin: "", teacher: "", otherTeacher: "", teacherM: "", pupil1: "", pupil2: "", pupil3: "", pupil1User: "", p1: "", p2: "", class1: "", class2: "", slip: "", closed: "" };

async function as(userId: string, role: string, schoolId: string | null = ids.school) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, { schoolId, role: role as never });
  return (await getSession())!;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ Slips ${STAMP}`, slug: `zz-slips-${STAMP}`, code: `ZSL${SUFFIX}`, contactEmail: `zz-slips-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const user = async (who: string, extra: Record<string, unknown> = {}) => {
    const u = await db.user.create({ data: { name: `ZZ Slips ${who}`, email: `zz-slips-${who.toLowerCase().replace(/\W/g, "")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
    ids.users.push(u.id);
    return u.id;
  };
  const member = (userId: string, role: string) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE" }, select: { id: true } }).then((m) => m.id);
  ids.admin = await user("Admin");
  await member(ids.admin, "ADMIN");
  ids.teacher = await user("Teacher");
  ids.teacherM = await member(ids.teacher, "TEACHER");
  ids.otherTeacher = await user("Other Teacher");
  await member(ids.otherTeacher, "TEACHER");
  ids.pupil1User = await user("Pupil One", { isMinor: true, birthdate: new Date("2015-01-01T00:00:00Z") });
  ids.pupil1 = await member(ids.pupil1User, "STUDENT");
  ids.pupil2 = await member(await user("Pupil Two", { isMinor: true }), "STUDENT");
  ids.pupil3 = await member(await user("Pupil Three", { isMinor: true }), "STUDENT");
  ids.class1 = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5A", gradeLevel: "5", joinCode: `ZZSL1${SUFFIX}` }, select: { id: true } })).id;
  ids.class2 = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 5B", gradeLevel: "5", joinCode: `ZZSL2${SUFFIX}` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [{ classId: ids.class1, schoolId: ids.school, studentMembershipId: ids.pupil1 }, { classId: ids.class1, schoolId: ids.school, studentMembershipId: ids.pupil2 }, { classId: ids.class2, schoolId: ids.school, studentMembershipId: ids.pupil3 }] });
  await db.classTeacher.create({ data: { classId: ids.class1, schoolId: ids.school, teacherMembershipId: ids.teacherM } });
  ids.p1 = await user("Parent One");
  ids.p2 = await user("Parent Two");
  await db.guardianship.createMany({
    data: [
      { parentUserId: ids.p1, studentMembershipId: ids.pupil1, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.p1, studentMembershipId: ids.pupil2, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.p2, studentMembershipId: ids.pupil2, studentSchoolId: ids.school, status: "ACTIVE" },
      { parentUserId: ids.p2, studentMembershipId: ids.pupil3, studentSchoolId: ids.school, status: "ACTIVE" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  await db.notification.deleteMany({ where: { userId: { in: ids.users } } });
  // createPost counts each author's posts by membership (bulletin.ts).
  const members = await db.membership.findMany({ where: { schoolId: ids.school }, select: { id: true } });
  await db.rateLimit.deleteMany({ where: { bucket: { in: members.map((m) => `post:${m.id}`) } } });
  await db.session.deleteMany({ where: { userId: { in: ids.users } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: ids.users } } });
  await db.$disconnect();
});

describe("a permission slip", () => {
  it("is a circular the staff send to a class, never a pupil's post or a staff-only notice", async () => {
    const teacher = await as(ids.teacher, "TEACHER");
    ids.slip = (await createPost(teacher, { scope: "CLASS", classId: ids.class1, title: "ZZ Trip to the planetarium", body: "On Friday.", tags: [], media: [], consentQuestion: "May your child go on the trip?", consentBy: "2099-12-31" })).postId;
    const row = await db.post.findUniqueOrThrow({ where: { id: ids.slip }, select: { requiresAck: true, consentQuestion: true, consentBy: true } });
    expect(row).toEqual({ requiresAck: true, consentQuestion: "May your child go on the trip?", consentBy: "2099-12-31" });
    const staffOnly = await createPost(await as(ids.admin, "ADMIN"), { scope: "SCHOOL", audience: "TEACHERS", title: "ZZ Staff only", body: "", tags: [], media: [], consentQuestion: "Coming?" });
    expect((await db.post.findUniqueOrThrow({ where: { id: staffOnly.postId }, select: { consentQuestion: true } })).consentQuestion).toBeNull();
    const pupilPost = await createPost(await as(ids.pupil1User, "STUDENT"), { scope: "CLASS", classId: ids.class1, title: "ZZ My drawing", body: "", tags: [], media: [], consentQuestion: "Like it?" });
    expect((await db.post.findUniqueOrThrow({ where: { id: pupilPost.postId }, select: { consentQuestion: true } })).consentQuestion).toBeNull();
  });

  it("takes one answer per child from any guardian, the last standing, and counts as seen", async () => {
    const p1 = await as(ids.p1, "PARENT", null);
    const view = await slipForReader(p1, ids.slip);
    expect(view.children.map((c) => [c.name, c.answer])).toEqual([["ZZ Slips Pupil One", null], ["ZZ Slips Pupil Two", null]]);
    await answerSlip(p1, ids.slip, { studentMembershipId: ids.pupil1, answer: "YES" });
    await answerSlip(p1, ids.slip, { studentMembershipId: ids.pupil2, answer: "NO" });
    const p2 = await as(ids.p2, "PARENT", null);
    // Pupil three is P2's, but not in this class's slip: not found.
    await expect(answerSlip(p2, ids.slip, { studentMembershipId: ids.pupil3, answer: "YES" })).rejects.toMatchObject({ code: "NOT_FOUND" });
    const after = await answerSlip(p2, ids.slip, { studentMembershipId: ids.pupil2, answer: "YES" });
    expect(after.children).toEqual([{ studentMembershipId: ids.pupil2, name: "ZZ Slips Pupil Two", answer: "YES", answeredByName: "ZZ Slips Parent Two" }]);
    expect(await db.postAck.count({ where: { postId: ids.slip, userId: { in: [ids.p1, ids.p2] } } })).toBe(2);
    // Through the door, a pupil of someone else's: refused.
    await as(ids.p1, "PARENT", null);
    const res = await consentPost(new Request(`http://localhost/api/v1/shared/bulletin/${ids.slip}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentMembershipId: ids.pupil3, answer: "YES" }) }), { params: Promise.resolve({ postId: ids.slip }) });
    expect(res.status).toBe(404);
  });

  it("answers the wrong role 403 before it reads the body, and a guardian's empty body 422 (STREAMS-2)", async () => {
    const empty = () => consentPost(new Request(`http://localhost/api/v1/shared/bulletin/${ids.slip}/consent`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" }), { params: Promise.resolve({ postId: ids.slip }) });
    for (const [user, role] of [[ids.admin, "ADMIN"], [ids.teacher, "TEACHER"]] as const) {
      await as(user, role);
      const res = await empty();
      expect(res.status).toBe(403);
      expect(((await res.json()) as { issues?: unknown }).issues).toBeUndefined();
    }
    await as(ids.p1, "PARENT", null);
    expect((await empty()).status).toBe(422);
  });

  it("never lets a minor answer for themself, and closes after its day", async () => {
    const pupil = await as(ids.pupil1User, "STUDENT");
    await expect(answerSlip(pupil, ids.slip, { studentMembershipId: ids.pupil1, answer: "NO" })).rejects.toMatchObject({ key: "collegeDesks.refuseSlipMinor" });
    expect((await slipForReader(pupil, ids.slip)).children).toEqual([]);
    ids.closed = (await createPost(await as(ids.admin, "ADMIN"), { scope: "CLASS", classId: ids.class1, title: "ZZ Old trip", body: "", tags: [], media: [], consentQuestion: "Go?", consentBy: "2020-01-01" })).postId;
    const p1 = await as(ids.p1, "PARENT", null);
    expect((await slipForReader(p1, ids.closed)).open).toBe(false);
    await expect(answerSlip(p1, ids.closed, { studentMembershipId: ids.pupil1, answer: "YES" })).rejects.toMatchObject({ key: "collegeDesks.refuseSlipClosed" });
  });

  it("gives the class teacher and the office the answers child by child, and nobody else", async () => {
    const report = await slipReport(await as(ids.teacher, "TEACHER"), ids.slip);
    expect([report.yes, report.no, report.none]).toEqual([2, 0, 0]);
    expect(report.rows.map((r) => [r.name, r.answer, r.answeredByName])).toEqual([
      ["ZZ Slips Pupil One", "YES", "ZZ Slips Parent One"],
      ["ZZ Slips Pupil Two", "YES", "ZZ Slips Parent Two"],
    ]);
    expect((await slipReport(await as(ids.admin, "ADMIN"), ids.closed)).none).toBe(2);
    await expect(slipReport(await as(ids.otherTeacher, "TEACHER"), ids.slip)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(slipReport(await as(ids.p1, "PARENT", null), ids.slip)).rejects.toMatchObject({ key: "access.wrongRoleForThisAction" });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "circular.slip.answer" } })).toBe(3);
  });
});
