"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FloppyDiskIcon, PlusIcon, TrashIcon } from "@phosphor-icons/react";
import type { GradeBand, ReportCardConfig, ReportCardConfigView, ReportCardLayout } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { saveRules, saveTermWeight } from "./actions";

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
function wholePercent(raw: string): number | null | undefined {
  const s = raw.trim();
  if (s === "") return null;
  if (!/^\d{1,3}$/.test(s)) return undefined;
  const n = Number(s);
  return n >= 0 && n <= 100 ? n : undefined;
}

/**
 * The office's editor for the school's report card rules: the scale, the
 * co-scholastic areas and their scale, the exam-kind weights, the layout,
 * all saved together; and each term's share of the annual card, saved on
 * its own the moment it changes because it lives on the term, not on the
 * document. Every number is validated here first so the reader sees which
 * field is wrong, and again on the server so the document is never
 * malformed.
 */
export function RulesForm({ view }: { view: ReportCardConfigView }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [preset, setPreset] = useState(view.preset);
  const [bands, setBands] = useState<BandDraft[]>(() => view.bands.map(toBandDraft));
  const [areas, setAreas] = useState(view.coScholastic.areas.join("\n"));
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

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(t("common.checkTheForm"));
      return;
    }

    const config: ReportCardConfig = {
      preset: preset.slice(0, 20),
      bands: parsedBands,
      coScholastic: {
        areas: areas
          .split(/\r?\n/)
          .map((a) => a.trim().slice(0, 40))
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
      const result = await saveRules(config);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("reportCardConfig.saved") });
      router.refresh();
    });
  }

  /** One term's share, saved as soon as the field is left and the value differs from what stands. */
  function commitTermWeight(termId: string) {
    const raw = termWeights[termId] ?? "";
    const value = wholePercent(raw);
    if (value === undefined) {
      setFieldErrors((prev) => ({
        ...prev,
        [`term-${termId}`]: t("reportCardConfig.invalidWeight"),
      }));
      return;
    }
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`term-${termId}`];
      return next;
    });
    if (value === savedTermWeights[termId]) return;
    startTransition(async () => {
      const result = await saveTermWeight(termId, value);
      if (!result.ok) {
        toast({
          tone: "danger",
          title: actionError(t, result, "common.tryAgain"),
        });
        return;
      }
      setSavedTermWeights((prev) => ({ ...prev, [termId]: value }));
      toast({ tone: "ok", title: t("reportCardConfig.termWeightSaved") });
      router.refresh();
    });
  }

  const iconButton =
    "grid size-10 shrink-0 place-items-center rounded-[--radius-md] text-fg-muted hover:bg-surface-muted hover:text-danger focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent";
  const compact = "[&_input]:min-h-10 [&_input]:py-2";
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

  return (
    <form onSubmit={submit} noValidate className="space-y-6" data-testid="report-card-rules">
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {/* ---- the grading scale ---- */}
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

          {bands.length === 0 ? (
            <p className="rounded-[--radius-md] border border-dashed border-border p-3 text-sm text-fg-muted">{t("reportCardConfig.noBands")}</p>
          ) : (
            <ol className="space-y-2" aria-label={t("reportCardConfig.scaleTitle")}>
              {bands.map((band) => {
                // The row's name for a screen reader: its grade, or its minimum until it has one.
                const removeLabel = [t("reportCardConfig.removeBand"), band.label || band.minPercent].join(": ");
                return (
                  <li key={band.key} className="grid grid-cols-2 items-end gap-2 rounded-[--radius-md] border border-border p-3 sm:grid-cols-[6rem_6rem_6rem_minmax(0,1fr)_auto]">
                    <TextField
                      label={t("reportCardConfig.bandLabel")}
                      value={band.label}
                      maxLength={12}
                      autoComplete="off"
                      onChange={(e) => updateBand(band.key, { label: e.target.value })}
                      className={compact}
                    />
                    <TextField
                      label={t("reportCardConfig.bandMin")}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step={1}
                      value={band.minPercent}
                      error={fieldErrors[`band-${band.key}`]}
                      onChange={(e) => updateBand(band.key, { minPercent: e.target.value })}
                      className={compact}
                    />
                    <TextField
                      label={t("reportCardConfig.bandPoints")}
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={10}
                      step={0.5}
                      value={band.points}
                      error={fieldErrors[`points-${band.key}`]}
                      onChange={(e) => updateBand(band.key, { points: e.target.value })}
                      className={compact}
                    />
                    <TextField
                      label={t("reportCardConfig.bandDescriptor")}
                      value={band.descriptor}
                      maxLength={60}
                      autoComplete="off"
                      onChange={(e) => updateBand(band.key, { descriptor: e.target.value })}
                      className={compact}
                    />
                    <button type="button" className={iconButton} onClick={() => removeBand(band.key)} aria-label={removeLabel} title={t("reportCardConfig.removeBand")}>
                      <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
          <Button type="button" variant="secondary" size="sm" onClick={addBand} icon={<PlusIcon weight="bold" />} disabled={bands.length >= 12}>
            {t("reportCardConfig.addBand")}
          </Button>
        </CardBody>
      </Card>

      {/* ---- co-scholastic ---- */}
      <Card>
        <CardHeader title={t("reportCardConfig.coScholasticTitle")} description={t("reportCardConfig.coScholasticIntro")} />
        <CardBody className="space-y-4">
          <TextAreaField label={t("reportCardConfig.areas")} rows={5} value={areas} onChange={(e) => setAreas(e.target.value)} className="max-w-md" />
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-fg">{t("reportCardConfig.coScale")}</legend>
            {coScale.map((grade) => {
              const removeLabel = [t("common.remove"), grade.label].join(": ");
              return (
                <div key={grade.key} className="grid grid-cols-[6rem_minmax(0,1fr)_auto] items-end gap-2">
                  <TextField
                    label={t("reportCardConfig.coScaleLabel")}
                    value={grade.label}
                    maxLength={12}
                    autoComplete="off"
                    onChange={(e) => updateCoGrade(grade.key, { label: e.target.value })}
                    className={compact}
                  />
                  <TextField
                    label={t("reportCardConfig.coScaleDescriptor")}
                    value={grade.descriptor}
                    maxLength={60}
                    autoComplete="off"
                    onChange={(e) => updateCoGrade(grade.key, { descriptor: e.target.value })}
                    className={compact}
                  />
                  <button type="button" className={iconButton} onClick={() => setCoScale((prev) => prev.filter((g) => g.key !== grade.key))} aria-label={removeLabel} title={t("common.remove")}>
                    <TrashIcon weight="bold" className="size-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCoScale((prev) => [...prev, { key: nextKey(), label: "", descriptor: "" }])}
              icon={<PlusIcon weight="bold" />}
              disabled={coScale.length >= 8}
            >
              {t("reportCardConfig.addGrade")}
            </Button>
          </fieldset>
        </CardBody>
      </Card>

      {/* ---- exam-kind weights ---- */}
      <Card>
        <CardHeader title={t("reportCardConfig.weightsTitle")} description={t("reportCardConfig.weightsIntro")} />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-3">
            <TextField
              label={t("reportCardConfig.kindUnitTest")}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={kindWeights.UNIT_TEST}
              error={fieldErrors["kind-UNIT_TEST"]}
              onChange={(e) => setKindWeights((w) => ({ ...w, UNIT_TEST: e.target.value }))}
            />
            <TextField
              label={t("reportCardConfig.kindMidTerm")}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={kindWeights.MID_TERM}
              error={fieldErrors["kind-MID_TERM"]}
              onChange={(e) => setKindWeights((w) => ({ ...w, MID_TERM: e.target.value }))}
            />
            <TextField
              label={t("reportCardConfig.kindFinal")}
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              step={1}
              value={kindWeights.FINAL}
              error={fieldErrors["kind-FINAL"]}
              onChange={(e) => setKindWeights((w) => ({ ...w, FINAL: e.target.value }))}
            />
          </div>
        </CardBody>
      </Card>

      {/* ---- term weights: saved per term, on their own ---- */}
      <Card>
        <CardHeader title={t("reportCardConfig.termWeightsTitle")} description={t("reportCardConfig.termWeightsIntro")} />
        <CardBody>
          {view.terms.length === 0 ? (
            <p className="rounded-[--radius-md] border border-dashed border-border p-3 text-sm text-fg-muted">{t("reportCardConfig.noTerms")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              {view.terms.map((term) => (
                <TextField
                  key={term.id}
                  label={term.name}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  step={1}
                  value={termWeights[term.id] ?? ""}
                  error={fieldErrors[`term-${term.id}`]}
                  onChange={(e) =>
                    setTermWeights((prev) => ({
                      ...prev,
                      [term.id]: e.target.value,
                    }))
                  }
                  onBlur={() => commitTermWeight(term.id)}
                  data-testid={`term-weight-${term.id}`}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---- the printed layout ---- */}
      <Card>
        <CardHeader title={t("reportCardConfig.layoutTitle")} description={t("reportCardConfig.layoutIntro")} />
        <CardBody className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            {LAYOUT_TOGGLES.map((key) => (
              <CheckboxField key={key} label={layoutLabel[key]} checked={layout[key]} onChange={(e) => setLayout((l) => ({ ...l, [key]: e.target.checked }))} />
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label={t("reportCardConfig.signatureLeft")}
              value={layout.signatureLeft}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => setLayout((l) => ({ ...l, signatureLeft: e.target.value }))}
            />
            <TextField
              label={t("reportCardConfig.signatureRight")}
              value={layout.signatureRight}
              maxLength={40}
              autoComplete="off"
              onChange={(e) => setLayout((l) => ({ ...l, signatureRight: e.target.value }))}
            />
          </div>
          <TextField
            label={t("reportCardConfig.headerNote")}
            value={layout.headerNote ?? ""}
            maxLength={160}
            autoComplete="off"
            onChange={(e) => setLayout((l) => ({ ...l, headerNote: e.target.value }))}
          />
          <TextField
            label={t("reportCardConfig.footerNote")}
            value={layout.footerNote ?? ""}
            maxLength={240}
            autoComplete="off"
            onChange={(e) => setLayout((l) => ({ ...l, footerNote: e.target.value }))}
          />
          <SelectField
            label={t("reportCardConfig.paper")}
            value={layout.paper}
            onChange={(e) =>
              setLayout((l) => ({
                ...l,
                paper: e.target.value === "LETTER" ? "LETTER" : "A4",
              }))
            }
            className="max-w-xs"
          >
            <option value="A4">{t("reportCardConfig.paperA4")}</option>
            <option value="LETTER">{t("reportCardConfig.paperLetter")}</option>
          </SelectField>
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" loading={pending} icon={<FloppyDiskIcon weight="bold" />} data-testid="rules-save">
          {t("reportCardConfig.save")}
        </Button>
      </div>
    </form>
  );
}
