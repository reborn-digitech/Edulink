import { examActionResultSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { issueHallTickets } from "@/lib/exam-cell";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/hall-tickets — Hall tickets for every approved form that has none. */
export async function POST(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    return ok(examActionResultSchema.parse(await issueHallTickets(ctx, p.sessionId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/hall-tickets");
  }
}
