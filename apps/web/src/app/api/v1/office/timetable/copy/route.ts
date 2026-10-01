import { timetableCopyBodySchema, timetableCopyResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { copyWeekToSections } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/office/timetable/copy — one section's week onto its sister sections, teachers left blank for the office to fill. Overwrites each sister's week. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = timetableCopyBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await copyWeekToSections(ctx, parsed.data.fromClassId, parsed.data.toClassIds);
    if (!result.ok) return apiRefused(result);
    return ok(timetableCopyResultSchema.parse({ copied: result.copied, unstaffed: result.unstaffed, classes: result.classes }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/timetable/copy");
  }
}
