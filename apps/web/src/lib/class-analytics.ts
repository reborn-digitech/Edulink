import "server-only";
import type { z } from "zod";
import type { classAnalyticsSchema, analyticsWindowSchema, classFlagSchema } from "@edulink/contracts";
import { db } from "./db";
import { AccessError, assertClassAccess } from "./tenancy";
import { currentAcademicYear } from "./academic-year";
import { addDaysToKey, dateKeyInZone, todayKey, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * A class read as numbers, for its teacher.
 *
 * NOTHING HERE IS STORED. Every figure is computed from the register, the
 * marks and the hand-ins as they stand when the page is opened, over a
 * window the teacher picks: the current term (the academic year when the
 * school has no terms; the last ninety days when it has no year), or the
 * last thirty days. The pupils "flagged" are flagged by THRESHOLDS and
 * listed by name, never ranked — the same rule insights.ts keeps for the
 * head, one class down: attendance under 75 per cent, marks that fell at
 * each of the last two exams, three late hand-ins in the window.
 *
 * WHO READS: the class's teachers, the office and the head
 * (assertClassAccess); a teacher who does not teach the class gets the
 * class page's own "not found".
 */
export const FLAG_ATTENDANCE_PERCENT = 75;
export const FLAG_LATE_HAND_INS = 3;

type Window = z.infer<typeof analyticsWindowSchema>;
type Analytics = z.infer<typeof classAnalyticsSchema>;
type Flag = z.infer<typeof classFlagSchema>;
type Staff = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function staff(ctx: ActiveContext): Staff {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !["ADMIN", "PRINCIPAL", "TEACHER"].includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Staff;
}

const pct = (num: number, den: number): number | null => (den === 0 ? null : Math.round((num * 1000) / den) / 10);
const mean = (xs: number[]): number | null => (xs.length === 0 ? null : Math.round((xs.reduce((a, b) => a + b, 0) * 10) / xs.length) / 10);

/** The window's two day keys and its name: the term today falls in, else the year, else ninety days; or thirty days. */
async function windowOf(schoolId: string, timezone: string, window: Window): Promise<{ fromDateKey: string; toDateKey: string; windowName: string | null }> {
  const toDateKey = todayKey(timezone);
  if (window === "month") return { fromDateKey: addDaysToKey(toDateKey, -29), toDateKey, windowName: null };
  const at = zonedStartOfDay(toDateKey, timezone);
  const term = await db.term.findFirst({ where: { schoolId, startDate: { lte: at }, endDate: { gte: at } }, select: { name: true, startDate: true } });
  if (term) return { fromDateKey: dateKeyInZone(term.startDate, timezone), toDateKey, windowName: term.name };
  const year = await currentAcademicYear(schoolId);
  if (year) return { fromDateKey: dateKeyInZone(year.startDate, timezone), toDateKey, windowName: year.name };
  return { fromDateKey: addDaysToKey(toDateKey, -89), toDateKey, windowName: null };
}

export async function classAnalytics(ctx: ActiveContext, classId: string, window: Window = "term"): Promise<Analytics> {
  const caller = staff(ctx);
  const klass = await assertClassAccess({ schoolId: caller.schoolId, membershipId: caller.membershipId, role: caller.role }, classId);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const { fromDateKey, toDateKey, windowName } = await windowOf(caller.schoolId, school.timezone, window);
  const instants = { gte: zonedStartOfDay(fromDateKey, school.timezone), lt: zonedStartOfDay(addDaysToKey(toDateKey, 1), school.timezone) };

  const roll = await db.enrollment.findMany({
    where: { schoolId: caller.schoolId, classId: klass.id, status: "ACTIVE", student: { status: "ACTIVE", leftAt: null } },
    select: { studentMembershipId: true, student: { select: { user: { select: { name: true, preferredName: true } } } } },
  });
  const pupilIds = roll.map((r) => r.studentMembershipId);
  const onRoll = new Set(pupilIds);
  const nameBy = new Map(roll.map((r) => [r.studentMembershipId, r.student.user.preferredName ?? r.student.user.name]));

  const [sessions, sittings, assignments] = await Promise.all([
    db.attendanceSession.findMany({
      where: { schoolId: caller.schoolId, classId: klass.id, dateKey: { gte: fromDateKey, lte: toDateKey } },
      select: { dateKey: true, records: { select: { studentMembershipId: true, status: true } } },
      orderBy: { dateKey: "asc" },
    }),
    // Every paper the class has sat, whatever the window: the "falling" rule reads the last three exams, and an exam counts in the window by its first paper's day.
    db.assignment.findMany({
      where: { schoolId: caller.schoolId, classId: klass.id, examSlotId: { not: null } },
      select: { examSlot: { select: { pointsMilli: true, dateKey: true, series: { select: { id: true, name: true, kind: true, archivedAt: true } } } }, grades: { select: { studentMembershipId: true, scoreMilli: true } } },
    }),
    db.assignment.findMany({
      where: { schoolId: caller.schoolId, classId: klass.id, examSlotId: null, publishedAt: { not: null }, dueAt: instants },
      select: { id: true, dueAt: true, submissions: { select: { studentMembershipId: true, status: true, submittedAt: true } } },
    }),
  ]);

  /* ---- attendance: present and late over every mark, and week by week ---- */
  let attended = 0;
  let marks = 0;
  const byPupil = new Map<string, { attended: number; marks: number }>();
  const byDay: { dateKey: string; attended: number; marks: number }[] = [];
  for (const s of sessions) {
    let dayAttended = 0;
    let dayMarks = 0;
    for (const r of s.records) {
      if (!onRoll.has(r.studentMembershipId)) continue;
      const here = r.status === "PRESENT" || r.status === "LATE";
      dayMarks += 1;
      if (here) dayAttended += 1;
      const p = byPupil.get(r.studentMembershipId) ?? { attended: 0, marks: 0 };
      p.marks += 1;
      if (here) p.attended += 1;
      byPupil.set(r.studentMembershipId, p);
    }
    attended += dayAttended;
    marks += dayMarks;
    byDay.push({ dateKey: s.dateKey, attended: dayAttended, marks: dayMarks });
  }
  const weeks = Math.min(12, Math.max(1, Math.ceil((dateKeyRangeDays(fromDateKey, toDateKey) + 1) / 7)));
  const trend: Analytics["attendance"]["trend"] = [];
  for (let week = weeks - 1; week >= 0; week--) {
    const end = addDaysToKey(toDateKey, -7 * week);
    const start = addDaysToKey(end, -6);
    let a = 0;
    let m = 0;
    for (const d of byDay) {
      if (d.dateKey >= start && d.dateKey <= end) {
        a += d.attended;
        m += d.marks;
      }
    }
    trend.push({ label: [end.slice(8, 10), end.slice(5, 7)].join("/"), percent: pct(a, m), marks: m });
  }

  /* ---- exams: per series, the class average and where pupils fell ---- */
  type Series = { seriesId: string; name: string; kind: string; dateKey: string | null; score: Map<string, { got: number; max: number }> };
  const seriesBy = new Map<string, Series>();
  for (const sitting of sittings) {
    const slot = sitting.examSlot;
    if (!slot || slot.series.archivedAt) continue;
    const s = seriesBy.get(slot.series.id) ?? { seriesId: slot.series.id, name: slot.series.name, kind: slot.series.kind, dateKey: null, score: new Map() };
    if (s.dateKey === null || slot.dateKey < s.dateKey) s.dateKey = slot.dateKey;
    for (const g of sitting.grades) {
      if (g.scoreMilli === null || !onRoll.has(g.studentMembershipId) || slot.pointsMilli <= 0) continue;
      const p = s.score.get(g.studentMembershipId) ?? { got: 0, max: 0 };
      p.got += g.scoreMilli;
      p.max += slot.pointsMilli;
      s.score.set(g.studentMembershipId, p);
    }
    seriesBy.set(s.seriesId, s);
  }
  const allSeries = [...seriesBy.values()].filter((s) => s.score.size > 0).sort((a, b) => (a.dateKey ?? "").localeCompare(b.dateKey ?? "") || a.name.localeCompare(b.name));
  const percentOf = (p: { got: number; max: number }) => (p.got * 100) / p.max;
  const exams: Analytics["exams"] = allSeries
    .filter((s) => s.dateKey !== null && s.dateKey >= fromDateKey && s.dateKey <= toDateKey)
    .map((s) => {
      const percents = [...s.score.values()].map(percentOf);
      const distribution = { under33: 0, from33: 0, from50: 0, from75: 0 };
      for (const p of percents) {
        if (p < 33) distribution.under33 += 1;
        else if (p < 50) distribution.from33 += 1;
        else if (p < 75) distribution.from50 += 1;
        else distribution.from75 += 1;
      }
      return { seriesId: s.seriesId, name: s.name, kind: s.kind, dateKey: s.dateKey, marked: percents.length, averagePercent: mean(percents), distribution };
    });

  /* ---- work: hand-ins expected, made, late, missing ---- */
  let submitted = 0;
  let late = 0;
  const lateBy = new Map<string, number>();
  for (const a of assignments) {
    for (const s of a.submissions) {
      if (!onRoll.has(s.studentMembershipId) || (s.status !== "SUBMITTED" && s.status !== "RETURNED")) continue;
      submitted += 1;
      if (a.dueAt && s.submittedAt && s.submittedAt > a.dueAt) {
        late += 1;
        lateBy.set(s.studentMembershipId, (lateBy.get(s.studentMembershipId) ?? 0) + 1);
      }
    }
  }
  const expected = assignments.length * pupilIds.length;
  const work = { assignments: assignments.length, expected, submitted, late, missing: Math.max(0, expected - submitted), completionPercent: pct(submitted, expected) };

  /* ---- flags: thresholds, by name, alphabetical ---- */
  const recent = allSeries.slice(-3);
  const flagged: Analytics["flagged"] = [];
  for (const id of pupilIds) {
    const flags: Flag[] = [];
    const att = byPupil.get(id);
    const attendancePercent = att ? pct(att.attended, att.marks) : null;
    if (attendancePercent !== null && attendancePercent < FLAG_ATTENDANCE_PERCENT) flags.push("ATTENDANCE");
    const recentPercents = recent.map((s) => s.score.get(id)).filter((p): p is { got: number; max: number } => Boolean(p)).map((p) => Math.round(percentOf(p) * 10) / 10);
    const falling = recentPercents.length === 3 && recentPercents[0]! > recentPercents[1]! && recentPercents[1]! > recentPercents[2]!;
    if (falling) flags.push("MARKS_FALLING");
    const lateHandIns = lateBy.get(id) ?? 0;
    if (lateHandIns >= FLAG_LATE_HAND_INS) flags.push("LATE_WORK");
    if (flags.length > 0) flagged.push({ membershipId: id, name: nameBy.get(id) ?? "", flags, attendancePercent, recentPercents: falling ? recentPercents : [], lateHandIns });
  }
  flagged.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

  return {
    classId: klass.id,
    className: klass.name,
    window,
    fromDateKey,
    toDateKey,
    windowName,
    pupils: pupilIds.length,
    attendance: { percent: pct(attended, marks), marks, registers: sessions.length, trend },
    exams,
    work,
    flagged,
  };
}

/** Whole days from one key to another, both inclusive of their own day: "2026-01-01" to "2026-01-07" is 6. */
function dateKeyRangeDays(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}
