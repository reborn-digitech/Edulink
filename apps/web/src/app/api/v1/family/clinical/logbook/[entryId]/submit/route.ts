import { streamRecordsIdSchema } from "@edulink/contracts";
import { budget, NOTICE_WRITE_BUDGET, ok } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { moduleFailure } from "@/lib/rule-refusal";
import { submitLogbookEntry } from "@/lib/clinical";

/** POST /api/v1/family/clinical/logbook/{entryId}/submit — the student hands an entry in; a repeat is a no-op (audited clinical.logbook.submit). */
export async function POST(_request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const refused = await budget(`logbook-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const { entryId } = await params;
    return ok(streamRecordsIdSchema.parse(await submitLogbookEntry(ctx, entryId)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/clinical/logbook/[entryId]/submit");
  }
}
