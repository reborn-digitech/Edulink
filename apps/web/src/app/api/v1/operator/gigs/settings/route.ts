import { gigSettingsSavedSchema, gigSettingsSchema } from "@edulink/contracts";
import { requireApiOperator } from "@/lib/tenancy";
import { saveGigSettings } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";

/** POST /api/v1/operator/gigs/settings — the rate, the unpaid first ones, a teacher's monthly limit, the monthly budget and the sending limits. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiOperator();
    const parsed = gigSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await saveGigSettings(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigSettingsSavedSchema.parse({ settings: result.settings }));
  } catch (error) {
    return apiFailure(error, "api/v1/operator/gigs/settings");
  }
}
