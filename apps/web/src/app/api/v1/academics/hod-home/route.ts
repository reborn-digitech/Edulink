import { hodHomeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { hodHome } from "@/lib/academics-homes";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/hod-home — The HOD's department: load, ratio, offerings with course-file flags and assessment status, defaulters, condonations, mentoring. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("HOD");
    return ok(hodHomeSchema.parse(await hodHome(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/hod-home");
  }
}
