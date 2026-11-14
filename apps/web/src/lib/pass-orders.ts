import "server-only";
import { randomUUID } from "node:crypto";
import { normaliseLocale } from "@edulink/i18n";
import {
  PASS_PERIODS,
  PASS_REFUND_DAYS,
  type OperatorPassOrder,
  type OperatorPassOrders,
  type PassBuyState,
  type PassCheckout,
  type PassOffer,
  type PassOrderStatus,
  type PassOrderView,
  type PassOverview,
  type PassPeriod,
  type PassPrice,
  type PlanCode,
} from "@edulink/contracts";
import { translator, type TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./access-error";
import { forUser } from "./tenant-context";
import { readJson } from "./json";
import { dateKeyInZone } from "./dates";
import { noticeDate } from "./notice-dates";
import { isMinorToday } from "./student-consent";
import { BIRTHDAY_ZONE } from "./adulthood";
import { familyChildren } from "./family-child";
import { companyDetails, invoiceNumberOf, invoiceSeriesOf, type CompanyDetails, type InvoiceParty } from "./gig-payments";
import { createPassOrderAtGateway, GigGatewayError, paymentRefundedAtGateway, platformAccount, refundSeat, transport, verifySeatCheckout } from "./gig-gateway";
import { activePlans, grantPassFromOrder, myPlans, PLAN_NAME_KEY, PLAN_TABLE, planForCard, planHeldUntil, planLastDay, passWindows, restorePassEntitlements, revokePassEntitlements, windowsEndingBetween } from "./person-plans";
import type { ActiveContext } from "./session";

/**
 * PASSES BOUGHT THROUGH RAZORPAY (17 October 2026; decision 0006 and its collection rule).
 *
 * WHAT A PASS IS. A month or a year of one plan sold per person (person-plans.ts): STUDENT, TEACHER or EXPERT. The
 * plan's price (PersonPlan, frozen on the order when it is made) is the taxable value; GST at the company's rate
 * (GigSettings.gstPercent) is added and the gateway charges the total.
 *
 * WHO PAYS. A college student, a teacher and an expert buy their own plan, on a session of that role (PLAN_TABLE).
 * A guardian buys the STUDENT plan for a child under eighteen, picked from their own children; a child who is
 * eighteen or over buys their own. A pupil under eighteen never pays: they ask, and their guardians are told in
 * the app (once a day at most). Policy 0002: no card detail ever touches the platform — the gateway's page takes it.
 *
 * WHERE THE MONEY GOES. The company's own gateway account (gig-gateway.ts, the same transport, key and devbox as
 * paid seats), as the company's own revenue: a plain order, no transfer, no Route, no split. Decision 0003 is
 * untouched — a school's fees never come here.
 *
 * ONE DOOR FOR A CAPTURE: `markPassPaid`, used by the checkout's confirm, the platform webhook
 * (/api/webhooks/razorpay/platform) and the devbox page alike, so a pass settles once and the rest are told
 * "already". Inside one transaction it claims the order (CREATED or FAILED → PAID, the gateway's payment id unique
 * on the table), writes the ORDER entitlements through person-plans.ts grantPassFromOrder (the one writer of
 * Entitlement; a renewal extends from the current end) and issues the tax invoice in the company's "PASS" series
 * under the GigSettings row lock. The amount is compared with the order the server itself made.
 *
 * WHEN A PASS IS ON SALE. The plan is asked for (active), its price is set (at least ₹1), the gateway is there
 * (transport not "off") and the company's invoice details are complete (legal name, GSTIN, state code — what a tax
 * invoice cannot be issued without; the payouts' rule). Otherwise the person is told it is not on sale yet.
 *
 * REFUNDS. The operator's alone: the whole total, within PASS_REFUND_DAYS of payment, revoking the entitlements the
 * pass opened. The order is claimed REFUNDED first (so two clicks refund once), then the gateway is asked; a gateway
 * that refuses puts the order and its entitlements back as they were. A refund.failed from the webhook does the same.
 */

const SETTINGS_ID = "gigs";
const ZONE = "Asia/Kolkata";
const DAY_MS = 86_400_000;
/** A checkout reopened within this long, for the same pass at the same price, is handed the same order. */
const REUSE_ORDER_MS = 30 * 60_000;
const MONTHS_OF: Record<PassPeriod, number> = { MONTH: 1, YEAR: 12 };

export type PassResult<T> = ({ ok: true } & T) | { ok: false; errorKey: TranslationKey; vars?: Record<string, string | number> };

/* -------------------------------------------------------------------------- */
/* For the test suites                                                         */
/* -------------------------------------------------------------------------- */

/**
 * FOR THE TEST SUITES ONLY, as person-plans.ts setActivePlansForTests: the suites run against the developer's own
 * database and in parallel, and the company's invoice details and the plans' prices are shared rows another suite
 * (gig-payments) blanks and restores while it runs. While VITEST is set and this was given, the seller and the
 * prices come from it, never from those rows. Never read by a running server.
 */
type SaleForTests = { company: CompanyDetails; prices: Record<PlanCode, { monthly: number; yearly: number }> };
const TEST_KEY = "__edulinkPassSaleForTests";
export function setPassSaleForTests(value: SaleForTests | null): void {
  if (!process.env.VITEST) throw new Error("setPassSaleForTests is for the test suites alone");
  (globalThis as Record<string, unknown>)[TEST_KEY] = value;
}
function saleForTests(): SaleForTests | null {
  if (!process.env.VITEST) return null;
  return ((globalThis as Record<string, unknown>)[TEST_KEY] as SaleForTests | undefined) ?? null;
}

/* -------------------------------------------------------------------------- */
/* Prices, the seller, the sale                                                */
/* -------------------------------------------------------------------------- */

/** The company as the seller: GigSettings' details (the payouts' seller block). */
async function seller(): Promise<CompanyDetails> {
  return saleForTests()?.company ?? (await companyDetails());
}

/** The plan's two prices in paise, as the operator set them. */
async function pricesOf(plan: PlanCode): Promise<{ monthly: number; yearly: number }> {
  const forTests = saleForTests();
  if (forTests) return forTests.prices[plan];
  const card = await planForCard(plan);
  return { monthly: card.pricePaise, yearly: card.yearlyPricePaise };
}

/** GST on a price, rounded to the paisa as every company figure is. */
export const passGstOf = (amountPaise: number, percent: number): number => Math.round((amountPaise * percent) / 100);

/** One period's figures under today's rate. */
export function passFigures(period: PassPeriod, amountPaise: number, gstPercent: number): PassPrice {
  const gstPaise = passGstOf(amountPaise, gstPercent);
  return { period, amountPaise, gstPaise, totalPaise: amountPaise + gstPaise };
}

/** The periods a plan is sold for: those priced at ₹1 or more. */
async function pricesFor(plan: PlanCode, gstPercent: number): Promise<PassPrice[]> {
  const p = await pricesOf(plan);
  return PASS_PERIODS.map((period) => passFigures(period, period === "MONTH" ? p.monthly : p.yearly, gstPercent)).filter((x) => x.amountPaise >= 100);
}

/** Whether the company can sell anything at all just now: a gateway, and a seller a tax invoice can name. */
async function saleOpen(): Promise<{ open: boolean; company: CompanyDetails }> {
  const company = await seller();
  return { open: transport() !== "off" && company.missing.length === 0, company };
}

/* -------------------------------------------------------------------------- */
/* Who may buy what                                                            */
/* -------------------------------------------------------------------------- */

const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

/** Under eighteen today in India, by the date of birth when there is one (student-consent.ts isMinorToday). */
async function isMinorNow(userId: string, now: Date): Promise<boolean> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { birthdate: true, isMinor: true } });
  return u ? isMinorToday(u, BIRTHDAY_ZONE, now) : false;
}

