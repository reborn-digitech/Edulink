/**
 * The rest of the web-only writes, from the phone (A3-inventory-7, R-3, R-50;
 * risks batch of 5 October 2026): reopen a closed year, pin a post, close a
 * review round, a class's teachers and its register right, cancel a register
 * cover, invite one parent or one expert, take a paper off a date sheet, lay
 * out the suggested school day. Each door calls the library the web's action
 * calls; this suite holds, door by door: the catalog's roles are the
 * handler's, signed out is 401, a wrong role with a broken body is 403 (the
 * role before the body), the happy path at a ZZ school writes what the web
 * writes with the library's audit row, a rule's refusal is a 422 in words, and
 * another school's id is a 404. Everything is made in two ZZ schools of this
 * run and deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { ENDPOINTS } from "@/lib/api-catalog";
import { POST as yearReopenPost } from "@/app/api/v1/admin/calendar/years/[yearId]/reopen/route";
import { POST as pinPost } from "@/app/api/v1/shared/bulletin/[postId]/pin/route";
import { POST as roundClosePost } from "@/app/api/v1/admin/reviews/[roundId]/close/route";
import { POST as teachersPost } from "@/app/api/v1/admin/classes/[classId]/teachers/route";
import { POST as teachersRemovePost } from "@/app/api/v1/admin/classes/[classId]/teachers/remove/route";
import { POST as registerPost } from "@/app/api/v1/admin/classes/[classId]/teachers/register/route";
import { DELETE as coverDelete } from "@/app/api/v1/admin/classes/covers/[coverId]/route";
import { POST as parentsPost } from "@/app/api/v1/admin/people/[membershipId]/parents/route";
import { POST as expertInvitePost } from "@/app/api/v1/staff/experts/invite/route";
import { DELETE as examSlotDelete } from "@/app/api/v1/admin/exams/slots/[slotId]/route";
import { POST as suggestedDayPost } from "@/app/api/v1/admin/timetable/periods/suggested/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
type Who = "ADMIN" | "PRINCIPAL" | "TEACHER" | "CO_TEACHER" | "STUDENT";

let schoolId = "";
let otherSchoolId = "";
const users: Record<Who, string> = { ADMIN: "", PRINCIPAL: "", TEACHER: "", CO_TEACHER: "", STUDENT: "" };
const members: Record<Who, string> = { ADMIN: "", PRINCIPAL: "", TEACHER: "", CO_TEACHER: "", STUDENT: "" };
let classId = "";
let otherClassId = "";
let otherPupilId = "";
let otherTeacherId = "";

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/v1/x", { method, headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const bare = (method = "POST") => new Request("http://localhost/api/v1/x", { method });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function signInAs(who: Who | null) {
  __resetCookies();
  if (!who) return;
  const role = who === "CO_TEACHER" ? "TEACHER" : who;
  await createSession(users[who], { schoolId, role });
}
async function audits(action: string, targetId?: string) {
  return db.auditLog.count({ where: { schoolId, action, ...(targetId ? { targetId } : {}) } });
}

beforeAll(async () => {
  const mk = (tag: string) =>
    db.school.create({ data: { name: `ZZ OW ${tag} ${STAMP}`, slug: `zz-ow-${tag.toLowerCase()}-${STAMP}`, code: `W${tag.slice(0, 1)}${String(STAMP).slice(-6)}`, contactEmail: `zz-ow-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = (await mk("Home")).id;
  otherSchoolId = (await mk("Away")).id;
  for (const who of Object.keys(users) as Who[]) {
    users[who] = (await db.user.create({ data: { name: `ZZ OW ${who}`, email: `zz-ow-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    const role = who === "CO_TEACHER" ? "TEACHER" : who;
    members[who] = (await db.membership.create({ data: { userId: users[who], schoolId, role, status: "ACTIVE", ...(who === "STUDENT" ? { studentCode: `ZOWS${STAMP}` } : {}) }, select: { id: true } })).id;
  }
  classId = (await db.class.create({ data: { schoolId, name: `ZZ OW Class 4 ${STAMP}`, gradeLevel: "4", joinCode: `ZWA${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId: members.TEACHER, role: "LEAD", canTakeAttendance: true } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: members.STUDENT, status: "ACTIVE" } });

  // The other school: a class, a teacher and a pupil whose ids the home office must never reach.
  otherClassId = (await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ OW Elsewhere", gradeLevel: "4", joinCode: `ZWC${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  const awayTeacher = await db.user.create({ data: { name: "ZZ OW Away teacher", email: `zz-ow-away-teacher-${STAMP}@test.invalid` }, select: { id: true } });
  otherTeacherId = (await db.membership.create({ data: { userId: awayTeacher.id, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const awayPupil = await db.user.create({ data: { name: "ZZ OW Away pupil", email: `zz-ow-away-pupil-${STAMP}@test.invalid` }, select: { id: true } });
  otherPupilId = (await db.membership.create({ data: { userId: awayPupil.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZOWA${STAMP}` }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const userIds = (await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } })).map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

/** Every new door, called with a body that does not parse (or none): the gate's answer must come first. */
function everyDoor() {
  const x = "zz-ow-any-id"; // any id: a refused role never reaches it
  return [
    { name: "POST year reopen", call: () => yearReopenPost(bare(), params({ yearId: x })), roles: ["ADMIN", "PRINCIPAL"] },
    { name: "POST pin", call: () => pinPost(json("{"), params({ postId: x })), roles: ["ADMIN"] },
    { name: "POST round close", call: () => roundClosePost(bare(), params({ roundId: x })), roles: ["ADMIN", "PRINCIPAL"] },
    { name: "POST teachers", call: () => teachersPost(json("{not json"), params({ classId })), roles: ["ADMIN"] },
    { name: "POST teachers remove", call: () => teachersRemovePost(json({}), params({ classId })), roles: ["ADMIN"] },
    { name: "POST teachers register", call: () => registerPost(json({}), params({ classId })), roles: ["ADMIN"] },
    { name: "DELETE cover", call: () => coverDelete(bare("DELETE"), params({ coverId: x })), roles: ["ADMIN", "PRINCIPAL"] },
    { name: "POST parents", call: () => parentsPost(json({}), params({ membershipId: members.STUDENT })), roles: ["ADMIN"] },
    { name: "POST expert invite", call: () => expertInvitePost(json({})), roles: ["ADMIN", "TEACHER", "CO_TEACHER"] },
    { name: "DELETE exam slot", call: () => examSlotDelete(bare("DELETE"), params({ slotId: x })), roles: ["ADMIN"] },
    { name: "POST suggested day", call: () => suggestedDayPost(), roles: ["ADMIN"] },
  ];
}

