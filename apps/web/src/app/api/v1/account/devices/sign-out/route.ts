import { accountSignOutDeviceSchema, okSchema } from "@edulink/contracts";
import { signOutOneDevice } from "@/lib/account";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/account/devices/sign-out — one of my OTHER devices. The one in
 * hand is a 403 (that is the sign-out button, which also clears the device);
 * a session that is not mine, or is already out, is a 404.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = accountSignOutDeviceSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await signOutOneDevice(ctx, parsed.data.sessionId);
    if (!result.ok) throw new AccessError(result.errorKey, result.errorKey === "account.deviceAlreadyOut" ? "NOT_FOUND" : "FORBIDDEN");
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/devices/sign-out");
  }
}
