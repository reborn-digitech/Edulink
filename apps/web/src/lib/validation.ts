import { z } from "zod";
import { INSTITUTION_KINDS, STREAMS } from "@edulink/contracts";
import {
  ATTENDANCE_STATUSES,
  GUARDIAN_RELATIONS,
  POST_CATEGORIES,
  POST_SCOPES,
  REACTION_KINDS,
  INVITABLE_ROLES,
} from "./constants";
import { isDateKey, isValidTimeZone } from "./dates";
import { AVATAR_PRESETS } from "@/components/ui/avatar";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * Server-side validation for every trust boundary.
 *
 * Client-side validation in this app is decoration for UX; these schemas are
 * the actual gate and run inside every server action and route handler. (§6)
 */

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(320)
  .email("register.enterValidEmail");

export const passwordSchema = z
  .string()
  .min(10, "refusal.pwAtLeast10")
  .max(200, "refusal.pwTooLong");

export const dateKeySchema = z
  .string()
  .refine(isDateKey, "refusal.useRealDateForm");

export const timeZoneSchema = z
  .string()
  .refine(isValidTimeZone, "refusal.timezoneUnknown");

export const hexColorSchema = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "refusal.useHexColour");

/* -------------------------------------------------------------------------- */
/* Registration                                                                */
/* -------------------------------------------------------------------------- */

export const schoolDetailsSchema = z.object({
  name: trimmed(2, 120),
  contactEmail: emailSchema,
  contactPhone: trimmed(4, 40).optional().or(z.literal("")),
  website: z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/.test(v),
      "refusal.startWithHttp",
    )
    .optional(),
  addressLine: trimmed(0, 200).optional(),
  city: trimmed(0, 100).optional(),
  region: trimmed(0, 100).optional(),
  postalCode: trimmed(0, 24).optional(),
  country: trimmed(0, 100).optional(),
  gradeLow: trimmed(0, 12).optional(),
  gradeHigh: trimmed(0, 12).optional(),
  // Seeds the directory profile (school-profile.ts). Optional at
  // registration on purpose: a founder mid-signup should not be made to
  // write marketing copy before they have a school.
  about: trimmed(0, 4000).optional(),
  timezone: timeZoneSchema.default("UTC"),
  brandPrimary: hexColorSchema.optional().or(z.literal("")),
});

export const adminAccountSchema = z.object({
  name: trimmed(2, 120),
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchoolSchema = z.object({
  school: schoolDetailsSchema,
  /** What kind of institution is registering (4 Oct 2026): a school when left out. */
  kind: z.enum(INSTITUTION_KINDS).default("SCHOOL"),
  /** A college's streams (5 Oct 2026): at least one for a college (the action refuses none), ignored for a school. */
  streams: z.array(z.enum(STREAMS)).max(STREAMS.length).default([]),
  admin: adminAccountSchema,
  acceptedTerms: z.literal(true, {
    // ⚠ A KEY, not a sentence — the consuming action translates it.
    errorMap: () => ({ message: "refusal.acceptTerms" }),
  }),
});

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * ONE BOX, NOT AN EMAIL BOX.
 *
 * A person signs in with an email, a mobile number, or the handle a pupil who
 * joined with a class code was given — and `emailSchema` refused two of the
 * three before the database was ever asked. It is validated as a non-empty
 * string here and resolved by shape in `findAccount`; the refusal that matters
 * is "that login and password do not match", which is one message for all three
 * so the form cannot be used to test which identifiers exist.
 */
export const identifierSchema = z
  .string()
  .trim()
  .min(1, "refusal.enterIdentifier")
  .max(320);

export const loginSchema = z.object({
  identifier: identifierSchema,
  password: z.string().min(1, "refusal.enterPassword"),
});

export const magicLinkSchema = z.object({ email: emailSchema });

export const resetRequestSchema = z.object({ identifier: identifierSchema });

export const resetSchema = z.object({
  identifier: identifierSchema,
  code: z.string().trim().min(1, "refusal.enterCode"),
  password: passwordSchema,
});

/* -------------------------------------------------------------------------- */
/* Invites & membership                                                        */
/* -------------------------------------------------------------------------- */

export const inviteSchema = z.object({
  // Never ALUMNUS: a former pupil's alumni membership is made by their departure alone.
  role: z.enum(INVITABLE_ROLES),
  email: emailSchema.optional().or(z.literal("")),
  name: trimmed(0, 120).optional(),
  classId: z.string().cuid().optional().or(z.literal("")),
  subjects: z.array(trimmed(1, 60)).max(20).default([]),
});

export const bulkInviteSchema = z.object({
  role: z.enum(INVITABLE_ROLES),
  /** Raw CSV text. Parsed and validated row-by-row by parseInviteCsv. */
  csv: z.string().min(1, "refusal.pasteOneRow").max(500_000, "refusal.fileTooLarge"),
});

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  name: trimmed(2, 120),
  /**
   * OPTIONAL HERE, AND REQUIRED IN THE ACTION — because whether it is needed
   * depends on a row this schema cannot see.
   *
   * An invitation sent to an address that already has an account is a transfer:
   * the new school adds itself to the account the person already signs in with,
   * and their password must not change. Demanding one there is how the form
   * came to collect a password it silently threw away. Demanding one for a
   * brand-new account is still non-negotiable — an account with no password is
   * one nobody can ever sign into again.
   */
  password: passwordSchema.optional(),
  title: trimmed(0, 80).optional(),
  bio: trimmed(0, 600).optional(),
  subjects: z.array(trimmed(1, 60)).max(20).default([]),
  /**
   * OPTIONAL, and it stays optional on purpose.
   *
   * `joinAsStudent` has always asked for a birthday; an invitation never did,
   * so every invited pupil and every member of staff had none — which meant the
   * school calendar could not show a birthday for most of the school, and a
   * guardian claiming an invited child was refused outright because there was
   * no second factor on file.
   *
   * Not REQUIRED because an invitation is often the first thing a teacher does
   * on a Monday morning and a date they do not want to give must not be the
   * thing that stops them accepting a job. It is asked for, and what it is for
   * is said next to it.
   */
  birthdate: trimmed(0, 32).optional(),
});

