import { trainingDetailSchema, trainingSessionUpdateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { setSessionCancelled } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ trainingId: string; sessionId: string }> };

/** POST /api/v1/placement/trainings/{trainingId}/sessions/{sessionId} — The TPO cancels a session with no marks, or brings it back. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = trainingSessionUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trainingDetailSchema.parse(await setSessionCancelled(ctx, p.trainingId, p.sessionId, parsed.data.cancelled)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings/[trainingId]/sessions/[sessionId]");
  }
}
