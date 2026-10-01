import { okSchema, totpDisableSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { totpRefusal } from "@/lib/api-two-factor";
import { disableTwoFactor } from "@/lib/two-factor";

/** POST /api/v1/account/totp/disable — a code from the app or a recovery code turns it off. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = totpDisableSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await disableTwoFactor(ctx.user.id, parsed.data.code);
    if (!result.ok) return totpRefusal(result.reason, result.retryAfterSeconds);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/totp/disable");
  }
}
