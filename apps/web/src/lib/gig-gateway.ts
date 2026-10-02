import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readGigGatewayTransport } from "./env";
import { DEVBOX_WEBHOOK_SECRET, readGigGatewayRaw, type GigGatewayTransport } from "./gig-gateway-env";
import { open } from "./secret-box";

/**
 * The COMPANY'S OWN gateway account, spoken to for paid sessions and for
 * nothing else (decision 0004, amended 2026-10-02; decision 0003 is
 * untouched and school fees never come here — tests/fees-invariants.test.ts
 * holds gateway.ts to four calls, and this module is the one the decision
 * said would be its own).
 *
 * WHAT MOVES WHERE. A guardian pays the gateway for one workshop seat. The
 * order carries a TRANSFER to the expert's own linked account (Razorpay
 * Route) for the seat's price less the company's commission, ON HOLD; the
 * commission stays in the company's account and the gateway's fee comes out
 * of it. When the session is delivered plus 48 hours, the hold is released
 * and the gateway settles the expert directly. A refund reverses the transfer
 * and returns the whole seat price to the guardian's instrument. The company
 * never holds, pools or forwards a family's money: the gateway does the
 * split, and this adapter can make exactly the calls in ALLOWED_CALLS.
 *
 * NO SDK, as gateway.ts: HTTPS with Basic auth, one `fetch` inside `call`.
 *
 * TWO TRANSPORTS: "devbox" mints local ids and /dev/payments settles them
 * through the same door the webhook uses; "razorpay" talks to the real API
 * with the company's Route-enabled key. "off" (deployed, no key) refuses.
 */
export const ALLOWED_CALLS = [
  { method: "POST", path: "/v1/orders" },
  { method: "GET", path: "/v1/payments/{paymentId}/transfers" },
  { method: "PATCH", path: "/v1/transfers/{transferId}" },
  { method: "POST", path: "/v1/payments/{paymentId}/refund" },
  { method: "POST", path: "/v2/accounts" },
  { method: "GET", path: "/v2/accounts/{accountId}" },
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

/** Ids as the gateway prints them (order_, pay_, trf_, rfnd_, acc_), turned back into the template they were made from. */
function templateOf(path: string): string {
  return path.replace(/\/(order|pay|trf|rfnd|acc)_[A-Za-z0-9]+/g, (m) => (m.startsWith("/pay_") ? "/{paymentId}" : m.startsWith("/trf_") ? "/{transferId}" : m.startsWith("/acc_") ? "/{accountId}" : m.startsWith("/order_") ? "/{orderId}" : "/{refundId}"));
}

async function call<T>(account: PlatformAccount, method: "GET" | "POST" | "PATCH", path: string, body?: Record<string, unknown>): Promise<T> {
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
/* Orders with a held transfer                                                  */
/* -------------------------------------------------------------------------- */

export type SeatOrder = { orderId: string; amountPaise: number; currency: "INR" };

/**
 * One order for the seat's whole price, with a transfer of the expert's share
 * to their linked account that the gateway holds until released. `receipt`
 * is our own payment id, so the order traces back from the dashboard.
 */
export async function createSeatOrder(input: { amountPaise: number; expertSharePaise: number; linkedAccountId: string; receipt: string; notes?: Record<string, string> }): Promise<SeatOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new GigGatewayError("gateway: an order needs a whole number of paise, at least ₹1");
  if (!Number.isInteger(input.expertSharePaise) || input.expertSharePaise < 1 || input.expertSharePaise > input.amountPaise) throw new GigGatewayError("gateway: the expert's share must be within the seat's price");
  const account = platformAccount();
  if (!account) return { orderId: devboxId("order"), amountPaise: input.amountPaise, currency: "INR" };
  const order = await call<{ id: string; amount: number }>(account, "POST", "/v1/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes ?? {},
    transfers: [{ account: input.linkedAccountId, amount: input.expertSharePaise, currency: "INR", on_hold: 1, notes: input.notes ?? {} }],
  });
  return { orderId: order.id, amountPaise: order.amount, currency: "INR" };
}

