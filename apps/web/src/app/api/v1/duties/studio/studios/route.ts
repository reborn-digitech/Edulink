import { studioIdSchema, studioSaveSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveStudio } from "@/lib/studio";

/** POST /api/v1/duties/studio/studios — a studio and its stage days, new or corrected by its id (audited studio.save). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "FACULTY", "HOD");
    // The duty desks' writes are budgeted per person (A3-S-15), before the body is read.
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = studioSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studioIdSchema.parse(await saveStudio(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/studio/studios");
  }
}
