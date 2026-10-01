import { feeBankImportBodySchema, feeBankImportResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { commitBankImport } from "@/lib/fees-bank-import";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/fees/bank-import/commit — record the matched lines through
 * the counter's writer (the statement's reference on the receipt) and
 * confirm the claims matched by UTR; idempotent by reference. Each refusal
 * is reported against its line. The platform records that money moved and
 * moves none (decision 0003).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeBankImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    return ok(feeBankImportResultSchema.parse(await commitBankImport(ctx, parsed.data.csv, (e) => t(e.key, e.vars))));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/bank-import/commit");
  }
}
