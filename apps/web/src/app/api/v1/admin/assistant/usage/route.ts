import { assistantUsageSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { assistantUsage } from "@/lib/assistant/service";

/** GET /api/v1/admin/assistant/usage — the school's month in counts against its budget, the switch, the helpline (the office and the head). */
export async function GET() {
  try {
    const ctx = await requireApiSession();
    return ok(assistantUsageSchema.parse(await assistantUsage(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/assistant/usage");
  }
}
