import { describe, expect, it } from "vitest";
import {
  base32Decode,
  base32Encode,
  generateRecoveryCodes,
  generateSecret,
  hotp,
  normaliseRecoveryCode,
  provisioningUri,
  stepFor,
  totp,
  verifyTotp,
} from "./totp";

/**
 * TOTP, checked against the specifications rather than against itself.
 *
 * The vectors below are copied from RFC 4226 Appendix D and RFC 6238 Appendix B.
 * That is the whole reason this file is worth more than most test files here: it
 * is not asserting that the code does what I thought, it is asserting that the
 * code agrees with the document every authenticator app was written from. An
 * implementation that passes these will accept a code from Google
 * Authenticator; one that merely passes tests I invented might not.
 */

/** RFC 4226 and RFC 6238 both use this ASCII secret for SHA-1. */
const RFC_SECRET = Buffer.from("12345678901234567890", "ascii");

describe("HOTP — RFC 4226 Appendix D", () => {
  // The published table, counters 0-9, six digits.
  const expected = [
    "755224", "287082", "359152", "969429", "338314",
    "254676", "287922", "162583", "399871", "520489",
  ];

  it.each(expected.map((code, counter) => [counter, code]))(
    "counter %i produces %s",
    (counter, code) => {
      expect(hotp(RFC_SECRET, counter as number)).toBe(code);
    },
  );
});

describe("TOTP — RFC 6238 Appendix B", () => {
  // The published table is 8-digit. Times are seconds; this library takes ms.
  const vectors: [number, string][] = [
    [59, "94287082"],
    [1111111109, "07081804"],
    [1111111111, "14050471"],
    [1234567890, "89005924"],
    [2000000000, "69279037"],
    [20000000000, "65353130"],
  ];

  it.each(vectors)("t=%i produces %s", (seconds, code) => {
    expect(totp(RFC_SECRET, (seconds as number) * 1000, 8)).toBe(code);
  });

  it("⚠ handles a counter beyond 2^32 without wrapping", () => {
    // t=20000000000 is step 666666666, which is fine — but the counter is
    // written as a 64-bit big-endian value, and a naive 32-bit shift silently
    // produces a different code. The last vector above is the one that catches
    // it; this states why it is in the list.
    expect(totp(RFC_SECRET, 20000000000 * 1000, 8)).toBe("65353130");
  });

  it("steps every 30 seconds and not before", () => {
    expect(stepFor(0)).toBe(0);
    expect(stepFor(29_999)).toBe(0);
    expect(stepFor(30_000)).toBe(1);
    expect(stepFor(59_999)).toBe(1);
    expect(stepFor(60_000)).toBe(2);
  });
});

describe("base32", () => {
  it("round-trips arbitrary bytes", () => {
    const secret = Buffer.from([0, 1, 2, 250, 251, 252, 253, 254, 255]);
    expect(base32Decode(base32Encode(secret))).toEqual(secret);
  });

  it("matches the RFC 4648 test vectors", () => {
    expect(base32Encode(Buffer.from("f"))).toBe("MY");
    expect(base32Encode(Buffer.from("fo"))).toBe("MZXQ");
    expect(base32Encode(Buffer.from("foo"))).toBe("MZXW6");
    expect(base32Encode(Buffer.from("foobar"))).toBe("MZXW6YTBOI");
  });

  it("emits no padding, which some authenticator apps reject", () => {
    expect(base32Encode(Buffer.from("foo"))).not.toContain("=");
  });

  it("accepts a secret retyped with spaces, padding or lower case", () => {
    const encoded = base32Encode(RFC_SECRET);
    const messy = encoded.toLowerCase().replace(/(.{4})/g, "$1 ") + "==";
    expect(base32Decode(messy)).toEqual(RFC_SECRET);
  });

  it("⚠ throws on a character outside the alphabet rather than skipping it", () => {
    // Skipping would turn a typo into a different, valid-looking secret that
    // silently never matches — the worst possible failure for hand entry.
    expect(() => base32Decode("MZXW6!")).toThrow();
    expect(() => base32Decode("MZXW60")).toThrow(); // 0 and 1 are not base32
  });
});

