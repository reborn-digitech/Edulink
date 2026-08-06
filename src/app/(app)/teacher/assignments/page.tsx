import type { Metadata } from "next";
import Link from "next/link";
import { CaretRightIcon, ClipboardTextIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { relativeTime } from "@/lib/dates";
import { formatMilli } from "@/lib/validation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.assignments") };
}

export default async function AssignmentsPage() {
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
        icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
        title={t("teacher.noClassesYet")}
        description={t("teacher.assignmentsBelong")}
      />
    );
  }

  const assignments = await db.assignment.findMany({
    where: { schoolId: ctx.schoolId, classId: { in: classIds } },
    include: {
      class: { select: { name: true, color: true, _count: { select: { enrollments: true } } } },
      _count: { select: { submissions: true, grades: true } },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{t("teacher.assignments")}</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {assignments.length === 0
              ? t("teacher.nothingSetYetShort")
              : assignments.length === 1
                ? t("teacher.piecesOfWorkOne")
                : t("teacher.piecesOfWorkMany", { count: assignments.length })}
          </p>
        </div>
        <Button asChild icon={<PlusIcon weight="bold" />}>
          <Link href="/teacher/assignments/new">{t("teacher.newAssignment")}</Link>
        </Button>
      </div>

      {assignments.length === 0 ? (
        <EmptyState
          icon={<ClipboardTextIcon weight="duotone" className="size-8" />}
          title={t("teacher.noAssignmentsYet")}
          description={t("teacher.setWorkBlurb")}
          action={
            <Button asChild>
              <Link href="/teacher/assignments/new">{t("teacher.setSomeWork")}</Link>
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {assignments.map((assignment) => {
            const roster = assignment.class._count.enrollments;
            const graded = assignment._count.grades;
            const allGraded = roster > 0 && graded >= roster;

            return (
              <li key={assignment.id}>
                <Card interactive className="overflow-hidden">
                  <Link
                    href={`/teacher/assignments/${assignment.id}`}
                    className="flex items-center gap-3 p-4"
                  >
                    <span
                      aria-hidden="true"
                      className="h-11 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: assignment.class.color ?? "var(--accent)" }}
                    />

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-fg">{assignment.title}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {assignment.class.name}
                        {assignment.category ? ` · ${assignment.category}` : ""}
                        {assignment.pointsMilli
                          ? ` · ${formatMilli(assignment.pointsMilli)} points`
                          : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-fg-subtle">
                        {assignment.dueAt
                          ? t("teacher.dueWhen", { when: relativeTime(assignment.dueAt) })
                          : t("teacher.noDueDate")}
                        {" · "}
                        {graded} of {roster} marked
                      </p>
                    </div>

                    {!assignment.publishedAt ? (
                      <Badge tone="warn" size="sm">
                        {t("teacher.draft")}
                      </Badge>
                    ) : allGraded ? (
                      <Badge tone="ok" size="sm">
                        {t("teacher.marked")}
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm">
                        {roster - graded} to mark
                      </Badge>
                    )}

                    <CaretRightIcon className="size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
