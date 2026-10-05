import "server-only";
import { revalidatePath } from "next/cache";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { getT } from "@/lib/i18n/server";
import { formValues, refusalOf, type FieldMap, type FormState } from "./form-state";

/**
 * THE SERVER HALF OF <ActionForm> (A3-journeys-27, 5 Oct 2026): run the
 * action's work exactly as before — the same session check, the same schema,
 * the same library call and audit row — and hand the form a FormState rather
 * than a redirect. Done: the sentence, the pages to refresh, and the form
 * starts clean. Refused: the sentence, the control it is about
 * (lib/form-state.ts `refusalOf`) and everything the person typed.
 *
 * Only how the outcome reaches the form changes; what is refused does not.
 */
export type FormDone =
  | TranslationKey
  | { key: TranslationKey; vars?: Record<string, string | number>; reveal?: string }
  /** A sentence the library already wrote in the reader's language (the exam cell's import summary). */
  | { text: string }
  /** Done with nothing to say: the page is refreshed and the form starts clean. */
  | null;

export async function answerForm(
  previous: FormState,
  form: FormData,
  work: () => Promise<FormDone>,
  opts: { revalidate?: string[]; fields?: FieldMap } = {},
): Promise<FormState> {
  const t = await getT();
  let done: FormDone;
  try {
    done = await work();
  } catch (error) {
    const refusal = refusalOf(error, t, opts.fields);
    if (!refusal) {
      // Next's own interrupts (a redirect from a session check, notFound) pass through.
      const digest = (error as { digest?: unknown } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_")) throw error;
      console.error("[answerForm]", error);
      return { ok: false, message: t("common.somethingWrong"), values: formValues(form), n: previous.n };
    }
    return { ok: false, message: refusal.message, field: refusal.field, values: formValues(form), n: previous.n };
  }
  for (const path of new Set(opts.revalidate ?? [])) revalidatePath(path.split("?")[0]!);
  const n = (previous.n ?? 0) + 1;
  if (done === null) return { ok: true, n };
  if (typeof done === "string") return { ok: true, message: t(done), n };
  if ("text" in done) return { ok: true, message: done.text, n };
  return { ok: true, message: t(done.key, done.vars), reveal: done.reveal, n };
}
