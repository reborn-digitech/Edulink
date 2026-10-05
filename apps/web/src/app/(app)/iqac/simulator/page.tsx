import type { Metadata } from "next";
import Link from "next/link";
import type { NaacFrameworkCode, ScenarioCompare } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { benchmarkStatus } from "@/lib/iqac-benchmarks";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listCycles } from "@/lib/iqac";
import { compareScenarios, listScenarios, naacInsights, simulateNaacDoor } from "@/lib/iqac-insights";
import { filingsOf } from "@/lib/council-filings";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, NotAScore } from "@/components/iqac/parts";
import { NaacInsightsSection } from "@/components/iqac/insights";
import { NaacSimulator } from "@/components/iqac/simulator";
import { ScenarioPanel } from "@/components/iqac/scenarios";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("insights.simTitle"), robots: { index: false, follow: false } };
}

import { orRefusal, NbaSimulatorPage, type SimulatorQuery as Query } from "@/components/iqac/nba-simulator-page";

/**
 * THE SIMULATOR (module IQAC, 5 Oct 2026): the IQAC changes the figures and
 * sees the grade, computed in the browser by the predictor's own functions;
 * saves what it sees as a named scenario, loads one back, compares two, and
 * shows one as insights (what it still lacks). The office and the principal
 * read it; the IQAC and the principal save. ?kind=nba is an engineering
 * department's SAR simulator for the desk; the HOD has /hod/nba/simulator.
 */
export default async function SimulatorPage({ searchParams }: { searchParams: Promise<Query> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale, query] = await Promise.all([getT(), getLocale(), searchParams]);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("insights.simTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(await institutionKindOf(ctx.schoolId))} />
      </div>
    );
  }
  const engineering = (await filingsOf(ctx.schoolId)).includes("NBA_SAR");
  const header = (
    <>
      <PageHeader title={t("insights.simTitle")} description={t("insights.simIntro")} />
      <DeskNav t={t} here="/iqac/simulator" />
      <IqacFlash ok={query.ok} error={query.error} />
      {engineering ? (
        <nav className="flex flex-wrap gap-2" aria-label={t("insights.simTitle")}>
          <Button asChild size="sm" variant={query.kind === "nba" ? "ghost" : "soft"}>
            <Link href="/iqac/simulator">{t("insights.simNaacTab")}</Link>
          </Button>
          <Button asChild size="sm" variant={query.kind === "nba" ? "soft" : "ghost"}>
            <Link href="/iqac/simulator?kind=nba">{t("insights.simNbaTitle")}</Link>
          </Button>
        </nav>
      ) : null}
    </>
  );

  if (query.kind === "nba") {
    if (!engineering) {
      return (
        <div className="space-y-5">
          {header}
          <EmptyState title={t("insights.simNoEngineering")} action={<Button asChild size="sm" variant="secondary"><Link href="/iqac/simulator">{t("insights.simNaacTab")}</Link></Button>} />
        </div>
      );
    }
    return <NbaSimulatorPage ctx={ctx} t={t} locale={locale} query={query} here="/iqac/simulator" header={header} canSave={ctx.role === "IQAC" || ctx.role === "PRINCIPAL"} />;
  }

  const cycles = await listCycles(ctx);
  const cycleId = query.cycle && cycles.items.some((c) => c.id === query.cycle) ? query.cycle : cycles.items[0]?.id;
  if (!cycleId) {
    return (
      <div className="space-y-5">
        {header}
        <EmptyState title={t("iqac.noCycleTitle")} description={t("iqac.noCycleBody")} action={<Button asChild><Link href="/iqac">{t("iqac.openDesk")}</Link></Button>} />
      </div>
    );
  }
  const cycle = cycles.items.find((c) => c.id === cycleId)!;
  const base = `cycle=${cycleId}`;
  const back = `/iqac/simulator?${base}`;
  const [today, loaded, list, compare, shown] = await Promise.all([
    simulateNaacDoor(ctx, { cycleId }),
    query.load ? orRefusal(t, () => simulateNaacDoor(ctx, { scenarioId: query.load })) : Promise.resolve(null),
    listScenarios(ctx, { kind: "NAAC", cycleId }),
    query.a && query.b ? orRefusal<ScenarioCompare>(t, () => compareScenarios(ctx, query.a!, query.b!)) : Promise.resolve(null),
    query.insights ? orRefusal(t, () => naacInsights(ctx, { scenarioId: query.insights })) : Promise.resolve(null),
  ]);
  const refusal = loaded?.refusal ?? compare?.refusal ?? shown?.refusal ?? null;
  const initial = loaded?.value?.inputs ?? today.inputs;
  return (
    <div className="space-y-5" id="top">
      {header}
      {refusal ? <IqacFlash error={refusal} /> : null}
      <NotAScore t={t} benchmarks={await benchmarkStatus(ctx.schoolId)} />
      {cycles.items.length > 1 ? (
        <Card>
          <CardBody className="pt-5">
            <form method="get" className="grid gap-3 sm:grid-cols-3 sm:items-end">
              <SelectField name="cycle" label={t("iqac.cycleTitle")} defaultValue={cycleId}>
                {cycles.items.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.windowFrom} – {c.windowTo}
                  </option>
                ))}
              </SelectField>
              <Button type="submit" variant="secondary">
                {t("insights.simShow")}
              </Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {loaded?.value ? <p className="text-sm font-medium">{t("insights.scenarioBanner", { name: list.items.find((s) => s.id === query.load)?.name ?? "" })}</p> : null}
      {/* `key`: a loaded scenario starts the simulator afresh. */}
      <NaacSimulator key={query.load ?? "today"} framework={today.framework as NaacFrameworkCode} baseline={today.inputs} initial={initial} cycleId={cycleId} back={back} canSave={(ctx.role === "IQAC" || ctx.role === "PRINCIPAL") && cycle.status !== "CLOSED"} />
      <ScenarioPanel t={t} locale={locale} list={list} base={base} back={back} compare={compare?.value ?? null} />
      {shown?.value ? <NaacInsightsSection t={t} insights={shown.value} role={ctx.role} locale={locale} back={back} simulatorHref={null} /> : null}
    </div>
  );
}
