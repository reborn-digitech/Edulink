/**
 * THE ZZ ACADEMICS at ZZ Vidya College (the college's academics, 4 October
 * 2026), built by `npm run zz:fixtures` after the colleges.
 *
 *   Physics (HOD zz.hod01, zz.faculty01) and Chemistry (zz.faculty02); BSc
 *   Physics and BSc Chemistry; the BSc Physics scheme (internal 40 of 100,
 *   14–26 credits a term) with eight courses over semesters 1 and 2; this
 *   term with registration open (its dates move with today); the college's
 *   bells if it has none; two rooms; division "ZZ FY BSc Physics A" with
 *   zz.cstudent01–03 seated on rolls 1–3, each registered on the four
 *   semester-1 offerings — PHY101 (zz.faculty01), CHE101 (zz.faculty02),
 *   PHY103 the shared elective (zz.hod01) and MAT101 (zz.faculty02).
 *
 *   PHY101 has twenty past lectures: cstudent01 at every one, cstudent02
 *   missing three (85 %), cstudent03 missing seven (65 %, under the 75 %
 *   rule and at the department's floor) — and cstudent03's condonation ask
 *   waits for the HOD. PHY101's unit test and assignment (weights 20 + 20 =
 *   the scheme's 40) are entered by zz.faculty01, countersigned, released
 *   and locked by zz.hod01, so InternalLock holds its totals; CHE101's unit
 *   test is entered and waits for a countersign. PHY101's course file has a
 *   twelve-week plan with six taught and a resource; zz.faculty01 mentors the
 *   three students; the office has asked for a late registration for
 *   cstudent02.
 *
 * Every id is fixed (src/lib/api-catalog/academics-fixture.ts). Re-run safe:
 * every row is written by its id or its unique key, and nothing is deleted
 * but this builder's own marks and attendance on its own fixed rows, so
 * another module's rows that point at these stay.
 */
import type { PrismaClient } from "@prisma/client";
import { ACADEMICS_FIXTURE as F, ACADEMICS_FIXTURE_SETTINGS } from "../src/lib/api-catalog/academics-fixture";
import { internalTotalHundredths } from "../src/lib/academics-rules";
import { classCode } from "../src/lib/codes";

const DAY = 86_400_000;
/** A day in India, `offsetDays` from today. */
function ist(offsetDays: number): string {
  return new Date(Date.now() + 5.5 * 3_600_000 + offsetDays * DAY).toISOString().slice(0, 10);
}
const weekdayOf = (key: string) => new Date(`${key}T00:00:00Z`).getUTCDay();

const GRADES = [
  { grade: "O", points: 10, minPercent: 90 },
  { grade: "A+", points: 9, minPercent: 80 },
  { grade: "A", points: 8, minPercent: 70 },
  { grade: "B+", points: 7, minPercent: 60 },
  { grade: "B", points: 6, minPercent: 50 },
  { grade: "C", points: 5, minPercent: 45 },
  { grade: "P", points: 4, minPercent: 40 },
  { grade: "F", points: 0, minPercent: 0 },
];
const RULES = { minPercentPerCourse: 40, atktLimit: 4, totalCredits: 160, internalMax: 40, externalMax: 60, minTermCredits: 14, maxTermCredits: 26 };
const CO = (n: number, text: string) => ({ code: `CO${n}`, text });

