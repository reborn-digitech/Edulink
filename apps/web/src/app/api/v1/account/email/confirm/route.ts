import { accountCodeConfirmSchema, okSchema } from "@edulink/contracts";
import { confirmEmailChange } from "@/lib/passwords";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefusal } from "@/lib/api-account";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/account/email/confirm — step two: the code moves the address, and the address being left is told. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountCodeConfirmSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    // This session stays; every other device is signed out by the lib.
    const result = await confirmEmailChange(ctx.user.id, parsed.data.code, ctx.sessionId);
    if (!result.ok) return apiRefusal({ errorKey: result.errorKey ?? "refusal.codeWrong", retryAfterSeconds: result.retryAfterSeconds }, "code");
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/email/confirm");
  }
}
