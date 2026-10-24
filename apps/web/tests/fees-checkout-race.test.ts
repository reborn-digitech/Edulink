/**
 * QA-03 (QA campaign of 24 October 2026, E2E-A1): two guardians paying one
 * demand online. Both checkouts used to answer 201 with two orders for the
 * same ₹7,500; the first capture settled, the second answered "Nothing is due
 * to pay" after the money was taken and the payment sat INITIATED for ever,
 * with no receipt, no audit row and nothing in the office's queue.
 *
 * Now: one open order per demand at a time. The pupil's open demands are
 * locked while a checkout looks for another guardian's open order, so two
 * presses at the same moment make one order; the second guardian is told a
 * payment is in progress; the same guardian pressing again is handed the
 * order they already have. And money that arrives when nothing is due any
 * more (an older order paid after the office took cash, say) is recorded as
 * UNALLOCATED with the gateway's payment id, audited, the office and the
 * family told, and the office refunds it through the usual refund door.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { todayKey } from "@/lib/dates";
import { saveGatewayAccount } from "@/lib/fees";
import { confirmOnlineCheckout, recordCounterPayment, requestRefund, settleOnlinePayment, startOnlineCheckout } from "@/lib/fees-payments";
import { signCheckout } from "@/lib/gateway";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TZ = "Asia/Kolkata";
const TODAY = todayKey(TZ);
const KEY_SECRET = `zz-race-secret-${SUFFIX}`;
const ids = { school: "", year: "", admin: "", adminM: "", g1: "", g2: "", pupil: "", term1: "", term2: "", pupil2: "", term3: "" };

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId: over.membershipId ?? null,
    schoolId: over.schoolId ?? null,
    role: over.role ?? null,
    user: { id: over.userId, name: "ZZ Race Test", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
  };
}
const admin = () => ctx({ userId: ids.admin, membershipId: ids.adminM, schoolId: ids.school, role: "ADMIN" });
const guardian = (userId: string) => ctx({ userId, role: "PARENT" });

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  ids.school = (await db.school.create({ data: { name: `ZZ Checkout Race ${STAMP}`, slug: `zz-checkout-race-${STAMP}`, code: `ZCR${SUFFIX}`, contactEmail: `zz-checkout-race-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Race ${who}`, email: `zz-race-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, g1, g2, p, p2] = await Promise.all([mk("Admin"), mk("GuardianOne"), mk("GuardianTwo"), mk("Pupil"), mk("PupilTwo")]);
  ids.admin = a.id;
  ids.g1 = g1.id;
  ids.g2 = g2.id;
  ids.adminM = (await db.membership.create({ data: { userId: a.id, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupil = (await db.membership.create({ data: { userId: p.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZCRA${SUFFIX}` }, select: { id: true } })).id;
  ids.pupil2 = (await db.membership.create({ data: { userId: p2.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZCRB${SUFFIX}` }, select: { id: true } })).id;
  // Both guardians guard both children.
  for (const parentUserId of [ids.g1, ids.g2]) for (const studentMembershipId of [ids.pupil, ids.pupil2]) await db.guardianship.create({ data: { parentUserId, studentMembershipId, studentSchoolId: ids.school, status: "ACTIVE", consentSharingAt: new Date(), consentNotificationsAt: new Date() } });
  const demand = (studentMembershipId: string, label: string, paise: number) => db.feeDemand.create({ data: { schoolId: ids.school, studentMembershipId, academicYearId: ids.year, label, dueDate: new Date(`${TODAY}T00:00:00.000Z`), grossPaise: paise, netPaise: paise, status: "OPEN" }, select: { id: true } });
  ids.term1 = (await demand(ids.pupil, "ZZ Term 1", 5_000_00)).id;
  ids.term2 = (await demand(ids.pupil, "ZZ Term 2", 7_500_00)).id;
  ids.term3 = (await demand(ids.pupil2, "ZZ Term 2", 7_500_00)).id;
  await saveGatewayAccount(admin(), { keyId: `rzp_test_zzrace${SUFFIX}`, secret: KEY_SECRET, webhookSecret: `zz-race-webhook-${SUFFIX}`, mode: "TEST" });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

const openOrders = (demandId: string) => db.feePayment.findMany({ where: { schoolId: ids.school, method: "ONLINE", status: "INITIATED", intentJson: { contains: demandId } }, select: { id: true, payerUserId: true } });

describe("QA-03: one open online order per demand", () => {
  it("two guardians pressing Pay at the same moment make one order; the second is told a payment is in progress", async () => {
    const results = await Promise.allSettled([
      startOnlineCheckout(guardian(ids.g1), { studentMembershipId: ids.pupil, demandIds: [ids.term2] }),
      startOnlineCheckout(guardian(ids.g2), { studentMembershipId: ids.pupil, demandIds: [ids.term2] }),
    ]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const refused = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(ok).toHaveLength(1);
    expect(refused).toHaveLength(1);
    expect(String(refused[0]!.reason)).toContain("fees.refuseCheckoutInProgress");
    expect(await openOrders(ids.term2)).toHaveLength(1);
  });

  it("refuses the other guardian afterwards too (no simultaneous tap needed), and hands the same guardian their own order back", async () => {
    const [open] = await openOrders(ids.term2);
    const owner = open!.payerUserId === ids.g1 ? ids.g1 : ids.g2;
    const other = owner === ids.g1 ? ids.g2 : ids.g1;
    await expect(startOnlineCheckout(guardian(other), { studentMembershipId: ids.pupil, demandIds: [ids.term2] })).rejects.toThrow("fees.refuseCheckoutInProgress");
    // A demand set that only overlaps is refused as well.
    await expect(startOnlineCheckout(guardian(other), { studentMembershipId: ids.pupil, demandIds: [ids.term1, ids.term2] })).rejects.toThrow("fees.refuseCheckoutInProgress");
    const again = await startOnlineCheckout(guardian(owner), { studentMembershipId: ids.pupil, demandIds: [ids.term2] });
    expect(again.paymentId).toBe(open!.id);
    expect(await openOrders(ids.term2)).toHaveLength(1);
    // Another demand of the same pupil is not held up by it.
    const term1 = await startOnlineCheckout(guardian(other), { studentMembershipId: ids.pupil, demandIds: [ids.term1] });
    expect(term1.amountPaise).toBe(5_000_00);
  });

  it("an order left open past the half hour no longer holds the demand", async () => {
    const [open] = await openOrders(ids.term2);
    await db.feePayment.update({ where: { id: open!.id }, data: { createdAt: new Date(Date.now() - 31 * 60_000) } });
    const other = open!.payerUserId === ids.g1 ? ids.g2 : ids.g1;
    const second = await startOnlineCheckout(guardian(other), { studentMembershipId: ids.pupil, demandIds: [ids.term2] });
    expect(second.paymentId).not.toBe(open!.id);
  });

  it("money captured when nothing is due any more is recorded, audited and told, never lost; the office refunds it", async () => {
    // The second order of the stale pair above, and the first: both are open for Term 2.
    const orders = await db.feePayment.findMany({ where: { schoolId: ids.school, method: "ONLINE", status: "INITIATED", intentJson: { contains: ids.term2 } }, orderBy: { createdAt: "asc" }, select: { id: true, gatewayOrderId: true, payerUserId: true, amountPaise: true } });
    expect(orders).toHaveLength(2);
    const [first, second] = orders as [(typeof orders)[number], (typeof orders)[number]];
    // The first guardian pays: settled, a receipt.
    const paid = await confirmOnlineCheckout(guardian(first.payerUserId!), { paymentId: first.id, gatewayPaymentId: `pay_zzrace1${SUFFIX}`, signature: signCheckout(KEY_SECRET, first.gatewayOrderId!, `pay_zzrace1${SUFFIX}`) });
    expect(paid.outcome).toBe("settled");
    // The second guardian pays the abandoned-looking order: the money is real, nothing is due.
    const late = await confirmOnlineCheckout(guardian(second.payerUserId!), { paymentId: second.id, gatewayPaymentId: `pay_zzrace2${SUFFIX}`, signature: signCheckout(KEY_SECRET, second.gatewayOrderId!, `pay_zzrace2${SUFFIX}`) });
    expect(late).toEqual({ outcome: "unallocated", receiptId: null });
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: second.id }, include: { allocations: true, receipt: true } });
    expect(row.status).toBe("UNALLOCATED");
    expect(row.gatewayPaymentId).toBe(`pay_zzrace2${SUFFIX}`);
    expect(row.paidAt).not.toBeNull();
    expect(row.allocations).toHaveLength(0);
    expect(row.receipt).toBeNull();
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "fees.onlineUnallocated", targetId: second.id } })).toBe(1);
    expect(await db.notification.count({ where: { userId: ids.admin, titleKey: "notifTitle.feeUnallocatedOffice" } })).toBe(1);
    expect(await db.notification.count({ where: { userId: second.payerUserId!, titleKey: "notifTitle.feeUnallocated" } })).toBe(1);
    // The gateway's webhook for the same capture arriving afterwards changes nothing.
    expect((await settleOnlinePayment(ids.school, { orderId: second.gatewayOrderId!, gatewayPaymentId: `pay_zzrace2${SUFFIX}`, amountPaise: second.amountPaise })).outcome).toBe("already");
    // Term 2 was paid once.
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: ids.term2 }, select: { paidPaise: true, status: true } })).toEqual({ paidPaise: 7_500_00, status: "PAID" });
    // The office refunds it whole through the gateway; the payment stays UNALLOCATED (never among the collected
    // PAID/REFUNDED payments), its refund row says the money went back, a second refund is refused, and no demand moves.
    const refund = await requestRefund(admin(), { paymentId: second.id, amountPaise: second.amountPaise, reason: "Paid twice for Term 2" });
    expect(refund.status).toBe("DONE");
    expect((await db.feeRefund.findUniqueOrThrow({ where: { id: refund.refundId } })).gatewayRefundId).toMatch(/^rfnd_devbox/);
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: second.id } })).status).toBe("UNALLOCATED");
    await expect(requestRefund(admin(), { paymentId: second.id, amountPaise: 100_00, reason: "Again" })).rejects.toThrow("fees.refuseRefundTooMuch");
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: ids.term2 }, select: { paidPaise: true, status: true } })).toEqual({ paidPaise: 7_500_00, status: "PAID" });
  });

  it("the report's own path: an order open, the office takes cash for the same term, the capture lands afterwards", async () => {
    const order = await startOnlineCheckout(guardian(ids.g1), { studentMembershipId: ids.pupil2, demandIds: [ids.term3] });
    await recordCounterPayment(admin(), { studentMembershipId: ids.pupil2, amountPaise: 7_500_00, method: "CASH", demandIds: [ids.term3] });
    const outcome = await settleOnlinePayment(ids.school, { orderId: order.orderId, gatewayPaymentId: `pay_zzrace3${SUFFIX}`, amountPaise: order.amountPaise });
    expect(outcome.outcome).toBe("unallocated");
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: order.paymentId } })).status).toBe("UNALLOCATED");
    // A redelivery is "already", and the demand still shows one payment.
    expect((await settleOnlinePayment(ids.school, { orderId: order.orderId, gatewayPaymentId: `pay_zzrace3${SUFFIX}`, amountPaise: order.amountPaise })).outcome).toBe("already");
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: ids.term3 }, select: { paidPaise: true } })).toEqual({ paidPaise: 7_500_00 });
  });
});
