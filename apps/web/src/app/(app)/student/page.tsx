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
import { pupilRecordFor } from "@/lib/pupil-records";
import { CompleteRecordCard } from "@/components/certificates/complete-record-card";
import { db } from "@/lib/db";
import { getAttendanceSummary, currentStreakFor, todayAttendanceFor } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, isWithin, relativeTime, todayKey, weekdayOfKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StudentWelcome } from "./welcome";
import { welcomeFor } from "@/lib/student-welcome";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";
import { periodLabel } from "@/lib/coded-defaults";
import { PersonLink } from "@/components/person-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.today") };
}

export default async function StudentHome() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const locale = await getLocale();
  const welcome = await welcomeFor(ctx);

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

  const [attendance, streak, todayMark, upcoming, examMarks, week, recordMissing] = await Promise.all([
    getAttendanceSummary(ctx.schoolId, ctx.membershipId, addDaysToKey(today, -28), today),
    currentStreakFor(ctx.schoolId, ctx.membershipId, today),
    // The mark, and whether there is school today at all: on a Sunday or a
    // holiday the tile says so instead of "your teacher hasn't taken it yet".
    todayAttendanceFor(ctx.schoolId, ctx.membershipId, today),
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
    // What the pupil record still lacks for a certificate; the card below asks for it.
    pupilRecordFor(ctx, ctx.membershipId).then((r) => r.missing as string[]).catch(() => [] as string[]),
  ]);


  /**
   * THE DAY'S LESSONS, FIRST-CLASS ON THE DASHBOARD. The pupil's Today page
   * showed attendance, homework due and exam marks — and not one word about
   * which lessons the day actually holds, while /timetable rendered the
   * whole week happily. The same gap the teacher's page had the day before,
   * reported by the same person testing; the same shape of fix.
   */
  const todayRecord = todayMark.record;
  const weekday = weekdayOfKey(today);
  const dayColumn = week.days.find((day) => day.weekday === weekday);
  const closedToday = (dayColumn?.closed ?? false) || !todayMark.open;
  const holidayName = todayMark.holidayName ?? dayColumn?.closedName ?? null;
  const noSchoolSentence = holidayName
    ? t("common.noSchoolTodayHoliday", { name: holidayName })
    : t("common.noSchoolToday");
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
      {welcome && <StudentWelcome name={name} handle={welcome.handle} />}

      <CompleteRecordCard missing={recordMissing} href="/student/record" />

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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("student.today")}
          value={
            todayRecord
              ? t(ATTENDANCE_META[todayRecord.status as AttendanceStatus].labelKey)
              : closedToday
                ? t("student.noSchool")
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
          hint={todayRecord ? t("student.registerTaken") : closedToday ? noSchoolSentence : t("student.registerNotTakenYet")}
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
              ? noSchoolSentence
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
                ? noSchoolSentence
                : t("teacher.noLessonsToday")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lessonsToday.map((slot) => {
                const period = periodOrder.get(slot.periodId);
                return (
                  <li key={slot.id} className="flex items-center gap-3 py-2.5">
                    <span className="w-28 shrink-0">
                      <span className="block text-sm font-medium text-fg">{period ? periodLabel(period.name, t) : null}</span>
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
          action={
            // The fortnight ahead — exams, work, sessions, closures and (when the school allows) fee dates — on one dated list; "My fees" sits beside it.
            <span className="flex flex-wrap items-center gap-3">
              <Link href="/student/agenda" className="text-sm font-medium text-accent hover:underline" data-testid="student-agenda-link">
                {t("agenda.link")}
              </Link>
              <Link href="/student/fees" className="text-sm font-medium text-accent hover:underline" data-testid="student-fees-link">
                {t("fees.myFeesTitle")}
              </Link>
            </span>
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
                // isWithin(d, 0): the date is already behind the clock.
                const pastDue = Boolean(assignment.dueAt && isWithin(assignment.dueAt, 0));
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
                      {/* Gentle, never alarming — "soon", not "OVERDUE" in red; but a date that has passed says so, not "2 months ago" under "What is due". */}
                      <Badge tone={dueSoon || pastDue ? "warn" : "neutral"} size="sm">
                        {assignment.dueAt ? (pastDue ? `${t("student.pastDue")} · ${relativeTime(assignment.dueAt)}` : relativeTime(assignment.dueAt)) : t("student.noDate")}
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
