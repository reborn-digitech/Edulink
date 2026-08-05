import type { Metadata } from "next";
import {
  CalendarCheckIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  FireIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getAttendanceSummary, computeStreak } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, relativeTime, todayKey } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AttendanceBadge, Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StudentWelcome } from "./welcome";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";
import { getLocale } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.today") };
}

export default async function StudentHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; handle?: string }>;
}) {
  const locale = await getLocale();
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const { welcome, handle } = await searchParams;

  const membership = await db.membership.findUniqueOrThrow({
    where: { id: ctx.membershipId },
    include: {
      user: { select: { name: true, preferredName: true, avatarKey: true } },
      school: { select: { name: true, timezone: true } },
      enrollments: { where: { status: "ACTIVE" }, include: { class: { select: { name: true } } } },
    },
  });

  const name = membership.user.preferredName ?? membership.user.name;
  const timezone = membership.school.timezone;
  const today = todayKey(timezone);

  const [attendance, todayRecord, grades, upcoming] = await Promise.all([
    getAttendanceSummary(ctx.schoolId, ctx.membershipId, addDaysToKey(today, -28), today),
    db.attendanceRecord.findFirst({
      where: { studentMembershipId: ctx.membershipId, session: { dateKey: today } },
      select: { status: true },
    }),
    db.grade.findMany({
      where: { studentMembershipId: ctx.membershipId, schoolId: ctx.schoolId },
      include: { assignment: { select: { title: true, pointsMilli: true } } },
      orderBy: { gradedAt: "desc" },
      take: 5,
    }),
    db.assignment.findMany({
      where: {
        schoolId: ctx.schoolId,
        publishedAt: { not: null },
        dueAt: { gte: new Date() },
        class: { enrollments: { some: { studentMembershipId: ctx.membershipId, status: "ACTIVE" } } },
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 5,
    }),
  ]);

  const streak = computeStreak(attendance.recent);

  return (
    <div className="space-y-6">
      {welcome === "1" && <StudentWelcome name={name} handle={handle ?? null} />}

      <div className="flex items-center gap-4">
        <Avatar avatarKey={membership.user.avatarKey} name={membership.user.name} size="lg" ring />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            Hi {name} 👋
          </h1>
          <p className="text-sm text-fg-muted">
            {formatDateKey(today, { weekday: "long", day: "numeric", month: "long" }, locale)}
            {membership.enrollments[0] ? ` · ${membership.enrollments[0].class.name}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t("student.today")}
          value={
            todayRecord
              ? t(ATTENDANCE_META[todayRecord.status as AttendanceStatus].labelKey)
              : "Not yet"
          }
          tone={
            !todayRecord
              ? "neutral"
              : todayRecord.status === "PRESENT"
                ? "ok"
                : todayRecord.status === "LATE"
                  ? "warn"
                  : "danger"
          }
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          hint={todayRecord ? "Register taken" : "Your teacher hasn't taken it yet"}
        />
        <StatTile
          label={t("student.streak")}
          value={streak}
          tone={streak >= 5 ? "ok" : "neutral"}
          icon={<FireIcon weight="duotone" className="size-5" />}
          hint={
            streak === 0
              ? "Turn up tomorrow to start one"
              : streak >= 5
                ? "You're on a roll!"
                : `${streak} day${streak === 1 ? "" : "s"} in a row`
          }
        />
        <StatTile
          label={t("student.attendance")}
          value={attendance.percent === null ? "—" : `${attendance.percent}%`}
          tone={attendance.percent !== null && attendance.percent >= 95 ? "ok" : "neutral"}
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          hint={t("student.lastFourWeeks")}
        />
      </div>

      <Card>
        <CardHeader
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title={t("student.whatIsDue")}
          description={upcoming.length === 0 ? "Nothing due" : `${upcoming.length} to do`}
        />
        <CardBody>
          {upcoming.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              tone="celebrate"
              icon={<CheckIcon />}
              title={t("student.nothingDue")}
              description={t("student.nothingDueBody")}
            />
          ) : (
            <ul className="space-y-2">
              {upcoming.map((assignment) => {
                const dueSoon =
                  assignment.dueAt &&
                  assignment.dueAt.getTime() - Date.now() < 2 * 86_400_000;
                return (
                  <li
                    key={assignment.id}
                    className="flex items-center justify-between gap-3 rounded-[--radius-md] border border-border p-3"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {assignment.title}
                      </span>
                      <span className="block text-xs text-fg-muted">{assignment.class.name}</span>
                    </span>
                    {/* Gentle, never alarming — "soon", not "OVERDUE" in red. */}
                    <Badge tone={dueSoon ? "warn" : "neutral"} size="sm">
                      {assignment.dueAt ? relativeTime(assignment.dueAt, undefined, locale) : "No date"}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          title={t("student.recentMarks")}
          description={grades.length === 0 ? "Nothing marked yet" : "Newest first"}
        />
        <CardBody>
          {grades.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              When a teacher marks your work, it will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {grades.map((grade) => {
                const max = grade.assignment.pointsMilli;
                const percent =
                  grade.scoreMilli !== null && max
                    ? Math.round((grade.scoreMilli * 100) / max)
                    : null;
                return (
                  <li key={grade.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {grade.assignment.title}
                      </span>
                      {grade.comment && (
                        <span className="block truncate text-xs italic text-fg-muted">
                          &ldquo;{grade.comment}&rdquo;
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block font-bold tabular-nums text-fg">
                        {formatMilli(grade.scoreMilli)}
                        {max ? <span className="text-fg-muted">/{formatMilli(max)}</span> : null}
                      </span>
                      {percent !== null && (
                        <Badge tone={percent >= 70 ? "ok" : "neutral"} size="sm">
                          {percent}%
                        </Badge>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title={t("student.yourAttendance")}
          description={t("student.lastTwoWeeks")}
        />
        <CardBody>
          {attendance.recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">{t("student.attendanceEmpty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {attendance.recent.slice(0, 10).map((day) => (
                <li key={day.dateKey} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm font-medium text-fg">
                    {formatDateKey(day.dateKey, { weekday: "long", day: "numeric", month: "short" }, locale)}
                  </span>
                  <AttendanceBadge status={day.status} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-8" fill="none" aria-hidden="true">
      <path
        d="m5 12.5 4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
