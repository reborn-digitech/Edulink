import { z } from "zod";

/**
 * THE TALLY EXPORT (the risks batch, R-2, 5 October 2026): the fee receipts
 * and the locked payroll as vouchers an accountant imports into Tally. EXPORT
 * ONLY: nothing is read back, and no money moves (decision 0003) — the
 * receipts were taken by the school and the salaries are paid by its bank.
 *
 * THE SHAPE, as Tally Solutions documents its XML import (TallyPrime
 * developer reference, "XML Integration", help.tallysolutions.com/xml-integration/
 * and /developer-reference/integration-capabilities/method-specific-integration/xml/,
 * read 5 October 2026): an ENVELOPE with HEADER/TALLYREQUEST "Import Data" and
 * BODY/IMPORTDATA/REQUESTDESC/REPORTNAME "Vouchers", each voucher a
 * TALLYMESSAGE/VOUCHER (VCHTYPE, ACTION "Create") with DATE (YYYYMMDD),
 * VOUCHERTYPENAME, VOUCHERNUMBER, NARRATION and one ALLLEDGERENTRIES.LIST per
 * ledger line: a debit is ISDEEMEDPOSITIVE "Yes" with a negative AMOUNT, a
 * credit "No" with a positive one, so each voucher sums to zero. The CSV is
 * the same lines as a day book (one row per ledger line) for TallyPrime's
 * spreadsheet import with a mapping the accountant makes once; neither has
 * been imported into a real Tally here.
 *
 * The ledgers must exist in the company in Tally under these names (the page
 * lists them); a fee head's ledger is "Fees - " and the head's name.
 */
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");

export const TALLY_FORMATS = ["XML", "CSV"] as const;
export const tallyFormatSchema = z.enum(TALLY_FORMATS);
export type TallyFormat = z.infer<typeof tallyFormatSchema>;

/** The longest span of receipts one file carries: a year and a day. */
export const TALLY_MAX_DAYS = 366;

export const TALLY_LEDGERS = {
  cash: "Cash",
  bank: "Bank",
  feesPrefix: "Fees - ",
  feeRefunds: "Fee refunds",
  salaries: "Salaries and wages",
  employerContributions: "Employer contributions",
  salariesPayable: "Salaries payable",
  pfPayable: "PF payable",
  esiPayable: "ESI payable",
  ptPayable: "Professional tax payable",
  tdsPayable: "TDS payable",
  staffAdvances: "Staff advances",
  otherDeductions: "Other salary deductions",
} as const;

export const tallyReceiptsQuerySchema = z.object({ from: dateKey, to: dateKey, format: tallyFormatSchema.default("XML") });
export type TallyReceiptsQuery = z.infer<typeof tallyReceiptsQuerySchema>;
export const tallyPayrollQuerySchema = z.object({ month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month"), format: tallyFormatSchema.default("XML") });
export type TallyPayrollQuery = z.infer<typeof tallyPayrollQuerySchema>;

/** One ledger line of a voucher, in paise: positive is a debit, negative a credit. */
export type TallyLine = { ledger: string; paise: number };
export type TallyVoucher = { type: "Receipt" | "Payment" | "Journal"; number: string; dateKey: string; narration: string; lines: TallyLine[] };
