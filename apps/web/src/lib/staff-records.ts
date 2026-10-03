import { STAFF_APPOINTED_SUBJECTS } from "@edulink/contracts";
import "server-only";
import { PUPIL_CATEGORIES } from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { dateKeyRange, isDateKey, isTeachingDay, parseTeachingDays, todayKey, DEFAULT_TEACHING_DAYS } from "./dates";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";
import { closedDayKeys, listHolidays } from "./holidays";

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

/** The teaching and office staff: who covers a lesson, who is appraised. */
export const STAFF_ROLES = ["TEACHER", "PRINCIPAL", "ADMIN"] as const;
/**
 * EVERYONE WHO WORKS AT THE SCHOOL: the teaching and office staff and, since
 * the modules (3 Oct 2026), a driver, the library's desk and a warden. The
 * staff register, the staff list and records, and leave are theirs; covering
 * a lesson, an appraisal, signing a paper and two-step sign-in are not, and
 * keep STAFF_ROLES. The alumnus is not staff.
 */
export const SCHOOL_STAFF_ROLES = ["TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN"] as const;
const COUNTED_KINDS = ["CASUAL", "SICK"];

export type StaffRecordView = {
  membershipId: string;
  staffNumber: string | null;
  designation: string | null;
  qualification: string | null;
  /** YYYY-MM-DD; null when the office has not said. */
  joinedOnKey: string | null;
  /** The DCF's own two dates: date of birth, and the first day in service anywhere (joinedOn is this school). */
  birthdateKey: string | null;
  serviceJoinedOnKey: string | null;
  leaveDaysPerYear: number | null;
  /** The UDISE+ teacher profile: gender M/F/T, social category, the highest academic and professional qualification codes, the nature of appointment. */
  gender: string | null;
  socialCategory: string | null;
  academicQualification: string | null;
  professionalQualification: string | null;
  appointmentType: string | null;
  /** DCF 3.2.18: the subject appointed for, one of STAFF_APPOINTED_SUBJECTS. */
  appointedSubject: string | null;
};

export type StaffRecordInput = {
  staffNumber?: string | null;
  designation?: string | null;
  qualification?: string | null;
  joinedOnKey?: string | null;
  birthdateKey?: string | null;
  serviceJoinedOnKey?: string | null;
  leaveDaysPerYear?: number | null;
  gender?: string | null;
  socialCategory?: string | null;
  academicQualification?: string | null;
  professionalQualification?: string | null;
  appointmentType?: string | null;
  appointedSubject?: string | null;
};

/** The portal's own codes, so a filing needs no translation: UDISE+ DCF 2024-25 §3.2. */
export const STAFF_GENDERS = ["M", "F", "T"] as const;
/** The same list the pupil record uses; VJ, NT and SBC file with UDISE+ as OBC (code 4), as on the student sheet. */
export const STAFF_SOCIAL_CATEGORIES = PUPIL_CATEGORIES;
/** 3.2.6(a): 1 below secondary … 8 post-doctoral. */
export const ACADEMIC_QUALIFICATIONS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;
/** 3.2.7(a): 1 basic teacher training … 12 B.Ed (Nursery); 9 is not a code. */
export const PROFESSIONAL_QUALIFICATIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "10", "11", "12"] as const;
/** 3.2.12: regular, contract, part-time or guest. */
export const APPOINTMENT_TYPES = ["REGULAR", "CONTRACT", "PART_TIME"] as const;

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
  return { membershipId, staffNumber: null, designation: null, qualification: null, joinedOnKey: null, birthdateKey: null, serviceJoinedOnKey: null, leaveDaysPerYear: null, gender: null, socialCategory: null, academicQualification: null, professionalQualification: null, appointmentType: null, appointedSubject: null };
}

