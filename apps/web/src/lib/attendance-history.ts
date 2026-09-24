import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import type { ActiveContext } from "./session";
import type { AttendanceStatus } from "./constants";

/**
 * Historic attendance: one class, one month, every register that was taken,
 * read on screen rather than exported.
 *
 * WHO MAY READ WHOSE. The register is evidence, and the people who may read
 * it back are exactly the people answerable for it:
 *
 *   - an ADMIN and a PRINCIPAL see every class in their school — the
 *     principal reads and decides, and attendance is the first thing a
 *     principal is asked about;
 *   - a TEACHER sees the classes they are the class teacher of, meaning a
 *     ClassTeacher row that still carries the register right. A visiting
 *     music teacher attached to six classes reads none of their histories,
 *     for the same reason they mark none of their registers. Cover is
 *     deliberately NOT enough: a week's cover lets somebody take today's
 *     register, not read back the year.
 *
 * Nothing here is a navigation item. The page is reached from the register
 * and attendance surfaces alone, which is also why the access rule lives
 * here and not in the page: whoever links to it next cannot forget it.
 */

export type HistoryClass = { id: string; name: string; color: string | null; archived: boolean };

/** The classes this person may read the history of, in name order. */
export async function historyClassesFor(ctx: ActiveContext): Promise<HistoryClass[]> {
  if (!ctx.schoolId || !ctx.membershipId) return [];

  // ARCHIVED CLASSES ARE INCLUDED. Last year's class is exactly the one the
  // office is asked about in September, and promotion archives every class
  // it empties — reading back was the whole point of keeping the rows.
  // Current classes first, then the archive, each in name order.
  const order = (rows: HistoryClass[]) =>
    rows.sort((a, b) => Number(a.archived) - Number(b.archived) || a.name.localeCompare(b.name));

  if (ctx.role === "ADMIN" || ctx.role === "PRINCIPAL") {
    const rows = await db.class.findMany({
      where: { schoolId: ctx.schoolId },
      select: { id: true, name: true, color: true, archivedAt: true },
    });
    return order(rows.map((c) => ({ id: c.id, name: c.name, color: c.color, archived: c.archivedAt !== null })));
  }

  if (ctx.role !== "TEACHER") return [];

  const rows = await db.classTeacher.findMany({
    where: {
      schoolId: ctx.schoolId,
      teacherMembershipId: ctx.membershipId,
      canTakeAttendance: true,
    },
    select: { class: { select: { id: true, name: true, color: true, archivedAt: true } } },
  });
  return order(rows.map((r) => ({ id: r.class.id, name: r.class.name, color: r.class.color, archived: r.class.archivedAt !== null })));
}

export type HistoryDay = {
  dateKey: string;
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** Present or late, over everyone marked that day. Null with no marks. */
  percent: number | null;
};

export type RollPupil = {
  id: string;
  studentCode: string | null;
  user: { name: string; preferredName: string | null };
};

/**
 * The roll of a month: every pupil with a mark in any of the month's sessions
 * for the class, together with every enrolment in the class that was live at
 * some point in the month (enrolled by its end, not removed before its start),
 * in name order. Today's ACTIVE roll is the wrong list for a past month — an
 * archived or promoted class has none, and a child who left mid-month would
 * vanish with their marks — so the month is read for who was in it.
 */
export async function monthRoll(
  schoolId: string,
  classId: string,
  month: string,
  sessions: { records: { studentMembershipId: string }[] }[],
): Promise<RollPupil[]> {
  const start = new Date(`${month}-01T00:00:00.000Z`);
  const end = new Date(`${shiftMonth(month, 1)}-01T00:00:00.000Z`);
  const marked = [...new Set(sessions.flatMap((s) => s.records.map((r) => r.studentMembershipId)))];

  const rows = await db.membership.findMany({
    where: {
      schoolId,
      OR: [
        { id: { in: marked } },
        {
          enrollments: {
            some: {
              classId,
              enrolledAt: { lt: end },
              OR: [{ removedAt: null }, { removedAt: { gte: start } }],
            },
          },
        },
      ],
    },
    select: { id: true, studentCode: true, user: { select: { name: true, preferredName: true } } },
  });
  return rows.sort((a, b) => a.user.name.localeCompare(b.user.name, undefined, { sensitivity: "base" }));
}

