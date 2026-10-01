import { familyFeeEnrolBodySchema, familyFeeEnrolledSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { selfEnrolPlan } from "@/lib/fees-family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/family/fees/plans/enrol {student, planId} — put the child on an open structure; refused once a plan is assigned or anything is paid. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyFeeEnrolBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await selfEnrolPlan(ctx, parsed.data);
    return ok(familyFeeEnrolledSchema.parse({ ok: true, ...result }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/fees/plans/enrol");
  }
}
