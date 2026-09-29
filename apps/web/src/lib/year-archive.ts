import "server-only";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { addDaysToKey, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";

/**
 * What survives the end of an academic year, gathered for reading.
 *
 * The school already keeps everything — report cards, registers, marks,
 * badges — but it keeps them ON TODAY'S PAGES, which all open on now: the
 * register on this week, the grades page on the current pile. The archive is
 * those same rows read through a different lens: pick a CLOSED year, see what
 * that year left behind. Nothing here writes, nothing here is a new copy of
 * anything, and nothing is reachable that the same person could not already
 * reach — the year filter narrows, never widens.
 *
 * A YEAR IS ITS DATE WINDOW. Report cards and badges carry `academicYearId`
 * and are matched by it where set; everything else (attendance, marks, exam
 * series) is matched by falling inside the year's days IN THE SCHOOL'S OWN
 * TIMEZONE: from 00:00 of the first day to the end of the last day, as the
 * school's clock reads them. `startDate` and `endDate` hold UTC midnight of
 * the days the office typed, so the ISO date IS the day (the same reading
 * insights.ts and the badges use); the instants either side of a day come
 * from `zonedStartOfDay`. Comparing a timestamp with the raw column was
 * dropping a mark entered after 05:30 IST on the last day of the year. Rows
 * written before year-linkage existed fall back to the window too, so an old
 * report card is not orphaned by a schema improvement.
 *
 * ONLY CLOSED YEARS ARE LISTED. The current year is what every ordinary page
 * shows; an archive that includes "now" is two pages disagreeing about the
 * same rows. `closedAt` is the boundary, exactly as academic-year.ts drew it.
 */

export type ArchiveYear = {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  closedAt: Date;
};

/** The closed years of one school, newest first. */
export async function listClosedYears(schoolId: string): Promise<ArchiveYear[]> {
  const years = await db.academicYear.findMany({
    where: { schoolId, closedAt: { not: null } },
    orderBy: { startDate: "desc" },
    select: { id: true, name: true, startDate: true, endDate: true, closedAt: true },
  });
  // `closedAt` narrowed by the WHERE; the map is for the type, not the data.
  return years.map((y) => ({ ...y, closedAt: y.closedAt! }));
}

/**
 * The closed years ONE PUPIL actually lived at the school.
 *
 * The school's list is not the child's list: a pupil who joined in the third
 * year was being offered the first two as chips, each opening a page of
 * honest-but-baffling "nothing was recorded" — the school's history dressed
 * up as gaps in the child's. A year makes this list only if it overlaps the
 * pupil's own time on the roll, [joinedAt, leftAt or still-here]. Staff keep
 * the full school list; this is for the pupil's and the guardian's view.
 */
export async function closedYearsForPupil(
  schoolId: string,
  studentMembershipId: string,
): Promise<ArchiveYear[]> {
  const membership = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId },
    select: { joinedAt: true, leftAt: true },
  });
  if (!membership) return [];
  const [years, school] = await Promise.all([
    listClosedYears(schoolId),
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true } }),
  ]);
  return years.filter((y) => {
    const w = windowOf(y, school.timezone);
    return w.to > membership.joinedAt && (membership.leftAt === null || w.from <= membership.leftAt);
  });
}

/**
 * The year's window as instants: [first day 00:00, day after the last day
 * 00:00) on the school's clock, and the day keys that bound the registers.
 * `to` is EXCLUSIVE — the last day runs to its own midnight, not to 00:00 UTC.
 */
export type YearWindow = { fromKey: string; toKey: string; from: Date; to: Date };

export function windowOf(
  year: { startDate: Date; endDate: Date },
  timezone: string,
): YearWindow {
  const fromKey = year.startDate.toISOString().slice(0, 10);
  const toKey = year.endDate.toISOString().slice(0, 10);
  return {
    fromKey,
    toKey,
    from: zonedStartOfDay(fromKey, timezone),
    to: zonedStartOfDay(addDaysToKey(toKey, 1), timezone),
  };
}

/** Prisma's half-open filter for a timestamp column inside the window. */
function inWindow(w: YearWindow) {
  return { gte: w.from, lt: w.to };
}

