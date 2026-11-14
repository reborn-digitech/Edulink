import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon, ChalkboardTeacherIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { classReach, inGradeOrder, workInReach } from "@/lib/teaching-reach";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { TAKEN_BY_A_PERSON } from "@/lib/attendance";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getT } from "@/lib/i18n/server";
import { CelebrationsLink } from "@/components/celebrations/celebrations-link";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.myClasses") };
}

export default async function TeacherClassesPage() {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN");

  // A teacher's form classes and the classes the timetable sends them to (owner's item 1, 27 Oct 2026).
  const reach = await classReach(ctx);
  const classIds = [...reach.keys()];

  if (classIds.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("teacher.myClasses")} />
        <EmptyState
          icon={<ChalkboardTeacherIcon weight="duotone" className="size-8" />}
          title={t("teacher.noClassesAssigned")}
          description={t("teacher.noClassesAssignedBody")}
          // With no class there is no roll to open; the notices are where the school reaches a teacher meanwhile.
          action={<Button asChild size="sm" variant="secondary"><Link href="/bulletin">{t("nav.bulletin")}</Link></Button>}
        />
      </div>
    );
  }


  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { timezone: true },
  });
  const dateKey = todayKey(school.timezone);

  const [classesByName, takenToday] = await Promise.all([
    db.class.findMany({
      where: { id: { in: classIds } },
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        subject: true,
        room: true,
        color: true,
        _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
      },
      orderBy: { name: "asc" },
    }),
    db.attendanceSession.findMany({
      // Taken by a person: a register a device started is still to take (TA-032).
      where: { schoolId: ctx.schoolId, dateKey, classId: { in: classIds }, ...TAKEN_BY_A_PERSON },
      select: { classId: true },
    }),
  ]);
  // By grade number, then name (qb-B, QB-05): "Grade 3" before "Grade 10".
  const classes = inGradeOrder(classesByName);
  // The work counted is the work this person may open: a form class's all, their own where the timetable sends them.
  const work = await db.assignment.groupBy({ by: ["classId"], where: { schoolId: ctx.schoolId, ...workInReach(ctx.membershipId, reach) }, _count: { _all: true } });
  const workBy = new Map(work.map((w) => [w.classId, w._count._all]));

  const done = new Set(takenToday.map((s) => s.classId));

  return (
    <div className="space-y-5">
      <PageHeader title={t("teacher.myClasses")} description={<>{classes.length} class{classes.length === 1 ? "" : "es"} ·{" "}
          {classes.reduce((sum, c) => sum + c._count.enrollments, 0)} students</>} />

      <CelebrationsLink session={ctx} />

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
                    {workBy.get(klass.id) ?? 0} piece
                    {(workBy.get(klass.id) ?? 0) === 1 ? "" : "s"} of work set
                    {ctx.role === "TEACHER" ? ` · ${reach.get(klass.id)?.formTeacher ? t("subjectWork.formTeacher") : (reach.get(klass.id)?.subjects ?? []).join(", ")}` : ""}
                  </p>
                </div>

                {/* The register is a form class's; a class the timetable alone sends this teacher to has none for them. */}
                {reach.get(klass.id)?.formTeacher ? (
                  <Badge tone={done.has(klass.id) ? "ok" : "warn"} size="sm">
                    {done.has(klass.id) ? t("teacher.registerDone") : t("teacher.registerToDo")}
                  </Badge>
                ) : null}
                <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
