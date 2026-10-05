import { trainingDetailSchema, trainingUpdateSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { trainingDetail, updateTraining } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ trainingId: string }> };

/** GET /api/v1/placement/trainings/{trainingId} — One training: its sessions and its roll with each student's attendance. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    const p = await params;
    return ok(trainingDetailSchema.parse(await trainingDetail(ctx, p.trainingId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings/[trainingId]");
  }
}

/** POST /api/v1/placement/trainings/{trainingId} — The TPO edits a training or closes its enrolment. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = trainingUpdateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trainingDetailSchema.parse(await updateTraining(ctx, p.trainingId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings/[trainingId]");
  }
}
