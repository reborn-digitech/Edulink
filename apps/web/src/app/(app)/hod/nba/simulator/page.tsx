import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash } from "@/components/iqac/parts";
import { NbaSimulatorPage, type SimulatorQuery } from "@/components/iqac/nba-simulator-page";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("insights.simNbaTitle"), robots: { index: false, follow: false } };
}

/**
 * The HOD's SAR simulator (module IQAC, 5 Oct 2026): their own engineering
 * department's figures for a year and the self-assessed marks, the SAR's
 * total recomputed in the browser by the SAR's own functions; scenarios saved,
 * compared and shown as insights. Another department's is not theirs to see.
 */
export default async function HodNbaSimulatorPage({ searchParams }: { searchParams: Promise<SimulatorQuery> }) {
  const ctx = await requireRole("HOD");
  const [t, locale, query] = await Promise.all([getT(), getLocale(), searchParams]);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("insights.simNbaTitle")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const header = (
    <>
      <PageHeader
        title={t("insights.simNbaTitle")}
        description={t("insights.simNbaIntro")}
        actions={
          <Button asChild variant="secondary">
            <Link href={`/hod/nba${query.year ? `?year=${encodeURIComponent(query.year)}` : ""}`}>{t("councilFilings.hodTitle")}</Link>
          </Button>
        }
      />
      <IqacFlash ok={query.ok} error={query.error} />
    </>
  );
  return <NbaSimulatorPage ctx={ctx} t={t} locale={locale} query={{ ...query, departmentId: undefined }} here="/hod/nba/simulator" header={header} canSave />;
}
