import { staffExamSheetsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffExamSheets } from "@/lib/api-reads/staff";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/exams/sheets — the shared /exams page for staff: every date sheet, and the classes whose report cards they may build. */
export async function GET() {
  try {
    const ctx = await requireApiRole("TEACHER", "PRINCIPAL", "ADMIN");
    return ok(staffExamSheetsSchema.parse(await staffExamSheets(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/exams/sheets");
  }
}
