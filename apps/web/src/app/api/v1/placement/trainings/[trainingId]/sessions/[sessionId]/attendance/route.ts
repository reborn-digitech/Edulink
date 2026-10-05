import { trainingAttendanceResultSchema, trainingAttendanceSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { markTrainingSession } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ trainingId: string; sessionId: string }> };

/** POST /api/v1/placement/trainings/{trainingId}/sessions/{sessionId}/attendance — The TPO marks a session once it has started. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = trainingAttendanceSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trainingAttendanceResultSchema.parse(await markTrainingSession(ctx, p.trainingId, p.sessionId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings/[trainingId]/sessions/[sessionId]/attendance");
  }
}
