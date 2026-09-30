import { gigProviderSchema, gigSlotBodySchema, gigSlotMadeSchema } from "@edulink/contracts";
import { mySlots, offerSlot } from "@/lib/gig-sessions";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { refused } from "@/app/api/v1/shared/helpers";
import { requireGigRole } from "../guard";

/** GET /api/v1/gigs/slots — a provider's offered times, who has a seat in each, and what they have given free. */
export async function GET() {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    return ok(gigProviderSchema.parse(await mySlots(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/slots");
  }
}

/** POST /api/v1/gigs/slots — offer a time. A teacher whose school has not switched guidance on, and an expert off the list, are refused with a 403. */
export async function POST(request: Request) {
  try {
    const ctx = await requireGigRole("EXPERT", "TEACHER");
    const parsed = gigSlotBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await offerSlot(ctx, parsed.data);
    if (!result.ok) return refused(result.errorKey, result.vars);
    return ok(gigSlotMadeSchema.parse({ slotId: result.slotId }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/gigs/slots");
  }
}
