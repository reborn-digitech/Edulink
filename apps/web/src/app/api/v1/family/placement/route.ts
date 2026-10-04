import { familyPlacementQuerySchema, familyPlacementSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { familyPlacement } from "@/lib/placement-student";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/family/placement — A child's offers and internships. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("PARENT");
    const parsed = familyPlacementQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(familyPlacementSchema.parse(await familyPlacement(ctx, q.childId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/placement");
  }
}
