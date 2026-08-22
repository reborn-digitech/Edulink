import type { Metadata } from "next";
import {
  CalendarCheckIcon,
  ChartLineUpIcon,
  ClipboardTextIcon,
  FireIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { examMarksFor } from "@/lib/exams";
import { ExamMarksCards } from "@/components/exams/exam-marks";
import { db } from "@/lib/db";
import { getAttendanceSummary, computeStreak } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, isWithin, relativeTime, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { StudentWelcome } from "./welcome";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { getT } from "@/lib/i18n/server";

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

  const [attendance, todayRecord, upcoming] = await Promise.all([
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
        class: { enrollments: { some: { studentMembershipId: ctx.membershipId, status: "ACTIVE" } } },
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
      take: 5,
    }),
  ]);

  const streak = computeStreak(attendance.recent);

  const examMarks = await examMarksFor(ctx);

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
            {formatDateKey(today, { weekday: "long", day: "numeric", month: "long" })}
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
                      {assignment.dueAt ? relativeTime(assignment.dueAt) : t("student.noDate")}
                    </Badge>
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
