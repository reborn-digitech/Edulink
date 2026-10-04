import { academicsChangedResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { removeTimetableSlot } from "@/lib/academics";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ slotId: string }> };

/** POST /api/v1/academics/timetable/{slotId}/remove — Take one weekly hour off the grid. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const p = await params;
    return ok(academicsChangedResultSchema.parse(await removeTimetableSlot(ctx, p.slotId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/timetable/[slotId]/remove");
  }
}
