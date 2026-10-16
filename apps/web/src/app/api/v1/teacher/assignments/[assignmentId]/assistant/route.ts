import { assignmentAssistantSaveSchema, assignmentAssistantSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { requireApiRoles } from "@/lib/api-roles";
import { assignmentSwitch, setAssignmentSwitch } from "@/lib/assistant/service";

type Params = { params: Promise<{ assignmentId: string }> };

/** GET /api/v1/teacher/assignments/{assignmentId}/assistant — whether a second ask gets the worked answer (a teacher of the assignment's class or offering). */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiSession();
    const { assignmentId } = await params;
    return ok(assignmentAssistantSchema.parse(await assignmentSwitch(ctx, assignmentId)));
  } catch (error) {
    return apiFailure(error, "api/v1/teacher/assignments/[assignmentId]/assistant");
  }
}

/** POST /api/v1/teacher/assignments/{assignmentId}/assistant — the per-assignment switch. A role the catalog does not name is refused 403 before the body is read (it was a 422 for an empty body: the API sweep, 16 Oct 2026). */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TEACHER", "FACULTY", "HOD");
    const parsed = assignmentAssistantSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { assignmentId } = await params;
    return ok(assignmentAssistantSchema.parse(await setAssignmentSwitch(ctx, assignmentId, parsed.data.workedAnswerOnSecondAsk)));
  } catch (error) {
    return apiFailure(error, "api/v1/teacher/assignments/[assignmentId]/assistant");
  }
}
