import "server-only";
import { createHash } from "node:crypto";
import { PAYROLL_FROZEN_STATUSES, TALLY_LEDGERS, TALLY_MAX_DAYS, type PayslipLine, type TallyFormat, type TallyLine, type TallyVoucher } from "@edulink/contracts";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { assertModuleOn, isModuleOn } from "./modules";
import { readJson, readJsonArray } from "./json";
import { toCsv } from "./csv";
import { addDaysToKey, dateKeyInZone, zonedStartOfDay } from "./dates";
import type { ActiveContext } from "./session";

/**
 * THE TALLY EXPORT (the risks batch, R-2, 5 October 2026): the fee receipts
 * and refunds of a span, and a locked month's payroll, as vouchers in Tally's
 * XML import shape (packages/contracts v1/tally.ts cites it) or as the same
 * ledger lines in a CSV day book. EXPORT ONLY, and money never touches the
 * platform (decision 0003): this reads what the school recorded and writes a
 * file; nothing is posted anywhere and nothing comes back.
 *
 * THE VOUCHERS.
 *   - A receipt is a Receipt voucher numbered as printed: Cash (cash at the
 *     counter) or Bank (UPI, online, cheque, bank) debited with the amount,
 *     each fee head's ledger ("Fees - Tuition") credited with its share as the
 *     receipt's frozen snapshot states it. A receipt of a REVERSED payment is
 *     left out and counted.
 *   - A refund paid back (DONE) is a Payment voucher: "Fee refunds" debited,
 *     the instrument's ledger credited.
 *   - A locked payroll month is one Journal voucher: "Salaries and wages"
 *     debited with the gross, "Employer contributions" with the employer's
 *     share; each deduction's liability (PF, ESI, professional tax, TDS, the
 *     advance recovered, other) and the employer's PF and ESI credited, and
 *     "Salaries payable" credited with the net. Every voucher sums to zero or
 *     the export is refused.
 *   - A PAID month (owner-batch-item2b, 27 October 2026) adds a Payment voucher
 *     per payment mode and day the school recorded: "Salaries payable"
 *     debited, "Cash" (cash) or "Bank" (a bank transfer, a cheque, or UPI from
 *     the school's own account) credited, the narration naming the mode and
 *     how many slips. Only once PAID, so the file never shows half a month
 *     settled; a LOCKED month stays the journal alone.
 *
 * WHO: the office (ADMIN) and the college's ACCOUNTS desk; payroll needs the
 * PAYROLL module on. Every file cut is audited with its count, total and the
 * first characters of its SHA-256 — never a name or an amount per person.
 */

export type TallyFile = { filename: string; mime: string; content: string; vouchers: number; skipped: number; totalPaise: number };

