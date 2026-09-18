import { z } from "zod";
import { localeSchema } from "../locale";
import { roleSchema } from "./auth";

/**
 * account: request and response shapes for the phone's remaining screens —
 * the account page, the avatar, a booking's conversation and the composer's
 * choices. Area-prefixed export names, because the index re-exports every
 * area and a bare `prefsSchema` would collide.
 */

const iso = z.string().datetime();
const hhmm = z.string().regex(/^\d{1,2}:\d{2}$/, "refusal.useHHMM");

/* -------------------------------------------------------------------------- */
/* The account page                                                            */
/* -------------------------------------------------------------------------- */

export const accountThemeSchema = z.enum(["light", "dark", "system"]);

/** GET /api/v1/account */
export const accountOverviewSchema = z.object({
  name: z.string(),
  preferredName: z.string().nullable(),
  /** Null for a self-joined pupil, whose sign-in is a login name, not an address. */
  email: z.string().nullable(),
  loginName: z.string().nullable(),
  emailConfirmed: z.boolean(),
  phone: z.string().nullable(),
  phoneConfirmed: z.boolean(),
  avatarKey: z.string().nullable(),
  createdAt: iso,
  prefs: z.object({
    locale: localeSchema,
    theme: accountThemeSchema,
    contrast: z.enum(["normal", "high"]),
    font: z.enum(["default", "dyslexic"]),
    motion: z.enum(["full", "reduced"]),
    channels: z.object({ push: z.boolean(), email: z.boolean(), sms: z.boolean().optional(), whatsapp: z.boolean().optional() }),
    quietHours: z.object({ start: z.string(), end: z.string() }).nullable(),
  }),
  /** Whether there is a school record to open (the web's /record). */
  showRecord: z.boolean(),
});
export type AccountOverview = z.infer<typeof accountOverviewSchema>;

/**
 * POST /api/v1/account/prefs — the notification section, and appearance if
 * the caller shows it. What is left out is left as it was.
 */
export const accountPrefsSchema = z.object({
  channels: z.object({ push: z.boolean(), email: z.boolean(), sms: z.boolean().optional(), whatsapp: z.boolean().optional() }),
  quietHours: z.object({ start: hhmm, end: hhmm }).nullable(),
  theme: accountThemeSchema.optional(),
  contrast: z.enum(["normal", "high"]).optional(),
  font: z.enum(["default", "dyslexic"]).optional(),
  motion: z.enum(["full", "reduced"]).optional(),
});
export type AccountPrefsBody = z.infer<typeof accountPrefsSchema>;

/** POST /api/v1/account/locale */
export const accountLocaleSchema = z.object({ locale: localeSchema });
export const accountLocaleSavedSchema = z.object({ locale: localeSchema });

/** POST /api/v1/account/avatar — one of the preset drawings; the server refuses anything else. */
export const accountAvatarSchema = z.object({ avatarKey: z.string().min(1).max(80) });

/** POST /api/v1/account/devices/sign-out — one of my OTHER devices. */
export const accountSignOutDeviceSchema = z.object({ sessionId: z.string().min(1).max(80) });

/** POST /api/v1/account/devices/sign-out-others — asked for in so many words, so an empty body never does it. */
export const accountSignOutOthersSchema = z.object({ confirm: z.literal(true) });
export const accountSignedOutSchema = z.object({ count: z.number().int().nonnegative() });

/** POST /api/v1/account/mobile/code — step one: text a code to the number. Nothing is saved yet. */
export const accountMobileCodeSchema = z.object({ phone: z.string().trim().min(1).max(40) });
/** The last digits the code went to, for "sent to the number ending …". */
export const accountMobileCodeSentSchema = z.object({ hint: z.string().nullable() });

/** POST /api/v1/account/email/code — step one: email a code to the address. Nothing changes yet. */
export const accountEmailCodeSchema = z.object({ email: z.string().trim().min(1).max(320) });
export const accountEmailCodeSentSchema = z.object({ sentTo: z.string() });

/** POST /api/v1/account/{mobile|email}/confirm — step two: the code that came back. */
export const accountCodeConfirmSchema = z.object({ code: z.string().trim().min(4).max(12) });

/** DELETE /api/v1/account/mobile — taking the number off needs no code, only meaning it. */
export const accountMobileRemoveSchema = z.object({ confirm: z.literal(true) });

/* -------------------------------------------------------------------------- */
/* Composing a post                                                            */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/account/post-options — what the composer may offer this person. */
export const accountPostOptionsSchema = z.object({
  role: roleSchema,
  classes: z.array(z.object({ id: z.string(), name: z.string() })),
  grades: z.array(z.string()),
  allowSchoolWide: z.boolean(),
  /** A pupil's post is read by a teacher before anyone else sees it. */
  reviewedFirst: z.boolean(),
});

/* -------------------------------------------------------------------------- */
/* An expert booking                                                           */
/* -------------------------------------------------------------------------- */

/** GET /api/v1/account/bookings/{bookingId} — for the expert and for the booking school's staff. */
export const accountBookingSchema = z.object({
  id: z.string(),
  topic: z.string(),
  status: z.string(),
  startsAt: iso,
  endsAt: iso,
  note: z.string().nullable(),
  schoolName: z.string(),
  expertName: z.string(),
  viewerIsExpert: z.boolean(),
  /** Not cancelled and not yet begun — a past hour cannot be released. */
  canCancel: z.boolean(),
  messages: z.array(
    z.object({
      id: z.string(),
      body: z.string(),
      createdAt: iso,
      authorName: z.string(),
      authorAvatar: z.string().nullable(),
      mine: z.boolean(),
    }),
  ),
});
export type AccountBooking = z.infer<typeof accountBookingSchema>;

/** POST /api/v1/account/bookings/{bookingId}/messages */
export const accountBookingMessageSchema = z.object({ body: z.string().trim().min(1).max(5_000) });
