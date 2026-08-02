import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { isDateKey, dateKeyRange, isTeachingDay } from "./dates";
import type { ActiveContext } from "./session";

/**
 * Chhutti Calendar — the days the school is shut, and the days it wants marked.
 *
 * WHAT THIS IS ACTUALLY FOR, because it is not what it first looks like.
 * The obvious motivation is "attendance should not count holidays". That turned
 * out to be already true and for a better reason than a holiday table: an
 * attendance percentage here divides by the registers that were TAKEN, not by
 * the days on a calendar (see getAttendanceSummary). Nobody takes a register on
 * Diwali, so no record exists, so nothing is counted. Adding holidays to that
 * denominator would have been solving a problem twice.
 *
 * The real hole is the opposite one: a register taken on a day the school is
 * SHUT. Thirty children marked absent on a public holiday is a denominator that
 * genuinely lies, and it is the sort of thing that happens when a teacher opens
 * the register app out of habit. So the calendar's job in the attendance path is
 * to WARN, loudly and before the fact — see the closed-day banner on the
 * register.
 *
 * It does not BLOCK. Schools do teach on Saturdays, run exam sessions during
 * what the calendar calls a break, and hold catch-up classes over half term.
 * Refusing the save would mean a teacher standing in front of a real class that
 * the app insists does not exist.
 *
 * KIND. Only HOLIDAY closes the school. EXAM and EVENT are on the same calendar
 * because that is where a parent looks for them, but the school is open and a
 * register is expected — which is exactly why they are a separate kind rather
 * than a colour.
 */

export const HOLIDAY_KINDS = ["HOLIDAY", "EXAM", "EVENT"] as const;
export type HolidayKind = (typeof HOLIDAY_KINDS)[number];

export const HOLIDAY_KIND_META: Record<
  HolidayKind,
  { label: string; description: string; closesSchool: boolean }
> = {
  HOLIDAY: {
    label: "Holiday",
    description: "School is shut. No register is expected.",
    closesSchool: true,
  },
  EXAM: {
    label: "Exam",
    description: "School is open and the register is still taken.",
    closesSchool: false,
  },
  EVENT: {
    label: "Event",
    description: "School is open — sports day, a trip, a function.",
    closesSchool: false,
  },
};

/**
 * A single entry may not span more than a year.
 *
 * Not arbitrary: every helper below expands a range into individual date keys,
 * so a typo of 2026 for 2027 in the end date is the difference between 90 rows
 * and 36,500. The cap turns that typo into a validation message instead of a
 * page that stops responding.
 */
export const MAX_HOLIDAY_SPAN_DAYS = 366;

export type HolidayInput = {
  name: string;
  startDateKey: string;
  endDateKey: string;
  kind: HolidayKind;
  note?: string | null;
  /** Optional: pins the entry to a year so closing one can archive its calendar. */
  academicYearId?: string | null;
};

/** The shape the pure helpers need. Deliberately not the Prisma row. */
export type HolidaySpan = {
  startDateKey: string;
  endDateKey: string;
  kind: string;
};

/* -------------------------------------------------------------------------- */
/* Pure range maths — no database, so it can be tested without one             */
/* -------------------------------------------------------------------------- */

/**
 * How many days a span covers, inclusive. -1 for a span that is not a valid one.
 *
 * Computed by arithmetic rather than by walking the range, SPECIFICALLY so that
 * it can be used to reject an over-long span. `dateKeyRange` caps its output and
 * truncates silently, so counting its length can never tell you that a range was
 * too long — it just hands back the cap and looks like a legitimate answer.
 */
export function spanLengthDays(span: HolidaySpan): number {
  if (!isDateKey(span.startDateKey) || !isDateKey(span.endDateKey)) return -1;
  if (span.endDateKey < span.startDateKey) return -1;
  const ms =
    Date.parse(`${span.endDateKey}T00:00:00Z`) - Date.parse(`${span.startDateKey}T00:00:00Z`);
  return Math.round(ms / 86_400_000) + 1;
}

/**
 * Every date key a span covers, inclusive of both ends.
 *
 * An over-long span returns nothing rather than the first 366 days of one. A
 * truncated range is the worse failure: it looks like an answer, and a caller
 * asking "is the school shut on 12 June" would be told no because the range it
 * was given got cut off in March.
 */
export function spanDayKeys(span: HolidaySpan): string[] {
  const length = spanLengthDays(span);
  if (length < 1 || length > MAX_HOLIDAY_SPAN_DAYS) return [];
  return dateKeyRange(span.startDateKey, span.endDateKey, MAX_HOLIDAY_SPAN_DAYS);
}

