import { trainingDetailSchema, trainingEnrolmentSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { setEnrolment } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ trainingId: string }> };

/** POST /api/v1/placement/trainings/{trainingId}/enrolments — The TPO puts students on the roll or takes them off. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("TPO");
    const p = await params;
    const parsed = trainingEnrolmentSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trainingDetailSchema.parse(await setEnrolment(ctx, p.trainingId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings/[trainingId]/enrolments");
  }
}
