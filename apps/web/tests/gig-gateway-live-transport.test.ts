/**
 * THE COMPANY'S GATEWAY OVER THE WIRE (QA campaign of 24 October 2026, unit layer).
 *
 * The paid sessions' and the passes' adapter (src/lib/gig-gateway.ts) was covered only under devbox: its "razorpay"
 * transport — the held transfer on a seat order, the release, the refund that reverses the transfer, the four-step
 * linked account, the key opened from its seal — was at 62.7 % of lines with every live branch unhit in the
 * campaign's coverage run. This holds the requests it would send and the way it reads the answers, with `fetch`
 * stubbed and the API base on a `.invalid` host, so nothing leaves the machine and no real key is used: the key id
 * is a made-up `rzp_test_` one and its secret is sealed here under the developer's own FEES_SECRET_KEY.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import {
  createCompanyOrder,
  createLinkedAccount,
  createPassOrderAtGateway,
  createSeatOrder,
  createStakeholder,
  fetchRouteProduct,
  fetchSeatPayment,
  GigGatewayError,
  platformAccount,
  refundSeat,
  releaseTransfer,
  requestRouteProduct,
  routeStatusOf,
  setRouteBank,
  transferFromPayment,
  transfersOf,
  transport,
  verifySeatCheckout,
  verifySessionsWebhook,
  webhookSecret,
} from "@/lib/gig-gateway";
import { DEVBOX_WEBHOOK_SECRET } from "@/lib/gig-gateway-env";
import { seal } from "@/lib/secret-box";

const BASE = "https://zz-company-gateway.invalid";
const KEY_ID = "rzp_test_zzqacompany";
const SECRET = "zz-qa-company-secret";
const basic = `Basic ${Buffer.from(`${KEY_ID}:${SECRET}`).toString("base64")}`;

type Seen = { url: string; method: string; headers: Record<string, string>; body: Record<string, unknown> | undefined };
let seen: Seen[] = [];
let answer: (url: string, method: string) => Response = () => json({});
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

function live(opts: { secret?: string | null; webhook?: string } = {}) {
  vi.stubEnv("GATEWAY_PLATFORM_KEY_ID", KEY_ID);
  vi.stubEnv("GATEWAY_PLATFORM_SECRET_ENC", opts.secret === null ? "" : (opts.secret ?? seal(SECRET, "gateway:platform:secret")));
  vi.stubEnv("GATEWAY_PLATFORM_WEBHOOK_SECRET", opts.webhook ?? "zz-qa-webhook");
  vi.stubEnv("GATEWAY_PLATFORM_API_BASE", BASE);
}

beforeEach(() => {
  seen = [];
  // Devbox by default: no key named, a development server.
  vi.stubEnv("GATEWAY_PLATFORM_KEY_ID", "");
  vi.stubEnv("GATEWAY_PLATFORM_SECRET_ENC", "");
  vi.stubEnv("GATEWAY_PLATFORM_WEBHOOK_SECRET", "");
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const method = init.method ?? "GET";
    seen.push({ url, method, headers: { ...(init.headers as Record<string, string>) }, body: init.body ? JSON.parse(String(init.body)) : undefined });
    return answer(url, method);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  answer = () => json({});
});

describe("which account, and whether any", () => {
  it("devbox on a laptop with no key: no account, the devbox webhook secret, and nothing is fetched", async () => {
    expect(transport()).toBe("devbox");
    expect(platformAccount()).toBeNull();
    expect(webhookSecret()).toBe(DEVBOX_WEBHOOK_SECRET);
    const order = await createSeatOrder({ amountPaise: 50_000, expertSharePaise: 40_000, linkedAccountId: "acc_devbox1", receipt: "zz" });
    expect(order.orderId).toMatch(/^order_devbox[0-9a-f]{14}$/);
    expect(seen).toHaveLength(0);
  });

  it("a key id makes it live, and the secret is opened from its seal under its own binding", () => {
    live();
    expect(transport()).toBe("razorpay");
    expect(platformAccount()).toEqual({ keyId: KEY_ID, secret: SECRET });
    expect(webhookSecret()).toBe("zz-qa-webhook");
  });

  it("⚠ a key id with no sealed secret is refused, and so is a secret sealed for another binding", () => {
    live({ secret: null });
    expect(() => platformAccount()).toThrow(/half set/);
    live({ secret: seal(SECRET, "gateway:school:secret") });
    expect(() => platformAccount()).toThrow();
    live({ secret: SECRET });
    expect(() => platformAccount()).toThrow(/not a sealed value/);
  });

  it("a live key with no webhook secret checks no signature at all: every delivery is refused", () => {
    live({ webhook: "" });
    expect(webhookSecret()).toBeNull();
    const body = '{"event":"payment.captured"}';
    expect(verifySessionsWebhook(body, createHmac("sha256", DEVBOX_WEBHOOK_SECRET).update(body).digest("hex"))).toBe(false);
    expect(verifySessionsWebhook(body, createHmac("sha256", "").update(body).digest("hex"))).toBe(false);
  });

  it("deployed with no key is off: every paid call refuses, and the webhook has no secret", async () => {
    // isDeployed(): a production build whose public origin is not this machine.
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://zz-shalaghar.invalid");
    expect(transport()).toBe("off");
    expect(() => platformAccount()).toThrow(/off on this server/);
    expect(webhookSecret()).toBeNull();
    await expect(createCompanyOrder({ amountPaise: 100, receipt: "r" })).rejects.toThrow(GigGatewayError);
    expect(seen).toHaveLength(0);
    // A production build on localhost is a developer's, and stays devbox.
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    expect(transport()).toBe("devbox");
  });
});

describe("a seat's order, as the gateway receives it", () => {
  it("one order for the whole price with the expert's net transferred ON HOLD to their linked account, partial payment off", async () => {
    live();
    answer = () => json({ id: "order_ZZSEAT1", amount: 50_000 });
    const order = await createSeatOrder({ amountPaise: 50_000, expertSharePaise: 40_000, linkedAccountId: "acc_ZZEXPERT1", receipt: "gp-zz-1", notes: { booking: "b1" } });
    expect(order).toEqual({ orderId: "order_ZZSEAT1", amountPaise: 50_000, currency: "INR" });
    expect(seen).toHaveLength(1);
    expect(seen[0]!.url).toBe(`${BASE}/v1/orders`);
    expect(seen[0]!.headers.Authorization).toBe(basic);
    expect(seen[0]!.body).toEqual({
      amount: 50_000,
      currency: "INR",
      receipt: "gp-zz-1",
      partial_payment: false,
      notes: { booking: "b1" },
      transfers: [{ account: "acc_ZZEXPERT1", amount: 40_000, currency: "INR", on_hold: true, notes: { booking: "b1" }, linked_account_notes: ["booking"] }],
    });
  });

  it("refuses before any request: under a rupee, a share of nothing, a share above the price, no linked account", async () => {
    live();
    await expect(createSeatOrder({ amountPaise: 99, expertSharePaise: 50, linkedAccountId: "acc_1", receipt: "r" })).rejects.toThrow(/at least ₹1/);
    await expect(createSeatOrder({ amountPaise: 1_000, expertSharePaise: 0, linkedAccountId: "acc_1", receipt: "r" })).rejects.toThrow(/within the seat's price/);
    await expect(createSeatOrder({ amountPaise: 1_000, expertSharePaise: 1_001, linkedAccountId: "acc_1", receipt: "r" })).rejects.toThrow(/within the seat's price/);
    await expect(createSeatOrder({ amountPaise: 1_000, expertSharePaise: 10.5, linkedAccountId: "acc_1", receipt: "r" })).rejects.toThrow(/within the seat's price/);
    await expect(createSeatOrder({ amountPaise: 1_000, expertSharePaise: 800, linkedAccountId: "", receipt: "r" })).rejects.toThrow(/no linked account/);
    expect(seen).toHaveLength(0);
  });

  it("a pass's order and a teacher's seat carry NO transfer: the company's own revenue, the same allowed POST", async () => {
    live();
    answer = () => json({ id: "order_ZZPASS1", amount: 11_682 });
    await createPassOrderAtGateway({ amountPaise: 11_682, receipt: "po-zz-1" });
    answer = () => json({ id: "order_ZZTEACH1", amount: 20_000 });
    await createCompanyOrder({ amountPaise: 20_000, receipt: "gp-zz-2", notes: { teacher: "t" } });
    expect(seen.map((s) => s.body)).toEqual([
      { amount: 11_682, currency: "INR", receipt: "po-zz-1", partial_payment: false, notes: {} },
      { amount: 20_000, currency: "INR", receipt: "gp-zz-2", partial_payment: false, notes: { teacher: "t" } },
    ]);
    for (const s of seen) expect(s.body).not.toHaveProperty("transfers");
  });
});

describe("after the capture: the payment, its transfers, the release and the refund", () => {
  it("reads a payment and its transfers; a transfer with no hold flag reads as not held", async () => {
    live();
    answer = (url) =>
      url.endsWith("/transfers")
        ? json({ items: [{ id: "trf_ZZ1", recipient: "acc_ZZEXPERT1", amount: 40_000, on_hold: true, status: "processed" }, { id: "trf_ZZ2", amount: 1 }] })
        : json({ id: "pay_ZZ1", order_id: "order_ZZSEAT1", amount: 50_000, status: "captured" });
    expect(await fetchSeatPayment("pay_ZZ1")).toEqual({ paymentId: "pay_ZZ1", orderId: "order_ZZSEAT1", amountPaise: 50_000, status: "captured" });
    expect(await transfersOf("pay_ZZ1", { linkedAccountId: "unused", amountPaise: 0 })).toEqual([
      { transferId: "trf_ZZ1", recipient: "acc_ZZEXPERT1", amountPaise: 40_000, onHold: true, status: "processed" },
      { transferId: "trf_ZZ2", recipient: null, amountPaise: 1, onHold: false, status: "created" },
    ]);
    expect(seen.map((s) => `${s.method} ${s.url.replace(BASE, "")}`)).toEqual(["GET /v1/payments/pay_ZZ1", "GET /v1/payments/pay_ZZ1/transfers"]);
  });

  it("a transfer made again from the payment is on hold; an answer with no transfer is an error, not a silent success", async () => {
    live();
    answer = () => json({ items: [{ id: "trf_ZZ3", recipient: "acc_ZZEXPERT1", amount: 40_000, on_hold: true }] });
    expect(await transferFromPayment("pay_ZZ1", { linkedAccountId: "acc_ZZEXPERT1", amountPaise: 40_000 })).toMatchObject({ transferId: "trf_ZZ3", onHold: true });
    expect(seen[0]!.body).toEqual({ transfers: [{ account: "acc_ZZEXPERT1", amount: 40_000, currency: "INR", on_hold: true, notes: {} }] });
    answer = () => json({ items: [] });
    await expect(transferFromPayment("pay_ZZ1", { linkedAccountId: "acc_ZZEXPERT1", amountPaise: 40_000 })).rejects.toThrow(/no transfer was made/);
  });

  it("the release is a PATCH taking the hold off, and nothing else", async () => {
    live();
    answer = () => json({ id: "trf_ZZ1", on_hold: false });
    expect(await releaseTransfer("trf_ZZ1")).toEqual({ transferId: "trf_ZZ1", onHold: false });
    expect(seen[0]).toMatchObject({ method: "PATCH", url: `${BASE}/v1/transfers/trf_ZZ1`, body: { on_hold: false } });
  });

  it("a seat's refund reverses every transfer first; a pass's (reverse false) has nothing to reverse", async () => {
    live();
    answer = () => json({ id: "rfnd_ZZ1", status: "processed", amount: 50_000 });
    expect(await refundSeat("pay_ZZ1", 50_000, { booking: "b1" })).toEqual({ refundId: "rfnd_ZZ1", status: "processed", amountPaise: 50_000 });
    await refundSeat("pay_ZZ2", 11_682, undefined, false);
    expect(seen.map((s) => s.body)).toEqual([
      { amount: 50_000, reverse_all: true, notes: { booking: "b1" } },
      { amount: 11_682, notes: {} },
    ]);
  });

  it("⚠ no id can steer a call off the allow-list: a payout or a settlement path is refused before any request", async () => {
    live();
    await expect(fetchSeatPayment("pay_x/../../v1/payouts")).rejects.toThrow(/not an allowed call/);
    await expect(releaseTransfer("trf_1/reversals")).rejects.toThrow(/not an allowed call/);
    await expect(fetchRouteProduct("acc_1", "acc_prd_1/settlements")).rejects.toThrow(/not an allowed call/);
    expect(seen).toHaveLength(0);
  });

  it("the gateway's refusal and an outage become GigGatewayErrors", async () => {
    live();
    answer = () => json({ error: { description: "The refund amount provided is greater than amount captured" } }, 400);
    const refused = (await refundSeat("pay_ZZ1", 99_999).catch((e: unknown) => e)) as GigGatewayError;
    expect(refused).toBeInstanceOf(GigGatewayError);
    expect(refused.message).toBe("gateway: The refund amount provided is greater than amount captured");
    expect(refused.status).toBe(400);
    vi.stubGlobal("fetch", async () => {
      throw new TypeError("fetch failed");
    });
    const down = (await fetchSeatPayment("pay_ZZ1").catch((e: unknown) => e)) as GigGatewayError;
    expect(down.message).toBe("gateway unreachable: fetch failed");
    expect(down.status).toBeNull();
  });

  it("an empty 200 is a GigGatewayError coded EMPTY_ANSWER, never a TypeError on a missing id (QA-38)", async () => {
    live();
    for (const body of ["", "not json", "null", "[]"]) {
      answer = () => new Response(body, { status: 200 });
      const error = (await createPassOrderAtGateway({ amountPaise: 100, receipt: "r" }).catch((e: unknown) => e)) as GigGatewayError;
      expect(error).toBeInstanceOf(GigGatewayError);
      expect(error).toMatchObject({ status: 200, code: "EMPTY_ANSWER" });
    }
  });
});

describe("the expert's linked account, in four steps", () => {
  const input = { reference: "zz-expert-1", email: "zz.expert@zz.test", phone: "9999900000", name: "ZZ Expert One", addressLine: "ZZ 1 Test Road", city: "Pune", postalCode: "411001", gstStateCode: "27" };

  it("the account as an individual coaching, at a registered address the gateway names by state", async () => {
    live();
    answer = () => json({ id: "acc_ZZNEW1" });
    expect(await createLinkedAccount(input)).toEqual({ accountId: "acc_ZZNEW1" });
    expect(seen[0]).toMatchObject({ method: "POST", url: `${BASE}/v2/accounts` });
    expect(seen[0]!.body).toMatchObject({ type: "route", business_type: "individual", reference_id: "zz-expert-1", legal_business_name: "ZZ Expert One", profile: { category: "education", subcategory: "coaching", addresses: { registered: { state: "MAHARASHTRA", city: "Pune", postal_code: "411001", country: "IN" } } } });
  });

  it("refuses a GST state code it cannot name, before any request", async () => {
    live();
    await expect(createLinkedAccount({ ...input, gstStateCode: "99" })).rejects.toThrow(/no state for that GST state code/);
    expect(seen).toHaveLength(0);
  });

  it("the stakeholder with the PAN, Route requested with its terms, the bank set, the review read", async () => {
    live();
    answer = (url, method) => {
      if (url.endsWith("/stakeholders")) return json({ id: "sth_ZZ1" });
      if (method === "POST") return json({ id: "acc_prd_ZZ1", activation_status: "needs_clarification", requirements: [{ field_reference: "settlements.ifsc_code", reason_code: "field_missing" }] });
      if (method === "PATCH") return json({ id: "acc_prd_ZZ1", activation_status: "under_review" });
      return json({ id: "acc_prd_ZZ1", activation_status: "activated" });
    };
    expect(await createStakeholder("acc_ZZNEW1", { name: "ZZ Expert One", email: "zz.expert@zz.test", pan: "ABCDE1234F" })).toEqual({ stakeholderId: "sth_ZZ1" });
    expect(await requestRouteProduct("acc_ZZNEW1")).toEqual({ productId: "acc_prd_ZZ1", status: "NEEDS_CLARIFICATION", requirements: [{ field: "settlements.ifsc_code", reason: "field_missing" }] });
    expect((await setRouteBank("acc_ZZNEW1", "acc_prd_ZZ1", { accountNumber: "000111222", ifsc: "ZZQA0000001", beneficiaryName: "ZZ Expert One" })).status).toBe("UNDER_REVIEW");
    expect((await fetchRouteProduct("acc_ZZNEW1", "acc_prd_ZZ1")).status).toBe("ACTIVATED");
    expect(seen.map((s) => `${s.method} ${s.url.replace(BASE, "")}`)).toEqual([
      "POST /v2/accounts/acc_ZZNEW1/stakeholders",
      "POST /v2/accounts/acc_ZZNEW1/products",
      "PATCH /v2/accounts/acc_ZZNEW1/products/acc_prd_ZZ1",
      "GET /v2/accounts/acc_ZZNEW1/products/acc_prd_ZZ1",
    ]);
    expect(seen[0]!.body).toEqual({ name: "ZZ Expert One", email: "zz.expert@zz.test", kyc: { pan: "ABCDE1234F" } });
    expect(seen[1]!.body).toEqual({ product_name: "route", tnc_accepted: true });
    expect(seen[2]!.body).toEqual({ settlements: { account_number: "000111222", ifsc_code: "ZZQA0000001", beneficiary_name: "ZZ Expert One" }, tnc_accepted: true });
  });

  it("reads the gateway's activation words into ours; anything unknown is still under review", () => {
    expect(["activated", "ACTIVATED", "needs_clarification", "suspended", "requested", "under_review", "", null, undefined, "new_state"].map(routeStatusOf)).toEqual([
      "ACTIVATED", "ACTIVATED", "NEEDS_CLARIFICATION", "SUSPENDED", "REQUESTED", "UNDER_REVIEW", "UNDER_REVIEW", "UNDER_REVIEW", "UNDER_REVIEW", "UNDER_REVIEW",
    ]);
  });

  it("devbox mints each step and activates the bank at once, with no request", async () => {
    expect((await createLinkedAccount({ ...input, gstStateCode: "99" })).accountId).toMatch(/^acc_devbox/);
    expect((await requestRouteProduct("acc_x")).status).toBe("REQUESTED");
    expect((await setRouteBank("acc_x", "acc_prd_x", { accountNumber: "1", ifsc: "X", beneficiaryName: "Y" })).status).toBe("ACTIVATED");
    expect(seen).toHaveLength(0);
  });
});

describe("the checkout's signature under the live key", () => {
  it("is checked with the company's secret, not the devbox word", () => {
    live();
    const good = createHmac("sha256", SECRET).update("order_ZZ1|pay_ZZ1").digest("hex");
    expect(verifySeatCheckout("order_ZZ1", "pay_ZZ1", good)).toBe(true);
    expect(verifySeatCheckout("order_ZZ1", "pay_ZZ1", createHmac("sha256", "devbox").update("order_ZZ1|pay_ZZ1").digest("hex"))).toBe(false);
    expect(verifySeatCheckout("order_ZZ1", "pay_ZZ2", good)).toBe(false);
  });
});
