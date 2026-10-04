import type { Metadata } from "next";
import Link from "next/link";
import { ChartLineUpIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { longitudinalTrends } from "@/lib/analytics-longitudinal";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("trends.metaTitle") };
}

const YEARS = [1, 2, 3] as const;
const fmt = (n: number | null) => (n === null ? "—" : `${n}%`);

/** A thin bar beside a percent, so a column of numbers can be read at a glance; nothing for no number. */
function Bar({ percent, tone = "bg-accent" }: { percent: number | null; tone?: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-right tabular-nums">{fmt(percent)}</span>
      <span className="h-2 w-24 shrink-0 overflow-hidden rounded-full bg-surface-muted" aria-hidden="true">
        <span className={`block h-full ${tone}`} style={{ width: `${percent ?? 0}%` }} />
      </span>
    </span>
  );
}

/**
 * The school across terms and years, for the head: a row per term with
 * attendance, the exam average, the share of pupils over the pass line,
 * fees collected and incidents; the exam average by subject and by teacher
 * for each term; and this year's grades beside last year's. Everything is
 * recomputed on read (lib/analytics-longitudinal.ts); nothing is ranked.
 */
export default async function PrincipalTrendsPage({ searchParams }: { searchParams: Promise<{ years?: string }> }) {
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const t = await getT();
  const { years: rawYears } = await searchParams;
  const years = (YEARS as readonly number[]).includes(Number(rawYears)) ? Number(rawYears) : 2;
  const view = await longitudinalTrends(ctx, years);
  const th = "px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-fg-muted";
  const td = "px-3 py-2.5 align-top";

  return (
    <div className="space-y-6">
      <PageHeader title={t("trends.title")} description={t("trends.intro", { passLine: view.passLinePercent })} />

      <nav aria-label={t("trends.yearsLabel")} className="flex flex-wrap items-center gap-2">
        {YEARS.map((n) => {
          const current = n === years;
          return (
            <Link
              key={n}
              href={`/principal/trends?years=${n}`}
              aria-current={current ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${current ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-border text-fg"}`}
            >
              {t("trends.lastYears", { count: n })}
            </Link>
          );
        })}
        {view.years.length > 0 && <span className="text-xs text-fg-muted">{view.years.map((y) => y.name).join(" · ")}</span>}
      </nav>

      {view.terms.length === 0 ? (
        <EmptyState icon={<ChartLineUpIcon weight="duotone" className="size-8" />} title={t("trends.empty")} description={t("trends.emptyBody")} />
      ) : (
        <>
          {/* ---- a row per term ---- */}
          <Card>
            <CardHeader icon={<ChartLineUpIcon weight="duotone" className="size-5" />} title={t("trends.termsTitle")} description={t("trends.termsHint")} />
            <CardBody className="p-0">
              <TableScroll>
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={th}>{t("trends.term")}</th>
                      <th scope="col" className={th}>{t("trends.attendance")}</th>
                      <th scope="col" className={th}>{t("trends.examAverage")}</th>
                      <th scope="col" className={th}>{t("trends.passRate")}</th>
                      <th scope="col" className={th}>{t("trends.feeCollection")}</th>
                      <th scope="col" className={`${th} text-right`}>{t("trends.incidents")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {view.terms.map((term) => (
                      <tr key={term.termId}>
                        <td className={td}>
                          <span className="block font-medium text-fg">{term.termName}</span>
                          <span className="block text-xs text-fg-muted">{term.yearName === term.termName ? t("trends.wholeYear") : term.yearName}</span>
                        </td>
                        <td className={td}><Bar percent={term.attendancePercent} /></td>
                        <td className={td}><Bar percent={term.examAveragePercent} tone="bg-ok" /></td>
                        <td className={td}>
                          <Bar percent={term.passPercent} tone="bg-ok" />
                          <span className="block text-xs text-fg-muted">{t("trends.pupilsWithMarks", { count: term.pupilsWithMarks })}</span>
                        </td>
                        <td className={td}><Bar percent={term.feeCollectionPercent} tone="bg-warn" /></td>
                        <td className={`${td} text-right tabular-nums`}>{term.incidents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableScroll>
            </CardBody>
          </Card>

          {/* ---- by subject and by teacher, per term ---- */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={t("trends.bySubject")} description={t("trends.bySubjectHint")} />
              <CardBody className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={th}>{t("trends.term")}</th>
                      <th scope="col" className={th}>{t("trends.subject")}</th>
                      <th scope="col" className={th}>{t("trends.average")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {view.terms.flatMap((term) =>
                      term.bySubject.map((row, i) => (
                        <tr key={`${term.termId}:${row.subject}`}>
                          <td className={`${td} text-xs text-fg-muted`}>{i === 0 ? `${term.termName} · ${term.yearName}` : ""}</td>
                          <td className={td}>{row.subject}</td>
                          <td className={td}>
                            <Bar percent={row.averagePercent} tone="bg-ok" />
                            <span className="block text-xs text-fg-muted">{t("trends.papers", { count: row.papers })}</span>
                          </td>
                        </tr>
                      )),
                    )}
                    {view.terms.every((term) => term.bySubject.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-sm text-fg-muted">{t("trends.noMarks")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={t("trends.byTeacher")} description={t("trends.byTeacherHint")} />
              <CardBody className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th scope="col" className={th}>{t("trends.term")}</th>
                      <th scope="col" className={th}>{t("trends.teacher")}</th>
                      <th scope="col" className={th}>{t("trends.average")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {view.terms.flatMap((term) =>
                      term.byTeacher.map((row, i) => (
                        <tr key={`${term.termId}:${row.membershipId}`}>
                          <td className={`${td} text-xs text-fg-muted`}>{i === 0 ? `${term.termName} · ${term.yearName}` : ""}</td>
                          <td className={td}>{row.name}</td>
                          <td className={td}>
                            <Bar percent={row.averagePercent} tone="bg-ok" />
                            <span className="block text-xs text-fg-muted">{t("trends.papers", { count: row.papers })}</span>
                          </td>
                        </tr>
                      )),
                    )}
                    {view.terms.every((term) => term.byTeacher.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-sm text-fg-muted">{t("trends.noMarks")}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>

          {/* ---- cohorts: the same grade, two years ---- */}
          <Card>
            <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("trends.cohortsTitle")} description={t("trends.cohortsHint")} />
            <CardBody className="p-0">
              {view.cohorts.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-fg-muted">{t("trends.noMarks")}</p>
              ) : (
                <TableScroll>
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th scope="col" className={th}>{t("trends.grade")}</th>
                        <th scope="col" className={th}>{t("trends.year")}</th>
                        <th scope="col" className={th}>{t("trends.attendance")}</th>
                        <th scope="col" className={th}>{t("trends.examAverage")}</th>
                        <th scope="col" className={`${th} text-right`}>{t("trends.pupilsSat")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {view.cohorts.flatMap((c) =>
                        [c.thisYear, c.lastYear].filter((y): y is NonNullable<typeof y> => Boolean(y)).map((y, i) => (
                          <tr key={`${c.gradeLevel}:${y.yearName}`}>
                            <td className={`${td} font-medium text-fg`}>{i === 0 ? t("trends.gradeN", { grade: c.gradeLevel }) : ""}</td>
                            <td className={td}>{y.yearName}</td>
                            <td className={td}><Bar percent={y.attendancePercent} /></td>
                            <td className={td}><Bar percent={y.examAveragePercent} tone="bg-ok" /></td>
                            <td className={`${td} text-right tabular-nums`}>{y.pupils}</td>
                          </tr>
                        )),
                      )}
                    </tbody>
                  </table>
                </TableScroll>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
