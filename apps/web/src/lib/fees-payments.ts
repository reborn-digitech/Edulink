import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { audit } from "./audit";
import { notify, notifyGuardians } from "./notify";
import { AccessError, assertGuardianAccess } from "./tenancy";
import { parentMaySee } from "./student-consent";
import { forSchool } from "./tenant-context";
import { currentAcademicYear } from "./academic-year";
import { isDateKey, todayKey } from "./dates";
import { readJson, writeJson } from "./json";
import { parseCsv } from "./csv";
import { createOrder, fetchOrderPayments, refundPayment, verifyCheckoutSignature, upiIntentLink, looksLikeUtr, GatewayError } from "./gateway";
import { gatewayAccountFor, gatewayKeyTakesPayments, dateToDay, toDemandRow, requireFeesOffice, type DemandLine } from "./fees";
import { readFeesGatewayTransport } from "./env";
import { COUNTER_METHODS, FEE_CLAIM_STALE_DAYS, FEE_ORDER_EXPIRY_MS, FEE_ORDER_RECONCILE_AFTER_MS, type FeeMethod } from "./constants";
import type { ActiveContext } from "./session";

/**
 * Fees: what arrived.
 *
 * THE LEDGER IS APPEND-ONLY. A payment that reached PAID is never edited or
 * deleted: a mistake is a REVERSAL (status, who, why, when — the row stays)
 * and money going back is a REFUND row against it. A receipt is issued once,
 * numbered by the year's counter under a row lock, and its snapshot is the
 * document — a later rename of a head or a school does not change what was
 * printed.
 *
 * THE MONEY NEVER PASSES THROUGH HERE. ONLINE goes parent → school's gateway
 * account; UPI goes parent → school's UPI id; the counter methods are cash
 * or paper the office already holds. This file records, allocates and
 * numbers; it moves nothing. See docs/decisions/0003.
 *
 * ALLOCATION IS OLDEST-DUE-FIRST unless the caller named the demands, and a
 * payment may cover several demands or part of one. `paidPaise` on a demand
 * is always the sum of its PAID allocations, recomputed on every change.
 */

type Tx = typeof db;

/** A refund's transaction calls the gateway inside its lock: longer than the gateway's own fifteen-second limit (TA-128). */
export const REFUND_TX_MS = 30_000;
/**
 * How long a UPI intent waits for its UTR before the reconcile job closes it as not claimed (TA-449): long enough for
 * a month's statement, imported late, to still confirm it by its EL reference.
 */
export const FEE_UPI_INTENT_MS = 45 * 86_400_000;
/** How long a FAILED online order is still asked about at the gateway, in case its retry was captured and no webhook came (TA-257). */
export const FEE_FAILED_RECONCILE_MS = 3 * 86_400_000;
/** The prefix of the reason a capture of another amount than its order is held with (TA-524). */
const AMOUNT_MISMATCH = "amount-mismatch:";

/* -------------------------------------------------------------------------- */
/* Allocation and receipts (inside a transaction)                               */
/* -------------------------------------------------------------------------- */

async function openDemands(tx: Tx, schoolId: string, studentMembershipId: string, demandIds?: string[]) {
  // ⚠ LOCK FIRST, READ SECOND. Two payments for one pupil posted at the same
  // moment each read the demands, each allocated, and each wrote a paid
  // total that only counted itself — the second overwrote the first, and a
  // pupil who had paid twice showed paid once (found by the twenty-at-once
  // test). Locking the pupil's open demands serialises the two transactions
  // here, so the second reads the first's allocations before it decides.
  // ORDER BY id, so two transactions take the same rows in the same order:
  // without it Postgres locked them in scan order and twenty payments at
  // once deadlocked in pairs.
  await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "schoolId" = ${schoolId} AND "studentMembershipId" = ${studentMembershipId} AND "status" IN ('OPEN', 'PART') ORDER BY "id" FOR UPDATE`;
  const rows = await tx.feeDemand.findMany({
    where: { schoolId, studentMembershipId, status: { in: ["OPEN", "PART"] }, ...(demandIds?.length ? { id: { in: demandIds } } : {}) },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
  if (demandIds?.length && rows.length !== new Set(demandIds).size) throw new AccessError("fees.refuseDemandsChanged");
  return rows;
}

/** Spreads `amountPaise` across the demands in order; the remainder is refused, never kept as credit. */
async function allocate(tx: Tx, schoolId: string, payment: { id: string; studentMembershipId: string; amountPaise: number }, demandIds?: string[]): Promise<{ demandId: string; amountPaise: number }[]> {
  const demands = await openDemands(tx, schoolId, payment.studentMembershipId, demandIds);
  let left = payment.amountPaise;
  const out: { demandId: string; amountPaise: number }[] = [];
  for (const d of demands) {
    if (left <= 0) break;
    const room = d.netPaise - d.paidPaise;
    if (room <= 0) continue;
    const take = Math.min(room, left);
    out.push({ demandId: d.id, amountPaise: take });
    left -= take;
  }
  // Nothing open at all — the dues this money was for were settled another
  // way in the meantime (a UPI claim confirmed after the same term was paid
  // online, say) — is "nothing is due", not "too much": the office then
  // rejects the claim and refunds by hand, and the sentence should say so.
  if (out.length === 0) throw new AccessError("fees.refuseNothingDue");
  if (left > 0) throw new AccessError("fees.refuseOverpayment");
  await tx.feeAllocation.createMany({ data: out.map((a) => ({ schoolId, paymentId: payment.id, demandId: a.demandId, amountPaise: a.amountPaise })) });
  await recomputeDemands(
    tx,
    out.map((a) => a.demandId),
  );
  return out;
}

/** `paidPaise` and status from the PAID allocations — the one place either is written. */
async function recomputeDemands(tx: Tx, demandIds: string[]): Promise<void> {
  for (const id of demandIds) {
    const [demand, paid] = await Promise.all([
      tx.feeDemand.findUniqueOrThrow({ where: { id }, select: { netPaise: true, status: true } }),
      tx.feeAllocation.aggregate({ where: { demandId: id, payment: { status: { in: ["PAID", "REFUNDED"] } } }, _sum: { amountPaise: true } }),
    ]);
    if (demand.status === "WAIVED" || demand.status === "CANCELLED" || demand.status === "CARRIED") continue;
    const paidPaise = paid._sum.amountPaise ?? 0;
    const status = paidPaise >= demand.netPaise ? "PAID" : paidPaise > 0 ? "PART" : "OPEN";
    await tx.feeDemand.update({ where: { id }, data: { paidPaise, status } });
  }
}

type ReceiptSnapshot = {
  school: { name: string; addressLine: string | null; city: string | null; contactPhone: string | null; bankNote: string | null };
  pupil: { name: string; studentCode: string | null; admissionNumber?: string | null; className: string | null; gradeLevel: string | null };
  payment: { amountPaise: number; method: string; reference: string | null; gatewayMethod: string | null; paidAt: string; collectedBy: string | null; note: string | null };
  year: string;
  lines: { demandLabel: string; head: string; code: string; amountPaise: number }[];
  allocations: { demandLabel: string; amountPaise: number }[];
};

/**
 * Numbers the receipt. `SELECT … FOR UPDATE` on the year row serialises two
 * counters posting at once, so the serial the second one gets is the next
 * one, not the same one. Runs inside the payment's own transaction, so a
 * failed insert rolls the number back with it.
 */
async function issueReceipt(tx: Tx, schoolId: string, payment: { id: string; studentMembershipId: string; amountPaise: number; method: string; reference: string | null; gatewayMethod: string | null; paidAt: Date; note: string | null; collectedByUserId: string | null }, allocations: { demandId: string; amountPaise: number }[]): Promise<{ id: string; serial: string }> {
  const [school, pupil, demands] = await Promise.all([
    tx.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, addressLine: true, city: true, contactPhone: true, feeBankNote: true, feeReceiptPrefix: true } }),
    tx.membership.findUniqueOrThrow({ where: { id: payment.studentMembershipId }, select: { studentCode: true, gradeLevel: true, pupilRecord: { select: { admissionNumber: true } }, user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } }),
    tx.feeDemand.findMany({ where: { id: { in: allocations.map((a) => a.demandId) } }, select: { id: true, label: true, academicYearId: true, linesJson: true, netPaise: true }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
  ]);
  // The receipt is numbered in the year of the EARLIEST-DUE demand the money
  // settled. A payment can span two years — last year's balance carried in
  // beside this year's own term, or a straggling bus pass next to next
  // year's opening balance — and an unordered `in` query once let it land in
  // whichever series Postgres happened to return first. The earliest due is
  // the debt the family was clearing first, so its year keeps the number.
  const yearId = demands[0]?.academicYearId;
  if (!yearId) throw new AccessError("fees.refuseNothingDue");
  const year = await tx.academicYear.findUniqueOrThrow({ where: { id: yearId }, select: { name: true } });
  const locked = await tx.$queryRaw<{ feeReceiptNext: number }[]>`SELECT "feeReceiptNext" FROM "AcademicYear" WHERE "id" = ${yearId} FOR UPDATE`;
  const number = locked[0]?.feeReceiptNext ?? 1;
  await tx.academicYear.update({ where: { id: yearId }, data: { feeReceiptNext: number + 1 } });
  const serial = `${school.feeReceiptPrefix}/${year.name}/${String(number).padStart(6, "0")}`;
  const collectedBy = payment.collectedByUserId ? await tx.user.findUnique({ where: { id: payment.collectedByUserId }, select: { name: true } }) : null;

  // The head-by-head lines of what this payment settled, pro rata within a
  // partly paid demand so the receipt still adds up to the amount paid.
  const lines: ReceiptSnapshot["lines"] = [];
  for (const a of allocations) {
    const d = demands.find((x) => x.id === a.demandId)!;
    const heads = readJson<DemandLine[]>(d.linesJson, []);
    const net = heads.reduce((s, h) => s + h.grossPaise - h.concessionPaise, 0);
    let remaining = a.amountPaise;
    heads.forEach((h, i) => {
      const headNet = h.grossPaise - h.concessionPaise;
      const share = i === heads.length - 1 ? remaining : net > 0 ? Math.min(remaining, Math.round((a.amountPaise * headNet) / net)) : 0;
      remaining -= share;
      if (share > 0) lines.push({ demandLabel: d.label, head: h.name, code: h.code, amountPaise: share });
    });
  }
  const snapshot: ReceiptSnapshot = {
    school: { name: school.name, addressLine: school.addressLine, city: school.city, contactPhone: school.contactPhone, bankNote: school.feeBankNote },
    pupil: { name: pupil.user.preferredName ?? pupil.user.name, studentCode: pupil.studentCode, admissionNumber: pupil.pupilRecord?.admissionNumber ?? null, className: pupil.enrollments[0]?.class.name ?? null, gradeLevel: pupil.gradeLevel },
    payment: { amountPaise: payment.amountPaise, method: payment.method, reference: payment.reference, gatewayMethod: payment.gatewayMethod, paidAt: payment.paidAt.toISOString(), collectedBy: collectedBy?.name ?? null, note: payment.note },
    year: year.name,
    lines,
    allocations: allocations.map((a) => ({ demandLabel: demands.find((x) => x.id === a.demandId)!.label, amountPaise: a.amountPaise })),
  };
  const receipt = await tx.feeReceipt.create({ data: { schoolId, paymentId: payment.id, academicYearId: yearId, number, serial, snapshotJson: writeJson(snapshot) }, select: { id: true, serial: true } });
  return receipt;
}

/** Marks an INITIATED or CLAIMED payment PAID: allocates, numbers, and returns the receipt. Idempotent on an already-PAID row. */
async function settle(tx: Tx, schoolId: string, paymentId: string, extra: { reference?: string | null; gatewayPaymentId?: string | null; gatewayMethod?: string | null; confirmedByUserId?: string | null; paidAt?: Date }): Promise<{ receiptId: string; serial: string; already: boolean }> {
  // ⚠ LOCK THE PAYMENT FIRST, READ IT SECOND (QA-06). The checkout's confirm
  // and the gateway's webhook arrive within milliseconds of each other, and
  // each used to read the row before any lock: the loser read INITIATED,
  // waited on the winner's update, then allocated the same money again —
  // "Nothing is due to pay." thrown at the guardian who had just paid, or,
  // with another demand still open, that demand paid a second time from one
  // payment and a second receipt attempted. Under the row lock the loser
  // reads what the winner committed and is answered "already". The payment
  // row is taken before the demands (openDemands), the order every path here
  // keeps, so the two locks never deadlock.
  await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${paymentId} AND "schoolId" = ${schoolId} FOR UPDATE`;
  const p = await tx.feePayment.findFirstOrThrow({ where: { id: paymentId, schoolId }, include: { receipt: { select: { id: true, serial: true } } } });
  if ((p.status === "PAID" || p.status === "REFUNDED") && p.receipt) return { receiptId: p.receipt.id, serial: p.receipt.serial, already: true };
  // A FAILED online order is settled by a signed capture too: the gateway
  // sends payment.failed for a first attempt and payment.captured for the
  // retry on the SAME order, and the money is real whichever arrived first.
  const capturedAfterFailure = p.status === "FAILED" && p.method === "ONLINE" && Boolean(extra.gatewayPaymentId);
  if (p.status !== "INITIATED" && p.status !== "CLAIMED" && !capturedAfterFailure) throw new AccessError("fees.refuseNotSettleable");
  const paidAt = extra.paidAt ?? new Date();
  const intent = readJson<string[]>(p.intentJson, []);
  const updated = await tx.feePayment.update({
    where: { id: p.id },
    data: { status: "PAID", paidAt, failedReason: capturedAfterFailure ? null : p.failedReason, reference: extra.reference ?? p.reference, gatewayPaymentId: extra.gatewayPaymentId ?? p.gatewayPaymentId, gatewayMethod: extra.gatewayMethod ?? p.gatewayMethod, confirmedByUserId: extra.confirmedByUserId ?? p.confirmedByUserId },
  });
  // The demands named at checkout first; if any were paid meanwhile, the
  // rest of the money goes oldest-first so nothing is left as credit.
  let allocations: { demandId: string; amountPaise: number }[];
  try {
    allocations = await allocate(tx, schoolId, updated, intent);
  } catch (error) {
    if (error instanceof AccessError && (error.key === "fees.refuseDemandsChanged" || error.key === "fees.refuseOverpayment")) allocations = await allocate(tx, schoolId, updated);
    else throw error;
  }
  const receipt = await issueReceipt(tx, schoolId, { ...updated, paidAt }, allocations);
  return { receiptId: receipt.id, serial: receipt.serial, already: false };
}

