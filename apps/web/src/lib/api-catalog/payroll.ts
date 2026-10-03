import * as c from "@edulink/contracts";
import type { Endpoint, SweepFixture } from "./types";

/**
 * payroll: the PAYROLL module (3 October 2026). The office's structures,
 * salaries, monthly runs, slips and statutory files under /admin/payroll
 * (the admin writes; the head reads the summary, a run's totals, and a
 * run's slips only once the admin shares it); every member of staff reads
 * their own slips, statement and structure, and asks for an advance, under
 * /account. Every door names the module.
 *
 * Samples: the fixture's LOCKED month (ZZ_PAYROLL_MONTH, shared with the
 * head) and the sweep's teacher, who has a slip in it
 * (zz-fixtures-modules.ts). A write whose valid body is the act (a run, a
 * lock, a salary) carries none; the two that are no-ops on the fixture do.
 */
export const ZZ_PAYROLL_MONTH = "2026-08";
/** What zz:fixtures sets, sent back unchanged by the sweep. */
export const ZZ_PAYROLL_SETTINGS: c.PayrollSettings = { pfEnabled: true, pfOnFullBasic: false, esiEnabled: true, ptState: "MH", employerName: "ZZ Northgate School Trust", pfEstablishmentCode: "MHBAN0012345000", esiEmployerCode: "31000123450000999" };
const STAFF: c.RoleCode[] = ["TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN"];
const M = { module: "PAYROLL" as const };
const RUN = `/api/v1/admin/payroll/runs/${ZZ_PAYROLL_MONTH}`;
const teacher = (rest: string) => (f: SweepFixture) => (f.teacherMembershipId ? `${RUN}/slips/${f.teacherMembershipId}${rest}` : null);

export const PAYROLL: Endpoint[] = [
  { ...M, method: "GET", path: "/api/v1/admin/payroll", summary: "Payroll at a glance: the statutory settings, staff with a salary, the runs with their totals, cost by month and by department, headcount (the office and the head)", access: ["ADMIN", "PRINCIPAL"], response: c.payrollSummarySchema },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/settings", summary: "PF, ESI and professional-tax switches and the codes the portals know the school by; the rates are the coded table, confirmed by the accountant", access: ["ADMIN"], request: c.payrollSettingsSaveSchema, response: c.payrollSettingsSchema, emptyBodyStatus: 422, sampleBody: () => ({ ...ZZ_PAYROLL_SETTINGS }) },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/structures", summary: "Salary structures and their components (code, formula, value; statutory lines worked out by the rules)", access: ["ADMIN", "PRINCIPAL"], response: c.salaryStructuresSchema },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/structures", summary: "A structure whole: with an id rewritten, without one made; BASIC among its components, each code once", access: ["ADMIN"], request: c.salaryStructureSaveSchema, response: c.salaryStructureSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/salaries", summary: "Every member of staff with the salary in force: structure, basic, overrides, UAN, ESI number, payment mode, and only the last four of the sealed PAN and bank account", access: ["ADMIN"], response: c.staffSalariesSchema },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/salaries", summary: "One person's salary from a date; the PAN and bank account are sealed on arrival and a blank keeps the sealed one", access: ["ADMIN"], request: c.staffSalarySaveSchema, response: c.staffSalarySchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/runs", summary: "Draft the month's run from the staff register, approved leave (unpaid leave loses pay) and the salaries, or draw a DRAFT afresh keeping the office's own figures; a LOCKED month is refused 409", access: ["ADMIN"], request: c.payrollRunDraftSchema, response: c.payrollRunSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/runs/{month}", summary: "One month's run: its totals, its slips (for the head only once shared), the files cut from it, and who has no salary", access: ["ADMIN", "PRINCIPAL"], response: c.payrollRunSchema, sample: RUN },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/runs/{month}/slips/{membershipId}", summary: "The office's review of one slip in a DRAFT run: arrears, the month's TDS, its own loss-of-pay days, a note; refused 409 once locked", access: ["ADMIN"], request: c.payslipEditSchema, response: c.payslipSchema, emptyBodyStatus: 422, sample: teacher("") },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/runs/{month}/lock", summary: "Lock the run: nothing in it changes afterwards, its digest is kept, and each person is told their slip is ready; refused while a net is below nothing", access: ["ADMIN"], request: c.payrollRunLockSchema, response: c.payrollRunSchema, emptyBodyStatus: 422, sample: `${RUN}/lock` },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/runs/{month}/share", summary: "Whether the head reads this run's slips", access: ["ADMIN"], request: c.payrollRunShareSchema, response: c.payrollRunSchema, emptyBodyStatus: 422, sample: `${RUN}/share`, sampleBody: () => ({ shared: true }) },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/runs/{month}/export/{kind}", summary: "A file cut from a LOCKED run — pf-ecr (EPFO ECR text), esi, bank-advice (the sealed accounts opened into the file alone), pt, tds — with its SHA-256 kept; audited", access: ["ADMIN"], response: c.payrollExportFileSchema, sample: `${RUN}/export/pf-ecr` },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/runs/{month}/slips/{membershipId}/pdf", summary: "One slip as a PDF (application/pdf) in its owner's language; the head only from a shared run", access: ["ADMIN", "PRINCIPAL"], response: c.okSchema, sample: teacher("/pdf") },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/statement/{membershipId}", summary: "A member of staff's yearly earnings statement from the LOCKED runs (?year=2026-27)", access: ["ADMIN"], request: c.payrollStatementQuerySchema, response: c.payrollStatementSchema, sample: (f) => (f.teacherMembershipId ? `/api/v1/admin/payroll/statement/${f.teacherMembershipId}` : null) },
  { ...M, method: "GET", path: "/api/v1/admin/payroll/advances", summary: "Advances against salary: asks waiting first, then what is recorded with what is recovered and outstanding (read from the locked slips)", access: ["ADMIN"], response: c.staffAdvancesSchema },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/advances", summary: "Record an advance the school handed over outside the app, recovered by a monthly instalment", access: ["ADMIN"], request: c.advanceRecordSchema, response: c.staffAdvanceSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/admin/payroll/advances/decide", summary: "Answer a member of staff's ask: RECORD (with the instalment) or DECLINE", access: ["ADMIN"], request: c.advanceDecideSchema, response: c.staffAdvanceSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/account/payslips", summary: "My locked payslips, the structure I am paid on (not anyone else's), my advances and the years I have a statement for", access: STAFF, response: c.myPayslipsSchema },
  { ...M, method: "GET", path: "/api/v1/account/payslips/statement", summary: "My yearly earnings statement (?year=2026-27)", access: STAFF, request: c.payrollStatementQuerySchema, response: c.payrollStatementSchema },
  { ...M, method: "GET", path: "/api/v1/account/payslips/{month}/pdf", summary: "My payslip for a locked month as a PDF (application/pdf), in my language", access: STAFF, response: c.okSchema, sample: `/api/v1/account/payslips/${ZZ_PAYROLL_MONTH}/pdf` },
  { ...M, method: "POST", path: "/api/v1/account/advances", summary: "Ask the office for an advance against salary; one waiting ask at a time", access: STAFF, request: c.advanceAskSchema, response: c.staffAdvanceSchema, emptyBodyStatus: 422 },
];
