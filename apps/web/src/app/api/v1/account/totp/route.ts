import { totpStatusSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { twoFactorStatus } from "@/lib/two-factor";

/** GET /api/v1/account/totp — whether two-step sign-in is on for me, and whether I may turn it on. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    const status = await twoFactorStatus(ctx.user.id);
    return ok(totpStatusSchema.parse({ ...status, enabledAt: status.enabledAt?.toISOString() ?? null }));
  } catch (error) {
    return apiFailure(error, "api/v1/account/totp");
  }
}