describe("verifying a code", () => {
  const now = 1_700_000_000_000;

  it("accepts the current code", () => {
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now), now).ok).toBe(true);
  });

  it("accepts one step of clock drift either way", () => {
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now - 30_000), now).ok).toBe(true);
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now + 30_000), now).ok).toBe(true);
  });

  it("⚠ refuses two steps away, so the window does not quietly widen", () => {
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now - 90_000), now).ok).toBe(false);
    expect(verifyTotp(RFC_SECRET, totp(RFC_SECRET, now + 90_000), now).ok).toBe(false);
  });

  it("⚠ reports WHICH step matched, so a code cannot be replayed", () => {
    const result = verifyTotp(RFC_SECRET, totp(RFC_SECRET, now), now);
    expect(result.step).toBe(stepFor(now));
  });

  it("refuses a wrong code, and anything that is not six digits", () => {
    expect(verifyTotp(RFC_SECRET, "000000", now).step).toBeNull();
    expect(verifyTotp(RFC_SECRET, "12345", now).ok).toBe(false);
    expect(verifyTotp(RFC_SECRET, "1234567", now).ok).toBe(false);
    expect(verifyTotp(RFC_SECRET, "abcdef", now).ok).toBe(false);
    expect(verifyTotp(RFC_SECRET, "", now).ok).toBe(false);
  });

  it("accepts a code typed with a space in the middle", () => {
    const code = totp(RFC_SECRET, now);
    expect(verifyTotp(RFC_SECRET, `${code.slice(0, 3)} ${code.slice(3)}`, now).ok).toBe(true);
  });

  it("does not fall over near the epoch, where a drift step would go negative", () => {
    expect(() => verifyTotp(RFC_SECRET, "000000", 0)).not.toThrow();
  });
});

describe("enrolment", () => {
  it("generates a 160-bit secret, the size RFC 4226 recommends", () => {
    expect(base32Decode(generateSecret())).toHaveLength(20);
  });

  it("generates a different secret every time", () => {
    const secrets = new Set(Array.from({ length: 50 }, () => generateSecret()));
    expect(secrets.size).toBe(50);
  });

  it("builds a provisioning URI an app can scan", () => {
    const uri = provisioningUri({
      secret: "JBSWY3DPEHPK3PXP",
      account: "priya@riverside.school",
      issuer: "EduLink",
    });
    expect(uri.startsWith("otpauth://totp/EduLink:priya%40riverside.school?")).toBe(true);
    expect(uri).toContain("secret=JBSWY3DPEHPK3PXP");
    expect(uri).toContain("algorithm=SHA1");
    expect(uri).toContain("digits=6");
    expect(uri).toContain("period=30");
  });

  it("⚠ escapes a colon in the account, which would otherwise split the label", () => {
    const uri = provisioningUri({ secret: "AAAA", account: "a:b", issuer: "Edu:Link" });
    expect(uri).toContain("Edu%3ALink:a%3Ab");
  });
});

describe("recovery codes", () => {
  it("makes ten by default, all different", () => {
    const codes = generateRecoveryCodes();
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it("⚠ excludes characters that are ambiguous when copied by hand", () => {
    // 0/O and 1/I/l are the difference between locked out and not.
    const joined = generateRecoveryCodes(200).join("");
    expect(joined).not.toMatch(/[01OIL]/);
  });

  it("normalises case and dashes, so how it was typed never matters", () => {
    const [code] = generateRecoveryCodes(1);
    expect(normaliseRecoveryCode(code!.toLowerCase())).toBe(normaliseRecoveryCode(code!));
    expect(normaliseRecoveryCode(code!.replace("-", " "))).toBe(normaliseRecoveryCode(code!));
    expect(normaliseRecoveryCode(code!)).not.toContain("-");
  });
});
