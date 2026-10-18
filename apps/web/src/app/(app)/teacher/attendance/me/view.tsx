import Link from "next/link";
import { CalendarCheckIcon, CaretLeftIcon, CaretRightIcon, ClockIcon } from "@phosphor-icons/react/ssr";
import type { ActiveContext } from "@/lib/session";
import { db } from "@/lib/db";
import { myStaffAttendance } from "@/lib/staff-attendance";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { MONTH_KEY } from "@/lib/attendance-history";
import { STAFF_SOURCE_KEY, STAFF_STATUS_KEY, STAFF_STATUS_TONE, minuteToClock } from "@/lib/staff-attendance-labels";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
// Vidura pass 2 (17 Oct 2026): "Explain this to me" beside the month's figure.
import { ExplainThis } from "@/components/assistant/explain-this";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale, getT } from "@/lib/i18n/server";
import { CheckInButton } from "./check-in-button";

/**
 * A staff member's own attendance: today's state with the "I'm in" button
 * while it is still open, the month's tally, and the days one by one as the
 * office and their check-ins recorded them. Every staff role has it — the
 * head checks in like anyone else: a teacher, the head and the office at
 * /teacher/attendance/me, every other member of staff (a college's six, the
 * driver, the librarian, the warden) at /account/attendance (campaign
 * 2026-10-04, G-2). `base` is the page it is drawn on, for the month links.
 */
