import { appraisalSaveSchema, appraisalSavedSchema, substitutionAssignedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { deleteAppraisal, updateAppraisal } from "@/lib/appraisal";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** PUT /api/v1/principal/appraisals/{id} — the head rewrites an entry, whole. */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiRole("PRINCIPAL");
    const { id } = await params;
    const parsed = appraisalSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(appraisalSavedSchema.parse(await updateAppraisal(ctx, id, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/principal/appraisals/entry");
  }
}

/** DELETE /api/v1/principal/appraisals/{id} — the head removes an entry; nothing there is a no-op. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await requireApiRole("PRINCIPAL");
    const { id } = await params;
    return ok(substitutionAssignedSchema.parse(await deleteAppraisal(ctx, id)));
  } catch (error) {
    return apiFailure(error, "api/v1/principal/appraisals/entry");
  }
}
