import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { AssignmentForm } from "./form";
import { EmptyState } from "@/components/ui/states";

export const metadata: Metadata = { title: "New assignment" };

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const ctx = await requireRole("TEACHER", "ADMIN");
  const { classId } = await searchParams;

  const classIds =
    ctx.role === "ADMIN"
      ? (
          await db.class.findMany({
            where: { schoolId: ctx.schoolId, archivedAt: null },
            select: { id: true },
          })
        ).map((c) => c.id)
      : await teacherClassIds(ctx.schoolId, ctx.membershipId);

  const classes = await db.class.findMany({
    where: { id: { in: classIds }, schoolId: ctx.schoolId },
    select: { id: true, name: true, _count: { select: { enrollments: true } } },
    orderBy: { name: "asc" },
  });

  if (classes.length === 0) {
    return (
      <EmptyState
        title="No classes yet"
        description="Assignments belong to a class. Ask an admin to add you to one."
      />
    );
  }

  const preselected = classes.some((c) => c.id === classId) ? classId : classes[0]!.id;

  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/teacher/assignments"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All assignments
      </Link>

      <h1 className="text-2xl font-bold tracking-tight text-fg">Set some work</h1>
      <p className="mt-1.5 text-sm text-fg-muted">
        Publishing tells every student in the class and their guardians. Save as a draft if
        you are not ready.
      </p>

      <AssignmentForm
        className="mt-7"
        classes={classes.map((c) => ({
          id: c.id,
          name: c.name,
          studentCount: c._count.enrollments,
        }))}
        preselected={preselected!}
      />
    </div>
  );
}
