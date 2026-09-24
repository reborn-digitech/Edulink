import { accountEmailCodeSchema, accountEmailCodeSentSchema } from "@edulink/contracts";
import { startEmailChange } from "@/lib/passwords";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefusal } from "@/lib/api-account";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/account/email/code — step one of the web's sendEmailCode,
 * through the same startEmailChange: nothing changes yet, a code is mailed to
 * the new address, and the per-account limit is the web's own.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountEmailCodeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await startEmailChange(ctx.user.id, parsed.data.email, parsed.data.password);
    if (!result.ok) return apiRefusal({ errorKey: result.errorKey ?? "common.checkTheForm", retryAfterSeconds: result.retryAfterSeconds }, result.errorKey === "refusal.needsPassword" ? "password" : "email");
    return ok(accountEmailCodeSentSchema.parse({ sentTo: result.sentTo }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/email/code");
  }
}
