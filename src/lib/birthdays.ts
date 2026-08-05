import "server-only";
import { db } from "./db";
import { dateKeyRange } from "./dates";
import type { ActiveContext } from "./session";

/**
 * Birthdays, on the school calendar.
 *
 * DERIVED, NEVER STORED, and this is the same argument `badges.ts` makes. A
 * birthday is not an event a school decided to hold; it is a fact about a person
 * that recurs. Writing a Holiday row for it would mean 400 rows a year that
 * somebody has to delete when a child leaves, that go stale when a date is
 * corrected, and that an admin can edit into disagreeing with the record they
 * were generated from.
 *
 * A BIRTHDAY IS A CALENDAR DATE, NOT AN INSTANT, which is why nothing here
 * converts a timezone. `User.birthdate` is stored as UTC midnight with
 * date-only semantics, so the day and month are read straight off it and
 * compared against the school's date keys. Converting would move somebody's
 * birthday by a day for half the world, which is exactly the bug the rest of
 * this codebase spends `dateKey` avoiding.
 *
 * STAFF-ONLY, BY WHERE IT IS RENDERED. This feeds `/admin/calendar`, which
 * `requireRole("ADMIN", "PRINCIPAL")` guards; pupils and guardians have no
 * calendar page at all. That matters more than it looks: a child's date of
 * birth is the SECOND FACTOR when a parent claims them with a student code
 * (`claimChild`), and publishing dates of birth to classmates would quietly
 * reduce that to one factor. An admin can already read the whole directory and
 * link a guardian by hand, so showing them a birthday tells them nothing new —
 * showing a pupil would. If this ever moves to a page pupils can open, that
 * decision has to be made deliberately and the claim gate revisited.
 */

export type Birthday = {
  membershipId: string;
  name: string;
  role: string;
  /** The day it falls on this year, as a school-timezone date key. */
  dateKey: string;
  /** The age they reach, when the year of birth is known. */
  turning: number | null;
  /** True when they were born on 29 February and this year has no such day. */
  movedFromLeapDay: boolean;
};

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Everybody at this school with a birthday between two date keys.
 *
 * Walks the range day by day rather than doing month/day arithmetic on a
 * boundary, because the range regularly crosses a new year — a calendar showing
 * "the next 120 days" in November is asking about two different years, and
 * `birthMonth >= fromMonth && birthMonth <= toMonth` is empty for all of it.
 */
export async function birthdaysBetween(
  ctx: ActiveContext,
  fromDateKey: string,
  toDateKey: string,
): Promise<Birthday[]> {
  if (!ctx.schoolId) return [];

  const members = await db.membership.findMany({
    where: {
      schoolId: ctx.schoolId,
      status: "ACTIVE",
      leftAt: null,
      role: { in: ["STUDENT", "TEACHER", "ADMIN", "PRINCIPAL"] },
      user: { birthdate: { not: null } },
    },
    select: {
      id: true,
      role: true,
      user: { select: { name: true, preferredName: true, birthdate: true } },
    },
  });
  if (members.length === 0) return [];

  // Capped by `dateKeyRange` itself at 400 days, which is the guard against a
  // caller asking for a decade and this function building 3,650 buckets.
  const days = dateKeyRange(fromDateKey, toDateKey);

  const byMonthDay = new Map<string, typeof members>();
  for (const member of members) {
    const birthdate = member.user.birthdate!;
    const key = `${birthdate.getUTCMonth() + 1}-${birthdate.getUTCDate()}`;
    const bucket = byMonthDay.get(key);
    if (bucket) bucket.push(member);
    else byMonthDay.set(key, [member]);
  }

  const out: Birthday[] = [];
  for (const dateKey of days) {
    const [yearStr, monthStr, dayStr] = dateKey.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);

    const buckets = [byMonthDay.get(`${month}-${day}`) ?? []];

    /**
     * THE 29th OF FEBRUARY, which three quarters of years do not have.
     *
     * Somebody born on a leap day has a birthday every year, and a calendar
     * that silently omits them for three years running is worse than one that
     * picks a day: the child is simply missing while their classmates are
     * named. They are shown on the 28th, and the flag says why, so nobody has
     * to wonder whether the date is wrong.
     */
    const leapDayFallsHere = month === 2 && day === 28 && !isLeapYear(year);
    if (leapDayFallsHere) buckets.push(byMonthDay.get("2-29") ?? []);

    for (let i = 0; i < buckets.length; i += 1) {
      for (const member of buckets[i]!) {
        const birthdate = member.user.birthdate!;
        const birthYear = birthdate.getUTCFullYear();
        out.push({
          membershipId: member.id,
          name: member.user.preferredName ?? member.user.name,
          role: member.role,
          dateKey,
          // NULL rather than a number when the year looks like a placeholder.
          // A "turning 1,026" on a school calendar is how a mistyped year gets
          // found, and printing it as fact is how it does not.
          turning: birthYear > 1900 && birthYear < year ? year - birthYear : null,
          movedFromLeapDay: i === 1,
        });
      }
    }
  }

  // By date, then by name, so the same day always reads in the same order.
  return out.sort((a, b) => a.dateKey.localeCompare(b.dateKey) || a.name.localeCompare(b.name));
}
