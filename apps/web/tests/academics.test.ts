/**
 * The college's academics (module ACADEMICS, roles FACULTY and HOD; 4 October
 * 2026), through its /api/v1 doors with primed sessions, at two ZZ tenants of
 * this suite's own: a college (ACADEMICS on, as every college has it) and a
 * school (never offered ACADEMICS).
 *
 * What is proved: a school answers MODULE_OFF at every academics door and the
 * gate says so; a college cannot switch ACADEMICS off; registration is refused
 * outside the window and over the scheme's credits, core courses are added
 * whatever is chosen, and a timetable hour that clashes a faculty member is
 * refused 409; a lecture's batch sent twice under one clientId is written
 * once; the percentage is held to each student's own programme's rule (70 for
 * law, 75 for the rest) in the eligibility list; the condonation chain — the
 * HOD refused under the department's floor, forwarding, the principal
 * approving, the student eligible after; internal marks — release refused
 * before a countersign, the teacher refused their own countersign, a
 * colleague's countersign, the HOD's release and lock, every change 409
 * after, and the frozen totals equal the marks recomputed (the data:audit
 * check's arithmetic); an HOD of another department is refused; the
 * projection's arithmetic; and an adult's guardian sees no attendance until
 * the student grants it.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { gateRequest } from "@/lib/role-gate";
import { ModuleOffError } from "@/lib/access-error";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { canMissMore, internalTotalHundredths, percentOf } from "@/lib/academics-rules";
import { lockTotals } from "@/lib/academics-assessment";
import { GET as structureGet } from "@/app/api/v1/academics/structure/route";
import { GET as registrationGet, POST as registrationPost } from "@/app/api/v1/academics/registration/route";
import { POST as timetablePost } from "@/app/api/v1/academics/timetable/route";
import { POST as markPost } from "@/app/api/v1/academics/lectures/[lectureId]/attendance/route";
import { GET as eligibilityGet } from "@/app/api/v1/academics/eligibility/route";
import { POST as condonationPost } from "@/app/api/v1/academics/condonations/route";
import { POST as decidePost } from "@/app/api/v1/academics/condonations/[id]/decide/route";
import { POST as componentPost } from "@/app/api/v1/academics/offerings/[offeringId]/internal/components/route";
import { POST as marksPost } from "@/app/api/v1/academics/offerings/[offeringId]/internal/marks/route";
import { POST as moderatePost } from "@/app/api/v1/academics/internal/components/[componentId]/moderate/route";
import { POST as releasePost } from "@/app/api/v1/academics/internal/components/[componentId]/release/route";
import { POST as lockPost } from "@/app/api/v1/academics/offerings/[offeringId]/internal/lock/route";
import { GET as familyGet } from "@/app/api/v1/academics/family/route";
import { GET as mineGet } from "@/app/api/v1/academics/mine/route";
import { POST as modulesPost } from "@/app/api/v1/admin/modules/route";
import { GET as studentsGet } from "@/app/api/v1/academics/students/route";
import { GET as offeringsGet, POST as offeringsPost } from "@/app/api/v1/academics/offerings/route";
import { GET as timetableGet } from "@/app/api/v1/academics/timetable/route";
import { GET as substitutionsGet } from "@/app/api/v1/academics/substitutions/route";
import { GET as attendanceGet } from "@/app/api/v1/academics/attendance/route";
import { GET as condonationsGet } from "@/app/api/v1/academics/condonations/route";
import { GET as lecturesGet } from "@/app/api/v1/academics/lectures/route";
import { GET as lectureGet } from "@/app/api/v1/academics/lectures/[lectureId]/route";
import { GET as internalGet } from "@/app/api/v1/academics/offerings/[offeringId]/internal/route";
import { GET as courseFileGet } from "@/app/api/v1/academics/offerings/[offeringId]/course-file/route";
import { POST as coursePlanPost } from "@/app/api/v1/academics/offerings/[offeringId]/course-file/route";
import { GET as mentoringGet } from "@/app/api/v1/academics/mentoring/route";
import { POST as groupPost } from "@/app/api/v1/academics/mentoring/groups/route";
import { GET as facultyHomeGet } from "@/app/api/v1/academics/faculty-home/route";
import { GET as hodHomeGet } from "@/app/api/v1/academics/hod-home/route";
import { GET as lateGet } from "@/app/api/v1/academics/late-registrations/route";
// A grant is one guardian's since TA-555 (14 November 2026): "the student grants X" is to each family guardian linked to them.
import { grantToGuardians } from "./consent-grants";

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

beforeAll(async () => {
  const mkSchool = (tag: string, kind: string) => db.school.create({ data: { name: `ZZ Academics ${tag} ${STAMP}`, slug: `zz-acad-${tag.toLowerCase()}-${STAMP}`, code: `ZA${tag[0]}${SUFFIX}`, contactEmail: `zz-acad-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind }, select: { id: true } });
  id.college = (await mkSchool("College", "COLLEGE")).id;
  id.school = (await mkSchool("School", "SCHOOL")).id;
  await db.schoolModule.createMany({ data: [{ schoolId: id.college, module: "ACADEMICS" }, { schoolId: id.college, module: "ALUMNI" }, { schoolId: id.school, module: "ALUMNI" }] });
  const people: [string, string, boolean][] = [["admin", "ADMIN", false], ["principal", "PRINCIPAL", false], ["hodA", "HOD", false], ["facA", "FACULTY", false], ["facA2", "FACULTY", false], ["hodB", "HOD", false], ["facB", "FACULTY", false], ["s1", "STUDENT", false], ["s2", "STUDENT", false], ["s3", "STUDENT", false], ["schoolAdmin", "ADMIN", false], ["parent", "PARENT", false]];
  for (const [who, role, minor] of people) {
    u[who] = (await db.user.create({ data: { name: `ZZ Acad ${who}`, email: `zz-acad-${who.toLowerCase()}-${STAMP}@test.invalid`, isMinor: minor }, select: { id: true } })).id;
    if (role === "PARENT") continue;
    m[who] = (await db.membership.create({ data: { userId: u[who]!, schoolId: who === "schoolAdmin" ? id.school : id.college, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZAS${who}${SUFFIX}` } : {}) }, select: { id: true } })).id;
  }
  await db.guardianship.create({ data: { parentUserId: u.parent!, studentMembershipId: m.s2!, studentSchoolId: id.college, status: "ACTIVE" } });
  const c = id.college;
  id.phy = (await db.department.create({ data: { schoolId: c, code: "PHY", name: "ZZ Physics", hodMembershipId: m.hodA, condoneFloorPercent: 75 }, select: { id: true } })).id;
  id.law = (await db.department.create({ data: { schoolId: c, code: "LAW", name: "ZZ Law", hodMembershipId: m.hodB, condoneFloorPercent: 65 }, select: { id: true } })).id;
  await db.departmentFaculty.createMany({ data: [{ schoolId: c, membershipId: m.facA!, departmentId: id.phy }, { schoolId: c, membershipId: m.facA2!, departmentId: id.phy }, { schoolId: c, membershipId: m.facB!, departmentId: id.law }] });
  id.p1 = (await db.programme.create({ data: { schoolId: c, departmentId: id.phy, code: "BSC", name: "ZZ BSc", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
  id.p2 = (await db.programme.create({ data: { schoolId: c, departmentId: id.law, code: "LLB", name: "ZZ LLB", level: "UG", durationYears: 3, regulator: "BCI", attendanceThreshold: 70 }, select: { id: true } })).id;
  const rules = (min: number, max: number) => JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: min, maxTermCredits: max });
  id.s1 = (await db.scheme.create({ data: { schoolId: c, programmeId: id.p1, name: "ZZ BSc 2024", effectiveYear: 2024, passingRules: rules(6, 10) }, select: { id: true } })).id;
  id.s2 = (await db.scheme.create({ data: { schoolId: c, programmeId: id.p2, name: "ZZ LLB 2024", effectiveYear: 2024, passingRules: rules(1, 30) }, select: { id: true } })).id;
  const course = async (scheme: string, code: string, credits: number, kind: string) => (await db.course.create({ data: { schoolId: c, schemeId: scheme, code, name: `ZZ ${code}`, semester: 1, creditsL: credits, kind, outcomes: JSON.stringify([{ code: "CO1", text: "ZZ an outcome" }]) }, select: { id: true } })).id;
  id.c1 = await course(id.s1, "PHY1", 4, "CORE");
  id.c2 = await course(id.s1, "PHY2", 3, "ELECTIVE");
  id.c3 = await course(id.s1, "PHY3", 4, "ELECTIVE");
  id.c4 = await course(id.s2, "LAW1", 4, "CORE");
  const term = (name: string, start: number, open: number, close: number) => db.academicTerm.create({ data: { schoolId: c, name, academicYear: "2026–27", startsOn: addDaysToKey(TODAY, start), endsOn: addDaysToKey(TODAY, start + 120), registrationOpensOn: addDaysToKey(TODAY, open), registrationClosesOn: addDaysToKey(TODAY, close) }, select: { id: true } });
  id.term = (await term("ZZ Now", -60, -5, 5)).id;
  // Next term: its window not yet open.
  id.later = (await term("ZZ Later", 70, 10, 20)).id;
  const offering = async (courseId: string, faculty: string) => (await db.courseOffering.create({ data: { schoolId: c, termId: id.term!, courseId, facultyMembershipId: faculty, lectureHours: 3 }, select: { id: true } })).id;
  id.o1 = await offering(id.c1, m.facA!);
  id.o2 = await offering(id.c2, m.facA!);
  id.o3 = await offering(id.c3, m.facA2!);
  id.o4 = await offering(id.c4, m.facB!);
  for (const [st, programmeId, schemeId] of [["s1", id.p1, id.s1], ["s2", id.p1, id.s1], ["s3", id.p2, id.s2]] as const) {
    await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: m[st]!, programmeId, schemeId, entryYear: 2026 } });
  }
  id.period = (await db.timetablePeriod.create({ data: { schoolId: c, name: "ZZ P1", startMinute: 540, endMinute: 590, position: 1 }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [id.college!, id.school!] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the module", () => {
  it("is never a school's: every academics door answers MODULE_OFF there, and the gate says so", async () => {
    await as("schoolAdmin", "ADMIN", id.school);
    const res = await structureGet();
    expect(res.status).toBe(403);
    expect((await body(res)).code).toBe("MODULE_OFF");
    await expect(gateRequest("GET /api/v1/academics/structure", { role: "ADMIN", schoolId: id.school! })).rejects.toBeInstanceOf(ModuleOffError);
    await expect(gateRequest("GET /api/v1/academics/structure", { role: "FACULTY", schoolId: id.college! })).resolves.toBe("pass");
  });

  it("is always on at a college: switching it off is refused", async () => {
    await as("admin", "ADMIN");
    const res = await modulesPost(json("/api/v1/admin/modules", { module: "ACADEMICS", on: false }));
    expect(res.status).toBe(403);
    expect(await db.schoolModule.count({ where: { schoolId: id.college, module: "ACADEMICS" } })).toBe(1);
  });
});

describe("registration", () => {
  it("is refused outside the window, over the scheme's credits, and adds the core course whatever is chosen", async () => {
    await as("s1", "STUDENT");
    const closed = await registrationPost(json("/api/v1/academics/registration", { termId: id.later, offeringIds: [] }));
    expect(closed.status).toBe(409);
    const over = await registrationPost(json("/api/v1/academics/registration", { termId: id.term, offeringIds: [id.o2, id.o3] }));
    expect(over.status).toBe(422);
    const okRes = await registrationPost(json("/api/v1/academics/registration", { termId: id.term, offeringIds: [id.o2] }));
    expect(okRes.status).toBe(200);
    const view = await body<{ chosenCredits: number; offerings: { offeringId: string; chosen: boolean; required: boolean }[] }>(okRes);
    expect(view.chosenCredits).toBe(7);
    expect(view.offerings.find((o) => o.offeringId === id.o1)).toMatchObject({ chosen: true, required: true });
    // The same set again changes nothing.
    const again = await registrationPost(json("/api/v1/academics/registration", { termId: id.term, offeringIds: [id.o2] }));
    expect(again.status).toBe(200);
    expect(await db.courseRegistration.count({ where: { studentMembershipId: m.s1, status: "REGISTERED" } })).toBe(2);
    const read = await registrationGet(get(`/api/v1/academics/registration?termId=${id.term}`));
    expect((await body<{ open: boolean }>(read)).open).toBe(true);
  });

  it("refuses a timetable hour that puts a faculty member in two places", async () => {
    await as("admin", "ADMIN");
    const first = await timetablePost(json("/api/v1/academics/timetable", { offeringId: id.o1, weekday: 1, periodId: id.period, kind: "LECTURE", roomId: null }));
    expect(first.status).toBe(200);
    const clash = await timetablePost(json("/api/v1/academics/timetable", { offeringId: id.o2, weekday: 1, periodId: id.period, kind: "LECTURE", roomId: null }));
    expect(clash.status).toBe(409);
  });
});

describe("lecture attendance", () => {
  const lectures: string[] = [];
  beforeAll(async () => {
    await db.courseRegistration.createMany({ data: [{ schoolId: id.college!, studentMembershipId: m.s2!, offeringId: id.o1!, termId: id.term!, kind: "CORE" }, { schoolId: id.college!, studentMembershipId: m.s3!, offeringId: id.o4!, termId: id.term!, kind: "CORE" }] });
    for (let k = 0; k < 10; k += 1) {
      const dateKey = addDaysToKey(TODAY, -(k + 2));
      lectures.push((await db.lecture.create({ data: { schoolId: id.college!, offeringId: id.o1!, dateKey, startMinute: 540, endMinute: 590 }, select: { id: true } })).id);
      const law = await db.lecture.create({ data: { schoolId: id.college!, offeringId: id.o4!, dateKey, startMinute: 600, endMinute: 650 }, select: { id: true } });
      // The law student attends seven of ten: 70 %, the BCI's line.
      await db.lectureAttendance.create({ data: { schoolId: id.college!, lectureId: law.id, studentMembershipId: m.s3!, status: k < 7 ? "PRESENT" : "ABSENT", markedByMembershipId: m.facB! } });
    }
  });

  it("writes a batch once: the same clientId a second time is a replay that changes nothing", async () => {
    await as("facA", "FACULTY");
    const entries = [{ studentMembershipId: m.s1, status: "PRESENT" }, { studentMembershipId: m.s2, status: "ABSENT" }];
    const first = await markPost(json(`/api/v1/academics/lectures/${lectures[0]}/attendance`, { clientId: "zz-batch-0001", entries }), params("lectureId", lectures[0]!));
    expect(first.status).toBe(200);
    expect(await body(first)).toMatchObject({ present: 1, absent: 1, replay: false });
    const replay = await markPost(json(`/api/v1/academics/lectures/${lectures[0]}/attendance`, { clientId: "zz-batch-0001", entries: entries.map((e) => ({ ...e, status: "PRESENT" })) }), params("lectureId", lectures[0]!));
    expect(await body(replay)).toMatchObject({ present: 1, absent: 1, replay: true });
    expect(await db.lectureAttendance.count({ where: { lectureId: lectures[0] } })).toBe(2);
  });

  it("holds each student to their own programme's rule: 70 % passes law, 70 % fails the 75 % rule", async () => {
    await as("facA", "FACULTY");
    // s2: present at 7 of the 10 PHY lectures (one already absent above).
    for (let k = 1; k < 10; k += 1) {
      const res = await markPost(json(`/api/v1/academics/lectures/${lectures[k]}/attendance`, { clientId: `zz-batch-${k + 10}`, entries: [{ studentMembershipId: m.s1, status: "PRESENT" }, { studentMembershipId: m.s2, status: k < 3 ? "ABSENT" : k === 3 ? "LATE" : "PRESENT" }] }), params("lectureId", lectures[k]!));
      expect(res.status).toBe(200);
    }
    // The student under the line was told, once.
    expect(await db.defaulterNotice.count({ where: { studentMembershipId: m.s2, offeringId: id.o1 } })).toBe(1);
    await as("admin", "ADMIN");
    const res = await eligibilityGet(get(`/api/v1/academics/eligibility?termId=${id.term}`));
    const rows = (await body<{ rows: { studentMembershipId: string; offeringId: string; percent: number; threshold: number; eligible: boolean }[] }>(res)).rows;
    expect(rows.find((r) => r.studentMembershipId === m.s2 && r.offeringId === id.o1)).toMatchObject({ percent: 70, threshold: 75, eligible: false });
    expect(rows.find((r) => r.studentMembershipId === m.s3 && r.offeringId === id.o4)).toMatchObject({ percent: 70, threshold: 70, eligible: true });
  });

  it("projects how many more may be missed", () => {
    expect(canMissMore({ attended: 10, held: 12, remaining: 8, threshold: 75 })).toBe(3);
    expect(canMissMore({ attended: 5, held: 10, remaining: 2, threshold: 75 })).toBe(-2);
    expect(percentOf(13, 20)).toBe(65);
  });

  it("runs the condonation chain: HOD refused under the floor, forwards; the principal approves; the student is eligible", async () => {
    await as("s2", "STUDENT");
    const ask = await condonationPost(json("/api/v1/academics/condonations", { termId: id.term, offeringId: id.o1, ground: "MEDICAL", note: "ZZ Fever for two weeks", documentFileId: null }));
    expect(ask.status).toBe(200);
    const asked = await body<{ id: string; status: string }>(ask);
    expect(asked.status).toBe("ASKED");
    await as("hodB", "HOD");
    const other = await decidePost(json(`/api/v1/academics/condonations/${asked.id}/decide`, { decision: "APPROVE", note: "" }), params("id", asked.id));
    expect(other.status).toBe(403);
    await as("hodA", "HOD");
    const under = await decidePost(json(`/api/v1/academics/condonations/${asked.id}/decide`, { decision: "APPROVE", note: "" }), params("id", asked.id));
    expect(under.status).toBe(409);
    const forward = await decidePost(json(`/api/v1/academics/condonations/${asked.id}/decide`, { decision: "FORWARD", note: "ZZ Below our floor" }), params("id", asked.id));
    expect((await body<{ status: string }>(forward)).status).toBe("FORWARDED");
    await as("principal", "PRINCIPAL");
    const approve = await decidePost(json(`/api/v1/academics/condonations/${asked.id}/decide`, { decision: "APPROVE", note: "ZZ Medical note seen" }), params("id", asked.id));
    expect((await body<{ status: string }>(approve)).status).toBe("PRINCIPAL_APPROVED");
    await as("s2", "STUDENT");
    const mine = await body<{ attendance: { offeringId: string; condoned: boolean; eligible: boolean }[] }>(await mineGet());
    expect(mine.attendance.find((a) => a.offeringId === id.o1)).toMatchObject({ condoned: true, eligible: true });
  });

  it("shows an adult's guardian nothing until the student grants attendance", async () => {
    await as("parent", "PARENT", null);
    const before = await body<{ allowed: boolean; attendance: unknown[] }>(await familyGet(get("/api/v1/academics/family")));
    expect(before).toMatchObject({ allowed: false, attendance: [] });
    await grantToGuardians(db, id.college!, m.s2!, "ATTENDANCE");
    const after = await body<{ allowed: boolean; attendance: unknown[] }>(await familyGet(get("/api/v1/academics/family")));
    expect(after.allowed).toBe(true);
    expect(after.attendance.length).toBeGreaterThan(0);
  });
});

describe("internal assessment", () => {
  const comps: string[] = [];
  it("needs a colleague's countersign before the HOD may release, and never the teacher's own", async () => {
    await as("facA", "FACULTY");
    for (const [name, maxMarks, weight] of [["ZZ Test", 20, 20], ["ZZ Assignment", 10, 20]] as const) {
      const res = await componentPost(json(`/api/v1/academics/offerings/${id.o1}/internal/components`, { name, kind: "UNIT_TEST", maxMarks, weight, coCodes: ["CO1"] }), params("offeringId", id.o1!));
      expect(res.status).toBe(200);
      comps.push((await body<{ id: string }>(res)).id);
    }
    const over = await componentPost(json(`/api/v1/academics/offerings/${id.o1}/internal/components`, { name: "ZZ Extra", kind: "VIVA", maxMarks: 5, weight: 5, coCodes: [] }), params("offeringId", id.o1!));
    expect(over.status).toBe(422);
    const marks = [[comps[0]!, 17.5, 12], [comps[1]!, 9, 6]] as const;
    for (const [componentId, a, b] of marks) {
      const res = await marksPost(json(`/api/v1/academics/offerings/${id.o1}/internal/marks`, { componentId, entries: [{ studentMembershipId: m.s1, marks: a }, { studentMembershipId: m.s2, marks: b }] }), params("offeringId", id.o1!));
      expect(res.status).toBe(200);
    }
    await as("hodA", "HOD");
    expect((await releasePost(json("/x", {}), params("componentId", comps[0]!))).status).toBe(409);
    await as("facA", "FACULTY");
    expect((await moderatePost(json("/x", {}), params("componentId", comps[0]!))).status).toBe(409);
    await as("facA2", "FACULTY");
    for (const k of comps) expect((await moderatePost(json("/x", {}), params("componentId", k))).status).toBe(200);
    await as("hodA", "HOD");
    expect((await releasePost(json("/x", {}), params("componentId", comps[0]!))).status).toBe(200);
  });

  it("is refused to an HOD of another department", async () => {
    await as("hodB", "HOD");
    expect((await lockPost(json("/x", {}), params("offeringId", id.o1!))).status).toBe(403);
  });

  it("will not let an HOD take another department's offering or mentoring group by pointing it at their own (campaign S-7, S-8)", async () => {
    // Physics' offering, pointed at a law course and a law teacher by law's HOD: refused, unchanged.
    await as("hodB", "HOD");
    const taken = await offeringsPost(json("/api/v1/academics/offerings", { id: id.o3, termId: id.term, courseId: id.c4, divisionId: null, facultyMembershipId: m.facB, lectureHours: 3, tutorialHours: 0, practicalHours: 0, roomId: null, capacity: null }));
    expect(taken.status).toBe(403);
    expect(await db.courseOffering.findUniqueOrThrow({ where: { id: id.o3! }, select: { courseId: true, facultyMembershipId: true } })).toEqual({ courseId: id.c3, facultyMembershipId: m.facA2 });
    // Physics' mentoring group, handed by law's HOD to a law teacher: refused, the mentor unchanged.
    await as("hodA", "HOD");
    const group = await body<{ id: string }>(await groupPost(json("/api/v1/academics/mentoring/groups", { termId: id.term, facultyMembershipId: m.facA, name: "ZZ Physics mentees", studentMembershipIds: [m.s1] })));
    await as("hodB", "HOD");
    expect((await groupPost(json("/api/v1/academics/mentoring/groups", { id: group.id, termId: id.term, facultyMembershipId: m.facB, name: "ZZ taken", studentMembershipIds: [m.s1] }))).status).toBe(403);
    expect((await db.mentoringGroup.findUniqueOrThrow({ where: { id: group.id }, select: { facultyMembershipId: true } })).facultyMembershipId).toBe(m.facA);
    await db.mentoringGroup.delete({ where: { id: group.id } });
  });

  it("locks the totals, refuses every change after with 409, and the stored totals are the marks recomputed", async () => {
    await as("hodA", "HOD");
    expect((await lockPost(json("/x", {}), params("offeringId", id.o1!))).status).toBe(200);
    expect(await body(await lockPost(json("/x", {}), params("offeringId", id.o1!)))).toEqual({ changed: false });
    await as("facA", "FACULTY");
    const change = await marksPost(json(`/api/v1/academics/offerings/${id.o1}/internal/marks`, { componentId: comps[1], entries: [{ studentMembershipId: m.s1, marks: 10 }] }), params("offeringId", id.o1!));
    expect(change.status).toBe(409);
    const add = await componentPost(json(`/api/v1/academics/offerings/${id.o1}/internal/components`, { name: "ZZ Late", kind: "VIVA", maxMarks: 5, weight: 1, coCodes: [] }), params("offeringId", id.o1!));
    expect(add.status).toBe(409);
    const lock = await db.internalLock.findUniqueOrThrow({ where: { offeringId: id.o1 } });
    const stored = JSON.parse(lock.totalsJson) as { studentMembershipId: string; totalHundredths: number }[];
    const components = await db.internalComponent.findMany({ where: { offeringId: id.o1 }, select: { id: true, maxMarks: true, weight: true, marks: { select: { studentMembershipId: true, marksTenths: true } } } });
    expect(lockTotals(components, stored.map((s) => s.studentMembershipId))).toEqual(stored);
    // s1: 17.5/20 × 20 + 9/10 × 20 = 35.5; s2: 12/20 × 20 + 6/10 × 20 = 24.
    expect(stored.find((s) => s.studentMembershipId === m.s1)?.totalHundredths).toBe(3550);
    expect(stored.find((s) => s.studentMembershipId === m.s2)?.totalHundredths).toBe(2400);
    expect(lock.outOf).toBe(40);
    expect(internalTotalHundredths([{ id: "a", maxMarks: 20, weight: 20 }], new Map([["a", null]]))).toBe(0);
  });
});

describe("every read answers its readers", () => {
  it("serves the structure, seats, offerings, grid, board, reports, sheets, course file, mentoring and the homes", async () => {
    await as("hodA", "HOD");
    const group = await groupPost(json("/api/v1/academics/mentoring/groups", { termId: id.term, facultyMembershipId: m.facA, name: "ZZ Mentees", studentMembershipIds: [m.s1, m.s2] }));
    expect(group.status).toBe(200);
    await as("facA", "FACULTY");
    const plan = await coursePlanPost(json(`/api/v1/academics/offerings/${id.o1}/course-file`, { plan: [{ week: 1, topic: "ZZ Units", coCodes: ["CO1"], taughtOn: addDaysToKey(TODAY, -50) }, { week: 2, topic: "ZZ Vectors", coCodes: ["CO1"], taughtOn: null }] }), params("offeringId", id.o1!));
    expect(plan.status).toBe(200);
    const reads: [string, string, () => Promise<Response>][] = [
      ["admin", "ADMIN", () => structureGet()],
      ["admin", "ADMIN", () => studentsGet(get("/api/v1/academics/students"))],
      ["admin", "ADMIN", () => offeringsGet(get(`/api/v1/academics/offerings?termId=${id.term}`))],
      ["admin", "ADMIN", () => timetableGet(get(`/api/v1/academics/timetable?termId=${id.term}`))],
      ["admin", "ADMIN", () => substitutionsGet(get("/api/v1/academics/substitutions"))],
      ["admin", "ADMIN", () => attendanceGet(get("/api/v1/academics/attendance?defaultersOnly=1"))],
      ["admin", "ADMIN", () => lateGet()],
      ["principal", "PRINCIPAL", () => condonationsGet(get("/api/v1/academics/condonations?status=ALL"))],
      ["facA", "FACULTY", () => lecturesGet(get("/api/v1/academics/lectures"))],
      ["facA", "FACULTY", () => internalGet(get("/x"), params("offeringId", id.o1!))],
      ["facA", "FACULTY", () => courseFileGet(get("/x"), params("offeringId", id.o1!))],
      ["facA", "FACULTY", () => mentoringGet()],
      ["facA", "FACULTY", () => facultyHomeGet()],
      ["hodA", "HOD", () => hodHomeGet()],
      ["hodA", "HOD", () => attendanceGet(get("/api/v1/academics/attendance?defaultersOnly=1"))],
      ["s1", "STUDENT", () => timetableGet(get("/api/v1/academics/timetable"))],
      ["s1", "STUDENT", () => courseFileGet(get("/x"), params("offeringId", id.o1!))],
      ["s1", "STUDENT", () => mentoringGet()],
    ];
    for (const [who, role, read] of reads) {
      await as(who, role);
      const res = await read();
      expect(res.status, `${who} ${read.toString().slice(6, 60)}`).toBe(200);
    }
    await as("facA", "FACULTY");
    const lecture = await db.lecture.findFirstOrThrow({ where: { offeringId: id.o1 }, select: { id: true } });
    expect((await lectureGet(get("/x"), params("lectureId", lecture.id))).status).toBe(200);
    const file = await body<{ taught: number; attainment: { cos: { code: string; direct: number | null }[] } }>(await courseFileGet(get("/x"), params("offeringId", id.o1!)));
    expect(file.taught).toBe(1);
    // CO1 is tested by both parts: s1 has 26.5 of their 30 marks (88 %), s2 18 of 30 (60 %) — both reach 60 %, so level 3.
    expect(file.attainment.cos[0]).toMatchObject({ code: "CO1", direct: 3 });
    // A student of another offering reads no course file of this one.
    await as("s3", "STUDENT");
    expect((await courseFileGet(get("/x"), params("offeringId", id.o1!))).status).toBe(403);
  });
});

describe("a course file's links", () => {
  it("are web links only: javascript:, intent: and another app's scheme are refused, and a stored one is read as no link (campaign S-21, PH-7)", async () => {
    const { courseFileItemSaveSchema } = await import("@edulink/contracts");
    const { POST: itemPost } = await import("@/app/api/v1/academics/offerings/[offeringId]/course-file/items/route");
    for (const url of ["javascript:alert(1)", "intent://x#Intent;end", "sms:+911234567890", "file:///etc/passwd"]) {
      expect(courseFileItemSaveSchema.safeParse({ kind: "RESOURCE", title: "ZZ link", url, fileId: null, coCodes: [] }).success).toBe(false);
    }
    expect(courseFileItemSaveSchema.safeParse({ kind: "RESOURCE", title: "ZZ link", url: "https://example.org/notes", fileId: null, coCodes: [] }).success).toBe(true);
    await as("facA", "FACULTY");
    expect((await itemPost(json("/x", { kind: "RESOURCE", title: "ZZ bad", url: "javascript:alert(1)", fileId: null, coCodes: [] }), params("offeringId", id.o1!))).status).toBe(422);
    // A row written before the rule: the course file hands no link on.
    const file = await db.courseFile.upsert({ where: { offeringId: id.o1! }, update: {}, create: { schoolId: id.college!, offeringId: id.o1! }, select: { id: true } });
    const old = await db.courseFileItem.create({ data: { schoolId: id.college!, courseFileId: file.id, kind: "RESOURCE", title: "ZZ old link", url: "javascript:alert(1)", coCodes: "[]", createdByUserId: u.facA! }, select: { id: true } });
    const read = await body<{ items: { id: string; url: string | null }[] }>(await courseFileGet(get("/x"), params("offeringId", id.o1!)));
    expect(read.items.find((i) => i.id === old.id)?.url).toBeNull();
  });
});

describe("attendance once the exam cell has decided eligibility", () => {
  it("refuses a re-mark after the student's exam form is submitted, whose eligibility was snapshotted (campaign S-22)", async () => {
    const lecture = await db.lecture.create({ data: { schoolId: id.college!, offeringId: id.o1!, dateKey: addDaysToKey(TODAY, -20), startMinute: 700, endMinute: 750 }, select: { id: true } });
    await as("facA", "FACULTY");
    const mark = (clientId: string, status: string) => markPost(json(`/x`, { clientId, entries: [{ studentMembershipId: m.s2, status }] }), params("lectureId", lecture.id));
    expect((await mark("zz-frozen-0001", "PRESENT")).status).toBe(200);
    const session = await db.examSession.create({ data: { schoolId: id.college!, name: `ZZ Acad session ${STAMP}`, termId: id.term!, status: "FORMS" }, select: { id: true } });
    await db.examForm.create({ data: { schoolId: id.college!, sessionId: session.id, studentMembershipId: m.s2!, status: "SUBMITTED", submittedAt: new Date() } });
    expect((await mark("zz-frozen-0002", "ABSENT")).status).toBe(409);
    expect((await db.lectureAttendance.findFirstOrThrow({ where: { lectureId: lecture.id, studentMembershipId: m.s2! }, select: { status: true } })).status).toBe("PRESENT");
    await db.examSession.delete({ where: { id: session.id } });
  });

  it("still records a lecture dated after the decision, and says so up front on one dated before it (A3-journeys-7)", async () => {
    // The decision is the snapshot taken at the form's submission, five days ago; the term runs on.
    const before = await db.lecture.create({ data: { schoolId: id.college!, offeringId: id.o1!, dateKey: addDaysToKey(TODAY, -8), startMinute: 760, endMinute: 810 }, select: { id: true } });
    const after = await db.lecture.create({ data: { schoolId: id.college!, offeringId: id.o1!, dateKey: addDaysToKey(TODAY, -1), startMinute: 760, endMinute: 810 }, select: { id: true } });
    const session = await db.examSession.create({ data: { schoolId: id.college!, name: `ZZ Acad session later ${STAMP}`, termId: id.term!, status: "CONDUCT" }, select: { id: true } });
    await db.examForm.create({ data: { schoolId: id.college!, sessionId: session.id, studentMembershipId: m.s2!, status: "APPROVED", submittedAt: new Date(Date.now() - 5 * 86_400_000) } });
    try {
      await as("facA", "FACULTY");
      const mark = (lectureId: string, clientId: string) => markPost(json(`/x`, { clientId, entries: [{ studentMembershipId: m.s2, status: "ABSENT" }] }), params("lectureId", lectureId));
      // After the decision: recorded, and it no longer changes the eligibility the form holds.
      expect((await mark(after.id, `zz-after-${STAMP}`)).status).toBe(200);
      // On or before it: refused as before, and the sheet offers no Save and says why.
      expect((await mark(before.id, `zz-before-${STAMP}`)).status).toBe(409);
      const sheet = await body<{ canMark: boolean; frozen?: boolean }>(await lectureGet(get("/x"), params("lectureId", before.id)));
      expect(sheet).toMatchObject({ canMark: false, frozen: true });
      const open = await body<{ canMark: boolean; frozen?: boolean }>(await lectureGet(get("/x"), params("lectureId", after.id)));
      expect(open).toMatchObject({ canMark: true, frozen: false });
    } finally {
      await db.examSession.delete({ where: { id: session.id } });
    }
  });
});
