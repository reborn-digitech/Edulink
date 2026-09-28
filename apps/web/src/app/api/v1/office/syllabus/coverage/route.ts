import { syllabusCoverageSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { syllabusCoverage } from "@/lib/syllabus";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/syllabus/coverage — the head's picture. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(syllabusCoverageSchema.parse(await syllabusCoverage(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/syllabus/coverage");
  }
}
