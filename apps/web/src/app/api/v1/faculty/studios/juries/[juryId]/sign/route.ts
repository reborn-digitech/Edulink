import { studioJurySignedSchema } from "@edulink/contracts";
import { budget, NOTICE_WRITE_BUDGET, ok } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { signJury } from "@/lib/studio";

/** POST /api/v1/faculty/studios/juries/{juryId}/sign — the chair signs the sheet; a signed one answers as it stands (audited studio.sign). */
export async function POST(_request: Request, { params }: { params: Promise<{ juryId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { juryId } = await params;
    return ok(studioJurySignedSchema.parse(await signJury(ctx, juryId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/faculty/studios/juries/[juryId]/sign");
  }
}
