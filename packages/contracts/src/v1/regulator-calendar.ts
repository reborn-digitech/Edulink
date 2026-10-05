import { z } from "zod";
import { REGULATOR_CALENDAR, type RegulatorCalendarCode } from "./naac";
import type { InstitutionKind } from "./modules";
import type { StreamCode } from "./streams";
import { streamsBringing } from "./council-filings";

/**
 * THE REGULATORS' CALENDAR ACROSS TENANTS (the operator's college console,
 * 4 October 2026): when each body expects something of a college, as a month
 * range that repeats every year, who it applies to, and whom at the college
 * to remind. The operator's /root/colleges/calendar reads it for the next
 * 120 days, and accounts:tidy reminds each college's IQAC and office once per
 * window when one opens within fourteen days.
 *
 * ONE TRUTH WITH THE IQAC DESK. The five returns the IQAC builder already
 * fixed in REGULATOR_CALENDAR (naac.ts) — AQAR July to September, AISHE and
 * NIRF November to January, the AICTE extension of approval February to
 * April, the affiliation return March to May — are read from that table here,
 * never restated, so the two calendars cannot disagree. Three rows are the
 * operator's own: the affiliating university's two exam seasons and the State
 * CET Cell's centralised admission (CAP) rounds.
 *
 * EVERY WINDOW IS APPROXIMATE. A regulator moves its dates by notice each
 * year; every row carries the regulator's site as `source`, and every page
 * and reminder that shows one says "check the regulator's notice". A day is
 * the first of `fromMonth` to the last of `toMonth`; a range whose `toMonth`
 * is before its `fromMonth` crosses the year's end.
 *
 * WHO A ROW APPLIES TO: `kinds` (a college or an autonomous one), and `needs`
 * — "AICTE" only where the college has an AICTE approval reference (a
 * professional programme), "NAAC" only where it holds a NAAC grade or keeps
 * the IQAC module on — or null for every college of those kinds.
 *
 * BY STREAM (5 Oct 2026): a row may name `streams`, and then applies only to a
 * college teaching one of them, so a law college is not reminded of AICTE's
 * extension of approval. The AICTE extension and the affiliation return name
 * the streams whose preset brings their filing (`streamsBringing`, the same
 * gate as the IQAC's documents page); the CET Cell's CAP names the
 * professional streams it admits to. Where a college's streams are known they
 * decide in place of `needs: "AICTE"` (the approval reference was the old
 * stand-in for "an AICTE programme"); a college with none recorded is judged
 * as before.
 *
 * Sources: NAAC's AQAR guidelines (naac.gov.in); AISHE's data-capture portal
 * (aishe.gov.in); NIRF (nirfindia.org); AICTE's approval process handbook
 * (aicte-india.org); the affiliating university's own notices (SPPU, the
 * fixtures' university, as the example: unipune.ac.in) — winter examinations
 * October to December and summer March to May for an affiliated college; the
 * State CET Cell's CAP schedule (cetcell.mahacet.org), June to August.
 */

export const REGULATOR_DEADLINE_CODES = ["AQAR", "AISHE", "NIRF", "AICTE_EOA", "AFFILIATION", "UNIVERSITY_EXAMS_WINTER", "UNIVERSITY_EXAMS_SUMMER", "CET_CAP"] as const;
export const regulatorDeadlineCodeSchema = z.enum(REGULATOR_DEADLINE_CODES);
export type RegulatorDeadlineCode = z.infer<typeof regulatorDeadlineCodeSchema>;

/** The college roles a reminder goes to: the IQAC coordinator and the office. */
export const REGULATOR_REMIND_ROLES = ["IQAC", "ADMIN"] as const;
export type RegulatorRemindRole = (typeof REGULATOR_REMIND_ROLES)[number];

export type RegulatorDeadline = {
  code: RegulatorDeadlineCode;
  fromMonth: number;
  toMonth: number;
  kinds: readonly InstitutionKind[];
  needs: "AICTE" | "NAAC" | null;
  remind: readonly RegulatorRemindRole[];
  source: string;
  /** The streams the row is for; null for every college of `kinds` (5 Oct 2026). */
  streams: readonly StreamCode[] | null;
};

/** The State CET Cell's centralised admission rounds: the professional streams it admits to (cetcell.mahacet.org). */
const CAP_STREAMS: readonly StreamCode[] = ["MANAGEMENT", "ENGINEERING", "PHARMACY", "LAW", "EDUCATION", "HEALTH_SCIENCES", "ARCHITECTURE", "AGRICULTURE"];

const BOTH_COLLEGES: readonly InstitutionKind[] = ["COLLEGE", "AUTONOMOUS_COLLEGE"];
const AFFILIATED: readonly InstitutionKind[] = ["COLLEGE"];

/** The months of one of the IQAC desk's five rows: read, never restated. */
function iqacMonths(code: RegulatorCalendarCode): { fromMonth: number; toMonth: number } {
  const row = REGULATOR_CALENDAR.find((r) => r.code === code)!;
  return { fromMonth: row.fromMonth, toMonth: row.toMonth };
}

