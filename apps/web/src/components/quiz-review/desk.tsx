"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon, CheckIcon, KeyboardIcon, PencilSimpleIcon, SealCheckIcon, TrashIcon } from "@phosphor-icons/react";
import { isCollegeClassLevel, QUIZ_DISCARD_REASONS, type QuizDiscardReason, type QuizReviewItem, type QuizReviewNext, type QuizReviewQuery } from "@edulink/contracts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { acceptAction, discardAction, editAcceptAction, nextItemAction, stampLanguageAction } from "@/app/appadmin/quiz-review/actions";
import { FigureSlot } from "./figure-slot";
import { quizBoardKey } from "@/lib/quiz-board";
import { formatInZone } from "@/lib/dates";

type Mode = "view" | "edit" | "discard";
type Draft = { stem: string; choices: string[]; answerIndex: number; solution: string; checkExpr: string; difficulty: number };

/** The desk's keys: one letter per press, never while a field has the focus. */
const KEYS = [
  { key: "a", labelKey: "quizReview.keyAccept" },
  { key: "e", labelKey: "quizReview.keyEdit" },
  { key: "d", labelKey: "quizReview.keyDiscard" },
  { key: "h", labelKey: "quizReview.keyHindi" },
  { key: "m", labelKey: "quizReview.keyMarathi" },
  { key: "s", labelKey: "quizReview.keySkip" },
] as const satisfies readonly { key: string; labelKey: TranslationKey }[];

const draftOf = (item: QuizReviewItem): Draft => ({
  stem: item.stem,
  choices: [...item.choices],
  answerIndex: item.answerIndex,
  solution: item.solution,
  checkExpr: item.checkExpr ?? "",
  difficulty: item.difficulty,
});

function typingInAField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["input", "textarea", "select"].includes(target.tagName.toLowerCase());
}

/**
 * One generated item at a time, with everything the plan puts in front of a reviewer (Phase 1 "Output
 * and review"): the stem, the options with the key marked and each distractor's reason beside it, the
 * solution, the check expression, the blind solver's answers, the figure, the Hindi and the Marathi side
 * by side, and the presses — accept, edit then accept, discard with a coded reason, stamp either
 * language, skip — each on a key so a reviewer can move fast. Skipped items come back on the next visit.
 */
