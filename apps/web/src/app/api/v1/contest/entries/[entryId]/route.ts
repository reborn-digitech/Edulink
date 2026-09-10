import { okSchema } from "@edulink/contracts";
import { withdrawEntry } from "@/lib/competitions";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * DELETE /api/v1/contest/entries/{entryId} — the pupil withdraws, or their
 * guardian says "Not this time". The entry is deleted (a refused consent must
 * not linger in "who asked" lists) and the school's standing recomputed; the
 * child may ask again. A parent has no membership, so the session is the gate
 * and withdrawEntry decides who: the child, or a proved guardian.
 */
export async function DELETE(_request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { entryId } = await params;
    await withdrawEntry(ctx, entryId);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/contest/entries/[entryId]");
  }
}
