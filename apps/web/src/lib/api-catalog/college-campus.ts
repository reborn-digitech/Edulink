import * as c from "@edulink/contracts";
import { COLLEGE_KINDS } from "@edulink/contracts";
import type { Endpoint } from "./types";
import { OFFICE_FIXTURE } from "./college-office-fixture";

/**
 * college-campus: the library, the hostel and the bus at a college (each under
 * its module; 4 October 2026) — e-resources and their opens, the ISBN list,
 * the borrowing terms, the criterion-4 and criterion-5 tables, the squad's
 * rounds, room changes, the hostel's rules, a route as a loop with its fee;
 * and the university's calendar pasted in.
 *
 * WHICH ARE A SCHOOL'S TOO (owner-batch-item5, 27 Oct 2026). Each door was
 * decided on its own: the e-resources (the list, an open, a link added), the
 * ISBN list and a room change are as useful at a school with the module on
 * and carry no `kinds` (their functions go through campusDesk, the e-resources
 * opening to a school's TEACHER too); the borrowing terms for faculty and the
 * book bank, the criterion 4 and 5 tables, the anti-ragging squad, a college
 * hostel's curfew rules, a route as a campus loop and the university's calendar
 * are a college's and say `kinds: COLLEGE_KINDS`, so a school is answered 404
 * by the gate. A school sets its mess charge on the house (POST
 * /api/v1/hostel/hostels) and its route fee on the route (the routes doors).
 */
const COLLEGE = COLLEGE_KINDS;
export const COLLEGE_CAMPUS: Endpoint[] = [
  { method: "GET", path: "/api/v1/library/eresources", summary: "The e-resources (N-LIST, DELNET, e-journals); the desk sees their open counts; at a college or a school with the library on", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC", "STUDENT", "TEACHER", "FACULTY", "HOD"], module: "LIBRARY", response: c.eResourcesSchema },
  { method: "POST", path: "/api/v1/library/eresources", summary: "Add or correct an e-resource link (https only)", access: ["LIBRARIAN", "ADMIN"], module: "LIBRARY", request: c.eResourceSaveSchema, response: c.eResourceSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/library/eresources/{resourceId}/open", summary: "Open an e-resource through the app: counted, and its link returned", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC", "STUDENT", "TEACHER", "FACULTY", "HOD"], module: "LIBRARY", response: c.eResourceOpenSchema, sample: `/api/v1/library/eresources/${OFFICE_FIXTURE.eResource}/open` },
  { method: "POST", path: "/api/v1/library/isbn-import", summary: "A publisher's ISBN list, pasted: titles added once by ISBN, bad check digits named; at a college or a school", access: ["LIBRARIAN", "ADMIN"], module: "LIBRARY", request: c.isbnImportBodySchema, response: c.isbnImportResultSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/library/college-table", summary: "The library's criterion-4 numbers for a year", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC"], module: "LIBRARY", kinds: COLLEGE, request: c.yearQuerySchema, response: c.libraryTableSchema },
  { method: "GET", path: "/api/v1/library/college-settings", summary: "A college's borrowing terms for faculty and students, and the book bank's extra books", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC"], module: "LIBRARY", kinds: COLLEGE, response: c.collegeLibrarySettingsSchema },
  { method: "POST", path: "/api/v1/library/college-settings", summary: "Set the college's borrowing terms", access: ["ADMIN"], module: "LIBRARY", kinds: COLLEGE, request: c.collegeLibrarySettingsSchema, response: c.collegeLibrarySettingsSchema, emptyBodyStatus: 422, sampleBody: () => ({ facultyLimit: 10, facultyLoanDays: 90, collegeStudentLimit: 4, collegeStudentLoanDays: 15, bookBankExtra: 2 }) },
  { method: "GET", path: "/api/v1/hostel/squad-rounds", summary: "The anti-ragging squad's rounds", access: ["WARDEN", "ADMIN", "PRINCIPAL", "IQAC"], module: "HOSTEL", kinds: COLLEGE, response: c.squadRoundsSchema },
  { method: "POST", path: "/api/v1/hostel/squad-rounds", summary: "Log a round of the anti-ragging squad", access: ["WARDEN", "ADMIN"], module: "HOSTEL", kinds: COLLEGE, request: c.squadRoundSaveSchema, response: c.squadRoundSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/hostel/room-change", summary: "Move a boarder to another bed: the old one ends today and the new one starts, in one transaction; at a college or a school", access: ["WARDEN", "ADMIN"], module: "HOSTEL", request: c.roomChangeBodySchema, response: c.roomChangedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/hostel/college-table", summary: "Occupancy and discipline for a year (criterion 5)", access: ["WARDEN", "ADMIN", "PRINCIPAL", "IQAC"], module: "HOSTEL", kinds: COLLEGE, request: c.yearQuerySchema, response: c.hostelTableSchema },
  { method: "POST", path: "/api/v1/hostel/hostels/{hostelId}/rules", summary: "A college hostel's rules: the curfew, night-outs, the mess's monthly charge", access: ["ADMIN"], module: "HOSTEL", kinds: COLLEGE, request: c.hostelRulesBodySchema, response: c.hostelRulesSchema, emptyBodyStatus: 422, sample: `/api/v1/hostel/hostels/${OFFICE_FIXTURE.hostel}/rules`, sampleBody: () => ({ curfewMinute: 1290, nightOutAllowed: true, messMonthlyPaise: 350000 }) },
  { method: "POST", path: "/api/v1/admin/transport/routes/{routeId}/college", summary: "A route at a college: fixed with a roster or a campus loop, and its fee per term", access: ["ADMIN"], module: "TRANSPORT", kinds: COLLEGE, request: c.routeCollegeBodySchema, response: c.routeCollegeSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/transport/routes/${OFFICE_FIXTURE.route}/college`, sampleBody: () => ({ kind: "LOOP", feePerTermPaise: 0 }) },
  { method: "POST", path: "/api/v1/admin/calendar/import", summary: "The university's academic calendar, pasted: entries added once by first day and name", access: ["ADMIN"], kinds: COLLEGE, request: c.calendarImportBodySchema, response: c.calendarImportResultSchema, emptyBodyStatus: 422 },
];
