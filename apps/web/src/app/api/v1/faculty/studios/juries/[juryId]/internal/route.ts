import { studioJuryInternalPostedSchema, studioJuryInternalPostSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { postJuryToInternal } from "@/lib/studio";

/** POST /api/v1/faculty/studios/juries/{juryId}/internal — a signed sheet into one of the offering's internal components (audited studio.postInternal). */
export async function POST(request: Request, { params }: { params: Promise<{ juryId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { juryId } = await params;
    const parsed = studioJuryInternalPostSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studioJuryInternalPostedSchema.parse(await postJuryToInternal(ctx, juryId, parsed.data.componentId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/faculty/studios/juries/[juryId]/internal");
  }
}
