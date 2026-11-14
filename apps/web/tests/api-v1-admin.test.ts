/**
 * The /api/v1/admin handlers, invoked directly with a primed session the way
 * api-v1-routes.test.ts does: for each endpoint the happy path, 401 signed
 * out, 403 for a pupil (and for the head where the page is the office's
 * alone), 404 for another school's id, 422 for a body or query that does not
 * parse. Everything created is ZZ-prefixed and deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { hashToken, generateToken } from "@/lib/crypto";
import { todayKey, addDaysToKey } from "@/lib/dates";
import { GET as overviewGet } from "@/app/api/v1/admin/overview/route";
import { adminOverview } from "@/lib/api-reads/admin";
import { GET as peopleGet } from "@/app/api/v1/admin/people/route";
import { GET as invitesGet, POST as invitesPost } from "@/app/api/v1/admin/people/invites/route";
import { POST as inviteRevokePost } from "@/app/api/v1/admin/people/invites/[inviteId]/revoke/route";
import { POST as intakePost } from "@/app/api/v1/admin/people/intake/route";
import { GET as classesGet, POST as classesPost } from "@/app/api/v1/admin/classes/route";
import { POST as classArchivePost } from "@/app/api/v1/admin/classes/[classId]/archive/route";
import { POST as classTeacherPost } from "@/app/api/v1/admin/classes/[classId]/teacher/route";
import { GET as promotionGet } from "@/app/api/v1/admin/classes/promotion/route";
import { GET as timetableGet } from "@/app/api/v1/admin/timetable/route";
import { POST as periodsPost } from "@/app/api/v1/admin/timetable/periods/route";
import { POST as slotsPost } from "@/app/api/v1/admin/timetable/slots/route";
import { GET as examsGet, POST as examsPost } from "@/app/api/v1/admin/exams/route";
import { POST as examSlotsPost } from "@/app/api/v1/admin/exams/[seriesId]/slots/route";
import { POST as examPublishPost } from "@/app/api/v1/admin/exams/[seriesId]/publish/route";
import { GET as attendanceGet } from "@/app/api/v1/admin/attendance/route";
import { GET as historyGet } from "@/app/api/v1/admin/attendance/history/route";
import { GET as calendarGet } from "@/app/api/v1/admin/calendar/route";
import { POST as closuresPost } from "@/app/api/v1/admin/calendar/closures/route";
import { GET as reviewsGet, POST as reviewsPost } from "@/app/api/v1/admin/reviews/route";
import { GET as safetyGet } from "@/app/api/v1/admin/safety/route";
import { GET as settingsGet, POST as settingsPost } from "@/app/api/v1/admin/settings/route";
import { GET as vacanciesGet, POST as vacanciesPost } from "@/app/api/v1/admin/vacancies/route";
import { POST as vacancyClosePost } from "@/app/api/v1/admin/vacancies/[postingId]/close/route";
import { GET as leaveGet } from "@/app/api/v1/admin/leave/route";
import { POST as leaveDecidePost } from "@/app/api/v1/admin/leave/[leaveId]/decide/route";
import { GET as staffGet } from "@/app/api/v1/admin/staff/route";

/**
 * Four handlers call the page's server action itself (invites, intake,
 * classes, settings), because that is where the write lives. An action ends
 * with revalidatePath, which needs a request store a route handler has and
 * a test does not; here it is a no-op, as the cache is.
 */
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const CLASS_NAME = `ZZ V1A Class 4 ${STAMP}`;

