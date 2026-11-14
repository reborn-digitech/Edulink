import "server-only";
import { REGULATOR_DEADLINES, deadlineApplies, deadlineWindows, streamOffersDuty, type HomeTileCode, type SchoolModuleCode, type StreamCode } from "@edulink/contracts";
import { db } from "./db";
import { todayKey } from "./dates";
import type { TranslationKey } from "./i18n/dictionary";
import { currentRecordsYear, labStreams } from "./stream-records";
import { corpsSummary, lawInternshipSummary, practicalRecordSummary, teachingPracticeSummary } from "./stream-summaries";

/**
 * THE FIGURES ON THE REGISTRAR'S AND THE PRINCIPAL'S TILES (5 Oct 2026): one
 * line of live numbers under each tile the college's streams put on the home
 * — students and faculty, programmes and divisions, exam sessions running,
 * applications and claims waiting, the filings whose window falls in this
 * quarter, books out, lab batches and the practical record signed, drives
 * open, internships under way, the NBA report's state, the year's moot courts,
 * teaching-practice postings and lessons observed — and the NSS unit's year
 * where a stream offers NSS. Every figure is counted on read (nothing stored),
 * only for a tile that is drawn and whose module is on, and a line is a
 * label-and-number pair so no language needs a plural.
 */

/** A line's words and numbers; `words` are values that are themselves keys (the NBA report's state), said in the reader's language. */
export type HomeFigure = { key: TranslationKey; values: Record<string, string | number>; words?: Record<string, TranslationKey> };
export type HomeFigures = { tiles: Partial<Record<HomeTileCode, HomeFigure>>; nss: { enrolled: number; hours: number } | null };

const OPEN_DRIVES = ["OPEN", "SHORTLISTING", "ROUNDS", "OFFERS"];
const UNDER_WAY = ["PROPOSED", "APPROVED", "SUBMITTED"];
const FILING_STATUS_KEY: Record<string, TranslationKey> = {
  DRAFT: "iqac.filingStatus.DRAFT",
  AWAITING_SIGNOFF: "iqac.filingStatus.AWAITING_SIGNOFF",
  SIGNED_OFF: "iqac.filingStatus.SIGNED_OFF",
  RETURNED: "iqac.filingStatus.RETURNED",
  FILED: "iqac.filingStatus.FILED",
};

