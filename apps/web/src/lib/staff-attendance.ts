import "server-only";
import type { MyStaffAttendanceView, StaffAttendanceStatus, StaffRegisterView, StaffMonthView } from "./staff-attendance-types";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { approvedLeaveBetween } from "./leave";
import { closedOn } from "./holidays";
import { STAFF_ROLES } from "./staff-records";
import { dateKeyInZone, isDateKey, isTeachingDay, parseTeachingDays, todayKey, zonedStartOfDay } from "./dates";
import { MONTH_KEY, shiftMonth } from "./attendance-history";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * The staff register.
 *
 * Two ways in: the office marks the staff room for a day at the desk, or a
 * person checks in on their phone — present, or late once the school's
 * grace after the start of the staff day has passed, decided in the
 * school's own timezone. A day inside an approved leave shows as ON_LEAVE
 * without anyone marking it; the office may still record something else
 * for that day (a teacher who came in after all), and the row wins over the
 * leave for the counts while the leave stays visible. The month adds up
 * per person over the working days: not Sundays, not closures, and only
 * up to today — or the person's last day, for someone who left during the
 * month, who keeps their row for it. Every mark is audited under the school
 * with who and how many, never a name.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
/** The delegate the register's write touches inside a tenant-bound transaction (typed here, as school-record.ts does). */
type TenantTx = { staffAttendance: { upsert(args: unknown): Promise<unknown> } };
type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };
type Staff = ActiveContext & { schoolId: string; membershipId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Office;
}
function staff(ctx: ActiveContext): Staff {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(STAFF_ROLES as readonly string[]).includes(ctx.role)) throw new AccessError("staffAttendance.refuseNotStaff");
  return ctx as Staff;
}

/** The minute of the day in a zone: 09:05 in Kolkata is 545 wherever the server sits. */
export function minuteOfDayIn(timeZone: string, now = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}

async function schoolOf(schoolId: string) {
  return db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { timezone: true, staffCheckInMinute: true, staffLateGraceMinutes: true, teachingDays: true } });
}

/** The staff on the roll; with `since`, also those who left on or after that instant, so a month keeps the row of someone who left during it. */
async function staffMembers(schoolId: string, since?: Date) {
  return db.membership.findMany({
    where: { schoolId, role: { in: [...STAFF_ROLES] }, status: "ACTIVE", ...(since ? { OR: [{ leftAt: null }, { leftAt: { gte: since } }] } : { leftAt: null }) },
    select: { id: true, role: true, leftAt: true, user: { select: { name: true, preferredName: true, avatarKey: true } } },
    orderBy: [{ role: "asc" }, { user: { name: "asc" } }],
  });
}

/** Membership ids on approved leave on a day, by day, over a range. */
async function leaveDays(ctx: Staff, from: string, to: string): Promise<Map<string, Set<string>>> {
  const rows = await approvedLeaveBetween(ctx, from, to);
  const byDay = new Map<string, Set<string>>();
  for (const r of rows) {
    for (let d = r.fromDateKey < from ? from : r.fromDateKey; d <= (r.toDateKey > to ? to : r.toDateKey); d = nextDay(d)) {
      (byDay.get(d) ?? byDay.set(d, new Set()).get(d)!).add(r.applicantMembershipId);
    }
  }
  return byDay;
}

function nextDay(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}
function daysOf(month: string): string[] {
  const out: string[] = [];
  for (let d = `${month}-01`; d.startsWith(month); d = nextDay(d)) out.push(d);
  return out;
}

/** The register for one day, every staff member on it. */
export async function staffRegister(ctx: ActiveContext, dateKey?: string): Promise<StaffRegisterView> {
  const caller = office(ctx);
  const school = await schoolOf(caller.schoolId);
  const today = todayKey(school.timezone);
  const day = dateKey && isDateKey(dateKey) ? dateKey : today;
  if (day > today) throw new AccessError("staffAttendance.refuseFuture");
  const [members, rows, closure, leave] = await Promise.all([
    staffMembers(caller.schoolId),
    db.staffAttendance.findMany({ where: { schoolId: caller.schoolId, dateKey: day } }),
    closedOn(caller.schoolId, day),
    leaveDays(caller, day, day),
  ]);
  const byMember = new Map(rows.map((r) => [r.membershipId, r]));
  const onLeave = leave.get(day) ?? new Set<string>();
  const out = members.map((m) => {
    const row = byMember.get(m.id);
    const status = (row?.status as StaffAttendanceStatus | undefined) ?? (onLeave.has(m.id) ? "ON_LEAVE" : null);
    return {
      membershipId: m.id,
      name: m.user.preferredName ?? m.user.name,
      role: m.role,
      avatarKey: m.user.avatarKey,
      status,
      source: row ? (row.source as "OFFICE" | "SELF") : onLeave.has(m.id) ? ("LEAVE" as const) : null,
      checkedInAt: row?.checkedInAt?.toISOString() ?? null,
      note: row?.note ?? null,
      onLeave: onLeave.has(m.id),
    };
  });
  const count = (s: StaffAttendanceStatus) => out.filter((r) => r.status === s).length;
  return {
    dateKey: day,
    today,
    closed: !closure.teachingDay || closure.closed,
    closedName: closure.closed ? (closure.entries[0]?.name ?? null) : !closure.teachingDay ? "" : null,
    checkInMinute: school.staffCheckInMinute,
    lateGraceMinutes: school.staffLateGraceMinutes,
    rows: out,
    counts: { total: out.length, present: count("PRESENT"), late: count("LATE"), halfDay: count("HALF_DAY"), absent: count("ABSENT"), onLeave: count("ON_LEAVE"), unmarked: out.filter((r) => r.status === null).length },
  };
}

