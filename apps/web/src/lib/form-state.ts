import type { ZodIssue } from "zod";
import type { Translate } from "./i18n/dictionary";
import { issueText } from "./validation";

/**
 * WHAT A SERVER-ACTION FORM HEARS BACK (A3-journeys-27, 5 Oct 2026).
 *
 * The office's forms used to redirect to `?error=<key>`: the page came back
 * with the sentence at its top, far from the box it was about, and with every
 * box empty, so a registrar who typed six dates and one wrong year typed all
 * seven again. A form wrapped in <ActionForm> (components/ui/action-form.tsx)
 * now gets this state back instead: the sentence, the control it is about,
 * and what was typed. The kit's fields read it by their `name`, show the
 * sentence under themselves with role="alert" and aria-invalid, and keep the
 * value; a refusal about no one control sits by the form's button.
 *
 * Pure (no server, no React) so the suite pins the mapping: tests/form-state.test.ts.
 */
export type FormState = {
  /** No answer yet: the state a form starts in. */
  idle?: true;
  ok: boolean;
  /** The refusal, or what was done, in the reader's language. */
  message?: string;
  /** The `name` of the control the refusal is about, when one is. */
  field?: string;
  /** What the person typed, so a form drawn afresh (before its script loads) keeps it. */
  values?: Record<string, string>;
  /** An element id to bring into view once done (the exam series just made). */
  reveal?: string;
  /** How many times this form has been done; the form starts clean after each. */
  n?: number;
};

export const FORM_IDLE: FormState = { idle: true, ok: false };

/**
 * Which control a refusal is about, when the library or the schema names it
 * in its own words: a refusal key ("access.paperOnSunday") or a library or
 * schema field ("feePerCoursePaise", "lateFeeSlabs.0.paise") to the form's
 * `name` ("dateKey", "feePerCourse", "slabFee1"). An empty string says "no
 * one control" — the sentence then sits by the button.
 */
export type FieldMap = Record<string, string>;

export type FormRefusal = { message: string; field?: string };

const isObject = (e: unknown): e is Record<string, unknown> => typeof e === "object" && e !== null;

function zodIssues(e: unknown): ZodIssue[] | null {
  if (isObject(e) && e.name === "ZodError" && Array.isArray(e.issues)) return e.issues as ZodIssue[];
  // The actions' own FormError carries the schema's error as its cause.
  if (isObject(e) && isObject(e.cause)) return zodIssues(e.cause);
  return null;
}

/** The control a refusal is about: the first candidate the action's map names (an empty mapping is "none"), else the refusal's own name. */
function resolve(fields: FieldMap, candidates: (string | undefined)[], own: string | undefined): string | undefined {
  for (const c of candidates) if (c && Object.hasOwn(fields, c)) return fields[c] || undefined;
  return own || undefined;
}

/**
 * A refusal as the form shows it, or null for anything that is not one (a
 * crash, which the caller logs). Three kinds:
 *
 *   - a RuleRefusal or an AccessError (anything carrying a message `key`):
 *     its sentence, and its field — the one the library named, or the one the
 *     action's map gives the key;
 *   - a ZodError (or an error whose cause is one): the first issue's own
 *     sentence ("This is required.", "Use 1 or more.") about the control its
 *     path names, never the bare "Some of this needs another look.";
 *   - an error carrying only `formField` (a date the action could not read):
 *     "That is not valid." about that control.
 */
export function refusalOf(error: unknown, t: Translate, fields: FieldMap = {}): FormRefusal | null {
  if (!isObject(error)) return null;
  const key = error.key;
  if (error instanceof Error && typeof key === "string") {
    const vars = isObject(error.vars) ? (error.vars as Record<string, string | number>) : undefined;
    const own = typeof error.field === "string" ? error.field : undefined;
    return { message: t(key as Parameters<Translate>[0], vars), field: resolve(fields, [key, own], own) };
  }
  const issues = zodIssues(error);
  if (issues) {
    const issue = issues[0];
    if (!issue) return { message: t("common.checkTheForm") };
    const path = issue.path.map(String);
    const text = issueText(issue, t);
    // A schema's own non-key message ("order", "year") is not a sentence for a reader.
    return { message: text === issue.message ? t("refusal.notValid") : text, field: resolve(fields, [path.join("."), path[0]], path[0]) };
  }
  if (typeof error.formField === "string") {
    return { message: t("refusal.notValid"), field: resolve(fields, [error.formField], error.formField) };
  }
  return null;
}

/** What was typed, by control name: the first value of each, text only, never the framework's own keys. */
export function formValues(form: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [name, value] of form.entries()) {
    if (name.startsWith("$ACTION") || typeof value !== "string" || name in out) continue;
    out[name] = value.slice(0, 4000);
  }
  return out;
}
