"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowArcLeftIcon, ArrowRightIcon, KeyboardIcon, PencilSimpleIcon, ProhibitIcon, SealCheckIcon } from "@phosphor-icons/react";
import { isCollegeClassLevel, QUIZ_TAKEDOWN_REASONS, type QuizReviewEditBody, type QuizReviewItem, type QuizReviewNext, type QuizReviewQuery, type QuizTakeDownReason } from "@edulink/contracts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { editAction, nextItemAction, putBackAction, takeDownAction } from "@/app/appadmin/quiz-review/actions";
import { FigureSlot } from "./figure-slot";
import { quizBoardKey } from "@/lib/quiz-board";
import { formatInZone } from "@/lib/dates";

type Mode = "view" | "edit" | "takeDown";
type Words = { stem: string; choices: string[]; solution: string };
type Draft = { stem: string; choices: string[]; answerIndex: number; solution: string; checkExpr: string; difficulty: number; hi: Words | null; mr: Words | null };

/** The desk's keys: one letter per press, never while a field has the focus. */
const KEYS = [
  { key: "e", labelKey: "quizReview.keyEdit" },
  { key: "t", labelKey: "quizReview.keyTakeDown" },
  { key: "p", labelKey: "quizReview.keyPutBack" },
  { key: "s", labelKey: "quizReview.keySkip" },
] as const satisfies readonly { key: string; labelKey: TranslationKey }[];

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

function typingInAField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ["input", "textarea", "select"].includes(target.tagName.toLowerCase());
}

/** A language's words to send: only when changed, and only whole. */
function changedWords(now: Words | null, was: Words | null): Words | undefined {
  if (!now) return undefined;
  if (!now.stem.trim() || !now.solution.trim() || now.choices.some((c) => !c.trim())) return undefined;
  return JSON.stringify(now) === JSON.stringify(was) ? undefined : now;
}

/**
 * One generated item at a time, served or not, with everything the generator kept for a reader (Phase 1
 * "Output and review", as the owner decided on 11 October 2026): the stem, the options with the key marked
 * and each distractor's reason beside it, the solution, the check expression, the blind solver's answers,
 * the figure, the Hindi and the Marathi, pupils' answers so far, and the presses — Edit (all three
 * languages), Take down with a coded reason, Put back, Skip — each on a key so a person can move fast.
 * Skipped items come back on the next visit.
 */