/* -------------------------------------------------------------------------- */
/* The counter                                                                 */
/* -------------------------------------------------------------------------- */

export type CounterPaymentInput = {
  studentMembershipId: string;
  amountPaise: number;
  method: FeeMethod;
  reference?: string | null;
  note?: string | null;
  demandIds?: string[];
  /** The form's own id: the same one twice records once. */
  clientId?: string | null;
  /** The day the money was actually taken, when it is being entered later. */
  paidAtKey?: string | null;
};

export async function recordCounterPayment(ctx: ActiveContext, input: CounterPaymentInput, now: Date = new Date()): Promise<{ paymentId: string; receiptId: string; serial: string; already: boolean }> {
  const caller = requireFeesOffice(ctx);
  if (!(COUNTER_METHODS as readonly string[]).includes(input.method)) throw new AccessError("fees.refuseMethod");
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new AccessError("fees.refuseAmount");
  const reference = input.reference?.trim().slice(0, 60) || null;
  if ((input.method === "CHEQUE" || input.method === "BANK" || input.method === "UPI") && !reference) throw new AccessError("fees.refuseReference");
  const note = input.note?.trim().slice(0, 300) || null;
  const pupil = await db.membership.findFirst({ where: { id: input.studentMembershipId, schoolId: caller.schoolId, role: "STUDENT" }, select: { id: true } });
  if (!pupil) throw new AccessError("fees.notFound", "NOT_FOUND");
  const clientId = input.clientId?.trim().slice(0, 80) || null;
  if (clientId) {
    const replay = await db.feePayment.findUnique({ where: { schoolId_clientId: { schoolId: caller.schoolId, clientId } }, include: { receipt: { select: { id: true, serial: true } } } });
    if (replay?.receipt) {
      // The same form sent again is answered with its receipt; a different pupil, amount or method under that id is
      // not that payment (TA-353): it was answered with the first receipt and nothing was recorded, so it is refused.
      if (replay.studentMembershipId !== pupil.id || replay.amountPaise !== input.amountPaise || replay.method !== input.method) throw new AccessError("fees.refuseClientIdReused");
      return { paymentId: replay.id, receiptId: replay.receipt.id, serial: replay.receipt.serial, already: true };
    }
  }
  // The day is the school's day. The form sends the school's today, and the
  // old check read the key as UTC midnight and refused anything after the
  // platform's clock: from 00:00 to 05:30 in India the office's own today was
  // "a future day" and no payment could be taken at the counter (CI run
  // 36909003458, "That is not a valid date."). Today is now; an earlier day,
  // entered later, is that day; a day after the school's today is refused.
  const key = input.paidAtKey?.trim() || null;
  const { timezone } = await db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { timezone: true } });
  const schoolToday = todayKey(timezone, now);
  if (key && (!isDateKey(key) || key > schoolToday)) throw new AccessError("fees.refuseDate");
  const paidAt = !key || key === schoolToday ? now : new Date(`${key}T00:00:00.000Z`);

  const result = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // A UTR or a bank reference keyed at the counter is one bank credit (TA-255): refused, whatever its case, while a
    // claim, a confirmed or refunded payment already holds it. A cheque number is not unique across banks and is not
    // looked at here.
    if (reference && (input.method === "UPI" || input.method === "BANK")) {
      await lockReference(tx, caller.schoolId, reference);
      if (await referenceHeld(tx, caller.schoolId, reference, null, ["CLAIMED", "PAID", "REFUNDED", "UNALLOCATED"])) throw new AccessError("fees.refuseUtrUsed");
    }
    const payment = await tx.feePayment.create({
      data: { schoolId: caller.schoolId, studentMembershipId: pupil.id, amountPaise: input.amountPaise, method: input.method, status: "INITIATED", reference, note, clientId, collectedByUserId: caller.userId, intentJson: writeJson(input.demandIds ?? []) },
      select: { id: true },
    });
    const settled = await settle(tx, caller.schoolId, payment.id, { paidAt });
    return { paymentId: payment.id, ...settled };
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.counterPayment", targetType: "FeePayment", targetId: result.paymentId, meta: { amountPaise: input.amountPaise, method: input.method, serial: result.serial } });
  await tellFamilyReceived(caller.schoolId, pupil.id, result.paymentId, input.amountPaise, result.serial, result.receiptId);
  return result;
}

async function tellFamilyReceived(schoolId: string, studentMembershipId: string, paymentId: string, amountPaise: number, serial: string, receiptId: string): Promise<void> {
  await notifyGuardians(studentMembershipId, (childName) => ({
    schoolId,
    kind: "FEES",
    titleKey: "notifTitle.feeReceived",
    titleVars: { name: childName },
    bodyKey: "notifBody.feeReceived",
    bodyVars: { amount: rupees(amountPaise), serial },
    url: `/fees/receipts/${receiptId}`,
    meta: { paymentId, receiptId },
    text: { templateKey: "feeReceived", vars: { child: childName, amount: rupees(amountPaise), serial }, purpose: "fees:received" },
  }), "MONEY");
}

/** ₹1,250.50 for a notification body — the i18n money helper is client-side; this is the same output, server-side. */
function rupees(paise: number): string {
  const r = paise / 100;
  return `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: Number.isInteger(r) ? 0 : 2, maximumFractionDigits: 2 }).format(r)}`;
}

/**
 * ⚠ A PAYMENT WHOSE DEMAND WAS CARRIED OR WAIVED IS NOT UNDONE HERE (TA-127, testing analysis of 13 November 2026).
 * recomputeDemands leaves a CARRIED or WAIVED demand as it stands, because the carry fixed next year's opening
 * balance and the waiver the leaver's settlement from its paid total at that moment. A reversal or refund after it
 * marked the payment REVERSED or REFUNDED while the demand kept its paid total: the money was owed nowhere and the old
 * year still counted it. So while any of the payment's money sits on such a demand, the reversal and the refund are
 * refused with a sentence that says why.
 */
