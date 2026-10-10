import { assistantStatusSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { assistantStatus } from "@/lib/assistant/service";
import { assistantFailure } from "@/lib/assistant/http";

/** GET /api/v1/assistant — whether I may use the assistant now, why not as a code, and whether the tutor is mine. Not behind the module, so it can say MODULE_OFF. */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(assistantStatusSchema.parse(await assistantStatus(ctx)));
  } catch (error) {
    return assistantFailure(error, "api/v1/assistant");
  }
}
