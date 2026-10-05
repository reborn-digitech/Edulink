/**
 * ⚠ EVERY DATE IS dd/mm/yyyy — the phone's one date formatter (A3-journeys-31).
 *
 * The web settled this in apps/web/src/lib/dates.ts: a school reads a date
 * the way the country writes it on a form, day/month/year with slashes, so
 * any format asked for a DAY answers in that one shape — "23/08/2026" — and
 * the other options become a prefix or a suffix: a weekday ("Sun,
 * 23/08/2026"), a time ("23/08/2026, 9:00 AM", 12-hour as the web prints it).
 * Options without a full
 * date are labels and are left to Intl: a month heading ("August 2026"), a
 * lone weekday atop a column, a time on its own. The phone had three shapes
 * at once — "Jul 15, 2026" from Intl's US default, "2026-10-05" printed raw
 * from a date key, and the web's — and now has this one.
 *
 * Digits are always Latin (`-u-nu-latn`): a Marathi weekday name, never a
 * Devanagari "१४". A date key ("2026-10-05") is a calendar day and is never
 * moved by a zone; an instant is read in the school's zone when one is given,
 * else the device's, as the screens did before.
 *
 * Screens never call toLocaleDateString, toLocaleString or Intl.DateTimeFormat
 * themselves: test/lib/dates.test.ts holds the source to that.
 */

type Opts = Intl.DateTimeFormatOptions;

/** The reader's locale for the words in a date (a weekday, a month), with Latin digits pinned. */
export function latn(locale = "en"): string {
  return locale === "en" ? "en" : `${locale}-u-nu-latn`;
}

const KEY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A day key as the UTC midnight that starts it, an instant as itself; null when neither. */
function toInstant(value: string | Date): { at: Date; key: boolean } | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : { at: value, key: false };
  const m = KEY.exec(value);
  if (m) {
    const at = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    return at.getUTCMonth() === Number(m[2]) - 1 ? { at, key: true } : null;
  }
  const at = new Date(value);
  return Number.isNaN(at.getTime()) ? null : { at, key: false };
}

/** A day WITH a month or a year is a date; a day alone is a number in a grid. */
function wantsDay(opts: Opts): boolean {
  return opts.dateStyle !== undefined || (opts.day !== undefined && (opts.month !== undefined || opts.year !== undefined));
}

function wantsTime(opts: Opts): boolean {
  return opts.timeStyle !== undefined || opts.hour !== undefined;
}

function parts(at: Date, opts: Opts, locale: string, timeZone: string | undefined): Intl.DateTimeFormatPart[] {
  const shape: Opts = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(opts.weekday ? { weekday: opts.weekday } : {}),
    // The web's clock: Intl's own for the language (12-hour with AM/PM in en), unless a caller asked for one.
    ...(wantsTime(opts) ? { hour: "numeric", minute: "2-digit", ...(opts.hour12 !== undefined ? { hour12: opts.hour12 } : {}), ...(opts.hourCycle ? { hourCycle: opts.hourCycle } : {}) } : {}),
  };
  try {
    return new Intl.DateTimeFormat(latn(locale), { ...shape, ...(timeZone ? { timeZone } : {}) }).formatToParts(at);
  } catch {
    // A zone the runtime does not know reads in the device's own, as before.
    return new Intl.DateTimeFormat(latn(locale), shape).formatToParts(at);
  }
}

/**
 * The general form: Intl options as the screens wrote them, answered in the
 * one shape when they ask for a day. `timeZone` is for an instant; a day key
 * is always read as the calendar day it names.
 */
export function formatWith(value: string | Date, opts: Opts, locale = "en", timeZone?: string): string {
  const read = toInstant(value);
  if (!read) return typeof value === "string" ? value : "";
  const zone = read.key ? "UTC" : timeZone;
  if (wantsDay(opts)) {
    const p = parts(read.at, opts, locale, zone);
    const get = (type: Intl.DateTimeFormatPartTypes) => p.find((x) => x.type === type)?.value ?? "";
    const date = `${get("day").padStart(2, "0")}/${get("month").padStart(2, "0")}/${get("year")}`;
    const weekday = opts.weekday ? `${get("weekday")}, ` : "";
    // As the web's assemble() writes it: "23/08/2026, 9:00 AM". A caller that asked for a 24-hour clock gets "00" for midnight, never "24".
    const dayPeriod = get("dayPeriod");
    const time = wantsTime(opts) ? `, ${get("hour").replace(/^24$/, "00")}:${get("minute").padStart(2, "0")}${dayPeriod ? ` ${dayPeriod}` : ""}` : "";
    return `${weekday}${date}${time}`;
  }
  // A time on its own is on the same clock as a date's ("3:15 PM"), as on the web; a screen that passes hour12 or hourCycle keeps its own.
  const label: Opts = opts;
  try {
    return new Intl.DateTimeFormat(latn(locale), { ...label, ...(zone ? { timeZone: zone } : {}) }).format(read.at);
  } catch {
    return new Intl.DateTimeFormat(latn(locale), label).format(read.at);
  }
}

/** "05/10/2026" for a day key or an instant. */
export function formatDate(value: string | Date, timeZone?: string): string {
  return formatWith(value, { day: "numeric", month: "numeric", year: "numeric" }, "en", timeZone);
}

/** "05/10/2026, 3:07 PM" for an instant, in the school's zone when given, else the device's. */
export function formatDateTime(value: string | Date, timeZone?: string): string {
  return formatWith(value, { day: "numeric", month: "numeric", year: "numeric", hour: "numeric", minute: "numeric" }, "en", timeZone);
}

/** "Mon, 05/10/2026": a day with its weekday in the reader's language. */
export function formatDayWithWeekday(value: string | Date, locale = "en", timeZone?: string): string {
  return formatWith(value, { weekday: "short", day: "numeric", month: "numeric", year: "numeric" }, locale, timeZone);
}

/** "05/10/2026 – 12/10/2026", or the one day when both are the same. */
export function formatDateRange(from: string, to: string, timeZone?: string): string {
  const a = formatDate(from, timeZone);
  const b = formatDate(to, timeZone);
  return a === b ? a : `${a} – ${b}`;
}

/** A month heading, "October 2026" / "ऑक्टोबर 2026": a label, not a date. */
export function formatMonth(value: string | Date, locale = "en", short = false): string {
  return formatWith(value, { month: short ? "short" : "long", year: "numeric" }, locale);
}

/** 0 = Sunday … 6 = Saturday, as the timetable's weekday numbers run. */
export function weekdayName(weekday: number, locale = "en", width: "long" | "short" = "long"): string {
  try {
    return new Intl.DateTimeFormat(latn(locale), { weekday: width, timeZone: "UTC" }).format(new Date(Date.UTC(2023, 0, 1 + weekday)));
  } catch {
    return String(weekday);
  }
}

/** "25/10/2026 16:00" typed on the phone (or the older "2026-10-25 16:00"), as an instant in the device's zone; null if it cannot be read. */
export function instantFromTyped(typed: string): string | null {
  const s = typed.trim();
  const dmy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T,]+(\d{1,2}):(\d{2})$/.exec(s);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/.exec(s);
  const [y, mo, d, h, mi] = dmy ? [dmy[3], dmy[2], dmy[1], dmy[4], dmy[5]] : ymd ? [ymd[1], ymd[2], ymd[3], ymd[4], ymd[5]] : [];
  if (!y) return null;
  const at = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi));
  if (Number.isNaN(at.getTime()) || at.getMonth() !== Number(mo) - 1 || at.getDate() !== Number(d) || Number(h) > 23) return null;
  return at.toISOString();
}
