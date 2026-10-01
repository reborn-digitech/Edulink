import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportCardConfigSchema, reportCardConfigViewSchema, termWeightSchema, type CardSigner, type GradeBand, type ReportCardConfig, type ReportCardConfigView, type ReportCardLayout } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";
import { Button, Card, Failed, Field, Loading, Screen, SwitchRow, Text, useToast } from "@/components";
import { api } from "@/lib/api";
import { unwrap } from "@/lib/query";
import { useT } from "@/lib/i18n";
import { useRole } from "@/lib/session";
import { useTheme } from "@/lib/theme";
import { Chips, must } from "./shared";

/**
 * The school's report card rules — the web's /admin/report-cards, the one
 * document every card the school builds from now on reads: the grading
 * scale, the co-scholastic areas and their scale, the weight of each kind
 * of exam inside a term, each term's share of the annual card, and the
 * printed layout. The office edits; the head reads. Same endpoint as the
 * web (GET and POST /api/v1/office/report-card-config), the whole document
 * sent back on save, and a term's share written to the term itself first,
 * as the web does. The typeface is the web's to pick (the phone carries no
 * list of faces) and goes back as it came.
 */
export const RULES_KEY = ["office", "report-card-config"] as const;
type BandDraft = { key: string; label: string; minPercent: string; points: string; descriptor: string };
type CoGradeDraft = { key: string; label: string; descriptor: string };
type AreaDraft = { key: string; name: string };
type Kind = "UNIT_TEST" | "MID_TERM" | "FINAL";
const KINDS: Kind[] = ["UNIT_TEST", "MID_TERM", "FINAL"];
const KIND_KEY: Record<Kind, TranslationKey> = { UNIT_TEST: "reportCardConfig.kindUnitTest", MID_TERM: "reportCardConfig.kindMidTerm", FINAL: "reportCardConfig.kindFinal" };
const SIGNERS: CardSigner[] = ["NONE", "TEACHER", "ADMIN", "PRINCIPAL"];
const SIGNER_KEY: Record<CardSigner, TranslationKey> = { NONE: "signatures.signerNone", TEACHER: "signatures.signerTeacher", ADMIN: "signatures.signerAdmin", PRINCIPAL: "signatures.signerPrincipal" };
type Toggle = keyof Pick<ReportCardLayout, "showAttendance" | "showPractice" | "showCoScholastic" | "showGradePoints" | "showAddress" | "showSignatures" | "showRemark" | "useBrandColour" | "showSeal">;
const TOGGLES: Toggle[] = ["showAttendance", "showPractice", "showCoScholastic", "showGradePoints", "showAddress", "showSignatures", "showSeal", "showRemark", "useBrandColour"];
const TOGGLE_KEY: Record<Toggle, TranslationKey> = {
  showAttendance: "reportCardConfig.showAttendance",
  showPractice: "reportCardConfig.showPractice",
  showCoScholastic: "reportCardConfig.showCoScholastic",
  showGradePoints: "reportCardConfig.showGradePoints",
  showAddress: "reportCardConfig.showAddress",
  showSignatures: "reportCardConfig.showSignatures",
  showSeal: "signatures.showSeal",
  showRemark: "reportCardConfig.showRemark",
  useBrandColour: "reportCardConfig.useBrandColour",
};

let seq = 0;
const nextKey = () => `k${++seq}`;
const toBandDraft = (b: GradeBand): BandDraft => ({ key: nextKey(), label: b.label, minPercent: String(b.minPercent), points: b.points === null ? "" : String(b.points), descriptor: b.descriptor ?? "" });

/** A whole number from 0 to 100, or null for a blank; undefined for anything else. The web form's rule. */
export function wholePercent(raw: string): number | null | undefined {
  const s = raw.trim();
  if (s === "") return null;
  if (!/^\d{1,3}$/.test(s)) return undefined;
  const n = Number(s);
  return n >= 0 && n <= 100 ? n : undefined;
}

