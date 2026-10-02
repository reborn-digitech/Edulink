import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readGigGatewayTransport } from "./env";
import { DEVBOX_WEBHOOK_SECRET, readGigGatewayRaw, type GigGatewayTransport } from "./gig-gateway-env";
import { open } from "./secret-box";

/**
 * The COMPANY'S OWN gateway account, spoken to for paid sessions and for
 * nothing else (decision 0004, second amendment of 2 October 2026; decision
 * 0003 is untouched and school fees never come here — tests/fees-invariants
 * holds gateway.ts to four calls, and this module is the one the decision
 * said would be its own).
 *
 * WHAT MOVES WHERE. A guardian pays the gateway for one workshop seat, and
 * the whole seat price settles to the COMPANY'S account: the company is the
 * collecting party. No transfer, no linked account, no split — the gateway
 * holds nothing back for the expert. The company keeps its commission and
 * the GST on it (invoiced to the expert, src/lib/gig-payments.ts) and pays
 * the expert the rest from its own bank, outside the gateway, once the
 * session is delivered plus 48 hours; the operator records that transfer's
 * reference. A refund returns the whole seat price to the guardian's
 * instrument from the company's gateway balance. This adapter can make
 * exactly the calls in ALLOWED_CALLS: an order, a payment read and a refund.
 *
 * NO SDK, as gateway.ts: HTTPS with Basic auth, one `fetch` inside `call`.
 *
 * TWO TRANSPORTS: "devbox" mints local ids and /dev/payments settles them
 * through the same door the webhook uses; "razorpay" talks to the real API
 * with the company's key. "off" (deployed, no key) refuses.
 */
export const ALLOWED_CALLS = [
  { method: "POST", path: "/v1/orders" },
  { method: "GET", path: "/v1/payments/{paymentId}" },
  { method: "POST", path: "/v1/payments/{paymentId}/refund" },
] as const;

const API_BASE = () => process.env.GATEWAY_PLATFORM_API_BASE?.trim().replace(/\/$/, "") || "https://api.razorpay.com";
const CALL_TIMEOUT_MS = 15_000;
const SECRET_BINDING = "gateway:platform:secret";

export class GigGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "GigGatewayError";
  }
}

export type PlatformAccount = { keyId: string; secret: string };

export function transport(): GigGatewayTransport {
  return readGigGatewayTransport();
}

/** The company's key, its secret opened from the sealed value; null under devbox, thrown when off or half set. */
export function platformAccount(): PlatformAccount | null {
  const mode = transport();
  if (mode === "devbox") return null;
  if (mode === "off") throw new GigGatewayError("gateway: paid sessions are off on this server");
  const { keyId, secretEnc } = readGigGatewayRaw();
  if (!keyId || !secretEnc) throw new GigGatewayError("gateway: the platform key is half set");
  return { keyId, secret: open(secretEnc, SECRET_BINDING) };
}

/** What the sessions webhook checks signatures with: the set secret, or the devbox one. */
export function webhookSecret(): string | null {
  const mode = transport();
  if (mode === "off") return null;
  return readGigGatewayRaw().webhookSecret || (mode === "devbox" ? DEVBOX_WEBHOOK_SECRET : null);
}

/** Ids as the gateway prints them (order_, pay_, rfnd_), turned back into the template they were made from. */
function templateOf(path: string): string {
  return path.replace(/\/(order|pay|rfnd)_[A-Za-z0-9]+/g, (m) => (m.startsWith("/pay_") ? "/{paymentId}" : m.startsWith("/order_") ? "/{orderId}" : "/{refundId}"));
}

