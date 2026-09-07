import type { Metadata } from "next";
import { InstallCard } from "@/components/install-card";
import Link from "next/link";
import {
  CalendarCheckIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  FireIcon,
  ClockIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { examMarksFor } from "@/lib/exams";
import { studentWeek } from "@/lib/timetable";
import { formatTimeRange } from "@/lib/school-day";
import { ownWorkScope } from "@/lib/grading";
import { ExamMarksCards } from "@/components/exams/exam-marks";
import { CelebrationsLink } from "@/components/celebrations/celebrations-link";
import { db } from "@/lib/db";
import { getAttendanceSummary, computeStreak } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, isWithin, relativeTime, todayKey, weekdayOfKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StudentWelcome } from "./welcome";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.today") };
}

export default async function StudentHome({
  searchParams,
}: {
  searchParams: Promise<{ welcome?: string; handle?: string }>;
}) {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const locale = await getLocale();
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

  const [attendance, todayRecord, upcoming, examMarks, week] = await Promise.all([
    getAttendanceSummary(ctx.schoolId, ctx.membershipId, addDaysToKey(today, -28), today),
    db.attendanceRecord.findFirst({
      where: { studentMembershipId: ctx.membershipId, session: { dateKey: today } },
      select: { status: true },
    }),
    // The same rule as the Assignments page's "To do": published homework the
    // pupil has not handed in — exam sittings excluded, undated ones included
    // last. Two lists that disagreed about what was due was the confusion
    // this page used to cause.
    db.assignment.findMany({
      where: {
        schoolId: ctx.schoolId,
        publishedAt: { not: null },
        examSlotId: null,
        submissions: { none: { studentMembershipId: ctx.membershipId, submittedAt: { not: null } } },
        grades: { none: { studentMembershipId: ctx.membershipId } },
        ...(await ownWorkScope(ctx.schoolId, ctx.membershipId)),
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
      take: 5,
    }),
    examMarksFor(ctx),
    studentWeek(ctx, ctx.membershipId, { weekOf: today, todayKey: today }),
  ]);

  const streak = computeStreak(attendance.recent);

  /**
   * THE DAY'S LESSONS, FIRST-CLASS ON THE DASHBOARD. The pupil's Today page
   * showed attendance, homework due and exam marks — and not one word about
   * which lessons the day actually holds, while /timetable rendered the
   * whole week happily. The same gap the teacher's page had the day before,
   * reported by the same person testing; the same shape of fix.
   */
  const weekday = weekdayOfKey(today);
  const dayColumn = week.days.find((day) => day.weekday === weekday);
  const closedToday = dayColumn?.closed ?? false;
  const periodOrder = new Map(week.periods.map((period) => [period.id, period]));
  const lessonsToday = closedToday
    ? []
    : week.slots
        .filter((slot) => slot.weekday === weekday)
        .sort(
          (a, b) =>
            (periodOrder.get(a.periodId)?.position ?? 0) -
            (periodOrder.get(b.periodId)?.position ?? 0),
        );

  return (
    <div className="space-y-6">
      {welcome === "1" && <StudentWelcome name={name} handle={handle ?? null} />}

      <div className="flex items-center gap-4">
        <Avatar avatarKey={membership.user.avatarKey} name={membership.user.name} size="lg" ring />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {t("student.hiName", { name })}
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
              : t("student.notYet")
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
          hint={todayRecord ? t("student.registerTaken") : t("student.registerNotTakenYet")}
        />
        <StatTile
          label={t("student.streak")}
          value={streak}
          tone={streak >= 5 ? "ok" : "neutral"}
          icon={<FireIcon weight="duotone" className="size-5" />}
          hint={
            streak === 0
              ? t("student.streakStartHint")
              : streak >= 5
                ? t("student.onARoll")
                : streak === 1
                  ? t("student.streakDaysOne")
                  : t("student.streakDaysMany", { count: streak })
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
          icon={<ClockIcon weight="duotone" className="size-5" />}
          title={t("student.todayLessons")}
          description={
            closedToday
              ? t("teacher.closedToday", { name: dayColumn?.closedName ?? "" })
              : t("student.todayLessonsBody")
          }
          action={
            <Link href="/timetable" className="text-sm font-medium text-accent hover:underline">
              {t("teacher.openTimetable")}
            </Link>
          }
        />
        <CardBody>
          {lessonsToday.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              {closedToday
                ? t("teacher.closedToday", { name: dayColumn?.closedName ?? "" })
                : t("teacher.noLessonsToday")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lessonsToday.map((slot) => {
                const period = periodOrder.get(slot.periodId);
                return (
                  <li key={slot.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-28 shrink-0">
                      <span className="block text-sm font-medium text-fg">{period?.name}</span>
                      <span className="block text-xs tabular-nums text-fg-muted">
                        {period ? formatTimeRange(period.startMinute, period.endMinute) : null}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {slot.subject}
                      </span>
                      <span className="block truncate text-xs text-fg-muted">
                        {slot.teacherName && <PersonLink membershipId={slot.teacherMembershipId} name={slot.teacherName} />}
                        {slot.teacherName && slot.room ? " · " : ""}
                        {slot.room}
                      </span>
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
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title={t("student.whatIsDue")}
          description={
            upcoming.length === 0
              ? t("student.nothingDueShort")
              : upcoming.length === 1
                ? t("student.toDoCountOne")
                : t("student.toDoCountMany", { count: upcoming.length })
          }
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
                const dueSoon = assignment.dueAt && isWithin(assignment.dueAt, 2 * 86_400_000);
                return (
                  <li key={assignment.id}>
                    <Link
                      href="/student/assignments"
                      className="flex items-center justify-between gap-3 rounded-[--radius-md] border border-border p-3 hover:bg-surface-muted/60"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-fg">
                          {assignment.title}
                        </span>
                        <span className="block text-xs text-fg-muted">{assignment.class.name}</span>
                      </span>
                      {/* Gentle, never alarming — "soon", not "OVERDUE" in red. */}
                      <Badge tone={dueSoon ? "warn" : "neutral"} size="sm">
                        {assignment.dueAt ? relativeTime(assignment.dueAt) : t("student.noDate")}
                      </Badge>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Marks live on Assignments → Marked and attendance detail on the tile
          above; the home page keeps only what needs the pupil NOW — what is
          due, and the latest exam marks. */}
      {/* The latest exam's marks, the moment a teacher saves them — the same
          card the Exams page shows in full. */}
      {examMarks.map((m) => (
        <ExamMarksCards key={m.studentMembershipId} marks={m} compact />
      ))}

      <CelebrationsLink session={ctx} />
      <InstallCard />
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
