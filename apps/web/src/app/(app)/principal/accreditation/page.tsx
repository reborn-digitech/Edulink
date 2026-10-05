import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { iqacOverview } from "@/lib/iqac";
import { listFilings } from "@/lib/iqac-filings";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, NotAScore, day } from "@/components/iqac/parts";
import { NaacInsightsSection } from "@/components/iqac/insights";
import { naacInsights } from "@/lib/iqac-insights";
import { signoffAction } from "../../iqac/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.accreditationTitle"), robots: { index: false, follow: false } };
}

/**
 * The principal's accreditation file (module IQAC, 4 Oct 2026): the
 * predictor's reading to look at, and the NAAC documents the IQAC has sent —
 * the SSR, the AQAR, the IIQA — to sign off, or to return with a note, through
 * the head-approval pattern: the decision is an audit row the decision log
 * can read, and the IQAC is told.
 */
export default async function AccreditationPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const { ok, error } = await searchParams;
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.accreditationTitle")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const [o, filings] = await Promise.all([iqacOverview(ctx), listFilings(ctx)]);
  const waiting = filings.items.filter((f) => f.status === "AWAITING_SIGNOFF");
  const back = "/principal/accreditation";
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("iqac.accreditationTitle")}
        description={t("iqac.accreditationIntro")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/iqac/predictor">{t("iqac.navPredictor")}</Link>
          </Button>
        }
      />
      <IqacFlash ok={ok} error={error} />
      <NotAScore t={t} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label={t("iqac.cgpaLabel")} value={o.cycle?.cgpa?.toFixed(2) ?? "—"} tone="accent" />
        <StatTile label={t("iqac.gradeLabel")} value={o.cycle?.grade ?? "—"} hint={o.nextBand ? t("iqac.nextBandLine", { distance: o.nextBand.distance.toFixed(2), grade: o.nextBand.grade, min: o.nextBand.min.toFixed(2) }) : undefined} />
        <StatTile label={t("iqac.navGrievances")} value={o.counts.openGrievances} tone={o.counts.overdueGrievances ? "danger" : "neutral"} />
      </div>
      {/* Actionable insights (5 Oct 2026): what moves the college, and who makes each change. */}
      {o.cycle ? <NaacInsightsSection t={t} insights={await naacInsights(ctx, { cycleId: o.cycle.id })} role={ctx.role} locale={locale} back={back} limit={5} /> : null}
      <Card>
        <CardHeader title={t("iqac.signoffTitle")} />
        <CardBody className="space-y-4">
          {waiting.length === 0 ? (
            <EmptyState title={t("iqac.nothingToSign")} />
          ) : (
            waiting.map((f) => (
              <form key={f.id} action={signoffAction} className="space-y-3 rounded-[--radius-md] border border-border p-3" data-testid={`signoff-${f.id}`}>
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="filingId" value={f.id} />
                <p className="text-sm font-medium">
                  {t(`iqac.filingKind.${f.kind}` as TranslationKey)} · {f.year} · {day(f.generatedAt.slice(0, 10), locale)}{" "}
                  <a className="text-accent-strong underline" href={`/api/v1/iqac/filings/${f.id}/file`}>
                    {t("iqac.download")}
                  </a>
                </p>
                <TextAreaField name="note" label={t("iqac.signNoteField")} />
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" name="decision" value="SIGN" size="sm">
                    {t("iqac.signButton")}
                  </Button>
                  <Button type="submit" name="decision" value="RETURN" size="sm" variant="secondary">
                    {t("iqac.returnButton")}
                  </Button>
                </div>
              </form>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