/** The eight courses: [code, name, semester, L, T, P, kind, outcomes]. Courses 1–4 are semester 1. */
const COURSES: [string, string, number, number, number, number, string, { code: string; text: string }[]][] = [
  ["PHY101", "ZZ Mechanics", 1, 3, 0, 1, "CORE", [CO(1, "Apply Newton's laws to particles and rigid bodies."), CO(2, "Use conservation laws to solve problems."), CO(3, "Measure and report physical quantities with their errors.")]],
  ["CHE101", "ZZ General Chemistry", 1, 3, 0, 1, "CORE", [CO(1, "Explain atomic structure and bonding."), CO(2, "Balance and classify chemical reactions.")]],
  ["PHY103", "ZZ Basic Electronics", 1, 2, 0, 1, "ELECTIVE", [CO(1, "Analyse simple circuits."), CO(2, "Build and test a rectifier.")]],
  ["MAT101", "ZZ Calculus", 1, 4, 2, 0, "CORE", [CO(1, "Differentiate and integrate functions of one variable.")]],
  ["PHY201", "ZZ Waves and Oscillations", 2, 3, 0, 1, "CORE", [CO(1, "Describe simple harmonic motion.")]],
  ["CHE201", "ZZ Organic Chemistry I", 2, 3, 0, 1, "CORE", [CO(1, "Name and draw organic compounds.")]],
  ["PHY203", "ZZ Astronomy", 2, 2, 0, 1, "ELECTIVE", [CO(1, "Describe the solar system.")]],
  ["MAT201", "ZZ Linear Algebra", 2, 4, 2, 0, "CORE", [CO(1, "Solve systems of linear equations.")]],
];