/** The office marks some or all of the day. */
export async function markStaffRegister(ctx: ActiveContext, input: { date: string; entries: { membershipId: string; status: StaffAttendanceStatus; note?: string }[] }): Promise<{ marked: number }> {
  const caller = office(ctx);
  const school = await schoolOf(caller.schoolId);
  const today = todayKey(school.timezone);
  if (input.date > today) throw new AccessError("staffAttendance.refuseFuture");
  const members = new Set((await staffMembers(caller.schoolId)).map((m) => m.id));
  const entries = input.entries.filter((e) => members.has(e.membershipId));
  if (entries.length === 0) throw new AccessError("staffAttendance.refuseNotStaff", "NOT_FOUND");
  // `$tenantTransaction`, never `$transaction`: the plain form opens a
  // transaction nothing has bound the tenant on, and every row is refused
  // as zero rows. See db.ts and school-record.ts.
  await db.$tenantTransaction(async (tx: unknown) => {
    const t = tx as TenantTx;
    for (const e of entries) {
      await t.staffAttendance.upsert({
        where: { membershipId_dateKey: { membershipId: e.membershipId, dateKey: input.date } },
        create: { schoolId: caller.schoolId, membershipId: e.membershipId, dateKey: input.date, status: e.status, source: "OFFICE", note: e.note?.trim() || null, markedByUserId: caller.user.id },
        update: { status: e.status, source: "OFFICE", note: e.note?.trim() || null, markedByUserId: caller.user.id },
      });
    }
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "staffAttendance.mark", targetType: "School", targetId: caller.schoolId, meta: { dateKey: input.date, marked: entries.length } });
  return { marked: entries.length };
}

/** The office sets when the staff day starts and the grace before a check-in is late. */
export async function saveStaffAttendanceSettings(ctx: ActiveContext, input: { checkInMinute: number; lateGraceMinutes: number }): Promise<void> {
  const caller = office(ctx);
  // The clock is set up by the admin; the head marks the register against it.
  if (caller.role !== "ADMIN") throw new AccessError("access.onlyAnAdminSetsUpTheSchool");
  await db.school.update({ where: { id: caller.schoolId }, data: { staffCheckInMinute: input.checkInMinute, staffLateGraceMinutes: input.lateGraceMinutes } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "staffAttendance.settings", targetType: "School", targetId: caller.schoolId, meta: input });
}

/** "I'm in": present, or late after the grace; a second time in the day is a no-op that says what stands; never on a closed day. */
export async function checkIn(ctx: ActiveContext): Promise<{ status: StaffAttendanceStatus; checkedInAt: Date; late: boolean }> {
  const caller = staff(ctx);
  const school = await schoolOf(caller.schoolId);
  const today = todayKey(school.timezone);
  const closure = await closedOn(caller.schoolId, today);
  if (!closure.teachingDay || closure.closed) throw new AccessError("staffAttendance.refuseClosed");
  const existing = await db.staffAttendance.findUnique({ where: { membershipId_dateKey: { membershipId: caller.membershipId, dateKey: today } } });
  // A second tap in the day, or a check-in after the office already marked
  // the person, changes nothing and says what stands: not a refusal.
  if (existing) return { status: existing.status as StaffAttendanceStatus, checkedInAt: existing.checkedInAt ?? existing.createdAt, late: existing.status === "LATE" };
  const now = new Date();
  const late = minuteOfDayIn(school.timezone, now) > school.staffCheckInMinute + school.staffLateGraceMinutes;
  const status: StaffAttendanceStatus = late ? "LATE" : "PRESENT";
  await db.staffAttendance.create({ data: { schoolId: caller.schoolId, membershipId: caller.membershipId, dateKey: today, status, source: "SELF", checkedInAt: now, markedByUserId: caller.user.id } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "staffAttendance.checkIn", targetType: "Membership", targetId: caller.membershipId, meta: { dateKey: today, late } });
  return { status, checkedInAt: now, late };
}

