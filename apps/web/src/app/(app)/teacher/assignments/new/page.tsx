import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole, teacherClassIds } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { AssignmentForm } from "./form";
import { EmptyState } from "@/components/ui/states";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.newAssignment") };
}

export default async function NewAssignmentPage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string }>;
}) {
  const t = await getT();
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
    select: { id: true, name: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
    orderBy: { name: "asc" },
  });

  const back = { href: "/teacher/assignments", label: t("teacher.allAssignments") };
  if (classes.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-6">
        <PageHeader title={t("teacher.setSomeWork")} back={back} />
        <EmptyState
          title={t("teacher.noClassesYet")}
          description={t("teacher.assignmentsBelongAdmin")}
        />
      </div>
    );
  }

  const preselected = classes.some((c) => c.id === classId) ? classId : classes[0]!.id;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("teacher.setSomeWork")} description={t("teacher.publishExplainer")} back={back} />


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