function refuseSettledElsewhere(allocations: { amountPaise: number; demand: { status: string } }[]): void {
  if (allocations.some((a) => a.amountPaise > 0 && (a.demand.status === "CARRIED" || a.demand.status === "WAIVED"))) throw new AccessError("fees.refuseReverseCarried");
}

/**
 * A bank reference (a UTR) is held by one payment that stands for money (TA-255). The lock is taken on the school and
 * the reference upper-cased, before any payment row, by the claim, the confirm and the counter alike, so two of them
 * with one reference wait for each other and the second sees the first.
 */
async function lockReference(tx: Tx, schoolId: string, reference: string): Promise<void> {
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`fee-ref:${schoolId}:${reference.trim().toUpperCase()}`}))`;
}

async function referenceHeld(tx: Tx, schoolId: string, reference: string, exceptId: string | null, statuses: string[]): Promise<boolean> {
  const hit = await tx.feePayment.findFirst({ where: { schoolId, reference: { equals: reference.trim(), mode: "insensitive" }, status: { in: statuses }, ...(exceptId ? { id: { not: exceptId } } : {}) }, select: { id: true } });
  return Boolean(hit);
}

/** Locks the named demands in id order, the order every ledger writer takes them in (TA-133). */
async function lockDemands(tx: Tx, demandIds: string[]): Promise<void> {
  const ids = [...new Set(demandIds)].sort();
  if (ids.length) await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ANY(${ids}::text[]) ORDER BY "id" FOR UPDATE`;
}

/**
 * Undo a PAID payment without deleting it. The allocations stay on the row
 * for the audit trail; the demands' paid totals are recomputed from PAID
 * payments only, so they reopen. The receipt stays on file and renders with
 * a "reversed" banner.
 */
export async function reversePayment(ctx: ActiveContext, paymentId: string, reason: string): Promise<void> {
  const caller = requireFeesOffice(ctx);
  const why = reason.trim().slice(0, 300);
  if (why.length < 3) throw new AccessError("fees.refuseReason");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // The payment locked first and read under the lock, then its demands, the order settle keeps (TA-133): a
    // reversal beside a payment settling on the same demand no longer recomputes from a stale read.
    await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${paymentId} AND "schoolId" = ${caller.schoolId} FOR UPDATE`;
    const p = await tx.feePayment.findFirst({ where: { id: paymentId, schoolId: caller.schoolId }, include: { allocations: { select: { demandId: true, amountPaise: true, demand: { select: { status: true } } } }, refunds: { where: { status: { not: "FAILED" } }, select: { id: true } } } });
    if (!p) throw new AccessError("fees.notFound", "NOT_FOUND");
    if (p.status !== "PAID") throw new AccessError("fees.refuseNotPaid");
    if (p.refunds.length > 0) throw new AccessError("fees.refuseReverseRefunded");
    // Money the gateway captured is in the school's account: it goes back with Refund, which sends it back to the
    // family, never with a reversal, which reopened the fee while the money stayed (TA-256).
    if (p.method === "ONLINE") throw new AccessError("fees.refuseReverseOnline");
    refuseSettledElsewhere(p.allocations);
    await lockDemands(tx, p.allocations.map((a) => a.demandId));
    await tx.feePayment.update({ where: { id: p.id }, data: { status: "REVERSED", reversedAt: new Date(), reversedByUserId: caller.userId, reversalReason: why } });
    await recomputeDemands(
      tx,
      p.allocations.map((a) => a.demandId),
    );
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.reverse", targetType: "FeePayment", targetId: paymentId, meta: { reasonGiven: true } }); // the words are on the payment (reversalReason), not in the log (TA-409)
}

/* -------------------------------------------------------------------------- */
/* Online — the school's gateway                                               */
/* -------------------------------------------------------------------------- */

export type CheckoutStart = {
  paymentId: string;
  orderId: string;
  keyId: string;
  amountPaise: number;
  currency: "INR";
  schoolName: string;
  pupilName: string;
  payerName: string;
  payerEmail: string | null;
  transport: "devbox" | "razorpay" | "off";
};

async function familyIntent(parentUserId: string, input: { studentMembershipId: string; demandIds: string[] }) {
  const link = await assertGuardianAccess(parentUserId, input.studentMembershipId, "MONEY");
  const schoolId = link.student.school.id;
  if (!input.demandIds.length) throw new AccessError("fees.refuseNothingDue");
  const demands = await db.feeDemand.findMany({ where: { schoolId, studentMembershipId: input.studentMembershipId, id: { in: input.demandIds }, status: { in: ["OPEN", "PART"] } } });
  if (demands.length !== new Set(input.demandIds).size) throw new AccessError("fees.refuseDemandsChanged");
  const amountPaise = demands.reduce((a, d) => a + d.netPaise - d.paidPaise, 0);
  if (amountPaise < 100) throw new AccessError("fees.refuseNothingDue");
  return { link, schoolId, amountPaise, demandIds: demands.map((d) => d.id) };
}

/**
 * How long an INITIATED online order holds its demands against another
 * checkout: the half hour after which the reconcile job asks the gateway
 * about it anyway. Past it the order is taken as abandoned; were it paid
 * after all, its money is held UNALLOCATED for a refund (holdUnallocated).
 */
const CHECKOUT_HOLD_MS = FEE_ORDER_RECONCILE_AFTER_MS;

/**
 * Creates the order at the SCHOOL'S gateway and an INITIATED payment for it.
 *
 * ⚠ ONE OPEN ORDER PER DEMAND AT A TIME (QA-03, QA campaign of 24 October
 * 2026). Two guardians of one child each opened a checkout for the same
 * ₹7,500 and both got an order; both paid, the second was refused "nothing
 * is due" after the money was taken, and the payment sat INITIATED with no
 * trace. Now the pupil's open demands are locked (in the order `openDemands`
 * takes them, so the two never deadlock) while this looks for an INITIATED
 * online order younger than the hold that names any of the same demands, and
 * the new row is written under the same lock: two presses at one moment make
 * one order. The same guardian asking again for exactly the same dues is
 * handed the order they already have; anyone else, or another set of dues
 * overlapping it, is told a payment is in progress.
 */
export async function startOnlineCheckout(ctx: ActiveContext, input: { studentMembershipId: string; demandIds: string[] }): Promise<CheckoutStart> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const { link, schoolId, amountPaise, demandIds } = await familyIntent(ctx.user.id, input);
  const account = readFeesGatewayTransport() === "off" ? null : await forSchool(schoolId, () => gatewayAccountFor(schoolId));
  if (!account) throw new AccessError("fees.refuseNoGateway");
  // A test key on a deployed server takes no real money and would number real receipts (TA-447).
  if (!gatewayKeyTakesPayments(account.keyId)) throw new AccessError("fees.refuseTestKeyLive");
  const view = (paymentId: string, orderId: string): CheckoutStart => ({
    paymentId,
    orderId,
    keyId: account.keyId,
    amountPaise,
    currency: "INR",
    schoolName: link.student.school.name,
    pupilName: link.student.user.preferredName ?? link.student.user.name,
    payerName: ctx.user.name,
    payerEmail: ctx.user.email ?? null,
    transport: readFeesGatewayTransport(),
  });
  // The row first, so the order's receipt field carries our id; the order
  // id is written back once the gateway answers. A failed call leaves a
  // FAILED row that says why, never an order nobody can find.
  const claim = await forSchool(schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "schoolId" = ${schoolId} AND "studentMembershipId" = ${input.studentMembershipId} AND "status" IN ('OPEN', 'PART') ORDER BY "id" FOR UPDATE`;
      const open = await tx.feePayment.findMany({
        where: { schoolId, studentMembershipId: input.studentMembershipId, method: "ONLINE", status: "INITIATED", createdAt: { gte: new Date(Date.now() - CHECKOUT_HOLD_MS) } },
        select: { id: true, payerUserId: true, amountPaise: true, intentJson: true, gatewayOrderId: true },
      });
      const wanted = new Set(demandIds);
      const holding = open.filter((p) => readJson<string[]>(p.intentJson, []).some((d) => wanted.has(d)));
      const same = (p: (typeof holding)[number]) => {
        const named = readJson<string[]>(p.intentJson, []);
        return p.payerUserId === ctx.user.id && p.gatewayOrderId !== null && p.amountPaise === amountPaise && named.length === wanted.size && named.every((d) => wanted.has(d));
      };
      if (holding.length === 1 && same(holding[0]!)) return { kind: "reuse" as const, id: holding[0]!.id, orderId: holding[0]!.gatewayOrderId! };
      if (holding.length > 0) throw new AccessError("fees.refuseCheckoutInProgress");
      const created = await tx.feePayment.create({ data: { schoolId, studentMembershipId: input.studentMembershipId, amountPaise, method: "ONLINE", status: "INITIATED", payerUserId: ctx.user.id, intentJson: writeJson(demandIds) }, select: { id: true } });
      return { kind: "created" as const, id: created.id };
    }),
  );
  if (claim.kind === "reuse") return view(claim.id, claim.orderId);
  const payment = { id: claim.id };
  let orderId: string;
  try {
    const order = await createOrder(account, { amountPaise, receipt: payment.id, notes: { edulink_payment: payment.id, school: link.student.school.name.slice(0, 60) } });
    orderId = order.orderId;
  } catch (error) {
    const reason = error instanceof GatewayError ? error.message : "gateway error";
    await forSchool(schoolId, () => db.feePayment.update({ where: { id: payment.id }, data: { status: "FAILED", failedReason: reason } }));
    throw new AccessError("fees.refuseGatewayDown");
  }
  await forSchool(schoolId, () => db.feePayment.update({ where: { id: payment.id }, data: { gatewayOrderId: orderId } }));
  await audit({ schoolId, actorUserId: ctx.user.id, action: "fees.checkoutStart", targetType: "FeePayment", targetId: payment.id, meta: { amountPaise, orderId } });
  return view(payment.id, orderId);
}

export type SettleOutcome = "settled" | "already" | "unknown-order" | "amount-mismatch" | "not-settleable" | "unallocated";

