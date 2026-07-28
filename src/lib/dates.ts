/**
 * Calendar-date handling.
 *
 * Attendance, due dates and progress reports are *calendar* concepts: "was
 * Maya here on Monday" is a question about the school's local Monday, not about
 * a UTC instant. Storing only an instant means a 19:00 evening class in
 * Auckland lands on the wrong day for anyone reading it, and the two annual DST
 * transitions silently merge or duplicate a session.
 *
 * So: the identity of an attendance session is `dateKey` — YYYY-MM-DD resolved
 * in the school's IANA timezone. Instants are kept alongside for ordering only.
 *
 * Intl.DateTimeFormat does the zone maths, which means no tz dependency and no
 * stale tzdata copy of our own.
 */

const KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDateKey(value: string): boolean {
  if (!KEY_RE.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  // Round-trip through UTC to reject 2026-02-30 and accept 2024-02-29.
  const probe = new Date(Date.UTC(y, m - 1, d));
  return (
    probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d
  );
}

/** The school-local calendar date of `instant`, as YYYY-MM-DD. */
export function dateKeyInZone(instant: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today's date key in the school's zone. */
export function todayKey(timeZone: string, now: Date = new Date()): string {
  return dateKeyInZone(now, timeZone);
}

/**
 * The UTC instant of local midnight starting `dateKey` in `timeZone`.
 *
 * Two-pass: guess that local midnight equals UTC midnight, measure how far off
 * the zone actually was at that guess, correct, then re-measure. The second
 * pass is what makes DST-transition days come out right — the offset at the
 * guess can differ from the offset at the answer.
 *
 * On "spring forward" days where 00:00 does not exist locally, this returns the
 * first instant that does exist on that local date, which is the behaviour we
 * want for "start of the school day".
 */
export function zonedStartOfDay(dateKey: string, timeZone: string): Date {
  if (!isDateKey(dateKey)) throw new Error(`Invalid dateKey: ${dateKey}`);
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const utcGuess = Date.UTC(y, m - 1, d);
  let instant = utcGuess - offsetMs(new Date(utcGuess), timeZone);
  instant = utcGuess - offsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

/** Zone offset in ms (east of UTC positive) at a given instant. */
function offsetMs(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  // Intl renders midnight as hour 24 in some engines/locales.
  const hour = get("hour") % 24;
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), hour, get("minute"), get("second"));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Shift a date key by whole days, staying on the calendar. */
export function addDaysToKey(dateKey: string, days: number): string {
  if (!isDateKey(dateKey)) throw new Error(`Invalid dateKey: ${dateKey}`);
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  const shifted = new Date(Date.UTC(y, m - 1, d + days));
  return shifted.toISOString().slice(0, 10);
}

/** Inclusive list of keys from `from` to `to`. Capped to avoid runaway ranges. */
export function dateKeyRange(from: string, to: string, max = 400): string[] {
  const out: string[] = [];
  let cursor = from;
  while (cursor <= to && out.length < max) {
    out.push(cursor);
    cursor = addDaysToKey(cursor, 1);
  }
  return out;
}

/** 0 = Sunday. Weekend detection for attendance calendars. */
export function weekdayOfKey(dateKey: string): number {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function isWeekend(dateKey: string): boolean {
  const day = weekdayOfKey(dateKey);
  return day === 0 || day === 6;
}

/* -------------------------------------------------------------------------- */
/* Display                                                                     */
/* -------------------------------------------------------------------------- */

export function formatDateKey(
  dateKey: string,
  opts: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" },
  locale = "en",
): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export function formatInZone(
  instant: Date,
  timeZone: string,
  opts: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" },
  locale = "en",
): string {
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone }).format(instant);
}

/** "in 3 days", "2 hours ago" — for due dates and activity feeds. */
export function relativeTime(target: Date, now: Date = new Date(), locale = "en"): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  const diffMs = target.getTime() - now.getTime();
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units) {
    if (Math.abs(diffMs) >= ms) return rtf.format(Math.round(diffMs / ms), unit);
  }
  return rtf.format(Math.round(diffMs / 1000), "second");
}

/** Age in whole years, used for the consent age gate. */
export function ageInYears(birthdate: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - birthdate.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - birthdate.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < birthdate.getUTCDate())) age--;
  return age;
}

/** Parses a YYYY-MM-DD birthdate to the UTC-midnight instant we store. */
export function parseDateOnly(value: string): Date | null {
  if (!isDateKey(value)) return null;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Compares a stored birthdate against one a user typed.
 *
 * Compared field-by-field in UTC rather than by timestamp equality: the stored
 * value is a date-only instant at UTC midnight, and any code path that ever
 * writes it with a time component (an import, a migration, a future admin edit)
 * would otherwise silently start rejecting every correct answer — locking real
 * parents out of their own children's records with no visible cause.
 */
export function sameCalendarDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return false;
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** True if the IANA zone is one this runtime actually knows. */
export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
