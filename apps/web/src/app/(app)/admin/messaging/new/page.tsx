import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { getT } from "@/lib/i18n/server";
import { Card, CardBody } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ComposeForm } from "./compose-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.messagingNew") };
}

/** One notice to many families: the office's words inside the circular template, to an audience, by text and/or app. */
export default async function NewBroadcastPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const [school, classes, grades] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { name: true } }),
    db.class.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.membership.findMany({ where: { schoolId: ctx.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, gradeLevel: { not: null } }, select: { gradeLevel: true }, distinct: ["gradeLevel"] }),
  ]);
  const gradeLevels = grades.map((g) => g.gradeLevel!).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("messaging.composeTitle")} description={t("messaging.composeIntro", { school: school.name })} back={{ href: "/admin/messaging", label: t("messaging.title") }} />
      <Card>
        <CardBody className="pt-5">
          <ComposeForm school={school.name} classes={classes} grades={gradeLevels} />
        </CardBody>
      </Card>
    </div>
  );
}
