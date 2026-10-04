import { internalSheetSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { internalSheet } from "@/lib/academics-assessment";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** GET /api/v1/academics/offerings/{offeringId}/internal — An offering's internal assessment: components, weights, marks, countersign, release, lock. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(internalSheetSchema.parse(await internalSheet(ctx, p.offeringId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/internal");
  }
}
