import { assistantSettingsSchema, assistantUsageSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { saveAssistantSettings } from "@/lib/assistant/service";

/**
 * POST /api/v1/admin/assistant/settings — the helpline sentence (the office). Not the switch since 16 Oct 2026: the
 * platform's operator switches the ASSISTANT module on for a school; `on` asking for a change is refused (403,
 * modules.refuseAssistant), `on` naming the current state changes nothing. Never behind the module, so the office
 * can set the sentence before the operator switches it on.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiSession();
    const parsed = assistantSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(assistantUsageSchema.parse(await saveAssistantSettings(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/assistant/settings");
  }
}
