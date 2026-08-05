import type { Metadata } from "next";
import Link from "next/link";
import {
  CaretRightIcon,
  ChecksIcon,
  ClipboardTextIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react/ssr";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { formatDateKey, relativeTime, todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = { title: "Today" };

export default async function TeacherHome() {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true, name: true },
  });
  const dateKey = todayKey(school.timezone);

  const classIds = await teacherClassIds(ctx.schoolId, ctx.membershipId);

  if (classIds.length === 0) {
    return (
      <EmptyState
        icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
        title={t("teacher.noClassesYet")}
        description={t("teacher.noClassesBody")}
      />
    );
  }

  const [classes, sessionsToday, dueSoon, ungraded] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds } },
      select: { id: true, name: true, color: true, _count: { select: { enrollments: true } } },
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("teacher.today")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {formatDateKey(dateKey, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
          {school.name}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label={t("teacher.registersLeft")}
          value={outstanding.length}
          tone={outstanding.length === 0 ? "ok" : "warn"}
          icon={<ChecksIcon weight="duotone" className="size-5" />}
          hint={outstanding.length === 0 ? "All done — nice." : "Tap below to take one"}
        />
        <StatTile
          label={t("teacher.classes")}
          value={classes.length}
          icon={<ClipboardTextIcon weight="duotone" className="size-5" />}
          hint={t("teacher.studentsCount", { count: classes.reduce((sum, c) => sum + c._count.enrollments, 0) })}
        />
        <StatTile
          label={t("teacher.toGrade")}
          value={ungraded}
          tone={ungraded > 0 ? "warn" : "neutral"}
          icon={<WarningCircleIcon weight="duotone" className="size-5" />}
          hint={ungraded === 0 ? "Nothing waiting" : "Submissions handed in"}
        />
      </div>

      <Card>
        <CardHeader
          icon={<ChecksIcon weight="duotone" className="size-5" />}
          title={t("teacher.registers")}
          description={
            outstanding.length === 0
              ? "Every register is taken for today."
              : `${outstanding.length} still to take.`
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
                        {t("teacher.studentsCount", { count: klass._count.enrollments })}
                      </span>
                    </span>
                    <span
                      className={
                        taken
                          ? "shrink-0 rounded-full bg-ok-soft px-2.5 py-1 text-xs font-semibold text-ok"
                          : "shrink-0 rounded-full bg-warn-soft px-2.5 py-1 text-xs font-semibold text-warn"
                      }
                    >
                      {taken ? "Done" : "Take it"}
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
    </div>
  );
}
