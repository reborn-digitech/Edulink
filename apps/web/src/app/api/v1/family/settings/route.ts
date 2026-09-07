import { familySettingsSaveSchema, familySettingsSchema, okSchema } from "@edulink/contracts";
import { familySettings, requireApiParent, saveFamilySettings } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { fieldFailure } from "../_shared";

/** GET /api/v1/family/settings — the channels a guardian is reached on, the hours they are left alone, the children they hear about. */
export async function GET() {
  try {
    const ctx = await requireApiParent();
    return ok(familySettingsSchema.parse(await familySettings(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/settings");
  }
}

/** POST /api/v1/family/settings — save the notification channels and quiet hours; appearance is untouched. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familySettingsSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await saveFamilySettings(ctx, parsed.data);
    if (!result.ok) return fieldFailure(result.issues);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/settings");
  }
}