type Holder = { userId: string; name: string; studentMembershipId: string | null; self: boolean; minor: boolean; adultChild: boolean };

/** The holders this session may buy for, each with the one plan it buys: oneself by the session's role, or a guardian's children. */
async function holdersFor(ctx: ActiveContext, now: Date): Promise<{ plan: PlanCode; holder: Holder }[]> {
  const out: { plan: PlanCode; holder: Holder }[] = [];
  const own = ctx.role ? PLAN_TABLE[ctx.role] : undefined;
  if (own) {
    out.push({ plan: own.plan, holder: { userId: ctx.user.id, name: ctx.user.preferredName ?? ctx.user.name, studentMembershipId: null, self: true, minor: await isMinorNow(ctx.user.id, now), adultChild: false } });
  }
  if (ctx.role === "PARENT") {
    for (const child of await familyChildren(ctx.user.id)) {
      if (child.leftAt) continue;
      // A child is a minor by the same reading the family pages use (the institution's calendar); `adult` there.
      out.push({ plan: "STUDENT", holder: { userId: child.studentUserId, name: child.name, studentMembershipId: child.studentMembershipId, self: false, minor: !child.adult, adultChild: child.adult } });
    }
  }
  return out;
}

function buyState(input: { asked: boolean; open: boolean; priced: boolean; holder: Holder }): PassBuyState {
  if (!input.asked) return "NOT_ASKED";
  if (input.holder.adultChild) return "ADULT_BUYS_OWN";
  if (!input.open || !input.priced) return "NOT_ON_SALE";
  if (input.holder.self && input.holder.minor) return "ASK_GUARDIAN";
  return "PAY";
}

/** GET /api/v1/account/pass and /account/plan: the plans I hold, and each pass I may buy, for whom, at what price. */
export async function passOverview(ctx: ActiveContext, now: Date = new Date()): Promise<PassOverview> {
  const { open, company } = await saleOpen();
  const asked = await activePlans();
  const held = await myPlans(ctx.user.id, now);
  const offers: PassOffer[] = [];
  for (const { plan, holder } of await holdersFor(ctx, now)) {
    const prices = await pricesFor(plan, company.gstPercent);
    const until = await planHeldUntil(holder.userId, plan, now);
    offers.push({
      plan,
      holder: { userId: holder.userId, name: holder.name, studentMembershipId: holder.studentMembershipId, self: holder.self },
      holdsUntil: until ? until.toISOString() : null,
      prices,
      buy: buyState({ asked: asked.has(plan), open, priced: prices.length > 0, holder }),
    });
  }
  return { held: held.map((h) => ({ plan: h.plan, validTo: h.validTo.toISOString() })), gstPercent: company.gstPercent, offers };
}

const REFUSAL_OF: Record<Exclude<PassBuyState, "PAY">, TranslationKey> = {
  NOT_ASKED: "passes.refuseNotAsked",
  NOT_ON_SALE: "passes.refuseNotOnSale",
  ASK_GUARDIAN: "passes.refuseAskGuardian",
  ADULT_BUYS_OWN: "passes.refuseAdultBuysOwn",
};

/* -------------------------------------------------------------------------- */
/* Views                                                                       */
/* -------------------------------------------------------------------------- */

const ORDER_SELECT = {
  id: true,
  userId: true,
  payerUserId: true,
  planCode: true,
  period: true,
  amountPaise: true,
  gstPaise: true,
  totalPaise: true,
  gstPercent: true,
  gatewayOrderId: true,
  gatewayPaymentId: true,
  status: true,
  paidAt: true,
  failedReason: true,
  refundedAt: true,
  refundedByUserId: true,
  gatewayRefundId: true,
  invoiceId: true,
  createdAt: true,
} as const;
type OrderRow = {
  id: string;
  userId: string;
  payerUserId: string;
  planCode: string;
  period: string;
  amountPaise: number;
  gstPaise: number;
  totalPaise: number;
  gstPercent: number;
  gatewayOrderId: string;
  gatewayPaymentId: string | null;
  status: string;
  paidAt: Date | null;
  failedReason: string | null;
  refundedAt: Date | null;
  refundedByUserId: string | null;
  gatewayRefundId: string | null;
  invoiceId: string | null;
  createdAt: Date;
};

