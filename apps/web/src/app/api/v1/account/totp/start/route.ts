import { totpStartedSchema, totpStartSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { totpRefusal } from "@/lib/api-two-factor";
import { startTwoFactor } from "@/lib/two-factor";

/**
 * POST /api/v1/account/totp/start — a fresh secret for the authenticator
 * app, as base32 and as the otpauth:// link. Nothing guards the sign-in until
 * /confirm has seen one code from it. The office, the head and the operator
 * only — by the account's memberships, not the session's active role, since
 * the secret guards every sign-in whatever context follows (two-factor.ts);
 * 403 for everyone else and when the server has no sealing key.
 *
 * The session alone does not start it (QA-23, 24 Oct 2026): the body carries
 * the account's password (422 on the `password` field when it is missing or
 * wrong, 429 past the per-person limit), and an account with no password is
 * answered 403 unless its session was signed in within ten minutes.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = totpStartSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    const result = await startTwoFactor(ctx.user.id, { password: parsed.data.password ?? null, sessionId: ctx.sessionId });
    if (!result.ok) return totpRefusal(result.reason, result.reason === "rate" ? result.retryAfterSeconds : undefined);
    return ok(totpStartedSchema.parse({ secret: result.secret, uri: result.uri, account: result.account }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/totp/start");
  }
}