type Tally = { present: number; late: number; halfDay: number; absent: number; onLeave: number; unmarked: number; workingDays: number; workingDaysInMonth: number; percent: number | null };

/**
 * The counts over the open teaching days up to `upTo` (today, or the
 * person's last day), so present + late + halfDay + absent + onLeave +
 * unmarked = workingDays; `workingDaysInMonth` is the whole month's count.
 */
function tally(days: string[], closedDays: Set<string>, rows: Map<string, StaffAttendanceStatus>, leave: (d: string) => boolean, upTo: string, week: readonly number[]): Tally {
  const t = { present: 0, late: 0, halfDay: 0, absent: 0, onLeave: 0, unmarked: 0, workingDays: 0, workingDaysInMonth: 0 };
  for (const d of days) {
    if (!isTeachingDay(d, week) || closedDays.has(d)) continue;
    t.workingDaysInMonth += 1;
    if (d > upTo) continue;
    t.workingDays += 1;
    const s = rows.get(d) ?? (leave(d) ? "ON_LEAVE" : null);
    if (s === "PRESENT") t.present += 1;
    else if (s === "LATE") t.late += 1;
    else if (s === "HALF_DAY") t.halfDay += 1;
    else if (s === "ABSENT") t.absent += 1;
    else if (s === "ON_LEAVE") t.onLeave += 1;
    else t.unmarked += 1;
  }
  const marked = t.present + t.late + t.halfDay + t.absent;
  return { ...t, percent: marked === 0 ? null : Math.round(((t.present + t.late + t.halfDay * 0.5) / marked) * 100) };
}

async function closedDaysIn(schoolId: string, days: string[], week: readonly number[]): Promise<Set<string>> {
  const out = new Set<string>();
  for (const d of days) if (isTeachingDay(d, week) && (await closedOn(schoolId, d)).closed) out.add(d);
  return out;
}

/** The month, person by person, for the office. */
export async function staffMonth(ctx: ActiveContext, month?: string): Promise<StaffMonthView> {
  const caller = office(ctx);
  const school = await schoolOf(caller.schoolId);
  const today = todayKey(school.timezone);
  const thisMonth = today.slice(0, 7);
  const m = month && MONTH_KEY.test(month) && month <= thisMonth ? month : thisMonth;
  const days = daysOf(m);
  const week = parseTeachingDays(school.teachingDays);
  const [members, rows, closedDays, leave] = await Promise.all([
    staffMembers(caller.schoolId, zonedStartOfDay(days[0]!, school.timezone)),
    db.staffAttendance.findMany({ where: { schoolId: caller.schoolId, dateKey: { gte: days[0]!, lte: days[days.length - 1]! } }, select: { membershipId: true, dateKey: true, status: true } }),
    closedDaysIn(caller.schoolId, days, week),
    leaveDays(caller, days[0]!, days[days.length - 1]!),
  ]);
  const byMember = new Map<string, Map<string, StaffAttendanceStatus>>();
  for (const r of rows) (byMember.get(r.membershipId) ?? byMember.set(r.membershipId, new Map()).get(r.membershipId)!).set(r.dateKey, r.status as StaffAttendanceStatus);
  const next = shiftMonth(m, 1);
  const open = days.filter((d) => isTeachingDay(d, week) && !closedDays.has(d));
  // A person who left during the month is counted to their last day, in the school's zone.
  const lastDay = (mem: { leftAt: Date | null }) => (mem.leftAt ? dateKeyInZone(mem.leftAt, school.timezone) : today);
  return {
    month: m,
    previousMonth: shiftMonth(m, -1),
    nextMonth: next <= thisMonth ? next : null,
    workingDays: open.filter((d) => d <= today).length,
    workingDaysInMonth: open.length,
    rows: members.map((mem) => ({ membershipId: mem.id, name: mem.user.preferredName ?? mem.user.name, role: mem.role, ...tally(days, closedDays, byMember.get(mem.id) ?? new Map(), (d) => leave.get(d)?.has(mem.id) ?? false, lastDay(mem) < today ? lastDay(mem) : today, week) })),
  };
}

