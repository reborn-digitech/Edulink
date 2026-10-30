/**
 * The column headings of the files the INVENTORY and PAYROLL modules cut:
 * the ESIC contribution sheet's own six columns, the bank advice a bank's
 * bulk-upload expects, the accountant's PT and TDS sheets, and the
 * auditor's fixed-asset register and stock sheet. Portals, banks and
 * auditors read these, not a person using the app, and a translated heading
 * would not upload — so they stay in English, here, in one place, which
 * scripts/i18n-audit.ts leaves out (as it does the filings library's).
 */
export const FILE_HEADINGS = {
  ESI: ["IP Number", "IP Name", "No of Days for which wages paid/payable during the month", "Total Monthly Wages", "Reason Code for Zero workings days", "Last Working Day"],
  /** qb-B (QB-07): the Slip Ref the UTR sheet matches by, as on the UPI advice. */
  BANK_ADVICE: ["Sr No", "Beneficiary Name", "Account Number", "IFSC", "Amount", "Narration", "Slip Ref"],
  PT: ["Name", "Gross (INR)", "Professional tax (INR)", "State"],
  TDS_SUMMARY: ["Name", "PAN", "Gross (INR)", "TDS (INR)"],
  /** owner-batch-item2b: one credit a line for the school's own UPI app or its bank's UPI bulk upload; the slip ref comes back on the UTR sheet. */
  UPI_ADVICE: ["Beneficiary Name", "VPA", "Amount", "Slip Ref"],
  /** owner-batch-item2b: the sheet the office sends back with what the bank or the UPI app paid (Amount optional). */
  UTR_SHEET: ["Slip Ref", "UTR", "Date", "Amount"],
  STOCK: ["Item code", "Item", "Unit", "Location", "On hand"],
  /** The last but one is completed with the date the values are worked out to. */
  FIXED_ASSETS: ["Tag number", "Asset", "Category", "Location", "Custodian", "Status", "Condition", "Purchase date", "Vendor", "Warranty until", "Cost (INR)", "Method", "Rate (%)", "Accumulated depreciation (INR)", "Book value on", "Disposed on"],
} as const;

/** The narration a bank advice line carries. */
export const salaryNarration = (month: string) => `SALARY ${month}`;

/** A row for toCsv from headings and values in the same order. */
export function rowOf(headings: readonly string[], values: readonly unknown[]): Record<string, unknown> {
  return Object.fromEntries(headings.map((h, i) => [h, values[i]]));
}
