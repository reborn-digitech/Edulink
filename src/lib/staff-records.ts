import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { dateKeyRange, isDateKey, todayKey, weekdayOfKey } from "./dates";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Staff records, and the leave balance that falls out of them.
 *
 * WHAT THE LEAVE DESK WAS APPROVING BLIND. A teacher's row held a name, a
 * role and the day they joined the platform — no joining date a letter
 * could quote, no qualification, no designation, and no entitlement, so the
 * principal approved a fourth week of casual leave without a number in
 * front of them. The record is the office's (admin writes it, the member
 * reads their own, the principal reads it at the desk), and the balance is
 * DERIVED every time from approved leave in the current academic year —
 * never stored, so it cannot drift from the requests it counts.
 *
 * WHAT COUNTS. Casual and sick leave draw on the entitlement; unpaid leave
 * is by definition outside it and "other" is left to the desk's judgement
 * and not counted. Days are weekdays: a Friday-to-Monday request is two
 * days, not four, the way a school counts them.
 */

export const STAFF_ROLES = ["TEACHER", "PRINCIPAL", "ADMIN"] as const;
const COUNTED_KINDS = ["CASUAL", "SICK"];

export type StaffRecordView = {
  membershipId: string;
  staffNumber: string | null;
  designation: string | null;
  qualification: string | null;
  /** YYYY-MM-DD; null when the office has not said. */
  joinedOnKey: string | null;
  leaveDaysPerYear: number | null;
};

export type StaffRecordInput = {
  staffNumber?: string | null;
  designation?: string | null;
  qualification?: string | null;
  joinedOnKey?: string | null;
  leaveDaysPerYear?: number | null;
};

export type LeaveBalance = {
  /** Null when no entitlement is set — the desk is told so rather than shown 0. */
  entitlement: number | null;
  /** Weekdays of APPROVED casual/sick leave in the current academic year. */
  used: number;
  /** Weekdays of PENDING casual/sick requests — what is being asked for. */
  pending: number;
  remaining: number | null;
  yearName: string | null;
};

function empty(membershipId: string): StaffRecordView {
  return { membershipId, staffNumber: null, designation: null, qualification: null, joinedOnKey: null, leaveDaysPerYear: null };
}

function view(row: { membershipId: string; staffNumber: string | null; designation: string | null; qualification: string | null; joinedOn: Date | null; leaveDaysPerYear: number | null }): StaffRecordView {
  return {
    membershipId: row.membershipId,
    staffNumber: row.staffNumber,
    designation: row.designation,
    qualification: row.qualification,
    joinedOnKey: row.joinedOn ? row.joinedOn.toISOString().slice(0, 10) : null,
    leaveDaysPerYear: row.leaveDaysPerYear,
  };
}

/**
 * Who may read a record: the office and the head for anyone on the staff;
 * a member of staff for their own. A pupil, a parent, or another school gets
 * null — the same null a membership that does not exist gets.
 */
export async function staffRecordFor(ctx: ActiveContext, membershipId: string): Promise<StaffRecordView | null> {
  if (!ctx.schoolId) return null;
  const own = ctx.membershipId === membershipId;
  const office = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL";
  if (!own && !office) return null;
  const member = await db.membership.findFirst({
    where: { id: membershipId, schoolId: ctx.schoolId, role: { in: [...STAFF_ROLES] } },
    select: { id: true, staffRecord: true },
  });
  if (!member) return null;
  return member.staffRecord ? view(member.staffRecord) : empty(member.id);
}

