import { examSquadDeskSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { examSquadDesk } from "@/lib/duty-desks";

/** GET /api/v1/duties/exam-squad — the flying squad's desk: papers and their halls, the squad's visits, the cases of unfair means. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "EXAM_CONTROLLER", "FACULTY", "HOD");
    return ok(examSquadDeskSchema.parse(await examSquadDesk(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/exam-squad");
  }
}
