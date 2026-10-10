import { assistantSettingsSchema, assistantUsageSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { saveAssistantSettings } from "@/lib/assistant/service";

/** POST /api/v1/admin/assistant/settings — the switch (the ASSISTANT module) and the helpline sentence (the office). Never behind the module: it must be able to switch it back on. */
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
