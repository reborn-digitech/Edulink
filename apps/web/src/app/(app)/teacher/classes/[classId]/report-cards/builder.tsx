"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowSquareOutIcon, DownloadSimpleIcon, FloppyDiskIcon, SparkleIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { generate, publish, saveCoScholastic, saveRemark, withdraw } from "./actions";
import { useT } from "@/lib/i18n";
import { EXAM_KIND_KEY, type ExamKind } from "@/lib/constants";
import { fieldClass } from "@/components/ui/field-class";

type Assessment = {
  assignmentId: string;
  title: string;
  category: string | null;
  gradedCount: number;
  classSize: number;
  seriesId: string;
  seriesName: string;
  seriesKind: ExamKind;
  termId: string | null;
  subject: string;
};

type TermOption = { id: string; name: string; current: boolean };

/** The school's co-scholastic areas and the scale they are graded on, from the office's rules. */
type CoScholasticConfig = { areas: string[]; scale: { label: string; descriptor: string | null }[] };
type CoGrade = { grade: string | null; note: string };

type CardRow = {
  id: string;
  title: string;
  status: string;
  remark: string | null;
  overallPercentMilli: number | null;
  overallLetter: string | null;
  coScholastic: { area: string; grade: string | null; note: string | null }[];
  attendancePresent: number;
  attendanceTotal: number;
  studentName: string;
};

/**
 * WHERE THE PAPERS COME FROM. A term names its own — every paper reporting
 * into it — and the year names every term's; only the third way asks the
 * teacher to tick them. The mode is the first thing on the page because it
 * decides what the rest of the page shows.
 */
type BuildMode = "term" | "year" | "papers";

/**
 * Building a term's report cards.
 *
 * PICK THE ASSESSMENTS, THEN GENERATE, THEN PUBLISH — three steps, in that
 * order, because that is the order a teacher actually does it and because each
 * one is reversible until the last. The drafts exist so somebody can read thirty
 * cards before thirty families do.
 *
 * The picker says how many of the class have a mark for each assessment. Putting
 * an unmarked test onto thirty report cards produces thirty blanks, and finding
 * that out after publishing is the failure this one line prevents.
 */
