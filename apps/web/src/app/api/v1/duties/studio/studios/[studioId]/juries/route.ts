import { studioIdSchema, studioJurySaveSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveJury } from "@/lib/studio";

/** POST /api/v1/duties/studio/studios/{studioId}/juries — a jury on a day with its panel, new or corrected while unsigned (audited studio.jury). */
export async function POST(request: Request, { params }: { params: Promise<{ studioId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { studioId } = await params;
    const parsed = studioJurySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studioIdSchema.parse(await saveJury(ctx, studioId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/studio/studios/[studioId]/juries");
  }
}
