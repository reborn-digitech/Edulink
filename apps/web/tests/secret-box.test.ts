import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
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
    expect(a.startsWith("v1.")).toBe(true);
    expect(a).not.toContain("rzp-secret");
    expect(open(a)).toBe("rzp-secret-1234");
    expect(open(b)).toBe("rzp-secret-1234");
    expect(sealingAvailable()).toBe(true);
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
