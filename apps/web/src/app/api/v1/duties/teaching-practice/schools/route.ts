import { practiceSchoolSaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { savePracticeSchool } from "@/lib/teaching-practice";

/** POST /api/v1/duties/teaching-practice/schools — a practice school added or corrected (audited duties.teachingPractice.school). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    // The duty desks' writes are budgeted per person (A3-S-15), before the body is read.
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = practiceSchoolSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await savePracticeSchool(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/teaching-practice/schools");
  }
}
