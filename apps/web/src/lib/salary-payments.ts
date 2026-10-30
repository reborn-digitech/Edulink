import "server-only";
import {
  CHEQUE_NUMBER_PATTERN,
  UTR_PATTERN,
  type PaymentMode,
  type PayrollRunStatus,
  type SalaryPaymentAnswer,
  type SalaryPaymentRecord,
  type UtrSheetAnswer,
  type UtrSheetRefusal,
} from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { db } from "./db";
import { audit } from "./audit";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import { open } from "./secret-box";
import { dateKeyInZone } from "./dates";
import { encodeQr, qrSvgPath } from "./qr";
import { isFrozen, lockRunRow, office, runRow, salariesFor, slipViewOf, upiBound, zoneOf, type Office } from "./payroll";
import { parseUtrSheet, slipRefsOf, upiPayLink, type UtrSheetLine } from "./salary-payment-rules";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * HOW EACH SALARY SLIP WAS PAID (owner-batch-item2b, the owner's decision of 27 October 2026).
 *
 * THE PLATFORM PAYS NOBODY (decisions 0003 and 0004). A LOCKED run's slips are paid by the school itself — a
 * bank transfer from the advice it uploads to its own bank, a payment from its own UPI app, a cheque, cash — and
 * this file is where the office RECORDS it afterwards: the mode, the day, the UTR or the cheque's number. Nothing
 * here calls a gateway, and tests/fees-invariants.test.ts fails if this file or payroll.ts ever imports one.
 *
 * ONE LIVE PAYMENT PER SLIP, FOR ITS WHOLE NET. A partial is refused; a mistake is VOIDED with a reason (the slip
 * is unpaid again) and recorded afresh. Every write takes the run's row lock (payroll.ts lockRunRow) inside one
 * $tenantTransaction, and the table itself holds the rule: `liveSlipId` is unique while a payment stands, so two
 * presses of "Record" on one slip end as one payment — the second sees the first and answers it unchanged when it
 * says the same thing, 409 when it says something else. One UTR pays one slip (`liveUtr`, unique per school).
 *
 * PAID. When the last slip with money due is recorded the run moves LOCKED → PAID by a conditional update in the
 * same transaction; a void moves it PAID → LOCKED. data:audit "payroll-paid" recomputes it from the payments.
 *
 * THE UTR SHEET. The office sends back what the bank or the UPI app says was paid — slip ref, UTR, date, and an
 * amount if it likes — and each line is checked; if ANY line is refused NOTHING is recorded (the owner's call to
 * make, see the report: a sheet half taken is a sheet nobody can reason about) and the answer says which lines and
 * why. A line already recorded with the same UTR is ALREADY, so the corrected sheet can be sent again whole.
 *
 * THE UPI ID is sealed (payroll.ts saveSalary) and opened in two places only: the UPI advice file, and the
 * pay-from-your-app link this file builds when the office asks for it on one slip — audited as shown, never
 * stored, never in an answer of the API, a payment row or the log.
 */

type Tx = typeof db;

/** The window a payment's day must fall in: from the run's month's first day to the school's today. */
function dayWindow(month: string, today: string): { from: string; to: string } {
  return { from: `${month}-01`, to: today };
}

type SlipFacts = { id: string; membershipId: string; staffName: string; netPaise: number; paymentMode: string };
type Live = { id: string; payslipId: string; mode: string; amountPaise: number; paidOnKey: string; reference: string | null };
type Want = { mode: PaymentMode; amountPaise: number; paidOnKey: string; reference: string | null; note: string };

/** The reference a payment of this mode keeps: the UTR upper-cased, the cheque's number, nothing for cash. */
function referenceFor(mode: PaymentMode, raw: string): string | null {
  return mode === "CASH" ? null : raw.trim().toUpperCase() || null;
}

/** What is wrong with recording `want` on `slip`, as a refusal key with its field, or null. Shared by the form and the sheet. */
function problemWith(slip: SlipFacts, want: Want, window: { from: string; to: string }): { key: TranslationKey; field?: string; reason: UtrSheetRefusal } | null {
  if (slip.netPaise <= 0) return { key: "salaryPay.refuseNothingDue", reason: "NOTHING_DUE" };
  // Less or more than the net alike (QB-11: an overpayment was called a part payment).
  if (want.amountPaise !== slip.netPaise) return { key: "teachPay.refuseAmount", field: "amountPaise", reason: "AMOUNT" };
  if (want.paidOnKey < window.from || want.paidOnKey > window.to) return { key: "salaryPay.refusePaidOn", field: "paidOn", reason: "DATE" };
  if ((want.mode === "BANK" || want.mode === "UPI") && !(want.reference && UTR_PATTERN.test(want.reference))) return { key: "salaryPay.refuseUtr", field: "reference", reason: "REFERENCE" };
  if (want.mode === "CHEQUE" && !(want.reference && CHEQUE_NUMBER_PATTERN.test(want.reference))) return { key: "salaryPay.refuseCheque", field: "reference", reason: "REFERENCE" };
  return null;
}

const sameAs = (live: Live, want: Want) => live.mode === want.mode && live.amountPaise === want.amountPaise && live.paidOnKey === want.paidOnKey && (live.reference ?? null) === want.reference;
const isUtrMode = (mode: string) => mode === "BANK" || mode === "UPI";
const isUnique = (e: unknown) => typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";

/** LOCKED ↔ PAID by the payments, under the run's lock: PAID while every slip with money due has a live payment. */
async function settleStatus(tx: Tx, runId: string): Promise<PayrollRunStatus> {
  const [due, paid] = await Promise.all([tx.payslip.count({ where: { runId, netPaise: { gt: 0 } } }), tx.salaryPayment.count({ where: { runId, voidedAt: null, slip: { netPaise: { gt: 0 } } } })]);
  if (due > 0 && paid >= due) await tx.payrollRun.updateMany({ where: { id: runId, status: "LOCKED" }, data: { status: "PAID", paidAt: new Date() } });
  else await tx.payrollRun.updateMany({ where: { id: runId, status: "PAID" }, data: { status: "LOCKED", paidAt: null } });
  return (await tx.payrollRun.findUniqueOrThrow({ where: { id: runId }, select: { status: true } })).status as PayrollRunStatus;
}

async function frozenRun(tx: Tx, schoolId: string, month: string): Promise<{ id: string; status: string }> {
  const run = await lockRunRow(tx, schoolId, month);
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (!isFrozen(run.status)) throw new RuleRefusal("salaryPay.refuseNotLocked", 409, { month });
  return run;
}

async function create(tx: Tx, caller: Office, runId: string, slip: SlipFacts, want: Want): Promise<void> {
  await tx.salaryPayment.create({
    data: {
      schoolId: caller.schoolId,
      runId,
      payslipId: slip.id,
      liveSlipId: slip.id,
      mode: want.mode,
      amountPaise: want.amountPaise,
      paidOnKey: want.paidOnKey,
      reference: want.reference,
      liveUtr: isUtrMode(want.mode) ? want.reference : null,
      note: want.note,
      recordedByMembershipId: caller.membershipId,
    },
  });
}

const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
function assertMonth(month: string): void {
  if (!MONTH.test(month)) throw new RuleRefusal("payroll.refuseMonth", 422, undefined, "month");
}

/**
 * The office records how it paid one slip of a LOCKED (or PAID) run. The same press twice answers the first
 * payment; a different payment on a paid slip is refused until the first is voided.
 */
export async function recordSalaryPayment(ctx: ActiveContext, month: string, membershipId: string, input: SalaryPaymentRecord, via: "form" | "upi-app" = "form"): Promise<SalaryPaymentAnswer> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const today = dateKeyInZone(new Date(), await zoneOf(caller.schoolId));
  const want: Want = { mode: input.mode, amountPaise: input.amountPaise, paidOnKey: input.paidOn, reference: referenceFor(input.mode, input.reference), note: input.note };
  let outcome: { recorded: boolean; status: PayrollRunStatus };
  try {
    outcome = await db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      const run = await frozenRun(tx, caller.schoolId, month);
      const slip = await tx.payslip.findUnique({ where: { runId_membershipId: { runId: run.id, membershipId } }, select: { id: true, membershipId: true, staffName: true, netPaise: true, paymentMode: true } });
      if (!slip) throw new AccessError("access.entryNotFound", "NOT_FOUND");
      const live = await tx.salaryPayment.findFirst({ where: { payslipId: slip.id, voidedAt: null }, select: { id: true, payslipId: true, mode: true, amountPaise: true, paidOnKey: true, reference: true } });
      if (live) {
        if (sameAs(live, want)) return { recorded: false, status: run.status as PayrollRunStatus };
        throw new RuleRefusal("salaryPay.refuseAlreadyPaid", 409, { date: live.paidOnKey });
      }
      const wrong = problemWith(slip, want, dayWindow(month, today));
      if (wrong) throw new RuleRefusal(wrong.key, wrong.reason === "NOTHING_DUE" ? 409 : 422, wrong.reason === "AMOUNT" ? { amount: formatPaise(slip.netPaise, "en", { always: true }) } : undefined, wrong.field);
      if (isUtrMode(want.mode)) {
        const taken = await tx.salaryPayment.findFirst({ where: { schoolId: caller.schoolId, liveUtr: want.reference }, select: { id: true } });
        if (taken) throw new RuleRefusal("salaryPay.refuseUtrTaken", 409, undefined, "reference");
      }
      await create(tx, caller, run.id, slip, want);
      return { recorded: true, status: await settleStatus(tx, run.id) };
    });
  } catch (e) {
    // The table's own rule caught what the lock did not (a UTR recorded at that instant on another run).
    if (isUnique(e)) throw new RuleRefusal("salaryPay.refuseUtrTaken", 409, undefined, "reference");
    throw e;
  }
  if (outcome.recorded) {
    await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.paymentRecorded", targetType: "Membership", targetId: membershipId, meta: { month, mode: want.mode, amountPaise: want.amountPaise, paidOn: want.paidOnKey, via, runStatus: outcome.status } });
  }
  return { slip: await slipViewOf(caller.schoolId, month, membershipId), status: outcome.status };
}

