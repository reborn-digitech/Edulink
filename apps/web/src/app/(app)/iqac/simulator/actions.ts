"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { scenarioSaveSchema } from "@edulink/contracts";
import { AccessError, requireApiUser } from "@/lib/tenancy";
import { RuleRefusal } from "@/lib/rule-refusal";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { removeScenario, saveScenario } from "@/lib/iqac-insights";

/**
 * The simulator's forms (module IQAC, 5 Oct 2026): save what the simulator
 * shows as a named scenario, or remove one. Each posts `back`, the page it
 * came from, and returns there with ?ok= or ?error= in the reader's language;
 * who may do what is decided in lib/iqac-insights.ts, exactly as for the
 * /api/v1/iqac/scenarios doors, and the result is recomputed there.
 */

const BACK = /^\/(iqac\/simulator|hod\/nba\/simulator|iqac\/predictor|principal\/accreditation)$/;

function backOf(formData: FormData): string {
  const raw = String(formData.get("back") ?? "");
  const [path, query = ""] = raw.split("?");
  if (!path || !BACK.test(path)) return "/iqac/simulator";
  const keep = new URLSearchParams(query);
  for (const k of ["ok", "error", "load"]) keep.delete(k);
  const q = keep.toString();
  return q ? `${path}?${q}` : path;
}
const withMessage = (back: string, key: "ok" | "error", text: string) => `${back}${back.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(text)}`;
const str = (f: FormData, name: string) => String(f.get(name) ?? "").trim();

async function run(formData: FormData, work: () => Promise<TranslationKey | { done: TranslationKey; load: string | undefined }>): Promise<void> {
  let back = backOf(formData);
  const t = await getT();
  let done: TranslationKey;
  try {
    const result = await work();
    if (typeof result === "string") done = result;
    else {
      done = result.done;
      // Saving keeps the saved figures on screen instead of resetting them to today (A3-journeys-33).
      if (result.load) back = `${back}${back.includes("?") ? "&" : "?"}load=${encodeURIComponent(result.load)}`;
    }
  } catch (error) {
    if (error instanceof AccessError || error instanceof RuleRefusal) redirect(withMessage(back, "error", t(error.key as TranslationKey, (error as { vars?: Record<string, string | number> }).vars)));
    if (error instanceof SyntaxError || error instanceof FormError) redirect(withMessage(back, "error", t("common.checkTheForm")));
    throw error;
  }
  revalidatePath(back.split("?")[0]!);
  redirect(withMessage(back, "ok", t(done)));
}
class FormError extends Error {}

function parsedSave(raw: unknown) {
  const parsed = scenarioSaveSchema.safeParse(raw);
  if (!parsed.success) throw new FormError();
  return parsed.data;
}

export async function saveNaacScenarioAction(formData: FormData) {
  await run(formData, async () => {
    const ctx = await requireApiUser();
    const list = await saveScenario(ctx, parsedSave({ kind: "NAAC", cycleId: str(formData, "cycleId"), name: str(formData, "name"), inputs: JSON.parse(str(formData, "inputs") || "{}") }));
    // The list is newest first, so the scenario just saved leads it.
    return { done: "insights.simSaved", load: list.items[0]?.id };
  });
}

export async function saveNbaScenarioAction(formData: FormData) {
  await run(formData, async () => {
    const ctx = await requireApiUser();
    const list = await saveScenario(ctx, parsedSave({ kind: "NBA", year: Number(str(formData, "year")), departmentId: str(formData, "departmentId"), name: str(formData, "name"), inputs: JSON.parse(str(formData, "inputs") || "{}") }));
    return { done: "insights.simSaved", load: list.items[0]?.id };
  });
}

export async function removeScenarioAction(formData: FormData) {
  await run(formData, async () => {
    const ctx = await requireApiUser();
    await removeScenario(ctx, str(formData, "scenarioId"));
    return "insights.simRemoved";
  });
}
