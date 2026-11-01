import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * The office's year, a class's roll and a teacher's own leave, for the phone
 * (A3-inventory-7, audit of 5 October 2026). The web had each as a server
 * action alone (admin/calendar, admin/promotion, admin/classes/[classId],
 * teacher/leave), so the phone could not make a year, close it, make or
 * remove a term, correct or remove a closure, promote the school, move a pupil
 * on or off a class's roll, or withdraw its own leave. Each door calls the
 * library the action calls, with the action's roles, checked before the body.
 *
 * THE SWEEP CHANGES NOTHING HERE. Every valid body is the act itself (a year
 * made, the school moved up, a pupil taken off), so only the re-enrolment of
 * pupil 01, already on the roll, carries a sampleBody: the rest are proved by
 * their empty body's 422, and the doors that need no body are sampled with an
 * id no school holds (404), the way /contest/entries/{entryId} is. The suite
 * (tests/api-v1-office-year.test.ts) takes each happy path at a ZZ school.
 */
const NONE = (what: string) => `zz-sweep-no-such-${what}`;

export const OFFICE_YEAR: Endpoint[] = [
  // ---- the academic year and its terms (admin/calendar/actions.ts) ---------
  { method: "POST", path: "/api/v1/admin/calendar/years", summary: "Make an academic year, named by its years (2026–27); the school's first becomes the running one, a later one waits to be moved into", access: ["ADMIN", "PRINCIPAL"], request: c.academicYearCreateBodySchema, response: c.academicYearCreatedSchema, emptyBodyStatus: 422 },
  {
    method: "POST",
    path: "/api/v1/admin/calendar/years/{yearId}/close",
    summary: "Close the running year into one already made: every pupil's badges are written down first, the year's exam series archived and its open review rounds closed; a second press is a no-op",
    access: ["ADMIN", "PRINCIPAL"],
    request: c.academicYearCloseBodySchema,
    response: c.academicYearClosedSchema,
    emptyBodyStatus: 422,
    sample: (f) => (f.academicYearId ? `/api/v1/admin/calendar/years/${f.academicYearId}/close` : null),
    probe: { body: () => ({ nextYearId: NONE("year") }) },
  },
  { method: "POST", path: "/api/v1/admin/calendar/years/{yearId}/terms", summary: "Make a term inside a year, not overlapping another of its terms", access: ["ADMIN", "PRINCIPAL"], request: c.schoolTermCreateBodySchema, response: c.schoolTermCreatedSchema, emptyBodyStatus: 422, sample: (f) => (f.academicYearId ? `/api/v1/admin/calendar/years/${f.academicYearId}/terms` : null) },
  { method: "DELETE", path: "/api/v1/admin/calendar/terms/{termId}", summary: "Remove a term: its series and cards keep their marks and lose the label; refused while a published card reports into it", access: ["ADMIN"], response: c.okSchema, emptyBodyStatus: 404, sample: `/api/v1/admin/calendar/terms/${NONE("term")}` },
  // ---- a closure on the calendar (POST /admin/calendar/closures adds one) ---
  { method: "POST", path: "/api/v1/admin/calendar/closures/{holidayId}", summary: "Correct a closure, exam window or event on the calendar, every field sent", access: ["ADMIN"], request: c.closureCreateBodySchema, response: c.okSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/calendar/closures/${NONE("closure")}` },
  { method: "DELETE", path: "/api/v1/admin/calendar/closures/{holidayId}", summary: "Take a closure, exam window or event off the calendar", access: ["ADMIN"], response: c.okSchema, emptyBodyStatus: 404, sample: `/api/v1/admin/calendar/closures/${NONE("closure")}` },
  // ---- the year-end promotion (GET /admin/classes/promotion is the plan) ----
  { method: "POST", path: "/api/v1/admin/classes/promotion", summary: "Move the school up a year by the plan as decided: each class to a class, a new class, or out (graduates leave with a certificate), repeaters held back, single pupils sent elsewhere; one way", access: ["ADMIN"], request: c.promotionBodySchema, reach: "ownSchool", response: c.promotionDoneSchema, emptyBodyStatus: 422 },
  // ---- a class's roll (admin/classes/[classId]/actions.ts) -----------------
  // Pupil 01 is on the sampled class's roll already, so putting them on it again revives nothing and adds no one: the sweep proves the 200 and changes nothing.
  { method: "POST", path: "/api/v1/admin/classes/{classId}/pupils", summary: "Put pupils of the school on a class's roll; one already there is a no-op, anyone who is not a pupil here is refused", access: ["ADMIN"], request: c.cohortAddBodySchema, reach: "ownSchool", response: c.cohortAddedSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/pupils` : null), sampleBody: (f) => (f.studentMembershipId ? { studentMembershipIds: [f.studentMembershipId] } : null) },
  { method: "POST", path: "/api/v1/admin/classes/{classId}/pupils/remove", summary: "Take one pupil off a class's roll, keeping everything they did in it; one not on the roll is a 422", access: ["ADMIN"], request: c.cohortRemoveBodySchema, reach: "ownSchool", response: c.okSchema, emptyBodyStatus: 422, sample: (f) => (f.classId ? `/api/v1/admin/classes/${f.classId}/pupils/remove` : null), probe: { body: (f) => (f.studentMembershipId ? { studentMembershipId: f.studentMembershipId } : null) } },
  // ---- a member of staff's own leave (teacher/leave/actions.ts withdraw) ----
  // The applicant's roles (LEAVE_APPLICANT_ROLES, held to this list by the suite) and the office, as the action takes them; the head and the office may withdraw anyone's.
  { method: "POST", path: "/api/v1/staff/leave/{leaveId}/withdraw", summary: "Withdraw a leave request, before or after it was approved; the cover it caused is released and told. Only the one who asked, the head or the office", access: ["TEACHER", "PRINCIPAL", "DRIVER", "LIBRARIAN", "WARDEN", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "ADMIN"], reach: { TEACHER: "self", PRINCIPAL: "ownSchool", DRIVER: "self", LIBRARIAN: "self", WARDEN: "self", FACULTY: "self", HOD: "self", EXAM_CONTROLLER: "self", IQAC: "self", TPO: "self", ACCOUNTS: "self", ADMIN: "ownSchool" }, response: c.okSchema, emptyBodyStatus: 404, sample: `/api/v1/staff/leave/${NONE("leave")}/withdraw` },
];