function desk(ctx: ActiveContext): { schoolId: string; userId: string } {
  if (!ctx.schoolId || !ctx.role || !["ADMIN", "ACCOUNTS"].includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  return { schoolId: ctx.schoolId, userId: ctx.user.id };
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const rupees = (paise: number) => (paise / 100).toFixed(2);
const ledgerOfMethod = (method: string) => (method === "CASH" ? TALLY_LEDGERS.cash : TALLY_LEDGERS.bank);

/** Tally's XML, one TALLYMESSAGE per voucher; a debit is ISDEEMEDPOSITIVE Yes with a negative AMOUNT. */
export function tallyXml(vouchers: TallyVoucher[]): string {
  const body = vouchers
    .map((v) => {
      const lines = v.lines
        .map((l) => `<ALLLEDGERENTRIES.LIST><LEDGERNAME>${xml(l.ledger)}</LEDGERNAME><ISDEEMEDPOSITIVE>${l.paise > 0 ? "Yes" : "No"}</ISDEEMEDPOSITIVE><AMOUNT>${rupees(-l.paise)}</AMOUNT></ALLLEDGERENTRIES.LIST>`)
        .join("");
      return `<TALLYMESSAGE xmlns:UDF="TallyUDF"><VOUCHER VCHTYPE="${v.type}" ACTION="Create"><DATE>${v.dateKey.replace(/-/g, "")}</DATE><VOUCHERTYPENAME>${v.type}</VOUCHERTYPENAME><VOUCHERNUMBER>${xml(v.number)}</VOUCHERNUMBER><NARRATION>${xml(v.narration)}</NARRATION>${lines}</VOUCHER></TALLYMESSAGE>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<ENVELOPE><HEADER><TALLYREQUEST>Import Data</TALLYREQUEST></HEADER><BODY><IMPORTDATA><REQUESTDESC><REPORTNAME>Vouchers</REPORTNAME></REQUESTDESC><REQUESTDATA>\n${body}\n</REQUESTDATA></IMPORTDATA></BODY></ENVELOPE>\n`;
}

/** The same lines as a day book: a row per ledger line, debit and credit in rupees. */
export function tallyCsv(vouchers: TallyVoucher[]): string {
  const rows = vouchers.flatMap((v) => v.lines.map((l) => ({ date: v.dateKey.split("-").reverse().join("-"), voucher_type: v.type, voucher_number: v.number, ledger: l.ledger, debit: l.paise > 0 ? rupees(l.paise) : "", credit: l.paise < 0 ? rupees(-l.paise) : "", narration: v.narration })));
  return toCsv(rows, ["date", "voucher_type", "voucher_number", "ledger", "debit", "credit", "narration"]);
}

/** Lines with the same ledger added together, the debits first; zero lines dropped. */
function merge(lines: TallyLine[]): TallyLine[] {
  const by = new Map<string, number>();
  for (const l of lines) by.set(l.ledger, (by.get(l.ledger) ?? 0) + l.paise);
  return [...by.entries()].filter(([, p]) => p !== 0).map(([ledger, paise]) => ({ ledger, paise })).sort((a, b) => b.paise - a.paise);
}

function assertBalanced(vouchers: TallyVoucher[]): void {
  for (const v of vouchers) if (v.lines.reduce((a, l) => a + l.paise, 0) !== 0) throw new RuleRefusal("tally.refuseUnbalanced", 409, { number: v.number });
}

async function finish(caller: { schoolId: string; userId: string }, kind: "RECEIPTS" | "PAYROLL", label: string, vouchers: TallyVoucher[], skipped: number, format: TallyFormat, meta: Record<string, unknown>): Promise<TallyFile> {
  assertBalanced(vouchers);
  const school = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { code: true } });
  const content = format === "XML" ? tallyXml(vouchers) : tallyCsv(vouchers);
  const totalPaise = vouchers.reduce((a, v) => a + v.lines.filter((l) => l.paise > 0).reduce((b, l) => b + l.paise, 0), 0);
  const sha256 = createHash("sha256").update(content).digest("hex");
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "tally.export", targetType: "School", targetId: caller.schoolId, meta: { kind, format, ...meta, vouchers: vouchers.length, skipped, totalPaise, sha256: sha256.slice(0, 12) } });
  return { filename: `${school.code}-tally-${kind.toLowerCase()}-${label}.${format === "XML" ? "xml" : "csv"}`, mime: format === "XML" ? "application/xml" : "text/csv", content, vouchers: vouchers.length, skipped, totalPaise };
}

type ReceiptSnapshotLines = { lines?: { head: string; amountPaise: number }[]; pupil?: { name?: string } };