export function ReviewDesk({
  initial,
  query,
  subjectLabels,
  translationsHref,
}: {
  initial: QuizReviewNext;
  query: Omit<QuizReviewQuery, "skip">;
  subjectLabels: Record<string, string>;
  translationsHref: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [item, setItem] = useState<QuizReviewItem | null>(initial.item);
  const [remaining, setRemaining] = useState(initial.remaining);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<Draft | null>(initial.item ? draftOf(initial.item) : null);
  const [reason, setReason] = useState<QuizDiscardReason>(QUIZ_DISCARD_REASONS[0]);
  const heading = useRef<HTMLHeadingElement>(null);

  const show = useCallback((next: QuizReviewNext) => {
    setItem(next.item);
    setRemaining(next.remaining);
    setDraft(next.item ? draftOf(next.item) : null);
    setMode("view");
    heading.current?.focus();
  }, []);

  const queryWith = useCallback((skip: string[]): QuizReviewQuery => ({ ...query, ...(skip.length ? { skip: skip.join(",") } : {}) }), [query]);

  const move = useCallback(
    (work: () => Promise<{ ok: true; next: QuizReviewNext } | { ok: false; error: string }>, done?: TranslationKey) => {
      startTransition(async () => {
        const result = await work();
        if (!result.ok) {
          toast({ tone: "danger", title: result.error });
          return;
        }
        if (done) toast({ tone: "ok", title: t(done) });
        show(result.next);
        router.refresh();
      });
    },
    [router, show, t, toast],
  );

  const accept = useCallback(() => {
    if (!item) return;
    move(() => acceptAction(item.id, queryWith(skipped)), "quizReview.accepted");
  }, [item, move, queryWith, skipped]);

  const saveEdit = useCallback(() => {
    if (!item || !draft) return;
    const body = { ...draft, checkExpr: draft.checkExpr.trim() || null };
    move(() => editAcceptAction(item.id, body, queryWith(skipped)), "quizReview.accepted");
  }, [draft, item, move, queryWith, skipped]);

  const discard = useCallback(
    (why: QuizDiscardReason) => {
      if (!item) return;
      move(() => discardAction(item.id, why, queryWith(skipped)), "quizReview.discarded");
    },
    [item, move, queryWith, skipped],
  );

  const skip = useCallback(() => {
    if (!item) return;
    const next = [...skipped, item.id];
    setSkipped(next);
    move(() => nextItemAction(queryWith(next)));
  }, [item, move, queryWith, skipped]);

  const stamp = useCallback(
    (language: "hi" | "mr") => {
      if (!item) return;
      const row = item.translations[language];
      if (!row) return;
      const on = row.stampedAt === null;
      startTransition(async () => {
        const result = await stampLanguageAction(item.id, language, on);
        if (!result.ok) {
          toast({ tone: "danger", title: result.error });
          return;
        }
        toast({ tone: "ok", title: t(on ? "quizReview.languageStamped" : "quizReview.languageUnstamped") });
        setItem(result.item);
        router.refresh();
      });
    },
    [item, router, t, toast],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (pending || !item || event.metaKey || event.ctrlKey || event.altKey || typingInAField(event.target)) return;
      const key = event.key.toLowerCase();
      if (mode === "discard") {
        if (key === "escape") setMode("view");
        const n = Number(key);
        if (Number.isInteger(n) && n >= 1 && n <= QUIZ_DISCARD_REASONS.length) {
          event.preventDefault();
          discard(QUIZ_DISCARD_REASONS[n - 1]!);
        }
        return;
      }
      if (mode === "edit") {
        if (key === "escape") setMode("view");
        return;
      }
      const action: Record<string, () => void> = {
        a: accept,
        e: () => setMode("edit"),
        d: () => setMode("discard"),
        h: () => stamp("hi"),
        m: () => stamp("mr"),
        s: skip,
      };
      const run = action[key];
      if (run) {
        event.preventDefault();
        run();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [accept, discard, item, mode, pending, skip, stamp]);

  if (!item) {
    return <EmptyState icon={<SealCheckIcon weight="duotone" className="size-8" />} title={t("quizReview.empty")} description={t("quizReview.emptyBody")} />;
  }

  const subject = subjectLabels[item.topic.subject] ?? item.topic.subject;
  const solverTally = item.choices.map((_, i) => item.solverAnswers.filter((a) => a === i).length);

  return (
    <Card aria-busy={pending || undefined}>
      <div className="p-5 pb-3">
        {/* Focus lands here when the next item comes up, so a screen reader hears where the reviewer now is. */}
        <h2 ref={heading} tabIndex={-1} className="text-base font-semibold text-fg outline-none">
          {isCollegeClassLevel(item.topic.grade) ? t("quizReview.itemHeadingCollege", { subject, chapter: item.topic.chapter }) : t("quizReview.itemHeading", { subject, grade: item.topic.grade, chapter: item.topic.chapter })}
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">{t("quizReview.filtered", { count: remaining })}</p>
      </div>
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {item.board && <Badge tone="info">{quizBoardKey(item.board) ? t(quizBoardKey(item.board)!) : item.board}</Badge>}
          <Badge tone="accent">{t("quizReview.levelOption", { level: item.difficulty })}</Badge>
          {item.levelFlag && <Badge tone="warn">{t("quizReview.levelFlag", { flag: item.levelFlag })}</Badge>}
          {item.editedAfterSolvingAt && <Badge tone="warn">{t("quizReview.editedAfterSolving")}</Badge>}
        </div>

        {/* The presses, first on the page so a phone reaches them without scrolling past the item. */}
        {mode === "view" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={accept} disabled={pending}>
              <CheckIcon weight="bold" aria-hidden="true" />
              {t("quizReview.accept")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMode("edit")} disabled={pending}>
              <PencilSimpleIcon aria-hidden="true" />
              {t("quizReview.edit")}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setMode("discard")} disabled={pending}>
              <TrashIcon aria-hidden="true" />
              {t("quizReview.discard")}
            </Button>
            <Button size="sm" variant="ghost" onClick={skip} disabled={pending}>
              <ArrowRightIcon aria-hidden="true" />
              {t("quizReview.skip")}
            </Button>
          </div>
        )}

        {mode === "discard" && (
          <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
            <legend className="px-1 text-sm font-semibold">{t("quizReview.discardReason")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUIZ_DISCARD_REASONS.map((r, i) => (
                <Button key={r} size="sm" variant={reason === r ? "soft" : "secondary"} className="justify-start text-left" onClick={() => setReason(r)} disabled={pending} aria-pressed={reason === r}>
                  <span className="tabular-nums text-fg-muted">{i + 1}</span>
                  {t(`quizReview.reason${r}` as TranslationKey)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="danger" onClick={() => discard(reason)} disabled={pending}>
                {t("quizReview.confirmDiscard")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("view")} disabled={pending}>
                {t("quizReview.cancelEdit")}
              </Button>
            </div>
          </fieldset>
        )}

        {mode === "edit" && draft ? (
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              saveEdit();
            }}
          >
            <TextAreaField label={t("quizReview.stemLabel")} value={draft.stem} onChange={(e) => setDraft({ ...draft, stem: e.target.value })} required />
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("quizReview.optionsLabel")}</legend>
              {draft.choices.map((choice, i) => (
                <div key={i} className="flex items-end gap-2">
                  <label className="flex min-h-11 min-w-11 items-center justify-center" title={t("quizReview.correctAnswer")}>
                    <input type="radio" name="key" className="size-5" checked={draft.answerIndex === i} onChange={() => setDraft({ ...draft, answerIndex: i })} aria-label={t("quizReview.correctAnswer")} />
                  </label>
                  <TextField
                    className="flex-1"
                    label={t("quizReview.optionN", { n: i + 1 })}
                    value={choice}
                    onChange={(e) => setDraft({ ...draft, choices: draft.choices.map((c, j) => (j === i ? e.target.value : c)) })}
                    required
                  />
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
            <div className="flex flex-wrap gap-2">
              <Button size="sm" type="submit" disabled={pending}>
                <CheckIcon weight="bold" aria-hidden="true" />
                {t("quizReview.saveAccept")}
              </Button>
              <Button size="sm" variant="ghost" type="button" onClick={() => { setDraft(draftOf(item)); setMode("view"); }} disabled={pending}>
                {t("quizReview.cancelEdit")}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.stemLabel")}</h3>
              <p className="whitespace-pre-line leading-relaxed">{item.stem}</p>
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.figureLabel")}</h3>
              <FigureSlot figure={item.figure} imageAlt={item.imageAlt} imageKey={item.imageKey} needsFigure={item.needsFigure} figureError={item.figureError ?? null} />
            </section>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.optionsLabel")}</h3>
              <ol className="space-y-2">
                {item.choices.map((choice, i) => {
                  const key = i === item.answerIndex;
                  const why = item.distractorReasons[i];
                  return (
                    <li key={i} className={key ? "rounded-[var(--radius-md)] border-2 border-ok bg-ok-soft p-3" : "rounded-[var(--radius-md)] border border-border p-3"}>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <span>
                          <span className="mr-2 tabular-nums text-fg-muted">{i + 1}.</span>
                          {choice}
                        </span>
                        <span className="flex flex-wrap gap-1">
                          {key && <Badge tone="ok">{t("quizReview.keyMark")}</Badge>}
                          {solverTally[i]! > 0 && <Badge tone={key ? "neutral" : "warn"}>{t("quizReview.solverPick", { option: `${i + 1} × ${solverTally[i]}` })}</Badge>}
                        </span>
                      </div>
                      {!key && why && (
                        <p className="mt-1 text-sm text-fg-muted">
                          <span className="font-medium">{t("quizReview.distractorLabel")}: </span>
                          {why}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.solverLabel")}</h3>
              {item.solverAnswers.length ? (
                <p className="flex flex-wrap gap-1">
                  {item.solverAnswers.map((a, i) => (
                    <Badge key={i} tone={a === item.answerIndex ? "ok" : "warn"}>
                      {t("quizReview.solverPick", { option: a + 1 })}
                    </Badge>
                  ))}
                </p>
              ) : (
                <p className="text-sm text-fg-muted">{t("quizReview.solverNone")}</p>
              )}
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.solutionLabel")}</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed">{item.solution}</p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.checkLabel")}</h3>
              {item.checkExpr ? <code className="rounded bg-surface-muted px-2 py-1 text-sm">{item.checkExpr}</code> : <p className="text-sm text-fg-muted">{t("quizReview.checkNone")}</p>}
            </section>

            {item.critique && <p className="text-sm text-fg-muted">{t("quizReview.critique", { note: item.critique })}</p>}
            <p className="text-xs text-fg-muted">
              {t("quizReview.sourceLine", { source: item.source })}
              {item.edition && <> · {t("quizReview.editionLine", { edition: item.edition })}</>}
              {item.model && <> · {t("quizReview.modelLine", { model: item.model })}</>}
            </p>
          </>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {(["hi", "mr"] as const).map((language) => {
            const row = item.translations[language];
            const name = t(language === "hi" ? "gigs.hindi" : "gigs.marathi");
            return (
              <section key={language} lang={language} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{name}</h3>
                  {row?.stampedAt ? <Badge tone="ok">{t("quizReview.translationStamped", { name: row.stampedBy ?? "—" })}</Badge> : row ? <Badge tone="warn">{t("quizReview.translationUnstamped")}</Badge> : null}
                </div>
                {!row ? (
                  <p className="text-sm text-fg-muted">{t("quizReview.translationMissing")}</p>
                ) : (
                  <>
                    {row.stale && <p className="text-sm text-warn">{t("quizReview.translationStale")}</p>}
                    {row.flag && <p className="text-sm text-warn">{t("quizReview.translationFlag", { flag: row.flag })}</p>}
                    <p className="whitespace-pre-line leading-relaxed">{row.stem}</p>
                    <ol className="space-y-1 text-sm">
                      {row.choices.map((choice, i) => (
                        <li key={i} className={i === item.answerIndex ? "font-semibold text-ok" : undefined}>
                          <span className="mr-2 tabular-nums text-fg-muted">{i + 1}.</span>
                          {choice}
                        </li>
                      ))}
                    </ol>
                    <p className="whitespace-pre-line text-sm text-fg-muted">{row.solution}</p>
                    {row.imageAlt && <p className="text-xs text-fg-muted">{row.imageAlt}</p>}
                    {row.critique && <p className="text-xs text-fg-muted">{t("quizReview.critique", { note: row.critique })}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Button size="sm" variant={row.stampedAt ? "ghost" : "soft"} onClick={() => stamp(language)} disabled={pending || mode !== "view"}>
                        {t(row.stampedAt ? (language === "hi" ? "quizReview.unstampHindi" : "quizReview.unstampMarathi") : language === "hi" ? "quizReview.stampHindi" : "quizReview.stampMarathi")}
                      </Button>
                      <Button asChild size="sm" variant="link">
                        <Link href={`${translationsHref}?language=${language}`}>{t("quizReview.fixTranslation")}</Link>
                      </Button>
                    </div>
                  </>
                )}
              </section>
            );
          })}
        </div>

        {item.stamps.length > 0 && (
          <section className="space-y-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("quizReview.history")}</h3>
            <ul className="space-y-0.5 text-sm text-fg-muted">
              {item.stamps.map((s, i) => (
                <li key={i}>
                  {t("quizReview.stampLine", {
                    action: t(`quizReview.action${s.action}` as TranslationKey),
                    name: s.reviewer,
                    role: t(`quizReview.role${s.role}` as TranslationKey),
                    // The reviewers work on India's day (startOfIndianDay): the app's formatter, never the browser's locale (A3-states-7).
                    when: formatInZone(new Date(s.at), "Asia/Kolkata"),
                  })}
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-fg-muted">
          <KeyboardIcon className="size-4" aria-label={t("quizReview.shortcutsLabel")} />
          {KEYS.map((k) => (
            <span key={k.key} className="inline-flex items-center gap-1">
              <kbd className="rounded border border-border-strong px-1.5 py-0.5 font-mono text-[0.6875rem]">{k.key.toUpperCase()}</kbd>
              {t(k.labelKey)}
            </span>
          ))}
        </p>
      </CardBody>
    </Card>
  );
}