/**
 * The set of days on which the school is SHUT.
 *
 * Only HOLIDAY spans contribute. An exam week is on the calendar and the school
 * is open, so counting it as closed would quietly shrink every "out of N school
 * days" figure in the app by a week each term.
 */
export function closedDayKeys(spans: HolidaySpan[]): Set<string> {
  const closed = new Set<string>();
  for (const span of spans) {
    if (!HOLIDAY_KIND_META[span.kind as HolidayKind]?.closesSchool) continue;
    for (const key of spanDayKeys(span)) closed.add(key);
  }
  return closed;
}

/**
 * Is the school shut on this date, per the calendar?
 *
 * Sunday counts as shut without anyone declaring it. SATURDAY DOES NOT — this
 * school teaches Monday to Saturday, so a Saturday is an ordinary school day
 * and a Saturday holiday is a real one that has to be declared like any other.
 */
export function isSchoolClosed(spans: HolidaySpan[], dateKey: string): boolean {
  if (!isTeachingDay(dateKey)) return true;
  return closedDayKeys(spans).has(dateKey);
}

/** The calendar entries covering a given day, closing or not. */
export function entriesOn<T extends HolidaySpan>(spans: T[], dateKey: string): T[] {
  return spans.filter(
    (span) => span.startDateKey <= dateKey && dateKey <= span.endDateKey,
  );
}

/**
 * Teaching days between two dates, inclusive: school days that are not holidays.
 *
 * The week is MONDAY TO SATURDAY — six teaching days, Sunday off — which is why
 * this asks `isTeachingDay` and not `isWeekend`. Getting that backwards
 * understates every "out of N school days" figure in the app by a sixth, which
 * is a whole day a week on a number families compare.
 *
 * Still one school's week rather than a setting; `isTeachingDay` carries the
 * note about where to change that.
 */
export function schoolDaysBetween(
  fromKey: string,
  toKey: string,
  spans: HolidaySpan[],
): number {
  const length = spanLengthDays({ startDateKey: fromKey, endDateKey: toKey, kind: "HOLIDAY" });
  if (length < 1) return 0;
  // Loud rather than truncated. A silently capped count would read as a real
  // number of school days and be wrong by however much got cut off — and this
  // is a caller's window, not a user's typing, so it is a bug to be seen.
  if (length > MAX_HOLIDAY_SPAN_DAYS) {
    throw new Error(`schoolDaysBetween: window of ${length} days exceeds ${MAX_HOLIDAY_SPAN_DAYS}`);
  }

  const closed = closedDayKeys(spans);
  let days = 0;
  for (const key of dateKeyRange(fromKey, toKey, MAX_HOLIDAY_SPAN_DAYS)) {
    if (!isTeachingDay(key)) continue;
    if (closed.has(key)) continue;
    days++;
  }
  return days;
}

