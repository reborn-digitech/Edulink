"use client";

import { useState } from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
import type { QuizReviewEditBody, QuizReviewItem } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useT } from "@/lib/i18n";

type Words = { stem: string; choices: string[]; solution: string };
type Draft = { stem: string; choices: string[]; answerIndex: number; solution: string; checkExpr: string; difficulty: number; hi: Words | null; mr: Words | null };

const wordsOf = (t: QuizReviewItem["translations"]["hi"]): Words | null => (t ? { stem: t.stem, choices: [...t.choices], solution: t.solution } : null);

const draftOf = (item: QuizReviewItem): Draft => ({
  stem: item.stem,
  choices: [...item.choices],
  answerIndex: item.answerIndex,
  solution: item.solution,
  checkExpr: item.checkExpr ?? "",
  difficulty: item.difficulty,
  hi: wordsOf(item.translations.hi),
  mr: wordsOf(item.translations.mr),
});

/** A language's words to send: only when changed, and only whole. */
function changedWords(now: Words | null, was: Words | null): Words | undefined {
  if (!now) return undefined;
  if (!now.stem.trim() || !now.solution.trim() || now.choices.some((c) => !c.trim())) return undefined;
  return JSON.stringify(now) === JSON.stringify(was) ? undefined : now;
}

/**
 * A generated item's Edit, in all three languages at once (the desk's form, shared since 20 October 2026 by the
 * one-at-a-time desk and a chapter's page): the English with the key, the check expression and the level, and the
 * Hindi and the Marathi rows; a language left as it is is not sent. Mounted fresh for each item (keyed by the caller),
 * so Cancel is simply unmounting it.
 */
export function ItemEditForm({ item, pending, onSave, onCancel }: { item: QuizReviewItem; pending: boolean; onSave: (body: QuizReviewEditBody) => void; onCancel: () => void }) {
  const t = useT();
  const [draft, setDraft] = useState<Draft>(() => draftOf(item));
  const setWords = (language: "hi" | "mr", words: Words) => setDraft({ ...draft, [language]: words });

  function save() {
    const hi = changedWords(draft.hi, wordsOf(item.translations.hi));
    const mr = changedWords(draft.mr, wordsOf(item.translations.mr));
    onSave({
      stem: draft.stem,
      choices: draft.choices,
      answerIndex: draft.answerIndex,
      solution: draft.solution,
      checkExpr: draft.checkExpr.trim() || null,
      difficulty: draft.difficulty,
      ...(hi || mr ? { translations: { ...(hi ? { hi } : {}), ...(mr ? { mr } : {}) } } : {}),
    });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("quizReview.englishLabel")}</legend>
        <TextAreaField label={t("quizReview.stemLabel")} value={draft.stem} onChange={(e) => setDraft({ ...draft, stem: e.target.value })} required />
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("quizReview.optionsLabel")}</legend>
          {draft.choices.map((choice, i) => (
            <div key={i} className="flex items-end gap-2">
              <label className="flex min-h-11 min-w-11 items-center justify-center" title={t("quizReview.correctAnswer")}>
                <input type="radio" name={`key-${item.id}`} className="size-5" checked={draft.answerIndex === i} onChange={() => setDraft({ ...draft, answerIndex: i })} aria-label={t("quizReview.correctAnswer")} />
              </label>
              <TextField className="flex-1" label={t("quizReview.optionN", { n: i + 1 })} value={choice} onChange={(e) => setDraft({ ...draft, choices: draft.choices.map((c, j) => (j === i ? e.target.value : c)) })} required />
            </div>
          ))}
        </fieldset>
        <TextAreaField label={t("quizReview.solutionLabel")} value={draft.solution} onChange={(e) => setDraft({ ...draft, solution: e.target.value })} required />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label={t("quizReview.checkLabel")} value={draft.checkExpr} onChange={(e) => setDraft({ ...draft, checkExpr: e.target.value })} />
          <SelectField label={t("quizReview.difficultyLabel")} value={String(draft.difficulty)} onChange={(e) => setDraft({ ...draft, difficulty: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <option key={level} value={level}>
                {t("quizReview.levelOption", { level })}
              </option>
            ))}
          </SelectField>
        </div>
      </fieldset>
      <p className="text-sm text-fg-muted">{t("quizReview.translationEditHint")}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {(["hi", "mr"] as const).map((language) => {
          const words = draft[language];
          const name = t(language === "hi" ? "gigs.hindi" : "gigs.marathi");
          return (
            <fieldset key={language} lang={language} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <legend className="px-1 text-sm font-semibold">{name}</legend>
              {!words ? (
                <p className="text-sm text-fg-muted">{t("quizReview.translationMissing")}</p>
              ) : (
                <>
                  <TextAreaField label={t("quizReview.fieldInLanguage", { field: t("quizReview.stemLabel"), language: name })} value={words.stem} onChange={(e) => setWords(language, { ...words, stem: e.target.value })} />
                  {words.choices.map((choice, i) => (
                    <TextField key={i} label={t("quizReview.fieldInLanguage", { field: t("quizReview.optionN", { n: i + 1 }), language: name })} value={choice} onChange={(e) => setWords(language, { ...words, choices: words.choices.map((c, j) => (j === i ? e.target.value : c)) })} />
                  ))}
                  <TextAreaField label={t("quizReview.fieldInLanguage", { field: t("quizReview.solutionLabel"), language: name })} value={words.solution} onChange={(e) => setWords(language, { ...words, solution: e.target.value })} />
                </>
              )}
            </fieldset>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="submit" disabled={pending}>
          <PencilSimpleIcon aria-hidden="true" />
          {t("quizReview.saveEdit")}
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={onCancel} disabled={pending}>
          {t("quizReview.cancelEdit")}
        </Button>
      </div>
    </form>
  );
}
