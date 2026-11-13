import { todayKey } from "./dates";

/**
 * The zone a birthday turns in when no school is named. The platform serves
 * Indian schools and accounts:tidy runs at 03:45 in Asia/Kolkata; the UTC date
 * at that hour is still yesterday, which once kept a guardian reading an adult's
 * results for a day and a night after the eighteenth birthday (LIFECYCLE-2).
 */
export const BIRTHDAY_ZONE = "Asia/Kolkata";

/**
 * The latest birthdate of someone already eighteen on `now`'s calendar day in
 * `timeZone`. Birthdates are stored at UTC midnight of the date, so the cutoff
 * is the date eighteen years before today's local date, at UTC midnight. A
 * 29 February birthday turns on 1 March in a common year. On 29 February
 * itself the year eighteen back is a common one, and the cutoff is its
 * 28 February rather than the 1 March Date.UTC would roll over to (TA-421):
 * whoever was born on 1 March turns eighteen tomorrow.
 */
export function adultCutoff(now: Date, timeZone: string = BIRTHDAY_ZONE): Date {
  const [y, m, d] = todayKey(timeZone, now).split("-").map(Number) as [number, number, number];
  const cutoff = new Date(Date.UTC(y - 18, m - 1, d));
  return cutoff.getUTCMonth() === m - 1 ? cutoff : new Date(Date.UTC(y - 18, m, 0));
}

/** Under eighteen on `now`'s local day in `timeZone`, by the date of birth alone. */
export function isMinorOn(birthdate: Date, now: Date = new Date(), timeZone: string = BIRTHDAY_ZONE): boolean {
  return birthdate.getTime() > adultCutoff(now, timeZone).getTime();
}
