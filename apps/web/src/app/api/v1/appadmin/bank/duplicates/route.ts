import { bankDuplicatesSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { findDuplicates } from "@/lib/bank-tools";
import { apiFailure, budget, ok } from "@/lib/api-v1";

/** Twelve an hour a person: the trigram pass is seconds of database time over the whole bank. */
const DUPLICATES_BUDGET = { limit: 12, windowMs: 60 * 60 * 1000 };

/** GET /api/v1/appadmin/bank/duplicates — near-duplicate stems across the bank; `trigram` says which rule ran. */
export async function GET() {
  try {
    const ctx = await requireApiAppAdmin();
    const refused = await budget(`bank-duplicates:${ctx.user.id}`, DUPLICATES_BUDGET.limit, DUPLICATES_BUDGET.windowMs);
    if (refused) return refused;
    const report = await findDuplicates(ctx);
    return ok(bankDuplicatesSchema.parse({ ...report, computedAt: report.computedAt.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/duplicates");
  }
}
