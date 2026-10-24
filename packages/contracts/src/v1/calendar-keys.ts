import { z } from "zod";

/**
 * A DAY AND A CLOCK TIME THAT EXIST (QA-55, the QA campaign of 24 October 2026). The pattern alone let "2027-02-30",
 * "2026-13-01" and "25:99" through: a closure kept on a day that is not one, a decision log whose filter was dropped,
 * quiet hours that never begin. Each is checked against the calendar and the clock here, with the message the
 * pattern already gave, so a door answers 422 naming the field.
 */

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** True when YYYY-MM-DD names a day of the Gregorian calendar (2028-02-29 yes, 2027-02-29 no). */
export function isRealDateKey(value: string): boolean {
  if (!DAY_PATTERN.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number) as [number, number, number];
  if (m < 1 || m > 12 || d < 1) return false;
  const day = new Date(Date.UTC(y, m - 1, d));
  return day.getUTCFullYear() === y && day.getUTCMonth() === m - 1 && day.getUTCDate() === d;
}

/** YYYY-MM-DD, a day that exists. */
export const realDateKey = z.string().regex(DAY_PATTERN, "date").refine(isRealDateKey, "date");

/** H:MM or HH:MM on a 24-hour clock, 0:00 to 23:59. */
export const clockHHMM = z.string().regex(/^([01]?\d|2[0-3]):[0-5]\d$/, "refusal.useHHMM");
