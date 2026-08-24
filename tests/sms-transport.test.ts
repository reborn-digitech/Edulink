import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * The Twilio branch of the SMS transport.
 *
 * WHAT MATTERS HERE IS THE REQUEST AND THE REFUSAL. A password-reset code is
 * the one message whose silent loss looks, to the person waiting, exactly like
 * a message never requested — so this file pins that a refusal THROWS carrying
 * the provider's own words, that nothing is persisted on the real path (a
 * devbox row holds the code in plain text, which is right for a dev mailbox
 * and wrong for a production database), and that the two sender kinds land in
 * the two different fields Twilio expects.
 *
 * `fetch` is stubbed rather than a live call: the real endpoint is proven by
 * `npm run sms:test`, which is what that script exists for.
 */

const db = new PrismaClient();
const SID = "AC" + "0123456789abcdef".repeat(2);
const KEYS = ["SMS_TRANSPORT", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM", "TWILIO_API_BASE"] as const;
const original = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));

/** A distinctive number so nothing here can collide with fixture data. */
const TO = "+15550001111";

beforeEach(() => {
  process.env.SMS_TRANSPORT = "twilio";
  process.env.TWILIO_ACCOUNT_SID = SID;
  process.env.TWILIO_AUTH_TOKEN = "sekrit-token";
  process.env.TWILIO_FROM = "+15559998888";
  delete process.env.TWILIO_API_BASE;
});

afterEach(async () => {
  vi.unstubAllGlobals();
  for (const key of KEYS) {
    if (original[key] === undefined) delete (process.env as Record<string, string | undefined>)[key];
    else (process.env as Record<string, string | undefined>)[key] = original[key];
  }
  await db.outboundEmail.deleteMany({ where: { to: TO } });
});

function stubFetch(response: { ok: boolean; status?: number; body?: string }) {
  const calls: { url: string; init: RequestInit }[] = [];
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return {
      ok: response.ok,
      status: response.status ?? (response.ok ? 201 : 400),
      text: async () => response.body ?? "",
    } as unknown as Response;
  });
  return calls;
}

describe("the Twilio branch", () => {
  it("⚠ posts the message and persists NOTHING — a reset code must not sit in the database", async () => {
    const calls = stubFetch({ ok: true, status: 201 });
    const { sendSms } = await import("@/lib/sms");
    await sendSms({ to: TO, text: "123456 is your code", purpose: "TEST" });

    expect(calls).toHaveLength(1);
    expect(calls[0]!.url).toBe(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`);

    const body = calls[0]!.init.body as URLSearchParams;
    expect(body.get("To")).toBe(TO);
    expect(body.get("Body")).toBe("123456 is your code");
    expect(body.get("From")).toBe("+15559998888");
    expect(body.get("MessagingServiceSid")).toBeNull();

    // Basic auth, and the token nowhere but the header.
    const auth = (calls[0]!.init.headers as Record<string, string>).Authorization!;
    expect(Buffer.from(auth.replace("Basic ", ""), "base64").toString()).toBe(`${SID}:sekrit-token`);

    // THE POINT: the devbox row that would hold the code in plain text is absent.
    expect(await db.outboundEmail.count({ where: { to: TO } })).toBe(0);
  });

  it("sends through a Messaging Service when one is configured — the India route", async () => {
    process.env.TWILIO_FROM = "MG" + "0123456789abcdef".repeat(2);
    const calls = stubFetch({ ok: true });
    const { sendSms } = await import("@/lib/sms");
    await sendSms({ to: TO, text: "hello" });

    const body = calls[0]!.init.body as URLSearchParams;
    expect(body.get("MessagingServiceSid")).toBe(process.env.TWILIO_FROM);
    expect(body.get("From")).toBeNull();
  });

  it("⚠ a refusal THROWS, carrying Twilio's own explanation", async () => {
    stubFetch({
      ok: false,
      status: 400,
      body: JSON.stringify({ message: "The 'To' number is not a valid phone number", code: 21211 }),
    });
    const { sendSms } = await import("@/lib/sms");
    await expect(sendSms({ to: TO, text: "hello" })).rejects.toThrow(/not a valid phone number.*21211/);
  });

  it("survives a refusal that is not JSON, rather than failing while reporting a failure", async () => {
    stubFetch({ ok: false, status: 502, body: "<html>bad gateway</html>" });
    const { sendSms } = await import("@/lib/sms");
    await expect(sendSms({ to: TO, text: "hello" })).rejects.toThrow(/HTTP 502/);
  });

  it("⚠ refuses to send at all when the config is incomplete, and names what is missing", async () => {
    delete process.env.TWILIO_AUTH_TOKEN;
    const calls = stubFetch({ ok: true });
    const { sendSms } = await import("@/lib/sms");
    await expect(sendSms({ to: TO, text: "hello" })).rejects.toThrow(/TWILIO_AUTH_TOKEN/);
    // Nothing was attempted: an incomplete config is caught before the wire.
    expect(calls).toHaveLength(0);
  });

  it("honours a regional or stand-in API base", async () => {
    process.env.TWILIO_API_BASE = "http://127.0.0.1:2530/";
    const calls = stubFetch({ ok: true });
    const { sendSms } = await import("@/lib/sms");
    await sendSms({ to: TO, text: "hello" });
    // Trailing slash trimmed, so the path is not doubled.
    expect(calls[0]!.url).toBe(`http://127.0.0.1:2530/2010-04-01/Accounts/${SID}/Messages.json`);
  });
});
