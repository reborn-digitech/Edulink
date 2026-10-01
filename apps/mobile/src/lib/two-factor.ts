/**
 * Two-step sign-in, as the phone sees it: a sign-in door (password, link,
 * SSO exchange) answers either a session or this, and the code screen
 * turns this into the session through POST /api/v1/auth/totp.
 */
export type TwoFactorAnswer = { code: "TWO_FACTOR"; challenge: string };

export function isTwoFactor(data: unknown): data is TwoFactorAnswer {
  return typeof data === "object" && data !== null && (data as { code?: unknown }).code === "TWO_FACTOR" && typeof (data as { challenge?: unknown }).challenge === "string";
}
