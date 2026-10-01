import { totpStartedSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { totpRefusal } from "@/lib/api-two-factor";
import { startTwoFactor } from "@/lib/two-factor";

/**
 * POST /api/v1/account/totp/start — a fresh secret for the authenticator
 * app, as base32 and as the otpauth:// link. Nothing guards the sign-in until
 * /confirm has seen one code from it. The office, the head and the operator
 * only; 403 for everyone else and when the server has no sealing key.
 */
export async function POST() {
  try {
    const ctx = await requireApiSession();
    const result = await startTwoFactor(ctx.user.id);
    if (!result.ok) return totpRefusal(result.reason);
    return ok(totpStartedSchema.parse({ secret: result.secret, uri: result.uri, account: result.account }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/totp/start");
  }
}
