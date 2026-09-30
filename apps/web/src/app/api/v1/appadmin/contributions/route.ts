import { gigQueueQuerySchema, gigQueueSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { listContributionQueue } from "@/lib/gig-questions";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/appadmin/contributions?status= — teachers' questions waiting to be read (the default), or those of another status. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = gigQueueQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(gigQueueSchema.parse(await listContributionQueue(ctx, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/contributions");
  }
}
