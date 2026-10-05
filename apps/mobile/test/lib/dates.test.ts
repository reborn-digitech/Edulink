import fs from "node:fs";
import path from "node:path";
import { formatDate, formatDateRange, formatDateTime, formatDayWithWeekday, formatMonth, formatWith, instantFromTyped, latn, weekdayName } from "@/lib/dates";

/**
 * The phone's one date formatter (A3-journeys-31): dd/mm/yyyy for a day,
 * dd/mm/yyyy HH:mm for an instant, as the web's apps/web/src/lib/dates.ts
 * prints a day. Before it, the fees and exams screens printed "Jul 15, 2026"
 * and "Oct 25, 3:07 PM", and a dozen headings printed the raw "2026-10-05".
 */
describe("the date formatter", () => {
  it("prints a day key as dd/mm/yyyy, never moved by a zone", () => {
    expect(formatDate("2026-07-15")).toBe("15/07/2026");
    expect(formatDate("2026-01-01", "Pacific/Kiritimati")).toBe("01/01/2026");
    expect(formatDate("2026-12-31", "America/Los_Angeles")).toBe("31/12/2026");
  });

  it("prints an instant's day and time in the school's zone, 24-hour", () => {
    expect(formatDate("2026-10-25T20:30:00.000Z", "Asia/Kolkata")).toBe("26/10/2026");
    expect(formatDateTime("2026-10-25T09:37:00.000Z", "Asia/Kolkata")).toBe("25/10/2026 15:07");
    expect(formatDateTime("2026-10-25T18:30:00.000Z", "Asia/Kolkata")).toBe("26/10/2026 00:00");
    expect(formatDateTime(new Date(2026, 9, 10, 16, 5))).toBe("10/10/2026 16:05");
  });

  it("reads a zone the runtime does not know in the device's own instead of failing", () => {
    expect(formatDateTime(new Date(2026, 9, 10, 16, 5), "Not/AZone")).toBe("10/10/2026 16:05");
  });

  it("gives back what it cannot read, and an empty string for a bad Date", () => {
    expect(formatDate("soon")).toBe("soon");
    expect(formatDate("2026-02-30")).toBe("2026-02-30");
    expect(formatDateTime(new Date(Number.NaN))).toBe("");
  });

  it("answers any option that asks for a day in the one shape, the weekday in the reader's words", () => {
    expect(formatWith("2026-07-15", { day: "numeric", month: "short", year: "numeric" })).toBe("15/07/2026");
    expect(formatWith("2026-07-15", { day: "numeric", month: "long" })).toBe("15/07/2026");
    expect(formatDayWithWeekday("2026-10-05")).toBe("Mon, 05/10/2026");
    expect(formatDayWithWeekday("2026-10-05", "mr")).toMatch(/^\S+, 05\/10\/2026$/);
    expect(formatDayWithWeekday("2026-10-05", "mr")).not.toMatch(/[०-९]/);
    expect(formatWith("2026-10-25T09:37:00.000Z", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }, "hi", "Asia/Kolkata")).toBe("25/10/2026 15:07");
  });

  it("leaves a label that is not a date to Intl, with Latin digits", () => {
    expect(formatMonth("2026-09-01")).toBe("September 2026");
    expect(formatMonth("2026-09-01", "en", true)).toBe("Sep 2026");
    expect(formatMonth("2026-09-01", "mr")).toMatch(/2026$/);
    expect(formatWith("2026-10-25T09:37:00.000Z", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }, "en", "Asia/Kolkata")).toBe("15:07");
    expect(weekdayName(1)).toBe("Monday");
    expect(weekdayName(0, "en", "short")).toBe("Sun");
    expect(latn("en")).toBe("en");
    expect(latn("hi")).toBe("hi-u-nu-latn");
  });

  it("prints a range as two days, or one when both are the same", () => {
    expect(formatDateRange("2027-05-01", "2027-06-30")).toBe("01/05/2027 – 30/06/2027");
    expect(formatDateRange("2027-05-01", "2027-05-01")).toBe("01/05/2027");
  });

  it("reads a typed day and time in the shape it prints, and the older one", () => {
    expect(instantFromTyped("25/10/2026 16:00")).toBe(new Date(2026, 9, 25, 16, 0).toISOString());
    expect(instantFromTyped(" 5/1/2027 7:30 ")).toBe(new Date(2027, 0, 5, 7, 30).toISOString());
    expect(instantFromTyped("2026-10-25 16:00")).toBe(new Date(2026, 9, 25, 16, 0).toISOString());
    expect(instantFromTyped("31/02/2026 16:00")).toBeNull();
    expect(instantFromTyped("25/10/2026 25:00")).toBeNull();
    expect(instantFromTyped("tomorrow")).toBeNull();
  });
});

/**
 * The source rule: a screen or a component formats a date only through
 * src/lib/dates.ts, so the US default and the raw ISO cannot come back one
 * call at a time.
 */
describe("dates are formatted in one place", () => {
  it("no screen or component calls toLocaleDateString, toLocaleString on a date, toLocaleTimeString or Intl.DateTimeFormat", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full);
        else if (/\.tsx?$/.test(name)) {
          fs.readFileSync(full, "utf8")
            .split("\n")
            .forEach((line, i) => {
              // A number's toLocaleString ("12.5%") is not a date: the rule looks for the date calls and a Date's toLocaleString.
              if (/\.toLocaleDateString\(|\.toLocaleTimeString\(|new Intl\.DateTimeFormat\(|Date\([^)]*\)\.toLocaleString\(|\b(d|date|at|when)\.toLocaleString\(/.test(line)) offenders.push(`${path.relative(process.cwd(), full)}:${i + 1}`);
            });
        }
      }
    };
    walk(path.join(__dirname, "..", "..", "src", "screens"));
    walk(path.join(__dirname, "..", "..", "src", "components"));
    expect(offenders).toEqual([]);
  });
});
