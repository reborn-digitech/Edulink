import { academicsChangedResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { moderateComponent } from "@/lib/academics-assessment";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ componentId: string }> };

/** POST /api/v1/academics/internal/components/{componentId}/moderate — A second member of the department countersigns a component's marks. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const p = await params;
    return ok(academicsChangedResultSchema.parse(await moderateComponent(ctx, p.componentId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/internal/components/[componentId]/moderate");
  }
}
