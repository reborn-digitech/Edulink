import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { ALLOWED_CALLS, createOrder, fetchOrderPayments, looksLikeUtr, refundPayment, signCheckout, signWebhookBody, upiIntentLink, verifyCheckoutSignature, verifyWebhookSignature } from "@/lib/gateway";

/**
 * The gateway adapter's pure parts: the two signatures a gateway hands us,
 * the UPI intent link, the UTR shape, and the devbox transport that mints
 * local ids so the whole checkout runs with no account anywhere.
 */
const ACCOUNT = { keyId: "rzp_test_zz00000000", secret: "zz-secret-000000", mode: "TEST" as const };

describe("signatures", () => {
  it("verifies a webhook body signed with the webhook secret, and nothing else", () => {
    const body = JSON.stringify({ event: "payment.captured", payload: { payment: { entity: { id: "pay_1", amount: 100 } } } });
    const sig = signWebhookBody("whsec", body);
    expect(sig).toBe(createHmac("sha256", "whsec").update(body).digest("hex"));
    expect(verifyWebhookSignature("whsec", body, sig)).toBe(true);
    expect(verifyWebhookSignature("whsec", body, sig.toUpperCase())).toBe(true);
    expect(verifyWebhookSignature("whsec", body + " ", sig)).toBe(false);
    expect(verifyWebhookSignature("other", body, sig)).toBe(false);
    expect(verifyWebhookSignature("whsec", body, null)).toBe(false);
    expect(verifyWebhookSignature("whsec", body, "")).toBe(false);
    expect(verifyWebhookSignature("whsec", body, "ab")).toBe(false);
  });

  it("verifies the checkout's order|payment signature under the key secret", () => {
    const sig = signCheckout(ACCOUNT.secret, "order_1", "pay_1");
    expect(verifyCheckoutSignature(ACCOUNT.secret, "order_1", "pay_1", sig)).toBe(true);
    expect(verifyCheckoutSignature(ACCOUNT.secret, "order_1", "pay_2", sig)).toBe(false);
    expect(verifyCheckoutSignature("wrong", "order_1", "pay_1", sig)).toBe(false);
  });
});

describe("the UPI intent", () => {
  it("is a standard upi://pay link with the payee, the amount in rupees and our reference", () => {
    const link = upiIntentLink({ payeeVpa: "school@upi", payeeName: "ZZ Northgate School", amountPaise: 125050, reference: "EL0123ABCD", note: "Asha fees EL0123ABCD" });
    const url = new URL(link);
    expect(url.protocol).toBe("upi:");
    const p = url.searchParams;
    expect(p.get("pa")).toBe("school@upi");
    expect(p.get("pn")).toBe("ZZ Northgate School");
    expect(p.get("am")).toBe("1250.50");
    expect(p.get("cu")).toBe("INR");
    expect(p.get("tr")).toBe("EL0123ABCD");
  });

  it("knows what a UTR looks like", () => {
    expect(looksLikeUtr("123456789012")).toBe(true);
    expect(looksLikeUtr("ICICI123456789012345")).toBe(true);
    expect(looksLikeUtr("12345")).toBe(false);
    expect(looksLikeUtr("1234 5678 9012")).toBe(false);
  });
});

describe("the devbox transport", () => {
  it("mints a local order id, has no payments to report and refunds instantly", async () => {
    delete process.env.FEES_GATEWAY_TRANSPORT;
    const order = await createOrder(ACCOUNT, { amountPaise: 5000, receipt: "p1" });
    expect(order.orderId).toMatch(/^order_devbox[0-9a-f]{14}$/);
    expect(order.amountPaise).toBe(5000);
    expect(await fetchOrderPayments(ACCOUNT, order.orderId)).toEqual([]);
    const refund = await refundPayment(ACCOUNT, "pay_devbox1", 5000);
    expect(refund.refundId).toMatch(/^rfnd_devbox/);
    expect(refund.status).toBe("processed");
  });

  it("refuses an order under a rupee or with a fractional amount", async () => {
    await expect(createOrder(ACCOUNT, { amountPaise: 99, receipt: "p1" })).rejects.toThrow(/whole number of paise/);
    await expect(createOrder(ACCOUNT, { amountPaise: 100.5, receipt: "p1" })).rejects.toThrow(/whole number of paise/);
  });
});

describe("the allow-list", () => {
  it("names exactly the four calls the platform may make, and none moves money between accounts", () => {
    expect(ALLOWED_CALLS.map((c) => `${c.method} ${c.path}`)).toEqual(["POST /v1/orders", "GET /v1/payments/{paymentId}", "GET /v1/orders/{orderId}/payments", "POST /v1/payments/{paymentId}/refund"]);
    for (const c of ALLOWED_CALLS) expect(c.path).not.toMatch(/\b(transfers?|routes?|payouts?|linked|accounts?|settlements?|contacts?|fund_accounts?)\b/i);
  });
});
