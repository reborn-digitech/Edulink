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

/**
 * Saturday or Sunday. A fact about the CALENDAR, not about this school.
 *
 * Kept separate from `isTeachingDay` on purpose — see the note there. This one
 * is for display: whether to tint a cell in a month grid, whether a date reads
 * as part of a weekend to a human. Do not use it to decide whether a register
 * was expected.
 */
export function isWeekend(dateKey: string): boolean {
  const day = weekdayOfKey(dateKey);
  return day === 0 || day === 6;
}

/**
 * The days this school teaches: MONDAY TO SATURDAY, Sunday off.
 *
 * SEPARATE FROM `isWeekend`, AND THE SPLIT IS THE POINT. Saturday is a weekend
 * day on any calendar and a working day at this school, so one predicate cannot
 * answer both questions. Attendance denominators, holiday maths and "out of N
 * school days" ask THIS one; anything tinting a cell or writing the word
 * "weekend" asks the other.
 *
 * The honest limit, stated because this is a hardcoded assumption dressed as a
 * function: it is one school's week, not a setting. It lives alone here so that
 * making it per-school later is a change to this function's body and a column on
 * `School`, rather than a hunt through every place `day === 0 || day === 6` was
 * inlined — which is exactly the hunt that produced this function.
 */
export function isTeachingDay(dateKey: string): boolean {
  return weekdayOfKey(dateKey) !== 0;
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

/**
 * An instant, in UTC, in the reader's language — "Mon, 14 Sep 2026, 09:00".
 *
 * ⚠ WHAT THIS REPLACES, AND WHY A STRING COUNT COULD NOT SEE IT.
 * `toUTCString().slice(0, 22)` was doing this job on six screens of the expert
 * surface. It is not a hardcoded string, so the audit's counter reported those
 * files finished; it is not `formatDateKey` or `relativeTime` either, so the
 * unlocalised-date check did not see it. A fully translated Marathi page still
 * read `Mon, 14 Sep 2026 09:00` in the middle of a Devanagari sentence, and it
 * took a screenshot of the actual page to notice — the third time on this
 * project that a date has been the thing a counter is blind to.
 *
 * ⚠ AND UTC IS DELIBERATE HERE, not an oversight. Expert slots are stored and
 * shown in UTC on purpose: an expert and a school may be in different zones, and
 * every one of these pages says out loud that the times are UTC. Rendering them
 * in the reader's local zone would quietly move a booked hour.
 */
export function formatUtcMoment(instant: Date, locale = "en"): string {
  return formatInZone(instant, "UTC", { dateStyle: "medium", timeStyle: "short" }, locale);
}

/** Just the clock part of an instant, in UTC — the "to" half of a range. */
export function formatUtcTime(instant: Date, locale = "en"): string {
  return formatInZone(instant, "UTC", { timeStyle: "short" }, locale);
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

/* -------------------------------------------------------------------------- */
/* dd/mm/yyyy — what people here actually write                                */
/* -------------------------------------------------------------------------- */

/**
 * The day-first pair, and why they exist at all.
 *
 * `<input type="date">` renders in the BROWSER's locale and gives the page no
 * say in it. Setting `lang="en-GB"` on the input, on a wrapper, or on `<html>`
 * changes nothing — checked in Chromium against all three, and all three still
 * drew `mm/dd/yyyy`. So a school in Pune typing a child's birthday was being
 * asked for the month first, with no hint that it was, and 05/04 means two
 * different days depending on who is reading it.
 *
 * These are the conversion either side of a plain text input, which IS under
 * the page's control. The wire format never changes: `YYYY-MM-DD` in, the same
 * out, because that is what every action, every query and every `dateKey` in
 * this codebase already speaks. Only the human-facing half is day-first.
 */

/** `2026-04-05` → `05/04/2026`. Empty in, empty out. */
export function isoToDisplayDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

/**
 * `05/04/2026` → `2026-04-05`, or null if it is not a real date.
 *
 * REJECTS RATHER THAN ROUNDS. `31/02/2026` is not the 3rd of March here — a
 * date somebody typed wrongly should come back and ask, not silently become a
 * different day and land in a register. `Date` would happily roll it over,
 * so the round-trip below is what catches it.
 *
 * Separators are lenient (`/`, `-`, `.`, spaces) because people type what their
 * keyboard makes easy; the ORDER is not, because guessing order is the bug.
 */
export function displayDateToIso(input: string | null | undefined): string | null {
  if (!input) return null;
  const m = /^(\d{1,2})\s*[/\-. ]\s*(\d{1,2})\s*[/\-. ]\s*(\d{4})$/.exec(input.trim());
  if (!m) return null;

  const day = Number(m[1]);
  const month = Number(m[2]);
  const year = Number(m[3]);

  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  /**
   * THE ROUND TRIP IS THE ONLY CHECK, and that is deliberate rather than
   * careless. An explicit `month > 12 || day > 31` guard stood here and was
   * deleted after mutation testing could not make it matter: every value it
   * rejected — month 13, day 32, day 0 — builds a string `Date` already refuses
   * or silently rolls to a different day, and the comparison below catches both.
   *
   * 31/02/2026 becomes 2026-03-03 as a Date, which no longer matches the string
   * we built, so it is refused rather than quietly becoming the 3rd of March.
   * That rollover is the whole hazard; a bounds check does not address it and
   * this does.
   */
  const asDate = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(asDate.getTime())) return null;
  if (asDate.toISOString().slice(0, 10) !== iso) return null;
  return iso;
}
