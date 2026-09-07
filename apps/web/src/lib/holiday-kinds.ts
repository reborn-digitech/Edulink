import type { TranslationKey } from "./i18n/dictionary";

/**
 * The vocabulary of the school calendar, minus anything that touches a database.
 *
 * ITS OWN FILE, and deliberately free of `server-only` — the same split as
 * `leave-kinds.ts`, made for the same reason. The entry form and the entry list
 * are client components, they need the three kinds and their labels, and
 * importing those from `holidays.ts` drags `server-only` into the browser bundle
 * and fails the build. `holidays.ts` re-exports all of it, so server code
 * carries on importing from `@/lib/holidays`.
 *
 * ⚠ KEYS, NOT WORDS — see `ROLE_META`. Before this the list page resolved a
 * label on the SERVER and passed the finished English word down as
 * `entry.kindLabel`, which is how a fully translated Marathi calendar still read
 * "Holiday" on every badge. The kind itself is what crosses the boundary now,
 * and the reader's own `t` turns it into a word.
 *
 * `…Option` is the longer form the select shows. A dropdown is where somebody
 * decides which kind a day is, and there the consequence ("school is shut")
 * matters more than the noun; a badge on a list has no room for it.
 */

export const HOLIDAY_KINDS = ["HOLIDAY", "EXAM", "EVENT"] as const;
export type HolidayKind = (typeof HOLIDAY_KINDS)[number];

export const HOLIDAY_KIND_META: Record<
  HolidayKind,
  {
    labelKey: TranslationKey;
    descriptionKey: TranslationKey;
    optionKey: TranslationKey;
    closesSchool: boolean;
  }
> = {
  HOLIDAY: {
    labelKey: "calendar.holiday",
    descriptionKey: "calendar.holidayHint",
    optionKey: "calendar.holidayOption",
    closesSchool: true,
  },
  EXAM: {
    labelKey: "calendar.exam",
    descriptionKey: "calendar.examHint",
    optionKey: "calendar.examOption",
    closesSchool: false,
  },
  EVENT: {
    labelKey: "calendar.event",
    descriptionKey: "calendar.eventHint",
    optionKey: "calendar.eventOption",
    closesSchool: false,
  },
};
