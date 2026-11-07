"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { onceAnswer } from "@/app/(app)/student/practice/actions";
import type { OnceView, OnceAnswered } from "@/lib/practice-once";
import { QuizFigure } from "@/components/quiz-figure";

/**
 * The one-time player (decision 0008): the question, the choices, the verdict with the working, the next question,
 * and the result when the last is answered. No reveal (there is no badge to forfeit and no second attempt), no
 * ladder; the server fixed the draw when the page opened and records each answer once.
 */
export function OncePlayer({ initial }: { initial: OnceView }) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [set, setSet] = useState(initial.set);
  const [question, setQuestion] = useState(initial.question);
  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<OnceAnswered | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = (index: number) => {
    if (!question || outcome || pending) return;
    setChosen(index);
    setError(null);
    startTransition(async () => {
      const r = await onceAnswer(initial.onceId, question.questionId, index);
      if (!r.ok) {
        setChosen(null);
        return setError(r.error);
      }
      setOutcome(r.result);
      setSet(r.result.set);
    });
  };
  const next = () => {
    setQuestion(outcome?.question ?? null);
    setOutcome(null);
    setChosen(null);
  };

  if (!question && !outcome) {
    return (
      <Card data-testid="once-result">
        <CardBody className="space-y-3">
          <p className="text-lg font-semibold text-fg">{t("practiceOnce.doneTitle")}</p>
          <p className="text-2xl font-bold tabular-nums text-fg">{t("practiceOnce.score", { correct: set.correct, total: set.total })}</p>
          <p className="text-sm text-fg-muted">{t("practiceOnce.doneBody")}</p>
          <Button asChild variant="secondary">
            <Link href="/student/practice">{t("practice.backToPractice")}</Link>
          </Button>
        </CardBody>
      </Card>
    );
  }
  if (!question) return null;

  return (
    <div className="space-y-4" data-testid="once-player">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="accent">{t(question.levelLabelKey)}</Badge>
        <span className="text-xs text-fg-muted">{t("practice.nOfTotal", { n: question.askedCount + 1, total: question.totalCount })}</span>
      </div>
      <Card>
        <CardBody className="space-y-4">
          {question.image && <QuizFigure fileId={question.image.fileId} alt={question.image.alt} />}
          <p className="text-lg font-semibold text-fg">{question.stem}</p>
          <ul className="space-y-2">
            {question.choices.map((choice, i) => {
              const marked = outcome !== null;
              const isAnswer = marked && outcome.answerIndex === i;
              const isChosen = chosen === i;
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={marked || pending}
                    onClick={() => choose(i)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-[var(--radius-md)] border px-4 py-2 text-left text-sm",
                      isAnswer ? "border-ok bg-ok-soft text-fg" : isChosen && marked ? "border-danger bg-danger-soft text-fg" : "border-border bg-surface text-fg hover:bg-surface-muted",
                    )}
                    data-testid="once-choice"
                  >
                    <span className="font-semibold">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1">{choice}</span>
                    {isAnswer && <CheckCircleIcon weight="fill" className="size-5 text-ok" aria-hidden />}
                    {isChosen && marked && !isAnswer && <XCircleIcon weight="fill" className="size-5 text-danger" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
          {outcome && (
            <div className="space-y-2 rounded-[var(--radius-md)] bg-surface-muted px-4 py-3" data-testid="once-verdict" data-correct={outcome.correct ? "yes" : "no"}>
              <p className={cn("text-sm font-semibold", outcome.correct ? "text-ok" : "text-danger")}>{outcome.correct ? t("practice.gotIt") : t("practice.notThisTime")}</p>
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{t("practice.howItWorks")}</p>
              <p className="text-sm text-fg">{outcome.solution}</p>
            </div>
          )}
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          {outcome && (
            <Button type="button" onClick={next} data-testid="once-next">
              {outcome.question ? t("practice.nextQuestion") : t("practiceOnce.result")}
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
