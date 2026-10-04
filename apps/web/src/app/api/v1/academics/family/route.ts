import { familyAcademicsQuerySchema, familyAcademicsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { familyAcademics } from "@/lib/academics-homes";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/family — A child's lecture attendance: a minor's always, an adult's only with ATTENDANCE granted. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("PARENT");
    const parsed = familyAcademicsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(familyAcademicsSchema.parse(await familyAcademics(ctx, q.childId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/family");
  }
}
