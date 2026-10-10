import "server-only";
import type { CourseAttendance, FacultyHome, FamilyAcademics, HodHome, StudentAcademics } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertModuleOn, isModuleOn } from "./modules";
import { resultsForDepartment } from "./exam-cell-marks";
import { listProjects } from "./placement-projects";
import { assertGuardianAccess } from "./tenancy";
import { parentMaySee } from "./student-consent";
import { todayKey, weekdayOfKey } from "./dates";
import { academicsCaller, academicsSettings, currentTerm, departmentOfMember, divisionNames, hodDepartment, loadAndRatios, nameOf, namesOf, termView, timetableFor, zoneOf, type Caller } from "./academics";
import { attendanceRows, condonationsFor, lecturesFor } from "./academics-attendance";
import { releasedMarksFor, toModerateFor } from "./academics-assessment";
import { coverageBy } from "./academics-coursefile";
import { registrationViewFor } from "./academics-registration";
import type { ActiveContext } from "./session";

/**
 * THE HOMES of the college's academics (4 October 2026): the faculty
 * member's day (/faculty), the HOD's department (/hod), the student's
 * academics (/student/academics) and a guardian's view of a child's
 * attendance (/parent/academics) — each one read, built from the other
 * academics files, on the web and the phone alike.
 */

/** One student's row on one course, without whose it is (the reader already knows). */
const courseOnly = (r: CourseAttendance): CourseAttendance => ({ offeringId: r.offeringId, courseCode: r.courseCode, courseName: r.courseName, held: r.held, attended: r.attended, percent: r.percent, threshold: r.threshold, remaining: r.remaining, canMiss: r.canMiss, condoned: r.condoned, eligible: r.eligible });

async function offeringSummaries(c: Caller, where: Record<string, unknown>, termId: string | null, today: string, term: { startsOn: string; endsOn: string } | null) {
  if (!termId) return [];
  const offerings = await db.courseOffering.findMany({
    where: { schoolId: c.schoolId, termId, ...where },
    select: { id: true, divisionId: true, facultyMembershipId: true, course: { select: { code: true, name: true } }, lock: { select: { id: true } }, components: { select: { moderatedAt: true, releasedAt: true } }, _count: { select: { registrations: { where: { status: "REGISTERED" } } } } },
    orderBy: { course: { code: "asc" } },
  });
  const ids = offerings.map((o) => o.id);
  const [cov, divisions, attendance, names] = await Promise.all([
    coverageBy(c.schoolId, ids, term, today),
    divisionNames(offerings.map((o) => o.divisionId)),
    ids.length ? attendanceRows(c.schoolId, termId, { offeringIds: ids }) : Promise.resolve([]),
    namesOf(offerings.map((o) => o.facultyMembershipId)),
  ]);
  return offerings.map((o) => {
    const k = cov.get(o.id) ?? { planned: 0, taught: 0, behind: false };
    return {
      offeringId: o.id,
      courseCode: o.course.code,
      courseName: o.course.name,
      divisionName: o.divisionId ? (divisions.get(o.divisionId) ?? null) : null,
      registered: o._count.registrations,
      planned: k.planned,
      taught: k.taught,
      behind: k.behind,
      components: o.components.length,
      moderated: o.components.filter((x) => x.moderatedAt).length,
      released: o.components.filter((x) => x.releasedAt).length,
      locked: Boolean(o.lock),
      defaulters: attendance.filter((a) => a.offeringId === o.id && !a.eligible).length,
      facultyName: o.facultyMembershipId ? (names.get(o.facultyMembershipId) ?? null) : null,
    };
  });
}

