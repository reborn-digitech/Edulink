"use server";

import { revalidatePath } from "next/cache";
import { requireApiRole } from "@/lib/tenancy";
import { commitBankImport, previewBankImport, type BankImportPreview, type BankImportResult } from "@/lib/fees-bank-import";
import { getT } from "@/lib/i18n/server";
import { failure, type ActionResult } from "./action-result";

/**
 * The bank statement, from the office's fees page. The preview writes
 * nothing; the commit records each matched line through the counter's one
 * writer and confirms the claims matched by UTR. Nothing here moves money
 * (decision 0003).
 */
export async function previewBankImportAction(csv: string): Promise<ActionResult & { preview?: BankImportPreview }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const preview = await previewBankImport(ctx, csv.slice(0, 500_000));
    return { ok: true, preview };
  } catch (error) {
    return failure(error);
  }
}

export async function commitBankImportAction(csv: string): Promise<ActionResult & { result?: BankImportResult }> {
  try {
    const ctx = await requireApiRole("ADMIN");
    const t = await getT();
    const result = await commitBankImport(ctx, csv.slice(0, 500_000), (e) => t(e.key, e.vars));
    revalidatePath("/admin/fees");
    revalidatePath("/admin/fees/claims");
    revalidatePath("/admin/fees/dues");
    return { ok: true, result };
  } catch (error) {
    return failure(error);
  }
}
