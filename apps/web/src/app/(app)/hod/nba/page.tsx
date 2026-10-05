import type { Metadata } from "next";
import Link from "next/link";
import type { CouncilView } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { isModuleOn } from "@/lib/modules";
import { councilView, defaultFilingYear, filingsOf } from "@/lib/council-filings";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash } from "@/components/iqac/parts";
import { CouncilWorksheet } from "@/components/iqac/council-worksheet";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("councilFilings.hodTitle"), robots: { index: false, follow: false } };
}

/**
 * The HOD's NBA self-assessment report (5 Oct 2026): their own engineering
 * department's SAR for a year — the items computed from the rows, and the
 * qualitative criteria they self-assess and write. The IQAC generates the
 * report and the principal signs it off; a department or a college the SAR
 * is not for is told so.
 */
export default async function HodNbaPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; year?: string }> }) {
  const ctx = await requireRole("HOD");
  const [query, t, locale] = await Promise.all([searchParams, getT(), getLocale()]);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("councilFilings.hodTitle")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const year = Number(query.year) >= 2000 && Number(query.year) <= 2100 ? Number(query.year) : defaultFilingYear();
  let view: CouncilView | null = null;
  let refusal: string | null = null;
  if ((await filingsOf(ctx.schoolId)).includes("NBA_SAR")) {
    try {
      view = await councilView(ctx, "NBA_SAR", { year });
    } catch (error) {
      if (!(error instanceof AccessError) && !(error instanceof RuleRefusal)) throw error;
      refusal = t(error.key);
    }
  }
  return (
    <div className="space-y-5">
      <PageHeader title={t("councilFilings.hodTitle")} description={t("councilFilings.hodIntro")} />
      <IqacFlash ok={query.ok} error={query.error} />
      {!view ? (
        <EmptyState
          title={t("councilFilings.hodNotApplicable")}
          description={refusal ?? t("councilFilings.hodNotApplicableBody")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/hod">{t("role.hod")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardBody className="pt-5">
              <form method="get" action="/hod/nba" className="grid gap-3 sm:grid-cols-4 sm:items-end">
                <TextField name="year" type="number" min={2000} max={2100} label={t("iqac.yearField")} hint={t("iqac.yearHint")} defaultValue={view.year} />
                <Button type="submit" variant="secondary">
                  {t("councilFilings.showButton")}
                </Button>
              </form>
            </CardBody>
          </Card>
          <p className="text-sm text-fg-muted">{view.departmentName}</p>
          <CouncilWorksheet t={t} locale={locale} view={view} back={`/hod/nba?year=${view.year}`} />
        </>
      )}
    </div>
  );
}