/** A recorded payment set aside, with why (kept on the row, not in the audit log): the slip is unpaid again and a PAID run is LOCKED. */
export async function voidSalaryPayment(ctx: ActiveContext, month: string, membershipId: string, reason: string): Promise<SalaryPaymentAnswer> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const done = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const run = await frozenRun(tx, caller.schoolId, month);
    const slip = await tx.payslip.findUnique({ where: { runId_membershipId: { runId: run.id, membershipId } }, select: { id: true } });
    if (!slip) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const live = await tx.salaryPayment.findFirst({ where: { payslipId: slip.id, voidedAt: null }, select: { id: true, mode: true, amountPaise: true } });
    if (!live) throw new RuleRefusal("salaryPay.refuseNotPaid", 409);
    const n = await tx.salaryPayment.updateMany({ where: { id: live.id, voidedAt: null }, data: { voidedAt: new Date(), voidedByMembershipId: caller.membershipId, voidReason: reason, liveSlipId: null, liveUtr: null } });
    if (n.count === 0) throw new RuleRefusal("salaryPay.refuseNotPaid", 409);
    return { live, status: await settleStatus(tx, run.id) };
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.paymentVoided", targetType: "Membership", targetId: membershipId, meta: { month, mode: done.live.mode, amountPaise: done.live.amountPaise, runStatus: done.status } });
  return { slip: await slipViewOf(caller.schoolId, month, membershipId), status: done.status };
}

