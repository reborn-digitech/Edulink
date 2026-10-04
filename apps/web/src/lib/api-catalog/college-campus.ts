import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { OFFICE_FIXTURE } from "./college-office-fixture";

/**
 * college-campus: the library, the hostel and the bus at a college (each under
 * its module; 4 October 2026) — e-resources and their opens, the ISBN list,
 * the borrowing terms, the criterion-4 and criterion-5 tables, the squad's
 * rounds, room changes, the hostel's rules, a route as a loop with its fee;
 * and the university's calendar pasted in.
 */
export const COLLEGE_CAMPUS: Endpoint[] = [
  { method: "GET", path: "/api/v1/library/eresources", summary: "The e-resources (N-LIST, DELNET, e-journals); the desk sees their open counts", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC", "STUDENT", "FACULTY", "HOD"], module: "LIBRARY", response: c.eResourcesSchema },
  { method: "POST", path: "/api/v1/library/eresources", summary: "Add or correct an e-resource link (https only)", access: ["LIBRARIAN", "ADMIN"], module: "LIBRARY", request: c.eResourceSaveSchema, response: c.eResourceSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/library/eresources/{resourceId}/open", summary: "Open an e-resource through the app: counted, and its link returned", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC", "STUDENT", "FACULTY", "HOD"], module: "LIBRARY", response: c.eResourceOpenSchema, sample: `/api/v1/library/eresources/${OFFICE_FIXTURE.eResource}/open` },
  { method: "POST", path: "/api/v1/library/isbn-import", summary: "A publisher's ISBN list, pasted: titles added once by ISBN, bad check digits named", access: ["LIBRARIAN", "ADMIN"], module: "LIBRARY", request: c.isbnImportBodySchema, response: c.isbnImportResultSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/library/college-table", summary: "The library's criterion-4 numbers for a year", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC"], module: "LIBRARY", request: c.yearQuerySchema, response: c.libraryTableSchema },
  { method: "GET", path: "/api/v1/library/college-settings", summary: "A college's borrowing terms for faculty and students, and the book bank's extra books", access: ["LIBRARIAN", "ADMIN", "PRINCIPAL", "IQAC"], module: "LIBRARY", response: c.collegeLibrarySettingsSchema },
  { method: "POST", path: "/api/v1/library/college-settings", summary: "Set the college's borrowing terms", access: ["ADMIN"], module: "LIBRARY", request: c.collegeLibrarySettingsSchema, response: c.collegeLibrarySettingsSchema, emptyBodyStatus: 422, sampleBody: () => ({ facultyLimit: 10, facultyLoanDays: 90, collegeStudentLimit: 4, collegeStudentLoanDays: 15, bookBankExtra: 2 }) },
  { method: "GET", path: "/api/v1/hostel/squad-rounds", summary: "The anti-ragging squad's rounds", access: ["WARDEN", "ADMIN", "PRINCIPAL", "IQAC"], module: "HOSTEL", response: c.squadRoundsSchema },
  { method: "POST", path: "/api/v1/hostel/squad-rounds", summary: "Log a round of the anti-ragging squad", access: ["WARDEN", "ADMIN"], module: "HOSTEL", request: c.squadRoundSaveSchema, response: c.squadRoundSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/hostel/room-change", summary: "Move a boarder to another bed: the old one ends today and the new one starts, in one transaction", access: ["WARDEN", "ADMIN"], module: "HOSTEL", request: c.roomChangeBodySchema, response: c.roomChangedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/hostel/college-table", summary: "Occupancy and discipline for a year (criterion 5)", access: ["WARDEN", "ADMIN", "PRINCIPAL", "IQAC"], module: "HOSTEL", request: c.yearQuerySchema, response: c.hostelTableSchema },
  { method: "POST", path: "/api/v1/hostel/hostels/{hostelId}/rules", summary: "A college hostel's rules: the curfew, night-outs, the mess's monthly charge", access: ["ADMIN"], module: "HOSTEL", request: c.hostelRulesBodySchema, response: c.hostelRulesSchema, emptyBodyStatus: 422, sample: `/api/v1/hostel/hostels/${OFFICE_FIXTURE.hostel}/rules`, sampleBody: () => ({ curfewMinute: 1290, nightOutAllowed: true, messMonthlyPaise: 350000 }) },
  { method: "POST", path: "/api/v1/admin/transport/routes/{routeId}/college", summary: "A route at a college: fixed with a roster or a campus loop, and its fee per term", access: ["ADMIN"], module: "TRANSPORT", request: c.routeCollegeBodySchema, response: c.routeCollegeSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/transport/routes/${OFFICE_FIXTURE.route}/college`, sampleBody: () => ({ kind: "LOOP", feePerTermPaise: 0 }) },
  { method: "POST", path: "/api/v1/admin/calendar/import", summary: "The university's academic calendar, pasted: entries added once by first day and name", access: ["ADMIN"], request: c.calendarImportBodySchema, response: c.calendarImportResultSchema, emptyBodyStatus: 422 },
];
