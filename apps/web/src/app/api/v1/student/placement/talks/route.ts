import { talkListSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { studentTalks } from "@/lib/placement-talks";
import { moduleFailure } from "@/lib/rule-refusal";
import { ok } from "@/lib/api-v1";

/** GET /api/v1/student/placement/talks — The student's talks: those ahead, then the last ones held. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("STUDENT");
    return ok(talkListSchema.parse(await studentTalks(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/student/placement/talks");
  }
}
