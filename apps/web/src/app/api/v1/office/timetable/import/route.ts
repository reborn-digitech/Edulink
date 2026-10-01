import { timetableImportBodySchema, timetableImportResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { commitTimetableImport } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/office/timetable/import — write the sheet: every resolved
 * row upserted on (class, day, period) in one tenant transaction, a row
 * whose teacher could not be honoured written without one. The same sheet
 * twice leaves the same grid.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = timetableImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(timetableImportResultSchema.parse(await commitTimetableImport(ctx, parsed.data.csv)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/timetable/import");
  }
}
