/**
 * The leaver's seat: finding TA-003 of the testing analysis of 13 November
 * 2026, held by cases that FAIL while the defect stands and pass once it is
 * fixed.
 *
 *   TA-003  A student who leaves the college keeps an ACTIVE seat and every
 *           course registration. leaveCollege (src/lib/college-records.ts)
 *           closes the admission's ProgrammeEnrolment and recordDeparture sets
 *           leftAt and ends the class enrolment; nothing touches
 *           StudentProgramme.status or CourseRegistration.status, and the
 *           readers of those two (the lecture sheet, the attendance report and
 *           eligibility list, the countersign's roster, the department's
 *           head-count) take the status alone, so the leaver stays on all of
 *           them.
 *
 * WHAT IS HELD. The readers, not the rows: the owner's decision on R-20 was no
 * new writer of the seat's status, and the fix may either teach every reader
 * about leftAt or have the leaving close the seat and drop the registrations.
 * Either way a person who left yesterday is not on today's lecture sheet, not
 * on the term's attendance and eligibility lists, not in the department's
 * count, and no countersign waits for a mark of theirs.
 *
 * A scratch ZZ college of this suite's own, made through the operator's
 * createSchool and removed after: one department, programme, scheme and core
 * course, a term around today, a division of two students (both seated,
 * enrolled and registered), a teacher and an HOD. Nothing of any fixture is
 * read or written.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { academicsStructure } from "@/lib/academics";
import { attendanceReport, eligibilityList, lectureSheet, markLecture } from "@/lib/academics-attendance";
import { moderateComponent, saveComponent, saveInternalMarks } from "@/lib/academics-assessment";
import { leaveCollege } from "@/lib/college-records";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta003-${who}-${STAMP}@test.invalid`;
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const YESTERDAY = addDaysToKey(TODAY, -1);
const ids: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  const session = await getSession();
  if (!session?.membershipId) throw new Error(`no session for ${who} as ${role}`);
  return session;
}

async function person(who: string, role: string, name: string, joinedDaysAgo = 0): Promise<void> {
  ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}" }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE", joinedAt: new Date(Date.now() - joinedDaysAgo * 86_400_000) }, select: { id: true } })).id;
}

async function settle<T>(run: () => Promise<T>): Promise<{ value: T } | { error: unknown }> {
  try {
    return { value: await run() };
  } catch (error) {
    return { error };
  }
}

const before = { departmentStudents: -1, sheet: [] as string[] };
let left: { leftAt: Date | null; classEnrolment: string | null; admission: string | null; alumnus: boolean };
let sheetAfter: string[] = [];
let reportAfter: string[] = [];
let eligibilityAfter: string[] = [];
let departmentStudentsAfter = -1;
let countersign: { value: { changed: boolean } } | { error: unknown };

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ TA003 Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const operator = { user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } } as unknown as ActiveContext;
  const made = await createSchool(operator, { contactEmail: MAIL("office"), timezone: TZ, name: `ZZ TA003 Science College ${STAMP}`, kind: "COLLEGE", streams: ["SCIENCE"] });
  if (!made.ok) throw new Error(made.errorKey);
  const C = (ids.college = made.schoolId);
  await db.school.update({ where: { id: C }, data: { isTestFixture: true } });

  await person("admin", "ADMIN", "ZZ TA003 Registrar");
  await person("faculty", "FACULTY", "ZZ TA003 Teacher");
  await person("hod", "HOD", "ZZ TA003 Head");
  await person("leaver", "STUDENT", "ZZ TA003 Leaver", 200);
  await person("stayer", "STUDENT", "ZZ TA003 Stayer", 200);

  ids.dept = (await db.department.create({ data: { schoolId: C, code: "PHY", name: "ZZ TA003 Physics", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  await db.departmentFaculty.create({ data: { schoolId: C, departmentId: ids.dept!, membershipId: ids.facultyM! } });
  const programme = await db.programme.create({ data: { schoolId: C, departmentId: ids.dept!, code: "BSC", name: "ZZ TA003 BSc Physics", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", stream: "SCIENCE" }, select: { id: true } });
  // Its pass rules saved (TA-070, the owner's choice): no scheme is read on a fallback, so the suite names its 40 internal.
  const scheme = await db.scheme.create({ data: { schoolId: C, programmeId: programme.id, name: "ZZ TA003 scheme", effectiveYear: 2025, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 0, maxTermCredits: 30 }) }, select: { id: true } });
  const course = await db.course.create({ data: { schoolId: C, schemeId: scheme.id, code: "PHY101", name: "ZZ TA003 Mechanics", semester: 1, creditsL: 4, kind: "CORE", outcomes: JSON.stringify([{ code: "CO1", text: "ZZ the course's outcome" }]) }, select: { id: true } });
  ids.term = (await db.academicTerm.create({ data: { schoolId: C, name: "ZZ TA003 term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -40), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -50), registrationClosesOn: addDaysToKey(TODAY, -30) }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: C, name: "ZZ TA003 FY BSc A", gradeLevel: "1", subject: "BSC", joinCode: classCode() }, select: { id: true } });
  const division = await db.division.create({ data: { schoolId: C, classId: klass.id, programmeId: programme.id, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } });
  ids.offering = (await db.courseOffering.create({ data: { schoolId: C, termId: ids.term!, courseId: course.id, divisionId: division.id, facultyMembershipId: ids.facultyM!, lectureHours: 4 }, select: { id: true } })).id;
  for (const [n, who] of [[1, "leaver"], [2, "stayer"]] as const) {
    await db.studentProgramme.create({ data: { schoolId: C, studentMembershipId: ids[`${who}M`]!, programmeId: programme.id, schemeId: scheme.id, entryYear: 2026, divisionId: division.id } });
    await db.enrollment.create({ data: { schoolId: C, classId: klass.id, studentMembershipId: ids[`${who}M`]!, rollNumber: n } });
    await db.courseRegistration.create({ data: { schoolId: C, studentMembershipId: ids[`${who}M`]!, offeringId: ids.offering!, termId: ids.term!, kind: "CORE" } });
  }
  // The admission's own row, the one thing the leaving does close.
  await db.programmeEnrolment.create({ data: { schoolId: C, studentMembershipId: ids.leaverM!, programmeId: programme.id, yearOfEntry: 2026, category: "OPEN", quota: "INSTITUTE" } });

  // A lecture three days ago, marked with both present; a lecture today, not yet marked.
  const earlier = await db.lecture.create({ data: { schoolId: C, offeringId: ids.offering!, dateKey: addDaysToKey(TODAY, -3), startMinute: 540, endMinute: 590 }, select: { id: true } });
  ids.todaysLecture = (await db.lecture.create({ data: { schoolId: C, offeringId: ids.offering!, dateKey: TODAY, startMinute: 540, endMinute: 590 }, select: { id: true } })).id;
  await markLecture(await as("faculty", "FACULTY"), earlier.id, { clientId: `zz-ta003-${STAMP}`, entries: [{ studentMembershipId: ids.leaverM!, status: "PRESENT" }, { studentMembershipId: ids.stayerM!, status: "PRESENT" }] });

  before.departmentStudents = (await academicsStructure(await as("admin", "ADMIN"))).departments.find((d) => d.id === ids.dept)!.students;
  before.sheet = (await lectureSheet(await as("faculty", "FACULTY"), ids.todaysLecture!)).entries.map((e) => e.name);

  // The office records the leaving, with yesterday as the last day (the LEAVING clearance has nothing owed or out).
  const leaving = await leaveCollege(await as("admin", "ADMIN"), ids.leaverM!, { leftOn: YESTERDAY, reason: "LEFT" });
  const membership = await db.membership.findUniqueOrThrow({ where: { id: ids.leaverM }, select: { leftAt: true } });
  left = {
    leftAt: membership.leftAt,
    classEnrolment: (await db.enrollment.findFirst({ where: { studentMembershipId: ids.leaverM }, select: { status: true } }))?.status ?? null,
    admission: (await db.programmeEnrolment.findFirst({ where: { studentMembershipId: ids.leaverM }, select: { status: true } }))?.status ?? null,
    alumnus: leaving.alumnus,
  };

  // What each reader says the day after.
  sheetAfter = (await lectureSheet(await as("faculty", "FACULTY"), ids.todaysLecture!)).entries.map((e) => e.name);
  reportAfter = (await attendanceReport(await as("admin", "ADMIN"), { termId: ids.term! })).rows.map((r) => r.name);
  eligibilityAfter = (await eligibilityList(await as("admin", "ADMIN"), ids.term!)).rows.map((r) => r.name);
  departmentStudentsAfter = (await academicsStructure(await as("admin", "ADMIN"))).departments.find((d) => d.id === ids.dept)!.students;

  // A component marked for everyone still studying: the HOD countersigns it.
  const faculty = await as("faculty", "FACULTY");
  // Weight 40: the scheme's saved internal maximum (TA-070).
  const component = await saveComponent(faculty, ids.offering!, { name: "ZZ TA003 unit test", kind: "UNIT_TEST", maxMarks: 40, weight: 40, coCodes: ["CO1"] });
  await saveInternalMarks(faculty, ids.offering!, { componentId: component.id, entries: [{ studentMembershipId: ids.stayerM!, marks: 30 }] });
  countersign = await settle(async () => moderateComponent(await as("hod", "HOD"), component.id));
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = [ids.college].filter((x): x is string => Boolean(x));
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: userIds } }] } });
  await db.invite.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-003: a student who has left the college is on none of the lists of who studies here", () => {
  it("arrange: two students were seated and registered, and the leaving went through — last day yesterday, class enrolment ended, the admission's row closed, an alumnus opened", () => {
    expect(before).toEqual({ departmentStudents: 2, sheet: ["ZZ TA003 Leaver", "ZZ TA003 Stayer"] });
    expect(left.leftAt).not.toBeNull();
    expect({ classEnrolment: left.classEnrolment, admission: left.admission, alumnus: left.alumnus }).toEqual({ classEnrolment: "REMOVED", admission: "LEFT", alumnus: true });
  });

  it("⚠ today's lecture sheet lists the student who is still here, and not the one who left yesterday", () => {
    expect(sheetAfter).toEqual(["ZZ TA003 Stayer"]);
  });

  it("⚠ the term's attendance report and the eligibility list the exam cell reads carry no row for the leaver", () => {
    expect({ attendanceReport: reportAfter, eligibilityList: eligibilityAfter }).toEqual({ attendanceReport: ["ZZ TA003 Stayer"], eligibilityList: ["ZZ TA003 Stayer"] });
  });

  it("⚠ the department's student count falls from two to one", () => {
    expect(departmentStudentsAfter).toBe(1);
  });

  it("⚠ a component marked for everyone still studying can be countersigned: no mark is awaited from the leaver", () => {
    const said = "error" in countersign ? `refused: ${(countersign.error as { key?: string }).key ?? String(countersign.error)}` : `answered ${JSON.stringify(countersign.value)}`;
    expect("value" in countersign && countersign.value.changed, said).toBe(true);
  });
});
