import { trainingEnrolSelfSchema, trainingSummarySchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { enrolSelf } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

type Params = { params: Promise<{ trainingId: string }> };

/** POST /api/v1/student/placement/trainings/{trainingId}/enrol — The student enrols (OPEN, a seat left) or withdraws. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRoles("STUDENT");
    const p = await params;
    const parsed = trainingEnrolSelfSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trainingSummarySchema.parse(await enrolSelf(ctx, p.trainingId, parsed.data.enrol)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/trainings/[trainingId]/enrol");
  }
}
