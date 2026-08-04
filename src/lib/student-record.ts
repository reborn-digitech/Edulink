import "server-only";
import { db } from "./db";
import { forOwnSchools } from "./tenant-context";
import type { ActiveContext } from "./session";

/**
 * A child's record, which belongs to the child and not to a school.
 *
 * WHY THIS IS A SEPARATE READ PATH FROM EVERY OTHER ONE IN THE APP. Everything
 * else here answers "what may this school show me", and correctly stops the
 * moment a membership ends: the register, the bulletin, the assignments and the
 * practice ladder are a school's working surfaces, and a pupil who has gone has
 * no business in any of them. But a report card is not a working surface. It is
 * a document addressed to a child and their family, and so is the attendance
 * figure on it, and so is a badge they earned once. Those have to outlive the
 * membership, or a family who moves to a school not on this platform — or to no
 * school at all — loses everything the last one wrote about them.
 *
 * SO THIS RUNS WITH NO SCHOOL BOUND, and that is not a workaround. Postgres
 * itself opens these rows to the child they are about and to their active
 * guardians, keyed on `app.user_id`, in a SELECT-only policy — see
 * OWN_RECORD_READABLE in scripts/gen-rls.ts and the 21 live checks in
 * `npm run rls:verify`. This file therefore does NOT bind a tenant to read the
 * record, and must not start: binding the old school would hand an alumnus that
 * school's entire tenant back, so a single forgotten WHERE would show them a
 * current pupil's marks. Read as the person, not as the school.
 *
 * THE ONE EXCEPTION IS SCHOOL NAMES, which are not part of the record and are
 * only readable with the school bound. That read is `forOwnSchools`, one table,
 * on ids the database has already handed back — the same narrow widening the
 * role switcher uses and for the same reason.
 *
 * WHAT IS DELIBERATELY NOT HERE. No bulletin, no practice, no messages, no
 * class roll, no day-by-day register. Attendance appears as FIGURES, because
 * `AttendanceSession` is not opened by the policy — a register is a school's
 * operational record of a room on a morning, and a leaver has no claim on it.
 * What they have a claim on is the count of their own days, which is what a
 * report card and a leaving certificate both quote.
 */

export type RecordCard = {
  id: string;
  title: string;
  status: string;
  publishedAt: Date | null;
  overallPercent: number | null;
  attendancePresent: number;
  attendanceTotal: number;
  fromDateKey: string;
  toDateKey: string;
  remark: string | null;
  items: { title: string; category: string | null; scoreMilli: number | null; pointsMilli: number | null }[];
};

export type RecordBadge = {
  id: string;
  label: string;
  description: string;
  earnedAt: Date;
};

export type RecordSchool = {
  membershipId: string;
  schoolId: string;
  schoolName: string;
  gradeLevel: string | null;
  joinedAt: Date;
  leftAt: Date | null;
  /** Still a pupil here. The record shows past and present in one list. */
  current: boolean;
  attendanceMarked: number;
  attendancePresent: number;
  /** NULL, never 0, when nothing was ever marked. Unmarked is not absent. */
  attendancePercent: number | null;
  certificate: {
    reason: string;
    destination: string | null;
    note: string | null;
    reportCardCount: number;
  } | null;
  cards: RecordCard[];
  badges: RecordBadge[];
};

export type StudentRecord = {
  studentUserId: string;
  name: string;
  preferredName: string | null;
  avatarKey: string | null;
  schools: RecordSchool[];
  totals: {
    schools: number;
    cards: number;
    badges: number;
    attendanceMarked: number;
    attendancePresent: number;
    attendancePercent: number | null;
  };
};

/** A child a guardian may open a record for. */
export type RecordChild = {
  studentUserId: string;
  name: string;
  preferredName: string | null;
  avatarKey: string | null;
  schoolCount: number;
};

/* -------------------------------------------------------------------------- */
/* Which memberships a reader may build a record from                          */
/* -------------------------------------------------------------------------- */

/**
 * The memberships this reader is entitled to, and the ONLY place that decides.
 *
 * Everything below works from the ids this returns, so a caller cannot widen
 * the record by naming a membership: an id that is not in here is simply not in
 * the list, and every subsequent query filters on the list rather than on
 * anything a client said.
 *
 * A GUARDIAN GETS THE MEMBERSHIPS THEY GUARD, not every membership the child
 * has ever held. A school's records are that school's to hand over, and the
 * student code is how it does the handing — so a parent linked at Riverside
 * reads Riverside, and reads Oakfield when Oakfield links them too. The
 * leaving certificate is the exception, and it is the designed one: it travels
 * with the family precisely so they can show it to the next school.
 */
