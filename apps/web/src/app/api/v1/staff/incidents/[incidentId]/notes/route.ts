import { incidentNoteCreateSchema, incidentSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { addIncidentNote } from "@/lib/incidents";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/incidents/{incidentId}/notes — a follow-up note while the incident is open. */
export async function POST(request: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { incidentId } = await params;
    const parsed = incidentNoteCreateSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(incidentSchema.parse(await addIncidentNote(ctx, incidentId, parsed.data.body)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/incidents/notes");
  }
}
