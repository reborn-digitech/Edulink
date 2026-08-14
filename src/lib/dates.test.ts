import { describe, expect, it } from "vitest";
import {
  addDaysToKey,
  ageInYears,
  dateKeyInZone,
  dateKeyRange,
  displayDateToIso,
  isDateKey,
  isFuture,
  isPast,
  isTeachingDay,
  isWeekend,
  isWithin,
  isoToDisplayDate,
  parseDateOnly,
  zonedStartOfDay,
} from "./dates";

/**
 * Expected values here are hand-derived from the tz rules, never computed with
 * the same helpers under test — a test that recomputes the implementation
 * proves nothing. (§13 "tests that mirror the implementation")
 */

describe("isDateKey", () => {
  it("accepts a plain date", () => expect(isDateKey("2026-07-27")).toBe(true));
  it("accepts a real leap day", () => expect(isDateKey("2024-02-29")).toBe(true));
  it("rejects a fake leap day", () => expect(isDateKey("2026-02-29")).toBe(false));
  it("rejects overflow days", () => expect(isDateKey("2026-04-31")).toBe(false));
  it("rejects month 0 and 13", () => {
    expect(isDateKey("2026-00-10")).toBe(false);
    expect(isDateKey("2026-13-10")).toBe(false);
  });
  it("rejects malformed input", () => {
    expect(isDateKey("2026-7-27")).toBe(false);
    expect(isDateKey("")).toBe(false);
    expect(isDateKey("not-a-date")).toBe(false);
    expect(isDateKey("2026-07-27T00:00:00Z")).toBe(false);
  });
});

describe("dateKeyInZone", () => {
  it("puts a late-evening Auckland class on the local day, not the UTC day", () => {
    // 2026-07-27T07:30Z is 19:30 on the 27th in Auckland (UTC+12, NZST).
    const instant = new Date("2026-07-27T07:30:00Z");
    expect(dateKeyInZone(instant, "Pacific/Auckland")).toBe("2026-07-27");
    expect(dateKeyInZone(instant, "UTC")).toBe("2026-07-27");
  });

  it("rolls the local date back for a west-of-UTC zone", () => {
    // 2026-07-27T02:00Z is 19:00 on the 26th in Los Angeles (UTC-7, PDT).
    const instant = new Date("2026-07-27T02:00:00Z");
    expect(dateKeyInZone(instant, "America/Los_Angeles")).toBe("2026-07-26");
  });

  it("rolls the local date forward for a far-east zone", () => {
    // 2026-07-26T20:00Z is 08:00 on the 27th in Auckland.
    const instant = new Date("2026-07-26T20:00:00Z");
    expect(dateKeyInZone(instant, "Pacific/Auckland")).toBe("2026-07-27");
  });

  it("handles a half-hour offset zone", () => {
    // 2026-07-26T19:00Z is 00:30 on the 27th in Kolkata (UTC+5:30).
    expect(dateKeyInZone(new Date("2026-07-26T19:00:00Z"), "Asia/Kolkata")).toBe("2026-07-27");
    expect(dateKeyInZone(new Date("2026-07-26T18:00:00Z"), "Asia/Kolkata")).toBe("2026-07-26");
  });
});

