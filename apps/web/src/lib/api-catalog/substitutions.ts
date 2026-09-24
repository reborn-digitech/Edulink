import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * substitutions: the board for a day — lessons of staff who are away, who
 * is covering, who could — and the school's own teaching week.
 */
export const SUBSTITUTIONS: Endpoint[] = [
  { method: "GET", path: "/api/v1/office/substitutions", summary: "The board for a day (?date=; today when omitted): every lesson of an absent teacher, who is covering it and who could", access: ["ADMIN", "PRINCIPAL"], request: c.substitutionBoardQuerySchema, response: c.substitutionBoardSchema },
  { method: "POST", path: "/api/v1/office/substitutions", summary: "Name who takes a lesson on a day; the same person again changes nothing; a clash is refused", access: ["ADMIN", "PRINCIPAL"], request: c.substitutionAssignSchema, response: c.substitutionAssignedSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.substitutionSlotId && f.substituteMembershipId ? { dateKey: f.todayKey, slotId: f.substitutionSlotId, substituteMembershipId: f.substituteMembershipId } : null) },
  { method: "POST", path: "/api/v1/office/substitutions/clear", summary: "Uncover a lesson again; nothing there is a no-op", access: ["ADMIN", "PRINCIPAL"], request: c.substitutionClearSchema, response: c.substitutionAssignedSchema, emptyBodyStatus: 422, sampleBody: (f) => (f.substitutionSlotId ? { dateKey: f.todayKey, slotId: f.substitutionSlotId } : null) },
  { method: "GET", path: "/api/v1/staff/substitutions/me", summary: "The lessons I am covering on a day (?date=; today when omitted)", access: ["TEACHER", "ADMIN", "PRINCIPAL"], request: c.myCoversQuerySchema, response: c.myCoversSchema },
  { method: "GET", path: "/api/v1/office/school-week", summary: "The weekday numbers the school teaches on, Monday first (0 = Sunday)", access: ["ADMIN", "PRINCIPAL"], response: c.schoolWeekSchema },
  { method: "POST", path: "/api/v1/office/school-week", summary: "Set the school's teaching week; answers how many timetable slots now sit on a day the school no longer teaches", access: ["ADMIN"], request: c.schoolWeekSchema, response: c.schoolWeekSavedSchema, emptyBodyStatus: 422, sampleBody: () => ({ days: [1, 2, 3, 4, 5, 6] }) },
];