/** The last day of the calendar quarter a day key falls in. */
export function quarterEnd(dayKey: string): string {
  const year = Number(dayKey.slice(0, 4));
  const month = Number(dayKey.slice(5, 7));
  const endMonth = Math.ceil(month / 3) * 3;
  const last = new Date(Date.UTC(year, endMonth, 0)).getUTCDate();
  return `${year}-${String(endMonth).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

/** How many of the regulators' rows that apply to the college have a window touching today … the quarter's end. */
export function filingsDueThisQuarter(college: Parameters<typeof deadlineApplies>[1], today: string): number {
  const until = quarterEnd(today);
  return REGULATOR_DEADLINES.filter((row) => deadlineApplies(row, college) && deadlineWindows(row, today, until).some((w) => w.to >= today)).length;
}

export async function homeFigures(schoolId: string, input: { tiles: readonly HomeTileCode[]; modulesOn: readonly SchoolModuleCode[]; streams: readonly StreamCode[] }): Promise<HomeFigures> {
  const { tiles, modulesOn, streams } = input;
  const on = (m: SchoolModuleCode) => modulesOn.includes(m);
  const has = (tile: HomeTileCode) => tiles.includes(tile);
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, kind: true, aicteApprovalRef: true, naacGrade: true } });
  const today = todayKey(school.timezone);
  const year = currentRecordsYear(school.timezone);
  const out: HomeFigures["tiles"] = {};
  const jobs: Promise<void>[] = [];
  const job = (fn: () => Promise<void>) => jobs.push(fn());

  if (has("people"))
    job(async () => {
      const [students, faculty] = await Promise.all([
        db.membership.count({ where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } }),
        db.membership.count({ where: { schoolId, role: { in: ["FACULTY", "HOD"] }, status: "ACTIVE", leftAt: null } }),
      ]);
      out.people = { key: "streams.figure.people", values: { students, faculty } };
    });
  if (has("academics") && on("ACADEMICS"))
    job(async () => {
      const [programmes, divisions] = await Promise.all([db.programme.count({ where: { schoolId, archivedAt: null } }), db.division.count({ where: { schoolId } })]);
      out.academics = { key: "streams.figure.academics", values: { programmes, divisions } };
    });
  if (has("exams") && on("EXAMS"))
    job(async () => {
      const count = await db.examSession.count({ where: { schoolId, status: { notIn: ["PUBLISHED", "CLOSED"] } } });
      out.exams = { key: "streams.figure.exams", values: { count } };
    });
  if (has("admissions") && on("ADMISSIONS"))
    job(async () => {
      const count = await db.collegeApplication.count({ where: { schoolId, status: { in: ["APPLIED", "SCRUTINY"] } } });
      out.admissions = { key: "streams.figure.admissions", values: { count } };
    });
  if (has("scholarships") && on("SCHOLARSHIPS"))
    job(async () => {
      const count = await db.scholarshipClaim.count({ where: { schoolId, status: "APPLIED" } });
      out.scholarships = { key: "streams.figure.scholarships", values: { count } };
    });
  if (has("iqac") && on("IQAC")) {
    const count = filingsDueThisQuarter({ kind: school.kind, aicteApprovalRef: school.aicteApprovalRef, naacGrade: school.naacGrade, iqacOn: true, streams }, today);
    out.iqac = { key: "streams.figure.iqac", values: { count } };
  }
  if (has("library") && on("LIBRARY"))
    job(async () => {
      const count = await db.libraryIssue.count({ where: { schoolId, returnedAt: null } });
      out.library = { key: "streams.figure.library", values: { count } };
    });
  if (has("labs") && labStreams(streams))
    job(async () => {
      const p = await practicalRecordSummary(schoolId, year);
      out.labs = { key: "streams.figure.labs", values: { batches: p.batches, signed: p.signed, records: p.records } };
    });
  if (has("placement") && on("PLACEMENT"))
    job(async () => {
      const count = await db.drive.count({ where: { schoolId, status: { in: OPEN_DRIVES } } });
      out.placement = { key: "streams.figure.placement", values: { count } };
    });
  if (has("internships") && on("PLACEMENT"))
    job(async () => {
      const count = await db.internship.count({ where: { schoolId, status: { in: UNDER_WAY } } });
      out.internships = { key: "streams.figure.internships", values: { count } };
    });
  if (has("nba") && on("IQAC"))
    job(async () => {
      // An NBA SAR is one per engineering department and year (TA-479): with two or more departments' reports in the
      // latest year, the tile counts how many of them are signed off rather than showing whichever was generated last.
      const sars = await db.collegeFiling.findMany({ where: { schoolId, kind: "NBA_SAR" }, orderBy: [{ year: "desc" }, { generatedAt: "desc" }], take: 200, select: { status: true, year: true, departmentId: true } });
      const sar = sars[0];
      const latest = new Map<string, string>();
      for (const r of sars) if (sar && r.year === sar.year && !latest.has(r.departmentId ?? "")) latest.set(r.departmentId ?? "", r.status);
      const yearLabel = sar ? `${sar.year}–${String((sar.year + 1) % 100).padStart(2, "0")}` : "";
      out.nba = !sar
        ? { key: "streams.figure.nbaNone", values: {} }
        : latest.size > 1
          ? { key: "streams.figure.nbaDepartments", values: { year: yearLabel, done: [...latest.values()].filter((s) => s === "SIGNED_OFF" || s === "FILED").length, count: latest.size } }
          : { key: "streams.figure.nba", values: { year: yearLabel }, words: { state: FILING_STATUS_KEY[sar.status] ?? "iqac.filingStatus.DRAFT" } };
    });
  if (has("mootCourt") && streams.includes("LAW"))
    job(async () => {
      const law = await lawInternshipSummary(schoolId, year);
      out.mootCourt = { key: "streams.figure.mootCourt", values: { count: law.mootCourts.total } };
    });
  if (has("teachingPractice") && streams.includes("EDUCATION"))
    job(async () => {
      const tp = await teachingPracticeSummary(schoolId, year);
      out.teachingPractice = { key: "streams.figure.teachingPractice", values: { postings: tp.postings, observed: tp.lessonsObserved, planned: tp.lessonsPlanned } };
    });
  let nss: HomeFigures["nss"] = null;
  if (streams.some((s) => streamOffersDuty(s, "NSS_OFFICER")))
    job(async () => {
      const c = await corpsSummary(schoolId, "NSS", year);
      nss = { enrolled: c.enrolled, hours: c.hours };
    });
  await Promise.all(jobs);
  return { tiles: out, nss };
}
