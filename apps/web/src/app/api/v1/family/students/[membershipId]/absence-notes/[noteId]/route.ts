import { absenceNotesSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { deleteAbsenceNote } from "@/lib/absence-notes";
import { apiFailure, ok } from "@/lib/api-v1";

/** DELETE /api/v1/family/students/{membershipId}/absence-notes/{noteId} — its author takes a note back before the day's register has marked the pupil. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ membershipId: string; noteId: string }> }) {
  try {
    const ctx = await requireApiReader();
    const { membershipId, noteId } = await params;
    return ok(absenceNotesSchema.parse(await deleteAbsenceNote(ctx, membershipId, noteId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/students/absence-notes/note");
  }
}
