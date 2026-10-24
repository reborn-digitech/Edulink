import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readFeesGatewayTransport } from "./env";

/**
 * The school's payment gateway, spoken to on the school's behalf.
 *
 * ⚠ THE PLATFORM NEVER TOUCHES THE MONEY, and this file is where that is
 * enforced in code rather than in prose. A parent's payment goes from the
 * parent to the SCHOOL'S OWN gateway account and from there to the school's
 * bank. Shalaghar creates the order, shows the checkout and hears the webhook;
 * it holds no account, pools nothing, splits nothing, pays nothing out. So
 * this adapter can make exactly the calls in ALLOWED_CALLS — create an order,
 * read a payment, read an order's payments, refund a payment back to its own
 * instrument — and `tests/fees-invariants.test.ts` reads this file to make
 * sure no route, transfer, payout or linked-account call has crept in. See
 * docs/decisions/0003-fees-money-never-touches-platform.md.
 *
 * NO SDK, like s3.ts and sms.ts: the API is four HTTPS calls with Basic auth.
 *
 * TWO TRANSPORTS, like email and SMS. "devbox" mints local order ids and
 * /dev/payments settles them through the same code path the webhook uses,
 * so the whole checkout is exercisable with no account anywhere; "razorpay"
 * talks to the real API with the keys the school entered.
 */

export type GatewayAccount = { keyId: string; secret: string; mode: "TEST" | "LIVE" };

/**
 * Every endpoint this adapter may call. Method and path template — nothing
 * else exists as far as the platform is concerned.
 */
export const ALLOWED_CALLS = [
  { method: "POST", path: "/v1/orders" },
  { method: "GET", path: "/v1/payments/{paymentId}" },
  { method: "GET", path: "/v1/orders/{orderId}/payments" },
  { method: "POST", path: "/v1/payments/{paymentId}/refund" },
] as const;

const API_BASE = () => process.env.FEES_GATEWAY_API_BASE?.trim().replace(/\/$/, "") || "https://api.razorpay.com";
const CALL_TIMEOUT_MS = 15_000;

export class GatewayError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    /** "EMPTY_ANSWER": a 2xx whose body is not a JSON object (QA-38); null for every other failure. */
    readonly code: "EMPTY_ANSWER" | null = null,
  ) {
    super(message);
    this.name = "GatewayError";
  }
}

