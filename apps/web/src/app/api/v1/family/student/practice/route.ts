import { familyStudentPracticeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { studentPractice } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/student/practice — every topic with this child's own progress, and the cards above the list. Answers go to /api/practice/answer. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(familyStudentPracticeSchema.parse(await studentPractice(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/practice");
  }
}