export function ReviewDesk({ initial, query, subjectLabels }: { initial: QuizReviewNext; query: Omit<QuizReviewQuery, "skip">; subjectLabels: Record<string, string> }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [item, setItem] = useState<QuizReviewItem | null>(initial.item);
  const [remaining, setRemaining] = useState(initial.remaining);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [mode, setMode] = useState<Mode>("view");
  const [draft, setDraft] = useState<Draft | null>(initial.item ? draftOf(initial.item) : null);
  const [reason, setReason] = useState<QuizTakeDownReason>(QUIZ_TAKEDOWN_REASONS[0]);
  const heading = useRef<HTMLHeadingElement>(null);

  const showItem = useCallback((next: QuizReviewItem | null) => {
    setItem(next);
    setDraft(next ? draftOf(next) : null);
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
        setRemaining(result.next.remaining);
        showItem(result.next.item);
        router.refresh();
      });
    },
    [router, showItem, t, toast],
  );

  const refresh = useCallback(
    (work: () => Promise<{ ok: true; item: QuizReviewItem } | { ok: false; error: string }>, done: TranslationKey) => {
      startTransition(async () => {
        const result = await work();
        if (!result.ok) {
          toast({ tone: "danger", title: result.error });
          return;
        }
        toast({ tone: "ok", title: t(done) });
        showItem(result.item);
        router.refresh();
      });
    },
    [router, showItem, t, toast],
  );

  const saveEdit = useCallback(() => {
    if (!item || !draft) return;
    const hi = changedWords(draft.hi, wordsOf(item.translations.hi));
    const mr = changedWords(draft.mr, wordsOf(item.translations.mr));
    const body: QuizReviewEditBody = {
      stem: draft.stem,
      choices: draft.choices,
      answerIndex: draft.answerIndex,
      solution: draft.solution,
      checkExpr: draft.checkExpr.trim() || null,
      difficulty: draft.difficulty,
      ...(hi || mr ? { translations: { ...(hi ? { hi } : {}), ...(mr ? { mr } : {}) } } : {}),
    };
    refresh(() => editAction(item.id, body), "quizReview.edited");
  }, [draft, item, refresh]);

  const takeDown = useCallback(
    (why: QuizTakeDownReason) => {
      if (!item) return;
      move(() => takeDownAction(item.id, why, queryWith(skipped)), "quizReview.tookDown");
    },
    [item, move, queryWith, skipped],
  );

  const putBack = useCallback(() => {
    if (!item || item.state !== "DOWN") return;
    refresh(() => putBackAction(item.id), "quizReview.putBackDone");
  }, [item, refresh]);

  const skip = useCallback(() => {
    if (!item) return;
    const next = [...skipped, item.id];
    setSkipped(next);
    move(() => nextItemAction(queryWith(next)));
  }, [item, move, queryWith, skipped]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (pending || !item || event.metaKey || event.ctrlKey || event.altKey || typingInAField(event.target)) return;
      const key = event.key.toLowerCase();
      if (mode === "takeDown") {
        if (key === "escape") setMode("view");
        // 1 to 9, and 0 for the tenth reason.
        const n = key === "0" ? 10 : Number(key);
        if (Number.isInteger(n) && n >= 1 && n <= QUIZ_TAKEDOWN_REASONS.length) {
          event.preventDefault();
          takeDown(QUIZ_TAKEDOWN_REASONS[n - 1]!);
        }
        return;
      }
      if (mode === "edit") {
        if (key === "escape") setMode("view");
        return;
      }
      const action: Record<string, () => void> = {
        e: () => setMode("edit"),
        t: () => item.state !== "DOWN" && setMode("takeDown"),
        p: putBack,
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
  }, [item, mode, pending, putBack, skip, takeDown]);

  if (!item) {
    return <EmptyState icon={<SealCheckIcon weight="duotone" className="size-8" />} title={t("quizReview.empty")} description={t("quizReview.emptyBody")} />;
  }

  const subject = subjectLabels[item.topic.subject] ?? item.topic.subject;
  const solverTally = item.choices.map((_, i) => item.solverAnswers.filter((a) => a === i).length);
  const reasonLabel = (r: QuizTakeDownReason | null) => (r ? t(`quizReview.reason${r}` as TranslationKey) : "—");
  const setWords = (language: "hi" | "mr", words: Words) => draft && setDraft({ ...draft, [language]: words });

  return (
    <Card aria-busy={pending || undefined}>
      <div className="p-5 pb-3">
        {/* Focus lands here when the next item comes up, so a screen reader hears where the reader now is. */}
        <h2 ref={heading} tabIndex={-1} className="text-base font-semibold text-fg outline-none">
          {isCollegeClassLevel(item.topic.grade) ? t("quizReview.itemHeadingCollege", { subject, chapter: item.topic.chapter }) : t("quizReview.itemHeading", { subject, grade: item.topic.grade, chapter: item.topic.chapter })}
        </h2>
        <p className="mt-0.5 text-sm text-fg-muted">{t("quizReview.filtered", { count: remaining })}</p>
      </div>
      <CardBody className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          {item.state === "SERVED" && <Badge tone="ok">{t("quizReview.statusServed")}</Badge>}
          {item.state === "DOWN" && (
            <Badge tone="danger">{item.takenDownBy ? t("quizReview.statusDownBy", { name: item.takenDownBy, reason: reasonLabel(item.takenDownReason) }) : t("quizReview.statusDown", { reason: reasonLabel(item.takenDownReason) })}</Badge>
          )}
          {item.state === "HELD" && <Badge tone="warn">{t("quizReview.statusHeld")}</Badge>}
          {item.board && <Badge tone="info">{quizBoardKey(item.board) ? t(quizBoardKey(item.board)!) : item.board}</Badge>}
          <Badge tone="accent">{t("quizReview.levelOption", { level: item.difficulty })}</Badge>
          {item.levelFlag && <Badge tone="warn">{t("quizReview.levelFlag", { flag: item.levelFlag })}</Badge>}
          {item.editedAfterSolvingAt && <Badge tone="warn">{t("quizReview.editedAfterSolving")}</Badge>}
        </div>

        {/* The presses, first on the page so a phone reaches them without scrolling past the item. */}
        {mode === "view" && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => setMode("edit")} disabled={pending}>
              <PencilSimpleIcon aria-hidden="true" />
              {t("quizReview.edit")}
            </Button>
            {item.state === "DOWN" ? (
              <Button size="sm" onClick={putBack} disabled={pending}>
                <ArrowArcLeftIcon aria-hidden="true" />
                {t("quizReview.putBack")}
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setMode("takeDown")} disabled={pending}>
                <ProhibitIcon aria-hidden="true" />
                {t("quizReview.takeDown")}
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={skip} disabled={pending}>
              <ArrowRightIcon aria-hidden="true" />
              {t("quizReview.skip")}
            </Button>
          </div>
        )}

        {mode === "takeDown" && (
          <fieldset className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
            <legend className="px-1 text-sm font-semibold">{t("quizReview.takeDownReason")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUIZ_TAKEDOWN_REASONS.map((r, i) => (
                <Button key={r} size="sm" variant={reason === r ? "soft" : "secondary"} className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left" onClick={() => setReason(r)} disabled={pending} aria-pressed={reason === r}>
                  <span className="tabular-nums text-fg-muted">{(i + 1) % 10}</span>
                  {reasonLabel(r)}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="danger" onClick={() => takeDown(reason)} disabled={pending}>
                {t("quizReview.confirmTakeDown")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("view")} disabled={pending}>
                {t("quizReview.cancelEdit")}
              </Button>
            </div>
          </fieldset>
        )}

        {mode === "edit" && draft ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              saveEdit();
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
                      <input type="radio" name="key" className="size-5" checked={draft.answerIndex === i} onChange={() => setDraft({ ...draft, answerIndex: i })} aria-label={t("quizReview.correctAnswer")} />
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
            <p className="text-sm text-fg-muted">{item.answers.asked > 0 ? t("quizReview.answersLine", { asked: item.answers.asked, correct: item.answers.correct }) : t("quizReview.answersNone")}</p>
          </>
        )}

        {mode !== "edit" && (
          <div className="grid gap-3 md:grid-cols-2">
            {(["hi", "mr"] as const).map((language) => {
              const row = item.translations[language];
              const name = t(language === "hi" ? "gigs.hindi" : "gigs.marathi");
              return (
                <section key={language} lang={language} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
                  <h3 className="text-sm font-semibold">{name}</h3>
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
                    </>
                  )}
                </section>
              );
            })}
          </div>
        )}

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
                    // The desk works on India's day (startOfIndianDay): the app's formatter, never the browser's locale (A3-states-7).
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
