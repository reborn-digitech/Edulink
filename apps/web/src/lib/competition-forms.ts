import { z } from "zod";
import type { Translate } from "@/lib/i18n/dictionary";

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

/**
 * A date input gives "YYYY-MM-DD" or "". Parsed here rather than trusted:
 * `new Date("")` is Invalid Date, which Prisma stores as a crash rather than a
 * null.
 */
const optionalDate = (t: Translate) =>
  z
    .string()
    .trim()
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || !Number.isNaN(Date.parse(v)), {
      message: t("competitions.notADate"),
    })
    .transform((v) => (v ? new Date(v) : null));

/**
 * A checkbox: a web form sends "on" or nothing, the phone's JSON a boolean.
 * Both read the same way; a FormData value is always a string, so the boolean
 * branch changes nothing for the web.
 */
const checkbox = z
  .union([z.literal("on"), z.literal("true"), z.undefined(), z.literal(""), z.boolean()])
  .transform((v) => v === "on" || v === "true" || v === true);

/** A school's own competition, as the "Post a competition" form describes it. */
export const competitionFormSchema = (t: Translate) =>
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
      registrationClosesAt: optionalDate(t),
      startsAt: optionalDate(t),
      endsAt: optionalDate(t),
      requiresParentConsent: checkbox,
      leaderboardEnabled: checkbox,
    })
    .refine((v) => !v.startsAt || !v.endsAt || v.startsAt <= v.endsAt, {
      message: t("competitions.endBeforeStart"),
      path: ["endsAt"],
    })
    .refine((v) => !v.registrationClosesAt || !v.startsAt || v.registrationClosesAt <= v.startsAt, {
      message: t("competitions.closesAfterStart"),
      path: ["registrationClosesAt"],
    });

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
