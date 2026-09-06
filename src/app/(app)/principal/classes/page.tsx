import type { Metadata } from "next";
import { nameCarriesSection } from "@/lib/codes";
import Link from "next/link";
import { CaretRightIcon, ChalkboardTeacherIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { ATTENDANCE_CONCERN_PERCENT, classInsights, parseSpan, windowFor } from "@/lib/insights";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { formatDateKey } from "@/lib/dates";
import { WindowPicker } from "../window-picker";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.classes") };
}

/**
 * Every class, with its attendance and its academic progress.
 *
 * Classes carry figures and are compared; children are not. Comparing classes is
 * an ordinary management question and no eleven-year-old is compared with their
 * friend by it — but they are still listed in the school's own order, by grade
 * and name, rather than sorted best-first. A principal reading a list top to
 * bottom should not be told what to conclude by the sort.
 */
export default async function PrincipalClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const t = await getT();
  const ctx = await requireRole("PRINCIPAL", "ADMIN");
  const { days } = await searchParams;

  const span = parseSpan(days);
  const window = await windowFor(ctx.schoolId, span);
  const insights = await classInsights(ctx, window);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("principal.classes")}
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            {t("principal.rangeTo", {
              from: formatDateKey(window.fromDateKey, { day: "numeric", month: "short" }),
              to: formatDateKey(window.toDateKey, { day: "numeric", month: "short" }),
            })}
          </p>
        </div>
        <WindowPicker span={span} />
      </div>

      <Card>
        <CardHeader
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-5" />}
          title={t("principal.classByClass")}
          description={t("principal.classByClassBody")}
        />
        <CardBody>
          {insights.length === 0 ? (
            <EmptyState
              title={t("principal.noClasses")}
              description={t("principal.noClassesBody")}
            />
          ) : (
            <ul className="space-y-2">
              {insights.map((klass) => {
                const concern =
                  klass.attendance.percent !== null &&
                  klass.attendance.percent < ATTENDANCE_CONCERN_PERCENT;

                return (
                  <li key={klass.classId}>
                    <Link
                      href={`/principal/classes/${klass.classId}?days=${span}`}
                      className="flex flex-wrap items-center gap-3 rounded-[--radius-md] bg-surface-muted p-3.5 transition-colors hover:bg-surface"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-fg">
                          {klass.name}
                          {klass.section && !nameCarriesSection(klass.name, klass.section) ? ` · ${klass.section}` : ""}
                        </span>
                        <span className="block text-xs text-fg-muted">
                          {klass.pupils === 1
                            ? t("principal.pupilsOne")
                            : t("principal.pupilsMany", { count: klass.pupils })}{" "}
                          ·{" "}
                          {klass.sessionsTaken === 1
                            ? t("principal.registersTakenOne")
                            : t("principal.registersTakenMany", { count: klass.sessionsTaken })}
                          {klass.progress.pupilsWithNoMarks > 0
                            ? ` · ${t("principal.noMarksYet", { count: klass.progress.pupilsWithNoMarks })}`
                            : ""}
                        </span>
                        {klass.reportCards.length > 0 && (
                          <span className="mt-0.5 block truncate text-xs text-fg-subtle">
                            {klass.reportCards
                              .map((report) =>
                                report.drafts > 0
                                  ? t("principal.reportSummaryDrafts", {
                                      title: report.title,
                                      published: report.published,
                                      drafts: report.drafts,
                                    })
                                  : t("principal.reportSummary", {
                                      title: report.title,
                                      published: report.published,
                                    }),
                              )
                              .join(" · ")}
                          </span>
                        )}
                      </span>

                      <span className="text-right">
                        <span className="block text-xs text-fg-muted">
                          {t("principal.attendance")}
                        </span>
                        <span
                          className={
                            concern
                              ? "block text-lg font-bold tabular-nums text-warn"
                              : "block text-lg font-bold tabular-nums text-fg"
                          }
                        >
                          {klass.attendance.percent === null ? "—" : `${klass.attendance.percent}%`}
                        </span>
                      </span>

                      <span className="text-right">
                        <span className="block text-xs text-fg-muted">
                          {t("principal.progress")}
                        </span>
                        <span className="block text-lg font-bold tabular-nums text-fg">
                          {klass.progress.percent === null ? "—" : `${klass.progress.percent}%`}
                        </span>
                      </span>

                      {concern && <WarningIcon weight="bold" className="size-5 shrink-0 text-warn" />}
                      <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {/* A figure with no denominator invites the wrong conclusion. A class
              whose register was taken twice is not a class with 100% attendance. */}
          <p className="mt-4 text-xs leading-relaxed text-fg-muted">
            {t("principal.denominatorNote")}
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
