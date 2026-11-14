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
  classFeeRoster,
  concessionOnInstalment,
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
    // Was `headId: null` → 100: a flat amount on all heads is no longer a line's to take (it is
    // the instalment's, once — see concessionOnInstalment below); an amount on THIS head still is.
    expect(concessionOnLine(100, "h", [{ headId: "h", kind: "AMOUNT", value: 500 }])).toBe(100);
    expect(concessionOnLine(100, "h", [{ headId: null, kind: "AMOUNT", value: 500 }])).toBe(0);
    expect(concessionOnLine(100, "h", [{ headId: "other", kind: "PERCENT", value: 10000 }])).toBe(0);
    // A flat all-heads amount: once per instalment, pro rata by line, the last line takes the
    // remainder, capped at the instalment's gross; a percentage stays per line beside it.
    const two = [{ headId: "a", grossPaise: 1_000_00 }, { headId: "b", grossPaise: 300_00 }];
    expect(concessionOnInstalment(two, [{ headId: null, kind: "AMOUNT", value: 500_00 }])).toEqual([384_62, 115_38]);
    expect(concessionOnInstalment(two, [{ headId: null, kind: "AMOUNT", value: 5_000_00 }])).toEqual([1_000_00, 300_00]);
    expect(concessionOnInstalment(two, [{ headId: null, kind: "AMOUNT", value: 100_00 }, { headId: null, kind: "PERCENT", value: 5000 }])).toEqual([500_00 + 76_92, 150_00 + 23_08]);
    expect(concessionOnInstalment(two, [{ headId: "b", kind: "AMOUNT", value: 400_00 }])).toEqual([0, 300_00]);
    // A line already at its cap cannot hold its share: the remainder moves to a line with room.
    expect(concessionOnInstalment(two, [{ headId: "b", kind: "PERCENT", value: 10000 }, { headId: null, kind: "AMOUNT", value: 500_00 }])).toEqual([500_00, 300_00]);
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
    // The receipt's "Admission no." is the register number from the pupil record, not the student code (A3-journeys-26).
    await db.pupilRecord.upsert({ where: { studentMembershipId: pupilA }, update: { admissionNumber: "ZZ-GR-0042" }, create: { schoolId, studentMembershipId: pupilA, admissionNumber: "ZZ-GR-0042" } });
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
    expect(receipt!.snapshot.pupil.admissionNumber).toBe("ZZ-GR-0042");
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
    // Scoped to this suite's school: the job also closes old unclaimed UPI intents (TA-449), and the dev database's are not this suite's.
    const report = await reconcileOnlinePayments(new Date(), { schoolIds: [schoolId] });
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
    // The claim's own notice, once (the office's other FEES notices, such as the amount mismatch above, TA-524, are not this one).
    expect(await db.notification.count({ where: { userId: adminUserId, kind: "FEES", titleKey: "notifTitle.feeClaimWaiting" } })).toBe(1);
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

/**
 * The data audit's fees items (docs/data-audit/README.md 14, 16, 17, 20), on a
 * fourth pupil and a second structure so the ledgers above keep their numbers.
 */
