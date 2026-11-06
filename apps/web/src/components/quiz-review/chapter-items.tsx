"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowArcLeftIcon, PencilSimpleIcon, ProhibitIcon } from "@phosphor-icons/react";
import { QUIZ_TAKEDOWN_REASONS, type QuizBankChapterItem, type QuizReviewEditBody, type QuizReviewItem, type QuizTakeDownReason } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { QuizFigure } from "@/components/quiz-figure";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { editAction, itemAction, putBackAction, takeDownHereAction } from "@/app/appadmin/quiz-review/actions";
import { ItemEditForm } from "./edit-form";

/** An item as the page hands it over: the contract's, its position on the page, the "made" line already in words, and a curated item's file (null: none holds it). */
export type ChapterListItem = QuizBankChapterItem & { n: number; made: string; file: string | null };

type Mode = { id: string; kind: "edit"; item: QuizReviewItem } | { id: string; kind: "takeDown" } | null;

/**
 * A chapter's questions on the bank desk (the owner's ask of 20 October 2026): each with its kind, its level, the four
 * options with the key marked, the solution folded, the figure in the language read, a note where the language's words
 * are not the translation's, who made it, and the desk's presses through its own server actions (src/lib/quiz-review.ts
 * is the one writer): Take down with a coded reason and Put back for either kind (one bank, 7 Nov 2026), Edit (all
 * three languages) for a generated item alone. A curated item names the file its words are changed in and imported
 * again; one written in the app names the folder and the chapter's slug and links to the bank editor instead.
 */
