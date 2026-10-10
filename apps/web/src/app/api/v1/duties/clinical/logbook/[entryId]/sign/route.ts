import { logbookSignSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { signLogbookEntry } from "@/lib/clinical";

/** POST /api/v1/duties/clinical/logbook/{entryId}/sign — the posting's supervisor or the coordinator signs a handed-in entry (audited duties.clinical.sign). */
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { entryId } = await params;
    const parsed = logbookSignSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await signLogbookEntry(ctx, entryId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/clinical/logbook/[entryId]/sign");
  }
}
