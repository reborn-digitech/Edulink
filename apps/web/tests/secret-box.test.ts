import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createCipheriv, randomBytes } from "node:crypto";
import { open, seal, sealingAvailable } from "@/lib/secret-box";

/**
 * The box that seals a school's gateway secrets at rest. A round trip, a
 * fresh nonce each time, a tamper that fails to open, and a server without
 * the key that says so rather than storing plain text.
 */
const original = process.env.FEES_SECRET_KEY;

beforeAll(() => {
  process.env.FEES_SECRET_KEY = randomBytes(32).toString("base64");
});
afterAll(() => {
  if (original === undefined) delete process.env.FEES_SECRET_KEY;
  else process.env.FEES_SECRET_KEY = original;
});

describe("secret-box", () => {
  it("seals and opens, with a different ciphertext every time", () => {
    const a = seal("rzp-secret-1234");
    const b = seal("rzp-secret-1234");
    expect(a).not.toBe(b);
    expect(a.startsWith("v2.")).toBe(true);
    expect(a).not.toContain("rzp-secret");
    expect(open(a)).toBe("rzp-secret-1234");
    expect(open(b)).toBe("rzp-secret-1234");
    expect(sealingAvailable()).toBe(true);
  });

  it("a value bound to one row does not open for another, and a v1 value sealed before binding still opens", () => {
    const bound = seal("rzp-secret", "school-a:secret");
    expect(open(bound, "school-a:secret")).toBe("rzp-secret");
    expect(() => open(bound, "school-b:secret")).toThrow();
    expect(() => open(bound)).toThrow();
    // A v1 value: the same cipher with no associated data, as every value sealed before 2026-10-01 was.
    const key = Buffer.from(process.env.FEES_SECRET_KEY!, "base64");
    const nonce = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", key, nonce);
    const body = Buffer.concat([cipher.update("old-secret", "utf8"), cipher.final()]);
    const v1 = ["v1", nonce.toString("base64url"), body.toString("base64url"), cipher.getAuthTag().toString("base64url")].join(".");
    expect(open(v1, "school-a:secret")).toBe("old-secret");
  });

  it("refuses a tampered value and a value it did not seal", () => {
    const sealed = seal("hello");
    const [v, n, body, tag] = sealed.split(".");
    const flipped = body!.slice(0, -2) + (body!.endsWith("AA") ? "BB" : "AA");
    expect(() => open([v, n, flipped, tag].join("."))).toThrow();
    expect(() => open("plain text")).toThrow(/not a sealed value/);
  });

  it("without the key, sealing is unavailable and says what to set", () => {
    const key = process.env.FEES_SECRET_KEY;
    delete process.env.FEES_SECRET_KEY;
    expect(sealingAvailable()).toBe(false);
    expect(() => seal("x")).toThrow(/FEES_SECRET_KEY/);
    process.env.FEES_SECRET_KEY = "dG9vc2hvcnQ=";
    expect(() => seal("x")).toThrow(/32/);
    process.env.FEES_SECRET_KEY = key;
  });
});
