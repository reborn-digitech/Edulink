import { accountMobileRemoveSchema, okSchema } from "@edulink/contracts";
import { removePhone } from "@/lib/passwords";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefusal } from "@/lib/api-account";
import { requireApiSession } from "@/lib/api-reads/shared";

/** DELETE /api/v1/account/mobile — the web's clearMobile: no code needed, only { confirm: true }. Spends any code still waiting. */
export async function DELETE(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountMobileRemoveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await removePhone(ctx.user.id);
    if (!result.ok) return apiRefusal({ errorKey: result.errorKey ?? "common.checkTheForm", retryAfterSeconds: result.retryAfterSeconds }, "phone");
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/mobile");
  }
}
