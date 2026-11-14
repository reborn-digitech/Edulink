import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccessError, requireUser } from "@/lib/tenancy";
import { buildProgressReport, isHomeWindow } from "@/lib/reports";
import { recordsForStudentMembership } from "@/lib/school-record";
import { SchoolRecordList } from "@/components/school-record-list";
import { formatDate, formatDateKey } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { Avatar } from "@/components/ui/avatar";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { PrintButton } from "./print-button";
import { getT } from "@/lib/i18n/server";
import { TableScroll } from "@/components/ui/table-scroll";
import { BackLink, PAGE_TITLE } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.progressReport"), robots: { index: false, follow: false } };
}

/**
 * One child's progress report, on one sheet.
 *
 * Built to be PRINTED, which drives the layout: no cards within cards, no
 * colour carrying meaning on its own, and every heading readable in black on
 * white. `.no-print` removes the nav and the controls, so what comes out of the
 * printer is the report and nothing else.
 *
 * The figures are not computed here — `buildProgressReport` asks the same
 * helpers the register and the gradebook use, so a printout can never disagree
 * with the screen a parent is holding it next to.
 */
export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentMembershipId: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const session = await requireUser();
  const t = await getT();
  const { studentMembershipId } = await params;
  const { from, to } = await searchParams;

  let report;
  try {
    report = await buildProgressReport(session, studentMembershipId, { fromKey: from, toKey: to });
  } catch (error) {
    // NOT_FOUND rather than a refusal, as everywhere else: telling somebody a
    // child exists but is not theirs is itself a disclosure.
    if (error instanceof AccessError) notFound();
    throw error;
  }

  /**
   * Where this child was BEFORE this school.
   *
   * On the progress report because this is the one page a teacher, a principal
   * and a parent all open about a single child — so it is the page where "they
   * joined us in March from Riverside" belongs. Postgres decides what comes
   * back: a school reading a certificate it did not write is doing so because
   * the child is one of theirs NOW, which is the whole of what MEMBER_READABLE
   * allows. See school-record.ts.
   *
   * It prints, because a receiving school filing a new pupil's paperwork wants
   * this on the same sheet as everything else.
   */
  const previous = await recordsForStudentMembership(session, studentMembershipId);

  const name = report.student.preferredName ?? report.student.name;
  const statuses = ["PRESENT", "LATE", "ABSENT", "EXCUSED"] as const satisfies readonly AttendanceStatus[];

  return (
    <div className="mx-auto max-w-3xl space-y-6 print:max-w-none">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <BackLink href={session.role === "PARENT" ? "/parent" : "/teacher/classes"} label={t("common.back")} />
        <PrintButton />
      </div>

      <header className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
        <Avatar avatarKey={report.student.avatarKey} name={report.student.name} size="lg" />
        <div className="min-w-0 flex-1">
          {/* Beside the avatar on a sheet that prints, so not a PageHeader; the title has its look (A3-states-9). */}
          <h1 className={cn(PAGE_TITLE, "print:text-black")}>{report.student.name}</h1>

          <p className="text-sm text-fg-muted">
            {report.school.name}
            {report.student.gradeLevel ? ` · ${t("reportView.gradeLevel", { level: report.student.gradeLevel })}` : ""}
          </p>
        </div>
        <div className="text-sm text-fg-muted sm:text-right">
          <p className="font-medium text-fg">{t("reportView.progressReport")}</p>
          <p>
            {t("reportView.dateRange", {
              from: formatDateKey(report.window.fromKey, { day: "numeric", month: "long" }),
              to: formatDateKey(report.window.toKey, { day: "numeric", month: "long", year: "numeric" }),
            })}
          </p>
        </div>
      </header>

      <section aria-labelledby="attendance-heading" className="space-y-2.5">
        <h2 id="attendance-heading" className="text-lg font-semibold">
          {t("reportView.attendance")}
        </h2>
        {report.attendance.withheld ? (
          <p className="text-sm text-fg-muted">
            {t("familyGaps.notSharedBody", { name })}
          </p>
        ) : report.attendance.total === 0 ? (
          <p className="text-sm text-fg-muted">
            {t("reportView.noRegisterFor", { name })}
          </p>
        ) : (
          <>
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-bold">{report.attendance.percent}%</strong>{" "}
              {report.attendance.total === 1
                ? t("reportView.percentOfDaysOne")
                : t("reportView.percentOfDaysMany", { count: report.attendance.total })}
              {report.attendance.bestStreak > 1 && (
                <> {report.attendance.bestStreak === 1 ? t("reportView.longestRunOne", { count: 1 }) : t("reportView.longestRun", { count: report.attendance.bestStreak })}</>
              )}
            </p>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {statuses.map((status) => (
                <div key={status} className="rounded-[var(--radius-md)] border border-border p-2.5">
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">
                    {t(ATTENDANCE_META[status].labelKey)}
                  </dt>
                  <dd className="text-lg font-semibold">{report.attendance.counts[status]}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-fg-muted">{t("reportView.lateCounts")}</p>
          </>
        )}
      </section>

      <section aria-labelledby="work-heading" className="space-y-2.5">
        <h2 id="work-heading" className="text-lg font-semibold">
          {t("reportView.work")}
        </h2>
        {report.grades.marked.length === 0 ? (
          <p className="text-sm text-fg-muted">{t("reportView.nothingMarkedFor", { name })}</p>
        ) : (
          <>
            {/*
              TA-388 (owner's decision, 14 November 2026): the homework and the tests of the window, each on its own,
              with the overall of both beneath. The homework average is the family's home tile, so the number a
              guardian sees at home is on this sheet.
            */}
            <dl className="grid grid-cols-2 gap-2">
              {(
                [
                  {
                    label: t("reportView.homeworkAverage"),
                    percent: report.grades.homeworkPercent,
                    count:
                      report.grades.homeworkCount === 1
                        ? t("reportView.homeworkCountOne")
                        : t("reportView.homeworkCountMany", { count: report.grades.homeworkCount }),
                    marked: report.grades.homeworkCount,
                  },
                  {
                    label: t("reportView.testsAverage"),
                    percent: report.grades.testsPercent,
                    count:
                      report.grades.testsCount === 1
                        ? t("reportView.testsCountOne")
                        : t("reportView.testsCountMany", { count: report.grades.testsCount }),
                    marked: report.grades.testsCount,
                  },
                ] as const
              ).map((figure) => (
                <div key={figure.label} className="rounded-[var(--radius-md)] border border-border p-2.5">
                  <dt className="text-xs uppercase tracking-wide text-fg-muted">{figure.label}</dt>
                  <dd className="text-lg font-semibold">{figure.percent === null ? "—" : `${figure.percent}%`}</dd>
                  <dd className="text-xs text-fg-muted">
                    {figure.marked === 0 ? t("reportView.noneMarkedHere") : figure.count}
                  </dd>
                </div>
              ))}
            </dl>
            {/* Only the home tile's own twelve weeks hold the home figure; a custom ?from=&to= window does not (TA-388). */}
            {isHomeWindow(report.window, report.school.timezone) ? (
              <p className="text-xs text-fg-muted">{t("reportView.averagesExplainer")}</p>
            ) : null}
            <p className="text-[0.9375rem]">
              <strong className="text-2xl font-bold">{report.grades.overallPercent}%</strong>{" "}
              {report.grades.marked.length === 1
                ? t("reportView.overallAcrossOne")
                : t("reportView.overallAcrossMany", { count: report.grades.marked.length })}
            </p>
            <p className="text-xs text-fg-muted">
              {report.grades.method === "weighted"
                ? t("reportView.weightedExplainer")
                : t("reportView.pointsExplainer")}
            </p>
            {report.grades.uncategorised > 0 && (
              <p className="text-xs text-warn">
                {report.grades.uncategorised === 1
                  ? t("reportView.uncategorisedOne")
                  : t("reportView.uncategorisedMany", { count: report.grades.uncategorised })}
              </p>
            )}
            <TableScroll className="print:overflow-visible">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th scope="col" className="py-1.5 font-medium">{t("reportView.work")}</th>
                    <th scope="col" className="py-1.5 font-medium">{t("reportView.klass")}</th>
                    <th scope="col" className="py-1.5 text-right font-medium">{t("reportView.score")}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.grades.marked.map((row, index) => (
                    <tr key={`${row.title}-${index}`} className="border-b border-border/60 align-top">
                      <td className="py-1.5">
                        {row.title}
                        {row.comment && (
                          <span className="block text-xs italic text-fg-muted">“{row.comment}”</span>
                        )}
                      </td>
                      <td className="py-1.5 text-fg-muted">{row.className}</td>
                      <td className="py-1.5 text-right tabular-nums">
                        {formatMilli(row.scoreMilli)}
                        {row.pointsMilli ? ` / ${formatMilli(row.pointsMilli)}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </>
        )}
      </section>

      {report.badges.length > 0 && (
        <section aria-labelledby="badges-heading" className="space-y-2.5">
          <h2 id="badges-heading" className="text-lg font-semibold">
            {t("reportView.earnedAlongWay")}
          </h2>
          {/*
            Said out loud, because otherwise this section contradicts the one
            above it — and the sentence had to CHANGE when the badge rule
            reversed. It used to say badges were kept once earned, which was true
            then and is now false: an attendance badge is a statement about the
            last twenty school days, so a child can show 82% for the report's
            window and hold no attendance badge, or the reverse. Leaving the old
            wording would have been a printed sheet telling a parent something the
            app no longer does.
          */}
          <p className="text-xs text-fg-muted">{t("reportView.badgesExplainer")}</p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.badges.map((badge) => (
              <li key={badge.id} className="rounded-[var(--radius-md)] border border-border p-2.5">
                <p className="text-sm font-medium">{t(badge.labelKey)}</p>
                <p className="text-xs text-fg-muted">{t(badge.descriptionKey)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {previous.length > 0 && (
        <section aria-labelledby="previous-heading" className="space-y-2.5">
          <h2 id="previous-heading" className="text-lg font-semibold">
            {t("reportView.beforeCameHere", { name })}
          </h2>
          <p className="text-xs text-fg-muted">{t("reportView.beforeExplainer", { name })}</p>
          <SchoolRecordList records={previous} t={t} />
        </section>
      )}

      <footer className="border-t border-border pt-3 text-xs text-fg-muted">
        <p>
          {t("reportView.generatedOn", {
            school: report.school.name,
            date: formatDate(report.generatedAt),
          })}
        </p>
        <p className="mt-0.5">
          {t("reportView.coversAsk", {
            from: formatDateKey(report.window.fromKey, { day: "numeric", month: "long", year: "numeric" }),
            to: formatDateKey(report.window.toKey, { day: "numeric", month: "long", year: "numeric" }),
          })}
        </p>
      </footer>
    </div>
  );
}
