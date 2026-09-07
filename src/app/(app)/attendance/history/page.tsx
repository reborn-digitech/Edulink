import type { Metadata } from "next";
import Link from "next/link";
import {
  CaretLeftIcon,
  CaretRightIcon,
  ClockCounterClockwiseIcon,
  DownloadSimpleIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import {
  attendanceHistory,
  historyClassesFor,
  shiftMonth,
  MONTH_KEY,
} from "@/lib/attendance-history";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { formatDateKey, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";
import { cn } from "@/lib/cn";
import { PersonLink } from "@/components/person-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.pastRegisters") };
}

/**
 * Past registers, on screen. Deliberately NOT in anyone's navigation: it is
 * reached from the register and attendance surfaces, because "the registers
 * already taken" is a thing you look up from the register, not a place you
 * go. Who may read which class is decided in `attendance-history.ts`.
 */
export default async function AttendanceHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; month?: string }>;
}) {
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const t = await getT();
  const params = await searchParams;

  const [classes, school] = await Promise.all([
    historyClassesFor(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } }),
  ]);

  if (classes.length === 0) {
    return (
      <EmptyState
        icon={<ClockCounterClockwiseIcon weight="duotone" className="size-8" />}
        title={t("attendanceHistory.noClasses")}
        description={t("attendanceHistory.noClassesBody")}
      />
    );
  }

  const thisMonth = todayKey(school.timezone).slice(0, 7);
  const month = params.month && MONTH_KEY.test(params.month) ? params.month : thisMonth;
  // One class needs no picking; a wrong id falls back to the picker rather
  // than to a refusal — the refusal is for a class that exists and is not
  // theirs, which `attendanceHistory` handles on its own.
  const selectedId =
    params.classId && classes.some((c) => c.id === params.classId)
      ? params.classId
      : classes.length === 1
        ? classes[0]!.id
        : null;

  const monthLabel = formatDateKey(`${month}-01`, { month: "long", year: "numeric" });
  const hrefFor = (classId: string, m: string) => `/attendance/history?classId=${classId}&month=${m}`;

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("attendanceHistory.title")}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("attendanceHistory.intro")}</p>
      </div>
      {/* Keyed, because the route is reused across months and classes and an
          uncontrolled select keeps its first defaultValue otherwise. */}
      <form
        key={`${selectedId ?? ""}:${month}`}
        action="/attendance/history"
        method="get"
        className="flex flex-wrap items-end gap-2"
      >
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-fg-muted">
            {t("attendanceHistory.fieldClass")}
          </span>
          <select
            name="classId"
            defaultValue={selectedId ?? ""}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg"
          >
            {!selectedId && <option value="">{t("attendanceHistory.chooseClass")}</option>}
            {classes.map((klass) => (
              <option key={klass.id} value={klass.id}>
                {klass.archived ? t("attendanceHistory.archivedName", { name: klass.name }) : klass.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs font-medium text-fg-muted">
            {t("attendanceHistory.fieldMonth")}
          </span>
          <input
            type="month"
            name="month"
            defaultValue={month}
            max={thisMonth}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg"
          />
        </label>
        <Button type="submit" variant="secondary" size="sm">
          {t("attendanceHistory.show")}
        </Button>
      </form>
    </div>
  );

  if (!selectedId) {
    return (
      <div className="space-y-4">
        {header}
        <ul className="grid gap-2 sm:grid-cols-2">
          {classes.map((klass) => (
            <li key={klass.id}>
              <Card interactive className="overflow-hidden">
                <Link href={hrefFor(klass.id, month)} className="flex items-center gap-3 p-4">
                  <span
                    aria-hidden="true"
                    className="h-8 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: klass.color ?? "var(--accent)" }}
                  />
                  <span className="min-w-0 flex-1 truncate font-semibold text-fg">
                    {klass.archived ? t("attendanceHistory.archivedName", { name: klass.name }) : klass.name}
                  </span>
                  <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const history = await attendanceHistory(ctx, selectedId, month);
  const next = shiftMonth(month, 1);
  const canGoForward = next <= thisMonth;

  return (
    <div className="space-y-4">
      {header}

      <Card>
        <CardHeader
          icon={<ClockCounterClockwiseIcon weight="duotone" className="size-5" />}
          title={[history.class.name, monthLabel].join(" · ")}
          description={
            history.days.length === 0
              ? t("attendanceHistory.nothingTaken", { className: history.class.name, month: monthLabel })
              : [
                  history.days.length === 1
                    ? t("attendanceHistory.registersTakenOne")
                    : t("attendanceHistory.registersTaken", { count: history.days.length }),
                  t("attendanceHistory.monthRate", { percent: history.percent ?? 0 }),
                ].join(" · ")
          }
          action={
            <div className="flex items-center gap-1">
              <Button asChild variant="ghost" size="sm" aria-label={t("attendanceHistory.previousMonth")}>
                <Link href={hrefFor(selectedId, shiftMonth(month, -1))}>
                  <CaretLeftIcon weight="bold" className="size-4" />
                </Link>
              </Button>
              {canGoForward ? (
                <Button asChild variant="ghost" size="sm" aria-label={t("attendanceHistory.nextMonth")}>
                  <Link href={hrefFor(selectedId, next)}>
                    <CaretRightIcon weight="bold" className="size-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" disabled aria-label={t("attendanceHistory.nextMonth")}>
                  <CaretRightIcon weight="bold" className="size-4" />
                </Button>
              )}
            </div>
          }
        />
        {history.days.length > 0 && (
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-fg-muted">
                    <th scope="col" className="sticky left-0 z-10 bg-surface px-4 py-2 text-left font-medium">
                      {t("attendanceHistory.pupil")}
                    </th>
                    {history.days.map((day) => (
                      <th key={day.dateKey} scope="col" className="px-1 py-2 text-center font-medium">
                        <span className="block">{formatDateKey(day.dateKey, { day: "numeric" })}</span>
                        <span className="block text-[10px] text-fg-subtle">
                          {formatDateKey(day.dateKey, { weekday: "short" })}
                        </span>
                      </th>
                    ))}
                    <th scope="col" className="px-3 py-2 text-right font-medium">
                      {t("attendanceHistory.rate")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.pupils.map((pupil) => (
                    <tr key={pupil.membershipId} className="border-b border-border last:border-0">
                      <th
                        scope="row"
                        className="sticky left-0 z-10 max-w-[14rem] truncate bg-surface px-4 py-1.5 text-left font-medium text-fg"
                      >
                        <PersonLink membershipId={pupil.membershipId} name={pupil.name} />
                      </th>
                      {history.days.map((day) => (
                        <td key={day.dateKey} className="px-1 py-1.5 text-center">
                          <Mark status={pupil.marks[day.dateKey] ?? null} />
                        </td>
                      ))}
                      <td
                        className={cn(
                          "px-3 py-1.5 text-right font-semibold tabular-nums",
                          pupil.percent === null
                            ? "text-fg-subtle"
                            : pupil.percent < 75
                              ? "text-danger"
                              : pupil.percent < 90
                                ? "text-warn"
                                : "text-fg",
                        )}
                      >
                        {pupil.percent === null ? "—" : `${pupil.percent}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-border bg-surface-muted text-xs">
                    <th scope="row" className="sticky left-0 z-10 bg-surface-muted px-4 py-2 text-left font-medium text-fg-muted">
                      {t("attendanceHistory.dayTotals")}
                    </th>
                    {history.days.map((day) => (
                      <td key={day.dateKey} className="px-1 py-2 text-center font-semibold tabular-nums text-fg">
                        {day.percent}%
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-fg">
                      {history.percent === null ? "—" : `${history.percent}%`}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
              <p className="text-xs text-fg-muted">{t("attendanceHistory.legend")}</p>
              {ctx.role === "ADMIN" && (
                <Button asChild variant="ghost" size="sm" icon={<DownloadSimpleIcon weight="bold" />}>
                  <a href={`/admin/attendance/export/register?classId=${selectedId}&month=${month}`}>
                    {t("attendanceHistory.exportCsv")}
                  </a>
                </Button>
              )}
            </div>
          </CardBody>
        )}
      </Card>
    </div>
  );
}

/** One cell: the status letter in its own colour, or nothing at all. */
async function Mark({ status }: { status: AttendanceStatus | null }) {
  if (!status) return <span className="text-fg-subtle">·</span>;
  const t = await getT();
  const meta = ATTENDANCE_META[status];
  return (
    <span
      title={t(meta.labelKey)}
      className="inline-grid size-6 place-items-center rounded-md text-xs font-bold"
      style={{ backgroundColor: `var(--att-${meta.token}-soft)`, color: `var(--att-${meta.token})` }}
    >
      {t(meta.shortKey)}
    </span>
  );
}
