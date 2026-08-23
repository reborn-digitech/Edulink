import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { getBadgesForMany } from "./badges";
import type { Prisma } from "@prisma/client";
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

/** Pupils per snapshot round-trip; 250 keeps the `IN` lists and the insert comfortably sized. */
const SNAPSHOT_CHUNK = 250;

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
): Promise<{ studentsArchived: number; badgesArchived: number; seriesArchived: number; roundsClosed: number }> {
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

  /**
   * IN CHUNKS, NOT ONE CHILD AT A TIME. The first version of this loop asked
   * for each pupil's badges separately and wrote each badge with its own
   * upsert: five reads and up to seven writes per child, which the three-year
   * simulation measured at thirty-five seconds for a school of 1,500 — one
   * request, long enough to look broken. Now every chunk of pupils is read in
   * a handful of school-wide queries (`getBadgesForMany`, the same function
   * the profile page uses with a list of one) and written with a single
   * createMany. The unique key on (student, badge, year) still makes a second
   * press harmless: `skipDuplicates` leaves the first run's rows alone and
   * counts only what this run actually added, which is the honest number for
   * the audit row.
   */
  let badgesArchived = 0;
  for (let at = 0; at < students.length; at += SNAPSHOT_CHUNK) {
    const chunk = students.slice(at, at + SNAPSHOT_CHUNK).map((s) => s.id);
    const badgesByStudent = await getBadgesForMany(schoolId, chunk, school.timezone);
    const rows: Prisma.EarnedBadgeCreateManyInput[] = [];
    for (const studentId of chunk) {
      for (const badge of badgesByStudent.get(studentId) ?? []) {
        if (!badge.earned) continue;
        rows.push({
          schoolId,
          studentMembershipId: studentId,
          academicYearId: closing.id,
          badgeId: badge.id,
          // Stored artifacts keep the English rendering — the notify()/email
          // precedent. The LIVE profile renders the key in the reader's language.
          label: tEn(badge.labelKey),
          description: tEn(badge.descriptionKey),
          permanent: false,
        });
      }
    }
    if (rows.length > 0) {
      const written = await db.earnedBadge.createMany({ data: rows, skipDuplicates: true });
      badgesArchived += written.count;
    }
  }

  /**
   * THE YEAR TIDIES ITSELF. Three years on, an admin's exams page listed
   * every series the school had ever run and a pupil's Marks tab carried
   * nine, because nothing ever archived a series or closed a round. Now the
   * closing year takes its own furniture with it: every live exam series
   * whose papers all fall on or before the year's last day, and every open
   * review round due to close by then. The marks and the cards are untouched
   * — an archived series is one the exams page no longer offers, not one
   * whose results are gone — and the archive page lists them by year.
   */
  const endKey = closing.endDate.toISOString().slice(0, 10);
  const liveSeries = await db.examSeries.findMany({
    where: { schoolId, archivedAt: null },
    select: { id: true, createdAt: true, slots: { select: { dateKey: true } } },
  });
  const toArchive = liveSeries
    .filter((series) =>
      series.slots.length > 0
        ? series.slots.every((slot) => slot.dateKey <= endKey)
        : series.createdAt <= closing.endDate,
    )
    .map((series) => series.id);
  const seriesArchived = toArchive.length
    ? (await db.examSeries.updateMany({ where: { id: { in: toArchive } }, data: { archivedAt: new Date() } })).count
    : 0;
  const roundsClosed = (
    await db.reviewRound.updateMany({
      where: { schoolId, status: "OPEN", closesDateKey: { lte: endKey } },
      data: { status: "CLOSED" },
    })
  ).count;

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
    meta: { closed: closing.name, opened: next.name, students: students.length, badgesArchived, seriesArchived, roundsClosed },
  });

  return { studentsArchived: students.length, badgesArchived, seriesArchived, roundsClosed };
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
