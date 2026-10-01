import { timetableImportBodySchema, timetableImportPreviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { previewTimetableImport } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/timetable/import/preview — what a pasted timetable
 * sheet would write: every row resolved against the school's periods,
 * classes and staff, every cell that cannot be with its line and reason.
 * Writes nothing.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = timetableImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(timetableImportPreviewSchema.parse(await previewTimetableImport(ctx, parsed.data.csv)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/timetable/import/preview");
  }
}
