"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarIcon, CheckCircleIcon, ClockIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { rate } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";
import { QUESTION_KEY } from "@/lib/review-questions";
import { REVIEW_QUESTIONS, REVIEW_SCALE_MAX, type ReviewQuestion } from "@/lib/constants";
import { PersonLink } from "@/components/person-link";

/**
 * One teacher's questionnaire: five fixed questions, five stars each, no
 * text box anywhere — that absence is the design, not an omission. Answers
 * can be amended while the round is open; the card says which state it is in.
 */
export function RateCard({
  roundId,
  teacherMembershipId,
  teacherName,
  closesDateKey,
  initial,
}: {
  roundId: string;
  teacherMembershipId: string;
  teacherName: string;
  /** Already formatted for display — the page formats it on the server. */
  closesDateKey: string;
  initial: Partial<Record<ReviewQuestion, number>> | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [scores, setScores] = useState<Partial<Record<ReviewQuestion, number>>>(initial ?? {});
  const [error, setError] = useState<string | null>(null);
  const answered = initial !== null;

  const complete = REVIEW_QUESTIONS.every((question) => typeof scores[question] === "number");

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await rate({
        roundId,
        teacherMembershipId,
        scores: scores as Record<string, number>,
      });
      if (!result.ok) {
        setError(actionError(t, result, "reviews.couldNotSend"));
        return;
      }
      toast({ tone: "ok", title: t("reviews.savedThanks") });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <PersonLink membershipId={teacherMembershipId} name={teacherName} className="font-semibold text-fg" />
        <p className="inline-flex items-center gap-1 text-xs text-fg-muted">
          {answered ? (
            <>
              <CheckCircleIcon weight="fill" className="size-3.5 text-ok" />
              {t("reviews.answered")}
            </>
          ) : (
            <>
              <ClockIcon weight="fill" className="size-3.5" />
              {t("reviews.openUntil", { date: closesDateKey })}
            </>
          )}
        </p>
      </div>

      <ul className="mt-3 space-y-2.5">
        {REVIEW_QUESTIONS.map((question) => {
          const value = scores[question] ?? 0;
          return (
            <li key={question}>
              <fieldset>
                <legend className="text-sm text-fg">{t(QUESTION_KEY[question])}</legend>
                <div
                  className="mt-1 flex items-center gap-1"
                  role="radiogroup"
                  aria-label={t(QUESTION_KEY[question])}
                >
                  <span className="mr-1 text-[0.65rem] uppercase tracking-wide text-fg-subtle">
                    {t("reviews.scaleLow")}
                  </span>
                  {Array.from({ length: REVIEW_SCALE_MAX }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={value === n}
                      aria-label={String(n)}
                      onClick={() => setScores((prev) => ({ ...prev, [question]: n }))}
                      className="tap grid place-items-center rounded-full p-1 transition-transform active:scale-90"
                    >
                      <StarIcon
                        weight={n <= value ? "fill" : "regular"}
                        className={cn("size-6", n <= value ? "text-warn" : "text-fg-subtle")}
                      />
                    </button>
                  ))}
                  <span className="ml-1 text-[0.65rem] uppercase tracking-wide text-fg-subtle">
                    {t("reviews.scaleHigh")}
                  </span>
                </div>
              </fieldset>
            </li>
          );
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <Button className="mt-3" size="sm" loading={pending} disabled={!complete} onClick={submit}>
        {t("reviews.send")}
      </Button>
    </div>
  );
}
