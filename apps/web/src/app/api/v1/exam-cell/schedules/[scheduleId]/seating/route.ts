import { examSeatingSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { seatingView } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ scheduleId: string }> };

/** GET /api/v1/exam-cell/schedules/{scheduleId}/seating — Who sits where for one paper. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(examSeatingSchema.parse(await seatingView(ctx, p.scheduleId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/schedules/[scheduleId]/seating");
  }
}
