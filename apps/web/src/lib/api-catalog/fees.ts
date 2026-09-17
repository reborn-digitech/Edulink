import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * fees: the school's ledger — what it asked its families for and what
 * arrived. The office (ADMIN) sets up and collects; the head (PRINCIPAL)
 * reads the overview and the dues; a guardian (PARENT) reads their child's
 * dues and pays the school directly. Teachers and pupils have no door here.
 *
 * ⚠ NO ENDPOINT MOVES MONEY. Online payment goes to the school's own
 * gateway account, UPI to the school's own id, the counter records what the
 * office already holds. docs/decisions/0003 and tests/fees-invariants.test.ts.
 *
 * Writes that would post rows on every sweep carry no sampleBody, so the
 * sweep proves their 422 and leaves the ZZ fixture's ledger as it found it.
 * The reads take their ids from the fixture's own fee data (zz:fixtures builds
 * a structure, plans, a counter payment and a receipt at Northgate).
 */
export const FEES: Endpoint[] = [
  // ---- /admin/fees ------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/overview", summary: "The fees overview: asked, collected, outstanding and overdue, by grade and by age, with the claims queue", access: ["ADMIN", "PRINCIPAL"], response: c.feeOverviewSchema },
  { method: "GET", path: "/api/v1/fees/dues", summary: "Every pupil with their dues, paid and overdue, filtered and paged", access: ["ADMIN", "PRINCIPAL"], request: c.feeDuesQuerySchema, response: c.feeDuesSchema },
  { method: "POST", path: "/api/v1/fees/remind", summary: "Tell every overdue family (or the pupils named) now", access: ["ADMIN"], request: c.feeRemindBodySchema, response: c.feeRemindResultSchema },
  { method: "GET", path: "/api/v1/fees/export/collections", summary: "The collection register between two days, as CSV text", access: ["ADMIN"], request: c.feeExportQuerySchema, response: c.officeCsvExportSchema, sample: (f) => `/api/v1/fees/export/collections?fromKey=${f.todayKey}&toKey=${f.todayKey}` },
  { method: "GET", path: "/api/v1/fees/export/outstanding", summary: "Everyone with something outstanding this year, with ageing, as CSV text", access: ["ADMIN"], response: c.officeCsvExportSchema },
  { method: "POST", path: "/api/v1/fees/carry-forward", summary: "Move every pupil's outstanding from one year into an opening balance in the next", access: ["ADMIN"], request: c.feeCarryForwardBodySchema, response: c.feeCarryForwardResultSchema, emptyBodyStatus: 422 },
  // ---- settings ---------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/settings", summary: "How this school's families pay: UPI id, gateway (key id only), receipt series, bank note", access: ["ADMIN"], response: c.feeSettingsSchema },
  { method: "POST", path: "/api/v1/fees/settings", summary: "Save the UPI id, payee name, receipt prefix and bank note", access: ["ADMIN"], request: c.feeSettingsSaveSchema, response: c.feeOkSchema },
  { method: "POST", path: "/api/v1/fees/settings/gateway", summary: "Save the school's own gateway keys; the secrets are sealed and never shown again", access: ["ADMIN"], request: c.feeGatewaySaveSchema, response: c.feeOkSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/fees/settings/gateway", summary: "Remove the school's gateway keys; online payment stops", access: ["ADMIN"], response: c.feeOkSchema },
  // ---- heads ------------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/heads", summary: "The fee heads, retired ones included", access: ["ADMIN", "PRINCIPAL"], response: c.feeHeadsSchema },
  { method: "POST", path: "/api/v1/fees/heads", summary: "Add a fee head, or rename one by id", access: ["ADMIN"], request: c.feeHeadSaveSchema, response: c.feeHeadSavedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/heads/{headId}/retire", summary: "Retire a head from the picker (restore: true brings it back)", access: ["ADMIN"], request: c.feeHeadRetireSchema, response: c.feeOkSchema, sample: (f) => (f.feeHeadId ? `/api/v1/fees/heads/${f.feeHeadId}/retire` : null), sampleBody: () => ({ restore: true }) },
  // ---- structures -------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/structures", summary: "The year's fee structures with totals and how many pupils are on each", access: ["ADMIN", "PRINCIPAL"], request: c.feeStructuresQuerySchema, response: c.feeStructuresSchema },
  { method: "POST", path: "/api/v1/fees/structures", summary: "Create a draft structure: instalments, each with head lines", access: ["ADMIN"], request: c.feeStructureBodySchema, response: c.feeStructureCreatedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/fees/structures/{structureId}", summary: "One structure in full, with the classes it could be assigned to", access: ["ADMIN", "PRINCIPAL"], response: c.feeStructureDetailSchema, sample: (f) => (f.feeStructureId ? `/api/v1/fees/structures/${f.feeStructureId}` : null) },
  { method: "POST", path: "/api/v1/fees/structures/{structureId}", summary: "Rewrite a DRAFT structure", access: ["ADMIN"], request: c.feeStructureBodySchema, response: c.feeOkSchema, emptyBodyStatus: 422, sample: (f) => (f.feeStructureId ? `/api/v1/fees/structures/${f.feeStructureId}` : null) },
  { method: "POST", path: "/api/v1/fees/structures/{structureId}/publish", summary: "Publish a structure; its numbers are frozen from here", access: ["ADMIN"], response: c.feeOkSchema, sample: (f) => (f.feeStructureId ? `/api/v1/fees/structures/${f.feeStructureId}/publish` : null) },
  { method: "POST", path: "/api/v1/fees/structures/{structureId}/archive", summary: "Archive a structure; pupils on it keep their demands", access: ["ADMIN"], response: c.feeOkSchema },
  { method: "POST", path: "/api/v1/fees/plans", summary: "Put a class or named pupils on a published structure and generate their dues", access: ["ADMIN"], request: c.feeAssignBodySchema, response: c.feeAssignResultSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/plans/remove", summary: "Take a pupil off their plan for a year, while nothing is paid", access: ["ADMIN"], request: c.feeUnassignBodySchema, response: c.feeOkSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/fees/classes/roster", summary: "A class's pupils with their plan and totals — the assignment screen", access: ["ADMIN", "PRINCIPAL"], request: c.feeClassRosterQuerySchema, response: c.feeClassRosterSchema, sample: (f) => (f.classId ? `/api/v1/fees/classes/roster?classId=${f.classId}` : null) },
  // ---- one pupil --------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/pupils/{studentMembershipId}", summary: "One pupil's ledger: plan, instalments, payments, concessions, receipts", access: ["ADMIN", "PRINCIPAL"], request: c.feePupilQuerySchema, response: c.feePupilLedgerSchema, sample: (f) => (f.studentMembershipId ? `/api/v1/fees/pupils/${f.studentMembershipId}` : null) },
  { method: "POST", path: "/api/v1/fees/concessions", summary: "Grant a concession and recalculate the pupil's open instalments", access: ["ADMIN"], request: c.feeConcessionBodySchema, response: c.feeConcessionCreatedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/concessions/{concessionId}/revoke", summary: "Revoke a concession and recalculate", access: ["ADMIN"], response: c.feeOkSchema },
  // ---- the counter ------------------------------------------------------------
  { method: "POST", path: "/api/v1/fees/payments", summary: "Record cash, cheque, bank transfer or counter UPI and issue the receipt (replay-safe by clientId)", access: ["ADMIN"], request: c.feeCounterPaymentBodySchema, response: c.feeReceiptIssuedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/payments/{paymentId}/reverse", summary: "Reverse a paid payment, keeping the row and its receipt on file", access: ["ADMIN"], request: c.feeReasonBodySchema, response: c.feeOkSchema, emptyBodyStatus: 422, sample: (f) => (f.feePaymentId ? `/api/v1/fees/payments/${f.feePaymentId}/reverse` : null) },
  { method: "POST", path: "/api/v1/fees/payments/{paymentId}/refund", summary: "Refund part or all of a payment from the school's funds", access: ["ADMIN"], request: c.feeRefundBodySchema, response: c.feeRefundResultSchema, emptyBodyStatus: 422, sample: (f) => (f.feePaymentId ? `/api/v1/fees/payments/${f.feePaymentId}/refund` : null) },
  { method: "GET", path: "/api/v1/fees/receipts/{receiptId}", summary: "A receipt as issued: the frozen document, for the office or the family", access: ["ADMIN", "PARENT"], response: c.feeReceiptSchema, sample: (f) => (f.feeReceiptId ? `/api/v1/fees/receipts/${f.feeReceiptId}` : null) },
  // ---- UPI claims -------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/claims", summary: "UPI payments families say they made, waiting for the office to confirm", access: ["ADMIN"], response: c.feeClaimsSchema },
  { method: "POST", path: "/api/v1/fees/claims/{paymentId}/confirm", summary: "Confirm a claim against the bank statement and issue the receipt", access: ["ADMIN"], response: c.feeClaimConfirmedSchema },
  { method: "POST", path: "/api/v1/fees/claims/{paymentId}/reject", summary: "Reject a claim, telling the family why", access: ["ADMIN"], request: c.feeReasonBodySchema, response: c.feeOkSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/claims/match", summary: "Match a pasted bank statement to waiting claims by UTR and amount (writes nothing)", access: ["ADMIN"], request: c.feeBankMatchBodySchema, response: c.feeBankMatchSchema, emptyBodyStatus: 422, sampleBody: () => ({ csv: "UTR,Amount\nZZSWEEPNOMATCH01,1" }) },
  { method: "POST", path: "/api/v1/fees/claims/match/apply", summary: "Confirm the matched claims together", access: ["ADMIN"], request: c.feeBankApplyBodySchema, response: c.feeBankApplyResultSchema, emptyBodyStatus: 422 },
  // ---- the family -------------------------------------------------------------
  { method: "GET", path: "/api/v1/fees/family", summary: "A guardian's child: dues, what has been paid, and the ways this school takes payment", access: ["PARENT"], request: c.familyFeesQuerySchema, response: c.familyFeesSchema },
  { method: "POST", path: "/api/v1/fees/family/checkout", summary: "Start an online payment: an order at the SCHOOL'S gateway for the chosen dues", access: ["PARENT"], request: c.familyPayBodySchema, response: c.familyCheckoutSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/family/checkout/confirm", summary: "The checkout's own confirmation, verified with the school's key secret (the webhook remains the record)", access: ["PARENT"], request: c.familyCheckoutConfirmBodySchema, response: c.familyCheckoutConfirmSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/family/upi", summary: "Start a UPI payment to the school's own id: an intent link and a reference", access: ["PARENT"], request: c.familyPayBodySchema, response: c.familyUpiStartSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/fees/family/upi/claim", summary: "Say the UPI payment went through and give its UTR for the office to confirm", access: ["PARENT"], request: c.familyUpiClaimBodySchema, response: c.feeOkSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/fees/family/payments/{paymentId}", summary: "One of my payments: where it is, and its receipt once issued", access: ["PARENT"], response: c.familyPaymentStatusSchema },
];
