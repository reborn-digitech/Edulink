import { BACKLOG_LIMIT_YEARS, DEFAULT_GRADING_TABLE, DEFAULT_PASSING_RULES, RESULT_CLASSES, type ExamLateFeeSlab } from "@edulink/contracts";
import { parseCsvRecords, toCsvValue } from "./csv";

/**
 * THE EXAM CELL'S ARITHMETIC (module EXAMS, 4 October 2026), with no
 * database and no session, so the suite can hold each rule to a hand
 * computation: a course's grade under the scheme's table, a term's SGPA, the
 * class, ATKT, the late fee, the alternate seats, the double entry's
 * agreement, the backlog limit and the university's result file.
 *
 * UNITS. Marks are thousandths (45.5 → 45500), credits and grade points
 * tenths (3 credits → 30, 8.5 points → 85), SGPA hundredths (8.25 → 825).
 * Integers all the way down, as money is: a grade must not change because a
 * float drifted.
 */

export type GradeRow = { grade: string; points: number; minPercent: number };
export type ClassBand = { cls: (typeof RESULT_CLASSES)[number]; minSgpa: number };
export type ExamRules = {
  internalMax: number;
  externalMax: number;
  minInternalPercent: number;
  minExternalPercent: number;
  minTotalPercent: number;
  atktLimit: number;
  graceMaxPerCourse: number;
  graceMaxPerSession: number;
  classBands: ClassBand[];
};

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** A scheme's grading table, highest first; the UGC's ten-point table when it carries none. */
export function gradingTableOf(raw: string | null | undefined): GradeRow[] {
  const parsed = parseJson(raw);
  const rows = Array.isArray(parsed)
    ? parsed
        .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : null))
        .filter((r): r is Record<string, unknown> => r !== null)
        .map((r) => ({ grade: String(r.grade ?? ""), points: num(r.points), minPercent: num(r.minPercent) ?? num(r.min) }))
        .filter((r): r is GradeRow => r.grade !== "" && r.grade !== "AB" && r.points !== null && r.minPercent !== null)
    : [];
  const table = rows.length >= 2 ? rows : [...DEFAULT_GRADING_TABLE];
  return [...table].sort((a, b) => b.minPercent - a.minPercent);
}

/**
 * A scheme's passing rules as the exam cell reads them. The academics
 * module's scheme names one lowest percentage a course passes at
 * (`minPercentPerCourse`), the ATKT limit and the internal and external
 * maxima; the per-head minima, grace caps and class bands fall back to
 * DEFAULT_PASSING_RULES unless the scheme carries its own.
 */
export function rulesOf(raw: string | null | undefined): ExamRules {
  const p = (parseJson(raw) ?? {}) as Record<string, unknown>;
  const d = DEFAULT_PASSING_RULES;
  const course = num(p.minPercentPerCourse) ?? num(p.minTotalPercent);
  const bands = Array.isArray(p.classBands)
    ? (p.classBands as unknown[])
        .map((b) => (b && typeof b === "object" ? (b as Record<string, unknown>) : null))
        .filter((b): b is Record<string, unknown> => b !== null && (RESULT_CLASSES as readonly string[]).includes(String(b.cls)) && num(b.minSgpa) !== null)
        .map((b) => ({ cls: b.cls as ClassBand["cls"], minSgpa: num(b.minSgpa)! }))
    : [];
  return {
    internalMax: num(p.internalMax) ?? d.internalMax,
    externalMax: num(p.externalMax) ?? d.externalMax,
    minInternalPercent: num(p.minInternalPercent) ?? course ?? d.minInternalPercent,
    minExternalPercent: num(p.minExternalPercent) ?? course ?? d.minExternalPercent,
    minTotalPercent: course ?? d.minTotalPercent,
    atktLimit: num(p.atktLimit) ?? d.atktLimit,
    graceMaxPerCourse: num(p.graceMaxPerCourse) ?? d.graceMaxPerCourse,
    graceMaxPerSession: num(p.graceMaxPerSession) ?? d.graceMaxPerSession,
    classBands: (bands.length > 0 ? bands : [...d.classBands]).sort((a, b) => b.minSgpa - a.minSgpa),
  };
}

