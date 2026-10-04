import { facultyHomeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { facultyHome } from "@/lib/academics-homes";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/faculty-home — A faculty member's day: today's lectures, offerings with coverage and marks status, load, components to countersign. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(facultyHomeSchema.parse(await facultyHome(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/faculty-home");
  }
}