/** The receipts issued and refunds paid back from `from` to `to` (the school's days), as vouchers. */
export async function tallyReceipts(ctx: ActiveContext, from: string, to: string, format: TallyFormat): Promise<TallyFile> {
  const caller = desk(ctx);
  if (to < from) throw new RuleRefusal("tally.refuseRange", 422, undefined, "to");
  if (addDaysToKey(from, TALLY_MAX_DAYS) <= to) throw new RuleRefusal("tally.refuseRangeTooLong", 422, { days: TALLY_MAX_DAYS }, "to");
  const zone = (await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } })).timezone;
  const start = zonedStartOfDay(from, zone);
  const end = zonedStartOfDay(addDaysToKey(to, 1), zone);
  const [receipts, refunds] = await Promise.all([
    db.feeReceipt.findMany({ where: { schoolId: caller.schoolId, issuedAt: { gte: start, lt: end } }, orderBy: [{ issuedAt: "asc" }, { number: "asc" }], select: { serial: true, issuedAt: true, snapshotJson: true, payment: { select: { amountPaise: true, method: true, status: true, paidAt: true, reference: true } } } }),
    db.feeRefund.findMany({ where: { schoolId: caller.schoolId, status: "DONE", settledAt: { gte: start, lt: end } }, orderBy: { settledAt: "asc" }, select: { id: true, amountPaise: true, settledAt: true, reason: true, payment: { select: { method: true, receipt: { select: { serial: true } } } } } }),
  ]);
  const vouchers: TallyVoucher[] = [];
  let skipped = 0;
  for (const r of receipts) {
    if (r.payment.status === "REVERSED") {
      skipped += 1;
      continue;
    }
    const snap = readJson<ReceiptSnapshotLines>(r.snapshotJson, {});
    const amount = r.payment.amountPaise;
    const heads: TallyLine[] = (snap.lines ?? []).map((l) => ({ ledger: `${TALLY_LEDGERS.feesPrefix}${l.head}`, paise: -l.amountPaise }));
    // A snapshot that does not add up to the amount (an old receipt, a rounding): the rest is "Fees - General".
    const covered = -heads.reduce((a, l) => a + l.paise, 0);
    if (covered !== amount) heads.push({ ledger: `${TALLY_LEDGERS.feesPrefix}General`, paise: -(amount - covered) });
    vouchers.push({ type: "Receipt", number: r.serial, dateKey: dateKeyInZone(r.payment.paidAt ?? r.issuedAt, zone), narration: [`Fee receipt ${r.serial}`, snap.pupil?.name, r.payment.reference].filter(Boolean).join(" · "), lines: merge([{ ledger: ledgerOfMethod(r.payment.method), paise: amount }, ...heads]) });
  }
  for (const f of refunds) {
    vouchers.push({ type: "Payment", number: `REFUND-${f.payment.receipt?.serial ?? f.id}`, dateKey: dateKeyInZone(f.settledAt!, zone), narration: `Fee refund${f.payment.receipt ? ` on ${f.payment.receipt.serial}` : ""}: ${f.reason}`, lines: merge([{ ledger: TALLY_LEDGERS.feeRefunds, paise: f.amountPaise }, { ledger: ledgerOfMethod(f.payment.method), paise: -f.amountPaise }]) });
  }
  return finish(caller, "RECEIPTS", `${from}-to-${to}`, vouchers, skipped, format, { from, to, refunds: refunds.length });
}

const DEDUCTION_LEDGER: Record<string, string> = {
  PF_EMPLOYEE: TALLY_LEDGERS.pfPayable,
  ESI_EMPLOYEE: TALLY_LEDGERS.esiPayable,
  PT: TALLY_LEDGERS.ptPayable,
  TDS: TALLY_LEDGERS.tdsPayable,
  ADVANCE: TALLY_LEDGERS.staffAdvances,
  OTHER_DEDUCTION: TALLY_LEDGERS.otherDeductions,
  PF_EMPLOYER: TALLY_LEDGERS.pfPayable,
  ESI_EMPLOYER: TALLY_LEDGERS.esiPayable,
};

/** How a salary payment voucher's narration names its mode. */
const PAID_BY: Record<string, string> = { BANK: "bank transfer", UPI: "UPI", CHEQUE: "cheque", CASH: "cash" };

