/**
 * Paid seats and passes, the money's own states: Medium findings of the testing analysis of 13 November 2026, each
 * held by a case that fails while the defect stands.
 *
 *   TA-184  A capture after the seat was given back was settled, HELD for the expert and announced as "confirmed",
 *           with nothing to refund it.
 *   TA-188  A failed attempt's order was replaced on the same row, so a late capture of the first order was "unknown".
 *   TA-241  The void, the reopened checkout and the refund wrote the status by id after reading it, so a capture (or a
 *           second refund) landing in between was written over.
 *   TA-187  "Stop paying" an expert still released their held seats to them.
 *   TA-191  A teacher's commission invoice (no state on record) always charged IGST with no place of supply.
 *   TA-450  A commission invoice took the day the operator typed for the transfer, in any year's series.
 *   TA-258  A refund the gateway made whose answer was lost was recorded as not made, for a seat and for a pass.
 *
 * As the database's owner (tests/setup.ts), so the rules and not the policies (the app-role half is
 * tests/ta-plans-payments-app-role.test.ts). The rows are made directly — a scratch ZZ school, ZZ people, their slots,
 * bookings, payments and one pass order — and removed afterwards. The shared GigSettings row (the switch, the company's
 * details, the invoice prefix) is set for the suite and put back as it was; the gateway is devbox, except where a case
 * stubs `fetch` under a made-up company key on a `.invalid` host (nothing leaves the machine).
 */
import { randomBytes } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient, type Prisma } from "@prisma/client";
import { financialYearOf, markOrderFailed, openCheckout, recordPayout, refundSeatPayment, releaseDue, retrySeatPayment } from "@/lib/gig-payments";
import { seatCheckout, settleSeatPayment } from "@/lib/gig-sessions";
import { refundPassOrder } from "@/lib/pass-orders";
import { seal } from "@/lib/secret-box";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const PREFIX = String.fromCharCode(88 + (STAMP % 3), 65 + (Math.floor(STAMP / 3) % 26));
const HOUR = 3_600_000;
const ids: Record<string, string> = {};
const SETTINGS_SELECT = { paymentsEnabled: true, invoicePrefix: true, companyLegalName: true, companyGstin: true, companyAddress: true, companyStateCode: true, invoiceSacCode: true, gstPercent: true } as const;
let saved: Prisma.GigSettingsGetPayload<{ select: typeof SETTINGS_SELECT }> | null = null;
let n = 0;

