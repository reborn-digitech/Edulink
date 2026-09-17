import { describe, expect, it } from "vitest";
import { formatBps, formatPaise, parsePercentBps, parseRupees } from "./money";

describe("money", () => {
  it("formats paise as rupees with Indian grouping", () => {
    expect(formatPaise(125050)).toBe("₹1,250.50");
    expect(formatPaise(125000)).toBe("₹1,250");
    expect(formatPaise(125000, "en", { always: true })).toBe("₹1,250.00");
    expect(formatPaise(1250000000)).toBe("₹1,25,00,000");
    expect(formatPaise(0)).toBe("₹0");
  });
  it("renders Latin digits in Hindi and Marathi too", () => {
    expect(formatPaise(125050, "hi")).toMatch(/1,250\.50/);
    expect(formatPaise(125050, "mr")).toMatch(/1,250\.50/);
  });
  it("parses what a person types into paise, and refuses the rest", () => {
    expect(parseRupees("1,250.50")).toBe(125050);
    expect(parseRupees("₹ 1250")).toBe(125000);
    expect(parseRupees("12.5")).toBe(1250);
    expect(parseRupees("0")).toBe(0);
    expect(parseRupees("-5")).toBeNull();
    expect(parseRupees("1.234")).toBeNull();
    expect(parseRupees("abc")).toBeNull();
    expect(parseRupees("")).toBeNull();
  });
  it("parses a percentage into basis points within [0, 100]", () => {
    expect(parsePercentBps("12.5")).toBe(1250);
    expect(parsePercentBps("100 %")).toBe(10000);
    expect(parsePercentBps("101")).toBeNull();
    expect(formatBps(1250)).toBe("12.5 %");
    expect(formatBps(5000)).toBe("50 %");
  });
});
