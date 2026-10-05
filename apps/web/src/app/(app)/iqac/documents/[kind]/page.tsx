import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CollegeFilingKind, CouncilView } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { AccessError } from "@/lib/access-error";
import { RuleRefusal } from "@/lib/rule-refusal";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { councilView, defaultFilingYear } from "@/lib/council-filings";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, keyed } from "@/components/iqac/parts";
import { CouncilWorksheet } from "@/components/iqac/council-worksheet";

const KINDS: Record<string, CollegeFilingKind> = { pci: "PCI_INSPECTION", bci: "BCI_RETURN", ncte: "NCTE_RETURN", nba: "NBA_SAR" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.documentsTitle"), robots: { index: false, follow: false } };
}

/**
 * A council's return before it is generated (5 Oct 2026): the PCI inspection
 * data, the BCI and NCTE returns, an engineering department's NBA SAR — the
 * figures the rows give now and the worksheet the office or the department
 * fills. A return the college's streams do not bring says so.
 */
export default async function CouncilPage({ params, searchParams }: { params: Promise<{ kind: string }>; searchParams: Promise<{ ok?: string; error?: string; year?: string; departmentId?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [{ kind: slug }, query, t, locale] = await Promise.all([params, searchParams, getT(), getLocale()]);
  const kind = KINDS[slug];
  if (!kind) notFound();
  const tt = keyed(t);
  const title = tt("iqac.filingKind." + kind);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={title} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(await institutionKindOf(ctx.schoolId))} />
      </div>
    );
  }
  const year = Number(query.year) >= 2000 && Number(query.year) <= 2100 ? Number(query.year) : defaultFilingYear();
  let view: CouncilView | null = null;
  let refusal: string | null = null;
  try {
    view = await councilView(ctx, kind, { year, departmentId: query.departmentId || undefined });
  } catch (error) {
    if (!(error instanceof AccessError) && !(error instanceof RuleRefusal)) throw error;
    refusal = t(error.key);
  }
  const here = `/iqac/documents/${slug}`;
  const back = view ? `${here}?year=${view.year}${view.departmentId ? `&departmentId=${view.departmentId}` : ""}` : here;
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={tt("councilFilings.what." + kind)} />
      <DeskNav t={t} here="/iqac/documents" />
      <IqacFlash ok={query.ok} error={query.error} />
      <Button asChild size="sm" variant="ghost">
        <Link href="/iqac/documents">{t("councilFilings.backToDocuments")}</Link>
      </Button>
      {refusal || !view ? (
        <EmptyState
          title={refusal ?? t("councilFilings.refuseNotApplicable")}
          action={
            <Button asChild size="sm" variant="secondary">
              <Link href="/iqac/documents">{t("councilFilings.backToDocuments")}</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardBody className="pt-5">
              <form method="get" action={here} className="grid gap-3 sm:grid-cols-4 sm:items-end">
                <TextField name="year" type="number" min={2000} max={2100} label={t("iqac.yearField")} hint={t("iqac.yearHint")} defaultValue={view.year} />
                {kind === "NBA_SAR" ? (
                  <SelectField name="departmentId" label={t("councilFilings.departmentField")} defaultValue={view.departmentId ?? ""}>
                    {view.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.code} · {d.name}
                      </option>
                    ))}
                  </SelectField>
                ) : null}
                <Button type="submit" variant="secondary">
                  {t("councilFilings.showButton")}
                </Button>
              </form>
            </CardBody>
          </Card>
          <CouncilWorksheet t={t} locale={locale} view={view} back={back} />
        </>
      )}
    </div>
  );
}
