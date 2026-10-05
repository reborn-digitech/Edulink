import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { gradesInRange } from "@/lib/superuser";
import { ClassForm } from "./form";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.createClass") };
}

export default async function NewClassPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");

  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { gradeLow: true, gradeHigh: true },
  });
  const grades = gradesInRange(school.gradeLow, school.gradeHigh);
  // ⚠ THE JOINER IS A WORD TOO. This lands inside `classes.schoolTeaches`,
  // which is translated — so an English "to" here produced "यह स्कूल K to 6
  // पढ़ाता है", one English word in the middle of a Hindi sentence.
  const gradeRangeLabel =
    school.gradeLow && school.gradeHigh
      ? t("calendar.rangeTo", { from: school.gradeLow, to: school.gradeHigh })
      : null;

  const teachers = await db.membership.findMany({
    where: { schoolId: ctx.schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null },
    include: { user: { select: { name: true, preferredName: true, avatarKey: true } } },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title={t("classes.createClass")} description={t("classes.createSubtitle")} back={{ href: "/admin/classes", label: t("classes.allClasses") }} />


      <ClassForm
        className="mt-7"
        grades={grades}
        gradeRangeLabel={gradeRangeLabel}
        teachers={teachers.map((t) => ({
          membershipId: t.id,
          name: t.user.preferredName ?? t.user.name,
          avatarKey: t.user.avatarKey,
        }))}
      />
    </div>
  );
}