/**
 * Whether the scheme saved the figures a run grades by (the owner's choice on TA-070, 14 November 2026): the internal
 * and external maxima, the pass mark and the ATKT limit, the four that were otherwise guessed (30, 70, 40 % and 3).
 * A run refuses a scheme without them. An internal maximum of nought (a paper with no internal part) is a saved figure.
 */
export function examRulesSaved(raw: string | null | undefined): boolean {
  const parsed = parseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return false;
  const p = parsed as Record<string, unknown>;
  return num(p.internalMax) !== null && num(p.externalMax) !== null && num(p.atktLimit) !== null && (num(p.minPercentPerCourse) ?? num(p.minTotalPercent)) !== null;
}

/** The grade and points (tenths) for a percentage (in thousandths of a percent, so 39.999 % is not 40 %). */
export function gradeFor(percentMilli: number, table: readonly GradeRow[]): { grade: string; pointsTenths: number } {
  for (const row of table) if (percentMilli >= row.minPercent * 1000) return { grade: row.grade, pointsTenths: Math.round(row.points * 10) };
  const last = table[table.length - 1];
  return { grade: last?.grade ?? "F", pointsTenths: 0 };
}

export type CourseMarks = {
  /** The internal total in thousandths, or null when none was locked or imported. */
  internalMilli: number | null;
  externalMilli: number | null;
  absent: boolean;
  graceMilli: number;
};

/**
 * One course's outcome under the rules: the total (internal + external +
 * grace) out of the course's maximum, the grade, and whether it passed —
 * each head at its own minimum and the total at the course's. Absent from
 * the external paper is ABSENT, never a grade. A missing internal is nought
 * here only where it cannot matter: a course with no internal part (an
 * internal maximum of nought) or an AB. Where the scheme has an internal part
 * the callers refuse first (QA-05, 24 Oct 2026: `runResults` and `proposeGrace`
 * answer examCell.refuseInternalsMissing), so no result is computed on an
 * internal taken as nought.
 */
export function courseOutcome(m: CourseMarks, rules: ExamRules, table: readonly GradeRow[]): { totalMilli: number; maxMilli: number; grade: string; pointsTenths: number; passed: boolean; absent: boolean } {
  const maxMilli = (rules.internalMax + rules.externalMax) * 1000;
  const internal = m.internalMilli ?? 0;
  if (m.absent || m.externalMilli === null) {
    return { totalMilli: internal, maxMilli, grade: "AB", pointsTenths: 0, passed: false, absent: true };
  }
  const external = m.externalMilli + m.graceMilli;
  const totalMilli = Math.min(maxMilli, internal + external);
  const okInternal = rules.internalMax === 0 || internal * 100 >= rules.minInternalPercent * rules.internalMax * 1000;
  const okExternal = rules.externalMax === 0 || external * 100 >= rules.minExternalPercent * rules.externalMax * 1000;
  const percentMilli = maxMilli === 0 ? 0 : Math.floor((totalMilli * 100_000) / maxMilli);
  const okTotal = percentMilli >= rules.minTotalPercent * 1000;
  const passed = okInternal && okExternal && okTotal;
  if (!passed) {
    const fail = table[table.length - 1];
    return { totalMilli, maxMilli, grade: fail && fail.points === 0 ? fail.grade : "F", pointsTenths: 0, passed: false, absent: false };
  }
  const g = gradeFor(percentMilli, table);
  return { totalMilli, maxMilli, grade: g.grade, pointsTenths: g.pointsTenths, passed: true, absent: false };
}

/**
 * THE SGPA: Σ credits × grade points ÷ Σ credits over every course the term
 * examined, a failed or absent course counting its credits at nought points
 * (the UGC's CBCS rule), to two places, half up. Null with no credits.
 */
export function sgpaHundredths(rows: readonly { creditsTenths: number; pointsTenths: number }[]): number | null {
  const credits = rows.reduce((a, r) => a + r.creditsTenths, 0);
  if (credits <= 0) return null;
  const weighted = rows.reduce((a, r) => a + r.creditsTenths * r.pointsTenths, 0);
  // weighted / credits is points in tenths; × 10 is hundredths.
  return Math.round((weighted * 10) / credits);
}

/**
 * THE CGPA across terms: each course counted once, at its LATEST result (a
 * backlog cleared replaces the failure), Σ credits × points ÷ Σ credits.
 */
