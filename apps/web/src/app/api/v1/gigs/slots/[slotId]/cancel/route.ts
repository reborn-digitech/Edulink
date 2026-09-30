import { gigSlotCancelBodySchema, okSchema } from "@edulink/contracts";
import { cancelSlot } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../../../guard";

/** POST /api/v1/gigs/slots/{slotId}/cancel — the provider takes their own time back, with a reason each family is told; another provider's is a 404. */
export async function POST(request: Request, { params }: { params: Promise<{ slotId: string }> }) {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    const { slotId } = await params;
    const parsed = gigSlotCancelBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await cancelSlot(ctx, slotId, parsed.data.reason);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/slots/[slotId]/cancel");
  }
}
