import { describe, expect, it } from "vitest";
import {
  parseTimeOfDay,
  formatTimeOfDay,
  formatTimeRange,
  periodTimeError,
  overlappingPeriods,
  weekdayName,
  weekdayShortName,
  isWeekdayNumber,
  WEEK_DAYS,
  SUGGESTED_DAY,
  MIN_PERIOD_MINUTES,
} from "@/lib/school-day";
import { weekStartKey } from "@/lib/timetable";

/**
 * The school day, as arithmetic.
 *
 * No database here on purpose: every failure below is a wrong lesson time on
 * somebody's timetable, and none of them needs a school to demonstrate. The
 * cases that matter are the ones where a plausible implementation gives an
 * answer rather than an error — a time that rolls over into the next day, a
 * week that starts on the wrong Monday — because those are the ones nobody
 * notices until a class is in the wrong room.
 */

describe("reading a time somebody typed", () => {
  it("takes 08:30 and 8:30 alike", () => {
    expect(parseTimeOfDay("08:30")).toBe(510);
    expect(parseTimeOfDay("8:30")).toBe(510);
    expect(parseTimeOfDay("  08:30  ")).toBe(510);
  });

  it("handles the ends of the day", () => {
    expect(parseTimeOfDay("00:00")).toBe(0);
    expect(parseTimeOfDay("23:59")).toBe(1439);
  });

  it("⚠ refuses an hour that is not an hour, rather than rolling it over", () => {
    // `new Date("...25:00")` would happily become 01:00 the following day, and
    // the person who typed it would be told nothing at all.
    expect(parseTimeOfDay("25:00")).toBeNull();
    expect(parseTimeOfDay("24:00")).toBeNull();
    expect(parseTimeOfDay("12:60")).toBeNull();
  });

  it("refuses what is not a time at all", () => {
    for (const bad of ["", "  ", "half eight", "0830", "8", "8:3", "8:300", "8:30pm", "-1:00"]) {
      expect(parseTimeOfDay(bad), bad).toBeNull();
    }
    expect(parseTimeOfDay(null)).toBeNull();
    expect(parseTimeOfDay(undefined)).toBeNull();
  });

  it("round-trips through the formatter", () => {
    for (const minute of [0, 1, 59, 510, 720, 1439]) {
      expect(parseTimeOfDay(formatTimeOfDay(minute))).toBe(minute);
    }
  });

  it("pads, so times line up in a column", () => {
    expect(formatTimeOfDay(510)).toBe("08:30");
    expect(formatTimeOfDay(65)).toBe("01:05");
    expect(formatTimeRange(510, 555)).toBe("08:30 – 09:15");
  });

  it("gives an empty string rather than nonsense for a minute out of range", () => {
    expect(formatTimeOfDay(-1)).toBe("");
    expect(formatTimeOfDay(1441)).toBe("");
    expect(formatTimeOfDay(1.5)).toBe("");
    expect(formatTimeRange(510, 99999)).toBe("");
  });
});

describe("whether a period is usable", () => {
  it("accepts an ordinary period", () => {
    expect(periodTimeError({ startMinute: 510, endMinute: 555 })).toBeNull();
  });

  it("⚠ refuses one that ends before it starts, and one that ends when it starts", () => {
    expect(periodTimeError({ startMinute: 555, endMinute: 510 })).toMatch(/end after it starts/);
    expect(periodTimeError({ startMinute: 510, endMinute: 510 })).toMatch(/end after it starts/);
  });

  it("refuses a period too short to be one", () => {
    expect(
      periodTimeError({ startMinute: 510, endMinute: 510 + MIN_PERIOD_MINUTES - 1 }),
    ).toMatch(/at least/);
    expect(periodTimeError({ startMinute: 510, endMinute: 510 + MIN_PERIOD_MINUTES })).toBeNull();
  });

  it("refuses times outside a day", () => {
    expect(periodTimeError({ startMinute: -1, endMinute: 100 })).toMatch(/not a time/);
    expect(periodTimeError({ startMinute: 1440, endMinute: 1450 })).toMatch(/not a time/);
    expect(periodTimeError({ startMinute: 100, endMinute: 1441 })).toMatch(/not a time/);
  });

  it("refuses anything that is not a whole number of minutes", () => {
    expect(periodTimeError({ startMinute: 510.5, endMinute: 555 })).toMatch(/HH:MM/);
    expect(periodTimeError({ startMinute: Number.NaN, endMinute: 555 })).toMatch(/HH:MM/);
  });

  it("allows a period ending at midnight, which is the only 1440 that is real", () => {
    expect(periodTimeError({ startMinute: 1400, endMinute: 1440 })).toBeNull();
  });
});

