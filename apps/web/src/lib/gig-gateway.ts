import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { readGigGatewayTransport } from "./env";
import { DEVBOX_WEBHOOK_SECRET, readGigGatewayRaw, type GigGatewayTransport } from "./gig-gateway-env";
import { open } from "./secret-box";

/**
 * The COMPANY'S OWN gateway account, spoken to for paid sessions and for
 * nothing else (decision 0004, third amendment of 2 October 2026; decision
 * 0003 is untouched and school fees never come here — tests/fees-invariants
 * holds gateway.ts to four calls, and this module is the one the decision
 * said would be its own).
 *
 * WHAT MOVES WHERE (Razorpay Route). A guardian pays the gateway for one
 * workshop seat. The order carries a TRANSFER of the expert's net to the
 * expert's own linked account, ON HOLD with no end date: the gateway keeps
 * it until the hourly gigs:release takes the hold off (the session delivered
 * plus 48 hours), then settles it to the expert's bank. The commission and
 * the GST on it stay in the company's account, and the gateway's fee comes
 * out of them. A refund reverses the transfer and returns the whole seat
 * price to the guardian's instrument. The company never holds the expert's
 * share; this adapter can make exactly the calls in ALLOWED_CALLS.
 *
 * A LINKED ACCOUNT is four calls, each resumable (gig-payments.ts stores
 * every id as it is made): the account, its stakeholder with the PAN, the
 * Route product requested, and the product's settlement bank account. The
 * gateway then reviews it; `activation_status` says where it stands.
 *
 * NO SDK, as gateway.ts: HTTPS with Basic auth, one `fetch` inside `call`.
 *
 * TWO TRANSPORTS: "devbox" mints local ids, activates a linked account at
 * once, and /dev/payments settles orders through the same door the webhook
 * uses; "razorpay" talks to the real API with the company's Route-enabled
 * key. "off" (deployed, no key) refuses.
 */
export const ALLOWED_CALLS = [
  { method: "POST", path: "/v1/orders" },
  { method: "GET", path: "/v1/payments/{paymentId}" },
  { method: "GET", path: "/v1/payments/{paymentId}/transfers" },
  { method: "POST", path: "/v1/payments/{paymentId}/transfers" },
  { method: "PATCH", path: "/v1/transfers/{transferId}" },
  { method: "POST", path: "/v1/payments/{paymentId}/refund" },
  { method: "POST", path: "/v2/accounts" },
  { method: "POST", path: "/v2/accounts/{accountId}/stakeholders" },
  { method: "POST", path: "/v2/accounts/{accountId}/products" },
  { method: "PATCH", path: "/v2/accounts/{accountId}/products/{productId}" },
  { method: "GET", path: "/v2/accounts/{accountId}/products/{productId}" },
] as const;

const API_BASE = () => process.env.GATEWAY_PLATFORM_API_BASE?.trim().replace(/\/$/, "") || "https://api.razorpay.com";
const CALL_TIMEOUT_MS = 15_000;
const SECRET_BINDING = "gateway:platform:secret";

export class GigGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    /** "EMPTY_ANSWER": a 2xx whose body is not a JSON object (QA-38); null for every other failure. */
    readonly code: "EMPTY_ANSWER" | null = null,
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

const TEMPLATE_OF_PREFIX: Record<string, string> = { order: "{orderId}", pay: "{paymentId}", trf: "{transferId}", rfnd: "{refundId}", acc_prd: "{productId}", acc: "{accountId}" };

/** Ids as the gateway prints them (order_, pay_, trf_, rfnd_, acc_prd_, acc_), turned back into the template they were made from. */
export function templateOf(path: string): string {
  return path.replace(/\/(order|pay|trf|rfnd|acc_prd|acc)_[A-Za-z0-9]+/g, (_m, prefix: string) => `/${TEMPLATE_OF_PREFIX[prefix]}`);
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
  // A success whose body is empty, not JSON or not an object is the gateway's fault, not an answer: refused here as a
  // GigGatewayError the callers already handle, never handed on to fail later as a TypeError on a missing id (QA-38).
  if (json === null || typeof json !== "object" || Array.isArray(json)) {
    throw new GigGatewayError(`gateway answered ${response.status} with no JSON object`, response.status, "EMPTY_ANSWER");
  }
  return json as T;
}

const devboxId = (prefix: string) => `${prefix}_devbox${randomBytes(7).toString("hex")}`;

/* -------------------------------------------------------------------------- */
/* Orders with a held transfer, a payment read, transfers and refunds           */
/* -------------------------------------------------------------------------- */