describe("the gates", () => {
  it("every door is in the catalog with the roles its handler takes", () => {
    const want: [string, string, readonly string[]][] = [
      ["POST", "/api/v1/admin/calendar/years/{yearId}/reopen", ["ADMIN", "PRINCIPAL"]],
      ["POST", "/api/v1/shared/bulletin/{postId}/pin", ["ADMIN"]],
      ["POST", "/api/v1/admin/reviews/{roundId}/close", ["ADMIN", "PRINCIPAL"]],
      ["POST", "/api/v1/admin/classes/{classId}/teachers", ["ADMIN"]],
      ["POST", "/api/v1/admin/classes/{classId}/teachers/remove", ["ADMIN"]],
      ["POST", "/api/v1/admin/classes/{classId}/teachers/register", ["ADMIN"]],
      ["DELETE", "/api/v1/admin/classes/covers/{coverId}", ["ADMIN", "PRINCIPAL"]],
      ["POST", "/api/v1/admin/people/{membershipId}/parents", ["ADMIN"]],
      ["POST", "/api/v1/staff/experts/invite", ["ADMIN", "TEACHER"]],
      ["DELETE", "/api/v1/admin/exams/slots/{slotId}", ["ADMIN"]],
      ["POST", "/api/v1/admin/timetable/periods/suggested", ["ADMIN"]],
    ];
    for (const [method, path, roles] of want) {
      const door = ENDPOINTS.find((e) => e.method === method && e.path === path);
      expect(door, `${method} ${path}`).toBeDefined();
      expect([...(door!.access as string[])].sort(), `${method} ${path}`).toEqual([...roles].sort());
      // Each has a path the sweep can call, and none carries a body that would act.
      if (path.includes("{")) expect(door!.sample, `${method} ${path} sample`).toBeDefined();
      expect(door!.sampleBody, `${method} ${path} sampleBody`).toBeUndefined();
    }
  });

  it("signed out is 401 everywhere", async () => {
    await signInAs(null);
    for (const d of everyDoor()) expect((await d.call()).status, d.name).toBe(401);
  });

  it("a wrong role is refused everywhere, and the role is checked before the body (403, not 422)", async () => {
    for (const who of ["STUDENT", "TEACHER", "PRINCIPAL"] as Who[]) {
      await signInAs(who);
      for (const d of everyDoor().filter((d) => !d.roles.includes(who))) {
        const res = await d.call();
        expect(res.status, `${who} ${d.name}`).toBe(403);
        expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
      }
    }
  });
});

