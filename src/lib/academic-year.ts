import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { getBadges } from "./badges";
import type { ActiveContext } from "./session";
import { translator } from "@/lib/i18n/dictionary";

/** Stored badge copies are written once — in English, the stored-text precedent. */
const tEn = translator("en");

/**
 * The academic year, and what survives the end of one.
 *
 * THE RULE THIS EXISTS TO ENFORCE. An attendance badge is a statement about now:
 * a streak that breaks takes its badge with it the same day, because a streak
 * nobody can lose is a participation sticker. But a year's achievements must not
 * vanish because the next year started. So:
 *
 *   - within a year, attendance badges are DERIVED live from the register and
 *     can disappear (badges.ts);
 *   - closing a year SNAPSHOTS whatever each child holds at that moment into
 *     EarnedBadge rows, which nothing ever recalculates;
 *   - quiz badges skip all of this — they are written permanent the moment they
 *     are earned, because finishing a topic is something a child did once and no
 *     later absence can undo it.
 *
 * CLOSING IS AN ADMIN ACTION, NEVER A DATE. A school decides when its year
 * ended. Rolling over automatically on a stored end date would archive a
 * child's badges in the middle of an exam week because somebody typed the wrong
 * date in August.
 */

export type AcademicYearInput = {
  name: string;
  startDate: Date;
  endDate: Date;
};

/** The year a school is currently running, if it has said. */
export async function currentAcademicYear(schoolId: string) {
  return db.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    orderBy: { startDate: "desc" },
  });
}

export async function listAcademicYears(session: ActiveContext) {
  if (session.role !== "ADMIN" || !session.schoolId) return [];
  return db.academicYear.findMany({
    where: { schoolId: session.schoolId },
    orderBy: { startDate: "desc" },
  });
}

export async function createAcademicYear(
  session: ActiveContext,
  input: AcademicYearInput,
): Promise<string> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyASchoolAdminCanSetUp");
  }
  if (input.endDate <= input.startDate) {
    throw new AccessError("access.theYearHasToEndAfterIt");
  }

  const schoolId = session.schoolId;
  const existing = await currentAcademicYear(schoolId);

  const year = await db.academicYear.create({
    data: {
      schoolId,
      name: input.name,
      startDate: input.startDate,
      endDate: input.endDate,
      // The first year a school creates becomes current; later ones wait to be
      // started deliberately, so adding next year's dates in advance does not
      // silently end this one.
      isCurrent: existing === null,
    },
  });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "year.create",
    targetType: "AcademicYear",
    targetId: year.id,
    meta: { name: input.name, becameCurrent: existing === null },
  });

  return year.id;
}

/**
 * Ends the current year and starts the next one.
 *
 * THE ORDER MATTERS AND IS THE WHOLE FUNCTION. Every child's badges are read and
 * written down BEFORE the year flips, because the moment it flips those same
 * badges are recalculated against an empty register and would all read as
 * unearned. Snapshot, then flip.
 *
 * Idempotent by the unique key on (student, badge, year): running it twice
 * archives nothing extra, which matters because an admin who is not sure it
 * worked will press it again.
 */
export async function closeAcademicYear(
  session: ActiveContext,
  closingYearId: string,
  nextYearId: string,
): Promise<{ studentsArchived: number; badgesArchived: number }> {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("access.onlyASchoolAdminCanCloseThe");
  }
  const schoolId = session.schoolId;

  const closing = await db.academicYear.findFirst({ where: { id: closingYearId, schoolId } });
  const next = await db.academicYear.findFirst({ where: { id: nextYearId, schoolId } });
  if (!closing || !next) throw new AccessError("access.academicYearNotFound", "NOT_FOUND");
  if (closing.id === next.id) throw new AccessError("access.pickADifferentYearToMoveInto");

  const school = await db.school.findUniqueOrThrow({
    where: { id: schoolId },
    select: { timezone: true },
  });

  const students = await db.membership.findMany({
    where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: { id: true },
  });

  let badgesArchived = 0;

  for (const student of students) {
    // Derived, live, as the child's own profile shows them right now.
    const badges = await getBadges(schoolId, student.id, school.timezone);
    const earned = badges.filter((b) => b.earned);

    for (const badge of earned) {
      const created = await db.earnedBadge.upsert({
        where: {
          studentMembershipId_badgeId_academicYearId: {
            studentMembershipId: student.id,
            badgeId: badge.id,
            academicYearId: closing.id,
          },
        },
        create: {
          schoolId,
          studentMembershipId: student.id,
          academicYearId: closing.id,
          badgeId: badge.id,
          // Stored artifacts keep the English rendering — the notify()/email
          // precedent. The LIVE profile renders the key in the reader's language.
          label: tEn(badge.labelKey),
          description: tEn(badge.descriptionKey),
          permanent: false,
        },
        update: {},
      });
      if (created.createdAt.getTime() > Date.now() - 5_000) badgesArchived++;
    }
  }

  // Only now does the year change. Anything above this line still sees the year
  // it is preserving.
  await db.academicYear.updateMany({ where: { schoolId }, data: { isCurrent: false } });
  await db.academicYear.update({
    where: { id: closing.id },
    data: { closedAt: new Date() },
  });
  await db.academicYear.update({ where: { id: next.id }, data: { isCurrent: true } });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "year.close",
    targetType: "AcademicYear",
    targetId: closing.id,
    meta: { closed: closing.name, opened: next.name, students: students.length, badgesArchived },
  });

  return { studentsArchived: students.length, badgesArchived };
}

/**
 * Every badge a child holds: this year's live ones, and every past year's
 * archived ones, which never change again.
 */
export async function badgeHistory(schoolId: string, studentMembershipId: string) {
  const rows = await db.earnedBadge.findMany({
    where: { schoolId, studentMembershipId },
    include: { academicYear: { select: { name: true } } },
    orderBy: { earnedAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    badgeId: row.badgeId,
    label: row.label,
    description: row.description,
    permanent: row.permanent,
    yearName: row.academicYear?.name ?? null,
    earnedAt: row.earnedAt,
  }));
}

/**
 * Writes a badge that can never be taken away.
 *
 * Used by the quiz: finishing a topic without opening a single solution is a
 * thing a child did, on a day, and it stays done. No academic year, no
 * recalculation, no expiry.
 */
export async function awardPermanentBadge(
  schoolId: string,
  studentMembershipId: string,
  badge: { badgeId: string; label: string; description?: string },
): Promise<boolean> {
  // findFirst + create rather than upsert: a compound unique cannot be TARGETED
  // through a null member, and a permanent badge deliberately has no year. The
  // unique index still stops a duplicate if two requests race — which is why the
  // create is allowed to fail quietly below rather than being trusted to be the
  // only writer. Returns whether THIS call created the badge, so a caller can
  // audit or announce a genuinely new award without re-announcing an old one.
  const existing = await db.earnedBadge.findFirst({
    where: { studentMembershipId, badgeId: badge.badgeId, academicYearId: null },
    select: { id: true },
  });
  if (existing) return false;

  try {
    await db.earnedBadge.create({
      data: {
        schoolId,
        studentMembershipId,
        academicYearId: null,
        badgeId: badge.badgeId,
        label: badge.label,
        description: badge.description ?? "",
        permanent: true,
      },
    });
    return true;
  } catch (error) {
    // A unique violation here means somebody else just awarded the same badge,
    // which is the outcome we wanted. Anything else is ours.
    const duplicate =
      typeof error === "object" && error !== null && (error as { code?: string }).code === "P2002";
    if (!duplicate) throw error;
    return false;
  }
}