export function cgpaHundredths(rows: readonly { courseId: string; creditsTenths: number; pointsTenths: number; at: number }[]): number | null {
  const latest = new Map<string, { creditsTenths: number; pointsTenths: number; at: number }>();
  for (const r of rows) {
    const had = latest.get(r.courseId);
    if (!had || r.at >= had.at) latest.set(r.courseId, r);
  }
  return sgpaHundredths([...latest.values()]);
}

/** The class a passing SGPA earns, by the bands (highest first); null below the lowest. */
export function classFor(sgpaHundredthsValue: number | null, bands: readonly ClassBand[]): ClassBand["cls"] | null {
  if (sgpaHundredthsValue === null) return null;
  for (const b of [...bands].sort((a, c) => c.minSgpa - a.minSgpa)) if (sgpaHundredthsValue >= Math.round(b.minSgpa * 100)) return b.cls;
  return null;
}

/** A term's standing: every course passed; failures within the ATKT limit (allowed to keep terms); or more. */
export function termStatusOf(failed: number, atktLimit: number): "PASS" | "ATKT" | "FAIL" {
  if (failed === 0) return "PASS";
  return failed <= atktLimit ? "ATKT" : "FAIL";
}

/** The late fee on a day: the last slab whose day has come (slabs need not arrive sorted). */
export function lateFeeOn(slabs: readonly ExamLateFeeSlab[], today: string): number {
  let fee = 0;
  let from = "";
  for (const s of slabs) if (s.fromDateKey <= today && s.fromDateKey >= from) {
    fee = s.paise;
    from = s.fromDateKey;
  }
  return fee;
}

export function parseSlabs(raw: string | null | undefined): ExamLateFeeSlab[] {
  const parsed = parseJson(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((r) => (r && typeof r === "object" ? (r as Record<string, unknown>) : null))
    .filter((r): r is Record<string, unknown> => r !== null && typeof r.fromDateKey === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.fromDateKey) && num(r.paise) !== null)
    .map((r) => ({ fromDateKey: r.fromDateKey as string, paise: Math.max(0, Math.round(num(r.paise)!)) }));
}

/** A form's fee: each regular course at the course rate, each backlog at the backlog rate. */
export function formFee(courses: readonly { kind: "REGULAR" | "BACKLOG" }[], rates: { feePerCoursePaise: number; feePerBacklogPaise: number }): number {
  return courses.reduce((a, c) => a + (c.kind === "BACKLOG" ? rates.feePerBacklogPaise : rates.feePerCoursePaise), 0);
}

/**
 * THE SEATS OF ONE HALL FOR ONE PAPER, alternate so that no two students of
 * a course sit side by side: the first paper in a hall at an hour takes the
 * odd seats (1, 3, 5 …), a second paper at the same hour in the same hall
 * the even ones; a hall seats at most two papers at once. Students go in
 * the order given (the roll), and those who do not fit are returned.
 */
export function alternateSeats<T>(students: readonly T[], capacity: number, parity: 0 | 1): { seated: { seatNo: number; who: T }[]; left: T[] } {
  const seats: number[] = [];
  for (let n = parity === 0 ? 1 : 2; n <= capacity; n += 2) seats.push(n);
  const seated = students.slice(0, seats.length).map((who, i) => ({ seatNo: seats[i]!, who }));
  return { seated, left: students.slice(seats.length) };
}

/** Whether two entries of one student's marks agree: both absent, or the same thousandths. */
export function entriesAgree(a: { milli: number | null; absent: boolean }, b: { milli: number | null; absent: boolean }): boolean {
  if (a.absent || b.absent) return a.absent && b.absent;
  return a.milli !== null && a.milli === b.milli;
}

/** Marks as typed (45.5) to thousandths, refusing more places than three and anything outside 0..max. */
export function toMilli(marks: number, maxMarks: number): number | null {
  if (!Number.isFinite(marks) || marks < 0 || marks > maxMarks) return null;
  const milli = Math.round(marks * 1000);
  return Math.abs(milli - marks * 1000) < 1e-6 ? milli : null;
}

/** The last day a backlog may be sat: BACKLOG_LIMIT_YEARS after the first failure, as a date key. */
export function backlogLastDay(firstFailedAt: Date): string {
  const d = new Date(firstFailedAt);
  d.setUTCFullYear(d.getUTCFullYear() + BACKLOG_LIMIT_YEARS);
  return d.toISOString().slice(0, 10);
}
export function backlogLapsed(firstFailedAt: Date, today: string): boolean {
  return today > backlogLastDay(firstFailedAt);
}