describe("periods that overlap", () => {
  const period = (name: string, start: number, end: number) => ({
    name,
    startMinute: start,
    endMinute: end,
  });

  it("finds none in a day that is laid out properly", () => {
    expect(
      overlappingPeriods([period("P1", 480, 525), period("P2", 525, 570), period("P3", 570, 615)]),
    ).toEqual([]);
  });

  it("⚠ does not call touching periods an overlap", () => {
    // `endMinute` is exclusive. Treating 09:15/09:15 as a clash would warn on
    // every correctly-built day in the app, which is the same as not warning.
    expect(overlappingPeriods([period("P1", 480, 555), period("P2", 555, 600)])).toEqual([]);
  });

  it("names both sides of a real overlap", () => {
    expect(overlappingPeriods([period("P1", 480, 570), period("P2", 525, 600)])).toEqual([
      ["P1", "P2"],
    ]);
  });

  it("⚠ finds it however the list was ordered", () => {
    // The rows arrive in `position` order, which an admin can put out of step
    // with the clock. Sorting inside is what makes the check independent of it.
    expect(overlappingPeriods([period("Late", 525, 600), period("Early", 480, 570)])).toEqual([
      ["Early", "Late"],
    ]);
  });

  it("says nothing about an empty or single-period day", () => {
    expect(overlappingPeriods([])).toEqual([]);
    expect(overlappingPeriods([period("Only", 480, 525)])).toEqual([]);
  });

  it("the day offered to a new school does not clash with itself", () => {
    expect(overlappingPeriods(SUGGESTED_DAY)).toEqual([]);
  });

  it("every suggested period is a period this app would accept", () => {
    for (const entry of SUGGESTED_DAY) {
      expect(periodTimeError(entry), entry.name).toBeNull();
    }
  });
});

describe("the week", () => {
  it("names days by the convention weekdayOfKey uses", () => {
    // 2026-08-03 is a Monday. If this ever disagrees, every slot in the
    // database is on the wrong day.
    expect(weekdayName(0)).toBe("Sunday");
    expect(weekdayName(1)).toBe("Monday");
    expect(weekdayName(6)).toBe("Saturday");
    expect(weekdayShortName(3)).toBe("Wed");
    expect(weekdayName(7)).toBe("");
  });

  it("runs Monday to Saturday, with no Sunday", () => {
    expect([...WEEK_DAYS]).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("accepts only whole days of the week", () => {
    expect(isWeekdayNumber(0)).toBe(true);
    expect(isWeekdayNumber(6)).toBe(true);
    expect(isWeekdayNumber(7)).toBe(false);
    expect(isWeekdayNumber(-1)).toBe(false);
    expect(isWeekdayNumber(1.5)).toBe(false);
    expect(isWeekdayNumber("1")).toBe(false);
  });
});

describe("which week a date is in", () => {
  it("a Monday is its own week", () => {
    expect(weekStartKey("2026-08-03")).toBe("2026-08-03");
  });

  it("mid-week comes back to the Monday", () => {
    expect(weekStartKey("2026-08-05")).toBe("2026-08-03"); // Wednesday
    expect(weekStartKey("2026-08-08")).toBe("2026-08-03"); // Saturday
  });

  it("⚠ Sunday belongs to the week that has just finished", () => {
    /**
     * THE OFF-BY-SIX. `1 - weekday` is right for Monday through Saturday and
     * gives +1 for Sunday, which lands on TOMORROW — so a pupil opening this on
     * Sunday evening would be shown the week they have just had, dated as the
     * one coming. Sunday is the day off; it closes the week before it.
     */
    expect(weekStartKey("2026-08-09")).toBe("2026-08-03");
  });

  it("crosses a month and a year boundary", () => {
    expect(weekStartKey("2026-09-01")).toBe("2026-08-31"); // Tuesday
    expect(weekStartKey("2027-01-01")).toBe("2026-12-28"); // Friday
  });

  it("refuses something that is not a date", () => {
    expect(() => weekStartKey("not-a-date")).toThrow();
    expect(() => weekStartKey("2026-02-30")).toThrow();
  });
});
