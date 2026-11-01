import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * THE OWNER'S DECISIONS OF 10 OCTOBER 2026 (08-remaining-risks.md R-61 Q2,
 * R-69, R-70): the office's settlement of what a leaver still owes, the
 * previous schools' leaving certificates and published report cards on the
 * record and on the family's page, and the one-click copy of the coded lines
 * of the previous school's record. The role is checked before the body on
 * every door. Samples: the settlement doors name ZZ Northgate's departed
 * pupil (`departedMembershipId`, zz-fixtures.ts `buildDepartures`); the
 * settle door's valid body IS the act (one row per leaver, refused a second
 * time), so it carries no sampleBody and the sweep asserts the empty body's
 * 422; the previous-schools and copy doors name the sweep's pupil, who has
 * no school before this one, so the list is empty and the preview null; the
 * copy's POST then answers 404 (nothing to copy), which is its honest answer
 * for that pupil.
 */
export const OWNER_DECISIONS: Endpoint[] = [
  // ---- R-61 Q2: settle on leaving
  { method: "GET", path: "/api/v1/admin/people/{membershipId}/leaving/settlement", summary: "What a leaver still owes (part-paid later instalments, unpaid earlier ones), what the departure cancelled, the items still out, and the office's decision once made", access: ["ADMIN", "PRINCIPAL", "ACCOUNTS"], reach: "ownSchool", response: c.leavingSettlementViewSchema, sample: (f) => (f.departedMembershipId ? `/api/v1/admin/people/${f.departedMembershipId}/leaving/settlement` : null) },
  { method: "POST", path: "/api/v1/admin/people/{membershipId}/leaving/settlement", summary: "The office's choice on every owed line, once: cancel the balance (the demand goes WAIVED, the paid amount kept) or keep it owed; audited, the guardians told", access: ["ADMIN"], request: c.leavingSettleBodySchema, reach: "ownSchool", response: c.leavingSettlementViewSchema, emptyBodyStatus: 422, sample: (f) => (f.departedMembershipId ? `/api/v1/admin/people/${f.departedMembershipId}/leaving/settlement` : null) },
  { method: "GET", path: "/api/v1/fees/family/leaving", summary: "The family's read of the settlement on leaving: what the departure cancelled, what the office cancelled and what stays owed (?childId=; the guardian's left child first when omitted)", access: ["PARENT"], request: c.familyLeavingQuerySchema, reach: "ownChild", response: c.familyLeavingSchema },
  // ---- R-70: the previous schools
  { method: "GET", path: "/api/v1/office/pupil-records/{membershipId}/previous-schools", summary: "The schools a pupil on this roll has left: each leaving certificate and the published report cards it opens, read-only, the old school named", access: ["ADMIN", "PRINCIPAL"], reach: "ownSchool", response: c.previousSchoolsViewSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/office/pupil-records/${f.studentMembershipId}/previous-schools` : null) },
  { method: "GET", path: "/api/v1/family/record/previous-schools", summary: "The child's previous schools as the family reads them (?childId= for a guardian): each leaving certificate and its published report cards", access: ["STUDENT", "PARENT"], request: c.familyPreviousSchoolsQuerySchema, reach: "ownChild", response: c.previousSchoolsViewSchema },
  // ---- R-69: copy from the previous school's record
  { method: "GET", path: "/api/v1/office/pupil-records/{membershipId}/copy-previous", summary: "The coded lines the previous school's record would carry over (category, religion, caste, mother tongue, place of birth, nationality, the parents' names), each marked blank here or not; null when the pupil has no leaving certificate elsewhere", access: ["ADMIN", "PRINCIPAL"], reach: "ownSchool", response: c.recordCopyPreviewSchema.nullable(), sample: (f) => (f.studentMembershipId ? `/api/v1/office/pupil-records/${f.studentMembershipId}/copy-previous` : null) },
  { method: "POST", path: "/api/v1/office/pupil-records/{membershipId}/copy-previous", summary: "The one click: the blank lines filled from the previous school's record, audited at both schools, the guardians told; 404 with nothing to copy from", access: ["ADMIN"], reach: "ownSchool", response: c.recordCopyResultSchema, emptyBodyStatus: 404, sample: (f) => (f.studentMembershipId ? `/api/v1/office/pupil-records/${f.studentMembershipId}/copy-previous` : null) },
];
