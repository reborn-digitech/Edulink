/**
 * THE DEMO COLLEGES' CALENDAR (G4-29, 5 Oct 2026, risks batch). The two demo
 * college scripts (demo-college.ts, demo-college-engineering.ts) were written
 * on 5 October 2026 for the academic year 2026–27 and carried every date as a
 * literal, so a database built in 2027 would hold a 2026 college, stale since
 * the odd term ended. Every date they write now goes through this calendar,
 * which dates the college from the run's day:
 *
 * - THE ACADEMIC YEAR is the one whose odd term began most recently: from
 *   1 July of year Y the demo is the year Y–(Y+1); in June it is still the
 *   year before. Every date of the scripts moves by whole years (Y − 2026),
 *   so a day keeps its month and day (29 February becomes the 28th), and the
 *   labels ("2026–27", "Summer 2026") move with it.
 * - THE CURRENT TERM is that year's odd term (1 July to 30 November), the past
 *   term the even term before it (1 December to 30 April); the demo builds
 *   odd-semester courses, so from December to June it shows the odd term just
 *   ended rather than an even term it has no courses for (said in
 *   docs/demo-schools.md).
 * - THE REGISTERS are the four Monday-to-Saturday weeks before the run's week,
 *   kept inside the term: after the term the last four weeks it had, in its
 *   first four weeks the weeks it has had. Within one week every run writes
 *   the same lectures; a run in a later week adds that week's, never twice.
 * - The past term's sitting, its results and the grade cards are dated in the
 *   past term, so they move with the year.
 *
 * `DEMO_TODAY=YYYY-MM-DD` pins the run's day (the tests, and `--calendar`,
 * which prints the calendar and writes nothing). The scripts refuse to run
 * over a college already built for another academic year: they never promote
 * students, so a new year is built on a database without the college.
 */

/** The academic year the scripts' literals were written for: 2026–27. */
export const DEMO_REFERENCE_YEAR = 2026;

const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
const keyOf = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const dateOf = (key: string) => new Date(`${key}T00:00:00Z`);
const addDays = (key: string, n: number) => keyOf(new Date(dateOf(key).getTime() + n * DAY_MS));
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** A date key moved by whole years: same month and day (29 February to the 28th in a common year). */
export function shiftDateKey(key: string, years: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) throw new Error(`not a date key: ${key}`);
  const y = Number(m[1]) + years;
  const day = m[2] === "02" && m[3] === "29" && !isLeap(y) ? "28" : m[3];
  return `${y}-${m[2]}-${day}`;
}

/** An ISO instant ("2026-09-30T10:00:00Z", with or without milliseconds) moved by whole years, as text. */
export function shiftIso(iso: string, years: number): string {
  const m = /^(\d{4}-\d{2}-\d{2})(T.*)$/.exec(iso);
  if (!m) throw new Error(`not an ISO instant: ${iso}`);
  return `${shiftDateKey(m[1]!, years)}${m[2]}`;
}

/** The run's day in India (the demo colleges are in Pune): DEMO_TODAY when set, otherwise today. */
export function demoToday(now: Date = new Date(), env: Record<string, string | undefined> = process.env): string {
  const pinned = env.DEMO_TODAY?.trim();
  if (pinned) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pinned) || keyOf(dateOf(pinned)) !== pinned) throw new Error(`DEMO_TODAY=${pinned}: not a day (YYYY-MM-DD)`);
    return pinned;
  }
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export type DemoTerm = { name: string; academicYear: string; startsOn: string; endsOn: string; registrationOpensOn: string; registrationClosesOn: string };

export type DemoCalendar = {
  /** The run's day. */
  today: string;
  /** The first calendar year of the demo's academic year, and how far that is from 2026. */
  startYear: number;
  shift: number;
  /** A year of the scripts (2025, 2026, 2027…) in this calendar. */
  y: (year: number) => number;
  /** A date key of the scripts in this calendar. */
  key: (key: string) => string;
  /** An ISO instant of the scripts in this calendar, as text (JSON fields that hold an instant). */
  iso: (iso: string) => string;
  /** An ISO instant of the scripts in this calendar, as a Date. */
  at: (iso: string) => Date;
  /** "2026–27" for 0, "2025–26" for -1 (the en dash, as the scripts write a year). */
  ay: (offset?: number) => string;
  /** "2026-27" for 0 (the hyphen, as the scholarship portal and the fee authority write it). */
  ayHyphen: (offset?: number) => string;
  currentTerm: DemoTerm;
  pastTerm: DemoTerm;
  /** The registers' first and last day (Monday and Saturday); from after to when the term has had none yet. */
  registerFrom: string;
  registerTo: string;
};

