import { studioJuryMarksSavedSchema, studioJuryMarksSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveJuryMarks } from "@/lib/studio";

/** POST /api/v1/faculty/studios/juries/{juryId}/marks — a juror on the panel writes marks and remarks; 403 off the panel, 409 once signed (audited studio.marks). */
export async function POST(request: Request, { params }: { params: Promise<{ juryId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { juryId } = await params;
    const parsed = studioJuryMarksSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studioJuryMarksSavedSchema.parse(await saveJuryMarks(ctx, juryId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/faculty/studios/juries/[juryId]/marks");
  }
}
