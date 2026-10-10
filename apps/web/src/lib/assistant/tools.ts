/**
 * WHAT IS LEFT OF THE TOOL TABLE (the data questions, 11 October 2026). The hand-written allow-list of doors and
 * its intent patterns are gone: which of the person's own GET doors answer a question is decided over the
 * catalog by embedding similarity (router.ts, doors.ts) and their answers are summed up by code (summary.ts).
 * Kept here: the exam-scope reader's trigger (`asksAboutExams`, which reads the pupil's exams doors in tutor
 * mode too) and the readable form of a door's raw JSON, which the evaluation harness hands in as a door's
 * answer (scripts/assistant-eval.ts) and the red-team tests read. Pure.
 */
import { TOOL_ANSWER_MAX_CHARS } from "./config";
import { stripIdentifiers, type NameEntry } from "./strip";
import { withoutInjectedLines } from "./refusals";
import type { RowLink } from "./summary";

const EXAMS = /\b(?:exams?|tests?|papers?|date ?sheet|marks)\b|परीक्षा|पेपर|गुण/;

/** Does the question ask about exams, tests or papers (the exam-scope reader runs the exams doors in tutor mode too)? Pure. */
export function asksAboutExams(question: string): boolean {
  return EXAMS.test(question.toLowerCase());
}

/**
 * A field whose whole value was an identifier ("teacher": "[PERSON_1]", "id": "[ID_3]") tells the model
 * nothing it may use and is the one thing it then repeats: in Phase D's pilot (10 Oct 2026) a pupil's
 * "what is on my timetable today" was answered "Mathematics, taught by [PERSON_1]" and the answer gate
 * discarded it, every time. Such fields are dropped before the model reads the door's answer.
 */
const PLACEHOLDER_ONLY_FIELD = /^\s*"[^"]*":\s*"(?:\s*\[(?:PERSON|SCHOOL|EMAIL|PHONE|LINK|ID|CODE)(?:_\d+)?\][\s,;/&]*)+",?\s*$/;

/**
 * The platform's own units, read as a person reads them (Phase D's pilot, 10 Oct 2026: a guardian was told
 * "1,250,000 paise" are due and a pupil's periods ran "480 to 525 minutes"): every `…Paise` amount becomes
 * `…Rupees` in rupees ("₹12,500"), every `…Minute` of the day (0–1440) becomes `…Time` ("08:00"). Pure.
 */
export function readableForModel(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(readableForModel);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    const paise = /^(.*?)(?:P|p)aise$/.exec(key);
    const minute = /^(.*?)Minute$/.exec(key);
    if (paise && typeof v === "number" && Number.isFinite(v)) {
      out[paise[1] ? `${paise[1]}Rupees` : "rupees"] = `₹${(v / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
    } else if (minute && typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 1440) {
      out[`${minute[1]}Time`] = `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
    } else out[key] = readableForModel(v);
  }
  return out;
}

/** A door's JSON as the model may read it: amounts and times made readable, identifiers out, instruction-shaped lines out, fields that were only an identifier dropped, cut short. Pure. */
export function toolDataForModel(json: unknown, lexicon: NameEntry[]): string {
  const text = JSON.stringify(readableForModel(json), null, 1) ?? "";
  const stripped = withoutInjectedLines(stripIdentifiers(text, lexicon).text);
  return stripped
    .split("\n")
    .filter((line) => !PLACEHOLDER_ONLY_FIELD.test(line))
    .join("\n")
    .slice(0, TOOL_ANSWER_MAX_CHARS);
}

/** A door's answer handed in by the evaluation harness (previewAnswer), as the runner would have summed it up. */
export type ToolRun = {
  /** The door's path, or a name the harness gives it. */
  name: string;
  ok: boolean;
  data: string | null;
  status: number | null;
  /** The door's own JSON, for code that reads a door by shape (the exam-scope reader, exams.ts); never the model's. */
  raw?: unknown;
  /** The numbered rows in `data` (summary.ts), when the harness hands in a summed-up door with its links. */
  links?: RowLink[];
};