export const REGULATOR_DEADLINES: readonly RegulatorDeadline[] = [
  { code: "AQAR", ...iqacMonths("AQAR"), kinds: BOTH_COLLEGES, needs: "NAAC", remind: ["IQAC", "ADMIN"], source: "https://naac.gov.in/", streams: null },
  { code: "AISHE", ...iqacMonths("AISHE"), kinds: BOTH_COLLEGES, needs: null, remind: ["IQAC", "ADMIN"], source: "https://aishe.gov.in/", streams: null },
  { code: "NIRF", ...iqacMonths("NIRF"), kinds: BOTH_COLLEGES, needs: null, remind: ["IQAC", "ADMIN"], source: "https://www.nirfindia.org/", streams: null },
  { code: "AICTE_EOA", ...iqacMonths("AICTE_EOA"), kinds: BOTH_COLLEGES, needs: "AICTE", remind: ["IQAC", "ADMIN"], source: "https://www.aicte-india.org/", streams: streamsBringing("AICTE_DISCLOSURE") },
  { code: "AFFILIATION", ...iqacMonths("AFFILIATION"), kinds: AFFILIATED, needs: null, remind: ["ADMIN"], source: "https://www.unipune.ac.in/", streams: streamsBringing("AFFILIATION_RETURN") },
  { code: "UNIVERSITY_EXAMS_WINTER", fromMonth: 10, toMonth: 12, kinds: AFFILIATED, needs: null, remind: ["ADMIN"], source: "https://www.unipune.ac.in/", streams: null },
  { code: "UNIVERSITY_EXAMS_SUMMER", fromMonth: 3, toMonth: 5, kinds: AFFILIATED, needs: null, remind: ["ADMIN"], source: "https://www.unipune.ac.in/", streams: null },
  { code: "CET_CAP", fromMonth: 6, toMonth: 8, kinds: BOTH_COLLEGES, needs: "AICTE", remind: ["ADMIN"], source: "https://cetcell.mahacet.org/", streams: CAP_STREAMS },
];

/** What the calendar needs to know of a college to say whether a row applies; `streams` as School.streamsJson holds them (absent or empty: none recorded). */
export type RegulatorSubject = { kind: string; aicteApprovalRef: string | null; naacGrade: string | null; iqacOn: boolean; streams?: readonly string[] };

export function deadlineApplies(row: RegulatorDeadline, college: RegulatorSubject): boolean {
  if (!(row.kinds as readonly string[]).includes(college.kind)) return false;
  if (row.needs === "NAAC" && !(Boolean(college.naacGrade) || college.iqacOn)) return false;
  const streams = college.streams ?? [];
  // The streams, where known, decide (a law college is not reminded of AICTE's extension); the approval reference is the old stand-in.
  if (streams.length > 0) return row.streams === null || row.streams.some((s) => streams.includes(s));
  if (row.needs === "AICTE") return Boolean(college.aicteApprovalRef?.trim());
  return true;
}

const pad = (n: number) => String(n).padStart(2, "0");
const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

/**
 * Every occurrence of a row's window that touches [fromDay, toDay] (YYYY-MM-DD,
 * both inclusive), earliest first. A window starts on the 1st of fromMonth and
 * ends on the last day of toMonth, a year later when it crosses the year's end.
 */
export function deadlineWindows(row: Pick<RegulatorDeadline, "fromMonth" | "toMonth">, fromDay: string, toDay: string): { from: string; to: string }[] {
  const first = Number(fromDay.slice(0, 4)) - 1;
  const last = Number(toDay.slice(0, 4));
  const crosses = row.toMonth < row.fromMonth;
  const out: { from: string; to: string }[] = [];
  for (let year = first; year <= last; year++) {
    const endYear = crosses ? year + 1 : year;
    const from = `${year}-${pad(row.fromMonth)}-01`;
    const to = `${endYear}-${pad(row.toMonth)}-${pad(lastDay(endYear, row.toMonth))}`;
    if (to >= fromDay && from <= toDay) out.push({ from, to });
  }
  return out;
}

/** GET /api/v1/operator/colleges/calendar — the next 120 days across the colleges, one entry per row and window. */
export const operatorCollegeCalendarSchema = z.object({
  today: z.string(),
  until: z.string(),
  items: z.array(
    z.object({
      code: regulatorDeadlineCodeSchema,
      from: z.string(),
      to: z.string(),
      openNow: z.boolean(),
      daysToOpen: z.number().int(),
      remind: z.array(z.enum(REGULATOR_REMIND_ROLES)),
      source: z.string(),
      colleges: z.array(z.object({ schoolId: z.string(), name: z.string(), kind: z.string() })),
    }),
  ),
});
export type OperatorCollegeCalendar = z.infer<typeof operatorCollegeCalendarSchema>;
