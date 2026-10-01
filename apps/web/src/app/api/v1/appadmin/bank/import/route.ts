import { bankImportBodySchema, bankImportResultSchema } from "@edulink/contracts";
import { requireApiAppAdmin } from "@/lib/tenancy";
import { commitBankImport, previewBankImport } from "@/lib/bank-tools";
import { getT } from "@/lib/i18n/server";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/appadmin/bank/import — the sheet as text. Without `commit`
 * it previews: how many rows would be created and updated, and every row
 * that would not go through with the reason in the caller's language. With
 * it, the same is written and audited. Idempotent by chapter and stem.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiAppAdmin();
    const parsed = bankImportBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const result = parsed.data.commit ? await commitBankImport(ctx, parsed.data.csv) : { ...(await previewBankImport(ctx, parsed.data.csv)), written: 0 };
    return ok(
      bankImportResultSchema.parse({
        committed: Boolean(parsed.data.commit),
        parsed: result.parsed,
        create: result.create,
        update: result.update,
        translations: result.translations,
        written: result.written,
        unknownTopics: result.unknownTopics,
        problems: result.problems.map((p) => ({ line: p.line, value: p.value, reason: t(p.reasonKey, p.reasonVars) })),
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/appadmin/bank/import");
  }
}
