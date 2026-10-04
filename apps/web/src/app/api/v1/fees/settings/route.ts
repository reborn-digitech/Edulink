import { feeOkSchema, feeSettingsSaveSchema, feeSettingsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveFeeSettings } from "@/lib/fees";
import { feesSettingsRead } from "@/lib/api-reads/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/fees/settings — how this school's families pay. The gateway's key id only; its secrets are sealed and never read back. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    return ok(feeSettingsSchema.parse(await feesSettingsRead(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/settings");
  }
}

/** POST /api/v1/fees/settings — the UPI id and payee, the receipt prefix, the bank note. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeSettingsSaveSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    await saveFeeSettings(ctx, parsed.data);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/settings");
  }
}
