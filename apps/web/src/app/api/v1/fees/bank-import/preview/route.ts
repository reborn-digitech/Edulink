import { feeBankImportBodySchema, feeBankImportPreviewSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { previewBankImport } from "@/lib/fees-bank-import";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/fees/bank-import/preview — what each credit on a pasted
 * bank statement would do: a payment recorded for the pupil the line
 * names, a UPI claim confirmed by its UTR, a line already in the ledger,
 * or one for the office to key by hand. Writes nothing.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = feeBankImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeBankImportPreviewSchema.parse(await previewBankImport(ctx, parsed.data.csv)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/bank-import/preview");
  }
}
