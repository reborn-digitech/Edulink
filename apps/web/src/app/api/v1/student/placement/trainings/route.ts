import { studentTrainingsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { studentTrainings } from "@/lib/soft-skills";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/student/placement/trainings — The student's trainings and the ones completed. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    return ok(studentTrainingsSchema.parse(await studentTrainings(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/trainings");
  }
}
