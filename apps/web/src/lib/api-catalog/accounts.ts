import * as c from "@edulink/contracts";
import { COLLEGE_KINDS } from "@edulink/contracts";
import type { Endpoint } from "./types";
import { OFFICE_FIXTURE } from "./college-office-fixture";

/**
 * accounts: the college's accounts desk (role ACCOUNTS with the office and
 * the principal; no module; 4 October 2026) — fee structures by programme,
 * year and category, demands raised from them, concessions with the
 * principal's approval above the office's limit, the ledger net of the
 * scholarship receivable, no-dues, leaving, mess and route fees, the
 * overview, the auditor's schedules and the finance table. A college's doors
 * answer 403 MODULE_OFF at a school, the module gate's answer (assertCollege,
 * W-17). No money moves (decision 0003).
 */
export const ACCOUNTS_DESK: Endpoint[] = [
  { method: "GET", path: "/api/v1/accounts/overview", summary: "Collection against demand by programme and term, defaulters, the scholarship receivable by age, income and expense", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], response: c.accountsOverviewSchema },
  { method: "GET", path: "/api/v1/accounts/fee-structures", summary: "This year's structures by programme, year of study and category", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], response: c.collegeFeeStructuresSchema },
  { method: "POST", path: "/api/v1/accounts/fee-structures", summary: "A structure as the fee regulating authority approved it: terms with lines by head, the approval reference, late-fee slabs; published at once", access: ["ACCOUNTS", "ADMIN"], request: c.collegeFeeStructureBodySchema, response: c.collegeSavedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/accounts/demands/raise", summary: "Every active student on the structure their programme, year and category call for, with each term's demand; a second run changes nothing", access: ["ACCOUNTS", "ADMIN"], request: c.raiseDemandsBodySchema, response: c.raiseDemandsResultSchema, sampleBody: () => ({}) },
  { method: "GET", path: "/api/v1/accounts/concessions", summary: "Concessions waiting for the principal", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], response: c.pendingConcessionsSchema },
  { method: "POST", path: "/api/v1/accounts/concessions", summary: "A concession with the sanctioning authority named; above the office's limit it waits for the principal and is not applied", access: ["ACCOUNTS", "ADMIN"], request: c.collegeConcessionBodySchema, reach: "ownSchool", response: c.collegeConcessionResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/accounts/concessions/{concessionId}/decide", summary: "The principal approves (applied now) or refuses a concession above the limit", access: ["PRINCIPAL"], request: c.concessionDecisionBodySchema, response: c.concessionDecidedSchema, emptyBodyStatus: 422, sample: `/api/v1/accounts/concessions/${OFFICE_FIXTURE.concessionDecided}/decide`, sampleBody: () => ({ approve: false }) },
  { method: "GET", path: "/api/v1/accounts/settings", summary: "The office's concession limit", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], response: c.accountsSettingsSchema },
  { method: "POST", path: "/api/v1/accounts/settings", summary: "Set the concession limit above which the principal approves", access: ["ADMIN"], request: c.accountsSettingsSchema, response: c.accountsSettingsSchema, emptyBodyStatus: 422, sampleBody: () => ({ concessionLimitPaise: 500000 }) },
  { method: "GET", path: "/api/v1/accounts/ledger/{studentMembershipId}", summary: "One student's ledger: each term's demand, the scholarship receivable, paid and net due", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], reach: "ownSchool", response: c.studentLedgerSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/accounts/ledger/${f.studentMembershipId}` : null) },
  // The counter question from a phone (5 Oct 2026): a student by PRN, college code or name; the sweep asks for the ZZ students.
  { method: "GET", path: "/api/v1/accounts/lookup", summary: "A student of this college by the start of the PRN or college code, or part of the name; at most twenty, live students only, read only", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], request: c.accountsLookupQuerySchema, response: c.accountsLookupSchema, sample: "/api/v1/accounts/lookup?q=ZZ" },
  { method: "GET", path: "/api/v1/student/ledger", summary: "The student's own ledger net of the state's share; a guardian's read needs the MONEY grant for an adult", access: ["STUDENT", "PARENT"], request: c.studentLedgerQuerySchema, reach: "ownChild", reachRefusal: { STUDENT: "filters" }, response: c.studentLedgerSchema },
  { method: "GET", path: "/api/v1/accounts/no-dues", summary: "Active students with an uncleared line for the event, the desks named", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "HOD"], request: c.noDuesQuerySchema, response: c.noDuesListSchema, sample: "/api/v1/accounts/no-dues?event=EXAM_FORM" },
  { method: "GET", path: "/api/v1/accounts/no-dues/{studentMembershipId}", summary: "One student's clearance for an event: each desk's line, what is owed and out, cleared or not", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL", "LIBRARIAN", "WARDEN", "HOD"], request: c.noDuesQuerySchema, reach: "ownSchool", response: c.noDuesSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/accounts/no-dues/${f.studentMembershipId}?event=EXAM_FORM` : null) },
  { method: "POST", path: "/api/v1/accounts/no-dues/{studentMembershipId}", summary: "A desk clears its own line by hand; a new due afterwards reopens it", access: ["ACCOUNTS", "ADMIN", "LIBRARIAN", "WARDEN", "HOD"], request: c.noDuesClearBodySchema, reach: "ownSchool", response: c.noDuesSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/accounts/no-dues/${f.studentMembershipId}?event=EXAM_FORM` : null) },
  { method: "GET", path: "/api/v1/student/no-dues", summary: "The student's own clearances, every event", access: ["STUDENT"], response: c.studentNoDuesSchema },
  { method: "GET", path: "/api/v1/accounts/reports", summary: "The auditor's schedules: collection, defaulters, receivable ageing, income and expense, the finance table, as CSV text", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], request: c.accountsReportQuerySchema, response: c.officeCsvExportSchema, sample: "/api/v1/accounts/reports?report=collection" },
  { method: "GET", path: "/api/v1/accounts/finance-table", summary: "Three years of fees, scholarships, salaries, purchases and the library's spend (AICTE disclosure, NAAC criterion 4, NIRF)", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL", "IQAC"], request: c.financeTableQuerySchema, response: c.financeTableSchema },
  { method: "POST", path: "/api/v1/accounts/leaving/{studentMembershipId}", summary: "A college student leaves: the LEAVING clearance complete, the departure and the TC's record, the alumnus opened, the caution deposit's return recorded", access: ["ADMIN"], request: c.collegeLeavingBodySchema, reach: "ownSchool", response: c.collegeLeavingResultSchema, emptyBodyStatus: 422, sample: (f) => (f.studentMembershipId ? `/api/v1/accounts/leaving/${f.studentMembershipId}` : null) },
  // owner-batch-item5 (coordinator's decision 1, 27 Oct 2026): the college office's mess bill and route fees are a college's
  // alone (`kinds`): a school's office uses POST /api/v1/admin/hostel/mess-bill and /api/v1/admin/transport/route-fees.
  { method: "POST", path: "/api/v1/accounts/mess-bill", summary: "Bill a month's mess to each boarder's ledger under the MESS head; a month billed twice bills nobody twice", access: ["ACCOUNTS", "ADMIN"], kinds: COLLEGE_KINDS, module: "HOSTEL", request: c.messBillBodySchema, response: c.messBillResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/accounts/route-fees", summary: "Raise a term's route fee on each rider's ledger under the TRANSPORT head; raised once per student, route and term", access: ["ACCOUNTS", "ADMIN"], kinds: COLLEGE_KINDS, module: "TRANSPORT", request: c.routeFeesBodySchema, response: c.routeFeesResultSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/student/account", summary: "The student's own account: the guardian grants, two-step sign-in, the data export and the no-dues state", access: ["STUDENT"], response: c.studentAccountSchema },
];