/**
 * ⚠ MONEY THAT ARRIVES WITH NOTHING DUE IS RECORDED, NEVER LOST (QA-03).
 *
 * A capture the gateway vouches for is real money in the school's account,
 * whatever the ledger says is owed by the time it lands: an order left open
 * past the hold and paid after the office took cash for the same term, a
 * second guardian's older order. `allocate` refuses to keep money as credit,
 * and the capture used to end there, thrown as "Nothing is due to pay" to the
 * person who had just paid, the payment left INITIATED with no gateway id, no
 * receipt and no audit row. Now the payment is marked UNALLOCATED with the
 * gateway's payment id and the day it arrived: no allocation and no receipt
 * (nothing was settled), audited, the office told to refund it and the family
 * told it will be. The office refunds it through `requestRefund`, which takes
 * an UNALLOCATED payment and leaves it UNALLOCATED (its refund rows say the
 * money went back), so it never counts among the PAID and REFUNDED payments
 * the collection figures and the register add up. Money that covers only part
 * of what it was for (less was due by then) is held whole the same way.
 * Once only: a second delivery of the same capture, or the checkout's confirm
 * racing the webhook, finds it moved and is answered "already".
 */
async function holdUnallocated(schoolId: string, p: { id: string; studentMembershipId: string; amountPaise: number }, input: { gatewayPaymentId: string; gatewayMethod?: string | null }): Promise<{ outcome: SettleOutcome; paymentId: string }> {
  const held = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${p.id} FOR UPDATE`;
    const moved = await tx.feePayment.updateMany({
      where: { id: p.id, schoolId, status: { in: ["INITIATED", "FAILED"] } },
      data: { status: "UNALLOCATED", paidAt: new Date(), gatewayPaymentId: input.gatewayPaymentId, gatewayMethod: input.gatewayMethod ?? null, reference: input.gatewayPaymentId, failedReason: null },
    });
    return moved.count === 1;
  });
  if (!held) return { outcome: "already", paymentId: p.id };
  await audit({ schoolId, action: "fees.onlineUnallocated", targetType: "FeePayment", targetId: p.id, meta: { amountPaise: p.amountPaise, gatewayPaymentId: input.gatewayPaymentId } });
  const [office, pupil] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: { in: ["ADMIN", "ACCOUNTS"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } }),
    db.membership.findUnique({ where: { id: p.studentMembershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
  ]);
  const name = pupil ? (pupil.user.preferredName ?? pupil.user.name) : "";
  await Promise.all(
    office.map((o) => notify({ userId: o.userId, schoolId, kind: "FEES", titleKey: "notifTitle.feeUnallocatedOffice", bodyKey: "notifBody.feeUnallocatedOffice", bodyVars: { amount: rupees(p.amountPaise), name }, url: `/admin/fees/pupils/${p.studentMembershipId}`, urgent: true, meta: { paymentId: p.id } }).catch(() => undefined)),
  );
  await notifyGuardians(p.studentMembershipId, (childName) => ({
    schoolId,
    kind: "FEES",
    titleKey: "notifTitle.feeUnallocated",
    titleVars: { name: childName },
    bodyKey: "notifBody.feeUnallocated",
    bodyVars: { amount: rupees(p.amountPaise) },
    url: "/parent/fees",
    meta: { paymentId: p.id },
  }), "MONEY").catch(() => undefined);
  return { outcome: "unallocated", paymentId: p.id };
}

/**
 * ⚠ A CAPTURE OF ANOTHER AMOUNT IS TOLD, NOT DROPPED (TA-524, testing analysis of 13 November 2026). Decision 0003
 * refuses to settle a capture whose amount is not the order's, and it is still refused; but it used to end at an
 * audit row: nobody was told, and a day later the reconcile job closed the order as "nothing captured" while the
 * school held the money. Now the order is closed FAILED with a reason that names the amount and the gateway's payment
 * id, once, and the office is told at once to look at it in the gateway's dashboard and refund or record it by hand.
 */
async function flagAmountMismatch(schoolId: string, p: { id: string; amountPaise: number; studentMembershipId: string }, input: { gatewayPaymentId: string; amountPaise: number }): Promise<void> {
  const flagged = await db.feePayment.updateMany({
    where: { id: p.id, schoolId, status: { in: ["INITIATED", "FAILED"] }, OR: [{ failedReason: null }, { NOT: { failedReason: { startsWith: AMOUNT_MISMATCH } } }] },
    data: { status: "FAILED", failedReason: `${AMOUNT_MISMATCH}${input.amountPaise}:${input.gatewayPaymentId}`.slice(0, 200) },
  });
  if (flagged.count === 0) return;
  const [office, pupil] = await Promise.all([
    db.membership.findMany({ where: { schoolId, role: { in: ["ADMIN", "ACCOUNTS"] }, status: "ACTIVE", leftAt: null }, select: { userId: true } }),
    db.membership.findUnique({ where: { id: p.studentMembershipId }, select: { user: { select: { name: true, preferredName: true } } } }),
  ]);
  const name = pupil ? (pupil.user.preferredName ?? pupil.user.name) : "";
  await Promise.all(
    [...new Set(office.map((o) => o.userId))].map((userId) =>
      notify({ userId, schoolId, kind: "FEES", titleKey: "notifTitle.feeAmountMismatchOffice", bodyKey: "notifBody.feeAmountMismatchOffice", bodyVars: { amount: rupees(input.amountPaise), expected: rupees(p.amountPaise), name }, url: `/admin/fees/pupils/${p.studentMembershipId}`, urgent: true, meta: { paymentId: p.id } }).catch(() => undefined),
    ),
  );
}

/**
 * The one door every online settlement comes through — the webhook, the
 * checkout's own confirm, the reconcile job and the devbox page — so all
 * four are idempotent together: a payment settles once, by whichever arrives
 * first, and the rest are told "already". The amount is compared with the
 * order the server itself created; a mismatch is refused and audited, and
 * the row is left for the office to look at.
 */
export async function settleOnlinePayment(schoolId: string, input: { orderId: string; gatewayPaymentId: string; amountPaise: number; gatewayMethod?: string | null }): Promise<{ outcome: SettleOutcome; paymentId: string | null }> {
  return forSchool(schoolId, async () => {
    const p = await db.feePayment.findFirst({ where: { schoolId, gatewayOrderId: input.orderId }, select: { id: true, amountPaise: true, status: true, studentMembershipId: true } });
    if (!p) return { outcome: "unknown-order", paymentId: null };
    if (p.status === "PAID" || p.status === "REFUNDED" || p.status === "UNALLOCATED") return { outcome: "already", paymentId: p.id };
    // FAILED stays settleable: a signed capture after a failed attempt on the
    // same order is the gateway saying the retry went through. See settle().
    if (p.status !== "INITIATED" && p.status !== "FAILED") return { outcome: "not-settleable", paymentId: p.id };
    if (p.amountPaise !== input.amountPaise) {
      await audit({ schoolId, action: "fees.amountMismatch", targetType: "FeePayment", targetId: p.id, meta: { expected: p.amountPaise, got: input.amountPaise, gatewayPaymentId: input.gatewayPaymentId } });
      await flagAmountMismatch(schoolId, p, input);
      return { outcome: "amount-mismatch", paymentId: p.id };
    }
    let settled: Awaited<ReturnType<typeof settle>>;
    try {
      settled = await db.$tenantTransaction(async (raw) => settle(raw as Tx, schoolId, p.id, { gatewayPaymentId: input.gatewayPaymentId, gatewayMethod: input.gatewayMethod ?? null, reference: input.gatewayPaymentId }));
    } catch (error) {
      // Captured, and nothing (or less than all of it) is owed any more: held for a refund, not thrown at the payer (QA-03).
      if (error instanceof AccessError && (error.key === "fees.refuseNothingDue" || error.key === "fees.refuseOverpayment")) return holdUnallocated(schoolId, p, input);
      // The same capture held a moment ago by the other door (the confirm racing the webhook).
      if (error instanceof AccessError && error.key === "fees.refuseNotSettleable" && (await db.feePayment.findUnique({ where: { id: p.id }, select: { status: true } }))?.status === "UNALLOCATED") return { outcome: "already", paymentId: p.id };
      throw error;
    }
    if (settled.already) return { outcome: "already", paymentId: p.id };
    await audit({ schoolId, action: "fees.onlineSettled", targetType: "FeePayment", targetId: p.id, meta: { amountPaise: input.amountPaise, serial: settled.serial, gatewayPaymentId: input.gatewayPaymentId } });
    await tellFamilyReceived(schoolId, p.studentMembershipId, p.id, p.amountPaise, settled.serial, settled.receiptId);
    return { outcome: "settled", paymentId: p.id };
  });
}

export async function failOnlinePayment(schoolId: string, orderId: string, reason: string): Promise<void> {
  await forSchool(schoolId, async () => {
    const p = await db.feePayment.findFirst({ where: { schoolId, gatewayOrderId: orderId, status: "INITIATED" }, select: { id: true } });
    if (!p) return;
    // Only while still INITIATED (TA-133): a capture settling the same order at this moment is not turned FAILED.
    await db.feePayment.updateMany({ where: { id: p.id, schoolId, status: "INITIATED" }, data: { status: "FAILED", failedReason: reason.slice(0, 200) } });
  });
}

/**
 * The checkout page's own confirmation: the handler signature the gateway
 * hands the browser, checked with the school's key secret. A fallback for a
 * webhook that is slow — the webhook remains the settlement of record and
 * both are idempotent.
 */
export async function confirmOnlineCheckout(ctx: ActiveContext, input: { paymentId: string; gatewayPaymentId: string; signature: string }): Promise<{ outcome: SettleOutcome; receiptId: string | null }> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const p = await db.feePayment.findFirst({ where: { id: input.paymentId, payerUserId: ctx.user.id }, select: { id: true, schoolId: true, gatewayOrderId: true, amountPaise: true } });
  if (!p || !p.gatewayOrderId) throw new AccessError("fees.notFound", "NOT_FOUND");
  const account = await forSchool(p.schoolId, () => gatewayAccountFor(p.schoolId));
  if (!account) throw new AccessError("fees.refuseNoGateway");
  if (!verifyCheckoutSignature(account.secret, p.gatewayOrderId, input.gatewayPaymentId, input.signature)) throw new AccessError("fees.refuseBadSignature");
  const result = await settleOnlinePayment(p.schoolId, { orderId: p.gatewayOrderId, gatewayPaymentId: input.gatewayPaymentId, amountPaise: p.amountPaise });
  const receipt = result.paymentId ? await forSchool(p.schoolId, () => db.feeReceipt.findUnique({ where: { paymentId: result.paymentId! }, select: { id: true } })) : null;
  return { outcome: result.outcome, receiptId: receipt?.id ?? null };
}

/**
 * The reconcile job: an INITIATED online order older than half an hour is
 * asked about at the gateway, in case the webhook never came; one older
 * than a day with nothing captured is closed as failed.
 *
 * THE NET HAS NO HOLES (TA-257, testing analysis of 13 November 2026): a
 * FAILED order is asked about too, for three days, because a retry on the
 * same order can be captured after a first attempt failed (settle takes it)
 * and its webhook can be lost; the oldest rows are asked first; and an order
 * the gateway errors on is closed once it is past the day, rather than asked
 * about every hour for ever and crowding out other schools' orders. A
 * capture of another amount than the order's is flagged for the office
 * (TA-524), never closed as "nothing captured". UPI intents never claimed
 * within FEE_UPI_INTENT_MS are closed here as well (TA-449).
 */
export async function reconcileOnlinePayments(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<{ checked: number; settled: number; expired: number; upiClosed: number; perSchool: Record<string, { checked: number; settled: number; expired: number }> }> {
  const reconcileBefore = new Date(now.getTime() - FEE_ORDER_RECONCILE_AFTER_MS);
  const inScope = scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {};
  const stale = await db.feePayment.findMany({
    where: {
      ...inScope,
      method: "ONLINE",
      gatewayOrderId: { not: null },
      OR: [
        { status: "INITIATED", createdAt: { lt: reconcileBefore } },
        { status: "FAILED", createdAt: { lt: reconcileBefore, gte: new Date(now.getTime() - FEE_FAILED_RECONCILE_MS) } },
      ],
    },
    select: { id: true, schoolId: true, gatewayOrderId: true, amountPaise: true, createdAt: true, status: true },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  const perSchool: Record<string, { checked: number; settled: number; expired: number }> = {};
  const bump = (s: string, k: "checked" | "settled" | "expired") => {
    const row = (perSchool[s] ??= { checked: 0, settled: 0, expired: 0 });
    row[k] += 1;
  };
  for (const p of stale) {
    bump(p.schoolId, "checked");
    const account = await forSchool(p.schoolId, () => gatewayAccountFor(p.schoolId));
    let captured: { paymentId: string; method: string | null } | null = null;
    let otherAmount: { paymentId: string; amountPaise: number; method: string | null } | null = null;
    const pastDay = now.getTime() - p.createdAt.getTime() > FEE_ORDER_EXPIRY_MS;
    if (account) {
      try {
        const payments = await fetchOrderPayments(account, p.gatewayOrderId!);
        const hit = payments.find((x) => x.status === "captured" && x.amountPaise === p.amountPaise);
        if (hit) captured = { paymentId: hit.paymentId, method: hit.method };
        const other = payments.find((x) => x.status === "captured" && x.amountPaise !== p.amountPaise);
        if (other) otherAmount = { paymentId: other.paymentId, amountPaise: other.amountPaise, method: other.method };
      } catch (error) {
        console.error("[fees:reconcile]", p.id, error instanceof Error ? error.message : error);
        // Past the day, an order the gateway will not answer about is closed (it stays settleable by a signed
        // capture, and is asked about as FAILED for three more days) instead of being asked every hour for ever.
        if (p.status === "INITIATED" && pastDay) {
          await failOnlinePayment(p.schoolId, p.gatewayOrderId!, "expired: the gateway could not be asked within a day");
          bump(p.schoolId, "expired");
        }
        continue;
      }
    }
    if (captured) {
      const r = await settleOnlinePayment(p.schoolId, { orderId: p.gatewayOrderId!, gatewayPaymentId: captured.paymentId, amountPaise: p.amountPaise, gatewayMethod: captured.method });
      if (r.outcome === "settled") bump(p.schoolId, "settled");
    } else if (p.status !== "INITIATED") {
      // A FAILED order with nothing captured at its own amount stays as it is.
      continue;
    } else if (otherAmount) {
      // Captured, at another amount than the order's: refused and flagged for the office, never "nothing captured".
      await settleOnlinePayment(p.schoolId, { orderId: p.gatewayOrderId!, gatewayPaymentId: otherAmount.paymentId, amountPaise: otherAmount.amountPaise, gatewayMethod: otherAmount.method });
    } else if (pastDay) {
      await failOnlinePayment(p.schoolId, p.gatewayOrderId!, "expired: nothing captured within a day");
      bump(p.schoolId, "expired");
    }
  }
  const upiClosed = await closeUnclaimedUpiIntents(now, inScope);
  const totals = Object.values(perSchool).reduce((a, r) => ({ checked: a.checked + r.checked, settled: a.settled + r.settled, expired: a.expired + r.expired }), { checked: 0, settled: 0, expired: 0 });
  return { ...totals, upiClosed, perSchool };
}

/**
 * A UPI intent nobody claimed within FEE_UPI_INTENT_MS is closed FAILED, "not claimed" (TA-449): it no longer counts
 * among the office's "waiting for a UTR", nor is read by every bank import for good. School by school, under each
 * school's own tenant.
 */
async function closeUnclaimedUpiIntents(now: Date, inScope: { schoolId?: { in: string[] } }): Promise<number> {
  const before = new Date(now.getTime() - FEE_UPI_INTENT_MS);
  const rows = await db.feePayment.findMany({ where: { ...inScope, method: "UPI", status: "INITIATED", createdAt: { lt: before } }, select: { id: true, schoolId: true }, take: 2000 });
  const bySchool = new Map<string, string[]>();
  for (const r of rows) bySchool.set(r.schoolId, [...(bySchool.get(r.schoolId) ?? []), r.id]);
  let closed = 0;
  for (const [schoolId, ids] of bySchool) {
    const r = await forSchool(schoolId, () => db.feePayment.updateMany({ where: { id: { in: ids }, schoolId, method: "UPI", status: "INITIATED", createdAt: { lt: before } }, data: { status: "FAILED", failedReason: "not claimed" } }));
    closed += r.count;
  }
  return closed;
}

/* -------------------------------------------------------------------------- */
/* UPI to the school's own id                                                  */
/* -------------------------------------------------------------------------- */

export type UpiStart = { paymentId: string; link: string; amountPaise: number; payeeVpa: string; payeeName: string; reference: string; schoolName: string; pupilName: string };

/** An intent link the parent's UPI app opens with the school as payee; the payment waits for the UTR. */
export async function startUpiPayment(ctx: ActiveContext, input: { studentMembershipId: string; demandIds: string[] }): Promise<UpiStart> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const { link, schoolId, amountPaise, demandIds } = await familyIntent(ctx.user.id, input);
  const school = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, feeUpiId: true, feeUpiPayee: true } });
  if (!school.feeUpiId || !school.feeUpiPayee) throw new AccessError("fees.refuseNoUpi");
  const pupilName = link.student.user.preferredName ?? link.student.user.name;
  // ONE OPEN INTENT FOR THE SAME DUES (TA-449, testing analysis of 13 November 2026): every press used to write a
  // payment row and an audit row, for good. The guardian's own intent for exactly these dues and this amount, still
  // waiting for its UTR and younger than the bound after which the reconcile job closes it, is handed back instead;
  // the look and the write are under a lock on the guardian and the child, so two presses at once make one row.
  const wanted = new Set(demandIds);
  const claim = await forSchool(schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`fee-upi:${ctx.user.id}:${input.studentMembershipId}`}))`;
      const open = await tx.feePayment.findMany({
        where: { schoolId, studentMembershipId: input.studentMembershipId, payerUserId: ctx.user.id, method: "UPI", status: "INITIATED", amountPaise, createdAt: { gte: new Date(Date.now() - FEE_UPI_INTENT_MS) } },
        orderBy: { createdAt: "desc" },
        select: { id: true, note: true, intentJson: true },
      });
      const same = open.find((p) => {
        const named = readJson<string[]>(p.intentJson, []);
        return p.note !== null && named.length === wanted.size && named.every((d) => wanted.has(d));
      });
      if (same) return { id: same.id, reference: same.note!, reused: true };
      const reference = `EL${randomBytes(6).toString("hex").toUpperCase()}`;
      const created = await tx.feePayment.create({
        data: { schoolId, studentMembershipId: input.studentMembershipId, amountPaise, method: "UPI", status: "INITIATED", payerUserId: ctx.user.id, intentJson: writeJson(demandIds), note: reference },
        select: { id: true },
      });
      return { id: created.id, reference, reused: false };
    }),
  );
  const payment = { id: claim.id };
  const reference = claim.reference;
  if (!claim.reused) await audit({ schoolId, actorUserId: ctx.user.id, action: "fees.upiStart", targetType: "FeePayment", targetId: payment.id, meta: { amountPaise, reference } });
  return {
    paymentId: payment.id,
    link: upiIntentLink({ payeeVpa: school.feeUpiId, payeeName: school.feeUpiPayee, amountPaise, reference, note: `${pupilName} fees ${reference}` }),
    amountPaise,
    payeeVpa: school.feeUpiId,
    payeeName: school.feeUpiPayee,
    reference,
    schoolName: school.name,
    pupilName,
  };
}

