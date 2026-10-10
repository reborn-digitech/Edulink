import { studioSubmissionSavedSchema, studioSubmissionSaveSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveStudioSubmission } from "@/lib/studio";

/** POST /api/v1/family/studios/{studioId}/submissions — a student's work for a stage: a note, a file by upload ticket, sent or kept as a draft (audited studio.submit). */
export async function POST(request: Request, { params }: { params: Promise<{ studioId: string }> }) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { studioId } = await params;
    const parsed = studioSubmissionSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(studioSubmissionSavedSchema.parse(await saveStudioSubmission(ctx, studioId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/studios/[studioId]/submissions");
  }
}
