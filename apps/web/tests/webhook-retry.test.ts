/**
 * QA-02 of the QA campaign of 24 October 2026 (E2E-A2, High; SEC-2): the three payment webhooks marked an event
 * handled before its settlement, so a settlement that failed was never retried.
 *
 * Each door stored the event row first (processedAt null) and treated the row's EXISTENCE as "seen": a throw in the
 * settlement left the row behind, and the gateway's retry was answered 200 "already" with the capture never
 * recorded. Now an event counts as handled only once its work is done (processedAt set); a delivery whose work throws
 * is answered 500 with a body, so the gateway sends it again, and the row stays re-processable; a delivery that
 * arrives while another is working on the same event is answered 409 (retry later), never "already".
 *
 * A failure is injected once into each door's settlement — before the work and, for the school door, after the
 * settlement committed — then the gateway's retry is delivered: the money is recorded once, the third delivery is
 * "already". Two deliveries of one event fired together record one receipt.
 *
 * Own ZZ school and @test.invalid people, removed by id at the end.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PLAN_FEATURES } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";
// Mocked below (vi.mock is hoisted above these imports): each settlement can be made to throw once.
import { saveGatewayAccount } from "@/lib/fees";
import { startOnlineCheckout } from "@/lib/fees-payments";
import { signWebhookBody } from "@/lib/gateway";
import { signSessionsWebhook } from "@/lib/gig-gateway";
import { openPassCheckout, setPassSaleForTests } from "@/lib/pass-orders";
import { setActivePlansForTests } from "@/lib/person-plans";
import { POST as schoolHook } from "@/app/api/webhooks/razorpay/[schoolId]/route";
import { POST as passHook } from "@/app/api/webhooks/razorpay/platform/route";
import { POST as seatHook } from "@/app/api/webhooks/gateway/sessions/route";

const inject = vi.hoisted(() => ({ fees: 0, feesAfterCommit: 0, pass: 0, seat: 0, seatCalls: 0 }));

vi.mock("@/lib/fees-payments", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/fees-payments")>();
  return {
    ...real,
    settleOnlinePayment: async (...args: Parameters<typeof real.settleOnlinePayment>) => {
      if (inject.fees > 0) {
        inject.fees -= 1;
        throw new Error("injected: the database went away mid-settle");
      }
      return real.settleOnlinePayment(...args);
    },
  };
});
vi.mock("@/lib/audit", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/audit")>();
  return {
    ...real,
    // After the settlement's transaction committed: the receipt is numbered, then the audit line throws.
    audit: async (...args: Parameters<typeof real.audit>) => {
      if (inject.feesAfterCommit > 0 && args[0]?.action === "fees.onlineSettled") {
        inject.feesAfterCommit -= 1;
        throw new Error("injected: the audit write failed after the settlement committed");
      }
      return real.audit(...args);
    },
  };
});
vi.mock("@/lib/pass-orders", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/pass-orders")>();
  return {
    ...real,
    markPassPaid: async (...args: Parameters<typeof real.markPassPaid>) => {
      if (inject.pass > 0) {
        inject.pass -= 1;
        throw new Error("injected: the pass settlement failed");
      }
      return real.markPassPaid(...args);
    },
  };
});
vi.mock("@/lib/gig-sessions", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/gig-sessions")>();
  return {
    ...real,
    // The seat's settlement is the company's Route path, switched off until Route is proven; the door's contract is
    // what is under test here, so a stand-in settles and counts: a real settle is covered by gig-payments.test.ts.
    settleSeatPayment: async () => {
      inject.seatCalls += 1;
      if (inject.seat > 0) {
        inject.seat -= 1;
        throw new Error("injected: the seat settlement failed");
      }
      return { outcome: "settled", bookingId: null };
    },
  };
});

const db = new PrismaClient();
const STAMP = Date.now();
const SECRET = "zz-fixa-webhook-secret";
const mail = (who: string) => `zz-fixa-hook-${who}-${STAMP}@test.invalid`;
const PREFIX = String.fromCharCode(88 + (STAMP % 3), 65 + (Math.floor(STAMP / 3) % 26));
const COMPANY = { legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27", sacCode: "998431", invoicePrefix: PREFIX, gstPercent: 18, missing: [] };
const PRICES = { STUDENT: { monthly: 9_900, yearly: 99_900 }, TEACHER: { monthly: 19_900, yearly: 199_900 }, EXPERT: { monthly: 49_900, yearly: 499_900 } };

let schoolId = "";
let yearId = "";
let pupilId = "";
const id: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], school: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId: school, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const toSchool = (body: string) =>
  schoolHook(new Request(`http://localhost/api/webhooks/razorpay/${schoolId}`, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": signWebhookBody(SECRET, body) }, body }), { params: Promise.resolve({ schoolId }) });
const toCompany = (hook: (r: Request) => Promise<Response>, path: string, body: string) =>
  hook(new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json", "x-razorpay-signature": signSessionsWebhook(body) }, body }));
const read = async (res: Response) => ({ status: res.status, body: await res.json() });

async function demand(label: string, paise: number) {
  return (await db.feeDemand.create({ data: { schoolId, studentMembershipId: pupilId, academicYearId: yearId, label, dueDate: new Date("2026-12-01T00:00:00Z"), grossPaise: paise, netPaise: paise, status: "OPEN" }, select: { id: true } })).id;
}
async function checkout(demandId: string) {
  return startOnlineCheckout(ctx(id.parent!, "PARENT", null), { studentMembershipId: pupilId, demandIds: [demandId] });
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  delete process.env.FEES_GATEWAY_TRANSPORT;
  setPassSaleForTests({ company: COMPANY, prices: PRICES });
  setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]);
  schoolId = (await db.school.create({ data: { name: `ZZ FixA Hooks ${STAMP}`, slug: `zz-fixa-hooks-${STAMP}`, code: `ZFH${String(STAMP).slice(-6)}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  yearId = (await db.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  for (const key of ["admin", "parent", "pupil", "adult"]) {
    id[key] = (await db.user.create({ data: { name: `ZZ FixA Hook ${key}`, email: mail(key), isTestFixture: true, ...(key === "adult" ? { birthdate: new Date("2004-05-01T00:00:00Z") } : {}) }, select: { id: true } })).id;
  }
  id.adminM = (await db.membership.create({ data: { userId: id.admin!, schoolId, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  pupilId = (await db.membership.create({ data: { userId: id.pupil!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFHP${STAMP}` }, select: { id: true } })).id;
  id.adultM = (await db.membership.create({ data: { userId: id.adult!, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZFHA${STAMP}`, gradeLevel: "12" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: id.parent!, studentMembershipId: pupilId, studentSchoolId: schoolId, status: "ACTIVE" } });
  await saveGatewayAccount(ctx(id.admin!, "ADMIN", schoolId, id.adminM), { keyId: "rzp_test_zzfixahook01", secret: "zz-fixa-key-secret", webhookSecret: SECRET, mode: "TEST" });
});

afterAll(async () => {
  setPassSaleForTests(null);
  setActivePlansForTests([]);
  const people = Object.values(id);
  const orders = (await db.passOrder.findMany({ where: { OR: [{ userId: { in: people } }, { payerUserId: { in: people } }] }, select: { id: true } })).map((o) => o.id);
  await db.passInvoice.deleteMany({ where: { passOrderId: { in: orders } } });
  await db.passOrder.deleteMany({ where: { id: { in: orders } } });
  await db.entitlement.deleteMany({ where: { userId: { in: people } } });
  await db.notification.deleteMany({ where: { userId: { in: people } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId }, { actorUserId: { in: people } }, { targetId: { in: orders } }] } });
  await db.gigGatewayEvent.deleteMany({ where: { payloadJson: { contains: `zzfixa${STAMP}` } } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

describe("QA-02 · the school's fees webhook", () => {
  it("a settlement that throws is answered 500 with a body, the event left re-processable; the retry settles once", async () => {
    const term = await demand("Term 1", 500_00);
    const start = await checkout(term);
    const body = JSON.stringify({ id: `evt_zzfixa${STAMP}_1`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_1`, order_id: start.orderId, amount: 500_00, method: "upi" } } } });

    inject.fees = 1;
    const first = await read(await toSchool(body));
    expect(first.status).toBe(500);
    expect(first.body).toMatchObject({ ok: false, code: "NOT_PROCESSED" });
    const row = await db.gatewayEvent.findFirstOrThrow({ where: { schoolId, eventId: `evt_zzfixa${STAMP}_1` } });
    expect(row.processedAt).toBeNull();
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId } })).status).toBe("INITIATED");

    // The gateway's retry of the same event: processed now, not "already".
    expect(await read(await toSchool(body))).toEqual({ status: 200, body: expect.objectContaining({ ok: true, outcome: "settled" }) });
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: start.paymentId } })).status).toBe("PAID");
    expect(await db.feeReceipt.count({ where: { paymentId: start.paymentId } })).toBe(1);
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: term } })).status).toBe("PAID");
    expect((await db.gatewayEvent.findUniqueOrThrow({ where: { id: row.id } })).processedAt).not.toBeNull();
    // And only then is a redelivery "already".
    expect(await read(await toSchool(body))).toEqual({ status: 200, body: { ok: true, outcome: "already" } });
    expect(await db.feeReceipt.count({ where: { paymentId: start.paymentId } })).toBe(1);
    expect(await db.gatewayEvent.count({ where: { schoolId, eventId: `evt_zzfixa${STAMP}_1` } })).toBe(1);
  });

  it("a throw after the settlement committed: the retry finds the payment settled and records once", async () => {
    const term = await demand("Term 2", 300_00);
    const start = await checkout(term);
    const body = JSON.stringify({ id: `evt_zzfixa${STAMP}_2`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_2`, order_id: start.orderId, amount: 300_00, method: "card" } } } });
    inject.feesAfterCommit = 1;
    expect((await toSchool(body)).status).toBe(500);
    expect((await db.gatewayEvent.findFirstOrThrow({ where: { schoolId, eventId: `evt_zzfixa${STAMP}_2` } })).processedAt).toBeNull();
    expect(await read(await toSchool(body))).toEqual({ status: 200, body: expect.objectContaining({ ok: true, outcome: "already" }) });
    expect(await db.feeReceipt.count({ where: { paymentId: start.paymentId } })).toBe(1);
    expect((await db.gatewayEvent.findFirstOrThrow({ where: { schoolId, eventId: `evt_zzfixa${STAMP}_2` } })).processedAt).not.toBeNull();
  });

  it("two deliveries of one event at once: one receipt, and neither is answered 'already' before the work is done", async () => {
    const term = await demand("Term 3", 200_00);
    const start = await checkout(term);
    const body = JSON.stringify({ id: `evt_zzfixa${STAMP}_3`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_3`, order_id: start.orderId, amount: 200_00, method: "upi" } } } });
    const both = await Promise.all([toSchool(body).then(read), toSchool(body).then(read)]);
    // One does the work; the other is told to come back (409) — or, if it arrived after the work was done, "already".
    const settled = both.filter((r) => r.status === 200 && r.body.outcome === "settled");
    expect(settled).toHaveLength(1);
    const other = both.find((r) => r !== settled[0])!;
    expect(other).toEqual(other.status === 409 ? { status: 409, body: { ok: false, code: "IN_PROGRESS", retry: true } } : { status: 200, body: { ok: true, outcome: "already" } });
    expect(await db.feeReceipt.count({ where: { paymentId: start.paymentId } })).toBe(1);
    expect(await read(await toSchool(body))).toEqual({ status: 200, body: { ok: true, outcome: "already" } });
  });
});

describe("QA-02 · rows left behind", () => {
  it("a row the old door left unprocessed, and a claim whose delivery died, are processed by the next delivery", async () => {
    const left = await checkout(await demand("Term 4", 100_00));
    const leftBody = JSON.stringify({ id: `evt_zzfixa${STAMP}_4`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_4`, order_id: left.orderId, amount: 100_00, method: "upi" } } } });
    // What the old door wrote before its settlement threw: the row, processedAt and outcome null.
    await db.gatewayEvent.create({ data: { schoolId, provider: "RAZORPAY", eventId: `evt_zzfixa${STAMP}_4`, kind: "payment.captured", payloadJson: leftBody } });
    expect(await read(await toSchool(leftBody))).toEqual({ status: 200, body: expect.objectContaining({ outcome: "settled" }) });
    expect(await db.feeReceipt.count({ where: { paymentId: left.paymentId } })).toBe(1);

    const died = await checkout(await demand("Term 5", 100_00));
    const diedBody = JSON.stringify({ id: `evt_zzfixa${STAMP}_5`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_5`, order_id: died.orderId, amount: 100_00, method: "upi" } } } });
    const row = await db.gatewayEvent.create({ data: { schoolId, provider: "RAZORPAY", eventId: `evt_zzfixa${STAMP}_5`, kind: "payment.captured", payloadJson: diedBody, outcome: "processing" } });
    // Claimed a moment ago: another delivery is told to come back.
    expect(await read(await toSchool(diedBody))).toEqual({ status: 409, body: { ok: false, code: "IN_PROGRESS", retry: true } });
    // Claimed ten minutes ago and never finished: the claim is stale, and this delivery takes it.
    await db.gatewayEvent.update({ where: { id: row.id }, data: { receivedAt: new Date(Date.now() - 10 * 60_000) } });
    expect(await read(await toSchool(diedBody))).toEqual({ status: 200, body: expect.objectContaining({ outcome: "settled" }) });
    expect(await db.feeReceipt.count({ where: { paymentId: died.paymentId } })).toBe(1);
  });
});

describe("QA-02 · the company's webhooks (passes and seats)", () => {
  it("passes: a settlement that throws is 500 and re-processable; the retry opens the pass once", async () => {
    const opened = await openPassCheckout(ctx(id.adult!, "STUDENT", schoolId, id.adultM), { plan: "STUDENT", period: "YEAR" });
    if (!opened.ok) throw new Error(opened.errorKey);
    const body = JSON.stringify({ id: `evt_zzfixa${STAMP}_p`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_p`, order_id: opened.checkout.orderId, amount: opened.checkout.amountPaise } } } });
    inject.pass = 1;
    const first = await read(await toCompany(passHook, "/api/webhooks/razorpay/platform", body));
    expect(first).toEqual({ status: 500, body: expect.objectContaining({ ok: false, code: "NOT_PROCESSED" }) });
    expect((await db.gigGatewayEvent.findFirstOrThrow({ where: { provider: "RAZORPAY_PASS", eventId: `evt_zzfixa${STAMP}_p` } })).processedAt).toBeNull();
    expect((await db.passOrder.findUniqueOrThrow({ where: { id: opened.order.id } })).status).not.toBe("PAID");
    expect(await read(await toCompany(passHook, "/api/webhooks/razorpay/platform", body))).toEqual({ status: 200, body: expect.objectContaining({ ok: true, outcome: "settled" }) });
    expect(await read(await toCompany(passHook, "/api/webhooks/razorpay/platform", body))).toEqual({ status: 200, body: { ok: true, outcome: "already" } });
    expect((await db.passOrder.findUniqueOrThrow({ where: { id: opened.order.id } })).status).toBe("PAID");
    expect(await db.passInvoice.count({ where: { passOrderId: opened.order.id } })).toBe(1);
    expect(await db.entitlement.count({ where: { orderId: opened.order.id } })).toBe(PLAN_FEATURES.STUDENT.length);
  });

  it("seats: a settlement that throws is 500 and re-processable; the retry settles, and a redelivery does not settle again", async () => {
    const body = JSON.stringify({ id: `evt_zzfixa${STAMP}_s`, event: "payment.captured", payload: { payment: { entity: { id: `pay_zzfixa${STAMP}_s`, order_id: `order_zzfixa${STAMP}_s`, amount: 5_000 } } } });
    inject.seat = 1;
    inject.seatCalls = 0;
    expect(await read(await toCompany(seatHook, "/api/webhooks/gateway/sessions", body))).toEqual({ status: 500, body: expect.objectContaining({ ok: false, code: "NOT_PROCESSED" }) });
    expect((await db.gigGatewayEvent.findFirstOrThrow({ where: { provider: "RAZORPAY", eventId: `evt_zzfixa${STAMP}_s` } })).processedAt).toBeNull();
    expect(await read(await toCompany(seatHook, "/api/webhooks/gateway/sessions", body))).toEqual({ status: 200, body: expect.objectContaining({ ok: true, outcome: "settled" }) });
    expect(await read(await toCompany(seatHook, "/api/webhooks/gateway/sessions", body))).toEqual({ status: 200, body: { ok: true, outcome: "already" } });
    expect(inject.seatCalls).toBe(2); // the failed try and the retry; the redelivery settled nothing
  });
});