async function membershipsFor(
  ctx: ActiveContext,
  studentUserId: string,
): Promise<{ id: string; schoolId: string; gradeLevel: string | null; joinedAt: Date; leftAt: Date | null }[]> {
  const own = studentUserId === ctx.user.id;

  if (own) {
    // Self-readable with no school bound — the Membership policy's `app.user_id`
    // clause, which is the same bootstrap a login uses.
    return db.membership.findMany({
      where: { userId: ctx.user.id, role: "STUDENT" },
      orderBy: { joinedAt: "desc" },
      select: { id: true, schoolId: true, gradeLevel: true, joinedAt: true, leftAt: true },
    });
  }

  // Otherwise the reader must be an active guardian of this child. Guardianship
  // carries no policy and holds `studentMembershipId` directly, so this works
  // before any school is known — the same property the parent session bootstrap
  // relies on.
  const links = await db.guardianship.findMany({
    where: { parentUserId: ctx.user.id, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  if (links.length === 0) return [];

  return db.membership.findMany({
    where: {
      id: { in: links.map((l) => l.studentMembershipId) },
      userId: studentUserId,
      role: "STUDENT",
    },
    orderBy: { joinedAt: "desc" },
    select: { id: true, schoolId: true, gradeLevel: true, joinedAt: true, leftAt: true },
  });
}

/* -------------------------------------------------------------------------- */
/* The record                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Builds one child's record.
 *
 * Returns null rather than throwing when the reader is entitled to nothing —
 * "no record" and "not your child" are the same answer on purpose, so this
 * cannot be used to find out whose child is whose.
 */
export async function recordFor(
  ctx: ActiveContext,
  studentUserId: string,
): Promise<StudentRecord | null> {
  const memberships = await membershipsFor(ctx, studentUserId);
  if (memberships.length === 0) return null;

  const membershipIds = memberships.map((m) => m.id);
  const schoolIds = [...new Set(memberships.map((m) => m.schoolId))];

  const [student, names, cards, badges, attendance, certificates] = await Promise.all([
    // User carries no policy. A guardian reading their child's name is fine;
    // the entitlement was settled above.
    db.user.findUnique({
      where: { id: studentUserId },
      select: { name: true, preferredName: true, avatarKey: true },
    }),
    schoolNames(ctx.user.id, schoolIds),
    /**
     * PUBLISHED ONLY, and this is a rule rather than a filter.
     *
     * A draft is a teacher's working copy — the file that writes them says a
     * draft is invisible to the child and the guardian, and a record that is
     * read years later by somebody with no school to ask must not be the one
     * place that leaks one.
     */
    db.reportCard.findMany({
      where: { studentMembershipId: { in: membershipIds }, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true,
        studentMembershipId: true,
        title: true,
        status: true,
        publishedAt: true,
        overallPercentMilli: true,
        attendancePresent: true,
        attendanceTotal: true,
        fromDateKey: true,
        toDateKey: true,
        remark: true,
        items: {
          orderBy: { position: "asc" },
          select: { title: true, category: true, scoreMilli: true, pointsMilli: true },
        },
      },
      take: 100,
    }),
    db.earnedBadge.findMany({
      where: { studentMembershipId: { in: membershipIds } },
      orderBy: { earnedAt: "desc" },
      select: {
        id: true,
        studentMembershipId: true,
        label: true,
        description: true,
        earnedAt: true,
      },
      take: 200,
    }),
    // GROUPED IN THE DATABASE, like insights.ts and school-record.ts. A pupil
    // with six years behind them is thousands of rows and this is one page.
    db.attendanceRecord.groupBy({
      by: ["studentMembershipId", "status"],
      where: { studentMembershipId: { in: membershipIds } },
      _count: { _all: true },
    }),
    db.schoolRecord.findMany({
      where: { studentMembershipId: { in: membershipIds } },
      select: {
        studentMembershipId: true,
        schoolName: true,
        reason: true,
        destination: true,
        note: true,
        reportCardCount: true,
      },
    }),
  ]);

  const certificateBy = new Map(certificates.map((c) => [c.studentMembershipId, c]));

  const schools: RecordSchool[] = memberships.map((membership) => {
    const rows = attendance.filter((a) => a.studentMembershipId === membership.id);
    const marked = rows.reduce((sum, row) => sum + row._count._all, 0);
    // LATE COUNTS AS PRESENT, matching every other attendance figure here. A
    // child who arrived at ten past nine was in school, and a record that says
    // otherwise disagrees with the report cards printed above it.
    const present = rows
      .filter((row) => row.status === "PRESENT" || row.status === "LATE")
      .reduce((sum, row) => sum + row._count._all, 0);

    const certificate = certificateBy.get(membership.id) ?? null;

    return {
      membershipId: membership.id,
      schoolId: membership.schoolId,
      // The certificate's name is FROZEN at issue and is the more honest one:
      // a school that renamed itself in 2027 did not rename the school this
      // child attended in 2024.
      schoolName: certificate?.schoolName ?? names.get(membership.schoolId) ?? "A school",
      gradeLevel: membership.gradeLevel,
      joinedAt: membership.joinedAt,
      leftAt: membership.leftAt,
      current: membership.leftAt === null,
      attendanceMarked: marked,
      attendancePresent: present,
      attendancePercent: marked === 0 ? null : Math.round((present * 1000) / marked) / 10,
      certificate: certificate
        ? {
            reason: certificate.reason,
            destination: certificate.destination,
            note: certificate.note,
            reportCardCount: certificate.reportCardCount,
          }
        : null,
      cards: cards
        .filter((c) => c.studentMembershipId === membership.id)
        .map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          publishedAt: c.publishedAt,
          overallPercent:
            c.overallPercentMilli === null ? null : Math.round(c.overallPercentMilli / 100) / 10,
          attendancePresent: c.attendancePresent,
          attendanceTotal: c.attendanceTotal,
          fromDateKey: c.fromDateKey,
          toDateKey: c.toDateKey,
          remark: c.remark,
          items: c.items,
        })),
      badges: badges
        .filter((b) => b.studentMembershipId === membership.id)
        .map((b) => ({ id: b.id, label: b.label, description: b.description, earnedAt: b.earnedAt })),
    };
  });

  const totalMarked = schools.reduce((sum, s) => sum + s.attendanceMarked, 0);
  const totalPresent = schools.reduce((sum, s) => sum + s.attendancePresent, 0);

  return {
    studentUserId,
    name: student?.name ?? "This pupil",
    preferredName: student?.preferredName ?? null,
    avatarKey: student?.avatarKey ?? null,
    schools,
    totals: {
      schools: schools.length,
      cards: schools.reduce((sum, s) => sum + s.cards.length, 0),
      badges: schools.reduce((sum, s) => sum + s.badges.length, 0),
      attendanceMarked: totalMarked,
      attendancePresent: totalPresent,
      attendancePercent:
        totalMarked === 0 ? null : Math.round((totalPresent * 1000) / totalMarked) / 10,
    },
  };
}

