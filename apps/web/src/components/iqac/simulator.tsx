"use client";

import { useMemo, useState } from "react";
import { NAAC_FRAMEWORKS, NBA_SAR_ITEMS, itemKey, type NaacFrameworkCode, type NaacScenarioInputs, type NbaInputs, type NirfInputs } from "@edulink/contracts";
import { FORMULAS, type Facts } from "@/lib/iqac-rules";
import { nbaTotals, nirfScore, simulateNaac } from "@/lib/accreditation-insights";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextField } from "@/components/ui/field";
import { saveNaacScenarioAction, saveNbaScenarioAction } from "@/app/(app)/iqac/simulator/actions";

/**
 * THE SIMULATOR (module IQAC, 5 Oct 2026), in the browser: the figures the
 * NAAC formulas read and the qualitative scores as inputs, starting at
 * today's, and the CGPA, the grade and the distance recomputed on every
 * change by THE SAME FUNCTIONS the predictor runs on the server
 * (lib/iqac-rules.ts through lib/accreditation-insights.ts, both pure) — no
 * second copy of a formula. NIRF's estimate beside it; the NBA SAR's
 * simulator below for an engineering department. Saving a scenario posts the
 * inputs; the server recomputes the result (iqac-insights.ts saveScenario).
 */

const QL_STEPS = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4];
const READ_ONLY_FACTS = new Set(["windowYears"]);
const fmt = (x: number | null | undefined, d = 2) => (x === null || x === undefined ? "—" : x.toFixed(d));
const signed = (x: number) => `${x > 0 ? "+" : ""}${x.toFixed(2)}`;

function NumberWithSlider({ id, label, value, today, max, step, onChange, hint }: { id: string; label: string; value: number | null; today: number | null; max: number; step: number; onChange: (v: number | null) => void; hint: string }) {
  const changed = (value ?? null) !== (today ?? null);
  return (
    <div className={`space-y-1 rounded-[--radius-md] border p-3 ${changed ? "border-accent" : "border-border"}`} data-testid={`sim-${id}`}>
      <TextField
        label={label}
        hint={hint}
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Math.max(0, Number(e.target.value)))}
      />
      <input type="range" aria-label={label} className="h-11 w-full accent-[--color-accent]" min={0} max={Math.max(max, value ?? 0)} step={step} value={value ?? 0} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