describe("zonedStartOfDay", () => {
  it("resolves midnight for a fixed-offset zone", () => {
    // Kolkata is UTC+5:30 year round: local midnight = 18:30Z the day before.
    expect(zonedStartOfDay("2026-07-27", "Asia/Kolkata").toISOString()).toBe(
      "2026-07-26T18:30:00.000Z",
    );
  });

  it("is identity for UTC", () => {
    expect(zonedStartOfDay("2026-07-27", "UTC").toISOString()).toBe("2026-07-27T00:00:00.000Z");
  });

  it("uses the correct offset on the day BEFORE a spring-forward transition", () => {
    // US DST 2026 starts Sun 8 Mar. On 7 Mar, New York is still UTC-5 (EST).
    expect(zonedStartOfDay("2026-03-07", "America/New_York").toISOString()).toBe(
      "2026-03-07T05:00:00.000Z",
    );
  });

  it("uses the correct offset on the day AFTER a spring-forward transition", () => {
    // On 9 Mar 2026, New York is UTC-4 (EDT). This is the case a naive
    // single-pass offset lookup gets wrong by an hour.
    expect(zonedStartOfDay("2026-03-09", "America/New_York").toISOString()).toBe(
      "2026-03-09T04:00:00.000Z",
    );
  });

  it("resolves midnight ON the spring-forward day itself", () => {
    // 8 Mar 2026: the skip is at 02:00 local, so 00:00 local still exists at
    // UTC-5.
    expect(zonedStartOfDay("2026-03-08", "America/New_York").toISOString()).toBe(
      "2026-03-08T05:00:00.000Z",
    );
  });

  it("resolves midnight ON the fall-back day", () => {
    // 1 Nov 2026: DST ends at 02:00 local; midnight is still EDT (UTC-4).
    expect(zonedStartOfDay("2026-11-01", "America/New_York").toISOString()).toBe(
      "2026-11-01T04:00:00.000Z",
    );
  });

  it("handles a southern-hemisphere transition in the opposite direction", () => {
    // NZ DST ends Sun 5 Apr 2026: 4 Apr is NZDT (UTC+13), 6 Apr is NZST (+12).
    expect(zonedStartOfDay("2026-04-04", "Pacific/Auckland").toISOString()).toBe(
      "2026-04-03T11:00:00.000Z",
    );
    expect(zonedStartOfDay("2026-04-06", "Pacific/Auckland").toISOString()).toBe(
      "2026-04-05T12:00:00.000Z",
    );
  });

  it("resolves midnight ON the transition day in an east-of-UTC zone", () => {
    // The case that actually requires the second offset pass.
    // NZ DST ends 2026-04-05 at 03:00 NZDT. UTC midnight of the 5th is already
    // 13:00 local NZST (+12), but local midnight of the 5th is still NZDT
    // (+13). A single-pass lookup measures the offset at the wrong instant and
    // lands an hour late, on 2026-04-04T12:00Z.
    // Verified directly against Intl: 2026-04-04T11:00Z renders as 2026-04-05
    // 24:00 GMT+13, i.e. the first moment of the 5th.
    expect(zonedStartOfDay("2026-04-05", "Pacific/Auckland").toISOString()).toBe(
      "2026-04-04T11:00:00.000Z",
    );
  });

  it("resolves midnight ON the spring-forward day in an east-of-UTC zone", () => {
    // NZ DST starts 2026-09-27 at 02:00 NZST -> 03:00 NZDT. Local midnight of
    // the 27th is still NZST (+12).
    expect(zonedStartOfDay("2026-09-27", "Pacific/Auckland").toISOString()).toBe(
      "2026-09-26T12:00:00.000Z",
    );
  });

  it("resolves midnight ON a European transition day", () => {
    // EU DST ends Sun 2026-10-25 at 03:00 CEST. Berlin local midnight of the
    // 25th is still CEST (+2).
    expect(zonedStartOfDay("2026-10-25", "Europe/Berlin").toISOString()).toBe(
      "2026-10-24T22:00:00.000Z",
    );
  });

  it("round-trips: start-of-day always reports back as the same date key", () => {
    const zones = ["UTC", "America/New_York", "Pacific/Auckland", "Asia/Kolkata", "Europe/Berlin"];
    const keys = ["2026-01-01", "2026-03-08", "2026-04-05", "2026-11-01", "2024-02-29"];
    for (const tz of zones) {
      for (const key of keys) {
        expect(dateKeyInZone(zonedStartOfDay(key, tz), tz), `${tz} ${key}`).toBe(key);
      }
    }
  });

  it("rejects an invalid key rather than silently returning epoch", () => {
    expect(() => zonedStartOfDay("2026-02-30", "UTC")).toThrow();
  });
});

describe("addDaysToKey", () => {
  it("crosses a month boundary", () => expect(addDaysToKey("2026-07-31", 1)).toBe("2026-08-01"));
  it("crosses a year boundary", () => expect(addDaysToKey("2026-12-31", 1)).toBe("2027-01-01"));
  it("steps backwards", () => expect(addDaysToKey("2026-01-01", -1)).toBe("2025-12-31"));
  it("crosses a leap day", () => expect(addDaysToKey("2024-02-28", 1)).toBe("2024-02-29"));
  it("skips the non-existent leap day", () => expect(addDaysToKey("2026-02-28", 1)).toBe("2026-03-01"));
  it("does not drift across a DST week (calendar maths, not instant maths)", () => {
    expect(addDaysToKey("2026-03-06", 7)).toBe("2026-03-13");
  });
});

