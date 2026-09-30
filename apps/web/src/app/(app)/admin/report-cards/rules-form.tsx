"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownIcon, ArrowUpIcon, FloppyDiskIcon, PlusIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { CardSigner, GradeBand, ReportCardConfig, ReportCardConfigView, ReportCardLayout } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { saveRules, saveTermWeight } from "./actions";
import { RulesPreview } from "./rules-preview";
import { FontSelect } from "@/components/font-select";
import { ScaleBar, scaleProblems } from "./scale-bar";

/** A band as typed: numbers are strings until the save, so a half-typed "7" is not clamped under the cursor. */
type BandDraft = {
  key: string;
  label: string;
  minPercent: string;
  points: string;
  descriptor: string;
};
type CoGradeDraft = { key: string; label: string; descriptor: string };

let seq = 0;
const nextKey = () => `new-${++seq}`;

const LAYOUT_TOGGLES: (keyof Pick<
  ReportCardLayout,
  "showAttendance" | "showPractice" | "showCoScholastic" | "showGradePoints" | "showAddress" | "showSignatures" | "showRemark" | "useBrandColour"
>)[] = ["showAttendance", "showPractice", "showCoScholastic", "showGradePoints", "showAddress", "showSignatures", "showRemark", "useBrandColour"];

const toBandDraft = (b: GradeBand): BandDraft => ({
  key: nextKey(),
  label: b.label,
  minPercent: String(b.minPercent),
  points: b.points === null ? "" : String(b.points),
  descriptor: b.descriptor ?? "",
});

/** A whole number from 0 to 100, or null for a blank; undefined for anything else. */
/** Which section a field's error belongs to, by the key it is filed under. */
function sectionOf(errorKey: string): Section {
  if (errorKey.startsWith("band-") || errorKey.startsWith("points-")) return "scale";
  if (errorKey.startsWith("kind-") || errorKey.startsWith("term-")) return "weights";
  return "layout";
}

function wholePercent(raw: string): number | null | undefined {
  const s = raw.trim();
  if (s === "") return null;
  if (!/^\d{1,3}$/.test(s)) return undefined;
  const n = Number(s);
  return n >= 0 && n <= 100 ? n : undefined;
}

/**
 * The office's editor for the school's report card rules: the scale, the
 * co-scholastic areas and their scale, the exam-kind weights, each term's
 * share of the annual card, and the layout.
 *
 * REBUILT 2026-09-30, for an office that found it hard to use. It was one
 * long form of five cards; its grade bands were four boxes a row with
 * nothing to show a gap or two bands starting at the same mark; its weights
 * were bare numbers with no total; the co-scholastic areas were typed one
 * to a line; the terms' shares were saved by themselves when a field was
 * left, while everything else waited for the button, and nothing said so;
 * and the only preview was the last card published, which showed none of
 * what was being changed and did not exist in a school that had published
 * none. Now:
 *  - FOUR SECTIONS, one on the screen at a time, each marked when
 *    something in it needs correcting. All four stay in the form, so what
 *    is typed in one is kept while another is read.
 *  - THE SCALE IS DRAWN, from 0 to 100, as it is typed (scale-bar.tsx); a
 *    gap and two bands that start together are said in words under it.
 *  - THE WEIGHTS CARRY THEIR TOTAL, and what a total that is not 100 means.
 *  - THE AREAS ARE A LIST, added to, taken from and put in order.
 *  - ONE SAVE. The terms' shares that changed are written with the rest.
 *    They still live on the term and are still written one by one; the
 *    office no longer has to know that.
 *  - A SAMPLE CARD IS DRAWN BESIDE THE FORM by the rules as they stand in
 *    the form (rules-preview.tsx).
 * What is saved, and how a card is worked out from it, has not changed.
 * Every number is validated here first so the reader sees which field is
 * wrong, and again on the server so the document is never malformed.
 */
type Section = "scale" | "co" | "weights" | "layout";
const SECTIONS: { id: Section; key: "reportCardConfig.tabScale" | "reportCardConfig.tabCo" | "reportCardConfig.tabWeights" | "reportCardConfig.tabLayout" }[] = [
  { id: "scale", key: "reportCardConfig.tabScale" },
  { id: "co", key: "reportCardConfig.tabCo" },
  { id: "weights", key: "reportCardConfig.tabWeights" },
  { id: "layout", key: "reportCardConfig.tabLayout" },
];
type AreaDraft = { key: string; name: string };

