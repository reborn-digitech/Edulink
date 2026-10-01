import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheckIcon, ChartBarIcon, ClipboardTextIcon, ExamIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { ANALYTICS_WINDOWS, type AnalyticsWindow, type ClassFlag } from "@edulink/contracts";
import { AccessError, requireRole } from "@/lib/tenancy";
import { classAnalytics, FLAG_ATTENDANCE_PERCENT, FLAG_LATE_HAND_INS } from "@/lib/class-analytics";
import { formatDateKey } from "@/lib/dates";
import { EXAM_KIND_KEY } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { PersonLink } from "@/components/person-link";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("classAnalytics.metaTitle") };
}

const FLAG_KEY: Record<ClassFlag, TranslationKey> = { ATTENDANCE: "classAnalytics.flagAttendance", MARKS_FALLING: "classAnalytics.flagMarksFalling", LATE_WORK: "classAnalytics.flagLateWork" };
const FLAG_TONE: Record<ClassFlag, "danger" | "warn" | "accent"> = { ATTENDANCE: "danger", MARKS_FALLING: "warn", LATE_WORK: "accent" };

/** A bar's height for a percent, 4 px for nothing so the week still shows. */
const barHeight = (percent: number | null) => (percent === null ? 4 : Math.max(4, Math.round(percent * 0.8)));

const fmt = (n: number | null) => (n === null ? "—" : `${n}%`);

/**
 * A class as numbers, for its teacher: attendance and its weekly trend,
 * every exam's average and spread, hand-ins made and late, and the pupils
 * the thresholds flag — by name, alphabetical, never ranked. Computed on
 * read by lib/class-analytics.ts; nothing here is stored. The window is the
 * current term or the last thirty days.
 */
