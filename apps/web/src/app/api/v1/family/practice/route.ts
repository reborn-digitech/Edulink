import { familyChildQuerySchema, familyParentPracticeSchema } from "@edulink/contracts";
import { parentPractice, requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/practice?childId= — every chapter the child has touched, the rung they stand on, the badges they keep. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyChildQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyParentPracticeSchema.parse(await parentPractice(ctx, parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/practice");
  }
}
