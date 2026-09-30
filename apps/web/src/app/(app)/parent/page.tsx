import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  CalendarCheckIcon,
  ChartLineUpIcon,
  ChatCircleDotsIcon,
  ClipboardTextIcon,
  FireIcon,
  PlusIcon,
  TrophyIcon,
  ClockIcon,
  IdentificationCardIcon,
} from "@phosphor-icons/react/ssr";
import { requireParent, assertGuardianAccess } from "@/lib/tenancy";
import { examMarksFor } from "@/lib/exams";
import { childWeek } from "@/lib/timetable";
import { formatTimeRange } from "@/lib/school-day";
import { ExamMarksCards } from "@/components/exams/exam-marks";
import { listContexts } from "@/lib/session";
import { db } from "@/lib/db";
import { getAttendanceSummary, currentStreakFor } from "@/lib/attendance";
import { addDaysToKey, formatDateKey, isWithin, relativeTime, todayKey, weekdayOfKey } from "@/lib/dates";
import { overallForStudent } from "@/lib/grading";
import { pendingConsents } from "@/lib/competitions";
import { pupilRecordFor } from "@/lib/pupil-records";
import { familyPenChanges } from "@/lib/pen-changes";
import { CompleteRecordCard } from "@/components/certificates/complete-record-card";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { AttendanceBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { ChildSwitcher } from "./child-switcher";
import { ChildLeftPanel } from "./child-left";
import { WelcomeTour } from "./welcome-tour";
import { InstallCard } from "@/components/install-card";
import { cookies } from "next/headers";
import { PARENT_WELCOME_COOKIE } from "@/lib/parent-welcome";
import { ConsentControls } from "../competitions/entry-controls";
import { ATTENDANCE_META, type AttendanceStatus } from "@/lib/constants";
import { ownWorkScope } from "@/lib/grading";
import { getT, getLocale } from "@/lib/i18n/server";
import { PersonLink } from "@/components/person-link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.yourChildren") };
}