/** The parent says it went through and gives the UTR; the office confirms against the statement. */
export async function claimUpiPayment(ctx: ActiveContext, input: { paymentId: string; utr: string }): Promise<void> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const utr = input.utr.trim().toUpperCase();
  if (!looksLikeUtr(utr)) throw new AccessError("fees.refuseUtr");
  const p = await db.feePayment.findFirst({ where: { id: input.paymentId, payerUserId: ctx.user.id, method: "UPI" }, select: { id: true, schoolId: true, status: true, studentMembershipId: true, amountPaise: true } });
  if (!p) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (p.status !== "INITIATED" && p.status !== "CLAIMED") throw new AccessError("fees.refuseNotSettleable");
  // ONE UTR, ONE PAYMENT, AS A RULE AND NOT A READ (TA-255, testing analysis of 13 November 2026): the look for
  // another payment holding the UTR runs under a lock on the school and the UTR, so two claims sent together cannot
  // both pass, and it counts a payment that was refunded (the money came once and went back) as well as one claimed
  // or paid. The write is conditional on the status read (TA-133), so a claim never turns a confirmed payment back.
  await forSchool(p.schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      await lockReference(tx, p.schoolId, utr);
      if (await referenceHeld(tx, p.schoolId, utr, p.id, ["CLAIMED", "PAID", "REFUNDED", "UNALLOCATED"])) throw new AccessError("fees.refuseUtrUsed");
      const claimed = await tx.feePayment.updateMany({ where: { id: p.id, schoolId: p.schoolId, status: { in: ["INITIATED", "CLAIMED"] } }, data: { status: "CLAIMED", reference: utr, claimedAt: new Date() } });
      if (claimed.count === 0) throw new AccessError("fees.refuseNotSettleable");
    }),
  );
  await audit({ schoolId: p.schoolId, actorUserId: ctx.user.id, action: "fees.upiClaim", targetType: "FeePayment", targetId: p.id, meta: { utr } });
  // The office hears once per claim, so a family is not left waiting on a
  // queue nobody has opened.
  const admins = await forSchool(p.schoolId, () => db.membership.findMany({ where: { schoolId: p.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } }));
  await Promise.all(admins.map((a) => notify({ userId: a.userId, schoolId: p.schoolId, kind: "FEES", titleKey: "notifTitle.feeClaimWaiting", bodyKey: "notifBody.feeClaimWaiting", bodyVars: { amount: rupees(p.amountPaise), utr }, url: "/admin/fees/claims", meta: { paymentId: p.id } })));
}

