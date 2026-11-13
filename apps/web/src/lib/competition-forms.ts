import { z } from "zod";
import type { Translate } from "@/lib/i18n/dictionary";
import { addDaysToKey, dateKeyInZone, isDateKey, zonedStartOfDay } from "@/lib/dates";

/**
 * The competition forms' rules, in one place for both doors: the web's server
 * actions (src/app/(app)/competitions/actions.ts) and the /api/v1/contest
 * handlers the phone calls. Moved here from the actions unchanged, so a title,
 * a date, a link or a score is judged the same way whichever door it came
 * through — and refused in the same words.
 *
 * ⚠ FACTORIES, not module-level schemas. The messages inside are shown to the
 * person who typed, so they must resolve in that person's language — a
 * module-level schema bakes them in whatever language the module loaded in.
 */

/** Empty strings from a form mean "not given", not "the empty string". */
const optionalText = z
  .string()
  .trim()
  .max(5000)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

/** The zone a platform competition's days are read in (the platform is India's), and a school's when none is known. */
export const PLATFORM_ZONE = "Asia/Kolkata";

/**
 * TA-102: a day typed as a competition's date, as the instant it stands for in `timeZone`: an opening or a start is
 * the day's first instant, a closing or an end its last, so entries close and work stops at the end of the day the
 * page names (as the calendar's events store them, competition-events.ts) and not at 00:00 UTC, 05:30 in India. A
 * value that is not a bare day is the instant it names.
 */
export function competitionDay(value: string, edge: "start" | "end", timeZone: string): Date {
  const v = value.trim();
  if (!isDateKey(v)) return new Date(v);
  return edge === "start" ? zonedStartOfDay(v, timeZone) : new Date(zonedStartOfDay(addDaysToKey(v, 1), timeZone).getTime() - 1);
}

/**
 * A date input gives "YYYY-MM-DD" or "". Parsed here rather than trusted:
 * `new Date("")` is Invalid Date, which Prisma stores as a crash rather than a
 * null.
 */
const optionalDate = (t: Translate, edge: "start" | "end", timeZone: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || !Number.isNaN(Date.parse(v)), {
      message: t("competitions.notADate"),
    })
    .transform((v) => (v ? competitionDay(v, edge, timeZone) : null));

/**
 * TA-574: the class band as gradeFits reads it: each end a whole class number (13 is college, the platform's
 * convention) and the low end not above the high. Anything else was saved without a word and then refused, or let
 * in, every pupil. The refusal's key, or null when the band is good; an empty end leaves that side open.
 */
export function classBandProblem(low: string | null | undefined, high: string | null | undefined): "competitions.classBandNotANumber" | "competitions.classBandReversed" | null {
  const asClass = (v: string | null | undefined): number | null => {
    const s = v?.trim() ?? "";
    if (s.length === 0) return null;
    const n = /^\d{1,2}$/.test(s) ? Number(s) : NaN;
    return n >= 1 && n <= 13 ? n : NaN;
  };
  const l = asClass(low);
  const h = asClass(high);
  if (Number.isNaN(l) || Number.isNaN(h)) return "competitions.classBandNotANumber";
  if (l !== null && h !== null && l > h) return "competitions.classBandReversed";
  return null;
}

/**
 * A checkbox: a web form sends "on" or nothing, the phone's JSON a boolean.
 * Both read the same way; a FormData value is always a string, so the boolean
 * branch changes nothing for the web.
 */
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.undefined(), z.literal(""), z.boolean()])
  .transform((v) => v === "on" || v === "true" || v === true);

/**
 * A school's own competition, as the "Post a competition" form describes it. `timeZone` is the school's: the zone
 * its typed days are read in (TA-102).
 */
export const competitionFormSchema = (t: Translate, timeZone: string = PLATFORM_ZONE) =>
  z
    .object({
      title: z.string().trim().min(3, t("competitions.giveTitle")).max(140),
      summary: z.string().trim().min(3, t("competitions.oneLinePlease")).max(200),
      body: optionalText,
      subject: z.string().trim().max(40).transform((v) => (v.length === 0 ? null : v)).nullable().optional(),
      gradeLow: z.string().trim().max(10).transform((v) => (v.length === 0 ? null : v)).nullable().optional(),
      gradeHigh: z.string().trim().max(10).transform((v) => (v.length === 0 ? null : v)).nullable().optional(),
      eligibility: optionalText,
      rules: optionalText,
      prizes: optionalText,
      // http:// would put a child on a page that can be tampered with in transit.
      externalUrl: z
        .string()
        .trim()
        .transform((v) => (v.length === 0 ? null : v))
        .nullable()
        .optional()
        .refine((v) => v === null || v === undefined || /^https:\/\/\S+$/.test(v), {
          message: t("competitions.httpsOnly"),
        }),
      registrationClosesAt: optionalDate(t, "end", timeZone),
      startsAt: optionalDate(t, "start", timeZone),
      endsAt: optionalDate(t, "end", timeZone),
      requiresParentConsent: checkbox,
      leaderboardEnabled: checkbox,
    })
    .refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, {
      message: t("competitions.endBeforeStart"),
      path: ["endsAt"],
    })
    // By the day, as before TA-102: entries may close on the day it starts (the end of that day is after its start).
    .refine((v) => !v.registrationClosesAt || !v.startsAt || dateKeyInZone(v.registrationClosesAt, timeZone) <= dateKeyInZone(v.startsAt, timeZone), {
      message: t("competitions.closesAfterStart"),
      path: ["registrationClosesAt"],
    })
    // TA-574: the band, refused at the end that is wrong.
    .refine((v) => classBandProblem(v.gradeLow, null) === null, { message: t("competitions.classBandNotANumber"), path: ["gradeLow"] })
    .refine((v) => classBandProblem(null, v.gradeHigh) === null, { message: t("competitions.classBandNotANumber"), path: ["gradeHigh"] })
    .refine((v) => classBandProblem(v.gradeLow, v.gradeHigh) !== "competitions.classBandReversed", { message: t("competitions.classBandReversed"), path: ["gradeHigh"] });

/** Every bad field reported at once, never the first one only — the first message per field. (§6) */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

/**
 * The link a child hands in. https only, for the same reason the organiser's
 * own link is: this ends up as something a child clicks.
 */
export const submitUrlSchema = (t: Translate) =>
  z
    .string()
    .trim()
    .max(500)
    .refine((v) => /^https:\/\/\S+$/.test(v), { message: t("competitions.httpsOnly") });

export const submitFormSchema = (t: Translate) =>
  z.object({
    id: z.string().cuid(),
    url: submitUrlSchema(t),
  });

/**
 * A score as staff type it — points, possibly with a half — and a place.
 *
 * Empty means "not recorded", which is NOT zero. A competition where zero is a
 * real score would otherwise have no way to undo a typo.
 */
export const resultFieldsSchema = (t: Translate) =>
  z.object({
    score: z
      .string()
      .trim()
      .transform((v) => (v.length === 0 ? null : Number(v)))
      .refine((v) => v === null || (Number.isFinite(v) && v >= 0), {
        message: t("competitions.scoreRule"),
      }),
    rank: z
      .string()
      .trim()
      .transform((v) => (v.length === 0 ? null : Number(v)))
      .refine((v) => v === null || (Number.isInteger(v) && v >= 1), {
        message: t("competitions.placeRule"),
      }),
  });

export const resultFormSchema = (t: Translate) => resultFieldsSchema(t).extend({ entryId: z.string().cuid() });
