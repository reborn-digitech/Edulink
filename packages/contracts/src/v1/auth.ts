import { z } from "zod";
import { localeSchema } from "../locale";

/**
 * Signing in from the phone. Every sign-in answers with the same session
 * shape; the app stores the token in secure storage and sends it as a bearer.
 */
export const roleSchema = z.enum(["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "EXPERT"]);
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

export const ssoExchangeSchema = z.object({ code: z.string().min(20).max(200), device: z.string().trim().max(120).optional() });

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
  contexts: z.array(z.object({ schoolId: z.string().nullable(), schoolName: z.string().nullable(), role: roleSchema })),
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
