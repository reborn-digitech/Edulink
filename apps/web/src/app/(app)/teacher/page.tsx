import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarBlankIcon,
  CaretRightIcon,
  ChecksIcon,
  ClipboardTextIcon,
  UserSwitchIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { formatDateKey, relativeTime, todayKey, weekdayOfKey } from "@/lib/dates";
import { marksTodoFor } from "@/lib/exams";
import { EXAM_KIND_KEY } from "@/lib/constants";
import { teacherWeek } from "@/lib/timetable";
import { formatTimeRange } from "@/lib/school-day";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT, getLocale } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.today") };
}

export default async function TeacherHome() {
  const t = await getT();
  const locale = await getLocale();
  const ctx = await requireRole("TEACHER", "ADMIN");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true, name: true },
  });
  const dateKey = todayKey(school.timezone);

  /* Papers sat and not yet marked — the Exams grid brought to the page a
     teacher already opens every morning, in BOTH shapes of this page: the
     form teacher's and the subject teacher's. Absent when there is nothing
     to do, because an empty "to do" is noise. */
  const marksTodo = await marksTodoFor(ctx, dateKey);
  const marksCard = marksTodo.length > 0 && (
        <Card>
          <CardHeader
            title={t("exams.marksTodoTitle")}
            description={t("exams.marksTodoBody")}
            action={
              <Link href="/teacher/exams" className="text-sm font-medium text-accent hover:underline">
                {t("exams.openGrid")}
              </Link>
            }
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-border">
              {marksTodo.slice(0, 8).map((row) => (
                <li key={`${row.classId}:${row.slotId}`}>
                  <Link
                    href={`/teacher/exams?classId=${row.classId}&slotId=${row.slotId}`}
                    className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm hover:bg-surface-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-fg">
                        {row.className} · {row.subject}
                      </span>
                      <span className="block truncate text-xs text-fg-muted">
                        {row.seriesName} · {t(EXAM_KIND_KEY[row.kind])} · {formatDateKey(row.dateKey)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold tabular-nums text-warn">
                      {t("teacher.markedOf", { marked: row.marked, total: row.classSize })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
  );


  const classIds = await teacherClassIds(ctx.schoolId, ctx.membershipId);

  /**
   * EVERY TEACHER'S DAY STARTS WITH THE TIMETABLE. This block used to live
   * only inside the no-form-class branch below — the fix that gave a subject
   * teacher their lessons quietly left every CLASS teacher without them: a
   * form teacher's Today page showed registers and grading and not one word
   * about what they were teaching, which a person testing as one reported
   * within a day. Computed once, rendered on both shapes of the page.
   */
  const week = await teacherWeek(ctx, ctx.membershipId, { weekOf: dateKey, todayKey: dateKey });
  const weekday = weekdayOfKey(dateKey);
  const today = week.days.find((day) => day.weekday === weekday);
  const closed = today?.closed ?? false;
  const periodOrder = new Map(week.periods.map((period) => [period.id, period]));
  const lessons = closed
    ? []
    : week.slots
        .filter((slot) => slot.weekday === weekday)
        .sort(
          (a, b) =>
            (periodOrder.get(a.periodId)?.position ?? 0) -
            (periodOrder.get(b.periodId)?.position ?? 0),
        );
  const coveringToday = lessons.filter((slot) => slot.borrowed).length;
  const classesTaught = new Set(week.slots.map((slot) => slot.classId)).size;
  const first = lessons[0] && periodOrder.get(lessons[0].periodId);
  const last = lessons[lessons.length - 1] && periodOrder.get(lessons[lessons.length - 1]!.periodId);

  const lessonsCard = (
    <Card>
      <CardHeader
        icon={<CalendarBlankIcon weight="duotone" className="size-5" />}
        title={t("teacher.yourLessons")}
        description={
          closed
            ? t("teacher.closedToday", { name: today?.closedName ?? "" })
            : t("teacher.lessonsInPeriodOrder")
        }
        action={
          <Button asChild size="sm" variant="ghost">
            <Link href="/timetable">{t("teacher.openTimetable")}</Link>
          </Button>
        }
      />
      <CardBody>
        {lessons.length === 0 ? (
          <p className="py-4 text-center text-sm text-fg-muted">
            {closed
              ? t("teacher.closedToday", { name: today?.closedName ?? "" })
              : t("teacher.noLessonsToday")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {lessons.map((slot) => {
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
                      {slot.className}
                      {slot.room ? ` · ${slot.room}` : ""}
                    </span>
                  </span>
                  {slot.borrowed ? (
                    <span className="shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn">
                      {t("teacher.covering")}
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );

  /**
   * NO FORM CLASS IS NOT NO DAY. A subject teacher holds no class of their own
   * — no register, no roll — and everything below this branch is built on the
   * form-class list. The empty state survives only for a teacher with no form
   * class AND no timetabled lesson, where it is finally true.
   */
  if (classIds.length === 0) {
    if (week.slots.length === 0) {
      return (
        <EmptyState
          icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
          title={t("teacher.noClassesYet")}
          description={t("teacher.noClassesBody")}
        />
      );
    }

    return (
      <div className="space-y-6">
        <PageHeader title={t("teacher.today")} description={<>{formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)} ·{" "}
            {school.name}</>} />

        {marksCard}

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label={t("teacher.lessonsToday")}
            value={lessons.length}
            icon={<CalendarBlankIcon weight="duotone" className="size-5" />}
            hint={
              first && last ? formatTimeRange(first.startMinute, last.endMinute) : undefined
            }
          />
          <StatTile
            label={t("teacher.classes")}
            value={classesTaught}
            icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
            hint={t("teacher.acrossTheWeek")}
          />
          <StatTile
            label={t("teacher.covering")}
            value={coveringToday}
            tone={coveringToday > 0 ? "warn" : "neutral"}
            icon={<UserSwitchIcon weight="duotone" className="size-5" />}
            hint={coveringToday > 0 ? t("teacher.coverTakenOn") : t("teacher.nothingWaiting")}
          />
        </div>

        {lessonsCard}
      </div>
    );
  }

  const [classes, sessionsToday, dueSoon, ungraded] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, color: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
      orderBy: { name: "asc" },
    }),
    db.attendanceSession.findMany({
      where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds } },
      select: { classId: true },
    }),
    db.assignment.findMany({
      where: {
        schoolId: ctx.schoolId,
        classId: { in: classIds },
        publishedAt: { not: null },
        dueAt: { gte: new Date() },
      },
      select: { id: true, title: true, dueAt: true, class: { select: { name: true } } },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
    db.submission.count({
      where: {
        schoolId: ctx.schoolId,
        status: "SUBMITTED",
        assignment: { classId: { in: classIds } },
      },
    }),
  ]);

  const done = new Set(sessionsToday.map((s) => s.classId));
  const outstanding = classes.filter((c) => !done.has(c.id));

  return (
    <div className="space-y-6">
      <PageHeader title={t("teacher.today")} description={<>{formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" }, locale)} ·{" "}
          {school.name}</>} />

      {marksCard}

      {lessonsCard}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t("teacher.registersLeft")}
          value={outstanding.length}
          tone={outstanding.length === 0 ? "ok" : "warn"}
          icon={<ChecksIcon weight="duotone" className="size-5" />}
          hint={outstanding.length === 0 ? t("teacher.allDoneNice") : t("teacher.tapBelowTakeOne")}
        />
        <StatTile
          label={t("teacher.classes")}
          value={classes.length}
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          hint={(() => { const n = classes.reduce((sum, c) => sum + c._count.enrollments, 0); return n === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: n }); })()}
        />
        {/* A number with nowhere to go is a caption. The marking tile opens
            the assignments list already narrowed to what needs marking. */}
        <Link href="/teacher/assignments?state=tomark" className="block rounded-[--radius-lg] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent">
          <StatTile
            label={t("teacher.toGrade")}
            value={ungraded}
            tone={ungraded > 0 ? "warn" : "neutral"}
            icon={<WarningCircleIcon weight="duotone" className="size-5" />}
            hint={ungraded === 0 ? t("teacher.nothingWaiting") : t("teacher.submissionsHandedIn")}
          />
        </Link>
      </div>

      <Card>
        <CardHeader
          icon={<ChecksIcon weight="duotone" className="size-5" />}
          title={t("teacher.registers")}
          description={
            outstanding.length === 0
              ? t("teacher.everyRegisterTaken")
              : outstanding.length === 1
                ? t("teacher.stillToTakeOne")
                : t("teacher.stillToTakeMany", { count: outstanding.length })
          }
        />
        <CardBody>
          <ul className="space-y-1.5">
            {classes.map((klass) => {
              const taken = done.has(klass.id);
              return (
                <li key={klass.id}>
                  <Link
                    href={`/teacher/attendance?classId=${klass.id}`}
                    className="flex items-center gap-3 rounded-[--radius-md] border border-border p-3 transition-colors hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="h-8 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: klass.color ?? "var(--accent)" }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-fg">
                        {klass.name}
                      </span>
                      <span className="block text-xs text-fg-muted">
                        {klass._count.enrollments === 1 ? t("teacher.studentsCountOne") : t("teacher.studentsCount", { count: klass._count.enrollments })}
                      </span>
                    </span>
                    <span
                      className={
                        taken
                          ? "shrink-0 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok"
                          : "shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn"
                      }
                    >
                      {taken ? t("teacher.done") : t("teacher.takeIt")}
                    </span>
                    <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          title={t("teacher.comingUp")}
          description={t("teacher.workDueIn")}
          action={
            <Button asChild size="sm" variant="ghost">
              <Link href="/teacher/assignments">{t("teacher.seeAll")}</Link>
            </Button>
          }
        />
        <CardBody>
          {dueSoon.length === 0 ? (
            <p className="py-4 text-center text-sm text-fg-muted">
              {t("teacher.nothingDue")}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {dueSoon.map((assignment) => (
                <li key={assignment.id}>
                  <Link href={`/teacher/assignments/${assignment.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-surface-muted/60">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-fg">
                        {assignment.title}
                      </span>
                      <span className="block text-xs text-fg-muted">{assignment.class.name}</span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-fg-muted">
                      {assignment.dueAt ? relativeTime(assignment.dueAt) : t("teacher.noDueDate")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