export type SeatOrder = { orderId: string; amountPaise: number; currency: "INR" };

/**
 * One order for the seat's whole price, with a transfer of the expert's net
 * to their linked account that the gateway holds until released (no end
 * date: only gigs:release lets it go). `receipt` is our own payment id, so
 * the order traces back from the dashboard; `partial_payment` is off, as
 * Route asks of an order that carries a transfer.
 */
export async function createSeatOrder(input: { amountPaise: number; expertSharePaise: number; linkedAccountId: string; receipt: string; notes?: Record<string, string> }): Promise<SeatOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new GigGatewayError("gateway: an order needs a whole number of paise, at least ₹1");
  if (!Number.isInteger(input.expertSharePaise) || input.expertSharePaise < 1 || input.expertSharePaise > input.amountPaise) throw new GigGatewayError("gateway: the expert's share must be within the seat's price");
  if (!input.linkedAccountId) throw new GigGatewayError("gateway: the expert has no linked account");
  const account = platformAccount();
  if (!account) return { orderId: devboxId("order"), amountPaise: input.amountPaise, currency: "INR" };
  const notes = input.notes ?? {};
  const order = await call<{ id: string; amount: number }>(account, "POST", "/v1/orders", {
    amount: input.amountPaise,
    currency: "INR",
    receipt: input.receipt,
    partial_payment: false,
    notes,
    transfers: [{ account: input.linkedAccountId, amount: input.expertSharePaise, currency: "INR", on_hold: true, notes, linked_account_notes: Object.keys(notes).slice(0, 1) }],
  });
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

export type HeldTransfer = { transferId: string; recipient: string | null; amountPaise: number; onHold: boolean; status: string };

/**
 * The transfers the gateway made from a captured payment. Devbox mints one
 * from the payment id, so the same payment always names the same transfer.
 */
export async function transfersOf(paymentId: string, devbox: { linkedAccountId: string; amountPaise: number }): Promise<HeldTransfer[]> {
  const account = platformAccount();
  if (!account) return [{ transferId: `trf_devbox${paymentId.replace(/[^A-Za-z0-9]/g, "").slice(-16)}`, recipient: devbox.linkedAccountId, amountPaise: devbox.amountPaise, onHold: true, status: "processed" }];
  const result = await call<{ items?: { id: string; recipient?: string; amount: number; on_hold?: boolean; status?: string }[] }>(account, "GET", `/v1/payments/${encodeURIComponent(paymentId)}/transfers`);
  return (result.items ?? []).map((t) => ({ transferId: t.id, recipient: t.recipient ?? null, amountPaise: t.amount, onHold: Boolean(t.on_hold), status: t.status ?? "created" }));
}

/** A transfer made again from a captured payment, on hold — for the one whose order-time transfer failed. */
export async function transferFromPayment(paymentId: string, input: { linkedAccountId: string; amountPaise: number; notes?: Record<string, string> }): Promise<HeldTransfer> {
  const account = platformAccount();
  if (!account) return { transferId: devboxId("trf"), recipient: input.linkedAccountId, amountPaise: input.amountPaise, onHold: true, status: "processed" };
  const result = await call<{ items?: { id: string; recipient?: string; amount: number; on_hold?: boolean; status?: string }[] }>(account, "POST", `/v1/payments/${encodeURIComponent(paymentId)}/transfers`, { transfers: [{ account: input.linkedAccountId, amount: input.amountPaise, currency: "INR", on_hold: true, notes: input.notes ?? {} }] });
  const t = result.items?.[0];
  if (!t) throw new GigGatewayError("gateway: no transfer was made");
  return { transferId: t.id, recipient: t.recipient ?? null, amountPaise: t.amount, onHold: Boolean(t.on_hold), status: t.status ?? "created" };
}

/** Lets the gateway settle the expert: the hold comes off, and the transfer settles on the next working day. */
export async function releaseTransfer(transferId: string): Promise<{ transferId: string; onHold: boolean }> {
  const account = platformAccount();
  if (!account) return { transferId, onHold: false };
  const t = await call<{ id: string; on_hold?: boolean }>(account, "PATCH", `/v1/transfers/${encodeURIComponent(transferId)}`, { on_hold: false });
  return { transferId: t.id, onHold: Boolean(t.on_hold) };
}

export type SeatRefund = { refundId: string; status: string; amountPaise: number };

