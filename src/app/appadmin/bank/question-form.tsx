"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, TranslateIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createQuestionAction, updateQuestionAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * The question editor, for adding and editing alike.
 *
 * WRITTEN IN ENGLISH ONLY, ON PURPOSE. The author types the English question
 * and the save translates it to Hindi and Marathi automatically — the same
 * model-translated rows the reading path already falls back through. The
 * toast says whether the translations were actually written, because "saved"
 * and "saved in three languages" are different facts and the author should
 * know which one happened.
 *
 * FOUR CHOICES BY DEFAULT, blank ones dropped. The correct answer is picked
 * by radio next to the choice it marks, so the index can never point at a
 * choice the author deleted.
 */
export function QuestionForm({
  topicId,
  questionId,
  translationOn,
  initial,
}: {
  topicId: string;
  /** Present when editing; absent when adding. */
  questionId?: string;
  /** Whether auto-translation is configured on this server. */
  translationOn: boolean;
  initial?: {
    difficulty: number;
    stem: string;
    choices: string[];
    answerIndex: number;
    solution: string;
  };
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [choices, setChoices] = useState<string[]>(() => {
    const start = initial?.choices ?? [];
    return [...start, ...Array(Math.max(0, 4 - start.length)).fill("")];
  });
  const [answerIndex, setAnswerIndex] = useState(initial?.answerIndex ?? 0);
  const [error, setError] = useState<string | null>(null);

  function submit(formData: FormData) {
    setError(null);

    // Blank choices are dropped and the answer index re-pointed at the same
    // choice it marked before the drop.
    const kept: string[] = [];
    let keptAnswer = -1;
    choices.forEach((choice, index) => {
      if (choice.trim().length === 0) return;
      if (index === answerIndex) keptAnswer = kept.length;
      kept.push(choice.trim());
    });
    if (keptAnswer === -1) {
      setError(t("appadmin.pickTheAnswer"));
      return;
    }

    const input = {
      difficulty: Number(formData.get("difficulty") ?? 1),
      stem: String(formData.get("stem") ?? ""),
      choices: kept,
      answerIndex: keptAnswer,
      solution: String(formData.get("solution") ?? ""),
    };

    startTransition(async () => {
      const result = questionId
        ? await updateQuestionAction(topicId, questionId, input)
        : await createQuestionAction(topicId, input);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({
        tone: "ok",
        title: t("appadmin.questionSaved"),
        description: result.translated
          ? t("appadmin.translatedToo")
          : t("appadmin.notTranslated"),
      });
      router.push(`/appadmin/bank/${topicId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
      }}
      className="space-y-4"
    >
      {error && (
        <p
          role="alert"
          className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
        >
          {error}
        </p>
      )}

      <TextAreaField
        label={t("appadmin.stemLabel")}
        name="stem"
        rows={3}
        required
        maxLength={2000}
        defaultValue={initial?.stem}
        hint={t("appadmin.stemHint")}
      />

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-fg">{t("appadmin.choicesLabel")}</legend>
        <p className="text-xs text-fg-muted">{t("appadmin.choicesHint")}</p>
        {choices.map((choice, index) => (
          <div key={index} className="flex items-center gap-3">
            <input
              type="radio"
              name="answer"
              aria-label={t("appadmin.correctOne", { n: index + 1 })}
              checked={answerIndex === index}
              onChange={() => setAnswerIndex(index)}
              className="size-4 shrink-0 accent-[--color-accent]"
            />
            <TextField
              label={t("appadmin.choiceN", { n: index + 1 })}
              className="flex-1"
              value={choice}
              maxLength={500}
              onChange={(event) => {
                const next = [...choices];
                next[index] = event.target.value;
                setChoices(next);
              }}
            />
          </div>
        ))}
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          <CheckCircleIcon weight="fill" className="size-4 text-ok" />
          {t("appadmin.radioMeans")}
        </p>
      </fieldset>

      <SelectField
        label={t("appadmin.levelLabel")}
        name="difficulty"
        defaultValue={String(initial?.difficulty ?? 1)}
        hint={t("appadmin.levelHint")}
      >
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <option key={level} value={level}>
            {t("appadmin.levelN", { n: level })} — {t(`practice.level${level}` as never)}
          </option>
        ))}
      </SelectField>

      <TextAreaField
        label={t("appadmin.solutionLabel")}
        name="solution"
        rows={3}
        required
        maxLength={4000}
        defaultValue={initial?.solution}
        hint={t("appadmin.solutionHint")}
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : t("appadmin.saveQuestion")}
        </Button>
        <p className="flex items-center gap-1.5 text-sm text-fg-muted">
          <TranslateIcon weight="bold" className="size-4" aria-hidden="true" />
          {translationOn ? t("appadmin.willTranslate") : t("appadmin.translationOff")}
        </p>
      </div>
    </form>
  );
}
