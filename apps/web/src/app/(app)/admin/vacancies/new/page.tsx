import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { listContactCandidates } from "@/lib/school-profile";
import { getT } from "@/lib/i18n/server";
import { NewVacancyForm } from "./form";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.newTitle") };
}

/** The admin's page: the head reads the desk, and does not post to it. */
export default async function NewVacancyPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN");
  const candidates = await listContactCandidates(ctx);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        back={{ href: "/admin/vacancies", label: t("vacancies.ourDeskTitle") }}
        title={t("vacancies.newTitle")}
        description={t("vacancies.newIntro")}
      />
      <NewVacancyForm candidates={candidates} defaultContactId={ctx.membershipId} />
    </div>
  );
}