/** The whole seat price back to the guardian's instrument; with `reverse`, every transfer made from the payment is reversed first. */
export async function refundSeat(paymentId: string, amountPaise: number, notes?: Record<string, string>, reverse = true): Promise<SeatRefund> {
  const account = platformAccount();
  if (!account) return { refundId: devboxId("rfnd"), status: "processed", amountPaise };
  const refund = await call<{ id: string; status: string; amount: number }>(account, "POST", `/v1/payments/${encodeURIComponent(paymentId)}/refund`, { amount: amountPaise, ...(reverse ? { reverse_all: true } : {}), notes: notes ?? {} });
  return { refundId: refund.id, status: refund.status, amountPaise: refund.amount };
}

/* -------------------------------------------------------------------------- */
/* Linked accounts                                                              */
/* -------------------------------------------------------------------------- */

export const ROUTE_STATUSES = ["NONE", "REQUESTED", "NEEDS_CLARIFICATION", "UNDER_REVIEW", "ACTIVATED", "SUSPENDED"] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];
export type RouteRequirement = { field: string; reason: string };
export type RouteProduct = { productId: string; status: RouteStatus; requirements: RouteRequirement[] };

/** The gateway's `activation_status`, in our words; anything unknown is still being looked at. */
export function routeStatusOf(raw: string | undefined | null): RouteStatus {
  switch ((raw ?? "").toLowerCase()) {
    case "activated":
      return "ACTIVATED";
    case "needs_clarification":
      return "NEEDS_CLARIFICATION";
    case "suspended":
      return "SUSPENDED";
    case "requested":
      return "REQUESTED";
    default:
      return "UNDER_REVIEW";
  }
}

type ProductAnswer = { id: string; activation_status?: string; requirements?: { field_reference?: string; reason_code?: string }[] };
const productOf = (p: ProductAnswer): RouteProduct => ({ productId: p.id, status: routeStatusOf(p.activation_status), requirements: (p.requirements ?? []).map((r) => ({ field: String(r.field_reference ?? "").slice(0, 120), reason: String(r.reason_code ?? "").slice(0, 60) })).slice(0, 20) });

/** The state names the gateway accepts for a registered address, by GST state code. */
const STATE_BY_GST_CODE: Record<string, string> = {
  "01": "JAMMU AND KASHMIR", "02": "HIMACHAL PRADESH", "03": "PUNJAB", "04": "CHANDIGARH", "05": "UTTARAKHAND", "06": "HARYANA", "07": "DELHI", "08": "RAJASTHAN", "09": "UTTAR PRADESH",
  "10": "BIHAR", "11": "SIKKIM", "12": "ARUNACHAL PRADESH", "13": "NAGALAND", "14": "MANIPUR", "15": "MIZORAM", "16": "TRIPURA", "17": "MEGHALAYA", "18": "ASSAM",
  "19": "WEST BENGAL", "20": "JHARKHAND", "21": "ODISHA", "22": "CHHATTISGARH", "23": "MADHYA PRADESH", "24": "GUJARAT", "25": "DAMAN AND DIU", "26": "DADRA AND NAGAR HAVELI", "27": "MAHARASHTRA",
  "29": "KARNATAKA", "30": "GOA", "31": "LAKSHADWEEP", "32": "KERALA", "33": "TAMIL NADU", "34": "PUDUCHERRY", "35": "ANDAMAN AND NICOBAR ISLANDS", "36": "TELANGANA", "37": "ANDHRA PRADESH",
  "38": "LADAKH",
};
export const stateNameOf = (gstStateCode: string): string | null => STATE_BY_GST_CODE[gstStateCode] ?? null;

export type LinkedAccountInput = { reference: string; email: string; phone: string; name: string; addressLine: string; city: string; postalCode: string; gstStateCode: string };

/**
 * Step 1: the expert's linked account, as an individual teaching
 * (education / coaching). The name is the one on their PAN and their bank.
 */
export async function createLinkedAccount(input: LinkedAccountInput): Promise<{ accountId: string }> {
  const account = platformAccount();
  if (!account) return { accountId: devboxId("acc") };
  const state = stateNameOf(input.gstStateCode);
  if (!state) throw new GigGatewayError("gateway: no state for that GST state code");
  const made = await call<{ id: string }>(account, "POST", "/v2/accounts", {
    email: input.email,
    phone: input.phone,
    type: "route",
    reference_id: input.reference.slice(0, 512),
    legal_business_name: input.name.slice(0, 200),
    business_type: "individual",
    contact_name: input.name.slice(0, 200),
    profile: { category: "education", subcategory: "coaching", addresses: { registered: { street1: input.addressLine.slice(0, 100), city: input.city.slice(0, 100), state, postal_code: input.postalCode, country: "IN" } } },
  });
  return { accountId: made.id };
}

