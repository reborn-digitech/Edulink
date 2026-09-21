import { officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { udiseTeachersExport } from "@/lib/filings";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/filings/export/udise-teachers — the sheet as CSV text for the phone's share sheet. Audited by the library. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(officeCsvExportSchema.parse(await udiseTeachersExport(ctx)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/filings/export/udise-teachers");
  }
}