async function viewsOf(rows: OrderRow[]): Promise<PassOrderView[]> {
  if (rows.length === 0) return [];
  const people = [...new Set(rows.flatMap((r) => [r.userId, r.payerUserId]))];
  const names = new Map((await db.user.findMany({ where: { id: { in: people } }, select: { id: true, name: true, preferredName: true } })).map((u) => [u.id, nameOf(u)]));
  const invoiceIds = rows.map((r) => r.invoiceId).filter((x): x is string => Boolean(x));
  const numbers = new Map((invoiceIds.length ? await db.passInvoice.findMany({ where: { id: { in: invoiceIds } }, select: { id: true, number: true } }) : []).map((i) => [i.id, i.number]));
  const windows = await passWindows(rows.map((r) => r.id));
  return rows.map((r) => {
    const w = windows.get(r.id);
    return {
      id: r.id,
      plan: r.planCode as PlanCode,
      period: r.period as PassPeriod,
      holderUserId: r.userId,
      holderName: names.get(r.userId) ?? "",
      payerUserId: r.payerUserId,
      payerName: names.get(r.payerUserId) ?? "",
      amountPaise: r.amountPaise,
      gstPaise: r.gstPaise,
      totalPaise: r.totalPaise,
      status: r.status as PassOrderStatus,
      createdAt: r.createdAt.toISOString(),
      paidAt: r.paidAt?.toISOString() ?? null,
      failedReason: r.failedReason,
      refundedAt: r.refundedAt?.toISOString() ?? null,
      validFrom: w ? w.validFrom.toISOString() : null,
      validTo: w ? w.validTo.toISOString() : null,
      invoiceNumber: r.invoiceId ? (numbers.get(r.invoiceId) ?? null) : null,
    };
  });
}

const keyIdNow = (): string => {
  try {
    return platformAccount()?.keyId ?? "devbox";
  } catch {
    return "off";
  }
};

async function checkoutOf(r: OrderRow, ctxUser: { name: string; email: string | null }, holderName: string, t: { planName: string }): Promise<PassCheckout> {
  return { paymentId: r.id, orderId: r.gatewayOrderId, keyId: keyIdNow(), amountPaise: r.totalPaise, currency: "INR", transport: transport(), title: t.planName, holderName, payerName: ctxUser.name, payerEmail: ctxUser.email };
}

/** The plan's name and period in the payer's language, for the gateway's panel and the invoice line. */
async function planTitle(plan: PlanCode, period: PassPeriod, locale: string): Promise<string> {
  const t = translator(normaliseLocale(locale));
  return t(period === "MONTH" ? "passes.titleMonth" : "passes.titleYear", { plan: t(PLAN_NAME_KEY[plan]) });
}

async function localeOf(userId: string): Promise<string> {
  const u = await db.user.findUnique({ where: { id: userId }, select: { prefs: true } });
  return normaliseLocale(readJson<{ locale?: string }>(u?.prefs ?? "{}", {}).locale);
}

/* -------------------------------------------------------------------------- */
/* Checkout                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * THE CHECKOUT: a plan and a period, for oneself or (a guardian) for one child. Refused, with the reason, unless the
 * offer is PAY. The price is the plan's own today, never the client's; the order is made at the company's gateway
 * with our row's id as its receipt. A checkout reopened within half an hour for the same pass at the same price is
 * handed the same order. Audited "pass.order.start".
 */
export async function openPassCheckout(ctx: ActiveContext, input: { plan: PlanCode; period: PassPeriod; studentMembershipId?: string | null }, now: Date = new Date()): Promise<PassResult<{ order: PassOrderView; checkout: PassCheckout }>> {
  const candidates = await holdersFor(ctx, now);
  const match = candidates.find((c) => c.plan === input.plan && (input.studentMembershipId ? c.holder.studentMembershipId === input.studentMembershipId : c.holder.self));
  if (!match) {
    // A child who is not this guardian's is "not found", as every family door says; a plan the role does not buy is a refusal.
    if (input.studentMembershipId) throw new AccessError("access.notYourChild", "NOT_FOUND");
    throw new AccessError("passes.refuseWrongPlan");
  }
  const { open, company } = await saleOpen();
  const prices = await pricesFor(input.plan, company.gstPercent);
  const state = buyState({ asked: (await activePlans()).has(input.plan), open, priced: prices.length > 0, holder: match.holder });
  if (state !== "PAY") return { ok: false, errorKey: REFUSAL_OF[state] };
  const price = prices.find((p) => p.period === input.period);
  if (!price) return { ok: false, errorKey: "passes.refusePeriod" };

  const payer = await db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { name: true, email: true, prefs: true } });
  const locale = normaliseLocale(readJson<{ locale?: string }>(payer.prefs, {}).locale);
  const title = await planTitle(input.plan, input.period, locale);

  const waiting = await db.passOrder.findFirst({
    where: { payerUserId: ctx.user.id, userId: match.holder.userId, planCode: input.plan, period: input.period, status: "CREATED", totalPaise: price.totalPaise, createdAt: { gt: new Date(now.getTime() - REUSE_ORDER_MS) }, gatewayOrderId: { not: { startsWith: "pending_" } } },
    orderBy: { createdAt: "desc" },
    select: ORDER_SELECT,
  });
  if (waiting) {
    const [view] = await viewsOf([waiting]);
    return { ok: true, order: view!, checkout: await checkoutOf(waiting, payer, match.holder.name, { planName: title }) };
  }

  // The row first, so the gateway's order carries our id; the order id is written once the gateway answers.
  const row = await db.passOrder.create({
    data: { userId: match.holder.userId, payerUserId: ctx.user.id, planCode: input.plan, period: input.period, amountPaise: price.amountPaise, gstPaise: price.gstPaise, totalPaise: price.totalPaise, gstPercent: company.gstPercent, gatewayOrderId: `pending_${randomUUID()}`, status: "CREATED" },
    select: ORDER_SELECT,
  });
  let gatewayOrderId: string;
  try {
    gatewayOrderId = (await createPassOrderAtGateway({ amountPaise: price.totalPaise, receipt: row.id, notes: { shalaghar_pass_order: row.id, plan: input.plan, period: input.period } })).orderId;
  } catch (error) {
    const reason = error instanceof GigGatewayError ? error.message : "gateway error";
    await db.passOrder.update({ where: { id: row.id }, data: { status: "FAILED", failedReason: reason.slice(0, 200) } });
    return { ok: false, errorKey: "passes.refuseGatewayDown" };
  }
  const made = await db.passOrder.update({ where: { id: row.id }, data: { gatewayOrderId }, select: ORDER_SELECT });
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "pass.order.start", targetType: "PassOrder", targetId: made.id, meta: { plan: input.plan, period: input.period, holderUserId: match.holder.userId, amountPaise: price.amountPaise, gstPaise: price.gstPaise, totalPaise: price.totalPaise, gatewayOrderId } });
  const [view] = await viewsOf([made]);
  return { ok: true, order: view!, checkout: await checkoutOf(made, payer, match.holder.name, { planName: title }) };
}

