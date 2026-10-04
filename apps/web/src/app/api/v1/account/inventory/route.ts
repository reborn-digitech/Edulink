import { myInventorySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { ok } from "@/lib/api-v1";
import { myInventory } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/account/inventory — what was issued to me, the assets I hold, my asks. Any member of staff. */
export async function GET() {
  try {
    const ctx = await requireApiRole(...SCHOOL_STAFF_ROLES);
    return ok(myInventorySchema.parse(await myInventory(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/account/inventory");
  }
}