describe("dateKeyRange", () => {
  it("is inclusive at both ends", () => {
    expect(dateKeyRange("2026-07-27", "2026-07-30")).toEqual([
      "2026-07-27",
      "2026-07-28",
      "2026-07-29",
      "2026-07-30",
    ]);
  });
  it("returns a single day when from === to", () => {
    expect(dateKeyRange("2026-07-27", "2026-07-27")).toEqual(["2026-07-27"]);
  });
  it("returns empty when the range is inverted", () => {
    expect(dateKeyRange("2026-07-30", "2026-07-27")).toEqual([]);
  });
  it("caps runaway ranges", () => {
    expect(dateKeyRange("2000-01-01", "2030-01-01", 10)).toHaveLength(10);
  });
});

/**
 * Two predicates, deliberately disagreeing about Saturday.
 *
 * `isWeekend` is a fact about the calendar and is used for display.
 * `isTeachingDay` is a fact about THIS SCHOOL, which teaches Monday to
 * Saturday, and is what attendance and holiday maths ask. Collapsing them into
 * one function is the bug these tests exist to prevent: it either writes
 * "Weekend session" on an ordinary Saturday or drops a sixth of the school year
 * out of every denominator.
 */
describe("isTeachingDay — the school week is Mon–Sat", () => {
  it("teaches on Monday", () => expect(isTeachingDay("2026-07-27")).toBe(true));
  it("teaches on Friday", () => expect(isTeachingDay("2026-07-31")).toBe(true));
  it("teaches on Saturday", () => expect(isTeachingDay("2026-07-25")).toBe(true));
  it("does not teach on Sunday", () => expect(isTeachingDay("2026-07-26")).toBe(false));

  it("disagrees with isWeekend about Saturday, which is the point", () => {
    expect(isWeekend("2026-07-25")).toBe(true);
    expect(isTeachingDay("2026-07-25")).toBe(true);
  });

  it("agrees with isWeekend about Sunday", () => {
    expect(isWeekend("2026-07-26")).toBe(true);
    expect(isTeachingDay("2026-07-26")).toBe(false);
  });
});

describe("isWeekend", () => {
  it("knows 2026-07-25 is a Saturday", () => expect(isWeekend("2026-07-25")).toBe(true));
  it("knows 2026-07-26 is a Sunday", () => expect(isWeekend("2026-07-26")).toBe(true));
  it("knows 2026-07-27 is a Monday", () => expect(isWeekend("2026-07-27")).toBe(false));
});

describe("ageInYears", () => {
  it("counts a birthday that has passed this year", () => {
    expect(ageInYears(new Date("2013-01-05T00:00:00Z"), new Date("2026-07-27T00:00:00Z"))).toBe(13);
  });
  it("does not count a birthday still to come", () => {
    expect(ageInYears(new Date("2013-12-05T00:00:00Z"), new Date("2026-07-27T00:00:00Z"))).toBe(12);
  });
  it("counts the birthday itself", () => {
    expect(ageInYears(new Date("2013-07-27T00:00:00Z"), new Date("2026-07-27T00:00:00Z"))).toBe(13);
  });
  it("does not count the day before the birthday", () => {
    expect(ageInYears(new Date("2013-07-28T00:00:00Z"), new Date("2026-07-27T00:00:00Z"))).toBe(12);
  });
  it("handles a 29 Feb birthdate in a non-leap year", () => {
    // Turns 12 on 2024-02-29; on 2026-02-28 they are still 11.
    expect(ageInYears(new Date("2012-02-29T00:00:00Z"), new Date("2026-02-28T00:00:00Z"))).toBe(13);
    expect(ageInYears(new Date("2012-02-29T00:00:00Z"), new Date("2026-03-01T00:00:00Z"))).toBe(14);
  });
});

describe("parseDateOnly", () => {
  it("returns UTC midnight", () => {
    expect(parseDateOnly("2013-07-27")?.toISOString()).toBe("2013-07-27T00:00:00.000Z");
  });
  it("returns null for garbage rather than Invalid Date", () => {
    expect(parseDateOnly("nope")).toBeNull();
    expect(parseDateOnly("2026-02-30")).toBeNull();
  });
});

/* -------------------------------------------------------------------------- */
/* dd/mm/yyyy                                                                  */
/* -------------------------------------------------------------------------- */

