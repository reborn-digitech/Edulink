import { trainingDetailSchema, trainingListSchema, trainingSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { createTraining, listTrainings } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/placement/trainings — The cell's soft-skills trainings and how many students completed one. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("TPO", "ADMIN", "PRINCIPAL");
    return ok(trainingListSchema.parse(await listTrainings(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings");
  }
}

/** POST /api/v1/placement/trainings — The TPO makes a training. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("TPO");
    const parsed = trainingSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(trainingDetailSchema.parse(await createTraining(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/placement/trainings");
  }
}
