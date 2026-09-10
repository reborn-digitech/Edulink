import { accountSignedOutSchema, accountSignOutOthersSchema } from "@edulink/contracts";
import { signOutOtherDevices } from "@/lib/account";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/** POST /api/v1/account/devices/sign-out-others — every session of mine but this one, asked for in so many words ({ confirm: true }). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountSignOutOthersSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const count = await signOutOtherDevices(ctx);
    return ok(accountSignedOutSchema.parse({ count }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/devices/sign-out-others");
  }
}