/* -------------------------------------------------------------------------- */
/* The one door a capture comes through                                        */
/* -------------------------------------------------------------------------- */

export type PassCaptureOutcome = "settled" | "already" | "unknown-order" | "amount-mismatch" | "not-settleable";

type InvoiceTx = typeof db;

/**
 * The next number in the company's pass series, under the GigSettings row lock the caller's transaction then holds;
 * refused (InvoiceNumberRefused, so the capture's transaction is rolled back whole) over sixteen characters or outside
 * letters, digits, hyphen and slash (TA-525, decision 0006 as amended on 14 November 2026).
 */
async function nextPassNumber(tx: InvoiceTx, series: string): Promise<{ serial: number; number: string }> {
  await tx.$queryRaw`SELECT "id" FROM "GigSettings" WHERE "id" = ${SETTINGS_ID} FOR UPDATE`;
  const last = (await tx.passInvoice.findFirst({ where: { series }, orderBy: { serial: "desc" }, select: { serial: true } }))?.serial;
  const serial = (last ?? 0) + 1;
  return { serial, number: invoiceNumberOf(series, serial) };
}

/**
 * The tax invoice for one paid pass, inside the caller's transaction: the next number of the financial year's PASS
 * series, the seller as GigSettings states it, the payer as the buyer (no GSTIN: a person; no address on record, so
 * the place of supply is the company's own state and the tax CGST+SGST — the accountant confirms, decision 0006),
 * one line, every figure the order's own. Null while the company's details are incomplete (nothing is sold then).
 */
async function writePassInvoice(tx: InvoiceTx, company: CompanyDetails, order: OrderRow, window: { validFrom: Date; validTo: Date }, issuedAt: Date): Promise<{ id: string; number: string } | null> {
  if (company.missing.length > 0) return null;
  const payer = await tx.user.findUniqueOrThrow({ where: { id: order.payerUserId }, select: { name: true, prefs: true } });
  const holder = order.userId === order.payerUserId ? payer : await tx.user.findUniqueOrThrow({ where: { id: order.userId }, select: { name: true, prefs: true } });
  const locale = normaliseLocale(readJson<{ locale?: string }>(payer.prefs, {}).locale);
  const sellerParty: InvoiceParty = { name: company.legalName ?? "", gstin: company.gstin, address: company.address, stateCode: company.stateCode };
  const buyer: InvoiceParty = { name: payer.name, gstin: null, address: null, stateCode: null };
  const cgstPaise = Math.floor(order.gstPaise / 2);
  const sgstPaise = order.gstPaise - cgstPaise;
  const series = invoiceSeriesOf(company.invoicePrefix, "P", issuedAt);
  const n = await nextPassNumber(tx, series);
  const lines = [{ passOrderId: order.id, plan: order.planCode, period: order.period, holderName: holder.name, validFrom: window.validFrom.toISOString(), validTo: window.validTo.toISOString(), amountPaise: order.amountPaise, gstPaise: order.gstPaise }];
  const made = await tx.passInvoice.create({
    data: { number: n.number, series, serial: n.serial, passOrderId: order.id, payerUserId: order.payerUserId, issuedAt, locale, taxableValuePaise: order.amountPaise, cgstPaise, sgstPaise, igstPaise: 0, totalPaise: order.totalPaise, sacCode: company.sacCode, sellerJson: JSON.stringify(sellerParty), buyerJson: JSON.stringify(buyer), linesJson: JSON.stringify(lines) },
    select: { id: true, number: true },
  });
  await tx.passOrder.update({ where: { id: order.id }, data: { invoiceId: made.id } });
  return made;
}

const PAID_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "passes.notifPaidStudent", TEACHER: "passes.notifPaidTeacher", EXPERT: "passes.notifPaidExpert" };

/** A notice that belongs to no school, written as the person (person-plans.ts's way); a failed notice never fails the payment. */
async function tell(userId: string, input: { titleKey: TranslationKey; titleVars?: Record<string, string | number>; url: string; meta?: Record<string, unknown> }): Promise<boolean> {
  try {
    await forUser(userId, () => notify({ userId, schoolId: null, kind: "SYSTEM", titleKey: input.titleKey, titleVars: input.titleVars, url: input.url, meta: input.meta }));
    return true;
  } catch (error) {
    console.error("[pass-orders] notice failed", error);
    return false;
  }
}

