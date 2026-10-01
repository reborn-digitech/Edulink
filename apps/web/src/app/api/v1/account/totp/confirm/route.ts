import { totpConfirmSchema, totpConfirmedSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { totpRefusal } from "@/lib/api-two-factor";
import { confirmTwoFactor } from "@/lib/two-factor";

/** POST /api/v1/account/totp/confirm — one right code turns it on and answers the eight recovery codes, this once. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = totpConfirmSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await confirmTwoFactor(ctx.user.id, parsed.data.code);
    if (!result.ok) return totpRefusal(result.reason, result.retryAfterSeconds);
    return ok(totpConfirmedSchema.parse({ recoveryCodes: result.recoveryCodes }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/totp/confirm");
  }
}
