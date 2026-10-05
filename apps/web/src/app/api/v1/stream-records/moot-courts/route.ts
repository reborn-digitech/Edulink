import { mootCourtSaveSchema, mootCourtsSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { mootCourts, saveMootCourt } from "@/lib/stream-records";

/** GET /api/v1/stream-records/moot-courts — a law college's moot courts with their teams and results. */
export async function GET() {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "FACULTY");
    return ok(mootCourtsSchema.parse(await mootCourts(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/moot-courts");
  }
}

/** POST /api/v1/stream-records/moot-courts — a moot recorded or corrected (a college with LAW; audited streamRecords.moot.save). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "HOD", "FACULTY");
    const parsed = mootCourtSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await saveMootCourt(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/stream-records/moot-courts");
  }
}
