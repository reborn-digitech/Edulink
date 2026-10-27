import { isRealDateKey } from "@edulink/contracts";
import { parseCsvRecords } from "./csv";

/**
 * SALARY PAYMENTS, THE PURE PART (owner-batch-item2b, 27 October 2026): the
 * slip references the advices and the UTR sheet carry, the masked UPI id, the
 * pay-from-your-app link, and the UTR sheet read line by line. No database and
 * no network here; src/lib/salary-payments.ts does the writing, and payroll.ts
 * reads the references and the mask from this file so neither imports the other.
 *
 * NOTHING HERE MOVES MONEY (decision 0003). The link below is a standard UPI
 * intent that the school's OWN UPI app opens on the admin's phone with the
 * member of staff as payee: the school's app pays, from the school's account,
 * and the admin types the UTR back. No gateway, no account of the platform's,
 * and the link is never stored.
 */

/** A slip's reference on the advices and the UTR sheet: "SAL-202608-003". */
export function slipRef(month: string, position: number): string {
  return `SAL-${month.replace("-", "")}-${String(position).padStart(3, "0")}`;
}

/**
 * Each slip's reference, numbered by the run's order of names (then the
 * membership's id for two people of one name). Worked out on every read from
 * the frozen slips, so it never changes once the run is locked.
 */
export function slipRefsOf(month: string, slips: { membershipId: string; staffName: string }[]): Map<string, string> {
  const ordered = [...slips].sort((a, b) => (a.staffName < b.staffName ? -1 : a.staffName > b.staffName ? 1 : a.membershipId < b.membershipId ? -1 : a.membershipId > b.membershipId ? 1 : 0));
  return new Map(ordered.map((s, i) => [s.membershipId, slipRef(month, i + 1)]));
}

/** A UPI id as NPCI allows it: letters, digits, dot, hyphen and underscore, then the app's handle. */
export const VPA_PATTERN = /^[a-z0-9][a-z0-9._-]{1,63}@[a-z][a-z0-9]{1,31}$/;

/** "ravi.k@okaxis" → "ra•••@okaxis": enough to tell two people apart, not enough to pay one. */
export function maskVpa(vpa: string): string {
  const [local = "", handle = ""] = vpa.split("@");
  return `${local.slice(0, 2)}•••@${handle}`;
}

/**
 * THE PAY-FROM-YOUR-APP LINK, exactly: `upi://pay?pa=<VPA>&pn=<name>&am=<amount>&tn=<Salary month>&cu=INR`.
 * The UPI id goes in as it is (VPA_PATTERN admits nothing that needs escaping), the name and the note are
 * percent-encoded, the amount is rupees with two decimals. Built on the server from the sealed id each time it
 * is shown, never kept. COUNSEL TO GLANCE AT IT BEFORE IT SHIPS (the report says so).
 */
export function upiPayLink(input: { vpa: string; payeeName: string; amountPaise: number; month: string }): string {
  if (!VPA_PATTERN.test(input.vpa)) throw new Error("upiPayLink: not a UPI id");
  if (!Number.isInteger(input.amountPaise) || input.amountPaise <= 0) throw new Error("upiPayLink: no amount");
  const name = encodeURIComponent(input.payeeName.trim().slice(0, 50));
  const note = encodeURIComponent(`Salary ${input.month}`);
  return `upi://pay?pa=${input.vpa}&pn=${name}&am=${(input.amountPaise / 100).toFixed(2)}&tn=${note}&cu=INR`;
}

/** A sheet's date as the bank prints it: 2026-09-01, 01-09-2026 or 01/09/2026. Null when it is none of them or not a day. */
export function sheetDate(raw: string): string | null {
  const v = raw.trim();
  let key: string | null = null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) key = v;
  else {
    const m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(v);
    if (m) key = `${m[3]}-${m[2]!.padStart(2, "0")}-${m[1]!.padStart(2, "0")}`;
  }
  return key && isRealDateKey(key) ? key : null;
}

export type UtrSheetLine = { line: number; slipRef: string; utr: string; dateKey: string | null; amountPaise: number | null; amountBad: boolean };

/** The sheet's columns, as the UPI advice and the run page name them; matched without case or spaces. */
const COLUMN = { ref: ["slipref", "slip_ref", "ref", "reference"], utr: ["utr", "utrnumber", "utr_no", "utrno", "transactionid"], date: ["date", "paidon", "paid_on", "valuedate"], amount: ["amount", "amountinr", "amount(inr)"] };
const squash = (h: string) => h.trim().toLowerCase().replace(/\s+/g, "");

/**
 * The UTR sheet, line by line: a header naming the slip's reference, the UTR
 * and the date (the amount is optional and, when given, must be the slip's
 * net). Null when the header lacks one of the three: nothing in it can be read.
 */
export function parseUtrSheet(csv: string): UtrSheetLine[] | null {
  const { records, lineNumbers } = parseCsvRecords(csv);
  const header = records.shift()?.map(squash);
  lineNumbers.shift();
  if (!header) return null;
  const at = (names: string[]) => header.findIndex((h) => names.includes(h));
  const ref = at(COLUMN.ref);
  const utr = at(COLUMN.utr);
  const date = at(COLUMN.date);
  const amount = at(COLUMN.amount);
  if (ref < 0 || utr < 0 || date < 0) return null;
  return records.map((r, i) => {
    const rawAmount = amount >= 0 ? (r[amount] ?? "").replace(/[₹,\s]/g, "") : "";
    const amountOk = /^\d+(\.\d{1,2})?$/.test(rawAmount);
    return {
      line: lineNumbers[i] ?? i + 2,
      slipRef: (r[ref] ?? "").trim().toUpperCase(),
      utr: (r[utr] ?? "").trim().toUpperCase(),
      dateKey: sheetDate(r[date] ?? ""),
      amountPaise: rawAmount && amountOk ? Math.round(Number(rawAmount) * 100) : null,
      amountBad: Boolean(rawAmount) && !amountOk,
    };
  });
}