async function call<T>(account: GatewayAccount, method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
  // The allow-list is checked at call time too, not only by the test: a
  // path that is not one of the four templates is refused here.
  const template = path.replace(/\/(order|pay|rfnd)_[A-Za-z0-9]+/g, (m) => (m.startsWith("/order_") ? "/{orderId}" : m.startsWith("/pay_") ? "/{paymentId}" : "/{refundId}"));
  if (!ALLOWED_CALLS.some((c) => c.method === method && c.path === template)) {
    throw new GatewayError(`gateway: ${method} ${template} is not an allowed call`);
  }
  let response: Response;
  try {
    response = await fetch(`${API_BASE()}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${Buffer.from(`${account.keyId}:${account.secret}`).toString("base64")}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (error) {
    const cause = (error as { cause?: { message?: string } }).cause?.message;
    throw new GatewayError(`gateway unreachable: ${cause ?? (error as Error).message}`);
  }
  const text = await response.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  if (!response.ok) {
    const description = (json as { error?: { description?: string } } | null)?.error?.description;
    throw new GatewayError(description ? `gateway: ${description}` : `gateway answered ${response.status}`, response.status);
  }
  // A success whose body is empty, not JSON or not an object is the gateway's fault, not an answer: refused here as a
  // GatewayError the callers already handle, never handed on to fail later as a TypeError on a missing id (QA-38).
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new GatewayError(`gateway answered ${response.status} with no JSON object`, response.status, "EMPTY_ANSWER");
  }
  return json as T;
}

/* -------------------------------------------------------------------------- */
/* Orders and payments                                                         */
/* -------------------------------------------------------------------------- */

export type GatewayOrder = { orderId: string; amountPaise: number; currency: "INR" };

/**
 * An order for one amount, in the school's account. `receipt` is our own
 * payment id, so the order can be traced back from the gateway's dashboard.
 */
export async function createOrder(account: GatewayAccount, input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<GatewayOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new GatewayError("gateway: an order needs a whole number of paise, at least ₹1");
  if (readFeesGatewayTransport() === "devbox") {
    return { orderId: `order_devbox${randomBytes(7).toString("hex")}`, amountPaise: input.amountPaise, currency: "INR" };
  }
  const order = await call<{ id: string; amount: number; currency: string }>(account, "POST", "/v1/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes ?? {},
  });
  return { orderId: order.id, amountPaise: order.amount, currency: "INR" };
}

export type GatewayPayment = {
  paymentId: string;
  orderId: string | null;
  amountPaise: number;
  /** created | authorized | captured | refunded | failed */
  status: string;
  method: string | null;
};

function toPayment(p: { id: string; order_id?: string | null; amount: number; status: string; method?: string | null }): GatewayPayment {
  return { paymentId: p.id, orderId: p.order_id ?? null, amountPaise: p.amount, status: p.status, method: p.method ?? null };
}

export async function fetchPayment(account: GatewayAccount, paymentId: string): Promise<GatewayPayment> {
  if (readFeesGatewayTransport() === "devbox") throw new GatewayError("gateway: devbox has no payments to fetch");
  return toPayment(await call(account, "GET", `/v1/payments/${encodeURIComponent(paymentId)}`));
}

/** Every payment attempted against an order — how the reconcile job finds one the webhook never reported. */
export async function fetchOrderPayments(account: GatewayAccount, orderId: string): Promise<GatewayPayment[]> {
  if (readFeesGatewayTransport() === "devbox") return [];
  const result = await call<{ items: Parameters<typeof toPayment>[0][] }>(account, "GET", `/v1/orders/${encodeURIComponent(orderId)}/payments`);
  return (result.items ?? []).map(toPayment);
}

export type GatewayRefund = { refundId: string; status: string; amountPaise: number };

/** Back to the instrument it came from, out of the SCHOOL'S balance. */
export async function refundPayment(account: GatewayAccount, paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<GatewayRefund> {
  if (readFeesGatewayTransport() === "devbox") {
    return { refundId: `rfnd_devbox${randomBytes(7).toString("hex")}`, status: "processed", amountPaise };
  }
  const refund = await call<{ id: string; status: string; amount: number }>(account, "POST", `/v1/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, notes: notes ?? {} });
  return { refundId: refund.id, status: refund.status, amountPaise: refund.amount };
}

/* -------------------------------------------------------------------------- */
/* Signatures                                                                  */
/* -------------------------------------------------------------------------- */

function hmacHex(secret: string, data: string): string {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function equalHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/** The webhook's `X-Razorpay-Signature`: HMAC-SHA256 of the raw body under the webhook secret. */
export function verifyWebhookSignature(webhookSecret: string, rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  return equalHex(hmacHex(webhookSecret, rawBody), signature.trim().toLowerCase());
}

/** The checkout's handler signature: HMAC-SHA256 of `order_id|payment_id` under the key secret. */
export function verifyCheckoutSignature(keySecret: string, orderId: string, paymentId: string, signature: string): boolean {
  return equalHex(hmacHex(keySecret, `${orderId}|${paymentId}`), signature.trim().toLowerCase());
}

/** For tests and the devbox page: what a genuine gateway would have signed. */
export function signWebhookBody(webhookSecret: string, rawBody: string): string {
  return hmacHex(webhookSecret, rawBody);
}
export function signCheckout(keySecret: string, orderId: string, paymentId: string): string {
  return hmacHex(keySecret, `${orderId}|${paymentId}`);
}

/* -------------------------------------------------------------------------- */
/* UPI intent                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * The gateway-free way: a standard UPI intent link the parent's own UPI app
 * opens with the school as payee and the amount filled in. Nothing is called;
 * the parent pays the school directly and types the UTR back to us.
 */
export function upiIntentLink(input: { payeeVpa: string; payeeName: string; amountPaise: number; reference: string; note: string }): string {
  const params = new URLSearchParams({
    pa: input.payeeVpa,
    pn: input.payeeName.slice(0, 50),
    am: (input.amountPaise / 100).toFixed(2),
    cu: "INR",
    tr: input.reference.slice(0, 35),
    tn: input.note.slice(0, 50),
  });
  return `upi://pay?${params.toString()}`;
}

/** A UTR / reference number as banks print them: 12 to 22 letters and digits. */
export function looksLikeUtr(value: string): boolean {
  return /^[A-Za-z0-9]{12,22}$/.test(value.trim());
}
