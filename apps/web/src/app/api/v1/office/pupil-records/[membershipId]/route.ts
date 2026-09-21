import { pupilRecordSaveSchema, pupilRecordViewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { pupilRecordFor, savePupilRecord } from "@/lib/pupil-records";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/office/pupil-records/{membershipId} — one pupil's record. */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    return ok(pupilRecordViewSchema.parse(await pupilRecordFor(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records/[membershipId]");
  }
}

/** POST /api/v1/office/pupil-records/{membershipId} — the office corrects it. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    const parsed = pupilRecordSaveSchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(pupilRecordViewSchema.parse(await savePupilRecord(ctx, membershipId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records/[membershipId]");
  }
}