/** My own month, with today's state and whether "I'm in" is still open. */
export async function myStaffAttendance(ctx: ActiveContext, month?: string): Promise<MyStaffAttendanceView> {
  const caller = staff(ctx);
  const school = await schoolOf(caller.schoolId);
  const today = todayKey(school.timezone);
  const thisMonth = today.slice(0, 7);
  const m = month && MONTH_KEY.test(month) && month <= thisMonth ? month : thisMonth;
  const days = daysOf(m);
  const week = parseTeachingDays(school.teachingDays);
  const [rows, closedDays, leave, todayRow, todayClosure] = await Promise.all([
    db.staffAttendance.findMany({ where: { membershipId: caller.membershipId, dateKey: { gte: days[0]!, lte: days[days.length - 1]! } } }),
    closedDaysIn(caller.schoolId, days, week),
    leaveDays(caller, days[0]!, days[days.length - 1]!),
    db.staffAttendance.findUnique({ where: { membershipId_dateKey: { membershipId: caller.membershipId, dateKey: today } }, select: { status: true } }),
    closedOn(caller.schoolId, today),
  ]);
  const byDay = new Map(rows.map((r) => [r.dateKey, r]));
  const statuses = new Map(rows.map((r) => [r.dateKey, r.status as StaffAttendanceStatus]));
  const leaveOn = (d: string) => leave.get(d)?.has(caller.membershipId) ?? false;
  const next = shiftMonth(m, 1);
  const todayStatus = (todayRow?.status as StaffAttendanceStatus | undefined) ?? (leaveOn(today) ? "ON_LEAVE" : null);
  return {
    month: m,
    previousMonth: shiftMonth(m, -1),
    nextMonth: next <= thisMonth ? next : null,
    today,
    todayStatus,
    canCheckIn: !todayRow && todayClosure.teachingDay && !todayClosure.closed,
    checkInMinute: school.staffCheckInMinute,
    lateGraceMinutes: school.staffLateGraceMinutes,
    summary: tally(days, closedDays, statuses, leaveOn, today, week),
    days: days
      .filter((d) => d <= today)
      .reverse()
      .map((d) => {
        const row = byDay.get(d);
        return {
          dateKey: d,
          status: (row?.status as StaffAttendanceStatus | undefined) ?? (leaveOn(d) ? "ON_LEAVE" : null),
          source: row ? (row.source as "OFFICE" | "SELF") : leaveOn(d) ? ("LEAVE" as const) : null,
          checkedInAt: row?.checkedInAt?.toISOString() ?? null,
          note: row?.note ?? null,
          closed: !isTeachingDay(d, week) || closedDays.has(d),
        };
      }),
  };
}

/**
 * The month as CSV rows: a person per row, a day per column, for the office's
 * file. A column only for the days the tallies count — open teaching days up
 * to today, never a Sunday or a closing holiday — so the day cells and the
 * count columns beside them agree; a person who left during the month has
 * their row, with nothing after their last day.
 */
export async function staffMonthCsvRows(ctx: ActiveContext, month?: string): Promise<{ month: string; headers: string[]; rows: Record<string, string | number>[] }> {
  const caller = office(ctx);
  const view = await staffMonth(ctx, month);
  const school = await schoolOf(caller.schoolId);
  const today = todayKey(school.timezone);
  const week = parseTeachingDays(school.teachingDays);
  const all = daysOf(view.month);
  const closedDays = await closedDaysIn(caller.schoolId, all, week);
  const days = all.filter((d) => d <= today && isTeachingDay(d, week) && !closedDays.has(d));
  const marks = days.length ? await db.staffAttendance.findMany({ where: { schoolId: caller.schoolId, dateKey: { in: days } }, select: { membershipId: true, dateKey: true, status: true } }) : [];
  const leave = days.length ? await leaveDays(caller, days[0]!, days[days.length - 1]!) : new Map<string, Set<string>>();
  const byKey = new Map(marks.map((r) => [`${r.membershipId}:${r.dateKey}`, r.status]));
  const short: Record<string, string> = { PRESENT: "P", LATE: "L", HALF_DAY: "H", ABSENT: "A", ON_LEAVE: "LV" };
  // The tally stops at the person's last day; so does their row.
  const left = await db.membership.findMany({ where: { id: { in: view.rows.map((r) => r.membershipId) }, leftAt: { not: null } }, select: { id: true, leftAt: true } });
  const lastDay = new Map(left.map((m) => [m.id, dateKeyInZone(m.leftAt!, school.timezone)]));
  const rows = view.rows.map((r) => {
    const row: Record<string, string | number> = { name: r.name, role: r.role };
    const last = lastDay.get(r.membershipId);
    for (const d of days) row[d] = last && d > last ? "" : (short[byKey.get(`${r.membershipId}:${d}`) ?? (leave.get(d)?.has(r.membershipId) ? "ON_LEAVE" : "")] ?? "");
    row.present = r.present;
    row.late = r.late;
    row.half_day = r.halfDay;
    row.absent = r.absent;
    row.on_leave = r.onLeave;
    return row;
  });
  return { month: view.month, headers: ["name", "role", ...days, "present", "late", "half_day", "absent", "on_leave"], rows };
}
