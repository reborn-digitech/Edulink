import Link from "next/link";
import type { ReactNode } from "react";
import type { ScenarioCompare } from "@edulink/contracts";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { compareScenarios, listScenarios, nbaInsights, simulateNbaDoor } from "@/lib/iqac-insights";
import { defaultFilingYear, nbaDepartments } from "@/lib/council-filings";
import type { Translate } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { IqacFlash } from "@/components/iqac/parts";
import { InsightsNotAScore, NbaInsightsSection } from "@/components/iqac/insights";
import { NbaSimulator } from "@/components/iqac/simulator";
import { ScenarioPanel } from "@/components/iqac/scenarios";

export type SimulatorQuery = { cycle?: string; kind?: string; year?: string; departmentId?: string; load?: string; insights?: string; a?: string; b?: string; ok?: string; error?: string };

/** A scenario-reading call that may be refused (a stale id in the address): the refusal's sentence instead of a 500. */
export async function orRefusal<T>(t: Translate, work: () => Promise<T>): Promise<{ value: T | null; refusal: string | null }> {
  try {
    return { value: await work(), refusal: null };
  } catch (error) {
    if (!(error instanceof AccessError) && !(error instanceof RuleRefusal)) throw error;
    return { value: null, refusal: t(error.key) };
  }
}

/** The SAR's simulator for one department and year: the desk's here, the HOD's at /hod/nba/simulator. */
export async function NbaSimulatorPage({ ctx, t, locale, query, here, header, canSave }: { ctx: ActiveContext; t: Translate; locale: string; query: SimulatorQuery; here: string; header: ReactNode; canSave: boolean }) {
  const year = Number(query.year) >= 2000 && Number(query.year) <= 2100 ? Number(query.year) : defaultFilingYear();
  const opened = await orRefusal(t, () => simulateNbaDoor(ctx, { year, departmentId: query.departmentId || undefined }));
  if (!opened.value) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState title={opened.refusal ?? t("insights.simNoEngineering")} action={<Button asChild size="sm" variant="secondary"><Link href={ctx.role === "HOD" ? "/hod/nba" : "/iqac/documents"}>{t("councilFilings.backToDocuments")}</Link></Button>} />
      </div>
    );
  }
  const today = opened.value;
  const base = ctx.role === "HOD" ? `year=${today.year}` : `kind=nba&year=${today.year}&departmentId=${today.departmentId}`;
  const back = `${here}?${base}`;
  const [loaded, list, compare, shown, departments] = await Promise.all([
    query.load ? orRefusal(t, () => simulateNbaDoor(ctx, { scenarioId: query.load })) : Promise.resolve(null),
    listScenarios(ctx, { kind: "NBA", year: today.year, departmentId: today.departmentId }),
    query.a && query.b ? orRefusal<ScenarioCompare>(t, () => compareScenarios(ctx, query.a!, query.b!)) : Promise.resolve(null),
    query.insights ? orRefusal(t, () => nbaInsights(ctx, { scenarioId: query.insights })) : Promise.resolve(null),
    ctx.role === "HOD" || !ctx.schoolId ? Promise.resolve([]) : nbaDepartments(ctx.schoolId),
  ]);
  const refusal = loaded?.refusal ?? compare?.refusal ?? shown?.refusal ?? null;
  return (
    <div className="space-y-5" id="top">
      {header}
      {refusal ? <IqacFlash error={refusal} /> : null}
      <InsightsNotAScore t={t} />
      <Card>
        <CardBody className="pt-5">
          <form method="get" action={here} className="grid gap-3 sm:grid-cols-4 sm:items-end">
            {ctx.role === "HOD" ? null : <input type="hidden" name="kind" value="nba" />}
            <TextField name="year" type="number" min={2000} max={2100} label={t("iqac.yearField")} hint={t("iqac.yearHint")} defaultValue={today.year} />
            {departments.length ? (
              <SelectField name="departmentId" label={t("insights.simDepartment")} defaultValue={today.departmentId}>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} · {d.name}
                  </option>
                ))}
              </SelectField>
            ) : null}
            <Button type="submit" variant="secondary">
              {t("insights.simShow")}
            </Button>
          </form>
        </CardBody>
      </Card>
      {loaded?.value ? <p className="text-sm font-medium">{t("insights.scenarioBanner", { name: list.items.find((s) => s.id === query.load)?.name ?? "" })}</p> : null}
      <NbaSimulator key={query.load ?? "today"} baseline={today.inputs} initial={loaded?.value?.inputs ?? today.inputs} year={today.year} departmentId={today.departmentId} back={back} canSave={canSave} />
      <ScenarioPanel t={t} locale={locale} list={list} base={base} back={back} compare={compare?.value ?? null} />
      {shown?.value ? <NbaInsightsSection t={t} insights={shown.value} role={ctx.role} locale={locale} simulatorHref={null} /> : null}
    </div>
  );
}