function view(row: { membershipId: string; staffNumber: string | null; designation: string | null; qualification: string | null; joinedOn: Date | null; birthdate: Date | null; serviceJoinedOn: Date | null; leaveDaysPerYear: number | null; gender: string | null; socialCategory: string | null; academicQualification: string | null; professionalQualification: string | null; appointmentType: string | null; appointedSubject: string | null }): StaffRecordView {
  return {
    membershipId: row.membershipId,
    staffNumber: row.staffNumber,
    designation: row.designation,
    qualification: row.qualification,
    joinedOnKey: row.joinedOn ? row.joinedOn.toISOString().slice(0, 10) : null,
    birthdateKey: row.birthdate ? row.birthdate.toISOString().slice(0, 10) : null,
    serviceJoinedOnKey: row.serviceJoinedOn ? row.serviceJoinedOn.toISOString().slice(0, 10) : null,
    leaveDaysPerYear: row.leaveDaysPerYear,
    gender: row.gender,
    socialCategory: row.socialCategory,
    academicQualification: row.academicQualification,
    professionalQualification: row.professionalQualification,
    appointmentType: row.appointmentType,
    appointedSubject: row.appointedSubject,
  };
}

/**
 * Who may read a record: the office and the head for anyone on the staff;
 * a member of staff for their own. A pupil, a parent, or another school gets
 * null — the same null a membership that does not exist gets.
 */
/** A coded field: one of the portal's values, or null for blank. An answer off the list sets `bad`, and the save is refused — never stored as null and reported saved. */
function pick<T extends string>(value: string | null | undefined, allowed: readonly T[], bad: { hit: boolean }): T | null {
  const v = value?.trim().toUpperCase();
  if (!v) return null;
  if ((allowed as readonly string[]).includes(v)) return v as T;
  bad.hit = true;
  return null;
}