export type ClaimRow = { paymentId: string; studentMembershipId: string; pupilName: string; className: string | null; amountPaise: number; utr: string | null; reference: string | null; claimedAt: Date | null; createdAt: Date; payer: string | null; stale: boolean };

export async function listClaims(ctx: ActiveContext, todayKeyInZone: string): Promise<{ claims: ClaimRow[]; waitingForUtr: number }> {
  const caller = requireFeesOffice(ctx);
  const [rows, waiting] = await Promise.all([
    db.feePayment.findMany({
      where: { schoolId: caller.schoolId, method: "UPI", status: "CLAIMED" },
      orderBy: { claimedAt: "asc" },
      include: { student: { select: { user: { select: { name: true, preferredName: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } }, take: 1 } } }, payer: { select: { name: true } } },
    }),
    db.feePayment.count({ where: { schoolId: caller.schoolId, method: "UPI", status: "INITIATED", payerUserId: { not: null } } }),
  ]);
  const staleBefore = new Date(`${todayKeyInZone}T00:00:00.000Z`).getTime() - FEE_CLAIM_STALE_DAYS * 86_400_000;
  return {
    claims: rows.map((p) => ({
      paymentId: p.id,
      studentMembershipId: p.studentMembershipId,
      pupilName: p.student.user.preferredName ?? p.student.user.name,
      className: p.student.enrollments[0]?.class.name ?? null,
      amountPaise: p.amountPaise,
      utr: p.reference,
      reference: p.note,
      claimedAt: p.claimedAt,
      createdAt: p.createdAt,
      payer: p.payer?.name ?? null,
      stale: (p.claimedAt?.getTime() ?? 0) < staleBefore,
    })),
    waitingForUtr: waiting,
  };
}

/**
 * The office confirms a UPI payment against its statement. `fromStatement`
 * is the bank import confirming an intent the family never claimed: the
 * statement's line carried the intent's EL reference, so the line's own
 * reference stands in for the UTR the family would have given — the same
 * row becomes PAID, and no second payment is written for the same money.
 */
export async function confirmClaim(ctx: ActiveContext, paymentId: string, fromStatement?: { utr: string }): Promise<{ receiptId: string; serial: string }> {
  const caller = requireFeesOffice(ctx);
  const result = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const first = await tx.feePayment.findFirst({ where: { id: paymentId, schoolId: caller.schoolId, method: "UPI" }, select: { id: true, reference: true } });
    if (!first) throw new AccessError("fees.notFound", "NOT_FOUND");
    // The UTR's lock before the payment's, the order the claim and the counter keep (TA-255); then the row read again.
    const refs = [...new Set([first.reference ?? "", fromStatement?.utr ?? ""].map((r) => r.trim().toUpperCase().slice(0, 60)).filter(Boolean))].sort();
    for (const ref of refs) await lockReference(tx, caller.schoolId, ref);
    const p = await tx.feePayment.findFirst({ where: { id: paymentId, schoolId: caller.schoolId, method: "UPI" }, select: { id: true, status: true, studentMembershipId: true, amountPaise: true, reference: true } });
    if (!p) throw new AccessError("fees.notFound", "NOT_FOUND");
    const unclaimed = p.status === "INITIATED" && Boolean(fromStatement);
    if (p.status !== "CLAIMED" && !unclaimed) throw new AccessError("fees.refuseNotClaimed");
    let reference: string | undefined;
    if (unclaimed) {
      reference = fromStatement!.utr.trim().toUpperCase().slice(0, 60);
      if (!reference) throw new AccessError("fees.refuseReference");
      if (await referenceHeld(tx, caller.schoolId, reference, p.id, ["CLAIMED", "PAID", "REFUNDED", "UNALLOCATED"])) throw new AccessError("fees.refuseUtrUsed");
    } else if (p.reference && (await referenceHeld(tx, caller.schoolId, p.reference, p.id, ["PAID", "REFUNDED", "UNALLOCATED"]))) {
      // A claim whose UTR another payment already stands for (a counter entry, an earlier claim confirmed and later
      // refunded) is not confirmed a second time: one bank credit, one receipt (TA-255).
      throw new AccessError("fees.refuseUtrUsed");
    }
    const settled = await settle(tx, caller.schoolId, p.id, { confirmedByUserId: caller.userId, reference });
    return { ...settled, studentMembershipId: p.studentMembershipId, amountPaise: p.amountPaise, fromStatement: unclaimed };
  });
  // Two confirms of one claim at once: the second waits on the payment's lock in settle() and finds it PAID; it is not audited or told twice.
  if (!result.already) {
    await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.claimConfirm", targetType: "FeePayment", targetId: paymentId, meta: { serial: result.serial, ...(result.fromStatement ? { fromStatement: true } : {}) } });
    await tellFamilyReceived(caller.schoolId, result.studentMembershipId, paymentId, result.amountPaise, result.serial, result.receiptId);
  }
  return { receiptId: result.receiptId, serial: result.serial };
}

export async function rejectClaim(ctx: ActiveContext, paymentId: string, reason: string): Promise<void> {
  const caller = requireFeesOffice(ctx);
  const why = reason.trim().slice(0, 300);
  if (why.length < 3) throw new AccessError("fees.refuseReason");
  const p = await db.feePayment.findFirst({ where: { id: paymentId, schoolId: caller.schoolId, method: "UPI" }, select: { id: true, status: true, studentMembershipId: true, amountPaise: true } });
  if (!p) throw new AccessError("fees.notFound", "NOT_FOUND");
  if (p.status !== "CLAIMED" && p.status !== "INITIATED") throw new AccessError("fees.refuseNotClaimed");
  // Conditional on the status read (TA-133): a confirm that settled the claim a moment ago (PAID, receipt numbered)
  // is not overwritten FAILED by a rejection that read CLAIMED before it.
  const rejected = await db.feePayment.updateMany({ where: { id: p.id, schoolId: caller.schoolId, status: { in: ["CLAIMED", "INITIATED"] } }, data: { status: "FAILED", failedReason: why, confirmedByUserId: caller.userId } });
  if (rejected.count === 0) throw new AccessError("fees.refuseNotClaimed");
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.claimReject", targetType: "FeePayment", targetId: p.id, meta: { reasonGiven: true } }); // the words are on the payment (failedReason), not in the log (TA-409)
  await notifyGuardians(p.studentMembershipId, (childName) => ({
    schoolId: caller.schoolId,
    kind: "FEES",
    titleKey: "notifTitle.feeClaimRejected",
    titleVars: { name: childName },
    body: why,
    url: "/parent/fees",
    meta: { paymentId: p.id },
  }), "MONEY");
}

export type BankMatch = { row: number; utr: string; amountPaise: number | null; paymentId: string | null; pupilName: string | null; problem: "no-utr" | "no-amount" | "no-claim" | "amount-differs" | null };

/**
 * A bank statement pasted as CSV: any column headed UTR / Ref / Reference /
 * Transaction id, and any headed Amount / Credit. Each row is matched to a
 * CLAIMED payment by UTR, then by amount; the office confirms the matches it
 * agrees with.
 */
export async function matchBankRows(ctx: ActiveContext, csv: string): Promise<{ matches: BankMatch[] }> {
  const caller = requireFeesOffice(ctx);
  const parsed = parseCsv(csv.slice(0, 200_000));
  const headers = parsed.headers.map((h) => h.toLowerCase());
  const utrCol = headers.findIndex((h) => /utr|ref|reference|transaction|txn|rrn/.test(h));
  const amtCol = headers.findIndex((h) => /credit|amount|amt/.test(h));
  if (utrCol < 0) throw new AccessError("fees.refuseNoUtrColumn");
  const claims = await db.feePayment.findMany({ where: { schoolId: caller.schoolId, method: "UPI", status: "CLAIMED" }, select: { id: true, reference: true, amountPaise: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } });
  const byUtr = new Map(claims.map((c) => [c.reference?.toUpperCase() ?? "", c]));
  const matches: BankMatch[] = parsed.rows.slice(0, 2000).map((cells, i) => {
    const rawUtr = (cells[parsed.headers[utrCol]!] ?? "").trim().toUpperCase();
    const utr = rawUtr.replace(/[^A-Z0-9]/g, "");
    const amountText = amtCol >= 0 ? (cells[parsed.headers[amtCol]!] ?? "").replace(/[₹,\s]/g, "") : "";
    const amountPaise = amountText && /^\d+(\.\d{1,2})?$/.test(amountText) ? Math.round(Number(amountText) * 100) : null;
    if (!utr) return { row: i + 1, utr: rawUtr, amountPaise, paymentId: null, pupilName: null, problem: "no-utr" };
    const claim = byUtr.get(utr);
    if (!claim) return { row: i + 1, utr, amountPaise, paymentId: null, pupilName: null, problem: "no-claim" };
    const pupilName = claim.student.user.preferredName ?? claim.student.user.name;
    if (amountPaise === null) return { row: i + 1, utr, amountPaise, paymentId: claim.id, pupilName, problem: "no-amount" };
    if (amountPaise !== claim.amountPaise) return { row: i + 1, utr, amountPaise, paymentId: claim.id, pupilName, problem: "amount-differs" };
    return { row: i + 1, utr, amountPaise, paymentId: claim.id, pupilName, problem: null };
  });
  return { matches };
}

