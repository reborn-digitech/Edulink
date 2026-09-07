import { staffExamsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffExams } from "@/lib/api-reads/staff";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/exams — the classes this person may enter marks for, with the series and papers that fit. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN");
    return ok(staffExamsSchema.parse(await staffExams(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/exams");
  }
}
