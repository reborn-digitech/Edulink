import { teachingPracticeDeskSchema } from "@edulink/contracts";
import { ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { teachingPracticeDesk } from "@/lib/teaching-practice";

/** GET /api/v1/duties/teaching-practice — the teaching-practice coordinator's desk: practice schools, postings with the lessons watched, the year's NCTE weeks. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "FACULTY", "HOD");
    return ok(teachingPracticeDeskSchema.parse(await teachingPracticeDesk(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/teaching-practice");
  }
}
