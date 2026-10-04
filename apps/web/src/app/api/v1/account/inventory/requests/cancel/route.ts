import { inventoryRequestCancelSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { cancelMyRequest } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/account/inventory/requests/cancel — take back one of my waiting asks. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole(...SCHOOL_STAFF_ROLES);
    const parsed = inventoryRequestCancelSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await cancelMyRequest(ctx, parsed.data.requestId);
    return ok({ ok: true as const });
  } catch (error) {
    return moduleFailure(error, "api/v1/account/inventory/requests/cancel");
  }
}