describe("the audit's corrections", () => {
  let pupilD = "";
  let auditStructureId = "";

  it("a 100 % concession writes the demand PAID with nothing owed, and revoking it reopens it at the full net", async () => {
    const pd = await db.user.create({ data: { name: "ZZ Fees PupilD", email: `zz-fees-pupild-${STAMP}@test.invalid` }, select: { id: true } });
    pupilD = (await db.membership.create({ data: { userId: pd.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFD${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
    auditStructureId = await createStructure(admin(), {
      name: "Grade 3 fees (audit)",
      gradeLevel: "3",
      instalments: [
        { label: "Term 1", dueDateKey: addDaysToKey(TODAY, -10), lines: [{ headId: tuitionId, amountPaise: 1_000_00 }, { headId: transportId, amountPaise: 300_00 }] },
        { label: "Term 2", dueDateKey: addDaysToKey(TODAY, 40), lines: [{ headId: tuitionId, amountPaise: 1_000_00 }, { headId: transportId, amountPaise: 200_00 }] },
      ],
    });
    await publishStructure(admin(), auditStructureId);
    expect(await assignPlans(admin(), { structureId: auditStructureId, studentMembershipIds: [pupilD] })).toEqual({ assigned: 1, moved: 0, unchanged: 0, refused: [] });
    const full = await grantConcession(admin(), { studentMembershipId: pupilD, headId: null, kind: "PERCENT", value: 10000, reason: "Staff child" });
    let ledger = await pupilLedger(schoolId, pupilD, { todayKey: TODAY });
    expect(ledger.demands.map((d) => [d.netPaise, d.paidPaise, d.status, d.outstandingPaise])).toEqual([
      [0, 0, "PAID", 0],
      [0, 0, "PAID", 0],
    ]);
    expect(ledger.totals).toEqual({ netPaise: 0, paidPaise: 0, outstandingPaise: 0, overduePaise: 0 });
    // Nobody paid these: revoking the concession must reopen them, not leave two PAID rows for ₹0.
    await revokeConcession(admin(), full);
    ledger = await pupilLedger(schoolId, pupilD, { todayKey: TODAY });
    expect(ledger.demands.map((d) => [d.netPaise, d.concessionPaise, d.status, d.overdue])).toEqual([
      [1_300_00, 0, "OPEN", true],
      [1_200_00, 0, "OPEN", false],
    ]);
    expect(ledger.totals).toEqual({ netPaise: 2_500_00, paidPaise: 0, outstandingPaise: 2_500_00, overduePaise: 1_300_00 });
  });

  it("a flat concession on all heads comes off each instalment once, spread across its lines", async () => {
    const flat = await grantConcession(admin(), { studentMembershipId: pupilD, headId: null, kind: "AMOUNT", value: 500_00, reason: "Hardship" });
    let ledger = await pupilLedger(schoolId, pupilD, { todayKey: TODAY });
    // ₹500 off a term, not ₹500 off every line of every term (which was ₹2,000 across the year).
    expect(ledger.demands.map((d) => [d.grossPaise, d.concessionPaise, d.netPaise])).toEqual([
      [1_300_00, 500_00, 800_00],
      [1_200_00, 500_00, 700_00],
    ]);
    expect(ledger.demands[0]!.lines.map((l) => [l.code, l.concessionPaise])).toEqual([["TUI", 384_62], ["TRN", 115_38]]);
    expect(ledger.demands[1]!.lines.map((l) => [l.code, l.concessionPaise])).toEqual([["TUI", 416_67], ["TRN", 83_33]]);
    await revokeConcession(admin(), flat);
    ledger = await pupilLedger(schoolId, pupilD, { todayKey: TODAY });
    expect(ledger.demands.map((d) => d.netPaise)).toEqual([1_300_00, 1_200_00]);
  });

  it("after a carry-forward the old year's net leaves the carried demands out, but the money paid on them stays in its paid total", async () => {
    const part = await recordCounterPayment(admin(), { studentMembershipId: pupilD, amountPaise: 300_00, method: "CASH" });
    expect(part.serial).toMatch(/^RCPT\/2026–27\//);
    const before = await pupilLedger(schoolId, pupilD, { todayKey: TODAY });
    expect(before.totals).toEqual({ netPaise: 2_500_00, paidPaise: 300_00, outstandingPaise: 2_200_00, overduePaise: 1_000_00 });
    expect(await carryForward(admin(), { fromYearId: yearId, toYearId: nextYearId })).toEqual({ pupils: 1, carriedPaise: 2_200_00 });
    const old = await pupilLedger(schoolId, pupilD, { todayKey: TODAY, academicYearId: yearId });
    expect(old.demands.map((d) => [d.status, d.paidPaise])).toEqual([["CARRIED", 300_00], ["CARRIED", 0]]);
    // Both rows are CARRIED, so net is 0 — but the ₹300 was received this year, against this year's receipt, and stays this year's paid.
    expect(old.totals).toEqual({ netPaise: 0, paidPaise: 300_00, outstandingPaise: 0, overduePaise: 0 });
    const next = await pupilLedger(schoolId, pupilD, { todayKey: TODAY, academicYearId: nextYearId });
    expect(next.demands.map((d) => [d.label, d.netPaise, d.status])).toEqual([["Opening balance 2026–27", 2_200_00, "OPEN"]]);
    // A partly paid demand still has its payment in the ledger's payments list.
    expect(old.payments.map((p) => p.amountPaise)).toEqual([300_00]);
  });

  it("a payment allocated across two years is receipted in the earlier year's series", async () => {
    // A straggler in this year, created AFTER next year's opening balance so insertion order would pick the later year.
    const straggler = await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilD, academicYearId: yearId, label: "Lab deposit", dueDate: new Date(`${TODAY}T00:00:00.000Z`), grossPaise: 100_00, netPaise: 100_00, status: "OPEN" }, select: { id: true } });
    const opening = await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: pupilD, academicYearId: nextYearId, status: "OPEN" }, select: { id: true } });
    // Named later-year-first on purpose: the order the caller names them in must not choose the series either.
    const pay = await recordCounterPayment(admin(), { studentMembershipId: pupilD, amountPaise: 2_300_00, method: "CASH", demandIds: [opening.id, straggler.id] });
    expect(pay.serial).toMatch(/^RCPT\/2026–27\//);
    const receipt = await receiptFor(admin(), pay.receiptId);
    expect(receipt?.snapshot.year).toBe("2026–27");
    expect(receipt?.snapshot.allocations).toEqual([
      { demandLabel: "Lab deposit", amountPaise: 100_00 },
      { demandLabel: "Opening balance 2026–27", amountPaise: 2_200_00 },
    ]);
    expect((await db.feeReceipt.findFirstOrThrow({ where: { paymentId: pay.paymentId }, select: { academicYearId: true } })).academicYearId).toBe(yearId);
    expect((await pupilLedger(schoolId, pupilD, { todayKey: TODAY, academicYearId: nextYearId })).totals).toEqual({ netPaise: 2_200_00, paidPaise: 2_200_00, outstandingPaise: 0, overduePaise: 0 });
  });
});

/**
 * One definition of outstanding, everywhere (docs/data-audit/README.md §7,
 * 12–14 and the UTC list): per demand, never netted across a pupil's
 * demands; leavers stay on the office's lists but get no text; a carried
 * demand keeps its paid money in its own year; the collections range and
 * its date column are in the school's zone.
 */
describe("one definition of outstanding", () => {
  let leaver = "";
  let leaverParentId = "";
  let overpaid = "";
  let behind = "";
  let behindParentId = "";
  const K = "2026-08-01";

  it("a pupil who has left with an OPEN demand is on the dues list flagged left, in the CSV and in the overview's outstanding, with the same figure", async () => {
    const [lu, lp] = await Promise.all([db.user.create({ data: { name: "ZZ Fees Leaver", email: `zz-fees-leaver-${STAMP}@test.invalid` }, select: { id: true } }), db.user.create({ data: { name: "ZZ Fees LeaverParent", email: `zz-fees-leaverparent-${STAMP}@test.invalid` }, select: { id: true } })]);
    leaverParentId = lp.id;
    leaver = (await db.membership.create({ data: { userId: lu.id, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: new Date(), studentCode: `ZFL${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
    await db.guardianship.create({ data: { parentUserId: leaverParentId, studentMembershipId: leaver, studentSchoolId: schoolId, status: "ACTIVE" } });
    // Due a week ago: the D+7 bucket would fire for a pupil on the roll.
    await db.feeDemand.create({ data: { schoolId, studentMembershipId: leaver, academicYearId: yearId, label: "Term 1", dueDate: new Date(`${addDaysToKey(TODAY, -7)}T00:00:00.000Z`), grossPaise: 500_00, netPaise: 500_00, status: "OPEN" } });
    const open = await duesList(admin(), { status: "open" });
    const row = open.rows.find((r) => r.studentMembershipId === leaver);
    expect(row).toMatchObject({ left: true, outstandingPaise: 500_00, overduePaise: 500_00, hasPlan: false });
    expect(open.rows.filter((r) => r.left).map((r) => r.studentMembershipId)).toEqual([leaver]);
    const all = await duesList(admin(), { status: "all", pageSize: 200 });
    const overview = await feeOverview(admin());
    expect(overview.totals.outstandingPaise).toBe(all.rows.reduce((a, r) => a + r.outstandingPaise, 0));
    expect(overview.totals.overduePaise).toBe(all.rows.reduce((a, r) => a + r.overduePaise, 0));
    const csv = (await outstandingExport(admin())).csv.split(/\r?\n/);
    expect(csv[0]).toBe("pupil,code,class,grade,due,paid,outstanding,overdue,nextDue,left");
    expect(csv.find((l) => l.includes(`ZFL${STAMP}`))).toMatch(/,500\.00,0\.00,500\.00,500\.00,\d{4}-\d{2}-\d{2},yes$/);
    expect(csv.filter((l) => l.endsWith(",yes"))).toHaveLength(1);
  });

  it("an overpaid demand beside an open one gives the open one's balance on the dues row, the ledger, the roster and the overview alike", async () => {
    const ou = await db.user.create({ data: { name: "ZZ Fees Overpaid", email: `zz-fees-overpaid-${STAMP}@test.invalid` }, select: { id: true } });
    overpaid = (await db.membership.create({ data: { userId: ou.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFO${STAMP}`, gradeLevel: "3" }, select: { id: true } })).id;
    await db.enrollment.create({ data: { classId, schoolId, studentMembershipId: overpaid, status: "ACTIVE" } });
    const due = new Date(`${addDaysToKey(TODAY, 3)}T00:00:00.000Z`);
    await db.feeDemand.createMany({
      data: [
        { schoolId, studentMembershipId: overpaid, academicYearId: yearId, label: "Term 1", dueDate: due, grossPaise: 1_000_00, netPaise: 1_000_00, paidPaise: 1_500_00, status: "PAID" },
        { schoolId, studentMembershipId: overpaid, academicYearId: yearId, label: "Term 2", dueDate: due, grossPaise: 700_00, netPaise: 700_00, status: "OPEN" },
      ],
    });
    const before = (await feeOverview(admin())).totals.outstandingPaise;
    const dues = await duesList(admin(), { q: `ZFO${STAMP}` });
    // Netted across the pupil this would read ₹200; it is Term 2's ₹700.
    expect(dues.rows.map((r) => [r.netPaise, r.paidPaise, r.outstandingPaise, r.overduePaise, r.left])).toEqual([[1_700_00, 1_500_00, 700_00, 0, false]]);
    expect((await pupilLedger(schoolId, overpaid, { todayKey: TODAY })).totals).toEqual({ netPaise: 1_700_00, paidPaise: 1_500_00, outstandingPaise: 700_00, overduePaise: 0 });
    const roster = await classFeeRoster(admin(), classId, TODAY);
    expect(roster.pupils.find((p) => p.studentMembershipId === overpaid)).toMatchObject({ netPaise: 1_700_00, paidPaise: 1_500_00, outstandingPaise: 700_00, overduePaise: 0 });
    const all = await duesList(admin(), { status: "all", pageSize: 200 });
    const overview = await feeOverview(admin());
    expect(overview.totals.outstandingPaise).toBe(before);
    expect(overview.totals.outstandingPaise).toBe(all.rows.reduce((a, r) => a + r.outstandingPaise, 0));
  });

  it("a PART demand carried forward keeps its ₹400 in its own year's paid total, and the opening balance is the ₹600", async () => {
    const y1 = await db.academicYear.create({ data: { schoolId, name: "2024–25", startDate: new Date("2024-06-01T00:00:00Z"), endDate: new Date("2025-04-30T00:00:00Z"), isCurrent: false }, select: { id: true } });
    const y2 = await db.academicYear.create({ data: { schoolId, name: "2025–26", startDate: new Date("2025-06-01T00:00:00Z"), endDate: new Date("2026-04-30T00:00:00Z"), isCurrent: false }, select: { id: true } });
    await db.feeDemand.create({ data: { schoolId, studentMembershipId: overpaid, academicYearId: y1.id, label: "Term 1", dueDate: new Date("2024-07-01T00:00:00Z"), grossPaise: 1_000_00, netPaise: 1_000_00, paidPaise: 400_00, status: "PART" } });
    expect(await carryForward(admin(), { fromYearId: y1.id, toYearId: y2.id })).toEqual({ pupils: 1, carriedPaise: 600_00 });
    const old = await pupilLedger(schoolId, overpaid, { todayKey: TODAY, academicYearId: y1.id });
    const next = await pupilLedger(schoolId, overpaid, { todayKey: TODAY, academicYearId: y2.id });
    expect(old.totals).toEqual({ netPaise: 0, paidPaise: 400_00, outstandingPaise: 0, overduePaise: 0 });
    expect(next.demands.map((d) => [d.label, d.netPaise, d.paidPaise, d.outstandingPaise, d.status])).toEqual([["Opening balance 2024–25", 600_00, 0, 600_00, "OPEN"]]);
    expect(old.totals.paidPaise + next.totals.paidPaise).toBe(400_00);
    // The current year's overview does the same for its own carried rows: what pupils A and D paid before the carry is still collected.
    const carried = await db.feeDemand.findMany({ where: { schoolId, academicYearId: yearId, status: "CARRIED" }, select: { paidPaise: true } });
    const carriedPaid = carried.reduce((a, d) => a + d.paidPaise, 0);
    expect(carriedPaid).toBeGreaterThanOrEqual(300_00);
    const live = await db.feeDemand.findMany({ where: { schoolId, academicYearId: yearId, status: { in: ["OPEN", "PART", "PAID"] } }, select: { paidPaise: true } });
    expect((await feeOverview(admin())).totals.collectedPaise).toBe(live.reduce((a, d) => a + d.paidPaise, 0) + carriedPaid);
  });

  it("the texts go to the roll only, and remind-now quotes the whole overdue total", async () => {
    const [bu, bp] = await Promise.all([db.user.create({ data: { name: "ZZ Fees Behind", email: `zz-fees-behind-${STAMP}@test.invalid` }, select: { id: true } }), db.user.create({ data: { name: "ZZ Fees BehindParent", email: `zz-fees-behindparent-${STAMP}@test.invalid` }, select: { id: true } })]);
    behindParentId = bp.id;
    behind = (await db.membership.create({ data: { userId: bu.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFH${STAMP}`, gradeLevel: "4" }, select: { id: true } })).id;
    await db.guardianship.create({ data: { parentUserId: behindParentId, studentMembershipId: behind, studentSchoolId: schoolId, status: "ACTIVE" } });
    await db.feeDemand.createMany({
      data: [
        { schoolId, studentMembershipId: behind, academicYearId: yearId, label: "Term 1", dueDate: new Date(`${addDaysToKey(TODAY, -20)}T00:00:00.000Z`), grossPaise: 200_00, netPaise: 200_00, status: "OPEN" },
        { schoolId, studentMembershipId: behind, academicYearId: yearId, label: "Term 2", dueDate: new Date(`${addDaysToKey(TODAY, -7)}T00:00:00.000Z`), grossPaise: 300_00, netPaise: 300_00, paidPaise: 100_00, status: "PART" },
      ],
    });
    // Both the leaver's Term 1 and this pupil's Term 2 are due a week ago: the D+7 bucket fires for the pupil on the roll only.
    const job = await sendFeeReminders();
    expect(job.perSchool[schoolId]).toEqual({ reminders: 1 });
    expect(await db.notification.count({ where: { userId: leaverParentId, kind: "FEES" } })).toBe(0);
    expect((await db.feeDemand.findFirstOrThrow({ where: { studentMembershipId: leaver }, select: { lastReminderKey: true } })).lastReminderKey).toBeNull();
    const daily = await db.notification.findFirstOrThrow({ where: { userId: behindParentId, kind: "FEES" }, orderBy: { createdAt: "desc" } });
    expect(daily.body).toContain("₹200");
    // Remind now: the leaver is nobody's to text; the pupil behind is told the whole ₹400, not the oldest instalment's ₹200.
    expect(await remindNow(admin(), { studentMembershipIds: [leaver] })).toEqual({ families: 0, demands: 0 });
    expect(await remindNow(admin(), { studentMembershipIds: [behind] })).toEqual({ families: 1, demands: 2 });
    expect(await db.notification.count({ where: { userId: leaverParentId, kind: "FEES" } })).toBe(0);
    const manual = await db.notification.findMany({ where: { userId: behindParentId, kind: "FEES" } });
    expect(manual).toHaveLength(2);
    expect(manual.map((n) => n.body.includes("₹400") && n.body.includes(addDaysToKey(TODAY, -20))).filter(Boolean)).toHaveLength(1);
  });

  it("a payment at 01:00 IST on the 2nd prints the 2nd and falls in a range that starts on the 2nd", async () => {
    // 19:30 UTC on the 1st is 01:00 the next morning in Asia/Kolkata.
    await db.feePayment.create({ data: { schoolId, studentMembershipId: behind, amountPaise: 100_00, method: "CASH", status: "PAID", paidAt: new Date(`${K}T19:30:00.000Z`), collectedByUserId: adminUserId } });
    const onThe2nd = (await collectionsExport(admin(), { fromKey: addDaysToKey(K, 1), toKey: addDaysToKey(K, 1) })).csv.split(/\r?\n/).filter(Boolean);
    expect(onThe2nd).toHaveLength(2);
    expect(onThe2nd[1]).toMatch(new RegExp(`^${addDaysToKey(K, 1)},`));
    expect(onThe2nd[1]).toContain(`ZFH${STAMP}`);
    const onThe1st = (await collectionsExport(admin(), { fromKey: K, toKey: K })).csv.split(/\r?\n/).filter(Boolean);
    expect(onThe1st).toHaveLength(1);
    await expect(collectionsExport(admin(), { fromKey: "2026-13-01", toKey: K })).rejects.toThrow("fees.refuseDate");
  });

  it("at 01:00 IST on the 2nd the counter takes a payment dated the school's today, the 2nd, and refuses the 3rd", async () => {
    // 19:30 UTC on the 1st: the platform's date is the 1st, the school's the 2nd.
    const at = new Date(`${K}T19:30:00.000Z`);
    await expect(recordCounterPayment(admin(), { studentMembershipId: behind, amountPaise: 100_00, method: "CASH", paidAtKey: addDaysToKey(K, 2) }, at)).rejects.toThrow("fees.refuseDate");
    await expect(recordCounterPayment(admin(), { studentMembershipId: behind, amountPaise: 100_00, method: "CASH", paidAtKey: "2026-02-30" }, at)).rejects.toThrow("fees.refuseDate");
    const taken = await recordCounterPayment(admin(), { studentMembershipId: behind, amountPaise: 100_00, method: "CASH", paidAtKey: addDaysToKey(K, 1), clientId: `ist-${STAMP}` }, at);
    // Today is the moment it was taken, not a midnight that has not come yet.
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: taken.paymentId }, select: { paidAt: true } })).paidAt?.toISOString()).toBe(at.toISOString());
  });
});
