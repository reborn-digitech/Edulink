/**
 * The fees ledger, end to end against the database: heads and a structure,
 * plans and the demands they generate, a concession's rounding, the counter
 * with its receipts, allocation oldest-first, the replay key, reversal and
 * refund, the online settlement door and its idempotency, the UPI claim, the
 * bank-statement matcher, reminders, the overview and dues, the exports and
 * the year-end carry-forward.
 *
 * ⚠ THE SERIAL TEST IS THE LOAD-BEARING ONE: twenty counter payments posted
 * at once must get twenty different receipt numbers. That is what the row
 * lock in issueReceipt exists for, and it can only be proven with a real
 * Postgres, which is why this file is an integration suite.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { todayKey, addDaysToKey } from "@/lib/dates";
import {
  archiveStructure,
  assignPlans,
  concessionOnLine,
  createStructure,
  getStructure,
  grantConcession,
  listHeads,
  listStructures,
  publishStructure,
  pupilLedger,
  revokeConcession,
  saveFeeSettings,
  saveGatewayAccount,
  feeSettings,
  gatewayAccountFor,
  saveHead,
  retireHead,
  unassignPlan,
  updateStructure,
} from "@/lib/fees";
import {
  claimUpiPayment,
  confirmClaim,
  familyFees,
  familyPaymentStatus,
  listClaims,
  matchBankRows,
  receiptFor,
  recordCounterPayment,
  rejectClaim,
  requestRefund,
  reversePayment,
  settleOnlinePayment,
  startOnlineCheckout,
  startUpiPayment,
  confirmOnlineCheckout,
  reconcileOnlinePayments,
} from "@/lib/fees-payments";
import { signCheckout } from "@/lib/gateway";
import { carryForward, collectionsExport, duesList, feeOverview, outstandingExport, remindNow, sendFeeReminders } from "@/lib/fees-reports";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);

let schoolId = "";
let otherSchoolId = "";
let yearId = "";
let nextYearId = "";
let classId = "";
let adminUserId = "";
let adminMembershipId = "";
let principalUserId = "";
let principalMembershipId = "";
let parentUserId = "";
let pupilA = "";
let pupilB = "";
let pupilC = "";
let tuitionId = "";
let transportId = "";
let structureId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ Fees Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const admin = () => ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" });
const principal = () => ctx({ userId: principalUserId, membershipId: principalMembershipId, schoolId, role: "PRINCIPAL" });
const parent = () => ctx({ userId: parentUserId, role: "PARENT" });

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  const school = await db.school.create({ data: { name: `ZZ Fees School ${STAMP}`, slug: `zz-fees-${STAMP}`, code: `ZFE${String(STAMP).slice(-5)}`, contactEmail: `zz-fees-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = school.id;
  const other = await db.school.create({ data: { name: `ZZ Fees Other ${STAMP}`, slug: `zz-feeso-${STAMP}`, code: `ZFO${String(STAMP).slice(-5)}`, contactEmail: `zz-feeso-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  otherSchoolId = other.id;
  const year = await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } });
  yearId = year.id;
  const next = await db.academicYear.create({ data: { schoolId, name: "2027–28", startDate: new Date("2027-06-01T00:00:00Z"), endDate: new Date("2028-04-30T00:00:00Z"), isCurrent: false }, select: { id: true } });
  nextYearId = next.id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Fees ${who}`, email: `zz-fees-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, p, par, pa, pb, pc] = await Promise.all([mk("Admin"), mk("Principal"), mk("Parent"), mk("PupilA"), mk("PupilB"), mk("PupilC")]);
  adminUserId = a.id;
  principalUserId = p.id;
  parentUserId = par.id;
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  principalMembershipId = (await db.membership.create({ data: { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }, select: { id: true } })).id;
  pupilA = (await db.membership.create({ data: { userId: pa.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFA${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  pupilB = (await db.membership.create({ data: { userId: pb.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFB${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
  pupilC = (await db.membership.create({ data: { userId: pc.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFC${STAMP}`, gradeLevel: "4" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilA, studentSchoolId: schoolId, status: "ACTIVE" } });
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Fees 3A", gradeLevel: "3", joinCode: `ZF${String(STAMP).slice(-6)}` }, select: { id: true } });
  classId = klass.id;
  await db.enrollment.createMany({ data: [pupilA, pupilB].map((id) => ({ classId, schoolId, studentMembershipId: id, status: "ACTIVE" })) });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [schoolId, otherSchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("heads and structures", () => {
  it("the office adds heads; a duplicate code is refused; a retired head leaves the picker", async () => {
    tuitionId = await saveHead(admin(), { name: "Tuition", code: "tui", kind: "TUITION", sortOrder: 0 });
    transportId = await saveHead(admin(), { name: "Transport", code: "TRN", kind: "TRANSPORT", sortOrder: 1 });
    const extra = await saveHead(admin(), { name: "Library", code: "LIB", kind: "OTHER" });
    await expect(saveHead(admin(), { name: "Again", code: "TUI", kind: "OTHER" })).rejects.toThrow("fees.refuseHeadCodeTaken");
    await expect(saveHead(principal(), { name: "X", code: "XX", kind: "OTHER" })).rejects.toThrow("fees.refuseOffice");
    await retireHead(admin(), extra);
    const heads = await listHeads(schoolId);
    expect(heads.map((h) => h.code)).toEqual(["TUI", "TRN"]);
    expect((await listHeads(schoolId, { includeRetired: true })).map((h) => h.code).sort()).toEqual(["LIB", "TRN", "TUI"]);
  });

  it("a structure is checked line by line, saved as a draft, editable, then frozen by publishing", async () => {
    const input = {
      name: "Grade 3 fees",
      gradeLevel: "3",
      instalments: [
        { label: "Term 1", dueDateKey: addDaysToKey(TODAY, -10), lines: [{ headId: tuitionId, amountPaise: 1_000_00 }, { headId: transportId, amountPaise: 300_00 }] },
        { label: "Term 2", dueDateKey: addDaysToKey(TODAY, 40), lines: [{ headId: tuitionId, amountPaise: 1_000_00 }] },
      ],
    };
    await expect(createStructure(admin(), { ...input, instalments: [] })).rejects.toThrow("fees.refuseInstalments");
    await expect(createStructure(admin(), { ...input, instalments: [{ ...input.instalments[0]!, lines: [{ headId: "nope", amountPaise: 1 }] }] })).rejects.toThrow("fees.refuseUnknownHead");
    await expect(createStructure(admin(), { ...input, instalments: [{ ...input.instalments[0]!, lines: [{ headId: tuitionId, amountPaise: 1 }, { headId: tuitionId, amountPaise: 2 }] }] })).rejects.toThrow("fees.refuseDuplicateHead");
    structureId = await createStructure(admin(), input);
    await updateStructure(admin(), structureId, { ...input, name: "Grade 3 fees 2026–27" });
    const detail = await getStructure(admin(), structureId);
    expect(detail.name).toBe("Grade 3 fees 2026–27");
    expect(detail.totalPaise).toBe(2_300_00);
    expect(detail.instalmentRows.map((i) => i.totalPaise)).toEqual([1_300_00, 1_000_00]);
    await expect(assignPlans(admin(), { structureId, classId })).rejects.toThrow("fees.refuseAssignDraft");
    await publishStructure(admin(), structureId);
    await expect(updateStructure(admin(), structureId, input)).rejects.toThrow("fees.refusePublishedEdit");
    expect((await listStructures(principal(), {})).map((s) => s.id)).toEqual([structureId]);
    await expect(getStructure(ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId: otherSchoolId, role: "ADMIN" }), structureId)).rejects.toThrow("fees.notFound");
  });
});

describe("plans and demands", () => {
  it("assigning a class generates one demand per instalment per pupil, with the lines frozen", async () => {
    const result = await assignPlans(admin(), { structureId, classId });
    expect(result).toEqual({ assigned: 2, moved: 0, unchanged: 0, refused: [] });
    const ledger = await pupilLedger(schoolId, pupilA, { todayKey: TODAY });
    expect(ledger.plan?.structureId).toBe(structureId);
    expect(ledger.demands.map((d) => [d.label, d.netPaise, d.status, d.overdue])).toEqual([
      ["Term 1", 1_300_00, "OPEN", true],
      ["Term 2", 1_000_00, "OPEN", false],
    ]);
    expect(ledger.demands[0]!.lines.map((l) => l.code)).toEqual(["TUI", "TRN"]);
    expect(ledger.totals).toEqual({ netPaise: 2_300_00, paidPaise: 0, outstandingPaise: 2_300_00, overduePaise: 1_300_00 });
    // A second assignment of the same class is a no-op that counts as unchanged.
    expect(await assignPlans(admin(), { structureId, classId })).toEqual({ assigned: 0, moved: 0, unchanged: 2, refused: [] });
  });

  it("a concession is applied per line, rounded half up, and revoking it restores the gross", async () => {
    expect(concessionOnLine(1_000_00, "h", [{ headId: null, kind: "PERCENT", value: 1250 }])).toBe(12_500);
    expect(concessionOnLine(333, "h", [{ headId: null, kind: "PERCENT", value: 5000 }])).toBe(167);
    expect(concessionOnLine(100, "h", [{ headId: null, kind: "AMOUNT", value: 500 }])).toBe(100);
    expect(concessionOnLine(100, "h", [{ headId: "other", kind: "PERCENT", value: 10000 }])).toBe(0);
    const id = await grantConcession(admin(), { studentMembershipId: pupilB, headId: tuitionId, kind: "PERCENT", value: 2500, reason: "Sibling" });
    let ledger = await pupilLedger(schoolId, pupilB, { todayKey: TODAY });
    expect(ledger.demands.map((d) => [d.grossPaise, d.concessionPaise, d.netPaise])).toEqual([
      [1_300_00, 250_00, 1_050_00],
      [1_000_00, 250_00, 750_00],
    ]);
    expect(ledger.concessions[0]!.headName).toBe("Tuition");
    await revokeConcession(admin(), id);
    ledger = await pupilLedger(schoolId, pupilB, { todayKey: TODAY });
    expect(ledger.demands.map((d) => d.netPaise)).toEqual([1_300_00, 1_000_00]);
    await expect(grantConcession(admin(), { studentMembershipId: pupilB, headId: null, kind: "PERCENT", value: 20000, reason: "Too much" })).rejects.toThrow("fees.refusePercent");
  });

  it("a pupil with nothing paid can be taken off the plan, and their untouched demands go with them", async () => {
    await assignPlans(admin(), { structureId, studentMembershipIds: [pupilC] });
    expect((await pupilLedger(schoolId, pupilC, { todayKey: TODAY })).demands).toHaveLength(2);
    await unassignPlan(admin(), pupilC, yearId);
    const after = await pupilLedger(schoolId, pupilC, { todayKey: TODAY });
    expect(after.plan).toBeNull();
    expect(after.demands).toHaveLength(0);
  });
});

describe("the counter", () => {
  it("records a cash payment, allocates oldest-due-first, numbers the receipt and tells the family", async () => {
    await expect(recordCounterPayment(admin(), { studentMembershipId: pupilA, amountPaise: 3_000_00, method: "CASH" })).rejects.toThrow("fees.refuseOverpayment");
    await expect(recordCounterPayment(admin(), { studentMembershipId: pupilA, amountPaise: 500_00, method: "CHEQUE" })).rejects.toThrow("fees.refuseReference");
    const first = await recordCounterPayment(admin(), { studentMembershipId: pupilA, amountPaise: 1_500_00, method: "CASH", clientId: `c1-${STAMP}`, note: "At the counter" });
    expect(first.serial).toBe("RCPT/2026–27/000001");
    expect(first.already).toBe(false);
    const replay = await recordCounterPayment(admin(), { studentMembershipId: pupilA, amountPaise: 1_500_00, method: "CASH", clientId: `c1-${STAMP}` });
    expect(replay).toEqual({ ...first, already: true });
    const ledger = await pupilLedger(schoolId, pupilA, { todayKey: TODAY });
    expect(ledger.demands.map((d) => [d.paidPaise, d.status])).toEqual([
      [1_300_00, "PAID"],
      [200_00, "PART"],
    ]);
    expect(ledger.payments[0]!.receipt?.serial).toBe("RCPT/2026–27/000001");
    const receipt = await receiptFor(admin(), first.receiptId);
    expect(receipt?.snapshot.allocations).toEqual([
      { demandLabel: "Term 1", amountPaise: 1_300_00 },
      { demandLabel: "Term 2", amountPaise: 200_00 },
    ]);
    expect(receipt!.snapshot.lines.reduce((a, l) => a + l.amountPaise, 0)).toBe(1_500_00);
    expect(receipt!.snapshot.school.name).toContain("ZZ Fees School");
    // The family may read it; a stranger and the head may not.
    expect(await receiptFor(parent(), first.receiptId)).not.toBeNull();
    expect(await receiptFor(principal(), first.receiptId)).toBeNull();
    expect(await db.notification.count({ where: { userId: parentUserId, kind: "FEES", title: { contains: "Payment received" } } })).toBe(1);
  });

  it("⚠ twenty payments at once get twenty different serials", async () => {
    // Pupil B owes 2,300; twenty payments of ₹10 fit easily.
    const results = await Promise.all(Array.from({ length: 20 }, (_, i) => recordCounterPayment(admin(), { studentMembershipId: pupilB, amountPaise: 10_00, method: "CASH", clientId: `par-${i}-${STAMP}` })));
    const serials = results.map((r) => r.serial);
    expect(new Set(serials).size).toBe(20);
    const numbers = serials.map((s) => Number(s.split("/").pop())).sort((a, b) => a - b);
    expect(numbers[0]).toBe(2);
    expect(numbers[19]).toBe(21);
    const ledger = await pupilLedger(schoolId, pupilB, { todayKey: TODAY });
    expect(ledger.totals.paidPaise).toBe(200_00);
  });

  it("reversing keeps the row and reopens the demands; a refund reopens by its amount", async () => {
    const pay = await recordCounterPayment(admin(), { studentMembershipId: pupilB, amountPaise: 100_00, method: "BANK", reference: "NEFT123456789012" });
    await expect(reversePayment(admin(), pay.paymentId, "no")).rejects.toThrow("fees.refuseReason");
    await reversePayment(admin(), pay.paymentId, "Entered against the wrong child");
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: pay.paymentId } });
    expect(row.status).toBe("REVERSED");
    expect(row.reversalReason).toBe("Entered against the wrong child");
    expect((await pupilLedger(schoolId, pupilB, { todayKey: TODAY })).totals.paidPaise).toBe(200_00);
    const receipt = await receiptFor(admin(), pay.receiptId);
    expect(receipt?.reversed).toBe(true);
    await expect(reversePayment(admin(), pay.paymentId, "Again")).rejects.toThrow("fees.refuseNotPaid");

    const paid = await recordCounterPayment(admin(), { studentMembershipId: pupilB, amountPaise: 100_00, method: "CASH" });
    await expect(requestRefund(admin(), { paymentId: paid.paymentId, amountPaise: 200_00, reason: "Too much" })).rejects.toThrow("fees.refuseRefundTooMuch");
    const refund = await requestRefund(admin(), { paymentId: paid.paymentId, amountPaise: 40_00, reason: "Overcharged transport" });
    expect(refund.status).toBe("DONE");
    expect((await pupilLedger(schoolId, pupilB, { todayKey: TODAY })).totals.paidPaise).toBe(260_00);
    expect((await receiptFor(admin(), paid.receiptId))?.refundedPaise).toBe(40_00);
  });
});

describe("online — the school's own gateway", () => {
  it("without a gateway account the family cannot check out; with one, the order is theirs and settles once", async () => {
    const fam = await familyFees(parent());
    expect(fam.child?.options.online).toBe(false);
    const open = fam.child!.demands.filter((d) => d.outstandingPaise > 0).map((d) => d.id);
    await expect(startOnlineCheckout(parent(), { studentMembershipId: pupilA, demandIds: open })).rejects.toThrow("fees.refuseNoGateway");
    await expect(saveGatewayAccount(admin(), { keyId: "nope", secret: "12345678", webhookSecret: "12345678", mode: "TEST" })).rejects.toThrow("fees.refuseKeyId");
    await saveGatewayAccount(admin(), { keyId: "rzp_test_zzfees0001", secret: "zz-key-secret-1", webhookSecret: "zz-webhook-secret-1", mode: "TEST" });
    const settings = await feeSettings(schoolId);
    expect(settings.gateway?.keyId).toBe("rzp_test_zzfees0001");
    const account = await gatewayAccountFor(schoolId);
    expect(account?.secret).toBe("zz-key-secret-1");
    expect((await db.feeGatewayAccount.findUniqueOrThrow({ where: { schoolId } })).secretEnc).not.toContain("zz-key-secret");

    const start = await startOnlineCheckout(parent(), { studentMembershipId: pupilA, demandIds: open });
    expect(start.amountPaise).toBe(800_00);
    expect(start.keyId).toBe("rzp_test_zzfees0001");
    expect(start.transport).toBe("devbox");
    expect(start.orderId).toMatch(/^order_devbox/);
    expect((await familyPaymentStatus(parent(), start.paymentId)).status).toBe("INITIATED");

    // A wrong amount from the gateway is refused and left for the office.
    expect((await settleOnlinePayment(schoolId, { orderId: start.orderId, gatewayPaymentId: "pay_zz1", amountPaise: 700_00 })).outcome).toBe("amount-mismatch");
    expect((await settleOnlinePayment(schoolId, { orderId: "order_unknown", gatewayPaymentId: "pay_zz1", amountPaise: 800_00 })).outcome).toBe("unknown-order");
    // The checkout's own confirm, signed with the key secret.
    const bad = confirmOnlineCheckout(parent(), { paymentId: start.paymentId, gatewayPaymentId: "pay_zz1", signature: "0".repeat(64) });
    await expect(bad).rejects.toThrow("fees.refuseBadSignature");
    const confirmed = await confirmOnlineCheckout(parent(), { paymentId: start.paymentId, gatewayPaymentId: "pay_zz1", signature: signCheckout("zz-key-secret-1", start.orderId, "pay_zz1") });
    expect(confirmed.outcome).toBe("settled");
    expect(confirmed.receiptId).toBeTruthy();
    // The webhook arriving second is told "already".
    expect((await settleOnlinePayment(schoolId, { orderId: start.orderId, gatewayPaymentId: "pay_zz1", amountPaise: 800_00 })).outcome).toBe("already");
    const status = await familyPaymentStatus(parent(), start.paymentId);
    expect(status.status).toBe("PAID");
    expect(status.serial).toMatch(/^RCPT\/2026–27\/0000\d\d$/);
    expect((await pupilLedger(schoolId, pupilA, { todayKey: TODAY })).totals.outstandingPaise).toBe(0);
    // An online refund goes through the (devbox) gateway.
    const refund = await requestRefund(admin(), { paymentId: start.paymentId, amountPaise: 100_00, reason: "Charged twice" });
    expect(refund.status).toBe("DONE");
    expect((await db.feeRefund.findUniqueOrThrow({ where: { id: refund.refundId } })).gatewayRefundId).toMatch(/^rfnd_devbox/);
  });

  it("the reconcile job closes a day-old order nobody paid", async () => {
    const payment = await db.feePayment.create({ data: { schoolId, studentMembershipId: pupilA, amountPaise: 100_00, method: "ONLINE", status: "INITIATED", gatewayOrderId: `order_devboxstale${STAMP}`, payerUserId: parentUserId, createdAt: new Date(Date.now() - 26 * 3_600_000) }, select: { id: true } });
    const report = await reconcileOnlinePayments();
    expect(report.perSchool[schoolId]?.expired).toBe(1);
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: payment.id } })).status).toBe("FAILED");
  });
});

describe("UPI to the school's own id", () => {
  it("a parent gets an intent link, claims with a UTR, the office sees it, matches the statement and confirms", async () => {
    await expect(startUpiPayment(parent(), { studentMembershipId: pupilA, demandIds: ["x"] })).rejects.toThrow("fees.refuseDemandsChanged");
    await expect(saveFeeSettings(admin(), { upiId: "not-an-id", upiPayee: "X" })).rejects.toThrow("fees.refuseUpiId");
    await saveFeeSettings(admin(), { upiId: "zzfees@okaxis", upiPayee: "ZZ Fees School", receiptPrefix: "rcpt", bankNote: "A/c 1234" });
    // Give pupil A something to pay: a fresh structure line via a new demand.
    await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilA, academicYearId: yearId, label: "Bus pass", dueDate: new Date(`${TODAY}T00:00:00.000Z`), grossPaise: 250_00, netPaise: 250_00, status: "OPEN" } });
    const fam = await familyFees(parent());
    expect(fam.child?.options.upi).toEqual({ vpa: "zzfees@okaxis", payee: "ZZ Fees School" });
    const due = fam.child!.demands.filter((d) => d.label === "Bus pass").map((d) => d.id);
    const start = await startUpiPayment(parent(), { studentMembershipId: pupilA, demandIds: due });
    expect(start.link).toContain("pa=zzfees%40okaxis");
    expect(start.amountPaise).toBe(250_00);
    await expect(claimUpiPayment(parent(), { paymentId: start.paymentId, utr: "short" })).rejects.toThrow("fees.refuseUtr");
    await claimUpiPayment(parent(), { paymentId: start.paymentId, utr: "utr123456789012" });
    expect(await db.notification.count({ where: { userId: adminUserId, kind: "FEES" } })).toBe(1);
    const claims = await listClaims(admin(), TODAY);
    expect(claims.claims.map((c) => [c.utr, c.amountPaise, c.stale])).toEqual([["UTR123456789012", 250_00, false]]);
    // Another family cannot reuse the UTR.
    const again = await startUpiPayment(parent(), { studentMembershipId: pupilA, demandIds: due });
    await expect(claimUpiPayment(parent(), { paymentId: again.paymentId, utr: "UTR123456789012" })).rejects.toThrow("fees.refuseUtrUsed");
    const match = await matchBankRows(admin(), "Date,Ref No,Credit\n2026-09-17,UTR123456789012,250.00\n2026-09-17,UTR000000000001,10.00\n2026-09-17,,5\n");
    expect(match.matches.map((m) => m.problem)).toEqual([null, "no-claim", "no-utr"]);
    expect(match.matches[0]!.paymentId).toBe(start.paymentId);
    const confirmed = await confirmClaim(admin(), start.paymentId);
    expect(confirmed.serial).toMatch(/^RCPT\/2026–27\//);
    expect((await familyPaymentStatus(parent(), start.paymentId)).status).toBe("PAID");
    await expect(confirmClaim(admin(), start.paymentId)).rejects.toThrow("fees.refuseNotClaimed");
    await rejectClaim(admin(), again.paymentId, "Not on the statement");
    expect((await familyPaymentStatus(parent(), again.paymentId)).status).toBe("FAILED");
  });
});

describe("reading and reminding", () => {
  it("the overview and the dues list agree with the ledger, and the head may read both", async () => {
    const o = await feeOverview(principal());
    expect(o.year?.id).toBe(yearId);
    expect(o.pupils.onPlan).toBe(2);
    expect(o.pupils.withoutPlan).toBe(1);
    expect(o.options).toEqual({ online: true, upi: true });
    expect(o.totals.demandedPaise).toBe(o.totals.collectedPaise + o.totals.outstandingPaise);
    expect(o.byGrade.map((g) => g.gradeLevel)).toEqual(["3"]);
    const dues = await duesList(principal(), { status: "all" });
    expect(dues.rows).toHaveLength(3);
    const overdue = await duesList(admin(), { status: "overdue" });
    expect(overdue.rows.map((r) => r.studentMembershipId)).toEqual([pupilB]);
    const search = await duesList(admin(), { q: `ZFA${STAMP}` });
    expect(search.rows.map((r) => r.studentMembershipId)).toEqual([pupilA]);
    await expect(duesList(ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "TEACHER" }), {})).rejects.toThrow("fees.refuseOffice");
  });

  it("the exports carry one row per payment and per outstanding pupil", async () => {
    const collections = await collectionsExport(admin(), { fromKey: addDaysToKey(TODAY, -1), toKey: TODAY });
    expect(collections.csv.split(/\r?\n/)[0]).toBe("date,receipt,pupil,code,class,grade,method,reference,amount,status,refunded,collectedBy,note");
    expect(collections.csv.split(/\r?\n/).filter(Boolean).length - 1).toBeGreaterThanOrEqual(24);
    const outstanding = await outstandingExport(admin());
    expect(outstanding.csv.split(/\r?\n/).filter(Boolean).length - 1).toBe(2);
    expect(outstanding.csv).toContain(`ZFB${STAMP}`);
  });

  it("the daily job reminds once per bucket, and the office can remind everyone overdue now", async () => {
    // Pupil B's Term 1 is ten days overdue: no bucket today. Term 2 is forty days out: no bucket. So nothing.
    const first = await sendFeeReminders();
    expect(first.perSchool[schoolId]).toBeUndefined();
    // Move Term 1's due date to a week ago: the D+7 bucket fires once.
    const term1 = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: pupilB, label: "Term 1" } });
    await db.feeDemand.update({ where: { id: term1.id }, data: { dueDate: new Date(`${addDaysToKey(TODAY, -7)}T00:00:00.000Z` ) } });
    const second = await sendFeeReminders();
    expect(second.perSchool[schoolId]?.reminders).toBe(1);
    const third = await sendFeeReminders();
    expect(third.perSchool[schoolId]).toBeUndefined();
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: term1.id } })).lastReminderKey).toBe(`D+7:${TODAY}`);
    const now = await remindNow(admin(), {});
    expect(now).toEqual({ families: 1, demands: 1 });
  });

  it("carrying forward moves what is owed into an opening balance in the next year", async () => {
    await expect(carryForward(admin(), { fromYearId: yearId, toYearId: yearId })).rejects.toThrow("fees.refuseYearSame");
    await expect(carryForward(admin(), { fromYearId: nextYearId, toYearId: yearId })).rejects.toThrow("fees.refuseYearOrder");
    const before = await pupilLedger(schoolId, pupilB, { todayKey: TODAY });
    const owed = before.totals.outstandingPaise;
    // Pupil A owes the ₹100 the online refund reopened.
    const owedA = (await pupilLedger(schoolId, pupilA, { todayKey: TODAY })).totals.outstandingPaise;
    expect(owed).toBeGreaterThan(0);
    expect(owedA).toBe(100_00);
    const result = await carryForward(admin(), { fromYearId: yearId, toYearId: nextYearId });
    expect(result).toEqual({ pupils: 2, carriedPaise: owed + owedA });
    const old = await pupilLedger(schoolId, pupilB, { todayKey: TODAY, academicYearId: yearId });
    expect(old.totals.outstandingPaise).toBe(0);
    expect(old.demands.every((d) => d.status === "CARRIED" || d.status === "PAID")).toBe(true);
    const next = await pupilLedger(schoolId, pupilB, { todayKey: TODAY, academicYearId: nextYearId });
    expect(next.demands.map((d) => [d.label, d.netPaise, d.dueDateKey])).toEqual([["Opening balance 2026–27", owed, "2027-06-01"]]);
    expect(await carryForward(admin(), { fromYearId: yearId, toYearId: nextYearId })).toEqual({ pupils: 0, carriedPaise: 0 });
  });

  it("archiving hides a structure from the list but keeps the plans", async () => {
    await archiveStructure(admin(), structureId);
    expect(await listStructures(admin(), {})).toEqual([]);
    expect((await listStructures(admin(), { includeArchived: true })).map((s) => s.pupils)).toEqual([2]);
    await expect(assignPlans(admin(), { structureId, classId })).rejects.toThrow("fees.refuseArchived");
  });
});
