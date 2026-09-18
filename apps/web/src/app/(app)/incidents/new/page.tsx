import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FirstAidKitIcon } from "@phosphor-icons/react/ssr";
import { AccessError, assertStudentAccess, requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import { IncidentForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("incidents.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * Recording an incident for one pupil, named in the URL. The door is the
 * same as the library's: a teacher for a pupil of a class they teach, the
 * office and the head for any pupil of the school. A pupil the viewer may
 * not see, or no pupil at all, is a 404 — the page never confirms who is
 * on the roll. The form itself is the client component beside this file.
 */
export default async function NewIncidentPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const t = await getT();
  const ctx = await requireRole("TEACHER", "ADMIN", "PRINCIPAL");
  const { student: studentMembershipId } = await searchParams;
  if (!studentMembershipId) notFound();

  let student;
  try {
    student = await assertStudentAccess(ctx, studentMembershipId);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const enrollment = await db.enrollment.findFirst({
    where: { studentMembershipId: student.id, status: "ACTIVE" },
    select: { class: { select: { name: true } } },
  });
  const name = student.user.preferredName ?? student.user.name;
  const backHref = ctx.role === "TEACHER" ? "/teacher/incidents" : "/admin/incidents";

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader
        title={t("incidents.recordFor", { name })}
        description={enrollment?.class.name ?? undefined}
        back={{ href: backHref, label: t("incidents.viewLog") }}
      />

      <Card>
        <CardHeader icon={<FirstAidKitIcon weight="duotone" className="size-5" />} title={t("incidents.record")} description={t("incidents.intro")} />
        <CardBody>
          <IncidentForm studentMembershipId={student.id} />
        </CardBody>
      </Card>
    </div>
  );
}
