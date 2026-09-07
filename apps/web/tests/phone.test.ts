import { describe, expect, it } from "vitest";
import {
  normalisePhone,
  isPhone,
  formatPhone,
  phoneHint,
  identifierKind,
  DEFAULT_COUNTRY_CODE,
} from "@/lib/phone";

/**
 * Phone numbers, and the property everything else depends on.
 *
 * `User.phone` is UNIQUE, so the only thing that really matters here is that
 * every way one person writes their own number lands on the same string. If two
 * of them do not, that person cannot register the second time — with a unique
 * constraint error nobody can act on — and a password reset sent to "their
 * number" may reach an account that is not theirs.
 *
 * So the tests are mostly one assertion repeated: all of these are the same
 * number. The rest is the refusals, which matter for the same reason
 * `displayDateToIso` refuses rather than rounds — a mangled number is an account
 * nobody can sign in to.
 */

describe("every way somebody writes their own number", () => {
  it("⚠ lands on exactly one string", () => {
    const written = [
      "+919876543210",
      "+91 98765 43210",
      "+91-98765-43210",
      "+91 (98765) 43210",
      "0091 98765 43210",
      "00919876543210",
      "09876543210",
      "0 98765 43210",
      "9876543210",
      "98765 43210",
      "98765-43210",
      "  9876543210  ",
    ];
    const normalised = new Set(written.map((raw) => normalisePhone(raw)));
    expect(
      [...normalised],
      "every one of these is one person typing one number",
    ).toEqual(["+919876543210"]);
  });

  it("defaults to +91 unless told otherwise, and the default is a setting", () => {
    expect(DEFAULT_COUNTRY_CODE).toBe("+91");
    expect(normalisePhone("9876543210")).toBe("+919876543210");
    // The second argument is what a deployment outside India would pass.
    expect(normalisePhone("2015550123", "+1")).toBe("+12015550123");
    expect(normalisePhone("07700900123", "+44")).toBe("+447700900123");
  });

  it("⚠ keeps an explicit country code rather than applying the default to it", () => {
    // The bug this guards: treating a +44 number as ten national digits and
    // prefixing +91 would file a London parent under India, uniquely and
    // wrongly.
    expect(normalisePhone("+447700900123")).toBe("+447700900123");
    expect(normalisePhone("+1 201 555 0123")).toBe("+12015550123");
  });

  it("⚠ drops the trunk zero rather than treating it as part of the number", () => {
    // `09876543210` must not become `+9109876543210`, which is a different
    // number and one digit too long for the same person.
    expect(normalisePhone("09876543210")).toBe("+919876543210");
    expect(normalisePhone("00919876543210")).toBe("+919876543210");
  });
});

describe("what is refused", () => {
  it("refuses nothing at all", () => {
    for (const bad of ["", "   ", null, undefined]) {
      expect(normalisePhone(bad as string), String(bad)).toBeNull();
    }
  });

  it("⚠ refuses anything with a letter in it, rather than keeping the digits", () => {
    // "call me on 98765" must not become a phone number. Reducing a string to
    // whichever digits it contains is how an email or a sentence turns into
    // somebody's login.
    for (const bad of [
      "amara.k4f9",
      "amara@riverside.school",
      "call 9876543210",
      "9876543210x",
      "+91 98765 43210 (mum)",
    ]) {
      expect(normalisePhone(bad), bad).toBeNull();
    }
  });

  it("refuses a fragment, and refuses something too long to be a number", () => {
    expect(normalisePhone("12345")).toBeNull();
    expect(normalisePhone("+1234")).toBeNull();
    // E.164 caps at 15 digits including the country code.
    expect(normalisePhone("+1234567890123456")).toBeNull();
    expect(normalisePhone("0")).toBeNull();
    expect(normalisePhone("00")).toBeNull();
    expect(normalisePhone("+")).toBeNull();
  });

  it("⚠ refuses a `+` that is not at the front, or more than one", () => {
    /**
     * WRITTEN THE WRONG WAY ROUND FIRST, and the implementation obliged.
     * `9+919876543210` is a thumb, not a country code — but stripping
     * non-digits and asking about the `+` afterwards turned it into
     * `+919919876543210`, a fifteen-digit number in a country nobody dials,
     * and the first version of this test asserted that as correct.
     */
    expect(normalisePhone("9+919876543210")).toBeNull();
    expect(normalisePhone("98765+43210")).toBeNull();
    expect(normalisePhone("++919876543210")).toBeNull();
    expect(isPhone("98765+43210")).toBe(false);
  });

  it("isPhone agrees with normalisePhone", () => {
    expect(isPhone("9876543210")).toBe(true);
    expect(isPhone("amara@x.test")).toBe(false);
    expect(isPhone("")).toBe(false);
  });
});

describe("showing one back to a person", () => {
  it("groups a ten-digit national number", () => {
    expect(formatPhone("+919876543210")).toBe("+91 98765 43210");
  });

  it("⚠ leaves another country alone rather than guessing where its code ends", () => {
    // A greedy `\d{1,3}` took three digits every time and rendered an Indian
    // number as `+919 876543210`. Where a country code ends is not knowable
    // from an E.164 string, so anything but the default is left whole.
    expect(formatPhone("+447700900123")).toBe("+447700900123");
    expect(formatPhone("not-a-number")).toBe("not-a-number");
    expect(formatPhone(null)).toBe("");
    // …and it groups correctly for the country it DOES know, because there the
    // boundary is given rather than guessed.
    expect(formatPhone("+447700900123", "+44")).toBe("+44 77009 00123");
  });

  it("⚠ the hint is four digits and never the whole number", () => {
    // It goes on a page that says where a reset code was sent, to somebody who
    // may not be the account holder. It has to identify the phone to its owner
    // and nothing to anybody else.
    expect(phoneHint("+919876543210")).toBe("3210");
    expect(phoneHint("+919876543210")).not.toContain("9876");
    expect(phoneHint("+12")).toBe("");
    expect(phoneHint(null)).toBe("");
  });
});

describe("what somebody just typed into the one login box", () => {
  it("an @ is an email", () => {
    expect(identifierKind("amara@riverside.school")).toBe("EMAIL");
    expect(identifierKind("  amara@riverside.school ")).toBe("EMAIL");
  });

  it("digits, with or without a +, are a phone", () => {
    for (const raw of ["9876543210", "+91 98765 43210", "098765 43210", "(98765) 43210"]) {
      expect(identifierKind(raw), raw).toBe("PHONE");
    }
  });

  it("⚠ anything else is a handle — the login a pupil who joined with a code got", () => {
    expect(identifierKind("amara.k4f9")).toBe("HANDLE");
    expect(identifierKind("amara")).toBe("HANDLE");
  });

  it("⚠ a handle is never mistaken for a phone, because handles carry letters", () => {
    // The stated limit: a digits-only handle WOULD be read as a phone. Handles
    // are minted `<name>.<suffix>`, so this holds — and it holds because of the
    // minting rule, which is why it is asserted rather than assumed.
    expect(identifierKind("amara.k4f9")).toBe("HANDLE");
    expect(identifierKind("9876543210")).toBe("PHONE");
  });

  it("an empty box is a handle, and is refused later by the schema rather than here", () => {
    expect(identifierKind("")).toBe("HANDLE");
  });
});