export type HeldTransfer = { transferId: string; amountPaise: number; onHold: boolean; settlementId: string | null };

/** The transfer the gateway made from a captured payment; devbox mints one from the payment id, so the same payment names the same transfer. */
export async function transfersOf(paymentId: string, expertSharePaise: number): Promise<HeldTransfer[]> {
  const account = platformAccount();
  if (!account) return [{ transferId: `trf_devbox${paymentId.replace(/[^A-Za-z0-9]/g, "").slice(-16)}`, amountPaise: expertSharePaise, onHold: true, settlementId: null }];
  const result = await call<{ items?: { id: string; amount: number; on_hold?: boolean; settlement_id?: string | null }[] }>(account, "GET", `/v1/payments/${encodeURIComponent(paymentId)}/transfers`);
  return (result.items ?? []).map((t) => ({ transferId: t.id, amountPaise: t.amount, onHold: Boolean(t.on_hold), settlementId: t.settlement_id ?? null }));
}

/** Lets the gateway settle the expert: the hold comes off. */
export async function releaseTransfer(transferId: string): Promise<{ transferId: string; onHold: boolean }> {
  const account = platformAccount();
  if (!account) return { transferId, onHold: false };
  const t = await call<{ id: string; on_hold?: boolean }>(account, "PATCH", `/v1/transfers/${encodeURIComponent(transferId)}`, { on_hold: 0 });
  return { transferId: t.id, onHold: Boolean(t.on_hold) };
}

export type SeatRefund = { refundId: string; status: string; amountPaise: number };

/** The whole seat price back to the guardian's instrument, the held transfer reversed with it. */
export async function refundSeat(paymentId: string, amountPaise: number, notes?: Record<string, string>): Promise<SeatRefund> {
  const account = platformAccount();
  if (!account) return { refundId: devboxId("rfnd"), status: "processed", amountPaise };
  const refund = await call<{ id: string; status: string; amount: number }>(account, "POST", `/v1/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, reverse_all: 1, notes: notes ?? {} });
  return { refundId: refund.id, status: refund.status, amountPaise: refund.amount };
}

/* -------------------------------------------------------------------------- */
/* Linked accounts                                                              */
/* -------------------------------------------------------------------------- */

export type LinkedAccount = { linkedAccountId: string; /** NONE | PENDING | ACTIVE as the gateway's status reads to us. */ status: "PENDING" | "ACTIVE"; onboardingUrl: string | null };

const asStatus = (raw: string | undefined): "PENDING" | "ACTIVE" => (raw === "activated" ? "ACTIVE" : "PENDING");

/**
 * An expert's linked account in the company's Route, made with what the
 * platform knows of them (their name and email — never a document; the
 * gateway asks for its own papers on its own page). Devbox: active at once.
 */
export async function createLinkedAccount(input: { reference: string; name: string; email: string | null }): Promise<LinkedAccount> {
  const account = platformAccount();
  if (!account) return { linkedAccountId: devboxId("acc"), status: "ACTIVE", onboardingUrl: null };
  const made = await call<{ id: string; status?: string; onboarding_url?: string }>(account, "POST", "/v2/accounts", {
    email: input.email ?? undefined,
    type: "route",
    reference_id: input.reference,
    legal_business_name: input.name.slice(0, 200),
    business_type: "individual",
    contact_name: input.name.slice(0, 200),
  });
  return { linkedAccountId: made.id, status: asStatus(made.status), onboardingUrl: made.onboarding_url ?? null };
}

/** Where the gateway's checks of a linked account stand. */
export async function fetchLinkedAccount(linkedAccountId: string): Promise<LinkedAccount> {
  const account = platformAccount();
  if (!account) return { linkedAccountId, status: "ACTIVE", onboardingUrl: null };
  const got = await call<{ id: string; status?: string; onboarding_url?: string }>(account, "GET", `/v2/accounts/${encodeURIComponent(linkedAccountId)}`);
  return { linkedAccountId: got.id, status: asStatus(got.status), onboardingUrl: got.onboarding_url ?? null };
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
