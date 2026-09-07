"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { reviseServe, reviseAnswer } from "../actions";
import type { RevisionItem } from "@/lib/practice-insights";

/**
 * The revision player: the queued questions one at a time, answered through
 * the same attempt machinery as ordinary practice — so a revision answer moves
 * the same ladder the original mistake moved.
 *
 * The queue is fixed at page load. Answering right removes a question from the
 * NEXT visit's queue (its latest verdict is now correct); answering wrong
 * simply re-queues it for another rest. Either way the child walks the whole
 * list once and is done — a queue that grows while you clear it never feels
 * clearable.
 *
 * Each question is its OWN component instance, keyed by question id, so moving
 * to the next one resets all per-question state by construction instead of by
 * a row of setState calls in an effect.
 */
export function RevisionPlayer({ queue }: { queue: RevisionItem[] }) {
  const t = useT();
  const [index, setIndex] = useState(0);

  if (index >= queue.length) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircleIcon weight="fill" className="size-10 text-ok" />
          <p className="font-semibold text-fg">{t("practice.revisionAllDone")}</p>
          <Button asChild variant="secondary">
            <Link href="/student/practice">{t("feature.practice")}</Link>
          </Button>
        </CardBody>
      </Card>
    );
  }

  const current = queue[index]!;
  return (
    <RevisionQuestion
      key={current.questionId}
      item={current}
      position={index + 1}
      total={queue.length}
      onNext={() => setIndex((i) => i + 1)}
    />
  );
}

function RevisionQuestion({
  item,
  position,
  total,
  onNext,
}: {
  item: RevisionItem;
  position: number;
  total: number;
  onNext: () => void;
}) {
  const t = useT();
  const [, startTransition] = useTransition();

  const [stem, setStem] = useState<string | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<{ correct: boolean; answerIndex: number; solution: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void reviseServe(item.questionId).then((served) => {
      if (cancelled) return;
      if (!served.ok) {
        setError(served.error);
        return;
      }
      setStem(served.stem);
      setChoices(served.choices);
    });
    return () => {
      cancelled = true;
    };
  }, [item.questionId]);

  if (error) {
    return (
      <Card>
        <CardBody className="py-8 text-center text-sm text-fg-muted">{error}</CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <div className="flex items-center justify-between text-xs text-fg-muted">
          <span>{item.topicName}</span>
          <span>{t("practice.revisionProgress", { done: position, total })}</span>
        </div>

        {stem === null ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <p className="font-medium text-fg">{stem}</p>
            <div className="grid gap-2">
              {choices.map((choice, i) => {
                const isAnswer = outcome !== null && i === outcome.answerIndex;
                const isChosenWrong = outcome !== null && chosen === i && !outcome.correct;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={outcome !== null}
                    onClick={() => {
                      setChosen(i);
                      startTransition(async () => {
                        const res = await reviseAnswer(item.questionId, i);
                        if (!res.ok) {
                          setError(res.error);
                          return;
                        }
                        setOutcome({
                          correct: res.result.correct,
                          answerIndex: res.result.answerIndex,
                          solution: res.result.solution,
                        });
                      });
                    }}
                    className={cn(
                      "rounded-lg border border-border px-3 py-2.5 text-left text-sm text-fg transition-colors",
                      outcome === null && "hover:border-accent hover:bg-surface-muted",
                      isAnswer && "border-ok bg-ok-soft",
                      isChosenWrong && "border-danger bg-danger-soft",
                    )}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            {outcome && (
              <div className="space-y-3">
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-sm font-semibold",
                    outcome.correct ? "text-ok" : "text-danger",
                  )}
                >
                  {outcome.correct ? (
                    <CheckCircleIcon weight="fill" className="size-4" />
                  ) : (
                    <XCircleIcon weight="fill" className="size-4" />
                  )}
                  {outcome.correct ? t("practice.gotIt") : t("practice.notThisTime")}
                </p>
                <p className="text-sm text-fg-muted">{outcome.solution}</p>
                <Button onClick={onNext}>{t("practice.nextQuestion")}</Button>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
