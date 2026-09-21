import { officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { udiseEnrolmentExport } from "@/lib/filings";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/filings/export/udise-enrolment — the sheet as CSV text for the phone's share sheet. Audited by the library. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(officeCsvExportSchema.parse(await udiseEnrolmentExport(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/filings/export/udise-enrolment");
  }
}