export async function MyStaffAttendanceView({ ctx, requestedMonth, base }: { ctx: ActiveContext & { schoolId: string }; requestedMonth: string | undefined; base: string }) {
  const t = await getT();
  const locale = await getLocale();
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const view = await myStaffAttendance(ctx, requestedMonth && MONTH_KEY.test(requestedMonth) ? requestedMonth : undefined);

  const monthLabel = formatDateKey(`${view.month}-01`, { month: "long", year: "numeric" }, locale);
  const monthHref = (m: string) => `${base}?month=${m}`;
  const lateAfter = minuteToClock(view.checkInMinute + view.lateGraceMinutes);
  const thisMonth = view.today.slice(0, 7);
  const todayRow = view.days.find((d) => d.dateKey === view.today) ?? null;
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.timezone, { timeStyle: "short" }, locale) : null);
  const todayTime = time(todayRow?.checkedInAt ?? null);
  const workingDaysLine = t("staffAttendance.workingDays", { count: view.summary.workingDays });
  const marked = view.days.filter((day) => day.status || day.note);
  const unmarked = view.days.filter((day) => !day.status && !day.note && !day.closed).length;
  const percentHint = [monthLabel, workingDaysLine].join(" · ");
  const settingsLine = [
    `${t("staffAttendance.dayStart")} ${minuteToClock(view.checkInMinute)}`,
    `${t("staffAttendance.grace")} ${t("staffAttendance.graceMinutes", { count: view.lateGraceMinutes })}`,
    t("staffAttendance.lateAfter", { time: lateAfter }),
  ].join(" · ");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t("staffAttendance.myTitle")}
        description={
          <>
            {t("staffAttendance.myIntro")}
            <span className="mt-1 block font-medium text-fg">{settingsLine}</span>
          </>
        }
      />

      {/* ---- today ---- */}
      <Card>
        <CardHeader icon={<ClockIcon weight="duotone" className="size-5" />} title={t("staffAttendance.today")} description={formatDateKey(view.today, { weekday: "long", day: "numeric", month: "long" }, locale)} />
        <CardBody className="flex flex-wrap items-center gap-4">
          {view.todayStatus ? (
            <div className="flex flex-wrap items-center gap-2 text-sm text-fg">
              <Badge tone={STAFF_STATUS_TONE[view.todayStatus]}>{t(STAFF_STATUS_KEY[view.todayStatus])}</Badge>
              {todayTime && <span>{view.todayStatus === "LATE" ? t("staffAttendance.checkedInLate", { time: todayTime }) : t("staffAttendance.checkedInAt", { time: todayTime })}</span>}
              {!todayTime && todayRow?.source && (
                <span className="text-fg-muted">
                  {t("staffAttendance.source")} {t(STAFF_SOURCE_KEY[todayRow.source])}
                </span>
              )}
            </div>
          ) : view.canCheckIn ? (
            <CheckInButton lateAfter={lateAfter} />
          ) : (
            <p className="text-sm text-fg-muted">{todayRow?.closed ? t("staffAttendance.refuseClosed") : t("staffAttendance.unmarked")}</p>
          )}
        </CardBody>
      </Card>

      {/* ---- the month ---- */}
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild variant="secondary" size="sm" icon={<CaretLeftIcon weight="bold" />}>
          <Link href={monthHref(view.previousMonth)}>{t("staffAttendance.previousMonth")}</Link>
        </Button>
        {view.nextMonth ? (
          <Button asChild variant="secondary" size="sm" iconRight={<CaretRightIcon weight="bold" />}>
            <Link href={monthHref(view.nextMonth)}>{t("staffAttendance.nextMonth")}</Link>
          </Button>
        ) : (
          <Button variant="secondary" size="sm" disabled iconRight={<CaretRightIcon weight="bold" />}>
            {t("staffAttendance.nextMonth")}
          </Button>
        )}
        {view.month !== thisMonth && (
          <Button asChild variant="ghost" size="sm">
            <Link href={base}>{t("staffAttendance.month")}</Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("staffAttendance.columnPercent")}
          value={view.summary.percent === null ? "—" : `${view.summary.percent}%`}
          tone={view.summary.percent === null ? "neutral" : view.summary.percent >= 95 ? "ok" : view.summary.percent >= 90 ? "warn" : "danger"}
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          hint={percentHint}
        />
        <StatTile label={t("staffAttendance.columnPresent")} value={view.summary.present} tone={view.summary.present === 0 ? "neutral" : "ok"} />
        <StatTile label={t("staffAttendance.columnLate")} value={view.summary.late} tone={view.summary.late === 0 ? "neutral" : "warn"} />
        <StatTile label={t("staffAttendance.columnHalf")} value={view.summary.halfDay} />
        <StatTile label={t("staffAttendance.columnAbsent")} value={view.summary.absent} tone={view.summary.absent === 0 ? "neutral" : "danger"} />
        <StatTile label={t("staffAttendance.columnLeave")} value={view.summary.onLeave} />
      </div>
      <ExplainThis about={{ kind: "ATTENDANCE", id: view.month }} label={monthLabel} />

      <Card>
        <CardHeader icon={<CalendarCheckIcon weight="duotone" className="size-5" />} title={monthLabel} description={workingDaysLine} />
        <CardBody>
          {/* Only the days with a mark or a note: a month of "Not marked" rows was 23 lines of nothing. The unmarked days are one count. */}
          {marked.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" title={t("staffAttendance.nothingThisMonth")} description={unmarked > 0 ? t("staffAttendance.unmarkedDays", { count: unmarked }) : undefined} />
          ) : (
            <ul className="divide-y divide-border">
              {unmarked > 0 && <li className="py-2 text-xs text-fg-subtle">{t("staffAttendance.unmarkedDays", { count: unmarked })}</li>}
              {marked.map((day) => {
                const at = time(day.checkedInAt);
                return (
                  <li key={day.dateKey} className={`flex items-center justify-between gap-3 py-3 ${day.closed ? "text-fg-subtle" : ""}`}>
                    <div className="min-w-0">
                      <p className={`text-sm font-medium ${day.closed ? "text-fg-subtle" : "text-fg"}`}>{formatDateKey(day.dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)}</p>
                      {day.source && (
                        <p className="text-xs text-fg-muted">
                          {t("staffAttendance.source")} {t(STAFF_SOURCE_KEY[day.source])}
                          {at && ` · ${at}`}
                        </p>
                      )}
                      {day.note && <p className="text-xs text-fg-muted">&ldquo;{day.note}&rdquo;</p>}
                    </div>
                    {day.status ? (
                      <Badge tone={STAFF_STATUS_TONE[day.status]}>{t(STAFF_STATUS_KEY[day.status])}</Badge>
                    ) : (
                      // A closed day is greyed and says nothing more: it is not unmarked, there was nothing to mark.
                      !day.closed && <span className="text-xs text-fg-subtle">{t("staffAttendance.unmarked")}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
