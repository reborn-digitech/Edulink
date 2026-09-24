import "server-only";
import { db } from "./db";
import { toCsv } from "./csv";
import { audit } from "./audit";
import { monthRoll } from "./attendance-history";

/**
 * The two compliance files, as text. The web's download routes
 * (/admin/attendance/export/*) wrap them in an attachment; the phone's
 * GET /api/v1/office/attendance/export/* hands the text back so the system
 * share sheet can save or send it. Both are audited here, once, because the
 * register carries children's names and their absences.
 */
export type CsvExport = { filename: string; csv: string; rows: number };

type Caller = { schoolId: string; user: { id: string } };

/**
 * One class's register for one month, as the inspection-shaped grid: a row per
 * pupil, a column per register actually taken, P/L/A/E in the cells. Null when
 * the class is not this school's.
 */
export async function registerExport(ctx: Caller, classId: string, month: string): Promise<CsvExport | null> {
  const klass = await db.class.findFirst({
    where: { id: classId, schoolId: ctx.schoolId },
    select: { id: true, name: true },
  });
  if (!klass) return null;

  const sessions = await db.attendanceSession.findMany({
    where: { schoolId: ctx.schoolId, classId, dateKey: { startsWith: `${month}-` } },
    orderBy: { dateKey: "asc" },
    select: {
      dateKey: true,
      records: { select: { studentMembershipId: true, status: true } },
    },
  });

  // The month's own roll — everyone marked in it plus everyone enrolled during
  // it — so a promoted class's last month and a mid-month leaver keep their rows.
  const roll = await monthRoll(ctx.schoolId, classId, month, sessions);

  const letter: Record<string, string> = { PRESENT: "P", LATE: "L", ABSENT: "A", EXCUSED: "E" };
  const byDay = new Map(
    sessions.map((s) => [
      s.dateKey,
      new Map(s.records.map((r) => [r.studentMembershipId, letter[r.status] ?? "?"])),
    ]),
  );
  const days = sessions.map((s) => s.dateKey);

  const rows = roll.map((r) => {
    const row: Record<string, unknown> = {
      student_code: r.studentCode ?? "",
      name: r.user.name,
    };
    let present = 0;
    for (const day of days) {
      const mark = byDay.get(day)?.get(r.id) ?? "";
      row[day] = mark;
      if (mark === "P" || mark === "L") present += 1;
    }
    row.days_present = present;
    row.days_marked = days.filter((d) => byDay.get(d)?.has(r.id)).length;
    return row;
  });

  const csv = toCsv(rows, ["student_code", "name", ...days, "days_present", "days_marked"]);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "compliance.export",
    targetType: "Class",
    targetId: classId,
    meta: { kind: "register", month, rows: rows.length },
  });

  return { filename: `edulink-register-${klass.name.replace(/[^\w-]+/g, "_")}-${month}.csv`, csv, rows: rows.length };
}

/**
 * The UDISE+-shaped enrolment summary: a row per grade with class and pupil
 * counts, plus how many pupils have a guardian linked and how many teachers
 * serve the grade — the aggregate numbers an annual return asks for, with no
 * child named in the file at all.
 */
export async function enrolmentExport(ctx: Caller): Promise<CsvExport> {
  const classes = await db.class.findMany({
    where: { schoolId: ctx.schoolId, archivedAt: null },
    select: {
      gradeLevel: true,
      teachers: { select: { teacherMembershipId: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        select: {
          student: {
            select: { guardianships: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 } },
          },
        },
      },
    },
  });

  type Row = { classes: number; pupils: number; withGuardian: number; teachers: Set<string> };
  const byGrade = new Map<string, Row>();
  for (const klass of classes) {
    const grade = klass.gradeLevel ?? "ungraded";
    const row = byGrade.get(grade) ?? { classes: 0, pupils: 0, withGuardian: 0, teachers: new Set() };
    row.classes += 1;
    row.pupils += klass.enrollments.length;
    row.withGuardian += klass.enrollments.filter((e) => e.student.guardianships.length > 0).length;
    for (const t of klass.teachers) row.teachers.add(t.teacherMembershipId);
    byGrade.set(grade, row);
  }

  const rows = [...byGrade.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0]))
    .map(([grade, row]) => ({
      grade_level: grade,
      classes: row.classes,
      pupils_enrolled: row.pupils,
      pupils_with_guardian_linked: row.withGuardian,
      teachers_assigned: row.teachers.size,
    }));

  const csv = toCsv(rows, [
    "grade_level",
    "classes",
    "pupils_enrolled",
    "pupils_with_guardian_linked",
    "teachers_assigned",
  ]);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "compliance.export",
    meta: { kind: "enrolment", rows: rows.length },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return { filename: `edulink-enrolment-${stamp}.csv`, csv, rows: rows.length };
}
