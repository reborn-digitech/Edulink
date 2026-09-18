import { messagingOkSchema, messagingSettingsSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveMessagingSettings } from "@/lib/messaging";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/messaging/settings — the channel switches, the monthly cap and the event switches; what is left out is left as it was. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = messagingSettingsSaveSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    await saveMessagingSettings(ctx, parsed.data);
    return ok(messagingOkSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/messaging/settings");
  }
}
