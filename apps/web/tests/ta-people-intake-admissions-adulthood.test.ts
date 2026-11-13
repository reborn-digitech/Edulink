/**
 * TA-421 (testing analysis of 13 November 2026, Low): on 29 February the
 * cutoff of adulthood was Date.UTC(y - 18, 1, 29), and y - 18 is never a leap
 * year when y is, so the date rolled over to 1 March and everyone born on
 * 1 March eighteen years earlier was an adult one day early.
 *
 * Pure date arithmetic: no rows are made.
 */
import { describe, expect, it } from "vitest";
import { adultCutoff, isMinorOn } from "@/lib/adulthood";

const LEAP_DAY = new Date("2028-02-29T06:00:00Z"); // 11:30 in Kolkata, 29 February 2028

describe("TA-421: the eighteenth birthday on 29 February", () => {
  it("TA-421: someone born on 1 March 2010 is still a minor on 29 February 2028", () => {
    expect(isMinorOn(new Date("2010-03-01T00:00:00Z"), LEAP_DAY)).toBe(true);
  });

  it("TA-421: someone born on 28 February 2010 turned eighteen the day before and is an adult", () => {
    expect(isMinorOn(new Date("2010-02-28T00:00:00Z"), LEAP_DAY)).toBe(false);
  });

  it("TA-421: the cutoff on 29 February is 28 February eighteen years earlier, and 1 March the next day", () => {
    expect(adultCutoff(LEAP_DAY).toISOString().slice(0, 10)).toBe("2010-02-28");
    expect(adultCutoff(new Date("2028-03-01T06:00:00Z")).toISOString().slice(0, 10)).toBe("2010-03-01");
    expect(isMinorOn(new Date("2010-03-01T00:00:00Z"), new Date("2028-03-01T06:00:00Z"))).toBe(false);
  });

  it("TA-421: a 29 February birthday still turns on 1 March in a common year (unchanged)", () => {
    const leap = new Date("2008-02-29T00:00:00Z");
    expect(isMinorOn(leap, new Date("2026-02-28T12:00:00Z"))).toBe(true);
    expect(isMinorOn(leap, new Date("2026-03-01T00:00:00Z"))).toBe(false);
  });
});