/* -------------------------------------------------------------------------- */
/* Refunds                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Money back to the family, out of the SCHOOL'S funds: through the gateway
 * to the original instrument for an ONLINE payment, recorded here after the
 * office has paid it back itself for every other method. The demand reopens
 * by the refunded amount.
 */
export async function requestRefund(ctx: ActiveContext, input: { paymentId: string; amountPaise: number; reason: string }): Promise<{ refundId: string; status: string }> {
  const caller = requireFeesOffice(ctx);
  const why = input.reason.trim().slice(0, 300);
  if (why.length < 3) throw new AccessError("fees.refuseReason");
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new AccessError("fees.refuseAmount");
  const p = await db.feePayment.findFirst({ where: { id: input.paymentId, schoolId: caller.schoolId }, include: { refunds: { where: { status: { not: "FAILED" } }, select: { amountPaise: true } }, allocations: { select: { demandId: true, amountPaise: true, demand: { select: { status: true } } } } } });
  if (!p) throw new AccessError("fees.notFound", "NOT_FOUND");
  // UNALLOCATED: captured with nothing due (QA-03), refunded from here like any other; it holds no allocation to reopen.
  if (p.status !== "PAID" && p.status !== "REFUNDED" && p.status !== "UNALLOCATED") throw new AccessError("fees.refuseNotPaid");
  if (p.refunds.reduce((a, r) => a + r.amountPaise, 0) + input.amountPaise > p.amountPaise) throw new AccessError("fees.refuseRefundTooMuch");
  refuseSettledElsewhere(p.allocations);
  const account = p.method === "ONLINE" ? await gatewayAccountFor(caller.schoolId) : null;
  if (p.method === "ONLINE" && (!account || !p.gatewayPaymentId)) throw new AccessError("fees.refuseNoGateway");

  /**
   * ONE REFUND PER CLICK, however many clicks. The payment row is locked for
   * the whole of this, and the refunded-so-far sum is read again UNDER the
   * lock: two office tabs pressing "refund" together used to both read
   * "nothing refunded yet", both ask the gateway, and both record a refund of
   * the full amount. Now the second waits on the lock, re-reads, and is
   * refused as too much. The gateway is called inside the lock on purpose —
   * the alternative, a row written before the gateway answers, would need
   * an undo path for every way the answer can fail.
   *
   * The gateway may take up to its own fifteen seconds to answer, inside this
   * lock; Prisma's five-second default, which a deployed server keeps, rolled
   * the refund's row back after the money had gone, and a second press sent it
   * again (TA-128, testing analysis of 13 November 2026). The transaction's
   * limit is now above the gateway's (REFUND_TX_MS).
   */
  const { refund, status, gatewayRefundId } = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${p.id} FOR UPDATE`;
    // The status read again under the lock (TA-133): a reversal that committed since the read above is not refunded.
    const locked = await tx.feePayment.findUniqueOrThrow({ where: { id: p.id }, select: { status: true, allocations: { select: { demandId: true, amountPaise: true, demand: { select: { status: true } } } } } });
    if (locked.status !== "PAID" && locked.status !== "REFUNDED" && locked.status !== "UNALLOCATED") throw new AccessError("fees.refuseNotPaid");
    refuseSettledElsewhere(locked.allocations);
    await lockDemands(tx, locked.allocations.map((a) => a.demandId));
    const refundedSoFar = (await tx.feeRefund.aggregate({ where: { paymentId: p.id, status: { not: "FAILED" } }, _sum: { amountPaise: true } }))._sum.amountPaise ?? 0;
    if (refundedSoFar + input.amountPaise > p.amountPaise) throw new AccessError("fees.refuseRefundTooMuch");

    let gatewayRefundId: string | null = null;
    let status: "REQUESTED" | "DONE" = "DONE";
    if (p.method === "ONLINE" && account && p.gatewayPaymentId) {
      try {
        const r = await refundPayment(account, p.gatewayPaymentId, input.amountPaise, { edulink_payment: p.id, reason: why.slice(0, 60) });
        gatewayRefundId = r.refundId;
        status = r.status === "processed" ? "DONE" : "REQUESTED";
      } catch (error) {
        console.error("[fees:refund]", error instanceof Error ? error.message : error);
        throw new AccessError("fees.refuseGatewayDown");
      }
    }
    // Reopen the newest allocations first by the refunded amount — and keep what was
    // taken from each, so that a refund the gateway fails can be put back exactly.
    const allocations = await tx.feeAllocation.findMany({ where: { paymentId: p.id }, orderBy: { id: "desc" } });
    const cuts: { allocationId: string; amountPaise: number }[] = [];
    let left = input.amountPaise;
    for (const a of allocations) {
      if (left <= 0) break;
      const cut = Math.min(a.amountPaise, left);
      if (cut <= 0) continue;
      await tx.feeAllocation.update({ where: { id: a.id }, data: { amountPaise: a.amountPaise - cut } });
      cuts.push({ allocationId: a.id, amountPaise: cut });
      left -= cut;
    }
    const created = await tx.feeRefund.create({ data: { schoolId: caller.schoolId, paymentId: p.id, amountPaise: input.amountPaise, reason: why, status, gatewayRefundId, cutsJson: JSON.stringify(cuts), requestedByUserId: caller.userId, settledAt: status === "DONE" ? new Date() : null }, select: { id: true } });
    const total = refundedSoFar + input.amountPaise;
    // An UNALLOCATED payment keeps its status: it settled nothing and has no receipt, so it never joins the collected
    // PAID/REFUNDED figures; its refund rows say it went back.
    if (total >= p.amountPaise && p.status !== "UNALLOCATED") await tx.feePayment.update({ where: { id: p.id }, data: { status: "REFUNDED" } });
    await recomputeDemands(
      tx,
      allocations.map((a) => a.demandId),
    );
    return { refund: created, status, gatewayRefundId };
  }, { timeout: REFUND_TX_MS });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.userId, action: "fees.refund", targetType: "FeePayment", targetId: p.id, meta: { refundId: refund.id, amountPaise: input.amountPaise, status, gatewayRefundId } });
  await notifyGuardians(p.studentMembershipId, (childName) => ({
    schoolId: caller.schoolId,
    kind: "FEES",
    titleKey: "notifTitle.feeRefunded",
    titleVars: { name: childName },
    bodyKey: "notifBody.feeRefunded",
    bodyVars: { amount: rupees(input.amountPaise) },
    url: "/parent/fees",
    meta: { paymentId: p.id, refundId: refund.id },
  }), "MONEY");
  return { refundId: refund.id, status };
}

/**
 * ⚠ THE GATEWAY SAID NO. A refund reopens the demand the moment it is asked
 * for — the family is told the money is on its way and the ledger shows the
 * fee as owed again — and the gateway answers later. When the answer was a
 * failure nothing heard it: the refund sat REQUESTED for ever, the family
 * owed a fee they had paid, and the money had never left the school.
 *
 * So a failure puts back exactly what the refund took (its own `cutsJson`),
 * marks it FAILED with the gateway's reason, gives the payment back its PAID
 * standing when no other refund has emptied it, and recomputes the demands.
 * A refund made before the cuts were kept is marked and reported, and its
 * demand is left for the office, who are told either way. Once only: a
 * second failure event, or one for a refund already done, changes nothing.
 */
export async function markRefundFailed(schoolId: string, gatewayRefundId: string, reason: string): Promise<"refund-failed" | "ignored"> {
  const done = await forSchool(schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as Tx;
      const refund = await tx.feeRefund.findFirst({ where: { schoolId, gatewayRefundId, status: "REQUESTED" }, select: { id: true, paymentId: true, amountPaise: true, cutsJson: true, requestedByUserId: true } });
      if (!refund) return null;
      await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${refund.paymentId} FOR UPDATE`;
      const claimed = await tx.feeRefund.updateMany({ where: { id: refund.id, status: "REQUESTED" }, data: { status: "FAILED", failedReason: reason.slice(0, 200), settledAt: new Date() } });
      if (claimed.count === 0) return null;

      const cuts = readJson<{ allocationId: string; amountPaise: number }[]>(refund.cutsJson, []);
      const demandIds: string[] = [];
      for (const cut of cuts) {
        const allocation = await tx.feeAllocation.findFirst({ where: { id: cut.allocationId, paymentId: refund.paymentId }, select: { id: true, amountPaise: true, demandId: true } });
        if (!allocation) continue;
        await tx.feeAllocation.update({ where: { id: allocation.id }, data: { amountPaise: allocation.amountPaise + cut.amountPaise } });
        demandIds.push(allocation.demandId);
      }
      const payment = await tx.feePayment.findUniqueOrThrow({ where: { id: refund.paymentId }, select: { id: true, status: true, amountPaise: true, studentMembershipId: true } });
      const stillRefunded = (await tx.feeRefund.aggregate({ where: { paymentId: payment.id, status: { not: "FAILED" } }, _sum: { amountPaise: true } }))._sum.amountPaise ?? 0;
      if (payment.status === "REFUNDED" && stillRefunded < payment.amountPaise) await tx.feePayment.update({ where: { id: payment.id }, data: { status: "PAID" } });
      await recomputeDemands(tx, [...new Set(demandIds)]);
      return { refund, payment, putBack: cuts.length > 0 };
    }),
  );
  if (!done) return "ignored";
  await forSchool(schoolId, async () => {
    await audit({ schoolId, actorUserId: null, action: "fees.refund.failed", targetType: "FeePayment", targetId: done.payment.id, meta: { refundId: done.refund.id, amountPaise: done.refund.amountPaise, gatewayRefundId, putBack: done.putBack } });
    // The office asked for it and has to pay it another way; the family was told money was coming.
    await notify({ userId: done.refund.requestedByUserId, schoolId, kind: "FEES", titleKey: "notifTitle.feeRefundFailedOffice", bodyKey: "notifBody.feeRefundFailedOffice", bodyVars: { amount: rupees(done.refund.amountPaise) }, url: "/admin/fees", urgent: true, meta: { paymentId: done.payment.id, refundId: done.refund.id } }).catch(() => {});
    await notifyGuardians(done.payment.studentMembershipId, (childName) => ({
      schoolId,
      kind: "FEES",
      titleKey: "notifTitle.feeRefundFailed",
      titleVars: { name: childName },
      bodyKey: "notifBody.feeRefundFailed",
      bodyVars: { amount: rupees(done.refund.amountPaise) },
      url: "/parent/fees",
      meta: { paymentId: done.payment.id, refundId: done.refund.id },
    }), "MONEY").catch(() => {});
  });
  return "refund-failed";
}

