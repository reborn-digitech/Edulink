import { z } from "zod";
import { personPlanSchema } from "./person-plans";

/**
 * PASSES BOUGHT THROUGH THE COMPANY'S GATEWAY (17 October 2026; decision 0006, apps/web src/lib/pass-orders.ts).
 *
 * A pass is a month or a year of one plan sold per person (v1/person-plans.ts). The plan's price is the taxable
 * value; GST at the company's rate is added on top, and the gateway charges the total. The money is the company's
 * own revenue, collected directly: no Route, no split. A guardian buys the STUDENT plan for a pupil under eighteen;
 * a college student, a teacher and an expert buy for themselves; a pupil under eighteen only asks a guardian. No
 * card detail ever reaches the platform: the gateway's own page takes them (policy 0002).
 */
export const PASS_PERIODS = ["MONTH", "YEAR"] as const;
export const passPeriodSchema = z.enum(PASS_PERIODS);
export type PassPeriod = z.infer<typeof passPeriodSchema>;

export const PASS_ORDER_STATUSES = ["CREATED", "PAID", "FAILED", "REFUNDED"] as const;
export const passOrderStatusSchema = z.enum(PASS_ORDER_STATUSES);
export type PassOrderStatus = z.infer<typeof passOrderStatusSchema>;

/** The operator refunds a pass in full within this many days of its payment, and not after. */
export const PASS_REFUND_DAYS = 7;

/**
 * What the person may do about one offer: PAY; ASK_GUARDIAN (a pupil under eighteen); ADULT_BUYS_OWN (a guardian's
 * child who is eighteen or over buys their own); NOT_ASKED (the plan is not asked for, so everything it includes is
 * open); NOT_ON_SALE (the price, the company's invoice details or the gateway are not ready).
 */
export const PASS_BUY_STATES = ["PAY", "ASK_GUARDIAN", "ADULT_BUYS_OWN", "NOT_ASKED", "NOT_ON_SALE"] as const;
export const passBuyStateSchema = z.enum(PASS_BUY_STATES);
export type PassBuyState = z.infer<typeof passBuyStateSchema>;

const id = z.string().min(1).max(64);
const iso = z.string().datetime();
const paise = z.number().int().nonnegative();

/** One period's figures: the plan's price, the GST on it, and what the gateway charges. */
export const passPriceSchema = z.object({ period: passPeriodSchema, amountPaise: paise, gstPaise: paise, totalPaise: paise });
export type PassPrice = z.infer<typeof passPriceSchema>;

/** One plan this person may buy, for themselves or (a guardian) for one child. */
export const passOfferSchema = z.object({
  plan: personPlanSchema,
  holder: z.object({
    userId: id,
    name: z.string(),
    /** The child's membership when a guardian buys for them; null for oneself. */
    studentMembershipId: id.nullable(),
    self: z.boolean(),
  }),
  /** The day the holder's current window of this plan ends, when they hold it now: a pass bought now starts there. */
  holdsUntil: iso.nullable(),
  prices: z.array(passPriceSchema),
  buy: passBuyStateSchema,
});
export type PassOffer = z.infer<typeof passOfferSchema>;

/** GET /api/v1/account/pass — the plans I hold, and what I may buy and for whom. */
export const passOverviewSchema = z.object({
  held: z.array(z.object({ plan: personPlanSchema, validTo: iso })),
  gstPercent: z.number().int().min(0).max(50),
  offers: z.array(passOfferSchema),
});
export type PassOverview = z.infer<typeof passOverviewSchema>;

/** A pass order as its payer and its holder read it. */
export const passOrderSchema = z.object({
  id,
  plan: personPlanSchema,
  period: passPeriodSchema,
  holderUserId: id,
  holderName: z.string(),
  payerUserId: id,
  payerName: z.string(),
  amountPaise: paise,
  gstPaise: paise,
  totalPaise: paise,
  status: passOrderStatusSchema,
  createdAt: iso,
  paidAt: iso.nullable(),
  failedReason: z.string().nullable(),
  refundedAt: iso.nullable(),
  /** The window the pass opened, once paid. */
  validFrom: iso.nullable(),
  validTo: iso.nullable(),
  /** The tax invoice, once paid; the PDF is GET /api/v1/account/pass/orders/{id}/invoice (the payer's). */
  invoiceNumber: z.string().nullable(),
});
export type PassOrderView = z.infer<typeof passOrderSchema>;
export const passOrdersSchema = z.object({ orders: z.array(passOrderSchema) });

/**
 * What the browser opens the gateway's checkout with (the seat flow's panel, reused): `paymentId` is our order id,
 * `orderId` the gateway's. Under devbox there is no script; the order waits for /dev/payments.
 */
export const passCheckoutSchema = z.object({
  paymentId: id,
  orderId: z.string(),
  keyId: z.string(),
  amountPaise: paise,
  currency: z.literal("INR"),
  transport: z.enum(["devbox", "razorpay", "off"]),
  title: z.string(),
  holderName: z.string(),
  payerName: z.string(),
  payerEmail: z.string().nullable(),
});
export type PassCheckout = z.infer<typeof passCheckoutSchema>;

/** POST /api/v1/account/pass/checkout — a plan, a period, and (a guardian) the child. */
export const passCheckoutBodySchema = z
  .object({ plan: personPlanSchema, period: passPeriodSchema, studentMembershipId: id.optional() })
  .strict();
export const passCheckoutMadeSchema = z.object({ order: passOrderSchema, checkout: passCheckoutSchema });

/** GET /api/v1/account/pass/orders/{id} — one order, with its checkout while it waits (the panel polls this). */
export const passOrderReadSchema = z.object({ order: passOrderSchema, status: passOrderStatusSchema, reason: z.string().nullable(), checkout: passCheckoutSchema.nullable() });

/** POST /api/v1/account/pass/confirm — the checkout's handler signature, a fallback for a slow webhook. */
export const passConfirmBodySchema = z.object({ orderId: id, gatewayPaymentId: z.string().min(1).max(80), signature: z.string().min(1).max(200) }).strict();
export const passConfirmedSchema = z.object({ outcome: z.string(), order: passOrderSchema });

/** POST /api/v1/account/pass/ask — a pupil under eighteen asks their guardians for a plan; told once a day at most. */
export const passAskBodySchema = z.object({ plan: personPlanSchema }).strict();
export const passAskedSchema = z.object({ told: z.number().int().nonnegative(), already: z.boolean() });

/** One order on the operator's list. */
export const operatorPassOrderSchema = passOrderSchema.extend({
  gatewayPaymentId: z.string().nullable(),
  /** Refundable now: PAID, and paid within PASS_REFUND_DAYS. */
  refundable: z.boolean(),
});
export type OperatorPassOrder = z.infer<typeof operatorPassOrderSchema>;

/** GET /api/v1/operator/pass-orders — this month's pass revenue by plan (India's calendar) and the last twenty orders. */
export const operatorPassOrdersSchema = z.object({
  monthStart: iso,
  revenue: z.array(z.object({ plan: personPlanSchema, count: z.number().int().nonnegative(), amountPaise: paise, gstPaise: paise, totalPaise: paise })),
  orders: z.array(operatorPassOrderSchema),
});
export type OperatorPassOrders = z.infer<typeof operatorPassOrdersSchema>;

/** POST /api/v1/operator/pass-orders/{id}/refund — the whole total back, the pass's entitlements revoked. Audited. */
export const operatorPassRefundSchema = z.object({ order: operatorPassOrderSchema, revoked: z.number().int().nonnegative() });