async function call<T>(account: PlatformAccount, method: "GET" | "POST", path: string, body?: Record<string, unknown>): Promise<T> {
  const template = templateOf(path);
  if (!ALLOWED_CALLS.some((c) => c.method === method && c.path === template)) throw new GigGatewayError(`gateway: ${method} ${template} is not an allowed call`);
  let response: Response;
  try {
    response = await fetch(`${API_BASE()}${path}`, {
      method,
      headers: { Authorization: `Basic ${Buffer.from(`${account.keyId}:${account.secret}`).toString("base64")}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
    });
  } catch (error) {
    const cause = (error as { cause?: { message?: string } }).cause?.message;
    throw new GigGatewayError(`gateway unreachable: ${cause ?? (error as Error).message}`);
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
    throw new GigGatewayError(description ? `gateway: ${description}` : `gateway answered ${response.status}`, response.status);
  }
  return json as T;
}

const devboxId = (prefix: string) => `${prefix}_devbox${randomBytes(7).toString("hex")}`;

/* -------------------------------------------------------------------------- */
/* Orders, a payment read and refunds                                           */
/* -------------------------------------------------------------------------- */

export type SeatOrder = { orderId: string; amountPaise: number; currency: "INR" };

/**
 * One plain order for the seat's whole price, to the company's own account.
 * `receipt` is our own payment id, so the order traces back from the
 * dashboard. Nothing in it names the expert: the split is the company's
 * bookkeeping, not the gateway's.
 */
export async function createSeatOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<SeatOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new GigGatewayError("gateway: an order needs a whole number of paise, at least ₹1");
  const account = platformAccount();
  if (!account) return { orderId: devboxId("order"), amountPaise: input.amountPaise, currency: "INR" };
  const order = await call<{ id: string; amount: number }>(account, "POST", "/v1/orders", { amount: input.amountPaise, currency: "INR", receipt: input.receipt, notes: input.notes ?? {} });
  return { orderId: order.id, amountPaise: order.amount, currency: "INR" };
}

export type SeatPaymentRead = { paymentId: string; orderId: string | null; amountPaise: number; status: string };

/** What the gateway holds for one payment — for the operator's eye when a capture and the webhook disagree; devbox answers "captured". */
export async function fetchSeatPayment(paymentId: string): Promise<SeatPaymentRead> {
  const account = platformAccount();
  if (!account) return { paymentId, orderId: null, amountPaise: 0, status: "captured" };
  const p = await call<{ id: string; order_id?: string | null; amount: number; status: string }>(account, "GET", `/v1/payments/${encodeURIComponent(paymentId)}`);
  return { paymentId: p.id, orderId: p.order_id ?? null, amountPaise: p.amount, status: p.status };
}

export type SeatRefund = { refundId: string; status: string; amountPaise: number };

/** The whole seat price back to the guardian's instrument, from the company's gateway balance. */
export async function refundSeat(paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<SeatRefund> {
  const account = platformAccount();
  if (!account) return { refundId: devboxId("rfnd"), status: "processed", amountPaise };
  const refund = await call<{ id: string; status: string; amount: number }>(account, "POST", `/v1/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, notes: notes ?? {} });
  return { refundId: refund.id, status: refund.status, amountPaise: refund.amount };
}

/* -------------------------------------------------------------------------- */
/* Signatures                                                                   */
/* -------------------------------------------------------------------------- */

const hmacHex = (secret: string, data: string): string => createHmac("sha256", secret).update(data).digest("hex");
function equalHex(a: string, b: string): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}

/** The webhook's `X-Razorpay-Signature`: HMAC-SHA256 of the raw body under the webhook secret. */
export function verifySessionsWebhook(rawBody: string, signature: string | null): boolean {
  const secret = webhookSecret();
  if (!secret || !signature) return false;
  return equalHex(hmacHex(secret, rawBody), signature.trim().toLowerCase());
}
/** The checkout's handler signature: HMAC-SHA256 of `order_id|payment_id` under the key secret. */
export function verifySeatCheckout(orderId: string, paymentId: string, signature: string): boolean {
  const account = platformAccount();
  const secret = account?.secret ?? "devbox";
  return equalHex(hmacHex(secret, `${orderId}|${paymentId}`), signature.trim().toLowerCase());
}
/** For tests and the devbox page: what a genuine gateway would have signed. */
export function signSessionsWebhook(rawBody: string, secret: string = webhookSecret() ?? DEVBOX_WEBHOOK_SECRET): string {
  return hmacHex(secret, rawBody);
}
export function signSeatCheckout(orderId: string, paymentId: string, secret = "devbox"): string {
  return hmacHex(secret, `${orderId}|${paymentId}`);
}