/** Step 2: the stakeholder — the expert themself — with the PAN as their KYC. */
export async function createStakeholder(accountId: string, input: { name: string; email: string; pan: string }): Promise<{ stakeholderId: string }> {
  const account = platformAccount();
  if (!account) return { stakeholderId: devboxId("sth") };
  const made = await call<{ id: string }>(account, "POST", `/v2/accounts/${encodeURIComponent(accountId)}/stakeholders`, { name: input.name.slice(0, 255), email: input.email, kyc: { pan: input.pan } });
  return { stakeholderId: made.id };
}

/** Step 3: Route asked for on the account, its terms accepted. */
export async function requestRouteProduct(accountId: string): Promise<RouteProduct> {
  const account = platformAccount();
  if (!account) return { productId: devboxId("acc_prd"), status: "REQUESTED", requirements: [{ field: "settlements", reason: "field_missing" }] };
  return productOf(await call<ProductAnswer>(account, "POST", `/v2/accounts/${encodeURIComponent(accountId)}/products`, { product_name: "route", tnc_accepted: true }));
}

/** Step 4 (and again on a change of bank): where the gateway settles the expert. Devbox activates at once. */
export async function setRouteBank(accountId: string, productId: string, bank: { accountNumber: string; ifsc: string; beneficiaryName: string }): Promise<RouteProduct> {
  const account = platformAccount();
  if (!account) return { productId, status: "ACTIVATED", requirements: [] };
  return productOf(await call<ProductAnswer>(account, "PATCH", `/v2/accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productId)}`, { settlements: { account_number: bank.accountNumber, ifsc_code: bank.ifsc, beneficiary_name: bank.beneficiaryName.slice(0, 120) }, tnc_accepted: true }));
}

/** Where the gateway's review of the Route product stands. */
export async function fetchRouteProduct(accountId: string, productId: string): Promise<RouteProduct> {
  const account = platformAccount();
  if (!account) return { productId, status: "ACTIVATED", requirements: [] };
  return productOf(await call<ProductAnswer>(account, "GET", `/v2/accounts/${encodeURIComponent(accountId)}/products/${encodeURIComponent(productId)}`));
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

// plans-pay (17 Oct 2026)
/**
 * A PASS'S ORDER (decision 0006): the plan's price with its GST, collected by the company for itself — the company's
 * own revenue, so a plain order with NO transfer, no Route, no split; the same allow-listed POST /v1/orders. A refund
 * is refundSeat(paymentId, total, notes, false): nothing to reverse. `receipt` is our PassOrder id.
 */
export async function createPassOrderAtGateway(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<SeatOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new GigGatewayError("gateway: an order needs a whole number of paise, at least ₹1");
  const account = platformAccount();
  if (!account) return { orderId: devboxId("order"), amountPaise: input.amountPaise, currency: "INR" };
  const order = await call<{ id: string; amount: number }>(account, "POST", "/v1/orders", { amount: input.amountPaise, currency: "INR", receipt: input.receipt, partial_payment: false, notes: input.notes ?? {} });
  return { orderId: order.id, amountPaise: order.amount, currency: "INR" };
}
// end plans-pay
// seats (17 Oct 2026)
/**
 * A TEACHER'S SEAT (decision 0006, built 17 Oct 2026): a teacher has no linked account at the gateway, so the seat is
 * a plain order for the whole price on the company's account, with NO transfer — the company-collects path of 0004's
 * second amendment — and the company pays the teacher by hand after the hold (gig-payments.ts). The same allow-listed
 * POST /v1/orders; a refund is refundSeat(paymentId, amount, notes, false): nothing to reverse.
 */
export async function createCompanyOrder(input: { amountPaise: number; receipt: string; notes?: Record<string, string> }): Promise<SeatOrder> {
  if (!Number.isInteger(input.amountPaise) || input.amountPaise < 100) throw new GigGatewayError("gateway: an order needs a whole number of paise, at least ₹1");
  const account = platformAccount();
  if (!account) return { orderId: devboxId("order"), amountPaise: input.amountPaise, currency: "INR" };
  const order = await call<{ id: string; amount: number }>(account, "POST", "/v1/orders", { amount: input.amountPaise, currency: "INR", receipt: input.receipt, partial_payment: false, notes: input.notes ?? {} });
  return { orderId: order.id, amountPaise: order.amount, currency: "INR" };
}
// end seats
