import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheckIcon, CaretLeftIcon, CaretRightIcon, DownloadSimpleIcon, UsersThreeIcon, WarningIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { staffMonth, staffRegister } from "@/lib/staff-attendance";
import { addDaysToKey, formatDateKey, todayKey } from "@/lib/dates";
import { MONTH_KEY } from "@/lib/attendance-history";
import { minuteToClock } from "@/lib/staff-attendance-labels";
import { ROLE_META, type Role } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getLocale, getT } from "@/lib/i18n/server";
import { DayPicker } from "./day-picker";
import { RegisterForm, SettingsForm } from "./register-form";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("staffAttendance.metaTitle") };
}

/**
 * The staff register, for the office and the head: one day to mark, any day
 * up to today, and the month added up per person underneath with the file
 * for the records. The day and the month are both in the URL so either can
 * be bookmarked and the arrows keep the other.
 */
export default async function StaffAttendancePage({ searchParams }: { searchParams: Promise<{ date?: string; month?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const { date: requestedDate, month: requestedMonth } = await searchParams;

  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const today = todayKey(school.timezone);
  // A day past today is clamped rather than refused: a bookmarked "tomorrow"
  // from yesterday's arrow should land on the register, not on an error.
  const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate) && requestedDate <= today ? requestedDate : today;
  const monthWanted = requestedMonth && MONTH_KEY.test(requestedMonth) ? requestedMonth : undefined;

  const [register, month] = await Promise.all([staffRegister(ctx, date), staffMonth(ctx, monthWanted)]);

  const dayHref = (d: string) => `/admin/staff-attendance?date=${d}${monthWanted ? `&month=${monthWanted}` : ""}`;
  const monthHref = (m: string) => `/admin/staff-attendance?date=${date}&month=${m}`;
  const nextDay = addDaysToKey(date, 1);
  const dayLabel = formatDateKey(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }, locale);
  const monthLabel = formatDateKey(`${month.month}-01`, { month: "long", year: "numeric" }, locale);
  const lateAfter = minuteToClock(register.checkInMinute + register.lateGraceMinutes);
  const settingsLine = [
    `${t("staffAttendance.dayStart")} ${minuteToClock(register.checkInMinute)}`,
    `${t("staffAttendance.grace")} ${t("staffAttendance.graceMinutes", { count: register.lateGraceMinutes })}`,
    t("staffAttendance.lateAfter", { time: lateAfter }),
  ].join(" · ");
  const countsLine = t("staffAttendance.counts", { present: register.counts.present, late: register.counts.late, absent: register.counts.absent, onLeave: register.counts.onLeave });
  const dayDescription = [dayLabel, countsLine].join(" · ");
  const monthDescription = [monthLabel, t("staffAttendance.workingDays", { count: month.workingDays })].join(" · ");
  const exportHref = `/admin/staff-attendance/export?month=${month.month}`;
  const link = "font-medium text-accent-strong underline underline-offset-2 hover:text-accent";

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("staffAttendance.title")}
        description={
          <>
            {t("staffAttendance.intro")}
            <span className="mt-1 block font-medium text-fg">{settingsLine}</span>
          </>
        }
      />

      {/* The clock is the admin's to set; the head reads it in the line above and marks the register against it. */}
      {ctx.role === "ADMIN" && <SettingsForm checkInMinute={register.checkInMinute} lateGraceMinutes={register.lateGraceMinutes} />}

      {/* ---- the day ---- */}
      <Card>
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title={t("staffAttendance.register")}
          description={dayDescription}
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-end gap-2">
            <DayPicker dateKey={date} today={today} month={monthWanted} />
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <Button asChild variant="secondary" size="sm" icon={<CaretLeftIcon weight="bold" />}>
                <Link href={dayHref(addDaysToKey(date, -1))}>{t("staffAttendance.previousDay")}</Link>
              </Button>
              {nextDay <= today ? (
                <Button asChild variant="secondary" size="sm" iconRight={<CaretRightIcon weight="bold" />}>
                  <Link href={dayHref(nextDay)}>{t("staffAttendance.nextDay")}</Link>
                </Button>
              ) : (
                <Button variant="secondary" size="sm" disabled iconRight={<CaretRightIcon weight="bold" />}>
                  {t("staffAttendance.nextDay")}
                </Button>
              )}
              {date !== today && (
                <Button asChild variant="ghost" size="sm">
                  <Link href={dayHref(today)}>{t("staffAttendance.today")}</Link>
                </Button>
              )}
            </div>
          </div>

          {register.closed && (
            <p className="flex items-center gap-2 rounded-[var(--radius-md)] border border-warn/40 bg-warn-soft px-3 py-2 text-sm text-warn">
              <WarningIcon weight="fill" className="size-4 shrink-0" aria-hidden="true" />
              {register.closedName ? t("staffAttendance.closedDay", { name: register.closedName }) : t("staffAttendance.sunday")}
            </p>
          )}

          {register.rows.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" icon={<UsersThreeIcon weight="duotone" className="size-6" />} title={t("staffAttendance.nobody")} description={t("staffAttendance.nobodyBody")} />
          ) : (
            <RegisterForm key={date} register={register} timezone={school.timezone} />
          )}
        </CardBody>
      </Card>

      {/* ---- the month ---- */}
      <Card>
        <CardHeader
          icon={<UsersThreeIcon weight="duotone" className="size-5" />}
          title={t("staffAttendance.monthTitle")}
          description={monthDescription}
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm" icon={<CaretLeftIcon weight="bold" />}>
              <Link href={monthHref(month.previousMonth)}>{t("staffAttendance.previousMonth")}</Link>
            </Button>
            {month.nextMonth ? (
              <Button asChild variant="secondary" size="sm" iconRight={<CaretRightIcon weight="bold" />}>
                <Link href={monthHref(month.nextMonth)}>{t("staffAttendance.nextMonth")}</Link>
              </Button>
            ) : (
              <Button variant="secondary" size="sm" disabled iconRight={<CaretRightIcon weight="bold" />}>
                {t("staffAttendance.nextMonth")}
              </Button>
            )}
            {month.nextMonth && (
              <Button asChild variant="ghost" size="sm">
                <Link href={`/admin/staff-attendance?date=${date}`}>{t("staffAttendance.month")}</Link>
              </Button>
            )}
          </div>

          {month.rows.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-6" title={t("staffAttendance.nobody")} description={t("staffAttendance.nobodyBody")} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fg-muted">
                    <th scope="col" className="py-2 pr-3 font-semibold">{t("staffAttendance.columnPerson")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("staffAttendance.columnPresent")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("staffAttendance.columnLate")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("staffAttendance.columnHalf")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("staffAttendance.columnAbsent")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("staffAttendance.columnLeave")}</th>
                    <th scope="col" className="py-2 pr-3 text-right font-semibold">{t("staffAttendance.columnUnmarked")}</th>
                    <th scope="col" className="py-2 text-right font-semibold">{t("staffAttendance.columnPercent")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {month.rows.map((row) => (
                    <tr key={row.membershipId}>
                      <th scope="row" className="py-2 pr-3 text-left font-medium text-fg">
                        {row.name}
                        <span className="ml-2 text-xs font-normal text-fg-muted">{t(ROLE_META[row.role as Role]?.labelKey ?? "role.teacher")}</span>
                      </th>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.present}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.late}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.halfDay}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.absent}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.onLeave}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{row.unmarked}</td>
                      <td className="py-2 text-right tabular-nums font-semibold">{row.percent === null ? "—" : `${row.percent}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}

          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <DownloadSimpleIcon weight="bold" className="size-4 text-fg-muted" aria-hidden="true" />
            <a href={exportHref} className={link}>
              {t("staffAttendance.exportMonth")}
            </a>
            <a href={`${exportHref}&format=xlsx`} className={link}>
              {t("staffAttendance.exportMonthXlsx")}
            </a>
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
