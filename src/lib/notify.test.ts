import { describe, expect, it } from "vitest";
import { inQuietHours } from "./notify";

/**
 * Quiet hours.
 *
 * A window like 21:00 → 07:00 crosses midnight, which is where naive
 * `start <= now && now < end` comparisons silently invert and either silence
 * the whole day or nothing at all. The consequence is not cosmetic: a family
 * that asked not to be buzzed at 3am gets buzzed, or a parent stops being told
 * their child was marked absent.
 *
 * `now` is passed explicitly rather than faked globally so these are
 * deterministic; the helper reads LOCAL hours because the window is what the
 * user set on their own clock.
 */

/** Builds a local-time Date for a given hour/minute today. */
function at(hour: number, minute = 0): Date {
  const d = new Date(2026, 6, 28, hour, minute, 0, 0);
  return d;
}

describe("inQuietHours — no window set", () => {
  it("is never quiet when quiet hours are off", () => {
    expect(inQuietHours(null, at(3))).toBe(false);
    expect(inQuietHours(undefined, at(3))).toBe(false);
  });
});

describe("inQuietHours — same-day window (09:00 → 17:00)", () => {
  const window = { start: "09:00", end: "17:00" };

  it("is quiet inside the window", () => {
    expect(inQuietHours(window, at(9, 0))).toBe(true);
    expect(inQuietHours(window, at(12, 30))).toBe(true);
    expect(inQuietHours(window, at(16, 59))).toBe(true);
  });

  it("is not quiet outside the window", () => {
    expect(inQuietHours(window, at(8, 59))).toBe(false);
    expect(inQuietHours(window, at(17, 0))).toBe(false); // end is exclusive
    expect(inQuietHours(window, at(23, 0))).toBe(false);
    expect(inQuietHours(window, at(0, 0))).toBe(false);
  });
});

describe("inQuietHours — window crossing midnight (21:00 → 07:00)", () => {
  const window = { start: "21:00", end: "07:00" };

  it("is quiet in the evening half", () => {
    expect(inQuietHours(window, at(21, 0))).toBe(true);
    expect(inQuietHours(window, at(23, 59))).toBe(true);
  });

  it("is quiet in the morning half", () => {
    expect(inQuietHours(window, at(0, 0))).toBe(true);
    expect(inQuietHours(window, at(3, 0))).toBe(true);
    expect(inQuietHours(window, at(6, 59))).toBe(true);
  });

  it("is NOT quiet during the day", () => {
    expect(inQuietHours(window, at(7, 0))).toBe(false); // end is exclusive
    expect(inQuietHours(window, at(12, 0))).toBe(false);
    expect(inQuietHours(window, at(20, 59))).toBe(false);
  });

  it("treats midnight itself as quiet", () => {
    // The single most likely moment for an off-by-one to show up.
    expect(inQuietHours(window, at(0, 0))).toBe(true);
  });
});

describe("inQuietHours — degenerate and malformed input", () => {
  it("ignores a window whose start equals its end", () => {
    // Otherwise "22:00 to 22:00" would silence every notification forever.
    // (savePrefs also rejects this at the form, but the helper must be safe.)
    expect(inQuietHours({ start: "22:00", end: "22:00" }, at(22, 0))).toBe(false);
    expect(inQuietHours({ start: "22:00", end: "22:00" }, at(3, 0))).toBe(false);
  });

  it("ignores unparseable times rather than silencing everything", () => {
    for (const bad of [
      { start: "not-a-time", end: "07:00" },
      { start: "21:00", end: "" },
      { start: "9", end: "17" },
      { start: "25:00", end: "07:00" },
      { start: "21:99", end: "07:00" },
    ]) {
      expect(inQuietHours(bad, at(3)), JSON.stringify(bad)).toBe(false);
    }
  });

  it("accepts a single-digit hour", () => {
    expect(inQuietHours({ start: "9:00", end: "17:00" }, at(10))).toBe(true);
  });

  it("handles a one-minute window", () => {
    expect(inQuietHours({ start: "13:00", end: "13:01" }, at(13, 0))).toBe(true);
    expect(inQuietHours({ start: "13:00", end: "13:01" }, at(13, 1))).toBe(false);
  });

  it("handles a window ending at midnight", () => {
    // 23:00 → 00:00 wraps, so 23:30 is quiet and 00:30 is not.
    const window = { start: "23:00", end: "00:00" };
    expect(inQuietHours(window, at(23, 30))).toBe(true);
    expect(inQuietHours(window, at(0, 30))).toBe(false);
  });
});
