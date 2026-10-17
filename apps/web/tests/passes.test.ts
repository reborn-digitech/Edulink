/**
 * PASSES BOUGHT THROUGH RAZORPAY (17 October 2026; src/lib/pass-orders.ts, decision 0006), under the devbox gateway.
 *
 * What is proved: the order (the plan's own price with its GST, a reopened checkout handed the same order); the
 * checkout's confirm (the signature, the ORDER entitlements, the tax invoice); the platform webhook (signed, stored
 * once by the signed body's id, a capture settling once whichever door arrives first, a seat's order ignored, a bad
 * signature refused, a failed attempt then a capture on the same order); a guardian buying for a child under eighteen
 * (the rows on the child, the payer on the order); a pupil under eighteen refused Pay and asking instead, their
 * guardian told once a day; an adult child buying their own; a renewal extending from the current end; the invoice
 * numbers in the PASS series and the PDF; the operator's refund (in full, revoking, audited, refused twice, refused
 * after seven days and to anybody else); the 402 lifting the moment the pass is paid; a plan not asked for and a sale
 * not open; an amount that does not match; and the pass:expiring job telling a week and a day ahead, once.
 *
 * As the database's owner (tests/setup.ts), so the rules and not the policies. The company's details and the prices
 * come from setPassSaleForTests, never the shared GigSettings and PersonPlan rows another suite changes while it runs;
 * the test's own invoice prefix makes its numbers start at 0001. ZZ rows of its own only, removed after.
 */
import { randomBytes } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLAN_FEATURES, PLATFORM_FEATURES, passOverviewSchema, passOrderSchema } from "@edulink/contracts";
import { setFeaturesForTests, mayUse } from "@/lib/platform-features";
import { planLockFor, setActivePlansForTests } from "@/lib/person-plans";
import {
  askGuardianForPass,
  confirmPassCheckout,
  markPassPaid,
  myPassOrders,
  openPassCheckout,
  operatorPassOrders,
  passExpiringNotices,
  passFigures,
  passInvoiceView,
  passOverview,
  refundPassOrder,
  setPassSaleForTests,
} from "@/lib/pass-orders";
import { financialYearOf, type CompanyDetails } from "@/lib/gig-payments";
import { renderPassInvoicePdf } from "@/lib/gig-invoice-pdf";
import { signSeatCheckout, signSessionsWebhook } from "@/lib/gig-gateway";
import { actionKey } from "@/lib/safety-labels";
import { POST as webhook } from "@/app/api/webhooks/razorpay/platform/route";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
/** The test's own invoice series, so its numbers start at 0001 whatever the server already issued. */
const PREFIX = `ZP${String(STAMP).slice(-6)}`;
const COMPANY: CompanyDetails = { legalName: "ZZ Shalaghar Test Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 1 Test Road, Pune", stateCode: "27", sacCode: "998431", invoicePrefix: PREFIX, gstPercent: 18, missing: [] };
const PRICES = { STUDENT: { monthly: 9_900, yearly: 99_900 }, TEACHER: { monthly: 19_900, yearly: 199_900 }, EXPERT: { monthly: 49_900, yearly: 499_900 } };

let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};

const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean; isMinor?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-pass-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: Boolean(flags.isMinor), isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const teacher = () => ctx("teacher", "TEACHER", schoolId);
const minor = () => ctx("minor", "STUDENT", schoolId, { isMinor: true });
const adult = () => ctx("adult", "STUDENT", schoolId);
const guardian = () => ctx("guardian", "PARENT", null);
const expert = () => ctx("expert", "EXPERT", null);
const operator = () => ctx("operator", null, null, { isSuperuser: true });

