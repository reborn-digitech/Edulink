/**
 * A PASS'S ORDER WHEN THINGS GO WRONG (QA campaign of 24 October 2026, unit layer; src/lib/pass-orders.ts).
 *
 * tests/passes.test.ts walks the happy paths under the devbox gateway. Three parts had no test (0 hits in the
 * campaign's coverage run): the operator's refund when the gateway REFUSES it (the order and its entitlements must
 * be put back, since no money moved), `passOrderStatus` (who may read an order and when the checkout is handed
 * back), and an invoice issued late because the company's details were blank at the capture. Also: the invoice is
 * the payer's, not the holder's, and a CREATED order has none.
 *
 * As the owner (tests/setup.ts). The sale's details and prices come from setPassSaleForTests, the invoice series is
 * this file's own prefix, and every row is a ZZ row of this file's, removed by id after.
 */
import { randomBytes } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PLAN_FEATURES, PLATFORM_FEATURES } from "@edulink/contracts";
import { setFeaturesForTests } from "@/lib/platform-features";
import { setActivePlansForTests } from "@/lib/person-plans";
import { confirmPassCheckout, openPassCheckout, passInvoiceView, passOrderStatus, refundPassOrder, setPassSaleForTests } from "@/lib/pass-orders";
import { type CompanyDetails } from "@/lib/gig-payments";
import { signSeatCheckout } from "@/lib/gig-gateway";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const PREFIX = `ZQ${String(STAMP).slice(-6)}`;
const COMPANY: CompanyDetails = { legalName: "ZZ Shalaghar QA Private Limited", gstin: "27AAACZ1234A1Z5", address: "ZZ 2 Test Road, Pune", stateCode: "27", sacCode: "998431", invoicePrefix: PREFIX, gstPercent: 18, missing: [] };
const PRICES = { STUDENT: { monthly: 9_900, yearly: 99_900 }, TEACHER: { monthly: 19_900, yearly: 199_900 }, EXPERT: { monthly: 49_900, yearly: 499_900 } };

let schoolId = "";
const id: Record<string, string> = {};
const member: Record<string, string> = {};
const ctx = (key: string, role: ActiveContext["role"], school: string | null, flags: { isSuperuser?: boolean; isMinor?: boolean } = {}): ActiveContext =>
  ({ sessionId: "test", membershipId: member[key] ?? null, schoolId: school, role, user: { id: id[key]!, name: `ZZ ${key}`, preferredName: null, email: `zz-passq-${key}-${STAMP}@test.invalid`, avatarKey: null, isMinor: Boolean(flags.isMinor), isSuperuser: Boolean(flags.isSuperuser), isAppAdmin: false } }) as ActiveContext;
const teacher = () => ctx("teacher", "TEACHER", schoolId);
const minor = () => ctx("minor", "STUDENT", schoolId, { isMinor: true });
const guardian = () => ctx("guardian", "PARENT", null);
const stranger = () => ctx("stranger", "TEACHER", schoolId);
const operator = () => ctx("operator", null, null, { isSuperuser: true });
const rowsOf = (orderId: string) => db.entitlement.findMany({ where: { orderId } });
let seq = 0;

async function paid(who: ActiveContext, input: Parameters<typeof openPassCheckout>[1], beforeConfirm?: () => void) {
  const opened = await openPassCheckout(who, input);
  if (!opened.ok) throw new Error(`checkout refused: ${opened.errorKey}`);
  beforeConfirm?.();
  const payment = `pay_zzpassq${STAMP}${(seq += 1)}`;
  const done = await confirmPassCheckout(who, { orderId: opened.order.id, gatewayPaymentId: payment, signature: signSeatCheckout(opened.checkout.orderId, payment) });
  expect(done.outcome).toBe("settled");
  return opened.order.id;
}