/** A locked payroll month as one Journal voucher, and once PAID the payments as Payment vouchers. Refused for a run not locked (its figures may still move). */
export async function tallyPayroll(ctx: ActiveContext, month: string, format: TallyFormat): Promise<TallyFile> {
  const caller = desk(ctx);
  await assertModuleOn(caller.schoolId, "PAYROLL");
  const run = await db.payrollRun.findUnique({ where: { schoolId_month: { schoolId: caller.schoolId, month } }, select: { id: true, status: true, lockedAt: true, slips: { select: { linesJson: true, grossPaise: true, employerPaise: true, netPaise: true } } } });
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (!(PAYROLL_FROZEN_STATUSES as readonly string[]).includes(run.status)) throw new RuleRefusal("tally.refuseNotLocked", 409, { month });
  const lines: TallyLine[] = [];
  for (const s of run.slips) {
    lines.push({ ledger: TALLY_LEDGERS.salaries, paise: s.grossPaise });
    if (s.employerPaise) lines.push({ ledger: TALLY_LEDGERS.employerContributions, paise: s.employerPaise });
    for (const l of readJsonArray<PayslipLine>(s.linesJson)) {
      if (l.kind === "EARNING" || !l.paise) continue;
      lines.push({ ledger: DEDUCTION_LEDGER[l.code] ?? TALLY_LEDGERS.otherDeductions, paise: -l.paise });
    }
    lines.push({ ledger: TALLY_LEDGERS.salariesPayable, paise: -s.netPaise });
  }
  // The last day of the month: when the salary is booked.
  const last = addDaysToKey(`${addDaysToKey(`${month}-28`, 4).slice(0, 7)}-01`, -1);
  const vouchers: TallyVoucher[] = run.slips.length ? [{ type: "Journal", number: `PAYROLL-${month}`, dateKey: last, narration: `Salaries for ${month}, ${run.slips.length} payslips (locked run)`, lines: merge(lines) }] : [];
  let payments = 0;
  if (run.status === "PAID") {
    // The school's own record of how it paid (salary-payments.ts): one Payment voucher per mode and day.
    const paid = await db.salaryPayment.findMany({ where: { schoolId: caller.schoolId, runId: run.id, voidedAt: null }, orderBy: [{ paidOnKey: "asc" }, { mode: "asc" }], select: { mode: true, paidOnKey: true, amountPaise: true } });
    const groups = new Map<string, { mode: string; day: string; paise: number; count: number }>();
    for (const p of paid) {
      const k = `${p.paidOnKey}|${p.mode}`;
      const g = groups.get(k) ?? { mode: p.mode, day: p.paidOnKey, paise: 0, count: 0 };
      g.paise += p.amountPaise;
      g.count += 1;
      groups.set(k, g);
    }
    for (const g of groups.values()) {
      vouchers.push({ type: "Payment", number: `SALPAY-${month}-${g.day.replace(/-/g, "")}-${g.mode}`, dateKey: g.day, narration: `Salaries for ${month} paid by ${PAID_BY[g.mode] ?? g.mode}, ${g.count} payslip${g.count === 1 ? "" : "s"}`, lines: merge([{ ledger: TALLY_LEDGERS.salariesPayable, paise: g.paise }, { ledger: ledgerOfMethod(g.mode), paise: -g.paise }]) });
    }
    payments = paid.length;
  }
  return finish(caller, "PAYROLL", month, vouchers, 0, format, { month, payslips: run.slips.length, payments });
}

/** What the export page offers: the locked payroll months (when PAYROLL is on) and the school's today. */
export async function tallyChoices(ctx: ActiveContext): Promise<{ payrollOn: boolean; lockedMonths: string[]; today: string }> {
  const caller = desk(ctx);
  const [on, school] = await Promise.all([isModuleOn(caller.schoolId, "PAYROLL"), db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } })]);
  const runs = on ? await db.payrollRun.findMany({ where: { schoolId: caller.schoolId, status: { in: [...PAYROLL_FROZEN_STATUSES] } }, orderBy: { month: "desc" }, take: 24, select: { month: true } }) : [];
  return { payrollOn: on, lockedMonths: runs.map((r) => r.month), today: dateKeyInZone(new Date(), school.timezone) };
}
