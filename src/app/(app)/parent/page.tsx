import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheckIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  FireIcon,
  PlusIcon,
  TrophyIcon,
} from "@phosphor-icons/react/ssr";
import { requireParent, assertGuardianAccess } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { db } from "@/lib/db";
import { getAttendanceSummary, computeStreak } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, relativeTime, todayKey } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { overallPercent } from "@/lib/grading";
import { pendingConsents } from "@/lib/competitions";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AttendanceBadge, Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ChildSwitcher } from "./child-switcher";
import { ConsentControls } from "../competitions/entry-controls";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";

export const metadata: Metadata = { title: "Your children" };

export default async function ParentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireParent();
  const { child: requestedChild } = await searchParams;

  const { children } = await listContexts(session.user.id);

  // The child id comes from the query string, so it is re-checked against the
  // caller's own guardianships rather than trusted. (§6 IDOR)
  const selectedId =
    requestedChild && children.some((c) => c.studentMembershipId === requestedChild)
      ? requestedChild
      : children[0]!.studentMembershipId;

  const link = await assertGuardianAccess(session.user.id, selectedId);
  const student = link.student;
  const childName = student.user.preferredName ?? student.user.name;
  const timezone = student.school.timezone;

  const today = todayKey(timezone);
  const fourWeeksAgo = addDaysToKey(today, -28);

  const [attendance, todayRecord, grades, upcoming, threads, awaitingConsent] = await Promise.all([
    getAttendanceSummary(student.schoolId, selectedId, fourWeeksAgo, today),
    db.attendanceRecord.findFirst({
      where: { studentMembershipId: selectedId, session: { dateKey: today } },
      select: { status: true, note: true },
    }),
    db.grade.findMany({
      where: { studentMembershipId: selectedId, schoolId: student.schoolId },
      include: { assignment: { select: { title: true, pointsMilli: true, category: true } } },
      orderBy: { gradedAt: "desc" },
      take: 5,
    }),
    db.assignment.findMany({
      where: {
        schoolId: student.schoolId,
        publishedAt: { not: null },
        dueAt: { gte: new Date() },
        class: { enrollments: { some: { studentMembershipId: selectedId, status: "ACTIVE" } } },
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
    db.remarkThread.findMany({
      where: { studentMembershipId: selectedId },
      include: {
        teacher: { include: { user: { select: { name: true, avatarKey: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 3,
    }),
    // Every child's, not just the one on screen: a consent request has a
    // deadline, and hiding it behind the child switcher is how it gets missed.
    pendingConsents(session),
  ]);

  const streak = computeStreak(attendance.recent);

  // Shared helper — weights by points available, never averages percentages.
  const scored = grades.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
  const averagePercent = overallPercent(
    grades.map((g) => ({ scoreMilli: g.scoreMilli, maxMilli: g.assignment.pointsMilli })),
  );

  return (
    <div className="space-y-6">
      {children.length > 1 && (
        <ChildSwitcher children={children} selectedId={selectedId} />
      )}

      <div className="flex items-center gap-4">
        <Avatar avatarKey={student.user.avatarKey} name={student.user.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            {childName}
          </h1>
          <p className="text-sm text-fg-muted">
            {student.school.name}
            {student.gradeLevel ? ` · Grade ${student.gradeLevel}` : ""}
          </p>
        </div>
      </div>


      {awaitingConsent.length > 0 && (
        <Card className="border-warn/40">
          <CardHeader
            icon={<TrophyIcon weight="duotone" className="size-5" />}
            title="Waiting for you"
            description="They cannot take part until you say yes."
          />
          <CardBody className="space-y-3 pt-0">
            {awaitingConsent.map((item) => (
              <div key={item.entryId} className="space-y-2">
                <p className="text-[0.9375rem]">
                  <strong>{item.childName}</strong> would like to enter{" "}
                  <Link
                    href={`/competitions/${item.competitionId}`}
                    className="underline underline-offset-4"
                  >
                    {item.title}
                  </Link>
                  , run by {item.organizerName}.
                </p>
                <ConsentControls
                  entryId={item.entryId}
                  childName={item.childName}
                  title={item.title}
                />
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* ---------------- today ---------------- */}
      <Card className={todayRecord && todayRecord.status !== "PRESENT" ? "border-warn/40" : undefined}>
        <CardBody className="flex flex-wrap items-center justify-between gap-3 pt-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong">
              <CalendarCheckIcon weight="duotone" className="size-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">
                Today · {formatDateKey(today, { weekday: "long", day: "numeric", month: "long" })}
              </p>
              {todayRecord ? (
                <p className="mt-0.5 font-semibold text-fg">
                  {childName} was marked{" "}
                  <span style={{ color: `var(--att-${ATTENDANCE_META[todayRecord.status as AttendanceStatus].token})` }}>
                    {ATTENDANCE_META[todayRecord.status as AttendanceStatus].label.toLowerCase()}
                  </span>
                </p>
              ) : (
                <p className="mt-0.5 font-semibold text-fg-muted">
                  The register has not been taken yet
                </p>
              )}
              {todayRecord?.note && (
                <p className="mt-0.5 text-sm text-fg-muted">&ldquo;{todayRecord.note}&rdquo;</p>
              )}
            </div>
          </div>
          {todayRecord && <AttendanceBadge status={todayRecord.status as AttendanceStatus} />}
        </CardBody>
      </Card>

      {/* ---------------- at a glance ---------------- */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Attendance"
          value={attendance.percent === null ? "—" : `${attendance.percent}%`}
          tone={
            attendance.percent === null
              ? "neutral"
              : attendance.percent >= 95
                ? "ok"
                : attendance.percent >= 90
                  ? "warn"
                  : "danger"
          }
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          hint={attendance.total === 0 ? "No records yet" : "Last 4 weeks"}
        />
        <StatTile
          label="Average grade"
          value={averagePercent === null ? "—" : `${averagePercent}%`}
          tone={averagePercent === null ? "neutral" : averagePercent >= 70 ? "ok" : "warn"}
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          hint={scored.length === 0 ? "Nothing graded yet" : `Across ${scored.length} pieces`}
        />
        <StatTile
          label="Attendance streak"
          value={streak}
          tone={streak >= 5 ? "ok" : "neutral"}
          icon={<FireIcon weight="duotone" className="size-5" />}
          hint={streak === 0 ? "Starts on the next day in" : `${streak} school day${streak === 1 ? "" : "s"} in a row`}
        />
      </div>

      {/* ---------------- attendance detail ---------------- */}
      <Card>
        <CardHeader
          icon={<CalendarCheckIcon weight="duotone" className="size-5" />}
          title="Recent attendance"
          description={
            attendance.total === 0
              ? "Nothing recorded yet"
              : `${attendance.counts.PRESENT} present · ${attendance.counts.LATE} late · ${attendance.counts.ABSENT} absent · ${attendance.counts.EXCUSED} excused`
          }
        />
        <CardBody>
          {attendance.recent.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              Once the register is taken, it will show up here the moment it happens.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {attendance.recent.slice(0, 10).map((day) => (
                <li key={day.dateKey} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-fg">
                      {formatDateKey(day.dateKey, { weekday: "long", day: "numeric", month: "short" })}
                    </span>
                    {day.note && (
                      <span className="block truncate text-xs text-fg-muted">{day.note}</span>
                    )}
                  </span>
                  <AttendanceBadge status={day.status} />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---------------- grades ---------------- */}
      <Card>
        <CardHeader
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          title="Recent grades"
          description={grades.length === 0 ? "Nothing graded yet" : "Newest first"}
        />
        <CardBody>
          {grades.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              Grades appear here as soon as a teacher returns work.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {grades.map((grade) => {
                const max = grade.assignment.pointsMilli;
                const percent =
                  grade.scoreMilli !== null && max ? Math.round((grade.scoreMilli * 100) / max) : null;
                return (
                  <li key={grade.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {grade.assignment.title}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {grade.assignment.category ?? "Work"} · {relativeTime(grade.gradedAt)}
                      </span>
                      {grade.comment && (
                        <span className="mt-0.5 block truncate text-xs italic text-fg-muted">
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
                        <Badge tone={percent >= 70 ? "ok" : percent >= 50 ? "warn" : "danger"} size="sm">
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

      {/* ---------------- upcoming ---------------- */}
      <Card>
        <CardHeader
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title="Coming up"
          description="Work due soon"
        />
        <CardBody>
          {upcoming.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              Nothing due right now.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((assignment) => (
                <li key={assignment.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-fg">
                      {assignment.title}
                    </span>
                    <span className="block text-xs text-fg-muted">{assignment.class.name}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-fg-muted">
                    {assignment.dueAt ? relativeTime(assignment.dueAt) : "No due date"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* ---------------- teacher messages ---------------- */}
      <Card>
        <CardHeader
          icon={<ChatCircleDotsIcon weight="duotone" className="size-5" />}
          title="Teacher messages"
          description="Private conversations about your child"
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/remarks">Open</Link>
            </Button>
          }
        />
        <CardBody>
          {threads.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title="No messages yet"
              description="If a teacher wants a quiet word, it will arrive here — and you can reply."
            />
          ) : (
            <ul className="divide-y divide-border">
              {threads.map((thread) => (
                <li key={thread.id} className="flex items-center gap-3 py-2.5">
                  <Avatar
                    avatarKey={thread.teacher.user.avatarKey}
                    name={thread.teacher.user.name}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-fg">
                      {thread.subject}
                    </span>
                    <span className="block truncate text-xs text-fg-muted">
                      {thread.teacher.user.name} · {relativeTime(thread.lastMessageAt)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-center pb-4">
        <Button asChild variant="secondary" icon={<PlusIcon weight="bold" />}>
          <Link href="/parent/link">Link another child</Link>
        </Button>
      </div>
    </div>
  );
}
