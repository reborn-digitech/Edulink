import { accountAvatarSchema, okSchema } from "@edulink/contracts";
import { setOwnAvatar } from "@/lib/account";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefusal } from "@/lib/api-account";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/account/avatar — one of the preset drawings; anything else is a 422, as setOwnAvatar refuses it. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountAvatarSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setOwnAvatar(ctx, parsed.data.avatarKey);
    if (!result.ok) return apiRefusal({ errorKey: result.errorKey }, "avatarKey");
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/avatar");
  }
}
