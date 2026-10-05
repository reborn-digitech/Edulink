/**
 * Homework at a college (R-48 / A3-inventory-6, the risks batch of 5 October
 * 2026), through its /api/v1 doors with primed sessions, at a ZZ college of
 * this suite's own.
 *
 * What is proved: a piece of work set to a course offering (no class; one
 * offering is an elective shared across divisions) is set and published by
 * the offering's faculty member or its department's HOD and refused to a
 * colleague who does not teach it, an HOD of another department and the
 * office; it reaches the offering's REGISTERED students and nobody else — in
 * their work list, as a hand-in through the school's own door, and in the
 * notices; a draft reaches nobody until published, and publishing again is a
 * no-op; marks are refused for a student not registered; the marks go into an
 * internal component scaled to its maximum through the internal marks' one
 * writer, and are refused 409 once the offering is locked; a due date in the
 * past needs a confirmation; and the database holds every row to exactly one
 * of a class and an offering.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { scaledMarks } from "@/lib/college-homework";
import { GET as homeGet } from "@/app/api/v1/academics/work/route";
import { GET as offeringWorkGet, POST as offeringWorkPost } from "@/app/api/v1/academics/offerings/[offeringId]/work/route";
import { GET as workGet } from "@/app/api/v1/academics/work/[assignmentId]/route";
import { POST as publishPost } from "@/app/api/v1/academics/work/[assignmentId]/publish/route";
import { POST as gradesPost } from "@/app/api/v1/academics/work/[assignmentId]/grades/route";
import { POST as internalPost } from "@/app/api/v1/academics/work/[assignmentId]/internal/route";
import { GET as studentWorkGet } from "@/app/api/v1/family/student/assignments/route";
import { POST as submissionPost } from "@/app/api/v1/family/student/submissions/route";

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
async function as(who: string, role: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(u[who]!, { schoolId: id.college!, role: role as never });
}
const future = () => new Date(Date.now() + 3 * 86_400_000).toISOString();
type Work = { id: string; title: string; className: string };
type Lists = { todo: Work[]; handedIn: Work[]; marked: Work[] };
const titlesOf = (l: Lists) => [...l.todo, ...l.handedIn, ...l.marked].map((w) => w.title);

beforeAll(async () => {
  id.college = (await db.school.create({ data: { name: `ZZ Homework College ${STAMP}`, slug: `zz-hw-college-${STAMP}`, code: `ZHW${SUFFIX}`, contactEmail: `zz-hw-college-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id;
  const c = id.college;
  await db.schoolModule.createMany({ data: [{ schoolId: c, module: "ACADEMICS" }] });
  const people: [string, string][] = [["admin", "ADMIN"], ["hodA", "HOD"], ["facA", "FACULTY"], ["facA2", "FACULTY"], ["hodB", "HOD"], ["s1", "STUDENT"], ["s2", "STUDENT"], ["s3", "STUDENT"]];
  for (const [who, role] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ Hw ${who}`, email: `zz-hw-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } })).id;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId: c, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZHS${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  id.phy = (await db.department.create({ data: { schoolId: c, code: "PHY", name: "ZZ Physics", hodMembershipId: m.hodA }, select: { id: true } })).id;
  id.law = (await db.department.create({ data: { schoolId: c, code: "LAW", name: "ZZ Law", hodMembershipId: m.hodB }, select: { id: true } })).id;
  await db.departmentFaculty.createMany({ data: [{ schoolId: c, membershipId: m.facA!, departmentId: id.phy }, { schoolId: c, membershipId: m.facA2!, departmentId: id.phy }] });
  id.prog = (await db.programme.create({ data: { schoolId: c, departmentId: id.phy, code: "BSC", name: "ZZ BSc", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  id.scheme = (await db.scheme.create({ data: { schoolId: c, programmeId: id.prog, name: "ZZ BSc 2024", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 1, maxTermCredits: 30 }) }, select: { id: true } })).id;
  const course = async (code: string, kind: string) => (await db.course.create({ data: { schoolId: c, schemeId: id.scheme!, code, name: `ZZ ${code}`, semester: 1, creditsL: 4, kind }, select: { id: true } })).id;
  id.c1 = await course("HW101", "CORE");
  id.c2 = await course("HW103", "ELECTIVE");
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: "ZZ Hw term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -30), endsOn: addDaysToKey(TODAY, 90), registrationOpensOn: addDaysToKey(TODAY, -40), registrationClosesOn: addDaysToKey(TODAY, -20) }, select: { id: true } })).id;
  // Both offerings shared across divisions (divisionId null): the work has no class at all.
  id.o1 = (await db.courseOffering.create({ data: { schoolId: c, termId: id.term, courseId: id.c1, facultyMembershipId: m.facA }, select: { id: true } })).id;
  id.o2 = (await db.courseOffering.create({ data: { schoolId: c, termId: id.term, courseId: id.c2, facultyMembershipId: m.facA }, select: { id: true } })).id;
  // s1 and s2 on HW101; s1 alone on the elective; s3 on neither. Registered yesterday, so today's work is theirs.
  const yesterday = new Date(Date.now() - 86_400_000);
  for (const [st, off, kind] of [["s1", id.o1, "CORE"], ["s2", id.o1, "CORE"], ["s1", id.o2, "ELECTIVE"]] as const) {
    await db.courseRegistration.create({ data: { schoolId: c, studentMembershipId: m[st]!, offeringId: off, termId: id.term, kind, registeredAt: yesterday } });
  }
  id.component = (await db.internalComponent.create({ data: { schoolId: c, offeringId: id.o1, name: "ZZ Assignments", kind: "ASSIGNMENT", maxMarks: 10, weight: 10 }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: id.college! } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("setting work on an offering", () => {
  it("is the offering's teacher's: published to its registered students, who are told", async () => {
    await as("facA", "FACULTY");
    const res = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Problem set 1", body: "Chapter 2", points: 20, dueAt: future(), publish: true }), params("offeringId", id.o1!));
    expect(res.status).toBe(201);
    const made = await body<{ assignmentId: string; notified: number }>(res);
    expect(made.notified).toBe(2);
    id.w1 = made.assignmentId;
    const row = await db.assignment.findUniqueOrThrow({ where: { id: id.w1 }, select: { classId: true, offeringId: true, publishedAt: true } });
    expect(row).toMatchObject({ classId: null, offeringId: id.o1 });
    expect(row.publishedAt).not.toBeNull();
    const told = await db.notification.count({ where: { userId: { in: [u.s1!, u.s2!, u.s3!] }, kind: "ASSIGNMENT", schoolId: id.college } });
    expect(told).toBe(2);
    expect(await db.notification.count({ where: { userId: u.s3!, kind: "ASSIGNMENT" } })).toBe(0);
  });

  it("is refused to a colleague who does not teach it, an HOD of another department and the office", async () => {
    await as("facA2", "FACULTY");
    expect((await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Not mine", publish: true }), params("offeringId", id.o1!))).status).toBe(403);
    expect((await offeringWorkGet(get(`/api/v1/academics/offerings/${id.o1}/work`), params("offeringId", id.o1!))).status).toBe(403);
    expect((await workGet(get(`/api/v1/academics/work/${id.w1}`), params("assignmentId", id.w1!))).status).toBe(403);
    await as("hodB", "HOD");
    expect((await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Not mine", publish: true }), params("offeringId", id.o1!))).status).toBe(403);
    await as("admin", "ADMIN");
    expect((await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Not mine", publish: true }), params("offeringId", id.o1!))).status).toBe(403);
    expect((await homeGet()).status).toBe(403);
  });

  it("is the department's HOD's too, on an offering a colleague teaches", async () => {
    await as("hodA", "HOD");
    const home = await body<{ offerings: { offeringId: string; mine: boolean; work: number }[] }>(await homeGet());
    expect(home.offerings.find((o) => o.offeringId === id.o1)).toMatchObject({ mine: false, work: 1 });
    // An elective with no division: set by the HOD, for the one student registered on it.
    const res = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o2}/work`, { title: "ZZ Elective reading", points: 10, publish: true }), params("offeringId", id.o2!));
    expect(res.status).toBe(201);
    const made = await body<{ assignmentId: string; notified: number }>(res);
    expect(made.notified).toBe(1);
    id.w2 = made.assignmentId;
  });

  it("refuses a due date already past unless the teacher confirms it", async () => {
    await as("facA", "FACULTY");
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const refused = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Late one", dueAt: past, publish: false }), params("offeringId", id.o1!));
    expect(refused.status).toBe(422);
    const ok = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Late one", dueAt: past, publish: false, confirmPastDue: true }), params("offeringId", id.o1!));
    expect(ok.status).toBe(201);
    await db.assignment.delete({ where: { id: (await body<{ assignmentId: string }>(ok)).assignmentId } });
  });
});

describe("the student's side is the school's own doors", () => {
  it("lists an offering's work to its registered students only, labelled with the course", async () => {
    await as("s1", "STUDENT");
    const s1 = await body<Lists>(await studentWorkGet());
    expect(titlesOf(s1)).toEqual(expect.arrayContaining(["ZZ Problem set 1", "ZZ Elective reading"]));
    expect(s1.todo.find((w) => w.title === "ZZ Problem set 1")?.className).toBe("HW101 ZZ HW101");
    await as("s2", "STUDENT");
    expect(titlesOf(await body<Lists>(await studentWorkGet()))).toEqual(["ZZ Problem set 1"]);
    await as("s3", "STUDENT");
    expect(titlesOf(await body<Lists>(await studentWorkGet()))).toEqual([]);
  });

  it("takes a registered student's hand-in, and refuses one from a student not registered", async () => {
    await as("s1", "STUDENT");
    const res = await submissionPost(json("/api/v1/family/student/submissions", { assignmentId: id.w1, body: "ZZ my answers" }));
    expect(res.status).toBe(200);
    await as("s3", "STUDENT");
    expect((await submissionPost(json("/api/v1/family/student/submissions", { assignmentId: id.w1, body: "ZZ not mine" }))).status).toBe(404);
    // The teacher who set it is told, with a link to the college's marking page.
    const told = await db.notification.findFirst({ where: { userId: u.facA!, kind: "ASSIGNMENT" }, select: { url: true } });
    expect(told?.url).toBe(`/faculty/work/${id.w1}`);
  });
});

describe("drafts", () => {
  it("reach nobody until published; publishing twice is answered as it stands", async () => {
    await as("facA", "FACULTY");
    const res = await offeringWorkPost(json(`/api/v1/academics/offerings/${id.o1}/work`, { title: "ZZ Draft set", publish: false }), params("offeringId", id.o1!));
    const draft = (await body<{ assignmentId: string; notified: number }>(res)).assignmentId;
    await as("s2", "STUDENT");
    expect(titlesOf(await body<Lists>(await studentWorkGet()))).not.toContain("ZZ Draft set");
    expect((await submissionPost(json("/api/v1/family/student/submissions", { assignmentId: draft, body: "ZZ early" }))).status).toBe(404);
    await as("facA", "FACULTY");
    expect((await publishPost(json(`/api/v1/academics/work/${draft}/publish`, {}), params("assignmentId", draft))).status).toBe(200);
    const notices = await db.notification.count({ where: { userId: u.s2!, kind: "ASSIGNMENT" } });
    expect((await publishPost(json(`/api/v1/academics/work/${draft}/publish`, {}), params("assignmentId", draft))).status).toBe(200);
    expect(await db.notification.count({ where: { userId: u.s2!, kind: "ASSIGNMENT" } })).toBe(notices);
    await as("s2", "STUDENT");
    expect(titlesOf(await body<Lists>(await studentWorkGet()))).toContain("ZZ Draft set");
  });
});

describe("marking and posting into internal marks", () => {
  it("reads the registered students with what each handed in, and marks only them", async () => {
    await as("facA", "FACULTY");
    const book = await body<{ rows: { membershipId: string; work: unknown }[]; stats: { total: number; submitted: number }; components: { id: string }[] }>(await workGet(get(`/api/v1/academics/work/${id.w1}`), params("assignmentId", id.w1!)));
    expect(book.rows.map((r) => r.membershipId).sort()).toEqual([m.s1!, m.s2!].sort());
    expect(book.stats).toMatchObject({ total: 2, submitted: 1 });
    expect(book.components.map((k) => k.id)).toEqual([id.component]);
    const saved = await body<{ saved: number; rejected: number }>(await gradesPost(json(`/api/v1/academics/work/${id.w1}/grades`, { grades: [{ studentMembershipId: m.s1, score: 15, comment: "" }, { studentMembershipId: m.s3, score: 12, comment: "" }] }), params("assignmentId", id.w1!)));
    expect(saved).toMatchObject({ saved: 1, rejected: 1 });
    expect(await db.notification.count({ where: { userId: u.s1!, kind: "GRADE" } })).toBe(1);
  });

  it("posts the marks into a component, scaled to its maximum, through the one writer", async () => {
    await as("facA", "FACULTY");
    const res = await internalPost(json(`/api/v1/academics/work/${id.w1}/internal`, { componentId: id.component }), params("assignmentId", id.w1!));
    expect(res.status).toBe(200);
    expect(await body(res)).toMatchObject({ posted: 1, notMarked: 1 });
    const mark = await db.internalMark.findUniqueOrThrow({ where: { componentId_studentMembershipId: { componentId: id.component!, studentMembershipId: m.s1! } }, select: { marksTenths: true, enteredByUserId: true } });
    // 15 of 20, as marks out of 10: 7.5.
    expect(mark).toEqual({ marksTenths: 75, enteredByUserId: u.facA });
    expect(await db.auditLog.count({ where: { schoolId: id.college, action: "academics.internal.marks" } })).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: id.college, action: "academics.work.postInternal" } })).toBe(1);
  });

  it("is refused once the offering's internal marks are locked", async () => {
    await db.internalLock.create({ data: { schoolId: id.college!, offeringId: id.o1!, termId: id.term!, outOf: 40, totalsJson: "[]", lockedByUserId: u.hodA! } });
    await as("facA", "FACULTY");
    expect((await internalPost(json(`/api/v1/academics/work/${id.w1}/internal`, { componentId: id.component }), params("assignmentId", id.w1!))).status).toBe(409);
    const view = await body<{ locked: boolean; components: unknown[] }>(await offeringWorkGet(get(`/api/v1/academics/offerings/${id.o1}/work`), params("offeringId", id.o1!)));
    expect(view).toMatchObject({ locked: true, components: [] });
  });

  it("scales by tenths and holds bonus marks to the component's maximum", () => {
    expect(scaledMarks(15_000, 20_000, 10)).toBe(7.5);
    expect(scaledMarks(13_000, 30_000, 10)).toBe(4.3);
    expect(scaledMarks(25_000, 20_000, 10)).toBe(10);
  });
});

describe("the row", () => {
  it("is a class's or an offering's, never both and never neither", async () => {
    await expect(db.assignment.create({ data: { schoolId: id.college!, authorMembershipId: m.facA!, title: "ZZ nowhere" } })).rejects.toThrow();
  });
});
