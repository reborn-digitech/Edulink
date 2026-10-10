import { clinicalPostingSaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveClinicalPosting } from "@/lib/clinical";

/** POST /api/v1/duties/clinical/postings — a division or a batch posted to a department under a supervisor, by the coordinator (audited duties.clinical.posting). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = clinicalPostingSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await saveClinicalPosting(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/clinical/postings");
  }
}
