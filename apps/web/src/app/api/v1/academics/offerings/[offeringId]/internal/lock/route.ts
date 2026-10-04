import { academicsChangedResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { lockInternal } from "@/lib/academics-assessment";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ offeringId: string }> };

/** POST /api/v1/academics/offerings/{offeringId}/internal/lock — The HOD locks the internal marks; the totals are frozen for the exams module and every change after is 409. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("HOD");
    const p = await params;
    return ok(academicsChangedResultSchema.parse(await lockInternal(ctx, p.offeringId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/offerings/[offeringId]/internal/lock");
  }
}