const deliver = (body: string, signature: string | null) => webhook(new Request("http://localhost/api/webhooks/razorpay/platform", { method: "POST", headers: { "content-type": "application/json", ...(signature ? { "x-razorpay-signature": signature } : {}) }, body }));
let seq = 0;
const captured = (orderId: string, amount: number, paymentId = `pay_zzpass${STAMP}${(seq += 1)}`) => JSON.stringify({ event: "payment.captured", created_at: Math.floor(Date.now() / 1000) + seq, payload: { payment: { entity: { id: paymentId, order_id: orderId, amount } } } });
const rowsOf = (orderId: string) => db.entitlement.findMany({ where: { orderId }, orderBy: { feature: "asc" } });

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  setPassSaleForTests({ company: COMPANY, prices: PRICES });
  const s = await db.school.create({ data: { name: `ZZ Pass School ${STAMP}`, slug: `zz-pass-${STAMP}`, code: `ZPS${String(STAMP).slice(-6)}`, contactEmail: `zz-pass-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } });
  schoolId = s.id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    const user = await db.user.create({ data: { name: `ZZ ${key} ${STAMP}`, email: `zz-pass-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...flags }, select: { id: true } });
    id[key] = user.id;
    if (role) member[key] = (await db.membership.create({ data: { userId: user.id, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZPS${key}${STAMP}`, gradeLevel: "8" } : {}) }, select: { id: true } })).id;
  };
  await person("teacher", "TEACHER");
  await person("minor", "STUDENT", { isMinor: true, birthdate: new Date("2014-05-01T00:00:00Z") });
  await person("adult", "STUDENT", { birthdate: new Date("2004-05-01T00:00:00Z") });
  await person("guardian", null, { prefs: JSON.stringify({ locale: "mr" }) });
  await person("expert", null);
  await person("operator", null, { isSuperuser: true });
  for (const child of ["minor", "adult"]) await db.guardianship.create({ data: { parentUserId: id.guardian!, studentMembershipId: member[child]!, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterEach(() => {
  setFeaturesForTests([...PLATFORM_FEATURES]);
  setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]);
  setPassSaleForTests({ company: COMPANY, prices: PRICES });
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
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: people } }, { targetId: { in: [...orders, ...Object.values(member)] } }] } });
  await db.gigGatewayEvent.deleteMany({ where: { provider: "RAZORPAY_PASS", payloadJson: { contains: `zzpass${STAMP}` } } });
  await db.guardianship.deleteMany({ where: { parentUserId: id.guardian } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

/** A paid pass for a context: the order, then the checkout's own confirm with a devbox signature. */
async function paidPass(who: ActiveContext, input: Parameters<typeof openPassCheckout>[1], now?: Date) {
  const opened = await openPassCheckout(who, input, now);
  if (!opened.ok) throw new Error(`checkout refused: ${opened.errorKey}`);
  const payment = `pay_zzpass${STAMP}c${(seq += 1)}`;
  const confirmed = await confirmPassCheckout(who, { orderId: opened.order.id, gatewayPaymentId: payment, signature: signSeatCheckout(opened.checkout.orderId, payment) }, now);
  expect(confirmed.outcome).toBe("settled");
  return { ...opened, payment, order: confirmed.order };
}

/* -------------------------------------------------------------------------- */

describe("the figures and the offers", () => {
  beforeAll(() => setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]));

  it("adds GST at the company's rate to the plan's price, rounded to the paisa", () => {
    expect(passFigures("MONTH", 9_900, 18)).toEqual({ period: "MONTH", amountPaise: 9_900, gstPaise: 1_782, totalPaise: 11_682 });
    expect(passFigures("YEAR", 199_900, 18)).toEqual({ period: "YEAR", amountPaise: 199_900, gstPaise: 35_982, totalPaise: 235_882 });
  });

  it("offers each role its own plan, a guardian each child, and says who may pay", async () => {
    const t = passOverviewSchema.parse(await passOverview(teacher()));
    expect(t.offers).toHaveLength(1);
    expect(t.offers[0]).toMatchObject({ plan: "TEACHER", buy: "PAY", holder: { self: true } });
    expect(t.offers[0]!.prices.map((p) => p.totalPaise)).toEqual([23_482, 235_882]);
    expect((await passOverview(minor())).offers[0]).toMatchObject({ plan: "STUDENT", buy: "ASK_GUARDIAN" });
    expect((await passOverview(adult())).offers[0]).toMatchObject({ plan: "STUDENT", buy: "PAY" });
    const g = await passOverview(guardian());
    expect(g.offers.map((o) => [o.holder.studentMembershipId, o.buy]).sort()).toEqual([[member.adult, "ADULT_BUYS_OWN"], [member.minor, "PAY"]].sort());
    expect((await passOverview(operator())).offers).toEqual([]);
  });

  it("sells nothing while the plan is not asked for, nor while the company cannot invoice", async () => {
    setActivePlansForTests([]);
    expect((await passOverview(teacher())).offers[0]!.buy).toBe("NOT_ASKED");
    expect(await openPassCheckout(teacher(), { plan: "TEACHER", period: "MONTH" })).toEqual({ ok: false, errorKey: "passes.refuseNotAsked" });
    setActivePlansForTests(["TEACHER"]);
    setPassSaleForTests({ company: { ...COMPANY, gstin: null, missing: ["gstin"] }, prices: PRICES });
    expect((await passOverview(teacher())).offers[0]!.buy).toBe("NOT_ON_SALE");
    expect(await openPassCheckout(teacher(), { plan: "TEACHER", period: "MONTH" })).toEqual({ ok: false, errorKey: "passes.refuseNotOnSale" });
    setPassSaleForTests({ company: COMPANY, prices: { ...PRICES, TEACHER: { monthly: 0, yearly: 0 } } });
    expect((await passOverview(teacher())).offers[0]!.buy).toBe("NOT_ON_SALE");
  });
});

describe("the order and the checkout's confirm", () => {
  beforeAll(() => setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]));

  it("makes the order at the plan's price with its GST, and hands the same order back when reopened", async () => {
    const a = await openPassCheckout(teacher(), { plan: "TEACHER", period: "MONTH" });
    if (!a.ok) throw new Error(a.errorKey);
    expect(a.order).toMatchObject({ plan: "TEACHER", period: "MONTH", amountPaise: 19_900, gstPaise: 3_582, totalPaise: 23_482, status: "CREATED", holderUserId: id.teacher, payerUserId: id.teacher });
    expect(a.checkout).toMatchObject({ paymentId: a.order.id, amountPaise: 23_482, currency: "INR", transport: "devbox", keyId: "devbox" });
    expect(a.checkout.orderId).toMatch(/^order_devbox/);
    const b = await openPassCheckout(teacher(), { plan: "TEACHER", period: "MONTH" });
    expect(b.ok && b.order.id).toBe(a.order.id);
    expect(await db.auditLog.count({ where: { action: "pass.order.start", targetId: a.order.id } })).toBe(1);
    // A plan the role does not buy, and a period not sold, are refused.
    await expect(openPassCheckout(teacher(), { plan: "EXPERT", period: "MONTH" })).rejects.toMatchObject({ key: "passes.refuseWrongPlan" });
    setPassSaleForTests({ company: COMPANY, prices: { ...PRICES, TEACHER: { monthly: 19_900, yearly: 0 } } });
    expect(await openPassCheckout(teacher(), { plan: "TEACHER", period: "YEAR" })).toEqual({ ok: false, errorKey: "passes.refusePeriod" });
  });

  it("confirms with the gateway's signature: PAID, the ORDER rows for every feature, the invoice, the holder told", async () => {
    const opened = await openPassCheckout(expert(), { plan: "EXPERT", period: "YEAR" });
    if (!opened.ok) throw new Error(opened.errorKey);
    await expect(confirmPassCheckout(expert(), { orderId: opened.order.id, gatewayPaymentId: "pay_zzforged", signature: "00".repeat(32) })).rejects.toMatchObject({ key: "passes.refuseBadSignature" });
    await expect(confirmPassCheckout(teacher(), { orderId: opened.order.id, gatewayPaymentId: "pay_zz", signature: "x" })).rejects.toMatchObject({ key: "passes.noSuchOrder" });
    const payment = `pay_zzpass${STAMP}e`;
    const now = new Date();
    const done = await confirmPassCheckout(expert(), { orderId: opened.order.id, gatewayPaymentId: payment, signature: signSeatCheckout(opened.checkout.orderId, payment) }, now);
    expect(done.outcome).toBe("settled");
    expect(passOrderSchema.parse(done.order)).toMatchObject({ status: "PAID", invoiceNumber: `${PREFIX}-PASS/${financialYearOf(now)}/0001` });
    const rows = await rowsOf(opened.order.id);
    expect(rows.map((r) => r.feature)).toEqual([...PLAN_FEATURES.EXPERT].sort());
    expect(rows.every((r) => r.source === "ORDER" && r.planCode === "EXPERT" && r.userId === id.expert && r.validTo.getTime() > now.getTime() + 364 * DAY)).toBe(true);
    expect(await db.notification.count({ where: { userId: id.expert, titleKey: "passes.notifPaidExpert" } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "pass.order.paid", targetId: opened.order.id } })).toBe(1);
    // The same confirm again is "already", and writes nothing more.
    expect((await confirmPassCheckout(expert(), { orderId: opened.order.id, gatewayPaymentId: payment, signature: signSeatCheckout(opened.checkout.orderId, payment) })).outcome).toBe("already");
    expect(await rowsOf(opened.order.id)).toHaveLength(rows.length);
  });

  it("refuses a capture of another amount, and says so in the log", async () => {
    const opened = await openPassCheckout(adult(), { plan: "STUDENT", period: "MONTH" });
    if (!opened.ok) throw new Error(opened.errorKey);
    expect((await markPassPaid({ orderId: opened.checkout.orderId, gatewayPaymentId: `pay_zzpass${STAMP}m`, amountPaise: 100 })).outcome).toBe("amount-mismatch");
    expect(await db.auditLog.count({ where: { action: "pass.order.mismatch", targetId: opened.order.id } })).toBe(1);
    expect((await db.passOrder.findUniqueOrThrow({ where: { id: opened.order.id } })).status).toBe("CREATED");
  });
});

describe("the platform webhook", () => {
  beforeAll(() => setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]));

  it("settles once by the signed body, answers a redelivery 'already', ignores a seat's order and refuses a bad signature", async () => {
    const opened = await openPassCheckout(adult(), { plan: "STUDENT", period: "YEAR" });
    if (!opened.ok) throw new Error(opened.errorKey);
    const body = captured(opened.checkout.orderId, opened.checkout.amountPaise);
    expect((await deliver(body, "f".repeat(64))).status).toBe(401);
    expect((await deliver(body, null)).status).toBe(401);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ ok: true, outcome: "settled" });
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "already" });
    // A second event about the same capture (another created_at) reaches the door, which settles nothing twice.
    const paymentId = JSON.parse(body).payload.payment.entity.id as string;
    const again = captured(opened.checkout.orderId, opened.checkout.amountPaise, paymentId);
    expect(await (await deliver(again, signSessionsWebhook(again))).json()).toMatchObject({ outcome: "already" });
    expect(await rowsOf(opened.order.id)).toHaveLength(PLAN_FEATURES.STUDENT.length);
    expect(await db.passInvoice.count({ where: { passOrderId: opened.order.id } })).toBe(1);
    const seat = captured(`order_zzpass${STAMP}seat`, 5_000);
    expect(await (await deliver(seat, signSessionsWebhook(seat))).json()).toMatchObject({ outcome: "ignored" });
  });

  it("marks a failed attempt FAILED, and a later signed capture on the same order still opens the pass", async () => {
    const opened = await openPassCheckout(teacher(), { plan: "TEACHER", period: "YEAR" });
    if (!opened.ok) throw new Error(opened.errorKey);
    const failed = JSON.stringify({ event: "payment.failed", created_at: Math.floor(Date.now() / 1000), payload: { payment: { entity: { id: `pay_zzpass${STAMP}f`, order_id: opened.checkout.orderId, error_description: "ZZ card declined" } } } });
    expect(await (await deliver(failed, signSessionsWebhook(failed))).json()).toMatchObject({ outcome: "failed" });
    expect(await db.passOrder.findUniqueOrThrow({ where: { id: opened.order.id } })).toMatchObject({ status: "FAILED", failedReason: "ZZ card declined" });
    const body = captured(opened.checkout.orderId, opened.checkout.amountPaise);
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "settled" });
  });
});

describe("who pays", () => {
  beforeAll(() => setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]));

  it("a pupil under eighteen is never offered Pay: the checkout is refused and the guardian is asked, once a day", async () => {
    expect(await openPassCheckout(minor(), { plan: "STUDENT", period: "MONTH" })).toEqual({ ok: false, errorKey: "passes.refuseAskGuardian" });
    expect(await askGuardianForPass(minor(), "STUDENT")).toEqual({ told: 1, already: false });
    expect(await askGuardianForPass(minor(), "STUDENT")).toEqual({ told: 0, already: true });
    const notice = await db.notification.findFirstOrThrow({ where: { userId: id.guardian, titleKey: "passes.notifAsk" } });
    expect(notice.url).toBe(`/account/plan?plan=STUDENT&child=${member.minor}`);
    expect(await db.auditLog.count({ where: { action: "pass.ask.guardian", targetId: member.minor } })).toBe(1);
    await expect(askGuardianForPass(adult(), "STUDENT")).rejects.toMatchObject({ key: "passes.refuseAskAdult" });
  });

  it("a guardian buys for a child under eighteen: the rows on the child, the payer on the order, the 402 lifted", async () => {
    const child = { userId: id.minor!, role: "STUDENT" as const };
    expect(await planLockFor("QUESTION_BANK", child)).toBe("STUDENT");
    expect(await mayUse("QUESTION_BANK", { ...child, schoolId })).toBe(false);
    const paid = await paidPass(guardian(), { plan: "STUDENT", period: "MONTH", studentMembershipId: member.minor });
    expect(paid.order).toMatchObject({ holderUserId: id.minor, payerUserId: id.guardian, status: "PAID" });
    expect((await rowsOf(paid.order.id)).every((r) => r.userId === id.minor)).toBe(true);
    expect(await planLockFor("QUESTION_BANK", child)).toBeNull();
    expect(await mayUse("QUESTION_BANK", { ...child, schoolId })).toBe(true);
    expect(await mayUse("ASSISTANT", { ...child, schoolId })).toBe(true);
    // The holder and the payer both read it; the guardian (Marathi) was told about the child.
    expect((await myPassOrders(minor())).map((o) => o.id)).toContain(paid.order.id);
    expect((await myPassOrders(guardian())).map((o) => o.id)).toContain(paid.order.id);
    expect(await db.notification.count({ where: { userId: id.guardian, titleKey: "passes.notifPaidForChild" } })).toBe(1);
    // The invoice is the payer's: issued in the payer's language, read by the payer and the operator, not by the child.
    const inv = await passInvoiceView(guardian(), paid.order.id);
    expect(inv).toMatchObject({ locale: "mr", taxableValuePaise: 9_900, cgstPaise: 891, sgstPaise: 891, igstPaise: 0, totalPaise: 11_682, buyer: { name: `ZZ guardian ${STAMP}`, gstin: null } });
    expect((await passInvoiceView(operator(), paid.order.id)).number).toBe(inv.number);
    await expect(passInvoiceView(minor(), paid.order.id)).rejects.toMatchObject({ key: "passes.noSuchInvoice" });
  });

  it("refuses a guardian's pass for a child eighteen or over, and a child not theirs", async () => {
    expect(await openPassCheckout(guardian(), { plan: "STUDENT", period: "MONTH", studentMembershipId: member.adult })).toEqual({ ok: false, errorKey: "passes.refuseAdultBuysOwn" });
    await expect(openPassCheckout(guardian(), { plan: "STUDENT", period: "MONTH", studentMembershipId: member.teacher })).rejects.toMatchObject({ key: "access.notYourChild" });
  });
});

describe("renewal, numbering and the invoice", () => {
  beforeAll(() => setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]));

  it("extends from the current end, not from today", async () => {
    const first = await paidPass(adult(), { plan: "STUDENT", period: "MONTH" });
    const end = (await rowsOf(first.order.id))[0]!.validTo;
    const second = await paidPass(adult(), { plan: "STUDENT", period: "MONTH" });
    const rows = await rowsOf(second.order.id);
    expect(rows.every((r) => r.validFrom.getTime() >= end.getTime())).toBe(true);
    expect(second.order.validFrom).toBe(rows.reduce((a, r) => (r.validFrom > a ? r.validFrom : a), new Date(0)).toISOString());
  });

  it("numbers every invoice in its own PASS series without a gap, and renders the PDF", async () => {
    const invoices = await db.passInvoice.findMany({ where: { series: `${PREFIX}-PASS/${financialYearOf(new Date())}` }, orderBy: { serial: "asc" } });
    expect(invoices.length).toBeGreaterThanOrEqual(4);
    expect(invoices.map((i) => i.serial)).toEqual(invoices.map((_, n) => n + 1));
    expect(invoices.every((i, n) => i.number === `${PREFIX}-PASS/${financialYearOf(new Date())}/${String(n + 1).padStart(4, "0")}`)).toBe(true);
    const order = await db.passOrder.findFirstOrThrow({ where: { invoiceId: invoices[0]!.id } });
    const pdf = await renderPassInvoicePdf(await passInvoiceView(operator(), order.id));
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
  });
});

describe("the operator's refund", () => {
  beforeAll(() => setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]));

  it("returns the whole total within seven days, revokes the pass's rows, is audited, and refunds once", async () => {
    const paid = await paidPass(teacher(), { plan: "TEACHER", period: "MONTH" });
    await expect(refundPassOrder(teacher(), paid.order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const r = await refundPassOrder(operator(), paid.order.id);
    if (!r.ok) throw new Error(r.errorKey);
    expect(r.order).toMatchObject({ status: "REFUNDED", refundable: false });
    expect(r.revoked).toBe(PLAN_FEATURES.TEACHER.length);
    expect((await rowsOf(paid.order.id)).every((row) => row.revokedAt !== null)).toBe(true);
    expect((await db.passOrder.findUniqueOrThrow({ where: { id: paid.order.id } })).gatewayRefundId).toMatch(/^rfnd_devbox/);
    expect(await db.auditLog.count({ where: { action: "operator.pass.refund", targetId: paid.order.id } })).toBe(1);
    expect(await refundPassOrder(operator(), paid.order.id)).toEqual({ ok: false, errorKey: "passes.refuseNotRefundable" });
    expect(await db.notification.count({ where: { userId: id.teacher, titleKey: "passes.notifRefunded" } })).toBe(1);
  });

  it("puts a pass back when the gateway says the refund failed: PAID again, its rows open again", async () => {
    const paid = await paidPass(expert(), { plan: "EXPERT", period: "MONTH" });
    const r = await refundPassOrder(operator(), paid.order.id);
    if (!r.ok) throw new Error(r.errorKey);
    const refundId = (await db.passOrder.findUniqueOrThrow({ where: { id: paid.order.id } })).gatewayRefundId!;
    const body = JSON.stringify({ event: "refund.failed", created_at: Math.floor(Date.now() / 1000), payload: { refund: { entity: { id: refundId, error_description: `ZZ zzpass${STAMP} bank refused` } } } });
    expect(await (await deliver(body, signSessionsWebhook(body))).json()).toMatchObject({ outcome: "refund-failed" });
    expect(await db.passOrder.findUniqueOrThrow({ where: { id: paid.order.id } })).toMatchObject({ status: "PAID", refundedAt: null, gatewayRefundId: null });
    expect((await rowsOf(paid.order.id)).every((row) => row.revokedAt === null)).toBe(true);
    expect(await db.auditLog.count({ where: { action: "pass.refund.failed", targetId: paid.order.id } })).toBe(1);
  });

  it("refuses a refund past seven days, and lists the month's revenue without refunded passes", async () => {
    const paid = await paidPass(teacher(), { plan: "TEACHER", period: "YEAR" });
    const late = new Date(Date.now() + 8 * DAY);
    expect(await refundPassOrder(operator(), paid.order.id, late)).toEqual({ ok: false, errorKey: "passes.refuseRefundLate", vars: { days: 7 } });
    const view = await operatorPassOrders(operator());
    expect(view.orders.find((o) => o.id === paid.order.id)).toMatchObject({ refundable: true });
    expect(view.revenue.find((r) => r.plan === "TEACHER")!.count).toBeGreaterThanOrEqual(1);
    await expect(operatorPassOrders(teacher())).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("the pass:expiring job", () => {
  it("tells a person a week and a day before their plan ends, once a day", async () => {
    // Two windows of the test's own with fixed ends, by India's calendar from today; the expert's year-long pass stands far off.
    const now = new Date();
    const today = Math.floor((now.getTime() + 330 * 60_000) / DAY);
    const indiaMidnight = (daysAhead: number) => new Date((today + daysAhead) * DAY - 330 * 60_000);
    const rows = [
      await db.entitlement.create({ data: { userId: id.operator!, feature: "ASSISTANT", source: "GRANT", planCode: "STUDENT", validFrom: new Date(now.getTime() - 30 * DAY), validTo: indiaMidnight(8) }, select: { id: true } }),
      await db.entitlement.create({ data: { userId: id.expert!, feature: "ASSISTANT", source: "GRANT", planCode: "TEACHER", validFrom: new Date(now.getTime() - 30 * DAY), validTo: indiaMidnight(2) }, select: { id: true } }),
    ];
    try {
      const scope = { userIds: [id.operator!, id.expert!] };
      expect(await passExpiringNotices(now, scope)).toEqual({ week: 1, day: 1, skipped: 0 });
      expect(await db.notification.count({ where: { userId: id.operator, titleKey: "passes.notifEndsWeekStudent" } })).toBe(1);
      expect(await db.notification.count({ where: { userId: id.expert, titleKey: "passes.notifEndsDayTeacher" } })).toBe(1);
      expect(await passExpiringNotices(now, scope)).toEqual({ week: 0, day: 0, skipped: 2 });
    } finally {
      await db.entitlement.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
    }
  });
});

describe("words", () => {
  it("has a sentence for every audit action the passes write", () => {
    for (const action of ["pass.order.start", "pass.order.paid", "pass.order.mismatch", "operator.pass.refund", "pass.refund.failed", "pass.ask.guardian"]) expect(actionKey(action), action).not.toBeNull();
  });
});
