/**
 * The school day, as arithmetic.
 *
 * NO DATABASE AND NO `server-only` HERE, deliberately. The builder is a client
 * component that has to validate a typed time before it sends anything, and the
 * grid has to render one on the server — so both halves import this, and there
 * is exactly one definition of what "08:30" means. The split is the same one
 * `leave-kinds.ts` exists for.
 *
 * MINUTES FROM LOCAL MIDNIGHT is the storage unit; see TimetablePeriod in the
 * schema for why it is not a DateTime and not a string.
 */

export const PERIOD_KINDS = ["LESSON", "BREAK"] as const;
export type PeriodKind = (typeof PERIOD_KINDS)[number];

export const PERIOD_KIND_META: Record<PeriodKind, { label: string; description: string }> = {
  LESSON: { label: "Lesson", description: "A teaching period. Classes are timetabled into it." },
  BREAK: { label: "Break", description: "Lunch, assembly, a gap. Nothing is timetabled into it." },
};

/** Minutes in a day. An end time may equal this; a start time may not. */
export const MINUTES_IN_DAY = 24 * 60;

/**
 * The shortest period the builder will accept.
 *
 * Not a rule about pedagogy — a guard against a fat-fingered end time that is
 * one minute after the start, which renders as a zero-height row and reads as a
 * broken page rather than as a mistake.
 */
export const MIN_PERIOD_MINUTES = 5;

/**
 * `"08:30"` → `510`, or null if that is not a time.
 *
 * REJECTS RATHER THAN CLAMPS, for the same reason `displayDateToIso` does:
 * "25:00" silently becoming 01:00 the next day would put a lesson on the wrong
 * side of midnight, and the person who typed it would never be told.
 *
 * Lenient about a missing leading zero (`8:30`) because that is what people
 * type; strict about everything else.
 */
export function parseTimeOfDay(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/** `510` → `"08:30"`. Out-of-range minutes come back as an empty string. */
export function formatTimeOfDay(minute: number): string {
  if (!Number.isInteger(minute) || minute < 0 || minute > MINUTES_IN_DAY) return "";
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** `"08:30 – 09:15"`, for a period header. */
export function formatTimeRange(startMinute: number, endMinute: number): string {
  const start = formatTimeOfDay(startMinute);
  const end = formatTimeOfDay(endMinute);
  if (!start || !end) return "";
  return `${start} – ${end}`;
}

/* -------------------------------------------------------------------------- */
/* The week                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The weekday numbers a grid shows, in the order a school reads them.
 *
 * MONDAY FIRST, SUNDAY ABSENT. The numbers are `Date.getUTCDay()`'s — see the
 * note on TimetableSlot — which start the week on Sunday, and no school does.
 * Sunday is left off entirely rather than rendered empty because `isTeachingDay`
 * in dates.ts already states, as this codebase's one definition of a school
 * week, that Sunday is the day off. If that ever becomes per-school, this array
 * and that function change together.
 */
export const WEEK_DAYS = [1, 2, 3, 4, 5, 6] as const;
export type Weekday = (typeof WEEK_DAYS)[number];

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function weekdayName(weekday: number): string {
  return DAY_NAMES[weekday] ?? "";
}

/** "Mon", "Tue" — for a column header on a narrow screen. */
export function weekdayShortName(weekday: number): string {
  return weekdayName(weekday).slice(0, 3);
}

export function isWeekdayNumber(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 6;
}

/* -------------------------------------------------------------------------- */
/* Validation shared by the form and the write path                            */
/* -------------------------------------------------------------------------- */

export type PeriodTimes = { startMinute: number; endMinute: number };

/**
 * Why these times are not usable, or null if they are.
 *
 * Returns the MESSAGE rather than a boolean so the form and the server action
 * cannot drift into disagreeing about which of them is wrong.
 */
export function periodTimeError(times: PeriodTimes): string | null {
  const { startMinute, endMinute } = times;
  if (!Number.isInteger(startMinute) || !Number.isInteger(endMinute)) {
    return "Give both times as HH:MM.";
  }
  if (startMinute < 0 || startMinute >= MINUTES_IN_DAY) return "That start time is not a time.";
  if (endMinute <= 0 || endMinute > MINUTES_IN_DAY) return "That end time is not a time.";
  if (endMinute <= startMinute) {
    // A period ending before it starts is a typo. A period crossing midnight is
    // not a thing a school day does, and treating it as one would break every
    // ordering below — so both are refused with the message that fits.
    return "The period has to end after it starts.";
  }
  if (endMinute - startMinute < MIN_PERIOD_MINUTES) {
    return `A period has to be at least ${MIN_PERIOD_MINUTES} minutes long.`;
  }
  return null;
}

/**
 * Periods that overlap in time, as pairs of names.
 *
 * A WARNING, NOT A REFUSAL, and that distinction is deliberate. Overlapping
 * periods are almost always a mistake — but a school running a split lunch, or
 * an exam session that sits across two ordinary periods, is a real thing, and
 * refusing to save it would mean the timetable cannot describe the school. So
 * the builder says so, in words, above the list, and saves anyway. The same
 * choice the holiday calendar makes about registers on a closed day.
 */
export function overlappingPeriods<T extends PeriodTimes & { name: string }>(
  periods: T[],
): [string, string][] {
  const sorted = [...periods].sort((a, b) => a.startMinute - b.startMinute);
  const clashes: [string, string][] = [];
  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1]!;
    const current = sorted[i]!;
    // `endMinute` is exclusive, so touching periods (09:15/09:15) do not clash.
    if (current.startMinute < previous.endMinute) {
      clashes.push([previous.name, current.name]);
    }
  }
  return clashes;
}

/**
 * A sensible first school day, offered when a school has no periods at all.
 *
 * PRE-FILLED RATHER THAN BLANK because the empty state of this feature is the
 * one that decides whether anybody uses it: eight rows of times typed by hand
 * before a single lesson can be entered is where an admin closes the tab. These
 * are a starting point to edit, not a claim about anybody's school — which is
 * why the button that applies them says so.
 */
export const SUGGESTED_DAY: { name: string; startMinute: number; endMinute: number; kind: PeriodKind }[] = [
  { name: "Period 1", startMinute: 8 * 60, endMinute: 8 * 60 + 45, kind: "LESSON" },
  { name: "Period 2", startMinute: 8 * 60 + 45, endMinute: 9 * 60 + 30, kind: "LESSON" },
  { name: "Break", startMinute: 9 * 60 + 30, endMinute: 9 * 60 + 50, kind: "BREAK" },
  { name: "Period 3", startMinute: 9 * 60 + 50, endMinute: 10 * 60 + 35, kind: "LESSON" },
  { name: "Period 4", startMinute: 10 * 60 + 35, endMinute: 11 * 60 + 20, kind: "LESSON" },
  { name: "Lunch", startMinute: 11 * 60 + 20, endMinute: 12 * 60, kind: "BREAK" },
  { name: "Period 5", startMinute: 12 * 60, endMinute: 12 * 60 + 45, kind: "LESSON" },
  { name: "Period 6", startMinute: 12 * 60 + 45, endMinute: 13 * 60 + 30, kind: "LESSON" },
];