async function yearOf(schoolId: string, yearId: string) {
  const year = await db.academicYear.findFirst({
    where: { id: yearId, schoolId, closedAt: { not: null } },
  });
  if (!year) throw new AccessError("access.academicYearNotFound", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  const w = windowOf(year, school.timezone);
  return { year, w, fromKey: w.fromKey, toKey: w.toKey };
}

/* -------------------------------------------------------------------------- */
/* One pupil's year                                                            */
/* -------------------------------------------------------------------------- */

export type PupilYearArchive = {
  reportCards: { id: string; title: string; publishedAt: Date | null; className: string }[];
  attendance: { marked: number; present: number };
  badges: { badgeId: string; label: string; description: string; permanent: boolean }[];
  marks: { graded: number; averagePercent: number | null };
};

/**
 * What one pupil's closed year left behind.
 *
 * Readable by the pupil themself and by anyone holding an ACTIVE guardianship
 * over them — which since standin-guardian.ts includes the school's stand-in.
 * The guardianship check is `assertGuardianAccess`, the same door every other
 * guardian read goes through.
 */
export async function pupilYearArchive(
  session: ActiveContext,
  studentMembershipId: string,
  yearId: string,
): Promise<PupilYearArchive> {
  let schoolId: string;
  if (session.role === "STUDENT" && session.membershipId === studentMembershipId) {
    schoolId = session.schoolId!;
  } else {
    const link = await assertGuardianAccess(session.user.id, studentMembershipId);
    schoolId = link.student.schoolId;
  }

  const { year, w, fromKey, toKey } = await yearOf(schoolId, yearId);

  const [reportCards, attendance, badges, grades] = await Promise.all([
    db.reportCard.findMany({
      where: {
        schoolId,
        studentMembershipId,
        status: "PUBLISHED",
        OR: [
          { academicYearId: year.id },
          { academicYearId: null, publishedAt: inWindow(w) },
        ],
      },
      orderBy: { publishedAt: "asc" },
      select: {
        id: true,
        title: true,
        publishedAt: true,
        class: { select: { name: true } },
      },
    }),
    db.attendanceRecord.groupBy({
      by: ["status"],
      where: {
        schoolId,
        studentMembershipId,
        session: { dateKey: { gte: fromKey, lte: toKey } },
      },
      _count: { _all: true },
    }),
    db.earnedBadge.findMany({
      where: { schoolId, studentMembershipId, academicYearId: year.id },
      orderBy: { createdAt: "asc" },
      select: { badgeId: true, label: true, description: true, permanent: true },
    }),
    db.grade.findMany({
      where: {
        schoolId,
        studentMembershipId,
        gradedAt: inWindow(w),
        scoreMilli: { not: null },
      },
      select: {
        scoreMilli: true,
        assignment: { select: { pointsMilli: true } },
      },
    }),
  ]);

  let marked = 0;
  let present = 0;
  for (const row of attendance) {
    marked += row._count._all;
    // LATE COUNTS AS PRESENT, matching every other attendance figure here.
    if (row.status === "PRESENT" || row.status === "LATE") present += row._count._all;
  }

  // Percent of available marks, only over rows where both sides exist — an
  // ungraded or unpointed assignment says nothing about how the year went.
  const scorable = grades.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
  // MARKS EARNED OVER MARKS AVAILABLE, divided once — the rule grading.ts
  // states and every other figure here follows. This used to be the mean of
  // each piece's own percent, which counts a five-mark quiz as much as a
  // hundred-mark paper: 1/5 and 90/100 read as 55 % of a year that was 87 %.
  const earned = scorable.reduce((sum, g) => sum + g.scoreMilli!, 0);
  const available = scorable.reduce((sum, g) => sum + g.assignment.pointsMilli!, 0);
  const averagePercent = available === 0 ? null : Math.round((earned * 100) / available);

  return {
    reportCards: reportCards.map((c) => ({
      id: c.id,
      title: c.title,
      publishedAt: c.publishedAt,
      className: c.class.name,
    })),
    attendance: { marked, present },
    badges,
    marks: { graded: grades.length, averagePercent },
  };
}

/* -------------------------------------------------------------------------- */
/* One teacher's year                                                          */
/* -------------------------------------------------------------------------- */

export type TeacherYearArchive = {
  classes: {
    classId: string;
    className: string;
    registersTaken: number;
    assignmentsSet: number;
    reportCardsPublished: number;
  }[];
};

/**
 * The classes this teacher worked in that year, and what THEY did in each.
 *
 * Counted from the rows that carry the teacher's own hand — the registers
 * they took (`takenByMembershipId`), the assignments they set and the cards
 * they wrote (`createdByMembershipId`) — not everything that happened in the
 * classes they hold today. The old reading credited a teacher who took over
 * a class in June with every register of the year before, and a co-teacher
 * with the lead's cards; and a class handed to somebody else since vanished
 * from the archive along with the work done in it. The class list follows
 * from the rows, so it is the classes of that year and not of this one.
 */
export async function teacherYearArchive(
  session: ActiveContext,
  yearId: string,
): Promise<TeacherYearArchive> {
  if ((session.role !== "TEACHER" && session.role !== "PRINCIPAL") || !session.membershipId) {
    throw new AccessError("access.onlyTeachingStaffCanOpenThis");
  }
  const schoolId = session.schoolId!;
  const me = session.membershipId;
  const { year, w, fromKey, toKey } = await yearOf(schoolId, yearId);

  const [registers, assignments, cards] = await Promise.all([
    db.attendanceSession.groupBy({
      by: ["classId"],
      where: { schoolId, takenByMembershipId: me, dateKey: { gte: fromKey, lte: toKey } },
      _count: { _all: true },
    }),
    db.assignment.groupBy({
      by: ["classId"],
      where: { schoolId, authorMembershipId: me, createdAt: inWindow(w) },
      _count: { _all: true },
    }),
    db.reportCard.groupBy({
      by: ["classId"],
      where: {
        schoolId,
        createdByMembershipId: me,
        status: "PUBLISHED",
        OR: [{ academicYearId: year.id }, { academicYearId: null, publishedAt: inWindow(w) }],
      },
      _count: { _all: true },
    }),
  ]);

  const tally = new Map<string, { registersTaken: number; assignmentsSet: number; reportCardsPublished: number }>();
  const bucket = (classId: string) => {
    const found = tally.get(classId) ?? { registersTaken: 0, assignmentsSet: 0, reportCardsPublished: 0 };
    tally.set(classId, found);
    return found;
  };
  for (const row of registers) bucket(row.classId).registersTaken += row._count._all;
  for (const row of assignments) bucket(row.classId).assignmentsSet += row._count._all;
  for (const row of cards) bucket(row.classId).reportCardsPublished += row._count._all;
  if (tally.size === 0) return { classes: [] };

  const names = await db.class.findMany({
    where: { schoolId, id: { in: [...tally.keys()] } },
    select: { id: true, name: true },
  });
  const classes = names
    .map((klass) => ({ classId: klass.id, className: klass.name, ...tally.get(klass.id)! }))
    .sort((a, b) => a.className.localeCompare(b.className));

  return { classes };
}

/* -------------------------------------------------------------------------- */
/* The school's year                                                           */
/* -------------------------------------------------------------------------- */

export type SchoolYearArchive = {
  pupilsOnRoll: number;
  attendance: { marked: number; present: number };
  reportCardsPublished: number;
  leavers: number;
  badgesArchived: number;
  examSeries: { id: string; name: string; gradeLevel: string }[];
};

/** The whole school's year, in the numbers an office would ask for first. */
export async function schoolYearArchive(
  session: ActiveContext,
  yearId: string,
): Promise<SchoolYearArchive> {
  if (session.role !== "ADMIN" && session.role !== "PRINCIPAL") {
    throw new AccessError("access.onlyASchoolAdminCanOpenThis");
  }
  const schoolId = session.schoolId!;
  const { year, w, fromKey, toKey } = await yearOf(schoolId, yearId);

  // The day after the year's last day, as the date-only column stores days:
  // UTC midnight of the typed date, so an admission dated the last day is
  // inside and one dated the next day is out, whatever the school's zone.
  const dayAfter = new Date(`${addDaysToKey(toKey, 1)}T00:00:00.000Z`);

  const [pupilsOnRoll, attendance, reportCardsPublished, leavers, badgesArchived, examSeries] =
    await Promise.all([
      // On the roll AT ANY POINT of the year: admitted before it ended — by
      // the record's admission date where the office entered one, which for a
      // school that onboarded mid-way predates the platform join date — and
      // not recorded as leaving before it began. A suspended membership is
      // not on the roll.
      db.membership.count({
        where: {
          schoolId,
          role: "STUDENT",
          status: { not: "SUSPENDED" },
          AND: [
            {
              OR: [
                { pupilRecord: { admissionDate: { lt: dayAfter } } },
                { pupilRecord: { is: null }, joinedAt: { lt: w.to } },
                { pupilRecord: { admissionDate: null }, joinedAt: { lt: w.to } },
              ],
            },
            { OR: [{ leftAt: null }, { leftAt: { gte: w.from } }] },
          ],
        },
      }),
      db.attendanceRecord.groupBy({
        by: ["status"],
        where: { schoolId, session: { dateKey: { gte: fromKey, lte: toKey } } },
        _count: { _all: true },
      }),
      db.reportCard.count({
        where: {
          schoolId,
          status: "PUBLISHED",
          OR: [{ academicYearId: year.id }, { academicYearId: null, publishedAt: inWindow(w) }],
        },
      }),
      // Leavers by the MEMBERSHIP's leaving date. The departure record is what
      // a readmission deletes, so counting those made a closed year's leaver
      // count shrink whenever a pupil came back.
      db.membership.count({
        where: { schoolId, role: "STUDENT", leftAt: inWindow(w) },
      }),
      db.earnedBadge.count({ where: { schoolId, academicYearId: year.id } }),
      db.examSeries.findMany({
        where: { schoolId, createdAt: inWindow(w) },
        orderBy: [{ gradeLevel: "asc" }, { name: "asc" }],
        select: { id: true, name: true, gradeLevel: true },
      }),
    ]);

  let marked = 0;
  let present = 0;
  for (const row of attendance) {
    marked += row._count._all;
    if (row.status === "PRESENT" || row.status === "LATE") present += row._count._all;
  }

  return {
    pupilsOnRoll,
    attendance: { marked, present },
    reportCardsPublished,
    leavers,
    badgesArchived,
    examSeries,
  };
}
