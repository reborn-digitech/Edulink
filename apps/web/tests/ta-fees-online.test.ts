/**
 * The fees batch of the testing analysis of 13 November 2026: the school's own gateway and UPI intents.
 *
 *   TA-447  a test key was saved as live and, on a deployed server, took test payments as real ones.
 *   TA-256  "Reverse" was accepted on a payment the gateway captured.
 *   TA-128  an online refund called the gateway inside a transaction Prisma ends after five seconds.
 *   TA-524  a capture of another amount than the order was audited and dropped; nobody was told.
 *   TA-257  the reconcile job never asked about a FAILED order, and asked about an erroring one for ever.
 *   TA-448  keys replaced under an open checkout; the webhook answered "no gateway" for any failure to read them.
 *   TA-449  every "pay by UPI" press wrote a row, and nothing closed an intent nobody claimed.
 *
 * The gateway's refund and order reads are stood in for where a case needs them (a slow refund, a capture the
 * reconcile job finds); the rest is the devbox transport. At ZZ schools of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { removeGatewayAccount, saveFeeSettings, saveGatewayAccount } from "@/lib/fees";
import { familyFees, listClaims, reconcileOnlinePayments, requestRefund, reversePayment, settleOnlinePayment, startOnlineCheckout, startUpiPayment } from "@/lib/fees-payments";
import { POST as webhook } from "@/app/api/webhooks/razorpay/[schoolId]/route";

const stub = vi.hoisted(() => ({ refundDelayMs: 0, orders: new Map<string, "throw" | { paymentId: string; amountPaise: number }[]>() }));
vi.mock("@/lib/gateway", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/gateway")>();
  return {
    ...real,
    refundPayment: async (...args: Parameters<typeof real.refundPayment>) => {
      if (stub.refundDelayMs) await new Promise((r) => setTimeout(r, stub.refundDelayMs));
      return real.refundPayment(...args);
    },
    fetchOrderPayments: async (account: Parameters<typeof real.fetchOrderPayments>[0], orderId: string) => {
      const set = stub.orders.get(orderId);
      if (set === "throw") throw new real.GatewayError("gateway unreachable: zz stand-in");
      if (set) return set.map((p) => ({ paymentId: p.paymentId, orderId, amountPaise: p.amountPaise, status: "captured", method: "upi" }));
      return real.fetchOrderPayments(account, orderId);
    },
  };
});

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tafees-online-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const demands: string[] = [];

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);
const parent = () => ctx(ids.parent!, "PARENT", null);
const KEY = { keyId: "rzp_test_zztafees001", secret: "zz-tafees-key-secret", webhookSecret: "zz-tafees-hook-secret", mode: "TEST" as const };
let nextDemand = 0;
const demand = () => demands[nextDemand++]!;
const amountOf = async (demandId: string) => (await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { netPaise: true } })).netPaise;
/** An online order written straight into the ledger, as a checkout leaves one, aged as the case needs. */
async function order(status: "INITIATED" | "FAILED", ageMs: number): Promise<{ id: string; orderId: string; amountPaise: number }> {
  const d = demand();
  const amountPaise = await amountOf(d);
  const orderId = `order_zztaf${randomBytes(6).toString("hex")}`;
  const row = await db.feePayment.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupilM!, amountPaise, method: "ONLINE", status, gatewayOrderId: orderId, payerUserId: ids.parent!, intentJson: JSON.stringify([d]), createdAt: new Date(Date.now() - ageMs) }, select: { id: true } });
  return { id: row.id, orderId, amountPaise };
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  ids.school = (await db.school.create({ data: { name: `ZZ TAF Online ${STAMP}`, slug: `zz-taf-online-${STAMP}`, code: `ZTN${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  ids.broken = (await db.school.create({ data: { name: `ZZ TAF Online Broken ${STAMP}`, slug: `zz-taf-online-b-${STAMP}`, code: `ZTB${SUFFIX}`, contactEmail: mail("broken"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  for (const who of ["admin", "parent", "pupil"]) ids[who] = (await db.user.create({ data: { name: `ZZ TAF Online ${who}`, email: mail(who) }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", studentCode: `ZTN${SUFFIX}1` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, status: "ACTIVE" } });
  for (let i = 0; i < 12; i += 1) {
    demands.push((await db.feeDemand.create({ data: { schoolId: ids.school, studentMembershipId: ids.pupilM, academicYearId: ids.year, label: `ZZ Term ${i + 1}`, dueDate: new Date(Date.UTC(2026, 6, 1 + i)), grossPaise: (500 + i) * 100, netPaise: (500 + i) * 100, status: "OPEN" }, select: { id: true } })).id);
  }
  await saveGatewayAccount(admin(), KEY);
  await saveFeeSettings(admin(), { upiId: "zzonline@okaxis", upiPayee: "ZZ Online School" });
  // A school whose sealed secrets will not open on this machine.
  await db.feeGatewayAccount.create({ data: { schoolId: ids.broken, provider: "RAZORPAY", keyId: "rzp_test_zztafbroken1", secretEnc: "not-a-seal", webhookSecretEnc: "not-a-seal", mode: "TEST" } });
}, 60_000);

afterAll(async () => {
  vi.unstubAllEnvs();
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.school!, ids.broken!] } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: { in: [ids.school!, ids.broken!] } } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
}, 60_000);

describe("TA-447: a test key", { timeout: 60_000 }, () => {
  it("TA-447: a test key sent as Live is refused, not stored and shown as live", async () => {
    await expect(saveGatewayAccount(admin(), { ...KEY, mode: "LIVE" })).rejects.toThrow("fees.refuseKeyMode");
    expect((await db.feeGatewayAccount.findUniqueOrThrow({ where: { schoolId: ids.school }, select: { mode: true } })).mode).toBe("TEST");
  });

  it("TA-447: on a deployed server with the real gateway, a school's test key offers no online payment and opens no checkout", async () => {
    vi.stubEnv("FEES_GATEWAY_TRANSPORT", "razorpay");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://zz-tafees.example.test");
    // Were an order asked for, it would go nowhere: the gateway's address is a closed local port.
    vi.stubEnv("FEES_GATEWAY_API_BASE", "http://127.0.0.1:9");
    try {
      const family = await familyFees(parent(), ids.pupilM!);
      expect(family.child?.options.online).toBe(false);
      await expect(startOnlineCheckout(parent(), { studentMembershipId: ids.pupilM!, demandIds: [demands[11]!] })).rejects.toThrow("fees.refuseTestKeyLive");
    } finally {
      vi.unstubAllEnvs();
    }
    expect(await db.feePayment.count({ where: { schoolId: ids.school, method: "ONLINE", intentJson: { contains: demands[11]! } } })).toBe(0);
  });
});

describe("TA-256 and TA-128: giving back money the gateway captured", { timeout: 60_000 }, () => {
  let paymentId = "";
  let demandId = "";
  it("TA-256: a captured online payment is not reversed; the refusal points to Refund and the fee stays paid", async () => {
    demandId = demand();
    const start = await startOnlineCheckout(parent(), { studentMembershipId: ids.pupilM!, demandIds: [demandId] });
    paymentId = start.paymentId;
    expect((await settleOnlinePayment(ids.school!, { orderId: start.orderId, gatewayPaymentId: `pay_zztaf${SUFFIX}1`, amountPaise: start.amountPaise })).outcome).toBe("settled");
    await expect(reversePayment(admin(), paymentId, "Meant to give the money back")).rejects.toThrow("fees.refuseReverseOnline");
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: paymentId }, select: { status: true } })).status).toBe("PAID");
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true } })).status).toBe("PAID");
  });

  it("TA-128: a refund the gateway answers after six seconds is recorded, not rolled back after the money went", async () => {
    demandId = demand();
    const start = await startOnlineCheckout(parent(), { studentMembershipId: ids.pupilM!, demandIds: [demandId] });
    paymentId = start.paymentId;
    expect((await settleOnlinePayment(ids.school!, { orderId: start.orderId, gatewayPaymentId: `pay_zztaf${SUFFIX}5`, amountPaise: start.amountPaise })).outcome).toBe("settled");
    stub.refundDelayMs = 6_000;
    try {
      const refund = await requestRefund(admin(), { paymentId, amountPaise: 100_00, reason: "Charged twice" });
      expect(refund.status).toBe("DONE");
    } finally {
      stub.refundDelayMs = 0;
    }
    const rows = await db.feeRefund.findMany({ where: { paymentId }, select: { amountPaise: true, gatewayRefundId: true } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.gatewayRefundId).toMatch(/^rfnd_devbox/);
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: demandId }, select: { status: true } })).status).toBe("PART");
  });
});

describe("TA-524: a capture of another amount", { timeout: 60_000 }, () => {
  it("TA-524: the capture is refused as before, the order is closed with the amount named, and the office is told once", async () => {
    const start = await startOnlineCheckout(parent(), { studentMembershipId: ids.pupilM!, demandIds: [demand()] });
    const got = start.amountPaise + 2_360;
    expect((await settleOnlinePayment(ids.school!, { orderId: start.orderId, gatewayPaymentId: `pay_zztaf${SUFFIX}2`, amountPaise: got })).outcome).toBe("amount-mismatch");
    expect((await settleOnlinePayment(ids.school!, { orderId: start.orderId, gatewayPaymentId: `pay_zztaf${SUFFIX}2`, amountPaise: got })).outcome).toBe("amount-mismatch");
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId }, select: { status: true, failedReason: true } });
    expect(row.status).toBe("FAILED");
    expect(row.failedReason).toContain("amount-mismatch:");
    expect(row.failedReason).toContain(`pay_zztaf${SUFFIX}2`);
    expect(await db.notification.count({ where: { userId: ids.admin, titleKey: "notifTitle.feeAmountMismatchOffice" } })).toBe(1);
  });

  it("TA-524: the reconcile job finding only a capture of another amount does not close the order as 'nothing captured'", async () => {
    const o = await order("INITIATED", 26 * 3_600_000);
    stub.orders.set(o.orderId, [{ paymentId: `pay_zztaf${SUFFIX}3`, amountPaise: o.amountPaise + 1_000 }]);
    await reconcileOnlinePayments(new Date(), { schoolIds: [ids.school!] });
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: o.id }, select: { status: true, failedReason: true } });
    expect(row.status).toBe("FAILED");
    expect(row.failedReason).toContain("amount-mismatch:");
    expect(row.failedReason).not.toContain("nothing captured");
  });
});

describe("TA-257: the net under a lost webhook", { timeout: 60_000 }, () => {
  it("TA-257: a FAILED order whose retry was captured is asked about and settled", async () => {
    const o = await order("FAILED", 40 * 60_000);
    stub.orders.set(o.orderId, [{ paymentId: `pay_zztaf${SUFFIX}4`, amountPaise: o.amountPaise }]);
    const report = await reconcileOnlinePayments(new Date(), { schoolIds: [ids.school!] });
    expect(report.perSchool[ids.school!]?.settled).toBeGreaterThanOrEqual(1);
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: o.id }, select: { status: true, gatewayPaymentId: true } });
    expect(row).toEqual({ status: "PAID", gatewayPaymentId: `pay_zztaf${SUFFIX}4` });
  });

  it("TA-257: an order the gateway errors on is closed once it is past the day, not asked about for ever", async () => {
    const o = await order("INITIATED", 26 * 3_600_000);
    stub.orders.set(o.orderId, "throw");
    await reconcileOnlinePayments(new Date(), { schoolIds: [ids.school!] });
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: o.id }, select: { status: true, failedReason: true } });
    expect(row.status).toBe("FAILED");
    expect(row.failedReason).toBe("expired: the gateway could not be asked within a day");
  });
});

describe("TA-448: the school's keys and its webhook", { timeout: 60_000 }, () => {
  it("TA-448: the keys are neither replaced nor removed while a family is in the checkout", async () => {
    await startOnlineCheckout(parent(), { studentMembershipId: ids.pupilM!, demandIds: [demand()] });
    await expect(saveGatewayAccount(admin(), { ...KEY, secret: "zz-tafees-key-secret-2" })).rejects.toThrow("fees.refuseGatewayOrdersOpen");
    await expect(removeGatewayAccount(admin())).rejects.toThrow("fees.refuseGatewayOrdersOpen");
    expect(await db.feeGatewayAccount.count({ where: { schoolId: ids.school } })).toBe(1);
  });

  it("TA-448: a webhook to a school whose keys cannot be read is answered 503 to retry, not 404 'no gateway'", async () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_zz", order_id: "order_zz", amount: 100, method: "upi" } } } });
    const answer = await webhook(new Request(`http://localhost/api/webhooks/razorpay/${ids.broken}`, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": "abc" }, body }), { params: Promise.resolve({ schoolId: ids.broken! }) });
    expect(answer.status).toBe(503);
    expect(((await answer.json()) as { retry?: boolean }).retry).toBe(true);
  });
});

