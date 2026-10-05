"use server";

import { redirect } from "next/navigation";
import { scenarioSaveSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { answerForm } from "@/lib/form-action";
import type { FormState } from "@/lib/form-state";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { removeScenario, saveScenario } from "@/lib/iqac-insights";

/**
 * The simulator's forms (module IQAC, 5 Oct 2026): save what the simulator
 * shows as a named scenario, or remove one. Each posts `back`, the page it
 * came from and answers in place (a refusal by its button, see run below);
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
const str = (f: FormData, name: string) => String(f.get(name) ?? "").trim();

/**
 * Answers in place (A3-journeys-27, risks batch): a refusal (the per-author
 * ceiling, a part above its whole, figures that do not read) keeps the name
 * typed and sits by the button; a save goes back with the saved scenario
 * loaded so its figures stay on screen (A3-journeys-33), a removal is a toast.
 */
async function run(previous: FormState, formData: FormData, work: () => Promise<TranslationKey | { done: TranslationKey; load: string | undefined }>): Promise<FormState> {
  const back = backOf(formData);
  let load: string | undefined;
  const answer = await answerForm(
    previous,
    formData,
    async () => {
      try {
        const result = await work();
        if (typeof result === "string") return result;
        load = result.load;
        return result.done;
      } catch (error) {
        // The figures posted as JSON did not read: the form, not a crash.
        if (error instanceof SyntaxError) throw new FormError();
        throw error;
      }
    },
    { revalidate: [back] },
  );
  if (!answer.ok || !load) return answer;
  const t = await getT();
  redirect(`${back}${back.includes("?") ? "&" : "?"}load=${encodeURIComponent(load)}&ok=${encodeURIComponent(t("insights.simSaved"))}`);
}
class FormError extends Error {
  override name = "FormError";
}

function parsedSave(raw: unknown) {
  const parsed = scenarioSaveSchema.safeParse(raw);
  if (!parsed.success) throw Object.assign(new FormError(), { cause: parsed.error });
  return parsed.data;
}

export async function saveNaacScenarioAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async () => {
    const ctx = await requireApiUser();
    const list = await saveScenario(ctx, parsedSave({ kind: "NAAC", cycleId: str(formData, "cycleId"), name: str(formData, "name"), inputs: JSON.parse(str(formData, "inputs") || "{}") }));
    // The list is newest first, so the scenario just saved leads it.
    return { done: "insights.simSaved", load: list.items[0]?.id };
  });
}

export async function saveNbaScenarioAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async () => {
    const ctx = await requireApiUser();
    const list = await saveScenario(ctx, parsedSave({ kind: "NBA", year: Number(str(formData, "year")), departmentId: str(formData, "departmentId"), name: str(formData, "name"), inputs: JSON.parse(str(formData, "inputs") || "{}") }));
    return { done: "insights.simSaved", load: list.items[0]?.id };
  });
}

export async function removeScenarioAction(previous: FormState, formData: FormData): Promise<FormState> {
  return run(previous, formData, async () => {
    const ctx = await requireApiUser();
    await removeScenario(ctx, str(formData, "scenarioId"));
    return "insights.simRemoved";
  });
}
