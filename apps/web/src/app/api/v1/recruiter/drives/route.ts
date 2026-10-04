import { recruiterDrivesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { recruiterDrives } from "@/lib/placement-recruiter";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/recruiter/drives — The live drives of the recruiter's company. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("RECRUITER");
    return ok(recruiterDrivesSchema.parse(await recruiterDrives(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/recruiter/drives");
  }
}
