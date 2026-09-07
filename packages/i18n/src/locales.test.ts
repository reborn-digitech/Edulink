import { describe, expect, it } from "vitest";
import { DEFAULT_LOCALE, LOCALES, LOCALE_COOKIE, localeMeta, normaliseLocale } from "./index";

describe("@edulink/i18n locales", () => {
  it("speaks exactly the three languages the product ships, each named in itself", () => {
    expect(LOCALES.map((l) => l.code)).toEqual(["en", "hi", "mr"]);
    expect(localeMeta("hi").native).toBe("हिन्दी");
    expect(localeMeta("mr").native).toBe("मराठी");
    expect(DEFAULT_LOCALE).toBe("en");
    expect(LOCALE_COOKIE).toBe("edulink_locale");
  });

  it("reduces whatever a cookie or a stored preference says to a language it has", () => {
    expect(normaliseLocale("hi-IN")).toBe("hi");
    expect(normaliseLocale("MR_in")).toBe("mr");
    expect(normaliseLocale("fr")).toBe("en");
    expect(normaliseLocale(null)).toBe("en");
    expect(normaliseLocale("  en-GB ")).toBe("en");
  });
});
