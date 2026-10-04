import { deviceRegisterSchema, deviceRemoveSchema } from "@edulink/contracts";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AccessError } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/me/devices — register this phone's Expo push token.
 *
 * Idempotent on the token: a re-registration after an app update moves the
 * token to the signed-in person (the token identifies a device, and a device
 * changes hands in a family) and refreshes lastUsedAt. DELETE removes it, on
 * sign-out or when the person turns push off.
 */
export async function POST(request: Request) {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const parsed = deviceRegisterSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { expoPushToken, platform, device } = parsed.data;
    // Bound to the session that registered it (campaign PH-4): revoking this one device from the web
    // removes its token, and a token whose session has ended is not sent to.
    await db.deviceToken.upsert({
      where: { expoPushToken },
      create: { userId: ctx.user.id, expoPushToken, platform, device: device ?? null, sessionId: ctx.sessionId },
      update: { userId: ctx.user.id, platform, device: device ?? null, failureCount: 0, lastUsedAt: new Date(), sessionId: ctx.sessionId },
    });
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/me/devices");
  }
}

export async function DELETE(request: Request) {
  try {
    const ctx = await getSession();
    if (!ctx) throw new AccessError("access.notSignedIn", "UNAUTHENTICATED");
    const parsed = deviceRemoveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    // Only mine: another person's token is silently not mine to remove.
    await db.deviceToken.deleteMany({ where: { expoPushToken: parsed.data.expoPushToken, userId: ctx.user.id } });
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/me/devices");
  }
}
