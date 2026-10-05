/**
 * The office's year, a class's roll and a teacher's own leave, from the phone
 * (A3-inventory-7, audit of 5 October 2026). The web had these as server
 * actions only — make a year, close it, make or remove a term, edit or remove
 * a closure, promote the school, put pupils on a class's roll or take one off,
 * withdraw one's own leave — so the phone could not do them. Each door calls
 * the library the action calls; this suite holds, door by door: the role is
 * checked before the body (a wrong role with a broken body is 403, not 422),
 * signed out is 401, the happy path at a ZZ school writes the audit row the
 * web's does, a rule's refusal is a 422 in words, and another school's id a 404.
 * Everything is made in two ZZ schools of this run and deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { todayKey, addDaysToKey } from "@/lib/dates";
import { ENDPOINTS } from "@/lib/api-catalog";
import { LEAVE_APPLICANT_ROLES } from "@/lib/leave";
import { POST as yearsPost } from "@/app/api/v1/admin/calendar/years/route";
import { POST as yearClosePost } from "@/app/api/v1/admin/calendar/years/[yearId]/close/route";
import { POST as termsPost } from "@/app/api/v1/admin/calendar/years/[yearId]/terms/route";
import { DELETE as termDelete } from "@/app/api/v1/admin/calendar/terms/[termId]/route";
import { POST as closureEditPost, DELETE as closureDelete } from "@/app/api/v1/admin/calendar/closures/[holidayId]/route";
import { POST as promotePost } from "@/app/api/v1/admin/classes/promotion/route";
import { POST as pupilsPost } from "@/app/api/v1/admin/classes/[classId]/pupils/route";
import { POST as pupilsRemovePost } from "@/app/api/v1/admin/classes/[classId]/pupils/remove/route";
import { POST as leaveWithdrawPost } from "@/app/api/v1/staff/leave/[leaveId]/withdraw/route";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
type Who = "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "STUDENT";

let schoolId = "";
let otherSchoolId = "";
const users: Record<Who, string> = { ADMIN: "", PRINCIPAL: "", TEACHER: "", OTHER_TEACHER: "", STUDENT: "" };
let teacherMembershipId = "";
let pupilIds: string[] = [];
let classId = "";
let promoteClassId = "";
let otherClassId = "";
let otherYearId = "";
let otherHolidayId = "";
let otherTermId = "";

const json = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/v1/x", { method, headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const bare = (method = "POST") => new Request("http://localhost/api/v1/x", { method });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

async function signInAs(who: Who | null) {
  __resetCookies();
  if (!who) return;
  const role = who === "OTHER_TEACHER" ? "TEACHER" : who;
  await createSession(users[who], { schoolId, role });
}
async function audits(action: string, targetId?: string) {
  return db.auditLog.count({ where: { schoolId, action, ...(targetId ? { targetId } : {}) } });
}

beforeAll(async () => {
  const mk = (tag: string) =>
    db.school.create({ data: { name: `ZZ OY ${tag} ${STAMP}`, slug: `zz-oy-${tag.toLowerCase()}-${STAMP}`, code: `Z${tag.slice(0, 1)}${String(STAMP).slice(-6)}`, contactEmail: `zz-oy-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = (await mk("Home")).id;
  otherSchoolId = (await mk("Away")).id;
  for (const who of Object.keys(users) as Who[]) {
    users[who] = (await db.user.create({ data: { name: `ZZ OY ${who}`, email: `zz-oy-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
  }
  await db.membership.create({ data: { userId: users.ADMIN, schoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.PRINCIPAL, schoolId, role: "PRINCIPAL", status: "ACTIVE" } });
  teacherMembershipId = (await db.membership.create({ data: { userId: users.TEACHER, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: users.OTHER_TEACHER, schoolId, role: "TEACHER", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: users.STUDENT, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZOYS${STAMP}` } });
  // Three more pupils for the roll and the promotion: user rows of this run, memberships here only.
  pupilIds = [];
  for (let i = 1; i <= 3; i++) {
    const u = await db.user.create({ data: { name: `ZZ OY Pupil ${i}`, email: `zz-oy-pupil${i}-${STAMP}@test.invalid` }, select: { id: true } });
    pupilIds.push((await db.membership.create({ data: { userId: u.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZOY${i}${STAMP}` }, select: { id: true } })).id);
  }
  classId = (await db.class.create({ data: { schoolId, name: `ZZ OY Class 4 ${STAMP}`, gradeLevel: "4", joinCode: `ZOA${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  promoteClassId = (await db.class.create({ data: { schoolId, name: `ZZ OY Class 9 ${STAMP}`, gradeLevel: "9", joinCode: `ZOB${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: pupilIds[0]!, status: "ACTIVE" } });
  await db.enrollment.create({ data: { classId: promoteClassId, schoolId, studentMembershipId: pupilIds[2]!, status: "ACTIVE" } });

  otherClassId = (await db.class.create({ data: { schoolId: otherSchoolId, name: "ZZ OY Elsewhere", gradeLevel: "4", joinCode: `ZOC${String(STAMP).slice(-6)}` }, select: { id: true } })).id;
  const otherYear = await db.academicYear.create({ data: { schoolId: otherSchoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-03-31T00:00:00Z"), isCurrent: true }, select: { id: true } });
  otherYearId = otherYear.id;
  otherTermId = (await db.term.create({ data: { schoolId: otherSchoolId, academicYearId: otherYearId, name: "ZZ Term", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2026-09-30T00:00:00Z"), position: 1 }, select: { id: true } })).id;
  otherHolidayId = (await db.holiday.create({ data: { schoolId: otherSchoolId, name: "ZZ OY Away closure", startDateKey: "2026-12-25", endDateKey: "2026-12-25", kind: "HOLIDAY" }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const userIds = (await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } })).map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

/** Every new door, called with a body that does not parse (or none): the gate's answer must come first. */
function everyDoor() {
  const y = otherYearId; // any id: a refused role never reaches it
  return [
    { name: "POST years", call: () => yearsPost(json({})), roles: ["ADMIN", "PRINCIPAL"] },
    { name: "POST year close", call: () => yearClosePost(json({}), params({ yearId: y })), roles: ["ADMIN", "PRINCIPAL"] },
    { name: "POST year terms", call: () => termsPost(json({}), params({ yearId: y })), roles: ["ADMIN", "PRINCIPAL"] },
    { name: "DELETE term", call: () => termDelete(bare("DELETE"), params({ termId: otherTermId })), roles: ["ADMIN"] },
    { name: "POST closure edit", call: () => closureEditPost(json({}), params({ holidayId: otherHolidayId })), roles: ["ADMIN"] },
    { name: "DELETE closure", call: () => closureDelete(bare("DELETE"), params({ holidayId: otherHolidayId })), roles: ["ADMIN"] },
    { name: "POST promotion", call: () => promotePost(json({})), roles: ["ADMIN"] },
    { name: "POST pupils", call: () => pupilsPost(json({}), params({ classId })), roles: ["ADMIN"] },
    { name: "POST pupils remove", call: () => pupilsRemovePost(json({}), params({ classId })), roles: ["ADMIN"] },
    { name: "POST leave withdraw", call: () => leaveWithdrawPost(bare(), params({ leaveId: "zz-oy-no-such-leave" })), roles: ["TEACHER", "OTHER_TEACHER", "PRINCIPAL", "ADMIN"] },
  ];
}

