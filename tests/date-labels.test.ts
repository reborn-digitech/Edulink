import { describe, expect, it } from "vitest";
import { formatDateKey, formatInZone } from "@/lib/dates";

/**
 * A date's WORDS follow the reader; its DIGITS and its dd/mm/yyyy shape do
 * not. "आज · MONDAY, 07/09/2026" on a Hindi screen was the untranslated
 * label this pins against, and "१४ सप्टेंबर" beside an ASCII "3" is the
 * mixed-digit line the formatter's rule was written to prevent.
 */
describe("date labels in the reader's language", () => {
  it("names the weekday in Hindi and Marathi and keeps the numerals Latin", () => {
    const en = formatDateKey("2026-09-07", { weekday: "long", day: "numeric", month: "long" });
    const hi = formatDateKey("2026-09-07", { weekday: "long", day: "numeric", month: "long" }, "hi");
    const mr = formatDateKey("2026-09-07", { weekday: "long", day: "numeric", month: "long" }, "mr");
    expect(en).toBe("Monday, 07/09/2026");
    expect(hi).toBe("सोमवार, 07/09/2026");
    expect(mr).toBe("सोमवार, 07/09/2026");
    for (const s of [hi, mr]) expect(s).not.toMatch(/[०-९]/);
  });

  it("names a month heading in the reader's language with Latin digits", () => {
    expect(formatDateKey("2026-09-01", { month: "long", year: "numeric" }, "hi")).toBe("सितंबर 2026");
    expect(formatDateKey("2026-09-01", { month: "long", year: "numeric" }, "mr")).toBe("सप्टेंबर 2026");
    expect(formatDateKey("2026-09-01", { month: "long", year: "numeric" })).toBe("September 2026");
  });

  it("leaves a plain date untouched in every language", () => {
    expect(formatDateKey("2026-09-07", { day: "numeric", month: "long" }, "hi")).toBe("07/09/2026");
    expect(formatInZone(new Date("2026-09-07T04:30:00Z"), "Asia/Kolkata", { day: "numeric", month: "numeric", year: "numeric" }, "mr")).toBe("07/09/2026");
  });
});
