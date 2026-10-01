import { describe, expect, it } from "vitest";
import { BodyTooLarge, JSON_BODY_LIMIT, readBounded, readJson, WEBHOOK_BODY_LIMIT, apiFailure } from "@/lib/api-v1";
import { POST as razorpayWebhook } from "@/app/api/webhooks/razorpay/[schoolId]/route";
import { POST as twilioWebhook } from "@/app/api/webhooks/twilio/status/[schoolId]/route";

/**
 * A body has a ceiling. Every v1 handler reads JSON through readJson, which
 * refuses past 256 KB by the declared length and, when none is declared,
 * by the bytes actually read; the two webhooks read raw text under 64 KB.
 * Found by the penetration probes of 2026-10-01: a 50 MB body was parsed
 * whole before the schema said no.
 */
describe("a request body has a ceiling", () => {
  it("a declared length past the limit is refused before a byte is read", async () => {
    const request = new Request("http://localhost/api/v1/x", { method: "POST", headers: { "content-length": String(JSON_BODY_LIMIT + 1), "content-type": "application/json" }, body: "{}" });
    await expect(readJson(request)).rejects.toBeInstanceOf(BodyTooLarge);
  });

  it("an undeclared body is read up to the limit and no further, and a small one parses", async () => {
    const big = new ReadableStream<Uint8Array>({
      start(controller) {
        const chunk = new Uint8Array(64 * 1024).fill(0x61);
        for (let i = 0; i < 8; i++) controller.enqueue(chunk);
        controller.close();
      },
    });
    const request = new Request("http://localhost/api/v1/x", { method: "POST", body: big, duplex: "half" } as RequestInit);
    expect(await readBounded(request, 256 * 1024)).toBeNull();
    const small = new Request("http://localhost/api/v1/x", { method: "POST", body: '{"a":1}' });
    expect(await readJson(small)).toEqual({ a: 1 });
    const broken = new Request("http://localhost/api/v1/x", { method: "POST", body: "{nope" });
    expect(await readJson(broken)).toBeNull();
  });

  it("the refusal is 413 with its own code", async () => {
    const response = await apiFailure(new BodyTooLarge(), "test");
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ code: "TOO_LARGE" });
  });

  it("the gateway and the texting webhooks refuse a body past 64 KB before checking a signature", async () => {
    const body = "x".repeat(WEBHOOK_BODY_LIMIT + 1);
    const params = { params: Promise.resolve({ schoolId: "zz-none" }) };
    const r1 = await razorpayWebhook(new Request("http://localhost/api/webhooks/razorpay/zz-none", { method: "POST", body, headers: { "content-type": "application/json" } }), params);
    expect(r1.status).toBe(413);
    const r2 = await twilioWebhook(new Request("http://localhost/api/webhooks/twilio/status/zz-none", { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } }), params);
    expect(r2.status).toBe(413);
  });
});
