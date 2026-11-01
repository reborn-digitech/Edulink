import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";
import { OFFICE_FIXTURE } from "./college-office-fixture";

/**
 * scholarships: the scholarship claims against the fee ledger (module
 * SCHOLARSHIPS; 4 October 2026) — recorded, sanctioned, disbursed (a bank
 * payment on the ledger), lapsed or rejected (the demand reverts); the
 * reconciliation sheet; the student's own claims and documents.
 */
export const SCHOLARSHIPS: Endpoint[] = [
  { method: "GET", path: "/api/v1/college/scholarships/claims", summary: "Scholarship claims by status, year and scheme, with what the state still owes and for how long", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], module: "SCHOLARSHIPS", request: c.scholarshipClaimsQuerySchema, response: c.scholarshipClaimsSchema },
  { method: "POST", path: "/api/v1/college/scholarships/claims", summary: "Record a claim filed on the portal; the same student, scheme and year again is the same claim", access: ["ACCOUNTS", "ADMIN"], module: "SCHOLARSHIPS", request: c.scholarshipClaimCreateSchema, reach: "ownSchool", response: c.scholarshipClaimSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/college/scholarships/claims/{claimId}", summary: "Sanction, disbursement (a bank payment on the ledger), lapse or rejection (the demand reverts, the student is told), or the portal's id", access: ["ACCOUNTS", "ADMIN"], module: "SCHOLARSHIPS", request: c.scholarshipClaimUpdateSchema, response: c.scholarshipClaimSchema, emptyBodyStatus: 422, sample: `/api/v1/college/scholarships/claims/${OFFICE_FIXTURE.claimSanctioned}`, sampleBody: () => ({ action: "SANCTION", amountPaise: 1400000, on: "2026-09-15" }) /* within the fees the fixture claim covers: a sanction above them is refused (A3-journeys fixes, 5 Oct 2026) */ },
  { method: "GET", path: "/api/v1/college/scholarships/reconciliation", summary: "The reconciliation sheet for one scheme and year, as CSV text", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL"], module: "SCHOLARSHIPS", request: c.reconciliationQuerySchema, response: c.officeCsvExportSchema, sample: "/api/v1/college/scholarships/reconciliation?scheme=GOI_POST_MATRIC_SC&academicYear=2026-27" },
  { method: "GET", path: "/api/v1/college/scholarships/schemes", summary: "The schemes with their categories, income ceilings and shares, and the sheet they come from", access: ["ACCOUNTS", "ADMIN", "PRINCIPAL", "STUDENT"], module: "SCHOLARSHIPS", response: c.scholarshipSchemesSchema },
  { method: "GET", path: "/api/v1/student/scholarships", summary: "The student's own claims and the schemes they qualify for; a guardian's read needs the MONEY grant for an adult", access: ["STUDENT", "PARENT"], module: "SCHOLARSHIPS", request: c.studentLedgerQuerySchema, reach: "ownChild", reachRefusal: { STUDENT: "filters" }, response: c.studentScholarshipsSchema },
  { method: "POST", path: "/api/v1/student/scholarships/{claimId}/documents", summary: "A document for the student's own claim, from their own upload", access: ["STUDENT"], module: "SCHOLARSHIPS", request: c.scholarshipDocumentBodySchema, reach: "ownChild", response: c.scholarshipClaimSchema, emptyBodyStatus: 422, sample: `/api/v1/student/scholarships/${OFFICE_FIXTURE.claimSanctioned}/documents` },
];
