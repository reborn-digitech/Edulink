import { recordCopyPreviewSchema, recordCopyResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { copyPreviousRecord, recordCopyPreview } from "@/lib/record-copy";
import { apiFailure, ok } from "@/lib/api-v1";

/** GET /api/v1/office/pupil-records/{membershipId}/copy-previous — the coded lines the previous school's record would carry over, or null with no previous record (R-69). */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { membershipId } = await params;
    const preview = await recordCopyPreview(ctx, membershipId);
    return ok(preview === null ? null : recordCopyPreviewSchema.parse(preview));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records/[membershipId]/copy-previous");
  }
}

/** POST — the one click: the blank lines filled from the previous school's record, audited at both schools, the guardians told. */
export async function POST(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    return ok(recordCopyResultSchema.parse(await copyPreviousRecord(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/office/pupil-records/[membershipId]/copy-previous");
  }
}
