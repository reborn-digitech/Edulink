import "server-only";
import { db } from "./db";
import { computeStreak, currentAttendanceRate } from "./attendance";
import type { AttendanceStatus } from "./constants";
import { addDaysToKey, todayKey } from "./dates";
import type { TranslationKey } from "@/lib/i18n/dictionary";

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

/* Keys, not words — the labels resolve at render time in the reader's
   language. Archived copies (EarnedBadge rows) store the English rendering,
   the way every stored artifact in this codebase does. */
export type Badge = {
  id: string;
  labelKey: TranslationKey;
  descriptionKey: TranslationKey;
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

/** The badges read from the register alone: a reader not let see the register is not shown them either (TA-556). */
export const ATTENDANCE_BADGE_IDS: readonly string[] = ["here-all-week", "regular"];

export async function getBadges(
  schoolId: string,
  membershipId: string,
  timezone: string,
): Promise<Badge[]> {
  const all = await getBadgesForMany(schoolId, [membershipId], timezone);
  return all.get(membershipId) ?? assemble(EMPTY_FACTS);
}

/** What the badges are computed from, per pupil. */
type BadgeFacts = {
  days: { dateKey: string; status: AttendanceStatus }[];
  handedIn: number;
  gradedCount: number;
  bestPercent: number;
  approvedPosts: number;
};

const EMPTY_FACTS: BadgeFacts = { days: [], handedIn: 0, gradedCount: 0, bestPercent: 0, approvedPosts: 0 };

/**
 * The same badges for MANY pupils in a handful of queries.
 *
 * WHY A BATCH EXISTS. Closing the academic year snapshots every pupil's badges,
 * and doing that one pupil at a time meant five queries per child: at 1,500
 * pupils the close ran for half a minute inside one request, which is long
 * enough for an admin to assume it failed and press again. Asked for the whole
 * school at once, the same facts are five queries per chunk of pupils, and the
 * single-pupil `getBadges` above is this with a list of one — so the profile a
 * child looks at and the copy the year close writes down can never disagree,
 * because they are the same function.
 *
 * Facts are gathered per pupil, then handed to `assemble`, which is the only
 * place a badge's rule is written.
 */
export async function getBadgesForMany(
  schoolId: string,
  membershipIds: string[],
  timezone: string,
): Promise<Map<string, Badge[]>> {
  const result = new Map<string, Badge[]>();
  if (membershipIds.length === 0) return result;

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

  const facts = new Map<string, BadgeFacts>();
  const factsFor = (id: string): BadgeFacts => {
    let f = facts.get(id);
    if (!f) {
      f = { ...EMPTY_FACTS, days: [] };
      facts.set(id, f);
    }
    return f;
  };
  for (const id of membershipIds) factsFor(id);

  const [records, submissions, grades, posts] = await Promise.all([
    db.attendanceRecord.findMany({
      where: {
        schoolId,
        studentMembershipId: { in: membershipIds },
        session: { dateKey: { gte: windowStart, lte: today } },
      },
      select: { studentMembershipId: true, status: true, session: { select: { dateKey: true } } },
    }),
    db.submission.groupBy({
      by: ["studentMembershipId"],
      where: { studentMembershipId: { in: membershipIds }, submittedAt: { not: null } },
      _count: { _all: true },
    }),
    db.grade.findMany({
      where: { studentMembershipId: { in: membershipIds }, scoreMilli: { not: null } },
      select: { studentMembershipId: true, scoreMilli: true, assignment: { select: { pointsMilli: true } } },
    }),
    db.post.groupBy({
      by: ["authorMembershipId"],
      where: { authorMembershipId: { in: membershipIds }, status: "APPROVED" },
      _count: { _all: true },
    }),
  ]);

  for (const r of records) {
    factsFor(r.studentMembershipId).days.push({ dateKey: r.session.dateKey, status: r.status as AttendanceStatus });
  }
  for (const s of submissions) factsFor(s.studentMembershipId).handedIn = s._count._all;
  for (const g of grades) {
    const f = factsFor(g.studentMembershipId);
    f.gradedCount++;
    if (g.assignment.pointsMilli && g.scoreMilli !== null) {
      f.bestPercent = Math.max(f.bestPercent, Math.round((g.scoreMilli * 100) / g.assignment.pointsMilli));
    }
  }
  for (const p of posts) {
    if (p.authorMembershipId) factsFor(p.authorMembershipId).approvedPosts = p._count._all;
  }

  for (const id of membershipIds) result.set(id, assemble(factsFor(id)));
  return result;
}

function assemble({ days, handedIn, gradedCount, bestPercent, approvedPosts }: BadgeFacts): Badge[] {
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
  const currentStreak = computeStreak(days);
  const spell = currentAttendanceRate(days, MIN_DAYS_FOR_ATTENDANCE_BADGE);

  return [
    {
      id: "here-all-week",
      labelKey: "practice.badgeWeek",
      descriptionKey: "practice.badgeWeekHint",
      earned: currentStreak >= 5,
      progress: currentStreak < 5 ? { current: currentStreak, target: 5 } : undefined,
      icon: "fire",
    },
    {
      id: "regular",
      labelKey: "practice.badgeSolid",
      // Present tense now, because it is a statement about how things stand.
      descriptionKey: "practice.badgeSolidHint",
      // null still means "not enough school days yet to say", which is not the
      // same as failing — a child in their first week has not missed anything.
      earned: spell !== null && spell >= 95,
      icon: "calendar",
    },
    {
      id: "first-hand-in",
      labelKey: "practice.badgeFirstWork",
      descriptionKey: "practice.badgeFirstWorkHint",
      earned: handedIn >= 1,
      icon: "clipboard",
    },
    {
      id: "five-hand-ins",
      labelKey: "practice.badgeFiveWorks",
      descriptionKey: "practice.badgeFiveWorksHint",
      earned: handedIn >= 5,
      progress: handedIn < 5 ? { current: handedIn, target: 5 } : undefined,
      icon: "clipboard",
    },
    {
      id: "marked",
      labelKey: "practice.badgeFeedback",
      descriptionKey: "practice.badgeFeedbackHint",
      earned: gradedCount >= 1,
      icon: "chart",
    },
    {
      id: "top-marks",
      labelKey: "practice.badgeTopMarks",
      descriptionKey: "practice.badgeTopMarksHint",
      earned: bestPercent >= 90,
      icon: "star",
    },
    {
      id: "shared",
      labelKey: "practice.badgeShared",
      descriptionKey: "practice.badgeSharedHint",
      earned: approvedPosts >= 1,
      icon: "megaphone",
    },
  ];
}