export async function facultyHome(ctx: ActiveContext): Promise<FacultyHome> {
  const c = await academicsCaller(ctx, ["FACULTY", "HOD"]);
  const today = todayKey(c.timeZone);
  const [me, term, settings, deptId] = await Promise.all([
    db.membership.findUniqueOrThrow({ where: { id: c.membershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
    currentTerm(c.schoolId, today),
    academicsSettings(c.schoolId),
    departmentOfMember(c.schoolId, c.membershipId),
  ]);
  const [dept, todayLectures, offerings, groups, toModerate] = await Promise.all([
    deptId ? db.department.findUnique({ where: { id: deptId }, select: { name: true } }) : Promise.resolve(null),
    lecturesFor(c, today),
    offeringSummaries(c, { facultyMembershipId: c.membershipId }, term?.id ?? null, today, term),
    db.mentoringGroup.count({ where: { schoolId: c.schoolId, facultyMembershipId: c.membershipId, ...(term ? { termId: term.id } : {}) } }),
    toModerateFor(c),
  ]);
  const hours = term ? (await db.courseOffering.findMany({ where: { schoolId: c.schoolId, termId: term.id, facultyMembershipId: c.membershipId }, select: { lectureHours: true, tutorialHours: true, practicalHours: true } })).reduce((n, o) => n + o.lectureHours + o.tutorialHours + o.practicalHours, 0) : 0;
  return {
    name: nameOf(me.user),
    departmentName: dept?.name ?? null,
    term: term ? termView(term, today) : null,
    today: todayLectures,
    offerings: offerings.map((o) => ({ offeringId: o.offeringId, courseCode: o.courseCode, courseName: o.courseName, divisionName: o.divisionName, registered: o.registered, planned: o.planned, taught: o.taught, behind: o.behind, components: o.components, moderated: o.moderated, released: o.released, locked: o.locked, defaulters: o.defaulters })),
    hours,
    settings,
    mentoringGroups: groups,
    toModerate,
  };
}

/** The department's results for the latest term with a PUBLISHED result run, read through the exams module; null before any. */
async function departmentResults(schoolId: string, departmentId: string): Promise<HodHome["results"]> {
  if (!(await isModuleOn(schoolId, "EXAMS"))) return null;
  const latest = await db.resultRun.findFirst({ where: { schoolId, status: "PUBLISHED" }, orderBy: { publishedAt: "desc" }, select: { session: { select: { termId: true } } } });
  if (!latest) return null;
  const term = await db.academicTerm.findFirst({ where: { id: latest.session.termId, schoolId }, select: { id: true, name: true } });
  if (!term) return null;
  const r = await resultsForDepartment(schoolId, departmentId, term.id);
  if (r.appeared === 0) return null;
  return { termName: term.name, ...r };
}

/** The department's students' projects (the placement module's), or none while PLACEMENT is off. */
async function departmentProjects(ctx: ActiveContext): Promise<HodHome["projects"]> {
  if (!ctx.schoolId || !(await isModuleOn(ctx.schoolId, "PLACEMENT"))) return [];
  const { projects } = await listProjects(ctx);
  return projects.slice(0, 20).map((p) => ({ title: p.title, studentName: p.students.map((s) => s.name).join(", ") }));
}

export async function hodHome(ctx: ActiveContext): Promise<HodHome> {
  const c = await academicsCaller(ctx, ["HOD"]);
  const today = todayKey(c.timeZone);
  const [dept, term, settings] = await Promise.all([hodDepartment(c), currentTerm(c.schoolId, today), academicsSettings(c.schoolId)]);
  // Whether the projects card is drawn at all (DS-7, 10 Oct 2026): the card's page says "Placement is not switched on" otherwise.
  const placementOn = await isModuleOn(c.schoolId, "PLACEMENT");
  if (!dept) return { department: null, term: term ? termView(term, today) : null, load: [], ratio: [], offerings: [], defaulters: 0, condonationsWaiting: 0, mentoringGroups: 0, mentees: 0, resultsAvailable: false, projects: [], placementOn };
  const deptWhere = { course: { scheme: { programme: { departmentId: dept.id } } } };
  const [{ load, ratios }, offerings, condonations, staff] = await Promise.all([
    loadAndRatios(c.schoolId, term?.id ?? null, settings, dept.id),
    offeringSummaries(c, deptWhere, term?.id ?? null, today, term),
    condonationsFor(c, "OPEN"),
    db.departmentFaculty.findMany({ where: { departmentId: dept.id }, select: { membershipId: true } }),
  ]);
  const mentors = [...staff.map((s) => s.membershipId), c.membershipId];
  const [results, projects] = await Promise.all([departmentResults(c.schoolId, dept.id), departmentProjects(ctx)]);
  const [groups, mentees] = await Promise.all([
    db.mentoringGroup.count({ where: { schoolId: c.schoolId, facultyMembershipId: { in: mentors }, ...(term ? { termId: term.id } : {}) } }),
    db.mentoringMember.count({ where: { schoolId: c.schoolId, group: { facultyMembershipId: { in: mentors }, ...(term ? { termId: term.id } : {}) } } }),
  ]);
  return {
    department: { id: dept.id, code: dept.code, name: dept.name },
    term: term ? termView(term, today) : null,
    load,
    ratio: ratios,
    offerings,
    defaulters: offerings.reduce((n, o) => n + o.defaulters, 0),
    condonationsWaiting: condonations.items.length,
    mentoringGroups: groups,
    mentees,
    // The exam cell's published results for the department (exam-cell-marks.ts resultsForDepartment), latest term first.
    resultsAvailable: results !== null,
    results,
    // Students' projects with their guides (the placement module's listProjects), while PLACEMENT is on.
    projects,
    placementOn,
  };
}

export async function studentAcademics(ctx: ActiveContext): Promise<StudentAcademics> {
  const c = await academicsCaller(ctx, ["STUDENT"]);
  const today = todayKey(c.timeZone);
  const registration = await registrationViewFor(c);
  const termId = registration.term?.id ?? null;
  const [week, attendance, condonations, marks, mentor] = await Promise.all([
    timetableFor(c, termId ? { termId } : {}),
    termId ? attendanceRows(c.schoolId, termId, { studentMembershipId: c.membershipId }) : Promise.resolve([]),
    condonationsFor(c, "ALL"),
    termId ? releasedMarksFor(c.membershipId, termId) : Promise.resolve([]),
    db.mentoringMember.findFirst({ where: { studentMembershipId: c.membershipId, ...(termId ? { group: { termId } } : {}) }, select: { group: { select: { name: true, facultyMembershipId: true } } }, orderBy: { id: "desc" } }),
  ]);
  const mentorName = mentor ? (await namesOf([mentor.group.facultyMembershipId])).get(mentor.group.facultyMembershipId) : null;
  const weekday = weekdayOfKey(today);
  return {
    registration,
    today: week.cells.filter((x) => x.weekday === weekday),
    week,
    attendance: attendance.map(courseOnly),
    condonations: condonations.items,
    marks,
    mentor: mentor ? { groupName: mentor.group.name, facultyName: mentorName ?? "" } : null,
  };
}

/**
 * A guardian's view of a child's lecture attendance: a minor's guardian
 * sees it, as at a school; an adult student's only while they have granted
 * ATTENDANCE (the consent record). The college must have ACADEMICS on.
 */
export async function familyAcademics(ctx: ActiveContext, childId?: string): Promise<FamilyAcademics> {
  // The guardianship, found by the person's own id, is the fence: the door asks for PARENT; the page for a guardian.
  const links = await db.guardianship.findMany({ where: { parentUserId: ctx.user.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null, academicSeat: { isNot: null } } }, select: { studentMembershipId: true, student: { select: { schoolId: true, user: { select: { name: true, preferredName: true } } } } } });
  const children = links.map((l) => ({ studentMembershipId: l.studentMembershipId, name: nameOf(l.student.user), schoolId: l.student.schoolId }));
  const chosen = childId ? children.find((ch) => ch.studentMembershipId === childId) : children[0];
  const list = children.map(({ studentMembershipId, name }) => ({ studentMembershipId, name }));
  if (childId && !chosen) {
    // The guardian's own child with no academic seat yet (a college child not seated, a school child) has no
    // lectures, which is the empty state, not "not found"; anybody else's id is still not found (integration,
    // 11 Oct 2026; the family-gaps report: /parent/academics?child= answered 404 for an unseated child).
    const own = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, studentMembershipId: childId, status: "ACTIVE" }, select: { id: true } });
    if (!own) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    return { children: list, childId: null, allowed: false, attendance: [] };
  }
  if (!chosen) return { children: list, childId: null, allowed: false, attendance: [] };
  await assertModuleOn(chosen.schoolId, "ACADEMICS");
  if (!(await parentMaySee(chosen.studentMembershipId, "ATTENDANCE"))) return { children: list, childId: chosen.studentMembershipId, allowed: false, attendance: [] };
  // The grant is checked above; the guardianship itself is the tenancy's fence.
  await assertGuardianAccess(ctx.user.id, chosen.studentMembershipId, "ATTENDANCE");
  const today = todayKey(await zoneOf(chosen.schoolId));
  const term = await currentTerm(chosen.schoolId, today);
  const rows = term ? await attendanceRows(chosen.schoolId, term.id, { studentMembershipId: chosen.studentMembershipId }) : [];
  return { children: list, childId: chosen.studentMembershipId, allowed: true, attendance: rows.map(courseOnly) };
}
