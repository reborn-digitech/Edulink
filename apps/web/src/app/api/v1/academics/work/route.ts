import { collegeWorkHomeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { collegeWorkHome } from "@/lib/college-homework";
import { ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/work — the offerings the caller teaches (an HOD: the department's too), each with its homework and what waits to be marked (R-48). */
export async function GET() {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    return ok(collegeWorkHomeSchema.parse(await collegeWorkHome(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/work");
  }
}