/* -------------------------------------------------------------------------- */
/* Classes                                                                     */
/* -------------------------------------------------------------------------- */

export const classSchema = z.object({
  name: trimmed(1, 100),
  subject: trimmed(0, 80).optional(),
  gradeLevel: trimmed(0, 24).optional(),
  /// "A", "B", "Sunflower". Optional because plenty of schools have one class
  /// per grade and should not be made to invent a section for it.
  section: trimmed(0, 24).optional(),
  room: trimmed(0, 40).optional(),
  color: hexColorSchema.optional().or(z.literal("")),
});

/* -------------------------------------------------------------------------- */
/* Student & parent onboarding                                                 */
/* -------------------------------------------------------------------------- */

export const studentJoinSchema = z.object({
  schoolCode: trimmed(4, 32),
  classCode: trimmed(0, 32).optional(),
  name: trimmed(2, 120),
  preferredName: trimmed(0, 60).optional(),
  // One of the drawn presets, as every other avatar writer insists (account.ts): an `upload:<fileId>` key here was drawn
  // straight onto the ID card and the hall ticket from the blob store, any school's file (A3-S-1, 5 Oct 2026).
  avatarKey: trimmed(1, 60).refine((key) => AVATAR_PRESETS.includes(key), "refusal.notValid"),
  birthdate: dateKeySchema.optional(),
  password: passwordSchema,
});

export const parentSignupSchema = z.object({
  name: trimmed(2, 120),
  email: emailSchema,
  password: passwordSchema,
  consentSharing: z.literal(true, {
    // ⚠ A KEY, not a sentence — the consuming action translates it.
    errorMap: () => ({ message: "refusal.consentSharing" }),
  }),
  consentNotifications: z.boolean().default(false),
});

export const claimChildSchema = z.object({
  studentCode: trimmed(6, 32),
  birthdate: dateKeySchema,
  relation: z.enum(GUARDIAN_RELATIONS).default("PARENT"),
});

/* -------------------------------------------------------------------------- */
/* Attendance                                                                  */
/* -------------------------------------------------------------------------- */

export const attendanceMarkSchema = z.object({
  studentMembershipId: z.string().cuid(),
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().trim().max(500).optional(),
  /** Idempotency key minted on the device before the row is queued. */
  clientId: z.string().min(8).max(64),
  /** Client's clock when the mark was made — used for last-write-wins. */
  markedAt: z.string().datetime().optional(),
});

export const attendanceBatchSchema = z.object({
  classId: z.string().cuid(),
  dateKey: dateKeySchema,
  marks: z.array(attendanceMarkSchema).min(1).max(500),
});

/* -------------------------------------------------------------------------- */
/* Assignments & grades                                                        */
/* -------------------------------------------------------------------------- */

export const assignmentSchema = z.object({
  classId: z.string().cuid(),
  title: trimmed(2, 200),
  body: z.string().trim().max(20_000).default(""),
  category: trimmed(0, 60).optional(),
  points: z
    .number()
    .min(0, "refusal.pointsNegative")
    .max(10_000)
    .optional(),
  dueAt: z.string().datetime().optional().or(z.literal("")),
  publish: z.boolean().default(true),
  /** The teacher means a due date that has already passed (A3-journeys-25); without it such a date is refused. */
  confirmPastDue: z.boolean().optional(),
});

