import { familyChildQuerySchema, familyParentOverviewSchema } from "@edulink/contracts";
import { parentOverview, requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/overview?childId= — the guardian's dashboard for one child; the first child when none is named. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyChildQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyParentOverviewSchema.parse(await parentOverview(ctx, parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/overview");
  }
}
