import { filingExportQuerySchema, officeCsvExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { msbshseCandidatesExport } from "@/lib/filings";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/office/filings/export/msbshse-candidates?grade= — the sheet as CSV text for the phone's share sheet. Audited by the library. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = filingExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(officeCsvExportSchema.parse(await msbshseCandidatesExport(ctx, parsed.data.grade)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/filings/export/msbshse-candidates");
  }
}