/** One line to record by its slip's reference: the sheet's, or the run page's "record every bank slip" form. */
export type PaymentLine = { line: number; slipRef: string; reference: string; dateKey: string | null; amountPaise: number | null; amountBad?: boolean };

/**
 * Lines recorded together, each paid by its slip's own mode (BANK or UPI: a cash or cheque slip is recorded on
 * its own form). All of them or none: one refused line and nothing is written, the answer naming each line's
 * outcome.
 */
export async function recordPaymentLines(ctx: ActiveContext, month: string, lines: PaymentLine[], via: "sheet" | "bank-batch"): Promise<UtrSheetAnswer> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const today = dateKeyInZone(new Date(), await zoneOf(caller.schoolId));
  const window = dayWindow(month, today);
  type Judged = UtrSheetAnswer["lines"][number] & { slip?: SlipFacts; want?: Want };
  let result: { judged: Judged[]; status: PayrollRunStatus; written: boolean };
  try {
    result = await db.$tenantTransaction(
      async (raw) => {
        const tx = raw as Tx;
        const run = await frozenRun(tx, caller.schoolId, month);
        const slips = await tx.payslip.findMany({ where: { runId: run.id }, select: { id: true, membershipId: true, staffName: true, netPaise: true, paymentMode: true } });
        const refs = slipRefsOf(month, slips);
        const byRef = new Map(slips.map((s) => [refs.get(s.membershipId)!, s]));
        const live = new Map((await tx.salaryPayment.findMany({ where: { runId: run.id, voidedAt: null }, select: { id: true, payslipId: true, mode: true, amountPaise: true, paidOnKey: true, reference: true } })).map((p) => [p.payslipId, p]));
        const utrs = [...new Set(lines.map((l) => l.reference.trim().toUpperCase()).filter(Boolean))];
        const takenElsewhere = new Map((await tx.salaryPayment.findMany({ where: { schoolId: caller.schoolId, liveUtr: { in: utrs } }, select: { liveUtr: true, payslipId: true } })).map((p) => [p.liveUtr!, p.payslipId]));
        const seenRefs = new Set<string>();
        const seenUtrs = new Set<string>();
        const judged: Judged[] = lines.map((l) => {
          const out = (outcome: Judged["outcome"], reason: UtrSheetRefusal | null, extra: Partial<Judged> = {}): Judged => ({ line: l.line, slipRef: l.slipRef, outcome, reason, ...extra });
          const slip = byRef.get(l.slipRef);
          if (!slip) return out("REFUSED", "UNKNOWN_REF");
          if (seenRefs.has(l.slipRef)) return out("REFUSED", "DUPLICATE_LINE");
          seenRefs.add(l.slipRef);
          if (!isUtrMode(slip.paymentMode)) return out("REFUSED", slip.netPaise <= 0 ? "NOTHING_DUE" : "MODE");
          if (l.amountBad || (l.amountPaise !== null && l.amountPaise !== slip.netPaise)) return out("REFUSED", slip.netPaise <= 0 ? "NOTHING_DUE" : "AMOUNT");
          const want: Want = { mode: slip.paymentMode as PaymentMode, amountPaise: slip.netPaise, paidOnKey: l.dateKey ?? "", reference: referenceFor(slip.paymentMode as PaymentMode, l.reference), note: "" };
          const had = live.get(slip.id);
          if (had) return sameAs(had, want) ? out("ALREADY", null) : out("REFUSED", "PAID_OTHERWISE");
          if (!l.dateKey) return out("REFUSED", "DATE");
          const wrong = problemWith(slip, want, window);
          if (wrong) return out("REFUSED", wrong.reason);
          const other = takenElsewhere.get(want.reference!);
          if ((other && other !== slip.id) || seenUtrs.has(want.reference!)) return out("REFUSED", "UTR_TAKEN");
          seenUtrs.add(want.reference!);
          return out("RECORDED", null, { slip, want });
        });
        if (judged.some((j) => j.outcome === "REFUSED")) return { judged, status: run.status as PayrollRunStatus, written: false };
        for (const j of judged) if (j.outcome === "RECORDED") await create(tx, caller, run.id, j.slip!, j.want!);
        return { judged, status: await settleStatus(tx, run.id), written: true };
      },
      { timeout: 30_000 },
    );
  } catch (e) {
    if (isUnique(e)) throw new RuleRefusal("salaryPay.refuseUtrTaken", 409);
    throw e;
  }
  if (result.written) {
    for (const j of result.judged) {
      if (j.outcome !== "RECORDED") continue;
      await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.paymentRecorded", targetType: "Membership", targetId: j.slip!.membershipId, meta: { month, mode: j.want!.mode, amountPaise: j.want!.amountPaise, paidOn: j.want!.paidOnKey, via, runStatus: result.status } });
    }
  }
  // A line judged good on a sheet refused whole was not recorded, and is not called so (QB-08).
  const lineView = result.judged.map((j) => ({ line: j.line, slipRef: j.slipRef, outcome: j.outcome === "RECORDED" && !result.written ? ("WOULD_RECORD" as const) : j.outcome, reason: j.reason }));
  return {
    accepted: result.written,
    recorded: result.written ? lineView.filter((j) => j.outcome === "RECORDED").length : 0,
    already: lineView.filter((j) => j.outcome === "ALREADY").length,
    refused: lineView.filter((j) => j.outcome === "REFUSED").length,
    lines: lineView,
    status: result.status,
  };
}

