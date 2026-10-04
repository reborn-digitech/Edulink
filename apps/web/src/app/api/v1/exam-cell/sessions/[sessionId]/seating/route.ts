import { examActionResultSchema, examSeatingBuildSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { buildSeating } from "@/lib/exam-cell";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ sessionId: string }> };

/** POST /api/v1/exam-cell/sessions/{sessionId}/seating — Seat a paper (or all) on alternate seats; answers how many did not fit. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("EXAM_CONTROLLER");
    const p = await params;
    const parsed = examSeatingBuildSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(examActionResultSchema.parse(await buildSeating(ctx, p.sessionId, b.scheduleId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/exam-cell/sessions/[sessionId]/seating");
  }
}
