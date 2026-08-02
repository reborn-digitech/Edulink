import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CalendarCheckIcon } from "@phosphor-icons/react/ssr";
import { requireParent, assertGuardianAccess } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { getAttendanceSummary } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, isTeachingDay, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { AttendanceBadge } from "@/components/ui/badge";
import { ChildSwitcher } from "../child-switcher";
import { EmptyState } from "@/components/ui/states";
import { ATTENDANCE_META, ATTENDANCE_STATUSES, type AttendanceStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "Attendance" };

const RANGE_DAYS = 60;

export default async function ParentAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireParent();
  const { child: requested } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId =
    requested && children.some((c) => c.studentMembershipId === requested)
      ? requested
      : children[0]!.studentMembershipId;

  const link = await assertGuardianAccess(session.user.id, selectedId);
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;

  const today = todayKey(student.school.timezone);
  const from = addDaysToKey(today, -RANGE_DAYS);
  const summary = await getAttendanceSummary(student.schoolId, selectedId, from, today);

  const byDate = new Map(summary.recent.map((r) => [r.dateKey, r]));

  // Only days that actually have a record, newest first — showing a blank row
  // for every weekend and holiday would bury the days that matter.
  const days = summary.recent;

  return (
    <div className="space-y-5">
      <Link
        href="/parent"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        Overview
      </Link>

      {children.length > 1 && <ChildSwitcher children={children} selectedId={selectedId} />}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {childName}&rsquo;s attendance
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {student.school.name} · last {RANGE_DAYS} days
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Overall"
          value={summary.percent === null ? "—" : `${summary.percent}%`}
          tone={
            summary.percent === null
              ? "neutral"
              : summary.percent >= 95
                ? "ok"
                : summary.percent >= 90
                  ? "warn"
                  : "danger"
          }
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          hint={
            summary.total === 0
              ? "No records"
              : `${summary.counts.PRESENT + summary.counts.LATE} of ${summary.total} days`
          }
        />
        {ATTENDANCE_STATUSES.filter((s) => s !== "PRESENT").map((status) => (
          <StatTile
            key={status}
            label={ATTENDANCE_META[status].label}
            value={summary.counts[status]}
            tone={
              summary.counts[status] === 0
                ? "neutral"
                : status === "ABSENT"
                  ? "danger"
                  : status === "LATE"
                    ? "warn"
                    : "neutral"
            }
            hint={ATTENDANCE_META[status].hint}
          />
        ))}
      </div>

      <Card>
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title="Day by day"
          description={
            summary.total === 0
              ? "Nothing recorded yet"
              : `${summary.total} day${summary.total === 1 ? "" : "s"} recorded`
          }
        />
        <CardBody>
          {days.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title="No attendance recorded yet"
              description="As soon as a teacher takes the register, every day will be listed here."
            />
          ) : (
            <ul className="divide-y divide-border">
              {days.map((day) => (
                <li key={day.dateKey} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {formatDateKey(day.dateKey, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                    {day.note ? (
                      <p className="text-xs text-fg-muted">&ldquo;{day.note}&rdquo;</p>
                    ) : (
                      /*
                        Only a SUNDAY is worth flagging. The school teaches
                        Monday to Saturday, so labelling every Saturday
                        "Weekend session" told a parent that an ordinary school
                        day was unusual — noise on the six-sevenths of the week
                        that are perfectly normal.
                      */
                      !isTeachingDay(day.dateKey) && (
                        <p className="text-xs text-fg-subtle">Sunday session</p>
                      )
                    )}
                  </div>
                  <AttendanceBadge status={day.status as AttendanceStatus} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {summary.percent !== null && summary.percent < 90 && (
        <p className="rounded-[--radius-md] border border-warn/40 bg-warn-soft p-4 text-sm leading-relaxed text-warn">
          Attendance below 90% usually means the school will want a conversation — not a
          telling-off, just a check that everything is alright. You can message
          {childName}&rsquo;s teacher from the{" "}
          <Link href="/remarks" className="font-semibold underline underline-offset-2">
            messages page
          </Link>
          .
        </p>
      )}

      <p className="pb-4 text-xs text-fg-subtle">
        {byDate.size} record{byDate.size === 1 ? "" : "s"} shown. Anything a teacher changes
        appears here immediately.
      </p>
    </div>
  );
}