export default async function ClassAnalyticsPage({ params, searchParams }: { params: Promise<{ classId: string }>; searchParams: Promise<{ window?: string }> }) {
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const { classId } = await params;
  const { window: rawWindow } = await searchParams;
  const window: AnalyticsWindow = (ANALYTICS_WINDOWS as readonly string[]).includes(rawWindow ?? "") ? (rawWindow as AnalyticsWindow) : "term";

  let view;
  try {
    view = await classAnalytics(ctx, classId, window);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const day = (key: string) => formatDateKey(key, { day: "numeric", month: "short" }, locale);
  const windowLabel = view.windowName ?? (view.window === "month" ? t("classAnalytics.windowMonth") : t("classAnalytics.windowNinetyDays"));
  const span = t("classAnalytics.span", { from: day(view.fromDateKey), to: day(view.toDateKey) });
  const shares = (d: { under33: number; from33: number; from50: number; from75: number }, marked: number) =>
    (
      [
        ["under33", d.under33, "bg-danger"],
        ["from33", d.from33, "bg-warn"],
        ["from50", d.from50, "bg-accent"],
        ["from75", d.from75, "bg-ok"],
      ] as const
    ).map(([key, n, colour]) => ({ key, n, colour, width: marked === 0 ? 0 : Math.round((n * 100) / marked) }));

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: `/teacher/classes/${view.classId}`, label: view.className }} title={t("classAnalytics.title", { className: view.className })} description={t("classAnalytics.intro")} />

      {/* ---- the window ---- */}
      <nav aria-label={t("classAnalytics.window")} className="flex flex-wrap items-center gap-2">
        {ANALYTICS_WINDOWS.map((w) => {
          const current = w === view.window;
          return (
            <Link
              key={w}
              href={`/teacher/classes/${view.classId}/analytics?window=${w}`}
              aria-current={current ? "page" : undefined}
              className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors hover:bg-surface-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${current ? "border-accent bg-accent-soft font-medium text-accent-strong" : "border-border text-fg"}`}
            >
              {w === "term" ? t("classAnalytics.windowTerm") : t("classAnalytics.windowMonth")}
            </Link>
          );
        })}
        <span className="text-xs text-fg-muted">
          {windowLabel} · {span}
        </span>
      </nav>

      {/* ---- the four numbers ---- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("classAnalytics.attendance")} value={fmt(view.attendance.percent)} tone={view.attendance.percent === null ? "neutral" : view.attendance.percent < FLAG_ATTENDANCE_PERCENT ? "danger" : "ok"} icon={<CalendarCheckIcon weight="duotone" className="size-5" />} hint={t("classAnalytics.registersTaken", { count: view.attendance.registers })} />
        <StatTile label={t("classAnalytics.exams")} value={view.exams.length} icon={<ExamIcon weight="duotone" className="size-5" />} hint={view.exams.length > 0 ? t("classAnalytics.latestAverage", { percent: fmt(view.exams[view.exams.length - 1]!.averagePercent) }) : t("classAnalytics.noExams")} />
        <StatTile label={t("classAnalytics.completion")} value={fmt(view.work.completionPercent)} tone={view.work.completionPercent === null ? "neutral" : "accent"} icon={<ClipboardTextIcon weight="duotone" className="size-5" />} hint={t("classAnalytics.workHint", { late: view.work.late, missing: view.work.missing })} />
        <StatTile label={t("classAnalytics.flagged")} value={view.flagged.length} tone={view.flagged.length > 0 ? "warn" : "ok"} icon={<WarningCircleIcon weight="duotone" className="size-5" />} hint={t("classAnalytics.ofPupils", { count: view.pupils })} />
      </div>

      {/* ---- attendance, week by week ---- */}
      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={t("classAnalytics.trendTitle")} description={t("classAnalytics.trendHint")} />
        <CardBody>
          {view.attendance.marks === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("classAnalytics.noRegisters")}</p>
          ) : (
            <div className="flex items-end gap-2" role="img" aria-label={t("classAnalytics.trendTitle")}>
              {view.attendance.trend.map((point, index) => (
                <div key={index} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold tabular-nums text-fg">{fmt(point.percent)}</span>
                  <div className="w-full rounded-t-md bg-accent-soft" style={{ height: `${barHeight(point.percent)}px` }} />
                  <span className="text-[10px] text-fg-muted">{point.label}</span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---- exams: average and spread ---- */}
      <Card>
        <CardHeader icon={<ExamIcon weight="duotone" className="size-5" />} title={t("classAnalytics.examsTitle")} description={t("classAnalytics.examsHint")} />
        <CardBody className="p-0">
          {view.exams.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">{t("classAnalytics.noExams")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-fg-muted">
                  <tr>
                    <th scope="col" className="px-5 py-2">{t("classAnalytics.exam")}</th>
                    <th scope="col" className="px-3 py-2 text-right">{t("classAnalytics.marked")}</th>
                    <th scope="col" className="px-3 py-2 text-right">{t("classAnalytics.average")}</th>
                    <th scope="col" className="px-5 py-2">{t("classAnalytics.spread")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {view.exams.map((exam) => (
                    <tr key={exam.seriesId}>
                      <td className="px-5 py-2.5">
                        <span className="block font-medium text-fg">{exam.name}</span>
                        <span className="block text-xs text-fg-muted">{[t(EXAM_KIND_KEY[exam.kind as keyof typeof EXAM_KIND_KEY] ?? "exams.kindUnitTest"), exam.dateKey ? day(exam.dateKey) : null].filter(Boolean).join(" · ")}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{exam.marked}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{fmt(exam.averagePercent)}</td>
                      <td className="px-5 py-2.5">
                        <div className="flex h-3 w-full min-w-40 overflow-hidden rounded-full bg-surface-muted" role="img" aria-label={t("classAnalytics.spreadLabel", { under33: exam.distribution.under33, from33: exam.distribution.from33, from50: exam.distribution.from50, from75: exam.distribution.from75 })}>
                          {shares(exam.distribution, exam.marked).map((s) => (
                            <span key={s.key} className={`${s.colour} h-full`} style={{ width: `${s.width}%` }} />
                          ))}
                        </div>
                        <span className="mt-1 block text-[10px] text-fg-muted">{t("classAnalytics.spreadLabel", { under33: exam.distribution.under33, from33: exam.distribution.from33, from50: exam.distribution.from50, from75: exam.distribution.from75 })}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ---- work ---- */}
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("classAnalytics.workTitle")} description={t("classAnalytics.workIntro")} />
        <CardBody>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-5">
            {(
              [
                ["classAnalytics.assignments", view.work.assignments],
                ["classAnalytics.expected", view.work.expected],
                ["classAnalytics.submitted", view.work.submitted],
                ["classAnalytics.late", view.work.late],
                ["classAnalytics.missing", view.work.missing],
              ] as const
            ).map(([key, n]) => (
              <div key={key}>
                <dt className="text-xs text-fg-muted">{t(key)}</dt>
                <dd className="text-lg font-semibold tabular-nums text-fg">{n}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      {/* ---- flagged pupils ---- */}
      <Card>
        <CardHeader icon={<WarningCircleIcon weight="duotone" className="size-5" />} title={t("classAnalytics.flaggedTitle")} description={t("classAnalytics.flaggedHint", { attendance: FLAG_ATTENDANCE_PERCENT, late: FLAG_LATE_HAND_INS })} />
        <CardBody className="p-0">
          {view.flagged.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" icon={<ChartBarIcon weight="duotone" className="size-6" />} title={t("classAnalytics.nobodyFlagged")} description={t("classAnalytics.nobodyFlaggedBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {view.flagged.map((p) => (
                <li key={p.membershipId} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className="min-w-0 flex-1 font-medium text-fg">
                    <PersonLink membershipId={p.membershipId} name={p.name} />
                  </span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    {p.flags.map((flag) => (
                      <Badge key={flag} tone={FLAG_TONE[flag]} size="sm">
                        {t(FLAG_KEY[flag])}
                      </Badge>
                    ))}
                  </span>
                  <span className="w-full text-xs text-fg-muted sm:w-auto">
                    {[
                      p.attendancePercent !== null ? t("classAnalytics.attendanceOf", { percent: p.attendancePercent }) : null,
                      p.recentPercents.length > 0 ? t("classAnalytics.marksOf", { marks: p.recentPercents.map((x) => `${x}%`).join(" → ") }) : null,
                      p.lateHandIns > 0 ? t("classAnalytics.lateOf", { count: p.lateHandIns }) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