/** What the scale says in words (the web's scaleProblems): two bands starting together, and the marks under the lowest. */
export function scaleProblems(bands: { label: string; minPercent: number | null }[]): ({ kind: "gap"; from: number; to: number } | { kind: "overlap"; percent: number; first: string; second: string })[] {
  const list = bands.filter((b): b is { label: string; minPercent: number } => b.minPercent !== null).sort((a, b) => b.minPercent - a.minPercent);
  if (list.length === 0) return [];
  const problems: ReturnType<typeof scaleProblems> = [];
  for (let i = 1; i < list.length; i++) if (list[i]!.minPercent === list[i - 1]!.minPercent) problems.push({ kind: "overlap", percent: list[i]!.minPercent, first: list[i - 1]!.label, second: list[i]!.label });
  const lowest = list[list.length - 1]!.minPercent;
  if (lowest > 0) problems.push({ kind: "gap", from: 0, to: lowest - 1 });
  return problems;
}

export function ReportCardRules() {
  const t = useT();
  const role = useRole();
  const query = useQuery({ queryKey: RULES_KEY, queryFn: async () => reportCardConfigViewSchema.parse(unwrap(await api().get("/api/v1/office/report-card-config"))) });
  return (
    <Screen title={t("reportCardConfig.title")} description={t("reportCardConfig.intro")} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      {query.isPending ? <Loading /> : null}
      {query.isError ? <Failed message={query.error.message} onRetry={() => void query.refetch()} /> : null}
      {query.data ? <RulesForm key={query.dataUpdatedAt} view={query.data} readOnly={role !== "ADMIN"} /> : null}
    </Screen>
  );
}