export default async function ParentDashboard({
  searchParams,
}: {
  searchParams: Promise<{ child?: string }>;
}) {
  const session = await requireParent();
  const t = await getT();
  const locale = await getLocale();
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

  /**
   * A CHILD WHO HAS LEFT DOES NOT GET AN ORDINARY DASHBOARD. The day-to-day
   * cards — today's status, the streak, what is due — would all be
   * rendering a world that has ended, which is worse than saying so. The
   * switcher stays, so a family with one child still here loses nothing.
   */
  if (student.leftAt) {
    return (
      <div className="space-y-6">
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} />}
        <ChildLeftPanel
          child={{
            studentMembershipId: selectedId,
            studentUserId: student.user.id,
            name: childName,
            schoolName: student.school.name,
            leftAt: student.leftAt,
          }}
        />
      </div>
    );
  }

  const today = todayKey(timezone);
  const fourWeeksAgo = addDaysToKey(today, -28);

  /**
   * THE CHILD'S DAY, ON THE PARENT'S OVERVIEW. Third page of the same
   * family in three days — teacher, pupil, and now guardian: the timetable
   * page rendered the week while the dashboard said nothing about which
   * lessons TODAY holds. Same card, the child's name on it, switching with
   * the child switcher because it is computed off the selected child.
   */
  const week = await childWeek(session, selectedId, { weekOf: today, todayKey: today });
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

  const [attendance, streak, todayRecord, allHomework, upcoming, threads, awaitingConsent, recordMissing] = await Promise.all([
    getAttendanceSummary(student.schoolId, selectedId, fourWeeksAgo, today),
    currentStreakFor(student.schoolId, selectedId, today),
    db.attendanceRecord.findFirst({
      where: { studentMembershipId: selectedId, session: { dateKey: today } },
      select: { status: true, note: true },
    }),
    // Homework only: an exam paper is also stored as a Grade, but its marks
    // belong to the exam card below, and the tile's "pieces" are the ongoing
    // work a parent monitors. Every marked piece, for the average the tile
    // promises — not the five newest.
    db.grade.findMany({
      where: { studentMembershipId: selectedId, schoolId: student.schoolId, assignment: { examSlotId: null } },
      select: { scoreMilli: true, assignment: { select: { pointsMilli: true, category: true, classId: true } } },
    }),
    db.assignment.findMany({
      where: {
        schoolId: student.schoolId,
        publishedAt: { not: null },
        // Same "to do" rule as the Assignments page: not handed in, not
        // marked, exam sittings excluded, undated last.
        examSlotId: null,
        submissions: { none: { studentMembershipId: selectedId, submittedAt: { not: null } } },
        grades: { none: { studentMembershipId: selectedId } },
        ...(await ownWorkScope(student.schoolId, selectedId)),
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: [{ dueAt: { sort: "asc", nulls: "last" } }],
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
    // What the pupil record still lacks for a certificate; the card below asks for it.
    pupilRecordFor(session, selectedId).then((r) => r.missing as string[]).catch(() => [] as string[]),
  ]);

  // A correction to a child's PEN awaiting this guardian's word: every
  // child's, not just the one on screen, because the office is waiting on
  // it; the notice opens that child's record, where the decision is made.
  const penChanges = await familyPenChanges(session).catch((error: unknown) => {
    console.error("[parent pen changes]", error);
    return { items: [], pending: 0 };
  });
  const penChangeWaiting = penChanges.items.find((item) => item.status === "PENDING" && item.can.decide) ?? null;

  // Shared helper — weights by points available, never averages percentages.
  const scored = allHomework.filter((g) => g.scoreMilli !== null && g.assignment.pointsMilli);
  const classIds = [...new Set(allHomework.map((g) => g.assignment.classId))];
  const [weightRows, examMarks] = await Promise.all([
    db.gradeCategory.findMany({
      where: { classId: { in: classIds } },
      select: { classId: true, name: true, weightBps: true },
      orderBy: { position: "asc" },
    }),
    examMarksFor(session),
  ]);
  const weightsByClass = new Map<string, { name: string; weightBps: number }[]>();
  for (const row of weightRows) {
    const list = weightsByClass.get(row.classId) ?? [];
    list.push({ name: row.name, weightBps: row.weightBps });
    weightsByClass.set(row.classId, list);
  }
  const overallResult = overallForStudent(
    allHomework.map((g) => ({
      classId: g.assignment.classId,
      scoreMilli: g.scoreMilli,
      maxMilli: g.assignment.pointsMilli,
      category: g.assignment.category,
    })),
    weightsByClass,
  );
  const averagePercent = overallResult.percent;

  // Decided here, not in the browser, so the first paint does not move.
  const welcomeDismissed = (await cookies()).has(PARENT_WELCOME_COOKIE);

  return (
    <div className="space-y-6">
      {!welcomeDismissed && <WelcomeTour />}

      {children.length > 1 && (
        <ChildSwitcher pupils={children} selectedId={selectedId} />
      )}

      <div className="flex items-center gap-4">
        <Avatar avatarKey={student.user.avatarKey} name={student.user.name} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight text-fg sm:text-3xl">
            <PersonLink membershipId={selectedId} name={childName} />
          </h1>
          <p className="text-sm text-fg-muted">
            {student.school.name}
            {student.gradeLevel ? ` · ${t("parent.gradeLevel", { level: student.gradeLevel })}` : ""}
          </p>
        </div>
      </div>


      <CompleteRecordCard missing={recordMissing} href={`/parent/record?child=${selectedId}`} />

      {penChangeWaiting && (
        <Card className="border-warn/40" data-testid="pen-change-notice">
          <Link href={`/parent/record?child=${penChangeWaiting.studentMembershipId}`} className="flex items-center gap-3 p-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-warn-soft text-warn">
              <IdentificationCardIcon weight="duotone" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-fg">{t("pupilRecord.notifPenProposed", { name: penChangeWaiting.studentName })}</span>
              <span className="block text-xs text-fg-muted">{t("pupilRecord.penChangeProposedBy", { name: penChangeWaiting.requestedByName })}</span>
            </span>
          </Link>
        </Card>
      )}

      {awaitingConsent.length > 0 && (
        <Card className="border-warn/40">
          <CardHeader
            icon={<TrophyIcon weight="duotone" className="size-5" />}
            title={t("parent.consentTitle")}
            description={t("parent.consentBody")}
          />
          <CardBody className="space-y-3 pt-0">
            {awaitingConsent.map((item) => (
              <div key={item.entryId} className="space-y-2">
                <p className="text-[0.9375rem]">
                  {/* One sentence with placeholders, whole thing linked — the
                      same shape /competitions renders. The fragment version
                      ("would like to enter", ", run by") sat here in English
                      on an otherwise-translated dashboard. */}
                  <Link
                    href={`/competitions/${item.competitionId}`}
                    className="underline underline-offset-4"
                  >
                    {t("competitions.wouldLikeToEnter", {
                      child: item.childName,
                      title: item.title,
                      organiser: item.organizerName,
                    })}
                  </Link>
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
                {t("parent.today")} · {formatDateKey(today, { weekday: "long", day: "numeric", month: "long" }, locale)}
              </p>
              {todayRecord ? (
                <p className="mt-0.5 font-semibold text-fg">
                  {childName} was marked{" "}
                  <span style={{ color: `var(--att-${ATTENDANCE_META[todayRecord.status as AttendanceStatus].token})` }}>
                    {t(ATTENDANCE_META[todayRecord.status as AttendanceStatus].labelKey).toLowerCase()}
                  </span>
                </p>
              ) : (
                <p className="mt-0.5 font-semibold text-fg-muted">
                  {t("parent.notTakenYet")}
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label={t("parent.attendance")}
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
          hint={attendance.total === 0 ? t("parent.noRecordsYet") : t("parent.lastFourWeeks")}
        />
        <StatTile
          label={t("parent.averageGrade")}
          value={averagePercent === null ? "—" : `${averagePercent}%`}
          tone={averagePercent === null ? "neutral" : averagePercent >= 70 ? "ok" : "warn"}
          icon={<ChartLineUpIcon weight="duotone" className="size-5" />}
          hint={
            scored.length === 0
              ? t("parent.nothingGradedYet")
              : scored.length === 1
                ? t("parent.acrossPiecesOne")
                : t("parent.acrossPieces", { count: scored.length })
          }
        />
        <StatTile
          label={t("parent.streak")}
          value={streak}
          tone={streak >= 5 ? "ok" : "neutral"}
          icon={<FireIcon weight="duotone" className="size-5" />}
          hint={streak === 0 ? t("parent.streakStart") : streak === 1 ? t("parent.streakDaysOne") : t("parent.streakDays", { count: streak })}
        />
      </div>

      {/* Attendance detail lives on Attendance and marks on Assignments →
          Marked; the overview keeps what needs a parent NOW — today's status,
          what is due, messages, and the latest exam marks. */}

      {/* ---------------- today's lessons ---------------- */}
      <Card>
        <CardHeader
          icon={<ClockIcon weight="duotone" className="size-5" />}
          title={t("parent.todayLessons", { name: childName })}
          description={
            closedToday
              ? t("teacher.closedToday", { name: dayColumn?.closedName ?? "" })
              : t("parent.todayLessonsBody")
          }
          action={
            <Link href="/parent/timetable" className="text-sm font-medium text-accent hover:underline">
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

      {/* ---------------- upcoming ---------------- */}
      <Card>
        <CardHeader
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title={t("parent.comingUp")}
          description={t("parent.workDueSoon")}
        />
        <CardBody>
          {upcoming.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              {t("parent.nothingDue")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((assignment) => (
                <li key={assignment.id}>
                  <Link href={`/parent/assignments?child=${selectedId}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-surface-muted/60">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {assignment.title}
                      </span>
                      <span className="block text-xs text-fg-muted">{assignment.class.name}</span>
                    </span>
                    {/* A date that has passed says so: "2 months ago" under "Work due soon" read as a contradiction. */}
                    <span className={cn("shrink-0 text-xs font-medium", assignment.dueAt && isWithin(assignment.dueAt, 0) ? "text-warn" : "text-fg-muted")}>
                      {assignment.dueAt ? (isWithin(assignment.dueAt, 0) ? `${t("diary.overdue")} · ${relativeTime(assignment.dueAt)}` : relativeTime(assignment.dueAt)) : t("parent.noDueDate")}
                    </span>
                  </Link>
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
          title={t("parent.teacherMessages")}
          description={t("parent.teacherMessagesBody")}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/remarks">{t("parent.open")}</Link>
            </Button>
          }
        />
        <CardBody>
          {threads.length === 0 ? (
            <EmptyState
              className="border-0 bg-transparent py-6"
              title={t("parent.noMessages")}
              description={t("parent.noMessagesBody")}
            />
          ) : (
            <ul className="divide-y divide-border">
              {threads.map((thread) => (
                <li key={thread.id}>
                  <Link href={`/remarks/${thread.id}`} className="flex items-center gap-3 py-2.5 hover:bg-surface-muted/60">
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {examMarks.some((m) => m.series.length > 0) && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-fg-muted">
            {t("exams.myMarksTitle")}
          </h2>
          {examMarks.map((m) => (
            <ExamMarksCards key={m.studentMembershipId} marks={m} compact showStudent={examMarks.length > 1} />
          ))}
        </section>
      )}

      <div className="flex justify-center pb-4">
        <Button asChild variant="secondary" icon={<PlusIcon weight="bold" />}>
          <Link href="/parent/link">{t("parent.linkAnother")}</Link>
        </Button>
      </div>
      <InstallCard />
    </div>
  );
}
