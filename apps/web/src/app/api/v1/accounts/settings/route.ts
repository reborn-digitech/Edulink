import { accountsSettingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { accountsSettingsFor, saveOfficeSettings } from "@/lib/college-fees";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/accounts/settings — The office's concession limit. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ACCOUNTS", "ADMIN", "PRINCIPAL");
    return ok(accountsSettingsSchema.parse(await accountsSettingsFor(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/settings");
  }
}

/** POST /api/v1/accounts/settings — Set the concession limit above which the principal approves. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = accountsSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(accountsSettingsSchema.parse(await saveOfficeSettings(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/accounts/settings");
  }
}