export async function buildAcademics(db: PrismaClient): Promise<{ lectures: number; locked: boolean } | null> {
  const vidya = await db.school.findUnique({ where: { slug: "zz-vidya-college" }, select: { id: true } });
  if (!vidya) return null;
  const s = vidya.id;
  const member = async (email: string, role: string) => {
    const m = await db.membership.findFirst({ where: { schoolId: s, role, status: "ACTIVE", user: { email } }, select: { id: true, userId: true } });
    if (!m) throw new Error(`zz-academics: ${email} (${role}) is missing at Vidya; run the colleges first`);
    return m;
  };
  const [f1, f2, hod, admin, st1, st2, st3] = await Promise.all([
    member("zz.faculty01@zz.test", "FACULTY"),
    member("zz.faculty02@zz.test", "FACULTY"),
    member("zz.hod01@zz.test", "HOD"),
    member("zz.cadmin@zz.test", "ADMIN"),
    member("zz.cstudent01@zz.test", "STUDENT"),
    member("zz.cstudent02@zz.test", "STUDENT"),
    member("zz.cstudent03@zz.test", "STUDENT"),
  ]);
  const students = [st1, st2, st3];

  await db.academicsSettings.upsert({ where: { schoolId: s }, create: { schoolId: s, ...ACADEMICS_FIXTURE_SETTINGS }, update: ACADEMICS_FIXTURE_SETTINGS });

  // Departments and who is in them.
  await db.department.upsert({ where: { id: F.department(1) }, create: { id: F.department(1), schoolId: s, code: "PHY", name: "ZZ Physics", hodMembershipId: hod.id, condoneFloorPercent: 65 }, update: { hodMembershipId: hod.id, condoneFloorPercent: 65 } });
  await db.department.upsert({ where: { id: F.department(2) }, create: { id: F.department(2), schoolId: s, code: "CHE", name: "ZZ Chemistry", condoneFloorPercent: 65 }, update: {} });
  for (const [m, d] of [[f1.id, F.department(1)], [hod.id, F.department(1)], [f2.id, F.department(2)]] as const) {
    await db.departmentFaculty.upsert({ where: { membershipId: m }, create: { schoolId: s, membershipId: m, departmentId: d }, update: { departmentId: d } });
  }

  // Programmes, their outcomes, the scheme and its courses.
  const exits = JSON.stringify([{ afterYear: 1, award: "CERTIFICATE", credits: 40 }, { afterYear: 2, award: "DIPLOMA", credits: 80 }, { afterYear: 3, award: "DEGREE", credits: 120 }, { afterYear: 4, award: "HONOURS_DEGREE", credits: 160 }]);
  for (const [n, code, name, dept] of [[1, "BSCPHY", "ZZ BSc Physics", F.department(1)], [2, "BSCCHE", "ZZ BSc Chemistry", F.department(2)]] as const) {
    await db.programme.upsert({ where: { id: F.programme(n) }, create: { id: F.programme(n), schoolId: s, departmentId: dept, code, name, level: "UG", durationYears: 4, intake: 60, regulator: "UGC", attendanceThreshold: 75, exitPoints: exits }, update: { attendanceThreshold: 75, exitPoints: exits } });
  }
  const pos = [["PO1", "Disciplinary knowledge of physics."], ["PO2", "Problem solving with quantitative reasoning."], ["PO3", "Experimental and laboratory skills."]];
  for (const [code, text] of pos) await db.programmeOutcome.upsert({ where: { programmeId_code: { programmeId: F.programme(1), code: code! } }, create: { schoolId: s, programmeId: F.programme(1), code: code!, text: text! }, update: { text: text! } });
  await db.scheme.upsert({ where: { id: F.scheme(1) }, create: { id: F.scheme(1), schoolId: s, programmeId: F.programme(1), name: "ZZ SPPU NEP 2024", effectiveYear: 2024, gradingTable: JSON.stringify(GRADES), passingRules: JSON.stringify(RULES) }, update: { gradingTable: JSON.stringify(GRADES), passingRules: JSON.stringify(RULES) } });
  for (const [i, [code, name, semester, l, t, p, kind, outcomes]] of COURSES.entries()) {
    await db.course.upsert({ where: { id: F.course(i + 1) }, create: { id: F.course(i + 1), schoolId: s, schemeId: F.scheme(1), code, name, semester, creditsL: l, creditsT: t, creditsP: p, kind, outcomes: JSON.stringify(outcomes) }, update: { name, semester, creditsL: l, creditsT: t, creditsP: p, kind, outcomes: JSON.stringify(outcomes) } });
  }
  await db.courseOutcomeMap.createMany({ data: [["CO1", "PO1", 3], ["CO2", "PO2", 2], ["CO3", "PO3", 3], ["CO1", "PO2", 1]].map(([co, po, level]) => ({ schoolId: s, courseId: F.course(1), coCode: co as string, poCode: po as string, level: level as number })), skipDuplicates: true });

  // This term, its dates moving with today: started 80 days ago, ends in 57, registration open until 27 days from now.
  const term = { name: "ZZ Odd term", academicYear: "2026–27", startsOn: ist(-80), endsOn: ist(57), registrationOpensOn: ist(-94), registrationClosesOn: ist(27) };
  await db.academicTerm.upsert({ where: { id: F.term }, create: { id: F.term, schoolId: s, ...term }, update: term });

  // The college's bells, when it has none: five fifty-minute periods from 9:00.
  let periods = await db.timetablePeriod.findMany({ where: { schoolId: s, archivedAt: null, kind: "LESSON" }, orderBy: { position: "asc" } });
  if (periods.length < 3) {
    for (let k = 0; k < 5; k += 1) {
      const start = 540 + k * 60;
      await db.timetablePeriod.create({ data: { schoolId: s, name: `ZZ Lecture ${k + 1}`, startMinute: start, endMinute: start + 50, kind: "LESSON", position: k + 1 } });
    }
    periods = await db.timetablePeriod.findMany({ where: { schoolId: s, archivedAt: null, kind: "LESSON" }, orderBy: { position: "asc" } });
  }
  const [p1, p2, p3] = periods as [typeof periods[number], typeof periods[number], typeof periods[number]];

  await db.room.upsert({ where: { id: F.room(1) }, create: { id: F.room(1), schoolId: s, name: "ZZ Room 101", capacity: 60, kind: "CLASSROOM" }, update: { capacity: 60 } });
  await db.room.upsert({ where: { id: F.room(2) }, create: { id: F.room(2), schoolId: s, name: "ZZ Physics Lab", capacity: 30, kind: "LAB" }, update: { capacity: 30 } });

  // The division: a class of the college's and its Division row.
  let division = await db.division.findUnique({ where: { id: F.division(1) }, select: { classId: true } });
  if (!division) {
    const klass = await db.class.create({ data: { schoolId: s, name: "ZZ FY BSc Physics A", gradeLevel: "1", subject: "BSCPHY", joinCode: classCode() }, select: { id: true } });
    await db.division.create({ data: { id: F.division(1), schoolId: s, classId: klass.id, programmeId: F.programme(1), yearOfStudy: 1, academicYear: "2026–27" } });
    division = { classId: klass.id };
  }
  for (const [i, st] of students.entries()) {
    const seat = { programmeId: F.programme(1), schemeId: F.scheme(1), entryYear: 2026, yearOfStudy: 1, semester: 1, divisionId: F.division(1), prn: `ZZV2026${String(i + 1).padStart(3, "0")}`, status: "ACTIVE" };
    await db.studentProgramme.upsert({ where: { studentMembershipId: st.id }, create: { schoolId: s, studentMembershipId: st.id, ...seat }, update: seat });
    await db.enrollment.upsert({ where: { classId_studentMembershipId: { classId: division.classId, studentMembershipId: st.id } }, create: { schoolId: s, classId: division.classId, studentMembershipId: st.id, rollNumber: i + 1 }, update: { status: "ACTIVE", removedAt: null, rollNumber: i + 1 } });
  }

  // The term's offerings, their hours on the grid, and the three students on all four.
  const offerings: [number, number, string | null, string, number, number, number, string | null, number | null][] = [
    [1, 1, F.division(1), f1.id, 3, 0, 2, F.room(1), null],
    [2, 2, F.division(1), f2.id, 3, 0, 2, F.room(1), null],
    [3, 3, null, hod.id, 2, 0, 2, F.room(2), 30],
    [4, 4, F.division(1), f2.id, 4, 2, 0, F.room(1), null],
  ];
  for (const [n, course, div, fac, l, t, p, room, cap] of offerings) {
    const data = { termId: F.term, courseId: F.course(course), divisionId: div, facultyMembershipId: fac, lectureHours: l, tutorialHours: t, practicalHours: p, roomId: room, capacity: cap };
    await db.courseOffering.upsert({ where: { id: F.offering(n) }, create: { id: F.offering(n), schoolId: s, ...data }, update: data });
  }
  // PHY101 Mon, Wed, Fri at the first bell; CHE101 Tue, Thu at the first; PHY103 Mon at the second; MAT101 Tue, Thu at the second and Sat at the third.
  const slots: [number, number, number, string][] = [
    [1, 1, 1, p1.id], [2, 1, 3, p1.id], [3, 1, 5, p1.id],
    [4, 2, 2, p1.id], [5, 2, 4, p1.id],
    [6, 3, 1, p2.id],
    [7, 4, 2, p2.id], [8, 4, 4, p2.id], [9, 4, 6, p3.id],
  ];
  for (const [n, off, weekday, periodId] of slots) {
    await db.offeringSlot.upsert({ where: { id: F.slot(n) }, create: { id: F.slot(n), schoolId: s, offeringId: F.offering(off), weekday, periodId, kind: off === 3 ? "LAB" : "LECTURE" }, update: { weekday, periodId } });
  }
  for (const st of students) {
    for (const [n, course] of [[1, "CORE"], [2, "CORE"], [3, "ELECTIVE"], [4, "CORE"]] as const) {
      await db.courseRegistration.upsert({ where: { offeringId_studentMembershipId: { offeringId: F.offering(n), studentMembershipId: st.id } }, create: { schoolId: s, studentMembershipId: st.id, offeringId: F.offering(n), termId: F.term, kind: course, byUserId: admin.userId }, update: { status: "REGISTERED" } });
    }
  }

  // PHY101's twenty past lectures: the last twenty Mondays, Wednesdays and Fridays before today.
  const days: string[] = [];
  for (let back = 1; days.length < 20 && back < 120; back += 1) {
    const key = ist(-back);
    if ([1, 3, 5].includes(weekdayOf(key))) days.unshift(key);
  }
  const slotFor: Record<number, string> = { 1: F.slot(1), 3: F.slot(2), 5: F.slot(3) };
  const misses: Record<number, number[]> = { 1: [], 2: [4, 11, 17], 3: [2, 5, 8, 11, 14, 17, 19] };
  // The window moves with today, so last run's twenty are written again rather than shifted one by one (which would collide on the day's key).
  await db.lecture.deleteMany({ where: { schoolId: s, id: { in: Array.from({ length: 20 }, (_, k) => F.lecture(k + 1)) } } });
  for (const [i, dateKey] of days.entries()) {
    const n = i + 1;
    const lecture = { offeringId: F.offering(1), slotId: slotFor[weekdayOf(dateKey)]!, dateKey, startMinute: p1.startMinute, endMinute: p1.endMinute, kind: "LECTURE", roomId: null, cancelledAt: null };
    // A lecture the timetable already made for that day (a read of an earlier run) is the same lecture.
    const made = await db.lecture.findUnique({ where: { offeringId_dateKey_slotId: { offeringId: lecture.offeringId, dateKey, slotId: lecture.slotId } }, select: { id: true } });
    const id = made?.id ?? F.lecture(n);
    if (!made) await db.lecture.create({ data: { id, schoolId: s, ...lecture } });
    for (const [k, st] of students.entries()) {
      const status = misses[k + 1]!.includes(n) ? "ABSENT" : "PRESENT";
      await db.lectureAttendance.upsert({ where: { lectureId_studentMembershipId: { lectureId: id, studentMembershipId: st.id } }, create: { schoolId: s, lectureId: id, studentMembershipId: st.id, status, markedByMembershipId: f1.id, clientId: F.clientId(n), markedAt: new Date(`${dateKey}T03:40:00Z`) }, update: { status, clientId: F.clientId(n) } });
    }
  }

  // cstudent03's condonation ask, waiting for the HOD.
  await db.attendanceCondonation.upsert({ where: { id: F.condonation }, create: { id: F.condonation, schoolId: s, studentMembershipId: st3.id, termId: F.term, offeringId: F.offering(1), ground: "MEDICAL", note: "ZZ Down with dengue for two weeks in August; the hospital's discharge note is with the office." }, update: { status: "ASKED", hodDecidedAt: null, hodDecidedByUserId: null, decidedAt: null, decidedByUserId: null } });

  // PHY101's internal marks: entered by faculty01, countersigned, released and locked by the HOD.
  const components = [
    { id: F.component(1), name: "ZZ Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1","CO2"]', position: 0, marks: [180, 150, 110] },
    { id: F.component(2), name: "ZZ Assignment", kind: "ASSIGNMENT", maxMarks: 10, weight: 20, coCodes: '["CO3"]', position: 1, marks: [90, 80, 60] },
  ];
  const at = new Date(Date.now() - 5 * DAY);
  for (const c of components) {
    const data = { offeringId: F.offering(1), name: c.name, kind: c.kind, maxMarks: c.maxMarks, weight: c.weight, coCodes: c.coCodes, position: c.position, moderatedByUserId: hod.userId, moderatedAt: at, releasedByUserId: hod.userId, releasedAt: at };
    await db.internalComponent.upsert({ where: { id: c.id }, create: { id: c.id, schoolId: s, ...data }, update: data });
    for (const [k, st] of students.entries()) {
      const m = { marksTenths: c.marks[k]!, enteredByUserId: f1.userId, moderatedByUserId: hod.userId, moderatedAt: at };
      await db.internalMark.upsert({ where: { componentId_studentMembershipId: { componentId: c.id, studentMembershipId: st.id } }, create: { schoolId: s, componentId: c.id, studentMembershipId: st.id, ...m }, update: m });
    }
  }
  const totals = students.map((st, k) => ({ studentMembershipId: st.id, totalHundredths: internalTotalHundredths(components, new Map(components.map((c) => [c.id, c.marks[k]!]))) }));
  await db.internalLock.upsert({ where: { offeringId: F.offering(1) }, create: { schoolId: s, offeringId: F.offering(1), termId: F.term, outOf: RULES.internalMax, totalsJson: JSON.stringify(totals), lockedByUserId: hod.userId, lockedAt: at }, update: { outOf: RULES.internalMax, totalsJson: JSON.stringify(totals) } });

  // CHE101's unit test, entered by faculty02 and waiting for a countersign.
  const che = { offeringId: F.offering(2), name: "ZZ Unit test 1", kind: "UNIT_TEST", maxMarks: 20, weight: 20, coCodes: '["CO1"]', position: 0, moderatedByUserId: null, moderatedAt: null, releasedByUserId: null, releasedAt: null };
  await db.internalComponent.upsert({ where: { id: F.component(3) }, create: { id: F.component(3), schoolId: s, ...che }, update: che });
  for (const [k, st] of students.entries()) {
    const m = { marksTenths: [170, 140, 120][k]!, enteredByUserId: f2.userId, moderatedByUserId: null, moderatedAt: null };
    await db.internalMark.upsert({ where: { componentId_studentMembershipId: { componentId: F.component(3), studentMembershipId: st.id } }, create: { schoolId: s, componentId: F.component(3), studentMembershipId: st.id, ...m }, update: m });
  }

  // PHY101's course file: twelve weeks planned, the first six taught, and a resource.
  const plan = Array.from({ length: 12 }, (_, k) => ({ week: k + 1, topic: `ZZ Week ${k + 1}: ${["Units and measurement", "Vectors", "Kinematics", "Newton's laws", "Friction", "Work and energy", "Momentum", "Collisions", "Rotation", "Gravitation", "Elasticity", "Revision"][k]}`, coCodes: [k < 4 ? "CO1" : k < 9 ? "CO2" : "CO3"], taughtOn: k < 6 ? ist(-80 + k * 7 + 2) : null }));
  const file = await db.courseFile.upsert({ where: { offeringId: F.offering(1) }, create: { schoolId: s, offeringId: F.offering(1), planJson: JSON.stringify(plan) }, update: { planJson: JSON.stringify(plan) }, select: { id: true } });
  if (!(await db.courseFileItem.findFirst({ where: { courseFileId: file.id, title: "ZZ Lecture notes, weeks 1–4" }, select: { id: true } }))) {
    await db.courseFileItem.create({ data: { schoolId: s, courseFileId: file.id, kind: "LINK", title: "ZZ Lecture notes, weeks 1–4", url: "https://example.org/zz-mechanics-notes", coCodes: '["CO1"]', createdByUserId: f1.userId } });
  }

  // zz.faculty01 mentors the three, with one note.
  await db.mentoringGroup.upsert({ where: { id: F.mentoringGroup }, create: { id: F.mentoringGroup, schoolId: s, facultyMembershipId: f1.id, termId: F.term, name: "ZZ FY Physics mentees" }, update: { facultyMembershipId: f1.id, termId: F.term } });
  await db.mentoringMember.createMany({ data: students.map((st) => ({ schoolId: s, groupId: F.mentoringGroup, studentMembershipId: st.id })), skipDuplicates: true });
  if (!(await db.mentoringNote.findFirst({ where: { groupId: F.mentoringGroup, studentMembershipId: st3.id }, select: { id: true } }))) {
    await db.mentoringNote.create({ data: { schoolId: s, groupId: F.mentoringGroup, studentMembershipId: st3.id, note: "ZZ Missed lectures through illness; agreed a catch-up plan for mechanics.", flag: "SLOW", authorUserId: f1.userId } });
  }

  // The office's ask to open cstudent02's registration late, waiting for the principal.
  await db.lateRegistration.upsert({ where: { id: F.lateRegistration }, create: { id: F.lateRegistration, schoolId: s, studentMembershipId: st2.id, termId: F.term, reason: "ZZ Joined after the second CAP round.", openUntil: ist(20), askedByUserId: admin.userId }, update: { status: "ASKED", decidedAt: null, decidedByUserId: null, openUntil: ist(20) } });

  return { lectures: days.length, locked: true };
}
