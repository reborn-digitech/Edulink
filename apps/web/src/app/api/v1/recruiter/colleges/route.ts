import { recruiterCollegesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recruiterColleges } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/recruiter/colleges — The placement directory. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    return ok(recruiterCollegesSchema.parse(await recruiterColleges(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/colleges");
  }
}
