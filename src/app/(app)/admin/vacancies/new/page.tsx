import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { listContactCandidates } from "@/lib/school-profile";
import { getT } from "@/lib/i18n/server";
import { NewVacancyForm } from "./form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("vacancies.newTitle") };
}

export default async function NewVacancyPage() {
  const t = await getT();
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const candidates = await listContactCandidates(ctx);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
          {t("vacancies.newTitle")}
        </h1>
        <p className="mt-1 max-w-prose text-sm text-fg-muted">{t("vacancies.newIntro")}</p>
      </div>
      <NewVacancyForm candidates={candidates} defaultContactId={ctx.membershipId} />
    </div>
  );
}