function RulesForm({ view, readOnly }: { view: ReportCardConfigView; readOnly: boolean }) {
  const t = useT();
  const th = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [preset, setPreset] = useState(view.preset);
  const [bands, setBands] = useState<BandDraft[]>(() => view.bands.map(toBandDraft));
  const [areas, setAreas] = useState<AreaDraft[]>(() => view.coScholastic.areas.map((name) => ({ key: nextKey(), name })));
  const [coScale, setCoScale] = useState<CoGradeDraft[]>(() => view.coScholastic.scale.map((g) => ({ key: nextKey(), label: g.label, descriptor: g.descriptor ?? "" })));
  const [kindWeights, setKindWeights] = useState<Record<Kind, string>>({ UNIT_TEST: String(view.kindWeights.UNIT_TEST), MID_TERM: String(view.kindWeights.MID_TERM), FINAL: String(view.kindWeights.FINAL) });
  const [layout, setLayout] = useState<ReportCardLayout>(view.layout);
  const [termWeights, setTermWeights] = useState<Record<string, string>>(() => Object.fromEntries(view.terms.map((x) => [x.id, x.weightPercent === null ? "" : String(x.weightPercent)])));
  const [savedTermWeights, setSavedTermWeights] = useState<Record<string, number | null>>(() => Object.fromEntries(view.terms.map((x) => [x.id, x.weightPercent])));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async ({ config, terms }: { config: ReportCardConfig; terms: { id: string; value: number | null }[] }) => {
      for (const term of terms) {
        termWeightSchema.parse(must(await api().post(`/api/v1/office/terms/${term.id}/weight`, { weightPercent: term.value }), t("common.somethingWrong")));
        setSavedTermWeights((prev) => ({ ...prev, [term.id]: term.value }));
      }
      return reportCardConfigSchema.parse(must(await api().post("/api/v1/office/report-card-config", config), t("common.somethingWrong")));
    },
    onSuccess: () => {
      toast.show(t("reportCardConfig.saved"), "ok");
      void qc.invalidateQueries({ queryKey: RULES_KEY });
    },
    onError: (e) => setFormError(e.message),
  });

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

  const submit = () => {
    setFormError(null);
    const found: Record<string, string> = {};
    const invalid = t("reportCardConfig.invalidWeight");
    const parsedBands: GradeBand[] = [];
    for (const b of bands) {
      if (!b.label.trim()) continue;
      const min = wholePercent(b.minPercent);
      if (min === null || min === undefined) found[`band-${b.key}`] = invalid;
      const pointsRaw = b.points.trim();
      const points = pointsRaw === "" ? null : Number(pointsRaw);
      if (points !== null && (!Number.isFinite(points) || points < 0 || points > 10)) found[`points-${b.key}`] = invalid;
      parsedBands.push({ label: b.label.trim().slice(0, 12), minPercent: min ?? 0, points, descriptor: b.descriptor.trim().slice(0, 60) || null });
    }
    const kinds = { UNIT_TEST: wholePercent(kindWeights.UNIT_TEST), MID_TERM: wholePercent(kindWeights.MID_TERM), FINAL: wholePercent(kindWeights.FINAL) };
    for (const k of KINDS) if (kinds[k] === null || kinds[k] === undefined) found[`kind-${k}`] = invalid;
    const changedTerms: { id: string; value: number | null }[] = [];
    for (const term of view.terms) {
      const value = wholePercent(termWeights[term.id] ?? "");
      if (value === undefined) found[`term-${term.id}`] = invalid;
      else if (value !== savedTermWeights[term.id]) changedTerms.push({ id: term.id, value });
    }
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setFormError(t("common.checkTheForm"));
      return;
    }
    const config: ReportCardConfig = {
      preset: preset.slice(0, 20),
      bands: parsedBands,
      coScholastic: {
        areas: areas.map((a) => a.name.trim().slice(0, 40)).filter(Boolean).slice(0, 20),
        scale: coScale.filter((g) => g.label.trim()).map((g) => ({ label: g.label.trim().slice(0, 12), descriptor: g.descriptor.trim().slice(0, 60) || null })).slice(0, 8),
      },
      kindWeights: { UNIT_TEST: kinds.UNIT_TEST ?? 0, MID_TERM: kinds.MID_TERM ?? 0, FINAL: kinds.FINAL ?? 0 },
      layout: { ...layout, signatureLeft: layout.signatureLeft.trim().slice(0, 40), signatureRight: layout.signatureRight.trim().slice(0, 40), headerNote: layout.headerNote?.trim().slice(0, 160) || null, footerNote: layout.footerNote?.trim().slice(0, 240) || null },
    };
    save.mutate({ config, terms: changedTerms });
  };

  const liveBands = bands.filter((b) => b.label.trim()).map((b) => ({ label: b.label.trim(), minPercent: wholePercent(b.minPercent) ?? null }));
  const problems = scaleProblems(liveBands);
  const kindTotal = KINDS.reduce((sum, k) => sum + (wholePercent(kindWeights[k]) ?? 0), 0);
  const termValues = view.terms.map((term) => wholePercent(termWeights[term.id] ?? ""));
  const termTotal = termValues.reduce<number>((sum, v) => sum + (v ?? 0), 0);
  const termsBlank = termValues.every((v) => v === null);
  const termsSomeBlank = !termsBlank && termValues.some((v) => v === null);
  const field = { editable: !readOnly };

  return (
    <>
      {readOnly ? (
        <Text variant="sm" tone="muted">
          {t("common.officeSetsThis")}
        </Text>
      ) : null}
      <Card title={t("reportCardConfig.scaleTitle")}>
        <Text variant="sm" tone="muted">
          {t("reportCardConfig.scaleIntro")}
        </Text>
        <Chips label={t("reportCardConfig.preset")} value={preset} disabled={readOnly} options={[...view.presets.map((p) => ({ value: p.key, label: p.name })), { value: "custom", label: t("reportCardConfig.presetCustom") }]} onChange={choosePreset} />
        {bands.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("reportCardConfig.noBands")}
          </Text>
        ) : null}
        {bands.map((b, i) => (
          <View key={b.key} style={{ gap: th.space[2], paddingTop: th.space[2], borderTopWidth: i === 0 ? 0 : 1, borderTopColor: th.border }}>
            <View style={{ flexDirection: "row", gap: th.space[2] }}>
              <View style={{ flex: 1 }}>
                <Field label={`${t("reportCardConfig.bandLabel")} ${i + 1}`} value={b.label} onChangeText={(v) => updateBand(b.key, { label: v })} maxLength={12} {...field} />
              </View>
              <View style={{ flex: 1 }}>
                <Field label={`${t("reportCardConfig.bandMin")} ${i + 1}`} value={b.minPercent} onChangeText={(v) => updateBand(b.key, { minPercent: v })} keyboardType="number-pad" error={errors[`band-${b.key}`]} {...field} />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: th.space[2] }}>
              <View style={{ flex: 1 }}>
                <Field label={`${t("reportCardConfig.bandPoints")} ${i + 1}`} value={b.points} onChangeText={(v) => updateBand(b.key, { points: v })} keyboardType="decimal-pad" error={errors[`points-${b.key}`]} {...field} />
              </View>
              <View style={{ flex: 2 }}>
                <Field label={`${t("reportCardConfig.bandDescriptor")} ${i + 1}`} value={b.descriptor} onChangeText={(v) => updateBand(b.key, { descriptor: v })} maxLength={60} {...field} />
              </View>
            </View>
            {!readOnly ? <Button label={`${t("reportCardConfig.removeBand")} ${b.label.trim() || i + 1}`} variant="ghost" onPress={() => removeBand(b.key)} style={{ alignSelf: "flex-start" }} /> : null}
          </View>
        ))}
        {!readOnly ? <Button label={t("reportCardConfig.addBand")} variant="secondary" onPress={addBand} /> : null}
        <Text variant="xs" tone={problems.length > 0 ? "warn" : "muted"} accessibilityLiveRegion="polite">
          {liveBands.length === 0
            ? t("reportCardConfig.scaleEmpty")
            : problems.length === 0
              ? t("reportCardConfig.scaleOk")
              : problems.map((p) => (p.kind === "gap" ? t("reportCardConfig.scaleGap", { from: p.from, to: p.to }) : t("reportCardConfig.scaleOverlap", { percent: p.percent, first: p.first, second: p.second }))).join(" ")}
        </Text>
      </Card>

      <Card title={t("reportCardConfig.coScholasticTitle")}>
        <Text variant="sm" tone="muted">
          {t("reportCardConfig.coScholasticIntro")}
        </Text>
        <Text variant="sm" bold>
          {t("reportCardConfig.areasList")}
        </Text>
        {areas.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("reportCardConfig.areasNone")}
          </Text>
        ) : null}
        {areas.map((a, i) => (
          <View key={a.key} style={{ flexDirection: "row", gap: th.space[2], alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}>
              <Field label={`${t("reportCardConfig.areaName")} ${i + 1}`} value={a.name} onChangeText={(v) => setAreas((prev) => prev.map((x) => (x.key === a.key ? { ...x, name: v } : x)))} maxLength={40} {...field} />
            </View>
            {!readOnly ? <Button label={`${t("common.remove")} ${a.name.trim() || i + 1}`} variant="ghost" onPress={() => setAreas((prev) => prev.filter((x) => x.key !== a.key))} /> : null}
          </View>
        ))}
        {!readOnly ? <Button label={t("reportCardConfig.addArea")} variant="secondary" onPress={() => setAreas((prev) => [...prev, { key: nextKey(), name: "" }])} /> : null}
        <Text variant="sm" bold>
          {t("reportCardConfig.coScale")}
        </Text>
        {coScale.map((g, i) => (
          <View key={g.key} style={{ flexDirection: "row", gap: th.space[2] }}>
            <View style={{ flex: 1 }}>
              <Field label={`${t("reportCardConfig.coScale")} · ${t("reportCardConfig.coScaleLabel")} ${i + 1}`} value={g.label} onChangeText={(v) => setCoScale((prev) => prev.map((x) => (x.key === g.key ? { ...x, label: v } : x)))} maxLength={12} {...field} />
            </View>
            <View style={{ flex: 2 }}>
              <Field label={`${t("reportCardConfig.coScale")} · ${t("reportCardConfig.coScaleDescriptor")} ${i + 1}`} value={g.descriptor} onChangeText={(v) => setCoScale((prev) => prev.map((x) => (x.key === g.key ? { ...x, descriptor: v } : x)))} maxLength={60} {...field} />
            </View>
          </View>
        ))}
        {!readOnly && coScale.length < 8 ? <Button label={t("reportCardConfig.addGrade")} variant="secondary" onPress={() => setCoScale((prev) => [...prev, { key: nextKey(), label: "", descriptor: "" }])} /> : null}
      </Card>

      <Card title={t("reportCardConfig.weightsTitle")}>
        <Text variant="sm" tone="muted">
          {t("reportCardConfig.weightsIntro")}
        </Text>
        {KINDS.map((k) => (
          <Field key={k} label={t(KIND_KEY[k])} value={kindWeights[k]} onChangeText={(v) => setKindWeights((prev) => ({ ...prev, [k]: v }))} keyboardType="number-pad" error={errors[`kind-${k}`]} {...field} />
        ))}
        <Text variant="xs" tone={kindTotal === 100 || kindTotal === 0 ? "muted" : "warn"} accessibilityLiveRegion="polite">
          {t("reportCardConfig.weightTotal", { total: kindTotal })}
          {kindTotal === 0 ? ` ${t("reportCardConfig.weightsAllZero")}` : kindTotal !== 100 ? ` ${t("reportCardConfig.weightsNot100", { total: kindTotal })}` : ""}
        </Text>
        <Text variant="sm" bold>
          {t("reportCardConfig.termWeightsTitle")}
        </Text>
        <Text variant="sm" tone="muted">
          {t("reportCardConfig.termWeightsIntro")}
        </Text>
        {view.terms.length === 0 ? (
          <Text variant="sm" tone="muted">
            {t("reportCardConfig.noTerms")}
          </Text>
        ) : (
          <>
            {view.terms.map((term) => (
              <Field key={term.id} label={term.name} value={termWeights[term.id] ?? ""} onChangeText={(v) => setTermWeights((prev) => ({ ...prev, [term.id]: v }))} keyboardType="number-pad" error={errors[`term-${term.id}`]} {...field} />
            ))}
            <Text variant="xs" tone={termsBlank || (!termsSomeBlank && termTotal === 100) ? "muted" : "warn"} accessibilityLiveRegion="polite">
              {termsBlank ? t("reportCardConfig.termsEqual") : termsSomeBlank ? t("reportCardConfig.termsIncomplete") : termTotal === 100 ? t("reportCardConfig.weightTotal", { total: termTotal }) : t("reportCardConfig.termsNot100", { total: termTotal })}
            </Text>
          </>
        )}
      </Card>

      <Card title={t("reportCardConfig.layoutTitle")}>
        <Text variant="sm" tone="muted">
          {t("reportCardConfig.layoutIntro")}
        </Text>
        {TOGGLES.map((key) => (
          <SwitchRow key={key} label={t(TOGGLE_KEY[key])} value={layout[key]} disabled={readOnly} onChange={(next) => setLayout((prev) => ({ ...prev, [key]: next }))} />
        ))}
        <Chips label={t("signatures.signerLeft")} value={layout.signerLeft} disabled={readOnly} options={SIGNERS.map((s) => ({ value: s, label: t(SIGNER_KEY[s]) }))} onChange={(next) => setLayout((prev) => ({ ...prev, signerLeft: next }))} />
        <Chips label={t("signatures.signerRight")} value={layout.signerRight} disabled={readOnly} options={SIGNERS.map((s) => ({ value: s, label: t(SIGNER_KEY[s]) }))} onChange={(next) => setLayout((prev) => ({ ...prev, signerRight: next }))} />
        <Text variant="xs" tone="muted">
          {t("signatures.signerHint")}
        </Text>
        <Field label={t("reportCardConfig.signatureLeft")} value={layout.signatureLeft} onChangeText={(v) => setLayout((prev) => ({ ...prev, signatureLeft: v }))} maxLength={40} {...field} />
        <Field label={t("reportCardConfig.signatureRight")} value={layout.signatureRight} onChangeText={(v) => setLayout((prev) => ({ ...prev, signatureRight: v }))} maxLength={40} {...field} />
        <Field label={t("reportCardConfig.headerNote")} value={layout.headerNote ?? ""} onChangeText={(v) => setLayout((prev) => ({ ...prev, headerNote: v }))} maxLength={160} {...field} />
        <Field label={t("reportCardConfig.footerNote")} value={layout.footerNote ?? ""} onChangeText={(v) => setLayout((prev) => ({ ...prev, footerNote: v }))} maxLength={240} {...field} />
        <Chips label={t("reportCardConfig.paper")} value={layout.paper} disabled={readOnly} options={[{ value: "A4" as const, label: t("reportCardConfig.paperA4") }, { value: "LETTER" as const, label: t("reportCardConfig.paperLetter") }]} onChange={(next) => setLayout((prev) => ({ ...prev, paper: next }))} />
      </Card>

      {formError ? (
        <Text variant="sm" tone="danger" accessibilityRole="alert">
          {formError}
        </Text>
      ) : null}
      {!readOnly ? <Button label={t("reportCardConfig.save")} busy={save.isPending} onPress={submit} /> : null}
    </>
  );
}
