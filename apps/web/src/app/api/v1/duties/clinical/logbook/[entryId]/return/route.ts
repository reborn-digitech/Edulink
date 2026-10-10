import { logbookReturnSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRoles } from "@/lib/api-roles";
import { moduleFailure } from "@/lib/rule-refusal";
import { returnLogbookEntry } from "@/lib/clinical";

/** POST /api/v1/duties/clinical/logbook/{entryId}/return — the posting's supervisor or the coordinator returns a handed-in entry with a reason (audited duties.clinical.return). */
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const refused = await budget(`duty-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { entryId } = await params;
    const parsed = logbookReturnSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await returnLogbookEntry(ctx, entryId, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/duties/clinical/logbook/[entryId]/return");
  }
}
