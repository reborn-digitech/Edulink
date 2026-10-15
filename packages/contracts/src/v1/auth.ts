import { z } from "zod";
import { localeSchema } from "../locale";
import { institutionKindSchema, schoolModuleSchema } from "./modules";
import { streamSchema } from "./streams";
import { dutySchema } from "./duties";
import { platformFeatureSchema } from "./platform-features";

/**
 * Signing in from the phone. Every sign-in answers with the same session
 * shape; the app stores the token in secure storage and sends it as a bearer.
 */
/**
 * DRIVER, LIBRARIAN, WARDEN and ALUMNUS came with the per-school modules
 * (3 October 2026): each is a Membership at a school, as a teacher is, and
 * reaches only what its module names (see ./modules.ts). The college's seven
 * came on 4 October 2026: FACULTY, HOD, EXAM_CONTROLLER, IQAC, TPO and
 * ACCOUNTS are Memberships at a college behind the same gate; RECRUITER is an
 * outside account like EXPERT, with no school of its own.
 */
export const roleSchema = z.enum([
  "ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS",
  "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS", "RECRUITER",
]);
export type RoleCode = z.infer<typeof roleSchema>;

export const passwordLoginSchema = z.object({
  /** Email, phone or login handle — whatever the person signs in with on the web. */
  identifier: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
  /** A name for the device, shown on the account page's device list. */
  device: z.string().trim().max(120).optional(),
});

export const magicLinkRequestSchema = z.object({ email: z.string().trim().email().max(200) });

export const magicLinkConsumeSchema = z.object({ token: z.string().min(20).max(200), device: z.string().trim().max(120).optional() });

export const firstSignInSchema = z.object({
  handle: z.string().trim().min(1).max(80),
  code: z.string().trim().min(1).max(20),
  password: z.string().min(8).max(200),
  device: z.string().trim().max(120).optional(),
});

/** RFC 7636's code verifier: 43 to 128 of the unreserved characters. */
export const pkceVerifierSchema = z.string().regex(/^[A-Za-z0-9\-._~]{43,128}$/);
/** Its challenge: the SHA-256 of the verifier, base64url without padding — always 43 characters. */
export const pkceChallengeSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);

/**
 * The code from the deep link AND the verifier the app kept to itself when it
 * started the sign-in. The code travels through the system browser and an
 * app link any app may have registered for; the verifier never leaves the
 * app, so the code alone is worth nothing to whoever else receives it.
 */
export const ssoExchangeSchema = z.object({ code: z.string().min(20).max(200), verifier: pkceVerifierSchema, device: z.string().trim().max(120).optional() });

export const sessionResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.string().datetime(),
  sessionId: z.string(),
  context: z.object({ schoolId: z.string().nullable(), role: roleSchema.nullable() }),
});
export type SessionResponse = z.infer<typeof sessionResponseSchema>;

export const okSchema = z.object({ ok: z.literal(true) });

/** GET /api/v1/me */
export const meSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    preferredName: z.string().nullable(),
    email: z.string().nullable(),
    avatarKey: z.string().nullable(),
    isMinor: z.boolean(),
    locale: localeSchema,
    /** Runs the server: the web's /root. No school, no role — the app shows the operator's own screen. */
    isSuperuser: z.boolean().default(false),
    /** The content team: the web's /appadmin. The operator holds this too. */
    isAppAdmin: z.boolean().default(false),
  }),
  active: z.object({ schoolId: z.string().nullable(), role: roleSchema.nullable(), membershipId: z.string().nullable() }),
  /**
   * `institutionKind` per context (4 Oct 2026): what kind of institution that
   * context's school is, so a picker can say "ZZ Vidya College · College";
   * null with no school. Optional, so an older server's answer (and a test's
   * fixture) without it reads as before: the bare name.
   */
  contexts: z.array(z.object({ schoolId: z.string().nullable(), schoolName: z.string().nullable(), role: roleSchema, institutionKind: institutionKindSchema.nullable().optional() })),
  /**
   * The modules the ACTIVE school has switched on; empty with no school on the
   * session. The phone hides a module's tabs and menu entries by it. Defaults
   * to none, so an answer from a server older than the field hides them
   * rather than showing doors that answer MODULE_OFF.
   */
  modules: z.array(schoolModuleSchema).default([]),
  /**
   * What kind of institution the ACTIVE school is (4 Oct 2026): SCHOOL,
   * JUNIOR_COLLEGE, COLLEGE or AUTONOMOUS_COLLEGE; null with no school on the
   * session. An older server says nothing, which reads as a school.
   */
  institutionKind: institutionKindSchema.nullable().default(null),
  /**
   * The ACTIVE college's streams (5 Oct 2026), STREAMS order; empty at a school
   * or with no school. An older server says nothing, which reads as none.
   */
  streams: z.array(streamSchema).default([]),
  /**
   * The duties on the ACTIVE membership (5 Oct 2026) — a FACULTY's or HOD's
   * lab in-charge, squad, NSS and so on; empty for every other role. The phone
   * hides a duty's tabs and cards without it.
   */
  duties: z.array(dutySchema).default([]),
  /**
   * The platform features the operator has switched on (15 Oct 2026; v1/platform-features.ts), for this
   * person: the phone hides a feature's tabs, menu entries and screens by it. Optional: an answer from a
   * server older than the switches says nothing, which reads as "everything as before" (the phone keeps
   * every entry), and an older phone that does not know the field ignores it.
   */
  features: z.array(platformFeatureSchema).optional(),
});
export type Me = z.infer<typeof meSchema>;

export const switchContextSchema = z.object({ schoolId: z.string().max(64).nullable(), role: roleSchema });

export const sessionsListSchema = z.object({
  sessions: z.array(
    z.object({
      id: z.string(),
      device: z.string().nullable(),
      createdAt: z.string().datetime(),
      lastSeenAt: z.string().datetime(),
      current: z.boolean(),
    }),
  ),
});

/** Push: the token Expo's push service gave the app for this device. */
export const deviceRegisterSchema = z.object({
  expoPushToken: z.string().regex(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/),
  platform: z.enum(["ios", "android"]),
  device: z.string().trim().max(120).optional(),
});
export const deviceRemoveSchema = z.object({ expoPushToken: z.string().min(10).max(200) });
