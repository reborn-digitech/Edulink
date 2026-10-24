/**
 * THE SCHOOL'S GATEWAY OVER THE WIRE (QA campaign of 24 October 2026, unit layer).
 *
 * tests/gateway.test.ts holds the adapter's pure parts and the devbox transport; the "razorpay" transport — the
 * one a school with real keys uses — had no test at all (src/lib/gateway.ts lines 53–87 and every non-devbox
 * branch at 0 hits in the campaign's coverage run), and HANDOFF.md lists a live gateway as never exercised. This
 * holds what the adapter sends and how it reads what comes back, with `fetch` stubbed and the API base pointed at a
 * host that cannot exist (`.invalid`), so nothing leaves the machine:
 *
 *   - each of the four allowed calls goes to its path with Basic auth of the SCHOOL's key and the body it promises;
 *   - an id carrying a slash cannot steer a call off the allow-list (it is encoded, and the template check refuses);
 *   - the gateway's own error sentence, a bare status, a body that is not JSON and an unreachable host each become
 *     a GatewayError with the status where there is one.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOrder, fetchOrderPayments, fetchPayment, GatewayError, refundPayment } from "@/lib/gateway";

const ACCOUNT = { keyId: "rzp_test_zzqa000000", secret: "zz-qa-secret", mode: "TEST" as const };
const BASE = "https://zz-gateway.invalid";
const basic = `Basic ${Buffer.from(`${ACCOUNT.keyId}:${ACCOUNT.secret}`).toString("base64")}`;

type Seen = { url: string; method: string; headers: Record<string, string>; body: unknown };
let seen: Seen[] = [];
let answer: (url: string) => Response | Promise<Response> = () => new Response("{}", { status: 200 });

beforeEach(() => {
  seen = [];
  vi.stubEnv("FEES_GATEWAY_TRANSPORT", "razorpay");
  vi.stubEnv("FEES_GATEWAY_API_BASE", `${BASE}/`);
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    seen.push({ url, method: init.method ?? "GET", headers: { ...(init.headers as Record<string, string>) }, body: init.body ? JSON.parse(String(init.body)) : undefined });
    return answer(url);
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  answer = () => new Response("{}", { status: 200 });
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("the four calls, as the gateway receives them", () => {
  it("an order: POST /v1/orders under the school's key, in paise and INR, our receipt and notes; the answer's id and amount are read back", async () => {
    answer = () => json({ id: "order_ZZQA1", amount: 125_050, currency: "INR" });
    const order = await createOrder(ACCOUNT, { amountPaise: 125_050, receipt: "pay-zz-1", notes: { pupil: "zz" } });
    expect(order).toEqual({ orderId: "order_ZZQA1", amountPaise: 125_050, currency: "INR" });
    expect(seen).toHaveLength(1);
    // The trailing slash on the configured base is dropped, so the path is not doubled.
    expect(seen[0]).toMatchObject({ url: `${BASE}/v1/orders`, method: "POST", body: { amount: 125_050, currency: "INR", receipt: "pay-zz-1", notes: { pupil: "zz" } } });
    expect(seen[0]!.headers).toMatchObject({ Authorization: basic, "Content-Type": "application/json" });
  });

  it("an order with no notes sends an empty object, never undefined", async () => {
    answer = () => json({ id: "order_ZZQA2", amount: 100 });
    await createOrder(ACCOUNT, { amountPaise: 100, receipt: "r" });
    expect(seen[0]!.body).toEqual({ amount: 100, currency: "INR", receipt: "r", notes: {} });
  });

  it("a payment read: GET with no body and no content type; order_id and method default to null", async () => {
    answer = () => json({ id: "pay_ZZQA1", amount: 5_000, status: "captured" });
    expect(await fetchPayment(ACCOUNT, "pay_ZZQA1")).toEqual({ paymentId: "pay_ZZQA1", orderId: null, amountPaise: 5_000, status: "captured", method: null });
    expect(seen[0]).toMatchObject({ url: `${BASE}/v1/payments/pay_ZZQA1`, method: "GET", body: undefined });
    expect(seen[0]!.headers["Content-Type"]).toBeUndefined();
    expect(seen[0]!.headers.Authorization).toBe(basic);
  });

  it("an order's payments: every item mapped, and an answer with no items is an empty list", async () => {
    answer = () => json({ items: [{ id: "pay_A1", order_id: "order_ZZ9", amount: 300, status: "failed", method: "upi" }, { id: "pay_A2", order_id: "order_ZZ9", amount: 300, status: "captured", method: "card" }] });
    expect(await fetchOrderPayments(ACCOUNT, "order_ZZ9")).toEqual([
      { paymentId: "pay_A1", orderId: "order_ZZ9", amountPaise: 300, status: "failed", method: "upi" },
      { paymentId: "pay_A2", orderId: "order_ZZ9", amountPaise: 300, status: "captured", method: "card" },
    ]);
    expect(seen[0]!.url).toBe(`${BASE}/v1/orders/order_ZZ9/payments`);
    answer = () => json({});
    expect(await fetchOrderPayments(ACCOUNT, "order_ZZ9")).toEqual([]);
  });

  it("a refund: POST to the payment's refund path with the amount, back to its own instrument; the gateway's amount is what we record", async () => {
    answer = () => json({ id: "rfnd_ZZQA1", status: "pending", amount: 2_500 });
    expect(await refundPayment(ACCOUNT, "pay_ZZQA1", 2_500, { reason: "zz" })).toEqual({ refundId: "rfnd_ZZQA1", status: "pending", amountPaise: 2_500 });
    expect(seen[0]).toMatchObject({ url: `${BASE}/v1/payments/pay_ZZQA1/refund`, method: "POST", body: { amount: 2_500, notes: { reason: "zz" } } });
  });
});

describe("nothing outside the allow-list, whatever an id says", () => {
  it("⚠ an id with a slash or a query is encoded, and a path that no longer fits a template is refused before any request", async () => {
    // "pay_x/transfers" would be the Route call the platform must never make (decision 0003).
    await expect(fetchPayment(ACCOUNT, "pay_x/transfers")).rejects.toThrow(GatewayError);
    await expect(fetchPayment(ACCOUNT, "pay_x/transfers")).rejects.toThrow(/not an allowed call/);
    await expect(refundPayment(ACCOUNT, "../payouts", 100)).rejects.toThrow(/not an allowed call/);
    await expect(fetchOrderPayments(ACCOUNT, "order_1?expand=transfers")).rejects.toThrow(/not an allowed call/);
    expect(seen).toHaveLength(0);
  });

  it("an id that does not look like the gateway's is refused too: the template is matched on the gateway's own prefixes", async () => {
    await expect(fetchPayment(ACCOUNT, "12345")).rejects.toThrow(/GET \/v1\/payments\/12345 is not an allowed call/);
    expect(seen).toHaveLength(0);
  });
});

describe("what a refusal or an outage becomes", () => {
  it("the gateway's own description, with its status", async () => {
    answer = () => json({ error: { code: "BAD_REQUEST_ERROR", description: "The amount must be atleast INR 1.00" } }, 400);
    const error = await createOrder(ACCOUNT, { amountPaise: 100, receipt: "r" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GatewayError);
    expect((error as GatewayError).message).toBe("gateway: The amount must be atleast INR 1.00");
    expect((error as GatewayError).status).toBe(400);
  });

  it("a status with no description, and a body that is not JSON, say the status", async () => {
    answer = () => new Response("<html>bad gateway</html>", { status: 502 });
    const error = (await fetchPayment(ACCOUNT, "pay_ZZ1").catch((e: unknown) => e)) as GatewayError;
    expect(error.message).toBe("gateway answered 502");
    expect(error.status).toBe(502);
    answer = () => json({ error: {} }, 401);
    expect(((await fetchPayment(ACCOUNT, "pay_ZZ1").catch((e: unknown) => e)) as GatewayError).message).toBe("gateway answered 401");
  });

  it("an unreachable host is a GatewayError naming the cause, with no status", async () => {
    vi.stubGlobal("fetch", async () => {
      throw Object.assign(new TypeError("fetch failed"), { cause: { message: "getaddrinfo ENOTFOUND zz-gateway.invalid" } });
    });
    const error = (await refundPayment(ACCOUNT, "pay_ZZ1", 100).catch((e: unknown) => e)) as GatewayError;
    expect(error).toBeInstanceOf(GatewayError);
    expect(error.message).toBe("gateway unreachable: getaddrinfo ENOTFOUND zz-gateway.invalid");
    expect(error.status).toBeNull();
  });

  it("an empty 200 body never becomes an order without an id: a GatewayError coded EMPTY_ANSWER (QA-38)", async () => {
    // Before QA-38 this rejected with a bare TypeError (reading `id` of null), which no caller handles as a gateway failure.
    for (const body of ["", "not json", "null", "[]", "\"ok\""]) {
      answer = () => new Response(body, { status: 200 });
      const error = (await createOrder(ACCOUNT, { amountPaise: 100, receipt: "r" }).catch((e: unknown) => e)) as GatewayError;
      expect(error).toBeInstanceOf(GatewayError);
      expect(error).toMatchObject({ status: 200, code: "EMPTY_ANSWER" });
    }
  });
});

describe("the transport switch", () => {
  it("off is not devbox: a deployed server with no transport named never mints a pretend order", async () => {
    vi.stubEnv("FEES_GATEWAY_TRANSPORT", "off");
    answer = () => json({ id: "order_OFF", amount: 100 });
    // "off" is the settings page's and the checkout's to refuse; the adapter itself only knows devbox or not.
    const order = await createOrder(ACCOUNT, { amountPaise: 100, receipt: "r" });
    expect(order.orderId).toBe("order_OFF");
    expect(seen).toHaveLength(1);
  });
});
