import { absenceNoteCreateSchema, absenceNotesSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { fileAbsenceNote, listAbsenceNotes } from "@/lib/absence-notes";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/family/students/{membershipId}/absence-notes — the coming days away, for a guardian of the child or the pupil themselves. */
export async function GET(_request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiReader();
    const { membershipId } = await params;
    return ok(absenceNotesSchema.parse(await listAbsenceNotes(ctx, membershipId)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/students/absence-notes");
  }
}

/** POST /api/v1/family/students/{membershipId}/absence-notes — tell the school the pupil will be away on a day; a second note for the day replaces the first. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiReader();
    const parsed = absenceNoteCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { membershipId } = await params;
    return ok(absenceNotesSchema.parse(await fileAbsenceNote(ctx, membershipId, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/students/absence-notes");
  }
}
