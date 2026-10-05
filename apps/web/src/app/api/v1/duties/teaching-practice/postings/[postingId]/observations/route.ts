import { lessonObservationSaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { addLessonObservation } from "@/lib/teaching-practice";

/** POST /api/v1/duties/teaching-practice/postings/{postingId}/observations — a lesson watched by the coordinator (audited duties.teachingPractice.observe). */
export async function POST(request: Request, { params }: { params: Promise<{ postingId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    // The duty desks' writes are budgeted per person (A3-S-15), before the body is read.
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { postingId } = await params;
    const parsed = lessonObservationSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await addLessonObservation(ctx, postingId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/teaching-practice/postings/[postingId]/observations");
  }
}
