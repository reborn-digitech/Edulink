import { academicsChangedResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { releaseComponent } from "@/lib/academics-assessment";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ componentId: string }> };

/** POST /api/v1/academics/internal/components/{componentId}/release — The HOD releases a countersigned component to the students. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("HOD");
    const p = await params;
    return ok(academicsChangedResultSchema.parse(await releaseComponent(ctx, p.componentId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/internal/components/[componentId]/release");
  }
}
