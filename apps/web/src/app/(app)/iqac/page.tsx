import type { Metadata } from "next";
import Link from "next/link";
import { CalendarBlankIcon, ChartLineUpIcon, GlobeIcon, MedalIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { benchmarkStatus } from "@/lib/iqac-benchmarks";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { iqacOverview } from "@/lib/iqac";
import { disclosureApplies, disclosureState, leftoverDisclosure } from "@/lib/iqac-filings";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, NotAScore, day, keyed } from "@/components/iqac/parts";
import { InsightsSummaryCard } from "@/components/iqac/insights";
import { naacInsights } from "@/lib/iqac-insights";
import { disclosureAction, openCycleAction, recomputeAction } from "./actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.title"), robots: { index: false, follow: false } };
}

/**
 * The IQAC home (module IQAC, 4 Oct 2026): the open cycle's predicted CGPA
 * and band with the distance to the next, the ten cheapest metrics, the
 * registers' counts, the regulators' calendar, the NIRF estimate and the
 * public disclosure — the coordinator's day; the office and the principal
 * read it too. Never a promise: the sentence that the platform does not score
 * for NAAC is on the page.
 */
export default async function IqacHome({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.title")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  // The AICTE disclosure is drawn only where the college's streams bring it (5 Oct 2026).
  // A page published before the streams stopped bringing it keeps its card, with the take-down only (TA-265).
  const disclosureOn = await disclosureApplies(ctx.schoolId);
  const [o, disclosure, school] = await Promise.all([iqacOverview(ctx), disclosureOn ? disclosureState(ctx) : leftoverDisclosure(ctx), db.school.findUnique({ where: { id: ctx.schoolId }, select: { name: true } })]);
  const canEdit = ctx.role !== "PRINCIPAL";
  const year = new Date().getUTCFullYear();
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.title")} description={t("iqac.homeIntro", { place: school?.name ?? "" })} />
      <DeskNav t={t} here="/iqac" />
      <IqacFlash ok={ok} error={error} />
      <NotAScore t={t} benchmarks={await benchmarkStatus(ctx.schoolId)} />

      {o.cycle ? (
        <Card>
          <CardHeader
            icon={<MedalIcon weight="duotone" className="size-5" />}
            title={t("iqac.cycleTitle")}
            description={[tt("iqac.framework." + o.cycle.framework), " · ", day(o.cycle.windowFrom, locale), " – ", day(o.cycle.windowTo, locale)].join("")}
            action={
              canEdit && o.cycle.status === "OPEN" ? (
                <ActionForm action={recomputeAction}>
                  <input type="hidden" name="back" value="/iqac" />
                  <input type="hidden" name="cycleId" value={o.cycle.id} />
                  <Button type="submit" size="sm" variant="secondary">
                    {t("iqac.recompute")}
                  </Button>
                </ActionForm>
              ) : undefined
            }
          />
          <CardBody className="grid gap-3 sm:grid-cols-3">
            <StatTile label={t("iqac.cgpaLabel")} value={o.cycle.cgpa?.toFixed(2) ?? "—"} tone="accent" icon={<ChartLineUpIcon weight="duotone" className="size-5" />} />
            <StatTile label={t("iqac.gradeLabel")} value={o.cycle.grade ?? "—"} hint={o.nextBand ? t("iqac.nextBandLine", { distance: o.nextBand.distance.toFixed(2), grade: o.nextBand.grade, min: o.nextBand.min.toFixed(2) }) : t("iqac.topBand")} />
            <StatTile label={t("iqac.navPredictor")} value={`${o.cycle.scoredCount}/${o.cycle.metricCount}`} hint={t("iqac.metricsScored", { scored: o.cycle.scoredCount, total: o.cycle.metricCount })} />
          </CardBody>
          <CardBody>
            <Button asChild variant="primary">
              <Link href={`/iqac/predictor?cycle=${o.cycle.id}`}>{t("iqac.navPredictor")}</Link>
            </Button>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="space-y-4 pt-5">
            <EmptyState
              icon={<MedalIcon weight="duotone" className="size-8" />}
              title={t("iqac.noCycleTitle")}
              // The IQAC and the office open a cycle (DESK_WRITE); the principal reads, and is told who does it.
              description={canEdit ? t("iqac.noCycleBody") : t("iqac.noCycleBodyReader")}
              action={canEdit ? <Button asChild size="sm" variant="secondary"><a href="#open-cycle">{t("iqac.openCycle")}</a></Button> : undefined}
            />
            {canEdit ? (
              <ActionForm id="open-cycle" action={openCycleAction} className="grid scroll-mt-20 gap-3 sm:grid-cols-3 sm:items-end">

                <input type="hidden" name="back" value="/iqac" />
                <DateField name="windowFrom" label={t("iqac.windowFrom")} required defaultValue={`${year - 5}-06-01`} />
                <DateField name="windowTo" label={t("iqac.windowTo")} required defaultValue={`${year}-05-31`} />
                <Button type="submit">{t("iqac.openCycle")}</Button>
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>
      )}

      {/* Actionable insights (5 Oct 2026): the way to the next band in a line and the three best steps. */}
      {o.cycle ? <InsightsSummaryCard t={t} insights={await naacInsights(ctx, { cycleId: o.cycle.id })} role={ctx.role} /> : null}

      {o.cheapest.length ? (
        <Card>
          <CardHeader title={t("iqac.cheapestTitle")} description={t("iqac.cheapestIntro")} />
          <CardBody>
            <ol className="space-y-2 text-sm">
              {o.cheapest.map((m) => (
                <li key={m.code} className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2 last:border-0">
                  <span>
                    <span className="font-mono text-fg-muted">{m.code}</span> {m.text}
                  </span>
                  <Badge tone="ok">{t("iqac.cheapestRow", { gain: m.gainPerUnit.toFixed(4), unit: tt("iqac.unit." + m.unit) })}</Badge>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label={t("iqac.researchTitle")} value={o.counts.research} />
        <StatTile label={t("iqac.activitiesTitle")} value={o.counts.activities} />
        <StatTile label={t("iqac.navSurveys")} value={o.counts.openSurveys} />
        <StatTile label={t("iqac.navGrievances")} value={o.counts.openGrievances} tone={o.counts.overdueGrievances ? "danger" : "neutral"} hint={o.counts.overdueGrievances ? t("iqac.overdueBadge") : undefined} />
      </div>

      <Card>
        <CardHeader icon={<CalendarBlankIcon weight="duotone" className="size-5" />} title={t("iqac.calendarTitle")} description={t("iqac.calendarCheck")} />
        <CardBody>
          <ul className="space-y-2 text-sm">
            {o.calendar.map((c) => (
              <li key={c.code} className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{c.label}</span>
                <span className="text-fg-muted">{t("iqac.calendarDue", { from: day(c.from, locale), to: day(c.to, locale) })}</span>
                {c.filedThisYear ? <Badge tone="ok">{t("iqac.calendarFiled")}</Badge> : null}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ChartLineUpIcon weight="duotone" className="size-5" />} title={t("iqac.nirfTitle")} description={t("iqac.nirfIntro")} />
        <CardBody className="space-y-2 text-sm">
          <p className="font-medium">{t("iqac.nirfPartial", { partial: o.nirf.partial.toFixed(2), covered: o.nirf.coveredMarks.toFixed(2) })}</p>
          <ul className="space-y-1">
            {o.nirf.parameters.map((p) => (
              <li key={p.code} className="flex flex-wrap justify-between gap-2">
                <span>
                  {p.code} · {p.name} ({p.weight})
                </span>
                <span className="text-fg-muted">{p.marks === null ? t("iqac.nirfNotComputed") : `${p.marks.toFixed(2)} · ${p.note}`}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {disclosure ? (
        <Card>
          <CardHeader icon={<GlobeIcon weight="duotone" className="size-5" />} title={t("iqac.disclosureTitle")} description={t("iqac.disclosureIntro")} />
          <CardBody className="flex flex-wrap items-center gap-3 text-sm">
            <span>{disclosure.publishedAt ? t("iqac.disclosurePublished", { date: day(disclosure.publishedAt.slice(0, 10), locale), url: disclosure.url }) : t("iqac.disclosureOff")}</span>
            {disclosure.publishedAt ? (
              <Button asChild size="sm" variant="secondary">
                <Link href={disclosure.url}>{t("iqac.view")}</Link>
              </Button>
            ) : null}
            {canEdit ? (
              <>
                {disclosureOn ? (
                  <ActionForm action={disclosureAction}>
                    <input type="hidden" name="back" value="/iqac" />
                    <input type="hidden" name="publish" value="1" />
                    <Button type="submit" size="sm">
                      {t("iqac.publishButton")}
                    </Button>
                  </ActionForm>
                ) : null}
                {disclosure.publishedAt ? (
                  <ActionForm action={disclosureAction}>
                    <input type="hidden" name="back" value="/iqac" />
                    <input type="hidden" name="publish" value="0" />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("iqac.unpublishButton")}
                    </Button>
                  </ActionForm>
                ) : null}
              </>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {ctx.role !== "IQAC" ? null : (
        <Card>
          <CardBody className="flex flex-wrap gap-3 pt-5">
            <Button asChild variant="secondary">
              <Link href="/bulletin">
                <ShieldCheckIcon weight="duotone" className="size-5" aria-hidden />
                {t("nav.bulletin")}
              </Link>
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
