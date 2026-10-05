import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { NewCompetitionForm } from "./form";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("meta.postCompetition") };
}

export default async function NewCompetitionPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const school = await db.school.findUniqueOrThrow({
    where: { id: ctx.schoolId },
    select: { name: true },
  });

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <PageHeader title={t("competitions.postACompetition")} description={t("competitions.postIntro")} back={{ href: "/competitions", label: t("competitions.title") }} />


      <NewCompetitionForm schoolName={school.name} />
    </div>
  );
}
