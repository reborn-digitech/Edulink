import { logbookEntrySaveSchema, streamRecordsIdSchema } from "@edulink/contracts";
import { apiInvalid, budget, NOTICE_WRITE_BUDGET, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { moduleFailure } from "@/lib/rule-refusal";
import { saveLogbookEntry } from "@/lib/clinical";

/** POST /api/v1/family/clinical/logbook — a student's new entry, or a DRAFT or RETURNED one corrected; idempotent by clientId (audited clinical.logbook.save). */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const refused = await budget(`logbook-write:${ctx.user.id}`, NOTICE_WRITE_BUDGET.limit, NOTICE_WRITE_BUDGET.windowMs);
    if (refused) return refused;
    const parsed = logbookEntrySaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(streamRecordsIdSchema.parse(await saveLogbookEntry(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/family/clinical/logbook");
  }
}
