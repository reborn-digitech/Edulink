import "server-only";
import { db } from "./db";
import {
  getAttendanceSummary,
  computeBestStreak,
  computeStreak,
  currentAttendanceRate,
} from "./attendance";
import { addDaysToKey, todayKey } from "./dates";

/**
 * Student badges.
 *
 * DERIVED from real data on every read, never stored — so nothing can drift out
 * of step with what actually happened.
 *
 * EVERY BADGE ASKS WHETHER SOMETHING HAPPENED, NOT WHETHER IT IS STILL TRUE.
 * That distinction is the whole design and it was got wrong once already. The
 * attendance badges used to read the CURRENT streak and the WHOLE-window
 * percentage, so two days off sick took "Rock solid" away from a child who had
 * turned up every day for a month. Being ill is not a thing a seven-year-old
 * chooses, the app has an EXCUSED status precisely because absences are often
 * nobody's fault, and taking a reward away for it is exactly the stress the spec
 * rules out.
 *
 * So: "had a five-day run", not "is on one". "Reached 95%", not "is above 95%".
 * Handed in, marked, published — all things that happened.
 *
 * The honest limit: this reads a 60-day window, so a badge does eventually fade
 * when the evidence itself ages out. That is a slow, quiet edge rather than a
 * punishment for one bad week, and widening it is a one-line change if a term
 * turns out to be the better unit.
 *
 * Deliberately no leaderboard, no points total, and no aggregate anywhere — see
 * the note in student/profile/page.tsx about "3 of 7".
 */

export type Badge = {
  id: string;
  label: string;
  description: string;
  earned: boolean;
  /** Progress toward it, when that is encouraging rather than pressuring. */
  progress?: { current: number; target: number };
  icon: string;
};

/**
 * A month of school days before an attendance percentage means anything.
 *
 * Two floors are at work here and they pull in the same direction. The obvious
 * one: a single day present is "100% attendance", so without a minimum the badge
 * arrives on a child's first morning. The one that had to be measured: over a
 * term of history almost every child has SOME clean fortnight, so at ten days
 * this was earned by all eighteen in the seeded class — including two on 69%.
 * A badge everybody has is not a badge, it is a decoration.
 *
 * Twenty school days is about a month, and it is a real thing to have done.
 */
const MIN_DAYS_FOR_ATTENDANCE_BADGE = 20;

export async function getBadges(
  schoolId: string,
  membershipId: string,
  timezone: string,
): Promise<Badge[]> {
  const today = todayKey(timezone);

  /**
   * THE WINDOW IS THE ACADEMIC YEAR, and that is what makes these badges reset.
   *
   * A rolling sixty days never resets: a child present in June still shows June's
   * badges in July of the following year, which is not what a school means by
   * "this year's badges". Starting the window at the year's start date means a
   * new year genuinely begins empty — nobody holds an attendance badge in the
   * first fortnight of term, because nobody has twenty days of register yet.
   *
   * A school that has not set a year up falls back to sixty days rather than
   * showing nothing, since the badges predate the feature.
   *
   * Queried directly rather than through academic-year.ts, which imports THIS
   * module to take its snapshot — the cycle would be real.
   */
  const year = await db.academicYear.findFirst({
    where: { schoolId, isCurrent: true },
    select: { startDate: true },
  });
  const windowStart = year
    ? year.startDate.toISOString().slice(0, 10)
    : addDaysToKey(today, -60);

  const [attendance, handedIn, gradedCount, approvedPosts, bestPercent] = await Promise.all([
    getAttendanceSummary(schoolId, membershipId, windowStart, today),
    db.submission.count({
      where: { studentMembershipId: membershipId, submittedAt: { not: null } },
    }),
    db.grade.count({ where: { studentMembershipId: membershipId, scoreMilli: { not: null } } }),
    db.post.count({
      where: { authorMembershipId: membershipId, status: "APPROVED" },
    }),
    db.grade
      .findMany({
        where: { studentMembershipId: membershipId, scoreMilli: { not: null } },
        include: { assignment: { select: { pointsMilli: true } } },
      })
      .then((grades) =>
        grades.reduce((best, g) => {
          if (!g.assignment.pointsMilli || g.scoreMilli === null) return best;
          return Math.max(best, Math.round((g.scoreMilli * 100) / g.assignment.pointsMilli));
        }, 0),
      ),
  ]);

  // CURRENT, not best — and this reversed a decision, so the reasoning matters.
  //
  // These used to be "best ever in the window", so that a child who was ill for
  // a fortnight kept the badges a clean month had earned. The school asked for
  // the opposite: a streak that breaks takes its badge with it, the same day.
  // A streak nobody can lose is a participation sticker, and a child watching a
  // number they cannot affect is not being encouraged by it.
  //
  // What stops that being harsh is the academic year, not the window: whatever a
  // child holds when the year is closed is written into EarnedBadge and kept for
  // good (academic-year.ts). Badges can be lost DURING a year and never after
  // it. Quiz badges sit outside this entirely and are permanent from the moment
  // they are earned.
  const currentStreak = computeStreak(attendance.days);
  const spell = currentAttendanceRate(attendance.days, MIN_DAYS_FOR_ATTENDANCE_BADGE);

  return [
    {
      id: "here-all-week",
      label: "Here all week",
      description: "Five school days in a row",
      earned: currentStreak >= 5,
      progress: currentStreak < 5 ? { current: currentStreak, target: 5 } : undefined,
      icon: "fire",
    },
    {
      id: "regular",
      label: "Rock solid",
      // Present tense now, because it is a statement about how things stand.
      description: "Holding 95% attendance",
      // null still means "not enough school days yet to say", which is not the
      // same as failing — a child in their first week has not missed anything.
      earned: spell !== null && spell >= 95,
      icon: "calendar",
    },
    {
      id: "first-hand-in",
      label: "Handed it in",
      description: "Handed in your first piece of work",
      earned: handedIn >= 1,
      icon: "clipboard",
    },
    {
      id: "five-hand-ins",
      label: "On top of it",
      description: "Handed in five pieces of work",
      earned: handedIn >= 5,
      progress: handedIn < 5 ? { current: handedIn, target: 5 } : undefined,
      icon: "clipboard",
    },
    {
      id: "marked",
      label: "Getting feedback",
      description: "Had work marked by a teacher",
      earned: gradedCount >= 1,
      icon: "chart",
    },
    {
      id: "top-marks",
      label: "Top marks",
      description: "Scored 90% or more on a piece of work",
      earned: bestPercent >= 90,
      icon: "star",
    },
    {
      id: "shared",
      label: "Shared something",
      description: "Had a post published on the bulletin",
      earned: approvedPosts >= 1,
      icon: "megaphone",
    },
  ];
}