/** The signed-in person's own record, if they have ever been a pupil. */
export function myRecord(ctx: ActiveContext): Promise<StudentRecord | null> {
  return recordFor(ctx, ctx.user.id);
}

/**
 * The children this reader may open a record for.
 *
 * Grouped by the CHILD rather than by the membership, because one child at two
 * schools is one child. That grouping is the "journey" — without it a parent
 * whose daughter moved schools would see two strangers with the same name.
 */
export async function myChildren(ctx: ActiveContext): Promise<RecordChild[]> {
  const links = await db.guardianship.findMany({
    where: { parentUserId: ctx.user.id, status: "ACTIVE" },
    select: { studentMembershipId: true },
  });
  if (links.length === 0) return [];

  const memberships = await db.membership.findMany({
    where: { id: { in: links.map((l) => l.studentMembershipId) }, role: "STUDENT" },
    select: {
      userId: true,
      user: { select: { name: true, preferredName: true, avatarKey: true } },
    },
  });

  const byChild = new Map<string, RecordChild>();
  for (const membership of memberships) {
    const existing = byChild.get(membership.userId);
    if (existing) {
      existing.schoolCount += 1;
      continue;
    }
    byChild.set(membership.userId, {
      studentUserId: membership.userId,
      name: membership.user.name,
      preferredName: membership.user.preferredName,
      avatarKey: membership.user.avatarKey,
      schoolCount: 1,
    });
  }

  return [...byChild.values()];
}

/**
 * Whether this person has a record at all — the routing question.
 *
 * Asked by the signed-in shell when somebody has no ACTIVE role, to tell an
 * alumnus apart from a brand-new parent holding a join code. Cheap on purpose:
 * two counted queries, on a path that runs for everybody who lands roleless.
 */
export async function hasRecord(ctx: ActiveContext): Promise<boolean> {
  const [own, guarded] = await Promise.all([
    db.membership.count({ where: { userId: ctx.user.id, role: "STUDENT" } }),
    db.guardianship.count({ where: { parentUserId: ctx.user.id, status: "ACTIVE" } }),
  ]);
  return own + guarded > 0;
}

/* -------------------------------------------------------------------------- */

/**
 * School names, the one thing here that is not part of the record.
 *
 * `School` is readable only with the school bound, so this is the single narrow
 * widening in this file — one table, on ids the database returned a moment ago
 * under the policies. Tolerant of a missing row rather than `!`: a school
 * deleted out from under an old membership must still render a sentence.
 */
async function schoolNames(userId: string, schoolIds: string[]): Promise<Map<string, string>> {
  if (schoolIds.length === 0) return new Map();
  const schools = await forOwnSchools(userId, schoolIds, () =>
    db.school.findMany({ where: { id: { in: schoolIds } }, select: { id: true, name: true } }),
  );
  return new Map(schools.map((s) => [s.id, s.name]));
}