describe("reopen a closed year", () => {
  it("the head reopens the latest closed year, audited; an earlier one is 422; one not closed or elsewhere is 404", async () => {
    const year = (name: string, start: string, end: string, extra: Record<string, unknown>) =>
      db.academicYear.create({ data: { schoolId, name, startDate: new Date(`${start}T00:00:00Z`), endDate: new Date(`${end}T00:00:00Z`), ...extra }, select: { id: true } });
    const older = await year("2024–25", "2024-06-01", "2025-03-31", { isCurrent: false, closedAt: new Date("2025-04-01T00:00:00Z") });
    const latest = await year("2025–26", "2025-06-01", "2026-03-31", { isCurrent: false, closedAt: new Date("2026-04-01T00:00:00Z") });
    const running = await year("2026–27", "2026-06-01", "2027-03-31", { isCurrent: true });
    const away = await db.academicYear.create({ data: { schoolId: otherSchoolId, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-03-31T00:00:00Z"), isCurrent: false, closedAt: new Date("2026-04-01T00:00:00Z") }, select: { id: true } });

    await signInAs("PRINCIPAL");
    expect((await yearReopenPost(bare(), params({ yearId: away.id }))).status).toBe(404);
    expect(await db.academicYear.findUniqueOrThrow({ where: { id: away.id }, select: { closedAt: true } })).toEqual({ closedAt: expect.any(Date) });
    const earlier = await yearReopenPost(bare(), params({ yearId: older.id }));
    expect(earlier.status).toBe(422);
    expect((await earlier.json()).error).toEqual(expect.any(String));
    expect((await yearReopenPost(bare(), params({ yearId: running.id }))).status).toBe(404);

    const res = await yearReopenPost(bare(), params({ yearId: latest.id }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ seriesRestored: 0 });
    expect(await db.academicYear.findUniqueOrThrow({ where: { id: latest.id }, select: { isCurrent: true, closedAt: true } })).toEqual({ isCurrent: true, closedAt: null });
    expect(await db.academicYear.findUniqueOrThrow({ where: { id: running.id }, select: { isCurrent: true } })).toEqual({ isCurrent: false });
    expect(await audits("year.reopen", latest.id)).toBe(1);
    // Open now: a second press finds no closed year by that id.
    expect((await yearReopenPost(bare(), params({ yearId: latest.id }))).status).toBe(404);
  });
});

describe("pin a post", () => {
  it("the office pins and unpins as asked, each audited once (a replay is a no-op); a post elsewhere is 404 and untouched", async () => {
    const post = await db.post.create({ data: { schoolId, authorUserId: users.ADMIN, scope: "SCHOOL", title: "ZZ OW Sports day", status: "APPROVED" }, select: { id: true } });
    const away = await db.post.create({ data: { schoolId: otherSchoolId, authorUserId: users.ADMIN, scope: "SCHOOL", title: "ZZ OW Away", status: "APPROVED" }, select: { id: true } });
    await signInAs("ADMIN");
    expect((await pinPost(bare(), params({ postId: post.id }))).status).toBe(422);
    expect((await pinPost(json({ pinned: true }), params({ postId: away.id }))).status).toBe(404);
    expect(await db.post.findUniqueOrThrow({ where: { id: away.id }, select: { pinnedAt: true } })).toEqual({ pinnedAt: null });

    const on = await pinPost(json({ pinned: true }), params({ postId: post.id }));
    expect(on.status).toBe(200);
    expect(await on.json()).toEqual({ pinned: true });
    expect(await db.post.findUniqueOrThrow({ where: { id: post.id }, select: { pinnedAt: true } })).toEqual({ pinnedAt: expect.any(Date) });
    expect(await audits("post.pin", post.id)).toBe(1);
    // The phone's outbox replays the same call: still pinned, no second audit row.
    expect(await (await pinPost(json({ pinned: true }), params({ postId: post.id }))).json()).toEqual({ pinned: true });
    expect(await audits("post.pin", post.id)).toBe(1);

    const off = await pinPost(json({ pinned: false }), params({ postId: post.id }));
    expect(await off.json()).toEqual({ pinned: false });
    expect(await db.post.findUniqueOrThrow({ where: { id: post.id }, select: { pinnedAt: true } })).toEqual({ pinnedAt: null });
    expect(await audits("post.unpin", post.id)).toBe(1);
  });
});

describe("close a review round", () => {
  it("the head closes an open round, audited; a second press is a no-op; a round elsewhere is 404 and stays open", async () => {
    const round = await db.reviewRound.create({ data: { schoolId, audience: "STUDENTS", closesDateKey: "2026-12-31" }, select: { id: true } });
    const away = await db.reviewRound.create({ data: { schoolId: otherSchoolId, audience: "STUDENTS", closesDateKey: "2026-12-31" }, select: { id: true } });
    await signInAs("PRINCIPAL");
    expect((await roundClosePost(bare(), params({ roundId: away.id }))).status).toBe(404);
    expect(await db.reviewRound.findUniqueOrThrow({ where: { id: away.id }, select: { status: true } })).toEqual({ status: "OPEN" });
    expect((await roundClosePost(bare(), params({ roundId: "zz-ow-no-such-round" }))).status).toBe(404);

    expect((await roundClosePost(bare(), params({ roundId: round.id }))).status).toBe(200);
    expect(await db.reviewRound.findUniqueOrThrow({ where: { id: round.id }, select: { status: true } })).toEqual({ status: "CLOSED" });
    expect(await audits("review.round.close", round.id)).toBe(1);
    expect((await roundClosePost(bare(), params({ roundId: round.id }))).status).toBe(200);
    expect(await audits("review.round.close", round.id)).toBe(1);
  });
});

describe("a class's teachers and its register", () => {
  it("the office adds a co-teacher, gives and takes the register right, and drops them; each audited", async () => {
    await signInAs("ADMIN");
    // Not teaching staff here (a pupil, a teacher of another school), or a class elsewhere: refused, nothing written.
    expect((await teachersPost(json({ teacherMembershipId: members.STUDENT, role: "CO" }), params({ classId }))).status).toBe(422);
    expect((await teachersPost(json({ teacherMembershipId: otherTeacherId, role: "CO" }), params({ classId }))).status).toBe(422);
    expect((await teachersPost(json({ teacherMembershipId: members.CO_TEACHER, role: "CO" }), params({ classId: otherClassId }))).status).toBe(404);
    expect((await teachersPost(json({ teacherMembershipId: members.CO_TEACHER, role: "ASSISTANT" }), params({ classId }))).status).toBe(422);

    const add = await teachersPost(json({ teacherMembershipId: members.CO_TEACHER, role: "CO" }), params({ classId }));
    expect(add.status).toBe(200);
    expect(await db.classTeacher.findFirstOrThrow({ where: { classId, teacherMembershipId: members.CO_TEACHER }, select: { role: true, canTakeAttendance: true } })).toEqual({ role: "CO", canTakeAttendance: false });
    expect(await audits("class.teacher.assign", classId)).toBe(1);

    // The register right, by the class and the teacher.
    expect((await registerPost(json({ teacherMembershipId: members.CO_TEACHER, canTake: true }), params({ classId: otherClassId }))).status).toBe(404);
    expect((await registerPost(json({ teacherMembershipId: members.PRINCIPAL, canTake: true }), params({ classId }))).status).toBe(422);
    const grant = await registerPost(json({ teacherMembershipId: members.CO_TEACHER, canTake: true }), params({ classId }));
    expect(grant.status).toBe(200);
    expect(await db.classTeacher.findFirstOrThrow({ where: { classId, teacherMembershipId: members.CO_TEACHER }, select: { canTakeAttendance: true } })).toEqual({ canTakeAttendance: true });
    expect(await audits("class.attendance.grant", classId)).toBe(1);
    expect((await registerPost(json({ teacherMembershipId: members.CO_TEACHER, canTake: false }), params({ classId }))).status).toBe(200);
    expect(await db.classTeacher.findFirstOrThrow({ where: { classId, teacherMembershipId: members.CO_TEACHER }, select: { canTakeAttendance: true } })).toEqual({ canTakeAttendance: false });
    expect(await audits("class.attendance.revoke", classId)).toBe(1);

    // Off the class; a second time is a rule; a class elsewhere is a 404.
    expect((await teachersRemovePost(json({ teacherMembershipId: members.CO_TEACHER }), params({ classId: otherClassId }))).status).toBe(404);
    expect((await teachersRemovePost(json({ teacherMembershipId: members.CO_TEACHER }), params({ classId }))).status).toBe(200);
    expect(await db.classTeacher.count({ where: { classId, teacherMembershipId: members.CO_TEACHER } })).toBe(0);
    expect(await audits("class.teacher.remove", classId)).toBe(1);
    expect((await teachersRemovePost(json({ teacherMembershipId: members.CO_TEACHER }), params({ classId }))).status).toBe(422);
    // The lead is where it was.
    expect(await db.classTeacher.count({ where: { classId, teacherMembershipId: members.TEACHER } })).toBe(1);
  });

  it("the head cancels a register cover, audited and the colleague told; again is 404; a cover elsewhere is 404 and stays", async () => {
    const cover = await db.attendanceCover.create({ data: { schoolId, classId, coveringMembershipId: members.CO_TEACHER, fromDateKey: "2026-11-02", toDateKey: "2026-11-02" }, select: { id: true } });
    const away = await db.attendanceCover.create({ data: { schoolId: otherSchoolId, classId: otherClassId, coveringMembershipId: otherTeacherId, fromDateKey: "2026-11-02", toDateKey: "2026-11-02" }, select: { id: true } });
    await signInAs("PRINCIPAL");
    expect((await coverDelete(bare("DELETE"), params({ coverId: away.id }))).status).toBe(404);
    expect(await db.attendanceCover.count({ where: { id: away.id } })).toBe(1);
    const res = await coverDelete(bare("DELETE"), params({ coverId: cover.id }));
    expect(res.status).toBe(200);
    expect(await db.attendanceCover.count({ where: { id: cover.id } })).toBe(0);
    expect(await audits("attendance.cover.cancel", cover.id)).toBe(1);
    expect(await db.notification.count({ where: { userId: users.CO_TEACHER, schoolId } })).toBe(1);
    expect((await coverDelete(bare("DELETE"), params({ coverId: cover.id }))).status).toBe(404);
  });
});

describe("one invitation", () => {
  it("the office invites a parent to a pupil, mailed and audited; again is 422; a pupil elsewhere is 404", async () => {
    const email = `zz-ow-parent-${STAMP}@test.invalid`;
    await signInAs("ADMIN");
    expect((await parentsPost(json({ email, relation: "PARENT" }), params({ membershipId: otherPupilId }))).status).toBe(404);
    expect((await parentsPost(json({ email, relation: "PARENT" }), params({ membershipId: members.TEACHER }))).status).toBe(404);
    expect((await parentsPost(json({ email: "nope", relation: "PARENT" }), params({ membershipId: members.STUDENT }))).status).toBe(422);
    expect((await parentsPost(json({ email, relation: "UNCLE" }), params({ membershipId: members.STUDENT }))).status).toBe(422);

    const res = await parentsPost(json({ email, name: "ZZ OW Parent", relation: "GUARDIAN" }), params({ membershipId: members.STUDENT }));
    expect(res.status).toBe(201);
    const { inviteId } = await res.json();
    expect(await db.invite.findUniqueOrThrow({ where: { id: inviteId }, select: { schoolId: true, role: true, email: true, studentMembershipId: true, relation: true, status: true } })).toEqual({ schoolId, role: "PARENT", email, studentMembershipId: members.STUDENT, relation: "GUARDIAN", status: "PENDING" });
    expect(await db.outboundEmail.count({ where: { to: email } })).toBe(1);
    expect(await audits("parent.invite", members.STUDENT)).toBe(1);
    expect((await parentsPost(json({ email, relation: "PARENT" }), params({ membershipId: members.STUDENT }))).status).toBe(422);
  });

  it("a teacher invites an expert by name and is answered the link; an empty body is 422 and mints nothing", async () => {
    await signInAs("TEACHER");
    expect((await expertInvitePost(json({}))).status).toBe(422);
    expect((await expertInvitePost(json({ email: "not an address" }))).status).toBe(422);
    expect(await db.expertInvite.count({ where: { schoolId } })).toBe(0);
    const res = await expertInvitePost(json({ name: "ZZ OW Expert", email: `zz-ow-expert-${STAMP}@test.invalid` }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.link).toMatch(/\/expert\/invite\/[A-Za-z0-9_-]{20,}$/);
    expect(new Date(body.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(await db.expertInvite.findFirstOrThrow({ where: { schoolId }, select: { name: true, invitedByMembershipId: true } })).toEqual({ name: "ZZ OW Expert", invitedByMembershipId: members.TEACHER });
    expect(await audits("expert.invite")).toBe(1);
  });
});

describe("the date sheet and the school day", () => {
  it("the office takes an unmarked paper off a date sheet, audited; a marked one is 422; one elsewhere is 404", async () => {
    const series = await db.examSeries.create({ data: { schoolId, name: "ZZ OW Unit test", gradeLevel: "4" }, select: { id: true } });
    const slot = (subject: string) => db.examSlot.create({ data: { schoolId, seriesId: series.id, subject, dateKey: "2026-11-10", pointsMilli: 80_000 }, select: { id: true } });
    const plain = await slot("ZZ Maths");
    const marked = await slot("ZZ English");
    const sitting = await db.assignment.create({ data: { schoolId, classId, authorMembershipId: members.TEACHER, title: "ZZ OW English paper", examSlotId: marked.id }, select: { id: true } });
    await db.grade.create({ data: { schoolId, assignmentId: sitting.id, studentMembershipId: members.STUDENT, scoreMilli: 60_000 } });
    const awaySeries = await db.examSeries.create({ data: { schoolId: otherSchoolId, name: "ZZ OW Away test", gradeLevel: "4" }, select: { id: true } });
    const away = await db.examSlot.create({ data: { schoolId: otherSchoolId, seriesId: awaySeries.id, subject: "ZZ Maths", dateKey: "2026-11-10", pointsMilli: 80_000 }, select: { id: true } });

    await signInAs("ADMIN");
    expect((await examSlotDelete(bare("DELETE"), params({ slotId: away.id }))).status).toBe(404);
    expect(await db.examSlot.count({ where: { id: away.id } })).toBe(1);
    const refused = await examSlotDelete(bare("DELETE"), params({ slotId: marked.id }));
    expect(refused.status).toBe(422);
    expect((await refused.json()).error).toMatch(/1/);
    expect(await db.examSlot.count({ where: { id: marked.id } })).toBe(1);

    expect((await examSlotDelete(bare("DELETE"), params({ slotId: plain.id }))).status).toBe(200);
    expect(await db.examSlot.count({ where: { id: plain.id } })).toBe(0);
    expect(await audits("exam.slotChange", series.id)).toBe(1);
    expect((await examSlotDelete(bare("DELETE"), params({ slotId: plain.id }))).status).toBe(404);
  });

  it("the office lays out the suggested day once, audited; a second time is 422 and adds nothing", async () => {
    await signInAs("ADMIN");
    expect(await db.timetablePeriod.count({ where: { schoolId } })).toBe(0);
    const res = await suggestedDayPost();
    expect(res.status).toBe(200);
    const { created } = await res.json();
    expect(created).toBeGreaterThan(0);
    expect(await db.timetablePeriod.count({ where: { schoolId } })).toBe(created);
    expect(await db.timetablePeriod.count({ where: { schoolId: otherSchoolId } })).toBe(0);
    expect(await audits("timetable.period.seed", schoolId)).toBe(1);
    expect((await suggestedDayPost()).status).toBe(422);
    expect(await db.timetablePeriod.count({ where: { schoolId } })).toBe(created);
  });
});