export function Builder({
  classId,
  assessments,
  existingTitles,
  cards,
  selectedTitle,
  terms,
  academicYear,
  coScholastic,
}: {
  classId: string;
  assessments: Assessment[];
  existingTitles: string[];
  cards: CardRow[];
  selectedTitle: string | null;
  /** The current year's terms; empty for a school that reports once a year. */
  terms: TermOption[];
  /** The current year, whose name titles the annual card; null when none is set up. */
  academicYear: { id: string; name: string } | null;
  coScholastic: CoScholasticConfig;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  /* BUILT FROM A TERM when the school has them: the term fixes the title,
   * the attendance window and the papers server-side; the count beside it
   * here is only so the teacher can see there is something to build from. */
  const initialTerm = terms.find((x) => x.current) ?? terms[0] ?? null;
  const [title, setTitle] = useState(initialTerm?.name ?? selectedTitle ?? "Term 1");
  const [picked, setPicked] = useState<string[]>([]);
  const [mode, setModeState] = useState<BuildMode>(initialTerm ? "term" : "papers");
  const [termId, setTermId] = useState<string>(initialTerm?.id ?? "");
  function chooseTerm(id: string) {
    setTermId(id);
    const term = terms.find((x) => x.id === id);
    if (term) setTitle(term.name);
  }
  function setMode(next: BuildMode) {
    setModeState(next);
    setError(null);
    if (next === "term") {
      const term = terms.find((x) => x.id === termId);
      if (term) setTitle(term.name);
    } else if (next === "year" && academicYear) {
      setTitle(academicYear.name);
    }
  }
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  /* The co-scholastic grades as typed, per card and per area; a card with
   * nothing typed yet reads its saved rows. */
  const [coDrafts, setCoDrafts] = useState<Record<string, Record<string, CoGrade>>>({});
  const coOf = (card: CardRow, area: string): CoGrade => {
    const typed = coDrafts[card.id]?.[area];
    if (typed) return typed;
    const saved = card.coScholastic.find((r) => r.area === area);
    return { grade: saved?.grade ?? null, note: saved?.note ?? "" };
  };
  const setCo = (cardId: string, area: string, patch: Partial<CoGrade>, base: CoGrade) =>
    setCoDrafts((prev) => ({ ...prev, [cardId]: { ...(prev[cardId] ?? {}), [area]: { ...base, ...patch } } }));
  function saveGrades(card: CardRow) {
    const grades = coScholastic.areas.map((area) => {
      const d = coOf(card, area);
      return { area, grade: d.grade, note: d.note.trim() || undefined };
    });
    startTransition(async () => {
      const result = await saveCoScholastic(classId, card.id, grades);
      if (!result.ok) {
        toast({ tone: "danger", title: t("teacher.thatDidNotWork"), description: result.error });
        return;
      }
      toast({ tone: "ok", title: t("reportCards.coScholasticSaved") });
      router.refresh();
    });
  }
  const bundleHref = selectedTitle ? `/api/v1/teaching/classes/${classId}/report-cards/pdf?title=${encodeURIComponent(selectedTitle)}` : null;

  const published = cards.filter((c) => c.status === "PUBLISHED").length;
  const drafts = cards.filter((c) => c.status === "DRAFT").length;

  function toggle(id: string) {
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  /* THE SCHEDULE IS THE MENU: papers grouped under the exam the admin
   * scheduled them in, with one switch per exam — a term's card is usually
   * "the unit test and the mid-term", not eleven individual papers. Papers
   * stay individually toggleable for the school that wants to leave one off. */
  const bySeries = new Map<string, { name: string; kind: ExamKind; papers: Assessment[] }>();
  for (const a of assessments) {
    const group = bySeries.get(a.seriesId) ?? { name: a.seriesName, kind: a.seriesKind, papers: [] };
    group.papers.push(a);
    bySeries.set(a.seriesId, group);
  }
  function toggleSeries(seriesId: string) {
    const ids = bySeries.get(seriesId)?.papers.map((p) => p.assignmentId) ?? [];
    const allOn = ids.every((id) => picked.includes(id));
    setPicked((current) =>
      allOn ? current.filter((id) => !ids.includes(id)) : [...current, ...ids.filter((id) => !current.includes(id))],
    );
  }

  const canBuild =
    title.trim().length >= 2 &&
    (mode === "term" ? termId !== "" : mode === "year" ? academicYear !== null : picked.length > 0);

  function build() {
    setError(null);
    startTransition(async () => {
      const result = await generate(
        classId,
        mode === "term"
          ? { title, assignmentIds: [], termId }
          : mode === "year"
            ? { title, assignmentIds: [], academicYearId: academicYear?.id ?? null }
            : { title, assignmentIds: picked },
      );
      if (!result.ok) {
        setError(result.error ?? t("teacher.thatDidNotWork"));
        return;
      }
      toast({
        tone: "ok",
        title: t("teacher.draftsReady", { count: (result.created ?? 0) + (result.updated ?? 0) }),
        description: result.skippedPublished
          ? t("teacher.skippedPublished", { count: result.skippedPublished })
          : undefined,
      });
      router.push(`/teacher/classes/${classId}/report-cards?title=${encodeURIComponent(title)}`);
      router.refresh();
    });
  }

  const modes: { key: BuildMode; label: string; disabled?: boolean }[] = [
    { key: "term", label: t("reportCards.fromTerm"), disabled: terms.length === 0 },
    { key: "year", label: t("reportCards.fromYear") },
    { key: "papers", label: t("reportCards.fromPapers") },
  ];

  return (
    <div className="space-y-6">
      {/* ---------------- 1. what counts ---------------- */}
      <section>
        <h2 className="text-sm font-semibold text-fg">{t("teacher.builderStepOne")}</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          {t("teacher.builderPickExplainer")}
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        <div role="radiogroup" aria-label={t("teacher.builderStepOne")} className="mt-3 flex flex-wrap gap-1.5" data-testid="build-mode">
          {modes.map((m) => (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={mode === m.key}
              disabled={m.disabled}
              onClick={() => setMode(m.key)}
              className={cn(
                "min-h-10 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40",
                mode === m.key ? "bg-accent text-accent-fg" : "bg-surface-muted text-fg-muted hover:text-fg",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "term" && (
          <div className="mt-3">
            <label className="block max-w-xs">
              <span className="block text-xs font-medium text-fg">{t("terms.cardTerm")}</span>
              <select
                value={termId}
                data-testid="card-term"
                onChange={(e) => chooseTerm(e.target.value)}
                className={fieldClass("mt-1")}
              >
                {terms.map((term) => (
                  <option key={term.id} value={term.id}>
                    {term.name}
                    {" · "}
                    {t("terms.inTerm", { count: assessments.filter((a) => a.termId === term.id).length })}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-1 text-xs text-fg-muted">{t("reportCards.termCardHint")}</p>
          </div>
        )}

        {mode === "year" && (
          <p className={cn("mt-3 rounded-[var(--radius-md)] border border-dashed border-border p-3 text-sm", academicYear ? "text-fg" : "text-fg-muted")}>
            {academicYear ? t("reportCards.yearCard", { year: academicYear.name }) : t("reportCards.noYear")}
          </p>
        )}

        {mode !== "papers" ? null : assessments.length === 0 ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-dashed border-border p-4 text-sm text-fg-muted">
            {t("teacher.noPublishedWork")}
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {[...bySeries.entries()].map(([seriesId, group]) => {
              const ids = group.papers.map((p) => p.assignmentId);
              const onCount = ids.filter((id) => picked.includes(id)).length;
              const allOn = onCount === ids.length;
              return (
                <div key={seriesId} className="rounded-[var(--radius-md)] border border-border">
                  <button
                    type="button"
                    aria-pressed={allOn}
                    onClick={() => toggleSeries(seriesId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-t-[var(--radius-md)] p-3 text-left transition-colors",
                      allOn ? "bg-accent-soft text-accent-strong" : "hover:bg-surface-muted",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded border text-xs font-bold",
                        allOn ? "border-accent bg-accent text-accent-fg" : onCount > 0 ? "border-accent" : "border-border",
                      )}
                    >
                      {allOn ? "✓" : onCount > 0 ? "–" : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{group.name}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {t(EXAM_KIND_KEY[group.kind])} · {t("teacher.papersN", { count: ids.length })}
                      </span>
                    </span>
                  </button>
                  <ul className="divide-y divide-border border-t border-border">
                    {group.papers.map((assessment) => {
                      const on = picked.includes(assessment.assignmentId);
                      const unmarked = assessment.gradedCount === 0;
                      return (
                        <li key={assessment.assignmentId}>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() => toggle(assessment.assignmentId)}
                            className={cn(
                              "flex w-full items-center gap-3 p-2.5 pl-6 text-left transition-colors",
                              on ? "bg-accent-soft/60 text-accent-strong" : "hover:bg-surface-muted",
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={cn(
                                "grid size-4 shrink-0 place-items-center rounded border text-[10px] font-bold",
                                on ? "border-accent bg-accent text-accent-fg" : "border-border",
                              )}
                            >
                              {on ? "✓" : ""}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{assessment.subject}</span>
                              <span className="block truncate text-xs text-fg-muted">
                                {t("teacher.markedOf", { marked: assessment.gradedCount, total: assessment.classSize })}
                              </span>
                            </span>
                            {unmarked && (
                              <span
                                className="flex shrink-0 items-center gap-1 text-xs font-medium text-warn"
                                title={t("teacher.noMarkYet")}
                              >
                                <WarningIcon weight="bold" className="size-4" />
                                {t("teacher.unmarked")}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---------------- 2. generate ---------------- */}
      <section className="border-t border-border pt-5">
        <h2 className="text-sm font-semibold text-fg">{t("teacher.builderStepTwo")}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1">
            <span className="block text-xs font-medium text-fg">{t("teacher.reportName")}</span>
            <input
              type="text"
              value={title}
              maxLength={120}
              list="report-titles"
              disabled={mode === "term"}
              onChange={(e) => setTitle(e.target.value)}
              className={fieldClass("mt-1")}
            />
            <datalist id="report-titles">
              {existingTitles.map((existing) => (
                <option key={existing} value={existing} />
              ))}
            </datalist>
          </label>
          <Button
            loading={pending}
            disabled={!canBuild}
            icon={<SparkleIcon weight="bold" />}
            onClick={build}
          >
            {t("teacher.generateForClass")}
          </Button>
        </div>
      </section>

      {/* ---------------- 3. review and publish ---------------- */}
      {cards.length > 0 && (
        <section className="border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-fg">{t("teaching.builderStepThree", { title: selectedTitle ?? "" })}</h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {drafts > 0 ? t("teaching.cardsStateDrafts", { drafts, published }) : t("teaching.cardsStateAllPublished", { published })}
              </p>
            </div>
            {drafts > 0 ? (
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await publish(classId, selectedTitle!);
                    if (!result.ok) {
                      toast({ tone: "danger", title: t("teacher.notPublished"), description: result.error });
                      return;
                    }
                    toast({ tone: "ok", title: t("teacher.cardsSent", { count: result.published ?? 0 }) });
                    router.refresh();
                  })
                }
              >
                {t("teacher.publishAllCount", { count: drafts })}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                loading={pending}
                data-testid="withdraw-all"
                onClick={() =>
                  startTransition(async () => {
                    const result = await withdraw(classId, selectedTitle!);
                    if (!result.ok) {
                      toast({ tone: "danger", title: t("teacher.notWithdrawn"), description: result.error });
                      return;
                    }
                    toast({ tone: "warn", title: t("teacher.withdrawnCount", { count: result.withdrawn ?? 0 }) });
                    router.refresh();
                  })
                }
              >
                {t("teacher.withdrawAll")}
              </Button>
            )}
          </div>

          {bundleHref && (
            <a
              href={bundleHref}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-medium text-accent-strong underline underline-offset-2 hover:text-accent"
              data-testid="download-all-pdf"
            >
              <DownloadSimpleIcon weight="bold" className="size-4" aria-hidden="true" />
              {t("reportCards.downloadAllPdf")}
            </a>
          )}

          <ul className="mt-3 space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="rounded-[var(--radius-md)] border border-border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">
                      {card.studentName}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {card.overallPercentMilli === null
                        ? t("teacher.noMarksYetShort")
                        : `${(card.overallPercentMilli / 1000).toFixed(1)}%`}
                      {card.overallLetter ? ` · ${card.overallLetter}` : ""}
                      {card.attendanceTotal > 0
                        ? ` · ${card.attendancePresent}/${card.attendanceTotal} days`
                        : ""}
                    </span>
                  </span>
                  <Badge tone={card.status === "PUBLISHED" ? "ok" : "warn"} size="sm">
                    {card.status.toLowerCase()}
                  </Badge>
                  <Link
                    href={`/report-cards/${card.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
                  >
                    {t("teacher.preview")} <ArrowSquareOutIcon className="size-3.5" />
                  </Link>
                </div>

                {card.status === "DRAFT" && (
                  <label className="mt-2 block">
                    <span className="sr-only">{t("teaching.remarkFor", { name: card.studentName })}</span>
                    <textarea
                      rows={2}
                      maxLength={2000}
                      placeholder={t("teacher.remarkPlaceholder")}
                      defaultValue={card.remark ?? ""}
                      onChange={(e) =>
                        setRemarks((r) => ({ ...r, [card.id]: e.target.value }))
                      }
                      onBlur={() => {
                        const next = remarks[card.id];
                        if (next === undefined || next === (card.remark ?? "")) return;
                        startTransition(async () => {
                          const result = await saveRemark(classId, card.id, next);
                          if (!result.ok) {
                            toast({ tone: "danger", title: t("teacher.remarkNotSaved"), description: result.error });
                          }
                        });
                      }}
                      className={fieldClass()}
                    />
                  </label>
                )}

                {/* The class teacher's grades besides the papers: one per area
                    on the school's own scale, saved together. */}
                {card.status === "DRAFT" && (
                  <fieldset className="mt-3 rounded-[var(--radius-sm)] border border-border/60 p-2.5">
                    <legend className="px-1 text-xs font-semibold text-fg">{t("reportCards.coScholasticTitle")}</legend>
                    {coScholastic.areas.length === 0 ? (
                      <p className="text-xs text-fg-muted">{t("reportCards.noAreas")}</p>
                    ) : (
                      <>
                        <p className="text-xs text-fg-muted">{t("reportCards.coScholasticHint")}</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {coScholastic.areas.map((area) => {
                            const current = coOf(card, area);
                            return (
                              <div key={area} className="flex flex-wrap items-end gap-2">
                                <label className="min-w-[8rem] flex-1">
                                  <span className="block truncate text-xs font-medium text-fg">{area}</span>
                                  <select
                                    value={current.grade ?? ""}
                                    onChange={(e) => setCo(card.id, area, { grade: e.target.value || null }, current)}
                                    className={fieldClass("mt-1")}
                                  >
                                    <option value="">{t("reportCards.notGraded")}</option>
                                    {coScholastic.scale.map((g) => (
                                      <option key={g.label} value={g.label}>
                                        {g.descriptor ? `${g.label} · ${g.descriptor}` : g.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                <label className="min-w-[8rem] flex-1">
                                  <span className="block text-xs font-medium text-fg">{t("reportCards.note")}</span>
                                  <input
                                    type="text"
                                    maxLength={200}
                                    value={current.note}
                                    placeholder={t("common.optional")}
                                    onChange={(e) => setCo(card.id, area, { note: e.target.value }, current)}
                                    className={fieldClass("mt-1")}
                                  />
                                </label>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-2">
                          <Button type="button" size="sm" variant="secondary" loading={pending} icon={<FloppyDiskIcon weight="bold" />} onClick={() => saveGrades(card)}>
                            {t("common.save")}
                          </Button>
                        </div>
                      </>
                    )}
                  </fieldset>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
