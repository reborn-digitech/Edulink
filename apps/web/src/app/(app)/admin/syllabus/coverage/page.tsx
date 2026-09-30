import type { Metadata } from "next";
import Link from "next/link";
import { BooksIcon, ChartBarIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { syllabusCoverage } from "@/lib/syllabus";
import { formatDateKey } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale, getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("syllabus.coverageTitle") };
}

/**
 * The head's picture: every class and subject that has a list, with done
 * over all chapters, where the year says it should be by today, and the
 * last day a lesson was taught. Each row opens the class's own syllabus
 * page — the office reaches it through assertClassAccess like a teacher.
 */
export default async function SyllabusCoveragePage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const coverage = await syllabusCoverage(ctx);
  const link = "font-medium text-accent-strong underline underline-offset-2 hover:text-accent";
  const classHref = (classId: string, subject: string) => `/teacher/classes/${classId}/syllabus?subject=${encodeURIComponent(subject)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: "/admin/syllabus", label: t("syllabus.title") }}
        title={t("syllabus.coverageTitle")}
        description={
          <>
            {t("syllabus.coverageIntro")}
            {coverage.yearName && <span className="mt-1 block font-medium text-fg">{coverage.yearName}</span>}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <StatTile
          label={t("syllabus.overall")}
          value={coverage.overallPercent === null ? "—" : `${coverage.overallPercent}%`}
          tone={coverage.overallPercent === null ? "neutral" : coverage.overallPercent + 10 < coverage.yearElapsedPercent ? "warn" : "ok"}
          icon={<ChartBarIcon weight="duotone" className="size-5" />}
          hint={t("syllabus.yearElapsed", { percent: coverage.yearElapsedPercent })}
        />
        <StatTile
          label={t("syllabus.behind")}
          value={coverage.classesBehind}
          tone={coverage.classesBehind > 0 ? "warn" : "ok"}
          hint={coverage.classesBehind > 0 ? t("syllabus.classesBehind", { count: coverage.classesBehind }) : t("syllabus.noneBehind")}
        />
      </div>

      <Card>
        <CardHeader icon={<BooksIcon weight="duotone" className="size-5" />} title={t("syllabus.coverageTitle")} description={t("syllabus.coverageIntro")} />
        <CardBody>
          {coverage.rows.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title={t("syllabus.noLists")}
              description={t("syllabus.noListsBody")}
              action={
                <Link href="/admin/syllabus" className={link}>
                  {t("syllabus.title")}
                </Link>
              }
            />
          ) : (
            <div className="overflow-x-auto" tabIndex={0}>
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("nav.classes")}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("syllabus.subject")}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("syllabus.chapters")}</th>
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("syllabus.status")}</th>
                    <th scope="col" className="py-2 font-semibold">{t("syllabus.lessons")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coverage.rows.map((row) => (
                    <tr key={`${row.classId}|${row.subject}`}>
                      <th scope="row" className="py-2.5 pr-3 text-left font-medium text-fg">
                        <Link href={classHref(row.classId, row.subject)} className={link}>
                          {row.className}
                        </Link>
                        {row.gradeLevel && <span className="ml-2 text-xs font-normal text-fg-muted">{t("syllabus.grade")} {row.gradeLevel}</span>}
                      </th>
                      <td className="py-2.5 pr-3">{row.subject}</td>
                      <td className="py-2.5 pr-3">
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">
                            {row.done}/{row.units}
                          </span>
                          <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-surface-muted" role="img" aria-label={t("syllabus.percentDone", { percent: row.percent })}>
                            <span className={`block h-full rounded-full ${row.behind ? "bg-warn" : "bg-ok"}`} style={{ width: `${row.percent}%` }} />
                          </span>
                          <span className="text-xs tabular-nums text-fg-muted">{row.percent}%</span>
                        </span>
                        <span className="block text-xs text-fg-muted">{t("syllabus.expectedBy", { expected: row.expected, units: row.units })}</span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <Badge tone={row.behind ? "warn" : "ok"} size="sm">
                          {row.behind ? t("syllabus.behind") : t("syllabus.onTrack")}
                        </Badge>
                        {row.inProgress > 0 && (
                          <span className="ml-2 text-xs text-fg-muted">
                            {t("syllabus.inProgress")} {row.inProgress}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-fg-muted">{row.lastTaughtOn ? t("syllabus.lastTaught", { date: formatDateKey(row.lastTaughtOn, { day: "numeric", month: "short" }, locale) }) : t("syllabus.neverTaught")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