/**
 * THE UNIVERSITY'S RESULT FILE, as this cell reads it: a CSV with a header
 * row naming PRN, SEAT_NO, COURSE_CODE, INTERNAL, EXTERNAL (and optionally
 * TOTAL, GRADE, which are the university's and are not trusted — the run
 * computes its own). The column order follows SPPU's result ledger as the
 * owner described it (PRN first, then the seat number and the course); the
 * header is read by name, so a file in another order still reads. "AB" in
 * EXTERNAL is absent. UNTESTED against a real university file.
 */
export const RESULT_FILE_COLUMNS = ["PRN", "SEAT_NO", "COURSE_CODE", "INTERNAL", "EXTERNAL", "TOTAL", "GRADE"] as const;
export type ResultFileRow = { line: number; prn: string; seatNo: string; courseCode: string; internal: number | null; external: number | null; absent: boolean };
export function parseResultFile(textIn: string): { rows: ResultFileRow[]; bad: { line: number; key: string; reason: "columns" | "marks" }[] } {
  const { records, lineNumbers } = parseCsvRecords(textIn.trim());
  const [header, ...body] = records;
  const at = (name: string) => (header ?? []).findIndex((h) => h.trim().toUpperCase().replace(/[\s-]+/g, "_") === name);
  const ix = { prn: at("PRN"), seat: at("SEAT_NO"), course: at("COURSE_CODE"), internal: at("INTERNAL"), external: at("EXTERNAL") };
  const rows: ResultFileRow[] = [];
  const bad: { line: number; key: string; reason: "columns" | "marks" }[] = [];
  if (ix.course < 0 || ix.external < 0 || (ix.prn < 0 && ix.seat < 0)) return { rows, bad: [{ line: 1, key: (header ?? []).join(","), reason: "columns" }] };
  body.forEach((cells, i) => {
    const line = lineNumbers[i + 1] ?? i + 2;
    if (cells.every((c) => c.trim() === "")) return;
    const get = (k: number) => (k >= 0 ? (cells[k] ?? "").trim() : "");
    const prn = get(ix.prn);
    const seatNo = get(ix.seat);
    const courseCode = get(ix.course);
    const ext = get(ix.external).toUpperCase();
    const int = get(ix.internal);
    const absent = ext === "AB" || ext === "ABS";
    const external = absent ? null : ext === "" ? NaN : Number(ext);
    const internal = int === "" ? null : Number(int);
    if (!courseCode || (!prn && !seatNo)) return bad.push({ line, key: `${prn || seatNo}/${courseCode}`, reason: "columns" }) && undefined;
    if ((external !== null && !Number.isFinite(external)) || (internal !== null && !Number.isFinite(internal))) return bad.push({ line, key: `${prn || seatNo}/${courseCode}`, reason: "marks" }) && undefined;
    rows.push({ line, prn, seatNo, courseCode, internal, external, absent });
  });
  return { rows, bad };
}

/** A file name for a CSV the cell cuts: a fixed stem and the session's name, safe for any file system. */
export const csvFileName = (stem: string, name: string) => [stem, name.replace(/[^\w-]+/g, "-")].join("-") + ".csv";

/** A CSV line, each cell quoted as it needs and kept from opening as a formula (csv.ts's toCsvValue). */
export const csvLine = (cells: (string | number | null | undefined)[]) => cells.map((c) => toCsvValue(c ?? "")).join(",");

/** Thousandths as marks for a sheet: 45500 → "45.5". */
export function milliText(milli: number | null | undefined): string {
  if (milli === null || milli === undefined) return "";
  return (milli / 1000).toFixed(3).replace(/\.?0+$/, "");
}

/** Hundredths as an SGPA: 825 → 8.25. */
export const sgpaNumber = (h: number | null | undefined): number | null => (h === null || h === undefined ? null : Math.round(h) / 100);
/** Tenths as a number: 35 → 3.5. */
export const tenths = (v: number): number => Math.round(v) / 10;

/** A new random code for the public check: ten characters without look-alikes, as a certificate's. */
export function checkCode(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return [...bytes].slice(0, 10).map((b) => alphabet[b % alphabet.length]).join("");
}