/** The UTR sheet as the office uploads it (CSV: Slip Ref, UTR, Date, and an optional Amount). */
export async function importUtrSheet(ctx: ActiveContext, month: string, csv: string): Promise<UtrSheetAnswer> {
  const lines: UtrSheetLine[] | null = parseUtrSheet(csv);
  if (!lines) throw new RuleRefusal("salaryPay.refuseSheetHeader", 422, undefined, "csv");
  if (!lines.length) throw new RuleRefusal("salaryPay.refuseNothing", 422, undefined, "csv");
  if (lines.length > 2_000) throw new RuleRefusal("salaryPay.refuseSheetLong", 422, { max: 2000 }, "csv");
  return recordPaymentLines(ctx, month, lines.map((l) => ({ line: l.line, slipRef: l.slipRef, reference: l.utr, dateKey: l.dateKey, amountPaise: l.amountPaise, amountBad: l.amountBad })), "sheet");
}

export type UpiIntent = { link: string; qr: { d: string; viewBox: string } | null; amountPaise: number; payeeName: string; slipRef: string; month: string };

/**
 * THE PAY-FROM-YOUR-APP LINK for one unpaid UPI slip: `upi://pay?pa=…&pn=…&am=…&tn=Salary <month>&cu=INR` and its
 * QR, for the admin to open in the SCHOOL'S own UPI app on their phone; that app pays from the school's account,
 * and the admin types its UTR back on the same page. Built from the sealed id on each showing, never stored;
 * the audit row says it was shown, never the id. Refused for a slip that is paid, not UPI, or has no id.
 */
