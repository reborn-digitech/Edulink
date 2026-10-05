import "server-only";
import { isCollegeKind, type HostelNight } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { addDaysToKey, todayKey, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * THE NIGHT-OUT REGISTER AND THE CURFEW AT THE GATE (5 Oct 2026).
 *
 * A college's hostel keeps a curfew (Hostel.curfewMinute, minutes after
 * midnight) and says whether night-outs are allowed (Hostel.nightOutAllowed);
 * both were set by the office and read by nobody but the night-out request
 * (office decision 9: "stored, not enforced"). Now:
 *
 *   - a return through the gate is LATE after the leave's end, as before, or —
 *     for an outing (kind LOCAL) at a college — after the hostel's curfew on
 *     the evening the outing began. A night-out or a trip home is due back at
 *     its own end. A school's hostel keeps no curfew (the rule is the
 *     college's), so its returns are judged by the leave's end alone.
 *   - the warden reads the night: every approved leave that covers it, by
 *     when each is due back, who is out, who came in late, and who is not
 *     back yet with the time past.
 *
 * Nothing is stored here but what the gate already wrote (HostelLeave.late,
 * outAt, inAt); `backBy` and the state are computed on every read.
 */

const READERS: readonly Role[] = ["WARDEN", "ADMIN", "PRINCIPAL"];

/** The curfew on the evening a leave began, as an instant: that local day's midnight plus the hostel's minutes. */
export function curfewInstant(fromAt: Date, curfewMinute: number, timeZone: string): Date {
  const day = todayKey(timeZone, fromAt);
  return new Date(zonedStartOfDay(day, timeZone).getTime() + curfewMinute * 60_000);
}

export type CurfewRule = { college: boolean; curfewMinute: number; timeZone: string };

/** When a leave is due back: its end, or for an outing at a college the curfew that evening if that comes first. */
export function dueBack(leave: { kind: string; fromAt: Date; toAt: Date }, rule: CurfewRule): { at: Date; curfew: boolean } {
  if (rule.college && leave.kind === "LOCAL") {
    const curfew = curfewInstant(leave.fromAt, rule.curfewMinute, rule.timeZone);
    if (curfew.getTime() < leave.toAt.getTime()) return { at: curfew, curfew: true };
  }
  return { at: leave.toAt, curfew: false };
}

/** Whether a return through the gate at `at` is late. */
export function returnIsLate(leave: { kind: string; fromAt: Date; toAt: Date }, rule: CurfewRule, at: Date): boolean {
  return at.getTime() > dueBack(leave, rule).at.getTime();
}

/** The rule a hostel's gate applies: its curfew, its school's zone, and whether the school is a college. */
export async function curfewRuleFor(hostelId: string): Promise<CurfewRule> {
  const h = await db.hostel.findUniqueOrThrow({ where: { id: hostelId }, select: { curfewMinute: true, school: { select: { kind: true, timezone: true } } } });
  return { college: isCollegeKind(h.school.kind), curfewMinute: h.curfewMinute, timeZone: h.school.timezone };
}

/** The night of `dateKey` (today in the school's zone when none): every approved leave that covers it, and where each stands. */
export async function nightRegister(ctx: ActiveContext, dateKey?: string, now: Date = new Date()): Promise<HostelNight> {
  if (!ctx.schoolId || !ctx.role || !READERS.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "HOSTEL");
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { kind: true, timezone: true } });
  const tz = school.timezone;
  const day = dateKey ?? todayKey(tz, now);
  const start = zonedStartOfDay(day, tz);
  const end = zonedStartOfDay(addDaysToKey(day, 1), tz);
  const college = isCollegeKind(school.kind);
  const hostels = await db.hostel.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true, curfewMinute: true, nightOutAllowed: true } });
  const byHostel = new Map(hostels.map((h) => [h.id, h]));
  const rows = await db.hostelLeave.findMany({
    where: { schoolId: ctx.schoolId, status: "APPROVED", fromAt: { lt: end }, toAt: { gte: start }, OR: [{ inAt: null }, { inAt: { gte: start } }] },
    orderBy: [{ fromAt: "asc" }, { id: "asc" }],
    select: { id: true, kind: true, fromAt: true, toAt: true, outAt: true, inAt: true, late: true, allotment: { select: { room: { select: { number: true, hostelId: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } } } },
  });
  const leaves = rows.map((l) => {
    const h = byHostel.get(l.allotment.room.hostelId);
    const due = dueBack(l, { college, curfewMinute: h?.curfewMinute ?? 1290, timeZone: tz });
    const state: HostelNight["leaves"][number]["state"] = l.inAt ? (l.late ? "BACK_LATE" : "BACK") : l.outAt ? (now.getTime() > due.at.getTime() ? "OVERDUE" : "OUT") : "NOT_OUT";
    return {
      leaveId: l.id,
      name: l.allotment.student.user.preferredName ?? l.allotment.student.user.name,
      hostelName: h?.name ?? "",
      roomNumber: l.allotment.room.number,
      kind: l.kind as HostelNight["leaves"][number]["kind"],
      fromAt: l.fromAt.toISOString(),
      toAt: l.toAt.toISOString(),
      backBy: due.at.toISOString(),
      curfew: due.curfew,
      outAt: l.outAt?.toISOString() ?? null,
      inAt: l.inAt?.toISOString() ?? null,
      state,
    };
  });
  // The ones to chase first: not back with the time past, then those still out, by when they are due.
  const order = { OVERDUE: 0, OUT: 1, NOT_OUT: 2, BACK_LATE: 3, BACK: 4 } as const;
  leaves.sort((a, b) => order[a.state] - order[b.state] || a.backBy.localeCompare(b.backBy));
  return { dateKey: day, college, hostels, leaves };
}
