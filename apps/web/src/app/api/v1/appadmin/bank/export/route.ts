import { bankExportQuerySchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { exportBank } from "@/lib/bank-tools";
import { exportResponse } from "@/lib/export-file";
import { apiFailure, apiInvalid, budget } from "@/lib/api-v1";

/** Twenty an hour a person: the whole bank is a few megabytes and a page of nothing else. */
const BANK_EXPORT_BUDGET = { limit: 20, windowMs: 60 * 60 * 1000 };

/** GET /api/v1/appadmin/bank/export?subject=&grade=&format=csv|xlsx — the bank as the sheet the import reads. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = bankExportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const refused = await budget(`bank-export:${ctx.user.id}`, BANK_EXPORT_BUDGET.limit, BANK_EXPORT_BUDGET.windowMs);
    if (refused) return refused;
    const file = await exportBank(ctx, { subject: parsed.data.subject, grade: parsed.data.grade });
    return exportResponse(request, file);
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/export");
  }
}