/**
 * THE ONE DOOR A CAPTURE COMES THROUGH (the checkout's confirm, the platform webhook, the devbox page): CREATED or
 * FAILED → PAID with the gateway's payment id, the ORDER entitlements and the tax invoice, in one transaction; a
 * second arrival is "already". An amount other than the order's total is refused and audited. The holder (and the
 * payer, when another) is told in the app once.
 */
export async function markPassPaid(input: { orderId: string; gatewayPaymentId: string; amountPaise: number }, now: Date = new Date()): Promise<{ outcome: PassCaptureOutcome; order: PassOrderView | null }> {
  const o = await db.passOrder.findUnique({ where: { gatewayOrderId: input.orderId }, select: ORDER_SELECT });
  if (!o) return { outcome: "unknown-order", order: null };
  if (o.status === "PAID" || o.status === "REFUNDED") return { outcome: "already", order: (await viewsOf([o]))[0]! };
  if (o.status !== "CREATED" && o.status !== "FAILED") return { outcome: "not-settleable", order: (await viewsOf([o]))[0]! };
  if (o.totalPaise !== input.amountPaise) {
    await audit({ schoolId: null, action: "pass.order.mismatch", targetType: "PassOrder", targetId: o.id, meta: { expected: o.totalPaise, got: input.amountPaise, gatewayPaymentId: input.gatewayPaymentId } });
    return { outcome: "amount-mismatch", order: (await viewsOf([o]))[0]! };
  }
  // The seller is read before the transaction: inside it every read goes through the transaction's own client.
  const company = await seller();
  const settled = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const claimed = await tx.passOrder.updateMany({ where: { id: o.id, status: { in: ["CREATED", "FAILED"] } }, data: { status: "PAID", paidAt: now, gatewayPaymentId: input.gatewayPaymentId, failedReason: null } });
    if (claimed.count === 0) return null;
    const window = await grantPassFromOrder({ id: o.id, userId: o.userId, planCode: o.planCode, period: o.period as PassPeriod }, now, tx);
    const invoice = await writePassInvoice(tx, company, o, window, now);
    return { window, invoice };
  });
  const after = await db.passOrder.findUniqueOrThrow({ where: { id: o.id }, select: ORDER_SELECT });
  if (!settled) return { outcome: "already", order: (await viewsOf([after]))[0]! };
  await audit({ schoolId: null, actorUserId: o.payerUserId, action: "pass.order.paid", targetType: "PassOrder", targetId: o.id, meta: { plan: o.planCode, period: o.period, holderUserId: o.userId, totalPaise: o.totalPaise, gatewayPaymentId: input.gatewayPaymentId, validFrom: settled.window.validFrom.toISOString(), validTo: settled.window.validTo.toISOString(), invoiceNumber: settled.invoice?.number ?? null } });
  const plan = o.planCode as PlanCode;
  const until = noticeDate(dateKeyInZone(planLastDay(settled.window.validTo), ZONE), "plain");
  await tell(o.userId, { titleKey: PAID_KEY[plan], titleVars: { date: until }, url: "/account/plan", meta: { passOrderId: o.id } });
  if (o.payerUserId !== o.userId) {
    const holder = await db.user.findUnique({ where: { id: o.userId }, select: { name: true, preferredName: true } });
    await tell(o.payerUserId, { titleKey: "passes.notifPaidForChild", titleVars: { name: holder ? nameOf(holder) : "", date: until }, url: "/account/plan", meta: { passOrderId: o.id } });
  }
  return { outcome: "settled", order: (await viewsOf([after]))[0]! };
}

/** The gateway says the attempt failed: a CREATED order is FAILED (a later signed capture on it still settles). */
export async function markPassFailed(gatewayOrderId: string, reason: string): Promise<boolean> {
  const { count } = await db.passOrder.updateMany({ where: { gatewayOrderId, status: "CREATED" }, data: { status: "FAILED", failedReason: reason.slice(0, 200) } });
  return count > 0;
}

/**
 * The checkout page's own confirmation, a fallback for a slow webhook: the payer's own order, the handler signature
 * checked under the company's key secret, then the one door.
 */
export async function confirmPassCheckout(ctx: ActiveContext, input: { orderId: string; gatewayPaymentId: string; signature: string }, now: Date = new Date()): Promise<{ outcome: PassCaptureOutcome; order: PassOrderView }> {
  const o = await db.passOrder.findFirst({ where: { id: input.orderId, payerUserId: ctx.user.id }, select: { gatewayOrderId: true, totalPaise: true } });
  if (!o) throw new AccessError("passes.noSuchOrder", "NOT_FOUND");
  if (!verifySeatCheckout(o.gatewayOrderId, input.gatewayPaymentId, input.signature)) throw new AccessError("passes.refuseBadSignature");
  const result = await markPassPaid({ orderId: o.gatewayOrderId, gatewayPaymentId: input.gatewayPaymentId, amountPaise: o.totalPaise }, now);
  return { outcome: result.outcome, order: result.order! };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/** The orders I paid for or hold, newest first. */
export async function myPassOrders(ctx: ActiveContext): Promise<PassOrderView[]> {
  const rows = await db.passOrder.findMany({ where: { OR: [{ payerUserId: ctx.user.id }, { userId: ctx.user.id }], NOT: { gatewayOrderId: { startsWith: "pending_" } } }, orderBy: { createdAt: "desc" }, take: 50, select: ORDER_SELECT });
  return viewsOf(rows);
}

/** One of my orders (as payer or holder), with its checkout while it waits and I am the payer; anybody else's is not found. */
export async function passOrderStatus(ctx: ActiveContext, id: string): Promise<{ order: PassOrderView; status: PassOrderStatus; reason: string | null; checkout: PassCheckout | null }> {
  const r = await db.passOrder.findFirst({ where: { id, OR: [{ payerUserId: ctx.user.id }, { userId: ctx.user.id }] }, select: ORDER_SELECT });
  if (!r) throw new AccessError("passes.noSuchOrder", "NOT_FOUND");
  const [view] = await viewsOf([r]);
  let checkout: PassCheckout | null = null;
  if (r.status === "CREATED" && r.payerUserId === ctx.user.id && !r.gatewayOrderId.startsWith("pending_")) {
    const payer = await db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { name: true, email: true } });
    checkout = await checkoutOf(r, payer, view!.holderName, { planName: await planTitle(r.planCode as PlanCode, r.period as PassPeriod, await localeOf(ctx.user.id)) });
  }
  return { order: view!, status: r.status as PassOrderStatus, reason: r.failedReason, checkout };
}

