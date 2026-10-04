import { alumniCollegeSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { alumniCollege } from "@/lib/placement-alumni";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/alumni/college — An alumnus's college additions. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ALUMNUS");
    return ok(alumniCollegeSchema.parse(await alumniCollege(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/alumni/college");
  }
}
