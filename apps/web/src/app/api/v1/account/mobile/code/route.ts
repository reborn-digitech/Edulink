import { accountMobileCodeSchema, accountMobileCodeSentSchema } from "@edulink/contracts";
import { startPhoneChange } from "@/lib/passwords";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefusal } from "@/lib/api-account";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/account/mobile/code — step one of the web's sendMobileCode,
 * through the same startPhoneChange: nothing is saved, a code is texted, and
 * the per-account limit is the web's own (a 429 with Retry-After here).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountMobileCodeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await startPhoneChange(ctx.user.id, parsed.data.phone, parsed.data.password);
    if (!result.ok) return apiRefusal({ errorKey: result.errorKey ?? "common.checkTheForm", retryAfterSeconds: result.retryAfterSeconds }, result.errorKey === "refusal.needsPassword" ? "password" : "phone");
    return ok(accountMobileCodeSentSchema.parse({ hint: result.hint || null }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/mobile/code");
  }
}