export async function upiIntentFor(ctx: ActiveContext, month: string, membershipId: string): Promise<UpiIntent> {
  const caller = await office(ctx, true);
  assertMonth(month);
  const run = await runRow(caller.schoolId, month);
  if (!run) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (!isFrozen(run.status)) throw new RuleRefusal("salaryPay.refuseNotLocked", 409, { month });
  const slips = await db.payslip.findMany({ where: { runId: run.id }, select: { id: true, membershipId: true, staffName: true, netPaise: true, paymentMode: true } });
  const slip = slips.find((s) => s.membershipId === membershipId);
  if (!slip) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (slip.paymentMode !== "UPI") throw new RuleRefusal("salaryPay.refuseNotUpi", 409);
  if (slip.netPaise <= 0) throw new RuleRefusal("salaryPay.refuseNothingDue", 409);
  if (await db.salaryPayment.count({ where: { payslipId: slip.id, voidedAt: null } })) throw new RuleRefusal("salaryPay.refuseAlreadyPaidPlain", 409);
  const salary = (await salariesFor(caller.schoolId, [membershipId], month)).get(membershipId);
  if (!salary?.upiSealed) throw new RuleRefusal("salaryPay.refuseNoUpi", 409);
  const link = upiPayLink({ vpa: open(salary.upiSealed, upiBound(caller.schoolId, membershipId)), payeeName: slip.staffName, amountPaise: slip.netPaise, month });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "payroll.upiIntentShown", targetType: "Membership", targetId: membershipId, meta: { month, amountPaise: slip.netPaise } });
  // A link longer than the encoder's largest symbol (a long name in Devanagari, percent-encoded) is shown as a link alone.
  let qr: UpiIntent["qr"] = null;
  try {
    qr = qrSvgPath(encodeQr(link));
  } catch {
    qr = null;
  }
  return { link, qr, amountPaise: slip.netPaise, payeeName: slip.staffName, slipRef: slipRefsOf(month, slips).get(membershipId) ?? "", month };
}
