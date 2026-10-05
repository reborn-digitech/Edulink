import "server-only";
import type { z } from "zod";
import type { trendsSchema, trendTermSchema, cohortComparisonSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { readReportCardConfig } from "./report-card-config";
import { addDaysToKey, dateKeyInZone, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The school across terms and years, for the head.
 *
 * NOTHING STORED, NOTHING RANKED. Each point is one term (or one year, for
 * a school that reports once a year), recomputed from the rows that stand:
 * the register's marks, the exam papers' scores, the fee demands due, the
 * incidents logged. Subjects and teachers are listed in their own order
 * (alphabetical), so the table does not tell the reader what to conclude
 * — the rule insights.ts keeps, applied across time. A cohort is compared
 * with ITSELF a grade earlier only in name: "this year's grade 8 against
 * last year's grade 8" compares two different sets of children sitting the
 * same grade, which is the question a head asks about a curriculum, not
 * about a child.
 *
 * Every query is bound by the school and by the window's dates. The pass
 * line is the lowest band of the school's report-card scale that is not
 * the floor (D at 33 on the CBSE scale, D at 35 on the Maharashtra one),
 * or 33 for a scale with no bands.
 */
type Trends = z.infer<typeof trendsSchema>;
type TermPoint = z.infer<typeof trendTermSchema>;
type Cohort = z.infer<typeof cohortComparisonSchema>;
type Head = ActiveContext & { schoolId: string; membershipId: string; role: Role };

const DEFAULT_PASS_LINE = 33;

function head(ctx: ActiveContext): Head {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !["ADMIN", "PRINCIPAL"].includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Head;
}

const pct = (num: number, den: number): number | null => (den === 0 ? null : Math.round((num * 1000) / den) / 10);
const mean = (xs: number[]): number | null => (xs.length === 0 ? null : Math.round((xs.reduce((a, b) => a + b, 0) * 10) / xs.length) / 10);
const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

export function passLineOf(bands: { minPercent: number }[]): number {
  const lines = bands.map((b) => b.minPercent).filter((m) => m > 0);
  return lines.length === 0 ? DEFAULT_PASS_LINE : Math.min(...lines);
}

type Span = { fromDateKey: string; toDateKey: string };
type Paper = { studentMembershipId: string; classId: string; gradeLevel: string; subject: string; dateKey: string; percent: number };
type Mark = { dateKey: string; here: boolean; gradeLevel: string | null };

/** Every marked exam paper of the school in the span, as a percent, with the class, grade and subject it belongs to. */
async function papersIn(schoolId: string, span: Span): Promise<Paper[]> {
  const sittings = await db.assignment.findMany({
    where: { schoolId, examSlotId: { not: null }, examSlot: { dateKey: { gte: span.fromDateKey, lte: span.toDateKey } } },
    select: { classId: true, examSlot: { select: { subject: true, dateKey: true, pointsMilli: true, series: { select: { gradeLevel: true } } } }, grades: { select: { studentMembershipId: true, scoreMilli: true } } },
  });
  const out: Paper[] = [];
  for (const s of sittings) {
    const slot = s.examSlot;
    // An exam sitting is always a class's (only a college offering's homework has none, R-48).
    if (!slot || slot.pointsMilli <= 0 || !s.classId) continue;
    for (const g of s.grades) {
      if (g.scoreMilli === null) continue;
      out.push({ studentMembershipId: g.studentMembershipId, classId: s.classId, gradeLevel: slot.series.gradeLevel, subject: slot.subject, dateKey: slot.dateKey, percent: (g.scoreMilli * 100) / slot.pointsMilli });
    }
  }
  return out;
}

/** Every register mark of the school in the span: here or not, with the class's grade. */
async function marksIn(schoolId: string, span: Span): Promise<Mark[]> {
  const records = await db.attendanceRecord.findMany({
    where: { schoolId, session: { dateKey: { gte: span.fromDateKey, lte: span.toDateKey } } },
    select: { status: true, session: { select: { dateKey: true, class: { select: { gradeLevel: true } } } } },
  });
  return records.map((r) => ({ dateKey: r.session.dateKey, here: r.status === "PRESENT" || r.status === "LATE", gradeLevel: r.session.class.gradeLevel }));
}

/** Who teaches a class's subject, by the timetable; the class's lead teacher when the timetable does not say. */
async function teacherOf(schoolId: string): Promise<(classId: string, subject: string) => string | null> {
  const [slots, leads] = await Promise.all([
    db.timetableSlot.findMany({ where: { schoolId, teacherMembershipId: { not: null } }, select: { classId: true, subject: true, teacherMembershipId: true } }),
    db.classTeacher.findMany({ where: { schoolId, role: "LEAD" }, select: { classId: true, teacherMembershipId: true } }),
  ]);
  const bySubject = new Map<string, string>();
  for (const s of slots) {
    const key = `${s.classId}|${s.subject.trim().toLowerCase()}`;
    if (!bySubject.has(key)) bySubject.set(key, s.teacherMembershipId!);
  }
  const leadBy = new Map(leads.map((l) => [l.classId, l.teacherMembershipId]));
  return (classId, subject) => bySubject.get(`${classId}|${subject.trim().toLowerCase()}`) ?? leadBy.get(classId) ?? null;
}

export async function longitudinalTrends(ctx: ActiveContext, years = 2): Promise<Trends> {
  const caller = head(ctx);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const tz = school.timezone;
  const [yearRows, config, teacherFor] = await Promise.all([
    db.academicYear.findMany({ where: { schoolId: caller.schoolId }, orderBy: { startDate: "desc" }, take: years, select: { id: true, name: true, startDate: true, endDate: true, isCurrent: true } }),
    readReportCardConfig(caller.schoolId),
    teacherOf(caller.schoolId),
  ]);
  const passLinePercent = passLineOf(config.bands);
  if (yearRows.length === 0) return { years: [], passLinePercent, terms: [], cohorts: [] };

  const yearSpans = yearRows.map((y) => ({ id: y.id, name: y.name, fromDateKey: dateKeyInZone(y.startDate, tz), toDateKey: dateKeyInZone(y.endDate, tz), current: y.isCurrent }));
  const whole: Span = { fromDateKey: yearSpans[yearSpans.length - 1]!.fromDateKey, toDateKey: yearSpans[0]!.toDateKey };

  const [termRows, papers, marks, demands, incidents, staff] = await Promise.all([
    db.term.findMany({ where: { schoolId: caller.schoolId, academicYearId: { in: yearRows.map((y) => y.id) } }, orderBy: { startDate: "asc" }, select: { id: true, name: true, academicYearId: true, startDate: true, endDate: true } }),
    papersIn(caller.schoolId, whole),
    marksIn(caller.schoolId, whole),
    db.feeDemand.findMany({ where: { schoolId: caller.schoolId, status: { in: ["OPEN", "PART", "PAID", "CARRIED"] }, dueDate: { gte: zonedStartOfDay(whole.fromDateKey, tz), lt: zonedStartOfDay(addDaysToKey(whole.toDateKey, 1), tz) } }, select: { dueDate: true, netPaise: true, paidPaise: true } }),
    db.incident.findMany({ where: { schoolId: caller.schoolId, occurredAt: { gte: zonedStartOfDay(whole.fromDateKey, tz), lt: zonedStartOfDay(addDaysToKey(whole.toDateKey, 1), tz) } }, select: { occurredAt: true } }),
    db.membership.findMany({ where: { schoolId: caller.schoolId, role: { in: ["TEACHER", "PRINCIPAL", "ADMIN"] } }, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
  ]);
  const staffName = new Map(staff.map((m) => [m.id, nameOf(m.user)]));

  // A year with no terms is one point of its own, so a school that reports once a year still has a line.
  const points: { termId: string; yearName: string; termName: string; span: Span }[] = [];
  for (const y of [...yearSpans].reverse()) {
    const mine = termRows.filter((t) => t.academicYearId === y.id);
    if (mine.length === 0) points.push({ termId: `year:${y.id}`, yearName: y.name, termName: y.name, span: { fromDateKey: y.fromDateKey, toDateKey: y.toDateKey } });
    for (const t of mine) points.push({ termId: t.id, yearName: y.name, termName: t.name, span: { fromDateKey: dateKeyInZone(t.startDate, tz), toDateKey: dateKeyInZone(t.endDate, tz) } });
  }

  const inSpan = (dateKey: string, span: Span) => dateKey >= span.fromDateKey && dateKey <= span.toDateKey;
  const terms: TermPoint[] = points.map((p) => {
    const ps = papers.filter((x) => inSpan(x.dateKey, p.span));
    const ms = marks.filter((x) => inSpan(x.dateKey, p.span));
    const bySubject = new Map<string, number[]>();
    const byTeacher = new Map<string, number[]>();
    const byPupil = new Map<string, number[]>();
    for (const x of ps) {
      (bySubject.get(x.subject) ?? bySubject.set(x.subject, []).get(x.subject)!).push(x.percent);
      const who = teacherFor(x.classId, x.subject);
      if (who) (byTeacher.get(who) ?? byTeacher.set(who, []).get(who)!).push(x.percent);
      (byPupil.get(x.studentMembershipId) ?? byPupil.set(x.studentMembershipId, []).get(x.studentMembershipId)!).push(x.percent);
    }
    const pupilMeans = [...byPupil.values()].map((xs) => mean(xs)!);
    const passed = pupilMeans.filter((m) => m >= passLinePercent).length;
    const ds = demands.filter((d) => inSpan(dateKeyInZone(d.dueDate, tz), p.span));
    const net = ds.reduce((n, d) => n + d.netPaise, 0);
    const paid = ds.reduce((n, d) => n + Math.min(d.paidPaise, d.netPaise), 0);
    return {
      termId: p.termId,
      yearName: p.yearName,
      termName: p.termName,
      fromDateKey: p.span.fromDateKey,
      toDateKey: p.span.toDateKey,
      attendancePercent: pct(ms.filter((m) => m.here).length, ms.length),
      examAveragePercent: mean(ps.map((x) => x.percent)),
      passPercent: pct(passed, pupilMeans.length),
      pupilsWithMarks: pupilMeans.length,
      bySubject: [...bySubject.entries()].map(([subject, xs]) => ({ subject, averagePercent: mean(xs)!, papers: xs.length })).sort((a, b) => a.subject.localeCompare(b.subject)),
      byTeacher: [...byTeacher.entries()].map(([membershipId, xs]) => ({ membershipId, name: staffName.get(membershipId) ?? "", averagePercent: mean(xs)!, papers: xs.length })).sort((a, b) => a.name.localeCompare(b.name)),
      feeCollectionPercent: pct(paid, net),
      incidents: incidents.filter((i) => inSpan(dateKeyInZone(i.occurredAt, tz), p.span)).length,
    };
  });

  /* ---- cohorts: this year's grade against last year's same grade ---- */
  const thisYear = yearSpans[0]!;
  const lastYear = yearSpans[1] ?? null;
  const gradeStats = (span: Span, gradeLevel: string) => {
    const ps = papers.filter((x) => x.gradeLevel === gradeLevel && inSpan(x.dateKey, span));
    const ms = marks.filter((x) => x.gradeLevel === gradeLevel && inSpan(x.dateKey, span));
    return { attendancePercent: pct(ms.filter((m) => m.here).length, ms.length), examAveragePercent: mean(ps.map((x) => x.percent)), pupils: new Set(ps.map((x) => x.studentMembershipId)).size };
  };
  const grades = [...new Set(papers.filter((x) => inSpan(x.dateKey, thisYear) || (lastYear && inSpan(x.dateKey, lastYear))).map((x) => x.gradeLevel))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const cohorts: Cohort[] = grades.map((gradeLevel) => ({
    gradeLevel,
    thisYear: { yearName: thisYear.name, ...gradeStats(thisYear, gradeLevel) },
    lastYear: lastYear ? { yearName: lastYear.name, ...gradeStats(lastYear, gradeLevel) } : null,
  }));

  return { years: yearSpans, passLinePercent, terms, cohorts };
}
