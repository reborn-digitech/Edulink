import { familyAssistantSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiParent } from "@/lib/api-reads/family";
import { familyAssistant } from "@/lib/assistant/service";

/** GET /api/v1/family/assistant — each of my children: their school's switch and my opt-out. */
export async function GET() {
  try {
    const ctx = await requireApiParent();
    return ok(familyAssistantSchema.parse(await familyAssistant(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/assistant");
  }
}