beforeAll(async () => {
  process.env.FEES_SECRET_KEY ??= randomBytes(32).toString("base64");
  setPassSaleForTests({ company: COMPANY, prices: PRICES });
  setActivePlansForTests(["STUDENT", "TEACHER", "EXPERT"]);
  schoolId = (await db.school.create({ data: { name: `ZZ PassQ School ${STAMP}`, slug: `zz-passq-${STAMP}`, code: `ZPQ${String(STAMP).slice(-6)}`, contactEmail: `zz-passq-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  const person = async (key: string, role: string | null, flags: Record<string, unknown> = {}) => {
    id[key] = (await db.user.create({ data: { name: `ZZ PassQ ${key} ${STAMP}`, email: `zz-passq-${key}-${STAMP}@test.invalid`, isTestFixture: true, ...flags }, select: { id: true } })).id;
    if (role) member[key] = (await db.membership.create({ data: { userId: id[key]!, schoolId, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `ZPQ${key}${STAMP}`, gradeLevel: "8" } : {}) }, select: { id: true } })).id;
  };
  await person("teacher", "TEACHER");
  await person("stranger", "TEACHER");
  await person("minor", "STUDENT", { isMinor: true, birthdate: new Date("2014-05-01T00:00:00Z") });
  await person("guardian", null);
  await person("operator", null, { isSuperuser: true });
  await db.guardianship.create({ data: { parentUserId: id.guardian!, studentMembershipId: member.minor!, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterEach(() => {
  vi.unstubAllEnvs();
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
  await db.guardianship.deleteMany({ where: { parentUserId: id.guardian } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

describe("the operator's refund when the gateway refuses it", () => {
  it("⚠ puts the order back to PAID and re-opens every entitlement it had revoked; nothing is audited as refunded and nobody is told", async () => {
    const orderId = await paid(teacher(), { plan: "TEACHER", period: "MONTH" });
    expect((await rowsOf(orderId)).every((r) => r.revokedAt === null)).toBe(true);
    // A key id with no sealed secret: the company's adapter refuses before any request (gig-gateway.ts platformAccount).
    vi.stubEnv("GATEWAY_PLATFORM_KEY_ID", "rzp_test_zzqahalfset");
    vi.stubEnv("GATEWAY_PLATFORM_SECRET_ENC", "");
    const quiet = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const r = await refundPassOrder(operator(), orderId);
    quiet.mockRestore();
    expect(r).toEqual({ ok: false, errorKey: "passes.refuseGatewayDown" });
    expect(await db.passOrder.findUniqueOrThrow({ where: { id: orderId } })).toMatchObject({ status: "PAID", refundedAt: null, refundedByUserId: null, gatewayRefundId: null });
    const rows = await rowsOf(orderId);
    expect(rows).toHaveLength(PLAN_FEATURES.TEACHER.length);
    expect(rows.every((row) => row.revokedAt === null)).toBe(true);
    expect(await db.auditLog.count({ where: { action: "operator.pass.refund", targetId: orderId } })).toBe(0);
    expect(await db.notification.count({ where: { userId: id.teacher, titleKey: "passes.notifRefunded" } })).toBe(0);
    // With the gateway back, the same refund goes through once.
    vi.unstubAllEnvs();
    const again = await refundPassOrder(operator(), orderId);
    expect(again.ok).toBe(true);
    expect((await rowsOf(orderId)).every((row) => row.revokedAt !== null)).toBe(true);
  });

  it("refuses an order that is not paid, and anybody but the operator, as not found", async () => {
    const opened = await openPassCheckout(teacher(), { plan: "TEACHER", period: "YEAR" });
    if (!opened.ok) throw new Error(opened.errorKey);
    expect(await refundPassOrder(operator(), opened.order.id)).toEqual({ ok: false, errorKey: "passes.refuseNotRefundable" });
    await expect(refundPassOrder(teacher(), opened.order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(refundPassOrder(operator(), "zz-no-such-order")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("an order's status", () => {
  it("the payer reads a waiting order with its checkout handed back; the holder reads it without one; anybody else is told it is not there", async () => {
    const opened = await openPassCheckout(guardian(), { plan: "STUDENT", period: "MONTH", studentMembershipId: member.minor! });
    if (!opened.ok) throw new Error(opened.errorKey);
    const asPayer = await passOrderStatus(guardian(), opened.order.id);
    expect(asPayer).toMatchObject({ status: "CREATED", reason: null, order: { id: opened.order.id, holderUserId: id.minor, payerUserId: id.guardian } });
    expect(asPayer.checkout).toMatchObject({ orderId: opened.checkout.orderId, amountPaise: opened.order.totalPaise, currency: "INR" });
    const asHolder = await passOrderStatus(minor(), opened.order.id);
    expect(asHolder.status).toBe("CREATED");
    expect(asHolder.checkout).toBeNull();
    await expect(passOrderStatus(stranger(), opened.order.id)).rejects.toMatchObject({ code: "NOT_FOUND", key: "passes.noSuchOrder" });
    // The operator reads orders through their own doors, not this one.
    await expect(passOrderStatus(operator(), opened.order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("a paid order hands back no checkout, even to its payer", async () => {
    const orderId = await paid(guardian(), { plan: "STUDENT", period: "YEAR", studentMembershipId: member.minor! });
    const s = await passOrderStatus(guardian(), orderId);
    expect(s).toMatchObject({ status: "PAID", checkout: null });
  });
});

describe("the tax invoice", () => {
  it("is the payer's: the holder who did not pay, and a stranger, are told there is none; a CREATED order has none", async () => {
    const orderId = await paid(guardian(), { plan: "STUDENT", period: "MONTH", studentMembershipId: member.minor! });
    expect((await passInvoiceView(guardian(), orderId)).line).toMatchObject({ passOrderId: orderId, plan: "STUDENT" });
    expect((await passInvoiceView(operator(), orderId)).buyer.name).toContain("ZZ PassQ guardian");
    await expect(passInvoiceView(minor(), orderId)).rejects.toMatchObject({ code: "NOT_FOUND", key: "passes.noSuchInvoice" });
    await expect(passInvoiceView(stranger(), orderId)).rejects.toMatchObject({ code: "NOT_FOUND" });
    const waiting = await openPassCheckout(teacher(), { plan: "TEACHER", period: "MONTH" });
    if (!waiting.ok) throw new Error(waiting.errorKey);
    await expect(passInvoiceView(teacher(), waiting.order.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("⚠ a capture while the company's details were blank is invoiced on first read once they are complete — once, however many read at once", async () => {
    const orderId = await paid(teacher(), { plan: "TEACHER", period: "MONTH" }, () => setPassSaleForTests({ company: { ...COMPANY, gstin: null, missing: ["gstin"] }, prices: PRICES }));
    expect((await db.passOrder.findUniqueOrThrow({ where: { id: orderId } })).invoiceId).toBeNull();
    // Still blank: nothing can be issued, and the read says there is no invoice yet.
    await expect(passInvoiceView(teacher(), orderId)).rejects.toMatchObject({ code: "NOT_FOUND", key: "passes.noSuchInvoice" });
    setPassSaleForTests({ company: COMPANY, prices: PRICES });
    // KNOWN GAP (unit.md U-1): reads arriving together race — each checks `invoiceId` before the series lock, so all
    // but one fail on the unique passOrderId and that reader gets an error (a 500 at the door). The invoice itself is
    // still issued once with no number lost, which is what this holds; the refused reads are counted, not required.
    const settled = await Promise.allSettled([passInvoiceView(teacher(), orderId), passInvoiceView(teacher(), orderId), passInvoiceView(operator(), orderId)]);
    const views = settled.flatMap((s) => (s.status === "fulfilled" ? [s.value] : []));
    for (const s of settled) if (s.status === "rejected") expect(String((s.reason as Error).message)).toMatch(/Unique constraint failed on the fields: \(`passOrderId`\)/);
    expect(views.length).toBeGreaterThanOrEqual(1);
    expect(new Set(views.map((v) => v.number)).size).toBe(1);
    // A read after the race always answers, with the same number.
    expect((await passInvoiceView(teacher(), orderId)).number).toBe(views[0]!.number);
    expect(views[0]!.number.startsWith(`${PREFIX}-PASS/`)).toBe(true);
    expect(await db.passInvoice.count({ where: { passOrderId: orderId } })).toBe(1);
    expect(views[0]).toMatchObject({ taxableValuePaise: 19_900, totalPaise: 23_482, cgstPaise: 1_791, sgstPaise: 1_791, igstPaise: 0 });
  });
});