describe("⚠ day-first dates", () => {
  it("shows an ISO date the way people here write it", () => {
    expect(isoToDisplayDate("2026-04-05")).toBe("05/04/2026");
    expect(isoToDisplayDate("2026-12-31")).toBe("31/12/2026");
  });

  it("reads a typed date back, day first", () => {
    expect(displayDateToIso("05/04/2026")).toBe("2026-04-05");
    // ⚠ The whole point. Read month-first this is 4 May; it is 5 April.
    expect(displayDateToIso("05/04/2026")).not.toBe("2026-05-04");
  });

  it("accepts a single-digit day and month", () => {
    expect(displayDateToIso("5/4/2026")).toBe("2026-04-05");
    expect(displayDateToIso("5/4/2026")).toBe(displayDateToIso("05/04/2026"));
  });

  it("is lenient about separators, because keyboards differ", () => {
    for (const raw of ["05/04/2026", "05-04-2026", "05.04.2026", "05 04 2026", " 05/04/2026 "]) {
      expect(displayDateToIso(raw)).toBe("2026-04-05");
    }
  });

  it("⚠ REFUSES a date that does not exist rather than rolling it over", () => {
    // `new Date("2026-02-31")` is the 3rd of March. A birthday typed wrongly
    // must come back and ask, not quietly become a different day and end up on
    // a register.
    expect(displayDateToIso("31/02/2026")).toBeNull();
    expect(displayDateToIso("30/02/2024")).toBeNull();
    expect(displayDateToIso("32/01/2026")).toBeNull();
    expect(displayDateToIso("05/13/2026")).toBeNull();
  });

  it("⚠ knows a leap year from a common one", () => {
    expect(displayDateToIso("29/02/2024")).toBe("2024-02-29");
    expect(displayDateToIso("29/02/2026")).toBeNull();
  });

  it("refuses anything that is not a date", () => {
    for (const raw of ["", "  ", "tomorrow", "2026-04-05", "5/4/26", "5/4", "//", null, undefined]) {
      expect(displayDateToIso(raw)).toBeNull();
    }
  });

  it("survives a round trip in both directions", () => {
    for (const iso of ["2026-01-01", "2026-04-05", "2024-02-29", "1999-12-31"]) {
      expect(displayDateToIso(isoToDisplayDate(iso))).toBe(iso);
    }
  });

  it("gives an empty string for nothing, so an empty box stays empty", () => {
    expect(isoToDisplayDate("")).toBe("");
    expect(isoToDisplayDate(null)).toBe("");
    expect(isoToDisplayDate(undefined)).toBe("");
    expect(isoToDisplayDate("not-a-date")).toBe("");
  });
});

describe("isPast / isFuture / isWithin", () => {
  // Every case pins `now` explicitly. These read the clock by default, and a
  // test that let them do so would pass today and fail on a slow machine at
  // midnight — the exact bug the fixed instant is here to rule out.
  const now = new Date("2026-08-13T12:00:00Z");

  it("splits gone-by from still-ahead at the instant itself", () => {
    expect(isPast(new Date("2026-08-13T11:59:59Z"), now)).toBe(true);
    expect(isFuture(new Date("2026-08-13T12:00:01Z"), now)).toBe(true);
  });

  it("⚠ calls the exact instant NEITHER past nor future", () => {
    // An invite expiring exactly now is not yet expired, and a lesson starting
    // exactly now is no longer cancellable. Both fall out of strict
    // comparisons, and both would be wrong if either used >= or <=.
    const dead_on = new Date("2026-08-13T12:00:00Z");
    expect(isPast(dead_on, now)).toBe(false);
    expect(isFuture(dead_on, now)).toBe(false);
  });

  it("counts anything closer than the window as within it", () => {
    const twoDays = 2 * 86_400_000;
    expect(isWithin(new Date("2026-08-14T12:00:00Z"), twoDays, now)).toBe(true);
    expect(isWithin(new Date("2026-08-16T12:00:00Z"), twoDays, now)).toBe(false);
  });

  it("⚠ counts the already-overdue as within, because it is the urgent case", () => {
    // "Due soon" badges are the only caller. An assignment that was due last
    // week is more urgent than one due tomorrow, not less — so the past side
    // of the window is deliberately open.
    expect(isWithin(new Date("2026-08-06T12:00:00Z"), 2 * 86_400_000, now)).toBe(true);
  });
});
