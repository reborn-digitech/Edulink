/**
 * TA-003 (testing analysis of 13 November 2026, High), beyond the regression
 * suite tests/ta-leaver-active-seat.test.ts: what "studying here now" means
 * for a term that has ended, for a leaving recorded before the fix, and what
 * the leaving itself now writes.
 *
 *   - The leaving DROPS the student's registrations of a term that runs on
 *     past their last day and keeps those of a term that had ended; the
 *     seat's status is not written (the owner's decision on R-20).
 *   - A student whose leaving was recorded before (leftAt set, registrations
 *     and seat untouched) is still on no list of a running term and in no
 *     head-count: the readers hold the seat and the registration to leftAt
 *     (studyingOn in src/lib/academics.ts), and a lecture cannot be marked
 *     for them.
 *   - A term that ended before they left keeps them: its attendance report
 *     still lists all three.
 *   - A leaving recorded by mistake and undone puts back the registrations
 *     the leaving dropped, and only those: a course the student had dropped
 *     themselves stays dropped.
 *
 * A scratch ZZ college of this suite's own, made through the operator's
 * createSchool and removed after; nothing of any fixture is read or written.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { academicsStructure } from "@/lib/academics";
import { attendanceReport, lectureSheet, markLecture } from "@/lib/academics-attendance";
import { leaveCollege } from "@/lib/college-records";
import { undoDeparture } from "@/lib/school-record";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-hrb-ta003-${who}-${STAMP}@test.invalid`;
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

const statusOf = async (who: string, offering: string) => (await db.courseRegistration.findFirst({ where: { studentMembershipId: ids[`${who}M`], offeringId: ids[offering] }, select: { status: true } }))?.status ?? null;

let registrations: Record<string, string | null> = {};
let seatAfter: string | null = null;
let auditMeta: Record<string, unknown> = {};
const departmentStudents = { before: -1, after: -1 };
let sheetAfter: string[] = [];
let runningReport: string[] = [];
let endedReport: string[] = [];
let markLegacy: string = "";
let undone: Record<string, unknown> = {};

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ HRB TA003 Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const operator = { user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } } as unknown as ActiveContext;
  const made = await createSchool(operator, { contactEmail: MAIL("office"), timezone: TZ, name: `ZZ HRB TA003 College ${STAMP}`, kind: "COLLEGE", streams: ["SCIENCE"] });
  if (!made.ok) throw new Error(made.errorKey);
  const C = (ids.college = made.schoolId);
  await db.school.update({ where: { id: C }, data: { isTestFixture: true } });

  await person("admin", "ADMIN", "ZZ HRB TA003 Registrar");
  await person("faculty", "FACULTY", "ZZ HRB TA003 Teacher");
  await person("hod", "HOD", "ZZ HRB TA003 Head");
  await person("leaver", "STUDENT", "ZZ HRB TA003 Leaver", 300);
  await person("legacy", "STUDENT", "ZZ HRB TA003 Earlier Leaver", 300);
  await person("stayer", "STUDENT", "ZZ HRB TA003 Stayer", 300);

  ids.dept = (await db.department.create({ data: { schoolId: C, code: "CHE", name: "ZZ HRB TA003 Chemistry", hodMembershipId: ids.hodM }, select: { id: true } })).id;
  await db.departmentFaculty.create({ data: { schoolId: C, departmentId: ids.dept!, membershipId: ids.facultyM! } });
  const programme = await db.programme.create({ data: { schoolId: C, departmentId: ids.dept!, code: "BSCC", name: "ZZ HRB TA003 BSc Chemistry", level: "UG", durationYears: 3, intake: 60, regulator: "UGC", stream: "SCIENCE" }, select: { id: true } });
  const scheme = await db.scheme.create({ data: { schoolId: C, programmeId: programme.id, name: "ZZ HRB TA003 scheme", effectiveYear: 2025 }, select: { id: true } });
  const course = await db.course.create({ data: { schoolId: C, schemeId: scheme.id, code: "CHE101", name: "ZZ HRB TA003 Bonding", semester: 1, creditsL: 4, kind: "CORE", outcomes: JSON.stringify([{ code: "CO1", text: "ZZ the course's outcome" }]) }, select: { id: true } });
  // A term that ended a hundred days ago, and one running today.
  ids.ended = (await db.academicTerm.create({ data: { schoolId: C, name: "ZZ HRB TA003 ended term", academicYear: "2025–26", startsOn: addDaysToKey(TODAY, -220), endsOn: addDaysToKey(TODAY, -100), registrationOpensOn: addDaysToKey(TODAY, -230), registrationClosesOn: addDaysToKey(TODAY, -210) }, select: { id: true } })).id;
  ids.running = (await db.academicTerm.create({ data: { schoolId: C, name: "ZZ HRB TA003 running term", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -40), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -50), registrationClosesOn: addDaysToKey(TODAY, -30) }, select: { id: true } })).id;
  const klass = await db.class.create({ data: { schoolId: C, name: "ZZ HRB TA003 FY BSc", gradeLevel: "1", subject: "BSC", joinCode: classCode() }, select: { id: true } });
  const division = await db.division.create({ data: { schoolId: C, classId: klass.id, programmeId: programme.id, yearOfStudy: 1, academicYear: "2026–27" }, select: { id: true } });
  ids.endedOffering = (await db.courseOffering.create({ data: { schoolId: C, termId: ids.ended!, courseId: course.id, divisionId: division.id, facultyMembershipId: ids.facultyM!, lectureHours: 4 }, select: { id: true } })).id;
  ids.runningOffering = (await db.courseOffering.create({ data: { schoolId: C, termId: ids.running!, courseId: course.id, divisionId: division.id, facultyMembershipId: ids.facultyM!, lectureHours: 4 }, select: { id: true } })).id;
  for (const [n, who] of [[1, "leaver"], [2, "legacy"], [3, "stayer"]] as const) {
    await db.studentProgramme.create({ data: { schoolId: C, studentMembershipId: ids[`${who}M`]!, programmeId: programme.id, schemeId: scheme.id, entryYear: 2025, divisionId: division.id } });
    await db.enrollment.create({ data: { schoolId: C, classId: klass.id, studentMembershipId: ids[`${who}M`]!, rollNumber: n } });
    for (const [offering, term] of [["endedOffering", "ended"], ["runningOffering", "running"]] as const) {
      await db.courseRegistration.create({ data: { schoolId: C, studentMembershipId: ids[`${who}M`]!, offeringId: ids[offering]!, termId: ids[term]!, kind: "CORE" } });
    }
  }
  ids.todaysLecture = (await db.lecture.create({ data: { schoolId: C, offeringId: ids.runningOffering!, dateKey: TODAY, startMinute: 540, endMinute: 590 }, select: { id: true } })).id;

  departmentStudents.before = (await academicsStructure(await as("admin", "ADMIN"))).departments.find((d) => d.id === ids.dept)!.students;

  // The leaving as the office records it now, yesterday the last day.
  await leaveCollege(await as("admin", "ADMIN"), ids.leaverM!, { leftOn: YESTERDAY, reason: "LEFT" });
  // A leaving recorded before this fix: the membership's last day written, nothing else of the academics touched.
  await db.membership.update({ where: { id: ids.legacyM }, data: { leftAt: new Date(`${YESTERDAY}T12:00:00Z`) } });

  registrations = {
    leaverEnded: await statusOf("leaver", "endedOffering"),
    leaverRunning: await statusOf("leaver", "runningOffering"),
    stayerRunning: await statusOf("stayer", "runningOffering"),
  };
  seatAfter = (await db.studentProgramme.findUnique({ where: { studentMembershipId: ids.leaverM }, select: { status: true } }))?.status ?? null;
  const row = await db.auditLog.findFirst({ where: { schoolId: C, action: "student.leave", targetId: ids.leaverM }, select: { meta: true } });
  auditMeta = row?.meta ? (JSON.parse(row.meta) as Record<string, unknown>) : {};

  departmentStudents.after = (await academicsStructure(await as("admin", "ADMIN"))).departments.find((d) => d.id === ids.dept)!.students;
  sheetAfter = (await lectureSheet(await as("faculty", "FACULTY"), ids.todaysLecture!)).entries.map((e) => e.name);
  runningReport = (await attendanceReport(await as("admin", "ADMIN"), { termId: ids.running! })).rows.map((r) => r.name);
  endedReport = (await attendanceReport(await as("admin", "ADMIN"), { termId: ids.ended! })).rows.map((r) => r.name).sort();
  try {
    await markLecture(await as("faculty", "FACULTY"), ids.todaysLecture!, { clientId: `zz-hrb-ta003-${STAMP}`, entries: [{ studentMembershipId: ids.legacyM!, status: "PRESENT" }] });
    markLegacy = "marked";
  } catch (error) {
    markLegacy = `refused: ${(error as { key?: string }).key ?? String(error)}`;
  }

  // A leaving recorded by mistake, then undone by the office. Made after the counts above, so they stay three students.
  await person("mistaken", "STUDENT", "ZZ HRB TA003 Mistaken Leaver", 300);
  const seatOf = await db.studentProgramme.findUniqueOrThrow({ where: { studentMembershipId: ids.stayerM }, select: { programmeId: true, schemeId: true, divisionId: true } });
  await db.studentProgramme.create({ data: { schoolId: C, studentMembershipId: ids.mistakenM!, programmeId: seatOf.programmeId, schemeId: seatOf.schemeId, entryYear: 2025, divisionId: seatOf.divisionId } });
  const elective = await db.course.create({ data: { schoolId: C, schemeId: seatOf.schemeId, code: "CHE102", name: "ZZ HRB TA003 Elective", semester: 1, creditsL: 2, kind: "ELECTIVE", outcomes: JSON.stringify([{ code: "CO1", text: "ZZ the elective's outcome" }]) }, select: { id: true } });
  ids.electiveOffering = (await db.courseOffering.create({ data: { schoolId: C, termId: ids.running!, courseId: elective.id, divisionId: seatOf.divisionId, facultyMembershipId: ids.facultyM!, lectureHours: 2 }, select: { id: true } })).id;
  for (const [offering, term, status] of [["endedOffering", "ended", "REGISTERED"], ["runningOffering", "running", "REGISTERED"], ["electiveOffering", "running", "DROPPED"]] as const) {
    await db.courseRegistration.create({ data: { schoolId: C, studentMembershipId: ids.mistakenM!, offeringId: ids[offering]!, termId: ids[term]!, kind: "CORE", status } });
  }
  await leaveCollege(await as("admin", "ADMIN"), ids.mistakenM!, { leftOn: YESTERDAY, reason: "LEFT" });
  const whileLeft = await statusOf("mistaken", "runningOffering");
  const result = await undoDeparture(await as("admin", "ADMIN"), ids.mistakenM!);
  const undoRow = await db.auditLog.findFirst({ where: { schoolId: C, action: "student.leave.undo", targetId: ids.mistakenM }, select: { meta: true } });
  undone = {
    ok: result.ok,
    whileLeft,
    ended: await statusOf("mistaken", "endedOffering"),
    running: await statusOf("mistaken", "runningOffering"),
    ownDrop: await statusOf("mistaken", "electiveOffering"),
    restored: undoRow?.meta ? (JSON.parse(undoRow.meta) as { restoredRegistrations?: number }).restoredRegistrations : undefined,
    onSheet: (await lectureSheet(await as("faculty", "FACULTY"), ids.todaysLecture!)).entries.some((e) => e.name === "ZZ HRB TA003 Mistaken Leaver"),
  };
}, 120_000);

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

describe("TA-003: studying here now, for a running term, a finished one and an earlier leaving", () => {
  it("TA-003: the leaving drops the registration of the term still running and keeps the finished term's; the seat's status is not written (R-20)", () => {
    expect(registrations).toEqual({ leaverEnded: "REGISTERED", leaverRunning: "DROPPED", stayerRunning: "REGISTERED" });
    expect(seatAfter).toBe("ACTIVE");
    expect(auditMeta).toMatchObject({ droppedRegistrations: 1 });
  });

  it("TA-003: the department counts the one student still here, not the leaver nor the one whose leaving was recorded before the fix", () => {
    expect(departmentStudents).toEqual({ before: 3, after: 1 });
  });

  it("TA-003: an earlier leaver, registrations untouched, is on neither today's lecture sheet nor the running term's report, and cannot be marked", () => {
    expect({ sheet: sheetAfter, report: runningReport }).toEqual({ sheet: ["ZZ HRB TA003 Stayer"], report: ["ZZ HRB TA003 Stayer"] });
    expect(markLegacy).toBe("refused: academics.refuseNotRegistered");
  });

  it("TA-003: a term that ended before they left keeps all three on its attendance report", () => {
    expect(endedReport).toEqual(["ZZ HRB TA003 Earlier Leaver", "ZZ HRB TA003 Leaver", "ZZ HRB TA003 Stayer"]);
  });

  it("TA-003: undoing a leaving recorded by mistake registers the student again for the running term's courses the leaving dropped, and not for one they had dropped themselves", () => {
    expect(undone).toEqual({ ok: true, whileLeft: "DROPPED", ended: "REGISTERED", running: "REGISTERED", ownDrop: "DROPPED", restored: 1, onSheet: true });
  });
});
