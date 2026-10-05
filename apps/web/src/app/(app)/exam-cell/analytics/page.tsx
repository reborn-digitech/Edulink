import type { Metadata } from "next";
import Link from "next/link";
import type { PassRateRow } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { getLocale, getT } from "@/lib/i18n/server";
import { examAnalytics } from "@/lib/exam-cell-marks";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CellOff, day } from "@/components/exam-cell/parts";
import type { Translate } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("examCell.analyticsTitle"), robots: { index: false, follow: false } };
}

function Rates({ rows, t, title }: { rows: PassRateRow[]; t: Translate; title: string }) {
  return (
    <Card>
      <CardHeader title={title} />
      <CardBody className="p-0">
        {rows.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-fg-muted">{t("examCell.noPublished")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="flex items-center gap-3">
                  <span className="text-fg-muted">{t("examCell.passedOf", { passed: r.passed, appeared: r.appeared })}</span>
                  <span className="w-28 overflow-hidden rounded-full bg-surface-muted" aria-hidden>
                    <span className="block h-2 bg-accent" style={{ width: `${Math.min(100, r.passRatePercent)}%` }} />
                  </span>
                  <span className="w-14 text-right font-semibold tabular-nums">{r.passRatePercent}%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

/** Pass rates from published results: by course, faculty and division for a term, the trend over sessions, and the first-year figures NBA asks for. */
export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ term?: string }> }) {
  const ctx = await requireRole("EXAM_CONTROLLER", "ADMIN", "PRINCIPAL");
  const [t, locale, on, kind] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "EXAMS"), institutionKindOf(ctx.schoolId)]);
  if (!on) return <CellOff t={t} college={isCollegeKind(kind)} />;
  const { term } = await searchParams;
  const a = await examAnalytics(ctx, term);
  return (
    <div className="space-y-5">
      <PageHeader title={t("examCell.analyticsTitle")} description={t("examCell.analyticsIntro")} back={{ href: "/exam-cell", label: t("examCell.title") }} />
      <nav aria-label={t("examCell.termPicker")} className="flex flex-wrap gap-2">
        {a.terms.map((x) => (
          <Link key={x.id} href={`/exam-cell/analytics?term=${x.id}`} className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-sm ${x.id === a.termId ? "border-accent text-accent-strong" : "border-border"}`}>
            {x.name}
          </Link>
        ))}
      </nav>
      <Card>
        <CardHeader title={t("examCell.firstYearTitle")} description={t("examCell.firstYearHint")} />
        <CardBody className="text-sm">{t("examCell.firstYearLine", { appeared: a.firstYear.appeared, mean: a.firstYear.meanSgpa ?? "—", api: a.firstYear.api ?? "—", rate: a.firstYear.successRatePercent ?? "—" })}</CardBody>
      </Card>
      <Rates rows={a.byCourse} t={t} title={t("examCell.byCourse")} />
      <Rates rows={a.byFaculty} t={t} title={t("examCell.byFaculty")} />
      <Rates rows={a.byDivision} t={t} title={t("examCell.byDivision")} />
      <Card>
        <CardHeader title={t("examCell.trendTitle")} />
        <CardBody className="space-y-1 text-sm">
          {a.trend.length === 0 ? <p className="text-fg-muted">{t("examCell.noPublished")}</p> : null}
          {a.trend.map((x) => (
            <p key={x.sessionId}>
              {x.sessionName} · {day(x.publishedAt, locale)} · {t("examCell.trendLine", { rate: x.passRatePercent, appeared: x.appeared })}
            </p>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