let schoolId = "";
let otherSchoolId = "";
let classId = "";
let otherClassId = "";
let adminUserId = "";
let adminMembershipId = "";
let principalUserId = "";
let teacherUserId = "";
let teacherMembershipId = "";
let coverUserId = "";
let coverMembershipId = "";
let pupilUserId = "";
let inviteId = "";
let otherInviteId = "";
let leaveId = "";
let otherLeaveId = "";
let otherSeriesId = "";
let otherPostingId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) =>
  new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function signInAs(role: "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT") {
  __resetCookies();
  const userId = role === "ADMIN" ? adminUserId : role === "PRINCIPAL" ? principalUserId : role === "TEACHER" ? teacherUserId : pupilUserId;
  await createSession(userId, { schoolId, role });
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: `ZZ V1A School ${STAMP}`, slug: `zz-v1a-${STAMP}`, code: `ZA${String(STAMP).slice(-6)}`, contactEmail: `zz-v1a-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true },
  });
  schoolId = school.id;
  const other = await db.school.create({
    data: { name: `ZZ V1A Other ${STAMP}`, slug: `zz-v1ao-${STAMP}`, code: `ZB${String(STAMP).slice(-6)}`, contactEmail: `zz-v1ao-${STAMP}@test.invalid`, timezone: TZ },
    select: { id: true },
  });
  otherSchoolId = other.id;

  const [admin, principal, teacher, cover, pupil] = await Promise.all(
    ["Admin", "Principal", "Teacher", "Cover", "Pupil"].map((who) =>
      db.user.create({ data: { name: `ZZ V1A ${who}`, email: `zz-v1a-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } }),
    ),
  );
  adminUserId = admin!.id;
  principalUserId = principal!.id;
  teacherUserId = teacher!.id;
  coverUserId = cover!.id;
  pupilUserId = pupil!.id;

  const am = await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } });
  adminMembershipId = am.id;
  await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE", subjects: JSON.stringify(["Mathematics"]) }, select: { id: true } });
  teacherMembershipId = tm.id;
  const cm = await db.membership.create({ data: { userId: coverUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  coverMembershipId = cm.id;
  const pm = await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAP${STAMP}` }, select: { id: true } });
  // The same teacher at the other school, so the other school can own a leave request.
  const otherTeacher = await db.membership.create({ data: { userId: teacherUserId, schoolId: otherSchoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });

  const klass = await db.class.create({ data: { schoolId, name: CLASS_NAME, gradeLevel: "4", joinCode: `ZA${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { classId, schoolId, teacherMembershipId, role: "LEAD" } });
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pm.id, status: "ACTIVE" } });
  const otherClass = await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ V1A Elsewhere", gradeLevel: "4", joinCode: `ZB${String(STAMP).slice(-6)}` }, select: { id: true } });
  otherClassId = otherClass.id;

  const expiresAt = new Date(Date.now() + 7 * 86_400_000);
  const invite = await db.invite.create({
    data: { schoolId, role: "TEACHER", email: `zz-v1a-invitee-${STAMP}@test.invalid`, name: "ZZ Invitee", tokenHash: hashToken(generateToken()), createdByMembershipId: adminMembershipId, expiresAt },
    select: { id: true },
  });
  inviteId = invite.id;
  const otherInvite = await db.invite.create({
    data: { schoolId: otherSchoolId, role: "TEACHER", email: `zz-v1a-other-invitee-${STAMP}@test.invalid`, tokenHash: hashToken(generateToken()), expiresAt },
    select: { id: true },
  });
  otherInviteId = otherInvite.id;

  const today = todayKey(TZ);
  const leave = await db.leaveRequest.create({
    data: { schoolId, teacherMembershipId, fromDateKey: addDaysToKey(today, 7), toDateKey: addDaysToKey(today, 8), kind: "CASUAL", reason: "ZZ family event" },
    select: { id: true },
  });
  leaveId = leave.id;
  const otherLeave = await db.leaveRequest.create({
    data: { schoolId: otherSchoolId, teacherMembershipId: otherTeacher.id, fromDateKey: addDaysToKey(today, 7), toDateKey: addDaysToKey(today, 7), kind: "SICK", reason: "ZZ elsewhere" },
    select: { id: true },
  });
  otherLeaveId = otherLeave.id;

  const otherSeries = await db.examSeries.create({ data: { schoolId: otherSchoolId, name: "ZZ V1A Elsewhere Test", gradeLevel: "4" }, select: { id: true } });
  otherSeriesId = otherSeries.id;
  const otherPosting = await db.jobPosting.create({
    data: { schoolId: otherSchoolId, title: "ZZ V1A Elsewhere vacancy", body: "Not yours.", hiringContactMembershipId: otherTeacher.id },
    select: { id: true },
  });
  otherPostingId = otherPosting.id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, coverUserId, pupilUserId] } } });
  // Pupils the intake test admitted: no email, a handle, memberships only here.
  const admitted = await db.user.findMany({ where: { name: { startsWith: "ZZ V1A Intake" } }, select: { id: true } });
  const ids = admitted.map((u) => u.id);
  await db.guardianship.deleteMany({ where: { student: { userId: { in: ids } } } });
  await db.enrollment.deleteMany({ where: { student: { userId: { in: ids } } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

/* -------------------------------------------------------------------------- */
/* The gates, across every handler                                             */
/* -------------------------------------------------------------------------- */

const P = "/api/v1/admin";

/** Every handler with a request that would pass parsing, so the refusal is the gate's and not the parser's. */
function everyHandler(): { name: string; call: () => Promise<Response>; principal: boolean }[] {
  const id = { classId, inviteId, seriesId: otherSeriesId, postingId: otherPostingId, leaveId };
  return [
    { name: "GET overview", call: () => overviewGet(), principal: false },
    { name: "GET people", call: () => peopleGet(get(`${P}/people`)), principal: false },
    { name: "GET invites", call: () => invitesGet(get(`${P}/people/invites`)), principal: false },
    { name: "POST invites", call: () => invitesPost(json(`${P}/people/invites`, { role: "TEACHER", csv: "x@test.invalid" })), principal: false },
    { name: "POST invite revoke", call: () => inviteRevokePost(get(""), params({ inviteId: id.inviteId })), principal: false },
    { name: "POST intake", call: () => intakePost(json(`${P}/people/intake`, { csv: "name\nZZ Nobody" })), principal: false },
    { name: "GET classes", call: () => classesGet(get(`${P}/classes`)), principal: false },
    { name: "POST classes", call: () => classesPost(json(`${P}/classes`, { name: "ZZ Gate" })), principal: false },
    { name: "POST class archive", call: () => classArchivePost(json("", { archived: false }), params({ classId: id.classId })), principal: false },
    { name: "POST class teacher", call: () => classTeacherPost(json("", { teacherMembershipId, assigned: true }), params({ classId: id.classId })), principal: false },
    { name: "GET promotion", call: () => promotionGet(), principal: false },
    { name: "GET timetable", call: () => timetableGet(get(`${P}/timetable`)), principal: false },
    { name: "POST periods", call: () => periodsPost(json(`${P}/timetable/periods`, { name: "ZZ", startMinute: 540, endMinute: 585, kind: "LESSON" })), principal: false },
    { name: "POST slots", call: () => slotsPost(json(`${P}/timetable/slots`, { classId, periodId: "x", weekday: 1, subject: "Maths" })), principal: false },
    { name: "GET exams", call: () => examsGet(get(`${P}/exams`)), principal: false },
    { name: "POST exams", call: () => examsPost(json(`${P}/exams`, { name: "ZZ Gate", gradeLevel: "4" })), principal: false },
    { name: "POST exam slots", call: () => examSlotsPost(json("", { subject: "Maths", dateKey: "2030-03-02", maxMarks: 50 }), params({ seriesId: id.seriesId })), principal: false },
    { name: "POST exam publish", call: () => examPublishPost(get(""), params({ seriesId: id.seriesId })), principal: false },
    { name: "GET attendance", call: () => attendanceGet(get(`${P}/attendance`)), principal: false },
    { name: "GET history", call: () => historyGet(get(`${P}/attendance/history`)), principal: true },
    { name: "GET calendar", call: () => calendarGet(get(`${P}/calendar`)), principal: true },
    { name: "POST closures", call: () => closuresPost(json(`${P}/calendar/closures`, { name: "ZZ Gate", startDateKey: "2030-01-06", endDateKey: "2030-01-06", kind: "HOLIDAY" })), principal: false },
    { name: "GET reviews", call: () => reviewsGet(get(`${P}/reviews`)), principal: true },
    { name: "POST reviews", call: () => reviewsPost(json(`${P}/reviews`, { teacherMembershipIds: [teacherMembershipId], audience: "BOTH", closesDateKey: "2030-01-06" })), principal: true },
    // The safety centre is one of the head's pages since owner-batch-item9 (27 Oct 2026): the head reads it too.
    { name: "GET safety", call: () => safetyGet(get(`${P}/safety`)), principal: true },
    { name: "GET settings", call: () => settingsGet(), principal: false },
    { name: "POST settings", call: () => settingsPost(json(`${P}/settings`, { name: "ZZ Gate School", contactEmail: "x@test.invalid" })), principal: false },
    { name: "GET vacancies", call: () => vacanciesGet(get(`${P}/vacancies`)), principal: true },
    { name: "POST vacancies", call: () => vacanciesPost(json(`${P}/vacancies`, { title: "ZZ", body: "ZZ", employmentType: "FULL_TIME", hiringContactMembershipId: adminMembershipId })), principal: false },
    { name: "POST vacancy close", call: () => vacancyClosePost(get(""), params({ postingId: id.postingId })), principal: false },
    { name: "GET leave", call: () => leaveGet(), principal: true },
    { name: "POST leave decide", call: () => leaveDecidePost(json("", { decision: "DECLINED" }), params({ leaveId: id.leaveId })), principal: true },
    { name: "GET staff", call: () => staffGet(get(`${P}/staff`)), principal: true },
  ];
}

describe("the gates", () => {
  it("every handler answers 401 signed out, in the contract's envelope", async () => {
    __resetCookies();
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, h.name).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("a pupil is refused everywhere; the head is refused on the office's own pages and nowhere else", async () => {
    await signInAs("STUDENT");
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, `pupil ${h.name}`).toBe(403);
    }
    await signInAs("PRINCIPAL");
    for (const h of everyHandler().filter((h) => !h.principal)) {
      const res = await h.call();
      expect(res.status, `principal ${h.name}`).toBe(403);
    }
  });
});

/* -------------------------------------------------------------------------- */
/* The office                                                                  */
/* -------------------------------------------------------------------------- */

describe("as the admin", () => {
  beforeAll(() => signInAs("ADMIN"));

  it("overview: the school, its counts, no year yet", async () => {
    const res = await overviewGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.school.name).toBe(`ZZ V1A School ${STAMP}`);
    expect(body.academicYear).toBeNull();
    expect(body.counts).toMatchObject({ teachers: 2, students: 1, classes: 1, pendingInvites: 1 });
    expect(body.checklist.total).toBeGreaterThan(0);
  });

  it("overview: registers expected only on a teaching day, from classes with pupils", async () => {
    // The read itself with the clock pinned: TZ is Asia/Kolkata, and noon UTC
    // is the same calendar day there. One class with one pupil, no register.
    const ctx = { sessionId: "test", schoolId, membershipId: adminMembershipId, role: "ADMIN" } as unknown as Parameters<typeof adminOverview>[0];
    const tuesday = await adminOverview(ctx, new Date("2025-07-15T12:00:00Z"));
    expect(tuesday.counts.registersTakenToday).toBe(0);
    expect(tuesday.attendanceTakenPercent).toBe(0);

    // A Sunday expects nothing: null rather than "0 % of the registers".
    const sunday = await adminOverview(ctx, new Date("2025-07-20T12:00:00Z"));
    expect(sunday.counts.registersTakenToday).toBe(0);
    expect(sunday.attendanceTakenPercent).toBeNull();

    // A closing holiday the same, and an empty class adds nothing to expect.
    const holiday = await db.holiday.create({
      data: { schoolId, name: "ZZ V1A Holiday", startDateKey: "2025-07-16", endDateKey: "2025-07-16", kind: "HOLIDAY" },
      select: { id: true },
    });
    const emptyClass = await db.class.create({
      data: { schoolId, name: "ZZ V1A Empty", gradeLevel: "5", joinCode: `ZE${String(STAMP).slice(-6)}` },
      select: { id: true },
    });
    try {
      const wednesday = await adminOverview(ctx, new Date("2025-07-16T12:00:00Z"));
      expect(wednesday.attendanceTakenPercent).toBeNull();
      const thursday = await adminOverview(ctx, new Date("2025-07-17T12:00:00Z"));
      expect(thursday.counts.classes).toBe(2);
      // Still 0 of 1: the empty class is not a register anybody can take.
      expect(thursday.attendanceTakenPercent).toBe(0);
      // A register only a device has started (no taker) is still due from its teacher.
      const started = await db.attendanceSession.create({ data: { schoolId, classId, dateKey: "2025-07-17" }, select: { id: true } });
      const deviceOnly = await adminOverview(ctx, new Date("2025-07-17T12:00:00Z"));
      expect(deviceOnly.counts.registersTakenToday).toBe(0);
      expect(deviceOnly.attendanceTakenPercent).toBe(0);
      await db.attendanceSession.update({ where: { id: started.id }, data: { takenByMembershipId: teacherMembershipId, takenAt: new Date() } });
      const taken = await adminOverview(ctx, new Date("2025-07-17T12:00:00Z"));
      expect(taken.counts.registersTakenToday).toBe(1);
      expect(taken.attendanceTakenPercent).toBe(100);
    } finally {
      await db.attendanceSession.deleteMany({ where: { schoolId, dateKey: "2025-07-17" } });
      await db.class.delete({ where: { id: emptyClass.id } });
      await db.holiday.delete({ where: { id: holiday.id } });
    }
  });

  it("people: the directory, narrowed by role; a bad status is 422", async () => {
    const all = await (await peopleGet(get(`${P}/people`))).json();
    expect(all.total).toBe(5);
    expect(all.members.map((m: { name: string }) => m.name)).toContain("ZZ V1A Pupil");
    const pupil = all.members.find((m: { role: string }) => m.role === "STUDENT");
    expect(pupil.enrolledIn).toEqual([CLASS_NAME]);
    const teacher = all.members.find((m: { membershipId: string }) => m.membershipId === teacherMembershipId);
    expect(teacher.teaches).toEqual([CLASS_NAME]);
    expect(teacher.subjects).toEqual(["Mathematics"]);

    const pupils = await (await peopleGet(get(`${P}/people?role=STUDENT&classId=${classId}`))).json();
    expect(pupils.total).toBe(1);
    expect(pupils.filters).toMatchObject({ role: "STUDENT", classId, status: "ACTIVE" });

    // Another school's class as a filter narrows to nothing rather than leaking.
    const elsewhere = await (await peopleGet(get(`${P}/people?classId=${otherClassId}`))).json();
    expect(elsewhere.filters.classId).toBeNull();

    const bad = await peopleGet(get(`${P}/people?status=BOGUS`));
    expect(bad.status).toBe(422);
  });

  it("invites: listed, created from a pasted list, revoked once; another school's is a 404", async () => {
    const pending = await (await invitesGet(get(`${P}/people/invites`))).json();
    expect(pending.counts.PENDING).toBe(1);
    expect(pending.invites[0]).toMatchObject({ id: inviteId, role: "TEACHER", expired: false });

    const created = await invitesPost(json(`${P}/people/invites`, { role: "TEACHER", csv: `zz-v1a-newcomer-${STAMP}@test.invalid` }));
    expect(created.status).toBe(200);
    expect(await created.json()).toMatchObject({ sent: 1, outcomes: [{ status: "sent" }] });
    const again = await invitesPost(json(`${P}/people/invites`, { role: "TEACHER", csv: `zz-v1a-newcomer-${STAMP}@test.invalid` }));
    expect(await again.json()).toMatchObject({ sent: 0, outcomes: [{ status: "skipped", reasonKey: "invites.alreadyInvited" }] });
    expect((await invitesPost(json(`${P}/people/invites`, { role: "PARENT", csv: "x@test.invalid" }))).status).toBe(422);
    expect((await invitesPost(json(`${P}/people/invites`, { role: "TEACHER", csv: "not an address" }))).status).toBe(422);

    const revoked = await inviteRevokePost(get(""), params({ inviteId }));
    expect(revoked.status).toBe(200);
    expect(await revoked.json()).toEqual({ ok: true });
    expect((await inviteRevokePost(get(""), params({ inviteId }))).status).toBe(422);
    const elsewhere = await inviteRevokePost(get(""), params({ inviteId: otherInviteId }));
    expect(elsewhere.status).toBe(404);
    expect(await elsewhere.json()).toMatchObject({ code: "NOT_FOUND" });
    expect((await invitesGet(get(`${P}/people/invites?status=REVOKED`))).status).toBe(200);
  });

  it("intake: a pasted list admits pupils into the named class; an empty one is 422", async () => {
    const res = await intakePost(json(`${P}/people/intake`, { csv: `name,class\nZZ V1A Intake One,${CLASS_NAME}\nZZ V1A Intake Two,${CLASS_NAME}` }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.admitted).toBe(2);
    expect(body.outcomes.map((o: { status: string }) => o.status)).toEqual(["admitted", "admitted"]);
    expect(body.outcomes[0].firstSignInCode).toBeTruthy();
    expect(await db.enrollment.count({ where: { classId, status: "ACTIVE" } })).toBe(3);
    expect((await intakePost(json(`${P}/people/intake`, { csv: "" }))).status).toBe(422);
    expect((await intakePost(json(`${P}/people/intake`, { csv: "name\n" }))).status).toBe(422);
  });

  it("classes: listed, created once, led, archived and restored; another school's is a 404", async () => {
    const list = await (await classesGet(get(`${P}/classes`))).json();
    expect(list.activeCount).toBe(1);
    expect(list.classes[0]).toMatchObject({ id: classId, name: CLASS_NAME, pupils: 3, leaderless: false });
    expect(list.classes[0].teachers).toEqual([{ membershipId: teacherMembershipId, name: "ZZ V1A Teacher", role: "LEAD" }]);

    const created = await classesPost(json(`${P}/classes`, { name: `ZZ V1A Class 5 ${STAMP}`, gradeLevel: "5" }));
    expect(created.status).toBe(201);
    const { classId: newId, joinCode } = await created.json();
    expect(joinCode).toBeTruthy();
    const duplicate = await classesPost(json(`${P}/classes`, { name: `ZZ V1A Class 5 ${STAMP}` }));
    expect(duplicate.status).toBe(422);
    expect(await duplicate.json()).toMatchObject({ code: "BAD_REQUEST", issues: { name: expect.any(String) } });
    expect((await classesPost(json(`${P}/classes`, { name: "" }))).status).toBe(422);

    const led = await classTeacherPost(json("", { teacherMembershipId: coverMembershipId, assigned: true }), params({ classId: newId }));
    expect(led.status).toBe(200);
    expect(await db.classTeacher.count({ where: { classId: newId, teacherMembershipId: coverMembershipId } })).toBe(1);
    const unled = await classTeacherPost(json("", { teacherMembershipId: coverMembershipId, assigned: false }), params({ classId: newId }));
    expect(unled.status).toBe(200);
    expect(await db.classTeacher.count({ where: { classId: newId } })).toBe(0);
    expect((await classTeacherPost(json("", { teacherMembershipId: coverMembershipId }), params({ classId: newId }))).status).toBe(422);
    expect((await classTeacherPost(json("", { teacherMembershipId: coverMembershipId, assigned: true }), params({ classId: otherClassId }))).status).toBe(404);

    expect((await classArchivePost(json("", { archived: true }), params({ classId: newId }))).status).toBe(200);
    const archived = await (await classesGet(get(`${P}/classes?archived=1`))).json();
    expect(archived.classes.map((k: { id: string }) => k.id)).toEqual([newId]);
    expect((await classArchivePost(json("", { archived: false }), params({ classId: newId }))).status).toBe(200);
    expect((await (await classesGet(get(`${P}/classes`))).json()).activeCount).toBe(2);
    expect((await classArchivePost(json("", {}), params({ classId: newId }))).status).toBe(422);
    expect((await classArchivePost(json("", { archived: true }), params({ classId: otherClassId }))).status).toBe(404);
  });

  it("promotion: the plan names every running class with its pupils", async () => {
    const res = await promotionGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.academicYear).toBeNull();
    const klass = body.classes.find((k: { id: string }) => k.id === classId);
    expect(klass.pupils).toHaveLength(3);
    expect(klass.suggested.kind).toBeTruthy();
  });

  it("timetable: a period is added, a lesson placed, and the grid shows both", async () => {
    const period = await periodsPost(json(`${P}/timetable/periods`, { name: "ZZ Period 1", startMinute: 540, endMinute: 585, kind: "LESSON" }));
    expect(period.status).toBe(201);
    const { id: periodId } = await period.json();
    expect((await periodsPost(json(`${P}/timetable/periods`, { name: "ZZ Backwards", startMinute: 600, endMinute: 540, kind: "LESSON" }))).status).toBe(422);
    expect((await periodsPost(json(`${P}/timetable/periods`, { name: "ZZ", startMinute: 540 }))).status).toBe(422);

    const slot = await slotsPost(json(`${P}/timetable/slots`, { classId, periodId, weekday: 1, subject: "Mathematics", teacherMembershipId }));
    expect(slot.status).toBe(200);
    expect((await slotsPost(json(`${P}/timetable/slots`, { classId, periodId, weekday: 9, subject: "Mathematics" }))).status).toBe(422);
    const elsewhere = await slotsPost(json(`${P}/timetable/slots`, { classId: otherClassId, periodId, weekday: 1, subject: "Mathematics" }));
    expect(elsewhere.status).toBe(422);

    const res = await timetableGet(get(`${P}/timetable?classId=${classId}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.selectedClassId).toBe(classId);
    expect(body.periods.map((p: { id: string }) => p.id)).toContain(periodId);
    expect(body.grid.slots).toHaveLength(1);
    expect(body.grid.slots[0]).toMatchObject({ classId, periodId, weekday: 1, subject: "Mathematics", teacherMembershipId, teacherName: "ZZ V1A Teacher" });
    const staffIds = body.staff.map((s: { membershipId: string }) => s.membershipId);
    expect(staffIds).toHaveLength(3); // two teachers and the head
    expect(staffIds).toEqual(expect.arrayContaining([coverMembershipId, teacherMembershipId]));
  });

  it("exams: a series is scheduled, given a paper, published (twice, harmlessly); another school's is a 404", async () => {
    const created = await examsPost(json(`${P}/exams`, { name: `ZZ V1A Unit Test`, gradeLevel: "4", kind: "UNIT_TEST" }));
    expect(created.status).toBe(201);
    const { seriesId } = await created.json();
    expect((await examsPost(json(`${P}/exams`, { name: `ZZ V1A Unit Test`, gradeLevel: "4" }))).status).toBe(403);
    expect((await examsPost(json(`${P}/exams`, { name: "Z", gradeLevel: "4" }))).status).toBe(422);

    const unpublished = await examPublishPost(get(""), params({ seriesId }));
    expect(unpublished.status).toBe(403); // no papers yet
    const paper = await examSlotsPost(json("", { subject: "Mathematics", dateKey: "2030-03-02", maxMarks: 50 }), params({ seriesId }));
    expect(paper.status).toBe(201);
    expect((await examSlotsPost(json("", { subject: "Mathematics", dateKey: "bad", maxMarks: 50 }), params({ seriesId }))).status).toBe(422);
    expect((await examSlotsPost(json("", { subject: "Science", dateKey: "2030-03-03", maxMarks: 50 }), params({ seriesId: otherSeriesId }))).status).toBe(404);

    expect((await examPublishPost(get(""), params({ seriesId }))).status).toBe(200);
    expect((await examPublishPost(get(""), params({ seriesId }))).status).toBe(200);
    expect((await examPublishPost(get(""), params({ seriesId: otherSeriesId }))).status).toBe(404);

    const list = await (await examsGet(get(`${P}/exams?state=published`))).json();
    expect(list.total).toBe(1);
    expect(list.series[0]).toMatchObject({ id: seriesId, gradeLevel: "4", kind: "UNIT_TEST" });
    expect(list.series[0].publishedAt).toBeTruthy();
    expect(list.series[0].slots[0]).toMatchObject({ subject: "Mathematics", dateKey: "2030-03-02", maxMarks: 50 });
    expect(list.grades).toEqual(["4", "5"]);
    expect((await (await examsGet(get(`${P}/exams?state=draft`))).json()).series).toEqual([]);
    expect((await examsGet(get(`${P}/exams?kind=BOGUS`))).status).toBe(422);
  });

  it("attendance: the trend and the flags; the history of one class, and not another school's", async () => {
    const res = await attendanceGet(get(`${P}/attendance?window=60&sort=name`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.windowDays).toBe(60);
    expect(body.trend.length).toBeGreaterThan(0);
    expect(body.classes.map((c: { id: string }) => c.id)).toContain(classId);
    expect((await attendanceGet(get(`${P}/attendance?window=45`))).status).toBe(422);

    // This month, by the school's clock: the roll of a month is who was
    // enrolled by its end, and these pupils were enrolled a moment ago.
    const month = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit" }).format(new Date());
    const history = await historyGet(get(`${P}/attendance/history?classId=${classId}&month=${month}`));
    expect(history.status).toBe(200);
    const h = await history.json();
    expect(h.history.class.id).toBe(classId);
    expect(h.history.month).toBe(month);
    expect(h.history.pupils.length).toBeGreaterThanOrEqual(1);
    const picker = await (await historyGet(get(`${P}/attendance/history`))).json();
    expect(picker.classes).toHaveLength(2);
    expect(picker.history).toBeNull();
    expect((await historyGet(get(`${P}/attendance/history?classId=${otherClassId}`))).status).toBe(404);
    expect((await historyGet(get(`${P}/attendance/history?month=2026-13`))).status).toBe(422);
  });

  it("calendar: a closure is added and listed with leave and birthdays", async () => {
    const added = await closuresPost(json(`${P}/calendar/closures`, { name: "ZZ Founders' Day", startDateKey: "2030-01-06", endDateKey: "2030-01-06", kind: "EVENT" }));
    expect(added.status).toBe(201);
    const { id } = await added.json();
    // QA-54/55: refused input is 422 naming the field, not 403 FORBIDDEN: an end before the start, a day that does not exist.
    const backwards = await closuresPost(json(`${P}/calendar/closures`, { name: "ZZ Backwards", startDateKey: "2030-01-06", endDateKey: "2030-01-05", kind: "EVENT" }));
    expect(backwards.status).toBe(422);
    expect(((await backwards.json()) as { issues?: Record<string, string> }).issues?.endDateKey).toBeTruthy();
    const unreal = await closuresPost(json(`${P}/calendar/closures`, { name: "ZZ Unreal", startDateKey: "2027-02-30", endDateKey: "2027-02-30", kind: "EVENT" }));
    expect(unreal.status).toBe(422);
    expect(((await unreal.json()) as { issues?: Record<string, string> }).issues?.startDateKey).toBeTruthy();
    // A rule only the library knows (a span longer than it allows) is a 422 in words too, through underRules.
    expect((await closuresPost(json(`${P}/calendar/closures`, { name: "ZZ Too long", startDateKey: "2030-01-06", endDateKey: "2031-06-06", kind: "HOLIDAY" }))).status).toBe(422);
    expect((await closuresPost(json(`${P}/calendar/closures`, { name: "ZZ", startDateKey: "2030-01-06", endDateKey: "2030-01-06", kind: "PARTY" }))).status).toBe(422);

    const res = await calendarGet(get(`${P}/calendar`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.years).toEqual([]);
    expect(body.entries).toEqual([{ id, name: "ZZ Founders' Day", startDateKey: "2030-01-06", endDateKey: "2030-01-06", kind: "EVENT", note: null, academicYearId: null, competitionId: null }]);
    expect(body.leave).toEqual([]);
    expect(Array.isArray(body.birthdays)).toBe(true);
    expect((await calendarGet(get(`${P}/calendar?when=soon`))).status).toBe(422);
  });

  it("reviews: the dashboard, then a round opened; one closing in the past is refused", async () => {
    // The review rounds are the head's pages (TA-210): this school has a head, so the head has given this admin the duty.
    await db.membership.update({ where: { id: adminMembershipId }, data: { dutiesJson: JSON.stringify(["HEAD_PAGES"]) } });
    try {
      const before = await (await reviewsGet(get(`${P}/reviews`))).json();
      expect(before.rounds).toEqual([]);
      expect(before.teacherOptions.map((t: { membershipId: string }) => t.membershipId)).toContain(teacherMembershipId);
      expect(before.defaultCloseDateKey).toBe(addDaysToKey(todayKey(TZ), 14));

      const closes = addDaysToKey(todayKey(TZ), 14);
      const opened = await reviewsPost(json(`${P}/reviews`, { teacherMembershipIds: [teacherMembershipId], audience: "BOTH", closesDateKey: closes }));
      expect(opened.status).toBe(201);
      expect((await opened.json()).roundId).toBeTruthy();
      expect((await reviewsPost(json(`${P}/reviews`, { teacherMembershipIds: [teacherMembershipId], audience: "BOTH", closesDateKey: "2020-01-01" }))).status).toBe(422);
      expect((await reviewsPost(json(`${P}/reviews`, { teacherMembershipIds: [], audience: "BOTH", closesDateKey: closes }))).status).toBe(422);

      const after = await (await reviewsGet(get(`${P}/reviews?status=all`))).json();
      expect(after.counts).toEqual({ open: 1, closed: 0 });
      expect(after.rounds[0]).toMatchObject({ audience: "BOTH", closesDateKey: closes, status: "OPEN", teacherCount: 1, responseCount: 0 });
    } finally {
      await db.membership.update({ where: { id: adminMembershipId }, data: { dutiesJson: "[]" } });
    }
  });

  it("safety: visits, reports and the audit trail the actions above wrote", async () => {
    const open = await (await safetyGet(get(`${P}/safety`))).json();
    expect(open).toMatchObject({ openCount: 0, visits: [], reports: [] });
    const audit = await (await safetyGet(get(`${P}/safety?tab=audit`))).json();
    expect(audit.audit.map((a: { action: string }) => a.action)).toContain("class.create");
    expect((await safetyGet(get(`${P}/safety?tab=x`))).status).toBe(422);
  });

  it("settings: read, saved, read back; a bad email is 422 naming the field", async () => {
    const before = await (await settingsGet()).json();
    expect(before.school).toMatchObject({ name: `ZZ V1A School ${STAMP}`, timezone: TZ });
    expect(before.directory.published).toBe(false);
    expect(before.notifDefaults).toEqual({ autoReadDays: 90, expireDays: 365 });

    const saved = await settingsPost(json(`${P}/settings`, { name: `ZZ V1A School ${STAMP} renamed`, contactEmail: `zz-v1a-${STAMP}@test.invalid`, timezone: TZ, city: "Pune", gradeLow: "1", gradeHigh: "8" }));
    expect(saved.status).toBe(200);
    const after = await (await settingsGet()).json();
    expect(after.school).toMatchObject({ name: `ZZ V1A School ${STAMP} renamed`, city: "Pune", gradeLow: "1", gradeHigh: "8" });

    const bad = await settingsPost(json(`${P}/settings`, { name: "ZZ", contactEmail: "nope" }));
    expect(bad.status).toBe(422);
    expect(await bad.json()).toMatchObject({ code: "BAD_REQUEST", issues: { contactEmail: expect.any(String) } });
  });

  it("vacancies: posted, listed, closed once; another school's is a 404", async () => {
    const posted = await vacanciesPost(json(`${P}/vacancies`, { title: "ZZ Maths teacher", body: "Grades 4 to 6.", subjects: ["Mathematics"], employmentType: "FULL_TIME", hiringContactMembershipId: adminMembershipId }));
    expect(posted.status).toBe(201);
    const { postingId } = await posted.json();
    expect((await vacanciesPost(json(`${P}/vacancies`, { title: "ZZ", body: "ZZ", employmentType: "GIG", hiringContactMembershipId: adminMembershipId }))).status).toBe(422);

    const open = await (await vacanciesGet(get(`${P}/vacancies`))).json();
    expect(open.counts).toEqual({ open: 1, closed: 0 });
    expect(open.postings[0]).toMatchObject({ id: postingId, title: "ZZ Maths teacher", status: "OPEN", enquiryCount: 0, contactName: "ZZ V1A Admin" });

    expect((await vacancyClosePost(get(""), params({ postingId }))).status).toBe(200);
    expect((await vacancyClosePost(get(""), params({ postingId }))).status).toBe(422);
    expect((await vacancyClosePost(get(""), params({ postingId: otherPostingId }))).status).toBe(404);
    const closed = await (await vacanciesGet(get(`${P}/vacancies?status=closed`))).json();
    expect(closed.postings.map((p: { id: string }) => p.id)).toEqual([postingId]);
  });

  it("leave: the queue with balance, duty count and cover suggestions; then a decision, once", async () => {
    const queue = await (await leaveGet()).json();
    expect(queue.pending).toHaveLength(1);
    expect(queue.pending[0]).toMatchObject({ id: leaveId, applicantMembershipId: teacherMembershipId, applicantName: "ZZ V1A Teacher", status: "PENDING", dutyClasses: 1 });
    expect(queue.pending[0].balance).toMatchObject({ entitlement: null });
    expect(queue.pending[0].suggestions.candidates.map((c: { membershipId: string }) => c.membershipId)).toContain(coverMembershipId);
    expect(queue.staff.map((s: { membershipId: string }) => s.membershipId)).toEqual(expect.arrayContaining([coverMembershipId, teacherMembershipId]));

    expect((await leaveDecidePost(json("", { decision: "MAYBE" }), params({ leaveId }))).status).toBe(422);
    expect((await leaveDecidePost(json("", { decision: "DECLINED" }), params({ leaveId: otherLeaveId }))).status).toBe(404);
    const decided = await leaveDecidePost(json("", { decision: "DECLINED", note: "Exam week." }), params({ leaveId }));
    expect(decided.status).toBe(200);
    expect(await decided.json()).toEqual({ ok: true, coversCreated: 0 });
    expect((await leaveDecidePost(json("", { decision: "DECLINED" }), params({ leaveId }))).status).toBe(422);
    const after = await (await leaveGet()).json();
    expect(after.pending).toEqual([]);
    // The decided list says who, when and by whom — never the reason or the
    // note, which the page keeps to the pending cards where the decision is made.
    expect(after.decided[0]).toMatchObject({ id: leaveId, status: "DECLINED", decidedByName: "ZZ V1A Admin" });
    expect(after.decided[0]).not.toHaveProperty("decisionNote");
    expect(after.decided[0]).not.toHaveProperty("reason");
  });

  it("staff: the roster with records and lead classes, narrowed by role and subject", async () => {
    const all = await (await staffGet(get(`${P}/staff`))).json();
    expect(all.total).toBe(4);
    const teacher = all.staff.find((s: { membershipId: string }) => s.membershipId === teacherMembershipId);
    expect(teacher).toMatchObject({ role: "TEACHER", subjects: ["Mathematics"], leadClasses: [CLASS_NAME], staffRecord: null });
    expect(teacher.balance).toMatchObject({ entitlement: null });
    expect(all.subjectOptions).toEqual([{ subject: "Mathematics", count: 1 }]);
    const teachers = await (await staffGet(get(`${P}/staff?role=TEACHER`))).json();
    expect(teachers.staff).toHaveLength(2);
    const maths = await (await staffGet(get(`${P}/staff?subject=Mathematics`))).json();
    expect(maths.staff.map((s: { membershipId: string }) => s.membershipId)).toEqual([teacherMembershipId]);
    expect((await staffGet(get(`${P}/staff?role=PARENT`))).status).toBe(422);
  });
});

/* -------------------------------------------------------------------------- */
/* The head, where the nav lets them in                                        */
/* -------------------------------------------------------------------------- */

describe("as the principal", () => {
  beforeAll(() => signInAs("PRINCIPAL"));

  it("reads the leave queue, the roster, the calendar, the reviews, the vacancies and the history", async () => {
    for (const h of everyHandler().filter((h) => h.principal && h.name.startsWith("GET"))) {
      const res = await h.call();
      expect(res.status, h.name).toBe(200);
    }
  });
});
