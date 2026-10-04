import { mentoringSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { mentoringView } from "@/lib/academics-mentoring";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/mentoring — Mentoring groups and notes: a mentor's own, an HOD's department's, the student's mentor. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD", "STUDENT", "ADMIN", "PRINCIPAL");
    return ok(mentoringSchema.parse(await mentoringView(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/mentoring");
  }
}
