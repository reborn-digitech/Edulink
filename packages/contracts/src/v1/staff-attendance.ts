import { z } from "zod";

/**
 * The staff register: who was in today, marked at the desk or by a check-in
 * on the phone, and the month's picture per person.
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const monthKey = z.string().regex(/^\d{4}-\d{2}$/, "month");
const count = z.number().int().min(0);

export const STAFF_ATTENDANCE_STATUSES = ["PRESENT", "LATE", "HALF_DAY", "ABSENT", "ON_LEAVE"] as const;
export const staffAttendanceStatusSchema = z.enum(STAFF_ATTENDANCE_STATUSES);
export type StaffAttendanceStatus = z.infer<typeof staffAttendanceStatusSchema>;

export const staffRegisterRowSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  role: z.string(),
  avatarKey: z.string().nullable(),
  /** Null when nothing has been recorded for the day and no leave covers it. */
  status: staffAttendanceStatusSchema.nullable(),
  /** OFFICE, SELF, or LEAVE when the status is only the approved leave. */
  source: z.enum(["OFFICE", "SELF", "LEAVE"]).nullable(),
  checkedInAt: iso.nullable(),
  note: z.string().nullable(),
  /** The approved leave covering the day, when there is one — shown even if the office marked something else. */
  onLeave: z.boolean(),
});

/** GET /api/v1/office/staff-attendance?date= */
export const staffRegisterQuerySchema = z.object({ date: dateKey.optional() });
export const staffRegisterSchema = z.object({
  dateKey,
  today: dateKey,
  /** The school is closed on this day (a holiday or a Sunday); marking is still allowed for a working Sunday but the day is not counted. */
  closed: z.boolean(),
  closedName: z.string().nullable(),
  checkInMinute: count,
  lateGraceMinutes: count,
  rows: z.array(staffRegisterRowSchema),
  counts: z.object({ total: count, present: count, late: count, halfDay: count, absent: count, onLeave: count, unmarked: count }),
});

/** POST /api/v1/office/staff-attendance — the whole day or a few rows; an omitted person is left as they were. */
export const staffRegisterMarkSchema = z.object({
  date: dateKey,
  entries: z.array(z.object({ membershipId: cuid, status: staffAttendanceStatusSchema, note: z.string().trim().max(200).optional() })).min(1).max(500),
});
export const staffRegisterMarkedSchema = z.object({ marked: count });

/** POST /api/v1/office/staff-attendance/settings — when the staff day starts and the grace. */
export const staffAttendanceSettingsSchema = z.object({
  checkInMinute: z.number().int().min(0).max(1439),
  lateGraceMinutes: z.number().int().min(0).max(180),
});

const monthRowSchema = z.object({
  membershipId: z.string(),
  name: z.string(),
  role: z.string(),
  present: count,
  late: count,
  halfDay: count,
  absent: count,
  onLeave: count,
  unmarked: count,
  workingDays: count,
  /** Present, late and half days over the working days marked so far, or null with nothing marked. */
  percent: z.number().nullable(),
});

/** GET /api/v1/office/staff-attendance/month?month= */
export const staffMonthQuerySchema = z.object({ month: monthKey.optional() });
export const staffMonthSchema = z.object({
  month: monthKey,
  previousMonth: monthKey,
  nextMonth: monthKey.nullable(),
  workingDays: count,
  rows: z.array(monthRowSchema),
});

/** GET /api/v1/staff/attendance/me?month= — my own days. */
export const myStaffAttendanceSchema = z.object({
  month: monthKey,
  previousMonth: monthKey,
  nextMonth: monthKey.nullable(),
  today: dateKey,
  todayStatus: staffAttendanceStatusSchema.nullable(),
  canCheckIn: z.boolean(),
  checkInMinute: count,
  lateGraceMinutes: count,
  summary: monthRowSchema.omit({ membershipId: true, name: true, role: true }),
  days: z.array(z.object({ dateKey, status: staffAttendanceStatusSchema.nullable(), source: z.enum(["OFFICE", "SELF", "LEAVE"]).nullable(), checkedInAt: iso.nullable(), note: z.string().nullable(), closed: z.boolean() })),
});

/** POST /api/v1/staff/attendance/check-in — "I'm in". */
export const staffCheckInSchema = z.object({ status: staffAttendanceStatusSchema, checkedInAt: iso, late: z.boolean() });
