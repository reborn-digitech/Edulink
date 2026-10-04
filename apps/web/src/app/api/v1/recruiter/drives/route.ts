import { recruiterDrivesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recruiterDrives } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { budget, HEAVY_READ_BUDGET, ok } from "@/lib/api-v1";

/** GET /api/v1/recruiter/drives — The live drives of the recruiter's company. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    const refused = await budget(`heavy:${ctx.user.id}`, HEAVY_READ_BUDGET.limit, HEAVY_READ_BUDGET.windowMs);
    if (refused) return refused;
    return ok(recruiterDrivesSchema.parse(await recruiterDrives(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/drives");
  }
}
