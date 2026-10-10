import { familyPreviousSchoolsQuerySchema, previousSchoolsViewSchema } from "@edulink/contracts";
import { requireApiReader, selectChild } from "@/lib/api-reads/family";
import { previousSchoolsFor } from "@/lib/previous-schools";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/family/record/previous-schools?childId — the child's previous schools: each leaving certificate and its published report cards, as the family may read them (R-70). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyPreviousSchoolsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const id = ctx.role === "STUDENT" ? ctx.membershipId! : (await selectChild(ctx, parsed.data.childId)).selectedId;
    return ok(previousSchoolsViewSchema.parse(await previousSchoolsFor(ctx, id)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/record/previous-schools");
  }
}