export type PassInvoiceView = {
  id: string;
  number: string;
  issuedAt: string;
  locale: "en" | "hi" | "mr";
  taxableValuePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  sacCode: string;
  seller: InvoiceParty;
  buyer: InvoiceParty;
  line: { passOrderId: string; plan: PlanCode; period: PassPeriod; holderName: string; validFrom: string; validTo: string; amountPaise: number; gstPaise: number };
  refundedAt: string | null;
};

/**
 * One pass's tax invoice: the payer reads their own, the operator any; anybody else's is not found. A PAID order
 * whose invoice could not be issued at capture (the company's details were blank then) is issued now, once they are
 * complete — the same series, the same lock.
 */
export async function passInvoiceView(ctx: ActiveContext, orderId: string, now: Date = new Date()): Promise<PassInvoiceView> {
  const o = await db.passOrder.findFirst({ where: { id: orderId, ...(ctx.user.isSuperuser ? {} : { payerUserId: ctx.user.id }) }, select: ORDER_SELECT });
  if (!o || (o.status !== "PAID" && o.status !== "REFUNDED")) throw new AccessError("passes.noSuchInvoice", "NOT_FOUND");
  if (!o.invoiceId) {
    const window = (await passWindows([o.id])).get(o.id) ?? { validFrom: o.paidAt ?? now, validTo: o.paidAt ?? now };
    const company = await seller();
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      // The order's row first (QA-36): reads arriving together wait here, and each then sees what the first wrote,
      // rather than all checking invoiceId before the series lock and the losers failing on passOrderId's unique key.
      // A late invoice carries the date it is issued (issuedAt = this read), as a tax invoice must; never backdated.
      await tx.$queryRaw`SELECT "id" FROM "PassOrder" WHERE "id" = ${o.id} FOR UPDATE`;
      const fresh = await tx.passOrder.findUniqueOrThrow({ where: { id: o.id }, select: { invoiceId: true } });
      if (!fresh.invoiceId) await writePassInvoice(tx, company, o, window, now);
    });
  }
  const inv = await db.passInvoice.findUnique({ where: { passOrderId: o.id } });
  if (!inv) throw new AccessError("passes.noSuchInvoice", "NOT_FOUND");
  const party = (raw: string): InvoiceParty => {
    const j = readJson<Partial<InvoiceParty>>(raw, {});
    return { name: j.name ?? "", gstin: j.gstin ?? null, address: j.address ?? null, stateCode: j.stateCode ?? null };
  };
  const line = readJson<PassInvoiceView["line"][]>(inv.linesJson, [])[0]!;
  return {
    id: inv.id,
    number: inv.number,
    issuedAt: inv.issuedAt.toISOString(),
    locale: inv.locale === "hi" || inv.locale === "mr" ? inv.locale : "en",
    taxableValuePaise: inv.taxableValuePaise,
    cgstPaise: inv.cgstPaise,
    sgstPaise: inv.sgstPaise,
    igstPaise: inv.igstPaise,
    totalPaise: inv.totalPaise,
    sacCode: inv.sacCode,
    seller: party(inv.sellerJson),
    buyer: party(inv.buyerJson),
    line,
    refundedAt: o.refundedAt?.toISOString() ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* The operator                                                                */
/* -------------------------------------------------------------------------- */

function assertOperator(ctx: ActiveContext): void {
  if (!ctx.user.isSuperuser) throw new AccessError("access.thisAreaBelongsToWhoeverRunsThe", "NOT_FOUND");
}

/** The first instant of this calendar month in India. */
function monthStartIndia(now: Date): Date {
  const ist = new Date(now.getTime() + 330 * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - 330 * 60_000);
}

const refundableAt = (r: { status: string; paidAt: Date | null }, now: Date) => r.status === "PAID" && r.paidAt !== null && now.getTime() - r.paidAt.getTime() <= PASS_REFUND_DAYS * DAY_MS;

async function operatorViews(rows: OrderRow[], now: Date): Promise<OperatorPassOrder[]> {
  const views = await viewsOf(rows);
  return views.map((v, i) => ({ ...v, gatewayPaymentId: rows[i]!.gatewayPaymentId, refundable: refundableAt(rows[i]!, now) }));
}

/** /root/features and GET /api/v1/operator/pass-orders: this month's pass revenue by plan (refunded passes out), and the last twenty orders. */
export async function operatorPassOrders(ctx: ActiveContext, now: Date = new Date()): Promise<OperatorPassOrders> {
  assertOperator(ctx);
  const monthStart = monthStartIndia(now);
  const grouped = await db.passOrder.groupBy({ by: ["planCode"], where: { status: "PAID", paidAt: { gte: monthStart } }, _count: { _all: true }, _sum: { amountPaise: true, gstPaise: true, totalPaise: true } });
  const revenue = (["STUDENT", "TEACHER", "EXPERT"] as const).map((plan) => {
    const g = grouped.find((x) => x.planCode === plan);
    return { plan, count: g?._count._all ?? 0, amountPaise: g?._sum.amountPaise ?? 0, gstPaise: g?._sum.gstPaise ?? 0, totalPaise: g?._sum.totalPaise ?? 0 };
  });
  const rows = await db.passOrder.findMany({ where: { NOT: { gatewayOrderId: { startsWith: "pending_" } } }, orderBy: { createdAt: "desc" }, take: 20, select: ORDER_SELECT });
  return { monthStart: monthStart.toISOString(), revenue, orders: await operatorViews(rows, now) };
}

/** One person's passes, as holder or payer, for the operator's entitlement lookup (with each invoice to download). */
export async function operatorPassOrdersOf(ctx: ActiveContext, userId: string, now: Date = new Date()): Promise<OperatorPassOrder[]> {
  assertOperator(ctx);
  const rows = await db.passOrder.findMany({ where: { OR: [{ userId }, { payerUserId: userId }], NOT: { gatewayOrderId: { startsWith: "pending_" } } }, orderBy: { createdAt: "desc" }, take: 50, select: ORDER_SELECT });
  return operatorViews(rows, now);
}

/**
 * THE OPERATOR'S REFUND: the whole total back to the payer's instrument, within PASS_REFUND_DAYS of payment, the
 * entitlements the pass opened revoked. Claimed first (PAID → REFUNDED with the revocation, in one transaction, so a
 * second click refunds nothing), then the gateway asked; a gateway that refuses puts both back and says so.
 * Audited "operator.pass.refund"; the payer and the holder are told.
 */
export async function refundPassOrder(ctx: ActiveContext, id: string, now: Date = new Date()): Promise<PassResult<{ order: OperatorPassOrder; revoked: number; already?: boolean }>> {
  assertOperator(ctx);
  const o = await db.passOrder.findUnique({ where: { id }, select: ORDER_SELECT });
  if (!o) throw new AccessError("passes.noSuchOrder", "NOT_FOUND");
  // A pass already refunded (the other half of a double press, or a press on a stale list) is answered as it stands,
  // `already`, rather than "only a paid pass can be refunded" (QA-37).
  const asRefunded = async () => {
    const after = await db.passOrder.findUniqueOrThrow({ where: { id }, select: ORDER_SELECT });
    if (after.status !== "REFUNDED") return null;
    return { ok: true as const, order: (await operatorViews([after], now))[0]!, revoked: 0, already: true };
  };
  if (o.status === "REFUNDED") return (await asRefunded()) ?? { ok: false, errorKey: "passes.refuseNotRefundable" };
  if (o.status !== "PAID" || !o.gatewayPaymentId) return { ok: false, errorKey: "passes.refuseNotRefundable" };
  if (!refundableAt(o, now)) return { ok: false, errorKey: "passes.refuseRefundLate", vars: { days: PASS_REFUND_DAYS } };
  const claimed = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const { count } = await tx.passOrder.updateMany({ where: { id, status: "PAID" }, data: { status: "REFUNDED", refundedAt: now, refundedByUserId: ctx.user.id } });
    if (count === 0) return null;
    return { revoked: await revokePassEntitlements(id, ctx.user.id, now, tx) };
  });
  if (!claimed) return (await asRefunded()) ?? { ok: false, errorKey: "passes.refuseNotRefundable" };
  let refundId: string | null = null;
  let refused: unknown = null;
  try {
    refundId = (await refundSeat(o.gatewayPaymentId, o.totalPaise, { shalaghar_pass_order: o.id }, false)).refundId;
  } catch (error) {
    refused = error;
  }
  // TA-258: a refused call may be a refund the gateway made whose answer was lost; the payment says which. Only a
  // refund the gateway did not make puts the pass back, and the refund's id is written apart from that undo.
  if (refused !== null && !(await paymentRefundedAtGateway(o.gatewayPaymentId, o.totalPaise))) {
    const error = refused;
    await db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      await tx.passOrder.updateMany({ where: { id, status: "REFUNDED" }, data: { status: "PAID", refundedAt: null, refundedByUserId: null } });
      await restorePassEntitlements(id, now, tx);
    });
    console.error("[pass-orders] refund refused at the gateway", error instanceof Error ? error.message : error);
    return { ok: false, errorKey: "passes.refuseGatewayDown" };
  }
  if (refundId) await db.passOrder.updateMany({ where: { id, status: "REFUNDED" }, data: { gatewayRefundId: refundId } }).catch((error) => console.error("[pass-orders] refund id not written", error instanceof Error ? error.message : error));
  await audit({ schoolId: null, actorUserId: ctx.user.id, action: "operator.pass.refund", targetType: "PassOrder", targetId: id, meta: { plan: o.planCode, holderUserId: o.userId, payerUserId: o.payerUserId, totalPaise: o.totalPaise, revoked: claimed.revoked, ...(refused !== null ? { readBack: true } : {}) } });
  await tell(o.payerUserId, { titleKey: "passes.notifRefunded", url: "/account/plan", meta: { passOrderId: id } });
  if (o.userId !== o.payerUserId) await tell(o.userId, { titleKey: "passes.notifRefundedHolder", url: "/account/plan", meta: { passOrderId: id } });
  const after = await db.passOrder.findUniqueOrThrow({ where: { id }, select: ORDER_SELECT });
  return { ok: true, order: (await operatorViews([after], now))[0]!, revoked: claimed.revoked };
}