/** The next entry starting on or after `fromKey`, for the "coming up" line. */
export function nextEntry<T extends HolidaySpan & { name?: string }>(
  spans: T[],
  fromKey: string,
): T | null {
  const upcoming = spans
    .filter((span) => span.endDateKey >= fromKey)
    .sort((a, b) => a.startDateKey.localeCompare(b.startDateKey));
  return upcoming[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The school's calendar, optionally windowed.
 *
 * The window test is OVERLAP, not containment: a summer break that starts in May
 * and ends in July is part of June's calendar, and a containment test would drop
 * it from every month it actually covers except the first.
 */
export async function listHolidays(
  schoolId: string,
  window?: { fromKey?: string; toKey?: string },
) {
  const from = window?.fromKey && isDateKey(window.fromKey) ? window.fromKey : null;
  const to = window?.toKey && isDateKey(window.toKey) ? window.toKey : null;

  return db.holiday.findMany({
    where: {
      schoolId,
      ...(to ? { startDateKey: { lte: to } } : {}),
      ...(from ? { endDateKey: { gte: from } } : {}),
    },
    orderBy: [{ startDateKey: "asc" }, { name: "asc" }],
  });
}

/**
 * Whether the school is shut on one particular day, asked of the database.
 *
 * Used by the register, which needs the answer for today and does not want the
 * whole year to get it. Overlap again, so a day in the middle of a long break
 * still answers yes.
 */
export async function closedOn(
  schoolId: string,
  dateKey: string,
): Promise<{ closed: boolean; entries: { name: string; kind: string }[] }> {
  if (!isDateKey(dateKey)) return { closed: false, entries: [] };

  const rows = await db.holiday.findMany({
    where: {
      schoolId,
      startDateKey: { lte: dateKey },
      endDateKey: { gte: dateKey },
    },
    select: { name: true, kind: true },
  });

  return {
    closed: rows.some((row) => HOLIDAY_KIND_META[row.kind as HolidayKind]?.closesSchool),
    entries: rows,
  };
}

/* -------------------------------------------------------------------------- */
/* Writes — admin only                                                         */
/* -------------------------------------------------------------------------- */

function requireAdmin(session: ActiveContext): string {
  if (session.role !== "ADMIN" || !session.schoolId) {
    throw new AccessError("Only a school admin can edit the calendar");
  }
  return session.schoolId;
}

/**
 * Validates a span and normalises it.
 *
 * A single day is start === end rather than a null end, so every reader can use
 * one inclusive-range rule and none of them needs a special case. The form fills
 * the end date in from the start date when the admin leaves it blank.
 */
function normalise(input: HolidayInput): HolidayInput {
  const name = input.name.trim();
  if (name.length < 2) throw new AccessError("Give the entry a name");
  if (name.length > 120) throw new AccessError("That name is too long");

  if (!isDateKey(input.startDateKey)) throw new AccessError("Start date is not a real date");
  const endDateKey = input.endDateKey || input.startDateKey;
  if (!isDateKey(endDateKey)) throw new AccessError("End date is not a real date");
  if (endDateKey < input.startDateKey) {
    throw new AccessError("The end date cannot be before the start date");
  }
  const length = spanLengthDays({ ...input, endDateKey });
  if (length > MAX_HOLIDAY_SPAN_DAYS) {
    throw new AccessError(
      `That range covers ${length} days — a single entry cannot be longer than a year`,
    );
  }
  if (!HOLIDAY_KINDS.includes(input.kind)) {
    throw new AccessError("Pick holiday, exam or event");
  }

  return {
    name,
    startDateKey: input.startDateKey,
    endDateKey,
    kind: input.kind,
    note: input.note?.trim() || null,
    academicYearId: input.academicYearId ?? null,
  };
}

export async function createHoliday(
  session: ActiveContext,
  input: HolidayInput,
): Promise<string> {
  const schoolId = requireAdmin(session);
  const clean = normalise(input);

  // Pin to the year the school is currently running unless told otherwise, so a
  // calendar can be listed per year later without the admin having to say.
  const yearId =
    clean.academicYearId ??
    (
      await db.academicYear.findFirst({
        where: { schoolId, isCurrent: true },
        select: { id: true },
      })
    )?.id ??
    null;

  const holiday = await db.holiday.create({
    data: {
      schoolId,
      academicYearId: yearId,
      name: clean.name,
      startDateKey: clean.startDateKey,
      endDateKey: clean.endDateKey,
      kind: clean.kind,
      note: clean.note ?? null,
    },
    select: { id: true },
  });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "holiday.create",
    targetType: "Holiday",
    targetId: holiday.id,
    meta: { name: clean.name, from: clean.startDateKey, to: clean.endDateKey, kind: clean.kind },
  });

  return holiday.id;
}

export async function updateHoliday(
  session: ActiveContext,
  holidayId: string,
  input: HolidayInput,
): Promise<void> {
  const schoolId = requireAdmin(session);
  const clean = normalise(input);

  // Scoped find before the write. RLS would refuse a cross-school update anyway,
  // but a silent zero-row update is indistinguishable from success to a caller.
  const existing = await db.holiday.findFirst({
    where: { id: holidayId, schoolId },
    select: { id: true },
  });
  if (!existing) throw new AccessError("Calendar entry not found", "NOT_FOUND");

  await db.holiday.update({
    where: { id: holidayId },
    data: {
      name: clean.name,
      startDateKey: clean.startDateKey,
      endDateKey: clean.endDateKey,
      kind: clean.kind,
      note: clean.note ?? null,
    },
  });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "holiday.update",
    targetType: "Holiday",
    targetId: holidayId,
    meta: { name: clean.name, from: clean.startDateKey, to: clean.endDateKey, kind: clean.kind },
  });
}

export async function deleteHoliday(
  session: ActiveContext,
  holidayId: string,
): Promise<void> {
  const schoolId = requireAdmin(session);

  const existing = await db.holiday.findFirst({
    where: { id: holidayId, schoolId },
    select: { id: true, name: true, startDateKey: true },
  });
  if (!existing) throw new AccessError("Calendar entry not found", "NOT_FOUND");

  await db.holiday.delete({ where: { id: holidayId } });

  await audit({
    schoolId,
    actorUserId: session.user.id,
    action: "holiday.delete",
    targetType: "Holiday",
    targetId: holidayId,
    meta: { name: existing.name, from: existing.startDateKey },
  });
}
