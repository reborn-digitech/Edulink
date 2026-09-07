import { familyStudentOverviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { studentOverview } from "@/lib/api-reads/family";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/family/student/overview — the pupil's Today page: attendance, the day's lessons, what is due, the latest exam marks. */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(familyStudentOverviewSchema.parse(await studentOverview(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/overview");
  }
}
