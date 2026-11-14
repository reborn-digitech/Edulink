/**
 * TA-060, the decision of 14 November 2026 (the coordinating session's recommendation, taken on the owner's
 * instruction "lets do all the recommendations for all decisions in one go" without reading the option list):
 * a college student REGISTERED on a course offering sees all of the offering's published work, whenever it was
 * set. The date rule that hid work published before the student registered (ownWorkScope, grading.ts) goes for
 * offerings, so the student's list, the phone's home "due" box, the agenda and the guardian's list match the
 * teacher's marking sheet (workAudience), including work set before a late registration or before a drop and
 * re-add. Earlier work is owed until handed in or marked; no new notice goes to a late joiner; a school class keeps
 * its rule (a pupil does not inherit work set to the class before they joined it).
 *
 * At a ZZ college and a ZZ school of this suite's own, through the /api/v1 doors with primed sessions.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { POST as offeringWorkPost } from "@/app/api/v1/academics/offerings/[offeringId]/work/route";
import { GET as workGet } from "@/app/api/v1/academics/work/[assignmentId]/route";
import { POST as gradesPost } from "@/app/api/v1/academics/work/[assignmentId]/grades/route";
import { POST as registrationPost } from "@/app/api/v1/academics/registration/route";
import { GET as studentWorkGet } from "@/app/api/v1/family/student/assignments/route";
import { GET as overviewGet } from "@/app/api/v1/family/student/overview/route";
import { GET as agendaGet } from "@/app/api/v1/family/agenda/route";
import { GET as parentWorkGet } from "@/app/api/v1/family/assignments/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");

const u: Record<string, string> = {};
const m: Record<string, string> = {};
const id: Record<string, string> = {};

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <K extends string>(k: K, v: string) => ({ params: Promise.resolve({ [k]: v } as Record<K, string>) });
async function body<T = Record<string, unknown>>(res: Response): Promise<T> {
  return (await res.json()) as T;
}
async function as(who: string, role: string, schoolId: string | null = id.college!) {
  __resetCookies();
  __setHeaders({});
  await createSession(u[who]!, { schoolId, role: role as never });
}
type Work = { id: string; title: string };
type Lists = { todo: Work[]; handedIn: Work[]; marked: Work[] };
const titles = (l: Work[]) => l.map((w) => w.title);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString();

beforeAll(async () => {
  const mkSchool = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Late Joiner ${tag} ${STAMP}`, slug: `zz-late-${tag.toLowerCase()}-${STAMP}`, code: `ZL${tag[0]}${SUFFIX}`, contactEmail: `zz-late-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  id.college = (await mkSchool("College", "COLLEGE")).id;
  id.school = (await mkSchool("School", "SCHOOL")).id;
  const c = id.college;
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "ACADEMICS" }] });
  const people: [string, string, string | null][] = [["fac", "FACULTY", c], ["hod", "HOD", c], ["early", "STUDENT", c], ["late", "STUDENT", c], ["parent", "PARENT", null], ["teacher", "TEACHER", id.school], ["pupil", "STUDENT", id.school]];
  for (const [who, role, schoolId] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ Late ${who}`, email: `zz-late-${who}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    if (!schoolId) continue;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZLS${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  // The late joiner is a seventeen-year-old first-year, so their guardian reads their work with no grant to ask for.
  await db.user.update({ where: { id: u.late! }, data: { isMinor: true } });
  await db.guardianship.create({ data: { parentUserId: u.parent!, studentMembershipId: m.late!, studentSchoolId: c, status: "ACTIVE" } });

  id.dept = (await db.department.create({ data: { schoolId: c, code: "PHY", name: "ZZ Physics", hodMembershipId: m.hod }, select: { id: true } })).id;
  await db.departmentFaculty.create({ data: { schoolId: c, membershipId: m.fac!, departmentId: id.dept } });
  id.prog = (await db.programme.create({ data: { schoolId: c, departmentId: id.dept, code: "BSC", name: "ZZ BSc", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  id.scheme = (await db.scheme.create({ data: { schoolId: c, programmeId: id.prog, name: "ZZ BSc 2024", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 1, maxTermCredits: 30 }) }, select: { id: true } })).id;
  const course = async (code: string, kind: string) => (await db.course.create({ data: { schoolId: c, schemeId: id.scheme!, code, name: `ZZ ${code}`, semester: 1, creditsL: 4, kind }, select: { id: true } })).id;
  id.core = await course("LJ101", "CORE");
  id.elective = await course("LJ201", "ELECTIVE");
  // Teaching began a fortnight ago; the registration window is still open, so a student may register late.
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: "ZZ Late term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -14), endsOn: addDaysToKey(TODAY, 100), registrationOpensOn: addDaysToKey(TODAY, -20), registrationClosesOn: addDaysToKey(TODAY, 5) }, select: { id: true } })).id;
  id.oCore = (await db.courseOffering.create({ data: { schoolId: c, termId: id.term, courseId: id.core, facultyMembershipId: m.fac }, select: { id: true } })).id;
  id.oElective = (await db.courseOffering.create({ data: { schoolId: c, termId: id.term, courseId: id.elective, facultyMembershipId: m.fac }, select: { id: true } })).id;
  for (const st of ["early", "late"]) {
    await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: m[st]!, programmeId: id.prog, schemeId: id.scheme, entryYear: 2026 } });
  }
  // The early student registered on both a week ago.
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  for (const [off, kind] of [[id.oCore, "CORE"], [id.oElective, "ELECTIVE"]] as const) {
    await db.courseRegistration.create({ data: { schoolId: c, studentMembershipId: m.early!, offeringId: off, termId: id.term, kind, registeredAt: weekAgo } });
  }

  // A school class, for the rule that stays: work set to a class before a pupil joined it is not theirs.
  id.class = (await db.class.create({ data: { schoolId: id.school, name: "ZZ Late 7A", joinCode: `ZZLJ${SUFFIX}` }, select: { id: true } })).id;
  const before = new Date(Date.now() - 3 * 86_400_000);
  id.classWork = (await db.assignment.create({ data: { schoolId: id.school, classId: id.class, authorMembershipId: m.teacher!, title: "ZZ Class work set before", publishedAt: before, dueAt: new Date(Date.now() + 3 * 86_400_000) }, select: { id: true } })).id;
  await db.enrollment.create({ data: { schoolId: id.school, classId: id.class, studentMembershipId: m.pupil! } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [id.college!, id.school!].filter(Boolean) } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("work set on an offering before a student registered", () => {
  it("TA-060: the teacher sets work before the late student registers (one due soon, one already overdue)", async () => {
    await as("fac", "FACULTY");
    const soon = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.oElective}/work`, { title: "ZZ Early problem set", points: 20, dueAt: inDays(3), publish: true }), params("offeringId", id.oElective!));
    expect(soon.status).toBe(201);
    const made = await body<{ assignmentId: string; notified: number }>(soon);
    expect(made.notified).toBe(1);
    id.wSoon = made.assignmentId;
    const overdue = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.oElective}/work`, { title: "ZZ Early reading", points: 10, dueAt: inDays(-1), publish: true, confirmPastDue: true }), params("offeringId", id.oElective!));
    expect(overdue.status).toBe(201);
    id.wOverdue = (await body<{ assignmentId: string }>(overdue)).assignmentId;

    // The late student registers now, on the elective (the core course is added with it).
    await as("late", "STUDENT");
    const reg = await registrationPost(json("/api/v1/academics/registration", { termId: id.term, offeringIds: [id.oElective] }));
    expect(reg.status).toBe(200);
    expect(await db.courseRegistration.count({ where: { studentMembershipId: m.late!, status: "REGISTERED" } })).toBe(2);
  });

  it("TA-060: the late student's work list holds the earlier work as owed, as the marking sheet expects it", async () => {
    await as("late", "STUDENT");
    const lists = await body<Lists>(await studentWorkGet());
    expect(titles(lists.todo).sort()).toEqual(["ZZ Early problem set", "ZZ Early reading"]);
    await as("fac", "FACULTY");
    const book = await body<{ rows: { membershipId: string }[] }>(await workGet(get(`/api/v1/academics/work/${id.wSoon}`), params("assignmentId", id.wSoon!)));
    expect(book.rows.map((r) => r.membershipId).sort()).toEqual([m.early!, m.late!].sort());
  });

  it("TA-060: the home 'due' box and the agenda show it, the overdue piece too", async () => {
    await as("late", "STUDENT");
    const home = await body<{ upcoming: Work[] }>(await overviewGet());
    expect(titles(home.upcoming).sort()).toEqual(["ZZ Early problem set", "ZZ Early reading"]);
    const agenda = await body<{ rows: { kind: string; title: string }[] }>(await agendaGet(get("/api/v1/family/agenda")));
    expect(agenda.rows.filter((r) => r.kind === "WORK").map((r) => r.title)).toEqual(["ZZ Early problem set"]);
  });

  it("TA-060: the student's guardian reads the same list", async () => {
    await as("parent", "PARENT", null);
    const res = await parentWorkGet(get(`/api/v1/family/assignments?childId=${m.late}`));
    expect(res.status).toBe(200);
    const lists = await body<Lists>(res);
    expect(titles(lists.todo).sort()).toEqual(["ZZ Early problem set", "ZZ Early reading"]);
  });

  it("TA-060: no new notice goes to the late joiner for the earlier work", async () => {
    expect(await db.notification.count({ where: { userId: u.late!, kind: "ASSIGNMENT" } })).toBe(0);
  });

  it("TA-060: a drop and re-add keeps every earlier piece, the marked one under marked", async () => {
    await as("fac", "FACULTY");
    const saved = await body<{ saved: number }>(await gradesPost(json(`/api/v1/academics/work/${id.wSoon}/grades`, { grades: [{ studentMembershipId: m.late, score: 14, comment: "" }] }), params("assignmentId", id.wSoon!)));
    expect(saved.saved).toBe(1);
    await as("late", "STUDENT");
    expect((await registrationPost(json("/api/v1/academics/registration", { termId: id.term, offeringIds: [] }))).status).toBe(200);
    expect(await db.courseRegistration.findUniqueOrThrow({ where: { offeringId_studentMembershipId: { offeringId: id.oElective!, studentMembershipId: m.late! } }, select: { status: true } })).toEqual({ status: "DROPPED" });
    const dropped = await body<Lists>(await studentWorkGet());
    expect(titles([...dropped.todo, ...dropped.handedIn, ...dropped.marked])).toEqual([]);
    expect((await registrationPost(json("/api/v1/academics/registration", { termId: id.term, offeringIds: [id.oElective] }))).status).toBe(200);
    const back = await body<Lists>(await studentWorkGet());
    expect(titles(back.marked)).toEqual(["ZZ Early problem set"]);
    expect(titles(back.todo)).toEqual(["ZZ Early reading"]);
  });
});

describe("a school class keeps its rule", () => {
  it("TA-060: work set to a class before the pupil joined it is still not theirs (colleges only)", async () => {
    await as("pupil", "STUDENT", id.school!);
    const lists = await body<Lists>(await studentWorkGet());
    expect(titles([...lists.todo, ...lists.handedIn, ...lists.marked])).not.toContain("ZZ Class work set before");
    expect(await db.assignment.count({ where: { id: id.classWork! } })).toBe(1);
  });
});
