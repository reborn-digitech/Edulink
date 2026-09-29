"use server";

import { revalidatePath } from "next/cache";
import { paperSignatureDecideSchema, signatureSaveSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { decidePaperSignature, removeMySignature, removeSeal, saveMySignature, saveSeal } from "@/lib/signatures";

/**
 * The writes of the signatures page and of the paper's own page. Who may set
 * what, and whose signature a paper waits for, is settled in
 * src/lib/signatures.ts; only the result's shape lives here. Only async
 * functions and types may be exported from a "use server" file.
 */
export type SignatureActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function failure(error: unknown): SignatureActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[signatures]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

async function run(work: (ctx: Awaited<ReturnType<typeof requireApiUser>>) => Promise<unknown>, paths: string[] = []): Promise<SignatureActionResult> {
  try {
    await work(await requireApiUser());
    for (const path of ["/admin/signatures", ...paths]) revalidatePath(path);
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function saveSignatureAction(which: "mine" | "seal", image: unknown): Promise<SignatureActionResult> {
  const parsed = signatureSaveSchema.safeParse({ image });
  if (!parsed.success) return { ok: false, errorKey: "signatures.notARealPicture" };
  return run((ctx) => (which === "seal" ? saveSeal(ctx, parsed.data.image) : saveMySignature(ctx, parsed.data.image)));
}

export async function removeSignatureAction(which: "mine" | "seal"): Promise<SignatureActionResult> {
  return run((ctx) => (which === "seal" ? removeSeal(ctx) : removeMySignature(ctx)));
}

export async function decideSignatureAction(signatureId: string, approve: unknown): Promise<SignatureActionResult> {
  const parsed = paperSignatureDecideSchema.safeParse({ approve });
  if (!parsed.success || typeof signatureId !== "string" || !signatureId) return { ok: false, errorKey: "common.checkTheForm" };
  let paper = "";
  const result = await run(async (ctx) => {
    const decided = await decidePaperSignature(ctx, signatureId, parsed.data.approve);
    paper = decided.paperKind === "CERTIFICATE" ? `/certificates/${decided.paperId}` : `/report-cards/${decided.paperId}`;
  });
  if (result.ok && paper) revalidatePath(paper);
  return result;
}