/** `readOnly` is the head's view: every control disabled, no save and no weight written on blur, because the rules are the admin's. */
export function RulesForm({ view, schoolName, schoolLocale, readOnly = false }: { view: ReportCardConfigView; schoolName: string; schoolLocale: string; readOnly?: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [preset, setPreset] = useState(view.preset);
  const [bands, setBands] = useState<BandDraft[]>(() => view.bands.map(toBandDraft));
  const tabsId = useId();
  const [section, setSection] = useState<Section>("scale");
  const [areas, setAreas] = useState<AreaDraft[]>(() => view.coScholastic.areas.map((name) => ({ key: nextKey(), name })));
  const [coScale, setCoScale] = useState<CoGradeDraft[]>(() =>
    view.coScholastic.scale.map((g) => ({
      key: nextKey(),
      label: g.label,
      descriptor: g.descriptor ?? "",
    })),
  );
  const [kindWeights, setKindWeights] = useState({
    UNIT_TEST: String(view.kindWeights.UNIT_TEST),
    MID_TERM: String(view.kindWeights.MID_TERM),
    FINAL: String(view.kindWeights.FINAL),
  });
  const [layout, setLayout] = useState<ReportCardLayout>(view.layout);
  const [termWeights, setTermWeights] = useState<Record<string, string>>(() => Object.fromEntries(view.terms.map((x) => [x.id, x.weightPercent === null ? "" : String(x.weightPercent)])));
  const [savedTermWeights, setSavedTermWeights] = useState<Record<string, number | null>>(() => Object.fromEntries(view.terms.map((x) => [x.id, x.weightPercent])));
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const choosePreset = (key: string) => {
    setPreset(key);
    const found = view.presets.find((p) => p.key === key);
    if (found) setBands(found.bands.map(toBandDraft));
  };
  const updateBand = (key: string, patch: Partial<BandDraft>) => {
    setPreset("custom");
    setBands((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  };
  const removeBand = (key: string) => {
    setPreset("custom");
    setBands((prev) => prev.filter((b) => b.key !== key));
  };
  const addBand = () => {
    setPreset("custom");
    setBands((prev) => [...prev, { key: nextKey(), label: "", minPercent: "", points: "", descriptor: "" }]);
  };
  const updateCoGrade = (key: string, patch: Partial<CoGradeDraft>) => setCoScale((prev) => prev.map((g) => (g.key === key ? { ...g, ...patch } : g)));

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const errors: Record<string, string> = {};
    const invalid = t("reportCardConfig.invalidWeight");

    const parsedBands: GradeBand[] = [];
    for (const b of bands) {
      if (!b.label.trim()) continue;
      const min = wholePercent(b.minPercent);
      if (min === null || min === undefined) errors[`band-${b.key}`] = invalid;
      const pointsRaw = b.points.trim();
      const points = pointsRaw === "" ? null : Number(pointsRaw);
      if (points !== null && (!Number.isFinite(points) || points < 0 || points > 10)) errors[`points-${b.key}`] = invalid;
      parsedBands.push({
        label: b.label.trim().slice(0, 12),
        minPercent: min ?? 0,
        points,
        descriptor: b.descriptor.trim().slice(0, 60) || null,
      });
    }

    const kinds = {
      UNIT_TEST: wholePercent(kindWeights.UNIT_TEST),
      MID_TERM: wholePercent(kindWeights.MID_TERM),
      FINAL: wholePercent(kindWeights.FINAL),
    };
    for (const k of ["UNIT_TEST", "MID_TERM", "FINAL"] as const) if (kinds[k] === null || kinds[k] === undefined) errors[`kind-${k}`] = invalid;

    // The terms' shares are saved with the rest: the ones that differ from what stands, one by one, before the document.
    const changedTerms: { id: string; value: number | null }[] = [];
    for (const term of view.terms) {
      const value = wholePercent(termWeights[term.id] ?? "");
      if (value === undefined) errors[`term-${term.id}`] = invalid;
      else if (value !== savedTermWeights[term.id]) changedTerms.push({ id: term.id, value });
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(t("common.checkTheForm"));
      // To the first section that has something to correct.
      const first = SECTIONS.find((sec) => Object.keys(errors).some((k) => sectionOf(k) === sec.id));
      if (first) setSection(first.id);
      return;
    }

    const config: ReportCardConfig = {
      preset: preset.slice(0, 20),
      bands: parsedBands,
      coScholastic: {
        areas: areas
          .map((a) => a.name.trim().slice(0, 40))
          .filter(Boolean)
          .slice(0, 20),
        scale: coScale
          .filter((g) => g.label.trim())
          .map((g) => ({
            label: g.label.trim().slice(0, 12),
            descriptor: g.descriptor.trim().slice(0, 60) || null,
          }))
          .slice(0, 8),
      },
      kindWeights: {
        UNIT_TEST: kinds.UNIT_TEST ?? 0,
        MID_TERM: kinds.MID_TERM ?? 0,
        FINAL: kinds.FINAL ?? 0,
      },
      layout: {
        ...layout,
        signatureLeft: layout.signatureLeft.trim().slice(0, 40),
        signatureRight: layout.signatureRight.trim().slice(0, 40),
        headerNote: layout.headerNote?.trim().slice(0, 160) || null,
        footerNote: layout.footerNote?.trim().slice(0, 240) || null,
      },
    };
    startTransition(async () => {
      for (const term of changedTerms) {
        const written = await saveTermWeight(term.id, term.value);
        if (!written.ok) {
          setError(actionError(t, written, "common.tryAgain"));
          setSection("weights");
          return;
        }
        setSavedTermWeights((prev) => ({ ...prev, [term.id]: term.value }));
      }
      const result = await saveRules(config);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("reportCardConfig.saved") });
      router.refresh();
    });
  }

  const iconButton = "grid size-11 shrink-0 place-items-center rounded-[--radius-md] text-fg-muted hover:bg-surface-muted hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40";
  const layoutLabel: Record<(typeof LAYOUT_TOGGLES)[number], string> = {
    showAttendance: t("reportCardConfig.showAttendance"),
    showPractice: t("reportCardConfig.showPractice"),
    showCoScholastic: t("reportCardConfig.showCoScholastic"),
    showGradePoints: t("reportCardConfig.showGradePoints"),
    showAddress: t("reportCardConfig.showAddress"),
    showSignatures: t("reportCardConfig.showSignatures"),
    showRemark: t("reportCardConfig.showRemark"),
    useBrandColour: t("reportCardConfig.useBrandColour"),
  };

  /* ---- what is drawn and said as the office types, from the form as it stands ---- */
  const liveBands = bands
    .filter((b) => b.label.trim())
    .map((b) => ({ label: b.label.trim(), minPercent: wholePercent(b.minPercent) ?? null, points: b.points.trim() === "" || !Number.isFinite(Number(b.points)) ? null : Number(b.points), descriptor: b.descriptor.trim() || null }));
  const problems = scaleProblems(liveBands);
  const kindTotal = (["UNIT_TEST", "MID_TERM", "FINAL"] as const).reduce((sum, k) => sum + (wholePercent(kindWeights[k]) ?? 0), 0);
  const termValues = view.terms.map((term) => wholePercent(termWeights[term.id] ?? ""));
  const termsSet = termValues.filter((v) => typeof v === "number").length;
  const termTotal = termValues.reduce<number>((sum, v) => sum + (typeof v === "number" ? v : 0), 0);
  const termsNote = view.terms.length === 0 ? null : termsSet === 0 ? { tone: "ok" as const, text: t("reportCardConfig.termsEqual") } : termsSet < view.terms.length ? { tone: "warn" as const, text: t("reportCardConfig.termsIncomplete") } : termTotal !== 100 ? { tone: "warn" as const, text: t("reportCardConfig.termsNot100", { total: termTotal }) } : null;
  const warned: Record<Section, boolean> = {
    scale: problems.length > 0 || Object.keys(fieldErrors).some((k) => sectionOf(k) === "scale"),
    co: false,
    weights: (kindTotal !== 0 && kindTotal !== 100) || termsNote?.tone === "warn" || Object.keys(fieldErrors).some((k) => sectionOf(k) === "weights"),
    layout: false,
  };
  const note = (tone: "ok" | "warn", text: string, testId?: string) => (
    <p className={`flex items-start gap-2 rounded-[--radius-md] border px-3 py-2 text-sm ${tone === "warn" ? "border-warn/40 bg-warn-soft text-fg" : "border-border bg-surface-muted text-fg-muted"}`} data-testid={testId}>
      {tone === "warn" && <WarningCircleIcon weight="fill" className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />}
      <span>{text}</span>
    </p>
  );
  const percentField = (label: string, value: string, onChange: (v: string) => void, errorKey: string, testId?: string) => (
    <TextField label={label} type="number" inputMode="numeric" min={0} max={100} step={1} value={value} error={fieldErrors[errorKey]} onChange={(e) => onChange(e.target.value)} data-testid={testId} />
  );
  const moveArea = (key: string, delta: -1 | 1) =>
    setAreas((prev) => {
      const index = prev.findIndex((a) => a.key === key);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [area] = next.splice(index, 1);
      next.splice(target, 0, area!);
      return next;
    });

  const panel = (id: Section) => ({ id: `${tabsId}-panel-${id}`, role: "tabpanel" as const, "aria-labelledby": `${tabsId}-tab-${id}`, hidden: section !== id, className: "space-y-6" });

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
      <form onSubmit={submit} noValidate className="min-w-0 space-y-6" data-testid="report-card-rules">
        {readOnly && (
          <p className="rounded-[--radius-md] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted" data-testid="office-sets-this">
            {t("common.officeSetsThis")}
          </p>
        )}

        <div role="tablist" aria-label={t("reportCardConfig.tabsLabel")} className="flex flex-wrap gap-1 rounded-[--radius-md] border border-border bg-surface-muted p-1">
          {SECTIONS.map((sec, index) => (
            <button
              key={sec.id}
              type="button"
              role="tab"
              id={`${tabsId}-tab-${sec.id}`}
              aria-selected={section === sec.id}
              aria-controls={`${tabsId}-panel-${sec.id}`}
              tabIndex={section === sec.id ? 0 : -1}
              onClick={() => setSection(sec.id)}
              onKeyDown={(event) => {
                // The arrow keys move between the tabs, as a list of tabs is expected to.
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                event.preventDefault();
                const next = SECTIONS[(index + (event.key === "ArrowRight" ? 1 : SECTIONS.length - 1)) % SECTIONS.length]!;
                setSection(next.id);
                document.getElementById(`${tabsId}-tab-${next.id}`)?.focus();
              }}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[--radius-sm] px-3 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${section === sec.id ? "bg-surface text-fg shadow-sm" : "text-fg-muted hover:text-fg"}`}
              data-testid={`rules-tab-${sec.id}`}
            >
              {t(sec.key)}
              {warned[sec.id] && (
                <>
                  <WarningCircleIcon weight="fill" className="size-4 text-warn" aria-hidden="true" />
                  <span className="sr-only">{t("reportCardConfig.tabHasProblem")}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <fieldset disabled={readOnly} className="min-w-0 space-y-6">
          {/* ---- the grading scale ---- */}
          <div {...panel("scale")}>
            <Card>
              <CardHeader title={t("reportCardConfig.scaleTitle")} description={t("reportCardConfig.scaleIntro")} />
              <CardBody className="space-y-4">
                <SelectField label={t("reportCardConfig.preset")} value={preset} onChange={(e) => choosePreset(e.target.value)} className="max-w-sm" data-testid="rules-preset">
                  {view.presets.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                  <option value="custom">{t("reportCardConfig.presetCustom")}</option>
                </SelectField>

                <ScaleBar bands={liveBands} />
                {liveBands.length === 0
                  ? note("ok", t("reportCardConfig.scaleEmpty"), "scale-note")
                  : problems.length === 0
                    ? note("ok", t("reportCardConfig.scaleOk"), "scale-note")
                    : problems.map((problem, index) => <div key={index}>{note("warn", problem.kind === "gap" ? t("reportCardConfig.scaleGap", { from: problem.from, to: problem.to }) : t("reportCardConfig.scaleOverlap", { percent: problem.percent, first: problem.first, second: problem.second }), "scale-problem")}</div>)}

                {bands.length > 0 && (
                  <>
                    <div className="hidden grid-cols-[6rem_6rem_6rem_minmax(0,1fr)_2.75rem] gap-2 px-3 text-xs font-medium text-fg-muted sm:grid" aria-hidden="true">
                      <span>{t("reportCardConfig.bandLabel")}</span>
                      <span>{t("reportCardConfig.bandMin")}</span>
                      <span>{t("reportCardConfig.bandPoints")}</span>
                      <span>{t("reportCardConfig.bandDescriptor")}</span>
                    </div>
                    <ol className="space-y-2" aria-label={t("reportCardConfig.scaleTitle")}>
                      {bands.map((band) => {
                        // The row's name for a screen reader: its grade, or its minimum until it has one.
                        const removeLabel = [t("reportCardConfig.removeBand"), band.label || band.minPercent].join(": ");
                        const quiet = "sm:[&>label]:sr-only";
                        return (
                          <li key={band.key} className="grid grid-cols-2 items-start gap-2 rounded-[--radius-md] border border-border p-3 sm:grid-cols-[6rem_6rem_6rem_minmax(0,1fr)_2.75rem]" data-testid="band-row">
                            <TextField label={t("reportCardConfig.bandLabel")} value={band.label} maxLength={12} autoComplete="off" onChange={(e) => updateBand(band.key, { label: e.target.value })} className={quiet} data-testid="band-label" />
                            <TextField label={t("reportCardConfig.bandMin")} type="number" inputMode="numeric" min={0} max={100} step={1} value={band.minPercent} error={fieldErrors[`band-${band.key}`]} onChange={(e) => updateBand(band.key, { minPercent: e.target.value })} className={quiet} data-testid="band-min" />
                            <TextField label={t("reportCardConfig.bandPoints")} type="number" inputMode="decimal" min={0} max={10} step={0.5} value={band.points} error={fieldErrors[`points-${band.key}`]} onChange={(e) => updateBand(band.key, { points: e.target.value })} className={quiet} />
                            <TextField label={t("reportCardConfig.bandDescriptor")} value={band.descriptor} maxLength={60} autoComplete="off" onChange={(e) => updateBand(band.key, { descriptor: e.target.value })} className={quiet} />
                            <button type="button" className={`${iconButton} hover:text-danger`} onClick={() => removeBand(band.key)} aria-label={removeLabel} title={t("reportCardConfig.removeBand")}>
                              <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                            </button>
                          </li>
                        );
                      })}
                    </ol>
                  </>
                )}
                <Button type="button" variant="secondary" size="sm" onClick={addBand} icon={<PlusIcon weight="bold" />} disabled={bands.length >= 12} data-testid="add-band">
                  {t("reportCardConfig.addBand")}
                </Button>
              </CardBody>
            </Card>
          </div>

          {/* ---- co-scholastic ---- */}
          <div {...panel("co")}>
            <Card>
              <CardHeader title={t("reportCardConfig.coScholasticTitle")} description={t("reportCardConfig.coScholasticIntro")} />
              <CardBody className="space-y-5">
                <fieldset className="space-y-2" data-testid="rules-areas">
                  <legend className="text-sm font-medium text-fg">{t("reportCardConfig.areasList")}</legend>
                  {areas.length === 0 && <p className="rounded-[--radius-md] border border-dashed border-border p-3 text-sm text-fg-muted">{t("reportCardConfig.areasNone")}</p>}
                  <ol className="space-y-2">
                    {areas.map((area, index) => {
                      const name = area.name || String(index + 1);
                      return (
                        <li key={area.key} className="flex flex-wrap items-start gap-1" data-testid="area-row">
                          <TextField label={t("reportCardConfig.areaName")} value={area.name} maxLength={40} autoComplete="off" onChange={(e) => setAreas((prev) => prev.map((a) => (a.key === area.key ? { ...a, name: e.target.value } : a)))} className="min-w-0 flex-1 basis-48 [&>label]:sr-only" data-testid="area-name" />
                          <button type="button" className={iconButton} onClick={() => moveArea(area.key, -1)} disabled={index === 0} aria-label={[t("syllabus.moveUp"), name].join(": ")} title={t("syllabus.moveUp")}>
                            <ArrowUpIcon weight="bold" className="size-4" aria-hidden="true" />
                          </button>
                          <button type="button" className={iconButton} onClick={() => moveArea(area.key, 1)} disabled={index === areas.length - 1} aria-label={[t("syllabus.moveDown"), name].join(": ")} title={t("syllabus.moveDown")}>
                            <ArrowDownIcon weight="bold" className="size-4" aria-hidden="true" />
                          </button>
                          <button type="button" className={`${iconButton} hover:text-danger`} onClick={() => setAreas((prev) => prev.filter((a) => a.key !== area.key))} aria-label={[t("common.remove"), name].join(": ")} title={t("common.remove")}>
                            <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setAreas((prev) => [...prev, { key: nextKey(), name: "" }])} icon={<PlusIcon weight="bold" />} disabled={areas.length >= 20} data-testid="add-area">
                    {t("reportCardConfig.addArea")}
                  </Button>
                </fieldset>

                <fieldset className="space-y-2">
                  <legend className="text-sm font-medium text-fg">{t("reportCardConfig.coScale")}</legend>
                  {coScale.map((grade) => {
                    const removeLabel = [t("common.remove"), grade.label].join(": ");
                    return (
                      <div key={grade.key} className="grid grid-cols-[6rem_minmax(0,1fr)_2.75rem] items-start gap-2">
                        <TextField label={t("reportCardConfig.coScaleLabel")} value={grade.label} maxLength={12} autoComplete="off" onChange={(e) => updateCoGrade(grade.key, { label: e.target.value })} />
                        <TextField label={t("reportCardConfig.coScaleDescriptor")} value={grade.descriptor} maxLength={60} autoComplete="off" onChange={(e) => updateCoGrade(grade.key, { descriptor: e.target.value })} />
                        <button type="button" className={`${iconButton} mt-7 hover:text-danger`} onClick={() => setCoScale((prev) => prev.filter((g) => g.key !== grade.key))} aria-label={removeLabel} title={t("common.remove")}>
                          <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}
                  <Button type="button" variant="secondary" size="sm" onClick={() => setCoScale((prev) => [...prev, { key: nextKey(), label: "", descriptor: "" }])} icon={<PlusIcon weight="bold" />} disabled={coScale.length >= 8}>
                    {t("reportCardConfig.addGrade")}
                  </Button>
                </fieldset>
              </CardBody>
            </Card>
          </div>

          {/* ---- the weights: of each kind of exam, and of each term ---- */}
          <div {...panel("weights")}>
            <Card>
              <CardHeader title={t("reportCardConfig.weightsTitle")} description={t("reportCardConfig.weightsIntro")} />
              <CardBody className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  {percentField(t("reportCardConfig.kindUnitTest"), kindWeights.UNIT_TEST, (v) => setKindWeights((w) => ({ ...w, UNIT_TEST: v })), "kind-UNIT_TEST", "kind-UNIT_TEST")}
                  {percentField(t("reportCardConfig.kindMidTerm"), kindWeights.MID_TERM, (v) => setKindWeights((w) => ({ ...w, MID_TERM: v })), "kind-MID_TERM", "kind-MID_TERM")}
                  {percentField(t("reportCardConfig.kindFinal"), kindWeights.FINAL, (v) => setKindWeights((w) => ({ ...w, FINAL: v })), "kind-FINAL", "kind-FINAL")}
                </div>
                <p className={`text-sm font-semibold tabular-nums ${kindTotal === 100 || kindTotal === 0 ? "text-ok" : "text-warn"}`} aria-live="polite" data-testid="kind-total">
                  {t("reportCardConfig.weightTotal", { total: kindTotal })}
                </p>
                {kindTotal === 0 ? note("ok", t("reportCardConfig.weightsAllZero")) : kindTotal !== 100 ? note("warn", t("reportCardConfig.weightsNot100", { total: kindTotal }), "kind-warning") : null}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title={t("reportCardConfig.termWeightsTitle")} description={t("reportCardConfig.termWeightsIntro")} />
              <CardBody className="space-y-3">
                {view.terms.length === 0 ? (
                  <p className="rounded-[--radius-md] border border-dashed border-border p-3 text-sm text-fg-muted">{t("reportCardConfig.noTerms")}</p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {view.terms.map((term) => (
                        <div key={term.id}>{percentField(term.name, termWeights[term.id] ?? "", (v) => setTermWeights((prev) => ({ ...prev, [term.id]: v })), `term-${term.id}`, `term-weight-${term.id}`)}</div>
                      ))}
                    </div>
                    {termsSet > 0 && (
                      <p className={`text-sm font-semibold tabular-nums ${termsNote?.tone === "warn" ? "text-warn" : "text-ok"}`} aria-live="polite" data-testid="term-total">
                        {t("reportCardConfig.weightTotal", { total: termTotal })}
                      </p>
                    )}
                    {termsNote && note(termsNote.tone, termsNote.text, "term-note")}
                  </>
                )}
              </CardBody>
            </Card>
          </div>

          {/* ---- the printed layout ---- */}
          <div {...panel("layout")}>
            <Card>
              <CardHeader title={t("reportCardConfig.layoutTitle")} description={t("reportCardConfig.layoutIntro")} />
              <CardBody className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {LAYOUT_TOGGLES.map((key) => (
                    <CheckboxField key={key} label={layoutLabel[key]} checked={layout[key]} onChange={(e) => setLayout((l) => ({ ...l, [key]: e.target.checked }))} data-testid={`layout-${key}`} />
                  ))}
                </div>
                <FontSelect value={layout.font} locale={schoolLocale} onChange={(font) => setLayout((l) => ({ ...l, font }))} testId="layout-font" />
                {/* Who signs the two lines that are the school's, and whether the seal is printed. */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["signerLeft", "signerRight"] as const).map((side) => (
                    <SelectField key={side} label={t(side === "signerLeft" ? "signatures.signerLeft" : "signatures.signerRight")} value={layout[side]} onChange={(e) => setLayout((l) => ({ ...l, [side]: e.target.value as CardSigner }))} data-testid={`layout-${side}`}>
                      <option value="NONE">{t("signatures.signerNone")}</option>
                      <option value="TEACHER">{t("signatures.signerTeacher")}</option>
                      <option value="ADMIN">{t("signatures.signerAdmin")}</option>
                      <option value="PRINCIPAL">{t("signatures.signerPrincipal")}</option>
                    </SelectField>
                  ))}
                </div>
                <p className="text-xs leading-relaxed text-fg-muted">{t("signatures.signerHint")}</p>
                <CheckboxField label={t("signatures.showSeal")} checked={layout.showSeal} onChange={(e) => setLayout((l) => ({ ...l, showSeal: e.target.checked }))} data-testid="layout-showSeal" />
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField label={t("reportCardConfig.signatureLeft")} value={layout.signatureLeft} maxLength={40} autoComplete="off" onChange={(e) => setLayout((l) => ({ ...l, signatureLeft: e.target.value }))} />
                  <TextField label={t("reportCardConfig.signatureRight")} value={layout.signatureRight} maxLength={40} autoComplete="off" onChange={(e) => setLayout((l) => ({ ...l, signatureRight: e.target.value }))} />
                </div>
                <TextField label={t("reportCardConfig.headerNote")} value={layout.headerNote ?? ""} maxLength={160} autoComplete="off" onChange={(e) => setLayout((l) => ({ ...l, headerNote: e.target.value }))} data-testid="layout-headerNote" />
                <TextField label={t("reportCardConfig.footerNote")} value={layout.footerNote ?? ""} maxLength={240} autoComplete="off" onChange={(e) => setLayout((l) => ({ ...l, footerNote: e.target.value }))} />
                <SelectField label={t("reportCardConfig.paper")} value={layout.paper} onChange={(e) => setLayout((l) => ({ ...l, paper: e.target.value === "LETTER" ? "LETTER" : "A4" }))} className="max-w-xs">
                  <option value="A4">{t("reportCardConfig.paperA4")}</option>
                  <option value="LETTER">{t("reportCardConfig.paperLetter")}</option>
                </SelectField>
              </CardBody>
            </Card>
          </div>

          {error && (
            <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="rules-save">
                {t("reportCardConfig.save")}
              </Button>
            </div>
          )}
        </fieldset>
      </form>

      <aside className="min-w-0 lg:sticky lg:top-20">
        <RulesPreview schoolName={schoolName} locale={schoolLocale} bands={liveBands} areas={areas.map((a) => a.name.trim()).filter(Boolean)} coScale={coScale.map((g) => g.label.trim()).filter(Boolean)} layout={layout} />
      </aside>
    </div>
  );
}
