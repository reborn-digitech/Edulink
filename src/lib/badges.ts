import "server-only";
import { db } from "./db";
import { getAttendanceSummary, computeStreak } from "./attendance";
import { addDaysToKey, todayKey } from "./dates";

/**
 * Student badges.
 *
 * DERIVED from real data on every read, never stored. Two reasons:
 *
 *   * a stored badge drifts — a child keeps a "perfect week" badge after the
 *     week stops being perfect, and nobody notices until a parent asks;
 *   * the spec asks for gamification that is "never stress-inducing". Nothing
 *     here can be lost. A badge is either earned right now or is shown as a
 *     quiet, achievable next step — there is no streak to break, no counter
 *     resetting to zero, and no comparison with anyone else.
 *
 * Deliberately no leaderboard and no points total.
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

export async function getBadges(
  schoolId: string,
  membershipId: string,
  timezone: string,
): Promise<Badge[]> {
  const today = todayKey(timezone);

  const [attendance, handedIn, gradedCount, approvedPosts, bestPercent] = await Promise.all([
    getAttendanceSummary(schoolId, membershipId, addDaysToKey(today, -60), today),
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

  const streak = computeStreak(attendance.recent);

  return [
    {
      id: "here-all-week",
      label: "Here all week",
      description: "Five school days in a row",
      earned: streak >= 5,
      progress: streak < 5 ? { current: streak, target: 5 } : undefined,
      icon: "fire",
    },
    {
      id: "regular",
      label: "Rock solid",
      description: "Attendance above 95%",
      earned: attendance.percent !== null && attendance.percent >= 95,
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
