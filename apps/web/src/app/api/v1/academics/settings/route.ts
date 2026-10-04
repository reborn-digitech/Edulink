import { academicsSettingsSaveSchema, academicsSettingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveAcademicsSettings } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/academics/settings — The office sets the faculty load band, the AICTE ratio shown and mentees per mentor. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = academicsSettingsSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsSettingsSchema.parse(await saveAcademicsSettings(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/settings");
  }
}
