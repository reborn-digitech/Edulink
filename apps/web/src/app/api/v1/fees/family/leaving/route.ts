import { familyLeavingQuerySchema, familyLeavingSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { familyLeavingOutcome } from "@/lib/leaving-settlement";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/family/leaving?childId — the outcome of the office's settlement on leaving: what was cancelled and what stays owed (R-61 Q2). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyLeavingQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyLeavingSchema.parse(await familyLeavingOutcome(ctx, parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family/leaving");
  }
}
