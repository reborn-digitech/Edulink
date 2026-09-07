import { familyExamsSchema } from "@edulink/contracts";
import { familyExams, requireApiReader } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/exams — marks as they come in, the sittings still ahead, and the report cards, for a pupil or across a guardian's children. */
export async function GET() {
  try {
    const ctx = await requireApiReader();
    return ok(familyExamsSchema.parse(await familyExams(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/exams");
  }
}
