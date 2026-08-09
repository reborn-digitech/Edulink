import "server-only";
import { db } from "./db";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { dateKeyInZone } from "./dates";
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
 * series) is matched by falling inside [startDate, endDate] in the school's
 * own timezone. Rows written before year-linkage existed fall back to the
 * window too, so an old report card is not orphaned by a schema improvement.
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

async function yearOf(schoolId: string, yearId: string) {
  const year = await db.academicYear.findFirst({
    where: { id: yearId, schoolId, closedAt: { not: null } },
  });
  if (!year) throw new AccessError("access.academicYearNotFound", "NOT_FOUND");
  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });
  return {
    year,
    fromKey: dateKeyInZone(year.startDate, school.timezone),
    toKey: dateKeyInZone(year.endDate, school.timezone),
  };
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

  const { year, fromKey, toKey } = await yearOf(schoolId, yearId);

  const [reportCards, attendance, badges, grades] = await Promise.all([
    db.reportCard.findMany({
      where: {
        schoolId,
        studentMembershipId,
        status: "PUBLISHED",
        OR: [
          { academicYearId: year.id },
          {
            academicYearId: null,
            publishedAt: { gte: year.startDate, lte: year.endDate },
          },
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
        gradedAt: { gte: year.startDate, lte: year.endDate },
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
  const averagePercent =
    scorable.length === 0
      ? null
      : Math.round(
          (scorable.reduce((sum, g) => sum + g.scoreMilli! / g.assignment.pointsMilli!, 0) /
            scorable.length) *
            100,
        );

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

/** The classes this teacher was attached to, and what happened in them that year. */
export async function teacherYearArchive(
  session: ActiveContext,
  yearId: string,
): Promise<TeacherYearArchive> {
  if ((session.role !== "TEACHER" && session.role !== "PRINCIPAL") || !session.membershipId) {
    throw new AccessError("access.onlyTeachingStaffCanOpenThis");
  }
  const schoolId = session.schoolId!;
  const { year, fromKey, toKey } = await yearOf(schoolId, yearId);

  const attached = await db.classTeacher.findMany({
    where: { schoolId, teacherMembershipId: session.membershipId },
    select: { classId: true, class: { select: { name: true } } },
  });

  const classes = [];
  for (const { classId, class: klass } of attached) {
    const [registersTaken, assignmentsSet, reportCardsPublished] = await Promise.all([
      db.attendanceSession.count({
        where: { schoolId, classId, dateKey: { gte: fromKey, lte: toKey } },
      }),
      db.assignment.count({
        where: {
          schoolId,
          classId,
          authorMembershipId: session.membershipId,
          createdAt: { gte: year.startDate, lte: year.endDate },
        },
      }),
      db.reportCard.count({
        where: {
          schoolId,
          classId,
          status: "PUBLISHED",
          OR: [
            { academicYearId: year.id },
            { academicYearId: null, publishedAt: { gte: year.startDate, lte: year.endDate } },
          ],
        },
      }),
    ]);
    // A class with nothing at all in the window was probably created after the
    // year closed; keeping it would pad every old year with today's classes.
    if (registersTaken + assignmentsSet + reportCardsPublished > 0) {
      classes.push({
        classId,
        className: klass.name,
        registersTaken,
        assignmentsSet,
        reportCardsPublished,
      });
    }
  }

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
  const { year, fromKey, toKey } = await yearOf(schoolId, yearId);

  const [pupilsOnRoll, attendance, reportCardsPublished, leavers, badgesArchived, examSeries] =
    await Promise.all([
      // On the roll AT ANY POINT of the year: joined before it ended, and not
      // recorded as leaving before it began.
      db.membership.count({
        where: {
          schoolId,
          role: "STUDENT",
          joinedAt: { lte: year.endDate },
          OR: [{ leftAt: null }, { leftAt: { gte: year.startDate } }],
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
          OR: [
            { academicYearId: year.id },
            { academicYearId: null, publishedAt: { gte: year.startDate, lte: year.endDate } },
          ],
        },
      }),
      db.schoolRecord.count({
        where: { schoolId, leftAt: { gte: year.startDate, lte: year.endDate } },
      }),
      db.earnedBadge.count({ where: { schoolId, academicYearId: year.id } }),
      db.examSeries.findMany({
        where: { schoolId, createdAt: { gte: year.startDate, lte: year.endDate } },
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