export function NaacSimulator({ framework, baseline, initial, cycleId, back, canSave }: { framework: NaacFrameworkCode; baseline: NaacScenarioInputs; initial: NaacScenarioInputs; cycleId: string; back: string; canSave: boolean }) {
  const t = useT();
  const fw = NAAC_FRAMEWORKS[framework];
  const [facts, setFacts] = useState<Facts>(initial.facts);
  const [ql, setQl] = useState<Record<string, number | null>>(initial.ql);
  const [nirf, setNirf] = useState<NirfInputs | null>(initial.nirf);
  const today = useMemo(() => simulateNaac(fw, baseline), [fw, baseline]);
  const now = useMemo(() => simulateNaac(fw, { facts, ql }), [fw, facts, ql]);
  const nirfToday = useMemo(() => (baseline.nirf ? nirfScore(baseline.nirf) : null), [baseline.nirf]);
  const nirfNow = useMemo(() => (nirf ? nirfScore(nirf) : null), [nirf]);
  // Each fact once, under the first criterion whose formulas read it.
  const groups = useMemo(() => {
    const seen = new Set<string>();
    return fw.criteria.map((c) => {
      const keys: string[] = [];
      for (const m of fw.metrics.filter((x) => x.ki.split(".")[0] === c.code && x.kind === "QN" && x.formula)) {
        for (const k of FORMULAS[m.formula!].inputs) {
          if (seen.has(k) || READ_ONLY_FACTS.has(k)) continue;
          seen.add(k);
          keys.push(k);
        }
      }
      return { code: c.code, name: c.name, keys, ql: fw.metrics.filter((x) => x.ki.split(".")[0] === c.code && x.kind === "QL") };
    });
  }, [fw]);
  const changedFacts = Object.keys({ ...facts, ...baseline.facts }).filter((k) => (facts[k] ?? null) !== (baseline.facts[k] ?? null)).length + Object.keys({ ...ql, ...baseline.ql }).filter((k) => (ql[k] ?? null) !== (baseline.ql[k] ?? null)).length;
  const changedMetrics = fw.metrics.filter((m) => (now.scores.get(m.code) ?? 0) !== (today.scores.get(m.code) ?? 0));
  const reset = () => {
    setFacts(baseline.facts);
    setQl(baseline.ql);
    setNirf(baseline.nirf);
  };
  const label = (k: string) => t(`iqac.fact.${k}` as TranslationKey);
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title={t("insights.simTitle")}
          description={t("insights.simIntro")}
          action={
            <Button type="button" size="sm" variant="secondary" onClick={reset} data-testid="sim-reset">
              {t("insights.simReset")}
            </Button>
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          <StatTile label={t("iqac.cgpaLabel")} value={<span data-testid="sim-cgpa">{now.cgpa.toFixed(2)}</span>} tone="accent" hint={t("insights.simTodayDelta", { value: today.cgpa.toFixed(2), delta: signed(now.cgpa - today.cgpa) })} />
          <StatTile label={t("iqac.gradeLabel")} value={<span data-testid="sim-grade">{now.grade}</span>} hint={now.nextBand ? t("iqac.nextBandLine", { distance: now.nextBand.distance.toFixed(2), grade: now.nextBand.grade, min: now.nextBand.min.toFixed(2) }) : t("iqac.topBand")} />
          <StatTile label={t("insights.simNirfTitle")} value={fmt(nirfNow?.projected ?? null)} hint={nirfNow?.band ? t(`insights.nirfBand.${nirfNow.band.code}` as TranslationKey) : t("insights.nirfNoData")} />
          <p className="text-sm text-fg-muted sm:col-span-3">{t("insights.simChanged", { n: changedFacts })}</p>
        </CardBody>
      </Card>

      {changedMetrics.length ? (
        <Card>
          <CardHeader title={t("insights.simCompareScores")} />
          <CardBody>
            <ul className="space-y-1 text-sm" data-testid="sim-changed-metrics">
              {changedMetrics.map((m) => (
                <li key={m.code} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-mono text-fg-muted">{m.code}</span> {m.text}
                  </span>
                  <Badge tone={(now.scores.get(m.code) ?? 0) > (today.scores.get(m.code) ?? 0) ? "ok" : "warn"}>
                    {fmt(today.scores.get(m.code))} → {fmt(now.scores.get(m.code))}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      {groups.map((g) => {
        const criterion = now.criteria.find((c) => c.code === g.code);
        const before = today.criteria.find((c) => c.code === g.code);
        return (
          <Card key={g.code}>
            <CardHeader title={g.code + ". " + g.name} description={t("insights.simCriterionLine", { today: fmt(before?.score), now: fmt(criterion?.score) })} />
            <CardBody className="space-y-4">
              {g.keys.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.keys.map((k) => {
                    const base = baseline.facts[k] ?? null;
                    const isMean = k === "sssMean";
                    return <NumberWithSlider key={k} id={k} label={label(k)} value={facts[k] ?? null} today={base} max={isMean ? 4 : Math.max(10, Math.ceil((base ?? 0) * 2) + 10)} step={isMean ? 0.1 : 1} hint={t("insights.simTodayValue", { value: String(base ?? "—") })} onChange={(v) => setFacts((f) => ({ ...f, [k]: v }))} />;
                  })}
                </div>
              ) : null}
              {g.ql.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {g.ql.map((m) => (
                    <SelectField key={m.code} label={m.code + " " + t("insights.simQualTitle")} hint={m.text} value={ql[m.code] === null || ql[m.code] === undefined ? "" : String(ql[m.code])} onChange={(e) => setQl((q) => ({ ...q, [m.code]: e.target.value === "" ? null : Number(e.target.value) }))} data-testid={`sim-ql-${m.code}`}>
                      <option value="">{t("insights.simUnscored")}</option>
                      {QL_STEPS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </SelectField>
                  ))}
                </div>
              ) : null}
            </CardBody>
          </Card>
        );
      })}

      {nirf ? (
        <Card>
          <CardHeader title={t("insights.simNirfTitle")} description={nirfNow?.projected === null || !nirfNow ? t("insights.nirfNoData") : t("insights.nirfEstimate", { partial: nirfNow.partial.toFixed(2), covered: nirfNow.coveredMarks.toFixed(2), projected: (nirfNow.projected ?? 0).toFixed(2) })} />
          <CardBody className="space-y-3">
            <p className="text-sm text-fg-muted">
              {t("insights.simTodayValue", { value: fmt(nirfToday?.projected ?? null) })} {t("insights.nirfCheck")}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {(Object.keys(nirf) as (keyof NirfInputs)[]).map((k) => (
                <TextField key={k} label={t(`insights.nirfLever.${k}` as TranslationKey)} type="number" inputMode="decimal" min={0} max={k.startsWith("f") && k.length === 2 ? 1 : k === "faculty" || k === "intake" ? undefined : 100} step="any" value={nirf[k] ?? ""} hint={t("insights.simTodayValue", { value: String(fmt(baseline.nirf?.[k] ?? null)) })} onChange={(e) => setNirf((n) => (n ? { ...n, [k]: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) } : n))} />
              ))}
            </div>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title={t("insights.simSaveTitle")} description={canSave ? undefined : t("insights.simReadOnly")} />
        {canSave ? (
          <CardBody>
            <form action={saveNaacScenarioAction} className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="cycleId" value={cycleId} />
              <input type="hidden" name="inputs" value={JSON.stringify({ facts, ql, nirf })} />
              <TextField name="name" label={t("insights.simNameField")} required minLength={2} maxLength={120} className="sm:col-span-2" />
              <Button type="submit">{t("insights.simSave")}</Button>
            </form>
          </CardBody>
        ) : null}
      </Card>
    </div>
  );
}

type NbaKey = Exclude<keyof NbaInputs, "self">;
const NBA_FIELDS: { key: NbaKey; max?: number; step: number; int: boolean }[] = [
  { key: "S", step: 1, int: true },
  { key: "F", step: 1, int: true },
  { key: "intake", step: 1, int: true },
  { key: "admitted", step: 1, int: true },
  { key: "successNoBacklog", max: 1, step: 0.01, int: false },
  { key: "successStipulated", max: 1, step: 0.01, int: false },
  { key: "apiFirst", max: 10, step: 0.1, int: false },
  { key: "apiSecond", max: 10, step: 0.1, int: false },
  { key: "apiThird", max: 10, step: 0.1, int: false },
  { key: "placement", max: 1, step: 0.01, int: false },
  { key: "professors", step: 1, int: true },
  { key: "associates", step: 1, int: true },
  { key: "assistants", step: 1, int: true },
  { key: "phd", step: 1, int: true },
  { key: "masters", step: 1, int: true },
  { key: "firstYearStudents", step: 1, int: true },
  { key: "firstYearFaculty", step: 1, int: true },
];

/** The NBA SAR's simulator: the figures the computed items read and the self-assessed marks, the SAR's total recomputed by nbaMarks. */
export function NbaSimulator({ baseline, initial, year, departmentId, back, canSave }: { baseline: NbaInputs; initial: NbaInputs; year: number; departmentId: string; back: string; canSave: boolean }) {
  const t = useT();
  const [inputs, setInputs] = useState<NbaInputs>(initial);
  const today = useMemo(() => nbaTotals(baseline), [baseline]);
  const now = useMemo(() => nbaTotals(inputs), [inputs]);
  const set = (k: NbaKey, raw: string, f: (typeof NBA_FIELDS)[number]) => {
    const nullable = !f.int;
    if (raw === "") return setInputs((i) => ({ ...i, [k]: nullable ? null : 0 }));
    let v = Math.max(0, Number(raw));
    if (f.max !== undefined) v = Math.min(f.max, v);
    if (f.int) v = Math.round(v);
    setInputs((i) => ({ ...i, [k]: v }));
  };
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title={t("insights.simNbaTitle")}
          description={t("insights.simNbaIntro")}
          action={
            <Button type="button" size="sm" variant="secondary" onClick={() => setInputs(baseline)} data-testid="sim-reset">
              {t("insights.simReset")}
            </Button>
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-3" aria-live="polite">
          <StatTile label={t("insights.simTotal")} value={<span data-testid="sim-total">{now.total.toFixed(2)}</span>} tone="accent" hint={t("insights.simTodayDelta", { value: today.total.toFixed(2) + " / " + now.max, delta: signed(now.total - today.total) })} />
          <StatTile label={t("insights.simComputedTitle")} value={now.computed.toFixed(2)} hint={t("insights.simTodayValue", { value: String(today.computed.toFixed(2)) })} />
          <StatTile label={t("insights.simSelfTitle")} value={now.self.toFixed(2)} hint={t("insights.simTodayValue", { value: String(today.self.toFixed(2)) })} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("insights.simComputedTitle")} />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {NBA_FIELDS.map((f) => (
              <TextField key={f.key} label={t(`insights.nbaLever.${f.key}` as TranslationKey)} type="number" inputMode="decimal" min={0} max={f.max} step={f.step} value={inputs[f.key] ?? ""} hint={t("insights.simTodayValue", { value: String(baseline[f.key] ?? "—") })} onChange={(e) => set(f.key, e.target.value, f)} data-testid={`sim-nba-${f.key}`} />
            ))}
          </div>
          <ul className="space-y-1 text-sm">
            {NBA_SAR_ITEMS.filter((i) => i.computed).map((i) => {
              const a = today.marks[i.code as keyof typeof today.marks];
              const b = now.marks[i.code as keyof typeof now.marks];
              return (
                <li key={i.code} className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-mono text-fg-muted">{i.code}</span> {t(`councilFilings.nbaItem.${itemKey(i.code)}` as TranslationKey)}
                  </span>
                  <Badge tone={b > a ? "ok" : b < a ? "warn" : "neutral"}>
                    {fmt(a)} → {fmt(b)} / {i.marks}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("insights.simSelfTitle")} />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          {NBA_SAR_ITEMS.filter((i) => !i.computed).map((i) => (
            <TextField
              key={i.code}
              label={i.code + " " + t(`councilFilings.nbaItem.${itemKey(i.code)}` as TranslationKey) + " (" + i.marks + ")"}
              type="number"
              inputMode="decimal"
              min={0}
              max={i.marks}
              step="any"
              value={inputs.self[i.code] ?? ""}
              hint={t("insights.simTodayValue", { value: String(baseline.self[i.code] ?? "—") })}
              onChange={(e) =>
                setInputs((x) => {
                  const self = { ...x.self };
                  if (e.target.value === "") delete self[i.code];
                  else self[i.code] = Math.min(i.marks, Math.max(0, Number(e.target.value)));
                  return { ...x, self };
                })
              }
            />
          ))}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("insights.simSaveTitle")} description={canSave ? undefined : t("insights.simReadOnly")} />
        {canSave ? (
          <CardBody>
            <form action={saveNbaScenarioAction} className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="departmentId" value={departmentId} />
              <input type="hidden" name="inputs" value={JSON.stringify(inputs)} />
              <TextField name="name" label={t("insights.simNameField")} required minLength={2} maxLength={120} className="sm:col-span-2" />
              <Button type="submit">{t("insights.simSave")}</Button>
            </form>
          </CardBody>
        ) : null}
      </Card>
    </div>
  );
}