/**
 * The gateway says a refund failed (refund.failed on the platform webhook): the money never left, so the order is
 * PAID again and the entitlements the refund ended are open again. Audited "pass.refund.failed".
 */
export async function markPassRefundFailed(gatewayRefundId: string, reason: string): Promise<boolean> {
  const o = await db.passOrder.findFirst({ where: { gatewayRefundId, status: "REFUNDED" }, select: { id: true, refundedAt: true } });
  if (!o || !o.refundedAt) return false;
  const refundedAt = o.refundedAt;
  const put = await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    const { count } = await tx.passOrder.updateMany({ where: { id: o.id, status: "REFUNDED" }, data: { status: "PAID", refundedAt: null, refundedByUserId: null, gatewayRefundId: null, failedReason: `refund failed: ${reason}`.slice(0, 200) } });
    if (count === 0) return false;
    await restorePassEntitlements(o.id, refundedAt, tx);
    return true;
  });
  if (put) await audit({ schoolId: null, action: "pass.refund.failed", targetType: "PassOrder", targetId: o.id, meta: { gatewayRefundId, reason: reason.slice(0, 200) } });
  return put;
}

/* -------------------------------------------------------------------------- */
/* A pupil under eighteen asks                                                 */
/* -------------------------------------------------------------------------- */

