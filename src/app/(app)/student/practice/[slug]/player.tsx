"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MedalIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { begin, answer, advance, reveal } from "../actions";
import type { ServedQuestion } from "@/lib/quiz";

/**
 * The practice player.
 *
 * THREE STATES, and all three are here rather than assumed: loading while the
 * first question is fetched, the question itself, and the finished screen. The
 * fourth — an error — is its own branch, because a child staring at a spinner
 * that will never resolve has no way to tell that something broke.
 *
 * THE REVEAL BUTTON SAYS WHAT IT COSTS, BEFORE it is pressed and again in the
 * confirmation. A child who loses a badge to a button they did not understand
 * learns that the app is unfair, which is a worse outcome than their not having
 * looked at the solution.
 *
 * After ANSWERING, the solution appears free. Reading why you were wrong is
 * marking, not peeking, and charging for it would make the badge reward not
 * looking things up — which is the opposite of the point.
 */
export function Player({
  slug,
  topicName,
  totalCount,
  alreadyEarned,
}: {
  slug: string;
  topicName: string;
  totalCount: number;
  alreadyEarned: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [question, setQuestion] = useState<ServedQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [chosen, setChosen] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<{
    correct: boolean;
    answerIndex: number;
    solution: string;
  } | null>(null);
  const [peeked, setPeeked] = useState<{ solution: string; answerIndex: number } | null>(null);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [forfeited, setForfeited] = useState(false);
  const [done, setDone] = useState<{ badgeAwarded: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await begin(slug);
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setAttemptId(result.attemptId);
      setQuestion(result.question);
      if (!result.question) setDone({ badgeAwarded: false });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  function choose(index: number) {
    if (!attemptId || !question || outcome) return;
    setChosen(index);
    startTransition(async () => {
      const result = await answer(attemptId, question.questionId, index);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOutcome({
        correct: result.result.correct,
        answerIndex: result.result.answerIndex,
        solution: result.result.solution,
      });
      if (result.result.finished) setDone({ badgeAwarded: result.result.badgeAwarded });
    });
  }

  function next() {
    if (!attemptId) return;
    startTransition(async () => {
      const result = await advance(attemptId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setChosen(null);
      setOutcome(null);
      setPeeked(null);
      setConfirmReveal(false);
      if (!result.question) setDone((d) => d ?? { badgeAwarded: false });
      else setQuestion(result.question);
    });
  }

  function doReveal() {
    if (!attemptId || !question) return;
    startTransition(async () => {
      const result = await reveal(attemptId, question.questionId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPeeked({ solution: result.solution, answerIndex: result.answerIndex });
      setConfirmReveal(false);
      if (result.badgeForfeited) setForfeited(true);
    });
  }

  /* ---------------- error ---------------- */
  if (error) {
    return (
      <Card>
        <CardBody className="space-y-3 pt-5 text-center">
          <WarningIcon weight="fill" className="mx-auto size-8 text-warn" />
          <p className="font-semibold text-fg">{error}</p>
          <Button variant="secondary" onClick={() => router.refresh()}>
            {t("practice.tryAgain")}
          </Button>
        </CardBody>
      </Card>
    );
  }

  /* ---------------- loading ---------------- */
  if (loading) {
    return (
      <Card>
        <CardBody className="space-y-3 pt-5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardBody>
      </Card>
    );
  }

  /* ---------------- finished ---------------- */
  if (done && !question) {
    return (
      <Card className={done.badgeAwarded ? "border-accent/40 bg-accent-soft/30" : undefined}>
        <CardBody className="space-y-3 pt-6 text-center">
          {done.badgeAwarded || alreadyEarned ? (
            <>
              <MedalIcon weight="fill" className="mx-auto size-12 text-accent-strong" />
              <h2 className="text-xl font-bold text-fg">{t("practice.doneNoPeek", { topic: topicName })}</h2>
              <p className="mx-auto max-w-sm text-sm text-fg-muted">{t("practice.badgeYours")}</p>
            </>
          ) : (
            <>
              <CheckCircleIcon weight="fill" className="mx-auto size-12 text-ok" />
              <h2 className="text-xl font-bold text-fg">{t("practice.finishedTitle", { topic: topicName })}</h2>
              <p className="mx-auto max-w-sm text-sm text-fg-muted">{t("practice.wentThroughAll")}</p>
            </>
          )}
          <Button asChild variant="secondary">
            <a href="/student/practice">{t("practice.backToPractice")}</a>
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!question) return null;

  const shown = outcome ?? peeked;
  const revealedAnswer = outcome?.answerIndex ?? peeked?.answerIndex ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge tone="accent" size="sm">
          {t(question.levelLabelKey)}
        </Badge>
        <span className="text-xs text-fg-muted">
          {t("practice.nOfTotal", { n: question.askedCount + 1, total: totalCount || question.totalCount })}
        </span>
      </div>

      <div
        className="h-1.5 overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-valuenow={question.askedCount}
        aria-valuemin={0}
        aria-valuemax={question.totalCount}
        aria-label={t("practice.questionsAnswered")}
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-[--dur-slow]"
          style={{ width: `${(question.askedCount / Math.max(1, question.totalCount)) * 100}%` }}
        />
      </div>

      <Card>
        <CardBody className="space-y-4 pt-5">
          <p className="text-lg font-medium leading-relaxed text-fg">{question.stem}</p>

          <ul className="space-y-2">
            {question.choices.map((choice, index) => {
              const isAnswer = revealedAnswer === index;
              const isChosen = chosen === index;
              return (
                <li key={index}>
                  <button
                    type="button"
                    disabled={pending || outcome !== null}
                    onClick={() => choose(index)}
                    aria-pressed={isChosen}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[--radius-md] border p-3.5 text-left transition-colors",
                      "disabled:cursor-default",
                      !shown && "border-border hover:bg-surface-muted",
                      // Right and wrong are never colour alone — each carries an
                      // icon as well. WCAG 1.4.1.
                      shown && isAnswer && "border-ok bg-ok-soft/60",
                      shown && isChosen && !isAnswer && "border-danger bg-danger-soft/60",
                      shown && !isAnswer && !isChosen && "border-border opacity-60",
                    )}
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full border border-border-strong text-xs font-bold">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="flex-1 text-[0.9375rem] text-fg">{choice}</span>
                    {shown && isAnswer && (
                      <CheckCircleIcon weight="fill" className="size-5 shrink-0 text-ok" />
                    )}
                    {shown && isChosen && !isAnswer && (
                      <XCircleIcon weight="fill" className="size-5 shrink-0 text-danger" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {shown && (
            <div className="rounded-[--radius-md] border border-border bg-surface-muted p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                {t("practice.howItWorks")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg">
                {outcome?.solution ?? peeked?.solution}
              </p>
            </div>
          )}

          {forfeited && (
            <p className="text-xs text-fg-muted">
              {t("practice.forfeitedNote", { topic: topicName })}
            </p>
          )}

          {/* ---------------- controls ---------------- */}
          {outcome ? (
            <Button block onClick={next} loading={pending}>
              {t("practice.nextQuestion")}
            </Button>
          ) : peeked ? (
            <Button block variant="secondary" onClick={next} loading={pending}>
              {t("practice.skipNext")}
            </Button>
          ) : confirmReveal ? (
            <div className="space-y-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft/30 p-3.5">
              <p className="text-sm font-medium text-fg">
                {forfeited
                  ? t("practice.showWorkingThis")
                  : t("practice.noBadgeThisRun", { topic: topicName })}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button size="sm" variant="secondary" loading={pending} onClick={doReveal}>
                  {t("practice.yesShowMe")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirmReveal(false)}>
                  {t("practice.keepTrying")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              block
              variant="ghost"
              icon={<EyeIcon weight="bold" className="size-4" />}
              onClick={() => setConfirmReveal(true)}
            >
              {t("practice.showMeHow")}
            </Button>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
