import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon, ChalkboardTeacherIcon } from "@phosphor-icons/react/ssr";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myClasses") };
}

export default async function TeacherClassesPage() {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");

  const classIds =
    ctx.role === "ADMIN"
      ? (
          await db.class.findMany({
            where: { schoolId: ctx.schoolId, archivedAt: null },
            select: { id: true },
          })
        ).map((c) => c.id)
      : await teacherClassIds(ctx.schoolId, ctx.membershipId);

  if (classIds.length === 0) {
    return (
      <EmptyState
        icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
        title={t("teacher.noClassesAssigned")}
        description={t("teacher.noClassesAssignedBody")}
      />
    );
  }

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });
  const dateKey = todayKey(school.timezone);

  const [classes, takenToday] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        name: true,
        subject: true,
        room: true,
        color: true,
        _count: { select: { enrollments: true, assignments: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.attendanceSession.findMany({
      where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds } },
      select: { classId: true },
    }),
  ]);

  const done = new Set(takenToday.map((s) => s.classId));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("teacher.myClasses")}</h1>
        <p className="mt-1 text-sm text-fg-muted">
          {classes.length} class{classes.length === 1 ? "" : "es"} ·{" "}
          {classes.reduce((sum, c) => sum + c._count.enrollments, 0)} students
        </p>
      </div>

      <ul className="space-y-2">
        {classes.map((klass) => (
          <li key={klass.id}>
            <Card interactive className="overflow-hidden">
              <Link href={`/teacher/classes/${klass.id}`} className="flex items-center gap-3 p-4">
                <span
                  aria-hidden="true"
                  className="h-12 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: klass.color ?? "var(--accent)" }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-fg">{klass.name}</p>
                  <p className="truncate text-xs text-fg-muted">
                    {klass._count.enrollments} student
                    {klass._count.enrollments === 1 ? "" : "s"}
                    {klass.subject ? ` · ${klass.subject}` : ""}
                    {klass.room ? ` · Room ${klass.room}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-fg-subtle">
                    {klass._count.assignments} piece
                    {klass._count.assignments === 1 ? "" : "s"} of work set
                  </p>
                </div>

                <Badge tone={done.has(klass.id) ? "ok" : "warn"} size="sm">
                  {done.has(klass.id) ? "Register done" : "Register to do"}
                </Badge>
                <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