const ASK_AGAIN_MS = DAY_MS;

/**
 * "ASK YOUR PARENT": a pupil under eighteen never pays; they ask, and each active guardian is told in the app with a
 * link to buy it for them. Once a day at most per guardian: a second ask within the day tells nobody (`already`).
 * The STUDENT plan, on the pupil's own STUDENT session, alone.
 */
export async function askGuardianForPass(ctx: ActiveContext, plan: PlanCode, now: Date = new Date()): Promise<{ told: number; already: boolean }> {
  if (ctx.role !== "STUDENT" || !ctx.membershipId) throw new AccessError("access.wrongRoleForThisAction");
  if (plan !== "STUDENT") throw new AccessError("passes.refuseWrongPlan");
  if (!(await isMinorNow(ctx.user.id, now))) throw new AccessError("passes.refuseAskAdult");
  const guardians = await db.guardianship.findMany({ where: { studentMembershipId: ctx.membershipId, status: "ACTIVE" }, select: { parentUserId: true } });
  const name = ctx.user.preferredName ?? ctx.user.name;
  let told = 0;
  let skipped = 0;
  for (const g of guardians) {
    const recent = await forUser(g.parentUserId, () =>
      db.notification.findFirst({ where: { userId: g.parentUserId, titleKey: "passes.notifAsk", createdAt: { gt: new Date(now.getTime() - ASK_AGAIN_MS) }, meta: { contains: ctx.membershipId! } }, select: { id: true } }),
    );
    if (recent) {
      skipped += 1;
      continue;
    }
    if (await tell(g.parentUserId, { titleKey: "passes.notifAsk", titleVars: { name }, url: `/account/plan?plan=STUDENT&child=${encodeURIComponent(ctx.membershipId)}`, meta: { studentMembershipId: ctx.membershipId } })) told += 1;
  }
  if (told > 0) await audit({ schoolId: ctx.schoolId, actorUserId: ctx.user.id, action: "pass.ask.guardian", targetType: "Membership", targetId: ctx.membershipId, meta: { plan, told } });
  return { told, already: told === 0 && skipped > 0 };
}

/* -------------------------------------------------------------------------- */
/* The job                                                                     */
/* -------------------------------------------------------------------------- */

/** The India day number of an instant, so "seven days before" is counted in calendar days. */
const indiaDay = (at: Date) => Math.floor((at.getTime() + 330 * 60_000) / DAY_MS);
function dayStartIndia(now: Date): Date {
  return new Date(indiaDay(now) * DAY_MS - 330 * 60_000);
}

const ENDS_WEEK_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "passes.notifEndsWeekStudent", TEACHER: "passes.notifEndsWeekTeacher", EXPERT: "passes.notifEndsWeekExpert" };
const ENDS_DAY_KEY: Record<PlanCode, TranslationKey> = { STUDENT: "passes.notifEndsDayStudent", TEACHER: "passes.notifEndsDayTeacher", EXPERT: "passes.notifEndsDayExpert" };

/**
 * THE pass:expiring JOB (05:10 daily): each person whose plan — their latest running window of it, a pass or a grant
 * — ends seven days from today or tomorrow (India's calendar) is told in the app; there is no auto-renewal and no
 * mandate, so the notice is the only reminder. Told once a day at most per plan and notice (a second run the same day
 * finds the notice and skips it). `scope.userIds` narrows it to a test's own people.
 */
export async function passExpiringNotices(now: Date = new Date(), scope: { userIds?: string[] } = {}): Promise<{ week: number; day: number; skipped: number }> {
  const today = indiaDay(now);
  const todayStart = dayStartIndia(now);
  const windows = await windowsEndingBetween(now, new Date(todayStart.getTime() + 8 * DAY_MS), scope);
  let week = 0;
  let day = 0;
  let skipped = 0;
  for (const w of windows) {
    // The window ends at an instant; the person's last day with the plan is the India day before that instant when it ends at midnight.
    const lastDay = indiaDay(new Date(w.validTo.getTime() - 1));
    const left = lastDay - today;
    const titleKey = left === 7 ? ENDS_WEEK_KEY[w.plan] : left === 1 ? ENDS_DAY_KEY[w.plan] : null;
    if (!titleKey) continue;
    const seen = await forUser(w.userId, () => db.notification.findFirst({ where: { userId: w.userId, titleKey, createdAt: { gte: todayStart } }, select: { id: true } }));
    if (seen) {
      skipped += 1;
      continue;
    }
    const date = noticeDate(dateKeyInZone(new Date(w.validTo.getTime() - 1), ZONE), "plain");
    if (await tell(w.userId, { titleKey, titleVars: { date }, url: "/account/plan" })) {
      if (left === 7) week += 1;
      else day += 1;
    }
  }
  return { week, day, skipped };
}

/** The months a period buys, for the pages. */
export const passMonths = (period: PassPeriod): number => MONTHS_OF[period];