const ctx = (key: string, role: ActiveContext["role"], flags: { isSuperuser?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: null, schoolId: null, role, user: { id: ids[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-taps-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: false, isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const operator = () => ctx("operator", null, { isSuperuser: true });
const guardian = () => ctx("guardian", "PARENT");

/** A slot of the given provider with one booking and its payment, made as the rows stand at that moment. */
async function seat(provider: "expert" | "teacher", payment: Record<string, unknown>, booking: Record<string, unknown> = {}) {
  n += 1;
  const slot = await db.gigSlot.create({ data: { providerUserId: ids[provider]!, providerKind: provider === "expert" ? "EXPERT" : "TEACHER", kind: "WORKSHOP", title: `ZZ TA seat ${STAMP}-${n}`, startsAt: new Date(Date.now() + 72 * HOUR + n * HOUR), endsAt: new Date(Date.now() + 73 * HOUR + n * HOUR), meetingUrl: `https://meet.jit.si/zz-taps-${STAMP}-${n}`, seats: 5, seatsTaken: 1, pricePaise: 10000 }, select: { id: true, title: true } });
  const b = await db.gigBooking.create({ data: { schoolId: ids.school!, slotId: slot.id, studentMembershipId: ids.pupilMember!, providerUserId: ids[provider]!, kind: "WORKSHOP", bookedByUserId: ids.guardian!, purpose: "ZZ a paid seat for the money's states.", status: "PENDING_PAYMENT", paid: true, ...booking }, select: { id: true } });
  const orderId = `order_zztaps${STAMP}n${n}`;
  const p = await db.sessionPayment.create({ data: { bookingId: b.id, slotId: slot.id, payerUserId: ids.guardian!, expertUserId: ids[provider]!, amountPaise: 10000, commissionPaise: 2000, gstPaise: 360, netPaise: 7640, orderId, status: "INITIATED", path: provider === "expert" ? "ROUTE" : "COMPANY", ...payment }, select: { id: true } });
  return { slotId: slot.id, title: slot.title, bookingId: b.id, paymentId: p.id, orderId };
}
const paymentOf = (id: string) => db.sessionPayment.findUniqueOrThrow({ where: { id } });
const notes = (needle: string) => db.notification.count({ where: { userId: ids.guardian, title: { contains: needle } } });

/** A second connection holds an uncommitted write on the payment row while `work` runs into it, then commits. */
async function whileHeld<T>(paymentId: string, data: Record<string, unknown>, work: () => Promise<T>): Promise<T> {
  const other = new PrismaClient();
  let written!: () => void;
  let release!: () => void;
  const didWrite = new Promise<void>((r) => (written = r));
  const gate = new Promise<void>((r) => (release = r));
  const held = other.$transaction(
    async (tx) => {
      await tx.sessionPayment.update({ where: { id: paymentId }, data });
      written();
      await gate;
    },
    { timeout: 30_000 },
  );
  await didWrite;
  const running = work();
  await new Promise((r) => setTimeout(r, 700));
  release();
  await held;
  const result = await running;
  await other.$disconnect();
  return result;
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  const row = await db.gigSettings.findUnique({ where: { id: "gigs" }, select: SETTINGS_SELECT });
  if (!row) throw new Error("GigSettings has no row: run any gig door once first");
  saved = row;
  await db.gigSettings.update({ where: { id: "gigs" }, data: { paymentsEnabled: true, invoicePrefix: PREFIX, companyLegalName: "ZZ Shalaghar Test Private Limited", companyGstin: "27AAACZ1234A1Z5", companyAddress: "ZZ 1 Test Road, Pune", companyStateCode: "27", invoiceSacCode: "998599", gstPercent: 18 } });
  ids.school = (await db.school.create({ data: { name: `ZZ TA Seats School ${STAMP}`, slug: `zz-taps-${STAMP}`, code: `ZZTAPS${STAMP}`, contactEmail: `zz-taps-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
  const user = async (key: string, extra: Record<string, unknown> = {}) => (ids[key] = (await db.user.create({ data: { name: `ZZ TA ${key} ${STAMP}`, email: `zz-taps-${key}-${STAMP}@test.invalid`, ...extra }, select: { id: true } })).id);
  await user("expert");
  await db.expertProfile.create({ data: { userId: ids.expert!, headline: "ZZ Expert for the money's states", offering: "BOTH", publishedAt: new Date(), kycStatus: "VERIFIED", verifiedAt: new Date() } });
  await db.expertPayoutAccount.create({ data: { expertUserId: ids.expert!, status: "ACTIVE", payeeName: "ZZ Expert Payee", gstStateCode: "27", linkedAccountId: `acc_devboxzztaps${STAMP}`, routeStatus: "ACTIVATED" } });
  await user("teacher");
  ids.teacherMember = (await db.membership.create({ data: { userId: ids.teacher!, schoolId: ids.school!, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  await db.gigPayee.create({ data: { userId: ids.teacher!, upiId: `zz-taps-${STAMP}@upi`, payeeName: "ZZ Teacher Payee" } });
  await user("pupil", { isMinor: true });
  await user("guardian");
  await user("operator", { isSuperuser: true });
  ids.pupilMember = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.guardian!, studentMembershipId: ids.pupilMember!, studentSchoolId: ids.school!, status: "ACTIVE" } });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

afterAll(async () => {
  const users = ["expert", "teacher", "pupil", "guardian", "operator"].map((k) => ids[k]).filter((x): x is string => Boolean(x));
  await db.gigSlot.deleteMany({ where: { providerUserId: { in: users } } });
  await db.expertPayout.deleteMany({ where: { expertUserId: { in: users } } });
  await db.entitlement.deleteMany({ where: { userId: { in: users } } });
  await db.passInvoice.deleteMany({ where: { payerUserId: { in: users } } });
  await db.passOrder.deleteMany({ where: { OR: [{ userId: { in: users } }, { payerUserId: { in: users } }] } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { schoolId: ids.school ?? "none" }, { targetId: { in: users } }] } }).catch(() => {});
  if (ids.school) await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  if (saved) await db.gigSettings.update({ where: { id: "gigs" }, data: saved });
  await db.$disconnect();
});

/** The company's gateway with a made-up key, `fetch` answering as given; nothing leaves the machine. */
function companyGateway(answer: (url: string, method: string) => Response | Promise<Response>) {
  vi.stubEnv("GATEWAY_PLATFORM_KEY_ID", "rzp_test_zztaps");
  vi.stubEnv("GATEWAY_PLATFORM_SECRET_ENC", seal("zz-taps-secret", "gateway:platform:secret"));
  vi.stubEnv("GATEWAY_PLATFORM_WEBHOOK_SECRET", "zz-taps-webhook");
  vi.stubEnv("GATEWAY_PLATFORM_API_BASE", "https://zz-taps-gateway.invalid");
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => answer(String(url), init.method ?? "GET"));
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("a capture against the seat's own state", () => {
  it("TA-184: money that arrives after the seat was given back is refunded, the booking stays cancelled and nobody is told it is confirmed", async () => {
    const s = await seat("expert", { status: "FAILED", reason: "expired unpaid" }, { status: "CANCELLED", cancelledAt: new Date(), cancelReason: "unpaid" });
    const result = await settleSeatPayment({ orderId: s.orderId, gatewayPaymentId: `pay_zztaps${STAMP}late`, amountPaise: 10000 });
    expect(result.outcome).toBe("given-back");
    expect(await paymentOf(s.paymentId)).toMatchObject({ status: "REFUNDED", netPaise: 0, pendingAction: null });
    expect((await db.gigBooking.findUniqueOrThrow({ where: { id: s.bookingId }, select: { status: true } })).status).toBe("CANCELLED");
    expect(await notes(`${s.title} is confirmed`)).toBe(0);
    expect(await notes(`${s.title} has been refunded`)).toBe(1);
  });

  it("TA-188: a failed attempt is tried again on the same order, so a late capture of the first attempt settles the seat", async () => {
    const s = await seat("teacher", {});
    expect(await markOrderFailed(s.orderId, "ZZ card declined")).toBe(true);
    const again = await seatCheckout(guardian(), s.bookingId);
    expect(again).toMatchObject({ ok: true, checkout: { orderId: s.orderId } });
    expect(await settleSeatPayment({ orderId: s.orderId, gatewayPaymentId: `pay_zztaps${STAMP}first`, amountPaise: 10000 })).toMatchObject({ outcome: "settled" });
    expect((await paymentOf(s.paymentId)).status).toBe("HELD");
  });
});

describe("TA-241: every status write is a claim on the status it read", () => {
  it("TA-241: the void of an unpaid seat does not write FAILED over a capture that committed while it waited", async () => {
    const s = await seat("expert", {});
    const outcome = await whileHeld(s.paymentId, { status: "PAID", paymentId: `pay_zztaps${STAMP}race`, paidAt: new Date() }, () => refundSeatPayment(s.bookingId, "expired unpaid", null));
    expect(outcome).toBe("refunded");
    expect((await paymentOf(s.paymentId)).status).toBe("REFUNDED");
  });

  it("TA-241: a reopened checkout does not write INITIATED over a capture that committed while it waited", async () => {
    const s = await seat("teacher", { status: "FAILED", reason: "ZZ declined" });
    const input = { bookingId: s.bookingId, slotId: s.slotId, schoolId: ids.school!, payerUserId: ids.guardian!, expertUserId: ids.teacher!, amountPaise: 10000, title: s.title, pupilName: "ZZ pupil", payerName: "ZZ guardian", payerEmail: null };
    const result = await whileHeld(s.paymentId, { status: "PAID", paymentId: `pay_zztaps${STAMP}reopen`, paidAt: new Date() }, () => openCheckout(input));
    expect(result).toMatchObject({ ok: false, errorKey: "gigs.refuseAlreadyPaid" });
    expect(await paymentOf(s.paymentId)).toMatchObject({ status: "PAID", orderId: s.orderId });
  });

  it("TA-241: the job's refund and the operator's, at once, refund once", async () => {
    const s = await seat("expert", { status: "HELD", paymentId: `pay_zztaps${STAMP}twice`, paidAt: new Date(), transferId: `trf_zztaps${STAMP}twice`, pendingAction: "REFUND" });
    const [job, retry] = await Promise.all([refundSeatPayment(s.bookingId, "ZZ refund", null), retrySeatPayment(operator(), s.paymentId)]);
    expect(await db.auditLog.count({ where: { action: "gig.payment.refunded", targetId: s.paymentId } })).toBe(1);
    // Whichever came first refunded; the other found nothing left to refund.
    expect([job, retry.ok ? retry.outcome : retry.errorKey]).toContain("refunded");
    expect(await paymentOf(s.paymentId)).toMatchObject({ status: "REFUNDED", pendingAction: null });
  });
});

describe("TA-187: 'Stop paying' an expert", () => {
  it("TA-187: holds their seats past the hold's end, in the job and at the operator's retry, until the stop is lifted", async () => {
    // The hold ended in 2000, and the run is told it is 2 January 2000: no other row anywhere is that old.
    const s = await seat("expert", { status: "HELD", paymentId: `pay_zztaps${STAMP}stop`, paidAt: new Date(), transferId: `trf_zztaps${STAMP}stop`, holdUntil: new Date("2000-01-01T00:00:00Z") }, { status: "DELIVERED" });
    const at = new Date("2000-01-02T00:00:00Z");
    await db.expertPayoutAccount.update({ where: { expertUserId: ids.expert! }, data: { status: "SUSPENDED", note: "ZZ papers queried" } });
    await releaseDue(at);
    expect((await paymentOf(s.paymentId)).status).toBe("HELD");
    await db.sessionPayment.update({ where: { id: s.paymentId }, data: { pendingAction: "RELEASE" } });
    expect(await retrySeatPayment(operator(), s.paymentId, at)).toMatchObject({ ok: false, errorKey: "gigs.refuseExpertStopped" });
    expect((await paymentOf(s.paymentId)).status).toBe("HELD");
    await db.expertPayoutAccount.update({ where: { expertUserId: ids.expert! }, data: { status: "ACTIVE", note: null } });
    await releaseDue(at);
    expect((await paymentOf(s.paymentId)).status).toBe("RELEASED");
  });
});

describe("a teacher's commission invoice, recorded with the payout", () => {
  it("TA-191 and TA-450: no state on record is the company's own state (CGST+SGST, the place of supply printed), and the invoice carries the day it is issued, not the day typed", async () => {
    const payout = await db.expertPayout.create({ data: { expertUserId: ids.teacher!, netPaise: 7640, paymentsCount: 1, status: "OPEN" }, select: { id: true } });
    await seat("teacher", { status: "DUE", paymentId: `pay_zztaps${STAMP}due`, paidAt: new Date(), dueAt: new Date(), payoutId: payout.id, receiptNumber: `${PREFIX}-R/X/${STAMP}`, receiptSerial: 1 }, { status: "DELIVERED" });
    const before = Date.now();
    const recorded = await recordPayout(operator(), payout.id, { reference: `ZZUTR${STAMP}T`, paidAt: "2020-01-15T10:00:00+05:30" });
    expect(recorded.ok).toBe(true);
    const invoice = await db.gigInvoice.findUniqueOrThrow({ where: { payoutId: payout.id } });
    expect(invoice).toMatchObject({ taxableValuePaise: 2000, cgstPaise: 180, sgstPaise: 180, igstPaise: 0, totalPaise: 2360, series: `${PREFIX}C/${financialYearOf(new Date()).slice(2)}` });
    expect(JSON.parse(invoice.buyerJson)).toMatchObject({ name: "ZZ Teacher Payee", gstin: null, stateCode: "27" });
    expect(invoice.issuedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    // The day typed stays the transfer's.
    expect((await db.expertPayout.findUniqueOrThrow({ where: { id: payout.id }, select: { paidAt: true } })).paidAt?.toISOString()).toBe("2020-01-15T04:30:00.000Z");
  });
});

describe("TA-258: a refund whose answer was lost", () => {
  const refundedAnswer = (paymentId: string, amount: number) => (url: string, method: string) => {
    if (method === "POST" && url.includes("/refund")) throw new TypeError("fetch failed: the answer never came");
    if (method === "GET" && url.endsWith(`/v1/payments/${paymentId}`)) return json({ id: paymentId, amount, amount_refunded: amount, status: "refunded" });
    return json({ error: { description: "ZZ not expected" } }, 400);
  };

  it("TA-258: a seat's refund the gateway made is recorded as made, not left waiting to be asked again for ever", async () => {
    const paymentId = `pay_zztaps${STAMP}lost`;
    const s = await seat("teacher", { status: "HELD", paymentId, paidAt: new Date() }, { status: "CONFIRMED" });
    companyGateway(refundedAnswer(paymentId, 10000));
    expect(await refundSeatPayment(s.bookingId, "ZZ cancelled in time", null)).toBe("refunded");
    expect(await paymentOf(s.paymentId)).toMatchObject({ status: "REFUNDED", pendingAction: null, netPaise: 0 });
  });

  it("TA-258: a pass's refund the gateway made ends the pass, revokes its rows and is audited", async () => {
    const paymentId = `pay_zztapspass${STAMP}`;
    const order = await db.passOrder.create({ data: { userId: ids.pupil!, payerUserId: ids.guardian!, planCode: "STUDENT", period: "MONTH", amountPaise: 9900, gstPaise: 1782, totalPaise: 11682, gstPercent: 18, gatewayOrderId: `order_zztapspass${STAMP}`, gatewayPaymentId: paymentId, status: "PAID", paidAt: new Date() }, select: { id: true } });
    await db.entitlement.create({ data: { userId: ids.pupil!, feature: "ASSISTANT", source: "ORDER", planCode: "STUDENT", validFrom: new Date(), validTo: new Date(Date.now() + 30 * 24 * HOUR), orderId: order.id } });
    companyGateway(refundedAnswer(paymentId, 11682));
    expect(await refundPassOrder(operator(), order.id)).toMatchObject({ ok: true });
    expect((await db.passOrder.findUniqueOrThrow({ where: { id: order.id }, select: { status: true } })).status).toBe("REFUNDED");
    expect(await db.entitlement.count({ where: { orderId: order.id, revokedAt: null } })).toBe(0);
    expect(await db.auditLog.count({ where: { action: "operator.pass.refund", targetId: order.id } })).toBe(1);
  });
});
