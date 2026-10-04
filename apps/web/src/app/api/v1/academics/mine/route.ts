import { studentAcademicsSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { studentAcademics } from "@/lib/academics-homes";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/mine — A student's academics: registration, today and the week, attendance with the projection, condonations, released marks, mentor. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    return ok(studentAcademicsSchema.parse(await studentAcademics(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/mine");
  }
}