describe("the gates", () => {
  it("every door is in the catalog with the roles its handler takes", () => {
    const want: [string, string, readonly string[]][] = [
      ["POST", "/api/v1/admin/calendar/years", ["ADMIN", "PRINCIPAL"]],
      ["POST", "/api/v1/admin/calendar/years/{yearId}/close", ["ADMIN", "PRINCIPAL"]],
      ["POST", "/api/v1/admin/calendar/years/{yearId}/terms", ["ADMIN", "PRINCIPAL"]],
      ["DELETE", "/api/v1/admin/calendar/terms/{termId}", ["ADMIN"]],
      ["POST", "/api/v1/admin/calendar/closures/{holidayId}", ["ADMIN"]],
      ["DELETE", "/api/v1/admin/calendar/closures/{holidayId}", ["ADMIN"]],
      ["POST", "/api/v1/admin/classes/promotion", ["ADMIN"]],
      ["POST", "/api/v1/admin/classes/{classId}/pupils", ["ADMIN"]],
      ["POST", "/api/v1/admin/classes/{classId}/pupils/remove", ["ADMIN"]],
      ["POST", "/api/v1/staff/leave/{leaveId}/withdraw", [...LEAVE_APPLICANT_ROLES, "ADMIN"]],
    ];
    for (const [method, path, roles] of want) {
      const door = ENDPOINTS.find((e) => e.method === method && e.path === path);
      expect(door, `${method} ${path}`).toBeDefined();
      expect([...(door!.access as string[])].sort(), `${method} ${path}`).toEqual([...roles].sort());
      // Each has a path the sweep can call: none of them is skipped for want of a sample.
      if (path.includes("{")) expect(door!.sample, `${method} ${path} sample`).toBeDefined();
    }
  });

  it("signed out is 401 everywhere", async () => {
    await signInAs(null);
    for (const d of everyDoor()) expect((await d.call()).status, d.name).toBe(401);
  });

  it("a pupil is refused everywhere, and the role is checked before the body (403, not 422)", async () => {
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

describe("the year and its terms", () => {
  let yearId = "";
  let nextYearId = "";
  let termId = "";

  it("the head makes a year; a name that is not its years and a year that ends first are 422 in words", async () => {
    await signInAs("PRINCIPAL");
    const bad = await yearsPost(json({ name: "Next year", startDateKey: "2026-06-01", endDateKey: "2027-03-31" }));
    expect(bad.status).toBe(422);
    expect((await bad.json()).error).toMatch(/2026–27/);
    const backwards = await yearsPost(json({ name: "2026-27", startDateKey: "2026-06-01", endDateKey: "2026-05-01" }));
    expect(backwards.status).toBe(422);
    const res = await yearsPost(json({ name: "2026-27", startDateKey: "2026-06-01", endDateKey: "2027-03-31" }));
    expect(res.status).toBe(201);
    yearId = (await res.json()).id;
    const year = await db.academicYear.findUniqueOrThrow({ where: { id: yearId } });
    expect(year).toMatchObject({ schoolId, name: "2026–27", isCurrent: true });
    expect(await audits("year.create", yearId)).toBe(1);
    // The same year again is a rule, not a crash.
    expect((await yearsPost(json({ name: "2026–27", startDateKey: "2026-06-01", endDateKey: "2027-03-31" }))).status).toBe(422);
  });

  it("the office makes a term inside it; one overlapping it is 422; another school's year is refused", async () => {
    await signInAs("ADMIN");
    const res = await termsPost(json({ name: "Term 1", startDateKey: "2026-06-01", endDateKey: "2026-09-30" }), params({ yearId }));
    expect(res.status).toBe(200);
    termId = (await res.json()).termId;
    expect(await db.term.findUniqueOrThrow({ where: { id: termId } })).toMatchObject({ schoolId, academicYearId: yearId, name: "Term 1" });
    expect(await audits("term.create", termId)).toBe(1);
    expect((await termsPost(json({ name: "Term 1b", startDateKey: "2026-09-01", endDateKey: "2026-10-30" }), params({ yearId }))).status).toBe(422);
    expect((await termsPost(json({ name: "Term X", startDateKey: "2026-06-01", endDateKey: "2026-09-30" }), params({ yearId: otherYearId }))).status).toBe(404);
  });

  it("the office removes the term; the head may not; a term of another school is a 404", async () => {
    await signInAs("PRINCIPAL");
    expect((await termDelete(bare("DELETE"), params({ termId }))).status).toBe(403);
    await signInAs("ADMIN");
    expect((await termDelete(bare("DELETE"), params({ termId: otherTermId }))).status).toBe(404);
    expect(await db.term.count({ where: { id: otherTermId } })).toBe(1);
    expect((await termDelete(bare("DELETE"), params({ termId }))).status).toBe(200);
    expect(await db.term.count({ where: { id: termId } })).toBe(0);
    expect(await audits("term.delete", termId)).toBe(1);
  });

  it("the head closes the running year into the next; a second press is a no-op; a year elsewhere is a 404", async () => {
    await signInAs("PRINCIPAL");
    const made = await yearsPost(json({ name: "2027-28", startDateKey: "2027-06-01", endDateKey: "2028-03-31" }));
    nextYearId = (await made.json()).id;
    expect((await yearClosePost(json({ nextYearId: otherYearId }), params({ yearId }))).status).toBe(404);
    expect((await yearClosePost(json({ nextYearId: yearId }), params({ yearId }))).status).toBe(422);
    const res = await yearClosePost(json({ nextYearId }), params({ yearId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ studentsArchived: expect.any(Number), badgesArchived: 0, seriesArchived: 0, roundsClosed: 0 });
    expect(await db.academicYear.findUniqueOrThrow({ where: { id: yearId }, select: { isCurrent: true, closedAt: true } })).toMatchObject({ isCurrent: false, closedAt: expect.any(Date) });
    expect(await db.academicYear.findUniqueOrThrow({ where: { id: nextYearId }, select: { isCurrent: true } })).toEqual({ isCurrent: true });
    expect(await audits("year.close", yearId)).toBe(1);
    const again = await yearClosePost(json({ nextYearId }), params({ yearId }));
    expect(again.status).toBe(200);
    expect(await again.json()).toEqual({ studentsArchived: 0, badgesArchived: 0, seriesArchived: 0, roundsClosed: 0 });
  });
});

describe("a closure on the calendar", () => {
  it("the office corrects it and removes it, each audited; another school's is a 404 and stays", async () => {
    await signInAs("ADMIN");
    const holiday = await db.holiday.create({ data: { schoolId, name: "ZZ OY Diwali", startDateKey: "2026-11-08", endDateKey: "2026-11-09", kind: "HOLIDAY" }, select: { id: true } });
    const body = { name: "ZZ OY Diwali break", startDateKey: "2026-11-08", endDateKey: "2026-11-12", kind: "HOLIDAY" };
    expect((await closureEditPost(json({ ...body, endDateKey: "2026-11-01" }), params({ holidayId: holiday.id }))).status).toBe(422);
    const res = await closureEditPost(json(body), params({ holidayId: holiday.id }));
    expect(res.status).toBe(200);
    expect(await db.holiday.findUniqueOrThrow({ where: { id: holiday.id }, select: { name: true, endDateKey: true } })).toEqual({ name: "ZZ OY Diwali break", endDateKey: "2026-11-12" });
    expect(await audits("holiday.update", holiday.id)).toBe(1);
    expect((await closureEditPost(json(body), params({ holidayId: otherHolidayId }))).status).toBe(404);
    expect((await closureDelete(bare("DELETE"), params({ holidayId: otherHolidayId }))).status).toBe(404);
    expect(await db.holiday.count({ where: { id: otherHolidayId } })).toBe(1);
    expect((await closureDelete(bare("DELETE"), params({ holidayId: holiday.id }))).status).toBe(200);
    expect(await db.holiday.count({ where: { id: holiday.id } })).toBe(0);
    expect(await audits("holiday.delete", holiday.id)).toBe(1);
  });
});

describe("a class's roll and the promotion", () => {
  it("the office puts pupils on the roll (one already there is a no-op) and takes one off; each audited", async () => {
    await signInAs("ADMIN");
    const res = await pupilsPost(json({ studentMembershipIds: [pupilIds[0], pupilIds[1]] }), params({ classId }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ added: 2 });
    expect(await db.enrollment.count({ where: { classId, status: "ACTIVE" } })).toBe(2);
    expect(await audits("class.cohort.add", classId)).toBe(1);
    // A pupil of another school, or a teacher, is not a pupil here: 422, nothing added.
    expect((await pupilsPost(json({ studentMembershipIds: [teacherMembershipId] }), params({ classId }))).status).toBe(422);
    expect((await pupilsPost(json({ studentMembershipIds: [pupilIds[1]] }), params({ classId: otherClassId }))).status).toBe(404);

    const off = await pupilsRemovePost(json({ studentMembershipId: pupilIds[1] }), params({ classId }));
    expect(off.status).toBe(200);
    expect(await db.enrollment.findFirstOrThrow({ where: { classId, studentMembershipId: pupilIds[1] }, select: { status: true } })).toEqual({ status: "REMOVED" });
    expect(await audits("class.cohort.remove", classId)).toBe(1);
    // Not on the roll any more: a rule, said in words.
    expect((await pupilsRemovePost(json({ studentMembershipId: pupilIds[1] }), params({ classId }))).status).toBe(422);
  });

  it("the office promotes a class into a new one, audited; an empty plan and a class elsewhere are refused", async () => {
    await signInAs("ADMIN");
    expect((await promotePost(json({ moves: [] }))).status).toBe(422);
    expect((await promotePost(json({ moves: [{ fromClassId: otherClassId, to: { kind: "NEW", name: "ZZ OY 5", gradeLevel: "5" }, holdBack: [] }] }))).status).toBe(404);
    const res = await promotePost(json({ moves: [{ fromClassId: promoteClassId, to: { kind: "NEW", name: `ZZ OY Class 10 ${STAMP}`, gradeLevel: "10" }, holdBack: [] }] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, moved: 1, created: 1, heldBack: 0, left: 0 });
    const into = await db.enrollment.findFirstOrThrow({ where: { studentMembershipId: pupilIds[2], status: "ACTIVE" }, select: { class: { select: { name: true, gradeLevel: true } } } });
    expect(into.class).toEqual({ name: `ZZ OY Class 10 ${STAMP}`, gradeLevel: "10" });
    expect(await audits("school.promote", schoolId)).toBe(1);
  });
});

describe("a teacher's own leave", () => {
  it("is withdrawn by the one who asked, audited; a colleague is refused; a second withdraw is 422; an unknown id 404", async () => {
    const from = addDaysToKey(todayKey(TZ), 10);
    const leave = await db.leaveRequest.create({ data: { schoolId, teacherMembershipId, fromDateKey: from, toDateKey: from, kind: "CASUAL", reason: "ZZ OY errand" }, select: { id: true } });
    await signInAs("OTHER_TEACHER");
    expect((await leaveWithdrawPost(bare(), params({ leaveId: leave.id }))).status).toBe(403);
    await signInAs("TEACHER");
    expect((await leaveWithdrawPost(bare(), params({ leaveId: "zz-oy-no-such-leave" }))).status).toBe(404);
    const res = await leaveWithdrawPost(bare(), params({ leaveId: leave.id }));
    expect(res.status).toBe(200);
    expect(await db.leaveRequest.findUniqueOrThrow({ where: { id: leave.id }, select: { status: true } })).toEqual({ status: "CANCELLED" });
    expect(await audits("leave.cancel", leave.id)).toBe(1);
    expect((await leaveWithdrawPost(bare(), params({ leaveId: leave.id }))).status).toBe(422);
  });
});
