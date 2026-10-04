import { placementSettingsSchema, placementSettingsViewSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { placementSettingsFor, savePlacementSettings } from "@/lib/placement";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/placement/settings — The cell's settings. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(placementSettingsViewSchema.parse(await placementSettingsFor(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/settings");
  }
}

/** POST /api/v1/placement/settings — The TPO sets the season's batch, the dream ratio and the gender switch. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO");
    const parsed = placementSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(placementSettingsViewSchema.parse(await savePlacementSettings(ctx, b)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/settings");
  }
}
