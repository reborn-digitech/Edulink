import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * staff-attendance: the staff register. The office marks the day and reads
 * the month; every staff member checks in and reads their own days.
 */
/** Checking in and reading my own days: every member of staff, a college's six and the module staff included (campaign 2026-10-04, G-2). */
const SELF: c.RoleCode[] = ["TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN", ...c.COLLEGE_ROLES];

export const STAFF_ATTENDANCE: Endpoint[] = [
  { method: "GET", path: "/api/v1/office/staff-attendance", summary: "The staff register for a day (?date=; today when omitted), with an approved leave shown as ON_LEAVE", access: ["ADMIN", "PRINCIPAL"], request: c.staffRegisterQuerySchema, response: c.staffRegisterSchema },
  { method: "POST", path: "/api/v1/office/staff-attendance", summary: "Mark some or all of the staff for a day; a person left out is left as they were", access: ["ADMIN", "PRINCIPAL"], request: c.staffRegisterMarkSchema, response: c.staffRegisterMarkedSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.teacherMembershipId ? { date: f.todayKey, entries: [{ membershipId: f.teacherMembershipId, status: "PRESENT" }] } : null) },
  { method: "POST", path: "/api/v1/office/staff-attendance/settings", summary: "When the staff day starts and the grace before a check-in is late", access: ["ADMIN"], request: c.staffAttendanceSettingsSchema, response: c.okSchema, emptyBodyStatus: 422, sampleBody: () => ({ checkInMinute: 540, lateGraceMinutes: 15 }) },
  { method: "GET", path: "/api/v1/office/staff-attendance/month", summary: "The month per person: present, late, half days, absent, on leave, unmarked (?month=)", access: ["ADMIN", "PRINCIPAL"], request: c.staffMonthQuerySchema, response: c.staffMonthSchema },
  { method: "GET", path: "/api/v1/staff/attendance/me", summary: "My own days this month, today's state and whether I may still check in (?month=)", access: SELF, request: c.staffMonthQuerySchema, response: c.myStaffAttendanceSchema },
  { method: "POST", path: "/api/v1/staff/attendance/check-in", summary: "\"I'm in\": present, or late after the school's grace; a second time in the day is a no-op that answers what stands; never on a closed day", access: SELF, response: c.staffCheckInSchema, emptyBodyStatus: 200 },
];
