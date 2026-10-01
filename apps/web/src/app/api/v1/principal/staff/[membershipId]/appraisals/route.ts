import { appraisalSaveSchema, appraisalSavedSchema, appraisalsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createAppraisal, staffAppraisals } from "@/lib/appraisal";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/principal/staff/{membershipId}/appraisals — one member of staff's timeline, newest first; the head's and the office's read. */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const { membershipId } = await params;
    return ok(appraisalsSchema.parse(await staffAppraisals(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/principal/staff/appraisals");
  }
}

/** POST /api/v1/principal/staff/{membershipId}/appraisals — the head writes an observation, a target or an appraisal. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("PRINCIPAL");
    const { membershipId } = await params;
    const parsed = appraisalSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(appraisalSavedSchema.parse(await createAppraisal(ctx, membershipId, parsed.data)), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/principal/staff/appraisals");
  }
}
