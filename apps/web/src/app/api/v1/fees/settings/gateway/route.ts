import { feeGatewaySaveSchema, feeOkSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { removeGatewayAccount, saveGatewayAccount } from "@/lib/fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/settings/gateway — the school's OWN gateway keys. The two secrets are sealed under FEES_SECRET_KEY and never returned. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeGatewaySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveGatewayAccount(ctx, parsed.data);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/settings/gateway");
  }
}

/** DELETE /api/v1/fees/settings/gateway — remove the keys; online payment stops, nothing else changes. */
export async function DELETE() {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    await removeGatewayAccount(ctx);
    return ok(feeOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/settings/gateway");
  }
}