export type HistoryPupil = {
  membershipId: string;
  name: string;
  /** dateKey → status, only for days a mark exists. */
  marks: Record<string, AttendanceStatus>;
  present: number;
  late: number;
  absent: number;
  excused: number;
  /** Present or late, over this pupil's marks in the month. Null with none. */
  percent: number | null;
};

export type AttendanceHistory = {
  class: HistoryClass;
  month: string;
  days: HistoryDay[];
  pupils: HistoryPupil[];
  /** Present or late over every mark in the month. Null when nothing taken. */
  percent: number | null;
};

export const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * The month's grid. Refuses — rather than returning empty — when the class is
 * not one this person may read, so a hand-typed `?classId=` is answered with
 * a sentence and not with a blank page that looks like an empty month.
 */
export async function attendanceHistory(
  ctx: ActiveContext,
  classId: string,
  month: string,
): Promise<AttendanceHistory> {
  if (!MONTH_KEY.test(month)) throw new AccessError("access.monthMustBeYearMonth");

  const allowed = await historyClassesFor(ctx);
  const klass = allowed.find((c) => c.id === classId);
  if (!klass) throw new AccessError("access.notYourClassHistory");

  const sessions = await db.attendanceSession.findMany({
    where: { schoolId: ctx.schoolId!, classId, dateKey: { startsWith: `${month}-` } },
    orderBy: { dateKey: "asc" },
    select: { dateKey: true, records: { select: { studentMembershipId: true, status: true } } },
  });
  const roll = await monthRoll(ctx.schoolId!, classId, month, sessions);

  const pupils = new Map<string, HistoryPupil>(
    roll.map((r) => [
      r.id,
      {
        membershipId: r.id,
        name: r.user.preferredName ?? r.user.name,
        marks: {},
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
        percent: null,
      },
    ]),
  );

  const days: HistoryDay[] = [];
  let total = 0;
  let there = 0;

  for (const session of sessions) {
    const day: HistoryDay = { dateKey: session.dateKey, present: 0, late: 0, absent: 0, excused: 0, percent: null };
    for (const record of session.records) {
      const status = record.status as AttendanceStatus;
      // Every mark in the month has a row: a child who has since left the
      // class is on the month's roll because the register said what it said.
      const pupil = pupils.get(record.studentMembershipId);
      if (pupil) {
        pupil.marks[session.dateKey] = status;
        bump(pupil, status);
      }
      bump(day, status);
    }
    const marked = day.present + day.late + day.absent + day.excused;
    // A register with no marks is a blank, not a 0 % day.
    day.percent = marked === 0 ? null : Math.round(((day.present + day.late) / marked) * 100);
    total += marked;
    there += day.present + day.late;
    days.push(day);
  }

  for (const pupil of pupils.values()) {
    const marked = pupil.present + pupil.late + pupil.absent + pupil.excused;
    pupil.percent = marked === 0 ? null : Math.round(((pupil.present + pupil.late) / marked) * 100);
  }

  return {
    class: klass,
    month,
    days,
    pupils: [...pupils.values()].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
    ),
    percent: total === 0 ? null : Math.round((there / total) * 100),
  };
}

function bump(
  into: { present: number; late: number; absent: number; excused: number },
  status: AttendanceStatus,
) {
  if (status === "PRESENT") into.present += 1;
  else if (status === "LATE") into.late += 1;
  else if (status === "ABSENT") into.absent += 1;
  else if (status === "EXCUSED") into.excused += 1;
}

/** "2026-08" → "2026-07" / "2026-09". */
export function shiftMonth(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}
