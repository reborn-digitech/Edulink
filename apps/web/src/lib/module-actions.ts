import "server-only";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodError } from "zod";
import { AccessError } from "./access-error";
import { RuleRefusal } from "./rule-refusal";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The server actions of the inventory and payroll pages, one shape: do the
 * thing, then go back to the page with `?done=<key>` or `?error=<key>`
 * (and the refusal's one number or name, when it has one, as `v_<name>`),
 * which the page says in the reader's language through <ModuleFlash>. Plain
 * forms, no client state: a page works before its script has loaded, and a
 * refusal is a sentence rather than a thrown error page.
 *
 * `redirect` throws by design, so it is called outside the try.
 */
export type Outcome = { done?: TranslationKey; error?: TranslationKey; vars?: Record<string, string | number> };

export async function runAction(path: string, work: () => Promise<TranslationKey>, revalidate: string[] = []): Promise<never> {
  let outcome: Outcome;
  try {
    outcome = { done: await work() };
  } catch (error) {
    if (error instanceof RuleRefusal || error instanceof AccessError) outcome = { error: error.key, vars: error.vars };
    else if (isZodError(error)) outcome = { error: "common.checkTheForm" };
    else {
      console.error(`[${path}]`, error);
      outcome = { error: "common.somethingWrong" };
    }
  }
  for (const p of new Set([path.split("?")[0]!, ...revalidate])) revalidatePath(p);
  const url = new URL(path, "http://x");
  if (outcome.done) url.searchParams.set("done", outcome.done);
  if (outcome.error) url.searchParams.set("error", outcome.error);
  for (const [k, v] of Object.entries(outcome.vars ?? {})) url.searchParams.set(`v_${k}`, String(v).slice(0, 80));
  redirect(`${url.pathname}${url.search}`);
}

function isZodError(e: unknown): e is ZodError {
  return typeof e === "object" && e !== null && (e as { name?: string }).name === "ZodError";
}

/** A form field as a trimmed string. */
export const field = (form: FormData, name: string): string => String(form.get(name) ?? "").trim();
/** A form field as rupees typed by a person, in paise; blank is null. */
export function rupeesField(form: FormData, name: string): number | null {
  const raw = field(form, name).replace(/[₹,\s]/g, "");
  if (!raw) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new RuleRefusal("common.checkTheForm", 422, undefined, name);
  return Math.round(Number(raw) * 100);
}
export const intField = (form: FormData, name: string): number => Number.parseInt(field(form, name) || "0", 10) || 0;
