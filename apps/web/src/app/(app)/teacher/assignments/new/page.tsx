import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { requireRole } from "@/lib/tenancy";
import { classReach, offeredSubjects } from "@/lib/teaching-reach";
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

  // A teacher's form classes and the classes the timetable sends them to, each with the subjects the
  // work may name there (owner's item 1, 27 Oct 2026). The office: every living class.
  const reach = await classReach(ctx);
  const classIds = [...reach.keys()];

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
  const offered = await offeredSubjects(ctx.schoolId, reach, classes.map((c) => c.id));

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("teacher.setSomeWork")} description={t("teacher.publishExplainer")} back={back} />


      <AssignmentForm
        className="mt-7"
        classes={classes.map((c) => {
          const r = reach.get(c.id);
          return {
            id: c.id,
            name: c.name,
            studentCount: c._count.enrollments,
            // Said beside the name for a teacher; the office is nobody's form teacher.
            formTeacher: ctx.role === "TEACHER" ? (r?.formTeacher ?? true) : null,
            subjects: offered.get(c.id) ?? [],
            // A timetable-only teacher names one of theirs; a form teacher starts on their own lesson there, if any.
            defaultSubject: r && (!r.formTeacher || r.subjects.length > 0) ? (r.subjects[0] ?? "") : "",
          };
        })}
        preselected={preselected!}
      />
    </div>
  );
}
