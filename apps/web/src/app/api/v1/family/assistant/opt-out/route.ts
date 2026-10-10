import { familyAssistantOptOutSavedSchema, familyAssistantOptOutSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiParent } from "@/lib/api-reads/family";
import { setOptOut } from "@/lib/assistant/service";

/** POST /api/v1/family/assistant/opt-out — turn the assistant off (or back on) for one of my children. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyAssistantOptOutSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyAssistantOptOutSavedSchema.parse(await setOptOut(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/assistant/opt-out");
  }
}
