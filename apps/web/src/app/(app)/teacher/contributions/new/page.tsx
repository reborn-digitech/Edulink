import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { translationConfigured } from "@/lib/translate";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ContributionForm } from "../contribution-form";
import { topicOptions } from "../topics";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("gigs.newQuestion"), robots: { index: false, follow: false } };
}

/** A new question for the bank, in three languages. */
export default async function NewContributionPage() {
  const ctx = await requireRole("TEACHER");
  const t = await getT();
  return (
    <div className="space-y-6">
      <PageHeader title={t("gigs.newQuestion")} description={t("gigs.intro")} back={{ href: "/teacher/contributions", label: t("gigs.title") }} />
      <ContributionForm topics={await topicOptions(ctx)} draftOn={translationConfigured()} />
    </div>
  );
}
