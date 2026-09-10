import { officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { enrolmentExport } from "@/lib/attendance-export";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/attendance/export/enrolment — the enrolment summary an annual return asks for, as CSV text. No child is named in it. Audited. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(officeCsvExportSchema.parse(await enrolmentExport(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/attendance/export/enrolment");
  }
}
