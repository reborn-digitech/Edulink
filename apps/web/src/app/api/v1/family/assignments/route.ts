import { familyChildQuerySchema, familyParentAssignmentsSchema } from "@edulink/contracts";
import { parentAssignments, requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/assignments?childId= — the child's to do, handed in and marked, read-only. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyChildQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyParentAssignmentsSchema.parse(await parentAssignments(ctx, parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/assignments");
  }
}
