/**
 * The gateway webhook: the one public door into the ledger. A school with no
 * gateway is 404, a wrong signature is 401, a good delivery settles the order
 * and issues the receipt, a redelivery is answered "already", a failure
 * closes the order, and a refund event marks the refund done.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { saveGatewayAccount } from "@/lib/fees";
import { startOnlineCheckout } from "@/lib/fees-payments";
import { signWebhookBody } from "@/lib/gateway";
import { POST as webhook } from "@/app/api/webhooks/razorpay/[schoolId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let emptySchoolId = "";
let adminUserId = "";
let adminMembershipId = "";
let parentUserId = "";
let pupilId = "";
let demandId = "";

function ctx(over: Partial<ActiveContext> & { userId: string }): ActiveContext {
  return { sessionId: "t", membershipId: over.membershipId ?? null, schoolId: over.schoolId ?? null, role: over.role ?? null, user: { id: over.userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } };
}
const deliver = (school: string, body: string, signature: string | null, eventId = `evt_${randomBytes(4).toString("hex")}`) =>
  webhook(new Request(`http://localhost/api/webhooks/razorpay/${school}`, { method: "POST", headers: { "content-type": "application/json", ...(signature ? { "x-razorpay-signature": signature } : {}), "x-razorpay-event-id": eventId }, body }), { params: Promise.resolve({ schoolId: school }) });

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  schoolId = (await db.school.create({ data: { name: `ZZ Hook School ${STAMP}`, slug: `zz-hook-${STAMP}`, code: `ZHK${String(STAMP).slice(-5)}`, contactEmail: `zz-hook-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  emptySchoolId = (await db.school.create({ data: { name: `ZZ Hook Empty ${STAMP}`, slug: `zz-hooke-${STAMP}`, code: `ZHE${String(STAMP).slice(-5)}`, contactEmail: `zz-hooke-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const year = await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } });
  adminUserId = (await db.user.create({ data: { name: "ZZ Hook Admin", email: `zz-hook-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  parentUserId = (await db.user.create({ data: { name: "ZZ Hook Parent", email: `zz-hook-parent-${STAMP}@test.invalid` }, select: { id: true } })).id;
  const pupilUser = await db.user.create({ data: { name: "ZZ Hook Pupil", email: `zz-hook-pupil-${STAMP}@test.invalid` }, select: { id: true } });
  adminMembershipId = (await db.membership.create({ data: { userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  pupilId = (await db.membership.create({ data: { userId: pupilUser.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZHP${STAMP}` }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pupilId, studentSchoolId: schoolId, status: "ACTIVE" } });
  demandId = (await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilId, academicYearId: year.id, label: "Term 1", dueDate: new Date("2026-09-01T00:00:00Z"), grossPaise: 500_00, netPaise: 500_00, status: "OPEN" }, select: { id: true } })).id;
  await saveGatewayAccount(ctx({ userId: adminUserId, membershipId: adminMembershipId, schoolId, role: "ADMIN" }), { keyId: "rzp_test_zzhook00001", secret: "zz-hook-key-secret", webhookSecret: "zz-hook-webhook-secret", mode: "TEST" });
});

afterAll(async () => {
  await db.school.deleteMany({ where: { id: { in: [schoolId, emptySchoolId] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("POST /api/webhooks/razorpay/{schoolId}", () => {
  it("404 for a school with no gateway, 401 for a bad signature, 400 for a body that is not JSON", async () => {
    expect((await deliver(emptySchoolId, "{}", "abc")).status).toBe(404);
    expect((await deliver(schoolId, "{}", "abc")).status).toBe(401);
    expect((await deliver(schoolId, "{}", null)).status).toBe(401);
    expect((await deliver(schoolId, "not json", signWebhookBody("zz-hook-webhook-secret", "not json"))).status).toBe(400);
  });

  it("settles a captured payment once, answers a redelivery with already, and records every event", async () => {
    const start = await startOnlineCheckout(ctx({ userId: parentUserId, role: "PARENT" }), { studentMembershipId: pupilId, demandIds: [demandId] });
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_hook1", order_id: start.orderId, amount: 500_00, method: "upi" } } } });
    const sig = signWebhookBody("zz-hook-webhook-secret", body);
    const first = await deliver(schoolId, body, sig, "evt_1");
    expect(first.status).toBe(200);
    expect((await first.json()).outcome).toBe("settled");
    const payment = await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId }, include: { receipt: true } });
    expect(payment.status).toBe("PAID");
    expect(payment.gatewayPaymentId).toBe("pay_hook1");
    expect(payment.gatewayMethod).toBe("upi");
    expect(payment.receipt?.serial).toBe("RCPT/2026–27/000001");
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: demandId } })).status).toBe("PAID");

    const again = await deliver(schoolId, body, sig, "evt_1");
    expect((await again.json()).outcome).toBe("already");
    const other = await deliver(schoolId, body, sig, "evt_2");
    expect((await other.json()).outcome).toBe("already");
    expect(await db.feeReceipt.count({ where: { schoolId } })).toBe(1);
    expect((await db.gatewayEvent.findMany({ where: { schoolId }, orderBy: { receivedAt: "asc" } })).map((e) => [e.eventId, e.outcome])).toEqual([
      ["evt_1", "settled"],
      ["evt_2", "already"],
    ]);
  });

  it("a failed payment closes its order; a refund event marks the refund done", async () => {
    const extra = await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilId, academicYearId: (await db.academicYear.findFirstOrThrow({ where: { schoolId } })).id, label: "Term 2", dueDate: new Date("2026-12-01T00:00:00Z"), grossPaise: 300_00, netPaise: 300_00, status: "OPEN" }, select: { id: true } });
    const start = await startOnlineCheckout(ctx({ userId: parentUserId, role: "PARENT" }), { studentMembershipId: pupilId, demandIds: [extra.id] });
    const failed = JSON.stringify({ event: "payment.failed", payload: { payment: { entity: { id: "pay_hook2", order_id: start.orderId, amount: 300_00, error_description: "Card declined" } } } });
    expect((await (await deliver(schoolId, failed, signWebhookBody("zz-hook-webhook-secret", failed))).json()).outcome).toBe("failed");
    const row = await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId } });
    expect(row.status).toBe("FAILED");
    expect(row.failedReason).toBe("Card declined");

    const paid = await db.feePayment.findFirstOrThrow({ where: { schoolId, status: "PAID" } });
    await db.feeRefund.create({ data: { schoolId, paymentId: paid.id, amountPaise: 100_00, reason: "test", status: "REQUESTED", gatewayRefundId: "rfnd_hook1", requestedByUserId: adminUserId } });
    const refunded = JSON.stringify({ event: "refund.processed", payload: { refund: { entity: { id: "rfnd_hook1" } } } });
    expect((await (await deliver(schoolId, refunded, signWebhookBody("zz-hook-webhook-secret", refunded))).json()).outcome).toBe("refund-done");
    expect((await db.feeRefund.findFirstOrThrow({ where: { gatewayRefundId: "rfnd_hook1" } })).status).toBe("DONE");
  });
});
