"use client";

import { CheckCircleIcon } from "@phosphor-icons/react";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";

/**
 * A question in three languages, written side by side: the English, the
 * Hindi and the Marathi, each with the question, the same options in the
 * same order, and the worked solution. The correct option is one fact for
 * all three and is marked once, in the English.
 *
 * The Hindi and Marathi boxes are typed in Devanagari whatever the header's
 * keyboard switch says (data-typing, read by components/typing-switch.tsx):
 * a teacher writing the Marathi types "shaaLaa" and gets शाळा.
 */
export type QuestionText = { stem: string; choices: string[]; solution: string };
export type QuestionDraft = { difficulty: number; answerIndex: number; en: QuestionText; hi: QuestionText; mr: QuestionText };

const ROWS = 4;
const LANGUAGES = ["en", "hi", "mr"] as const;
type Language = (typeof LANGUAGES)[number];

const padded = (text?: QuestionText): QuestionText => ({ stem: text?.stem ?? "", solution: text?.solution ?? "", choices: [...(text?.choices ?? []), ...Array(Math.max(0, ROWS - (text?.choices.length ?? 0))).fill("")] });

export const emptyDraft = (from?: Partial<QuestionDraft>): QuestionDraft => ({ difficulty: from?.difficulty ?? 1, answerIndex: from?.answerIndex ?? 0, en: padded(from?.en), hi: padded(from?.hi), mr: padded(from?.mr) });

/**
 * The draft as it is sent: an option row left blank in all three languages is
 * dropped and the answer re-pointed at the same option. Null when the option
 * marked correct is one of the dropped.
 */
export function compactDraft(draft: QuestionDraft): QuestionDraft | null {
  const rows = draft.en.choices.map((_, i) => i).filter((i) => LANGUAGES.some((l) => (draft[l].choices[i] ?? "").trim().length > 0));
  const answerIndex = rows.indexOf(draft.answerIndex);
  if (answerIndex === -1) return null;
  const text = (l: Language): QuestionText => ({ stem: draft[l].stem.trim(), solution: draft[l].solution.trim(), choices: rows.map((i) => (draft[l].choices[i] ?? "").trim()) });
  return { difficulty: draft.difficulty, answerIndex, en: text("en"), hi: text("hi"), mr: text("mr") };
}

export function QuestionFields({ value, onChange, disabled }: { value: QuestionDraft; onChange: (next: QuestionDraft) => void; disabled?: boolean }) {
  const t = useT();
  const names: Record<Language, string> = { en: t("gigs.english"), hi: t("gigs.hindi"), mr: t("gigs.marathi") };
  const patch = (l: Language, part: Partial<QuestionText>) => onChange({ ...value, [l]: { ...value[l], ...part } });
  const setChoice = (l: Language, index: number, text: string) => patch(l, { choices: value[l].choices.map((c, i) => (i === index ? text : c)) });

  return (
    <div className="space-y-5">
      <SelectField label={t("appadmin.levelLabel")} value={String(value.difficulty)} disabled={disabled} onChange={(e) => onChange({ ...value, difficulty: Number(e.target.value) })} className="max-w-sm" data-testid="gig-level">
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <option key={level} value={level}>
            {t("appadmin.levelN", { n: level })} — {t(`practice.level${level}` as never)}
          </option>
        ))}
      </SelectField>
      <div className="grid gap-4 lg:grid-cols-3">
        {LANGUAGES.map((l) => (
          <fieldset key={l} lang={l} data-typing={l} disabled={disabled} className="min-w-0 space-y-3 rounded-[--radius-lg] border border-border bg-surface p-4" data-testid={`gig-${l}`}>
            <legend className="px-1 text-sm font-semibold text-fg">{names[l]}</legend>
            {l !== "en" && <p className="text-xs text-fg-muted">{t("gigs.devanagariHint")}</p>}
            <TextAreaField label={t("appadmin.stemLabel")} rows={3} maxLength={2000} value={value[l].stem} onChange={(e) => patch(l, { stem: e.target.value })} data-testid={`gig-${l}-stem`} />
            <div className="space-y-2">
              {value[l].choices.map((choice, index) => (
                <div key={index} className="flex items-end gap-2">
                  {l === "en" ? (
                    // The label is the target: a finger presses the square around the dot, not the dot.
                    <label className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center">
                      <input type="radio" name="gig-answer" aria-label={t("appadmin.correctOne", { n: index + 1 })} checked={value.answerIndex === index} onChange={() => onChange({ ...value, answerIndex: index })} className="size-5 accent-[--color-accent]" data-testid={`gig-answer-${index}`} />
                    </label>
                  ) : (
                    <span className="inline-flex size-11 shrink-0 items-center justify-center" aria-hidden="true">
                      {value.answerIndex === index && <CheckCircleIcon weight="fill" className="size-5 text-ok" />}
                    </span>
                  )}
                  <TextField label={t("appadmin.choiceN", { n: index + 1 })} className="min-w-0 flex-1" value={choice} maxLength={500} autoComplete="off" onChange={(e) => setChoice(l, index, e.target.value)} data-testid={`gig-${l}-choice-${index}`} />
                </div>
              ))}
            </div>
            {l === "en" && <p className="text-xs text-fg-muted">{t("gigs.answerSame")}</p>}
            <TextAreaField label={t("appadmin.solutionLabel")} rows={3} maxLength={4000} value={value[l].solution} onChange={(e) => patch(l, { solution: e.target.value })} data-testid={`gig-${l}-solution`} />
          </fieldset>
        ))}
      </div>
    </div>
  );
}