describe("TA-449: UPI intents", { timeout: 60_000 }, () => {
  it("TA-449: pressing 'pay by UPI' again for the same dues hands back the open intent, not a new row", async () => {
    const d = demand();
    const first = await startUpiPayment(parent(), { studentMembershipId: ids.pupilM!, demandIds: [d] });
    const again = await Promise.all([1, 2, 3].map(() => startUpiPayment(parent(), { studentMembershipId: ids.pupilM!, demandIds: [d] })));
    expect(new Set([first, ...again].map((s) => s.paymentId)).size).toBe(1);
    expect(new Set([first, ...again].map((s) => s.reference)).size).toBe(1);
    expect(await db.feePayment.count({ where: { schoolId: ids.school, method: "UPI", intentJson: { contains: d } } })).toBe(1);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "fees.upiStart", targetId: first.paymentId } })).toBe(1);
  });

  it("TA-449: an intent nobody claimed in forty-five days is closed by the job and no longer waits for a UTR", async () => {
    const before = (await listClaims(admin(), "2026-11-14")).waitingForUtr;
    const old = await db.feePayment.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupilM!, amountPaise: 500_00, method: "UPI", status: "INITIATED", payerUserId: ids.parent!, intentJson: "[]", note: `EL${randomBytes(6).toString("hex").toUpperCase()}`, createdAt: new Date(Date.now() - 46 * 86_400_000) }, select: { id: true } });
    expect((await listClaims(admin(), "2026-11-14")).waitingForUtr).toBe(before + 1);
    await reconcileOnlinePayments(new Date(), { schoolIds: [ids.school!] });
    expect(await db.feePayment.findUniqueOrThrow({ where: { id: old.id }, select: { status: true, failedReason: true } })).toEqual({ status: "FAILED", failedReason: "not claimed" });
    expect((await listClaims(admin(), "2026-11-14")).waitingForUtr).toBe(before);
  });
});
