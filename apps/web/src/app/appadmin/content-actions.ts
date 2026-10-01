"use server";

import { revalidatePath } from "next/cache";
import { getT } from "@/lib/i18n/server";
import { requireApiUser, AccessError } from "@/lib/tenancy";
import { commitBankImport, previewBankImport, type ImportPreview } from "@/lib/bank-tools";
import { reviewTranslation, type ReviewInput } from "@/lib/translation-review";
import { platformRestore, platformTakedown } from "@/lib/bulletin";

/**
 * The content team's 2026-10-01 actions: the sheet import, native review and
 * platform moderation. Every one re-reads the session; the libraries assert
 * the flag — a server action is reachable by anybody who can POST.
 */

type Result = { ok: boolean; error?: string };

async function failure(error: unknown): Promise<Result> {
  if (error instanceof AccessError) return { ok: false, error: (await getT())(error.key, error.vars) };
  console.error("[appadmin]", error);
  return { ok: false, error: (await getT())("common.tryAgainMoment") };
}

export type ImportOutcome = Result & {
  preview?: Omit<ImportPreview, "problems" | "recognised"> & { problems: { line: number; value: string; reason: string }[]; written: number };
};

async function sentences(preview: ImportPreview, written: number): Promise<NonNullable<ImportOutcome["preview"]>> {
  const t = await getT();
  return {
    parsed: preview.parsed,
    create: preview.create,
    update: preview.update,
    translations: preview.translations,
    unknownTopics: preview.unknownTopics,
    written,
    problems: preview.problems.map((p) => ({ line: p.line, value: p.value, reason: t(p.reasonKey, p.reasonVars) })),
  };
}

export async function previewBankImportAction(csv: string): Promise<ImportOutcome> {
  try {
    const session = await requireApiUser();
    return { ok: true, preview: await sentences(await previewBankImport(session, csv), 0) };
  } catch (error) {
    return failure(error);
  }
}

export async function commitBankImportAction(csv: string): Promise<ImportOutcome> {
  try {
    const session = await requireApiUser();
    const result = await commitBankImport(session, csv);
    revalidatePath("/appadmin/bank");
    revalidatePath("/appadmin/translations");
    return { ok: true, preview: await sentences(result, result.written) };
  } catch (error) {
    return failure(error);
  }
}

export async function reviewTranslationAction(questionId: string, input: ReviewInput): Promise<Result & { reviewed?: boolean }> {
  try {
    const session = await requireApiUser();
    const result = await reviewTranslation(session, questionId, input);
    if (!result.ok) return { ok: false, error: (await getT())(result.errorKey) };
    revalidatePath("/appadmin/translations");
    return { ok: true, reviewed: result.reviewed };
  } catch (error) {
    return failure(error);
  }
}

export async function platformTakedownAction(postId: string, reason: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    await platformTakedown(session, postId, reason);
    revalidatePath("/appadmin/moderation");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function platformRestoreAction(postId: string): Promise<Result> {
  try {
    const session = await requireApiUser();
    await platformRestore(session, postId);
    revalidatePath("/appadmin/moderation");
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