export async function staffRecordFor(ctx: ActiveContext, membershipId: string): Promise<StaffRecordView | null> {
  if (!ctx.schoolId) return null;
  const own = ctx.membershipId === membershipId;
  const office = ctx.role === "ADMIN" || ctx.role === "PRINCIPAL";
  if (!own && !office) return null;
  const member = await db.membership.findFirst({
    where: { id: membershipId, schoolId: ctx.schoolId, role: { in: [...SCHOOL_STAFF_ROLES] } },
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
    where: { id: membershipId, schoolId, role: { in: [...SCHOOL_STAFF_ROLES] } },
    select: { id: true, userId: true },
  });
  if (!member) return { ok: false, errorKey: "staff.notStaffHere" };

  const trim = (v: string | null | undefined, max: number) => (v?.trim().slice(0, max) || null);
  for (const k of [input.joinedOnKey, input.birthdateKey, input.serviceJoinedOnKey]) if (k && !isDateKey(k)) return { ok: false, errorKey: "staff.badDate" };
  if (input.birthdateKey || input.serviceJoinedOnKey) {
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
    const today = todayKey(school?.timezone ?? "UTC");
    if ((input.birthdateKey && input.birthdateKey > today) || (input.serviceJoinedOnKey && input.serviceJoinedOnKey > today)) return { ok: false, errorKey: "staff.joinedInFuture" };
  }
  if (input.joinedOnKey) {
    // Today in the school's zone, not the server's: at 02:00 IST on the 1st a
    // UTC server still thinks it is yesterday.
    const school = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
    if (input.joinedOnKey > todayKey(school?.timezone ?? "UTC")) return { ok: false, errorKey: "staff.joinedInFuture" };
  }
  const days = input.leaveDaysPerYear;
  if (days != null && (!Number.isInteger(days) || days < 0 || days > 365)) return { ok: false, errorKey: "staff.badLeaveDays" };

  const bad = { hit: false };
  const coded = {
    gender: pick(input.gender, STAFF_GENDERS, bad),
    socialCategory: pick(input.socialCategory, STAFF_SOCIAL_CATEGORIES, bad),
    academicQualification: pick(input.academicQualification, ACADEMIC_QUALIFICATIONS, bad),
    professionalQualification: pick(input.professionalQualification, PROFESSIONAL_QUALIFICATIONS, bad),
    appointmentType: pick(input.appointmentType, APPOINTMENT_TYPES, bad),
    appointedSubject: pick(input.appointedSubject, STAFF_APPOINTED_SUBJECTS, bad),
  };
  if (bad.hit) return { ok: false, errorKey: "staff.badCode" };
  const data = {
    ...coded,
    staffNumber: trim(input.staffNumber, 40),
    designation: trim(input.designation, 80),
    qualification: trim(input.qualification, 200),
    joinedOn: input.joinedOnKey ? new Date(`${input.joinedOnKey}T00:00:00.000Z`) : null,
    birthdate: input.birthdateKey ? new Date(`${input.birthdateKey}T00:00:00.000Z`) : null,
    serviceJoinedOn: input.serviceJoinedOnKey ? new Date(`${input.serviceJoinedOnKey}T00:00:00.000Z`) : null,
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

/**
 * School days in a range — what a leave draws from the entitlement.
 *
 * THE SIX-DAY WEEK, the same rule `isTeachingDay` and `schoolDaysBetween`
 * apply everywhere else: Sunday is the day off, Saturday is a school day.
 * This used to count Monday to Friday, so a Saturday's sick leave drew
 * nothing and Friday-to-Monday drew two where the school would count three.
 * `closed` — the days the calendar shuts the school — are not leave either.
 */
export function leaveDays(fromDateKey: string, toDateKey: string, closed: ReadonlySet<string> = new Set(), teachingDays: readonly number[] = DEFAULT_TEACHING_DAYS): number {
  return dateKeyRange(fromDateKey, toDateKey, 400).filter((k) => isTeachingDay(k, teachingDays) && !closed.has(k)).length;
}

/** The school's teaching week, for the counters below. */
async function teachingWeekOf(schoolId: string): Promise<number[]> {
  const school = await db.school.findUnique({ where: { id: schoolId }, select: { teachingDays: true } });
  return parseTeachingDays(school?.teachingDays);
}

/**
 * The same count against the school's calendar, and only the part of the
 * span inside `within` when a window is given — a leave that straddles the
 * year boundary belongs to each year for its own days.
 */
export async function leaveDaysFor(
  schoolId: string,
  fromDateKey: string,
  toDateKey: string,
  within?: { from: string; to: string },
): Promise<number> {
  const from = within && within.from > fromDateKey ? within.from : fromDateKey;
  const to = within && within.to < toDateKey ? within.to : toDateKey;
  if (from > to) return 0;
  const [spans, week] = await Promise.all([listHolidays(schoolId, { fromKey: from, toKey: to }), teachingWeekOf(schoolId)]);
  return leaveDays(from, to, closedDayKeys(spans), week);
}

/**
 * One counter for many spans: the school's week and its closed days loaded
 * once for the window, then `leaveDays` for each request. The desk's queue
 * used the default six-day week and no holidays for the "this request" figure
 * beside a balance computed on the real calendar, so the two disagreed
 * whenever a request crossed a holiday or a day the school does not teach.
 */
export async function leaveDayCounterFor(schoolId: string, fromDateKey: string, toDateKey: string): Promise<(from: string, to: string) => number> {
  if (fromDateKey > toDateKey) return () => 0;
  const [spans, week] = await Promise.all([listHolidays(schoolId, { fromKey: fromDateKey, toKey: toDateKey }), teachingWeekOf(schoolId)]);
  const closed = closedDayKeys(spans);
  return (from, to) => leaveDays(from, to, closed, week);
}

/** The balance for one member of staff, against the current academic year. */
export async function leaveBalanceFor(schoolId: string, membershipId: string): Promise<LeaveBalance> {
  const [record, year] = await Promise.all([
    db.staffRecord.findUnique({ where: { membershipId }, select: { leaveDaysPerYear: true } }),
    db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { name: true, startDate: true, endDate: true } }),
  ]);
  const from = year ? year.startDate.toISOString().slice(0, 10) : `${new Date().getUTCFullYear()}-01-01`;
  const to = year ? year.endDate.toISOString().slice(0, 10) : `${new Date().getUTCFullYear()}-12-31`;
  // Overlapping the year, not starting in it: a leave across the boundary
  // counts here for its days inside the year and nowhere else for the rest.
  const requests = await db.leaveRequest.findMany({
    where: { schoolId, teacherMembershipId: membershipId, kind: { in: COUNTED_KINDS }, status: { in: ["APPROVED", "PENDING"] }, fromDateKey: { lte: to }, toDateKey: { gte: from } },
    select: { status: true, fromDateKey: true, toDateKey: true },
  });
  const [spans, week] = await Promise.all([listHolidays(schoolId, { fromKey: from, toKey: to }), teachingWeekOf(schoolId)]);
  const closed = closedDayKeys(spans);
  let used = 0;
  let pending = 0;
  for (const r of requests) {
    const n = leaveDays(r.fromDateKey > from ? r.fromDateKey : from, r.toDateKey < to ? r.toDateKey : to, closed, week);
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