export function demoCalendar(today: string = demoToday()): DemoCalendar {
  const [ty, tm] = today.split("-").map(Number) as [number, number];
  // The odd term begins on 1 July: before it, the demo is still the year before.
  const startYear = tm >= 7 ? ty : ty - 1;
  const shift = startYear - DEMO_REFERENCE_YEAR;
  const y = (year: number) => year + shift;
  const key = (k: string) => shiftDateKey(k, shift);
  const iso = (i: string) => shiftIso(i, shift);
  const ay = (offset = 0) => `${startYear + offset}–${pad((startYear + offset + 1) % 100)}`;
  const ayHyphen = (offset = 0) => `${startYear + offset}-${pad((startYear + offset + 1) % 100)}`;
  const currentTerm: DemoTerm = { name: `Odd term ${ay(0)}`, academicYear: ay(0), startsOn: key("2026-07-01"), endsOn: key("2026-11-30"), registrationOpensOn: key("2026-06-20"), registrationClosesOn: key("2026-07-15") };
  const pastTerm: DemoTerm = { name: `Even term ${ay(-1)}`, academicYear: ay(-1), startsOn: key("2025-12-01"), endsOn: key("2026-04-30"), registrationOpensOn: key("2025-11-20"), registrationClosesOn: key("2025-12-10") };

  // The Saturday before the run's week, held to the term's last Saturday; four weeks back to its Monday, held to the term's first.
  const weekday = dateOf(today).getUTCDay(); // 0 Sunday … 6 Saturday
  const runMonday = addDays(today, -((weekday + 6) % 7));
  const termEnd = currentTerm.endsOn;
  const lastSaturday = addDays(termEnd, -((dateOf(termEnd).getUTCDay() + 1) % 7));
  const registerTo = [addDays(runMonday, -2), lastSaturday].sort()[0]!;
  let registerFrom = addDays(registerTo, -26);
  if (registerFrom < currentTerm.startsOn) {
    const s = currentTerm.startsOn;
    registerFrom = addDays(s, (8 - dateOf(s).getUTCDay()) % 7);
  }
  return { today, startYear, shift, y, key, iso, at: (i) => new Date(iso(i)), ay, ayHyphen, currentTerm, pastTerm, registerFrom, registerTo };
}

/** The days the registers are written for: every day but Sunday from the first to the last. */
export function registerDays(cal: Pick<DemoCalendar, "registerFrom" | "registerTo">): string[] {
  const days: string[] = [];
  for (let k = cal.registerFrom; k <= cal.registerTo; k = addDays(k, 1)) if (dateOf(k).getUTCDay() !== 0) days.push(k);
  return days;
}

/** What `--calendar` prints: the derived days, nothing written. */
export function describeCalendar(cal: DemoCalendar): string {
  return [
    `run's day         ${cal.today}`,
    `academic year     ${cal.ay(0)} (the scripts' 2026–27 moved by ${cal.shift} year${Math.abs(cal.shift) === 1 ? "" : "s"})`,
    `current term      ${cal.currentTerm.name}: ${cal.currentTerm.startsOn} to ${cal.currentTerm.endsOn}`,
    `past term         ${cal.pastTerm.name}: ${cal.pastTerm.startsOn} to ${cal.pastTerm.endsOn}`,
    `registers         ${cal.registerFrom} to ${cal.registerTo} (${registerDays(cal).length} days, Sundays off)`,
    `past sitting      Summer ${cal.y(2026)} (even term ${cal.ay(-1)}), in the past term`,
  ].join("\n");
}

type YearReader = {
  school: { findUnique(args: { where: { slug: string }; select: { id: true } }): Promise<{ id: string } | null> };
  academicYear: { findFirst(args: { where: { schoolId: string; isCurrent: true }; select: { name: true } }): Promise<{ name: string } | null> };
};

/**
 * Refuses a run over a demo college built for another academic year: the scripts find-or-create by name and
 * never promote anybody, so a 2027–28 run over a 2026–27 college would leave two current years and students a
 * year behind. Nothing is written before this asks.
 */
export async function refuseAnotherYear(db: YearReader, slug: string, cal: Pick<DemoCalendar, "ay">): Promise<void> {
  const college = await db.school.findUnique({ where: { slug }, select: { id: true } });
  if (!college) return;
  const current = await db.academicYear.findFirst({ where: { schoolId: college.id, isCurrent: true }, select: { name: true } });
  if (current && current.name !== cal.ay(0)) {
    throw new Error(`${slug} was built for ${current.name}; this run's academic year is ${cal.ay(0)}. The demo scripts do not promote students: build ${cal.ay(0)} on a database without the college (or pin DEMO_TODAY inside ${current.name}).`);
  }
}
