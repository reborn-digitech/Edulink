"use server";

import { revalidatePath } from "next/cache";
import { reportCardConfigSchema, termWeightSchema } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { saveReportCardConfig, setTermWeight } from "@/lib/report-card-config";

/**
 * The office's two writes on the report card rules — the whole document,
 * and one term's share of the annual card — as the web editor calls them.
 * Who may write is settled inside src/lib/report-card-config.ts; this file
 * only checks the shape and turns a refusal into a key the form can say in
 * the reader's language. Only async functions and types may be exported
 * from a "use server" file — see tests/use-server-exports.test.ts.
 */
export type ReportCardRulesActionResult = { ok: boolean; errorKey?: TranslationKey; errorVars?: Record<string, string | number> };

function failure(error: unknown): ReportCardRulesActionResult {
  if (error instanceof AccessError) return { ok: false, errorKey: error.key, errorVars: error.vars };
  console.error("[report card rules]", error);
  return { ok: false, errorKey: "common.tryAgain" };
}

/** Every page that renders a card, or builds one, reads the rules. */
function revalidateCards() {
  revalidatePath("/admin/report-cards");
  revalidatePath("/report-cards/[cardId]", "page");
  revalidatePath("/teacher/classes/[classId]/report-cards", "page");
}

export async function saveRules(input: unknown): Promise<ReportCardRulesActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = reportCardConfigSchema.safeParse(input);
    if (!parsed.success) return { ok: false, errorKey: "common.checkTheForm" };
    await saveReportCardConfig(ctx, parsed.data);
    revalidateCards();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}

export async function saveTermWeight(termId: string, weightPercent: number | null): Promise<ReportCardRulesActionResult> {
  try {
    const ctx = await requireApiUser();
    const parsed = termWeightSchema.safeParse({ weightPercent });
    if (!parsed.success || typeof termId !== "string" || !termId) return { ok: false, errorKey: "reportCardConfig.invalidWeight" };
    await setTermWeight(ctx, termId, parsed.data.weightPercent);
    revalidateCards();
    return { ok: true };
  } catch (error) {
    return failure(error);
  }
}