export async function setStaffRecord(
  ctx: ActiveContext,
  membershipId: string,
  input: StaffRecordInput,
): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyAnAdminCanEditStaffRecords");
  const schoolId = ctx.schoolId;
  const member = await db.membership.findFirst({
    where: { id: membershipId, schoolId, role: { in: [...STAFF_ROLES] } },
    select: { id: true, userId: true },
  });
  if (!member) return { ok: false, errorKey: "staff.notStaffHere" };

  const trim = (v: string | null | undefined, max: number) => (v?.trim().slice(0, max) || null);
  if (input.joinedOnKey && !isDateKey(input.joinedOnKey)) return { ok: false, errorKey: "staff.badDate" };
  if (input.joinedOnKey) {
    // Today in the school's zone, not the server's: at 02:00 IST on the 1st a
    // UTC server still thinks it is yesterday.
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
    if (input.joinedOnKey > todayKey(school?.timezone ?? "UTC")) return { ok: false, errorKey: "staff.joinedInFuture" };
  }
  const days = input.leaveDaysPerYear;
  if (days != null && (!Number.isInteger(days) || days < 0 || days > 365)) return { ok: false, errorKey: "staff.badLeaveDays" };

  const data = {
    staffNumber: trim(input.staffNumber, 40),
    designation: trim(input.designation, 80),
    qualification: trim(input.qualification, 200),
    joinedOn: input.joinedOnKey ? new Date(`${input.joinedOnKey}T00:00:00.000Z`) : null,
    leaveDaysPerYear: days ?? null,
  };
  await db.staffRecord.upsert({
    where: { membershipId: member.id },
    create: { schoolId, membershipId: member.id, ...data },
    update: data,
  });

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "staff.record.set",
    targetType: "Membership",
    targetId: member.id,
    meta: { designation: data.designation, joinedOn: input.joinedOnKey ?? null, leaveDaysPerYear: data.leaveDaysPerYear },
  });
  // Told, because it is a record about them — in their own language.
  await notify({
    userId: member.userId,
    schoolId,
    kind: "SYSTEM",
    titleKey: "notifTitle.staffRecordUpdated",
    bodyKey: "notifBody.staffRecordUpdated",
    url: "/teacher/profile",
  }).catch(() => {});
  return { ok: true };
}

/** Weekdays in a range — what a school counts a leave as. */
export function leaveDays(fromDateKey: string, toDateKey: string): number {
  return dateKeyRange(fromDateKey, toDateKey, 400).filter((k) => {
    const wd = weekdayOfKey(k);
    return wd !== 0 && wd !== 6;
  }).length;
}

/** The balance for one member of staff, against the current academic year. */
export async function leaveBalanceFor(schoolId: string, membershipId: string): Promise<LeaveBalance> {
  const [record, year] = await Promise.all([
    db.staffRecord.findUnique({ where: { membershipId }, select: { leaveDaysPerYear: true } }),
    db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { name: true, startDate: true, endDate: true } }),
  ]);
  const from = year ? year.startDate.toISOString().slice(0, 10) : `${new Date().getUTCFullYear()}-01-01`;
  const to = year ? year.endDate.toISOString().slice(0, 10) : `${new Date().getUTCFullYear()}-12-31`;
  const requests = await db.leaveRequest.findMany({
    where: { schoolId, teacherMembershipId: membershipId, kind: { in: COUNTED_KINDS }, status: { in: ["APPROVED", "PENDING"] }, fromDateKey: { gte: from, lte: to } },
    select: { status: true, fromDateKey: true, toDateKey: true },
  });
  let used = 0;
  let pending = 0;
  for (const r of requests) {
    const n = leaveDays(r.fromDateKey, r.toDateKey);
    if (r.status === "APPROVED") used += n;
    else pending += n;
  }
  const entitlement = record?.leaveDaysPerYear ?? null;
  return { entitlement, used, pending, remaining: entitlement === null ? null : entitlement - used, yearName: year?.name ?? null };
}

/** Balances for many, for the desk — one query each is fine at desk sizes. */
export async function leaveBalancesFor(schoolId: string, membershipIds: string[]): Promise<Map<string, LeaveBalance>> {
  // One wave, not one round trip per person: a roster of thirty staff was
  // ninety sequential queries before the page could paint.
  const ids = [...new Set(membershipIds)];
  const balances = await Promise.all(ids.map((id) => leaveBalanceFor(schoolId, id)));
  return new Map(ids.map((id, i) => [id, balances[i]!]));
}