export async function markRefundDone(schoolId: string, gatewayRefundId: string): Promise<void> {
  await forSchool(schoolId, async () => {
    await db.feeRefund.updateMany({ where: { schoolId, gatewayRefundId, status: "REQUESTED" }, data: { status: "DONE", settledAt: new Date() } });
  });
}

/* -------------------------------------------------------------------------- */
/* Reading a payment or a receipt                                              */
/* -------------------------------------------------------------------------- */

/** For the family's poll after a checkout or a claim. Their own payments only. */
export async function familyPaymentStatus(ctx: ActiveContext, paymentId: string): Promise<{ paymentId: string; status: string; method: string; amountPaise: number; receiptId: string | null; serial: string | null; failedReason: string | null; checkout: CheckoutStart | null }> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const p = await db.feePayment.findFirst({
    where: { id: paymentId, payerUserId: ctx.user.id },
    include: { receipt: { select: { id: true, serial: true } }, school: { select: { name: true } }, student: { select: { user: { select: { name: true, preferredName: true } } } } },
  });
  if (!p) throw new AccessError("fees.notFound", "NOT_FOUND");
  // An online order still open can be picked up again — by the web page a
  // phone opened, say — so the poll carries what the checkout needs. The key
  // id only; the secret never leaves the server.
  let checkout: CheckoutStart | null = null;
  const transport = readFeesGatewayTransport();
  if (p.method === "ONLINE" && p.status === "INITIATED" && p.gatewayOrderId && transport !== "off") {
    const account = await forSchool(p.schoolId, () => db.feeGatewayAccount.findUnique({ where: { schoolId: p.schoolId }, select: { keyId: true } }));
    if (account && gatewayKeyTakesPayments(account.keyId)) {
      checkout = {
        paymentId: p.id,
        orderId: p.gatewayOrderId,
        keyId: account.keyId,
        amountPaise: p.amountPaise,
        currency: "INR",
        schoolName: p.school.name,
        pupilName: p.student.user.preferredName ?? p.student.user.name,
        payerName: ctx.user.name,
        payerEmail: ctx.user.email ?? null,
        transport,
      };
    }
  }
  return { paymentId: p.id, status: p.status, method: p.method, amountPaise: p.amountPaise, receiptId: p.receipt?.id ?? null, serial: p.receipt?.serial ?? null, failedReason: p.failedReason, checkout };
}

export type ReceiptView = { id: string; serial: string; issuedAt: Date; reversed: boolean; reversalReason: string | null; refundedPaise: number; snapshot: ReceiptSnapshot; schoolId: string };

/**
 * Who may open a receipt: the office of the school that issued it, or an
 * active guardian of the pupil it names. Anybody else — and any guessed id —
 * gets the same not-found.
 */
export async function receiptFor(ctx: ActiveContext, receiptId: string): Promise<ReceiptView | null> {
  const r = await db.feeReceipt.findUnique({ where: { id: receiptId }, include: { payment: { select: { status: true, reversalReason: true, studentMembershipId: true, refunds: { where: { status: "DONE" }, select: { amountPaise: true } } } } } });
  if (!r) return null;
  const office = (ctx.role === "ADMIN" || ctx.role === "ACCOUNTS") && ctx.schoolId === r.schoolId;
  let guardian = false;
  if (!office && ctx.role === "PARENT") {
    const link = await db.guardianship.findFirst({ where: { parentUserId: ctx.user.id, studentMembershipId: r.payment.studentMembershipId, status: "ACTIVE" }, select: { id: true } });
    // An adult college student's receipts are theirs until they grant MONEY (campaign S-2).
    guardian = Boolean(link) && (await parentMaySee(r.payment.studentMembershipId, "MONEY", ctx.user.id));
  }
  if (!office && !guardian) return null;
  return {
    id: r.id,
    serial: r.serial,
    issuedAt: r.issuedAt,
    reversed: r.payment.status === "REVERSED",
    reversalReason: r.payment.reversalReason,
    refundedPaise: r.payment.refunds.reduce((a, x) => a + x.amountPaise, 0),
    snapshot: readJson<ReceiptSnapshot>(r.snapshotJson, { school: { name: "", addressLine: null, city: null, contactPhone: null, bankNote: null }, pupil: { name: "", studentCode: null, className: null, gradeLevel: null }, payment: { amountPaise: 0, method: "", reference: null, gatewayMethod: null, paidAt: r.issuedAt.toISOString(), collectedBy: null, note: null }, year: "", lines: [], allocations: [] }),
    schoolId: r.schoolId,
  };
}

/* -------------------------------------------------------------------------- */
/* The family's page                                                           */
/* -------------------------------------------------------------------------- */

export type FamilyFees = {
  /** Every child whose money this guardian may see; one who has left the school is kept, with the day (A3-journeys-15). */
  children: { studentMembershipId: string; name: string; schoolId: string; schoolName: string; leftAt: Date | null }[];
  child: {
    studentMembershipId: string;
    name: string;
    schoolId: string;
    schoolName: string;
    year: { id: string; name: string } | null;
    options: { online: boolean; upi: { vpa: string; payee: string } | null; bankNote: string | null };
    demands: ReturnType<typeof toDemandRow>[];
    totals: { outstandingPaise: number; overduePaise: number; paidPaise: number };
    payments: { id: string; amountPaise: number; method: string; status: string; reference: string | null; paidAt: Date | null; createdAt: Date; receiptId: string | null; serial: string | null; failedReason: string | null }[];
  } | null;
};

export async function familyFees(ctx: ActiveContext, childId?: string): Promise<FamilyFees> {
  if (ctx.role !== "PARENT") throw new AccessError("fees.refuseFamily");
  const links = await db.guardianship.findMany({
    where: { parentUserId: ctx.user.id, status: "ACTIVE" },
    include: { student: { include: { user: { select: { name: true, preferredName: true } }, school: { select: { id: true, name: true, timezone: true, feeUpiId: true, feeUpiPayee: true, feeBankNote: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  // Only the children whose money this guardian may see: an adult at a college keeps their fees,
  // receipts and payments to themself until they grant MONEY (student-consent.ts; campaign S-2).
  // A child named who is not among them is refused as the ledger refuses it, never shown.
  const visible: typeof links = [];
  for (const l of links) if (await parentMaySee(l.studentMembershipId, "MONEY", ctx.user.id)) visible.push(l);
  if (childId && !visible.some((l) => l.studentMembershipId === childId) && links.some((l) => l.studentMembershipId === childId)) throw new AccessError("consent.refuseNotGranted");
  // A child who has left stays in the chooser, labelled (A3-journeys-15): what was demanded before the last day is
  // still the family's to read and to pay. Those still at school first; the first of them is the one shown.
  const children = visible
    .map((l) => ({ studentMembershipId: l.studentMembershipId, name: l.student.user.preferredName ?? l.student.user.name, schoolId: l.student.school.id, schoolName: l.student.school.name, leftAt: l.student.leftAt }))
    .sort((a, b) => Number(a.leftAt !== null) - Number(b.leftAt !== null));
  const link = visible.find((l) => l.studentMembershipId === (childId ?? children[0]?.studentMembershipId));
  if (!link) return { children, child: null };
  const school = link.student.school;
  const schoolId = school.id;
  const [year, gateway] = await Promise.all([currentAcademicYear(schoolId), readFeesGatewayTransport() === "off" ? null : db.feeGatewayAccount.findUnique({ where: { schoolId }, select: { id: true, keyId: true } })]);
  const today = todayKey(school.timezone);
  const [demands, payments] = await Promise.all([
    year ? db.feeDemand.findMany({ where: { schoolId, studentMembershipId: link.studentMembershipId, academicYearId: year.id, status: { in: ["OPEN", "PART", "PAID"] } }, orderBy: [{ dueDate: "asc" }] }) : [],
    db.feePayment.findMany({ where: { schoolId, studentMembershipId: link.studentMembershipId, status: { in: ["INITIATED", "CLAIMED", "PAID", "REVERSED", "REFUNDED", "FAILED", "UNALLOCATED"] } }, orderBy: { createdAt: "desc" }, take: 40, include: { receipt: { select: { id: true, serial: true } } } }),
  ]);
  const rows = demands.map((d) => toDemandRow(d, today));
  return {
    children,
    child: {
      studentMembershipId: link.studentMembershipId,
      name: link.student.user.preferredName ?? link.student.user.name,
      schoolId,
      schoolName: school.name,
      year: year ? { id: year.id, name: year.name } : null,
      options: { online: gateway ? gatewayKeyTakesPayments(gateway.keyId) : false, upi: school.feeUpiId && school.feeUpiPayee ? { vpa: school.feeUpiId, payee: school.feeUpiPayee } : null, bankNote: school.feeBankNote },
      demands: rows,
      totals: { outstandingPaise: rows.reduce((a, d) => a + d.outstandingPaise, 0), overduePaise: rows.filter((d) => d.overdue).reduce((a, d) => a + d.outstandingPaise, 0), paidPaise: rows.reduce((a, d) => a + d.paidPaise, 0) },
      payments: payments
        // A UPI intent the parent opened and never claimed is noise, not history.
        .filter((p) => !(p.method === "UPI" && p.status === "INITIATED"))
        .map((p) => ({ id: p.id, amountPaise: p.amountPaise, method: p.method, status: p.status, reference: p.reference, paidAt: p.paidAt, createdAt: p.createdAt, receiptId: p.receipt?.id ?? null, serial: p.receipt?.serial ?? null, failedReason: p.failedReason })),
    },
  };
}

export { dateToDay };