export const gradeSchema = z.object({
  assignmentId: z.string().cuid(),
  studentMembershipId: z.string().cuid(),
  score: z.number().min(0, "refusal.scoresNegative").max(10_000).nullable(),
  letter: trimmed(0, 8).optional(),
  comment: z.string().trim().max(4_000).optional(),
});

/* -------------------------------------------------------------------------- */
/* Remarks, posts, reports                                                     */
/* -------------------------------------------------------------------------- */

/**
 * BOTH IDS OPTIONAL HERE, and which one is required depends on who is asking —
 * a question this schema cannot answer and `createThread` can.
 *
 * A teacher names the pupil and is themselves the teacher. A pupil names the
 * teacher and is themselves the pupil. A guardian names both, and proves a
 * claim on each. Making either field mandatory here would refuse two of those
 * three before the guard that actually knows the answer ever ran.
 */
export const remarkThreadSchema = z.object({
  studentMembershipId: z.string().cuid().optional(),
  teacherMembershipId: z.string().cuid().optional(),
  subject: trimmed(2, 160),
  body: trimmed(1, 8_000),
});

export const remarkReplySchema = z.object({
  threadId: z.string().cuid(),
  body: trimmed(1, 8_000),
});

export const postSchema = z.object({
  scope: z.enum(POST_SCOPES),
  // Defaulted rather than required so every form shipped before categories
  // existed still parses; the composer always sends one explicitly.
  category: z.enum(POST_CATEGORIES).default("UPDATES"),
  /** The typeface, by the web's key; "default" is the reader's own. */
  font: z.string().trim().regex(/^[a-z]{1,40}$/).default("default"),
  classId: z.string().cuid().optional().or(z.literal("")),
  // Targeting; the lib re-checks that only staff may narrow or require an ack,
  // so a forged student form degrades to an ordinary everyone-post.
  audience: z.enum(["ALL", "PARENTS", "TEACHERS", "STUDENTS"]).default("ALL"),
  audienceGrade: z.string().trim().max(20).default(""),
  requiresAck: z
    .string()
    .default("")
    .transform((v) => v === "on" || v === "true"),
  title: trimmed(2, 200),
  body: z.string().trim().max(20_000).default(""),
  tags: z.array(trimmed(1, 30)).max(8).default([]),
  media: z
    .array(
      z.object({
        fileId: z.string().min(1),
        kind: z.enum(["image", "video", "file"]),
        // Enforced here, not just in the UI: a bulletin image with no alt text
        // is unreadable to a screen reader and the spec requires it. (§4)
        alt: trimmed(1, 300),
      }),
    )
    .max(10)
    .default([]),
});

export const reactionSchema = z.object({
  postId: z.string().cuid(),
  kind: z.enum(REACTION_KINDS),
});

export const reportSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "USER"]),
  targetId: z.string().min(1).max(64),
  reason: z.enum(["BULLYING", "UNSAFE", "SPAM", "WRONG_INFO", "PRIVACY", "OTHER"]),
  detail: z.string().trim().max(2_000).optional(),
});

export const moderationSchema = z.object({
  postId: z.string().cuid(),
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(500).optional(),
});

/* -------------------------------------------------------------------------- */
/* Preferences                                                                 */
/* -------------------------------------------------------------------------- */

export const prefsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  contrast: z.enum(["normal", "high"]).default("normal"),
  font: z.enum(["default", "dyslexic"]).default("default"),
  motion: z.enum(["full", "reduced"]).default("full"),
  locale: z.string().trim().min(2).max(10).default("en"),
  channels: z
    .object({ push: z.boolean().default(true), email: z.boolean().default(true), sms: z.boolean().default(true), whatsapp: z.boolean().default(true) })
    .default({ push: true, email: true, sms: true, whatsapp: true }),
  quietHours: z
    .object({
      start: z.string().regex(/^\d{1,2}:\d{2}$/, "refusal.useHHMM"),
      end: z.string().regex(/^\d{1,2}:\d{2}$/, "refusal.useHHMM"),
    })
    .nullable()
    .default(null),
});

/**
 * The push services a browser can hand us an endpoint on, and the only hosts
 * the server will ever POST a notification to.
 *
 * THE ENDPOINT IS A URL THE CLIENT CHOOSES AND THE SERVER LATER FETCHES, which
 * is the textbook shape of a server-side request forgery: a "subscription"
 * pointing at 127.0.0.1, the metadata service, or an internal host would have
 * been stored as a device and then called, with an authenticated VAPID
 * header, on every notification. Browsers only ever mint endpoints on their
 * vendor's service, so an exact list costs a real user nothing. Exact hosts
 * or a dotted suffix — `*.push.services.mozilla.com` must not match
 * `evil-push.services.mozilla.com.attacker.example` and does not, because
 * the suffix is anchored at the end and begins with a dot.
 */
