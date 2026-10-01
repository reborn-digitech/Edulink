import { familyUnlinkSchema, familyUnlinkedSchema } from "@edulink/contracts";
import { requireApiFamily } from "@/lib/api-reads/family";
import { unlinkChild } from "@/lib/guardianship";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** DELETE /api/v1/family/children/{membershipId}/link — the guardian ends their own link to this child. */
export async function DELETE(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    // A guardian with one child is still a guardian until this answers: the childless gate would refuse the very call that makes them so.
    const ctx = await requireApiFamily();
    const parsed = familyUnlinkSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { membershipId } = await params;
    return ok(familyUnlinkedSchema.parse(await unlinkChild(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/children/link");
  }
}
