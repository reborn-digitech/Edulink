import { contestResultSchema, contestResultSetSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { recordResult } from "@/lib/competitions";
import { fieldErrorsOf, resultFieldsSchema } from "@/lib/competition-forms";
import { toMilli } from "@/lib/validation";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { getT } from "@/lib/i18n/server";

/**
 * POST /api/v1/contest/entries/{entryId}/result — staff at the child's own
 * school record a score and a place, as typed. Both empty CLEARS the result;
 * 0 is a real score. The school's standing is recomputed in recordResult.
 */
export async function POST(request: Request, { params }: { params: Promise<{ entryId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "TEACHER");
    const { entryId } = await params;
    const parsed = contestResultSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const fields = resultFieldsSchema(t).safeParse(parsed.data);
    if (!fields.success) {
      const issues = fieldErrorsOf(fields.error);
      return apiRefused({ error: fields.error.issues[0]?.message ?? t("competitions.resultNotValid"), issues });
    }
    const { score, rank } = fields.data;
    await recordResult(ctx, entryId, { scoreMilli: score === null ? null : toMilli(score), rank });
    return ok(contestResultSetSchema.parse({ ok: true, cleared: score === null && rank === null }));
  } catch (error) {
    return apiFailure(error, "api/v1/contest/entries/[entryId]/result");
  }
}