const PUSH_SERVICE_HOSTS = new Set([
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
]);
const PUSH_SERVICE_HOST_SUFFIXES = [".push.services.mozilla.com", ".notify.windows.com", ".push.apple.com"];

/** True when `raw` is an https URL on a known push service and nothing else. */
export function isPushServiceEndpoint(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") return false;
  // Credentials in the URL are a way of smuggling a different host past a
  // reader — `https://fcm.googleapis.com@evil.example/` parses with the real
  // host `evil.example`, but nothing a push service mints carries them.
  if (url.username || url.password) return false;
  const host = url.hostname.toLowerCase();
  return PUSH_SERVICE_HOSTS.has(host) || PUSH_SERVICE_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export const pushSubscribeSchema = z.object({
  endpoint: z
    .string()
    .url()
    .max(1000)
    .refine(isPushServiceEndpoint, "refusal.pushEndpoint"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(200) }),
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

export type FieldErrors = Record<string, string>;

/**
 * A custom message on a shared schema is a KEY (see the messages above), so a
 * flattened error can be handed to a reader only after translation.
 */
const KEY_SHAPED = /^[a-z][a-zA-Z0-9]*(\.[a-zA-Z0-9]+)+$/;

/**
 * ⚠ THE ZOD DEFAULTS ARE KEYED HERE, NOT ON EVERY BOUND. A bare `.min(2)` on a
 * name field used to answer in zod's own English ("String must contain at
 * least 2 character(s)") no matter what language the form was in. Writing a
 * custom message onto every bound in this file would fix that once and rot the
 * first time somebody adds a field — so instead the issue itself is read at
 * the one chokepoint every form already passes through: the CODE says what
 * went wrong, the issue carries the bound, and the sentence is minted from a
 * key with the number spliced in. `issue.message` survives only as the
 * fallback for shapes no schema here produces.
 */
export function issueText(issue: z.ZodIssue, t?: Translate): string {
  // A custom message that is a key is the schema author's exact words — wins.
  if (KEY_SHAPED.test(issue.message)) return t ? t(issue.message as TranslationKey) : issue.message;
  if (!t) return issue.message;

  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      // A missing field and a wrong-typed one read the same to the person who
      // left the box empty — and a genuinely wrong TYPE is a tampered request,
      // not something the form UI can produce.
      return issue.received === "undefined" ? t("refusal.required") : t("refusal.notValid");
    case z.ZodIssueCode.too_small: {
      const min = Number(issue.minimum);
      if (issue.type === "string") {
        return min <= 1 ? t("refusal.required") : t("refusal.atLeastChars", { count: min });
      }
      if (issue.type === "number") return t("refusal.numberAtLeast", { min });
      if (issue.type === "array") {
        return min <= 1 ? t("refusal.addAtLeastOne") : t("refusal.addAtLeastMany", { count: min });
      }
      break;
    }
    case z.ZodIssueCode.too_big: {
      const max = Number(issue.maximum);
      if (issue.type === "string") return t("refusal.tooLongMax", { count: max });
      if (issue.type === "number") return t("refusal.numberAtMost", { max });
      if (issue.type === "array") return t("refusal.tooManyItems", { count: max });
      break;
    }
    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email") return t("register.enterValidEmail");
      return t("refusal.notValid");
    case z.ZodIssueCode.invalid_enum_value:
    case z.ZodIssueCode.invalid_literal:
      return t("refusal.notValidChoice");
  }
  return issue.message;
}

/** Flattens a ZodError into { fieldPath: firstMessage } for inline form errors. */
export function fieldErrors(error: z.ZodError, t?: Translate): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_form";
    out[path] ??= issueText(issue, t);
  }
  return out;
}

/** Points are stored as integer thousandths. 87.5 -> 87500. (§10) */
export function toMilli(value: number): number {
  return Math.round(value * 1000);
}

export function fromMilli(value: number): number {
  return value / 1000;
}

/** Formats a milli score for display without float artefacts. */
export function formatMilli(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const whole = Math.trunc(value / 1000);
  const frac = Math.abs(value % 1000);
  if (frac === 0) return String(whole);
  return `${whole}.${String(frac).padStart(3, "0").replace(/0+$/, "")}`;
}

/* ---- conversations: a person writing to a person ------------------------- */

export const openConversationSchema = z.object({
  schoolId: z.string().cuid(),
  userId: z.string().cuid(),
});

export const conversationMessageSchema = z.object({
  conversationId: z.string().cuid(),
  body: trimmed(1, 8_000),
});