export function ChapterItems({ items, topicId, slug, folder, bankEditor }: { items: ChapterListItem[]; topicId: string; slug: string; folder: string; bankEditor: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<Mode>(null);
  const [reason, setReason] = useState<QuizTakeDownReason>(QUIZ_TAKEDOWN_REASONS[0]);

  const run = (work: () => Promise<{ ok: true; item: QuizReviewItem } | { ok: false; error: string }>, done: TranslationKey) => {
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      toast({ tone: "ok", title: t(done) });
      setMode(null);
      router.refresh();
    });
  };

  const openEdit = (id: string) => {
    startTransition(async () => {
      const result = await itemAction(id);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error });
        return;
      }
      setMode({ id, kind: "edit", item: result.item });
    });
  };

  const reasonLabel = (r: QuizTakeDownReason) => t(`quizReview.reason${r}` as TranslationKey);

  return (
    <ol className="space-y-4" data-testid="chapter-items">
      {items.map((item) => {
        const editing = mode?.id === item.id && mode.kind === "edit" ? mode.item : null;
        const takingDown = mode?.id === item.id && mode.kind === "takeDown";
        return (
          <li key={item.id}>
            <Card aria-busy={(pending && mode?.id === item.id) || undefined}>
              <CardBody className="space-y-3 pt-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">{t("bankDesk.itemNumber", { n: item.n })}</h2>
                  <Badge tone="accent" size="sm">
                    {t("quizReview.levelOption", { level: item.difficulty })}
                  </Badge>
                  <Badge tone={item.kind === "GENERATED" ? "info" : "outline"} size="sm">
                    {t(`quizReview.kind${item.kind}`)}
                  </Badge>
                  {item.state === "DOWN" && (
                    <Badge tone="danger" size="sm">
                      {t("quizReview.statusDown", { reason: item.takenDownReason ? reasonLabel(item.takenDownReason) : "—" })}
                    </Badge>
                  )}
                  {item.state === "HELD" && (
                    <Badge tone="warn" size="sm">
                      {t("quizReview.statusHeld")}
                    </Badge>
                  )}
                </div>

                {item.notes.map((note) => (
                  <p key={note} role="note" className="rounded-[var(--radius-md)] bg-warn-soft px-3 py-2 text-sm text-warn">
                    {t(`bankDesk.note${note}`)}
                  </p>
                ))}

                {editing ? (
                  <ItemEditForm key={item.id} item={editing} pending={pending} onSave={(body: QuizReviewEditBody) => run(() => editAction(item.id, body), "quizReview.edited")} onCancel={() => setMode(null)} />
                ) : (
                  <div lang={item.language} className="space-y-3">
                    <p className="whitespace-pre-line leading-relaxed">{item.stem}</p>
                    {item.imageKey ? (
                      <QuizFigure fileId={item.imageKey} alt={item.imageAlt ?? ""} className="max-w-xl" />
                    ) : item.needsFigure ? (
                      <p className="text-sm text-warn">{t("quizReview.figurePending")}</p>
                    ) : null}
                    <ol className="grid gap-2 sm:grid-cols-2">
                      {item.choices.map((choice, i) => {
                        const key = i === item.answerIndex;
                        return (
                          <li key={i} className={key ? "flex items-start justify-between gap-2 rounded-[var(--radius-md)] border-2 border-ok bg-ok-soft p-2.5" : "rounded-[var(--radius-md)] border border-border p-2.5"}>
                            <span>
                              <span className="mr-2 tabular-nums text-fg-muted">{i + 1}.</span>
                              {choice}
                            </span>
                            {key && (
                              <Badge tone="ok" size="sm">
                                {t("quizReview.keyMark")}
                              </Badge>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                    <details className="rounded-[var(--radius-md)] border border-border px-3 py-2">
                      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">{t("quizReview.solutionLabel")}</summary>
                      <p className="whitespace-pre-line pb-2 text-sm leading-relaxed">{item.solution}</p>
                    </details>
                  </div>
                )}

                <p className="text-xs text-fg-muted">
                  {item.made} · {t("quizReview.sourceLine", { source: item.source })}
                </p>

                {takingDown && (
                  <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
                    <legend className="px-1 text-sm font-semibold">{t("quizReview.takeDownReason")}</legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {QUIZ_TAKEDOWN_REASONS.map((r) => (
                        <Button key={r} size="sm" variant={reason === r ? "soft" : "secondary"} className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left" onClick={() => setReason(r)} disabled={pending} aria-pressed={reason === r}>
                          {reasonLabel(r)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant="danger" onClick={() => run(() => takeDownHereAction(item.id, reason), "quizReview.tookDown")} disabled={pending}>
                        {t("quizReview.confirmTakeDown")}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setMode(null)} disabled={pending}>
                        {t("quizReview.cancelEdit")}
                      </Button>
                    </div>
                  </fieldset>
                )}

                {!editing && !takingDown && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.kind === "GENERATED" && (
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item.id)} disabled={pending}>
                          <PencilSimpleIcon aria-hidden="true" />
                          {t("quizReview.edit")}
                        </Button>
                      )}
                      {item.state === "DOWN" ? (
                        <Button size="sm" onClick={() => run(() => putBackAction(item.id), "quizReview.putBackDone")} disabled={pending}>
                          <ArrowArcLeftIcon aria-hidden="true" />
                          {t("quizReview.putBack")}
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setMode({ id: item.id, kind: "takeDown" })} disabled={pending}>
                          <ProhibitIcon aria-hidden="true" />
                          {t("quizReview.takeDown")}
                        </Button>
                      )}
                    </div>
                    {item.kind === "CURATED" && (
                      <p className="text-sm text-fg-muted" data-testid="curated-note">
                        {item.file ? (
                          t("bankDesk.curatedFileNote", { file: item.file })
                        ) : (
                          <>
                            {t("bankDesk.curatedNoFileNote", { folder, slug })}{" "}
                            {bankEditor && (
                              <Link href={`/appadmin/bank/${encodeURIComponent(topicId)}`} className="inline-flex min-h-11 items-center text-accent-strong underline underline-offset-4">
                                {t("bankDesk.openBankEditor")}
                              </Link>
                            )}
                          </>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
