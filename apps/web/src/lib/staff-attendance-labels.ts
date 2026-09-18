import type { StaffAttendanceStatus } from "./staff-attendance-types";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Client-safe words and tones for the staff register: the status pills, the
 * "recorded by" caption and the clock the check-in time is shown on. No
 * "server-only" marker here — the register form and the check-in button are
 * client components and need these without pulling the library in.
 */
export const STAFF_STATUS_KEY: Record<StaffAttendanceStatus, TranslationKey> = {
  PRESENT: "attendance.present",
  LATE: "attendance.late",
  HALF_DAY: "staffAttendance.halfDay",
  ABSENT: "attendance.absent",
  ON_LEAVE: "staffAttendance.onLeave",
};

export const STAFF_STATUS_TONE: Record<StaffAttendanceStatus, "ok" | "warn" | "danger" | "info" | "neutral"> = {
  PRESENT: "ok",
  LATE: "warn",
  HALF_DAY: "info",
  ABSENT: "danger",
  ON_LEAVE: "neutral",
};

export const STAFF_SOURCE_KEY: Record<"OFFICE" | "SELF" | "LEAVE", TranslationKey> = {
  OFFICE: "staffAttendance.sourceOffice",
  SELF: "staffAttendance.sourceSelf",
  LEAVE: "staffAttendance.sourceLeave",
};

/** 545 → "09:05": the minute of the day as the clock the office set it on. */
export function minuteToClock(minute: number): string {
  const m = Math.max(0, Math.min(1439, Math.round(minute)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "09:05" → 545, or null for anything that is not a clock time. */
export function clockToMinute(clock: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(clock.trim());
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}
