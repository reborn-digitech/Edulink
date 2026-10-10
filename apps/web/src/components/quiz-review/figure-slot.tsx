"use client";

import { ImageIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { QuizFigure } from "@/components/quiz-figure";
import { useT } from "@/lib/i18n";

/**
 * Where the item's figure sits on the review desk. scripts/quiz-queue.ts draws and stores a generated
 * item's figure when it loads the batch (quiz-board, 11 October 2026), so the reviewer sees the English
 * drawing here, as a pupil would, with its words; a figure the loader could not draw shows "Figure
 * failed" and the reason, and an item that needs a figure cannot be accepted until one is stored
 * (quiz-review.ts). Before the loader drew figures this box only said "Figure pending".
 */
export function FigureSlot({
  figure,
  imageAlt,
  imageKey,
  needsFigure,
  figureError = null,
}: {
  figure: { kind: string; spec: Record<string, unknown> } | null;
  imageAlt: string | null;
  imageKey: string | null;
  needsFigure: boolean;
  figureError?: string | null;
}) {
  const t = useT();
  if (!figure && !needsFigure && !imageKey) return <p className="text-sm text-fg-muted">{t("quizReview.figureNone")}</p>;
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-dashed border-border-strong bg-surface-muted p-3" data-testid="figure-slot">
      <div className="flex flex-wrap items-center gap-2">
        <ImageIcon weight="duotone" className="size-5 text-fg-subtle" aria-hidden="true" />
        {imageKey ? (
          <Badge tone="ok">{t("quizReview.figureStored")}</Badge>
        ) : figureError ? (
          <Badge tone="danger">{t("quizBoard.figureFailed")}</Badge>
        ) : (
          <Badge tone="warn">{t("quizReview.figurePending")}</Badge>
        )}
        {figure && <Badge tone="outline">{figure.kind}</Badge>}
      </div>
      {imageKey && <QuizFigure fileId={imageKey} alt={imageAlt ?? ""} className="max-w-xl" />}
      {imageAlt && <p className="text-sm leading-relaxed">{imageAlt}</p>}
      {!imageKey && figureError && (
        <p role="note" className="text-xs text-danger">
          {t("quizBoard.figureFailedBody", { reason: figureError })}
        </p>
      )}
      {!imageKey && !figureError && <p className="text-xs text-fg-muted">{t("quizReview.figurePendingBody")}</p>}
    </div>
  );
}
