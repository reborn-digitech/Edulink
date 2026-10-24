import { z } from "zod";
import { sessionResponseSchema } from "./auth";

/**
 * Two-step sign-in (TOTP) for the office, the head and the operator.
 *
 * A sign-in whose first step passed for a person with two-step sign-in on
 * answers 200 with TWO_FACTOR and a challenge instead of a session; the
 * challenge and a code from the authenticator app (or one recovery code)
 * go to POST /api/v1/auth/totp, which answers the session the first step
 * would have.
 */
export const twoFactorResponseSchema = z.object({
  code: z.literal("TWO_FACTOR"),
  /** Five minutes, single use, five wrong codes and it is dead. */
  challenge: z.string().min(20).max(200),
});
export type TwoFactorResponse = z.infer<typeof twoFactorResponseSchema>;

/** What every sign-in door answers: a session, or the second step to take first. */
export const signInResponseSchema = z.union([sessionResponseSchema, twoFactorResponseSchema]);
export type SignInResponse = z.infer<typeof signInResponseSchema>;

/** A six-digit code from the app, or a recovery code (XXXX-XXXX; case and hyphens are the person's). */
export const totpCodeSchema = z.string().trim().min(6).max(12);

export const totpSignInSchema = z.object({
  challenge: z.string().min(20).max(200),
  code: totpCodeSchema,
  device: z.string().trim().max(120).optional(),
});

/** GET /api/v1/account/totp */
export const totpStatusSchema = z.object({
  /** Whether this person may turn it on at all: the office, the head, the operator. */
  eligible: z.boolean(),
  enabled: z.boolean(),
  enabledAt: z.string().datetime().nullable(),
  /** Recovery codes not yet spent; 0 when off. */
  recoveryLeft: z.number().int().min(0),
  /** The server has no key to seal the secret with; enrolment would be refused. */
  available: z.boolean(),
  /**
   * Turning it on asks for the account's password (24 Oct 2026, QA-23); an account with none (a sign-in link or
   * SSO only) is asked to have signed in within the last ten minutes instead. Absent from older servers.
   */
  hasPassword: z.boolean().default(true),
});
export type TotpStatus = z.infer<typeof totpStatusSchema>;

/**
 * POST /api/v1/account/totp/start — the password, which a session alone no longer stands in for (QA-23). Left out
 * by an account with no password, which needs a fresh sign-in instead; left out by one with a password, a 422.
 */
export const totpStartSchema = z.object({ password: z.string().max(256).optional() });
export type TotpStart = z.infer<typeof totpStartSchema>;

/** POST /api/v1/account/totp/start */
export const totpStartedSchema = z.object({
  /** Base32, for typing into an app that cannot scan. */
  secret: z.string(),
  /** otpauth://totp/… for the app to scan or open. */
  uri: z.string(),
  /** The account name the app will show beside the issuer. */
  account: z.string(),
});
export type TotpStarted = z.infer<typeof totpStartedSchema>;

export const totpConfirmSchema = z.object({ code: totpCodeSchema });

/** POST /api/v1/account/totp/confirm: the eight recovery codes, shown once; every other session of the account is signed out (QA-23). */
export const totpConfirmedSchema = z.object({ recoveryCodes: z.array(z.string()).length(8), signedOut: z.number().int().min(0).default(0) });
export type TotpConfirmed = z.infer<typeof totpConfirmedSchema>;

export const totpDisableSchema = z.object({ code: totpCodeSchema });
